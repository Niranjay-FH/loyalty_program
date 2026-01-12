import { ICustomerRepository } from '../../interfaces';
import { Customer } from '../../../types/customer';
import { customers } from '../../../data/customers';
import { writeData } from '../../../utils/data';

export class FileCustomerRepository implements ICustomerRepository {
    async findById(customerId: number): Promise<Customer | null> {
        const customer = customers.find(c => c.customerId === customerId);
        return customer || null;
    }

    async findByPhone(phone: string): Promise<Customer | null> {
        const customer = customers.find(c => c.phone === phone);
        return customer || null;
    }

    async update(customerId: number, data: Partial<Customer>): Promise<Customer> {
        const index = customers.findIndex(c => c.customerId === customerId);
        if (index === -1) {
            throw new Error(`Customer not found: ${customerId}`);
        }
        
        customers[index] = { ...customers[index], ...data };
        writeData('customers', customers);
        return customers[index];
    }

    async create(customer: Customer): Promise<Customer> {
        customers.push(customer);
        writeData('customers', customers);
        return customer;
    }
}