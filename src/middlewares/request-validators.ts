import { body, param, query, type ValidationChain } from 'express-validator';
import { RENTAL_STATUSES } from '../types/rental';
import { VEHICLE_CATEGORIES } from '../types/vehicle';

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const isCalendarDate = (value: string): boolean => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

export const idValidation: ValidationChain[] = [
  param('id').isInt({ min: 1 }).withMessage('id must be a positive integer'),
];

export const paginationValidation: ValidationChain[] = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be at least 1'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be from 1 to 100'),
];

export const vehicleListValidation: ValidationChain[] = [
  ...paginationValidation,
  query('category').optional().isIn(VEHICLE_CATEGORIES).withMessage('category is invalid'),
  query('search').optional().trim().isLength({ min: 1, max: 150 }),
];

const vehicleFields = [
  body('name').trim().isLength({ min: 2, max: 150 }),
  body('plate_number').trim().isLength({ min: 2, max: 50 }),
  body('category').isIn(VEHICLE_CATEGORIES).withMessage('category is invalid'),
  body('daily_rate').isFloat({ gt: 0, max: 99_999_999.99 }),
];

export const createVehicleValidation: ValidationChain[] = vehicleFields;
export const updateVehicleValidation: ValidationChain[] = [
  body().custom((value: unknown, { req }) => {
    if (
      (typeof value !== 'object' || value === null || Object.keys(value).length === 0) &&
      !req.file
    ) {
      throw new Error('At least one vehicle field must be supplied');
    }
    return true;
  }),
  body('name').optional().trim().isLength({ min: 2, max: 150 }),
  body('plate_number').optional().trim().isLength({ min: 2, max: 50 }),
  body('category').optional().isIn(VEHICLE_CATEGORIES).withMessage('category is invalid'),
  body('daily_rate').optional().isFloat({ gt: 0, max: 99_999_999.99 }),
];

const requiredDate = (field: 'start_date' | 'end_date'): ValidationChain =>
  body(field)
    .matches(datePattern)
    .withMessage(`${field} must use YYYY-MM-DD format`)
    .custom(isCalendarDate)
    .withMessage(`${field} must be a valid calendar date`);

export const createRentalValidation: ValidationChain[] = [
  body('vehicle_id').isInt({ min: 1 }),
  body('customer_name').trim().isLength({ min: 2, max: 150 }),
  body('customer_phone').trim().isLength({ min: 5, max: 30 }),
  requiredDate('start_date'),
  requiredDate('end_date'),
];

export const updateRentalValidation: ValidationChain[] = [
  body().custom((value: unknown) => {
    if (typeof value !== 'object' || value === null || Object.keys(value).length === 0) {
      throw new Error('At least one rental field must be supplied');
    }
    return true;
  }),
  body('vehicle_id').optional().isInt({ min: 1 }),
  body('customer_name').optional().trim().isLength({ min: 2, max: 150 }),
  body('customer_phone').optional().trim().isLength({ min: 5, max: 30 }),
  body('start_date').optional().matches(datePattern).custom(isCalendarDate),
  body('end_date').optional().matches(datePattern).custom(isCalendarDate),
  body('status').optional().isIn(RENTAL_STATUSES),
];

export const rentalListValidation: ValidationChain[] = [
  ...paginationValidation,
  query('vehicle_id').optional().isInt({ min: 1 }),
  query('status').optional().isIn(RENTAL_STATUSES),
  query('start_date').optional().matches(datePattern).custom(isCalendarDate),
  query('end_date').optional().matches(datePattern).custom(isCalendarDate),
];

export const reportValidation: ValidationChain[] = [
  query('month')
    .matches(/^\d{4}-(0[1-9]|1[0-2])$/)
    .withMessage('month must use YYYY-MM format'),
  query('vehicle_id').optional().isInt({ min: 1 }),
];
