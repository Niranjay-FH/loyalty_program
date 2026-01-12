import { IBasketRepository } from '../../interfaces';
import { BasketEntity } from '../../../types/basket';
import { baskets } from '../../../data/baskets';
import { writeData } from '../../../utils/data';

export class FileBasketRepository implements IBasketRepository {
    async findById(basketId: string): Promise<BasketEntity | null> {
        const basket = baskets.find(b => b.basketId === basketId);
        return basket || null;
    }

    async update(basketId: string, data: Partial<BasketEntity>): Promise<BasketEntity> {
        const index = baskets.findIndex(b => b.basketId === basketId);
        if (index === -1) {
            throw new Error(`Basket not found: ${basketId}`);
        }
        
        baskets[index] = { ...baskets[index], ...data };
        writeData('baskets', baskets);
        return baskets[index];
    }

    async create(basket: BasketEntity): Promise<BasketEntity> {
        baskets.push(basket);
        writeData('baskets', baskets);
        return basket;
    }
}