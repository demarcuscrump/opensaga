/**
 * Agent Orchestrator — Top-level multi-agent coordinator
 *
 * Provides:
 * 1. Individual agent invocations
 * 2. Multi-agent pipelines (Creation Pipeline, Review Pipeline)
 * 3. Model factory integration (BYOK → LangChain ChatModel)
 *
 * This replaces the old AgentOrchestrator.ts that used raw prompts.
 */

import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { AIProviderConfig } from '../AIEngine';
import { createChatModel } from './model-factory';
import { buildCanonKeeperGraph } from './canon-keeper';
import { buildWorldArchitectGraph } from './world-architect';
import { buildCharacterDeepenerGraph } from './character-deepener';
import { buildProposalAnalystGraph } from './proposal-analyst';
import type { CanonReport } from './schemas';
import type { ArchitectReport } from './schemas';
import type { DeepenerResult } from './schemas';
import type { ProposalAnalysis } from './schemas';

// Re-export types for consumers
export type { CanonReport, ArchitectReport, DeepenerResult, ProposalAnalysis };

// ─── Orchestrator ───────────────────────────────────────────────────

export class AgentOrchestrator {
  private model: BaseChatModel | null;

  constructor(config: AIProviderConfig) {
    this.model = createChatModel(config);
  }

  isConfigured(): boolean {
    return this.model !== null;
  }

  // ── Individual Agents ───────────────────────────────────────────

  async checkCanon(opts: {
    worldId: string;
    proposalContent: string;
    manualBible?: string;
  }): Promise<CanonReport> {
    this.assertModel();
    const graph = buildCanonKeeperGraph(this.model!);
    const result = await graph.invoke({
      worldId: opts.worldId,
      proposalContent: opts.proposalContent,
      manualBible: opts.manualBible,
      worldBible: '',
      existingCanon: '',
      rawOutput: '',
      report: null,
      retryCount: 0,
      error: null,
    });
    return result.report!;
  }

  async checkBibleSection(opts: {
    worldId: string;
    sectionName: string;
    sectionContent: string;
    otherSections?: Record<string, string>;
  }): Promise<ArchitectReport> {
    this.assertModel();
    const graph = buildWorldArchitectGraph(this.model!);
    const result = await graph.invoke({
      worldId: opts.worldId,
      sectionName: opts.sectionName,
      sectionContent: opts.sectionContent,
      otherSections: opts.otherSections || {},
      fullBible: '',
      rawOutput: '',
      report: null,
      retryCount: 0,
      error: null,
    });
    return result.report!;
  }

  async deepenCharacter(opts: {
    worldId: string;
    characterConcept: string;
    manualBible?: string;
  }): Promise<DeepenerResult> {
    this.assertModel();
    const graph = buildCharacterDeepenerGraph(this.model!);
    const result = await graph.invoke({
      worldId: opts.worldId,
      characterConcept: opts.characterConcept,
      manualBible: opts.manualBible,
      worldBible: '',
      existingCharacters: '',
      rawOutput: '',
      result: null,
      retryCount: 0,
      error: null,
    });
    return result.result!;
  }

  async analyzeProposal(opts: {
    worldId: string;
    proposalContent: string;
    canonPreCheck?: string;
  }): Promise<ProposalAnalysis> {
    this.assertModel();
    const graph = buildProposalAnalystGraph(this.model!);
    const result = await graph.invoke({
      worldId: opts.worldId,
      proposalContent: opts.proposalContent,
      canonPreCheck: opts.canonPreCheck,
      worldBible: '',
      existingCanon: '',
      rawOutput: '',
      analysis: null,
      retryCount: 0,
      error: null,
    });
    return result.analysis!;
  }

  // ── Multi-Agent Pipelines ───────────────────────────────────────

  /**
   * Creation Pipeline: Character Deepener → Canon Keeper
   * Used when a creator submits a new character.
   */
  async creationPipeline(opts: {
    worldId: string;
    characterConcept: string;
    manualBible?: string;
  }): Promise<{
    deepened: DeepenerResult;
    canonReport: CanonReport;
    duration: number;
  }> {
    const start = Date.now();

    // Step 1: Deepen the character
    const deepened = await this.deepenCharacter(opts);

    // Step 2: Canon check on the enriched content
    const enrichedContent = [
      `Backstory: ${deepened.backstory}`,
      `Relationships: ${deepened.relationships.join(', ')}`,
      `World Connections: ${deepened.worldConnections}`,
      `Quirks: ${deepened.quirks.join(', ')}`,
      `Plot Hooks: ${deepened.hooks.join(', ')}`,
    ].join('\n');

    const canonReport = await this.checkCanon({
      worldId: opts.worldId,
      proposalContent: enrichedContent,
      manualBible: opts.manualBible,
    });

    return { deepened, canonReport, duration: Date.now() - start };
  }

  /**
   * Review Pipeline: Canon Keeper → Proposal Analyst
   * Used when a proposal is submitted for community vote.
   */
  async reviewPipeline(opts: {
    worldId: string;
    proposalContent: string;
  }): Promise<{
    canonReport: CanonReport;
    analysis: ProposalAnalysis;
    duration: number;
  }> {
    const start = Date.now();

    // Step 1: Canon check
    const canonReport = await this.checkCanon({
      worldId: opts.worldId,
      proposalContent: opts.proposalContent,
    });

    // Step 2: Proposal analysis (include canon context)
    const canonContext = `Score: ${canonReport.score}/100 | ${canonReport.recommendation}\n` +
      (canonReport.contradictions.length > 0
        ? `Contradictions: ${canonReport.contradictions.join('; ')}`
        : 'No contradictions found.');

    const analysis = await this.analyzeProposal({
      worldId: opts.worldId,
      proposalContent: opts.proposalContent,
      canonPreCheck: canonContext,
    });

    return { canonReport, analysis, duration: Date.now() - start };
  }

  // ── Internal ────────────────────────────────────────────────────

  private assertModel(): void {
    if (!this.model) {
      throw new Error('AI provider not configured. Go to Creator Studio settings and add your API key.');
    }
  }
}

// ─── Factory ────────────────────────────────────────────────────────

export function createOrchestrator(config: AIProviderConfig): AgentOrchestrator {
  return new AgentOrchestrator(config);
}
