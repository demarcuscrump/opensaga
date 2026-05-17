/**
 * Canon Keeper Agent — LangGraph StateGraph
 *
 * Graph: START → gatherContext → analyze → validateOutput → END
 *                                   ↑                ↓
 *                                   └── retry (if parse fails, max 1)
 *
 * Auto-fetches World Bible + existing canon via tools.
 * Returns Zod-validated CanonReport.
 */

import {
  StateGraph,
  START,
  END,
  Annotation,
} from '@langchain/langgraph';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { fetchWorldBible, fetchCanonEntities } from './tools';
import { CanonReportSchema, type CanonReport } from './schemas';

// ─── State Definition ───────────────────────────────────────────────

const CanonKeeperState = Annotation.Root({
  worldId: Annotation<string>,
  proposalContent: Annotation<string>,
  manualBible: Annotation<string | undefined>,
  worldBible: Annotation<string>,
  existingCanon: Annotation<string>,
  rawOutput: Annotation<string>,
  report: Annotation<CanonReport | null>,
  retryCount: Annotation<number>,
  error: Annotation<string | null>,
});

type CanonState = typeof CanonKeeperState.State;

// ─── System Prompt ──────────────────────────────────────────────────

const CANON_KEEPER_PROMPT = `You are the Canon Keeper — OpenSaga's guardian of narrative consistency.

Your role: Analyze proposed content against the World Bible and existing canon to detect contradictions.

ALWAYS respond with ONLY valid JSON in this exact format (no markdown, no code blocks):
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
- If no World Bible is provided, evaluate internal consistency only`;

// ─── Graph Builder ──────────────────────────────────────────────────

export function buildCanonKeeperGraph(model: BaseChatModel) {
  // Node: Gather context from Supabase
  async function gatherContext(state: CanonState): Promise<Partial<CanonState>> {
    let bible = state.manualBible || '';
    let canon = '';

    if (state.worldId && state.worldId !== 'manual') {
      try {
        bible = bible || await fetchWorldBible.invoke({ worldId: state.worldId });
        canon = await fetchCanonEntities.invoke({ worldId: state.worldId });
      } catch {
        // If tools fail, proceed with what we have
      }
    }

    return {
      worldBible: bible || '[No World Bible available. Evaluate internal consistency only.]',
      existingCanon: canon || '[No existing canon found.]',
    };
  }

  // Node: Analyze with LLM
  async function analyze(state: CanonState): Promise<Partial<CanonState>> {
    try {
      const response = await model.invoke([
        new SystemMessage(CANON_KEEPER_PROMPT),
        new HumanMessage(
          `--- WORLD BIBLE (Source of Truth) ---\n${state.worldBible}\n\n` +
          `--- EXISTING CANON (Do not contradict) ---\n${state.existingCanon}\n\n` +
          `--- PROPOSED CONTENT (Analyze this) ---\n${state.proposalContent}`
        ),
      ]);

      const content = typeof response.content === 'string'
        ? response.content
        : JSON.stringify(response.content);

      return { rawOutput: content };
    } catch (err: any) {
      return { error: `LLM call failed: ${err.message}`, rawOutput: '' };
    }
  }

  // Node: Validate output with Zod
  async function validateOutput(state: CanonState): Promise<Partial<CanonState>> {
    if (state.error) {
      return {
        report: {
          score: 0,
          consistent: [],
          concerns: [],
          contradictions: [`Agent error: ${state.error}`],
          recommendation: 'APPROVE_WITH_EDITS',
          summary: state.error,
        },
      };
    }

    try {
      // Extract JSON from response (handle markdown code blocks)
      let jsonStr = state.rawOutput;
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/) || jsonStr.match(/(\{[\s\S]*\})/);
      if (jsonMatch) jsonStr = jsonMatch[1].trim();

      const parsed = JSON.parse(jsonStr);
      const validated = CanonReportSchema.parse(parsed);
      return { report: validated };
    } catch {
      // Retry once
      if (state.retryCount < 1) {
        return { retryCount: state.retryCount + 1 };
      }
      // Final fallback
      return {
        report: {
          score: 50,
          consistent: [],
          concerns: ['Unable to parse structured output from agent'],
          contradictions: [],
          recommendation: 'APPROVE_WITH_EDITS',
          summary: state.rawOutput?.slice(0, 300) || 'Analysis could not be completed.',
        },
      };
    }
  }

  // Conditional: retry or finish
  function shouldRetry(state: CanonState): string {
    if (state.report) return END;
    if (state.retryCount > 0 && !state.report) return 'analyze';
    return END;
  }

  // Build the graph
  const graph = new StateGraph(CanonKeeperState)
    .addNode('gatherContext', gatherContext)
    .addNode('analyze', analyze)
    .addNode('validateOutput', validateOutput)
    .addEdge(START, 'gatherContext')
    .addEdge('gatherContext', 'analyze')
    .addEdge('analyze', 'validateOutput')
    .addConditionalEdges('validateOutput', shouldRetry)
    .compile();

  return graph;
}
