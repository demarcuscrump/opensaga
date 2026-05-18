/**
 * Mock Chat Model for testing agent workflows
 *
 * Returns predictable JSON responses based on what agent is calling it.
 * No API keys needed, no network calls.
 */

import type { AgentMessage } from '../model-factory';

export class MockChatModel {
  private defaultResponse: string;

  constructor(defaultResponse: string) {
    this.defaultResponse = defaultResponse;
  }

  async invoke(_messages: AgentMessage[]): Promise<{ content: string }> {
    return { content: this.defaultResponse };
  }

  // Required interface methods
  async stream() {
    throw new Error('Stream not implemented in mock');
  }

  get lc_namespace() {
    return ['test', 'mock'];
  }
}

/** Creates a mock that always returns the given JSON object as string */
export function mockModelForResponse(response: object) {
  return new MockChatModel(JSON.stringify(response)) as any;
}

// ─── Pre-built mock responses ──────────────────────────────────────

export const MOCK_CANON_REPORT = {
  score: 85,
  summary: 'Content is largely consistent with the World Bible.',
  consistent: ['Magic system follows established rules', 'Character backstory aligns with timeline'],
  concerns: ['Minor ambiguity in faction loyalty'],
  contradictions: [],
  recommendation: 'APPROVE_WITH_EDITS',
};

export const MOCK_ARCHITECT_REPORT = {
  sectionAnalyzed: 'Geography',
  coherenceScore: 92,
  crossReferences: ['Geography references align with History timeline', 'Faction territories match map'],
  inconsistencies: [],
  suggestions: ['Consider adding climate details for the Northern region'],
};

export const MOCK_DEEPENER_RESULT = {
  backstory: 'Born in the shadow of the Obsidian Spire, they witnessed the fall of the Third Council at age seven.',
  relationships: ['Mentor: Elder Kavik (deceased)', 'Rival: Commander Soren of the Iron Watch'],
  hooks: ['The sealed letter from their mother reveals a connection to the overthrown dynasty'],
  quirks: ['Always taps their left wrist before making a decision', 'Refuses to eat food they haven\'t prepared'],
  worldConnections: 'Their bloodline is tied to the ancient Warden pact, making them a target for the Reformist faction.',
};

export const MOCK_PROPOSAL_ANALYSIS = {
  qualityScore: 78,
  canonFitScore: 91,
  originality: 'Fresh take on faction dynamics with interesting power structure.',
  worldImpact: 'Would add a new military faction to the Northern region, creating tension with existing ones.',
  potentialConflicts: ['May conflict with established Iron Watch territory'],
  voterSummary: 'Well-crafted proposal that respects existing canon. Minor quality concerns around pacing.',
  recommendation: 'YES',
};

export const MOCK_VISION_ANALYSIS = {
  suggestedName: 'Ashenveil',
  archetype: 'Shadow Rogue',
  species: 'Human (Augmented)',
  age: '28-32',
  pronouns: 'she/her',
  appearance: 'Tall and lean with sharp angular features. Pale skin contrasts with dark tattoo-like markings along the jawline.',
  distinguishingFeatures: 'Glowing cyan lines trace from temple to collarbone — cybernetic implants visible beneath translucent skin.',
  attire: 'Fitted black tactical vest over a hooded cloak. Armored gauntlets with embedded blade mechanisms.',
  powers: 'Stealth augmentation suggested by cloaking device on belt. Wrist-mounted energy blade.',
  personality: 'Guarded and calculating — narrow eyes and tense posture suggest constant vigilance.',
  worldHints: 'Cyberpunk or sci-fi noir setting. Megacity backdrop with neon and rain.',
};

/**
 * Per-agent mock model factories.
 * Each returns a model that always outputs the correct mock for that agent.
 */
export const mockCanonKeeper = () => mockModelForResponse(MOCK_CANON_REPORT);
export const mockWorldArchitect = () => mockModelForResponse(MOCK_ARCHITECT_REPORT);
export const mockCharacterDeepener = () => mockModelForResponse(MOCK_DEEPENER_RESULT);
export const mockProposalAnalyst = () => mockModelForResponse(MOCK_PROPOSAL_ANALYSIS);
export const mockVisionAnalyzer = () => mockModelForResponse(MOCK_VISION_ANALYSIS);
