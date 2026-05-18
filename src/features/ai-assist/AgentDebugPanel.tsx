/**
 * AgentDebugPanel — Real-time observability panel for agent runs
 *
 * Shows: agent name, status, duration, output summary, errors.
 * Collapsible. Sits at the bottom of Creator Studio.
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Activity, CheckCircle2, XCircle, Loader2, Trash2 } from 'lucide-react';
import { useRecentAgentLogs } from '../../hooks/useAgentLogs';
import { AgentLogger } from './agents/logger';

const AGENT_LABELS: Record<string, string> = {
  canon_keeper: 'Canon Keeper',
  world_architect: 'World Architect',
  character_deepener: 'Character Deepener',
  proposal_analyst: 'Proposal Analyst',
  vision_analyzer: 'Vision Analyzer',
};

export function AgentDebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const logs = useRecentAgentLogs(15);

  if (logs.length === 0 && !isOpen) return null;

  const runningCount = logs.filter(l => l.status === 'running').length;
  const errorCount = logs.filter(l => l.status === 'error').length;

  return (
    <div className="border-t border-border bg-surface-base">
      {/* Header bar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2 hover:bg-surface-elevated transition-colors"
      >
        <div className="flex items-center gap-2 text-xs">
          <Activity size={12} className="text-accent-primary" />
          <span className="font-medium text-text-primary">Agent Runs</span>
          <span className="text-text-tertiary">({logs.length})</span>
          {runningCount > 0 && (
            <span className="flex items-center gap-1 text-status-conflict">
              <Loader2 size={10} className="animate-spin" />
              {runningCount} active
            </span>
          )}
          {errorCount > 0 && (
            <span className="flex items-center gap-1 text-status-conflict">
              <XCircle size={10} />
              {errorCount} error{errorCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {logs.length > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); AgentLogger.clear(); }}
              className="text-text-tertiary hover:text-text-primary p-1"
              title="Clear logs"
            >
              <Trash2 size={10} />
            </button>
          )}
          {isOpen ? <ChevronDown size={12} className="text-text-tertiary" /> : <ChevronUp size={12} className="text-text-tertiary" />}
        </div>
      </button>

      {/* Log entries */}
      {isOpen && (
        <div className="max-h-48 overflow-y-auto px-4 pb-3 space-y-1.5 no-scrollbar">
          {logs.length === 0 ? (
            <p className="text-[10px] text-text-tertiary py-2">No agent runs yet. Use an agent tool to see logs here.</p>
          ) : (
            logs.map(log => (
              <div
                key={log.id}
                className={`flex items-center gap-3 px-3 py-1.5 rounded-lg text-[11px] ${
                  log.status === 'error' ? 'bg-status-conflict/5 border border-status-conflict/10' :
                  log.status === 'running' ? 'bg-status-proposal/5 border border-status-proposal/10' :
                  'bg-surface-elevated border border-border'
                }`}
              >
                {/* Status icon */}
                {log.status === 'running' && <Loader2 size={11} className="text-status-proposal animate-spin shrink-0" />}
                {log.status === 'success' && <CheckCircle2 size={11} className="text-status-canon shrink-0" />}
                {log.status === 'error' && <XCircle size={11} className="text-status-conflict shrink-0" />}

                {/* Agent name */}
                <span className="font-medium text-text-primary whitespace-nowrap">
                  {AGENT_LABELS[log.agent] || log.agent}
                </span>

                {/* Output summary */}
                <span className="text-text-tertiary truncate flex-1">
                  {log.status === 'running' && 'Processing...'}
                  {log.status === 'success' && log.output && formatOutput(log.output)}
                  {log.status === 'error' && (log.error || 'Unknown error')}
                </span>

                {/* Duration */}
                {log.durationMs !== null && (
                  <span className="text-text-tertiary whitespace-nowrap shrink-0">
                    {log.durationMs < 1000 ? `${log.durationMs}ms` : `${(log.durationMs / 1000).toFixed(1)}s`}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function formatOutput(output: Record<string, unknown>): string {
  if ('score' in output) return `Score: ${output.score}/100 → ${output.recommendation}`;
  if ('coherenceScore' in output) return `Coherence: ${output.coherenceScore}/100`;
  if ('qualityScore' in output) return `Quality: ${output.qualityScore}, Canon Fit: ${output.canonFitScore} → ${output.recommendation}`;
  if ('hasBackstory' in output) return `Backstory: ✓ | Hooks: ${output.hookCount || 0}`;
  return JSON.stringify(output).slice(0, 80);
}
