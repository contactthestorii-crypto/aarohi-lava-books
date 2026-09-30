# Development Rules

## Before coding

- Read `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/DESIGN.md`, this file, `TASKS.md` and
  `docs/MEMORY.md`.
- Inspect the existing implementation and reuse what exists.
- Pick one task from `TASKS.md`. Plan it before writing code if it touches more than 3 files.
- Next.js 16 differs from older versions: check `node_modules/next/dist/docs/` for APIs
  (`proxy.ts` not middleware, async `params`/`searchParams`/`cookies()`/`headers()`).

## General

- TypeScript strict. No `any` unless unavoidable and commented.
- Keep functions small and single-purpose. Do not duplicate logic.
- Do not modify unrelated files. Do not add packages without a reason in `docs/DECISIONS.md`.
- Server Components by default; `"use client"` only for interactive leaves.
- Imports use the `@/` alias (maps to `src/`).

## Architecture

- UI components contain no database or third-party API calls.
- Data access and business logic live in `src/services/`.
- Payment / shipping / email calls live only in `src/lib/payments|shipping|email`.
- The service-role Supabase client is only imported from `src/services/*` and route handlers,
  never from components. Files using it import `server-only`.
- Every server action and route handler validates input with zod from `src/lib/validation`.
- Every admin action calls `requireAdmin()` first.

## Money and stock

- Money is stored and computed in **paise (integer)**. Format only at the edge.
- Never accept a price, discount, tax, shipping fee or stock value from the client.
- Inventory changes only through the Postgres functions.

## UI

- Follow `docs/DESIGN.md` tokens and components. No new colours, radii or fonts.
- Every data view has loading, empty and error states.
- Mobile first; check 375px before desktop.
- No em/en dashes in UI copy. No invented marketing claims or numbers.

## Security

- Never expose secrets. Only `NEXT_PUBLIC_*` values reach the browser.
- Verify authentication and authorization on the server for every mutation.
- RLS enabled on every table in `public`. Policies combine role (`to authenticated`) and
  ownership (`auth.uid() = user_id`). Admin checks use `public.is_admin()`.
- Verify all webhook signatures; store event IDs for idempotency.
- Show human-readable errors; log technical details server-side only.

## Database

- All schema changes are SQL files in `supabase/migrations/` (timestamped, never edited after
  being applied to production; add a new migration instead).
- Add `created_at` / `updated_at`, foreign keys, constraints and indexes.

## Testing

- Add unit tests for pure logic (pricing, coupons, tax, status mapping, signatures).
- Add/extend RLS integration tests when policies change.
- Before marking a task done: `npm run typecheck`, `npm run lint`, `npm test`, and
  `npm run build` for anything touching routes.

## Git

- One task = one small commit, message `type(scope): summary` (feat, fix, chore, docs, test).
- Never commit `.env.local` or real credentials.

## After each task

- Tick it in `TASKS.md`, update `docs/MEMORY.md`, record new decisions in `docs/DECISIONS.md`.
