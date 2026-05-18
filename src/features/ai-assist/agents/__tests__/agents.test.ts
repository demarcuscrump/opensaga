/**
 * Agent Unit Tests — All 5 lightweight agent workflows
 *
 * Uses a mock model that returns predictable JSON.
 * No API keys, no network calls, no Supabase.
 * Tests the full workflow pipeline: input -> steps -> validated output.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { buildCanonKeeperGraph } from '../canon-keeper';
import { buildWorldArchitectGraph } from '../world-architect';
import { buildCharacterDeepenerGraph } from '../character-deepener';
import { buildProposalAnalystGraph } from '../proposal-analyst';
import { buildVisionAnalyzerGraph } from '../vision-analyzer';
import { buildCreationDnaGraph } from '../creation-dna';
import {
  mockCanonKeeper,
  mockWorldArchitect,
  mockCharacterDeepener,
  mockProposalAnalyst,
  mockVisionAnalyzer,
  mockCreationDna,
  MOCK_CANON_REPORT,
  MOCK_ARCHITECT_REPORT,
  MOCK_DEEPENER_RESULT,
  MOCK_PROPOSAL_ANALYSIS,
  MOCK_VISION_ANALYSIS,
  MOCK_CREATION_DNA_REPORT,
} from './mock-model';
import { AgentLogger } from '../logger';

describe('Canon Keeper Agent', () => {
  const model = mockCanonKeeper();

  it('returns a validated CanonReport with score and recommendation', async () => {
    const graph = buildCanonKeeperGraph(model);
    const result = await graph.invoke({
      worldId: 'test-world-1',
      proposalContent: 'A new character who wields shadow magic.',
      manualBible: 'Shadow magic is forbidden in this world.',
      worldBible: '',
      existingCanon: '',
      rawOutput: '',
      report: null,
      retryCount: 0,
      error: null,
    });

    expect(result.report).not.toBeNull();
    expect(result.report!.score).toBe(MOCK_CANON_REPORT.score);
    expect(result.report!.recommendation).toBe(MOCK_CANON_REPORT.recommendation);
    expect(result.report!.consistent).toHaveLength(2);
    expect(result.report!.contradictions).toHaveLength(0);
  });

  it('handles worldId for auto-fetch context path', async () => {
    const graph = buildCanonKeeperGraph(model);
    const result = await graph.invoke({
      worldId: 'world-abc',
      proposalContent: 'Test content',
      worldBible: '',
      existingCanon: '',
      rawOutput: '',
      report: null,
      retryCount: 0,
      error: null,
    });

    expect(result.report).not.toBeNull();
    expect(result.report!.score).toBeGreaterThanOrEqual(0);
    expect(result.report!.score).toBeLessThanOrEqual(100);
  });
});

describe('World Architect Agent', () => {
  const model = mockWorldArchitect();

  it('returns a validated ArchitectReport with coherence score', async () => {
    const graph = buildWorldArchitectGraph(model);
    const result = await graph.invoke({
      worldId: 'test-world-1',
      sectionName: 'Geography',
      sectionContent: 'The Northern Wastes stretch for thousands of miles.',
      otherSections: { 'History': 'The Northern Wastes were created by the Cataclysm.' },
      fullBible: '',
      rawOutput: '',
      report: null,
      retryCount: 0,
      error: null,
    });

    expect(result.report).not.toBeNull();
    expect(result.report!.coherenceScore).toBe(MOCK_ARCHITECT_REPORT.coherenceScore);
    expect(result.report!.crossReferences).toHaveLength(2);
    expect(result.report!.inconsistencies).toHaveLength(0);
    expect(result.report!.suggestions.length).toBeGreaterThan(0);
  });
});

describe('Character Deepener Agent', () => {
  const model = mockCharacterDeepener();

  it('returns a validated DeepenerResult with backstory and hooks', async () => {
    const graph = buildCharacterDeepenerGraph(model);
    const result = await graph.invoke({
      worldId: 'test-world-1',
      characterConcept: 'A former soldier turned healer.',
      manualBible: 'The world has been at war for 30 years.',
      worldBible: '',
      existingCharacters: '',
      rawOutput: '',
      result: null,
      retryCount: 0,
      error: null,
    });

    expect(result.result).not.toBeNull();
    expect(result.result!.backstory).toBe(MOCK_DEEPENER_RESULT.backstory);
    expect(result.result!.relationships).toHaveLength(2);
    expect(result.result!.hooks).toHaveLength(1);
    expect(result.result!.quirks).toHaveLength(2);
    expect(result.result!.worldConnections).toContain('Warden pact');
  });
});

describe('Proposal Analyst Agent', () => {
  const model = mockProposalAnalyst();

  it('returns a validated ProposalAnalysis with quality and canon fit scores', async () => {
    const graph = buildProposalAnalystGraph(model);
    const result = await graph.invoke({
      worldId: 'test-world-1',
      proposalContent: 'Proposal to add a new faction: The Iron Dawn.',
      worldBible: '',
      existingCanon: '',
      rawOutput: '',
      analysis: null,
      retryCount: 0,
      error: null,
    });

    expect(result.analysis).not.toBeNull();
    expect(result.analysis!.qualityScore).toBe(MOCK_PROPOSAL_ANALYSIS.qualityScore);
    expect(result.analysis!.canonFitScore).toBe(MOCK_PROPOSAL_ANALYSIS.canonFitScore);
    expect(result.analysis!.recommendation).toBe('YES');
    expect(result.analysis!.voterSummary).toContain('Well-crafted');
  });
});

describe('Vision Analyzer Agent', () => {
  const model = mockVisionAnalyzer();

  it('returns a validated VisionAnalysis from image input', async () => {
    const graph = buildVisionAnalyzerGraph(model);
    // Use a tiny 1x1 PNG as base64 for testing
    const tinyPng = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    const result = await graph.invoke({
      imageBase64: tinyPng,
      imageMimeType: 'image/png',
      rawOutput: '',
      analysis: null,
      retryCount: 0,
      error: null,
    });

    expect(result.analysis).not.toBeNull();
    expect(result.analysis!.suggestedName).toBe(MOCK_VISION_ANALYSIS.suggestedName);
    expect(result.analysis!.archetype).toBe(MOCK_VISION_ANALYSIS.archetype);
    expect(result.analysis!.species).toBe(MOCK_VISION_ANALYSIS.species);
    expect(result.analysis!.appearance).toContain('angular features');
    expect(result.analysis!.worldHints).toContain('Cyberpunk');
  });
});

describe('Creation DNA Agent', () => {
  const model = mockCreationDna();

  it('returns a validated CreationDnaReport with controlled tags', async () => {
    const graph = buildCreationDnaGraph(model);
    const result = await graph.invoke({
      idea: 'A retired hitman protects his adopted daughter from an underground fight ring.',
      rawOutput: '',
      report: null,
      retryCount: 0,
      error: null,
    });

    expect(result.report).not.toBeNull();
    expect(result.report!.idea).toBe(MOCK_CREATION_DNA_REPORT.idea);
    expect(result.report!.genre).toContain('Grounded Combat / Martial Realism');
    expect(result.report!.emotion).toContain('Found Family');
    expect(result.report!.comboStatus).toBe('UNTESTED');
    expect(result.report!.differentiators).toHaveLength(3);
    expect(result.report!.pitch).toContain('neon fight empire');
  });
});

describe('Agent Logger (Observability)', () => {
  beforeEach(() => {
    AgentLogger.clear();
  });

  it('tracks a successful run with timing', () => {
    const runId = AgentLogger.startRun('canon_keeper', { worldId: 'test' });
    expect(AgentLogger.getLogs()).toHaveLength(1);
    expect(AgentLogger.getLogs()[0].status).toBe('running');

    AgentLogger.completeRun(runId, { score: 85 });
    expect(AgentLogger.getLogs()[0].status).toBe('success');
    expect(AgentLogger.getLogs()[0].durationMs).not.toBeNull();
    expect(AgentLogger.getLogs()[0].output).toEqual({ score: 85 });
  });

  it('tracks a failed run with error', () => {
    const runId = AgentLogger.startRun('world_architect', { section: 'Geography' });
    AgentLogger.failRun(runId, new Error('Model timeout'));

    expect(AgentLogger.getLogs()[0].status).toBe('error');
    expect(AgentLogger.getLogs()[0].error).toBe('Model timeout');
    expect(AgentLogger.getLogs()[0].errorStack).toBeDefined();
  });

  it('limits logs to 50 entries', () => {
    for (let i = 0; i < 60; i++) {
      AgentLogger.startRun('test_agent', { i });
    }
    expect(AgentLogger.getLogs().length).toBeLessThanOrEqual(50);
  });

  it('getLogsForAgent filters correctly', () => {
    AgentLogger.startRun('canon_keeper', {});
    AgentLogger.startRun('world_architect', {});
    AgentLogger.startRun('canon_keeper', {});

    expect(AgentLogger.getLogsForAgent('canon_keeper')).toHaveLength(2);
    expect(AgentLogger.getLogsForAgent('world_architect')).toHaveLength(1);
  });
});
