export interface Restaurant {
    restaurantId: string;
    name: string;
    franchiseId: string;
    foodhubPartnerId: string;
    stores: Store[];
}

export interface Store {
    storeId: string;
    name: string;
    location: {
        lat: number;
        lng: number;
        city: string;
    };
    active: boolean;
    loyaltyPartner: {
        enabled: boolean;
        partnerId?: string;
        rewardRate?: number;
        discountType?: 'cash' | 'percentage';
        allowedDiscounts?: number[];
        validationRules?: {
            minOrders: number;
            maxPointsExpiryDays: number;
        };
    };
}