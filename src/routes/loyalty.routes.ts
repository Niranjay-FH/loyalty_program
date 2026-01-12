import { Router } from 'express';
import { verifyFoodhub } from '../middleware/auth.middleware';
import { checkBasket, redeemPoints, completeOrder } from '../controllers/loyaty.controller';

const router = Router();

router.post('/basket/:basketId/check', verifyFoodhub, checkBasket);
router.post('/basket/:basketId/redeem', verifyFoodhub, redeemPoints);
router.post('/basket/:basketId/complete', verifyFoodhub, completeOrder);

export default router;