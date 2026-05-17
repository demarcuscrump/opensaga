import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface VoteTally {
  entityId: string;
  up: number;
  down: number;
  total: number;
  percentage: number; // approval % (0-100)
  userVote: 'UP' | 'DOWN' | null;
}

export const votesApi = {
  /** Cast or change a vote on an entity */
  cast: async (entityId: string, userId: string, voteType: 'UP' | 'DOWN'): Promise<boolean> => {
    if (!isSupabaseConfigured) return false;

    // Upsert: insert or update if user already voted
    const { error } = await supabase
      .from('votes')
      .upsert(
        { entity_id: entityId, user_id: userId, vote_type: voteType },
        { onConflict: 'entity_id,user_id' }
      );

    return !error;
  },

  /** Remove a vote */
  remove: async (entityId: string, userId: string): Promise<boolean> => {
    if (!isSupabaseConfigured) return false;

    const { error } = await supabase
      .from('votes')
      .delete()
      .eq('entity_id', entityId)
      .eq('user_id', userId);

    return !error;
  },

  /** Get tally for a single entity */
  getTally: async (entityId: string, userId?: string): Promise<VoteTally> => {
    const empty: VoteTally = { entityId, up: 0, down: 0, total: 0, percentage: 0, userVote: null };
    if (!isSupabaseConfigured) return empty;

    const { data: votes, error } = await supabase
      .from('votes')
      .select('vote_type, user_id')
      .eq('entity_id', entityId);

    if (error || !votes) return empty;

    const up = votes.filter(v => v.vote_type === 'UP').length;
    const down = votes.filter(v => v.vote_type === 'DOWN').length;
    const total = up + down;
    const percentage = total > 0 ? Math.round((up / total) * 100) : 0;
    const userVote = userId
      ? (votes.find(v => v.user_id === userId)?.vote_type as 'UP' | 'DOWN' | undefined) ?? null
      : null;

    return { entityId, up, down, total, percentage, userVote };
  },

  /** Get tallies for multiple entities at once */
  getTallies: async (entityIds: string[], userId?: string): Promise<VoteTally[]> => {
    if (!isSupabaseConfigured || entityIds.length === 0) return [];

    const { data: votes, error } = await supabase
      .from('votes')
      .select('entity_id, vote_type, user_id')
      .in('entity_id', entityIds);

    if (error || !votes) return entityIds.map(id => ({
      entityId: id, up: 0, down: 0, total: 0, percentage: 0, userVote: null,
    }));

    return entityIds.map(id => {
      const entityVotes = votes.filter(v => v.entity_id === id);
      const up = entityVotes.filter(v => v.vote_type === 'UP').length;
      const down = entityVotes.filter(v => v.vote_type === 'DOWN').length;
      const total = up + down;
      const percentage = total > 0 ? Math.round((up / total) * 100) : 0;
      const userVote = userId
        ? (entityVotes.find(v => v.user_id === userId)?.vote_type as 'UP' | 'DOWN' | undefined) ?? null
        : null;
      return { entityId: id, up, down, total, percentage, userVote };
    });
  },

  /** Get all proposals for a world that are in voting state */
  getActiveProposals: async (worldId: string): Promise<{
    id: string;
    type: string;
    data: any;
    status: string;
    authorId: string;
    justification: string | null;
    votingEndsAt: string | null;
    createdAt: string;
  }[]> => {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase
      .from('entities')
      .select('*')
      .eq('world_id', worldId)
      .eq('status', 'PROPOSAL')
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map(e => ({
      id: e.id,
      type: e.type,
      data: e.data,
      status: e.status,
      authorId: e.author_id,
      justification: e.justification,
      votingEndsAt: e.voting_ends_at,
      createdAt: e.created_at,
    }));
  },
};
