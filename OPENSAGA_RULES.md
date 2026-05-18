# OpenSaga — Product Rules & Design Bible

**Source of truth for all development decisions.**  
**Last updated:** May 2026  
**Status:** Alpha → Commercial Open Source (v1.0 target)

---

## 1. Identity

- **Product name:** OpenSaga
- **Tagline:** "Forge Universes. Govern Canon."
- **One-liner:** An open-source collaborative universe-building platform where communities create, vote on, and evolve shared fictional worlds.
- **Category:** Creative tooling / Collaborative worldbuilding / Community-governed fiction
- **License:** MIT (code) — content created by users belongs to them
- **Revenue model:** Open-core. Free self-hosted. Paid cloud hosting (OpenSaga Cloud) + premium Creator Studio AI features (usage-based BYOK or hosted credits).

---

## 2. Target Audience (Ranked by Priority)

| Tier | Who | Why They Come | What They Need |
|---|---|---|---|
| **Primary** | Anime/manga/comic creators | Build character rosters, define power systems, collaborate on shared universes | Visual character creation, power/ability systems, relationship maps |
| **Primary** | Tabletop RPG groups (D&D, PbtA, homebrew) | Manage shared campaign worlds with structured governance | World Bible, session-linked canon, GM override governance |
| **Secondary** | Worldbuilding enthusiasts | Build universes too big for one person | Lore entries, faction trees, timelines, consistency checking |
| **Secondary** | Writer collectives | Collaborate on shared-universe anthologies | Proposal/approval workflow, canon management |
| **Tertiary** | Fandom communities | Create and govern fan-canon | Community voting, reputation systems |

**Design for the anime/comic creator first.** They need the most visual, most creative, most expressive tooling. If the Creator Studio blows their mind, everyone else benefits.

---

## 3. Core Design Principles

### 3.1 "The Creator is the Hero"
Every screen should make the creator feel powerful. Not the platform. Not the AI. The human. AI is a tool in their hands, never the author.

### 3.2 "Canon is Sacred"
The promotion from Proposal → Canon is the most important moment in the platform. It must feel ceremonial, earned, and permanent. Never casual.

### 3.3 "Governance is a Feature, Not a Constraint"
Different communities want different rules. Democracy, oligarchy, dictatorship — all valid. The platform enables all models without moral judgment.

### 3.4 "Open Source Means Transparent, Not Ugly"
Just because it's MIT-licensed doesn't mean it can look like a dev tool. OpenSaga should feel like a premium creative platform that happens to be open source. Think: Linear, Figma, Arc Browser — not GitHub Issues.

### 3.5 "The World Bible is the Constitution"
Every world has a Bible. Every proposal is judged against it. The Bible is the immutable source of truth. AI consistency checks reference it. Voters reference it. It's the backbone.

---

## 4. Design System

### 4.1 Theme: Dual-Mode

| Mode | Codename | When to Use | Vibe |
|---|---|---|---|
| **Light** | `paper` | Default. Discovery, reading, governance, public archive pages. | Clean, warm, like a manuscript on aged paper. |
| **Dark** | `noir` | Creative sessions, night owls, immersion. | Deep, cinematic, moody. Like editing in a film studio at 2am. |

### 4.2 Brand Color Rule

**OpenSaga is monochrome. Worlds are colorful. Canon is gold.**

OpenSaga itself should feel like a neutral archive and source of truth. The platform uses a warm monochrome editorial base so user-generated worlds, factions, maps, symbols, characters, and lore styles can bring their own visual identity without fighting the product chrome.

| Role | Token | Hex |
|---|---|---:|
| Canon Black | `brand.black` | `#0B0B0D` |
| Archive White | `brand.archive` | `#FAF9F6` |
| Soft Parchment | `brand.parchment` | `#F3EFE7` |
| Mist Grey | `brand.mist` | `#DCD8D0` |
| Scribe Grey | `brand.scribe` | `#6E6A63` |
| Canon Gold | `brand.gold` | `#C6A15B` |

Use Canon Gold for Canon badges, accepted entries, official World Bible moments, and small ceremonial highlights. Use world accent colors only inside world-specific surfaces.

### 4.3 Color Tokens (Semantic)

```
--surface-base          → Canvas background
--surface-elevated      → Cards, panels, modals
--surface-overlay       → Dropdowns, tooltips
--text-primary          → Body text, headings
--text-secondary        → Descriptions, supporting text
--text-tertiary         → Placeholders, labels, captions
--accent-primary        → CTAs, active states, links (black in paper, archive white in noir)
--accent-hover          → Hover state of accent
--accent-muted          → Canon Gold background (low opacity)
--border                → Default borders
--border-accent         → Highlighted borders (active cards, focused inputs)
--status-proposal       → Mythic Violet — imagination, new ideas
--status-vote           → Council Blue — voting and community process
--status-canon          → Canon Gold — official accepted truth
--status-rejected       → Ash Grey — rejected, archived, inactive
--status-conflict       → Ember — continuity issue or needs review
--world-accent          → Per-world accent used only on world-specific surfaces
```

### 4.4 Typography

- **Headings:** Serif (literary, storytelling feel). Currently system serif stack.
- **Body:** Sans-serif (clean readability). System sans stack.
- **Monospace:** For stats, vote counts, timestamps.
- **Sizes:** Base 14px. Headings follow modular scale (1.25 ratio).
- **Rule:** Headings are always `font-serif`. Never use serif for body text.

### 4.5 Spacing & Layout

- **Max content width:** 1280px (6xl)
- **Card padding:** 20-32px (p-5 to p-8)
- **Section gaps:** 32-48px (gap-8 to gap-12)
- **Border radius:** `rounded-xl` for cards/panels, `rounded-lg` for buttons/inputs, `rounded-full` for pills/avatars
- **Transitions:** 200ms for interactions, 300ms for layout shifts, 500ms for page transitions
- **Animation:** Subtle. `animate-fade-in` on page entry. `animate-breathe` on background glows. No bounce, no jiggle, no confetti.

### 4.6 Elevation & Depth

- Cards: `border border-border` (no box-shadow)
- Modals: `shadow-2xl` + backdrop blur
- Toasts: `shadow-2xl`
- Hover states: border color shift (`border-border-accent`), slight translate (`-translate-y-0.5`)
- **Rule:** Never use `shadow-sm/md/lg` on cards. Use border color changes for hierarchy. Shadows are reserved for floating elements only.

---

## 5. UX Rules

### 5.1 Navigation

- **Desktop:** Fixed left sidebar (240px) — Home, Explore, Studio, Activity, Profile, Create CTA
- **Mobile:** Bottom nav with 5 items. Create button floated above.
- **Rule:** Max 5 nav items on mobile. Never hide Studio behind a hamburger.

### 5.2 Creation Flows

- **Always multi-step.** Never dump a 20-field form on the user.
- **Progress indicator:** Dot/bar stepper at the top.
- **AI assist:** Available at every text field (wand icon). Never mandatory.
- **Save drafts:** Auto-save every 30s. Never lose user work.
- **Final step:** Always a review/preview before publishing.

### 5.3 Voting & Proposals

- **Vote threshold:** Clearly displayed as a progress bar.
- **Time remaining:** Countdown timer on active proposals.
- **Vote weight:** Equal (1 person = 1 vote). No reputation-weighted voting in v1.
- **Result announcement:** When a proposal transitions to Canon, show a celebratory moment (not confetti — a dignified "Canonized" state with a subtle glow animation).

### 5.4 Empty States

- Never show a blank page. Always show:
  1. What this section is for (one sentence)
  2. A clear CTA to create the first item
  3. Optional: illustration or icon

### 5.5 Loading States

- Skeleton screens for lists/grids
- Spinner + contextual text for AI generation ("Consulting the Oracles...")
- Never block the entire page. Load sections independently.

### 5.6 Error States

- Human-readable messages (not HTTP codes)
- Always offer a retry action
- Never blame the user

---

## 6. Content & Copywriting Voice

### 6.1 Brand Voice

| Attribute | What it means | Example |
|---|---|---|
| **Literary** | We speak like storytellers, not engineers | "Forge a universe" not "Create a project" |
| **Empowering** | The creator is always the hero | "Your world. Your rules." not "We help you build" |
| **Precise** | No fluff, no buzzwords | "Community votes on canon" not "Collaborative synergy" |
| **Slightly mythic** | A hint of epic without being cringe | "The Lorekeeper Council has spoken" not "Admins approved" |

### 6.2 Key Vocabulary

| Platform Term | Generic Equivalent | Why |
|---|---|---|
| **World** | Project / Space | More evocative, maps to fiction |
| **World Bible** | Rules / Guidelines | Gravitas, implies authority |
| **Canon** | Approved / Published | Fiction term, implies permanence |
| **Proposal** | Submission / Draft | Implies deliberation, weight |
| **Forge** | Create / Build | Action word with weight |
| **Canonize** | Approve | Ceremonial verb |
| **Lorekeeper** | Moderator / Admin | In-world term, not corporate |
| **Architect** | Power user | Builder connotation |
| **Citizen** | Member / User | Community belonging |
| **The Saga** | The feed / Activity | Narrative framing |

### 6.3 Microcopy Rules

- **Buttons:** Always a verb. "Forge World" not "New World". "Submit Proposal" not "Done".
- **Empty states:** Tell a tiny story. "No characters inhabit this world yet. Be the first to breathe life into it."
- **Errors:** Apologetic but helpful. "The Oracle is resting. Try again in a moment." (for AI failures)
- **Success:** Brief celebration. "Canonized. Your creation lives forever in this world."
- **Labels:** Short (2-3 words). Uppercase tracking-widest for section headers.

---

## 7. AI Integration Rules

### 7.1 BYOK (Bring Your Own Key)

- AI is **optional**. The platform is fully functional without any LLM.
- Users bring their own API key (OpenAI, Anthropic, Ollama, any OpenRouter-compatible provider).
- Keys are stored in **browser localStorage only**. Never sent to our servers.
- All LLM calls happen **client-side**. The server never sees the key.

### 7.2 AI as Co-Pilot, Not Author

- AI generates suggestions. The human edits, accepts, or rejects.
- AI output is **always** marked with a subtle indicator (sparkle icon + "AI-assisted" label).
- AI never auto-publishes. Everything goes through the human → draft → proposal → vote pipeline.
- The World Bible is used as context for consistency checking. AI can flag contradictions but cannot overrule the community.

### 7.3 AI Capabilities (Creator Studio)

| Tool | What It Does | Input | Output |
|---|---|---|---|
| **Character Forge** | Generate full character profiles and selectable character boards | Description/concept or uploaded character art + World Bible context | Name, archetype, backstory, powers, flaws, motivations, relationships, board sections |
| **Lore Crafter** | Write lore entries | Topic + World Bible context | Historical events, technology descriptions, faction writeups |
| **Brainstorm** | Generate plot ideas | Situation/premise | Plot hooks, twists, story arcs, faction conflicts |
| **Creation DNA** | Classify originality before canonization | Raw idea/premise + local DNA vault | Controlled tags, anchors, near-match note, differentiators, pitch |
| **Canon Check** | Consistency validation | Proposal text + World Bible | Contradiction report, compatibility score, suggested edits |
| **World Seed** | Generate entire world foundation | Genre + tone + 3 keywords | Name, description, genre tags, initial World Bible, starter factions |
| **Relationship Mapper** | Map character connections | 2+ characters | Relationship type, dynamic, potential conflicts |
| **Power System Generator** | Create magic/tech systems | Concept + constraints | Rules, limitations, tiers, costs, visual descriptions |
| **Species/Race Builder** | Design custom species | Traits + environment | Biology, culture, naming conventions, weaknesses |

---

## 8. Feature Priority (v1.0 Checklist)

### Must Have (Launch Blockers)

- [x] Supabase auth code path (GitHub, Discord, Google OAuth hooks)
- [ ] Hosted OAuth provider configuration and redirect validation
- [x] Real database schema, service layer, and RLS migration baseline
- [x] Creator Studio MVP (see `CREATOR_STUDIO_PRD.md`)
- [ ] Full god-tier Creator Studio v1
- [x] Character creation with structured builder fields
- [ ] Full visual builder with relationship graph, stats polish, and gallery
- [x] World creation and World Seed path
- [ ] Production structured Bible editor with rich text/markdown
- [x] Proposal -> Vote -> Canon pipeline baseline
- [ ] Server-trusted governance enforcement and scheduled tally deployment
- [x] User profiles with reputation fields
- [x] World membership baseline
- [x] Activity feed baseline
- [ ] Search (worlds, characters, lore entries)
- [ ] Mobile responsive production pass across all features

### Should Have (v1.1)

- [ ] Visual timeline for world history
- [ ] Character relationship graph (force-directed)
- [ ] Cross-world character migration (with governance approval)
- [ ] Commenting on proposals
- [ ] Notification system (in-app + optional email)
- [ ] Rich text editor for lore (markdown + images)
- [ ] Image upload for characters/worlds (Supabase Storage)
- [ ] Embeddable World Bible widgets

### Nice to Have (v1.2+)

- [ ] Plugin system for custom governance rules
- [ ] Public API for third-party integrations
- [ ] Export world as PDF/ePub
- [ ] Collaborative real-time editing (Yjs/CRDT)
- [ ] Voice-to-lore (speech input for brainstorming)
- [ ] AI image generation integration (DALL-E, Midjourney proxy)

---

## 9. Technical Standards

### 9.1 Architecture

- **Frontend:** React 19 + TypeScript + Vite
- **State:** Zustand (client) + TanStack React Query (server)
- **Styling:** TailwindCSS with custom design tokens (no component library — custom components only)
- **Routing:** React Router v7
- **Backend:** Supabase (auth, database, storage, edge functions)
- **AI:** Client-side BYOK via AIEngine interface
- **Structure:** Feature-Sliced Design (FSD)

### 9.2 Code Quality

- TypeScript strict mode (`"strict": true`)
- No `any` types
- All components: functional, no class components
- Props destructured at function signature
- Custom hooks for all data fetching
- Zustand stores: one per domain (ui, ai, user)
- File naming: PascalCase for components, camelCase for hooks/utils

### 9.3 Performance Targets

- **LCP:** < 1.5s
- **Bundle size:** < 300KB gzipped (code-split per route)
- **Time to Interactive:** < 2s
- **Lighthouse score:** > 90 across all categories

### 9.4 Accessibility

- All interactive elements: keyboard-accessible
- All images: alt text
- All forms: proper label associations
- Color contrast: WCAG AA minimum
- Focus indicators: visible, styled (not default blue outline)
- Screen reader: all modals trap focus, all toasts announced

---

## 10. What OpenSaga is NOT

| Claim | Reality |
|---|---|
| "A writing app" | No. It's a collaborative worldbuilding platform. Not Google Docs. |
| "A wiki" | No. Wikis have no governance. OpenSaga has structured proposal → vote → canon. |
| "AI writes stories for you" | No. AI assists creation. The human is always the author. |
| "A game" | No. It's a creative tool. But tabletop RPG groups use it for campaign management. |
| "A social network" | No. It's a creative collaboration platform. Profiles exist for reputation, not clout. |

---

## 11. Competitive Positioning

| Competitor | What They Do | Where OpenSaga Wins |
|---|---|---|
| World Anvil | Solo worldbuilding wiki | OpenSaga has governance + collaboration + AI |
| Campfire Write | Writing tool with world notes | OpenSaga is community-first, not solo-writer-first |
| Notion | General docs | Too generic. No canon/proposal/voting system. No creative UX. |
| Discord | Community chat | No structured content. No governance. Chat disappears. |
| Midjourney | AI image gen | Not a worldbuilding platform. Images without narrative context. |

**OpenSaga's moat: Governance + Community + AI + Creative UX in one integrated platform.**

---

*This document is the final authority on product decisions. When in doubt, reference these rules.*
