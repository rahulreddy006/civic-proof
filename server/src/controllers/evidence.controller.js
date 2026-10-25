import { analyzeCivicEvidence, isApiKeyConfigured } from '../services/gemma.service.js';

const MAX_IMAGE_SIZE = 3 * 1024 * 1024; // 3 MB per image
const MAX_TOTAL_SIZE = 9 * 1024 * 1024; // 9 MB combined
const MAX_CLOSURE_TEXT_LENGTH = 1000;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Controller for POST /api/analyze-civic-evidence
 */
export async function handleAnalyzeCivicEvidence(req, res, next) {
  try {
    // 1. Verify API key configuration
    if (!isApiKeyConfigured()) {
      return res.status(500).json({
        status: 'error',
        error: {
          code: 'CONFIG_MISSING_API_KEY',
          message: 'Server GEMINI_API_KEY is not configured in .env. Please configure a valid API key.'
        }
      });
    }

    const files = req.files || {};
    const originalFile = files['originalImage']?.[0];
    const closureFile = files['closureEvidence']?.[0];
    const currentFile = files['currentImage']?.[0];

    // 2. Validate all 3 image files are present
    const missing = [];
    if (!originalFile) missing.push('originalImage');
    if (!closureFile) missing.push('closureEvidence');
    if (!currentFile) missing.push('currentImage');

    if (missing.length > 0) {
      return res.status(400).json({
        status: 'error',
        error: {
          code: 'MISSING_REQUIRED_EVIDENCE',
          message: `All three evidence images are required. Missing: ${missing.join(', ')}.`,
          missingFields: missing
        }
      });
    }

    // 3. Validate MIME types
    const invalidTypes = [];
    if (!ALLOWED_MIME_TYPES.includes(originalFile.mimetype)) {
      invalidTypes.push(`originalImage (${originalFile.mimetype})`);
    }
    if (!ALLOWED_MIME_TYPES.includes(closureFile.mimetype)) {
      invalidTypes.push(`closureEvidence (${closureFile.mimetype})`);
    }
    if (!ALLOWED_MIME_TYPES.includes(currentFile.mimetype)) {
      invalidTypes.push(`currentImage (${currentFile.mimetype})`);
    }

    if (invalidTypes.length > 0) {
      return res.status(400).json({
        status: 'error',
        error: {
          code: 'UNSUPPORTED_MIME_TYPE',
          message: `Invalid file types: ${invalidTypes.join(', ')}. Allowed types: image/jpeg, image/png, image/webp.`
        }
      });
    }

    // 4. Validate file size limits
    const oversized = [];
    if (originalFile.size > MAX_IMAGE_SIZE) oversized.push(`originalImage (${(originalFile.size / (1024 * 1024)).toFixed(2)} MB)`);
    if (closureFile.size > MAX_IMAGE_SIZE) oversized.push(`closureEvidence (${(closureFile.size / (1024 * 1024)).toFixed(2)} MB)`);
    if (currentFile.size > MAX_IMAGE_SIZE) oversized.push(`currentImage (${(currentFile.size / (1024 * 1024)).toFixed(2)} MB)`);

    if (oversized.length > 0) {
      return res.status(400).json({
        status: 'error',
        error: {
          code: 'FILE_TOO_LARGE',
          message: `Individual file size exceeds 3 MB limit: ${oversized.join(', ')}.`
        }
      });
    }

    const totalSize = originalFile.size + closureFile.size + currentFile.size;
    if (totalSize > MAX_TOTAL_SIZE) {
      return res.status(400).json({
        status: 'error',
        error: {
          code: 'TOTAL_SIZE_EXCEEDED',
          message: `Combined upload size (${(totalSize / (1024 * 1024)).toFixed(2)} MB) exceeds the 9 MB limit.`
        }
      });
    }

    // 5. Validate optional closure text
    let closureText = req.body?.closureText;
    if (typeof closureText === 'string') {
      closureText = closureText.trim();
      if (closureText.length > MAX_CLOSURE_TEXT_LENGTH) {
        return res.status(400).json({
          status: 'error',
          error: {
            code: 'CLOSURE_TEXT_TOO_LONG',
            message: `Closure note exceeds maximum length of ${MAX_CLOSURE_TEXT_LENGTH} characters.`
          }
        });
      }
    } else {
      closureText = '';
    }

    // 6. Invoke Gemma multimodal service (in-memory buffer; no persistent disk retention)
    const assessment = await analyzeCivicEvidence({
      originalImage: {
        buffer: originalFile.buffer,
        mimeType: originalFile.mimetype
      },
      closureEvidence: {
        buffer: closureFile.buffer,
        mimeType: closureFile.mimetype
      },
      currentImage: {
        buffer: currentFile.buffer,
        mimeType: currentFile.mimetype
      },
      closureText
    });

    return res.status(200).json({
      status: 'success',
      data: assessment
    });
  } catch (err) {
    const statusCode = err.status || 500;
    return res.status(statusCode).json({
      status: 'error',
      error: {
        code: err.code || 'ANALYSIS_FAILED',
        message: err.message || 'An error occurred during civic evidence analysis.'
      },
      latencyMs: err.latencyMs || null
    });
  }
}
