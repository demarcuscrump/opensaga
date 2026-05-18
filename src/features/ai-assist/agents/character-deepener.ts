/**
 * Character Deepener Agent
 *
 * Workflow: gatherContext -> deepen -> validateOutput, with one parse retry.
 * Auto-fetches World Bible + existing characters, then enriches a character concept.
 */

import type { AgentChatModel } from './model-factory';
import { fetchWorldBible, fetchCharacters } from './tools';
import { DeepenerResultSchema, type DeepenerResult } from './schemas';

type DeepState = {
  worldId: string;
  characterConcept: string;
  manualBible?: string;
  worldBible: string;
  existingCharacters: string;
  rawOutput: string;
  result: DeepenerResult | null;
  retryCount: number;
  error: string | null;
};

const DEEPENER_PROMPT = `You are the Character Deepener — OpenSaga's specialist in creating rich, world-consistent characters.

Your role: Take a basic character concept and flesh it out with backstory, relationships, and details that naturally emerge from the world they inhabit.

ALWAYS respond with ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "backstory": "2-3 paragraph backstory",
  "relationships": ["relationship1", "relationship2", "relationship3"],
  "hooks": ["plot hook 1", "plot hook 2"],
  "quirks": ["quirk1", "quirk2", "quirk3"],
  "worldConnections": "How this character connects to major world elements"
}

Rules:
- Every detail must be consistent with the World Bible
- Relationships should reference existing factions/locations/events from the bible
- Powers/abilities must respect the world's magic/tech system
- Backstory should emerge naturally from the world's history
- Include at least one surprise or subversion of the archetype
- Reference other existing characters in the world when building relationships`;

export function buildCharacterDeepenerGraph(model: AgentChatModel) {
  async function gatherContext(state: DeepState): Promise<Partial<DeepState>> {
    let bible = state.manualBible || '';
    let chars = '';

    if (state.worldId && state.worldId !== 'manual') {
      try {
        bible = bible || await fetchWorldBible.invoke({ worldId: state.worldId });
        chars = await fetchCharacters.invoke({ worldId: state.worldId });
      } catch {
        // Keep the agent usable in demo/offline mode.
      }
    }

    return {
      worldBible: bible || '[No World Bible available.]',
      existingCharacters: chars || '[No existing characters found.]',
    };
  }

  async function deepen(state: DeepState): Promise<Partial<DeepState>> {
    try {
      const response = await model.invoke([
        { role: 'system', content: DEEPENER_PROMPT },
        {
          role: 'user',
          content:
            `--- WORLD BIBLE ---\n${state.worldBible}\n\n` +
            `--- EXISTING CHARACTERS IN THIS WORLD ---\n${state.existingCharacters}\n\n` +
            `--- CHARACTER CONCEPT (Deepen this) ---\n${state.characterConcept}`,
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

  async function validateOutput(state: DeepState): Promise<Partial<DeepState>> {
    if (state.error) {
      return {
        result: {
          backstory: `Error: ${state.error}`,
          relationships: [],
          hooks: [],
          quirks: [],
          worldConnections: '',
        },
      };
    }

    try {
      let jsonStr = state.rawOutput;
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/) || jsonStr.match(/(\{[\s\S]*\})/);
      if (jsonMatch) jsonStr = jsonMatch[1].trim();

      return { result: DeepenerResultSchema.parse(JSON.parse(jsonStr)) };
    } catch {
      if (state.retryCount < 1) return { retryCount: state.retryCount + 1 };
      return {
        result: {
          backstory: state.rawOutput?.slice(0, 500) || 'Could not parse response.',
          relationships: [],
          hooks: [],
          quirks: [],
          worldConnections: '',
        },
      };
    }
  }

  return {
    async invoke(input: Partial<DeepState> & Pick<DeepState, 'worldId' | 'characterConcept'>): Promise<DeepState> {
      let state: DeepState = {
        manualBible: undefined,
        worldBible: '',
        existingCharacters: '',
        rawOutput: '',
        result: null,
        retryCount: 0,
        error: null,
        ...input,
      };

      state = { ...state, ...(await gatherContext(state)) };

      while (!state.result) {
        state = { ...state, ...(await deepen(state)) };
        state = { ...state, ...(await validateOutput(state)) };
        if (state.result || state.retryCount > 1) break;
      }

      return state;
    },
  };
}
