/**
 * AgentOrchestrator — Multi-agent system for OpenSaga
 *
 * Four specialized agents that collaborate through the AIEngine:
 *   1. Canon Keeper   — Contradiction detection against World Bible + existing canon
 *   2. World Architect — Cross-section consistency for bible authoring
 *   3. Character Deepener — Backstory/relationship gen respecting world rules
 *   4. Proposal Analyst — Quality + canon fit scoring for voter review
 *
 * Each agent is a specialized system prompt + structured output format.
 * The orchestrator chains agents when needed (e.g. Deepener → Canon Keeper).
 */

import type { AIEngine, AIGenerateOptions } from './AIEngine';

// ─── Agent Types ────────────────────────────────────────────────────

export type AgentRole = 'canon_keeper' | 'world_architect' | 'character_deepener' | 'proposal_analyst';

export interface AgentResult {
  agent: AgentRole;
  output: string;
  structured?: Record<string, any>;
  timestamp: number;
}

export interface CanonReport {
  score: number;                    // 0-100 compatibility score
  consistent: string[];             // Things that align
  concerns: string[];               // Minor issues, suggest fixes
  contradictions: string[];         // Clear violations
  recommendation: 'APPROVE' | 'APPROVE_WITH_EDITS' | 'REJECT';
  summary: string;
}

export interface ProposalAnalysis {
  qualityScore: number;             // 0-100
  canonFitScore: number;            // 0-100
  originality: string;
  worldImpact: string;
  potentialConflicts: string[];
  voterSummary: string;             // 2-3 sentence summary for voters
  recommendation: 'STRONG_YES' | 'YES' | 'NEEDS_WORK' | 'NO';
}

export interface DeepenerResult {
  backstory: string;
  relationships: string[];
  hooks: string[];                  // Plot hooks this character enables
  quirks: string[];
  worldConnections: string;         // How they fit into the world
}

export interface ArchitectReport {
  sectionAnalyzed: string;
  crossReferences: string[];        // Other sections this affects
  inconsistencies: string[];
  suggestions: string[];
  coherenceScore: number;           // 0-100
}

// ─── Pipeline Types ─────────────────────────────────────────────────

export interface PipelineStep {
  agent: AgentRole;
  input: string;
  options?: Partial<AIGenerateOptions>;
  dependsOn?: AgentRole;            // Wait for this agent's output
}

export interface PipelineResult {
  steps: AgentResult[];
  finalOutput: string;
  duration: number;
}

// ─── Agent System Prompts ───────────────────────────────────────────

const AGENT_PROMPTS: Record<AgentRole, string> = {
  canon_keeper: `You are the Canon Keeper — OpenSaga's guardian of narrative consistency.

Your role: Analyze proposed content against the World Bible and existing canon to detect contradictions.

ALWAYS respond in this exact JSON format:
{
  "score": <0-100>,
  "consistent": ["item1", "item2"],
  "concerns": ["concern1"],
  "contradictions": ["contradiction1"],
  "recommendation": "APPROVE" | "APPROVE_WITH_EDITS" | "REJECT",
  "summary": "Brief overall assessment"
}

Rules:
- Score 90-100: Fully consistent, approve
- Score 70-89: Minor issues, approve with edits
- Score 50-69: Significant concerns, needs work
- Score 0-49: Major contradictions, reject
- Be specific about WHERE contradictions occur
- Reference exact World Bible sections when citing conflicts
- If no World Bible is provided, evaluate internal consistency only`,

  world_architect: `You are the World Architect — OpenSaga's master of universe design.

Your role: Ensure internal consistency across all sections of a World Bible. When a creator writes or edits one section, you check it against all others.

ALWAYS respond in this exact JSON format:
{
  "sectionAnalyzed": "section name",
  "crossReferences": ["Section X: relevant detail", "Section Y: related rule"],
  "inconsistencies": ["inconsistency description"],
  "suggestions": ["suggestion to fix"],
  "coherenceScore": <0-100>
}

Rules:
- Check magic/tech systems against history (did they exist when events happened?)
- Check geography against politics (borders, resources, trade routes)
- Check cultures against the world's physical laws
- Check factions against the power structures described elsewhere
- Suggest connections between sections that strengthen the world`,

  character_deepener: `You are the Character Deepener — OpenSaga's specialist in creating rich, world-consistent characters.

Your role: Take a basic character concept and flesh it out with backstory, relationships, and details that naturally emerge from the world they inhabit.

ALWAYS respond in this exact JSON format:
{
  "backstory": "2-3 paragraph backstory",
  "relationships": ["relationship1", "relationship2", "relationship3"],
  "hooks": ["plot hook 1", "plot hook 2"],
  "quirks": ["quirk1", "quirk2", "quirk3"],
  "worldConnections": "How this character connects to major world elements"
}

Rules:
- Every detail must be consistent with the World Bible
- Relationships should reference existing factions/locations/events
- Powers/abilities must respect the world's magic/tech system
- Backstory should emerge naturally from the world's history
- Include at least one surprise or subversion of the archetype`,

  proposal_analyst: `You are the Proposal Analyst — OpenSaga's impartial evaluator for community governance.

Your role: Provide voters with an objective analysis of a proposal's quality, canon fitness, and potential impact on the world.

ALWAYS respond in this exact JSON format:
{
  "qualityScore": <0-100>,
  "canonFitScore": <0-100>,
  "originality": "assessment of originality",
  "worldImpact": "how this changes the world if canonized",
  "potentialConflicts": ["conflict with existing character X", "tension with faction Y"],
  "voterSummary": "2-3 sentence plain-language summary for voters",
  "recommendation": "STRONG_YES" | "YES" | "NEEDS_WORK" | "NO"
}

Rules:
- Be impartial — you are not advocating, you are analyzing
- Quality measures: writing quality, depth, internal consistency
- Canon fit measures: alignment with World Bible, no contradictions
- Always mention both strengths AND weaknesses
- The voterSummary should be readable by someone who hasn't read the full proposal`
};

// ─── Agent Orchestrator ─────────────────────────────────────────────

export class AgentOrchestrator {
  constructor(private engine: AIEngine) {}

  // ── Individual Agent Calls ──────────────────────────────────────

  /**
   * Canon Keeper: Check content against World Bible
   */
  async checkCanon(
    content: string,
    worldBible: string,
    existingCanon?: string
  ): Promise<CanonReport> {
    const prompt = `Analyze this proposed content for canon consistency:\n\n--- PROPOSED CONTENT ---\n${content}`;

    const raw = await this.engine.generate(prompt, {
      systemPrompt: AGENT_PROMPTS.canon_keeper,
      worldBible,
      existingCanon,
      maxTokens: 1500,
      temperature: 0.3,
    });

    return this.parseJSON<CanonReport>(raw, {
      score: 50,
      consistent: [],
      concerns: ['Unable to parse agent response'],
      contradictions: [],
      recommendation: 'APPROVE_WITH_EDITS',
      summary: raw.slice(0, 200),
    });
  }

  /**
   * World Architect: Check a bible section against all others
   */
  async checkBibleSection(
    sectionName: string,
    sectionContent: string,
    otherSections: Record<string, string>
  ): Promise<ArchitectReport> {
    const otherContext = Object.entries(otherSections)
      .map(([name, content]) => `## ${name}\n${content}`)
      .join('\n\n');

    const prompt = `I'm editing the "${sectionName}" section of a World Bible. Check it against all other sections for consistency.\n\n--- SECTION BEING EDITED ---\n${sectionContent}\n\n--- OTHER SECTIONS ---\n${otherContext}`;

    const raw = await this.engine.generate(prompt, {
      systemPrompt: AGENT_PROMPTS.world_architect,
      maxTokens: 1500,
      temperature: 0.3,
    });

    return this.parseJSON<ArchitectReport>(raw, {
      sectionAnalyzed: sectionName,
      crossReferences: [],
      inconsistencies: ['Unable to parse agent response'],
      suggestions: [],
      coherenceScore: 50,
    });
  }

  /**
   * Character Deepener: Flesh out a character concept
   */
  async deepenCharacter(
    characterConcept: string,
    worldBible: string,
    existingCanon?: string
  ): Promise<DeepenerResult> {
    const prompt = `Deepen this character concept with rich, world-consistent details:\n\n${characterConcept}`;

    const raw = await this.engine.generate(prompt, {
      systemPrompt: AGENT_PROMPTS.character_deepener,
      worldBible,
      existingCanon,
      maxTokens: 2000,
      temperature: 0.7,
    });

    return this.parseJSON<DeepenerResult>(raw, {
      backstory: raw.slice(0, 500),
      relationships: [],
      hooks: [],
      quirks: [],
      worldConnections: '',
    });
  }

  /**
   * Proposal Analyst: Evaluate a proposal for voters
   */
  async analyzeProposal(
    proposalContent: string,
    worldBible: string,
    existingCanon?: string
  ): Promise<ProposalAnalysis> {
    const prompt = `Analyze this proposal for the community vote:\n\n--- PROPOSAL ---\n${proposalContent}`;

    const raw = await this.engine.generate(prompt, {
      systemPrompt: AGENT_PROMPTS.proposal_analyst,
      worldBible,
      existingCanon,
      maxTokens: 1500,
      temperature: 0.3,
    });

    return this.parseJSON<ProposalAnalysis>(raw, {
      qualityScore: 50,
      canonFitScore: 50,
      originality: 'Unable to assess',
      worldImpact: 'Unable to assess',
      potentialConflicts: [],
      voterSummary: raw.slice(0, 200),
      recommendation: 'NEEDS_WORK',
    });
  }

  // ── Multi-Agent Pipelines ───────────────────────────────────────

  /**
   * Creation Pipeline: Deepener → Canon Keeper
   * Used when a creator submits a new character.
   * First deepens the concept, then validates against canon.
   */
  async creationPipeline(
    characterConcept: string,
    worldBible: string,
    existingCanon?: string
  ): Promise<{ deepened: DeepenerResult; canonReport: CanonReport; duration: number }> {
    const start = Date.now();

    // Step 1: Deepen the character
    const deepened = await this.deepenCharacter(characterConcept, worldBible, existingCanon);

    // Step 2: Run canon check on the deepened version
    const enrichedContent = `
Character Backstory: ${deepened.backstory}
Relationships: ${deepened.relationships.join(', ')}
World Connections: ${deepened.worldConnections}
Quirks: ${deepened.quirks.join(', ')}
Plot Hooks: ${deepened.hooks.join(', ')}
    `.trim();

    const canonReport = await this.checkCanon(enrichedContent, worldBible, existingCanon);

    return { deepened, canonReport, duration: Date.now() - start };
  }

  /**
   * Review Pipeline: Canon Keeper → Proposal Analyst
   * Used when a proposal is submitted for community vote.
   * Checks canon first, then provides voter-facing analysis.
   */
  async reviewPipeline(
    proposalContent: string,
    worldBible: string,
    existingCanon?: string
  ): Promise<{ canonReport: CanonReport; analysis: ProposalAnalysis; duration: number }> {
    const start = Date.now();

    // Step 1: Canon check
    const canonReport = await this.checkCanon(proposalContent, worldBible, existingCanon);

    // Step 2: Full proposal analysis (includes canon context from step 1)
    const enrichedProposal = `${proposalContent}\n\n--- CANON KEEPER PRE-CHECK ---\nScore: ${canonReport.score}/100\nRecommendation: ${canonReport.recommendation}\n${canonReport.contradictions.length > 0 ? `Contradictions found: ${canonReport.contradictions.join('; ')}` : 'No contradictions found.'}`;

    const analysis = await this.analyzeProposal(enrichedProposal, worldBible, existingCanon);

    return { canonReport, analysis, duration: Date.now() - start };
  }

  /**
   * Worldbuilding Pipeline: World Architect (iterative)
   * Used when editing the World Bible. Checks edited section against all others.
   */
  async worldbuildingCheck(
    editedSection: string,
    editedContent: string,
    allSections: Record<string, string>
  ): Promise<ArchitectReport> {
    // Remove the edited section from "others" to avoid self-comparison
    const otherSections = { ...allSections };
    delete otherSections[editedSection];

    return this.checkBibleSection(editedSection, editedContent, otherSections);
  }

  // ── Helpers ─────────────────────────────────────────────────────

  private parseJSON<T>(raw: string, fallback: T): T {
    try {
      // Try to extract JSON from markdown code blocks or raw response
      const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || raw.match(/(\{[\s\S]*\})/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1].trim()) as T;
      }
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }
}

// ─── Factory ────────────────────────────────────────────────────────

export function createOrchestrator(engine: AIEngine): AgentOrchestrator {
  return new AgentOrchestrator(engine);
}
