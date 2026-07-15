import { Request, Response, NextFunction } from 'express';
import { uploadPropertyImages } from '../../lib/cloudinary';
import { sendResponse } from '../../utils/ApiResponse';
import { ApiError } from '../../utils/ApiError';
import { propertiesService } from './properties.service';
import { GetPropertiesQuery } from './properties.validation';

function getUploadedFiles(req: Request) {
  return Array.isArray(req.files) ? req.files : [];
}

export const propertiesController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await propertiesService.getAll(req.query as unknown as GetPropertiesQuery);
      sendResponse(res, 200, true, 'Properties fetched successfully', result);
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const property = await propertiesService.getById(req.params.id);
      sendResponse(res, 200, true, 'Property fetched successfully', property);
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const uploadedImages = await uploadPropertyImages(getUploadedFiles(req));
      const property = await propertiesService.create(req.body, req.user!.id, uploadedImages);
      sendResponse(res, 201, true, 'Property created successfully', property);
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const files = getUploadedFiles(req);
      if (Object.keys(req.body).length === 0 && files.length === 0) {
        throw ApiError.badRequest('At least one field or image is required for update');
      }

      const uploadedImages = await uploadPropertyImages(files);
      const property = await propertiesService.update(
        req.params.id,
        req.user!.id,
        req.body,
        uploadedImages
      );
      sendResponse(res, 200, true, 'Property updated successfully', property);
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await propertiesService.remove(req.params.id, req.user!.id);
      sendResponse(res, 200, true, 'Property deleted successfully');
    } catch (err) {
      next(err);
    }
  },
};
