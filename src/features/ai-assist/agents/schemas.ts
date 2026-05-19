/**
 * Agent Output Schemas — Zod-validated structured output for all agents
 *
 * Per CREATOR_STUDIO_PRD.md §Structured Output:
 * "AI responses are always parsed into structured data, never raw text dumps.
 *  Use Zod schemas to validate."
 */

import { z } from 'zod';

// ─── Canon Keeper ───────────────────────────────────────────────────

export const CanonReportSchema = z.object({
  score: z.number().min(0).max(100).describe('Compatibility score from 0-100'),
  consistent: z.array(z.string()).describe('Items that align with the World Bible'),
  concerns: z.array(z.string()).describe('Minor issues with suggested fixes'),
  contradictions: z.array(z.string()).describe('Clear violations of the World Bible'),
  recommendation: z.enum(['APPROVE', 'APPROVE_WITH_EDITS', 'REJECT']).describe('Final recommendation'),
  summary: z.string().describe('Brief overall assessment (2-3 sentences)'),
});

export type CanonReport = z.infer<typeof CanonReportSchema>;

// ─── World Architect ────────────────────────────────────────────────

export const ArchitectReportSchema = z.object({
  sectionAnalyzed: z.string().describe('Name of the bible section that was analyzed'),
  crossReferences: z.array(z.string()).describe('Other sections this affects, with relevant details'),
  inconsistencies: z.array(z.string()).describe('Inconsistencies found across sections'),
  suggestions: z.array(z.string()).describe('Suggestions to fix inconsistencies or strengthen the world'),
  coherenceScore: z.number().min(0).max(100).describe('Overall coherence score from 0-100'),
});

export type ArchitectReport = z.infer<typeof ArchitectReportSchema>;

// ─── Character Deepener ─────────────────────────────────────────────

export const DeepenerResultSchema = z.object({
  backstory: z.string().describe('2-3 paragraph enriched backstory'),
  relationships: z.array(z.string()).describe('Key relationships with world elements'),
  hooks: z.array(z.string()).describe('Plot hooks this character enables'),
  quirks: z.array(z.string()).describe('Distinctive behavioral traits'),
  worldConnections: z.string().describe('How this character connects to major world elements'),
});

export type DeepenerResult = z.infer<typeof DeepenerResultSchema>;

// ─── Proposal Analyst ───────────────────────────────────────────────

export const ProposalAnalysisSchema = z.object({
  qualityScore: z.number().min(0).max(100).describe('Writing quality and depth score'),
  canonFitScore: z.number().min(0).max(100).describe('Alignment with World Bible score'),
  originality: z.string().describe('Assessment of originality and freshness'),
  worldImpact: z.string().describe('How this changes the world if canonized'),
  potentialConflicts: z.array(z.string()).describe('Potential conflicts with existing canon'),
  voterSummary: z.string().describe('2-3 sentence plain-language summary for voters'),
  recommendation: z.enum(['STRONG_YES', 'YES', 'NEEDS_WORK', 'NO']).describe('Overall recommendation'),
});

export type ProposalAnalysis = z.infer<typeof ProposalAnalysisSchema>;

// ─── Creation DNA ───────────────────────────────────────────────────

export const CREATION_DNA_GENRES = [
  'Grounded Combat / Martial Realism',
  'Sports / Competitive Team Drama',
  'Superpowered Battle',
  'Epic Adventure / World-Saga',
  'Dark Fantasy / Horror',
  'Cyberpunk / Tech-Noir',
  'Psychological / Cerebral Thriller',
  'Stylish Action',
  'Slice-of-Life With a Twist',
  'Historical / Period Brutality',
  'Surreal Weird Fiction',
  'Sci-Fi Western / Space Frontier',
  'Creature / Companion Adventure',
] as const;

export type CreationDnaGenre = typeof CREATION_DNA_GENRES[number];

export const CREATION_DNA_GENRE_GUIDE: ReadonlyArray<{
  tag: CreationDnaGenre;
  description: string;
  anchors: readonly string[];
}> = [
  {
    tag: 'Grounded Combat / Martial Realism',
    description: 'Technique, training, physical consequence, and tactical fighting carry the drama more than supernatural spectacle.',
    anchors: ['Baki', 'Kengan Ashura', 'Hajime no Ippo', 'The Fable'],
  },
  {
    tag: 'Sports / Competitive Team Drama',
    description: 'Training arcs, rivalries, tournament pressure, team chemistry, discipline, and talent-versus-work stakes drive the story.',
    anchors: ['Haikyuu!!', 'Blue Lock', 'Kuroko\'s Basketball', 'Run with the Wind'],
  },
  {
    tag: 'Superpowered Battle',
    description: 'Defined abilities, rivals, counters, tournaments, and escalating fights create the core engine.',
    anchors: ['Jujutsu Kaisen', 'My Hero Academia', 'Dragon Ball Super', 'Naruto'],
  },
  {
    tag: 'Epic Adventure / World-Saga',
    description: 'A wide journey through factions, history, cultures, and locations where the world grows alongside the cast.',
    anchors: ['One Piece', 'Fullmetal Alchemist', 'Hunter x Hunter'],
  },
  {
    tag: 'Dark Fantasy / Horror',
    description: 'Demons, curses, body horror, moral dread, and brutal costs make the world feel dangerous and unforgiving.',
    anchors: ['Berserk', 'Chainsaw Man', 'Demon Slayer', 'Attack on Titan'],
  },
  {
    tag: 'Cyberpunk / Tech-Noir',
    description: 'Near-future or futuristic systems where surveillance, augmentation, corporate power, and identity collide.',
    anchors: ['Ghost in the Shell', 'Akira', 'Cyberpunk: Edgerunners', 'Psycho-Pass'],
  },
  {
    tag: 'Psychological / Cerebral Thriller',
    description: 'Mind games, strategy, moral pressure, paranoia, and tension matter more than raw action.',
    anchors: ['Death Note', 'Monster', 'Code Geass', 'The Fable'],
  },
  {
    tag: 'Stylish Action',
    description: 'Cool-factor, rhythm, swagger, choreography, and soundtrack energy define the experience.',
    anchors: ['Samurai Champloo', 'Cowboy Bebop', 'Ninja Kamui', 'Cyberpunk: Edgerunners'],
  },
  {
    tag: 'Slice-of-Life With a Twist',
    description: 'Everyday routines, family, school, work, or domestic comedy are wrapped around a strange hidden premise.',
    anchors: ['Spy x Family', 'Mob Psycho 100'],
  },
  {
    tag: 'Historical / Period Brutality',
    description: 'A real or invented past shapes the violence, politics, survival rules, and redemption arcs.',
    anchors: ['Vinland Saga', 'Samurai Champloo', 'Golden Kamuy'],
  },
  {
    tag: 'Surreal Weird Fiction',
    description: 'Bizarre rules, grotesque humor, dream logic, and strange societies are the point rather than decoration.',
    anchors: ['Dorohedoro', 'Mob Psycho 100', 'FLCL'],
  },
  {
    tag: 'Sci-Fi Western / Space Frontier',
    description: 'Frontier towns, bounty work, wandering crews, outlaws, and lonely technology give sci-fi a western spine.',
    anchors: ['Trigun Stampede', 'Cowboy Bebop', 'Outlaw Star'],
  },
  {
    tag: 'Creature / Companion Adventure',
    description: 'Creatures, partners, teams, training, bonding, and discovery create the heart of the journey.',
    anchors: ['Pokemon', 'Digimon'],
  },
];

export const CREATION_DNA_EMOTIONS = [
  'Revenge',
  'Redemption',
  'Ambition',
  'Found Family',
  'Isolation/Identity',
  'Survival',
  'Legacy',
  'Freedom vs System',
  'Love',
  'Grief',
] as const;

export const CREATION_DNA_SCALES = [
  'Personal',
  'Street-level',
  'City/Regional',
  'National/Continental',
  'World/Cosmic',
] as const;

export const CREATION_DNA_POWERS = [
  'Pure Skill',
  'Defined System',
  'Mystical/Spiritual',
  'Tech-driven',
  'Hybrid',
  'None',
] as const;

export const CREATION_DNA_VIBES = [
  'Gritty',
  'Sleek/Neon',
  'Stylish',
  'Brutal',
  'Mythic',
  'Cozy',
  'Surreal',
  'Retro',
  'Minimalist',
  'Chaotic',
] as const;

export const CreationDnaSimilarSchema = z.object({
  name: z.string().describe('Vault entry name or idea title'),
  score: z.number().min(0).max(1).describe('0-1 similarity score where 1 is closest'),
  pitch: z.string().optional().describe('Saved one-line pitch when available'),
});

export const CreationDnaReportSchema = z.object({
  idea: z.string().min(1).describe('Original idea being analyzed'),
  genre: z.array(z.enum(CREATION_DNA_GENRES)).min(1).max(2).describe('Primary genre tags'),
  emotion: z.array(z.enum(CREATION_DNA_EMOTIONS)).min(1).max(2).describe('Primary emotional engine tags'),
  scale: z.enum(CREATION_DNA_SCALES).describe('Narrative scope'),
  power: z.enum(CREATION_DNA_POWERS).describe('Power or capability logic'),
  vibe: z.array(z.enum(CREATION_DNA_VIBES)).min(1).max(3).describe('Surface tone and texture tags'),
  anchors: z.array(z.string()).min(1).max(3).describe('Comparable anime, comics, or media anchors'),
  similar: z.array(CreationDnaSimilarSchema).default([]).describe('Closest saved DNA cards'),
  comboStatus: z.enum(['UNTESTED', 'UNIQUE', 'RARE', 'NEAR_MATCH']).default('UNTESTED'),
  comboNotes: z.string().describe('Plain-language originality note'),
  differentiators: z.array(z.string()).max(3).describe('Ways to sharpen or differentiate the idea'),
  pitch: z.string().min(1).describe('Punchy one-line pitch'),
});

export type CreationDnaReport = z.infer<typeof CreationDnaReportSchema>;
export type CreationDnaSimilar = z.infer<typeof CreationDnaSimilarSchema>;

// ─── Character Board Framework ──────────────────────────────────────

export const CHARACTER_BOARD_SECTIONS = [
  {
    id: 'coreIdentity',
    label: 'Core Identity',
    description: 'Name, aliases, age, pronouns, species, role, titles, and quick identifying facts.',
  },
  {
    id: 'physicalAppearance',
    label: 'Physical Appearance',
    description: 'Body, hair, eyes, skin tone, wardrobe, distinguishing marks, and reference image cues.',
  },
  {
    id: 'personality',
    label: 'Personality',
    description: 'Core traits, strengths, flaws, quirks, likes, dislikes, fears, and insecurities.',
  },
  {
    id: 'background',
    label: 'Background / Backstory',
    description: 'Birthplace, upbringing, family, education, training, trauma, and key life events.',
  },
  {
    id: 'motivation',
    label: 'Goals & Motivation',
    description: 'Short-term goals, long-term dreams, internal conflict, and external pressure.',
  },
  {
    id: 'skills',
    label: 'Skills, Powers & Limits',
    description: 'Talents, specialties, power rules, weapons, equipment, weaknesses, and costs.',
  },
  {
    id: 'relationships',
    label: 'Relationships',
    description: 'Friends, rivals, love interests, enemies, mentors, family, and story ties.',
  },
  {
    id: 'voiceStyle',
    label: 'Voice & Style',
    description: 'Speech pattern, accent, favorite phrases, rhythm, theme song, and aesthetic feel.',
  },
  {
    id: 'visualMotifs',
    label: 'Visual Motifs / Moodboard',
    description: 'Colors, symbols, shapes, textures, repeated imagery, and art-direction notes.',
  },
  {
    id: 'storyRole',
    label: 'Story Role & Arc',
    description: 'Archetype, plot function, transformation arc, symbolism, and themes represented.',
  },
  {
    id: 'canonNotes',
    label: 'Canon / Creator Notes',
    description: 'Draft status, proposal readiness, creator intent, boundaries, and things not to change.',
  },
] as const;

export type CharacterBoardSectionId = typeof CHARACTER_BOARD_SECTIONS[number]['id'];

// ─── Agent State Schemas ────────────────────────────────────────────

export const AgentContextSchema = z.object({
  worldId: z.string().describe('The world this agent operates within'),
  worldBible: z.string().optional().describe('Full World Bible text (auto-fetched)'),
  existingCanon: z.string().optional().describe('Summary of existing canon entities'),
  characterList: z.string().optional().describe('List of existing characters in the world'),
});

export type AgentContext = z.infer<typeof AgentContextSchema>;
