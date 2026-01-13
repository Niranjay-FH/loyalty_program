import { Pool } from 'pg';
import { IBasketRepository } from '../../interfaces';
import { BasketEntity } from '../../../types/basket';
import { pool } from '../db/connections';

export class PostgresBasketRepository implements IBasketRepository {
    async findById(basketId: string): Promise<BasketEntity | null> {
        const result = await pool.query(
            'SELECT * FROM baskets WHERE basket_id = $1',
            [basketId]
        );
        
        if (result.rows.length === 0) return null;
        
        return this.mapToEntity(result.rows[0]);
    }

    async update(basketId: string, data: Partial<BasketEntity>): Promise<BasketEntity> {
        const updates: string[] = [];
        const values: any[] = [];
        let paramCount = 1;

        if (data.items !== undefined) {
            updates.push(`items = $${paramCount++}`);
            values.push(JSON.stringify(data.items));
        }
        if (data.subtotal !== undefined) {
            updates.push(`subtotal = $${paramCount++}`);
            values.push(data.subtotal);
        }
        if (data.deliveryFee !== undefined) {
            updates.push(`delivery_fee = $${paramCount++}`);
            values.push(data.deliveryFee);
        }
        if (data.total !== undefined) {
            updates.push(`total = $${paramCount++}`);
            values.push(data.total);
        }
        if (data.originalTotal !== undefined) {
            updates.push(`original_total = $${paramCount++}`);
            values.push(data.originalTotal);
        }
        if (data.updatedTotal !== undefined) {
            updates.push(`updated_total = $${paramCount++}`);
            values.push(data.updatedTotal);
        }
        if (data.pointsDiscount !== undefined) {
            updates.push(`points_discount = $${paramCount++}`);
            values.push(data.pointsDiscount);
        }

        if (updates.length === 0) {
            throw new Error('No fields to update');
        }

        values.push(basketId);

        const query = `
            UPDATE baskets 
            SET ${updates.join(', ')}
            WHERE basket_id = $${paramCount}
            RETURNING *
        `;

        const result = await pool.query(query, values);
        
        if (result.rows.length === 0) {
            throw new Error(`Basket not found: ${basketId}`);
        }

        return this.mapToEntity(result.rows[0]);
    }

    async create(basket: BasketEntity): Promise<BasketEntity> {
        const query = `
            INSERT INTO baskets (
                basket_id, customer_id, restaurant_id, store_id, items,
                subtotal, delivery_fee, total, original_total, 
                updated_total, points_discount, timestamp
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *
        `;

        const values = [
            basket.basketId,
            basket.customerId,
            basket.restaurantId,
            basket.storeId,
            JSON.stringify(basket.items),
            basket.subtotal,
            basket.deliveryFee,
            basket.total,
            basket.originalTotal,
            basket.updatedTotal,
            basket.pointsDiscount,
            basket.timestamp
        ];

        const result = await pool.query(query, values);
        return this.mapToEntity(result.rows[0]);
    }

    private mapToEntity(row: any): BasketEntity {
        return {
            basketId: row.basket_id,
            customerId: row.customer_id,
            restaurantId: row.restaurant_id,
            storeId: row.store_id,
            items: row.items,
            subtotal: parseFloat(row.subtotal),
            deliveryFee: parseFloat(row.delivery_fee),
            total: parseFloat(row.total),
            originalTotal: parseFloat(row.original_total),
            updatedTotal: parseFloat(row.updated_total),
            pointsDiscount: parseFloat(row.points_discount),
            timestamp: row.timestamp.toISOString()
        };
    }
}