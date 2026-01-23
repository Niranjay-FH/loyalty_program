import { BasketEntity } from '../../types/basket';

export function getBasketService(basket: BasketEntity) {
    return {
        basketId: basket.basketId,
        customerId: basket.customerId,
        restaurantId: basket.restaurantId,
        storeId: basket.storeId,
        items: basket.items,
        subtotal: basket.subtotal,
        deliveryFee: basket.deliveryFee,
        total: basket.total,
        originalTotal: basket.originalTotal,
        updatedTotal: basket.updatedTotal,
        pointsDiscount: basket.pointsDiscount,
        timestamp: basket.timestamp
    };
}