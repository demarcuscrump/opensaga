# OpenSaga — Production Readiness Audit

**Last updated:** May 2026  
**Audit scope:** Frontend, backend architecture, data layer, AI, security, UX, testing, deployment  
**Verdict:** High-fidelity frontend prototype. No backend. No persistence. No auth. Significant work required for v1.0.

---

## Scorecard

| Category | Status | Grade | Notes |
|---|---|---|---|
| **Frontend UI** | Polished prototype | B+ | Beautiful design system, dual theme, good component library. Missing Creator Studio depth. |
| **Routing & Navigation** | Working | A- | 7 routes, desktop sidebar + mobile bottom nav, clean layout |
| **Design System** | Strong | A | Custom token system (noir/paper), semantic colors, serif/sans typography, consistent spacing |
| **Component Library** | Basic but clean | B | Button, Input, TextArea, Select, Badge, Toast, WorldCard, CharacterCard. Need more. |
| **Creator Studio** | Simulated only | D | 4 modes with setTimeout mock. No real AI. No structured output. No multi-tab builder. |
| **AI Engine** | Interface only | C- | AIEngine interface defined, MockAIEngine implemented. No real provider adapters. |
| **Authentication** | None | F | No Supabase auth. No OAuth. Empty `features/auth/` directory. |
| **Database / Persistence** | None | F | All data is MOCK_* constants. Nothing persists. |
| **API Layer** | Mock stubs | D | `api.worlds.ts` and `api.characters.ts` exist but return mock data with simulated delay. |
| **State Management** | Solid | B+ | Zustand (persisted UI store) + TanStack React Query (prepared for real API). Good architecture. |
| **Testing** | None | F | No test files, no test dependencies, no CI. |
| **Accessibility** | Partial | C | Some semantic HTML. No ARIA labels, no focus management, no keyboard shortcuts. |
| **Performance** | Untested | C | No code splitting, no lazy loading, no bundle analysis. Single-route bundle. |
| **Documentation** | Good for alpha | B | README, ARCHITECTURE, CONTRIBUTING, CODE_OF_CONDUCT all exist. Need OPENSAGA_RULES, PRDs. |
| **Security** | Not applicable yet | — | No auth, no user data, no API keys server-side. BYOK stores in localStorage. |
| **Deployment** | None | F | No CI/CD, no Dockerfile, no Vercel config, no environment management. |
| **Mobile Responsive** | Partial | B- | Bottom nav exists. Some views responsive. Creator Studio not mobile-ready. |

### Overall Grade: **C+**
Beautiful design, solid architecture decisions, no backend or persistence.

---

## What's Working Well

1. **Design system is commercial-grade.** The noir/paper dual-theme with semantic tokens is better than most open-source projects. The warm gold accent, serif headings, and elevated surface hierarchy create a genuinely premium feel.

2. **Feature-Sliced Design architecture.** Clean separation of concerns. Easy to scale. `features/`, `services/`, `store/`, `components/` — this structure will support the full product.

3. **Zustand + React Query pairing.** Client state and server state are properly separated. When Supabase replaces the mocks, React Query will handle caching, invalidation, and optimistic updates with minimal rewiring.

4. **World Hub is impressive.** Hero image, tabbed content (Overview, Bible, Characters, Activity, Governance), sidebar stats — this is a strong foundation.

5. **Creation flow is well-designed.** Multi-step form with progress dots, type selection (World vs Character), AI wand assist — the UX bones are correct.

6. **BYOK model is the right call.** No server-side AI costs. Users bring their own keys. Client-side execution. Provider-agnostic interface.

---

## Critical Gaps (Must Fix for v1.0)

### Gap 1: No Backend / No Persistence
**Impact:** Total. Nothing saves. Close the browser, everything is gone.

**Solution:**
- Provision Supabase project (free tier supports MVP)
- Schema: `users`, `worlds`, `world_bible_sections`, `entities` (characters/lore/factions), `votes`, `activity_log`
- Replace `MOCK_WORLDS`, `MOCK_CHARACTERS`, `MOCK_USER` with real queries
- Replace `api.worlds.ts` / `api.characters.ts` with Supabase client calls
- Add RLS policies for all tables

**Estimated effort:** 2-3 weeks

### Gap 2: No Authentication
**Impact:** Total. No user identity = no proposals, no voting, no reputation.

**Solution:**
- Supabase Auth with GitHub + Discord + Google OAuth
- Session management via Supabase `onAuthStateChange`
- Protected routes (Studio, Create, Profile require auth)
- Public routes (Landing, Explore, World Hub viewable without auth)
- User profile creation on first login

**Estimated effort:** 1 week

### Gap 3: Creator Studio is a Shell
**Impact:** High. The Studio is the flagship feature and currently it's a simulated prompt/output pane.

**Solution:** See `CREATOR_STUDIO_PRD.md` for full specification. Phase 1 MVP:
- Character Forge with 4+ tabs (Identity, Appearance, Backstory, Abilities)
- World Seed with structured Bible editor (8 sections)
- Real AI integration (BYOK with OpenAI/Anthropic adapters)
- Auto-save drafts
- Submit as Proposal flow

**Estimated effort:** 3-4 weeks

### Gap 4: No Testing
**Impact:** High. Can't accept community PRs without CI. Can't refactor safely.

**Solution:**
- Add Vitest + React Testing Library
- Unit tests: Zustand stores, AIEngine adapters, utility functions
- Component tests: Button, Input, WorldCard, CharacterCard, StatusBadge
- Integration tests: Creation flow (multi-step), Voting flow
- E2E: Playwright for critical paths (create world → submit proposal → vote → canon)
- Target: 80+ tests before v1.0

**Estimated effort:** 2 weeks

### Gap 5: No Voting Pipeline
**Impact:** High. The core feature (Proposal → Vote → Canon) is UI-only. Votes don't persist. Thresholds don't enforce.

**Solution:**
- Real vote persistence in Supabase
- Edge function or cron: check expired proposals, tally votes, transition state
- Governance enforcement: respect world's threshold percentage
- Real-time vote count updates (Supabase Realtime subscriptions)
- Prevent double voting (RLS + unique constraint)

**Estimated effort:** 1-2 weeks

### Gap 6: No Search
**Impact:** Medium. With 2 mock worlds it doesn't matter. With 100+ it's essential.

**Solution:**
- Supabase full-text search on worlds, characters, lore entries
- Search bar in Explore view
- Filter by genre, governance type, world status
- Future: pgvector for semantic search

**Estimated effort:** 1 week

---

## System Architecture (Target v1.0)

```
┌───────────────────────────────────────────────────────┐
│                    OPENSAGA CLIENT                      │
│            React 19 · Zustand · React Query             │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌─────────────────────┐  │
│  │ Landing  │  │ Explore  │  │   Creator Studio    │  │
│  │ WorldHub │  │ Profiles │  │   (BYOK AI Engine)  │  │
│  │ Activity │  │ Search   │  │   Character Forge   │  │
│  │ Voting   │  │          │  │   World Seed        │  │
│  └──────────┘  └──────────┘  └─────────────────────┘  │
│                       │                    │            │
│              React Query REST      Client-side LLM     │
│                       │            (user's API key)    │
└───────────────────────┼────────────────────────────────┘
                        │
              ┌─────────┴──────────┐
              │     SUPABASE       │
              │                    │
              │  Auth (OAuth)      │
              │  PostgreSQL + RLS  │
              │  Storage (images)  │
              │  Edge Functions    │
              │  Realtime (votes)  │
              └────────────────────┘
```

---

## Database Schema (Target v1.0)

```sql
-- Users (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  banner_url TEXT,
  bio TEXT DEFAULT '',
  role TEXT DEFAULT 'CITIZEN',
  reputation INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Worlds
CREATE TABLE worlds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  hero_image TEXT,
  genre TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'OPEN',
  governance TEXT DEFAULT 'COMMUNITY_VOTE',
  voting_threshold INTEGER DEFAULT 60,
  creator_id UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- World Bible Sections
CREATE TABLE bible_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID REFERENCES worlds(id) ON DELETE CASCADE,
  section_key TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Entities (characters, lore, factions)
CREATE TABLE entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID REFERENCES worlds(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- CHARACTER, LORE, FACTION
  data JSONB NOT NULL DEFAULT '{}',
  status TEXT DEFAULT 'DRAFT',
  author_id UUID REFERENCES profiles(id) NOT NULL,
  justification TEXT,
  voting_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Votes
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  vote_type TEXT NOT NULL, -- UP, DOWN
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(entity_id, user_id) -- one vote per user per entity
);

-- World Membership
CREATE TABLE memberships (
  world_id UUID REFERENCES worlds(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'CITIZEN',
  joined_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (world_id, user_id)
);

-- Activity Log
CREATE TABLE activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID REFERENCES worlds(id),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-3)
- [ ] Supabase project + schema migration
- [ ] GitHub/Discord/Google OAuth
- [ ] Replace all MOCK_* with real Supabase queries
- [ ] Protected routes + session management
- [ ] Profile creation on first login
- [ ] World CRUD (create, read, update)
- [ ] Character/Entity CRUD
- [ ] Basic image upload (Supabase Storage)

### Phase 2: Core Loop (Weeks 4-6)
- [ ] Proposal submission flow (entity status → PROPOSAL)
- [ ] Voting system (real persistence, RLS, unique constraint)
- [ ] Vote tallying (edge function on time expiry)
- [ ] Governance enforcement (threshold check)
- [ ] Activity feed (real events)
- [ ] Reputation system (earn rep from canon approvals)
- [ ] World membership (join/leave)

### Phase 3: Creator Studio Rebuild (Weeks 7-10)
- [ ] Character Forge (multi-tab builder)
- [ ] World Seed (structured Bible editor)
- [ ] Real AI integration (OpenAI + Anthropic adapters)
- [ ] Structured output with Zod validation
- [ ] Canon Check tool
- [ ] Auto-save drafts
- [ ] Submit as Proposal from Studio

### Phase 4: Polish & Launch (Weeks 11-12)
- [ ] Test suite (80+ tests, Vitest + Playwright)
- [ ] GitHub Actions CI (lint, type-check, test, build)
- [ ] Vercel deployment + preview environments
- [ ] SEO (OpenGraph tags, meta descriptions)
- [ ] Accessibility pass (ARIA, focus, keyboard)
- [ ] Performance (code splitting, lazy routes, bundle analysis)
- [ ] Security audit (RLS review, no leaked secrets)
- [ ] README rewrite + launch blog post

---

## Risk Register

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Supabase free tier limits | Medium | High | Monitor usage. Upgrade plan at 500+ users. |
| BYOK key management (localStorage theft via XSS) | Low | High | CSP headers, no eval, sanitize all user input |
| AI abuse (generating offensive content) | Medium | Medium | Content moderation in governance. Community flagging. World-level content rules. |
| Scope creep (too many Studio features before v1) | High | High | Strict phase gates. Ship Phase 1 Studio, iterate. |
| Community doesn't form | Medium | High | Seed 3-5 high-quality worlds before launch. Recruit creators from existing communities. |

---

*This document tracks the honest state of the project. Update after every major milestone.*
