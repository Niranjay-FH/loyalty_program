# loyalty_program

Points based loyalty system for Foodhub.

## Databse Schema

### 1. partners
Stores third-party partner information for API authentication.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| partner_id | VARCHAR(100) | NOT NULL | - |
| api_key | VARCHAR(255) | NOT NULL | - |
| name | VARCHAR(255) | NULL | - |
| status | VARCHAR(20) | NOT NULL | 'active' |
| created_at | TIMESTAMP | NULL | now() |

**Primary Key:** partner_id

---

### 2. restaurants
Stores restaurant/franchise information.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| restaurant_id | VARCHAR(100) | NOT NULL | - |
| name | VARCHAR(255) | NOT NULL | - |
| franchise_id | VARCHAR(100) | NULL | - |
| foodhub_partner_id | VARCHAR(100) | NULL | - |
| created_at | TIMESTAMP | NULL | now() |

**Primary Key:** restaurant_id

---

### 3. stores
Stores individual store locations with loyalty program configuration.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| store_id | VARCHAR(100) | NOT NULL | - |
| restaurant_id | VARCHAR(100) | NULL | - |
| name | VARCHAR(255) | NOT NULL | - |
| lat | NUMERIC(10,6) | NULL | - |
| lng | NUMERIC(10,6) | NULL | - |
| city | VARCHAR(100) | NULL | - |
| active | BOOLEAN | NULL | true |
| loyalty_enabled | BOOLEAN | NULL | false |
| loyalty_partner_id | VARCHAR(100) | NULL | - |
| reward_rate | NUMERIC(5,4) | NULL | - |
| discount_type | VARCHAR(20) | NULL | - |
| allowed_discounts | INTEGER[] | NULL | - |
| min_orders | INTEGER | NULL | - |
| max_points_expiry_days | INTEGER | NULL | - |
| created_at | TIMESTAMP | NULL | now() |

**Primary Key:** store_id

**Foreign Keys:**
- restaurant_id → restaurants(restaurant_id) ON DELETE CASCADE

---

### 4. customers
Stores customer information and loyalty status.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| customer_id | INTEGER | NOT NULL | nextval('customers_customer_id_seq') |
| phone | VARCHAR(20) | NOT NULL | - |
| name | VARCHAR(255) | NOT NULL | - |
| points | INTEGER | NOT NULL | 0 |
| total_spent | NUMERIC(10,2) | NOT NULL | 0 |
| order_count | INTEGER | NOT NULL | 0 |
| birthday | TIMESTAMP | NOT NULL | - |
| tier | VARCHAR(50) | NOT NULL | 'bronze' |
| status | VARCHAR(50) | NOT NULL | 'active' |
| created_at | TIMESTAMP | NULL | now() |
| updated_at | TIMESTAMP | NULL | now() |

**Primary Key:** customer_id

**Unique Constraints:**
- phone (UNIQUE)

---

### 5. customer_loyalty_info
Tracks customer enrollment in store-specific loyalty programs.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | INTEGER | NOT NULL | nextval('customer_loyalty_info_id_seq') |
| customer_id | INTEGER | NULL | - |
| store_id | VARCHAR(100) | NOT NULL | - |
| partner_id | VARCHAR(100) | NULL | - |
| no_orders | INTEGER | NOT NULL | 0 |
| membership_status | VARCHAR(50) | NOT NULL | - |
| joined_date | TIMESTAMP | NOT NULL | - |
| expiry_date | TIMESTAMP | NOT NULL | - |
| created_at | TIMESTAMP | NULL | now() |

**Primary Key:** id

**Foreign Keys:**
- customer_id → customers(customer_id) ON DELETE CASCADE

---

### 6. baskets
Stores order basket information before completion.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| basket_id | VARCHAR(100) | NOT NULL | - |
| customer_id | INTEGER | NULL | - |
| restaurant_id | VARCHAR(100) | NULL | - |
| store_id | VARCHAR(100) | NULL | - |
| subtotal | NUMERIC(10,2) | NOT NULL | - |
| delivery_fee | NUMERIC(10,2) | NOT NULL | - |
| total | NUMERIC(10,2) | NOT NULL | - |
| original_total | NUMERIC(10,2) | NOT NULL | - |
| updated_total | NUMERIC(10,2) | NOT NULL | - |
| points_discount | NUMERIC(10,2) | NOT NULL | 0 |
| timestamp | TIMESTAMP | NOT NULL | now() |
| created_at | TIMESTAMP | NULL | now() |

**Primary Key:** basket_id

**Foreign Keys:**
- customer_id → customers(customer_id)
- restaurant_id → restaurants(restaurant_id)
- store_id → stores(store_id)

---

### 7. basket_items
Stores individual items within a basket (normalized).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | INTEGER | NOT NULL | nextval('basket_items_id_seq') |
| basket_id | VARCHAR(100) | NOT NULL | - |
| name | VARCHAR(255) | NOT NULL | - |
| price | NUMERIC(10,2) | NOT NULL | - |
| quantity | INTEGER | NOT NULL | 1 |
| created_at | TIMESTAMP | NULL | CURRENT_TIMESTAMP |

**Primary Key:** id

**Foreign Keys:**
- basket_id → baskets(basket_id) ON DELETE CASCADE

---

### 8. points_ledger
Audit log of all points transactions (earn/redeem).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ledger_id | VARCHAR(100) | NOT NULL | - |
| customer_id | INTEGER | NULL | - |
| phone | VARCHAR(20) | NOT NULL | - |
| basket_id | VARCHAR(100) | NULL | - |
| store_id | VARCHAR(100) | NULL | - |
| type | VARCHAR(20) | NOT NULL | - |
| points | INTEGER | NOT NULL | - |
| order_amount | NUMERIC(10,2) | NOT NULL | - |
| tier | VARCHAR(50) | NOT NULL | - |
| multiplier | NUMERIC(5,2) | NULL | - |
| reward_rate | NUMERIC(5,4) | NULL | - |
| discount_type | VARCHAR(20) | NULL | - |
| reason | TEXT | NOT NULL | - |
| timestamp | TIMESTAMP | NOT NULL | now() |
| created_at | TIMESTAMP | NULL | now() |

**Primary Key:** ledger_id

**Foreign Keys:**
- basket_id → baskets(basket_id)
- customer_id → customers(customer_id)
- store_id → stores(store_id)

---

### 9. counters
Manages auto-incrementing IDs for ledger and customer records.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | INTEGER | NOT NULL | nextval('counters_id_seq') |
| next_ledger_id | INTEGER | NOT NULL | 1 |
| next_customer_id | INTEGER | NOT NULL | 1 |

**Primary Key:** id

---