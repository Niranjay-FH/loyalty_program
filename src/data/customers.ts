import { Customer } from '../types/customer';

        export const customers: Customer[] = [
  {
    "customerId": 1,
    "phone": "+919876543210",
    "name": "Rahul Sharma",
    "points": 295,
    "tier": "silver",
    "birthday": "2004-01-08T00:00:00Z",
    "totalSpent": 9450,
    "orderCount": 13,
    "status": "active",
    "loyaltyInfo": [
      {
        "storeId": "store_001",
        "partnerId": "lp_pizza_hut_anna_001",
        "noOrders": 6,
        "membership": {
          "status": "active",
          "joinedDate": "2025-03-15T00:00:00Z",
          "expiryDate": "2026-12-31T23:59:59Z"
        }
      }
    ]
  },
  {
    "customerId": 2,
    "phone": "+919812345678",
    "name": "Priya Singh",
    "points": 11,
    "tier": "bronze",
    "birthday": "2004-01-08T00:00:00Z",
    "totalSpent": 1070,
    "orderCount": 2,
    "status": "active",
    "loyaltyInfo": [
      {
        "storeId": "store_002",
        "noOrders": 6,
        "membership": {
          "status": "active",
          "joinedDate": "2025-11-20T00:00:00Z",
          "expiryDate": "2026-06-30T23:59:59Z"
        }
      }
    ]
  }
];