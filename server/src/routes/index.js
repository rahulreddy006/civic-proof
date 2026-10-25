import { Router } from 'express';
import healthRoutes from './health.routes.js';
import smokeTestRoutes from './smokeTest.routes.js';
import evidenceRoutes from './evidence.routes.js';

const apiRouter = Router();

apiRouter.use('/', healthRoutes);
apiRouter.use('/', smokeTestRoutes);
apiRouter.use('/', evidenceRoutes);

export default apiRouter;
