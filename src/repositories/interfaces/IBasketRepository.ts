import { BasketEntity } from '../../types/basket';

export interface IBasketRepository {
    findById(basketId: string): Promise<BasketEntity | null>;
    update(basketId: string, data: Partial<BasketEntity>): Promise<BasketEntity>;
    create(basket: BasketEntity): Promise<BasketEntity>;
}