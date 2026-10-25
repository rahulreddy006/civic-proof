import { Router } from 'express';
import multer from 'multer';
import { handleGemmaSmokeTest } from '../controllers/smokeTest.controller.js';

const router = Router();

// Store uploaded files in memory to avoid persistent disk storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB maximum file size
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const err = new Error(`Invalid file type "${file.mimetype}". Allowed types: image/jpeg, image/png, image/webp.`);
      err.code = 'UNSUPPORTED_MIME_TYPE';
      cb(err, false);
    }
  }
});

// Middleware wrapper to catch Multer errors gracefully
function uploadMiddleware(req, res, next) {
  upload.single('image')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            status: 'error',
            error: {
              code: 'FILE_TOO_LARGE',
              message: 'Uploaded image exceeds the 5MB file size limit.'
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

router.post('/gemma-smoke-test', uploadMiddleware, handleGemmaSmokeTest);

export default router;
