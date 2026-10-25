import { Router } from 'express';
import { getHealth, checkModelConnectivity } from '../controllers/health.controller.js';

const router = Router();

// GET /api/health - returns server running status
router.get('/health', getHealth);

// POST /api/health/model-check or GET /api/health/model-check - runs real connectivity check
router.get('/health/model-check', checkModelConnectivity);
router.post('/health/model-check', checkModelConnectivity);

// Backwards compatibility endpoint for existing test-gemma
router.post('/test-gemma', checkModelConnectivity);

export default router;
