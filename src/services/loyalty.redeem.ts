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

    const updatedCustomer = await customerRepo.update(customer.customerId, {
        points: customer.points - maxRedeemable,
        tier: getTier(customer.totalSpent)
    });

    await basketRepo.update(basket.basketId!, {
        originalTotal: basket.total,
        updatedTotal: basket.total! - maxRedeemable,
        pointsDiscount: maxRedeemable
    });

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

    // Extract partnerId
    const partnerId = store.loyaltyPartner?.partnerId;

    const lookupChain = {
        basketId: basket.basketId,
        customerId: basket.customerId,
        phone: customer.phone,
        restaurantId: basket.restaurantId,
        storeId: basket.storeId,
        ...(partnerId && { partnerId })
    };

    return {
        lookupChain,
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