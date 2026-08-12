import { Router } from 'express';
import { db } from '../config/database';
import { RentalController } from '../controllers/rental.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';
import {
  createRentalValidation,
  idValidation,
  rentalListValidation,
  updateRentalValidation,
} from '../middlewares/request-validators';
import { validateRequest } from '../middlewares/validation.middleware';
import { RentalRepository } from '../repositories/rental.repository';
import { VehicleRepository } from '../repositories/vehicle.repository';
import { RentalService } from '../services/rental.service';

const rentalRepository = new RentalRepository(db);
const vehicleRepository = new VehicleRepository(db);
const rentalService = new RentalService(rentalRepository, vehicleRepository, db);
const rentalController = new RentalController(rentalService);

export const rentalRouter = Router();

rentalRouter.use(authenticateJWT);
rentalRouter.get('/', rentalListValidation, validateRequest, rentalController.findAll);
rentalRouter.get('/:id', idValidation, validateRequest, rentalController.findById);
rentalRouter.post('/', createRentalValidation, validateRequest, rentalController.create);
rentalRouter.put(
  '/:id',
  idValidation,
  updateRentalValidation,
  validateRequest,
  rentalController.update,
);
rentalRouter.delete('/:id', idValidation, validateRequest, rentalController.cancel);
