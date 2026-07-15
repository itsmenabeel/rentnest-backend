import { Request, Response, NextFunction } from 'express';
import { sendResponse } from '../../utils/ApiResponse';
import { paymentsService } from './payments.service';

export const paymentsController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await paymentsService.create(req.body, req.user!.id);
      sendResponse(res, 201, true, 'Payment session created successfully', result);
    } catch (err) {
      next(err);
    }
  },

  async confirm(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await paymentsService.confirm(req.body);
      sendResponse(res, 200, true, 'Payment confirmation processed successfully', result);
    } catch (err) {
      next(err);
    }
  },

  async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const payments = await paymentsService.getHistory(req.user!.id);
      sendResponse(res, 200, true, 'Payment history fetched successfully', payments);
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const payment = await paymentsService.getById(req.params.id, req.user!);
      sendResponse(res, 200, true, 'Payment fetched successfully', payment);
    } catch (err) {
      next(err);
    }
  },
};
