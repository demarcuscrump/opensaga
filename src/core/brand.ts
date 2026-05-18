import type { World } from './types';

export const OPEN_SAGA_BRAND = {
  core: {
    canonBlack: '#0B0B0D',
    archiveWhite: '#FAF9F6',
    softParchment: '#F3EFE7',
    mistGrey: '#DCD8D0',
    scribeGrey: '#6E6A63',
  },
  accent: {
    canonGold: '#C6A15B',
  },
  loop: {
    proposal: '#6D5DF6',
    vote: '#3B82F6',
    canon: '#C6A15B',
    archived: '#9A948C',
    conflict: '#D56A3A',
  },
} as const;

const WORLD_ACCENT_FALLBACKS = [
  '#7C3AED',
  '#0EA5E9',
  '#0F766E',
  '#B45309',
  '#BE123C',
  '#4D7C0F',
  '#D946EF',
  '#0891B2',
] as const;

const GENRE_ACCENTS: Record<string, string> = {
  anime: '#6D5DF6',
  cyberpunk: '#22D3EE',
  fantasy: '#8B5CF6',
  horror: '#B91C1C',
  'dark academia': '#7C2D12',
  'urban fantasy': '#D946EF',
  steampunk: '#B45309',
  solarpunk: '#4D7C0F',
  'hard sci-fi': '#3B82F6',
  'post-apocalyptic': '#D56A3A',
};

function isHexColor(value: string | undefined): value is string {
  return Boolean(value && /^#[0-9a-f]{6}$/i.test(value));
}

function hashString(value: string): number {
  return [...value].reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

export function getWorldAccent(world: Pick<World, 'id' | 'genre' | 'accentColor'>): string {
  if (isHexColor(world.accentColor)) return world.accentColor;

  const matchedGenre = world.genre
    .map(genre => GENRE_ACCENTS[genre.toLowerCase()])
    .find(isHexColor);

  if (matchedGenre) return matchedGenre;

  return WORLD_ACCENT_FALLBACKS[hashString(world.id) % WORLD_ACCENT_FALLBACKS.length];
}
