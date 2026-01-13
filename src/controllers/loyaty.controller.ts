import { Request, Response } from 'express';

import { sendResponse, sendError } from '../utils/response';
import { ErrorCodes } from '../utils/errors';
import { canRedeemPoints } from '../utils/discount';

import { getLoyaltyInfo } from '../services/loyalty.check';
import { redeemPointsService } from '../services/loyalty.redeem';
import { completeOrderService } from '../services/loyalty.complete';

import { 
    customerRepository, 
    basketRepository, 
    pointsLedgerRepository,
    storeRepository
} from '../repositories';

export const checkBasket = async (req: Request, res: Response) => {
    try {
        const basketId = req.params.basketId as string;
        
        const basket = await basketRepository.findById(basketId);
        if (!basket) {
            return sendError(res, ErrorCodes.BASKET_NOT_FOUND);
        }

        const customer = await customerRepository.findById(basket.customerId);
        if (!customer) {
            return sendError(res, ErrorCodes.CUSTOMER_NOT_FOUND);
        }

        const store = await storeRepository.findById(basket.storeId);
        if (!store?.loyaltyPartner?.enabled) {
            return sendError(res, ErrorCodes.STORE_NO_LOYALTY, {
                storeId: basket.storeId,
                message: 'Store does not participate in loyalty program'
            });
        }

        const data = getLoyaltyInfo(customer, basket, store);
        
        // Check if customer can redeem
        if (!data.loyalty.canRedeem) {
            // Map the validation reason to appropriate error code
            const validation = canRedeemPoints(customer, basket, store);
            
            let errorCode = ErrorCodes.CANNOT_REDEEM;
            
            if (validation.reason?.includes('not enrolled')) {
                errorCode = ErrorCodes.CUSTOMER_NOT_ENROLLED;
            } else if (validation.reason?.includes('expired')) {
                errorCode = ErrorCodes.MEMBERSHIP_EXPIRED;
            } else if (validation.reason?.includes('not active')) {
                errorCode = ErrorCodes.MEMBERSHIP_INACTIVE;
            } else if (validation.reason?.includes('orders required')) {
                errorCode = ErrorCodes.MIN_ORDERS_NOT_MET;
            } else if (validation.reason?.includes('Insufficient points')) {
                errorCode = ErrorCodes.INSUFFICIENT_POINTS;
            }
            
            return sendError(res, errorCode, {
                customerId: customer.customerId,
                storeId: store.storeId,
                reason: validation.reason
            });
        }
        
        // Customer can redeem
        sendResponse(res, true, data, 'Customer can redeem points');

    } catch(error) {
        console.error(error);
        return sendError(res, ErrorCodes.BASKET_CHECK_INVALID);
    }
};

export const redeemPoints = async (req: Request, res: Response) => {
    try {
        const basketId = req.params.basketId as string;
        const { toRedeem } = req.body;

        const basket = await basketRepository.findById(basketId);
        if (!basket) {
            return sendError(res, ErrorCodes.BASKET_NOT_FOUND);
        }

        const customer = await customerRepository.findById(basket.customerId);
        if (!customer) {
            return sendError(res, ErrorCodes.CUSTOMER_NOT_FOUND);
        }

        // ✅ NEW: Verify store + allowed discounts
        const store = await storeRepository.findById(basket.storeId);
        if (!store?.loyaltyPartner?.enabled) {
            return sendError(res, ErrorCodes.STORE_NO_LOYALTY);
        }

        const allowedDiscounts = store.loyaltyPartner.allowedDiscounts || [];
        if (!allowedDiscounts.includes(toRedeem)) {
            return sendError(res, ErrorCodes.INVALID_DISCOUNT_AMOUNT, {
                allowed: allowedDiscounts,
                requested: toRedeem
            });
        }

        if (customer.points < toRedeem) {
            return sendError(res, ErrorCodes.INSUFFICIENT_POINTS, {
                available: customer.points,
                required: toRedeem
            });
        }

        const data = await redeemPointsService(
            customer, 
            basket, 
            toRedeem,
            store,  // ✅ PASS STORE
            customerRepository,
            basketRepository,
            pointsLedgerRepository
        );
        
        sendResponse(res, true, data, 'Points Redeemed Successfully');

    } catch(error) {
        console.error(error);
        return sendError(res, ErrorCodes.SERVER_ERROR);
    }
};

export const completeOrder = async (req: Request, res: Response) => {
    try {
        const basketId = req.params.basketId as string;
        
        const basket = await basketRepository.findById(basketId);
        if (!basket) {
            return sendError(res, ErrorCodes.BASKET_NOT_FOUND);
        }

        const customer = await customerRepository.findById(basket.customerId);
        if (!customer) {
            return sendError(res, ErrorCodes.CUSTOMER_NOT_FOUND);
        }

        // ✅ NEW: Verify store for points earning
        const store = await storeRepository.findById(basket.storeId);
        if (!store?.loyaltyPartner?.enabled) {
            // Still complete order, just no points
            return sendResponse(res, true, { 
                message: 'Order completed (no loyalty program at this store)' 
            }, 'Order Completed');
        }

        const data = await completeOrderService(
            customer, 
            basket,
            store,  // ✅ PASS STORE
            customerRepository,
            basketRepository,
            pointsLedgerRepository
        );
        
        sendResponse(res, true, data, 'Order Completed');

    } catch(error) {
        console.error(error);
        return sendError(res, ErrorCodes.SERVER_ERROR);
    }
};