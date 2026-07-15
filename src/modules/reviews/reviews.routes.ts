import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { reviewsController } from './reviews.controller';
import { createReviewSchema, getPropertyReviewsSchema } from './reviews.validation';

const router = Router();

router.post(
  '/',
  authenticate,
  authorize('TENANT'),
  validate(createReviewSchema),
  reviewsController.create
);

router.get(
  '/property/:propertyId',
  validate(getPropertyReviewsSchema),
  reviewsController.getByProperty
);

export default router;
