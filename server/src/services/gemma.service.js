import { GoogleGenAI } from '@google/genai';

const DEFAULT_MODEL = 'gemma-4-26b-a4b-it';
const DEFAULT_SMOKE_PROMPT = 'Describe this test image in detail and identify visible objects and conditions without guessing or assuming facts.';

export const ALLOWED_STATUSES = ['still_visible', 'partly_resolved', 'appears_resolved', 'inconclusive'];

const CIVIC_REVIEW_PROMPT = `You are an evidence-review assistant for civic complaints.
You will receive an original issue photograph, closure evidence, a current-condition photograph, and optional closure text.
Analyze each input according to its labelled role.
First describe what is visibly present in the original issue photograph.
Next extract or summarize the closure claim from the supplied screenshot or text. If it is unreadable, say so.
Then describe what is visibly present in the current-condition photograph.
Compare these observations and the supplied closure claim.
Select exactly one status:
still_visible
partly_resolved
appears_resolved
inconclusive

Rules:
- Separate direct visual observations from inferences.
- Do not assume that the original and current photographs depict the same exact location or capture date unless this is independently established by supplied evidence.
- Do not treat a closure notification as proof that physical work was completed.
- Do not infer the identity, intent, actions, or misconduct of an individual or municipal official.
- Do not fabricate ticket numbers, locations, dates, official actions, or missing information.
- If image quality, camera angle, occlusion, insufficient context, or contradictions prevent reliable comparison, use inconclusive.
- Provide a concise, evidence-grounded explanation, relevant uncertainty, limitations, and a factual suggested follow-up message.

Return ONLY a single valid JSON object (no markdown, no extra commentary) matching this schema:
{
  "status": "still_visible" | "partly_resolved" | "appears_resolved" | "inconclusive",
  "summary": "Concise summary statement",
  "originalObservations": ["observation 1", "observation 2"],
  "closureClaim": "Summary of what closure notification claims or states (or note if unreadable)",
  "currentObservations": ["observation 1", "observation 2"],
  "evidenceComparison": "Detailed objective comparison between original issue and current condition relative to closure claim",
  "uncertainties": ["uncertainty 1", "uncertainty 2"],
  "limitations": ["limitation 1", "limitation 2"],
  "suggestedFollowUp": "Polite, factual, non-accusatory draft message for municipal follow-up review"
}`;

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
 * Executes full civic evidence review on three labelled evidence images and optional closure text.
 *
 * @param {Object} params
 * @param {Object} params.originalImage - { buffer, mimeType }
 * @param {Object} params.closureEvidence - { buffer, mimeType }
 * @param {Object} params.currentImage - { buffer, mimeType }
 * @param {string} [params.closureText] - Optional closure context note
 * @returns {Promise<Object>} Validated assessment object
 */
export async function analyzeCivicEvidence({ originalImage, closureEvidence, currentImage, closureText }) {
  const model = getModelName();
  const ai = getGenAIClient();
  const startTime = Date.now();

  const formattedContext = (typeof closureText === 'string' && closureText.trim().length > 0)
    ? closureText.trim()
    : 'None provided.';

  // Build the multimodal contents with explicit evidence roles
  const contents = [
    { text: "EVIDENCE ITEM 1 [ROLE: ORIGINAL_ISSUE_PHOTO]\nThis image represents the original issue as initially reported by the resident." },
    {
      inlineData: {
        mimeType: originalImage.mimeType,
        data: originalImage.buffer.toString('base64')
      }
    },
    { text: "EVIDENCE ITEM 2 [ROLE: CLOSURE_EVIDENCE]\nThis image represents the closure notification, resolution screenshot, or official status claim." },
    {
      inlineData: {
        mimeType: closureEvidence.mimeType,
        data: closureEvidence.buffer.toString('base64')
      }
    },
    { text: "EVIDENCE ITEM 3 [ROLE: CURRENT_CONDITION_PHOTO]\nThis image represents the current/recent condition of the area as photographed by the resident." },
    {
      inlineData: {
        mimeType: currentImage.mimeType,
        data: currentImage.buffer.toString('base64')
      }
    },
    {
      text: `USER SUPPLIED CLOSURE CONTEXT:\n${formattedContext}\n\n${CIVIC_REVIEW_PROMPT}`
    }
  ];

  try {
    const response = await ai.models.generateContent({
      model,
      contents
    });

    const latencyMs = Date.now() - startTime;
    const rawText = (response?.text || '').trim();

    if (!rawText) {
      const err = new Error('The Gemma model returned an empty response.');
      err.code = 'EMPTY_MODEL_RESPONSE';
      err.status = 502;
      throw err;
    }

    const validatedAssessment = parseAndValidateGemmaResponse(rawText);
    return {
      ...validatedAssessment,
      model,
      latencyMs,
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    const latencyMs = Date.now() - startTime;
    const mapped = mapGenAiError(err, model);
    mapped.latencyMs = latencyMs;
    throw mapped;
  }
}

/**
 * Parses and strictly validates the model JSON output.
 */
export function parseAndValidateGemmaResponse(rawText) {
  let cleaned = rawText.trim();
  const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    cleaned = jsonMatch[1].trim();
  }

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        parsed = JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
      } catch (e2) {
        const error = new Error('Model output could not be parsed as valid JSON.');
        error.code = 'MALFORMED_MODEL_JSON';
        error.status = 502;
        error.rawOutput = rawText.substring(0, 500);
        throw error;
      }
    } else {
      const error = new Error('Model output did not contain a valid JSON object.');
      error.code = 'MALFORMED_MODEL_JSON';
      error.status = 502;
      error.rawOutput = rawText.substring(0, 500);
      throw error;
    }
  }

  let status = typeof parsed.status === 'string' ? parsed.status.trim().toLowerCase() : '';
  if (!ALLOWED_STATUSES.includes(status)) {
    status = 'inconclusive';
  }

  const toArrayOfStrings = (val) => {
    if (Array.isArray(val)) {
      return val.map(item => typeof item === 'string' ? item.trim() : String(item)).filter(Boolean);
    }
    if (typeof val === 'string' && val.trim().length > 0) {
      return [val.trim()];
    }
    return [];
  };

  const toCleanString = (val, fallback = '') => {
    if (typeof val === 'string') return val.trim();
    if (Array.isArray(val)) return val.join(' ').trim();
    return fallback;
  };

  const summary = toCleanString(parsed.summary, 'Civic evidence comparison evaluated from supplied inputs.');
  const originalObservations = toArrayOfStrings(parsed.originalObservations);
  const closureClaim = toCleanString(parsed.closureClaim, 'No readable claim details found in closure evidence.');
  const currentObservations = toArrayOfStrings(parsed.currentObservations);
  const evidenceComparison = toCleanString(parsed.evidenceComparison, 'Comparison between original issue and current condition evaluated against closure notification.');
  const uncertainties = toArrayOfStrings(parsed.uncertainties);
  const limitations = toArrayOfStrings(parsed.limitations);
  const suggestedFollowUp = toCleanString(
    parsed.suggestedFollowUp,
    'Hello, I am requesting a review of the reported civic issue. Based on a comparison between the original photograph, the closure notification, and the current condition photograph, the concern appears to require further inspection. Please advise on next steps.'
  );

  return {
    status,
    summary,
    originalObservations: originalObservations.length > 0 ? originalObservations : ['Original issue image analyzed.'],
    closureClaim,
    currentObservations: currentObservations.length > 0 ? currentObservations : ['Current condition image analyzed.'],
    evidenceComparison,
    uncertainties: uncertainties.length > 0 ? uncertainties : ['Image capture dates and exact physical coordinates cannot be independently verified from the photographs.'],
    limitations: limitations.length > 0 ? limitations : ['Review is advisory, automated, and strictly grounded in user-supplied evidence.'],
    suggestedFollowUp
  };
}

/**
 * Executes a single-image smoke test using the configured Gemma 4 model.
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
    : DEFAULT_SMOKE_PROMPT;

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
  } else if (err.code === 'CONFIG_MISSING_API_KEY' || err.code === 'INVALID_IMAGE_BUFFER' || err.code === 'UNSUPPORTED_MIME_TYPE' || err.code === 'EMPTY_MODEL_RESPONSE' || err.code === 'MALFORMED_MODEL_JSON') {
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
