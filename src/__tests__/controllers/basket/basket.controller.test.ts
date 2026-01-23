import { Request, Response } from 'express';
import { getBasket } from '../../../controllers/basket/basket.controller';
import { sendResponse, sendError } from '../../../utils/response';
import { ErrorCodes } from '../../../utils/errors';
import { getBasketService } from '../../../services/basket/basket.service';
import { basketRepository } from '../../../repositories';

// Mock dependencies
jest.mock('../../../utils/response');
jest.mock('../../../services/basket/basket.service');
jest.mock('../../../repositories');

describe('Basket Controller - getBasket', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
        // Setup mock request and response
        mockRequest = {
            params: { basketId: 'basket123' }
        };
        
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };

        // Spy on console.error to suppress output
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

        // Clear all mocks before each test
        jest.clearAllMocks();
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
    });

    describe('Successful basket retrieval', () => {
        it('should return basket data when basket exists', async () => {
            // Arrange
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
            (getBasketService as jest.Mock).mockReturnValue(mockServiceData);

            // Act
            await getBasket(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(basketRepository.findById).toHaveBeenCalledWith('basket123');
            expect(getBasketService).toHaveBeenCalledWith(mockBasket);
            expect(sendResponse).toHaveBeenCalledWith(
                mockResponse,
                true,
                mockServiceData,
                'Basket retrieved successfully'
            );
            expect(sendError).not.toHaveBeenCalled();
        });
    });

    describe('Basket not found', () => {
        it('should return BASKET_NOT_FOUND error when basket does not exist', async () => {
            // Arrange
            (basketRepository.findById as jest.Mock).mockResolvedValue(null);

            // Act
            await getBasket(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(basketRepository.findById).toHaveBeenCalledWith('basket123');
            expect(getBasketService).not.toHaveBeenCalled();
            expect(sendError).toHaveBeenCalledWith(
                mockResponse,
                ErrorCodes.BASKET_NOT_FOUND
            );
            expect(sendResponse).not.toHaveBeenCalled();
        });

        it('should return BASKET_NOT_FOUND when basket is undefined', async () => {
            // Arrange
            (basketRepository.findById as jest.Mock).mockResolvedValue(undefined);

            // Act
            await getBasket(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(sendError).toHaveBeenCalledWith(
                mockResponse,
                ErrorCodes.BASKET_NOT_FOUND
            );
        });
    });

    describe('Error handling', () => {
        it('should handle repository errors and return SERVER_ERROR', async () => {
            // Arrange
            const dbError = new Error('Database connection failed');
            (basketRepository.findById as jest.Mock).mockRejectedValue(dbError);

            // Act
            await getBasket(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(console.error).toHaveBeenCalledWith('getBasket error:', dbError);
            expect(sendError).toHaveBeenCalledWith(
                mockResponse,
                ErrorCodes.SERVER_ERROR
            );
        });

        it('should handle service errors and return SERVER_ERROR', async () => {
            // Arrange
            const mockBasket = { basketId: 'basket123' };
            const serviceError = new Error('Service processing failed');
            
            (basketRepository.findById as jest.Mock).mockResolvedValue(mockBasket);
            (getBasketService as jest.Mock).mockImplementation(() => {
                throw serviceError;
            });

            // Act
            await getBasket(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(console.error).toHaveBeenCalledWith('getBasket error:', serviceError);
            expect(sendError).toHaveBeenCalledWith(
                mockResponse,
                ErrorCodes.SERVER_ERROR
            );
        });
    });

    describe('Input validation edge cases', () => {
        it('should handle empty basketId string', async () => {
            // Arrange
            mockRequest.params = { basketId: '' };
            (basketRepository.findById as jest.Mock).mockResolvedValue(null);

            // Act
            await getBasket(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(basketRepository.findById).toHaveBeenCalledWith('');
            expect(sendError).toHaveBeenCalledWith(
                mockResponse,
                ErrorCodes.BASKET_NOT_FOUND
            );
        });

        it('should handle special characters in basketId', async () => {
            // Arrange
            mockRequest.params = { basketId: 'basket-123_test' };
            const mockBasket = { basketId: 'basket-123_test' };
            
            (basketRepository.findById as jest.Mock).mockResolvedValue(mockBasket);
            (getBasketService as jest.Mock).mockReturnValue({ basketId: 'basket-123_test' });

            // Act
            await getBasket(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(basketRepository.findById).toHaveBeenCalledWith('basket-123_test');
            expect(sendResponse).toHaveBeenCalled();
        });
    });
});