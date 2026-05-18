/**
 * Vision Analyzer Schema Tests
 */

import { describe, it, expect } from 'vitest';
import { VisionAnalysisSchema } from '../vision-analyzer';

describe('VisionAnalysisSchema', () => {
  const valid = {
    suggestedName: 'Chrome Widow',
    archetype: 'Assassin',
    species: 'Human (Augmented)',
    age: 'Late 20s',
    pronouns: 'she/her',
    appearance: 'Cybernetic arm, silver hair',
    distinguishingFeatures: 'Glowing red eye implant',
    attire: 'Dark tactical suit',
    powers: 'Enhanced reflexes, neural hacking',
    personality: 'Cold, calculating, fiercely loyal to allies',
    worldHints: 'Cyberpunk, near-future dystopia',
  };

  it('accepts valid data', () => {
    expect(() => VisionAnalysisSchema.parse(valid)).not.toThrow();
  });

  it('rejects missing suggestedName', () => {
    const { suggestedName, ...invalid } = valid;
    expect(() => VisionAnalysisSchema.parse(invalid)).toThrow();
  });

  it('rejects missing archetype', () => {
    const { archetype, ...invalid } = valid;
    expect(() => VisionAnalysisSchema.parse(invalid)).toThrow();
  });

  it('rejects missing worldHints', () => {
    const { worldHints, ...invalid } = valid;
    expect(() => VisionAnalysisSchema.parse(invalid)).toThrow();
  });

  it('rejects non-string fields', () => {
    expect(() => VisionAnalysisSchema.parse({ ...valid, age: 42 })).toThrow();
  });

  it('accepts empty string values', () => {
    expect(() => VisionAnalysisSchema.parse({ ...valid, powers: '', personality: '' })).not.toThrow();
  });
});
