import { Request, Response } from 'express';
import { sendResponse, sendError } from '../../utils/response';
import { ErrorCodes } from '../../utils/errors';
import { getBasketService } from '../../services/basket/basket.service';
import { basketRepository } from '../../repositories';

export const getBasket = async (req: Request, res: Response) => {
    try {
        const basketId = req.params.basketId as string;
        
        const basket = await basketRepository.findById(basketId);
        
        if (!basket) {
            return sendError(res, ErrorCodes.BASKET_NOT_FOUND);
        }

        const data = getBasketService(basket);
        
        sendResponse(res, true, data, 'Basket retrieved successfully');

    } catch(error) {
        console.error('getBasket error:', error);
        return sendError(res, ErrorCodes.SERVER_ERROR);
    }
};