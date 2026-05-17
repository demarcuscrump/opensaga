/**
 * World Architect Agent — LangGraph StateGraph
 *
 * Graph: START → gatherSections → analyze → validateOutput → END
 *                                     ↑                ↓
 *                                     └── retry (max 1)
 *
 * Checks a bible section against all other sections for consistency.
 * Auto-fetches all bible sections via tools when worldId is provided.
 */

import {
  StateGraph,
  START,
  END,
  Annotation,
} from '@langchain/langgraph';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { fetchWorldBible } from './tools';
import { ArchitectReportSchema, type ArchitectReport } from './schemas';

// ─── State ──────────────────────────────────────────────────────────

const WorldArchitectState = Annotation.Root({
  worldId: Annotation<string>,
  sectionName: Annotation<string>,
  sectionContent: Annotation<string>,
  otherSections: Annotation<Record<string, string>>,
  fullBible: Annotation<string>,
  rawOutput: Annotation<string>,
  report: Annotation<ArchitectReport | null>,
  retryCount: Annotation<number>,
  error: Annotation<string | null>,
});

type ArchState = typeof WorldArchitectState.State;

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

// ─── Graph Builder ──────────────────────────────────────────────────

export function buildWorldArchitectGraph(model: BaseChatModel) {
  async function gatherSections(state: ArchState): Promise<Partial<ArchState>> {
    // If otherSections were provided directly, use them
    if (state.otherSections && Object.keys(state.otherSections).length > 0) {
      const otherContext = Object.entries(state.otherSections)
        .filter(([name]) => name !== state.sectionName)
        .map(([name, content]) => `## ${name}\n${content}`)
        .join('\n\n---\n\n');
      return { fullBible: otherContext };
    }

    // Otherwise auto-fetch from Supabase
    if (state.worldId && state.worldId !== 'manual') {
      try {
        const bible = await fetchWorldBible.invoke({ worldId: state.worldId });
        return { fullBible: bible };
      } catch {
        return { fullBible: '[Could not fetch bible sections.]' };
      }
    }

    return { fullBible: '[No other sections available for comparison.]' };
  }

  async function analyze(state: ArchState): Promise<Partial<ArchState>> {
    try {
      const response = await model.invoke([
        new SystemMessage(ARCHITECT_PROMPT),
        new HumanMessage(
          `I'm editing the "${state.sectionName}" section of a World Bible. Check it against all other sections for consistency.\n\n` +
          `--- SECTION BEING EDITED ---\n${state.sectionContent}\n\n` +
          `--- OTHER SECTIONS ---\n${state.fullBible}`
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

      const parsed = JSON.parse(jsonStr);
      const validated = ArchitectReportSchema.parse(parsed);
      return { report: validated };
    } catch {
      if (state.retryCount < 1) {
        return { retryCount: state.retryCount + 1 };
      }
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

  function shouldRetry(state: ArchState): string {
    if (state.report) return END;
    if (state.retryCount > 0 && !state.report) return 'analyze';
    return END;
  }

  return new StateGraph(WorldArchitectState)
    .addNode('gatherSections', gatherSections)
    .addNode('analyze', analyze)
    .addNode('validateOutput', validateOutput)
    .addEdge(START, 'gatherSections')
    .addEdge('gatherSections', 'analyze')
    .addEdge('analyze', 'validateOutput')
    .addConditionalEdges('validateOutput', shouldRetry)
    .compile();
}
