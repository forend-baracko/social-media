const express = require('express');
const { Readable } = require('node:stream');
const { pipeline } = require('node:stream/promises');

const AUDIUS_STREAM_BASE_URL = 'https://discoveryprovider.audius.co/v1/tracks';
const APP_NAME = 'Spotibai';
const TRACK_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
const FORWARDED_RESPONSE_HEADERS = [
  'accept-ranges',
  'content-length',
  'content-range',
];

const createAudiusAudioRouter = ({
  fetchImpl = global.fetch,
  timeoutMs = 15000,
} = {}) => {
  const router = express.Router();

  router.get('/tracks/:trackId', async (req, res) => {
    const { trackId } = req.params;
    if (!TRACK_ID_PATTERN.test(trackId)) {
      return res.status(400).json({ error: 'Invalid Audius track ID' });
    }

    const controller = new AbortController();
    let clientDisconnected = false;
    let timedOut = false;
    const timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);
    const abortWhenClientDisconnects = () => {
      if (!res.writableEnded) {
        clientDisconnected = true;
        controller.abort();
      }
    };
    res.once('close', abortWhenClientDisconnects);

    try {
      const upstreamUrl =
        `${AUDIUS_STREAM_BASE_URL}/${encodeURIComponent(trackId)}/stream` +
        `?app_name=${encodeURIComponent(APP_NAME)}`;
      const upstreamResponse = await fetchImpl(upstreamUrl, {
        headers: req.headers.range ? { range: req.headers.range } : {},
        signal: controller.signal,
      });

      if (!upstreamResponse.ok) {
        await upstreamResponse.body?.cancel().catch(() => {});
        return res.status(upstreamResponse.status).json({
          error: 'Audius could not provide this track stream',
        });
      }

      const contentType = upstreamResponse.headers.get('content-type') || '';
      if (!contentType.toLowerCase().startsWith('audio/')) {
        await upstreamResponse.body?.cancel().catch(() => {});
        return res.status(502).json({ error: 'Audius returned a non-audio response' });
      }

      res.status(upstreamResponse.status);
      res.setHeader('content-type', contentType);
      FORWARDED_RESPONSE_HEADERS.forEach((header) => {
        const value = upstreamResponse.headers.get(header);
        if (value) res.setHeader(header, value);
      });

      if (!upstreamResponse.body) {
        return res.status(502).json({ error: 'Audius returned an empty audio stream' });
      }

      await pipeline(Readable.fromWeb(upstreamResponse.body), res);
    } catch (error) {
      if (clientDisconnected || res.destroyed) return;
      if (timedOut) {
        if (!res.headersSent) {
          return res.status(504).json({ error: 'Audius audio request timed out' });
        }
        return res.destroy(error);
      }
      console.warn('Audius audio proxy request failed:', error);
      if (!res.headersSent) {
        res.status(502).json({ error: 'Audio stream temporarily unavailable' });
      } else {
        res.destroy(error);
      }
    } finally {
      clearTimeout(timeoutId);
      res.removeListener('close', abortWhenClientDisconnects);
    }
  });

  return router;
};

module.exports = { createAudiusAudioRouter };
