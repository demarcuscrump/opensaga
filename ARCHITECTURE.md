# OpenSaga Architecture

This document explains how the current OpenSaga alpha is organized. It is written for contributors who need to understand the application boundaries before changing features.

## System Shape

OpenSaga is a Vite React application backed by Supabase and optional client-side BYOK AI providers.

```text
React app
  -> AuthProvider / Supabase client
  -> React Query hooks and service APIs
  -> Supabase Postgres, RLS, Auth, Edge Functions

Creator Studio
  -> Zustand AI settings
  -> AIEngine provider adapter
  -> lightweight agent workflows
  -> Optional OpenAI, Anthropic, OpenRouter, or Ollama calls
```

The app also supports an offline/demo mode. When `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are missing, OpenSaga logs a warning, uses mock/demo data where possible, and keeps the UI explorable without a backend project.

## Directory Boundaries

```text
src/app
  App shell, router, sidebar, mobile navigation, top-level layout.

src/components
  Shared UI primitives and cards. These should stay domain-light.

src/core
  Domain types, constants, seed data, and static libraries.

src/features
  User-facing product areas. Feature folders own their screens, local components,
  and feature-specific logic.

src/hooks
  Cross-feature hooks for agents, streams, logs, memberships, and voting.

src/lib
  Supabase client, auth provider, protected-route behavior, generated database
  types, and low-level integration glue.

src/services
  API abstraction layer. Components should call services or hooks instead of
  reaching into Supabase directly.

src/store
  Zustand stores for persisted UI and AI configuration.

supabase
  Database migrations and Edge Functions.
```

## Data Layer

The production data model is defined in `supabase/migrations`.

Core tables:

- `profiles`: public user profile, role, reputation
- `worlds`: top-level fictional universes and governance settings
- `bible_sections`: structured World Bible sections
- `entities`: characters, lore, factions, drafts, proposals, canon, rejected entries
- `votes`: one vote per user per entity
- `memberships`: world membership and role mapping
- `activity`: append-only product activity feed

The client service layer in `src/services` handles:

- world CRUD and creator membership
- character/entity CRUD and proposal submission
- vote casting, removal, tallying, and active proposal lookup
- governance decisions and proposal state transitions
- profile and membership reads/updates
- activity feed creation and listing

## Auth Model

`src/lib/auth.tsx` owns session state. It listens to Supabase auth changes, loads or creates the user profile, and exposes login/logout/profile helpers through `useAuth`.

Protected routes currently cover:

- `/create`
- `/studio`
- `/profile`

When Supabase is not configured, protected routes allow demo access so contributors can inspect the product without provisioning infrastructure.

## Proposal -> Vote -> Canon

The core OpenSaga loop is represented in both client services and Supabase infrastructure:

1. A creator drafts an entity.
2. The entity is submitted as `PROPOSAL` with a voting deadline.
3. Members cast `UP` or `DOWN` votes.
4. Governance logic calculates approval percentage against the world's threshold.
5. Passing proposals become `CANON`; failed proposals become `REJECTED`.
6. Activity entries are written, and reputation can be awarded to the author.

`src/services/api.governance.ts` contains client-callable governance helpers. `supabase/functions/tally-proposals/index.ts` is the server-side Edge Function scaffold for scheduled automated tallying.

Before public beta, the server-side tally function and RLS policies should be reviewed against real project credentials so proposal state changes cannot be spoofed from the browser.

## Creator Studio and AI

The Creator Studio lives in `src/features/ai-assist`.

Implemented pieces:

- `CreatorStudioView.tsx`: workspace UI, tool modes, draft persistence, submit/export paths
- `AIEngine.ts`: provider-agnostic generation interface and direct fetch adapters
- `SettingsModal.tsx`: BYOK provider, key, model, endpoint, and temperature settings
- `store/aiStore.ts`: persisted AI configuration
- `agents/`: agent workflows, tools, schemas, logger, streaming, rate limiter

Supported providers:

- `mock`: local deterministic responses
- `openai`: OpenAI chat completions
- `anthropic`: Anthropic messages API
- `openrouter`: OpenAI-compatible OpenRouter endpoint
- `ollama`: local Ollama endpoint

API keys are stored in browser local storage. They are not sent to OpenSaga servers, but local storage is still exposed to XSS. Treat CSP, dependency hygiene, and input sanitization as launch blockers.

### Creation DNA Architecture Decision

Creation DNA is intentionally implemented in the existing browser-first TypeScript agent layer instead of a Python/LangGraph/Chroma sidecar.

Reasons:

- OpenSaga is currently a Vite React + Supabase app; adding Python would create a second runtime for contributors to install, run, test, and deploy.
- Existing AI tools already use TypeScript workflows, Zod-validated structured output, browser BYOK provider calls, agent logging, and local demo mode.
- The current originality check only needs a human-reviewed local DNA vault, so a hosted vector service would be premature infrastructure.
- The likely production path is Supabase Postgres plus vector search for a shared DNA vault, which fits the existing backend boundary better than Chroma at this stage.

LangGraph-style orchestration is still compatible with the long-term direction. If OpenSaga later adds a backend AI orchestration service, the Creation DNA flow can move from local vault comparison to a server workflow with shared vector search, audit logging, and stronger moderation controls.

## Testing and CI

Local quality gates:

```bash
npm run typecheck
npm run test
npm run test:e2e
npm run build
npm run check
```

CI runs typecheck, unit tests, build, Playwright browser install, and E2E tests on pushes and pull requests to `main`.

Current test coverage is strongest around the agent layer, with smoke E2E coverage for navigation, discovery, creation, and Creator Studio settings. Before public beta, the highest-value next tests are:

- service-layer tests for governance and votes
- auth/protected-route integration tests
- expanded Playwright E2E tests for create world -> submit proposal -> vote -> canon
- accessibility checks for modals, navigation, forms, and mobile flows

## Known Technical Debt

- Formal bundle budgets and analysis are not documented yet, even though current production chunks are below Vite's warning threshold.
- The Supabase Edge Function is scaffolded but not yet wired to a deployed scheduler.
- Demo mode is useful for contributors, but production deployments need explicit environment validation.
- RLS and governance enforcement need a real-project security pass before public beta.
