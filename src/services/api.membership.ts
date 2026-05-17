import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { activityApi } from './api.activity';

export interface WorldMember {
  userId: string;
  role: string;
  joinedAt: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string | null;
  reputation?: number;
}

export const membershipApi = {
  /** Join a world */
  join: async (worldId: string, userId: string): Promise<boolean> => {
    if (!isSupabaseConfigured) return false;

    const { error } = await supabase.from('memberships').insert({
      world_id: worldId,
      user_id: userId,
      role: 'CITIZEN',
    });

    if (error) return false;

    // Log activity
    await activityApi.log({
      worldId,
      userId,
      action: 'MEMBER_JOINED',
    });

    return true;
  },

  /** Leave a world */
  leave: async (worldId: string, userId: string): Promise<boolean> => {
    if (!isSupabaseConfigured) return false;

    const { error } = await supabase
      .from('memberships')
      .delete()
      .eq('world_id', worldId)
      .eq('user_id', userId);

    if (error) return false;

    await activityApi.log({
      worldId,
      userId,
      action: 'MEMBER_LEFT',
    });

    return true;
  },

  /** Check if a user is a member of a world */
  isMember: async (worldId: string, userId: string): Promise<boolean> => {
    if (!isSupabaseConfigured) return false;

    const { data } = await supabase
      .from('memberships')
      .select('user_id')
      .eq('world_id', worldId)
      .eq('user_id', userId)
      .single();

    return Boolean(data);
  },

  /** Get all members of a world */
  getMembers: async (worldId: string): Promise<WorldMember[]> => {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase
      .from('memberships')
      .select(`
        user_id,
        role,
        joined_at,
        profiles:user_id ( username, display_name, avatar_url, reputation )
      `)
      .eq('world_id', worldId)
      .order('joined_at', { ascending: true });

    if (error || !data) return [];

    return data.map(row => ({
      userId: row.user_id,
      role: row.role,
      joinedAt: row.joined_at,
      username: (row.profiles as any)?.username,
      displayName: (row.profiles as any)?.display_name,
      avatarUrl: (row.profiles as any)?.avatar_url,
      reputation: (row.profiles as any)?.reputation,
    }));
  },

  /** Get member count for a world */
  getCount: async (worldId: string): Promise<number> => {
    if (!isSupabaseConfigured) return 0;

    const { count } = await supabase
      .from('memberships')
      .select('*', { count: 'exact', head: true })
      .eq('world_id', worldId);

    return count ?? 0;
  },

  /** Get all worlds a user has joined */
  getUserWorlds: async (userId: string): Promise<string[]> => {
    if (!isSupabaseConfigured) return [];

    const { data } = await supabase
      .from('memberships')
      .select('world_id')
      .eq('user_id', userId);

    return data?.map(r => r.world_id) ?? [];
  },

  /** Promote a member's role (for Lorekeeper Council governance) */
  setRole: async (worldId: string, userId: string, role: string): Promise<boolean> => {
    if (!isSupabaseConfigured) return false;

    const { error } = await supabase
      .from('memberships')
      .update({ role })
      .eq('world_id', worldId)
      .eq('user_id', userId);

    return !error;
  },
};
