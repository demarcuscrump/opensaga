import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wand2, Globe, User, ArrowLeft, ArrowRight, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { Button, Input, TextArea, Select } from '../../components';
import { useAIEngine } from '../../store/aiStore';
import { worldsApi } from '../../services/api.worlds';
import { charactersApi } from '../../services/api.characters';
import { useAuth } from '../../lib/auth';
import type { World } from '../../core/types';

export const CreateView = () => {
  const [creationType, setCreationType] = useState<'WORLD' | 'CHARACTER' | null>(null);
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const aiEngine = useAIEngine();
  const { user } = useAuth();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState('fantasy');
  const [governance, setGovernance] = useState('community');
  const [lore, setLore] = useState('');
  const [archetype, setArchetype] = useState('');
  const [primaryPower, setPrimaryPower] = useState('');
  const [availableWorlds, setAvailableWorlds] = useState<World[]>([]);
  const [selectedWorld, setSelectedWorld] = useState('');
  
  const [isPublishing, setIsPublishing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [published, setPublished] = useState(false);

  // Fetch available worlds for character creation
  React.useEffect(() => {
    worldsApi.getAll().then(worlds => {
      const open = worlds.filter(w => w.status !== 'CLOSED');
      setAvailableWorlds(open);
      if (open.length > 0) setSelectedWorld(open[0].id);
    });
  }, []);

  const reset = () => {
    setCreationType(null);
    setStep(1);
    setName('');
    setDescription('');
    setLore('');
    setArchetype('');
    setPrimaryPower('');
    setPublished(false);
  };

  const handleAutoName = async () => {
    setIsGenerating(true);
    try {
      const result = await aiEngine.generateName(
        `Genre: ${genre}. Type: ${creationType}`,
        creationType === 'WORLD' ? 'WORLD' : 'CHARACTER'
      );
      setName(result);
    } catch { setName(`New ${creationType === 'WORLD' ? 'World' : 'Character'}`); }
    setIsGenerating(false);
  };

  const handleAutoDescription = async () => {
    setIsGenerating(true);
    try {
      const result = await aiEngine.generateDescription(
        `${creationType}: "${name || 'unnamed'}". Genre: ${genre}. Archetype: ${archetype || 'unknown'}.`,
        creationType === 'WORLD' ? 'WORLD' : 'CHARACTER'
      );
      setDescription(result.slice(0, 280));
    } catch { setDescription('A saga waiting to be told...'); }
    setIsGenerating(false);
  };

  const handlePublish = async () => {
    if (!name) return;
    setIsPublishing(true);
    try {
      if (creationType === 'WORLD') {
        const govMap: Record<string, string> = { community: 'COMMUNITY_VOTE', council: 'LOREKEEPER_COUNCIL', creator: 'CREATOR_APPROVED' };
        await worldsApi.create({
          name,
          description,
          genre: [genre],
          governance: govMap[governance] || 'COMMUNITY_VOTE',
          votingThreshold: 60,
          creatorId: user?.id || 'demo-user',
        });
      } else {
        const char = await charactersApi.create({
          worldId: selectedWorld,
          authorId: user?.id || 'demo-user',
          name,
          description,
          archetype,
          powers: primaryPower ? [primaryPower] : [],
        });
        if (char && lore) {
          await charactersApi.submitAsProposal(char.id, lore);
        }
      }
    } catch (e) {
      console.error('Publish failed:', e);
    }
    setIsPublishing(false);
    setPublished(true);
    setTimeout(() => { navigate('/explore'); }, 2000);
  };

  if (!creationType) {
    return (
      <div className="max-w-3xl mx-auto p-6 md:p-10 animate-fade-in">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl md:text-4xl text-text-primary mb-3">
            What will you forge?
          </h2>
          <p className="text-text-secondary text-sm">Choose how you want to contribute to the saga.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            onClick={() => setCreationType('WORLD')}
            className="group relative p-8 bg-surface-elevated border border-border rounded-xl text-left hover:border-border-accent transition-all duration-300 hover:-translate-y-0.5"
          >
            <Globe className="text-accent-primary mb-5" size={32} strokeWidth={1.5} />
            <h3 className="font-serif text-2xl text-text-primary mb-2">New World</h3>
            <p className="text-text-secondary text-sm leading-relaxed">
              Construct a new universe from scratch. Define its laws, geography, and governance.
            </p>
          </button>
          
          <button 
            onClick={() => setCreationType('CHARACTER')}
            className="group relative p-8 bg-surface-elevated border border-border rounded-xl text-left hover:border-border-accent transition-all duration-300 hover:-translate-y-0.5"
          >
            <User className="text-accent-primary mb-5" size={32} strokeWidth={1.5} />
            <h3 className="font-serif text-2xl text-text-primary mb-2">New Character</h3>
            <p className="text-text-secondary text-sm leading-relaxed">
              Birth a new protagonist, villain, or NPC to inhabit an existing world.
            </p>
          </button>
        </div>
      </div>
    );
  }

  if (published) {
    return (
      <div className="max-w-xl mx-auto p-6 md:p-10 animate-fade-in text-center py-20">
        <CheckCircle2 size={48} className="mx-auto text-status-canon mb-4" />
        <h2 className="font-serif text-2xl text-text-primary mb-2">Proposal Submitted!</h2>
        <p className="text-text-secondary text-sm">Your {creationType === 'WORLD' ? 'world' : 'character'} has been submitted for community review. Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-6 md:p-10 animate-fade-in pb-20">
      <div className="flex items-center justify-between mb-10">
        <button onClick={reset} className="text-text-tertiary hover:text-text-primary flex items-center gap-2 text-sm transition-colors">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex items-center gap-1.5">
          <div className={`h-1 w-10 rounded-full transition-colors ${step >= 1 ? 'bg-accent-primary' : 'bg-surface-overlay'}`} />
          <div className={`h-1 w-10 rounded-full transition-colors ${step >= 2 ? 'bg-accent-primary' : 'bg-surface-overlay'}`} />
          <div className={`h-1 w-10 rounded-full transition-colors ${step >= 3 ? 'bg-accent-primary' : 'bg-surface-overlay'}`} />
        </div>
      </div>

      <h2 className="font-serif text-2xl text-text-primary mb-8">
        {step === 1 && `Name your ${creationType === 'WORLD' ? 'World' : 'Character'}`}
        {step === 2 && `Define the ${creationType === 'WORLD' ? 'Details' : 'Traits'}`}
        {step === 3 && 'Final Polish'}
      </h2>

      <div className="space-y-6 bg-surface-elevated p-8 rounded-xl border border-border">
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
             <div className="flex items-end gap-3">
               <div className="flex-1">
                 <Input 
                   label="Name" 
                   value={name}
                   onChange={(e) => setName(e.target.value)}
                   placeholder={creationType === 'WORLD' ? "e.g. Neo-Veridia" : "e.g. Kaelthas Sunstrider"} 
                   icon={creationType === 'WORLD' ? Globe : User}
                 />
               </div>
               <Button variant="outline" className="mb-[1px]" icon={isGenerating ? Loader2 : Wand2} onClick={handleAutoName} disabled={isGenerating}>
                 Auto
               </Button>
             </div>
             <div className="relative">
               <TextArea 
                 label="Short Description" 
                 value={description}
                 onChange={(e) => setDescription(e.target.value)}
                 placeholder="A brief hook (max 280 chars)..." 
                 maxLength={280}
                 className="h-24"
               />
               <button onClick={handleAutoDescription} disabled={isGenerating} className="absolute bottom-3 right-3 p-1.5 bg-surface-overlay text-accent-primary rounded-md hover:bg-surface-subtle transition-colors disabled:opacity-50" title="Generate with AI">
                 {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
               </button>
             </div>
          </div>
        )}

        {step === 2 && creationType === 'WORLD' && (
          <div className="space-y-6 animate-fade-in">
             <Select 
               label="Primary Genre" 
               value={genre}
               onChange={(e) => setGenre(e.target.value)}
               options={[
                 { value: 'cyberpunk', label: 'Cyberpunk' },
                 { value: 'fantasy', label: 'High Fantasy' },
                 { value: 'scifi', label: 'Hard Sci-Fi' },
                 { value: 'steampunk', label: 'Steampunk' },
                 { value: 'solarpunk', label: 'Solarpunk' },
                 { value: 'horror', label: 'Cosmic Horror' },
                 { value: 'postapoc', label: 'Post-Apocalyptic' },
                 { value: 'space', label: 'Space Opera' },
                 { value: 'mythic', label: 'Mythic / Folklore' },
                 { value: 'noir', label: 'Noir / Detective' },
               ]}
             />
             <Select 
               label="Governance Model"
               value={governance}
               onChange={(e) => setGovernance(e.target.value)}
               options={[
                 { value: 'community', label: 'Community Vote (Democracy)' },
                 { value: 'council', label: 'Lorekeeper Council (Oligarchy)' },
                 { value: 'creator', label: 'Creator Approved' },
               ]} 
             />
          </div>
        )}

        {step === 2 && creationType === 'CHARACTER' && (
          <div className="space-y-6 animate-fade-in">
             <Select 
               label="Home World"
               value={selectedWorld}
               onChange={(e) => setSelectedWorld(e.target.value)}
               options={availableWorlds.map(w => ({
                 value: w.id,
                 label: w.name
               }))}
             />
             <Input 
               label="Archetype" 
               placeholder="e.g. Dreamwalker, Smuggler, Oracle" 
               value={archetype}
               onChange={(e) => setArchetype(e.target.value)}
             />
             <Input 
               label="Primary Power / Ability" 
               placeholder="e.g. Umbrakinesis (Shadow control)" 
               value={primaryPower}
               onChange={(e) => setPrimaryPower(e.target.value)}
             />
          </div>
        )}

        {step === 3 && (
           <div className="space-y-6 animate-fade-in">
              <TextArea 
                label="Full Lore"
                value={lore}
                onChange={(e) => setLore(e.target.value)}
                placeholder="Write the full legend here... backstory, relationships, motivations, quirks." 
                className="min-h-[200px]" 
              />
              <p className="text-[11px] text-text-tertiary">This will be submitted as a proposal for community review. Use the Creator Studio for AI-assisted deep worldbuilding.</p>
           </div>
        )}

        <div className="flex justify-between pt-6 border-t border-border">
          {step > 1 ? <Button variant="ghost" onClick={() => setStep(s => s - 1)}>Back</Button> : <div />}
          {step < 3 ? (
             <Button variant="primary" onClick={() => setStep(s => s + 1)} icon={ArrowRight}>Next Step</Button>
          ) : (
             <Button variant="primary" icon={isPublishing ? Loader2 : Save} onClick={handlePublish} disabled={isPublishing || !name}>
               {isPublishing ? 'Publishing...' : 'Publish Proposal'}
             </Button>
          )}
        </div>
      </div>
    </div>
  );
};
