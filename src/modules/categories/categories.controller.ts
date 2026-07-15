import { Request, Response, NextFunction } from 'express';
import { sendResponse } from '../../utils/ApiResponse';
import { categoriesService } from './categories.service';

export const categoriesController = {
  async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await categoriesService.getAll();
      sendResponse(res, 200, true, 'Categories fetched successfully', categories);
    } catch (err) {
      next(err);
    }
  },
};
