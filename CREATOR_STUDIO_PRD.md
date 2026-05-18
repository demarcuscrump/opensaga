# Creator Studio — Product Requirements Document

**Feature:** Creator Studio (God-Tier Creative Workspace)  
**Priority:** P0 — Launch Blocker  
**Status:** MVP implemented → Full v1 workspace in progress  
**Target:** The single most impressive feature in OpenSaga. The reason creators choose this over World Anvil, Campfire, or Notion.

---

## Executive Summary

The Creator Studio is OpenSaga's **integrated creative workspace** — a dedicated environment where creators forge characters, build worlds, design power systems, write lore, and validate consistency against the World Bible. It combines a visual builder, AI co-pilot, asset management, and direct-to-proposal publishing into one seamless experience.

**The goal:** When a creator opens the Studio, they should feel like they've entered a professional creative tool — not a form with text fields. Think Figma's workspace meets a game character creator meets an AI writing assistant.

---

## Current State vs. Target State

| Aspect | Current alpha | Target (v1) |
|---|---|---|
| Layout | Multi-panel Studio MVP with tool panel, canvas, inspector-style support panels, and status affordances | Full workspace with refined toolbars, canvas, and inspector |
| Character creation | Character Forge with structured fields, tabs, draft persistence, proposal/export path | Visual builder + stats + relationships + appearance + AI assist |
| World creation | World Seed tool and structured world-generation path | Structured Bible editor with sections, factions, geography, rules |
| AI tools | 6 active tools: Character Forge, World Seed, Creation DNA, Lore Crafter, Brainstorm, Canon Check | 8+ real AI tools with structured output, World Bible context injection |
| Asset management | Local drafts and image analysis path | Gallery of created characters, worlds, lore entries, drafts |
| Export | Character export and proposal submission path | Export to proposal, markdown, JSON, and portable packages |
| Collaboration | World membership exists; draft collaboration not implemented | Share drafts, invite co-creators, version history |
| Visual | Richer cards and panels, but relationship/power/species visuals are roadmap | Rich cards, stat blocks, relationship diagrams, color-coded powers |

---

## Studio Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CREATOR STUDIO                           │
├──────────┬──────────────────────────────┬───────────────────┤
│          │                              │                   │
│  TOOL    │        CANVAS                │    INSPECTOR      │
│  PANEL   │                              │                   │
│          │  (where creation happens)    │  (properties &    │
│  - Forge │                              │   details panel)  │
│  - Lore  │  Character card preview      │                   │
│  - Brain │  World Bible sections        │  Stats            │
│  - Check │  Relationship graph          │  Relationships    │
│  - Seed  │  Power system tree           │  Powers           │
│  - Map   │  Species builder             │  Appearance       │
│  - Power │  Timeline view               │  Metadata         │
│  - Race  │                              │  AI Suggestions   │
│          │                              │                   │
├──────────┴──────────────────────────────┴───────────────────┤
│  STATUS BAR: AI Provider · Draft saved 2s ago · Word count  │
└─────────────────────────────────────────────────────────────┘
```

---

## Feature Modules

### Module 1: Character Forge

The crown jewel. A multi-tab character creation experience that produces rich, detailed characters ready for proposal submission.

#### Tabs

| Tab | What It Contains |
|---|---|
| **Identity** | Name, aliases, archetype, species/race, age, gender, pronouns, title |
| **Appearance** | Physical description, distinguishing features, typical attire, color palette, reference image upload |
| **Personality** | Core traits (Big 5 sliders), fears, desires, quirks, speech patterns, moral alignment |
| **Backstory** | Origin, formative events, relationships to world history, secrets, timeline integration |
| **Abilities** | Powers/skills list (from World's power system), limitations, cost/drawback, visual description of activation |
| **Relationships** | Connections to other characters (ally, rival, mentor, lover, enemy). Visual graph preview. |
| **Stats** | Customizable stat block (STR/DEX/INT or custom attributes from World Bible). Radar chart visualization. |
| **Gallery** | Uploaded reference images, AI-generated concept art (via BYOK), mood board |

#### AI Assist per Tab

- **Identity:** "Generate a name fitting this world's naming conventions"
- **Appearance:** "Describe their look based on archetype + species"
- **Personality:** "Suggest personality traits that create internal conflict with their backstory"
- **Backstory:** "Write a backstory that connects to [World Event X]"
- **Abilities:** "Generate a power set that fits within [World's Power System] with balanced limitations"
- **Relationships:** "Suggest potential connections to existing Canon characters in this world"

#### Output Format

When saved/published, a Character Forge output becomes a **Character Card** — a structured, visually rich component that displays in the world's character roster:

```typescript
interface ForgedCharacter {
  // Identity
  name: string;
  aliases: string[];
  archetype: string;
  species: string;
  age: string;
  pronouns: string;
  title?: string;
  
  // Appearance
  physicalDescription: string;
  distinguishingFeatures: string[];
  attire: string;
  colorPalette: string[]; // hex values
  referenceImages: string[]; // URLs
  
  // Personality
  traits: { label: string; value: number }[]; // 0-100 slider
  fears: string[];
  desires: string[];
  quirks: string[];
  speechPattern: string;
  alignment: string;
  
  // Backstory
  origin: string;
  formativeEvents: { event: string; age: string; impact: string }[];
  secrets: string[];
  
  // Abilities
  powers: {
    name: string;
    description: string;
    limitation: string;
    visualDescription: string;
    tier: 'minor' | 'major' | 'ultimate';
  }[];
  
  // Relationships
  connections: {
    characterId: string;
    type: 'ally' | 'rival' | 'mentor' | 'student' | 'lover' | 'enemy' | 'sibling' | 'parent' | 'custom';
    description: string;
  }[];
  
  // Stats
  stats: { label: string; value: number; max: number }[];
  
  // Meta
  worldId: string;
  authorId: string;
  status: 'DRAFT' | 'PROPOSAL' | 'CANON';
  createdAt: string;
  updatedAt: string;
  aiAssisted: boolean;
}
```

---

### Module 2: World Seed (World Bible Builder)

A structured editor for creating comprehensive World Bibles — not just a single textarea, but a multi-section document with templates.

#### Bible Sections (Template)

| Section | Purpose | AI Assist |
|---|---|---|
| **Overview** | One-paragraph pitch + genre + tone + themes | "Expand this concept into a compelling world pitch" |
| **History & Timeline** | Major eras, founding events, wars, discoveries | "Generate a 5-era timeline based on these themes" |
| **Geography & Regions** | Map descriptions, regions, climate, resources | "Describe 4 distinct regions based on this genre" |
| **Factions & Organizations** | Power structures, alliances, conflicts | "Generate opposing factions with built-in tension" |
| **Magic/Tech System** | Rules, limitations, costs, tiers | "Design a hard magic system with clear rules and costs" |
| **Species & Races** | Inhabitants, biology, culture, naming | "Create a unique species adapted to [region]" |
| **Social Structure** | Classes, economies, religions, cultures | "Design a social hierarchy that creates conflict" |
| **Tone & Rules** | What fits this world, what doesn't. Content boundaries. | "Summarize the tone rules for new contributors" |

#### Bible Editor UX

- Left sidebar: Section navigation (like a book's table of contents)
- Main area: Rich text editor per section (markdown with live preview)
- Right sidebar: "Referenced by" — shows which characters/proposals reference this section
- Top bar: Word count, last edited, AI consistency score
- **Rule:** The Bible is NEVER one big text field. It's always structured sections.

---

### Module 3: Lore Crafter

Dedicated tool for writing in-world documents: historical accounts, technology specs, mythology, faction manifestos, in-universe newspapers, etc.

#### Templates

- **Historical Event** — date, participants, outcome, aftermath, unreliable narrator toggle
- **Technology/Artifact** — name, function, origin, limitations, who controls it
- **Mythology/Legend** — the story as told in-world (unreliable), the "truth" (author notes)
- **Faction Manifesto** — beliefs, goals, methods, enemies, recruitment pitch
- **Location Guide** — geography, inhabitants, economy, dangers, notable landmarks

---

### Module 4: Brainstorm Engine

Freeform AI-assisted ideation. Not structured creation — pure creative exploration.

- **Input:** A premise, question, or "what if" scenario
- **Output:** Multiple branching ideas (3-5 options), each expandable
- **Feature:** Pin ideas to a "board" for later use
- **Feature:** "Develop this further" button on any brainstorm output
- **Feature:** Connect brainstorm outputs to specific characters/worlds

---

### Module 4A: Creation DNA

Structured originality lens for concepts before they become characters, worlds, or proposals.

- **Input:** A raw idea or premise
- **Output:** Controlled genre, emotion, scale, power, vibe, anchor, differentiator, and pitch fields
- **Feature:** Local DNA vault comparison for near-match detection
- **Feature:** Human review notes before saving to the vault
- **Production path:** Move local vault comparison to Supabase/Postgres vector search when hosted collaboration needs shared originality checks

---

### Module 5: Canon Check (Consistency Validator)

The AI reads a proposal + the relevant World Bible and produces a consistency report.

#### Output Format

```
CONSISTENCY REPORT
━━━━━━━━━━━━━━━━━━

Proposal: "New character: Chrome Widow"
World: Neo-Tokyo 2087
Bible Sections Referenced: Technology, Factions, History

COMPATIBILITY SCORE: 87/100

✅ CONSISTENT:
- Character's cybernetic augmentations align with established tech rules
- Faction affiliation (Red Syndicate) matches existing lore
- Time period references are accurate

⚠️ MINOR CONCERNS:
- Character claims to be "the only survivor of Sector 7 collapse" 
  but existing Canon character "The Fixer" also survived Sector 7.
  SUGGESTION: Rephrase to "one of the few survivors"

❌ CONTRADICTIONS:
- None found

RECOMMENDATION: Approve with minor edit to backstory.
```

---

### Module 6: Relationship Mapper

Visual tool for defining and viewing character connections.

- **Input:** Select 2+ characters from the world
- **Output:** Force-directed graph showing relationship types
- **Feature:** Click any edge to see relationship details
- **Feature:** AI can suggest relationships based on backstories
- **Feature:** "What if they met?" — AI generates a potential interaction scene

---

### Module 7: Power System Generator

Structured tool for designing magic systems, tech trees, or ability frameworks.

#### Fields

- System name
- Source of power (mana, technology, divine, genetic, cosmic)
- Rules (what it can do)
- Limitations (what it can't do, costs, drawbacks)
- Tiers (novice → master → legendary)
- Visual manifestation (what it looks like when used)
- Cultural impact (how society views this power)

---

### Module 8: Species/Race Builder

Tool for designing custom species or races.

#### Fields

- Name + naming conventions for individuals
- Biology (lifespan, diet, senses, reproduction)
- Appearance (physical traits, size, coloring)
- Culture (values, art, governance, religion)
- Relationship to other species
- Weaknesses / vulnerabilities
- Homeworld/region

---

## UX Specifications

### Studio Entry

- Click "Studio" in sidebar → opens full-screen workspace (no sidebar, no distractions)
- Escape or back button → returns to main app
- Studio has its OWN navigation (tool panel on left)

### Workspace Layout

- **Tool Panel (left, 280px):** Tool selection, AI status indicator, saved drafts list
- **Canvas (center, flex):** The main creation area. Changes based on active tool.
- **Inspector (right, 320px, collapsible):** Context-sensitive properties panel. Shows different fields based on what's selected in the canvas.

### Auto-Save

- Save draft to localStorage every 30 seconds
- Show "Saved 2s ago" in status bar
- When user has Supabase auth: sync drafts to cloud

### Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Cmd+S` | Save draft |
| `Cmd+Enter` | Generate (AI) |
| `Cmd+Shift+P` | Submit as Proposal |
| `Cmd+1-8` | Switch tool (1=Character, 2=Lore, etc.) |
| `Escape` | Exit Studio |
| `Tab` | Move to next field/tab |

### Mobile Experience

- Tool panel becomes a horizontal scrollable pill bar at top
- Inspector becomes a bottom sheet (swipe up to reveal)
- Canvas is full-width
- AI generation works identically

---

## AI Integration Details

### Context Injection

Every AI call in the Creator Studio includes:

1. **World Bible** (full text of the relevant world's Bible)
2. **Existing Canon** (list of canonized characters/lore for contradiction avoidance)
3. **User's draft** (what they've written so far)
4. **Tool-specific system prompt** (what kind of output to generate)

### Structured Output

AI responses are **always parsed into structured data**, never raw text dumps. Use Zod schemas to validate:

```typescript
// Example: Character Forge AI response schema
const CharacterSuggestionSchema = z.object({
  name: z.string(),
  archetype: z.string(),
  backstory: z.string().max(2000),
  powers: z.array(z.object({
    name: z.string(),
    description: z.string(),
    limitation: z.string(),
  })).max(5),
  personality: z.object({
    traits: z.array(z.string()).max(5),
    flaw: z.string(),
    motivation: z.string(),
  }),
});
```

### AI Providers (BYOK Adapters)

| Provider | Adapter Status | Notes |
|---|---|---|
| OpenAI (GPT-4o-class models) | Implemented | Best structured output support |
| Anthropic (Claude) | Implemented | Strong for long-form lore writing |
| OpenRouter (any model) | Implemented | Gives access to many models through one key |
| Ollama (local) | Implemented | Privacy-first local model option |

---

## Visual Design Specifications

### Character Card (Preview Component)

When a character is created in the Forge, the preview shows a rich card:

```
┌──────────────────────────────────────────┐
│  [Reference Image / Placeholder]         │
│                                          │
│  ──────────────────────────────────────  │
│  THE FIXER                               │
│  Archetype: Mastermind · Species: Human  │
│  ──────────────────────────────────────  │
│                                          │
│  "Marcus Chen grew up in the shadows     │
│  of Sector 7..."                         │
│                                          │
│  ┌─────────────────────────────────┐     │
│  │  STR ████░░░░  42               │     │
│  │  INT ████████  89               │     │
│  │  CHA ██████░░  67               │     │
│  └─────────────────────────────────┘     │
│                                          │
│  Powers: Neural Override, Data Weaving   │
│  Flaws: Paranoid, Trust issues           │
│                                          │
│  [Submit as Proposal]  [Save Draft]      │
└──────────────────────────────────────────┘
```

### Stat Radar Chart

- 6-point radar chart using SVG (no heavy chart library)
- Custom colors from world's theme palette
- Animated on hover (expand slightly)
- Accessible: stat values also shown as text list below chart

### Relationship Graph

- Force-directed graph using d3-force (lightweight)
- Nodes = character avatars (circular)
- Edges = colored by relationship type (green=ally, red=enemy, purple=family, gold=romantic)
- Click node to open character details in Inspector
- Drag nodes to rearrange

---

## Publishing Flow (Studio → Proposal)

1. Creator finishes building in Studio
2. Clicks "Submit as Proposal"
3. **Review screen** shows exactly what the community will see:
   - Character card preview (or lore entry preview)
   - World Bible sections it references
   - AI consistency check result (auto-run)
   - Justification field (why this should be Canon)
4. Creator confirms → Proposal is live, voting begins
5. Status bar shows "Proposal submitted. Voting ends in 7 days."

---

## Success Metrics

| Metric | Target | Why |
|---|---|---|
| Studio session duration | > 15 min average | Creators are engaged, not bouncing |
| Characters created per user per month | > 3 | The tool encourages creation |
| Draft → Proposal conversion rate | > 40% | Creators finish what they start |
| AI tool usage rate | > 60% of sessions | AI is helpful, not ignored |
| Canon acceptance rate | > 50% of proposals | Quality output that communities approve |

---

## Implementation Priority

```
Phase 1 (MVP Studio):
  → Character Forge (Identity + Appearance + Backstory + Abilities tabs)
  → World Seed (structured Bible editor, 8 sections)
  → AI integration (real BYOK, not simulated)
  → Auto-save + draft management
  → Submit as Proposal flow

Phase 2 (Enhanced):
  → Stats tab with radar chart
  → Relationships tab with visual graph
  → Canon Check tool
  → Brainstorm Engine with pinboard
  → Lore Crafter with templates

Phase 3 (God Tier):
  → Power System Generator
  → Species/Race Builder
  → Image upload + gallery
  → Collaborative editing (multiple creators on same draft)
  → AI image generation integration
  → Export as PDF/markdown/JSON
```

---

*The Creator Studio is the heart of OpenSaga. If this feature is exceptional, the platform succeeds. If it's mediocre, nothing else matters.*
