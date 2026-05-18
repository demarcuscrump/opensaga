/**
 * useAgentLogs — React hook for agent run observability
 *
 * Subscribes to the AgentLogger singleton and re-renders
 * whenever a new log entry arrives.
 */

import { useSyncExternalStore } from 'react';
import { AgentLogger, type AgentRunLog } from '../features/ai-assist/agents/logger';

export function useAgentLogs(): readonly AgentRunLog[] {
  return useSyncExternalStore(
    (cb) => AgentLogger.subscribe(cb),
    () => AgentLogger.getSnapshot()
  );
}

export function useRecentAgentLogs(count: number = 10): AgentRunLog[] {
  const all = useAgentLogs();
  return all.slice(0, count) as AgentRunLog[];
}
