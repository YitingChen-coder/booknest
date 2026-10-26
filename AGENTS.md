<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# BookNest

A book discovery and personal shelf app. People search books from the Open Library API, save the ones they like to their own shelf, and come back to them later. Each signed-in person sees only their own shelf.

Course: Design, Build, Ship (MPCS 51238), Assignment 4: Full Stack App.

## Tech stack

- Next.js 16 (App Router, `src/` dir, TypeScript) + Tailwind CSS v4
- Clerk for sign-up / sign-in / sign-out (development keys only)
- Supabase (Postgres) for data, with Clerk connected via Supabase third-party auth
- Open Library API (no key) for book data
- Playwright for the end-to-end test
- Deployed on Vercel (Hobby plan)

## Rules

- **Keys:** all keys live in `.env.local` only. Never write keys in code, docs or commits. The agent is denied from reading `.env` / `.env.*` (see `.claude/settings.json`); the user creates and edits `.env.local` themselves. `.env.example` lists variable names with empty values.
- **Data ownership:** every table that holds someone's data has a `user_id` column (the Clerk user id), and row-level security is on for every table so a person can only read and write their own rows.
- **Database changes:** made as Supabase migrations, never by hand-editing tables.
- **API calls:** Open Library is called from our server (Next.js route handler), not from the browser. Reasons: one place to set a descriptive User-Agent, cache responses, and handle errors and rate limits.
- **UI states:** every API-backed view designs for loading, nothing found, and API unavailable.
- **Git:** work on the `dev` branch, commit and push after each step. Merge to `main` through a PR only after `/security-review`.

## Data model

_To be decided in Step 2._

## Progress

- [x] Step 0: Scaffold Next.js + Tailwind, AGENTS.md
- [ ] Step 1: Explore the Open Library API
- [ ] Step 2: Data model
- [ ] Step 3: Protect keys (deny rule, `.env.local`)
- [ ] Step 4: Clerk sign-in
- [ ] Step 5: Supabase + RLS, connected to Clerk
- [ ] Step 6: Search + shelf UI, server-side API route
- [ ] Step 7: Playwright two-user test (fail first, then pass)
- [ ] Step 8: `/security-review`, merge, deploy on Vercel
