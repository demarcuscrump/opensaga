import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface ActivityEvent {
  id: string;
  worldId: string | null;
  userId: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  metadata: Record<string, any>;
  createdAt: string;
  // Joined fields
  username?: string;
  displayName?: string;
  avatarUrl?: string | null;
  worldName?: string;
}

// Human-readable action labels
const ACTION_LABELS: Record<string, string> = {
  WORLD_CREATED: 'forged a new world',
  ENTITY_CREATED: 'created a new',
  ENTITY_SUBMITTED: 'submitted a proposal for',
  ENTITY_CANONIZED: 'was canonized:',
  ENTITY_REJECTED: 'proposal was rejected:',
  CREATOR_APPROVED_ENTITY: 'approved',
  CREATOR_REJECTED_ENTITY: 'rejected',
  VOTE_CAST: 'voted on',
  MEMBER_JOINED: 'joined',
  MEMBER_LEFT: 'left',
};

export function getActionLabel(action: string): string {
  return ACTION_LABELS[action] || action.toLowerCase().replace(/_/g, ' ');
}

export const activityApi = {
  /** Log an activity event */
  log: async (event: {
    worldId?: string;
    userId: string;
    action: string;
    targetType?: string;
    targetId?: string;
    metadata?: Record<string, any>;
  }): Promise<boolean> => {
    if (!isSupabaseConfigured) return false;

    const { error } = await supabase.from('activity').insert({
      world_id: event.worldId || null,
      user_id: event.userId,
      action: event.action,
      target_type: event.targetType || null,
      target_id: event.targetId || null,
      metadata: event.metadata || {},
    });

    return !error;
  },

  /** Get activity feed for a specific world */
  getByWorld: async (worldId: string, limit = 30): Promise<ActivityEvent[]> => {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase
      .from('activity')
      .select(`
        *,
        profiles:user_id ( username, display_name, avatar_url ),
        worlds:world_id ( name )
      `)
      .eq('world_id', worldId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) return [];

    return data.map(row => ({
      id: row.id,
      worldId: row.world_id,
      userId: row.user_id,
      action: row.action,
      targetType: row.target_type,
      targetId: row.target_id,
      metadata: (row.metadata as Record<string, any>) || {},
      createdAt: row.created_at,
      username: (row.profiles as any)?.username,
      displayName: (row.profiles as any)?.display_name,
      avatarUrl: (row.profiles as any)?.avatar_url,
      worldName: (row.worlds as any)?.name,
    }));
  },

  /** Get global activity feed (across all worlds) */
  getGlobal: async (limit = 50): Promise<ActivityEvent[]> => {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase
      .from('activity')
      .select(`
        *,
        profiles:user_id ( username, display_name, avatar_url ),
        worlds:world_id ( name )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) return [];

    return data.map(row => ({
      id: row.id,
      worldId: row.world_id,
      userId: row.user_id,
      action: row.action,
      targetType: row.target_type,
      targetId: row.target_id,
      metadata: (row.metadata as Record<string, any>) || {},
      createdAt: row.created_at,
      username: (row.profiles as any)?.username,
      displayName: (row.profiles as any)?.display_name,
      avatarUrl: (row.profiles as any)?.avatar_url,
      worldName: (row.worlds as any)?.name,
    }));
  },

  /** Get activity for a specific user */
  getByUser: async (userId: string, limit = 30): Promise<ActivityEvent[]> => {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase
      .from('activity')
      .select(`
        *,
        profiles:user_id ( username, display_name, avatar_url ),
        worlds:world_id ( name )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) return [];

    return data.map(row => ({
      id: row.id,
      worldId: row.world_id,
      userId: row.user_id,
      action: row.action,
      targetType: row.target_type,
      targetId: row.target_id,
      metadata: (row.metadata as Record<string, any>) || {},
      createdAt: row.created_at,
      username: (row.profiles as any)?.username,
      displayName: (row.profiles as any)?.display_name,
      avatarUrl: (row.profiles as any)?.avatar_url,
      worldName: (row.worlds as any)?.name,
    }));
  },
};
