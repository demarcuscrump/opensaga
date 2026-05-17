import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { MOCK_CHARACTERS } from '../core/constants';
import type { Character, ContentStatus } from '../core/types';
import type { Database, Json } from '../lib/database.types';

type EntityRow = Database['public']['Tables']['entities']['Row'];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Convert entity row to Character
function entityToCharacter(row: EntityRow): Character {
  const d = row.data as Record<string, any>;
  return {
    id: row.id,
    name: d.name || 'Unnamed',
    description: d.description || '',
    imageUrl: d.imageUrl || 'https://picsum.photos/seed/char/400/500',
    archetype: d.archetype || 'Unknown',
    powers: d.powers || [],
    worldId: row.world_id,
    status: row.status as ContentStatus,
    authorId: row.author_id,
    votes: { up: d.votesUp ?? 0, down: d.votesDown ?? 0 },
    createdAt: row.created_at,
  };
}

export const charactersApi = {
  getByWorld: async (worldId: string): Promise<Character[]> => {
    if (!isSupabaseConfigured) {
      await delay(800);
      return MOCK_CHARACTERS.filter(c => c.worldId === worldId);
    }

    const { data, error } = await supabase
      .from('entities')
      .select('*')
      .eq('world_id', worldId)
      .eq('type', 'CHARACTER')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return MOCK_CHARACTERS.filter(c => c.worldId === worldId);
    }

    return data.map(entityToCharacter);
  },

  getTrending: async (): Promise<Character[]> => {
    if (!isSupabaseConfigured) {
      await delay(1000);
      return MOCK_CHARACTERS;
    }

    const { data, error } = await supabase
      .from('entities')
      .select('*')
      .eq('type', 'CHARACTER')
      .in('status', ['CANON', 'PROPOSAL'])
      .order('created_at', { ascending: false })
      .limit(20);

    if (error || !data || data.length === 0) {
      return MOCK_CHARACTERS;
    }

    return data.map(entityToCharacter);
  },

  create: async (character: {
    worldId: string;
    authorId: string;
    name: string;
    description: string;
    archetype: string;
    powers?: string[];
    imageUrl?: string;
  }): Promise<Character | null> => {
    if (!isSupabaseConfigured) return null;

    const { data, error } = await supabase
      .from('entities')
      .insert({
        world_id: character.worldId,
        author_id: character.authorId,
        type: 'CHARACTER',
        status: 'DRAFT',
        data: {
          name: character.name,
          description: character.description,
          archetype: character.archetype,
          powers: character.powers || [],
          imageUrl: character.imageUrl || '',
          votesUp: 0,
          votesDown: 0,
        } as unknown as Json,
      })
      .select()
      .single();

    if (error || !data) return null;
    return entityToCharacter(data);
  },

  submitAsProposal: async (entityId: string, justification: string): Promise<boolean> => {
    if (!isSupabaseConfigured) return false;

    const votingEndsAt = new Date();
    votingEndsAt.setDate(votingEndsAt.getDate() + 7); // 7-day voting period

    const { error } = await supabase
      .from('entities')
      .update({
        status: 'PROPOSAL',
        justification,
        voting_ends_at: votingEndsAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', entityId);

    return !error;
  },
};

// Legacy exports for backward compatibility
export const fetchCharactersByWorld = charactersApi.getByWorld;
export const fetchTrendingCharacters = charactersApi.getTrending;
