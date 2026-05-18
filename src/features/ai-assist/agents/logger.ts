/**
 * Agent Logger — Observability for agent workflow runs
 *
 * Tracks:
 * - Agent name, start/end time, duration
 * - Input/output state snapshots
 * - Node execution order
 * - Errors with full stack traces
 * - Token usage estimates
 *
 * Stores the last N runs in memory for the debug panel.
 * In production, these logs can be shipped to any analytics backend.
 */

export interface AgentNodeLog {
  node: string;
  startedAt: number;
  endedAt: number;
  durationMs: number;
}

export interface AgentRunLog {
  id: string;
  agent: string;
  status: 'running' | 'success' | 'error';
  startedAt: number;
  endedAt: number | null;
  durationMs: number | null;
  nodes: AgentNodeLog[];
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  error: string | null;
  errorStack: string | null;
}

const MAX_LOGS = 50;
const STORAGE_KEY = 'opensaga-agent-logs';

function loadPersistedLogs(): AgentRunLog[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as AgentRunLog[];
      // Mark any stale "running" entries as errors (process was interrupted)
      return parsed.map(log =>
        log.status === 'running'
          ? { ...log, status: 'error' as const, error: 'Process interrupted', endedAt: log.startedAt, durationMs: 0 }
          : log
      );
    }
  } catch {}
  return [];
}

function persistLogs(logs: AgentRunLog[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs.slice(0, MAX_LOGS)));
  } catch {}
}

class AgentLoggerImpl {
  private logs: AgentRunLog[] = loadPersistedLogs();
  private listeners: Set<() => void> = new Set();

  /** Start a new agent run. Returns the log ID. */
  startRun(agent: string, input: Record<string, unknown>): string {
    const id = `${agent}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const log: AgentRunLog = {
      id,
      agent,
      status: 'running',
      startedAt: Date.now(),
      endedAt: null,
      durationMs: null,
      nodes: [],
      input,
      output: null,
      error: null,
      errorStack: null,
    };
    this.logs.unshift(log);
    if (this.logs.length > MAX_LOGS) this.logs.pop();
    persistLogs(this.logs);
    this.notify();
    return id;
  }

  /** Log a node execution within a run */
  logNode(runId: string, node: string, durationMs: number): void {
    const log = this.logs.find(l => l.id === runId);
    if (!log) return;
    log.nodes.push({
      node,
      startedAt: Date.now() - durationMs,
      endedAt: Date.now(),
      durationMs,
    });
    persistLogs(this.logs);
    this.notify();
  }

  /** Mark a run as complete */
  completeRun(runId: string, output: Record<string, unknown>): void {
    const log = this.logs.find(l => l.id === runId);
    if (!log) return;
    log.status = 'success';
    log.endedAt = Date.now();
    log.durationMs = log.endedAt - log.startedAt;
    log.output = output;
    persistLogs(this.logs);
    this.notify();
  }

  /** Mark a run as failed */
  failRun(runId: string, error: Error | string): void {
    const log = this.logs.find(l => l.id === runId);
    if (!log) return;
    log.status = 'error';
    log.endedAt = Date.now();
    log.durationMs = log.endedAt - log.startedAt;
    log.error = typeof error === 'string' ? error : error.message;
    log.errorStack = typeof error === 'string' ? null : error.stack || null;
    persistLogs(this.logs);
    this.notify();
  }

  /** Get all logs (most recent first) */
  getLogs(): readonly AgentRunLog[] {
    return this.logs;
  }

  /** Get logs for a specific agent */
  getLogsForAgent(agent: string): AgentRunLog[] {
    return this.logs.filter(l => l.agent === agent);
  }

  /** Get the last N runs */
  getRecentLogs(count: number = 10): AgentRunLog[] {
    return this.logs.slice(0, count);
  }

  /** Clear all logs */
  clear(): void {
    this.logs = [];
    persistLogs(this.logs);
    this.notify();
  }

  /** Subscribe to log changes (for React useSyncExternalStore) */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Get a snapshot reference (for useSyncExternalStore) */
  getSnapshot(): readonly AgentRunLog[] {
    return this.logs;
  }

  private notify(): void {
    this.listeners.forEach(l => l());
  }
}

/** Singleton logger instance */
export const AgentLogger = new AgentLoggerImpl();
