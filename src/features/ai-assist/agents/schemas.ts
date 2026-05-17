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

// ─── Agent State Schemas ────────────────────────────────────────────

export const AgentContextSchema = z.object({
  worldId: z.string().describe('The world this agent operates within'),
  worldBible: z.string().optional().describe('Full World Bible text (auto-fetched)'),
  existingCanon: z.string().optional().describe('Summary of existing canon entities'),
  characterList: z.string().optional().describe('List of existing characters in the world'),
});

export type AgentContext = z.infer<typeof AgentContextSchema>;
