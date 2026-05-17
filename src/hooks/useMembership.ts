import { useState, useEffect, useCallback } from 'react';
import { membershipApi } from '../services/api.membership';
import { useAuth } from '../lib/auth';

export function useMembership(worldId: string) {
  const { user, isAuthenticated } = useAuth();
  const [isMember, setIsMember] = useState(false);
  const [memberCount, setMemberCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    const [member, count] = await Promise.all([
      user?.id ? membershipApi.isMember(worldId, user.id) : false,
      membershipApi.getCount(worldId),
    ]);
    setIsMember(member);
    setMemberCount(count);
    setIsLoading(false);
  }, [worldId, user?.id]);

  useEffect(() => {
    if (isAuthenticated) {
      refresh();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, refresh]);

  const toggleMembership = useCallback(async () => {
    if (!user?.id) return;
    setIsToggling(true);

    if (isMember) {
      await membershipApi.leave(worldId, user.id);
    } else {
      await membershipApi.join(worldId, user.id);
    }

    await refresh();
    setIsToggling(false);
  }, [worldId, user?.id, isMember, refresh]);

  return {
    isMember,
    memberCount,
    isLoading,
    isToggling,
    toggleMembership,
    refresh,
  };
}
