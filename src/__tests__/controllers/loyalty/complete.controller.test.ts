import { Request, Response } from 'express';
import { completeOrder } from '../../../controllers/loyalty/complete.controller';
import { sendResponse, sendError } from '../../../utils/response';
import { ErrorCodes } from '../../../utils/errors';
import { completeOrderService } from '../../../services/loyalty/loyalty.complete';
import {
    customerRepository,
    basketRepository,
    pointsLedgerRepository,
    storeRepository
} from '../../../repositories';

// Mock dependencies
jest.mock('../../../utils/response');
jest.mock('../../../services/loyalty/loyalty.complete');
jest.mock('../../../repositories');

describe('Loyalty Controller - completeOrder', () => {
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
            params: { basketId: 'basket123' }
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

    describe('Successful order completion', () => {
        it('should complete order and award points successfully', async () => {
            // Arrange
            const mockCompleteData = {
                lookupChain: {
                    basketId: 'basket123',
                    customerId: 1,
                    phone: '1234567890',
                    restaurantId: 'rest1',
                    storeId: 'store1',
                    partnerId: 'partner1'
                },
                basket: {
                    total: 500,
                    updatedTotal: 400,
                    pointsDiscount: 100
                },
                loyalty: {
                    phone: '1234567890',
                    name: 'John Doe',
                    remainingPoints: 550,
                    tier: 'gold',
                    tierMultiplier: '2.0',
                    birthdayMultiplier: '1.0',
                    totalMultiplier: '2.0',
                    pointsEarned: 50
                }
            };

            (basketRepository.findById as jest.Mock).mockResolvedValue(mockBasket);
            (customerRepository.findById as jest.Mock).mockResolvedValue(mockCustomer);
            (storeRepository.findById as jest.Mock).mockResolvedValue(mockStore);
            (completeOrderService as jest.Mock).mockResolvedValue(mockCompleteData);

            // Act
            await completeOrder(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(basketRepository.findById).toHaveBeenCalledWith('basket123');
            expect(customerRepository.findById).toHaveBeenCalledWith(1);
            expect(storeRepository.findById).toHaveBeenCalledWith('store1');
            expect(completeOrderService).toHaveBeenCalledWith(
                mockCustomer,
                mockBasket,
                mockStore,
                customerRepository,
                basketRepository,
                pointsLedgerRepository
            );
            expect(sendResponse).toHaveBeenCalledWith(
                mockResponse,
                true,
                mockCompleteData,
                'Order Completed'
            );
        });

        it('should complete order without loyalty when store has no loyalty program', async () => {
            // Arrange
            const storeNoLoyalty = {
                ...mockStore,
                loyaltyPartner: { ...mockStore.loyaltyPartner, enabled: false }
            };

            (basketRepository.findById as jest.Mock).mockResolvedValue(mockBasket);
            (customerRepository.findById as jest.Mock).mockResolvedValue(mockCustomer);
            (storeRepository.findById as jest.Mock).mockResolvedValue(storeNoLoyalty);

            // Act
            await completeOrder(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(completeOrderService).not.toHaveBeenCalled();
            expect(sendResponse).toHaveBeenCalledWith(
                mockResponse,
                true,
                { message: 'Order completed (no loyalty program at this store)' },
                'Order Completed'
            );
        });

        it('should complete order without loyalty when store is null', async () => {
            // Arrange
            (basketRepository.findById as jest.Mock).mockResolvedValue(mockBasket);
            (customerRepository.findById as jest.Mock).mockResolvedValue(mockCustomer);
            (storeRepository.findById as jest.Mock).mockResolvedValue(null);

            // Act
            await completeOrder(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(completeOrderService).not.toHaveBeenCalled();
            expect(sendResponse).toHaveBeenCalledWith(
                mockResponse,
                true,
                { message: 'Order completed (no loyalty program at this store)' },
                'Order Completed'
            );
        });
    });

    describe('Basket validation errors', () => {
        it('should return BASKET_NOT_FOUND when basket does not exist', async () => {
            // Arrange
            (basketRepository.findById as jest.Mock).mockResolvedValue(null);

            // Act
            await completeOrder(mockRequest as Request, mockResponse as Response);

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
            await completeOrder(mockRequest as Request, mockResponse as Response);

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
            await completeOrder(mockRequest as Request, mockResponse as Response);

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
            await completeOrder(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(sendError).toHaveBeenCalledWith(
                mockResponse,
                ErrorCodes.BASKET_CHECK_INVALID
            );
        });

        it('should return BASKET_CHECK_INVALID when basketId is null', async () => {
            // Arrange
            const invalidBasket = { ...mockBasket, basketId: null };
            (basketRepository.findById as jest.Mock).mockResolvedValue(invalidBasket);

            // Act
            await completeOrder(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(sendError).toHaveBeenCalledWith(
                mockResponse,
                ErrorCodes.BASKET_CHECK_INVALID
            );
        });
    });

    describe('Customer validation errors', () => {
        it('should return CUSTOMER_NOT_FOUND when customer does not exist', async () => {
            // Arrange
            (basketRepository.findById as jest.Mock).mockResolvedValue(mockBasket);
            (customerRepository.findById as jest.Mock).mockResolvedValue(null);

            // Act
            await completeOrder(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(sendError).toHaveBeenCalledWith(
                mockResponse,
                ErrorCodes.CUSTOMER_NOT_FOUND
            );
        });
    });

    describe('Points calculation scenarios', () => {
        it('should handle birthday multiplier correctly', async () => {
            // Arrange
            const birthdayCustomer = {
                ...mockCustomer,
                birthday: new Date().toISOString().split('T')[0] // Today's date
            };

            const mockCompleteData = {
                lookupChain: {
                    basketId: 'basket123',
                    customerId: 1,
                    phone: '1234567890',
                    restaurantId: 'rest1',
                    storeId: 'store1'
                },
                basket: {
                    total: 500
                },
                loyalty: {
                    phone: '1234567890',
                    name: 'John Doe',
                    remainingPoints: 575,
                    tier: 'gold',
                    tierMultiplier: '2.0',
                    birthdayMultiplier: '1.5',
                    totalMultiplier: '3.0',
                    pointsEarned: 75
                }
            };

            (basketRepository.findById as jest.Mock).mockResolvedValue(mockBasket);
            (customerRepository.findById as jest.Mock).mockResolvedValue(birthdayCustomer);
            (storeRepository.findById as jest.Mock).mockResolvedValue(mockStore);
            (completeOrderService as jest.Mock).mockResolvedValue(mockCompleteData);

            // Act
            await completeOrder(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(sendResponse).toHaveBeenCalledWith(
                mockResponse,
                true,
                mockCompleteData,
                'Order Completed'
            );
        });

        it('should handle different tier multipliers', async () => {
            // Arrange
            const bronzeCustomer = {
                ...mockCustomer,
                tier: 'bronze',
                totalSpent: 300
            };

            const mockCompleteData = {
                lookupChain: {
                    basketId: 'basket123',
                    customerId: 1,
                    phone: '1234567890',
                    restaurantId: 'rest1',
                    storeId: 'store1'
                },
                basket: {
                    total: 500
                },
                loyalty: {
                    phone: '1234567890',
                    name: 'John Doe',
                    remainingPoints: 525,
                    tier: 'bronze',
                    tierMultiplier: '1.0',
                    birthdayMultiplier: '1.0',
                    totalMultiplier: '1.0',
                    pointsEarned: 25
                }
            };

            (basketRepository.findById as jest.Mock).mockResolvedValue(mockBasket);
            (customerRepository.findById as jest.Mock).mockResolvedValue(bronzeCustomer);
            (storeRepository.findById as jest.Mock).mockResolvedValue(mockStore);
            (completeOrderService as jest.Mock).mockResolvedValue(mockCompleteData);

            // Act
            await completeOrder(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(sendResponse).toHaveBeenCalled();
            expect(completeOrderService).toHaveBeenCalledWith(
                bronzeCustomer,
                mockBasket,
                mockStore,
                customerRepository,
                basketRepository,
                pointsLedgerRepository
            );
        });
    });

    describe('Order completion with discounts', () => {
        it('should complete order that had points redeemed', async () => {
            // Arrange
            const basketWithDiscount = {
                ...mockBasket,
                originalTotal: 500,
                updatedTotal: 400,
                pointsDiscount: 100
            };

            const mockCompleteData = {
                lookupChain: {
                    basketId: 'basket123',
                    customerId: 1,
                    phone: '1234567890',
                    restaurantId: 'rest1',
                    storeId: 'store1'
                },
                basket: {
                    total: 500,
                    updatedTotal: 400,
                    pointsDiscount: 100
                },
                loyalty: {
                    phone: '1234567890',
                    name: 'John Doe',
                    remainingPoints: 540,
                    tier: 'gold',
                    tierMultiplier: '2.0',
                    birthdayMultiplier: '1.0',
                    totalMultiplier: '2.0',
                    pointsEarned: 40
                }
            };

            (basketRepository.findById as jest.Mock).mockResolvedValue(basketWithDiscount);
            (customerRepository.findById as jest.Mock).mockResolvedValue(mockCustomer);
            (storeRepository.findById as jest.Mock).mockResolvedValue(mockStore);
            (completeOrderService as jest.Mock).mockResolvedValue(mockCompleteData);

            // Act
            await completeOrder(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(completeOrderService).toHaveBeenCalledWith(
                mockCustomer,
                basketWithDiscount,
                mockStore,
                customerRepository,
                basketRepository,
                pointsLedgerRepository
            );
            expect(sendResponse).toHaveBeenCalledWith(
                mockResponse,
                true,
                mockCompleteData,
                'Order Completed'
            );
        });
    });

    describe('Error handling', () => {
        it('should handle service errors and return SERVER_ERROR', async () => {
            // Arrange
            const serviceError = new Error('Service processing failed');

            (basketRepository.findById as jest.Mock).mockResolvedValue(mockBasket);
            (customerRepository.findById as jest.Mock).mockResolvedValue(mockCustomer);
            (storeRepository.findById as jest.Mock).mockResolvedValue(mockStore);
            (completeOrderService as jest.Mock).mockRejectedValue(serviceError);

            // Act
            await completeOrder(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(console.error).toHaveBeenCalledWith('completeOrder error:', serviceError);
            expect(sendError).toHaveBeenCalledWith(
                mockResponse,
                ErrorCodes.SERVER_ERROR
            );
        });

        it('should handle database errors and return SERVER_ERROR', async () => {
            // Arrange
            const dbError = new Error('Database connection lost');
            (basketRepository.findById as jest.Mock).mockRejectedValue(dbError);

            // Act
            await completeOrder(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(console.error).toHaveBeenCalledWith('completeOrder error:', dbError);
            expect(sendError).toHaveBeenCalledWith(
                mockResponse,
                ErrorCodes.SERVER_ERROR
            );
        });

        it('should handle validation schema errors', async () => {
            // Arrange
            const invalidCustomer = { ...mockCustomer, customerId: 'invalid' };

            (basketRepository.findById as jest.Mock).mockResolvedValue(mockBasket);
            (customerRepository.findById as jest.Mock).mockResolvedValue(invalidCustomer);

            // Act
            await completeOrder(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(sendError).toHaveBeenCalledWith(
                mockResponse,
                ErrorCodes.SERVER_ERROR
            );
        });
    });

    describe('Edge cases', () => {
        it('should handle zero points earned', async () => {
            // Arrange
            const mockCompleteData = {
                lookupChain: {
                    basketId: 'basket123',
                    customerId: 1,
                    phone: '1234567890',
                    restaurantId: 'rest1',
                    storeId: 'store1'
                },
                basket: {
                    total: 0
                },
                loyalty: {
                    phone: '1234567890',
                    name: 'John Doe',
                    remainingPoints: 500,
                    tier: 'gold',
                    tierMultiplier: '2.0',
                    birthdayMultiplier: '1.0',
                    totalMultiplier: '2.0',
                    pointsEarned: 0
                }
            };

            const zeroBasket = { ...mockBasket, total: 0 };

            (basketRepository.findById as jest.Mock).mockResolvedValue(zeroBasket);
            (customerRepository.findById as jest.Mock).mockResolvedValue(mockCustomer);
            (storeRepository.findById as jest.Mock).mockResolvedValue(mockStore);
            (completeOrderService as jest.Mock).mockResolvedValue(mockCompleteData);

            // Act
            await completeOrder(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(sendResponse).toHaveBeenCalled();
        });
    });
});