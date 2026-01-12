import { RedeemOption } from "./misc"

export interface LoyaltyBase {
  phone?: string;
  name?: string;
  tier?: string;
  remainingPoints?: number;
}

export interface LoyaltyCheck extends LoyaltyBase {
  tierMultiplier: number;
  birthdayMultiplier: number;
  totalMultiplier: number;
  canRedeem: boolean;
  redeemOptions: RedeemOption[];
}

export interface LoyaltyRedeem extends LoyaltyBase {
  pointsUsed: number;
}

export interface LoyaltyComplete extends LoyaltyBase {
  tierMultiplier: string;
  birthdayMultiplier: string;
  totalMultiplier: string;
  pointsEarned: number;
}