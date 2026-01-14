import { IStoreRepository } from '../../interfaces/IStoreRepository';
import { Store } from '../../../types/restaurant';
import { pool } from '../db/connections';

export class PostgresStoreRepository implements IStoreRepository {
    async findById(storeId: string): Promise<Store | null> {
        const result = await pool.query(
            'SELECT * FROM stores WHERE store_id = $1',
            [storeId]
        );

        if (result.rows.length === 0) return null;

        return this.mapToEntity(result.rows[0]);
    }

    private mapToEntity(row: any): Store {
        return {
            storeId: row.store_id,
            name: row.name,
            location: {
                lat: parseFloat(row.lat),
                lng: parseFloat(row.lng),
                city: row.city
            },
            active: row.active,
            loyaltyPartner: {
                enabled: row.loyalty_enabled,
                partnerId: row.loyalty_partner_id,
                rewardRate: row.reward_rate ? parseFloat(row.reward_rate) : undefined,
                discountType: row.discount_type,
                allowedDiscounts: row.allowed_discounts,
                validationRules: row.min_orders ? {
                    minOrders: row.min_orders,
                    maxPointsExpiryDays: row.max_points_expiry_days
                } : undefined
            }
        };
    }
}