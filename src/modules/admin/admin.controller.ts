import { Request, Response, NextFunction } from 'express';
import { adminService } from './admin.service';
import { sendResponse } from '../../utils/ApiResponse';
import {
  ListUsersQuery,
  ListPropertiesQuery,
  ListRentalsQuery,
} from './admin.validation';

export const adminController = {
  async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await adminService.listUsers(req.query as unknown as ListUsersQuery);
      sendResponse(res, 200, true, 'Users fetched successfully', result);
    } catch (err) {
      next(err);
    }
  },

  async updateUserStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await adminService.updateUserStatus(req.params.id, req.body.status);
      sendResponse(res, 200, true, 'User status updated successfully', user);
    } catch (err) {
      next(err);
    }
  },

  async listProperties(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await adminService.listProperties(
        req.query as unknown as ListPropertiesQuery
      );
      sendResponse(res, 200, true, 'Properties fetched successfully', result);
    } catch (err) {
      next(err);
    }
  },

  async listRentals(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await adminService.listRentals(req.query as unknown as ListRentalsQuery);
      sendResponse(res, 200, true, 'Rental requests fetched successfully', result);
    } catch (err) {
      next(err);
    }
  },

  async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await adminService.createCategory(req.body);
      sendResponse(res, 201, true, 'Category created successfully', category);
    } catch (err) {
      next(err);
    }
  },

  async updateCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await adminService.updateCategory(req.params.id, req.body);
      sendResponse(res, 200, true, 'Category updated successfully', category);
    } catch (err) {
      next(err);
    }
  },

  async deleteCategory(req: Request, res: Response, next: NextFunction) {
    try {
      await adminService.deleteCategory(req.params.id);
      sendResponse(res, 200, true, 'Category deleted successfully');
    } catch (err) {
      next(err);
    }
  },
};
