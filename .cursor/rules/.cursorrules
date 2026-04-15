# .cursorrules - GrowCold Development Rules
# Rules for Cursor AI agents. Copy this to project root after scaffold.

---

## FILE OWNERSHIP (CRITICAL - Prevents Conflicts)

### Frontend Agent (Web App)
- **Owns:** `apps/web/src/**`, `apps/web/next.config.js`, `apps/web/tsconfig.json`
- **Can edit:** React components, Next.js pages, web styles
- **Cannot edit:** `packages/shared/`, `packages/supabase/`, `tests/`
- **Blocked until:** Shared Agent creates API contracts in `packages/shared/api/endpoints/`

### Shared Agent (Core Library)
- **Owns:** `packages/shared/src/**`, `packages/shared/package.json`
- **Can edit:** API client, types, hooks, utils, components, stores, i18n, offline logic
- **Cannot edit:** `apps/web/`, `packages/supabase/`, `tests/`
- **Coordination:** Post in Linear when API contracts ready (unblocks Frontend Agent)

### Backend Agent (Supabase)
- **Owns:** `packages/supabase/**` (migrations, Edge Functions, seed data)
- **Can edit:** SQL migrations, Deno functions, Supabase dashboard config
- **Cannot edit:** `apps/web/`, `packages/shared/`, `tests/`
- **Coordination:** Post schema in Linear before Shared Agent creates types

### QA Agent (Tests)
- **Owns:** `tests/**`
- **Can edit:** Unit tests, integration tests, E2E tests, test config
- **Cannot edit:** `apps/web/`, `packages/shared/`, `packages/supabase/`
- **Coordination:** Ask Shared/Backend agents for fixtures and test utilities

### Orchestrator (You)
- **Owns:** Documentation, root config, deployment, architecture decisions
- **Can edit:** `docs/`, `vercel.json`, `.github/workflows/`, `pnpm-workspace.yaml`
- **Authority:** Approves all PRs, makes design decisions, resolves conflicts

---

## BRANCH NAMING CONVENTION

Format: `[role]/[M#]-[feature-name]`

Examples:
- `frontend/M0-react-scaffold`
- `shared/M1-offline-sync`
- `backend/M0-schema`
- `test/M1-integration-tests`

Forbidden:
- `main` (protected, no direct pushes)
- `feature/...` (use role prefix)
- `bugfix/...` (use role prefix)

---

## COMMIT FORMAT

Every commit must follow: `[role]: [M#] Description`

Examples:
```
[frontend]: [M0] Add LotCard component
[shared]: [M1] Create offline queue abstraction
[backend]: [M0] Add RLS policies to lots table
[test]: [M1] Add integration tests for delivery flow
```

---

## GIT WORKFLOW (REQUIRED)

1. **Create feature branch** from `main`
   ```bash
   git checkout -b frontend/M0-react-scaffold
   ```

2. **Make changes** in your owned files ONLY

3. **Commit with format**
   ```bash
   git commit -m "[frontend]: [M0] Add LotCard component"
   ```

4. **Push to origin**
   ```bash
   git push origin frontend/M0-react-scaffold
   ```

5. **Create Pull Request**
   - Title: Same as commit message
   - Description: Link to Linear issue
   - Request review from: **Orchestrator** (or other agent for cross-review)

6. **Wait for approval** - Do NOT merge your own PRs

7. **Merge only after approval** by Orchestrator

---

## API CONTRACT COORDINATION

**Critical:** Frontend Agent cannot start until Shared Agent creates API contracts.

### How It Works

1. **Backend Agent** creates database schema
   - Posts in Linear: "Schema ready in packages/supabase/migrations/001_create_tables.sql"

2. **Shared Agent** reads schema, creates API contracts
   - File: `packages/shared/api/endpoints/[resource].ts`
   - Posts in Linear: "API contract ready: GET /api/lots"
   - Example contract:
   ```typescript
   // packages/shared/api/endpoints/lots.ts
   export const GetLotsRequest = z.object({
     warehouseId: z.string(),
     status: z.enum(['ACTIVE', 'STALE']).optional(),
   });
   export type GetLotsRequest = z.infer<typeof GetLotsRequest>;
   ```

3. **Frontend Agent** reads contract, builds UI
   - Implements page/component to match contract
   - No guessing on API response format

4. **If contract missing:**
   - Frontend Agent posts in Linear: "BLOCKED: Waiting for GET /api/lots contract"
   - **Never** guess API response format
   - **Never** implement API logic (that's Backend Agent's job)

---

## BLOCKING & ESCALATION

### If You're Blocked

**DO THIS:**
1. Post in Linear issue: `@[Other Agent] BLOCKED: I need X to proceed`
2. Explain what's blocking you
3. Continue working on other tasks
4. Check back daily for unblock

**DON'T DO THIS:**
- Don't edit files you don't own
- Don't guess on API contracts
- Don't implement backend logic in frontend
- Don't create database tables without migrations

### Escalation Path
1. **Blocked on another agent?** → Post in Linear
2. **Blocked for >24h?** → Message Orchestrator
3. **Architectural disagreement?** → Orchestrator decides

---

## CODE REVIEW REQUIREMENTS

### What Needs Review
- ✅ ALL PRs (no self-merges)
- ✅ All database migrations (Backend)
- ✅ All API contracts (Shared)
- ✅ All critical components (Frontend)
- ✅ All critical utilities (Shared)

### Who Reviews What
- **Frontend PRs:** Reviewed by Shared Agent or Orchestrator
- **Shared PRs:** Reviewed by Backend Agent or Orchestrator
- **Backend PRs:** Reviewed by Shared Agent or Orchestrator
- **Test PRs:** Reviewed by Orchestrator

### Approval Checklist
- [ ] Tests pass locally
- [ ] Lint passes
- [ ] No files edited outside owned directory
- [ ] Commit format is correct
- [ ] Linear issue linked
- [ ] Code matches acceptance criteria

---

## MONOREPO STRUCTURE (Reference)

```
grow-cold/
├── apps/web/src/**          → Frontend Agent (only edit here)
├── packages/shared/src/**   → Shared Agent (only edit here)
├── packages/supabase/**     → Backend Agent (only edit here)
├── tests/**                 → QA Agent (only edit here)
├── docs/**                  → Orchestrator (only edit here)
└── .github/workflows/       → Orchestrator (only edit here)
```

---

## CI/CD RULES

### On Every PR
- [ ] Linting must pass (ESLint)
- [ ] Tests must pass (Jest)
- [ ] No merge conflicts
- [ ] Branch name follows format
- [ ] Commit format correct
- [ ] File ownership not violated

### Deployment
- **Web (Vercel):** Only `apps/web/` is deployed
- **Functions (Supabase):** Only `packages/supabase/functions/` is deployed
- **Mobile (future):** Separate EAS deployment

---

## DAILY STANDUP (Async Slack #growcold-standup)

Post once per day:
```
[Frontend Agent] 
Status: Implementing LotCard component
Blocked: Waiting for GET /api/lots contract
Done: React scaffold, routing setup
Next: Integrate API when contract ready

[Shared Agent]
Status: Creating API contracts
Blocked: None
Done: Database schema reviewed, auth types created
Next: Create GET /api/lots contract, POST /api/lots contract

[Backend Agent]
Status: SQL migrations in progress
Blocked: None
Done: Table creation, RLS policies started
Next: Finish RLS, create seed data

[QA Agent]
Status: Jest setup
Blocked: Waiting for Shared Agent to export test utilities
Done: Jest config, test fixtures started
Next: Create unit tests for calculations when utilities ready
```

---

## SCHEMA CHANGE PROTOCOL

### If Backend Agent Needs to Modify Database

1. **Post in Linear:** "Planning to add column X to table Y. Ready by [date]."
2. **Wait 24 hours** for feedback from Shared Agent
3. **Shared Agent** reviews impact on types/contracts
4. **Create migration** (never modify existing migrations)
5. **Post when done:** "Migration ready in 004_add_column_X.sql"
6. **Shared Agent** updates types if needed

---

## TESTING RULES

### Before Creating PR
- [ ] Run `pnpm test` locally (all tests pass)
- [ ] Run linting: `pnpm lint`
- [ ] Manual test on dev server (Frontend Agent)
- [ ] Check Lighthouse score (Frontend Agent)

### Test Coverage Targets
- Shared utilities: >90%
- API client: >80%
- Integration flows: >70%
- E2E critical paths: 100%

---

## COMMON PITFALLS TO AVOID

❌ **Frontend Agent editing packages/shared/** 
→ That's Shared Agent's job

❌ **Pushing directly to main**
→ Use feature branch, create PR

❌ **Merging your own PR**
→ Always request review

❌ **Guessing API response format**
→ Wait for contract from Shared Agent

❌ **Creating database table without migration**
→ Always use SQL migration file

❌ **Implementing backend logic in frontend**
→ Keep frontend dumb, logic goes in Supabase RLS + Edge Functions

❌ **Hardcoding values instead of using i18n**
→ Use packages/shared/locales for all strings

---

## ASKING FOR HELP

### If You Need Something From Another Agent

**Example: Frontend Agent needs API contract**
```
@Shared Agent: BLOCKED - Need GET /api/lots contract to build LotList page.
Expected format: { data: Lot[], count: number, next_page?: string }
Needed by: EOD tomorrow
```

**Example: Shared Agent needs database details**
```
@Backend Agent: What columns are in the lots table? Need for Zod schema.
Also need: index recommendations for queries.
```

**Example: QA Agent needs test utilities**
```
@Shared Agent: Need to test calculations.ts. Can you export:
- createTestLot()
- createTestCustomer()
- calculateTestData()
```

---

## VERCEL DEPLOYMENT (Web-Only)

Only `apps/web/` is deployed to Vercel.

```
vercel.json (in root):
{
  "buildCommand": "pnpm --filter=@grow-cold/web build",
  "outputDirectory": "apps/web/.next"
}
```

Backend Agent: Don't worry about Vercel. Your code lives in Supabase dashboard.

---

## QUESTIONS?

If unclear about file ownership, branch naming, or Git workflow:
1. **Read this file again**
2. **Check examples above**
3. **Ask Orchestrator in Linear**

---

## RULES SUMMARY

| Rule | Consequence |
|------|------------|
| Edit files outside ownership | PR rejected, revert required |
| Push directly to main | CI/CD blocks, PR required |
| Merge own PR | PR rejected, revert required |
| Wrong commit format | PR rejected, rebase required |
| Wrong branch name | PR rejected, rename required |
| No test coverage | CI/CD blocks, tests required |
| Breaking file ownership | PR rejected, reassign changes |

---

**Last updated:** 2026-04-15
**Version:** 1.0
**For questions:** Post in Linear or ask Orchestrator
