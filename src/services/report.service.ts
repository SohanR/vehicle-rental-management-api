import { z } from 'zod';
import { ValidationError } from '../errors';
import type { ReportRepository } from '../repositories/report.repository';
import type { MonthlyRentalReport, TopRevenueVehicle, VehicleRentalMetrics } from '../types/report';

const reportQuerySchema = z.object({
  month: z
    .string({ error: 'month is required' })
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'month must use YYYY-MM format'),
  vehicle_id: z.coerce.number().int().positive().optional(),
});

function getMonthBounds(month: string): { monthStart: string; monthEnd: string } {
  const [yearText, monthText] = month.split('-');
  const year = Number(yearText);
  const monthNumber = Number(monthText);
  const monthStart = `${month}-01`;
  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const monthEnd = `${month}-${String(lastDay).padStart(2, '0')}`;
  return { monthStart, monthEnd };
}

function findTopRevenueVehicle(vehicles: VehicleRentalMetrics[]): TopRevenueVehicle | null {
  if (vehicles.length === 0) return null;
  const topVehicle = vehicles.reduce((top, vehicle) =>
    vehicle.revenue > top.revenue ? vehicle : top,
  );
  return { id: topVehicle.id, name: topVehicle.name, revenue: topVehicle.revenue };
}

export class ReportService {
  constructor(private readonly reportRepository: ReportRepository) {}

  async getMonthlyRentalReport(input: unknown): Promise<MonthlyRentalReport> {
    const parsed = reportQuerySchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(
        'Invalid report query',
        parsed.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      );
    }

    const { monthStart, monthEnd } = getMonthBounds(parsed.data.month);
    const rows = await this.reportRepository.getMonthlyRentalMetrics(
      monthStart,
      monthEnd,
      parsed.data.vehicle_id,
    );
    const vehicles: VehicleRentalMetrics[] = rows.map((row) => ({
      id: Number(row.id),
      name: row.name,
      total_bookings: Number(row.total_bookings),
      days_rented: Number(row.days_rented),
      revenue: Number(row.revenue),
    }));

    return {
      month: parsed.data.month,
      month_start: monthStart,
      month_end: monthEnd,
      vehicle_id: parsed.data.vehicle_id ?? null,
      vehicles,
      metadata: { top_revenue_vehicle: findTopRevenueVehicle(vehicles) },
    };
  }
}
