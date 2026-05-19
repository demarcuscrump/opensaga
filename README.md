<div align="center">

# OpenSaga

**Forge Universes. Govern Canon.**

An open-source collaborative universe-building platform where communities create, vote on, and evolve shared fictional worlds.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Auth-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Alpha%20Production%20Track-orange)]()
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen)]()

</div>

---

## What It Is

OpenSaga is a community-governed worldbuilding platform. A creator starts a World, defines a World Bible, and invites others to submit characters, lore, factions, and other entries. Contributions move through a Proposal -> Vote -> Canon loop so communities can grow shared fictional universes without losing the source of truth.

The long-term goal is a production-ready open-source platform for anime, manga, comic, tabletop RPG, writer, and fandom communities.

For the full product vision, open-core strategy, creator ownership stance, and long-term AI architecture, see [docs/vision.md](./docs/vision.md).

---

## Current Status

OpenSaga is no longer just a static prototype. The current alpha includes a real React app, Supabase-backed service layer, auth context, governance APIs, a BYOK AI layer, lightweight agent workflows, a production Tailwind build pipeline, route-level bundle splitting, and automated tests.

It is still pre-public-beta. Before production launch, the project needs a hosted Supabase project, OAuth provider configuration, RLS/security review, production deployment, broader governance E2E coverage, and an accessibility pass.

---

## Implemented Today

### Worlds, Proposals, and Canon
- World discovery, world hubs, profile views, proposal creation, and voting UI.
- Supabase migrations for profiles, worlds, bible sections, entities, votes, memberships, and activity.
- Service APIs for worlds, characters/entities, profiles, memberships, votes, activity, and governance.
- Proposal tallying logic with threshold-based Canon or Rejected transitions.
- Supabase Edge Function scaffold for automated proposal tallying.

### Authentication and Profiles
- Supabase auth context with session management.
- Protected routes for creation, studio, and profile surfaces.
- OAuth sign-in hooks for GitHub, Discord, and Google when Supabase is configured.
- Offline/demo mode fallback when Supabase environment variables are not configured.

### Creator Studio
- Multi-tool creative workspace with Character Forge, World Seed, Creation DNA, Lore Crafter, Brainstorm, and Canon Check.
- Draft persistence through local storage.
- Creation DNA originality lens with controlled tags, human review, and local vault comparison.
- Character board framework with selectable sections for image-seeded character profiles.
- Character export options.
- Image analysis path for character references.
- Agent debug logging and streaming hooks.

### BYOK AI
- Provider-agnostic AI engine with OpenAI, Anthropic, OpenRouter, Ollama, and mock adapters.
- Lightweight agent layer for canon checks, world architecture, character deepening, proposal analysis, creation DNA, and vision analysis.
- User API keys stay in the browser's local storage and are never sent to OpenSaga servers. Local storage is convenient, but not a hardened secret vault; production deployments should pair this with a strong CSP and XSS review.

### Quality Gates
- Vitest test suite for agent schemas, model factory, logging, streaming, rate limiting, and workflows.
- Playwright smoke E2E tests for navigation, discovery, creation, and Creator Studio settings.
- TypeScript typecheck script.
- GitHub Actions CI for install, typecheck, test, build, and Playwright E2E.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript 5.8 |
| Build | Vite 6 |
| Routing | React Router v7 |
| Styling | Tailwind CSS via Vite/PostCSS, semantic brand tokens, Paper/Noir themes, world accent colors |
| Client State | Zustand 5 |
| Server State | TanStack React Query v5 |
| Backend | Supabase Postgres, Auth, RLS, Edge Functions |
| AI | BYOK adapters plus lightweight agent workflows |
| Tests | Vitest, Testing Library, jsdom, Playwright |

Tailwind is built through Vite/PostCSS with content scanning in `tailwind.config.cjs`.

---

## Project Structure

```text
src/
  app/                    App shell, routes, layout, navigation
  components/             Reusable UI components
  core/                   Domain types, constants, seed data
  features/
    ai-assist/            Creator Studio, AI engine, agents, settings
    auth/                 Login and protected-route flows
    proposals/            Proposal creation and voting UI
    users/                Profiles and reputation UI
    worlds/               Landing, discovery, world hub, activity
  hooks/                  Agent, voting, membership hooks
  lib/                    Supabase client, auth provider, database types
  services/               Supabase-backed API abstractions
  store/                  Zustand stores

supabase/
  migrations/             Database schema and RPC migrations
  functions/              Edge Function for automated proposal tallying
```

---

## Quick Start

**Prerequisites:** Node.js 20+ recommended.

```bash
git clone https://github.com/demarcuscrump/opensaga.git
cd opensaga
npm install
npm run dev
```

The Vite dev server runs at `http://localhost:3000`.

OpenSaga can run without Supabase credentials in offline/demo mode. To connect a Supabase project:

```bash
cp .env.example .env.local
```

Then fill in:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Run the full local verification suite:

```bash
npm run check
npm run test:e2e
```

---

## Documentation

| Document | Description |
|---|---|
| [docs/vision.md](./docs/vision.md) | Product vision, open-core strategy, creator ownership, and LangGraph roadmap |
| [OPENSAGA_RULES.md](./OPENSAGA_RULES.md) | Product rules, positioning, UX principles, design standards |
| [CREATOR_STUDIO_PRD.md](./CREATOR_STUDIO_PRD.md) | Creator Studio product spec and phased roadmap |
| [COPYWRITING_GUIDE.md](./COPYWRITING_GUIDE.md) | Brand voice, vocabulary, microcopy patterns |
| [docs/brand](./docs/brand) | OpenSaga palette, Canon Loop status colors, and world accent rules |
| [PRODUCTION_READINESS.md](./PRODUCTION_READINESS.md) | Current readiness audit, risks, and launch checklist |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Technical architecture, data flow, AI layer, boundaries, and Creation DNA architecture decision |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Contribution workflow and PR expectations |
| [docs/contributor-roadmap.md](./docs/contributor-roadmap.md) | Good first issue areas and public beta contributor lanes |
| [docs/deployment.md](./docs/deployment.md) | Self-hosting and deployment guide |
| [SECURITY.md](./SECURITY.md) | Security policy and private vulnerability reporting |
| [SUPPORT.md](./SUPPORT.md) | Where to ask questions or get help |
| [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) | Community standards |

---

## Roadmap

### Alpha Complete
- [x] React/Vite application shell with desktop and mobile navigation
- [x] World discovery, world hub, proposals, voting UI, profiles
- [x] Supabase schema, RLS policies, API layer, auth context
- [x] Proposal vote tallying and reputation update logic
- [x] Creator Studio MVP with six active creation tools
- [x] BYOK AI adapters for OpenAI, Anthropic, OpenRouter, Ollama, and mock mode
- [x] Lightweight agent workflows with structured Zod output validation
- [x] Tailwind Vite/PostCSS pipeline with CDN removed
- [x] Route-level lazy loading and manual vendor bundle splitting
- [x] Vitest suite, Playwright smoke E2E, TypeScript typecheck, and GitHub Actions CI
- [x] MIT license and open-source contribution docs
- [x] Security policy, support guide, issue templates, and pull request template

### Before Public Beta
- [ ] Configure hosted Supabase project and OAuth providers
- [ ] Run RLS/security review against real project data
- [ ] Expand Playwright E2E to cover create world -> submit proposal -> vote -> canon
- [ ] Add documented bundle budgets and optional bundle analysis
- [ ] Add accessibility pass across navigation, forms, modals, and mobile flows
- [ ] Add search/filtering across worlds and entities
- [ ] Add Realtime subscriptions for active vote updates
- [ ] Deploy preview and production environments

### Later
- [ ] Relationship graph and timeline views
- [ ] Power system and species builder modules
- [ ] Rich text/markdown editor for World Bible sections
- [ ] Supabase Storage for images and assets
- [ ] Plugin system for custom governance rules
- [ ] Public API and export formats

---

## License

OpenSaga is released under the [MIT License](./LICENSE).

Code is open source. Worlds, characters, lore, and other content created by users belong to their creators.
