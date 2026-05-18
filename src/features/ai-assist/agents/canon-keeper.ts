/**
 * Canon Keeper Agent
 *
 * Workflow: gatherContext -> analyze -> validateOutput, with one parse retry.
 * Auto-fetches World Bible + existing canon via tools.
 */

import type { AgentChatModel } from './model-factory';
import { fetchWorldBible, fetchCanonEntities } from './tools';
import { CanonReportSchema, type CanonReport } from './schemas';

type CanonState = {
  worldId: string;
  proposalContent: string;
  manualBible?: string;
  worldBible: string;
  existingCanon: string;
  rawOutput: string;
  report: CanonReport | null;
  retryCount: number;
  error: string | null;
};

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

export function buildCanonKeeperGraph(model: AgentChatModel) {
  async function gatherContext(state: CanonState): Promise<Partial<CanonState>> {
    let bible = state.manualBible || '';
    let canon = '';

    if (state.worldId && state.worldId !== 'manual') {
      try {
        bible = bible || await fetchWorldBible.invoke({ worldId: state.worldId });
        canon = await fetchCanonEntities.invoke({ worldId: state.worldId });
      } catch {
        // Keep the agent usable in demo/offline mode.
      }
    }

    return {
      worldBible: bible || '[No World Bible available. Evaluate internal consistency only.]',
      existingCanon: canon || '[No existing canon found.]',
    };
  }

  async function analyze(state: CanonState): Promise<Partial<CanonState>> {
    try {
      const response = await model.invoke([
        { role: 'system', content: CANON_KEEPER_PROMPT },
        {
          role: 'user',
          content:
            `--- WORLD BIBLE (Source of Truth) ---\n${state.worldBible}\n\n` +
            `--- EXISTING CANON (Do not contradict) ---\n${state.existingCanon}\n\n` +
            `--- PROPOSED CONTENT (Analyze this) ---\n${state.proposalContent}`,
        },
      ]);

      const content = typeof response.content === 'string'
        ? response.content
        : JSON.stringify(response.content);

      return { rawOutput: content, error: null };
    } catch (err: any) {
      return { error: `LLM call failed: ${err.message}`, rawOutput: '' };
    }
  }

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
      let jsonStr = state.rawOutput;
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/) || jsonStr.match(/(\{[\s\S]*\})/);
      if (jsonMatch) jsonStr = jsonMatch[1].trim();

      return { report: CanonReportSchema.parse(JSON.parse(jsonStr)) };
    } catch {
      if (state.retryCount < 1) return { retryCount: state.retryCount + 1 };
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

  return {
    async invoke(input: Partial<CanonState> & Pick<CanonState, 'worldId' | 'proposalContent'>): Promise<CanonState> {
      let state: CanonState = {
        manualBible: undefined,
        worldBible: '',
        existingCanon: '',
        rawOutput: '',
        report: null,
        retryCount: 0,
        error: null,
        ...input,
      };

      state = { ...state, ...(await gatherContext(state)) };

      while (!state.report) {
        state = { ...state, ...(await analyze(state)) };
        state = { ...state, ...(await validateOutput(state)) };
        if (state.report || state.retryCount > 1) break;
      }

      return state;
    },
  };
}
