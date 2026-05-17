import React, { useState, useEffect } from 'react';
import { activityApi, getActionLabel, type ActivityEvent } from '../../services/api.activity';
import { Clock, Loader2 } from 'lucide-react';

interface ActivityFeedProps {
  worldId?: string;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ worldId }) => {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    const fetch = worldId ? activityApi.getByWorld(worldId) : activityApi.getGlobal();
    fetch
      .then(data => { if (!cancelled) setEvents(data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [worldId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={20} className="animate-spin text-accent-primary" />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="p-12 text-center border border-border rounded-xl">
        <Clock size={28} className="mx-auto text-text-tertiary mb-3" />
        <p className="text-text-secondary text-sm">No activity yet. Be the first to make history.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-serif text-xl text-text-primary">Recent Activity</h3>
      </div>
      
      {events.map(event => (
        <div key={event.id} className="flex items-start gap-3 p-4 bg-surface-elevated border border-border rounded-xl">
          {event.avatarUrl ? (
            <img src={event.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-surface-overlay shrink-0 flex items-center justify-center text-text-tertiary text-xs font-medium">
              {(event.displayName || event.username || '?')[0].toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-text-secondary">
              <span className="text-text-primary font-medium">{event.displayName || event.username || 'Someone'}</span>
              {' '}{getActionLabel(event.action)}
              {event.worldName && <span className="text-accent-primary"> {event.worldName}</span>}
            </p>
            <p className="text-[10px] text-text-tertiary mt-1">
              {new Date(event.createdAt).toLocaleDateString()} · {new Date(event.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
