import React, { useState, useEffect, useMemo } from 'react';
import { Search, TrendingUp, Globe, Users, Loader2 } from 'lucide-react';
import { WorldCard, CharacterCard } from '../../components';
import { worldsApi } from '../../services/api.worlds';
import { charactersApi } from '../../services/api.characters';
import type { World, Character } from '../../core/types';

export const DiscoveryView = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'worlds' | 'characters'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGenre, setActiveGenre] = useState<string | null>(null);
  const [worlds, setWorlds] = useState<World[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    Promise.all([worldsApi.getAll(), charactersApi.getTrending()])
      .then(([w, c]) => {
        if (!cancelled) {
          setWorlds(w);
          setCharacters(c);
          setIsLoading(false);
        }
      })
      .catch(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const allGenres = useMemo(() => {
    const set = new Set<string>();
    worlds.forEach(w => w.genre.forEach(g => set.add(g)));
    return Array.from(set).sort();
  }, [worlds]);

  const filteredWorlds = useMemo(() => {
    let list = [...worlds];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(w =>
        w.name.toLowerCase().includes(q) ||
        w.description.toLowerCase().includes(q) ||
        w.genre.some(g => g.toLowerCase().includes(q))
      );
    }
    if (activeGenre) {
      list = list.filter(w => w.genre.includes(activeGenre));
    }
    return list;
  }, [worlds, searchQuery, activeGenre]);

  const filteredCharacters = useMemo(() => {
    let list = [...characters];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.archetype.toLowerCase().includes(q)
      );
    }
    if (activeGenre) {
      const worldIds = worlds.filter(w => w.genre.includes(activeGenre)).map(w => w.id);
      list = list.filter(c => worldIds.includes(c.worldId));
    }
    return list.sort((a, b) => (b.votes.up - b.votes.down) - (a.votes.up - a.votes.down));
  }, [characters, worlds, searchQuery, activeGenre]);

  const totalCitizens = worlds.reduce((sum, w) => sum + w.memberCount, 0);
  const totalEntries = worlds.reduce((sum, w) => sum + w.characterCount, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={28} className="animate-spin text-accent-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 space-y-8 animate-fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="font-serif text-3xl md:text-4xl text-text-primary mb-2">Explore</h2>
          <p className="text-text-secondary text-sm">
            {worlds.length} universes · {totalEntries} canon entries · {totalCitizens} citizens
          </p>
        </div>
        <div className="flex items-center gap-2 bg-surface-elevated border border-border rounded-lg px-3 w-full md:w-auto md:min-w-[320px]">
          <Search size={15} className="text-text-tertiary shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search worlds, characters, genres..."
            className="bg-transparent border-none outline-none text-sm text-text-primary placeholder-text-tertiary w-full py-2.5"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-text-tertiary hover:text-text-primary text-xs shrink-0">Clear</button>
          )}
        </div>
      </div>

      {/* Genre Filter Pills */}
      {allGenres.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveGenre(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              !activeGenre ? 'bg-accent-primary text-surface-base' : 'bg-surface-elevated text-text-secondary border border-border hover:border-border-accent'
            }`}
          >
            All Genres
          </button>
          {allGenres.map(genre => (
            <button
              key={genre}
              onClick={() => setActiveGenre(activeGenre === genre ? null : genre)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeGenre === genre ? 'bg-accent-primary text-surface-base' : 'bg-surface-elevated text-text-secondary border border-border hover:border-border-accent'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-8">
          {(['all', 'worlds', 'characters'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm capitalize transition-colors relative ${
                activeTab === tab ? 'text-text-primary font-medium' : 'text-text-tertiary hover:text-text-secondary'
              }`}
            >
              {tab === 'all' ? 'All' : tab === 'worlds' ? `Worlds (${filteredWorlds.length})` : `Characters (${filteredCharacters.length})`}
              {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-px bg-accent-primary" />}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-12">
        {(activeTab === 'all' || activeTab === 'worlds') && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <Globe size={18} className="text-text-tertiary" />
              <h3 className="font-serif text-xl text-text-primary">
                {activeGenre ? `${activeGenre} Worlds` : 'Featured Worlds'}
              </h3>
            </div>
            {filteredWorlds.length === 0 ? (
              <div className="p-12 text-center border border-border rounded-xl">
                <Globe size={28} className="mx-auto text-text-tertiary mb-3" />
                <p className="text-text-secondary text-sm">No worlds match your search.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredWorlds.map(world => (
                  <WorldCard key={world.id} world={world} />
                ))}
              </div>
            )}
          </section>
        )}

        {(activeTab === 'all' || activeTab === 'characters') && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp size={18} className="text-text-tertiary" />
              <h3 className="font-serif text-xl text-text-primary">Trending Characters</h3>
            </div>
            {filteredCharacters.length === 0 ? (
              <div className="p-12 text-center border border-border rounded-xl">
                <Users size={28} className="mx-auto text-text-tertiary mb-3" />
                <p className="text-text-secondary text-sm">No characters match your search.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCharacters.map(char => (
                  <CharacterCard key={char.id} character={char} worldName={worlds.find(w => w.id === char.worldId)?.name} />
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};
