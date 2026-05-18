/**
 * Agent Orchestrator — Top-level multi-agent coordinator
 *
 * Provides:
 * 1. Individual agent invocations
 * 2. Multi-agent pipelines (Creation Pipeline, Review Pipeline)
 * 3. Model factory integration (BYOK → small chat model)
 *
 * This replaces the old AgentOrchestrator.ts that used raw prompts.
 */

import type { AIProviderConfig } from '../AIEngine';
import { createChatModel, type AgentChatModel } from './model-factory';
import { buildCanonKeeperGraph } from './canon-keeper';
import { buildWorldArchitectGraph } from './world-architect';
import { buildCharacterDeepenerGraph } from './character-deepener';
import { buildProposalAnalystGraph } from './proposal-analyst';
import { buildVisionAnalyzerGraph, type VisionAnalysis } from './vision-analyzer';
import type { CanonReport } from './schemas';
import type { ArchitectReport } from './schemas';
import type { DeepenerResult } from './schemas';
import type { ProposalAnalysis } from './schemas';
import { AgentLogger } from './logger';
import { RateLimiter } from './rate-limiter';

// Re-export types for consumers
export type { CanonReport, ArchitectReport, DeepenerResult, ProposalAnalysis, VisionAnalysis };

// ─── Orchestrator ───────────────────────────────────────────────────

export class AgentOrchestrator {
  private model: AgentChatModel | null = null;
  private modelPromise: Promise<AgentChatModel | null> | null = null;

  constructor(private config: AIProviderConfig) {}

  isConfigured(): boolean {
    if (!this.config || this.config.provider === 'mock') return false;
    if (this.config.provider === 'ollama') return true;
    return Boolean(this.config.apiKey);
  }

  // ── Individual Agents ───────────────────────────────────────────

  async checkCanon(opts: {
    worldId: string;
    proposalContent: string;
    manualBible?: string;
  }): Promise<CanonReport> {
    const model = await this.getModel();
    this.assertRateLimit();
    const runId = AgentLogger.startRun('canon_keeper', { worldId: opts.worldId, contentLength: opts.proposalContent.length });
    try {
      const graph = buildCanonKeeperGraph(model);
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
      AgentLogger.completeRun(runId, { score: result.report?.score, recommendation: result.report?.recommendation });
      return result.report!;
    } catch (err: any) {
      AgentLogger.failRun(runId, err);
      throw err;
    }
  }

  async checkBibleSection(opts: {
    worldId: string;
    sectionName: string;
    sectionContent: string;
    otherSections?: Record<string, string>;
  }): Promise<ArchitectReport> {
    const model = await this.getModel();
    this.assertRateLimit();
    const runId = AgentLogger.startRun('world_architect', { worldId: opts.worldId, section: opts.sectionName });
    try {
      const graph = buildWorldArchitectGraph(model);
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
      AgentLogger.completeRun(runId, { coherenceScore: result.report?.coherenceScore });
      return result.report!;
    } catch (err: any) {
      AgentLogger.failRun(runId, err);
      throw err;
    }
  }

  async deepenCharacter(opts: {
    worldId: string;
    characterConcept: string;
    manualBible?: string;
  }): Promise<DeepenerResult> {
    const model = await this.getModel();
    this.assertRateLimit();
    const runId = AgentLogger.startRun('character_deepener', { worldId: opts.worldId, conceptLength: opts.characterConcept.length });
    try {
      const graph = buildCharacterDeepenerGraph(model);
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
      AgentLogger.completeRun(runId, { hasBackstory: !!result.result?.backstory, hookCount: result.result?.hooks?.length });
      return result.result!;
    } catch (err: any) {
      AgentLogger.failRun(runId, err);
      throw err;
    }
  }

  async analyzeProposal(opts: {
    worldId: string;
    proposalContent: string;
    canonPreCheck?: string;
  }): Promise<ProposalAnalysis> {
    const model = await this.getModel();
    this.assertRateLimit();
    const runId = AgentLogger.startRun('proposal_analyst', { worldId: opts.worldId, contentLength: opts.proposalContent.length });
    try {
      const graph = buildProposalAnalystGraph(model);
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
      AgentLogger.completeRun(runId, { qualityScore: result.analysis?.qualityScore, canonFitScore: result.analysis?.canonFitScore, recommendation: result.analysis?.recommendation });
      return result.analysis!;
    } catch (err: any) {
      AgentLogger.failRun(runId, err);
      throw err;
    }
  }

  async analyzeCharacterImage(opts: {
    imageBase64: string;
    imageMimeType: string;
  }): Promise<VisionAnalysis> {
    const model = await this.getModel();
    this.assertRateLimit();
    const runId = AgentLogger.startRun('vision_analyzer', { mimeType: opts.imageMimeType, imageSize: opts.imageBase64.length });
    try {
      const graph = buildVisionAnalyzerGraph(model);
      const result = await graph.invoke({
        imageBase64: opts.imageBase64,
        imageMimeType: opts.imageMimeType,
        rawOutput: '',
        analysis: null,
        retryCount: 0,
        error: null,
      });
      AgentLogger.completeRun(runId, { suggestedName: result.analysis?.suggestedName, archetype: result.analysis?.archetype });
      return result.analysis!;
    } catch (err: any) {
      AgentLogger.failRun(runId, err);
      throw err;
    }
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

  private async getModel(): Promise<AgentChatModel> {
    if (!this.modelPromise) {
      this.modelPromise = createChatModel(this.config);
    }

    this.model = await this.modelPromise;

    if (!this.model) {
      throw new Error('AI provider not configured. Go to Creator Studio settings and add your API key.');
    }

    return this.model;
  }

  private assertRateLimit(): void {
    const { allowed, reason } = RateLimiter.check();
    if (!allowed) {
      throw new Error(reason || 'Rate limit exceeded.');
    }
    RateLimiter.record();
  }
}

// ─── Factory ────────────────────────────────────────────────────────

export function createOrchestrator(config: AIProviderConfig): AgentOrchestrator {
  return new AgentOrchestrator(config);
}
