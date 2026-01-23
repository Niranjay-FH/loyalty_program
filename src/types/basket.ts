export interface BasketItem {
    id?: number;
    basketId: string;
    name: string;
    price: number;
    quantity: number;
}

export interface BasketEntity {
    basketId: string;
    customerId: number;
    restaurantId: string;
    storeId: string;
    items: BasketItem[];
    subtotal: number;
    deliveryFee: number;
    total: number;
    timestamp: string;
    originalTotal: number;
    updatedTotal: number;
    pointsDiscount: number;
    loyalty?: {
        tierUsed: string;
        pointsRedeemed: number;
        discountAmount: number;
    };
}

// Partial basket for responses
export interface BasketResponse {
	basketId: string;
	restaurantId: string;
	customerId: number;
	total?: number;
	originalTotal?: number;
	updatedTotal?: number;
	pointsDiscount?: number;
	estimatedPoints?: number;
};