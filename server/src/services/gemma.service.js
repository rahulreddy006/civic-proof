import { GoogleGenAI } from '@google/genai';

const DEFAULT_MODEL = 'gemma-4-26b-a4b-it';
const DEFAULT_PROMPT = 'Describe this test image in detail and identify visible objects and conditions without guessing or assuming facts.';

/**
 * Retrieves the configured Gemma model name.
 * Defaults to gemma-4-26b-a4b-it if absent.
 */
export function getModelName() {
  return (process.env.GEMMA_MODEL || '').trim() || DEFAULT_MODEL;
}

/**
 * Retrieves the configured Gemini API key without printing or exposing it.
 * Accepts GEMINI_API_KEY as primary, with GEMMA_API_KEY as backwards-compatible fallback.
 */
export function getApiKey() {
  return (process.env.GEMINI_API_KEY || process.env.GEMMA_API_KEY || '').trim();
}

/**
 * Checks if the API key is configured.
 */
export function isApiKeyConfigured() {
  const key = getApiKey();
  return Boolean(key && key.length > 0);
}

/**
 * Initializes and returns an instance of GoogleGenAI SDK client.
 */
export function getGenAIClient() {
  const apiKey = getApiKey();
  if (!apiKey) {
    const error = new Error('GEMINI_API_KEY is not configured on the server. Please check your environment variables.');
    error.code = 'CONFIG_MISSING_API_KEY';
    error.status = 500;
    throw error;
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Executes a single-image smoke test using the configured Gemma 4 model.
 *
 * @param {Object} params
 * @param {Buffer} params.buffer - Raw image buffer
 * @param {string} params.mimeType - Validated MIME type (e.g., 'image/jpeg', 'image/png', 'image/webp')
 * @param {string} [params.prompt] - Optional prompt for the model
 * @returns {Promise<Object>} Model inference result metadata and generated text
 */
export async function runImageSmokeTest({ buffer, mimeType, prompt }) {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    const err = new Error('A valid image buffer is required.');
    err.code = 'INVALID_IMAGE_BUFFER';
    err.status = 400;
    throw err;
  }

  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedMimeTypes.includes(mimeType)) {
    const err = new Error(`Unsupported image MIME type: ${mimeType}. Allowed types: ${allowedMimeTypes.join(', ')}`);
    err.code = 'UNSUPPORTED_MIME_TYPE';
    err.status = 400;
    throw err;
  }

  const model = getModelName();
  const effectivePrompt = (typeof prompt === 'string' && prompt.trim().length > 0)
    ? prompt.trim()
    : DEFAULT_PROMPT;

  const ai = getGenAIClient();
  const base64Data = buffer.toString('base64');
  const startTime = Date.now();

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          inlineData: {
            mimeType,
            data: base64Data
          }
        },
        {
          text: effectivePrompt
        }
      ]
    });

    const latencyMs = Date.now() - startTime;
    const responseText = (response?.text || '').trim();

    if (!responseText) {
      const err = new Error('The Gemma model responded with an empty text output.');
      err.code = 'EMPTY_MODEL_RESPONSE';
      err.status = 502;
      throw err;
    }

    return {
      model,
      prompt: effectivePrompt,
      responseText,
      latencyMs,
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    const latencyMs = Date.now() - startTime;
    // Map SDK / Google AI Studio API errors cleanly
    const mappedError = mapGenAiError(err, model);
    mappedError.latencyMs = latencyMs;
    throw mappedError;
  }
}

/**
 * Performs a lightweight text-only connectivity test to confirm model access.
 */
export async function testModelConnectivity() {
  const model = getModelName();
  const ai = getGenAIClient();
  const startTime = Date.now();

  try {
    const res = await ai.models.generateContent({
      model,
      contents: 'Respond with "CivicProof Gemma connection verified." in 10 words or less.'
    });

    return {
      connected: true,
      model,
      response: (res.text || '').trim(),
      latencyMs: Date.now() - startTime,
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    const mapped = mapGenAiError(err, model);
    mapped.connected = false;
    mapped.latencyMs = Date.now() - startTime;
    throw mapped;
  }
}

/**
 * Helper to map API errors into clean HTTP error codes and safe messages.
 */
function mapGenAiError(err, model) {
  const message = err.message || '';
  const status = err.status || 500;

  let code = 'GEMMA_API_ERROR';
  let clientMessage = 'An unexpected error occurred while communicating with the Gemma service.';
  let httpStatus = 502;

  if (status === 404 || message.includes('not found') || message.includes('404')) {
    code = 'MODEL_NOT_FOUND';
    clientMessage = `Model '${model}' was not found or is not accessible with the provided API key.`;
    httpStatus = 404;
  } else if (status === 403 || message.includes('API_KEY_INVALID') || message.includes('403')) {
    code = 'INVALID_API_KEY';
    clientMessage = 'The configured Gemini API key is invalid or unauthorized.';
    httpStatus = 403;
  } else if (status === 429 || message.includes('RESOURCE_EXHAUSTED')) {
    code = 'QUOTA_EXCEEDED';
    clientMessage = 'Google AI Studio quota limit reached. Please retry after a brief pause.';
    httpStatus = 429;
  } else if (message.includes('deadline') || message.includes('timeout') || message.includes('ETIMEDOUT')) {
    code = 'GATEWAY_TIMEOUT';
    clientMessage = 'The request to the Gemma service timed out.';
    httpStatus = 504;
  } else if (err.code === 'CONFIG_MISSING_API_KEY' || err.code === 'INVALID_IMAGE_BUFFER' || err.code === 'UNSUPPORTED_MIME_TYPE' || err.code === 'EMPTY_MODEL_RESPONSE') {
    return err;
  } else if (message) {
    clientMessage = message;
  }

  const mapped = new Error(clientMessage);
  mapped.code = code;
  mapped.status = httpStatus;
  mapped.model = model;
  return mapped;
}
