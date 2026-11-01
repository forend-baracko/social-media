const crypto = require('node:crypto');
const { Buffer } = require('node:buffer');
const express = require('express');

const MUSICAPI_BASE_URL = 'https://api.musicapi.com';
const RETURN_URL = 'spotibai://musicapi/callback';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SESSION_LIFETIME_SECONDS = 30 * 24 * 60 * 60;

const createMusicApiRouter = ({
  env = process.env,
  fetchImpl = global.fetch,
  now = Date.now,
} = {}) => {
  const router = express.Router();

  const isConfigured = () =>
    Boolean(
      env.MUSICAPI_ACCOUNT_SLUG &&
        env.MUSICAPI_CLIENT_ID &&
        env.MUSICAPI_CLIENT_SECRET &&
      env.MUSICAPI_SESSION_SECRET?.length >= 32 &&
        env.FIREBASE_API_KEY
    );

  const sendError = (res, status, error) => res.status(status).json({ error });

  const getFirebaseUserId = async (req, res) => {
    const token = req.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!token) {
      sendError(res, 401, 'Sign in to your Spotibai account to use MusicAPI.');
      return null;
    }

    let response;
    try {
      response = await fetchImpl(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(env.FIREBASE_API_KEY)}`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ idToken: token }),
        }
      );
    } catch (error) {
      console.warn('Firebase token verification request failed:', error);
      sendError(res, 502, 'Could not verify your Spotibai sign-in. Please try again.');
      return null;
    }

    if (!response.ok) {
      sendError(res, 401, 'Your Spotibai sign-in has expired. Please sign in again.');
      return null;
    }

    let result;
    try {
      result = await response.json();
    } catch {
      sendError(res, 502, 'Firebase returned an invalid sign-in response.');
      return null;
    }

    const uid = result?.users?.[0]?.localId;
    if (typeof uid !== 'string' || !uid) {
      sendError(res, 401, 'Your Spotibai sign-in could not be verified.');
      return null;
    }
    return uid;
  };

  const decodeCallback = (data64) => {
    if (
      typeof data64 !== 'string' ||
      data64.length === 0 ||
      data64.length > 16384 ||
      !/^[A-Za-z0-9+/_=-]+$/.test(data64)
    ) {
      return null;
    }

    try {
      const decoded = Buffer.from(data64.replace(/-/g, '+').replace(/_/g, '/'), 'base64')
        .toString('utf8');
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  };

  const signConnection = (uid, integrationUserUUID, integrationType) => {
    const payload = Buffer.from(
      JSON.stringify({
        uid,
        integrationUserUUID,
        integrationType,
        exp: Math.floor(now() / 1000) + SESSION_LIFETIME_SECONDS,
      })
    ).toString('base64url');
    const signature = crypto
      .createHmac('sha256', env.MUSICAPI_SESSION_SECRET)
      .update(payload)
      .digest('base64url');
    return `${payload}.${signature}`;
  };

  const getConnection = (req, res, uid) => {
    const token = req.get('x-musicapi-session');
    if (typeof token !== 'string') {
      sendError(res, 401, 'Connect a music service before opening its library.');
      return null;
    }

    const [payload, signature, extra] = token.split('.');
    if (!payload || !signature || extra) {
      sendError(res, 401, 'Your MusicAPI connection is invalid. Please reconnect it.');
      return null;
    }

    const expected = crypto
      .createHmac('sha256', env.MUSICAPI_SESSION_SECRET)
      .update(payload)
      .digest();
    let supplied;
    try {
      supplied = Buffer.from(signature, 'base64url');
    } catch {
      sendError(res, 401, 'Your MusicAPI connection is invalid. Please reconnect it.');
      return null;
    }
    if (
      supplied.length !== expected.length ||
      !crypto.timingSafeEqual(supplied, expected)
    ) {
      sendError(res, 401, 'Your MusicAPI connection is invalid. Please reconnect it.');
      return null;
    }

    let connection;
    try {
      connection = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    } catch {
      sendError(res, 401, 'Your MusicAPI connection is invalid. Please reconnect it.');
      return null;
    }

    if (
      connection.uid !== uid ||
      !UUID_PATTERN.test(connection.integrationUserUUID || '') ||
      !Number.isInteger(connection.exp) ||
      connection.exp <= Math.floor(now() / 1000)
    ) {
      sendError(res, 401, 'Your MusicAPI connection expired or belongs to another account.');
      return null;
    }
    return connection;
  };

  const getMusicApiAuthorization = () =>
    `Basic ${Buffer.from(
      `${env.MUSICAPI_CLIENT_ID}:${env.MUSICAPI_CLIENT_SECRET}`
    ).toString('base64')}`;

  const requestMusicApi = async (url, res) => {
    let response;
    try {
      response = await fetchImpl(url, {
        headers: { authorization: getMusicApiAuthorization() },
      });
    } catch (error) {
      console.warn('MusicAPI request failed:', error);
      sendError(res, 502, 'MusicAPI could not be reached. Please try again.');
      return null;
    }

    let body;
    try {
      body = await response.json();
    } catch {
      sendError(res, 502, 'MusicAPI returned an invalid response.');
      return null;
    }

    if (!response.ok) {
      const error =
        response.status === 412
          ? 'Your connected music account needs to be reconnected.'
          : typeof body?.error === 'string'
            ? body.error
            : 'MusicAPI could not load this library.';
      sendError(res, response.status, error);
      return null;
    }
    return body;
  };

  router.get('/config', (_req, res) => {
    res.json({
      configured: isConfigured(),
      slug: env.MUSICAPI_ACCOUNT_SLUG || null,
      returnUrl: RETURN_URL,
    });
  });

  router.post('/connect', async (req, res) => {
    const uid = await getFirebaseUserId(req, res);
    if (!uid) return;
    if (!isConfigured()) {
      return sendError(res, 503, 'MusicAPI is not configured on the backend.');
    }

    const callback = decodeCallback(req.body?.data64);
    const authModel = callback?.authModel;
    const integrationUserUUID = callback?.integrationUserUUID;
    if (!authModel || !UUID_PATTERN.test(authModel.uuid || '')) {
      return sendError(res, 400, 'MusicAPI returned an invalid sign-in result.');
    }
    if (authModel.status !== 'success') {
      return sendError(
        res,
        400,
        authModel.error || 'Music service sign-in was not completed.'
      );
    }
    if (!UUID_PATTERN.test(integrationUserUUID || '')) {
      return sendError(res, 400, 'MusicAPI returned an invalid connected account.');
    }

    const verified = await requestMusicApi(
      `${MUSICAPI_BASE_URL}/public/integrations/auth/${encodeURIComponent(authModel.uuid)}`,
      res
    );
    if (!verified) return;
    if (
      verified.authModel?.uuid !== authModel.uuid ||
      verified.authModel?.status !== 'success' ||
      verified.integrationUser?.uuid !== integrationUserUUID
    ) {
      return sendError(res, 400, 'MusicAPI could not verify this connection. Please retry.');
    }

    return res.json({
      sessionToken: signConnection(
        uid,
        integrationUserUUID,
        callback.integration?.type || 'unknown'
      ),
      integrationType: callback.integration?.type || 'unknown',
    });
  });

  const withConnection = (handler) => async (req, res) => {
    if (!isConfigured()) {
      return sendError(res, 503, 'MusicAPI is not configured on the backend.');
    }
    const uid = await getFirebaseUserId(req, res);
    if (!uid) return;
    const connection = getConnection(req, res, uid);
    if (!connection) return;
    return handler(req, res, connection);
  };

  router.get(
    '/playlists',
    withConnection(async (req, res, connection) => {
      const url = new URL(
        `${MUSICAPI_BASE_URL}/api/${connection.integrationUserUUID}/playlists`
      );
      url.searchParams.set('limitParam', '50');
      if (typeof req.query.nextParam === 'string') {
        url.searchParams.set('nextParam', req.query.nextParam);
      }
      const body = await requestMusicApi(url.toString(), res);
      if (body) res.json(body);
    })
  );

  router.get(
    '/playlists/:playlistId/items',
    withConnection(async (req, res, connection) => {
      if (
        typeof req.params.playlistId !== 'string' ||
        req.params.playlistId.length === 0 ||
        req.params.playlistId.length > 512
      ) {
        return sendError(res, 400, 'Invalid playlist ID.');
      }
      const url = new URL(
        `${MUSICAPI_BASE_URL}/api/${connection.integrationUserUUID}/playlists/${encodeURIComponent(req.params.playlistId)}/items`
      );
      url.searchParams.set('limitParam', '50');
      if (typeof req.query.nextParam === 'string') {
        url.searchParams.set('nextParam', req.query.nextParam);
      }
      const body = await requestMusicApi(url.toString(), res);
      if (body) res.json(body);
    })
  );

  return router;
};

module.exports = { createMusicApiRouter };
