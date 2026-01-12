import { calculateMulipliers } from '../utils/discount';

import { 
    ICustomerRepository, 
    IBasketRepository, 
    IPointsLedgerRepository } from '../repositories/interfaces';

import { Customer } from '../types/customer';
import { BasketEntity } from '../types/basket';

export async function completeOrderService(
    customer: Customer, 
    basket: BasketEntity,
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

    const basePoints = Math.floor(orderTotal * 0.01);
    const pointsEarned = Math.floor(basePoints * totalMult);

    // Update customer
    await customerRepo.update(customer.customerId, {
        points: customer.points + pointsEarned,
        totalSpent: customer.totalSpent + orderTotal,
        orderCount: (customer.orderCount || 0) + 1,
        tier: tierName
    });

    // Update basket
    await basketRepo.update(basket.basketId!, {
        updatedTotal: basket.updatedTotal,
        pointsDiscount: basket.pointsDiscount
    });

    // Add ledger entry
    await ledgerRepo.create({
        phone: customer.phone,
        type: 'earn',
        points: pointsEarned,
        orderId: basket.basketId!,
        orderAmount: orderTotal,
        tier: tierName,
        multiplier: totalMult.toFixed(1),
        reason: `Earn on ${orderTotal}`,
        timestamp: new Date().toISOString()
    });

    return {
        lookupChain: {
            basketId: basket.basketId,
            customerId: basket.customerId,
            phone: customer.phone
        },
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