<div align="center">

# OpenSaga

**Forge Universes. Govern Canon.**

An open-source collaborative universe-building platform where communities create, vote on, and evolve shared fictional worlds.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Zustand](https://img.shields.io/badge/Zustand-5-764ABC?logo=react)](https://github.com/pmndrs/zustand)
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Alpha-orange)]()
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen)]()

</div>

---

## The Problem

Worldbuilding is a collaborative act trapped in solo tools. Writers use Google Docs. TTRPG groups use Discord threads. Manga creators use group chats. Fandoms use wikis with no governance.

The result: lore contradictions, no canonical authority, fragmented content, and creative communities that can't scale beyond a handful of people.

## The Solution

OpenSaga is a **community-governed worldbuilding platform**. A creator starts a World. They write a World Bible — the canonical source of truth. Then the community joins. Members submit Proposals (characters, lore, factions, locations). The community votes. If a Proposal passes the threshold, it becomes **Canon** — permanent, official, part of the world's history.

Every World chooses its own governance:

- **Creator Dictatorship** — The original creator has absolute authority
- **Democracy** — Community votes decide Canon (configurable threshold)
- **Lorekeeper Council** — A trusted group of high-reputation curators decide

---

## Who This Is For

| Audience | Use Case |
|---|---|
| **Anime & Manga Creators** | Build character rosters, power systems, and shared universes with visual character creation |
| **Tabletop RPG Groups** | Manage shared campaign worlds with structured governance and session-linked canon |
| **Worldbuilding Enthusiasts** | Build universes too big for one person — lore, factions, timelines, geography |
| **Writer Collectives** | Collaborate on shared-universe anthologies with proposal/approval workflow |
| **Fandom Communities** | Create and govern fan-canon with community voting and reputation |

---

## Core Features

### Worlds & World Bibles
Every universe starts with a World. The World Bible is the constitution — it defines the rules, history, geography, magic/tech systems, and tone. Every Proposal is judged against it.

### Proposals & Canon Voting
Content is never just "added." It is proposed, reviewed, and voted on. If it passes the World's voting threshold, it transitions from Proposal to Canon — the permanent record.

### Flexible Governance
Not every universe should be a democracy. OpenSaga supports multiple governance models so each World operates the way its community prefers.

### Creator Studio (AI-Powered)
A dedicated creative workspace with specialized tools:
- **Character Forge** — Multi-tab character builder (identity, appearance, backstory, abilities, stats, relationships)
- **World Seed** — Structured World Bible editor with 8 sections
- **Lore Crafter** — Templates for historical events, technology, mythology, factions
- **Brainstorm Engine** — AI-assisted plot hooks, faction ideas, story arcs
- **Canon Check** — Validate proposals against the World Bible for consistency
- **Relationship Mapper** — Visual character connection graphs
- **Power System Generator** — Design magic/tech frameworks with rules and limitations
- **Species Builder** — Custom species with biology, culture, and naming conventions

### Bring Your Own Key (BYOK)
OpenSaga is provider-agnostic. Plug in OpenAI, Anthropic, Ollama, or any OpenRouter-compatible model. API keys stay in your browser — never touch our servers. AI is optional — the platform is fully functional without it.

### Reputation & Profiles
Users earn reputation through successful Canon proposals. Profiles showcase created Worlds, Characters, and community standing. Roles progress: Wanderer → Citizen → Architect → Lorekeeper → Creator.

### Dual-Theme Design System
- **Noir** (default) — Deep, cinematic dark mode. Like editing in a film studio at 2am.
- **Paper** — Clean, warm light mode. Like a manuscript on aged paper.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React 19 + TypeScript 5.8 |
| **Build** | Vite 6 |
| **Routing** | React Router v7 |
| **Styling** | TailwindCSS (custom semantic token system) |
| **Client State** | Zustand 5 (persisted) |
| **Server State** | TanStack React Query v5 |
| **Backend** | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| **AI Engine** | Provider-agnostic BYOK (OpenAI, Anthropic, Ollama adapters) |
| **Architecture** | Feature-Sliced Design (FSD) |

---

## Project Structure

```
src/
├── app/                    # App shell, routing, layout, sidebar, mobile nav
├── core/                   # Types, constants, seed data
│   ├── data/               # Standard libraries (powers, archetypes, species)
│   └── types.ts            # Domain models (World, Character, Proposal, User)
├── components/             # Reusable UI (Button, Input, Card, Badge, Toast)
├── features/
│   ├── worlds/             # Landing, Discovery, World Hub (5 tabs)
│   ├── proposals/          # Multi-step creation flow, Voting progress
│   ├── users/              # User profiles, reputation
│   ├── ai-assist/          # Creator Studio, AIEngine interface, BYOK settings
│   └── auth/               # Authentication (Supabase OAuth)
├── services/               # API abstraction layer
└── store/                  # Zustand stores (UI config, AI state)
```

---

## Quick Start

**Prerequisites:** Node.js 18+

```bash
git clone https://github.com/demarcuscrump/opensaga.git
cd opensaga
npm install
npm run dev
```

Opens at `http://localhost:3000`.

---

## Documentation

| Document | Description |
|---|---|
| [OPENSAGA_RULES.md](./OPENSAGA_RULES.md) | Master product rules — identity, UX, design system, technical standards |
| [CREATOR_STUDIO_PRD.md](./CREATOR_STUDIO_PRD.md) | Full Creator Studio specification — Character Forge, World Seed, all 8 AI tools |
| [COPYWRITING_GUIDE.md](./COPYWRITING_GUIDE.md) | Brand voice, vocabulary, microcopy patterns, tone calibration |
| [PRODUCTION_READINESS.md](./PRODUCTION_READINESS.md) | Honest audit, scorecard, gap analysis, implementation roadmap |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Technical architecture — FSD, state management, AI engine |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Contribution guidelines for developers, designers, and writers |
| [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) | Community standards |

---

## Roadmap

### Completed (Alpha)
- [x] Feature-Sliced Architecture with 7 routes
- [x] Landing page, Discovery feed, World Hub (Overview, Bible, Characters, Activity, Governance)
- [x] Multi-step World & Character creation flow with progress indicators
- [x] Community voting UI with real-time consensus progress bars
- [x] User profiles with stats, bio, and reputation display
- [x] BYOK AI engine abstraction (interface + mock provider)
- [x] Creator Studio (basic prompt/output workspace)
- [x] Dual-theme design system (Noir + Paper) with semantic tokens
- [x] Desktop sidebar + mobile bottom navigation
- [x] Full open-source documentation suite

### In Progress (v1.0)
- [ ] Supabase backend (PostgreSQL + RLS + Edge Functions)
- [ ] Authentication (GitHub, Discord, Google OAuth)
- [ ] Creator Studio rebuild (Character Forge, World Seed, 8 AI tools)
- [ ] Real BYOK AI adapters (OpenAI, Anthropic, OpenRouter, Ollama)
- [ ] Proposal → Vote → Canon pipeline (real persistence + enforcement)
- [ ] World membership and invitation system
- [ ] Search and filtering
- [ ] Test suite (Vitest + Playwright, 80+ tests target)
- [ ] CI/CD (GitHub Actions → Vercel)

### Future (v1.1+)
- [ ] Cross-world character migration (with governance approval)
- [ ] Visual timeline / relationship graph
- [ ] Embeddable World Bible widgets
- [ ] Plugin system for custom governance
- [ ] Public API for third-party integrations
- [ ] AI image generation integration
- [ ] Collaborative real-time editing
- [ ] Export as PDF / ePub / JSON

---

## Contributing

We welcome contributions from developers, designers, writers, and worldbuilders of all skill levels. Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before submitting a pull request, and review our [Code of Conduct](./CODE_OF_CONDUCT.md).

---

## License

OpenSaga is released under the [MIT License](./LICENSE).

Code is open source. Worlds created by users belong to their creators.
