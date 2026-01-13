import { getTier } from '../utils/tier';
import { 
    ICustomerRepository, 
    IBasketRepository, 
    IPointsLedgerRepository 
} from '../repositories/interfaces';

import { Customer } from '../types/customer';
import { BasketEntity } from '../types/basket';
import { Store } from '../types/restaurant';

export async function redeemPointsService(
    customer: Customer,
    basket: BasketEntity,
    toRedeem: number,
    store: Store,
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

    // Ledger Entry - redeem
    await ledgerRepo.create({
        customerId: customer.customerId,
        phone: customer.phone,
        basketId: basket.basketId!,
        storeId: basket.storeId,
        type: 'redeem',
        points: -maxRedeemable,
        orderAmount: maxRedeemable,
        tier: updatedCustomer.tier,
        discountType: store.loyaltyPartner.discountType,
        rewardRate: store.loyaltyPartner.rewardRate,
        reason: `${maxRedeemable}pts = ₹${maxRedeemable} ${store.loyaltyPartner.discountType} discount`,
        timestamp: new Date().toISOString()
    });

    return {
        lookupChain: {
            basketId: basket.basketId,
            customerId: basket.customerId,
            phone: customer.phone,
            restaurantId: basket.restaurantId,
            storeId: basket.storeId
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