import { Router } from 'express';
import multer from 'multer';
import { handleAnalyzeCivicEvidence } from '../controllers/evidence.controller.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 3 * 1024 * 1024 // 3 MB per image
  },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const err = new Error(`Invalid file type "${file.mimetype}" for ${file.fieldname}. Allowed types: image/jpeg, image/png, image/webp.`);
      err.code = 'UNSUPPORTED_MIME_TYPE';
      cb(err, false);
    }
  }
});

const uploadFields = upload.fields([
  { name: 'originalImage', maxCount: 1 },
  { name: 'closureEvidence', maxCount: 1 },
  { name: 'currentImage', maxCount: 1 }
]);

function uploadFieldsMiddleware(req, res, next) {
  uploadFields(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            status: 'error',
            error: {
              code: 'FILE_TOO_LARGE',
              message: 'One or more uploaded images exceed the 3 MB file size limit.'
            }
          });
        }
        return res.status(400).json({
          status: 'error',
          error: {
            code: err.code,
            message: `Upload error: ${err.message}`
          }
        });
      }
      return res.status(400).json({
        status: 'error',
        error: {
          code: err.code || 'INVALID_UPLOAD',
          message: err.message
        }
      });
    }
    next();
  });
}

// POST /api/analyze-civic-evidence
router.post('/analyze-civic-evidence', uploadFieldsMiddleware, handleAnalyzeCivicEvidence);

export default router;
