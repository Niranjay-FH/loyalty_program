import { Request, Response } from 'express';
import { checkBasket } from '../../../controllers/loyalty/check.controller';
import { sendResponse, sendError } from '../../../utils/response';
import { ErrorCodes } from '../../../utils/errors';
import { canRedeemPoints } from '../../../utils/discount';
import { getLoyaltyInfo } from '../../../services/loyalty/loyalty.check';
import {
    customerRepository,
    basketRepository,
    storeRepository
} from '../../../repositories';

// Mock dependencies
jest.mock('../../../utils/response');
jest.mock('../../../utils/discount');
jest.mock('../../../services/loyalty/loyalty.check');
jest.mock('../../../repositories');

describe('Loyalty Controller - checkBasket', () => {
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

    describe('Successful check', () => {
        it('should return loyalty info when customer can redeem', async () => {
            // Arrange
            const mockLoyaltyData = {
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
                    estimatedPoints: 50,
                    rewardRate: 0.1
                },
                loyalty: {
                    phone: '1234567890',
                    name: 'John Doe',
                    remainingPoints: 500,
                    tier: 'gold',
                    tierMultiplier: 2,
                    birthdayMultiplier: 1,
                    totalMultiplier: 2,
                    canRedeem: true,
                    redeemOptions: [
                        { points: 50, discount: '50 OFF' },
                        { points: 100, discount: '100 OFF' }
                    ]
                }
            };

            (basketRepository.findById as jest.Mock).mockResolvedValue(mockBasket);
            (storeRepository.findById as jest.Mock).mockResolvedValue(mockStore);
            (customerRepository.findById as jest.Mock).mockResolvedValue(mockCustomer);
            (getLoyaltyInfo as jest.Mock).mockReturnValue(mockLoyaltyData);

            // Act
            await checkBasket(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(basketRepository.findById).toHaveBeenCalledWith('basket123');
            expect(storeRepository.findById).toHaveBeenCalledWith('store1');
            expect(customerRepository.findById).toHaveBeenCalledWith(1);
            expect(getLoyaltyInfo).toHaveBeenCalledWith(mockCustomer, mockBasket, mockStore);
            expect(sendResponse).toHaveBeenCalledWith(
                mockResponse,
                true,
                mockLoyaltyData,
                'Customer can redeem points'
            );
        });
    });

    describe('Basket validation errors', () => {
        it('should return BASKET_NOT_FOUND when basket does not exist', async () => {
            // Arrange
            (basketRepository.findById as jest.Mock).mockResolvedValue(null);

            // Act
            await checkBasket(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(sendError).toHaveBeenCalledWith(
                mockResponse,
                ErrorCodes.BASKET_NOT_FOUND
            );
        });

        it('should return BASKET_CHECK_INVALID when customerId is missing', async () => {
            // Arrange
            const invalidBasket = { ...mockBasket, customerId: null };
            (basketRepository.findById as jest.Mock).mockResolvedValue(invalidBasket);

            // Act
            await checkBasket(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(sendError).toHaveBeenCalledWith(
                mockResponse,
                ErrorCodes.BASKET_CHECK_INVALID
            );
        });

        it('should return BASKET_CHECK_INVALID when storeId is missing', async () => {
            // Arrange
            const invalidBasket = { ...mockBasket, storeId: null };
            (basketRepository.findById as jest.Mock).mockResolvedValue(invalidBasket);

            // Act
            await checkBasket(mockRequest as Request, mockResponse as Response);

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
            await checkBasket(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(sendError).toHaveBeenCalledWith(
                mockResponse,
                ErrorCodes.STORE_NO_LOYALTY,
                {
                    storeId: 'store1',
                    message: 'Store does not participate in loyalty program'
                }
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
            await checkBasket(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(sendError).toHaveBeenCalledWith(
                mockResponse,
                ErrorCodes.STORE_NO_LOYALTY,
                {
                    storeId: 'store1',
                    message: 'Store has no associated loyalty partner'
                }
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
            await checkBasket(mockRequest as Request, mockResponse as Response);

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
            await checkBasket(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(sendError).toHaveBeenCalledWith(
                mockResponse,
                ErrorCodes.CUSTOMER_NOT_ENROLLED,
                expect.objectContaining({
                    customerId: 1,
                    storeId: 'store1',
                    partnerId: 'partner1',
                    reason: 'Customer not enrolled in this loyalty program'
                })
            );
        });
    });

    describe('Redemption validation errors', () => {
        it('should return INSUFFICIENT_POINTS when customer lacks points', async () => {
            // Arrange
            const mockLoyaltyData = {
                loyalty: { canRedeem: false }
            };

            (basketRepository.findById as jest.Mock).mockResolvedValue(mockBasket);
            (storeRepository.findById as jest.Mock).mockResolvedValue(mockStore);
            (customerRepository.findById as jest.Mock).mockResolvedValue(mockCustomer);
            (getLoyaltyInfo as jest.Mock).mockReturnValue(mockLoyaltyData);
            (canRedeemPoints as jest.Mock).mockReturnValue({
                canRedeem: false,
                errorCode: ErrorCodes.INSUFFICIENT_POINTS,  // ADD THIS LINE
                reason: 'Insufficient points. Minimum 50 points required'
            });

            // Act
            await checkBasket(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(sendError).toHaveBeenCalledWith(
                mockResponse,
                ErrorCodes.INSUFFICIENT_POINTS,
                expect.objectContaining({
                    reason: 'Insufficient points. Minimum 50 points required'
                })
            );
        });

        it('should return MEMBERSHIP_EXPIRED when membership has expired', async () => {
            // Arrange
            const mockLoyaltyData = {
                loyalty: { canRedeem: false }
            };

            (basketRepository.findById as jest.Mock).mockResolvedValue(mockBasket);
            (storeRepository.findById as jest.Mock).mockResolvedValue(mockStore);
            (customerRepository.findById as jest.Mock).mockResolvedValue(mockCustomer);
            (getLoyaltyInfo as jest.Mock).mockReturnValue(mockLoyaltyData);
            (canRedeemPoints as jest.Mock).mockReturnValue({
                canRedeem: false,
                errorCode: ErrorCodes.MEMBERSHIP_EXPIRED,  // ADD THIS LINE
                reason: 'Loyalty membership expired on 01/01/2024'
            });

            // Act
            await checkBasket(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(sendError).toHaveBeenCalledWith(
                mockResponse,
                ErrorCodes.MEMBERSHIP_EXPIRED,
                expect.objectContaining({
                    reason: 'Loyalty membership expired on 01/01/2024'
                })
            );
        });

        it('should return MEMBERSHIP_INACTIVE when membership is not active', async () => {
            // Arrange
            const mockLoyaltyData = {
                loyalty: { canRedeem: false }
            };

            (basketRepository.findById as jest.Mock).mockResolvedValue(mockBasket);
            (storeRepository.findById as jest.Mock).mockResolvedValue(mockStore);
            (customerRepository.findById as jest.Mock).mockResolvedValue(mockCustomer);
            (getLoyaltyInfo as jest.Mock).mockReturnValue(mockLoyaltyData);
            (canRedeemPoints as jest.Mock).mockReturnValue({
                canRedeem: false,
                errorCode: ErrorCodes.MEMBERSHIP_INACTIVE,  // ADD THIS LINE
                reason: 'Loyalty membership is not active'
            });

            // Act
            await checkBasket(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(sendError).toHaveBeenCalledWith(
                mockResponse,
                ErrorCodes.MEMBERSHIP_INACTIVE,
                expect.any(Object)
            );
        });

        it('should return MIN_ORDERS_NOT_MET when minimum orders not met', async () => {
            // Arrange
            const mockLoyaltyData = {
                loyalty: { canRedeem: false }
            };

            (basketRepository.findById as jest.Mock).mockResolvedValue(mockBasket);
            (storeRepository.findById as jest.Mock).mockResolvedValue(mockStore);
            (customerRepository.findById as jest.Mock).mockResolvedValue(mockCustomer);
            (getLoyaltyInfo as jest.Mock).mockReturnValue(mockLoyaltyData);
            (canRedeemPoints as jest.Mock).mockReturnValue({
                canRedeem: false,
                errorCode: ErrorCodes.MIN_ORDERS_NOT_MET,  // ADD THIS LINE
                reason: 'Minimum 5 orders required. You have 2 orders'
            });

            // Act
            await checkBasket(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(sendError).toHaveBeenCalledWith(
                mockResponse,
                ErrorCodes.MIN_ORDERS_NOT_MET,
                expect.any(Object)
            );
        });
    });

    describe('Error handling', () => {
        it('should handle unexpected errors and return BASKET_CHECK_INVALID', async () => {
            // Arrange
            const error = new Error('Unexpected error');
            (basketRepository.findById as jest.Mock).mockRejectedValue(error);

            // Act
            await checkBasket(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(console.error).toHaveBeenCalledWith('checkBasket error:', error);
            expect(sendError).toHaveBeenCalledWith(
                mockResponse,
                ErrorCodes.BASKET_CHECK_INVALID
            );
        });
    });
});