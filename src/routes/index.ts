import { Router } from 'express';
import adminRouter from '../modules/admin/admin.routes';
import authRouter from '../modules/auth/auth.routes';
import categoriesRouter from '../modules/categories/categories.routes';
import paymentsRouter from '../modules/payments/payments.routes';
import { landlordRouter, propertiesRouter } from '../modules/properties/properties.routes';
import { landlordRentalRouter, rentalsRouter } from '../modules/rentals/rentals.routes';
import reviewsRouter from '../modules/reviews/reviews.routes';

const router = Router();

router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'RentNest API is running',
  });
});

router.use('/auth', authRouter);
router.use('/categories', categoriesRouter);
router.use('/properties', propertiesRouter);
router.use('/rentals', rentalsRouter);
router.use('/payments', paymentsRouter);
router.use('/reviews', reviewsRouter);
router.use('/landlord', landlordRouter);
router.use('/landlord', landlordRentalRouter);
router.use('/admin', adminRouter);

export default router;
