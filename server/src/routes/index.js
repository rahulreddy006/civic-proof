import { Router } from 'express';
import healthRoutes from './health.routes.js';
import smokeTestRoutes from './smokeTest.routes.js';

const apiRouter = Router();

apiRouter.use('/', healthRoutes);
apiRouter.use('/', smokeTestRoutes);

export default apiRouter;
