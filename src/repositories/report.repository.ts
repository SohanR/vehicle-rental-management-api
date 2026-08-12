import type { Knex } from 'knex';
import type { VehicleRentalMetricsRow } from '../types/report';

interface RawQueryResult {
  rows: VehicleRentalMetricsRow[];
}

function isRawQueryResult(value: unknown): value is RawQueryResult {
  return (
    typeof value === 'object' && value !== null && 'rows' in value && Array.isArray(value.rows)
  );
}

export class ReportRepository {
  constructor(private readonly database: Knex) {}

  async getMonthlyRentalMetrics(
    monthStart: string,
    monthEnd: string,
    vehicleId?: number,
  ): Promise<VehicleRentalMetricsRow[]> {
    const result: unknown = await this.database.raw(
      `
        WITH month_bounds AS (
          SELECT ?::DATE AS m_start, ?::DATE AS m_end
        ),
        rental_overlaps AS (
          SELECT
            r.id AS rental_id,
            r.vehicle_id,
            v.name AS vehicle_name,
            r.total_amount / ((r.end_date - r.start_date) + 1) AS booked_daily_rate,
            GREATEST(r.start_date, mb.m_start) AS effective_start,
            LEAST(r.end_date, mb.m_end) AS effective_end
          FROM rentals r
          JOIN vehicles v ON r.vehicle_id = v.id
          CROSS JOIN month_bounds mb
          WHERE r.status != 'cancelled'
            AND r.start_date <= mb.m_end
            AND r.end_date >= mb.m_start
            AND (?::INTEGER IS NULL OR r.vehicle_id = ?::INTEGER)
        ),
        vehicle_summary AS (
          SELECT
            v.id,
            v.name,
            COUNT(ro.rental_id)::INTEGER AS total_bookings,
            COALESCE(SUM((ro.effective_end - ro.effective_start) + 1), 0)::INTEGER AS days_rented,
            COALESCE(
              SUM(((ro.effective_end - ro.effective_start) + 1) * ro.booked_daily_rate),
              0
            )::NUMERIC AS revenue
          FROM vehicles v
          LEFT JOIN rental_overlaps ro ON v.id = ro.vehicle_id
          WHERE (v.deleted_at IS NULL OR ro.rental_id IS NOT NULL)
            AND (?::INTEGER IS NULL OR v.id = ?::INTEGER)
          GROUP BY v.id, v.name
        )
        SELECT id, name, total_bookings, days_rented, revenue
        FROM vehicle_summary
        ORDER BY id ASC
      `,
      [
        monthStart,
        monthEnd,
        vehicleId ?? null,
        vehicleId ?? null,
        vehicleId ?? null,
        vehicleId ?? null,
      ],
    );

    if (!isRawQueryResult(result)) {
      throw new Error('Database returned an invalid monthly report result');
    }
    return result.rows;
  }
}
