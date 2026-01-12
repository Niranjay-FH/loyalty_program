export interface LedgerEntry {
  ledgerId: string;
  phone: string;
  type: 'earn' | 'redeem';
  points: number;
  orderId: string;
  orderAmount: number;
  tier: string;
  multiplier?: string;
  reason: string;
  timestamp: string;
}

export interface LookupChain {
  basketId: string;
  customerId: number;
  phone: string;
}

export interface TierConfig {
  mult: number;
  target: number;
}

export interface RedeemOption {
  points: number;
  discount: string;
}