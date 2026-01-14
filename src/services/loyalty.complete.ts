import { calculateMulipliers } from '../utils/discount';
import { 
    ICustomerRepository, 
    IBasketRepository, 
    IPointsLedgerRepository 
} from '../repositories/interfaces';

import { Customer } from '../types/customer';
import { BasketEntity } from '../types/basket';
import { Store } from '../types/restaurant';

export async function completeOrderService(
    customer: Customer, 
    basket: BasketEntity,
    store: Store,
    customerRepo: ICustomerRepository,
    basketRepo: IBasketRepository,
    ledgerRepo: IPointsLedgerRepository
) {
    const {
        tierName,
        tierMult,
        birthdayMult,
        totalMult
    } = calculateMulipliers(customer);

    const orderTotal = basket.updatedTotal ?? basket.total;
    if (orderTotal === undefined) {
        throw new Error(`Order total is missing for basket ${basket.basketId}`);
    }

    const rewardRate = store.loyaltyPartner.rewardRate || 0;
    const pointsEarned = Math.floor(orderTotal * rewardRate * totalMult);

    await customerRepo.update(customer.customerId, {
        points: customer.points + pointsEarned,
        totalSpent: customer.totalSpent + orderTotal,
        orderCount: (customer.orderCount || 0) + 1,
        tier: tierName
    });

    await ledgerRepo.create({
        customerId: customer.customerId,
        phone: customer.phone,
        basketId: basket.basketId!,
        storeId: basket.storeId,
        type: 'earn',
        points: pointsEarned,
        orderAmount: orderTotal,
        tier: tierName,
        multiplier: totalMult,
        rewardRate,
        reason: `Earn: ${orderTotal} X ${rewardRate} X ${totalMult.toFixed(1)}`,
        timestamp: new Date().toISOString()
    });

    // Extract partnerId
    const partnerId = store.loyaltyPartner?.partnerId;

    const lookupChain = {
        basketId: basket.basketId,
        customerId: customer.customerId,
        phone: customer.phone,
        restaurantId: basket.restaurantId,
        storeId: basket.storeId,
        ...(partnerId && { partnerId })
    };

    return {
        lookupChain,
        basket: {
            total: orderTotal,
            ...(basket.updatedTotal !== undefined && { updatedTotal: basket.updatedTotal }),
            ...(basket.pointsDiscount !== undefined && { pointsDiscount: basket.pointsDiscount })
        },
        loyalty: {
            phone: customer.phone,
            name: customer.name,
            remainingPoints: customer.points + pointsEarned,
            tier: tierName,
            tierMultiplier: `${tierMult}`,
            birthdayMultiplier: birthdayMult === 1.5 ? '1.5' : '1.0',
            totalMultiplier: totalMult.toFixed(1),
            pointsEarned
        }
    };
}