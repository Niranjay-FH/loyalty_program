import { Request, Response } from 'express';
import { redeemPoints } from '../../../controllers/loyalty/redeem.controller';
import { sendResponse, sendError } from '../../../utils/response';
import { ErrorCodes } from '../../../utils/errors';
import { redeemPointsService } from '../../../services/loyalty/loyalty.redeem';
import {
    customerRepository,
    basketRepository,
    pointsLedgerRepository,
    storeRepository
} from '../../../repositories';

// Mock dependencies
jest.mock('../../../utils/response');
jest.mock('../../../services/loyalty/loyalty.redeem');
jest.mock('../../../repositories');

describe('Loyalty Controller - redeemPoints', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let consoleErrorSpy: jest.SpyInstance;

    const mockCustomer = {
        customerId: 1,
        phone: '1234567890',
        name: 'John Doe',
        points: 500,
        totalSpent: 5000,
        orderCount: 10,
        birthday: '1990-01-15',
        tier: 'gold',
        status: 'active',
        loyaltyInfo: [{
            storeId: 'store1',
            partnerId: 'partner1',
            noOrders: 5,
            membership: {
                status: 'active',
                joinedDate: '2023-01-01',
                expiryDate: '2025-12-31'
            }
        }]
    };

    const mockStore = {
        storeId: 'store1',
        name: 'Test Store',
        location: { lat: 0, lng: 0, city: 'Test City' },
        active: true,
        loyaltyPartner: {
            enabled: true,
            partnerId: 'partner1',
            rewardRate: 0.1,
            discountType: 'cash' as const,
            allowedDiscounts: [50, 100, 200],
            validationRules: {
                minOrders: 3,
                maxPointsExpiryDays: 365
            }
        }
    };

    const mockBasket = {
        basketId: 'basket123',
        customerId: 1,
        restaurantId: 'rest1',
        storeId: 'store1',
        total: 500
    };

    beforeEach(() => {
        mockRequest = {
            params: { basketId: 'basket123' },
            body: { toRedeem: 100 }
        };

        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };

        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        jest.clearAllMocks();
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
    });

    describe('Successful redemption', () => {
        it('should redeem points successfully', async () => {
            // Arrange
            const mockRedeemData = {
                lookupChain: {
                    basketId: 'basket123',
                    customerId: 1,
                    phone: '1234567890',
                    restaurantId: 'rest1',
                    storeId: 'store1',
                    partnerId: 'partner1'
                },
                basket: {
                    originalTotal: 500,
                    updatedTotal: 400,
                    pointsDiscount: 100
                },
                loyalty: {
                    remainingPoints: 400,
                    pointsUsed: 100
                }
            };

            (basketRepository.findById as jest.Mock).mockResolvedValue(mockBasket);
            (storeRepository.findById as jest.Mock).mockResolvedValue(mockStore);
            (customerRepository.findById as jest.Mock).mockResolvedValue(mockCustomer);
            (redeemPointsService as jest.Mock).mockResolvedValue(mockRedeemData);

            // Act
            await redeemPoints(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(basketRepository.findById).toHaveBeenCalledWith('basket123');
            expect(storeRepository.findById).toHaveBeenCalledWith('store1');
            expect(customerRepository.findById).toHaveBeenCalledWith(1);
            expect(redeemPointsService).toHaveBeenCalledWith(
                mockCustomer,
                mockBasket,
                100,
                mockStore,
                customerRepository,
                basketRepository,
                pointsLedgerRepository
            );
            expect(sendResponse).toHaveBeenCalledWith(
                mockResponse,
                true,
                mockRedeemData,
                'Points Redeemed Successfully'
            );
        });
    });

    describe('Basket validation errors', () => {
        it('should return BASKET_NOT_FOUND when basket does not exist', async () => {
            // Arrange
            (basketRepository.findById as jest.Mock).mockResolvedValue(null);

            // Act
            await redeemPoints(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(sendError).toHaveBeenCalledWith(
                mockResponse,
                ErrorCodes.BASKET_NOT_FOUND
            );
        });

        it('should return BASKET_CHECK_INVALID when basketId is missing', async () => {
            // Arrange
            const invalidBasket = { ...mockBasket, basketId: undefined };
            (basketRepository.findById as jest.Mock).mockResolvedValue(invalidBasket);

            // Act
            await redeemPoints(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(sendError).toHaveBeenCalledWith(
                mockResponse,
                ErrorCodes.BASKET_CHECK_INVALID
            );
        });

        it('should return BASKET_CHECK_INVALID when customerId is missing', async () => {
            // Arrange
            const invalidBasket = { ...mockBasket, customerId: undefined };
            (basketRepository.findById as jest.Mock).mockResolvedValue(invalidBasket);

            // Act
            await redeemPoints(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(sendError).toHaveBeenCalledWith(
                mockResponse,
                ErrorCodes.BASKET_CHECK_INVALID
            );
        });

        it('should return BASKET_CHECK_INVALID when storeId is missing', async () => {
            // Arrange
            const invalidBasket = { ...mockBasket, storeId: undefined };
            (basketRepository.findById as jest.Mock).mockResolvedValue(invalidBasket);

            // Act
            await redeemPoints(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(sendError).toHaveBeenCalledWith(
                mockResponse,
                ErrorCodes.BASKET_CHECK_INVALID
            );
        });

        it('should return BASKET_CHECK_INVALID when total is undefined', async () => {
            // Arrange
            const invalidBasket = { ...mockBasket, total: undefined };
            (basketRepository.findById as jest.Mock).mockResolvedValue(invalidBasket);

            // Act
            await redeemPoints(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(sendError).toHaveBeenCalledWith(
                mockResponse,
                ErrorCodes.BASKET_CHECK_INVALID
            );
        });
    });

    describe('Store validation errors', () => {
        it('should return STORE_NO_LOYALTY when store has loyalty disabled', async () => {
            // Arrange
            const storeNoLoyalty = {
                ...mockStore,
                loyaltyPartner: { ...mockStore.loyaltyPartner, enabled: false }
            };

            (basketRepository.findById as jest.Mock).mockResolvedValue(mockBasket);
            (storeRepository.findById as jest.Mock).mockResolvedValue(storeNoLoyalty);

            // Act
            await redeemPoints(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(sendError).toHaveBeenCalledWith(
                mockResponse,
                ErrorCodes.STORE_NO_LOYALTY
            );
        });

        it('should return STORE_NO_LOYALTY when partnerId is missing', async () => {
            // Arrange
            const storeNoPartner = {
                ...mockStore,
                loyaltyPartner: { ...mockStore.loyaltyPartner, partnerId: undefined }
            };

            (basketRepository.findById as jest.Mock).mockResolvedValue(mockBasket);
            (storeRepository.findById as jest.Mock).mockResolvedValue(storeNoPartner);

            // Act
            await redeemPoints(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(sendError).toHaveBeenCalledWith(
                mockResponse,
                ErrorCodes.STORE_NO_LOYALTY
            );
        });
    });

    describe('Customer validation errors', () => {
        it('should return CUSTOMER_NOT_FOUND when customer does not exist', async () => {
            // Arrange
            (basketRepository.findById as jest.Mock).mockResolvedValue(mockBasket);
            (storeRepository.findById as jest.Mock).mockResolvedValue(mockStore);
            (customerRepository.findById as jest.Mock).mockResolvedValue(null);

            // Act
            await redeemPoints(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(sendError).toHaveBeenCalledWith(
                mockResponse,
                ErrorCodes.CUSTOMER_NOT_FOUND
            );
        });

        it('should return CUSTOMER_NOT_ENROLLED when customer not enrolled with partner', async () => {
            // Arrange
            const customerNotEnrolled = {
                ...mockCustomer,
                loyaltyInfo: [{
                    ...mockCustomer.loyaltyInfo[0],
                    partnerId: 'different-partner'
                }]
            };

            (basketRepository.findById as jest.Mock).mockResolvedValue(mockBasket);
            (storeRepository.findById as jest.Mock).mockResolvedValue(mockStore);
            (customerRepository.findById as jest.Mock).mockResolvedValue(customerNotEnrolled);

            // Act
            await redeemPoints(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(sendError).toHaveBeenCalledWith(
                mockResponse,
                ErrorCodes.CUSTOMER_NOT_ENROLLED,
                { partnerId: 'partner1' }
            );
        });

        it('should return INSUFFICIENT_POINTS when customer has insufficient points', async () => {
            // Arrange
            const customerLowPoints = { ...mockCustomer, points: 50 };

            (basketRepository.findById as jest.Mock).mockResolvedValue(mockBasket);
            (storeRepository.findById as jest.Mock).mockResolvedValue(mockStore);
            (customerRepository.findById as jest.Mock).mockResolvedValue(customerLowPoints);

            // Act
            await redeemPoints(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(sendError).toHaveBeenCalledWith(
                mockResponse,
                ErrorCodes.INSUFFICIENT_POINTS,
                {
                    available: 50,
                    required: 100
                }
            );
        });
    });

    describe('Discount validation errors', () => {
        it('should return INVALID_DISCOUNT_AMOUNT when discount not in allowed list', async () => {
            // Arrange
            mockRequest.body = { toRedeem: 75 }; // Not in [50, 100, 200]

            (basketRepository.findById as jest.Mock).mockResolvedValue(mockBasket);
            (storeRepository.findById as jest.Mock).mockResolvedValue(mockStore);
            (customerRepository.findById as jest.Mock).mockResolvedValue(mockCustomer);

            // Act
            await redeemPoints(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(sendError).toHaveBeenCalledWith(
                mockResponse,
                ErrorCodes.INVALID_DISCOUNT_AMOUNT,
                {
                    allowed: [50, 100, 200],
                    requested: 75
                }
            );
        });

        it('should handle empty allowedDiscounts array', async () => {
            // Arrange
            const storeNoDiscounts = {
                ...mockStore,
                loyaltyPartner: { ...mockStore.loyaltyPartner, allowedDiscounts: [] }
            };

            (basketRepository.findById as jest.Mock).mockResolvedValue(mockBasket);
            (storeRepository.findById as jest.Mock).mockResolvedValue(storeNoDiscounts);
            (customerRepository.findById as jest.Mock).mockResolvedValue(mockCustomer);

            // Act
            await redeemPoints(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(sendError).toHaveBeenCalledWith(
                mockResponse,
                ErrorCodes.INVALID_DISCOUNT_AMOUNT,
                {
                    allowed: [],
                    requested: 100
                }
            );
        });
    });

    describe('Edge cases', () => {
        it('should handle redemption with exact points match', async () => {
            // Arrange
            const customerExactPoints = { ...mockCustomer, points: 100 };
            mockRequest.body = { toRedeem: 100 };

            const mockRedeemData = {
                lookupChain: {
                    basketId: 'basket123',
                    customerId: 1,
                    phone: '1234567890',
                    restaurantId: 'rest1',
                    storeId: 'store1'
                },
                basket: {
                    originalTotal: 500,
                    updatedTotal: 400,
                    pointsDiscount: 100
                },
                loyalty: {
                    remainingPoints: 0,
                    pointsUsed: 100
                }
            };

            (basketRepository.findById as jest.Mock).mockResolvedValue(mockBasket);
            (storeRepository.findById as jest.Mock).mockResolvedValue(mockStore);
            (customerRepository.findById as jest.Mock).mockResolvedValue(customerExactPoints);
            (redeemPointsService as jest.Mock).mockResolvedValue(mockRedeemData);

            // Act
            await redeemPoints(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(sendResponse).toHaveBeenCalledWith(
                mockResponse,
                true,
                mockRedeemData,
                'Points Redeemed Successfully'
            );
        });

        it('should handle maximum allowed discount', async () => {
            // Arrange
            const customerHighPoints = { ...mockCustomer, points: 1000 };
            mockRequest.body = { toRedeem: 200 };

            const mockRedeemData = {
                lookupChain: {
                    basketId: 'basket123',
                    customerId: 1,
                    phone: '1234567890',
                    restaurantId: 'rest1',
                    storeId: 'store1'
                },
                basket: {
                    originalTotal: 500,
                    updatedTotal: 300,
                    pointsDiscount: 200
                },
                loyalty: {
                    remainingPoints: 800,
                    pointsUsed: 200
                }
            };

            (basketRepository.findById as jest.Mock).mockResolvedValue(mockBasket);
            (storeRepository.findById as jest.Mock).mockResolvedValue(mockStore);
            (customerRepository.findById as jest.Mock).mockResolvedValue(customerHighPoints);
            (redeemPointsService as jest.Mock).mockResolvedValue(mockRedeemData);

            // Act
            await redeemPoints(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(sendResponse).toHaveBeenCalled();
        });
    });

    describe('Error handling', () => {
        it('should handle service errors and return SERVER_ERROR', async () => {
            // Arrange
            const serviceError = new Error('Service failed');

            (basketRepository.findById as jest.Mock).mockResolvedValue(mockBasket);
            (storeRepository.findById as jest.Mock).mockResolvedValue(mockStore);
            (customerRepository.findById as jest.Mock).mockResolvedValue(mockCustomer);
            (redeemPointsService as jest.Mock).mockRejectedValue(serviceError);

            // Act
            await redeemPoints(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(console.error).toHaveBeenCalledWith('redeemPoints error:', serviceError);
            expect(sendError).toHaveBeenCalledWith(
                mockResponse,
                ErrorCodes.SERVER_ERROR
            );
        });

        it('should handle database errors and return SERVER_ERROR', async () => {
            // Arrange
            const dbError = new Error('Database connection failed');
            (basketRepository.findById as jest.Mock).mockRejectedValue(dbError);

            // Act
            await redeemPoints(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(console.error).toHaveBeenCalledWith('redeemPoints error:', dbError);
            expect(sendError).toHaveBeenCalledWith(
                mockResponse,
                ErrorCodes.SERVER_ERROR
            );
        });
    });
});