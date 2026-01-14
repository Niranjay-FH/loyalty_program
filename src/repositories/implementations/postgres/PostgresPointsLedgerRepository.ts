import { IPointsLedgerRepository } from '../../interfaces';
import { LedgerEntry } from '../../../types/misc';
import { pool } from '../db/connections';

export class PostgresPointsLedgerRepository implements IPointsLedgerRepository {
    async create(entry: Omit<LedgerEntry, 'ledgerId'>): Promise<LedgerEntry> {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Get next ledger ID with retry logic
        let ledgerId: string;
        let nextId: number;
        let attempts = 0;
        
        while (attempts < 10) {
            const counterResult = await client.query(
                'UPDATE counters SET next_ledger_id = next_ledger_id + 1 WHERE id = 1 RETURNING next_ledger_id'
            );
            nextId = counterResult.rows[0].next_ledger_id - 1;
            ledgerId = `ledger_${nextId}`;
            
            // Check if this ID already exists
            const existsResult = await client.query(
                'SELECT 1 FROM points_ledger WHERE ledger_id = $1',
                [ledgerId]
            );
            
            if (existsResult.rows.length === 0) {
                break; // ID is available
            }
            
            attempts++;
        }
        
        if (attempts >= 10) {
            throw new Error('Could not generate unique ledger ID');
        }
        
        // Insert ledger entry
        const query = `
            INSERT INTO points_ledger (
                ledger_id, customer_id, phone, basket_id, store_id,
                type, points, order_amount, tier, multiplier,
                reward_rate, discount_type, reason, timestamp
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING *
        `;
        
        const values = [
            ledgerId!,
            entry.customerId,
            entry.phone,
            entry.basketId || null,
            entry.storeId,
            entry.type,
            entry.points,
            entry.orderAmount,
            entry.tier,
            entry.multiplier || null,
            entry.rewardRate || null,
            entry.discountType || null,
            entry.reason,
            entry.timestamp
        ];
        
        const result = await client.query(query, values);
        await client.query('COMMIT');
        
        return this.mapToEntity(result.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

    async findByPhone(phone: string): Promise<LedgerEntry[]> {
        const result = await pool.query(
            'SELECT * FROM points_ledger WHERE phone = $1 ORDER BY timestamp DESC',
            [phone]
        );

        return result.rows.map(row => this.mapToEntity(row));
    }

    private mapToEntity(row: any): LedgerEntry {
        return {
            ledgerId: row.ledger_id,
            customerId: row.customer_id,
            phone: row.phone,
            basketId: row.basket_id,
            storeId: row.store_id,
            type: row.type,
            points: row.points,
            orderAmount: parseFloat(row.order_amount),
            tier: row.tier,
            multiplier: row.multiplier ? parseFloat(row.multiplier) : undefined,
            rewardRate: row.reward_rate ? parseFloat(row.reward_rate) : undefined,
            discountType: row.discount_type,
            reason: row.reason,
            timestamp: row.timestamp.toISOString()
        };
    }
}