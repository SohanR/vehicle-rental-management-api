import type { RequestHandler } from 'express';
import type { RentalService } from '../services/rental.service';
import type {
  IdParams,
  RentalBody,
  RentalListResponse,
  RentalQuery,
  RentalResponse,
  RentalUpdateBody,
} from '../types/http';

export class RentalController {
  constructor(private readonly rentalService: RentalService) {}

  findAll: RequestHandler<Record<string, never>, RentalListResponse, never, RentalQuery> = async (
    req,
    res,
  ) => {
    const result = await this.rentalService.findAll({
      page: req.query.page,
      limit: req.query.limit,
      vehicle_id: req.query.vehicle_id,
      status: req.query.status,
      start_date: req.query.start_date,
      end_date: req.query.end_date,
    });
    res.status(200).json({
      success: true,
      data: result.rentals,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        pages: result.pages,
      },
    });
  };

  findById: RequestHandler<IdParams, RentalResponse> = async (req, res) => {
    const rental = await this.rentalService.findById(Number(req.params.id));
    res.status(200).json({ success: true, data: rental });
  };

  create: RequestHandler<Record<string, never>, RentalResponse, RentalBody> = async (req, res) => {
    const rental = await this.rentalService.createRental(req.body);
    res.status(201).json({ success: true, data: rental });
  };

  update: RequestHandler<IdParams, RentalResponse, RentalUpdateBody> = async (req, res) => {
    const rental = await this.rentalService.updateRental(Number(req.params.id), req.body);
    res.status(200).json({ success: true, data: rental });
  };

  cancel: RequestHandler<IdParams, void> = async (req, res) => {
    await this.rentalService.cancelRental(Number(req.params.id));
    res.status(204).send();
  };
}
