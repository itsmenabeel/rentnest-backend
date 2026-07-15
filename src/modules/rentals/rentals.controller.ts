import { Request, Response, NextFunction } from 'express';
import { sendResponse } from '../../utils/ApiResponse';
import { GetRentalsQuery } from './rentals.validation';
import { rentalsService } from './rentals.service';

export const rentalsController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const rental = await rentalsService.create(req.body, req.user!.id);
      sendResponse(res, 201, true, 'Rental request submitted successfully', rental);
    } catch (err) {
      next(err);
    }
  },

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await rentalsService.getAll(
        req.user!,
        req.query as unknown as GetRentalsQuery
      );
      sendResponse(res, 200, true, 'Rental requests fetched successfully', result);
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const rental = await rentalsService.getById(req.params.id, req.user!);
      sendResponse(res, 200, true, 'Rental request fetched successfully', rental);
    } catch (err) {
      next(err);
    }
  },

  async getLandlordRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await rentalsService.getLandlordRequests(
        req.user!.id,
        req.query as unknown as GetRentalsQuery
      );
      sendResponse(res, 200, true, 'Landlord rental requests fetched successfully', result);
    } catch (err) {
      next(err);
    }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const rental = await rentalsService.updateStatus(req.params.id, req.user!.id, req.body);
      sendResponse(res, 200, true, 'Rental request status updated successfully', rental);
    } catch (err) {
      next(err);
    }
  },
};
