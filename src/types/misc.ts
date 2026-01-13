export interface LedgerEntry {
    ledgerId: string;
    customerId: number;
    phone: string;
    basketId: string | null;
    storeId: string;
    type: string;
    points: number;
    orderAmount: number;
    tier: string;
    multiplier?: number;
    rewardRate?: number;
    discountType?: 'cash' | 'percentage';
    reason: string;
    timestamp: string;
}

export interface LookupChain {
    basketId: string;
    customerId: number;
    phone: string;
    restaurantId: string,
    storeId: string;
}

export interface TierConfig {
    mult: number;
    target: number;
}

export interface RedeemOption {
    points: number;
    discount: string;
}