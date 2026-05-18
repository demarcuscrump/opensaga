# OpenSaga Production Readiness Audit

**Last updated:** May 17, 2026  
**Audit scope:** frontend, backend architecture, auth, data layer, AI, security, testing, docs, deployment  
**Verdict:** Production-track alpha. The project has moved beyond prototype status, but it is not ready for a public production launch until deployment, security review, and fuller governance E2E coverage are finished.

---

## Executive Summary

OpenSaga now has the core pieces expected from a serious open-source platform:

- React/Vite application with typed feature boundaries
- Supabase schema, RLS policies, auth context, and service APIs
- Proposal -> Vote -> Canon governance flow
- Creator Studio MVP with real BYOK provider adapters
- lightweight agent workflows with structured Zod validation
- Tailwind compiled through Vite/PostCSS instead of a browser CDN
- Route-level lazy loading and manual vendor bundle splitting
- Vitest coverage for the agent layer plus Playwright smoke E2E
- TypeScript typecheck, production build, and GitHub Actions CI with E2E
- MIT license and contributor documentation

The biggest remaining risks are security enforcement, production deployment, governance E2E depth, accessibility, and formal performance budgets.

---

## Scorecard

| Category | Status | Grade | Notes |
|---|---|---:|---|
| Frontend UI | Strong alpha | B+ | Polished dual-theme app shell, world hub, proposal UI, mobile nav. Needs accessibility pass. |
| Creator Studio | MVP implemented | B | Five active tools, autosave, export, BYOK, agent logs. Relationship/power/species tools remain roadmap. |
| Supabase schema | Implemented | B | Migrations for core tables, indexes, RLS policies, reputation RPC. Needs deployed-project validation. |
| Auth | Implemented alpha | B- | Session provider, protected routes, OAuth hooks. Needs provider setup and production redirect testing. |
| Governance loop | Implemented alpha | B- | Votes, thresholds, canon/reject transitions, activity, reputation. Needs server-trusted enforcement review. |
| AI/BYOK layer | Strong alpha | B+ | OpenAI, Anthropic, OpenRouter, Ollama, mock adapters; lightweight agent workflows. Needs XSS/CSP hardening. |
| Testing | Good start | B | 64 Vitest tests and 4 Playwright smoke E2E tests passed during audit. Needs service/integration tests and deeper governance E2E. |
| TypeScript | Passing | B | `tsc --noEmit` passes. Strict mode and no-any standards are not yet enforced. |
| CI | Implemented | B+ | GitHub Actions runs install, typecheck, test, build, and Playwright E2E. |
| Documentation | Updated | B+ | README, architecture, production audit aligned with current code. PRD/rules still include future specs. |
| Security | Needs review | C | RLS exists, but production security and key-handling threat model need review. |
| Performance | Improved | B- | Build passes without large chunk warnings after lazy routes, provider splitting, and agent chunk isolation. Needs documented budget. |
| Deployment | Not ready | D | No live hosted Supabase/Vercel deployment documented yet. |
| Styling pipeline | Implemented | B | Tailwind runs through Vite/PostCSS with content scanning. Needs design/accessibility QA before public beta. |

### Overall Grade: B-

OpenSaga is a credible alpha and open-source foundation. It should be presented as production-track, not production-finished.

---

## Verified During Audit

Commands run from `OpenSaga/`:

```bash
npm test -- --run
npm run test:e2e
npm run build
npm exec tsc -- --noEmit
```

Results:

- Unit tests: 7 files, 64 tests passing.
- E2E tests: 4 Playwright smoke tests passing.
- Build: passing without chunk-size warnings.
- Typecheck: passing after React type packages, Supabase type shape, and agent tool typing were fixed.

Bundle status:

- No production chunks exceed Vite's default warning threshold after route and provider splitting.
- Creator Studio and route views are lazy-loaded.
- Agent orchestration is isolated from the initial world hub bundle.

---

## What Is Production-Track Now

### Backend and Data

The app now has real Supabase integration rather than only mock constants:

- typed Supabase client
- auth-aware profile loading/creation
- world and entity APIs
- vote and governance APIs
- activity feed APIs
- migrations and RLS policies
- Edge Function scaffold for tallying expired proposals

This is enough for an alpha contributor to understand the intended production backend.

### AI System

The AI layer is materially implemented:

- BYOK provider store
- model, endpoint, key, and temperature settings
- direct provider adapters
- fetch-backed BYOK model factory
- lightweight agent workflows
- agent tools that can fetch World Bible and canon context from Supabase
- structured Zod validation and fallback behavior
- logging, rate limiting, and streaming utilities

### Open-Source Hygiene

The repo now has:

- MIT license file
- package metadata
- `typecheck` and `check` scripts
- GitHub Actions CI
- Playwright configuration and smoke E2E coverage
- clearer contributor workflow
- docs that distinguish implemented features from roadmap features

---

## Launch Blockers

### 1. Production Supabase Project

OpenSaga needs a real hosted Supabase project configured with:

- migrations applied
- OAuth providers configured
- redirect URLs verified
- anon key in deployment environment
- RLS policies tested as anonymous, member, author, creator, and non-member users
- Edge Function deployed and scheduled

### 2. Server-Trusted Governance

The client governance helpers are useful, but public production should not rely on browser-triggered state transitions alone.

Required:

- move final proposal tallying into Edge Function or database RPC
- ensure only trusted server code can canonize/reject expired proposals
- keep client-side tally previews as display-only
- test double-vote and unauthorized update paths

### 3. E2E Expansion

Initial Playwright smoke coverage exists. Before public beta, expand it into the full governance loop:

- login/logout
- create world
- create character draft
- submit proposal
- cast/change/remove vote
- proposal expiry/tally
- protected-route redirects
- mobile navigation

### 4. Accessibility and Styling QA

Tailwind now runs through a production Vite/PostCSS pipeline. Before public beta, complete a design and accessibility QA pass:

- keyboard navigation
- focus states
- form labeling
- modal behavior
- color contrast
- mobile layout checks

### 5. Performance and Bundle Splitting

The build now passes without chunk-size warnings. Keep that protected with:

- bundle analysis
- documented bundle budget
- CI checks if bundle growth becomes a risk

### 6. Security Review

Required before production:

- CSP for app and AI-provider calls
- XSS review, especially because BYOK keys live in local storage
- dependency audit process
- RLS test matrix
- user-generated content sanitization rules
- OAuth redirect/domain verification

---

## Recommended Public Positioning

Use:

> OpenSaga is an open-source, production-track alpha for community-governed worldbuilding.

Avoid:

> OpenSaga is production ready.

The first statement is honest and strong. The second invites scrutiny that the current deployment, security, and governance E2E depth cannot satisfy yet.

---

## Next Milestone Checklist

### Public Beta Readiness

- [ ] Provision hosted Supabase project
- [ ] Apply migrations and verify generated database types
- [ ] Configure GitHub, Discord, and Google OAuth
- [ ] Deploy app to Vercel/Netlify/Cloudflare Pages
- [ ] Deploy and schedule proposal tally Edge Function
- [ ] Expand Playwright E2E tests for the full governance loop
- [ ] Add documented bundle budget and optional bundle analyzer workflow
- [ ] Add RLS/security test matrix
- [ ] Add basic accessibility pass
- [ ] Add deployment documentation

### v1.0 Readiness

- [ ] Real-time vote updates
- [ ] Search and filtering
- [ ] Supabase Storage for world/character images
- [ ] Rich text or markdown World Bible editor
- [ ] Relationship graph
- [ ] Public API/export story
- [ ] Moderation and reporting flow
- [ ] Admin/lorekeeper council workflows

---

## Residual Risk

The product direction is strong. The main risk is not whether OpenSaga is a real project anymore; it is keeping the launch claims aligned with the implementation. Treat security, deployment, and deeper governance E2E coverage as the bridge from impressive alpha to production-ready open-source platform.
