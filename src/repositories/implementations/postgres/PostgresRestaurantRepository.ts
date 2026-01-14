import { Restaurant, Store } from '../../../types/restaurant';
import { pool } from '../db/connections';

import { PostgresStoreRepository } from '../postgres/PostgresStoreRepository'

export class PostgresRestaurantRepository {
    async findById(restaurantId: string): Promise<Restaurant | null> {
        const restaurantResult = await pool.query(
            'SELECT * FROM restaurants WHERE restaurant_id = $1',
            [restaurantId]
        );

        if (restaurantResult.rows.length === 0) return null;

        const storesResult = await pool.query(
            'SELECT * FROM stores WHERE restaurant_id = $1',
            [restaurantId]
        );

        const restaurant = restaurantResult.rows[0];
        const storeRepo = new PostgresStoreRepository();

        return {
            restaurantId: restaurant.restaurant_id,
            name: restaurant.name,
            franchiseId: restaurant.franchise_id,
            foodhubPartnerId: restaurant.foodhub_partner_id,
            stores: storesResult.rows.map(row => storeRepo['mapToEntity'](row))
        };
    }

    async findAll(): Promise<Restaurant[]> {
        const restaurantsResult = await pool.query('SELECT * FROM restaurants');
        const storesResult = await pool.query('SELECT * FROM stores');
        
        const storeRepo = new PostgresStoreRepository();
        const storesByRestaurant = new Map<string, Store[]>();

        storesResult.rows.forEach(row => {
            const store = storeRepo['mapToEntity'](row);
            const restaurantId = row.restaurant_id;
            
            if (!storesByRestaurant.has(restaurantId)) {
                storesByRestaurant.set(restaurantId, []);
            }
            storesByRestaurant.get(restaurantId)!.push(store);
        });

        return restaurantsResult.rows.map(row => ({
            restaurantId: row.restaurant_id,
            name: row.name,
            franchiseId: row.franchise_id,
            foodhubPartnerId: row.foodhub_partner_id,
            stores: storesByRestaurant.get(row.restaurant_id) || []
        }));
    }
}