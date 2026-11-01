const express = require('express');
const { Buffer } = require('node:buffer');
const { createMusicApiRouter } = require('../server/routes/musicapi');

const TEST_ENV = {
  FIREBASE_API_KEY: 'firebase-test-key',
  MUSICAPI_ACCOUNT_SLUG: 'spotibai-test',
  MUSICAPI_CLIENT_ID: 'musicapi-client-id',
  MUSICAPI_CLIENT_SECRET: 'musicapi-client-secret',
  MUSICAPI_SESSION_SECRET: 'a-test-session-signing-secret-that-is-long-enough',
};
const AUTH_UUID = 'e6f4a365-63ae-4c1b-9a65-154eb80c9f14';
const INTEGRATION_USER_UUID = 'bd713ba8-05cc-42ca-9c60-21fbe9c41e3d';

const makeResponse = (body, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

const startServer = async (fetchImpl, env = TEST_ENV) => {
  const app = express();
  app.use(
    '/api/musicapi',
    express.json({ limit: '20kb' }),
    createMusicApiRouter({ env, fetchImpl })
  );
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  return server;
};

const request = async (server, path, { method = 'GET', token = 'firebase-token', session, body } = {}) => {
  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}${path}`, {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      ...(session ? { 'x-musicapi-session': session } : {}),
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: response.status, body: await response.json() };
};

const closeServer = async (server) =>
  new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve()))
  );

describe('MusicAPI routes', () => {
  let server;

  afterEach(async () => {
    if (server) {
      await closeServer(server);
      server = null;
    }
  });

  it('verifies a sign-in callback and returns a user-bound session', async () => {
    const fetchImpl = jest.fn(async (url) => {
      if (String(url).includes('identitytoolkit.googleapis.com')) {
        return makeResponse({ users: [{ localId: 'firebase-user' }] });
      }
      return makeResponse({
        authModel: { uuid: AUTH_UUID, status: 'success' },
        integrationUser: { uuid: INTEGRATION_USER_UUID },
      });
    });
    server = await startServer(fetchImpl);
    const data64 = Buffer.from(
      JSON.stringify({
        authModel: { uuid: AUTH_UUID, status: 'success' },
        integrationUserUUID: INTEGRATION_USER_UUID,
        integration: { type: 'spotify' },
      })
    ).toString('base64');

    const response = await request(server, '/api/musicapi/connect', {
      method: 'POST',
      body: { data64 },
    });

    expect(response.status).toBe(200);
    expect(response.body.integrationType).toBe('spotify');
    expect(typeof response.body.sessionToken).toBe('string');
    expect(fetchImpl).toHaveBeenCalledWith(
      `https://api.musicapi.com/public/integrations/auth/${AUTH_UUID}`,
      expect.objectContaining({
        headers: {
          authorization: `Basic ${Buffer.from(
            `${TEST_ENV.MUSICAPI_CLIENT_ID}:${TEST_ENV.MUSICAPI_CLIENT_SECRET}`
          ).toString('base64')}`,
        },
      })
    );
  });

  it('loads the connected playlists using the backend-only MusicAPI credentials', async () => {
    let integrationUser;
    const fetchImpl = jest.fn(async (url) => {
      if (String(url).includes('identitytoolkit.googleapis.com')) {
        return makeResponse({ users: [{ localId: 'firebase-user' }] });
      }
      if (String(url).includes('/public/integrations/auth/')) {
        return makeResponse({
          authModel: { uuid: AUTH_UUID, status: 'success' },
          integrationUser: { uuid: INTEGRATION_USER_UUID },
        });
      }
      integrationUser = String(url);
      return makeResponse({ results: [{ id: 'list-1', name: 'Road Trip' }], nextParam: null });
    });
    server = await startServer(fetchImpl);
    const data64 = Buffer.from(
      JSON.stringify({
        authModel: { uuid: AUTH_UUID, status: 'success' },
        integrationUserUUID: INTEGRATION_USER_UUID,
        integration: { type: 'spotify' },
      })
    ).toString('base64');
    const connection = await request(server, '/api/musicapi/connect', {
      method: 'POST',
      body: { data64 },
    });

    const response = await request(server, '/api/musicapi/playlists', {
      session: connection.body.sessionToken,
    });

    expect(response.status).toBe(200);
    expect(response.body.results).toEqual([{ id: 'list-1', name: 'Road Trip' }]);
    expect(integrationUser).toBe(
      `https://api.musicapi.com/api/${INTEGRATION_USER_UUID}/playlists?limitParam=50`
    );
  });

  it('loads playlist tracks and forwards the opaque pagination cursor', async () => {
    let itemsRequestUrl;
    const fetchImpl = jest.fn(async (url) => {
      if (String(url).includes('identitytoolkit.googleapis.com')) {
        return makeResponse({ users: [{ localId: 'firebase-user' }] });
      }
      if (String(url).includes('/public/integrations/auth/')) {
        return makeResponse({
          authModel: { uuid: AUTH_UUID, status: 'success' },
          integrationUser: { uuid: INTEGRATION_USER_UUID },
        });
      }
      itemsRequestUrl = new URL(String(url));
      return makeResponse({ results: [{ id: 'track-1', name: 'Numb' }], nextParam: null });
    });
    server = await startServer(fetchImpl);
    const data64 = Buffer.from(
      JSON.stringify({
        authModel: { uuid: AUTH_UUID, status: 'success' },
        integrationUserUUID: INTEGRATION_USER_UUID,
        integration: { type: 'spotify' },
      })
    ).toString('base64');
    const connection = await request(server, '/api/musicapi/connect', {
      method: 'POST',
      body: { data64 },
    });

    const response = await request(
      server,
      '/api/musicapi/playlists/list-1/items?nextParam=opaque-cursor',
      { session: connection.body.sessionToken }
    );

    expect(response.status).toBe(200);
    expect(response.body.results).toEqual([{ id: 'track-1', name: 'Numb' }]);
    expect(itemsRequestUrl.pathname).toBe(
      `/api/${INTEGRATION_USER_UUID}/playlists/list-1/items`
    );
    expect(itemsRequestUrl.searchParams.get('nextParam')).toBe('opaque-cursor');
  });

  it('does not allow a signed-in user to reuse another account connection', async () => {
    const fetchImpl = jest.fn(async (url, options) => {
      if (String(url).includes('identitytoolkit.googleapis.com')) {
        const token = JSON.parse(options.body).idToken;
        return makeResponse({
          users: [{ localId: token === 'other-token' ? 'other-user' : 'firebase-user' }],
        });
      }
      return makeResponse({
        authModel: { uuid: AUTH_UUID, status: 'success' },
        integrationUser: { uuid: INTEGRATION_USER_UUID },
      });
    });
    server = await startServer(fetchImpl);
    const data64 = Buffer.from(
      JSON.stringify({
        authModel: { uuid: AUTH_UUID, status: 'success' },
        integrationUserUUID: INTEGRATION_USER_UUID,
        integration: { type: 'spotify' },
      })
    ).toString('base64');
    const connection = await request(server, '/api/musicapi/connect', {
      method: 'POST',
      body: { data64 },
    });

    const response = await request(server, '/api/musicapi/playlists', {
      token: 'other-token',
      session: connection.body.sessionToken,
    });

    expect(response.status).toBe(401);
    expect(response.body.error).toMatch(/another account/);
  });

  it('rejects malformed callback data without querying MusicAPI', async () => {
    const fetchImpl = jest.fn(async () =>
      makeResponse({ users: [{ localId: 'firebase-user' }] })
    );
    server = await startServer(fetchImpl);

    const response = await request(server, '/api/musicapi/connect', {
      method: 'POST',
      body: {
        data64: 'not-valid-base64!',
      },
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/invalid sign-in result/);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('reports when MusicAPI backend credentials are missing', async () => {
    server = await startServer(jest.fn(), { FIREBASE_API_KEY: 'firebase-test-key' });
    const response = await request(server, '/api/musicapi/config');

    expect(response.status).toBe(200);
    expect(response.body.configured).toBe(false);
    expect(response.body.returnUrl).toBe('spotibai://musicapi/callback');
  });

  it('requires a strong session signing secret before enabling MusicAPI', async () => {
    server = await startServer(jest.fn(), {
      ...TEST_ENV,
      MUSICAPI_SESSION_SECRET: 'too-short',
    });
    const response = await request(server, '/api/musicapi/config');

    expect(response.status).toBe(200);
    expect(response.body.configured).toBe(false);
  });
});
