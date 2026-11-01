const express = require('express');
const { createAudiusAudioRouter } = require('./routes/audio');
const { createMusicApiRouter } = require('./routes/musicapi');
const { createGeminiRouter } = require('./routes/gemini');

const app = express();

if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

const port = Number(process.env.PORT) || 3001;

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});
app.use('/api/audio', createAudiusAudioRouter());
app.use('/api/musicapi', express.json({ limit: '20kb' }), createMusicApiRouter());
app.use('/api/gemini', express.json({ limit: '64kb' }), createGeminiRouter());

app.listen(port, '0.0.0.0', () => {
  console.log(`Audio proxy listening on port ${port}`);
});
