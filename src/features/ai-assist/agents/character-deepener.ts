/**
 * Character Deepener Agent — LangGraph StateGraph
 *
 * Graph: START → gatherContext → deepen → validateOutput → canonCheck → END
 *                                   ↑           ↓
 *                                   └── retry (max 1)
 *
 * Auto-fetches World Bible + existing characters, then enriches a
 * character concept. Optionally chains to Canon Keeper for validation.
 */

import {
  StateGraph,
  START,
  END,
  Annotation,
} from '@langchain/langgraph';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { fetchWorldBible, fetchCharacters } from './tools';
import { DeepenerResultSchema, type DeepenerResult } from './schemas';

// ─── State ──────────────────────────────────────────────────────────

const CharacterDeepenerState = Annotation.Root({
  worldId: Annotation<string>,
  characterConcept: Annotation<string>,
  manualBible: Annotation<string | undefined>,
  worldBible: Annotation<string>,
  existingCharacters: Annotation<string>,
  rawOutput: Annotation<string>,
  result: Annotation<DeepenerResult | null>,
  retryCount: Annotation<number>,
  error: Annotation<string | null>,
});

type DeepState = typeof CharacterDeepenerState.State;

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

// ─── Graph Builder ──────────────────────────────────────────────────

export function buildCharacterDeepenerGraph(model: BaseChatModel) {
  async function gatherContext(state: DeepState): Promise<Partial<DeepState>> {
    let bible = state.manualBible || '';
    let chars = '';

    if (state.worldId && state.worldId !== 'manual') {
      try {
        bible = bible || await fetchWorldBible.invoke({ worldId: state.worldId });
        chars = await fetchCharacters.invoke({ worldId: state.worldId });
      } catch {
        // Proceed with what we have
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
        new SystemMessage(DEEPENER_PROMPT),
        new HumanMessage(
          `--- WORLD BIBLE ---\n${state.worldBible}\n\n` +
          `--- EXISTING CHARACTERS IN THIS WORLD ---\n${state.existingCharacters}\n\n` +
          `--- CHARACTER CONCEPT (Deepen this) ---\n${state.characterConcept}`
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

      const parsed = JSON.parse(jsonStr);
      const validated = DeepenerResultSchema.parse(parsed);
      return { result: validated };
    } catch {
      if (state.retryCount < 1) {
        return { retryCount: state.retryCount + 1 };
      }
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

  function shouldRetry(state: DeepState): string {
    if (state.result) return END;
    if (state.retryCount > 0 && !state.result) return 'deepen';
    return END;
  }

  return new StateGraph(CharacterDeepenerState)
    .addNode('gatherContext', gatherContext)
    .addNode('deepen', deepen)
    .addNode('validateOutput', validateOutput)
    .addEdge(START, 'gatherContext')
    .addEdge('gatherContext', 'deepen')
    .addEdge('deepen', 'validateOutput')
    .addConditionalEdges('validateOutput', shouldRetry)
    .compile();
}
