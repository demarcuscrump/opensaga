/**
 * Vision Analyzer Agent
 *
 * Workflow: analyzeImage -> validateOutput, with one parse retry.
 * Takes an uploaded character image and extracts structured character traits.
 */

import type { AgentChatModel } from './model-factory';
import { z } from 'zod';

export const VisionAnalysisSchema = z.object({
  suggestedName: z.string().describe('Suggested character name based on visual impression'),
  archetype: z.string().describe('Character archetype (e.g. Rogue, Healer, Knight, Trickster)'),
  species: z.string().describe('Species or race (Human, Elf, Cyborg, etc.)'),
  age: z.string().describe('Estimated age or age range'),
  pronouns: z.string().describe('Likely pronouns based on appearance'),
  appearance: z.string().describe('Detailed physical description of what is seen'),
  distinguishingFeatures: z.string().describe('Scars, tattoos, cybernetics, unusual traits, etc.'),
  attire: z.string().describe('Description of clothing, armor, accessories'),
  powers: z.string().describe('Inferred powers or abilities based on visual cues (weapons, auras, tech)'),
  personality: z.string().describe('Inferred personality traits from body language, expression, pose'),
  worldHints: z.string().describe('What kind of world this character might belong to (genre, era, setting)'),
});

export type VisionAnalysis = z.infer<typeof VisionAnalysisSchema>;

type VisionState = {
  imageBase64: string;
  imageMimeType: string;
  rawOutput: string;
  analysis: VisionAnalysis | null;
  retryCount: number;
  error: string | null;
};

const VISION_PROMPT = `You are the Character Vision Analyzer — OpenSaga's specialist in reading character art.

You are looking at an image of a character (concept art, illustration, photo, or AI-generated art). Your job is to extract every observable detail and infer character traits from the visual.

ALWAYS respond with ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "suggestedName": "a creative name that fits the character",
  "archetype": "character archetype",
  "species": "species or race",
  "age": "estimated age",
  "pronouns": "likely pronouns",
  "appearance": "detailed physical description (2-3 sentences)",
  "distinguishingFeatures": "scars, tattoos, cybernetics, unusual features",
  "attire": "clothing, armor, accessories description",
  "powers": "inferred abilities from visual cues (weapons, auras, magical items, tech)",
  "personality": "inferred personality from expression, pose, body language",
  "worldHints": "what kind of setting/world/genre this character fits"
}

Rules:
- Describe ONLY what you can see or reasonably infer from the image
- Be creative but grounded in the visual evidence
- The name should be evocative and match the character's vibe
- If the image is unclear or not a character, still do your best
- Include colors, materials, and textures you observe`;

export function buildVisionAnalyzerGraph(model: AgentChatModel) {
  async function analyzeImage(state: VisionState): Promise<Partial<VisionState>> {
    try {
      const response = await model.invoke([
        { role: 'system', content: VISION_PROMPT },
        {
          role: 'user',
          content: [
            {
              type: 'image_url' as const,
              image_url: {
                url: `data:${state.imageMimeType};base64,${state.imageBase64}`,
                detail: 'high' as const,
              },
            },
            {
              type: 'text' as const,
              text: 'Analyze this character image and extract all observable traits. Return structured JSON only.',
            },
          ],
        },
      ]);

      const content = typeof response.content === 'string'
        ? response.content
        : JSON.stringify(response.content);

      return { rawOutput: content, error: null };
    } catch (err: any) {
      return { error: `Vision call failed: ${err.message}`, rawOutput: '' };
    }
  }

  async function validateOutput(state: VisionState): Promise<Partial<VisionState>> {
    if (state.error) {
      return {
        analysis: {
          suggestedName: '',
          archetype: '',
          species: '',
          age: '',
          pronouns: '',
          appearance: state.error,
          distinguishingFeatures: '',
          attire: '',
          powers: '',
          personality: '',
          worldHints: '',
        },
      };
    }

    try {
      let jsonStr = state.rawOutput;
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/) || jsonStr.match(/(\{[\s\S]*\})/);
      if (jsonMatch) jsonStr = jsonMatch[1].trim();

      return { analysis: VisionAnalysisSchema.parse(JSON.parse(jsonStr)) };
    } catch {
      if (state.retryCount < 1) return { retryCount: state.retryCount + 1 };
      return {
        analysis: {
          suggestedName: '',
          archetype: '',
          species: '',
          age: '',
          pronouns: '',
          appearance: state.rawOutput?.slice(0, 500) || 'Could not parse vision response.',
          distinguishingFeatures: '',
          attire: '',
          powers: '',
          personality: '',
          worldHints: '',
        },
      };
    }
  }

  return {
    async invoke(input: Partial<VisionState> & Pick<VisionState, 'imageBase64' | 'imageMimeType'>): Promise<VisionState> {
      let state: VisionState = {
        rawOutput: '',
        analysis: null,
        retryCount: 0,
        error: null,
        ...input,
      };

      while (!state.analysis) {
        state = { ...state, ...(await analyzeImage(state)) };
        state = { ...state, ...(await validateOutput(state)) };
        if (state.analysis || state.retryCount > 1) break;
      }

      return state;
    },
  };
}
