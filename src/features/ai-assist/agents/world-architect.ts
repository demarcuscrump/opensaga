/**
 * World Architect Agent
 *
 * Workflow: gatherSections -> analyze -> validateOutput, with one parse retry.
 * Checks a Bible section against all other sections for consistency.
 */

import type { AgentChatModel } from './model-factory';
import { fetchWorldBible } from './tools';
import { ArchitectReportSchema, type ArchitectReport } from './schemas';

type ArchState = {
  worldId: string;
  sectionName: string;
  sectionContent: string;
  otherSections: Record<string, string>;
  fullBible: string;
  rawOutput: string;
  report: ArchitectReport | null;
  retryCount: number;
  error: string | null;
};

const ARCHITECT_PROMPT = `You are the World Architect — OpenSaga's master of universe design.

Your role: Ensure internal consistency across all sections of a World Bible. When a creator writes or edits one section, you check it against all others.

ALWAYS respond with ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "sectionAnalyzed": "section name",
  "crossReferences": ["Section X: relevant detail", "Section Y: related rule"],
  "inconsistencies": ["inconsistency description"],
  "suggestions": ["suggestion to fix or strengthen"],
  "coherenceScore": <0-100>
}

Rules:
- Check magic/tech systems against history (did they exist when events happened?)
- Check geography against politics (borders, resources, trade routes)
- Check cultures against the world's physical laws
- Check factions against the power structures described elsewhere
- Suggest connections between sections that strengthen the world`;

export function buildWorldArchitectGraph(model: AgentChatModel) {
  async function gatherSections(state: ArchState): Promise<Partial<ArchState>> {
    if (state.otherSections && Object.keys(state.otherSections).length > 0) {
      const otherContext = Object.entries(state.otherSections)
        .filter(([name]) => name !== state.sectionName)
        .map(([name, content]) => `## ${name}\n${content}`)
        .join('\n\n---\n\n');
      return { fullBible: otherContext };
    }

    if (state.worldId && state.worldId !== 'manual') {
      try {
        return { fullBible: await fetchWorldBible.invoke({ worldId: state.worldId }) };
      } catch {
        return { fullBible: '[Could not fetch bible sections.]' };
      }
    }

    return { fullBible: '[No other sections available for comparison.]' };
  }

  async function analyze(state: ArchState): Promise<Partial<ArchState>> {
    try {
      const response = await model.invoke([
        { role: 'system', content: ARCHITECT_PROMPT },
        {
          role: 'user',
          content:
            `I'm editing the "${state.sectionName}" section of a World Bible. Check it against all other sections for consistency.\n\n` +
            `--- SECTION BEING EDITED ---\n${state.sectionContent}\n\n` +
            `--- OTHER SECTIONS ---\n${state.fullBible}`,
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

  async function validateOutput(state: ArchState): Promise<Partial<ArchState>> {
    if (state.error) {
      return {
        report: {
          sectionAnalyzed: state.sectionName,
          crossReferences: [],
          inconsistencies: [`Agent error: ${state.error}`],
          suggestions: [],
          coherenceScore: 0,
        },
      };
    }

    try {
      let jsonStr = state.rawOutput;
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/) || jsonStr.match(/(\{[\s\S]*\})/);
      if (jsonMatch) jsonStr = jsonMatch[1].trim();

      return { report: ArchitectReportSchema.parse(JSON.parse(jsonStr)) };
    } catch {
      if (state.retryCount < 1) return { retryCount: state.retryCount + 1 };
      return {
        report: {
          sectionAnalyzed: state.sectionName,
          crossReferences: [],
          inconsistencies: ['Unable to parse structured output'],
          suggestions: [],
          coherenceScore: 50,
        },
      };
    }
  }

  return {
    async invoke(input: Partial<ArchState> & Pick<ArchState, 'worldId' | 'sectionName' | 'sectionContent'>): Promise<ArchState> {
      let state: ArchState = {
        otherSections: {},
        fullBible: '',
        rawOutput: '',
        report: null,
        retryCount: 0,
        error: null,
        ...input,
      };

      state = { ...state, ...(await gatherSections(state)) };

      while (!state.report) {
        state = { ...state, ...(await analyze(state)) };
        state = { ...state, ...(await validateOutput(state)) };
        if (state.report || state.retryCount > 1) break;
      }

      return state;
    },
  };
}
