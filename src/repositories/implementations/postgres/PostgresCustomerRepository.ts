import { ICustomerRepository } from '../../interfaces';
import { Customer } from '../../../types/customer';
import { pool } from '../db/connections';

export class PostgresCustomerRepository implements ICustomerRepository {
    async findById(customerId: number): Promise<Customer | null> {
        const result = await pool.query(
            'SELECT * FROM customers WHERE customer_id = $1',
            [customerId]
        );

        if (result.rows.length === 0) return null;

        return await this.mapToEntity(result.rows[0]);
    }

    async findByPhone(phone: string): Promise<Customer | null> {
        const result = await pool.query(
            'SELECT * FROM customers WHERE phone = $1',
            [phone]
        );

        if (result.rows.length === 0) return null;

        return await this.mapToEntity(result.rows[0]);
    }

    async update(customerId: number, data: Partial<Customer>): Promise<Customer> {
        const updates: string[] = [];
        const values: any[] = [];
        let paramCount = 1;

        if (data.name !== undefined) {
            updates.push(`name = $${paramCount++}`);
            values.push(data.name);
        }
        if (data.points !== undefined) {
            updates.push(`points = $${paramCount++}`);
            values.push(data.points);
        }
        if (data.totalSpent !== undefined) {
            updates.push(`total_spent = $${paramCount++}`);
            values.push(data.totalSpent);
        }
        if (data.orderCount !== undefined) {
            updates.push(`order_count = $${paramCount++}`);
            values.push(data.orderCount);
        }
        if (data.tier !== undefined) {
            updates.push(`tier = $${paramCount++}`);
            values.push(data.tier);
        }
        if (data.status !== undefined) {
            updates.push(`status = $${paramCount++}`);
            values.push(data.status);
        }

        if (updates.length === 0) {
            throw new Error('No fields to update');
        }

        updates.push(`updated_at = NOW()`);
        values.push(customerId);

        const query = `
            UPDATE customers 
            SET ${updates.join(', ')}
            WHERE customer_id = $${paramCount}
            RETURNING *
        `;

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            throw new Error(`Customer not found: ${customerId}`);
        }

        return await this.mapToEntity(result.rows[0]);
    }

    async create(customer: Customer): Promise<Customer> {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');

            // Insert customer
            const customerQuery = `
                INSERT INTO customers (
                    customer_id, phone, name, points, total_spent, order_count,
                    birthday, tier, status
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING *
            `;

            const customerValues = [
                customer.customerId,
                customer.phone,
                customer.name,
                customer.points,
                customer.totalSpent,
                customer.orderCount,
                customer.birthday,
                customer.tier,
                customer.status
            ];

            const customerResult = await client.query(customerQuery, customerValues);
            const newCustomer = customerResult.rows[0];

            // Insert loyalty info
            if (customer.loyaltyInfo && customer.loyaltyInfo.length > 0) {
                for (const info of customer.loyaltyInfo) {
                    const loyaltyQuery = `
                        INSERT INTO customer_loyalty_info (
                            customer_id, store_id, partner_id, no_orders,
                            membership_status, joined_date, expiry_date
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                    `;

                    await client.query(loyaltyQuery, [
                        newCustomer.customer_id,
                        info.storeId,
                        info.partnerId || null,
                        info.noOrders,
                        info.membership.status,
                        info.membership.joinedDate,
                        info.membership.expiryDate
                    ]);
                }
            }

            await client.query('COMMIT');

            return await this.mapToEntity(newCustomer);
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    private async mapToEntity(row: any): Promise<Customer> {
        // Fetch loyalty info
        const loyaltyResult = await pool.query(
            'SELECT * FROM customer_loyalty_info WHERE customer_id = $1',
            [row.customer_id]
        );

        return {
            customerId: row.customer_id,
            phone: row.phone,
            name: row.name,
            points: row.points,
            totalSpent: parseFloat(row.total_spent),
            orderCount: row.order_count,
            birthday: row.birthday.toISOString(),
            tier: row.tier,
            status: row.status,
            loyaltyInfo: loyaltyResult.rows.map(lr => ({
                storeId: lr.store_id,
                partnerId: lr.partner_id,
                noOrders: lr.no_orders,
                membership: {
                    status: lr.membership_status,
                    joinedDate: lr.joined_date.toISOString(),
                    expiryDate: lr.expiry_date.toISOString()
                }
            }))
        };
    }
}