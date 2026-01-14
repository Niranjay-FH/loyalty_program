import { Customer } from '../../types/customer';

export interface ICustomerRepository {
    findById(customerId: number): Promise<Customer | null>;
    findByPhone(phone: string): Promise<Customer | null>;
    update(customerId: number, data: Partial<Customer>): Promise<Customer>;
    create(customer: Customer): Promise<Customer>;
}