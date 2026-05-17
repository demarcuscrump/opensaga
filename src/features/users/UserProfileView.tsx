import React, { useState, useEffect } from 'react';
import { Badge, Button, CharacterCard, WorldCard } from '../../components';
import { PlusCircle, Wand2, Globe, User as UserIcon, Loader2 } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { Link } from 'react-router-dom';
import { worldsApi } from '../../services/api.worlds';
import { charactersApi } from '../../services/api.characters';
import type { World, Character } from '../../core/types';

export const UserProfileView = () => {
  const { profile } = useAuth();
  const [activePortfolioTab, setActivePortfolioTab] = useState<'characters' | 'worlds'>('characters');
  const [allWorlds, setAllWorlds] = useState<World[]>([]);
  const [allCharacters, setAllCharacters] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    Promise.all([worldsApi.getAll(), charactersApi.getTrending()])
      .then(([w, c]) => {
        if (!cancelled) {
          setAllWorlds(w);
          setAllCharacters(c);
          setIsLoading(false);
        }
      })
      .catch(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const userId = profile?.id || 'demo-user';
  const displayName = profile?.display_name || 'Wanderer';
  const username = profile?.username || 'wanderer';
  const avatarUrl = profile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=face';
  const bannerUrl = profile?.banner_url || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=400&fit=crop';
  const bio = profile?.bio || 'Exploring the multiverse.';
  const role = profile?.role || 'CITIZEN';
  const reputation = profile?.reputation || 0;
  const joinedAt = profile?.created_at || new Date().toISOString();
  const level = Math.floor(reputation / 100);

  const userCharacters = allCharacters.filter(c => c.authorId === userId);
  const userWorlds = allWorlds.filter(w => w.creatorId === userId);

  return (
    <div className="min-h-screen bg-surface-base animate-fade-in pb-20">
      {/* Banner */}
      <div className="h-56 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-surface-base to-transparent z-10" />
        <img 
          src={bannerUrl} 
          alt="Profile Banner" 
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="max-w-6xl mx-auto px-6 md:px-10">
        {/* Profile Header */}
        <div className="-mt-16 relative z-20 mb-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6">
            <div className="relative">
              <div className="h-28 w-28 rounded-xl overflow-hidden ring-4 ring-surface-base bg-surface-elevated">
                <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 bg-surface-base p-0.5 rounded">
                 <Badge label={`Lv. ${level}`} color="gold" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                   <h1 className="font-serif text-3xl text-text-primary mb-1 flex items-center gap-3">
                     {displayName} 
                     <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-accent-muted text-accent-primary border border-border-accent uppercase tracking-widest">
                       {role}
                     </span>
                   </h1>
                   <p className="text-text-secondary text-sm">@{username} · {reputation} reputation</p>
                </div>
                
                <div className="flex gap-3">
                  <Link to="/studio">
                    <Button variant="outline" icon={Wand2}>Studio</Button>
                  </Link>
                  <Link to="/create">
                    <Button variant="primary" icon={PlusCircle}>Create</Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Left Sidebar: Info & Stats */}
           <div className="space-y-6">
              {/* Bio Card */}
              <div className="bg-surface-elevated border border-border rounded-xl p-6">
                <h3 className="text-[11px] font-semibold text-text-tertiary uppercase tracking-widest mb-4">About</h3>
                <p className="text-text-secondary text-sm leading-relaxed mb-6">
                  {bio}
                </p>
                <div className="text-[11px] text-text-tertiary">
                  Joined {new Date(joinedAt).toLocaleDateString()}
                </div>
              </div>
              
              {/* Stats Card */}
              <div className="bg-surface-elevated border border-border rounded-xl p-6">
                 <h3 className="text-[11px] font-semibold text-text-tertiary uppercase tracking-widest mb-4">Author Impact</h3>
                 <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-3 bg-surface-base rounded-lg">
                      <div className="text-xl font-serif text-text-primary">{userWorlds.length}</div>
                      <div className="text-[10px] text-text-tertiary uppercase tracking-wider mt-1">Worlds</div>
                    </div>
                    <div className="p-3 bg-surface-base rounded-lg">
                      <div className="text-xl font-serif text-text-primary">{userCharacters.length}</div>
                      <div className="text-[10px] text-text-tertiary uppercase tracking-wider mt-1">Entries</div>
                    </div>
                    <div className="p-3 bg-surface-base rounded-lg">
                      <div className="text-xl font-serif text-accent-primary">{reputation}</div>
                      <div className="text-[10px] text-text-tertiary uppercase tracking-wider mt-1">Influence</div>
                    </div>
                 </div>
              </div>
           </div>
           
           {/* Right Column: Portfolio */}
           <div className="lg:col-span-2">
              <div className="flex gap-8 border-b border-border mb-6">
                 <button 
                   onClick={() => setActivePortfolioTab('characters')}
                   className={`pb-3 text-sm transition-colors relative ${activePortfolioTab === 'characters' ? 'text-text-primary font-medium' : 'text-text-tertiary hover:text-text-secondary'}`}
                 >
                   Characters ({userCharacters.length})
                   {activePortfolioTab === 'characters' && <div className="absolute bottom-0 left-0 right-0 h-px bg-accent-primary" />}
                 </button>
                 <button 
                   onClick={() => setActivePortfolioTab('worlds')}
                   className={`pb-3 text-sm transition-colors relative ${activePortfolioTab === 'worlds' ? 'text-text-primary font-medium' : 'text-text-tertiary hover:text-text-secondary'}`}
                 >
                   Worlds ({userWorlds.length})
                   {activePortfolioTab === 'worlds' && <div className="absolute bottom-0 left-0 right-0 h-px bg-accent-primary" />}
                 </button>
              </div>
              
              {activePortfolioTab === 'characters' && (
                <div className="animate-fade-in">
                  {userCharacters.length === 0 ? (
                    <div className="p-12 text-center border border-border rounded-xl">
                      <UserIcon size={28} className="mx-auto text-text-tertiary mb-3" />
                      <p className="text-text-secondary text-sm mb-3">You haven't created any characters yet.</p>
                      <Link to="/create" className="text-sm text-accent-primary hover:underline">Create your first character →</Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {userCharacters.map(c => (
                        <CharacterCard key={c.id} character={c} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activePortfolioTab === 'worlds' && (
                <div className="animate-fade-in">
                  {userWorlds.length === 0 ? (
                    <div className="p-12 text-center border border-border rounded-xl">
                      <Globe size={28} className="mx-auto text-text-tertiary mb-3" />
                      <p className="text-text-secondary text-sm mb-3">You haven't created any worlds yet.</p>
                      <Link to="/create" className="text-sm text-accent-primary hover:underline">Create your first world →</Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {userWorlds.map(w => (
                        <WorldCard key={w.id} world={w} />
                      ))}
                    </div>
                  )}
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};
