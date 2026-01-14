import { Router } from 'express';
import { checkBasket, redeemPoints, completeOrder } from '../controllers';

import { validate } from '../middleware/validation.middleware';
import { 
    checkBasketRequestSchema,
    redeemPointsRequestSchema,
    completeOrderRequestSchema
} from '../validation/schemas';
import { verifyFoodhub } from '../middleware/auth.middleware';

const router = Router();

// Check loyalty information for a basket
router.get(
    '/basket/:basketId/check',
    verifyFoodhub,
    validate(checkBasketRequestSchema),
    checkBasket
);

// Redeem loyalty points for a basket
router.post(
    '/basket/:basketId/redeem',
    verifyFoodhub,
    validate(redeemPointsRequestSchema),
    redeemPoints
);

// Complete an order and award loyalty points
router.post(
    '/basket/:basketId/complete',
    verifyFoodhub,
    validate(completeOrderRequestSchema),
    completeOrder
);

export default router;