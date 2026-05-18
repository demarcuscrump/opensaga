/**
 * useAgents — React hook for the lightweight multi-agent orchestrator.
 *
 * Wraps each agent call with loading/error state management.
 * Uses the lightweight agent workflows with:
 *   - Auto-context fetching from Supabase (no manual pasting)
 *   - Zod-validated structured output
 *   - Retry logic built into the workflows
 *   - Multi-agent pipelines (Creation, Review)
 */

import { useState, useMemo, useCallback } from 'react';
import { useAIStore } from '../store/aiStore';
import {
  AgentOrchestrator,
  type CanonReport,
  type ArchitectReport,
  type DeepenerResult,
  type ProposalAnalysis,
  type VisionAnalysis,
  type CreationDnaReport,
} from '../features/ai-assist/agents/orchestrator';

interface AgentState<T> {
  data: T | null;
  isRunning: boolean;
  error: string | null;
}

export function useAgents() {
  const config = useAIStore(s => s.getConfig)();
  const orchestrator = useMemo(() => new AgentOrchestrator(config), [config.provider, config.apiKey, config.model, config.endpoint, config.temperature]);

  const [canonState, setCanonState] = useState<AgentState<CanonReport>>({ data: null, isRunning: false, error: null });
  const [architectState, setArchitectState] = useState<AgentState<ArchitectReport>>({ data: null, isRunning: false, error: null });
  const [deepenerState, setDeepenerState] = useState<AgentState<DeepenerResult>>({ data: null, isRunning: false, error: null });
  const [analystState, setAnalystState] = useState<AgentState<ProposalAnalysis>>({ data: null, isRunning: false, error: null });

  const [visionState, setVisionState] = useState<AgentState<VisionAnalysis>>({ data: null, isRunning: false, error: null });
  const [creationDnaState, setCreationDnaState] = useState<AgentState<CreationDnaReport>>({ data: null, isRunning: false, error: null });

  const [creationPipelineRunning, setCreationPipelineRunning] = useState(false);
  const [reviewPipelineRunning, setReviewPipelineRunning] = useState(false);

  // ── Individual Agent Calls ──────────────────────────────────────
  // New signature: agents auto-fetch context via worldId.
  // manualBible is optional fallback for when user pastes text directly.

  const checkCanon = useCallback(async (
    proposalContent: string,
    worldId: string,
    manualBible?: string
  ) => {
    setCanonState({ data: null, isRunning: true, error: null });
    try {
      const result = await orchestrator.checkCanon({ worldId, proposalContent, manualBible });
      setCanonState({ data: result, isRunning: false, error: null });
      return result;
    } catch (e: any) {
      setCanonState({ data: null, isRunning: false, error: e.message });
      return null;
    }
  }, [orchestrator]);

  const checkBibleSection = useCallback(async (
    sectionName: string,
    sectionContent: string,
    worldId: string,
    otherSections?: Record<string, string>
  ) => {
    setArchitectState({ data: null, isRunning: true, error: null });
    try {
      const result = await orchestrator.checkBibleSection({ worldId, sectionName, sectionContent, otherSections });
      setArchitectState({ data: result, isRunning: false, error: null });
      return result;
    } catch (e: any) {
      setArchitectState({ data: null, isRunning: false, error: e.message });
      return null;
    }
  }, [orchestrator]);

  const deepenCharacter = useCallback(async (
    characterConcept: string,
    worldId: string,
    manualBible?: string
  ) => {
    setDeepenerState({ data: null, isRunning: true, error: null });
    try {
      const result = await orchestrator.deepenCharacter({ worldId, characterConcept, manualBible });
      setDeepenerState({ data: result, isRunning: false, error: null });
      return result;
    } catch (e: any) {
      setDeepenerState({ data: null, isRunning: false, error: e.message });
      return null;
    }
  }, [orchestrator]);

  const analyzeProposal = useCallback(async (
    proposalContent: string,
    worldId: string
  ) => {
    setAnalystState({ data: null, isRunning: true, error: null });
    try {
      const result = await orchestrator.analyzeProposal({ worldId, proposalContent });
      setAnalystState({ data: result, isRunning: false, error: null });
      return result;
    } catch (e: any) {
      setAnalystState({ data: null, isRunning: false, error: e.message });
      return null;
    }
  }, [orchestrator]);

  // ── Multi-Agent Pipelines ───────────────────────────────────────

  const runCreationPipeline = useCallback(async (
    characterConcept: string,
    worldId: string,
    manualBible?: string
  ) => {
    setCreationPipelineRunning(true);
    setDeepenerState({ data: null, isRunning: true, error: null });
    try {
      const result = await orchestrator.creationPipeline({ worldId, characterConcept, manualBible });
      setDeepenerState({ data: result.deepened, isRunning: false, error: null });
      setCanonState({ data: result.canonReport, isRunning: false, error: null });
      setCreationPipelineRunning(false);
      return result;
    } catch (e: any) {
      setDeepenerState({ data: null, isRunning: false, error: e.message });
      setCanonState({ data: null, isRunning: false, error: e.message });
      setCreationPipelineRunning(false);
      return null;
    }
  }, [orchestrator]);

  const runReviewPipeline = useCallback(async (
    proposalContent: string,
    worldId: string
  ) => {
    setReviewPipelineRunning(true);
    setCanonState({ data: null, isRunning: true, error: null });
    try {
      const result = await orchestrator.reviewPipeline({ worldId, proposalContent });
      setCanonState({ data: result.canonReport, isRunning: false, error: null });
      setAnalystState({ data: result.analysis, isRunning: false, error: null });
      setReviewPipelineRunning(false);
      return result;
    } catch (e: any) {
      setCanonState({ data: null, isRunning: false, error: e.message });
      setAnalystState({ data: null, isRunning: false, error: e.message });
      setReviewPipelineRunning(false);
      return null;
    }
  }, [orchestrator]);

  const analyzeCharacterImage = useCallback(async (
    imageBase64: string,
    imageMimeType: string
  ) => {
    setVisionState({ data: null, isRunning: true, error: null });
    try {
      const result = await orchestrator.analyzeCharacterImage({ imageBase64, imageMimeType });
      setVisionState({ data: result, isRunning: false, error: null });
      return result;
    } catch (e: any) {
      setVisionState({ data: null, isRunning: false, error: e.message });
      return null;
    }
  }, [orchestrator]);

  const analyzeCreationDna = useCallback(async (
    idea: string
  ) => {
    setCreationDnaState({ data: null, isRunning: true, error: null });
    try {
      const result = await orchestrator.analyzeCreationDna({ idea });
      setCreationDnaState({ data: result, isRunning: false, error: null });
      return result;
    } catch (e: any) {
      setCreationDnaState({ data: null, isRunning: false, error: e.message });
      return null;
    }
  }, [orchestrator]);

  return {
    // Individual agents
    checkCanon,
    checkBibleSection,
    deepenCharacter,
    analyzeProposal,
    analyzeCharacterImage,
    analyzeCreationDna,

    // Pipelines
    runCreationPipeline,
    runReviewPipeline,

    // State
    canonKeeper: canonState,
    worldArchitect: architectState,
    characterDeepener: deepenerState,
    proposalAnalyst: analystState,
    visionAnalyzer: visionState,
    creationDna: creationDnaState,

    // Pipeline running
    isCreationPipelineRunning: creationPipelineRunning,
    isReviewPipelineRunning: reviewPipelineRunning,

    // Utility
    isConfigured: orchestrator.isConfigured(),
  };
}
