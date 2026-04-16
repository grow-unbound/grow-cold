# Supabase Schema Setup

This folder contains the SQL artifacts to bootstrap an empty GrowCold database and then layer lot-specific changes.

## Files

- `migrations/20260407120000_initial_schema.sql`  
  Base schema setup (enums, tables, functions, triggers, RLS, grants).  
  Does **not** include `lot_number` changes.

- `migrations/20260415090000_lots_lot_number_and_visibility.sql`  
  Adds `lots.lot_number`, enforces format/uniqueness, and updates lot visibility policy.

- `seed.sql`  
  Deterministic sample data (1 tenant, 1 warehouse, 5 customers, 20 lots).

## Apply Order (Empty Database)

1. `20260407120000_initial_schema.sql`
2. `20260415090000_lots_lot_number_and_visibility.sql`
3. `seed.sql` (optional, for demo/test data)

## Local Apply (Supabase CLI + Docker)

From `packages/supabase`:

```bash
npm run db:start
```

Then in Supabase Studio SQL editor (`http://127.0.0.1:54323`), run SQL files in the order above.

If you prefer full reset semantics, run:

```bash
npm run db:reset
```

Then execute `seed.sql` manually in Studio.

## Staging/Remote Apply

Use the Supabase Dashboard SQL Editor for project `lezpukcoyrovuhjghozu`:

1. Paste and run `migrations/20260407120000_initial_schema.sql`
2. Paste and run `migrations/20260415090000_lots_lot_number_and_visibility.sql`
3. (Optional) Paste and run `seed.sql`

## Notes

- Keep `initial_schema` as foundational setup only.
- Add future schema changes as new migration files in `migrations/`.
- Do not mix seed data into foundational migration files.
