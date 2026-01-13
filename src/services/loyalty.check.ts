import { calculateMulipliers } from '../utils/discount';
import { canRedeemPoints, getRedeemableOptions } from '../utils/discount';

import { Customer } from '../types/customer';
import { BasketResponse } from '../types/basket';
import { Store } from '../types/restaurant';

export function getLoyaltyInfo(customer: Customer, basket: BasketResponse, store: Store) {
    const {
        tierName,
        tierMult,
        birthdayMult,
        totalMult
    } = calculateMulipliers(customer);

    const rewardRate = store.loyaltyPartner.rewardRate || 0;
    const estimatedPoints = Math.floor(basket.total! * rewardRate * totalMult);

    // Get redemption validation
    const redemptionValidation = canRedeemPoints(customer, basket, store);

    return {
        lookupChain: {
            basketId: basket.basketId,
            customerId: basket.customerId,
            phone: customer.phone,
            restaurantId: basket.restaurantId,
            storeId: store.storeId
        },
        basket: {
            total: basket.total!,
            estimatedPoints,
            rewardRate
        },
        loyalty: {
            phone: customer.phone,
            name: customer.name,
            remainingPoints: customer.points,
            tier: tierName,
            tierMultiplier: tierMult,
            birthdayMultiplier: birthdayMult,
            totalMultiplier: totalMult,
            canRedeem: redemptionValidation.canRedeem,
            redeemOptions: redemptionValidation.canRedeem 
                ? getRedeemableOptions(
                    customer, 
                    store.loyaltyPartner.allowedDiscounts || [], 
                    basket.total!
                  )
                : []  // Empty array if can't redeem
        }
    };
}