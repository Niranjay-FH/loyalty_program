import { getTier } from '../utils/tier';

import { 
    ICustomerRepository, 
    IBasketRepository, 
    IPointsLedgerRepository } from '../repositories/interfaces';
    
import { Customer } from '../types/customer';
import { BasketEntity } from '../types/basket';

export async function redeemPointsService(
    customer: Customer,
    basket: BasketEntity,
    toRedeem: number,
    customerRepo: ICustomerRepository,
    basketRepo: IBasketRepository,
    ledgerRepo: IPointsLedgerRepository
) {
    const maxRedeemable = Math.min(toRedeem, basket.total!);

    // Update customer
    const updatedCustomer = await customerRepo.update(customer.customerId, {
        points: customer.points - maxRedeemable,
        tier: getTier(customer.totalSpent)
    });

    // Update basket
    await basketRepo.update(basket.basketId!, {
        originalTotal: basket.total,
        updatedTotal: basket.total! - maxRedeemable,
        pointsDiscount: maxRedeemable
    });

    // Add ledger entry
    await ledgerRepo.create({
        phone: customer.phone,
        type: 'redeem',
        points: -maxRedeemable,
        orderId: basket.basketId!,
        orderAmount: maxRedeemable,
        tier: updatedCustomer.tier,
        reason: `Redeem ${maxRedeemable}pts (capped)`,
        timestamp: new Date().toISOString()
    });

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
            remainingPoints: updatedCustomer.points,
            pointsUsed: maxRedeemable
        }
    };
}