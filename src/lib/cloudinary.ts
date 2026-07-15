import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';

const isCloudinaryConfigured =
  Boolean(env.CLOUDINARY_CLOUD_NAME) &&
  Boolean(env.CLOUDINARY_API_KEY) &&
  Boolean(env.CLOUDINARY_API_SECRET);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
}

function uploadBuffer(file: Express.Multer.File): Promise<UploadApiResponse> {
  if (!isCloudinaryConfigured) {
    throw ApiError.internal('Cloudinary is not configured');
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'rentnest/properties',
        resource_type: 'image',
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error('Cloudinary upload failed'));
          return;
        }
        resolve(result);
      }
    );

    stream.end(file.buffer);
  });
}

export async function uploadPropertyImages(files: Express.Multer.File[] = []) {
  if (!files.length) return [];

  const uploads = await Promise.all(files.map((file) => uploadBuffer(file)));
  return uploads.map((upload) => upload.secure_url);
}
