import React from 'react';
import { ThumbsUp, ThumbsDown, CheckCircle2 } from 'lucide-react';
import { Proposal } from '../../core/types';

interface VotingProgressProps {
  proposal: Proposal;
  thresholdPercent: number;
}

export const VotingProgress: React.FC<VotingProgressProps> = ({ proposal, thresholdPercent }) => {
  const totalVotes = proposal.votes.up + proposal.votes.down;
  const currentPercent = totalVotes > 0 ? (proposal.votes.up / totalVotes) * 100 : 0;
  const isPassing = currentPercent >= thresholdPercent;

  return (
    <div className="bg-surface-base border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-widest">Community Consensus</span>
        {isPassing ? (
          <span className="flex items-center gap-1 text-[11px] text-status-canon font-medium">
            <CheckCircle2 size={12} /> Passing
          </span>
        ) : (
          <span className="text-[11px] text-accent-primary font-medium">Needs {thresholdPercent}%</span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 w-full bg-surface-overlay rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-700 rounded-full ${isPassing ? 'bg-status-canon' : 'bg-accent-primary'}`}
          style={{ width: `${currentPercent}%` }}
        />
      </div>

      {/* Vote Actions & Stats */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface-overlay hover:bg-status-canon/10 hover:text-status-canon text-text-tertiary text-[11px] font-medium transition-colors">
            <ThumbsUp size={12} /> {proposal.votes.up}
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface-overlay hover:bg-status-rejected/10 hover:text-status-rejected text-text-tertiary text-[11px] font-medium transition-colors">
            <ThumbsDown size={12} /> {proposal.votes.down}
          </button>
        </div>
        <span className="text-[10px] text-text-tertiary">
          Ends in 2 days
        </span>
      </div>
    </div>
  );
};
