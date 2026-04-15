# GrowCold

Mobile-first cold storage (WMS) for Indian SMBs. Monorepo: **Expo** (mobile), **Vite + React** (web), **Supabase** (Postgres + Auth + RLS), **shared** (Zod, i18n strings, formatters).

## Prerequisites

- Node 20+
- [pnpm](https://pnpm.io/) (or `npx pnpm@9`)
- [Docker](https://docs.docker.com/get-docker/) (for local Supabase)

## Install

```bash
pnpm install
```

## Scripts (repo root)

| Script            | Description                                      |
| ----------------- | ------------------------------------------------ |
| `pnpm dev:web`    | Vite dev server (http://localhost:5173)          |
| `pnpm dev:mobile` | Expo dev server                                    |
| `pnpm build:web`  | Production web build                               |
| `pnpm typecheck`  | TypeScript across packages                         |
| `pnpm db:start`   | `supabase start` (Docker)                         |
| `pnpm db:reset`   | Reset DB and apply migrations (`packages/supabase`) |
| `pnpm db:types`   | Regenerate `packages/supabase/types.ts` (needs local DB up) |

## Local Supabase

```bash
pnpm db:start   # first time pulls images
pnpm db:reset   # applies migrations + seed tenant/warehouse
pnpm db:types   # optional: refresh TS types
```

If `db:reset` says Supabase is not running, start Docker and run `pnpm db:start` first.

## Conventions

- Specs: [`specs/`](specs/) — start with [`specs/SUPABASE_CONVENTIONS.md`](specs/SUPABASE_CONVENTIONS.md).
- Identity: `auth.users` + `public.user_profiles` + `public.user_roles` + `user_warehouse_assignments`.
- Roles: `OWNER`, `MANAGER`, `STAFF`.
- UI tabs (web + mobile): Home, Inventory, Parties, Receipts, Payments; Settings / warehouse / profile live under the user avatar menu.

## Workspace layout

```
apps/mobile/     Expo + GlueStack + React Navigation + TanStack Query + Zustand
apps/web/        Vite + Tailwind + Radix/shadcn-style UI + RR7 + Query + Zustand
packages/shared/ Zod schemas, constants, formatINR / formatDate, i18n resources (te/en)
packages/supabase/ supabase/config.toml, migrations, types.ts
```
