/**
 * Proposal Analyst Agent — LangGraph StateGraph
 *
 * Graph: START → gatherContext → analyze → validateOutput → END
 *                                    ↑           ↓
 *                                    └── retry (max 1)
 *
 * Auto-fetches World Bible + existing canon, then produces an
 * impartial analysis for community voters.
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
import { ProposalAnalysisSchema, type ProposalAnalysis } from './schemas';

// ─── State ──────────────────────────────────────────────────────────

const ProposalAnalystState = Annotation.Root({
  worldId: Annotation<string>,
  proposalContent: Annotation<string>,
  canonPreCheck: Annotation<string | undefined>,
  worldBible: Annotation<string>,
  existingCanon: Annotation<string>,
  rawOutput: Annotation<string>,
  analysis: Annotation<ProposalAnalysis | null>,
  retryCount: Annotation<number>,
  error: Annotation<string | null>,
});

type AnalystState = typeof ProposalAnalystState.State;

const ANALYST_PROMPT = `You are the Proposal Analyst — OpenSaga's impartial evaluator for community governance.

Your role: Provide voters with an objective analysis of a proposal's quality, canon fitness, and potential impact on the world.

ALWAYS respond with ONLY valid JSON in this exact format (no markdown, no code blocks):
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
- The voterSummary should be readable by someone who hasn't read the full proposal
- If a Canon Keeper pre-check is provided, reference its findings`;

// ─── Graph Builder ──────────────────────────────────────────────────

export function buildProposalAnalystGraph(model: BaseChatModel) {
  async function gatherContext(state: AnalystState): Promise<Partial<AnalystState>> {
    let bible = '';
    let canon = '';

    if (state.worldId && state.worldId !== 'manual') {
      try {
        bible = await fetchWorldBible.invoke({ worldId: state.worldId });
        canon = await fetchCanonEntities.invoke({ worldId: state.worldId });
      } catch {
        // Proceed with what we have
      }
    }

    return {
      worldBible: bible || '[No World Bible available.]',
      existingCanon: canon || '[No existing canon found.]',
    };
  }

  async function analyze(state: AnalystState): Promise<Partial<AnalystState>> {
    try {
      let userMessage =
        `--- WORLD BIBLE ---\n${state.worldBible}\n\n` +
        `--- EXISTING CANON ---\n${state.existingCanon}\n\n` +
        `--- PROPOSAL (Analyze this for voters) ---\n${state.proposalContent}`;

      if (state.canonPreCheck) {
        userMessage += `\n\n--- CANON KEEPER PRE-CHECK ---\n${state.canonPreCheck}`;
      }

      const response = await model.invoke([
        new SystemMessage(ANALYST_PROMPT),
        new HumanMessage(userMessage),
      ]);

      const content = typeof response.content === 'string'
        ? response.content
        : JSON.stringify(response.content);

      return { rawOutput: content };
    } catch (err: any) {
      return { error: `LLM call failed: ${err.message}`, rawOutput: '' };
    }
  }

  async function validateOutput(state: AnalystState): Promise<Partial<AnalystState>> {
    if (state.error) {
      return {
        analysis: {
          qualityScore: 0,
          canonFitScore: 0,
          originality: 'Unable to assess',
          worldImpact: 'Unable to assess',
          potentialConflicts: [`Agent error: ${state.error}`],
          voterSummary: state.error,
          recommendation: 'NEEDS_WORK',
        },
      };
    }

    try {
      let jsonStr = state.rawOutput;
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/) || jsonStr.match(/(\{[\s\S]*\})/);
      if (jsonMatch) jsonStr = jsonMatch[1].trim();

      const parsed = JSON.parse(jsonStr);
      const validated = ProposalAnalysisSchema.parse(parsed);
      return { analysis: validated };
    } catch {
      if (state.retryCount < 1) {
        return { retryCount: state.retryCount + 1 };
      }
      return {
        analysis: {
          qualityScore: 50,
          canonFitScore: 50,
          originality: 'Unable to parse structured output',
          worldImpact: 'Unable to assess',
          potentialConflicts: [],
          voterSummary: state.rawOutput?.slice(0, 200) || 'Analysis could not be completed.',
          recommendation: 'NEEDS_WORK',
        },
      };
    }
  }

  function shouldRetry(state: AnalystState): string {
    if (state.analysis) return END;
    if (state.retryCount > 0 && !state.analysis) return 'analyze';
    return END;
  }

  return new StateGraph(ProposalAnalystState)
    .addNode('gatherContext', gatherContext)
    .addNode('analyze', analyze)
    .addNode('validateOutput', validateOutput)
    .addEdge(START, 'gatherContext')
    .addEdge('gatherContext', 'analyze')
    .addEdge('analyze', 'validateOutput')
    .addConditionalEdges('validateOutput', shouldRetry)
    .compile();
}
