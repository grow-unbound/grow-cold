# GrowCold web (Next.js)

The web app uses the [Next.js App Router](https://nextjs.org/docs/app) with React, Tailwind CSS, TanStack Query, and the shared GrowCold design tokens.

## Scripts

From the monorepo root:

| Command           | Description                          |
| ----------------- | ------------------------------------ |
| `pnpm dev:web`    | Next.js dev server (port **3000**)   |
| `pnpm build:web`  | Production build (`next build`)      |

From `apps/web`:

| Command        | Description        |
| -------------- | ------------------ |
| `pnpm dev`     | `next dev`         |
| `pnpm build`   | `next build`       |
| `pnpm start`   | `next start`       |
| `pnpm lint`    | ESLint             |
| `pnpm typecheck` | `tsc --noEmit`   |

## Environment

Expose browser-safe variables with the `NEXT_PUBLIC_` prefix (see [Next.js environment variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)).

## Monorepo

See the repository root [README](../../README.md) for install, Supabase, and workspace layout.
