import { Request, Response } from 'express';
import { getBasket } from '../../../controllers/basket/basket.controller';
import { sendResponse, sendError } from '../../../utils/response';
import { ErrorCodes } from '../../../utils/errors';
import { getBasketService } from '../../../services/basket/basket.service';
import { basketRepository } from '../../../repositories';

jest.mock('../../../utils/response');
jest.mock('../../../services/basket/basket.service');
jest.mock('../../../repositories');

describe("Basket Controller", () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
        // Mock request and response
        mockRequest = {
            params: { basketId: 'basket123' }
        };
            
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };

        // Spy on console.error to suppress output
        consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

        jest.clearAllMocks();
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
    });

    // Test case 1
    describe("Successful Basket Retreival", () => {
        it("should return basket data when basket exists", async () => {
            // Setup
            const mockBasket = {
                basketId: 'basket123',
                customerId: 1,
                restaurantId: 'rest1',
                storeId: 'store1',
                total: 100
            };

            const mockServiceData = {
                basketId: 'basket123',
                total: 100,
                items: []
            };

            (basketRepository.findById as jest.Mock).mockResolvedValue(mockBasket);
            (getBasketService as jest.Mock).mockReturnValue(mockServiceData)

            // Act
            await getBasket(mockRequest as Request, mockResponse as Response);

            // Verify
            expect(basketRepository.findById).toHaveBeenCalledWith('basket123');
            expect(getBasketService).toHaveBeenCalledWith(mockBasket);
            expect(sendResponse).toHaveBeenCalledWith(
                mockResponse,
                true,
                mockServiceData,
                'Basket retrieved successfully'
            );
            expect(sendError).not.toHaveBeenCalled();
        })
    });

    describe("Basket not found", () => {
        it("should return BASKET_NOT_FOUND error when basket does not exist", async () => {
            // Setup 
            (basketRepository.findById as jest.Mock).mockResolvedValue(null);

            // Act
            await getBasket(mockRequest as Request, mockResponse as Response);

            // Verify
            expect(basketRepository.findById).toHaveBeenCalledWith('basket123');
            expect(getBasketService).not.toHaveBeenCalled();
            expect(sendResponse).not.toHaveBeenCalled();
            expect(sendError).toHaveBeenCalledWith(
                mockResponse,
                ErrorCodes.BASKET_NOT_FOUND
            );
        });

        it("should return BASKET_NOT_FOUND error when basket is undefined", async () => {
            // Setup 
            (basketRepository.findById as jest.Mock).mockResolvedValue(undefined);

            // Act
            await getBasket(mockRequest as Request, mockResponse as Response);

            // Verify
            expect(getBasketService).not.toHaveBeenCalled();
            expect(sendResponse).not.toHaveBeenCalled();
            expect(sendError).toHaveBeenCalledWith(
                mockResponse,
                ErrorCodes.BASKET_NOT_FOUND
            );
        });
    });
})