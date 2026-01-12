import { Request, Response } from 'express';

import { sendResponse, sendError } from '../utils/response';
import { ErrorCodes } from '../utils/errors';

import { getLoyaltyInfo } from '../services/loyalty.check';
import { redeemPointsService } from '../services/loyalty.redeem';
import { completeOrderService } from '../services/loyalty.complete';

import { 
    customerRepository, 
    basketRepository, 
    pointsLedgerRepository 
} from '../repositories';

export const checkBasket = async (req: Request, res: Response) => {
    try {
        const basketId = req.params.basketId as string;
        
        // Use repository to find basket
        const basket = await basketRepository.findById(basketId);
        if (!basket) {
            return sendError(res, ErrorCodes.BASKET_NOT_FOUND);
        }

        // Use repository to find customer
        const customer = await customerRepository.findById(basket.customerId);
        if (!customer) {
            return sendError(res, ErrorCodes.CUSTOMER_NOT_FOUND);
        }

        const data = getLoyaltyInfo(customer, basket);
        sendResponse(res, true, data, 'Customer Can Redeem Points');

    } catch(error) {
        console.error(error);
        return sendError(res, ErrorCodes.BASKET_CHECK_INVALID);
    }
};

export const redeemPoints = async (req: Request, res: Response) => {
    try {
        const basketId = req.params.basketId as string;
        const { toRedeem } = req.body;

        // Find basket id
        const basket = await basketRepository.findById(basketId);
        if (!basket) {
            return sendError(res, ErrorCodes.BASKET_NOT_FOUND);
        }

        // Find customer id
        const customer = await customerRepository.findById(basket.customerId);
        if (!customer) {
            return sendError(res, ErrorCodes.CUSTOMER_NOT_FOUND);
        }

        // Validate discount amount
        if (![200, 400, 600].includes(toRedeem)) {
            return sendError(res, ErrorCodes.INVALID_DISCOUNT_AMOUNT, {
                allowed: [200, 400, 600],
                requested: toRedeem
            });
        }

        // Validate customer points
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
        
        // Find basket id
        const basket = await basketRepository.findById(basketId);
        if (!basket) {
            return sendError(res, ErrorCodes.BASKET_NOT_FOUND);
        }

        // Find customer id
        const customer = await customerRepository.findById(basket.customerId);
        if (!customer) {
            return sendError(res, ErrorCodes.CUSTOMER_NOT_FOUND);
        }

        const data = await completeOrderService(
            customer, 
            basket,
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