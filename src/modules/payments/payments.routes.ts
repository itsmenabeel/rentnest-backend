import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { paymentsController } from './payments.controller';
import {
  confirmPaymentSchema,
  createPaymentSchema,
  ipnPaymentSchema,
  paymentIdParamSchema,
} from './payments.validation';

const router = Router();

router.post(
  '/create',
  authenticate,
  authorize('TENANT'),
  validate(createPaymentSchema),
  paymentsController.create
);

router.post('/confirm', validate(confirmPaymentSchema), paymentsController.confirm);
router.post('/ipn', validate(ipnPaymentSchema), paymentsController.confirm);

router.get('/', authenticate, authorize('TENANT'), paymentsController.getHistory);
router.get(
  '/:id',
  authenticate,
  authorize('TENANT', 'LANDLORD', 'ADMIN'),
  validate(paymentIdParamSchema),
  paymentsController.getById
);

export default router;
