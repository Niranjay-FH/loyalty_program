import { Router } from 'express';
import { getBasket } from '../controllers/basket/basket.controller';
import { validateParams } from '../middleware/validation.middleware';
import { basketIdSchema } from '../validation/schemas';
import { verifyProvider } from '../middleware/auth.middleware';

const router = Router();

// Get basket by ID
router.get(
    '/:basketId',
    verifyProvider(),
    validateParams(basketIdSchema),
    getBasket
);

export default router;