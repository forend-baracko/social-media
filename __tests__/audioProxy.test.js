const express = require('express');
const { Buffer } = require('node:buffer');
const http = require('node:http');
const { Readable } = require('node:stream');
const { createAudiusAudioRouter } = require('../server/routes/audio');

const startTestServer = async (fetchImpl) => {
  const app = express();
  app.use('/api/audio', createAudiusAudioRouter({ fetchImpl }));
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  return server;
};

const request = (server, path, headers = {}) =>
  new Promise((resolve, reject) => {
    const { port } = server.address();
    const req = http.get({ host: '127.0.0.1', port, path, headers }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () =>
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: Buffer.concat(chunks).toString(),
        })
      );
    });
    req.on('error', reject);
  });

describe('Audius audio proxy route', () => {
  let server;

  afterEach(async () => {
    if (server) {
      await new Promise((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve()))
      );
      server = null;
    }
    jest.restoreAllMocks();
  });

  it('proxies an authorized Audius audio stream and preserves range headers', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      status: 206,
      headers: new Headers({
        'content-type': 'audio/mpeg',
        'content-length': '10',
        'content-range': 'bytes 0-9/100',
        'accept-ranges': 'bytes',
      }),
      body: Readable.toWeb(Readable.from(['mock-audio'])),
    });
    server = await startTestServer(fetchImpl);

    const response = await request(
      server,
      '/api/audio/tracks/W08NKdZ',
      { range: 'bytes=0-9' }
    );

    expect(response.status).toBe(206);
    expect(response.headers['content-type']).toBe('audio/mpeg');
    expect(response.headers['content-range']).toBe('bytes 0-9/100');
    expect(response.body).toBe('mock-audio');
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://discoveryprovider.audius.co/v1/tracks/W08NKdZ/stream?app_name=Spotibai',
      expect.objectContaining({
        headers: { range: 'bytes=0-9' },
        signal: expect.objectContaining({ aborted: false }),
      })
    );
  });

  it('rejects invalid track IDs without contacting Audius', async () => {
    const fetchImpl = jest.fn();
    server = await startTestServer(fetchImpl);

    const response = await request(server, '/api/audio/tracks/invalid.id');

    expect(response.status).toBe(400);
    expect(JSON.parse(response.body)).toEqual({ error: 'Invalid Audius track ID' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('returns a gateway error when the upstream network request fails', async () => {
    const warning = jest.spyOn(console, 'warn').mockImplementation(() => {});
    server = await startTestServer(jest.fn().mockRejectedValue(new Error('offline')));

    const response = await request(server, '/api/audio/tracks/track-1');

    expect(response.status).toBe(502);
    expect(JSON.parse(response.body)).toEqual({
      error: 'Audio stream temporarily unavailable',
    });
    expect(warning).toHaveBeenCalledWith(
      'Audius audio proxy request failed:',
      expect.any(Error)
    );
  });

  it('times out a stalled upstream request', async () => {
    const fetchImpl = jest.fn(
      (_url, { signal }) =>
        new Promise((resolve, reject) => {
          signal.addEventListener(
            'abort',
            () => reject(Object.assign(new Error('Aborted'), { name: 'AbortError' })),
            { once: true }
          );
        })
    );
    const app = express();
    app.use('/api/audio', createAudiusAudioRouter({ fetchImpl, timeoutMs: 10 }));
    server = app.listen(0, '127.0.0.1');
    await new Promise((resolve) => server.once('listening', resolve));

    const response = await request(server, '/api/audio/tracks/track-1');

    expect(response.status).toBe(504);
    expect(JSON.parse(response.body)).toEqual({
      error: 'Audius audio request timed out',
    });
  });

  it('rejects upstream responses that are not audio', async () => {
    server = await startTestServer(
      jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        body: Readable.toWeb(Readable.from(['{}'])),
      })
    );

    const response = await request(server, '/api/audio/tracks/track-1');

    expect(response.status).toBe(502);
    expect(JSON.parse(response.body)).toEqual({
      error: 'Audius returned a non-audio response',
    });
  });
});
