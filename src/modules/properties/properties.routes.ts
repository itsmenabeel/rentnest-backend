import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { upload } from '../../middleware/upload';
import { validate } from '../../middleware/validate';
import { propertiesController } from './properties.controller';
import {
  createPropertySchema,
  getPropertiesSchema,
  propertyIdParamSchema,
  updatePropertySchema,
} from './properties.validation';

const publicRouter = Router();
const landlordRouter = Router();

publicRouter.get('/', validate(getPropertiesSchema), propertiesController.getAll);
publicRouter.get('/:id', validate(propertyIdParamSchema), propertiesController.getById);

landlordRouter.post(
  '/properties',
  authenticate,
  authorize('LANDLORD'),
  upload.array('images', 8),
  validate(createPropertySchema),
  propertiesController.create
);

landlordRouter.put(
  '/properties/:id',
  authenticate,
  authorize('LANDLORD'),
  upload.array('images', 8),
  validate(updatePropertySchema),
  propertiesController.update
);

landlordRouter.delete(
  '/properties/:id',
  authenticate,
  authorize('LANDLORD'),
  validate(propertyIdParamSchema),
  propertiesController.remove
);

export { publicRouter as propertiesRouter, landlordRouter };
