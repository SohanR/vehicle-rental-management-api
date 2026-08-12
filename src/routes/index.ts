import { Router } from 'express';
import { getHealth } from '../controllers/health.controller';
import { authRouter } from './auth.routes';
import { rentalRouter } from './rental.routes';
import { reportRouter } from './report.routes';
import { vehicleRouter } from './vehicle.routes';

export const apiRouter = Router();

apiRouter.get('/health', getHealth);
apiRouter.use('/auth', authRouter);
apiRouter.use('/vehicles', vehicleRouter);
apiRouter.use('/rentals', rentalRouter);
apiRouter.use('/reports', reportRouter);
