import { Router } from 'express';
import { db } from '../config/database';
import { ReportController } from '../controllers/report.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { reportValidation } from '../middlewares/request-validators';
import { validateRequest } from '../middlewares/validation.middleware';
import { ReportRepository } from '../repositories/report.repository';
import { ReportService } from '../services/report.service';

const reportRepository = new ReportRepository(db);
const reportService = new ReportService(reportRepository);
const reportController = new ReportController(reportService);

export const reportRouter = Router();

reportRouter.use(authenticateJWT);
reportRouter.get('/rentals', reportValidation, validateRequest, reportController.getMonthlyRentals);
