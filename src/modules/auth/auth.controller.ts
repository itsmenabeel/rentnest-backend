import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { sendResponse } from '../../utils/ApiResponse';

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);
      sendResponse(res, 201, true, 'Account created successfully', result);
    } catch (err) {
      next(err);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body);
      sendResponse(res, 200, true, 'Logged in successfully', result);
    } catch (err) {
      next(err);
    }
  },

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await authService.getMe(req.user!.id);
      sendResponse(res, 200, true, 'Current user fetched', user);
    } catch (err) {
      next(err);
    }
  },
};
