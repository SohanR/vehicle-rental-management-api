import { unlink } from 'node:fs/promises';
import path from 'node:path';
import { env } from '../config/env';
import { vehicleUploadDirectory } from '../middlewares/upload.middleware';

export function toStoredPhotoPath(absoluteFilePath: string): string {
  const filename = path.basename(absoluteFilePath);
  return `uploads/vehicles/${filename}`;
}

export async function deleteVehiclePhoto(photoPath: string | null | undefined): Promise<void> {
  if (!photoPath) return;

  const publicPrefix = 'uploads/';
  if (!photoPath.startsWith(publicPrefix)) {
    throw new Error('Refusing to delete an invalid vehicle photo path');
  }
  const relativeUploadPath = photoPath.slice(publicPrefix.length);
  const absolutePath = path.resolve(process.cwd(), env.UPLOAD_DIR, relativeUploadPath);
  const relativeToUploadDirectory = path.relative(vehicleUploadDirectory, absolutePath);
  if (
    relativeToUploadDirectory.startsWith('..') ||
    path.isAbsolute(relativeToUploadDirectory) ||
    relativeToUploadDirectory === ''
  ) {
    throw new Error('Refusing to delete a file outside the vehicle upload directory');
  }

  try {
    await unlink(absolutePath);
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT') {
      return;
    }
    throw error;
  }
}
