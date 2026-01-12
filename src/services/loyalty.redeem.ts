import { getTier } from '../utils/tier';
import { writeData } from '../utils/data';

import { customers } from '../data/customers';
import { baskets } from '../data/baskets';
import { counters } from '../data/counters';
import { points_ledger } from '../data/points_ledger';

import { Customer } from '../types/customer';
import { BasketEntity } from '../types/basket';

export function redeemPointsService(
    customer: Customer,
    basket: BasketEntity,
    toRedeem: number
) {
    const maxRedeemable = Math.min(toRedeem, basket.total!);

    customer.points -= maxRedeemable;
    customer.tier = getTier(customer.totalSpent);

    customers[customers.findIndex(c => c.customerId === customer.customerId)] = customer;
    writeData('customers', customers);

    const basketIndex = baskets.findIndex(b => b.basketId === basket.basketId);

    baskets[basketIndex] = {
        ...baskets[basketIndex],
        originalTotal: baskets[basketIndex].total,
        updatedTotal: baskets[basketIndex].total - maxRedeemable,
        pointsDiscount: maxRedeemable
    };
    writeData('baskets', baskets);

    points_ledger.push({
        ledgerId: `ledger_${counters.nextLedgerId++}`,
        phone: customer.phone,
        type: 'redeem',
        points: -maxRedeemable,
        orderId: basket.basketId!,
        orderAmount: maxRedeemable,
        tier: customer.tier,
        reason: `Redeem ${maxRedeemable}pts (capped)`,
        timestamp: new Date().toISOString()
    });

    writeData('counters', counters);
    writeData('points_ledger', points_ledger);

    return {
        lookupChain: {
        basketId: basket.basketId,
        customerId: basket.customerId,
        phone: customer.phone
    },
    basket: {
        originalTotal: basket.total!,
        updatedTotal: basket.total! - maxRedeemable,
        pointsDiscount: maxRedeemable
    },
    loyalty: {
        remainingPoints: customer.points,
        pointsUsed: maxRedeemable
    }
  };
}