# OpenSaga Vision

**Status:** Product vision and open-core strategy  
**Last updated:** May 2026  
**Audience:** creators, contributors, maintainers, and future OpenSaga Cloud operators

OpenSaga is a community-governed worldbuilding platform for shared fictional universes. It helps creators and communities build Worlds, define a World Bible, submit characters and lore as Proposals, vote on what becomes Canon, and preserve a trustworthy source of truth as the universe grows.

The simplest version:

```text
OpenSaga is an open-source canon archive and creator studio for fictional worlds.
```

## North Star

OpenSaga should become the trusted infrastructure layer for collaborative fictional canon.

It is for anime, manga, comic, tabletop RPG, writer, and fandom communities that need more than a notes app, wiki, or chat server. These communities need a place where lore can be proposed, reviewed, voted on, accepted, rejected, archived, exported, and understood over time.

The product promise:

```text
Creators own their worlds.
Communities can help shape canon.
OpenSaga preserves the source of truth.
```

## Why Open Source

OpenSaga is better as an open-source and open-core project because trust is central to the product.

People are more likely to trust a canon and governance platform when they can inspect how it works. Proposal rules, vote thresholds, roles, exports, moderation hooks, and ownership boundaries should not feel like a black box.

Open source supports:

- **Governance transparency:** communities can inspect how Proposal -> Vote -> Canon works.
- **Creator trust:** creators can verify that their worlds, characters, and lore are not locked away.
- **Extensibility:** contributors can add new governance models, export formats, lore modules, and integrations.
- **Self-hosting:** tabletop groups, fandoms, schools, collectives, and studios can run their own instance.
- **Community legitimacy:** a shared canon system should be inspectable by the people who depend on it.

Open source does not mean the whole business must be free forever. It means the core system remains trustworthy, inspectable, and portable.

## Open-Core Model

OpenSaga should use an open-core model:

| Layer | Model | Purpose |
|---|---|---|
| OpenSaga Core | Open source, MIT licensed | The trustworthy foundation for worlds, canon, proposals, voting, and basic Creator Studio workflows |
| OpenSaga Cloud | Paid managed service | Hosted accounts, private workspaces, storage, backups, deployments, moderation tooling, team features, and reliability |
| Premium AI | Paid or usage-based | Hosted agent credits, advanced orchestration, image workflows, shared memory, originality search, and deeper Canon checks |

## What Stays Open

The open-source core should include the parts that make OpenSaga trustworthy:

- World creation and discovery
- World Bible structure
- Character and lore entity structure
- Proposal -> Vote -> Canon workflow
- Governance models
- Basic Creator Studio tools
- BYOK AI adapters
- Export-friendly data structures
- Self-hosting documentation
- Public contribution workflow

The core should be useful even without paying OpenSaga.

## What Can Be Paid

Paid features should focus on managed infrastructure, convenience, scale, and advanced AI.

Good paid boundaries:

- Hosted OpenSaga Cloud instances
- Private worlds and team spaces
- Managed Supabase/Auth/Storage setup
- Backups, restores, and audit logs
- Moderation and safety dashboards
- Advanced analytics
- Hosted model credits
- LangGraph agent orchestration service
- Shared vector memory and originality search
- Image analysis and production-grade asset workflows
- High-volume API access

Bad paid boundaries:

- Locking creators out of their own worlds
- Blocking basic export
- Hiding the core governance rules
- Making Canon creation impossible without paid AI
- Turning self-hosting into a broken second-class path

## Creator Ownership

OpenSaga code is MIT licensed. User-created content is not.

Worlds, characters, factions, maps, symbols, lore, stories, and other creative material belong to their creators or communities according to the rules they choose. OpenSaga should make this distinction clear in product copy, docs, export flows, and future terms.

The platform should protect three promises:

- **Portability:** creators should be able to export meaningful world data.
- **Attribution:** proposals and canon entries should preserve author history.
- **Control:** each World should define its own governance model and participation rules.

## Product Shape

OpenSaga has three product pillars:

### 1. Canon Loop

The core loop:

```text
Draft -> Proposal -> Vote / Review -> Canon or Rejected -> Archive
```

This is the heart of the platform. It must feel transparent, ceremonial, and reliable.

### 2. World Bible

The World Bible is the constitution of a fictional universe. It stores the rules, tone, history, geography, factions, power systems, species, and other canon-defining material.

Every proposal should be understood in relation to the World Bible.

### 3. Creator Studio

Creator Studio helps humans make better worlds and characters. AI is a tool in the creator's hand, not the author.

Current and planned frameworks include:

- Character Forge
- Character Board Framework
- World Seed
- Creation DNA
- Lore Crafter
- Brainstorm
- Canon Check
- Proposal Analysis
- Vision Analysis

These frameworks should stay modular under the hood but feel connected in the creator experience.

## Technical Direction

OpenSaga should not become a Python-only product.

The right long-term architecture is:

```text
React + TypeScript app
  - Product UI
  - Creator Studio
  - world pages
  - proposal and voting flows
  - frontend agent schemas

Supabase / Postgres
  - auth
  - database
  - storage
  - RLS
  - realtime later

Python agent service
  - FastAPI
  - LangGraph
  - vector search
  - long-running workflows
  - human-in-the-loop orchestration
```

React and TypeScript are the right foundation for the product experience. Python and LangGraph are the right future foundation for advanced agent orchestration.

## Agent Strategy

The current alpha uses lightweight TypeScript/Zod agents because the project is frontend-first, easy to run, and contributor-friendly.

That choice is intentional.

It does not mean LangGraph is rejected. It means LangGraph is deferred until OpenSaga has the backend surface to support it cleanly.

### Current Agent Layer

Use TypeScript/Zod for:

- controlled schemas
- local/offline workflows
- BYOK model calls
- Creator Studio previews
- contributor-friendly tests
- fast iteration on product UX

### Future Agent Service

Use Python/LangGraph for:

- multi-step orchestration
- human review interrupts
- shared memory
- vector search
- long-running jobs
- production logging
- image/document processing
- advanced Canon checks

## Why LangGraph Is Deferred

Adding Python/LangGraph too early would create a second service that every contributor must install, configure, run, secure, test, and understand before the public beta foundation is stable.

The right sequence:

```text
1. Prove the product UX and schemas in TypeScript/Zod.
2. Stabilize Supabase, auth, deployment, storage, and governance flows.
3. Add a Python/FastAPI agent service behind a clean API boundary.
4. Move Creation DNA into LangGraph first.
5. Add shared vector search and human-in-the-loop review.
6. Migrate Canon Check, Character Deepener, Vision Analysis, and Proposal Analysis as needed.
```

LangGraph should be added when it creates product leverage, not when it creates setup friction.

## Business Strategy

OpenSaga should make money by operating the best hosted version of an open and trustworthy system.

The business should sell:

- managed hosting
- reliability
- private collaboration
- advanced AI workflows
- better moderation
- storage and backups
- team administration
- polished onboarding
- support

The business should not sell creator lock-in.

## Design Philosophy

OpenSaga itself should feel like a neutral archive.

The design rule:

```text
OpenSaga is monochrome.
Worlds are colorful.
Canon is gold.
```

The platform should feel calm, literary, trustworthy, and premium. Each World should be able to bring its own color, mood, symbols, maps, and visual identity.

## Success Criteria

OpenSaga is succeeding when:

- creators can build rich worlds without losing control
- communities can debate and vote without losing the source of truth
- canon decisions are transparent and easy to audit
- contributors can understand the codebase without fighting setup
- self-hosted users can run the core product successfully
- paid cloud users pay for convenience, scale, and advanced AI
- user-created content remains portable and creator-owned

## Non-Goals

OpenSaga should not become:

- a generic AI writing toy
- a closed SaaS where creators cannot leave
- a wiki with a thin voting layer
- a social feed where canon gets buried
- an AI-first product that sidelines human imagination
- a multi-service maze before the core experience is stable

## One-Sentence Vision

OpenSaga is an open-source, open-core canon platform where creators own their fictional worlds, communities help govern what becomes true, and advanced AI acts as a transparent assistant rather than the author.
