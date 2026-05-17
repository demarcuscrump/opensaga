import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { MOCK_WORLDS } from '../core/constants';
import type { World } from '../core/types';
import type { Database } from '../lib/database.types';

type WorldRow = Database['public']['Tables']['worlds']['Row'];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Convert Supabase row to app World type
function rowToWorld(row: WorldRow, memberCount?: number): World {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    heroImage: row.hero_image || 'https://picsum.photos/seed/world/800/400',
    genre: row.genre || [],
    status: row.status as World['status'],
    governance: row.governance as World['governance'],
    votingThreshold: row.voting_threshold,
    memberCount: memberCount ?? 0,
    characterCount: 0,
    creatorId: row.creator_id,
  };
}

export const worldsApi = {
  getAll: async (): Promise<World[]> => {
    if (!isSupabaseConfigured) {
      await delay(600);
      return MOCK_WORLDS;
    }

    const { data, error } = await supabase
      .from('worlds')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      // Fallback to mock if no worlds exist yet
      return MOCK_WORLDS;
    }

    return data.map(row => rowToWorld(row));
  },

  getById: async (id: string): Promise<World | undefined> => {
    if (!isSupabaseConfigured) {
      await delay(400);
      return MOCK_WORLDS.find(w => w.id === id);
    }

    const { data, error } = await supabase
      .from('worlds')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return MOCK_WORLDS.find(w => w.id === id);
    }

    // Get member count
    const { count } = await supabase
      .from('memberships')
      .select('*', { count: 'exact', head: true })
      .eq('world_id', id);

    return rowToWorld(data, count ?? 0);
  },

  create: async (world: {
    name: string;
    description: string;
    genre: string[];
    governance: string;
    votingThreshold: number;
    heroImage?: string;
    creatorId: string;
  }): Promise<World | null> => {
    if (!isSupabaseConfigured) return null;

    const { data, error } = await supabase
      .from('worlds')
      .insert({
        name: world.name,
        description: world.description,
        genre: world.genre,
        governance: world.governance as any,
        voting_threshold: world.votingThreshold,
        hero_image: world.heroImage,
        creator_id: world.creatorId,
      })
      .select()
      .single();

    if (error || !data) return null;

    // Auto-join creator as member
    await supabase.from('memberships').insert({
      world_id: data.id,
      user_id: world.creatorId,
      role: 'CREATOR',
    });

    return rowToWorld(data, 1);
  },

  update: async (id: string, updates: {
    name?: string;
    description?: string;
    genre?: string[];
    status?: string;
    governance?: string;
    votingThreshold?: number;
    heroImage?: string;
  }): Promise<boolean> => {
    if (!isSupabaseConfigured) return false;

    const { error } = await supabase
      .from('worlds')
      .update({
        ...(updates.name && { name: updates.name }),
        ...(updates.description && { description: updates.description }),
        ...(updates.genre && { genre: updates.genre }),
        ...(updates.status && { status: updates.status as any }),
        ...(updates.governance && { governance: updates.governance as any }),
        ...(updates.votingThreshold != null && { voting_threshold: updates.votingThreshold }),
        ...(updates.heroImage && { hero_image: updates.heroImage }),
      })
      .eq('id', id);

    return !error;
  },
};
