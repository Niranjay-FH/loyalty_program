import { Request, Response } from 'express';

import { sendResponse, sendError } from '../../utils/response';
import { ErrorCodes } from '../../utils/errors';

import { redeemPointsService } from '../../services/loyalty/loyalty.redeem';

import { 
    customerRepository, 
    basketRepository, 
    pointsLedgerRepository,
    storeRepository
} from '../../repositories';

import { 
    customerSchema, 
    storeSchema,
    loyaltyRedeemResponseSchema
} from '../../validation/schemas';

export const redeemPoints = async (req: Request, res: Response) => {
    try {
        const basketId = req.params.basketId as string;
        const { toRedeem } = req.body;

        const basket = await basketRepository.findById(basketId);
        if (!basket) {
            return sendError(res, ErrorCodes.BASKET_NOT_FOUND);
        }

        if (!basket.basketId || !basket.customerId || !basket.storeId || basket.total === undefined) {
            return sendError(res, ErrorCodes.BASKET_CHECK_INVALID);
        }

        const store = await storeRepository.findById(basket.storeId);
        if (!store?.loyaltyPartner?.enabled) {
            return sendError(res, ErrorCodes.STORE_NO_LOYALTY);
        }

        const validatedStore = storeSchema.parse(store);

        const partnerId = validatedStore.loyaltyPartner?.partnerId;
        if (!partnerId) {
            return sendError(res, ErrorCodes.STORE_NO_LOYALTY);
        }

        const customer = await customerRepository.findById(basket.customerId);
        
        if (!customer) {
            return sendError(res, ErrorCodes.CUSTOMER_NOT_FOUND);
        }

        const validatedCustomer = customerSchema.parse(customer);

        const loyaltyInfo = validatedCustomer.loyaltyInfo.find(
            info => info.partnerId === partnerId
        );

        if (!loyaltyInfo) {
            return sendError(res, ErrorCodes.CUSTOMER_NOT_ENROLLED, {
                partnerId: partnerId
            });
        }

        const allowedDiscounts = validatedStore.loyaltyPartner.allowedDiscounts || [];
        if (!allowedDiscounts.includes(toRedeem)) {
            return sendError(res, ErrorCodes.INVALID_DISCOUNT_AMOUNT, {
                allowed: allowedDiscounts,
                requested: toRedeem
            });
        }

        if (validatedCustomer.points < toRedeem) {
            return sendError(res, ErrorCodes.INSUFFICIENT_POINTS, {
                available: validatedCustomer.points,
                required: toRedeem
            });
        }

        const data = await redeemPointsService(
            validatedCustomer, 
            basket, 
            toRedeem,
            validatedStore,
            customerRepository,
            basketRepository,
            pointsLedgerRepository
        );
        
        const validatedResponse = loyaltyRedeemResponseSchema.parse(data);
        
        sendResponse(res, true, validatedResponse, 'Points Redeemed Successfully');

    } catch(error) {
        console.error('redeemPoints error:', error);
        return sendError(res, ErrorCodes.SERVER_ERROR);
    }
};