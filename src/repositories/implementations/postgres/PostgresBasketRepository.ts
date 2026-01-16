import { Pool } from 'pg';
import { IBasketRepository } from '../../interfaces';
import { BasketEntity, BasketItem } from '../../../types/basket';
import { pool } from '../db/connections';

export class PostgresBasketRepository implements IBasketRepository {
    async findById(basketId: string): Promise<BasketEntity | null> {
        const client = await pool.connect();
        
        try {
            // Get basket
            const basketResult = await client.query(
                'SELECT * FROM baskets WHERE basket_id = $1',
                [basketId]
            );
            
            if (basketResult.rows.length === 0) return null;
            
            // Get basket items
            const itemsResult = await client.query(
                'SELECT * FROM basket_items WHERE basket_id = $1',
                [basketId]
            );
            
            return this.mapToEntity(basketResult.rows[0], itemsResult.rows);
        } finally {
            client.release();
        }
    }

    async update(basketId: string, data: Partial<BasketEntity>): Promise<BasketEntity> {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            const updates: string[] = [];
            const values: any[] = [];
            let paramCount = 1;

            // Handle items separately
            if (data.items !== undefined) {
                // Delete existing items
                await client.query(
                    'DELETE FROM basket_items WHERE basket_id = $1',
                    [basketId]
                );
                
                // Insert new items
                for (const item of data.items) {
                    await client.query(
                        `INSERT INTO basket_items (basket_id, name, price, quantity)
                         VALUES ($1, $2, $3, $4)`,
                        [basketId, item.name, item.price, item.quantity]
                    );
                }
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

            if (updates.length > 0) {
                values.push(basketId);
                const query = `
                    UPDATE baskets 
                    SET ${updates.join(', ')}
                    WHERE basket_id = $${paramCount}
                    RETURNING *
                `;
                await client.query(query, values);
            }
            
            await client.query('COMMIT');
            
            // Fetch and return updated basket
            const result = await this.findById(basketId);
            if (!result) {
                throw new Error(`Basket not found: ${basketId}`);
            }
            
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async create(basket: BasketEntity): Promise<BasketEntity> {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // Insert basket
            const basketQuery = `
                INSERT INTO baskets (
                    basket_id, customer_id, restaurant_id, store_id,
                    subtotal, delivery_fee, total, original_total, 
                    updated_total, points_discount, timestamp
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING *
            `;

            const basketValues = [
                basket.basketId,
                basket.customerId,
                basket.restaurantId,
                basket.storeId,
                basket.subtotal,
                basket.deliveryFee,
                basket.total,
                basket.originalTotal,
                basket.updatedTotal,
                basket.pointsDiscount,
                basket.timestamp
            ];

            await client.query(basketQuery, basketValues);
            
            // Insert basket items
            for (const item of basket.items) {
                await client.query(
                    `INSERT INTO basket_items (basket_id, name, price, quantity)
                     VALUES ($1, $2, $3, $4)`,
                    [basket.basketId, item.name, item.price, item.quantity]
                );
            }
            
            await client.query('COMMIT');
            
            const result = await this.findById(basket.basketId);
            if (!result) {
                throw new Error('Failed to create basket');
            }
            
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    private mapToEntity(basketRow: any, itemRows: any[]): BasketEntity {
        return {
            basketId: basketRow.basket_id,
            customerId: basketRow.customer_id,
            restaurantId: basketRow.restaurant_id,
            storeId: basketRow.store_id,
            items: itemRows.map(item => ({
                id: item.id,
                basketId: item.basket_id,
                name: item.name,
                price: parseFloat(item.price),
                quantity: item.quantity
            })),
            subtotal: parseFloat(basketRow.subtotal),
            deliveryFee: parseFloat(basketRow.delivery_fee),
            total: parseFloat(basketRow.total),
            originalTotal: parseFloat(basketRow.original_total),
            updatedTotal: parseFloat(basketRow.updated_total),
            pointsDiscount: parseFloat(basketRow.points_discount),
            timestamp: basketRow.timestamp.toISOString()
        };
    }
}