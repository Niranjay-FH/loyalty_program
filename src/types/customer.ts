export interface Customer {
  customerId: number;
  phone: string;
  name: string;
  points: number;
  totalSpent: number;
  orderCount: number;
  birthday?: string;
}