import type { RequestHandler } from 'express';
import type { ReportService } from '../services/report.service';
import type { ReportQuery, ReportResponse } from '../types/http';

export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  getMonthlyRentals: RequestHandler<Record<string, never>, ReportResponse, never, ReportQuery> =
    async (req, res) => {
      const report = await this.reportService.getMonthlyRentalReport({
        month: req.query.month,
        vehicle_id: req.query.vehicle_id,
      });
      res.status(200).json({ success: true, data: report });
    };
}
