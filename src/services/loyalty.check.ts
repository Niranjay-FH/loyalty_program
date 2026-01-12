import { calculateMulipliers } from '../utils/discount';
import { canRedeemPoints, getRedeemableOptions } from '../utils/discount';

import { Customer } from '../types/customer';
import { BasketResponse } from '../types/basket';

export function getLoyaltyInfo(customer: Customer, basket: BasketResponse) {
    const {
        tierName,
        tierMult,
        birthdayMult,
        totalMult
    } = calculateMulipliers(customer);

    const estimatedPoints = Math.floor(basket.total! * 0.01 * totalMult);

    return {
        lookupChain: {
        basketId: basket.basketId,
        customerId: basket.customerId,
        phone: customer.phone
    },
    basket: {
        total: basket.total!,
        estimatedPoints
    },
    loyalty: {
        phone: customer.phone,
        name: customer.name,
        remainingPoints: customer.points,
        tier: tierName,
        tierMultiplier: tierMult,
        birthdayMultiplier: birthdayMult,
        totalMultiplier: totalMult,
        canRedeem: canRedeemPoints(customer, basket),
        redeemOptions: getRedeemableOptions(customer, [200, 400, 600], basket.total!)
    }
  };
}