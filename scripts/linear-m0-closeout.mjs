#!/usr/bin/env node
/**
 * Posts M0 closeout comments on Linear and moves issues to the team's completed state.
 * Requires: LINEAR_API_KEY (Personal API key from Linear → Settings → API).
 *
 * Usage: pnpm linear:m0
 *
 * Issue identifiers must match exactly (e.g. GROW-M0-1). If search returns multiple hits,
 * the script picks the node whose `identifier` equals the key below.
 */

const ENDPOINT = 'https://api.linear.app/graphql';

const COMMENTS = {
  'GROCOLD-10': [
    '**M0-1 closeout (automated)**',
    '',
    '- Added standard `packages/supabase/supabase/` layout: `config.toml`, `migrations/`, and `seed.sql` for `supabase db reset`.',
    '- Seed inserts demo tenant, warehouse, warehouse_settings, customer, product, and one ACTIVE lot (`DEMO100/100`) with stable UUIDs.',
    '- `packages/supabase/types.ts` regenerated via `pnpm db:types` and `@growcold/shared` re-exports `Database` from `@growcold/supabase/types` (keeps client typings aligned with migrations).',
  ].join('\n'),
  'GROCOLD-11': [
    '**M0-2 closeout (automated)**',
    '',
    '- Phone OTP contracts and helpers unchanged in scope; confirmed `sendPhoneOtp` / `verifyPhoneOtp` + Zod schemas in `@growcold/shared`.',
    '- **Beyond AC (not reverted):** `/login` page + `react-hook-form` + `zodResolver` + `apps/web/.env.example` so OTP can be exercised end-to-end from the web shell (`User menu → Sign in`).',
  ].join('\n'),
  'GROCOLD-12': [
    '**M0-3 closeout (automated)**',
    '',
    '- API client scaffold unchanged; added **GET lots contract**: `ListLotsRequestSchema`, `ListLotsResponseSchema`, `listLotsHttpPath` in `packages/shared/src/api/endpoints/lots.ts` (exported from `@growcold/shared`).',
  ].join('\n'),
  'GROCOLD-13': [
    '**M0-4 closeout (automated)**',
    '',
    '- Scaffold already on Next 15 + App Router + Tailwind + shell nav.',
    '- **Delta delivered:** `/login` route, `apps/web/.env.example`, root `vercel.json` (install + `pnpm build:web` + `apps/web/.next` output).',
    '- **Note:** Internal docs still mention “Next 14”; runtime is Next 15 by design — no downgrade.',
  ].join('\n'),
};

async function gql(key, query, variables) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: key,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${JSON.stringify(json)}`);
  }
  if (json.errors?.length) {
    throw new Error(JSON.stringify(json.errors, null, 2));
  }
  return json.data;
}

async function findIssueByIdentifier(key, identifier) {
  const data = await gql(
    key,
    `query SearchIssues($term: String!) {
      searchIssues(term: $term, first: 20) {
        nodes {
          id
          identifier
          title
        }
      }
    }`,
    { term: identifier },
  );
  const nodes = data.searchIssues?.nodes ?? [];
  const exact = nodes.filter((n) => n?.identifier === identifier);
  if (exact.length >= 1) {
    if (exact.length > 1) console.warn(`Multiple exact matches for ${identifier}; using first.`);
    return exact[0];
  }
  return nodes.find((n) => n?.identifier?.includes(identifier)) ?? null;
}

async function postComment(key, issueId, body) {
  await gql(
    key,
    `mutation CreateComment($input: CommentCreateInput!) {
      commentCreate(input: $input) {
        success
        comment { id }
      }
    }`,
    { input: { issueId, body } },
  );
}

async function completeIssue(key, issueId) {
  const data = await gql(
    key,
    `query IssueTeam($id: String!) {
      issue(id: $id) {
        id
        identifier
        team {
          id
          states(first: 80) {
            nodes {
              id
              name
              type
            }
          }
        }
      }
    }`,
    { id: issueId },
  );
  const states = data.issue?.team?.states?.nodes ?? [];
  const done =
    states.find((s) => s.type === 'completed') ??
    states.find((s) => /done|complete|closed/i.test(s.name ?? ''));
  if (!done) {
    console.warn(`No completed workflow state for issue ${data.issue?.identifier}; skip status update.`);
    return;
  }
  await gql(
    key,
    `mutation IssueUpdate($id: String!, $input: IssueUpdateInput!) {
      issueUpdate(id: $id, input: $input) {
        success
        issue { id identifier state { name type } }
      }
    }`,
    { id: issueId, input: { stateId: done.id } },
  );
}

async function main() {
  const key = process.env.LINEAR_API_KEY;
  if (!key) {
    console.log('LINEAR_API_KEY not set; skipping Linear API calls.');
    console.log('Export your key and run: pnpm linear:m0');
    process.exit(0);
  }

  for (const [identifier, body] of Object.entries(COMMENTS)) {
    const issue = await findIssueByIdentifier(key, identifier);
    if (!issue?.id) {
      console.error(`Issue not found for ${identifier}`);
      continue;
    }
    console.log(`Updating ${issue.identifier} (${issue.id})…`);
    await postComment(key, issue.id, body);
    await completeIssue(key, issue.id);
    console.log(`Done: ${issue.identifier}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
