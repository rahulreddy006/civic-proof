import { isApiKeyConfigured, getModelName, testModelConnectivity } from '../services/gemma.service.js';

/**
 * GET /api/health
 * Confirms that the Express backend is running.
 * Reports configuration status without claiming Gemini API connectivity.
 */
export function getHealth(req, res) {
  const configured = isApiKeyConfigured();
  const model = getModelName();

  return res.status(200).json({
    status: 'ok',
    service: 'CivicProof Backend',
    serverTime: new Date().toISOString(),
    configured,
    hasApiKey: configured,
    model,
    info: {
      framework: 'Express + @google/genai',
      keyConfigured: configured ? 'Configured (Masked)' : 'Missing (.env GEMINI_API_KEY required)'
    }
  });
}

/**
 * POST /api/health/model-check or GET /api/health/model-check
 * Actually contacts the configured Gemini API with Gemma to test real connectivity.
 */
export async function checkModelConnectivity(req, res) {
  try {
    const result = await testModelConnectivity();
    return res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (err) {
    const status = err.status || 502;
    return res.status(status).json({
      status: 'error',
      error: {
        code: err.code || 'CONNECTIVITY_CHECK_FAILED',
        message: err.message || 'Unable to connect to Gemma model via Gemini API.'
      },
      latencyMs: err.latencyMs || null
    });
  }
}
