/**
 * Creation DNA Agent
 *
 * Workflow: analyze -> validateOutput, with one parse retry.
 * Classifies a raw idea into a controlled creative DNA card. Originality
 * comparison happens in the Creator Studio vault so creators can review it.
 */

import type { AgentChatModel } from './model-factory';
import {
  CREATION_DNA_EMOTIONS,
  CREATION_DNA_GENRES,
  CREATION_DNA_POWERS,
  CREATION_DNA_SCALES,
  CREATION_DNA_VIBES,
  CreationDnaReportSchema,
  type CreationDnaReport,
} from './schemas';

type CreationDnaState = {
  idea: string;
  rawOutput: string;
  report: CreationDnaReport | null;
  retryCount: number;
  error: string | null;
};

const CREATION_DNA_PROMPT = `You are the Creation DNA Analyst — OpenSaga's originality lens for characters, worlds, and story concepts.

Your role: Break a creator's raw idea into controlled DNA tags, comparable anchors, and concrete ways to make the idea feel more personal and less generic.

ALWAYS respond with ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "idea": "the original idea, lightly cleaned up",
  "genre": ["one or two tags"],
  "emotion": ["one or two tags"],
  "scale": "one tag",
  "power": "one tag",
  "vibe": ["one to three tags"],
  "anchors": ["anchor 1", "anchor 2", "anchor 3"],
  "similar": [],
  "comboStatus": "UNTESTED",
  "comboNotes": "short note about what feels fresh or familiar",
  "differentiators": ["specific twist 1", "specific twist 2", "specific twist 3"],
  "pitch": "one punchy sentence"
}

Controlled vocab only:
- genre: ${CREATION_DNA_GENRES.join(', ')}
- emotion: ${CREATION_DNA_EMOTIONS.join(', ')}
- scale: ${CREATION_DNA_SCALES.join(', ')}
- power: ${CREATION_DNA_POWERS.join(', ')}
- vibe: ${CREATION_DNA_VIBES.join(', ')}

Rules:
- Do not invent tags outside the vocab
- Pick tags that reveal the engine of the idea, not just surface aesthetics
- Anchors can include anime, manga, comics, games, or films, but never imply copying
- Differentiators must be concrete creator choices, not vague advice
- Keep the pitch vivid, original, and one sentence`;

function fallbackReport(state: CreationDnaState, reason: string): CreationDnaReport {
  return {
    idea: state.idea,
    genre: ['Epic Adventure'],
    emotion: ['Ambition'],
    scale: 'Personal',
    power: 'None',
    vibe: ['Stylish'],
    anchors: ['Original creator reference'],
    similar: [],
    comboStatus: 'UNTESTED',
    comboNotes: reason,
    differentiators: [
      'Clarify the main emotional wound before expanding the world.',
      'Define one rule the story refuses to break.',
      'Add a personal contradiction that only this creator would choose.',
    ],
    pitch: state.idea.slice(0, 160) || 'A new OpenSaga concept ready for human review.',
  };
}

export function buildCreationDnaGraph(model: AgentChatModel) {
  async function analyze(state: CreationDnaState): Promise<Partial<CreationDnaState>> {
    try {
      const response = await model.invoke([
        { role: 'system', content: CREATION_DNA_PROMPT },
        {
          role: 'user',
          content: `--- CREATOR IDEA ---\n${state.idea}`,
        },
      ]);

      const content = typeof response.content === 'string'
        ? response.content
        : JSON.stringify(response.content);

      return { rawOutput: content, error: null };
    } catch (err: any) {
      return { error: `Creation DNA call failed: ${err.message}`, rawOutput: '' };
    }
  }

  async function validateOutput(state: CreationDnaState): Promise<Partial<CreationDnaState>> {
    if (state.error) {
      return { report: fallbackReport(state, state.error) };
    }

    try {
      let jsonStr = state.rawOutput;
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/) || jsonStr.match(/(\{[\s\S]*\})/);
      if (jsonMatch) jsonStr = jsonMatch[1].trim();

      return { report: CreationDnaReportSchema.parse(JSON.parse(jsonStr)) };
    } catch {
      if (state.retryCount < 1) return { retryCount: state.retryCount + 1 };
      return {
        report: fallbackReport(
          state,
          state.rawOutput?.slice(0, 220) || 'Could not parse structured Creation DNA output.'
        ),
      };
    }
  }

  return {
    async invoke(input: Partial<CreationDnaState> & Pick<CreationDnaState, 'idea'>): Promise<CreationDnaState> {
      let state: CreationDnaState = {
        rawOutput: '',
        report: null,
        retryCount: 0,
        error: null,
        ...input,
      };

      while (!state.report) {
        state = { ...state, ...(await analyze(state)) };
        state = { ...state, ...(await validateOutput(state)) };
        if (state.report || state.retryCount > 1) break;
      }

      return state;
    },
  };
}
