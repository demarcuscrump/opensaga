/**
 * Proposal Analyst Agent
 *
 * Workflow: gatherContext -> analyze -> validateOutput, with one parse retry.
 * Auto-fetches World Bible + existing canon, then produces voter-facing analysis.
 */

import type { AgentChatModel } from './model-factory';
import { fetchWorldBible, fetchCanonEntities } from './tools';
import { ProposalAnalysisSchema, type ProposalAnalysis } from './schemas';

type AnalystState = {
  worldId: string;
  proposalContent: string;
  canonPreCheck?: string;
  worldBible: string;
  existingCanon: string;
  rawOutput: string;
  analysis: ProposalAnalysis | null;
  retryCount: number;
  error: string | null;
};

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

export function buildProposalAnalystGraph(model: AgentChatModel) {
  async function gatherContext(state: AnalystState): Promise<Partial<AnalystState>> {
    let bible = '';
    let canon = '';

    if (state.worldId && state.worldId !== 'manual') {
      try {
        bible = await fetchWorldBible.invoke({ worldId: state.worldId });
        canon = await fetchCanonEntities.invoke({ worldId: state.worldId });
      } catch {
        // Keep the agent usable in demo/offline mode.
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
        { role: 'system', content: ANALYST_PROMPT },
        { role: 'user', content: userMessage },
      ]);

      const content = typeof response.content === 'string'
        ? response.content
        : JSON.stringify(response.content);

      return { rawOutput: content, error: null };
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

      return { analysis: ProposalAnalysisSchema.parse(JSON.parse(jsonStr)) };
    } catch {
      if (state.retryCount < 1) return { retryCount: state.retryCount + 1 };
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

  return {
    async invoke(input: Partial<AnalystState> & Pick<AnalystState, 'worldId' | 'proposalContent'>): Promise<AnalystState> {
      let state: AnalystState = {
        canonPreCheck: undefined,
        worldBible: '',
        existingCanon: '',
        rawOutput: '',
        analysis: null,
        retryCount: 0,
        error: null,
        ...input,
      };

      state = { ...state, ...(await gatherContext(state)) };

      while (!state.analysis) {
        state = { ...state, ...(await analyze(state)) };
        state = { ...state, ...(await validateOutput(state)) };
        if (state.analysis || state.retryCount > 1) break;
      }

      return state;
    },
  };
}
