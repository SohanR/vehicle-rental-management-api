import type { RequestHandler } from 'express';
import type { VehicleService } from '../services/vehicle.service';
import type {
  IdParams,
  VehicleBody,
  VehicleListResponse,
  VehicleQuery,
  VehicleResponse,
  VehicleUpdateBody,
} from '../types/http';
import { deleteVehiclePhoto, toStoredPhotoPath } from '../utils/upload-file';

export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}

  findAll: RequestHandler<Record<string, never>, VehicleListResponse, never, VehicleQuery> = async (
    req,
    res,
  ) => {
    const result = await this.vehicleService.findAll({
      page: req.query.page,
      limit: req.query.limit,
      category: req.query.category,
      search: req.query.search,
    });

    res.status(200).json({
      success: true,
      data: result.vehicles,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        pages: result.pages,
      },
    });
  };

  findById: RequestHandler<IdParams, VehicleResponse> = async (req, res) => {
    const vehicle = await this.vehicleService.findById(Number(req.params.id));
    res.status(200).json({ success: true, data: vehicle });
  };

  create: RequestHandler<Record<string, never>, VehicleResponse, VehicleBody> = async (
    req,
    res,
  ) => {
    const photoPath = req.file ? toStoredPhotoPath(req.file.path) : undefined;

    try {
      const vehicle = await this.vehicleService.create({ ...req.body, photo_path: photoPath });
      res.status(201).json({ success: true, data: vehicle });
    } catch (error: unknown) {
      await this.cleanupNewUpload(photoPath, req);
      throw error;
    }
  };

  update: RequestHandler<IdParams, VehicleResponse, VehicleUpdateBody> = async (req, res) => {
    const photoPath = req.file ? toStoredPhotoPath(req.file.path) : undefined;

    try {
      const updateData: Record<string, unknown> = { ...req.body };
      if (photoPath) updateData.photo_path = photoPath;

      const result = await this.vehicleService.update(Number(req.params.id), updateData);
      if (photoPath && result.previousPhotoPath !== photoPath) {
        try {
          await deleteVehiclePhoto(result.previousPhotoPath);
        } catch (error: unknown) {
          req.log.warn(
            { err: error, vehicleId: result.vehicle.id, photoPath: result.previousPhotoPath },
            'Vehicle updated but previous photo could not be removed',
          );
        }
      }

      res.status(200).json({ success: true, data: result.vehicle });
    } catch (error: unknown) {
      await this.cleanupNewUpload(photoPath, req);
      throw error;
    }
  };

  softDelete: RequestHandler<IdParams, void> = async (req, res) => {
    await this.vehicleService.softDelete(Number(req.params.id));
    res.status(204).send();
  };

  private async cleanupNewUpload(
    photoPath: string | undefined,
    req: Parameters<RequestHandler>[0],
  ): Promise<void> {
    try {
      await deleteVehiclePhoto(photoPath);
    } catch (cleanupError: unknown) {
      req.log.error({ err: cleanupError, photoPath }, 'Failed to clean up uploaded vehicle photo');
    }
  }
}
