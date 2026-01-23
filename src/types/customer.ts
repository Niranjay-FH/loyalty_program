export interface Customer {
  customerId: number;
  phone: string;
  name: string;
  points: number;
  totalSpent: number;
  orderCount: number;
  birthday: string;
  tier: string;
  status: string;
  
  loyaltyInfo: {
    storeId: string;
    partnerId?: string | null;
    noOrders: number;
    membership: {
      status: string;
      joinedDate: string;
      expiryDate: string;
    };
  }[];
}