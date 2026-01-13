import { ICounterRepository } from '../../interfaces';
import { pool } from '../db/connections';

export class PostgresCounterRepository implements ICounterRepository {
    async getNextLedgerId(): Promise<number> {
        const result = await pool.query(
            'UPDATE counters SET next_ledger_id = next_ledger_id + 1 WHERE id = 1 RETURNING next_ledger_id'
        );
        return result.rows[0].next_ledger_id - 1;
    }

    async getNextCustomerId(): Promise<number> {
        const result = await pool.query(
            'UPDATE counters SET next_customer_id = next_customer_id + 1 WHERE id = 1 RETURNING next_customer_id'
        );
        return result.rows[0].next_customer_id - 1;
    }
}