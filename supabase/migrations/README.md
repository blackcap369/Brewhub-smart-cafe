# BrewHub Database Schema Migration

## Overview

Complete PostgreSQL schema for BrewHub multi-tenant SaaS platform, designed for Supabase.

## Architecture

- **Multi-tenant isolation** via `cafe_id` column on all tenant-scoped tables
- **Row Level Security (RLS)** enabled on ALL tables
- **Tenant context** set via PostgreSQL session variable `app.current_cafe_id`
- **Role-based access** through helper functions: `is_cafe_owner()`, `is_cafe_staff()`, `is_cafe_customer()`

## Tables (11 total)

| Table | Description | RLS | Indexes |
|-------|-------------|-----|---------|
| `cafes` | Core tenant table | ✅ | - |
| `users` | Users across tenants | ✅ | 4 |
| `tables` | Physical cafe tables | ✅ | 2 |
| `menu_items` | Menu per cafe | ✅ | 4 |
| `orders` | Orders with status workflow | ✅ | 7 |
| `payments` | Payment records (Razorpay) | ✅ | 4 |
| `loyalty_points` | Customer loyalty tracking | ✅ | 3 |
| `feedback` | Customer ratings & reviews | ✅ | 4 |
| `broadcasts` | Cafe announcements | ✅ | 3 |
| `settings` | Per-cafe key-value config | ✅ | 2 |
| `activity_log` | Immutable audit trail | ✅ | 5 |

## How to Apply

### Via Supabase Dashboard
1. Go to your Supabase project → SQL Editor
2. Paste the contents of `001_initial_schema.sql`
3. Click "Run"

### Via Supabase CLI
```bash
supabase db push
```

### Via psql
```bash
psql -h your-project.supabase.co -U postgres -d postgres -f 001_initial_schema.sql
```

## Setting Tenant Context

Before executing queries, set the cafe context:

```sql
-- Set the current cafe context for RLS
SET app.current_cafe_id = 'your-cafe-uuid-here';

-- Now all queries will be filtered to this cafe
SELECT * FROM orders; -- Only returns orders for this cafe
```

### From Application Code (Supabase JS)
```typescript
import { supabase } from './services/supabase';

// Set cafe context before queries
async function setCafeContext(cafeId: string) {
  const { error } = await supabase.rpc('set_cafe_context', { cafe_id: cafeId });
  if (error) throw error;
}
```

## Helper Functions

| Function | Purpose |
|----------|---------|
| `get_current_cafe_id()` | Returns current tenant UUID from session |
| `get_current_user_id()` | Returns authenticated user UUID |
| `is_cafe_owner(uuid)` | Checks if auth user owns the cafe |
| `is_cafe_staff(uuid)` | Checks if auth user is staff/owner of cafe |
| `is_cafe_customer(uuid)` | Checks if auth user is customer of cafe |

## Views

| View | Description |
|------|-------------|
| `v_daily_revenue` | Daily revenue aggregation per cafe |
| `v_popular_items` | Most ordered items with revenue |
| `v_customer_analytics` | Customer spending & loyalty data |

## Triggers

- **`update_updated_at()`** — Auto-updates `updated_at` on all tables with that column
- **`generate_order_number()`** — Auto-generates sequential order numbers (ORD-0001, ORD-0002...)
- **`generate_table_qr()`** — Auto-generates QR codes for tables

## Security Notes

1. All tables have RLS enabled — no table is accessible without proper auth
2. Tenant isolation is enforced at the database level, not just application level
3. Activity log is immutable (no UPDATE/DELETE policies)
4. Settings table supports public vs private keys
5. Payment data is only accessible to staff, not other customers
6. Feedback can be submitted by customers but only managed by staff

## Subscription Plans

- `free` — Basic features, limited orders
- `starter` — Small cafes, up to 500 orders/month
- `professional` — Growing businesses, unlimited orders
- `enterprise` — Multi-location, custom features
