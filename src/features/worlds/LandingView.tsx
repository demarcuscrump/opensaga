import React from 'react';
import { Link } from 'react-router-dom';
import { Globe, ArrowRight, Sparkles, Shield, Users, BookOpen } from 'lucide-react';

export const LandingView = () => {
  return (
    <div className="min-h-[90vh] flex flex-col items-center justify-center animate-fade-in relative px-6">
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-gold/10 blur-[150px] rounded-full pointer-events-none animate-breathe" />

      <div className="text-center max-w-3xl relative z-10">
        {/* Tagline chip */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-brand-gold/40 bg-brand-gold/10 text-sm text-brand-gold mb-10">
          <Sparkles size={14} />
          <span className="font-medium">Open source · Community governed</span>
        </div>
        
        {/* Hero Heading */}
        <h1 className="font-serif text-5xl md:text-7xl text-text-primary mb-6 leading-[1.1] tracking-tight">
          Forge Universes.<br/>
          <span className="text-text-secondary italic">Govern Canon.</span>
        </h1>
        
        <p className="text-lg md:text-xl text-text-secondary mb-14 max-w-xl mx-auto leading-relaxed font-light">
          OpenSaga is where communities collaboratively build, vote on, and evolve shared fictional universes.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            to="/explore" 
            className="w-full sm:w-auto px-8 py-3.5 bg-accent-primary hover:bg-accent-hover text-surface-base font-semibold text-sm rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Globe size={16} />
            Explore Worlds
          </Link>
          <Link 
            to="/create" 
            className="w-full sm:w-auto px-8 py-3.5 border border-border-subtle hover:border-text-tertiary text-text-primary font-medium text-sm rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            Create a Universe
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-px max-w-4xl w-full mt-32 relative z-10 bg-border rounded-xl overflow-hidden">
        <div className="p-8 bg-surface-elevated">
          <BookOpen size={20} className="text-text-secondary mb-5" />
          <h3 className="font-serif text-lg text-text-primary mb-2">The World Bible</h3>
          <p className="text-text-secondary text-sm leading-relaxed">A unified source of truth for your universe's lore, rules, and characters.</p>
        </div>

        <div className="p-8 bg-surface-elevated">
          <Users size={20} className="text-text-secondary mb-5" />
          <h3 className="font-serif text-lg text-text-primary mb-2">Propose & Vote</h3>
          <p className="text-text-secondary text-sm leading-relaxed">Submit characters and lore as proposals. The community votes to establish Canon.</p>
        </div>

        <div className="p-8 bg-surface-elevated">
          <Shield size={20} className="text-text-secondary mb-5" />
          <h3 className="font-serif text-lg text-text-primary mb-2">Governance Models</h3>
          <p className="text-text-secondary text-sm leading-relaxed">Choose Creator Dictatorship, Council, or full Democracy for each world.</p>
        </div>
      </div>
    </div>
  );
};
