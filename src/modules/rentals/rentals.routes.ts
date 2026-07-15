import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { rentalsController } from './rentals.controller';
import {
  createRentalSchema,
  getRentalsSchema,
  rentalIdParamSchema,
  updateRentalStatusSchema,
} from './rentals.validation';

const rentalsRouter = Router();
const landlordRentalRouter = Router();

rentalsRouter.post(
  '/',
  authenticate,
  authorize('TENANT'),
  validate(createRentalSchema),
  rentalsController.create
);

rentalsRouter.get(
  '/',
  authenticate,
  authorize('TENANT', 'LANDLORD'),
  validate(getRentalsSchema),
  rentalsController.getAll
);

rentalsRouter.get(
  '/:id',
  authenticate,
  authorize('TENANT', 'LANDLORD'),
  validate(rentalIdParamSchema),
  rentalsController.getById
);

landlordRentalRouter.get(
  '/requests',
  authenticate,
  authorize('LANDLORD'),
  validate(getRentalsSchema),
  rentalsController.getLandlordRequests
);

landlordRentalRouter.patch(
  '/requests/:id',
  authenticate,
  authorize('LANDLORD'),
  validate(updateRentalStatusSchema),
  rentalsController.updateStatus
);

export { rentalsRouter, landlordRentalRouter };
