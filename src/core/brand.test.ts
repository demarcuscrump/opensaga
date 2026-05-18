import { describe, expect, it } from 'vitest';
import { OPEN_SAGA_BRAND, getWorldAccent } from './brand';
import { MOCK_WORLDS } from './constants';

describe('OpenSaga brand system', () => {
  it('keeps the archive palette stable', () => {
    expect(OPEN_SAGA_BRAND.core.canonBlack).toBe('#0B0B0D');
    expect(OPEN_SAGA_BRAND.core.archiveWhite).toBe('#FAF9F6');
    expect(OPEN_SAGA_BRAND.accent.canonGold).toBe('#C6A15B');
    expect(OPEN_SAGA_BRAND.loop.proposal).toBe('#6D5DF6');
    expect(OPEN_SAGA_BRAND.loop.vote).toBe('#3B82F6');
    expect(OPEN_SAGA_BRAND.loop.conflict).toBe('#D56A3A');
  });

  it('lets worlds bring their own accent color', () => {
    expect(getWorldAccent(MOCK_WORLDS[0])).toBe(MOCK_WORLDS[0].accentColor);
    expect(getWorldAccent({ id: 'generated', genre: ['Cyberpunk'] })).toBe('#22D3EE');
    expect(getWorldAccent({ id: 'fallback', genre: [] })).toMatch(/^#[0-9A-F]{6}$/i);
  });
});
