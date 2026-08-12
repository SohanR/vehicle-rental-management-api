import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { env } from '../config/env';
import { BadRequestError } from '../errors';

export const vehicleUploadDirectory = path.resolve(process.cwd(), env.UPLOAD_DIR, 'vehicles');
mkdirSync(vehicleUploadDirectory, { recursive: true });

const extensionByMimeType: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, vehicleUploadDirectory),
  filename: (_req, file, callback) => {
    const extension = extensionByMimeType[file.mimetype];
    callback(null, `vehicle-${Date.now()}-${randomUUID()}${extension}`);
  },
});

export const uploadVehiclePhoto = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!extensionByMimeType[file.mimetype]) {
      callback(new BadRequestError('Photo must be a JPEG, PNG, or WebP image'));
      return;
    }
    callback(null, true);
  },
});
