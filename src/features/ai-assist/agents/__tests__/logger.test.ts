/**
 * AgentLogger Tests — observability, persistence, state management
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AgentLogger } from '../logger';

describe('AgentLogger', () => {
  beforeEach(() => {
    AgentLogger.clear();
  });

  it('starts a run and returns an ID', () => {
    const id = AgentLogger.startRun('test_agent', { foo: 'bar' });
    expect(id).toBeTruthy();
    expect(id).toContain('test_agent');
  });

  it('tracks running status', () => {
    const id = AgentLogger.startRun('test_agent', {});
    const logs = AgentLogger.getLogs();
    expect(logs.length).toBe(1);
    expect(logs[0].status).toBe('running');
    expect(logs[0].agent).toBe('test_agent');
  });

  it('completes a run with output', () => {
    const id = AgentLogger.startRun('test_agent', {});
    AgentLogger.completeRun(id, { result: 'success' });
    const logs = AgentLogger.getLogs();
    expect(logs[0].status).toBe('success');
    expect(logs[0].durationMs).toBeGreaterThanOrEqual(0);
    expect(logs[0].output).toEqual({ result: 'success' });
  });

  it('fails a run with error', () => {
    const id = AgentLogger.startRun('test_agent', {});
    AgentLogger.failRun(id, new Error('Timeout'));
    const logs = AgentLogger.getLogs();
    expect(logs[0].status).toBe('error');
    expect(logs[0].error).toBe('Timeout');
  });

  it('fails a run with string error', () => {
    const id = AgentLogger.startRun('test_agent', {});
    AgentLogger.failRun(id, 'Something broke');
    const logs = AgentLogger.getLogs();
    expect(logs[0].error).toBe('Something broke');
  });

  it('logs node executions', () => {
    const id = AgentLogger.startRun('test_agent', {});
    AgentLogger.logNode(id, 'gatherContext', 50);
    AgentLogger.logNode(id, 'analyze', 200);
    const logs = AgentLogger.getLogs();
    expect(logs[0].nodes.length).toBe(2);
    expect(logs[0].nodes[0].node).toBe('gatherContext');
    expect(logs[0].nodes[1].durationMs).toBe(200);
  });

  it('returns most recent logs first', () => {
    AgentLogger.startRun('first', {});
    AgentLogger.startRun('second', {});
    const logs = AgentLogger.getLogs();
    expect(logs[0].agent).toBe('second');
    expect(logs[1].agent).toBe('first');
  });

  it('filters by agent name', () => {
    AgentLogger.startRun('canon_keeper', {});
    AgentLogger.startRun('world_architect', {});
    AgentLogger.startRun('canon_keeper', {});
    const filtered = AgentLogger.getLogsForAgent('canon_keeper');
    expect(filtered.length).toBe(2);
  });

  it('limits recent logs', () => {
    for (let i = 0; i < 10; i++) AgentLogger.startRun(`agent_${i}`, {});
    const recent = AgentLogger.getRecentLogs(3);
    expect(recent.length).toBe(3);
  });

  it('clears all logs', () => {
    AgentLogger.startRun('test', {});
    AgentLogger.startRun('test2', {});
    AgentLogger.clear();
    expect(AgentLogger.getLogs().length).toBe(0);
  });

  it('notifies subscribers on state changes', () => {
    let called = 0;
    const unsub = AgentLogger.subscribe(() => { called++; });
    AgentLogger.startRun('test', {});
    expect(called).toBe(1);
    unsub();
    AgentLogger.startRun('test2', {});
    expect(called).toBe(1); // no longer subscribed
  });

  it('caps at MAX_LOGS (50)', () => {
    for (let i = 0; i < 60; i++) AgentLogger.startRun(`agent_${i}`, {});
    expect(AgentLogger.getLogs().length).toBeLessThanOrEqual(50);
  });

  it('ignores operations on unknown run IDs', () => {
    AgentLogger.logNode('fake-id', 'node', 100);
    AgentLogger.completeRun('fake-id', {});
    AgentLogger.failRun('fake-id', 'err');
    expect(AgentLogger.getLogs().length).toBe(0);
  });
});
