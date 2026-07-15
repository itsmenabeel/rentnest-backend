import { Router } from 'express';
import { categoriesController } from './categories.controller';

const router = Router();

router.get('/', categoriesController.getAll);

export default router;
