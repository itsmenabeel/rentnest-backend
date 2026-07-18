import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { adminController } from './admin.controller';
import {
  listUsersSchema,
  updateUserStatusSchema,
  listPropertiesSchema,
  listRentalsSchema,
  createCategorySchema,
  updateCategorySchema,
  categoryIdParamSchema,
} from './admin.validation';

const router = Router();

router.use(authenticate, authorize('ADMIN'));

router.get('/users', validate(listUsersSchema), adminController.listUsers);
router.patch('/users/:id', validate(updateUserStatusSchema), adminController.updateUserStatus);

router.get('/properties', validate(listPropertiesSchema), adminController.listProperties);

router.get('/rentals', validate(listRentalsSchema), adminController.listRentals);

router.post('/categories', validate(createCategorySchema), adminController.createCategory);
router.put('/categories/:id', validate(updateCategorySchema), adminController.updateCategory);
router.delete(
  '/categories/:id',
  validate(categoryIdParamSchema),
  adminController.deleteCategory
);

export default router;
