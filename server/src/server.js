import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import app from './app.js';
import { getModelName, isApiKeyConfigured } from './services/gemma.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from workspace root first, then server root if present
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const PORT = process.env.PORT || 5000;
const modelName = getModelName();
const keyConfigured = isApiKeyConfigured();

const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`CivicProof Backend Server listening on port ${PORT}`);
  console.log(`Base URL: http://localhost:${PORT}`);
  console.log(`Configured Model: ${modelName}`);
  console.log(`Gemini API Key: ${keyConfigured ? 'Present (Protected)' : 'MISSING'}`);
  console.log(`Health endpoint: http://localhost:${PORT}/api/health`);
  console.log(`Smoke test endpoint: http://localhost:${PORT}/api/gemma-smoke-test`);
  console.log(`====================================================`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('[CivicProof Server] SIGTERM received, closing server...');
  server.close(() => {
    console.log('[CivicProof Server] Process terminated.');
  });
});

export default server;
