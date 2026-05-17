import { useState, useCallback } from 'react';
import { votesApi, type VoteTally } from '../services/api.votes';
import { useAuth } from '../lib/auth';

export function useVoting(entityId: string) {
  const { user } = useAuth();
  const [tally, setTally] = useState<VoteTally | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCasting, setIsCasting] = useState(false);

  const fetchTally = useCallback(async () => {
    setIsLoading(true);
    const result = await votesApi.getTally(entityId, user?.id);
    setTally(result);
    setIsLoading(false);
  }, [entityId, user?.id]);

  const castVote = useCallback(async (voteType: 'UP' | 'DOWN') => {
    if (!user?.id) return;
    setIsCasting(true);

    // Optimistic update
    if (tally) {
      const wasUp = tally.userVote === 'UP';
      const wasDown = tally.userVote === 'DOWN';
      const isSame = tally.userVote === voteType;

      if (isSame) {
        // Toggle off
        await votesApi.remove(entityId, user.id);
      } else {
        await votesApi.cast(entityId, user.id, voteType);
      }
    } else {
      await votesApi.cast(entityId, user.id, voteType);
    }

    // Refresh tally
    await fetchTally();
    setIsCasting(false);
  }, [entityId, user?.id, tally, fetchTally]);

  return {
    tally,
    isLoading,
    isCasting,
    fetchTally,
    castVote,
  };
}
