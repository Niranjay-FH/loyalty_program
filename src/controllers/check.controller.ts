import { Request, Response } from 'express';

import { sendResponse, sendError } from '../utils/response';
import { ErrorCodes } from '../utils/errors';
import { canRedeemPoints } from '../utils/discount';

import { getLoyaltyInfo } from '../services/loyalty.check';

import { 
    customerRepository, 
    basketRepository, 
    storeRepository
} from '../repositories';

import { 
    customerSchema, 
    storeSchema,
    loyaltyCheckResponseSchema
} from '../validation/schemas';

export const checkBasket = async (req: Request, res: Response) => {
    try {
        const basketId = req.params.basketId as string;
        
        const basket = await basketRepository.findById(basketId);
        if (!basket) {
            return sendError(res, ErrorCodes.BASKET_NOT_FOUND);
        }

        if (!basket.customerId || !basket.storeId) {
            return sendError(res, ErrorCodes.BASKET_CHECK_INVALID);
        }

        const store = await storeRepository.findById(basket.storeId);
        if (!store?.loyaltyPartner?.enabled) {
            return sendError(res, ErrorCodes.STORE_NO_LOYALTY, {
                storeId: basket.storeId,
                message: 'Store does not participate in loyalty program'
            });
        }

        const validatedStore = storeSchema.parse(store);

        const partnerId = validatedStore.loyaltyPartner?.partnerId;
        if (!partnerId) {
            return sendError(res, ErrorCodes.STORE_NO_LOYALTY, {
                storeId: basket.storeId,
                message: 'Store has no associated loyalty partner'
            });
        }

        const customer = await customerRepository.findById(basket.customerId);
        
        if (!customer) {
            return sendError(res, ErrorCodes.CUSTOMER_NOT_FOUND);
        }

        const validatedCustomer = customerSchema.parse(customer);

        // Check if customer is enrolled with this partner
        const loyaltyInfo = validatedCustomer.loyaltyInfo.find(
            info => info.partnerId === partnerId
        );

        if (!loyaltyInfo) {
            return sendError(res, ErrorCodes.CUSTOMER_NOT_ENROLLED, {
                customerId: validatedCustomer.customerId,
                storeId: validatedStore.storeId,
                partnerId: partnerId,
                reason: 'Customer not enrolled in this loyalty program'
            });
        }

        const data = getLoyaltyInfo(validatedCustomer, basket, validatedStore);
        
        if (!data.loyalty.canRedeem) {
            const validation = canRedeemPoints(validatedCustomer, basket, validatedStore);
            
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
                customerId: validatedCustomer.customerId,
                storeId: validatedStore.storeId,
                partnerId: partnerId,
                reason: validation.reason
            });
        }
        
        const validatedResponse = loyaltyCheckResponseSchema.parse(data);
        
        sendResponse(res, true, validatedResponse, 'Customer can redeem points');

    } catch(error) {
        console.error('checkBasket error:', error);
        return sendError(res, ErrorCodes.BASKET_CHECK_INVALID);
    }
};