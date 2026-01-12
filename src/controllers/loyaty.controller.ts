import { Request, Response } from 'express';
import { getBasketDetails, getCustomerDetails } from '../utils/data';
import { sendResponse, sendError } from '../utils/response';
import { ErrorCodes } from '../utils/errors';
import { LoyaltyService } from '../services/loyalty.services';

export const checkBasket = (req: Request, res: Response) => {
    try {
        const basketId = req.params.basketId as string;
        const basket = getBasketDetails(basketId);
        
        if (!basket) {
            return sendError(res, ErrorCodes.BASKET_NOT_FOUND);
        }

        const customer = getCustomerDetails(basket);
        if (!customer) {
            return sendError(res, ErrorCodes.CUSTOMER_NOT_FOUND);
        }

        const data = LoyaltyService.getLoyaltyInfo(customer, basket);
        sendResponse(res, true, data, 'Customer Can Redeem Points');

    } catch(error) {
        console.error(error);
        return sendError(res, ErrorCodes.BASKET_CHECK_INVALID);
    }
};

export const redeemPoints = (req: Request, res: Response) => {
    try {
        const basketId = req.params.basketId as string;
        const { toRedeem } = req.body;

        const basket = getBasketDetails(basketId);
        if (!basket) {
            return sendError(res, ErrorCodes.BASKET_NOT_FOUND);
        }

        const customer = getCustomerDetails(basket);
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

        const data = LoyaltyService.redeemPoints(customer, basket, toRedeem);
        sendResponse(res, true, data, 'Points Redeemed Successfully');

    } catch(error) {
        console.error(error);
        return sendError(res, ErrorCodes.SERVER_ERROR);
    }
};

export const completeOrder = (req: Request, res: Response) => {
    try {
        const basketId = req.params.basketId as string;
        
        const basket = getBasketDetails(basketId);
        if (!basket) {
            return sendError(res, ErrorCodes.BASKET_NOT_FOUND);
        }

        const customer = getCustomerDetails(basket);
        if (!customer) {
            return sendError(res, ErrorCodes.CUSTOMER_NOT_FOUND);
        }

        const data = LoyaltyService.completeOrder(customer, basket);
        sendResponse(res, true, data, 'Order Completed');

    } catch(error) {
        console.error(error);
        return sendError(res, ErrorCodes.SERVER_ERROR);
    }
};