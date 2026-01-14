import { Request, Response } from 'express';

import { sendResponse, sendError } from '../utils/response';
import { ErrorCodes } from '../utils/errors';

import { completeOrderService } from '../services/loyalty.complete';

import { 
    customerRepository, 
    basketRepository, 
    pointsLedgerRepository,
    storeRepository
} from '../repositories';

import { 
    customerSchema, 
    storeSchema,
    loyaltyCompleteResponseSchema
} from '../validation/schemas';

export const completeOrder = async (req: Request, res: Response) => {
    try {
        const basketId = req.params.basketId as string;
        
        const basket = await basketRepository.findById(basketId);
        if (!basket) {
            return sendError(res, ErrorCodes.BASKET_NOT_FOUND);
        }

        if (!basket.basketId || !basket.customerId || !basket.storeId) {
            return sendError(res, ErrorCodes.BASKET_CHECK_INVALID);
        }

        const customer = await customerRepository.findById(basket.customerId);
        if (!customer) {
            return sendError(res, ErrorCodes.CUSTOMER_NOT_FOUND);
        }

        const validatedCustomer = customerSchema.parse(customer);

        const store = await storeRepository.findById(basket.storeId);
        if (!store?.loyaltyPartner?.enabled) {
            return sendResponse(res, true, { 
                message: 'Order completed (no loyalty program at this store)' 
            }, 'Order Completed');
        }

        const validatedStore = storeSchema.parse(store);

        const data = await completeOrderService(
            validatedCustomer, 
            basket,
            validatedStore,
            customerRepository,
            basketRepository,
            pointsLedgerRepository
        );
        
        const validatedResponse = loyaltyCompleteResponseSchema.parse(data);
        
        sendResponse(res, true, validatedResponse, 'Order Completed');

    } catch(error) {
        console.error('completeOrder error:', error);
        return sendError(res, ErrorCodes.SERVER_ERROR);
    }
};