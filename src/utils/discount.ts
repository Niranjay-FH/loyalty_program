import { RedeemOption } from "../types/misc";
import { Customer } from "../types/customer";
import { BasketResponse } from "../types/basket";

import { TIER, getTier } from './tier';
import { isBirthday } from './misc'

export const getRedeemableOptions = (
  customer: Customer,
  maxDiscounts: number[],
  basketTotal: number
): RedeemOption[] => {
  const options: RedeemOption[] = [];

  maxDiscounts.forEach((discount) => {
    if (customer.points >= discount && discount <= basketTotal) {
      options.push({
        points: discount,
        discount: `${discount} OFF`,
      });
    }
  });

  return options;
};

export function canRedeemPoints(customer: Customer, basket: BasketResponse): boolean {
  for (const discount of [200, 400, 600]) {
    if (customer.points >= discount && discount <= basket.total!) {
      return true;
    }
  }

  return false;
}

export function calculateMulipliers(customer: Customer) {
    const totalSpent = customer.totalSpent ?? 0;
    const tierName = getTier(totalSpent);
    const tierMult = TIER[tierName]?.mult ?? 1.0;
    const birthdayMult = isBirthday(customer);
    const totalMult = birthdayMult * tierMult;

    return {
        totalSpent,
        tierName,
        tierMult,
        birthdayMult,
        totalMult,
    };
}