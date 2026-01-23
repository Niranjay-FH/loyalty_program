import { z } from 'zod';

// ===========================
// Request Validation Schemas
// ===========================

// Basket ID param validation
export const basketIdParamSchema = z.object({
  	basketId: z.string()
      	.min(1, 'Basket ID is required')
    	.max(100, 'Basket ID too long')
});

// Redeem points body validation
export const redeemPointsBodySchema = z.object({
  	toRedeem: z.number({
      	message: 'toRedeem must be a valid number'
  	})
  	.positive('Points to redeem must be positive')
    .int('Points to redeem must be an integer')
    .max(100000, 'Points to redeem cannot exceed 100000')
});

// Combined request schemas for each endpoint
export const checkBasketRequestSchema = z.object({
  	params: basketIdParamSchema
});

export const redeemPointsRequestSchema = z.object({
  	params: basketIdParamSchema,
  	body: redeemPointsBodySchema
});

export const completeOrderRequestSchema = z.object({
  	params: basketIdParamSchema
});

// ===========================
// Entity Validation Schemas
// ===========================

// Customer validation
export const customerSchema = z.object({
  	customerId: z.number(),
  	phone: z.string().min(10),
  	name: z.string().min(1),
  	points: z.number().nonnegative(),
  	totalSpent: z.number().nonnegative(),
  	orderCount: z.number().nonnegative().int(),
  	birthday: z.string(),
  	tier: z.string(),
  	status: z.string(),
  	loyaltyInfo: z.array(z.object({
  	  	storeId: z.string(),
      	partnerId: z.string().nullable().optional(),
      	noOrders: z.number().nonnegative().int(),
      	membership: z.object({
        	status: z.string(),
        	joinedDate: z.string(),
        	expiryDate: z.string()
      	})
  	}))
});

export const basketIdSchema = z.object({
    basketId: z.string().min(1, 'Basket ID is required')
});

// Basket item schema
export const basketItemSchema = z.object({
    id: z.number().optional(),
    basketId: z.string(),
    name: z.string().min(1),
    price: z.number().nonnegative(),
    quantity: z.number().int().positive()
});

// BasketEntity validation
export const basketEntitySchema = z.object({
    basketId: z.string(),
    customerId: z.number(),
    restaurantId: z.string(),
    storeId: z.string(),
    items: z.array(basketItemSchema),
    subtotal: z.number().nonnegative(),
    deliveryFee: z.number().nonnegative(),
    total: z.number().nonnegative(),
    timestamp: z.string(),
    originalTotal: z.number().nonnegative(),
    updatedTotal: z.number().nonnegative(),
    pointsDiscount: z.number().nonnegative(),
    loyalty: z.object({
        tierUsed: z.string(),
        pointsRedeemed: z.number(),
        discountAmount: z.number()
    }).optional()
});

// BasketResponse validation (partial basket for responses)
export const basketResponseSchema = z.object({
  	basketId: z.string(),
  	restaurantId: z.string(),
  	customerId: z.number(),
  	total: z.number().nonnegative().optional(),
  	originalTotal: z.number().nonnegative().optional(),
  	updatedTotal: z.number().nonnegative().optional(),
  	pointsDiscount: z.number().nonnegative().optional(),
  	estimatedPoints: z.number().nonnegative().optional()
});

// Store validation
export const storeSchema = z.object({
  	storeId: z.string(),
  	name: z.string(),
  	location: z.object({
      	lat: z.number(),
      	lng: z.number(),
      	city: z.string()
  	}),
  	active: z.boolean(),
  	loyaltyPartner: z.object({
      	enabled: z.boolean(),
      	partnerId: z.string().optional(),
      	rewardRate: z.number().nonnegative().optional(),
      	discountType: z.enum(['cash', 'percentage']).optional(),
      	allowedDiscounts: z.array(z.number().positive()).optional(),
      	validationRules: z.object({
        	minOrders: z.number().nonnegative().int(),
        	maxPointsExpiryDays: z.number().positive().int()
      	}).optional()
  	})
});

// ===========================
// Response Validation Schemas
// ===========================

// Lookup chain validation (used in all responses)
export const lookupChainSchema = z.object({
    basketId: z.string(),
    customerId: z.number(),
    phone: z.string(),
    restaurantId: z.string(),
    storeId: z.string(),
    partnerId: z.string().optional()  // Add this
});

// Loyalty check response
export const loyaltyCheckResponseSchema = z.object({
    lookupChain: lookupChainSchema,
    basket: z.object({
        total: z.number(),
        estimatedPoints: z.number(),
        rewardRate: z.number()
    }),
    loyalty: z.object({
        phone: z.string(),
        name: z.string(),
        remainingPoints: z.number(),
        tier: z.string(),
        tierMultiplier: z.number(),
        birthdayMultiplier: z.number(),
        totalMultiplier: z.number(),
        canRedeem: z.boolean(),
        redeemOptions: z.array(z.object({
            points: z.number(),
            discount: z.string()
        }))
    })
});

// Loyalty redeem response
export const loyaltyRedeemResponseSchema = z.object({
    lookupChain: lookupChainSchema,
    basket: z.object({
        originalTotal: z.number(),
        updatedTotal: z.number(),
        pointsDiscount: z.number()
    }),
    loyalty: z.object({
        remainingPoints: z.number(),
        pointsUsed: z.number()
    })
});

// Loyalty complete response
export const loyaltyCompleteResponseSchema = z.object({
    lookupChain: lookupChainSchema,
    basket: z.object({
        total: z.number(),
        updatedTotal: z.number().optional(),
        pointsDiscount: z.number().optional()
    }),
    loyalty: z.object({
        phone: z.string(),
        name: z.string(),
        remainingPoints: z.number(),
        tier: z.string(),
        tierMultiplier: z.string(),
        birthdayMultiplier: z.string(),
        totalMultiplier: z.string(),
        pointsEarned: z.number()
    })
});

// ===========================
// Type Exports
// ===========================

export type BasketIdParams = z.infer<typeof basketIdParamSchema>;
export type RedeemPointsBody = z.infer<typeof redeemPointsBodySchema>;
export type CheckBasketRequest = z.infer<typeof checkBasketRequestSchema>;
export type RedeemPointsRequest = z.infer<typeof redeemPointsRequestSchema>;
export type CompleteOrderRequest = z.infer<typeof completeOrderRequestSchema>;
export type ValidatedCustomer = z.infer<typeof customerSchema>;
export type ValidatedBasketEntity = z.infer<typeof basketEntitySchema>;
export type ValidatedBasketResponse = z.infer<typeof basketResponseSchema>;
export type ValidatedStore = z.infer<typeof storeSchema>;
export type ValidatedLookupChain = z.infer<typeof lookupChainSchema>;
export type ValidatedLoyaltyCheckResponse = z.infer<typeof loyaltyCheckResponseSchema>;
export type ValidatedLoyaltyRedeemResponse = z.infer<typeof loyaltyRedeemResponseSchema>;
export type ValidatedLoyaltyCompleteResponse = z.infer<typeof loyaltyCompleteResponseSchema>;