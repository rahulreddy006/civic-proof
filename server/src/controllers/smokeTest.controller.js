import { runImageSmokeTest, isApiKeyConfigured } from '../services/gemma.service.js';

const MAX_PROMPT_LENGTH = 1000;

/**
 * Controller for POST /api/gemma-smoke-test
 */
export async function handleGemmaSmokeTest(req, res, next) {
  try {
    // 1. Check if server has API key configured
    if (!isApiKeyConfigured()) {
      return res.status(500).json({
        status: 'error',
        error: {
          code: 'CONFIG_MISSING_API_KEY',
          message: 'Server GEMINI_API_KEY is not configured in .env. Please configure a valid API key.'
        }
      });
    }

    // 2. Validate file presence
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        error: {
          code: 'MISSING_IMAGE_FILE',
          message: 'No image file was uploaded. Please attach an image in the form field "image".'
        }
      });
    }

    // 3. Validate MIME type
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        status: 'error',
        error: {
          code: 'UNSUPPORTED_MIME_TYPE',
          message: `Invalid file type "${req.file.mimetype}". Allowed types: image/jpeg, image/png, image/webp.`
        }
      });
    }

    // 4. Validate optional prompt
    let prompt = req.body?.prompt;
    if (typeof prompt === 'string') {
      prompt = prompt.trim();
      if (prompt.length > MAX_PROMPT_LENGTH) {
        return res.status(400).json({
          status: 'error',
          error: {
            code: 'PROMPT_TOO_LONG',
            message: `Prompt exceeds maximum allowed length of ${MAX_PROMPT_LENGTH} characters.`
          }
        });
      }
    } else {
      prompt = undefined;
    }

    // 5. Run image smoke test with the model
    // Memory storage buffer is used; no persistent disk retention occurs.
    const result = await runImageSmokeTest({
      buffer: req.file.buffer,
      mimeType: req.file.mimetype,
      prompt
    });

    return res.status(200).json({
      status: 'success',
      data: {
        model: result.model,
        prompt: result.prompt,
        response: result.responseText,
        latencyMs: result.latencyMs,
        timestamp: result.timestamp
      }
    });
  } catch (err) {
    const statusCode = err.status || 500;
    return res.status(statusCode).json({
      status: 'error',
      error: {
        code: err.code || 'SMOKE_TEST_FAILED',
        message: err.message || 'An error occurred during the Gemma image smoke test.'
      },
      latencyMs: err.latencyMs || null
    });
  }
}
