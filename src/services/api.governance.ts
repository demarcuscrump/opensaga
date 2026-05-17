import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface GovernanceResult {
  entityId: string;
  passed: boolean;
  newStatus: 'CANON' | 'REJECTED';
  approvalPercentage: number;
  threshold: number;
  totalVotes: number;
}

export const governanceApi = {
  /**
   * Check if a proposal has expired and tally the result.
   * Transitions entity to CANON or REJECTED based on world's threshold.
   */
  tallyProposal: async (entityId: string): Promise<GovernanceResult | null> => {
    if (!isSupabaseConfigured) return null;

    // 1. Get the entity
    const { data: entity, error: eErr } = await supabase
      .from('entities')
      .select('*')
      .eq('id', entityId)
      .eq('status', 'PROPOSAL')
      .single();

    if (eErr || !entity) return null;

    // 2. Check if voting period has ended
    if (entity.voting_ends_at) {
      const endsAt = new Date(entity.voting_ends_at);
      if (endsAt > new Date()) return null; // Still active
    }

    // 3. Get the world's threshold
    const { data: world } = await supabase
      .from('worlds')
      .select('voting_threshold, governance')
      .eq('id', entity.world_id)
      .single();

    const threshold = world?.voting_threshold ?? 60;

    // 4. Count votes
    const { data: votes } = await supabase
      .from('votes')
      .select('vote_type')
      .eq('entity_id', entityId);

    const up = votes?.filter(v => v.vote_type === 'UP').length ?? 0;
    const down = votes?.filter(v => v.vote_type === 'DOWN').length ?? 0;
    const total = up + down;
    const approvalPercentage = total > 0 ? Math.round((up / total) * 100) : 0;

    // 5. Determine outcome
    const passed = approvalPercentage >= threshold;
    const newStatus = passed ? 'CANON' : 'REJECTED';

    // 6. Update entity status
    await supabase
      .from('entities')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', entityId);

    // 7. If canonized, award reputation to author
    if (passed) {
      const repBonus = entity.type === 'CHARACTER' ? 10 : entity.type === 'LORE' ? 5 : 8;
      try {
        await supabase.rpc('increment_reputation', {
          target_user_id: entity.author_id,
          amount: repBonus,
        });
      } catch {
        // Fallback: manual increment if RPC doesn't exist
        const { data: profile } = await supabase
          .from('profiles')
          .select('reputation')
          .eq('id', entity.author_id)
          .single();

        if (profile) {
          await supabase
            .from('profiles')
            .update({ reputation: (profile.reputation || 0) + repBonus })
            .eq('id', entity.author_id);
        }
      }
    }

    // 8. Log activity
    await supabase.from('activity').insert({
      world_id: entity.world_id,
      user_id: entity.author_id,
      action: passed ? 'ENTITY_CANONIZED' : 'ENTITY_REJECTED',
      target_type: entity.type,
      target_id: entity.id,
      metadata: {
        name: (entity.data as any)?.name || 'Unknown',
        approval: approvalPercentage,
        threshold,
        totalVotes: total,
      },
    });

    return { entityId, passed, newStatus, approvalPercentage, threshold, totalVotes: total };
  },

  /**
   * Check all expired proposals in a world and tally them.
   * Call this periodically or on world hub load.
   */
  tallyExpiredProposals: async (worldId: string): Promise<GovernanceResult[]> => {
    if (!isSupabaseConfigured) return [];

    const now = new Date().toISOString();

    const { data: expired } = await supabase
      .from('entities')
      .select('id')
      .eq('world_id', worldId)
      .eq('status', 'PROPOSAL')
      .lt('voting_ends_at', now);

    if (!expired || expired.length === 0) return [];

    const results: GovernanceResult[] = [];
    for (const entity of expired) {
      const result = await governanceApi.tallyProposal(entity.id);
      if (result) results.push(result);
    }

    return results;
  },

  /**
   * Creator-approved governance: creator directly accepts/rejects.
   */
  creatorDecision: async (
    entityId: string,
    creatorId: string,
    decision: 'CANON' | 'REJECTED'
  ): Promise<boolean> => {
    if (!isSupabaseConfigured) return false;

    // Verify the user is the world creator
    const { data: entity } = await supabase
      .from('entities')
      .select('world_id, author_id, type, data')
      .eq('id', entityId)
      .eq('status', 'PROPOSAL')
      .single();

    if (!entity) return false;

    const { data: world } = await supabase
      .from('worlds')
      .select('creator_id, governance')
      .eq('id', entity.world_id)
      .single();

    if (!world || world.creator_id !== creatorId || world.governance !== 'CREATOR_APPROVED') {
      return false;
    }

    // Update status
    await supabase
      .from('entities')
      .update({ status: decision, updated_at: new Date().toISOString() })
      .eq('id', entityId);

    // Award rep if canonized
    if (decision === 'CANON') {
      const repBonus = entity.type === 'CHARACTER' ? 10 : 5;
      await supabase
        .from('profiles')
        .select('reputation')
        .eq('id', entity.author_id)
        .single()
        .then(({ data: profile }) => {
          if (profile) {
            supabase
              .from('profiles')
              .update({ reputation: (profile.reputation || 0) + repBonus })
              .eq('id', entity.author_id);
          }
        });
    }

    // Log activity
    await supabase.from('activity').insert({
      world_id: entity.world_id,
      user_id: creatorId,
      action: decision === 'CANON' ? 'CREATOR_APPROVED_ENTITY' : 'CREATOR_REJECTED_ENTITY',
      target_type: entity.type,
      target_id: entityId,
      metadata: { name: (entity.data as any)?.name || 'Unknown' },
    });

    return true;
  },
};
