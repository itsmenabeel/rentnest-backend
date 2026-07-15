import { Request, Response, NextFunction } from 'express';
import { sendResponse } from '../../utils/ApiResponse';
import { reviewsService } from './reviews.service';
import { GetPropertyReviewsQuery } from './reviews.validation';

export const reviewsController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const review = await reviewsService.create(req.body, req.user!.id);
      sendResponse(res, 201, true, 'Review submitted successfully', review);
    } catch (err) {
      next(err);
    }
  },

  async getByProperty(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await reviewsService.getByProperty(
        req.params.propertyId,
        req.query as unknown as GetPropertyReviewsQuery
      );
      sendResponse(res, 200, true, 'Reviews fetched successfully', result);
    } catch (err) {
      next(err);
    }
  },
};
