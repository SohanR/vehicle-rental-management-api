import { Router } from 'express';
import { db } from '../config/database';
import { VehicleController } from '../controllers/vehicle.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { uploadVehiclePhoto } from '../middlewares/upload.middleware';
import {
  createVehicleValidation,
  idValidation,
  updateVehicleValidation,
  vehicleListValidation,
} from '../middlewares/request-validators';
import { validateRequest } from '../middlewares/validation.middleware';
import { VehicleRepository } from '../repositories/vehicle.repository';
import { VehicleService } from '../services/vehicle.service';

const vehicleRepository = new VehicleRepository(db);
const vehicleService = new VehicleService(vehicleRepository);
const vehicleController = new VehicleController(vehicleService);

export const vehicleRouter = Router();

vehicleRouter.use(authenticateJWT);
vehicleRouter.get('/', vehicleListValidation, validateRequest, vehicleController.findAll);
vehicleRouter.get('/:id', idValidation, validateRequest, vehicleController.findById);
vehicleRouter.post(
  '/',
  uploadVehiclePhoto.single('photo'),
  createVehicleValidation,
  validateRequest,
  vehicleController.create,
);
vehicleRouter.put(
  '/:id',
  idValidation,
  uploadVehiclePhoto.single('photo'),
  updateVehicleValidation,
  validateRequest,
  vehicleController.update,
);
vehicleRouter.delete('/:id', idValidation, validateRequest, vehicleController.softDelete);
