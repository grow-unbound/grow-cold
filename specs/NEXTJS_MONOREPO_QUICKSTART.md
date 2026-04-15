# GrowCold: Next.js Monorepo - Quick Start Guide

**Updated:** April 15, 2026  
**Status:** Ready for Agent Development

---

## Your Monorepo Structure

```
grow-cold/
├── apps/
│   └── web/                    # Next.js app (→ deployed to Vercel)
│       ├── src/app/            # Next.js App Router pages
│       ├── src/components/      # Web-specific components
│       ├── next.config.js
│       └── package.json
│
├── packages/
│   ├── shared/                 # Shared code (web + mobile future)
│   │   ├── src/api/            # API client, contracts, endpoints
│   │   ├── src/components/      # Shared UI (mobile-safe)
│   │   ├── src/hooks/          # Shared hooks
│   │   ├── src/store/          # Zustand stores
│   │   ├── src/types/          # TypeScript types
│   │   ├── src/utils/          # Calculations, formatting, validation
│   │   ├── src/locales/        # i18n (English + Telugu)
│   │   └── src/offline/        # Offline queue logic
│   │
│   └── supabase/               # Backend (Supabase)
│       ├── migrations/         # SQL migrations
│       ├── functions/          # Edge Functions (Deno)
│       └── seed.sql
│
├── tests/                      # Tests for all apps
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
└── .cursorrules                # Agent coordination rules
```

---

## 3 Agents, 3 Domains (Parallel Development)

| Agent | Owns | Blocks Whom? |
|-------|------|-------------|
| **Backend Agent** | `packages/supabase/` | Shared (needs schema) |
| **Shared Agent** | `packages/shared/` | Frontend (needs API contracts) |
| **Frontend Agent** | `apps/web/` | No one (unblocks last) |

**Critical Path:** Backend → Shared → Frontend

---

## Starting Development (M0)

### Day 1: Backend Agent Starts
```
Issue: GROW-M0-1 - Setup Supabase Project & Database Schema
Branch: backend/M0-schema
Creates:
- packages/supabase/migrations/001_create_tables.sql
- packages/supabase/seed.sql
Posts in Linear: "Schema ready. Shared Agent can read it."
```

### Day 2: Shared Agent Unblocks (Parallel)
```
Issues: GROW-M0-1, GROW-M0-2, GROW-M0-3
Branches: shared/M0-schema, shared/M0-api-client, shared/M0-auth
Creates:
- packages/shared/api/endpoints/lots.ts (GET/POST /api/lots)
- packages/shared/api/endpoints/auth.ts (Login/OTP)
- packages/shared/types/models.ts (Lot, Customer, Warehouse types)
Posts in Linear: "API contracts ready. Frontend Agent can unblock."
```

### Day 3: Frontend Agent Unblocks
```
Issues: GROW-M0-4, GROW-M0-5, GROW-M0-6
Branches: frontend/M0-scaffold, frontend/M0-components, frontend/M0-pwa
Creates:
- apps/web/src/app/ (Next.js app router)
- apps/web/src/components/LotCard.tsx
- apps/web/src/app/login/page.tsx
- PWA setup (web.config.json, Service Worker)
```

### End of M0
```
✅ Backend Agent: Database deployed to Supabase
✅ Shared Agent: API contracts finalized, types exported
✅ Frontend Agent: Web app loads on localhost:3000
✅ All agents: PRs merged, ready for M1
```

---

## Key Design Decisions

### 1. Shared Package Required? **YES**

✅ **With shared:**
- API contracts in one place
- Types consistent between web + mobile
- Calculations reused (no duplication)
- Mobile migration is copy-paste ready

❌ **Without shared:**
- API client duplicated in web + mobile
- Types drift
- Bug fixes in 3 places
- Mobile rewrite needed

### 2. Separate Backend Server? **NO (for MVP)**

MVP uses **Supabase as backend**:
- Authentication: Supabase Auth
- Database: PostgreSQL
- Background jobs: Edge Functions (Deno)
- Real-time: Supabase Realtime

**No Node.js/Express needed.** This stays simple for Vercel deployment.

### 3. Vercel Deployment

```
vercel.json in root:
{
  "buildCommand": "pnpm --filter=@grow-cold/web build",
  "outputDirectory": "apps/web/.next"
}
```

**Only `apps/web/` deploys to Vercel.**
- `packages/shared` bundled into build
- `packages/supabase` lives in Supabase dashboard
- No deployment confusion

### 4. Mobile Ready Now?

✅ **Yes, fully prepared:**
- `packages/shared` already mobile-safe (no DOM, React Native compatible)
- Offline logic platform-agnostic (IndexedDB for web → AsyncStorage for mobile)
- Components tested for mobile viewport (no wide tables)
- When you add `apps/mobile/`, it reuses 80% of `packages/shared`

---

## API Contract Pattern

**Shared Agent creates contracts FIRST.** Frontend Agent implements UI to match.

### Example: GET /api/lots

**Shared Agent creates:**
```typescript
// packages/shared/api/endpoints/lots.ts

export const GetLotsRequest = z.object({
  warehouseId: z.string(),
  status: z.enum(['ACTIVE', 'STALE', 'DELIVERED', 'CLEARED']).optional(),
  limit: z.number().default(20),
  offset: z.number().default(0),
});

export type GetLotsRequest = z.infer<typeof GetLotsRequest>;

export const LotSchema = z.object({
  id: z.string(),
  customerName: z.string(),
  productName: z.string(),
  balanceBags: z.number(),
  originalBags: z.number(),
  status: z.enum(['ACTIVE', 'STALE', 'DELIVERED', 'CLEARED']),
  lodgementDate: z.string(),
  daysOld: z.number(),
  daysUntilStale: z.number(),
  outstanding: z.number(),
});

export type Lot = z.infer<typeof LotSchema>;

export const GetLotsResponse = z.object({
  data: z.array(LotSchema),
  count: z.number(),
  hasMore: z.boolean(),
});

export type GetLotsResponse = z.infer<typeof GetLotsResponse>;
```

**Frontend Agent uses:**
```typescript
import { GetLotsRequest, GetLotsResponse, Lot } from '@grow-cold/shared/api';

const response: GetLotsResponse = await apiClient.get('/api/lots', {
  warehouseId: 'abc',
  status: 'ACTIVE',
});

response.data.map(lot => <LotCard key={lot.id} lot={lot} />);
```

**No guessing.** No surprises. Clear contract.

---

## Blocked? How to Escalate

### Frontend Agent Blocked on Shared Agent

```
In Linear issue GROW-M0-4:
@Shared Agent: BLOCKED waiting for GET /api/lots contract.
Need: { data: Lot[], count: number }
Target: EOD today
```

✅ **Shared Agent responds:** "Contract created at packages/shared/api/endpoints/lots.ts. You can unblock."

### Shared Agent Blocked on Backend Agent

```
In Linear issue GROW-M0-1:
@Backend Agent: Need schema for lots, customers, warehouse tables.
Specifically: What columns in lots table?
Target: EOD today
```

✅ **Backend Agent responds:** "Schema ready in packages/supabase/migrations/001_create_tables.sql."

---

## Testing Strategy

### Unit Tests (Shared Agent responsibility)
```typescript
// tests/unit/shared/calculations.test.ts
describe('calculateOutstanding', () => {
  it('should sum rent accruals + charges', () => {
    const lot = createTestLot({ ... });
    expect(calculateOutstanding(lot)).toBe(5000);
  });
});
```

### Integration Tests (QA Agent)
```typescript
// tests/integration/delivery-flow.test.ts
describe('Delivery Flow', () => {
  it('should block final delivery when outstanding > 0', async () => {
    const response = await api.post('/api/lots/123/delivery', { ... });
    expect(response.status).toBe(409);
  });
});
```

### E2E Tests (QA Agent)
```typescript
// tests/e2e/inventory.e2e.ts (Cypress)
describe('Inventory Page', () => {
  it('should login and show lots', () => {
    cy.login('+919999999999');
    cy.contains('Active Lots').should('be.visible');
    cy.get('[data-cy=lot-card]').should('have.length', 20);
  });
});
```

**All tests:** Run on every PR via GitHub Actions

---

## Deployment Checklist (M7)

### Web (Vercel)
- [ ] `apps/web` builds without errors
- [ ] All tests pass
- [ ] Lighthouse >85
- [ ] No ENV secrets in code
- [ ] Staging deployment works
- [ ] Production deployment ready

### Supabase (Dashboard)
- [ ] All migrations applied
- [ ] RLS policies verified
- [ ] Edge Functions deployed
- [ ] Seed data loaded
- [ ] Backups configured

### Mobile (EAS, future)
- [ ] `apps/mobile` builds with Expo
- [ ] Offline sync works
- [ ] All shared components work
- [ ] Performance >60fps

---

## Daily Workflow

### Morning (10 min)
1. Check #growcold-standup Slack
2. Read any blockers
3. Grab next Linear issue

### During Day
1. Work on your issue
2. If blocked: Post in Linear immediately (don't guess)
3. Review PRs from other agents

### End of Day
1. Push code to feature branch
2. Create PR with Linear link
3. Request review
4. Post in Slack #growcold-standup

### When Unblocked
1. Read contract/schema
2. Implement immediately
3. Ping blocker to unblock other agents

---

## File Ownership Quick Reference

| Path | Owner | Can Edit? |
|------|-------|-----------|
| `apps/web/src/` | Frontend | ✅ Yes |
| `packages/shared/src/` | Shared | ✅ Yes |
| `packages/supabase/` | Backend | ✅ Yes |
| `tests/` | QA | ✅ Yes |
| `apps/mobile/src/` | Frontend (future) | ✅ Yes |
| Everything else | Orchestrator | ✅ Yes |

**Violating ownership?** PR rejected. Fix it.

---

## Common Commands

```bash
# Setup
pnpm install
cd apps/web && pnpm dev           # Start Next.js on localhost:3000

# Testing
pnpm test                         # All tests
pnpm test --watch                 # Watch mode
pnpm test --coverage              # Coverage report

# Linting
pnpm lint

# Building
pnpm --filter=@grow-cold/web build

# Git
git checkout -b frontend/M0-scaffold
git commit -m "[frontend]: [M0] Add LotCard component"
git push origin frontend/M0-scaffold
# → Create PR on GitHub
```

---

## Success Metrics

| Metric | Target | Checked When |
|--------|--------|--------------|
| Login works | M0 end | Agent sync |
| Lots visible on web | M0 end | Agent sync |
| Offline delivery + sync | M1 end | Agent sync |
| Payment + FIFO allocation | M2 end | Agent sync |
| All tests passing | M6 end | CI/CD + Agent review |
| Lighthouse >85 | M6 end | Agent testing |
| 3-5 pilots live | M7 end | Orchestrator |
| 60%+ conversion intent | M7 end | Orchestrator |

---

## Questions Before Starting?

1. **Architecture:** Read MONOREPO_STRUCTURE_ANALYSIS.md
2. **Agent roles:** Read CURSOR_AGENT_PROMPTS_NEXTJS.md
3. **Rules:** Read .cursorrules
4. **Issues:** Open Linear and grab M0 tasks
5. **Blocked?** Ask in Linear issue

---

## TLDR

✅ **Structure:** monorepo (Next.js web + Expo mobile future)
✅ **Backend:** Supabase (no separate Node server for MVP)
✅ **Agents:** 3 (Backend → Shared → Frontend, parallel)
✅ **Coordination:** API contracts & schema (posted in Linear)
✅ **Deployment:** Web → Vercel, Backend → Supabase
✅ **Ready:** Start M0 immediately

---

**Let's build. 🚀**