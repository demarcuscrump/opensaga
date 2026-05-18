import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { User, PlusCircle, Globe, ChevronRight, Shield, BookOpen, MessageSquare, ThumbsUp, ThumbsDown, Clock, CheckCircle, XCircle, Users, LogIn, Loader2 } from 'lucide-react';
import { Button, StatusBadge, CharacterCard } from '../../components';
import { ActivityFeed } from './ActivityFeed';
import { useAuth } from '../../lib/auth';
import { useMembership } from '../../hooks/useMembership';
import { votesApi, type VoteTally } from '../../services/api.votes';
import { governanceApi } from '../../services/api.governance';
import { worldsApi } from '../../services/api.worlds';
import { charactersApi } from '../../services/api.characters';
import { isSupabaseConfigured } from '../../lib/supabase';
import type { World, Character } from '../../core/types';
import { useAIStore } from '../../store/aiStore';
import type { ProposalAnalysis } from '../../features/ai-assist/agents/schemas';

function getTimeLeft(endDate: Date): string {
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();
  if (diff <= 0) return 'Ended';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days}d ${hours}h left`;
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

const MOCK_LORE_ENTRIES = [
  { id: 'l1', title: 'The Great Collapse', type: 'History', summary: 'The catastrophic event that led to the submersion of Old Tokyo.', author: 'System' },
  { id: 'l2', title: 'Neural Interfaces', type: 'Technology', summary: 'Standard issue cybernetics allowing direct brain-to-net connection.', author: 'Dr. Vance' },
  { id: 'l3', title: 'The Red Syndicate', type: 'Faction', summary: 'A criminal organization controlling the lower levels.', author: 'Unknown' },
];

export const WorldHubView = () => {
  const { id } = useParams();
  const [world, setWorld] = useState<World | null>(null);
  const [worldChars, setWorldChars] = useState<Character[]>([]);
  const [isLoadingWorld, setIsLoadingWorld] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const { user, isAuthenticated } = useAuth();
  const { isMember, memberCount, isToggling, toggleMembership } = useMembership(id || '');
  const [proposals, setProposals] = useState<any[]>([]);
  const [tallies, setTallies] = useState<Record<string, VoteTally>>({});
  const [votingEntity, setVotingEntity] = useState<string | null>(null);
  const [proposalAnalyses, setProposalAnalyses] = useState<Record<string, ProposalAnalysis>>({});
  const [analyzingProposal, setAnalyzingProposal] = useState<string | null>(null);
  const aiConfig = useAIStore(s => s.getConfig)();

  // Fetch world + characters
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setIsLoadingWorld(true);
    Promise.all([worldsApi.getById(id), charactersApi.getByWorld(id)])
      .then(([w, c]) => {
        if (!cancelled) {
          setWorld(w || null);
          setWorldChars(c);
          setIsLoadingWorld(false);
        }
      })
      .catch(() => { if (!cancelled) setIsLoadingWorld(false); });
    return () => { cancelled = true; };
  }, [id]);

  // Fetch active proposals when governance tab is opened
  useEffect(() => {
    if (activeTab === 'governance' && isSupabaseConfigured && world) {
      // Auto-tally any expired proposals first
      governanceApi.tallyExpiredProposals(world.id).then(() => {
        votesApi.getActiveProposals(world.id).then(p => {
          setProposals(p);
          if (p.length > 0) {
            votesApi.getTallies(p.map(x => x.id), user?.id).then(t => {
              const map: Record<string, VoteTally> = {};
              t.forEach(v => { map[v.entityId] = v; });
              setTallies(map);
            });
          }
        });
      });
    }
  }, [activeTab, world?.id, user?.id]);

  const handleVote = async (entityId: string, voteType: 'UP' | 'DOWN') => {
    if (!user?.id) return;
    setVotingEntity(entityId);
    const current = tallies[entityId];
    if (current?.userVote === voteType) {
      await votesApi.remove(entityId, user.id);
    } else {
      await votesApi.cast(entityId, user.id, voteType);
    }
    const updated = await votesApi.getTally(entityId, user.id);
    setTallies(prev => ({ ...prev, [entityId]: updated }));
    setVotingEntity(null);
  };

  const handleAnalyzeProposal = async (proposal: any) => {
    if (!world) return;
    setAnalyzingProposal(proposal.id);
    try {
      const { AgentOrchestrator } = await import('../../features/ai-assist/agents/orchestrator');
      const orchestrator = new AgentOrchestrator(aiConfig);
      const content = `Type: ${proposal.type}\nName: ${proposal.data?.name || 'Untitled'}\nDescription: ${proposal.data?.description || ''}\nJustification: ${proposal.justification || ''}`;
      const result = await orchestrator.analyzeProposal({ proposalContent: content, worldId: world.id });
      setProposalAnalyses(prev => ({ ...prev, [proposal.id]: result }));
    } finally {
      setAnalyzingProposal(null);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'bible', label: 'World Bible' },
    { id: 'characters', label: 'Characters' },
    { id: 'activity', label: 'Activity' },
    { id: 'governance', label: 'Governance' }
  ];

  if (isLoadingWorld || !world) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        {isLoadingWorld ? (
          <Loader2 size={28} className="animate-spin text-accent-primary" />
        ) : (
          <div className="text-center">
            <Globe size={32} className="mx-auto text-text-tertiary mb-3" />
            <p className="text-text-secondary text-sm">World not found.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-base animate-fade-in pb-20">
      {/* Hero Section */}
      <div className="relative h-72 w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-surface-base via-surface-base/60 to-surface-base/10 z-20" />
        <img src={world.heroImage} alt={world.name} className="w-full h-full object-cover" />
        
        <div className="absolute bottom-0 left-0 right-0 z-30 p-6 md:p-10 max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <StatusBadge status={world.status} />
                <span className="text-text-secondary text-xs flex items-center gap-1">
                  <User size={12} /> by <span className="text-text-primary font-medium">@{world.creatorId === 'u1' ? 'kai_zen' : `creator_${world.creatorId}`}</span>
                </span>
              </div>
              <h1 className="font-serif text-4xl md:text-5xl text-text-primary mb-3">{world.name}</h1>
              <div className="flex flex-wrap gap-2">
                {world.genre.map(g => (
                  <span key={g} className="px-2 py-0.5 bg-surface-overlay/80 backdrop-blur-sm border border-border rounded text-[11px] text-text-secondary">
                    {g}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              {isAuthenticated && (
                <button
                  onClick={toggleMembership}
                  disabled={isToggling}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-200 ${
                    isMember
                      ? 'border-border text-text-secondary hover:border-red-500/50 hover:text-red-400'
                      : 'border-accent-primary text-accent-primary hover:bg-accent-primary hover:text-surface-base'
                  }`}
                >
                  <Users size={14} />
                  {isToggling ? '...' : isMember ? 'Leave World' : 'Join World'}
                </button>
              )}
              <Button variant="outline" icon={Globe} onClick={() => setActiveTab('bible')}>Explore Bible</Button>
              <Link to="/create">
                <Button variant="primary" icon={PlusCircle}>Submit Proposal</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-6 md:px-10 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Column: Content */}
          <div className="lg:col-span-8 space-y-8">
            {/* Tabs */}
            <div className="border-b border-border overflow-x-auto no-scrollbar">
              <div className="flex gap-8 min-w-max">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`pb-3 text-sm transition-colors relative ${
                      activeTab === tab.id ? 'text-text-primary font-medium' : 'text-text-tertiary hover:text-text-secondary'
                    }`}
                  >
                    {tab.label}
                    {activeTab === tab.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-px bg-accent-primary" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Panels */}
            <div className="min-h-[400px]">
              {activeTab === 'overview' && (
                <div className="animate-fade-in space-y-8">
                  <p className="text-text-secondary leading-relaxed text-base">{world.description}</p>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-4 bg-surface-elevated border border-border rounded-xl text-center">
                      <div className="text-2xl font-serif text-text-primary">{isSupabaseConfigured ? memberCount : world.memberCount}</div>
                      <div className="text-[10px] text-text-tertiary uppercase tracking-widest mt-1">Citizens</div>
                    </div>
                    <div className="p-4 bg-surface-elevated border border-border rounded-xl text-center">
                      <div className="text-2xl font-serif text-text-primary">{world.characterCount}</div>
                      <div className="text-[10px] text-text-tertiary uppercase tracking-widest mt-1">Canon Entries</div>
                    </div>
                    <div className="p-4 bg-surface-elevated border border-border rounded-xl text-center">
                      <div className="text-2xl font-serif text-accent-primary">{world.votingThreshold}%</div>
                      <div className="text-[10px] text-text-tertiary uppercase tracking-widest mt-1">Vote Threshold</div>
                    </div>
                    <div className="p-4 bg-surface-elevated border border-border rounded-xl text-center">
                      <div className="text-2xl font-serif text-text-primary">{world.genre.length}</div>
                      <div className="text-[10px] text-text-tertiary uppercase tracking-widest mt-1">Genres</div>
                    </div>
                  </div>

                  {/* Featured Characters */}
                  {worldChars.length > 0 && (
                    <div>
                      <h3 className="font-serif text-lg text-text-primary mb-4">Featured Characters</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {worldChars.slice(0, 4).map(c => (
                          <CharacterCard key={c.id} character={c} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'bible' && (
                <div className="space-y-3 animate-fade-in">
                  {MOCK_LORE_ENTRIES.map(lore => (
                    <div key={lore.id} className="p-5 bg-surface-elevated border border-border rounded-xl flex items-center justify-between group hover:border-border-accent transition-all duration-200 cursor-pointer">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-serif text-lg text-text-primary">{lore.title}</h4>
                          <span className="text-[10px] text-text-tertiary uppercase tracking-widest font-medium">{lore.type}</span>
                        </div>
                        <p className="text-sm text-text-secondary">{lore.summary}</p>
                      </div>
                      <ChevronRight size={16} className="text-text-tertiary group-hover:text-accent-primary transition-colors shrink-0 ml-4" />
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'characters' && (
                <div className="animate-fade-in">
                  {worldChars.length === 0 ? (
                    <div className="p-12 text-center border border-border rounded-xl">
                      <User size={28} className="mx-auto text-text-tertiary mb-3" />
                      <p className="text-text-secondary text-sm mb-3">No characters in this world yet.</p>
                      <Link to="/create" className="text-sm text-accent-primary hover:underline">Be the first to submit one →</Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {worldChars.map(c => (
                        <CharacterCard key={c.id} character={c} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'activity' && (
                <div className="animate-fade-in">
                  <ActivityFeed worldId={world.id} />
                </div>
              )}

              {activeTab === 'governance' && (
                <div className="space-y-6 animate-fade-in">
                  {/* Governance Info */}
                  <div className="p-6 border border-border rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <Shield size={20} className="text-accent-primary" />
                      <h3 className="font-serif text-lg text-text-primary">Governance Model</h3>
                    </div>
                    <p className="text-text-secondary text-sm leading-relaxed">
                      This world uses <span className="text-accent-primary font-medium">{world.governance.replace(/_/g, ' ')}</span>.
                      {world.governance === 'COMMUNITY_VOTE' && ` Proposals need ${world.votingThreshold}% approval to become Canon.`}
                      {world.governance === 'CREATOR_APPROVED' && ' The creator has final authority over all proposals.'}
                      {world.governance === 'LOREKEEPER_COUNCIL' && ' A trusted group of Lorekeepers curate Canon.'}
                    </p>
                  </div>

                  {/* Active Proposals */}
                  <div>
                    <h3 className="font-serif text-lg text-text-primary mb-4">Active Proposals</h3>
                    {proposals.length === 0 ? (
                      <div className="p-8 text-center border border-border rounded-xl">
                        <Clock size={28} className="mx-auto text-text-tertiary mb-3" />
                        <p className="text-text-secondary text-sm">No active proposals. The council awaits new submissions.</p>
                        <Link to="/create" className="inline-flex items-center gap-2 mt-4 text-sm text-accent-primary hover:underline">
                          <PlusCircle size={14} />
                          Submit a Proposal
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {proposals.map(proposal => {
                          const tally = tallies[proposal.id];
                          const endsAt = proposal.votingEndsAt ? new Date(proposal.votingEndsAt) : null;
                          const isExpired = endsAt ? endsAt < new Date() : false;
                          const timeLeft = endsAt ? getTimeLeft(endsAt) : 'No deadline';

                          return (
                            <div key={proposal.id} className="p-5 bg-surface-elevated border border-border rounded-xl">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] uppercase tracking-widest text-text-tertiary font-medium">{proposal.type}</span>
                                    {isExpired && <span className="text-[10px] uppercase tracking-widest text-amber-400 font-medium">Voting Ended</span>}
                                  </div>
                                  <h4 className="font-serif text-base text-text-primary">{proposal.data?.name || 'Untitled Proposal'}</h4>
                                  {proposal.justification && (
                                    <p className="text-xs text-text-secondary mt-1 line-clamp-2">{proposal.justification}</p>
                                  )}
                                </div>
                                <div className="text-right text-xs text-text-tertiary whitespace-nowrap">
                                  <Clock size={12} className="inline mr-1" />
                                  {timeLeft}
                                </div>
                              </div>

                              {/* Vote Bar */}
                              {tally && (
                                <div className="mb-3">
                                  <div className="flex justify-between text-xs text-text-secondary mb-1">
                                    <span>{tally.up} approve</span>
                                    <span>{tally.percentage}%</span>
                                    <span>{tally.down} reject</span>
                                  </div>
                                  <div className="h-2 bg-surface-overlay rounded-full overflow-hidden flex">
                                    <div
                                      className="h-full bg-green-500 transition-all duration-500"
                                      style={{ width: `${tally.total > 0 ? (tally.up / tally.total) * 100 : 0}%` }}
                                    />
                                    <div
                                      className="h-full bg-red-500 transition-all duration-500"
                                      style={{ width: `${tally.total > 0 ? (tally.down / tally.total) * 100 : 0}%` }}
                                    />
                                  </div>
                                  <div className="flex items-center gap-1 mt-1">
                                    <div className={`h-1 w-1 rounded-full ${tally.percentage >= world.votingThreshold ? 'bg-green-400' : 'bg-red-400'}`} />
                                    <span className="text-[10px] text-text-tertiary">
                                      {world.votingThreshold}% threshold {tally.percentage >= world.votingThreshold ? 'met' : `needs ${world.votingThreshold - tally.percentage}% more`}
                                    </span>
                                  </div>
                                </div>
                              )}

                              {/* Vote Buttons */}
                              {isAuthenticated && !isExpired && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleVote(proposal.id, 'UP')}
                                    disabled={votingEntity === proposal.id}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 ${
                                      tally?.userVote === 'UP'
                                        ? 'border-green-500/50 bg-green-500/10 text-green-400'
                                        : 'border-border text-text-secondary hover:border-green-500/30 hover:text-green-400'
                                    }`}
                                  >
                                    <ThumbsUp size={12} />
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleVote(proposal.id, 'DOWN')}
                                    disabled={votingEntity === proposal.id}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 ${
                                      tally?.userVote === 'DOWN'
                                        ? 'border-red-500/50 bg-red-500/10 text-red-400'
                                        : 'border-border text-text-secondary hover:border-red-500/30 hover:text-red-400'
                                    }`}
                                  >
                                    <ThumbsDown size={12} />
                                    Reject
                                  </button>
                                </div>
                              )}
                              {!isAuthenticated && (
                                <Link to="/login" className="flex items-center gap-1.5 text-xs text-accent-primary hover:underline">
                                  <LogIn size={12} />
                                  Sign in to vote
                                </Link>
                              )}

                              {/* AI Proposal Analysis */}
                              {proposalAnalyses[proposal.id] ? (
                                <div className="mt-3 p-3 bg-surface-base rounded-lg border border-border">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-[10px] font-semibold text-accent-primary uppercase tracking-widest">AI Analysis</span>
                                    <span className={`text-[10px] font-semibold uppercase tracking-widest ${
                                      proposalAnalyses[proposal.id].recommendation === 'STRONG_YES' || proposalAnalyses[proposal.id].recommendation === 'YES' ? 'text-green-400' :
                                      proposalAnalyses[proposal.id].recommendation === 'NEEDS_WORK' ? 'text-amber-400' : 'text-red-400'
                                    }`}>{proposalAnalyses[proposal.id].recommendation.replace(/_/g, ' ')}</span>
                                  </div>
                                  <p className="text-xs text-text-secondary leading-relaxed">{proposalAnalyses[proposal.id].voterSummary}</p>
                                  <div className="flex gap-3 mt-2 text-[10px] text-text-tertiary">
                                    <span>Quality: {proposalAnalyses[proposal.id].qualityScore}/100</span>
                                    <span>Canon Fit: {proposalAnalyses[proposal.id].canonFitScore}/100</span>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleAnalyzeProposal(proposal)}
                                  disabled={analyzingProposal === proposal.id}
                                  className="mt-3 flex items-center gap-1.5 text-xs text-accent-primary hover:underline disabled:opacity-50"
                                >
                                  {analyzingProposal === proposal.id ? (
                                    <><Loader2 size={12} className="animate-spin" /> Analyzing...</>
                                  ) : (
                                    <><Shield size={12} /> Get AI Analysis</>
                                  )}
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-surface-elevated border border-border rounded-xl p-6">
              <h3 className="text-[11px] font-semibold text-text-tertiary uppercase tracking-widest mb-5">World Status</h3>
              <div className="space-y-0">
                <div className="flex justify-between items-center py-3 border-b border-border">
                  <span className="text-sm text-text-secondary">Governance</span>
                  <span className="text-sm text-text-primary font-medium">{world.governance.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-border">
                  <span className="text-sm text-text-secondary">Voting Threshold</span>
                  <span className="text-sm text-accent-primary font-medium">{world.votingThreshold}%</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-border">
                  <span className="text-sm text-text-secondary">Citizens</span>
                  <span className="text-sm text-text-primary font-medium">{isSupabaseConfigured ? memberCount : world.memberCount}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-sm text-text-secondary">Canon Entries</span>
                  <span className="text-sm text-text-primary font-medium">{world.characterCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
