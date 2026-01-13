import { Restaurant } from '../types/restaurant';

export const restaurants: Restaurant[] = [
  {
    "restaurantId": "rest_001",
    "name": "Pizza Hut",
    "franchiseId": "pizza_hut",
    "foodhubPartnerId": "fh_rest_789",
    "stores": [
      {
        "storeId": "store_001",
        "name": "Anna Nagar Branch",
        "location": { "lat": 13.083, "lng": 80.270, "city": "Chennai" },
        "active": true,
        "loyaltyPartner": {
          "enabled": true,
          "partnerId": "lp_pizza_hut_anna_001",
          "rewardRate": 0.05,
          "discountType": "cash",
          "allowedDiscounts": [200, 400, 600],
          "validationRules": {
            "minOrders": 5,
            "maxPointsExpiryDays": 365
          }
        }
      },
      {
        "storeId": "store_002",
        "name": "Porur Branch",
        "location": { "lat": 15.083, "lng": 60.270, "city": "Chennai" },
        "active": true,
        "loyaltyPartner": {
          "enabled": false
        }
      }
    ]
  },
  {
    "restaurantId": "rest_002",
    "name": "Annapurna Idli House",
    "franchiseId": "",
    "foodhubPartnerId": "fh_rest_456",
    "stores": [
      {
        "storeId": "store_002",
        "name": "T. Nagar Branch", 
        "location": { "lat": 13.042, "lng": 80.259, "city": "Chennai" },
        "active": true,
        "loyaltyPartner": {
          "enabled": false
        }
      }
    ]
  }
];