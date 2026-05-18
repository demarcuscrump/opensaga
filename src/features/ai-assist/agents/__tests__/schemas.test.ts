/**
 * Schema Validation Tests — ensure Zod schemas accept valid and reject invalid data
 */

import { describe, it, expect } from 'vitest';
import {
  CanonReportSchema,
  ArchitectReportSchema,
  DeepenerResultSchema,
  ProposalAnalysisSchema,
} from '../schemas';

describe('CanonReportSchema', () => {
  const valid = {
    score: 85,
    summary: 'Consistent with world bible.',
    consistent: ['Magic system aligns'],
    concerns: [],
    contradictions: [],
    recommendation: 'APPROVE',
  };

  it('accepts valid data', () => {
    expect(() => CanonReportSchema.parse(valid)).not.toThrow();
  });

  it('rejects missing score', () => {
    const { score, ...invalid } = valid;
    expect(() => CanonReportSchema.parse(invalid)).toThrow();
  });

  it('rejects invalid recommendation enum', () => {
    expect(() => CanonReportSchema.parse({ ...valid, recommendation: 'MAYBE' })).toThrow();
  });

  it('rejects score out of range (>100)', () => {
    expect(() => CanonReportSchema.parse({ ...valid, score: 150 })).toThrow();
  });

  it('rejects score out of range (<0)', () => {
    expect(() => CanonReportSchema.parse({ ...valid, score: -5 })).toThrow();
  });

  it('accepts all valid recommendations', () => {
    for (const rec of ['APPROVE', 'APPROVE_WITH_EDITS', 'REJECT']) {
      expect(() => CanonReportSchema.parse({ ...valid, recommendation: rec })).not.toThrow();
    }
  });
});

describe('ArchitectReportSchema', () => {
  const valid = {
    sectionAnalyzed: 'Geography',
    coherenceScore: 90,
    crossReferences: ['Aligns with history'],
    inconsistencies: [],
    suggestions: ['Add climate details'],
  };

  it('accepts valid data', () => {
    expect(() => ArchitectReportSchema.parse(valid)).not.toThrow();
  });

  it('rejects missing sectionAnalyzed', () => {
    const { sectionAnalyzed, ...invalid } = valid;
    expect(() => ArchitectReportSchema.parse(invalid)).toThrow();
  });

  it('rejects coherenceScore > 100', () => {
    expect(() => ArchitectReportSchema.parse({ ...valid, coherenceScore: 101 })).toThrow();
  });

  it('rejects coherenceScore < 0', () => {
    expect(() => ArchitectReportSchema.parse({ ...valid, coherenceScore: -1 })).toThrow();
  });
});

describe('DeepenerResultSchema', () => {
  const valid = {
    backstory: 'Born in the northern wastes...',
    relationships: ['Allied with The Fixer'],
    hooks: ['May discover a hidden lineage'],
    quirks: ['Collects lost coins'],
    worldConnections: 'Ties to the Iron Watch faction.',
  };

  it('accepts valid data', () => {
    expect(() => DeepenerResultSchema.parse(valid)).not.toThrow();
  });

  it('rejects missing backstory', () => {
    const { backstory, ...invalid } = valid;
    expect(() => DeepenerResultSchema.parse(invalid)).toThrow();
  });

  it('rejects non-array relationships', () => {
    expect(() => DeepenerResultSchema.parse({ ...valid, relationships: 'not an array' })).toThrow();
  });

  it('accepts empty arrays', () => {
    expect(() => DeepenerResultSchema.parse({ ...valid, relationships: [], hooks: [], quirks: [] })).not.toThrow();
  });
});

describe('ProposalAnalysisSchema', () => {
  const valid = {
    qualityScore: 80,
    canonFitScore: 90,
    originality: 'Fresh take on faction dynamics.',
    worldImpact: 'Adds tension.',
    potentialConflicts: [],
    voterSummary: 'Well-crafted proposal.',
    recommendation: 'YES',
  };

  it('accepts valid data', () => {
    expect(() => ProposalAnalysisSchema.parse(valid)).not.toThrow();
  });

  it('rejects invalid recommendation enum', () => {
    expect(() => ProposalAnalysisSchema.parse({ ...valid, recommendation: 'MAYBE' })).toThrow();
  });

  it('accepts all valid recommendations', () => {
    for (const rec of ['STRONG_YES', 'YES', 'NEEDS_WORK', 'NO']) {
      expect(() => ProposalAnalysisSchema.parse({ ...valid, recommendation: rec })).not.toThrow();
    }
  });

  it('rejects qualityScore > 100', () => {
    expect(() => ProposalAnalysisSchema.parse({ ...valid, qualityScore: 200 })).toThrow();
  });

  it('rejects missing voterSummary', () => {
    const { voterSummary, ...invalid } = valid;
    expect(() => ProposalAnalysisSchema.parse(invalid)).toThrow();
  });
});
