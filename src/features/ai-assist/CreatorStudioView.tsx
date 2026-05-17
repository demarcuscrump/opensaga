import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles, Save, PenTool, Settings2, CheckCircle2, Copy,
  User, FileText, GitMerge, Lightbulb, Globe2, Wand2,
  ChevronRight, Send, X, Eye, EyeOff, Loader2, Scroll
} from 'lucide-react';
import { Button } from '../../components';
import { useAIStore, useAIEngine } from '../../store/aiStore';
import type { AIProvider } from './AIEngine';
import { worldsApi } from '../../services/api.worlds';
import type { World } from '../../core/types';
import { useAgents } from '../../hooks/useAgents';
import type { CanonReport, DeepenerResult } from './agents/schemas';

// ─── Types ───────────────────────────────────────────────────────────

type StudioTool = 'character' | 'worldseed' | 'lore' | 'brainstorm' | 'canoncheck';

interface CharacterDraft {
  name: string;
  aliases: string;
  archetype: string;
  species: string;
  age: string;
  pronouns: string;
  appearance: string;
  distinguishingFeatures: string;
  attire: string;
  backstory: string;
  formativeEvents: string;
  secrets: string;
  powers: string;
  limitations: string;
  fears: string;
  desires: string;
  quirks: string;
  speechPattern: string;
}

interface WorldSeedSection {
  key: string;
  title: string;
  placeholder: string;
  content: string;
}

const EMPTY_CHARACTER: CharacterDraft = {
  name: '', aliases: '', archetype: '', species: '', age: '', pronouns: '',
  appearance: '', distinguishingFeatures: '', attire: '',
  backstory: '', formativeEvents: '', secrets: '',
  powers: '', limitations: '',
  fears: '', desires: '', quirks: '', speechPattern: '',
};

const WORLD_SEED_TEMPLATE: WorldSeedSection[] = [
  { key: 'overview', title: 'Overview', placeholder: 'One-paragraph pitch. Genre, tone, themes.', content: '' },
  { key: 'history', title: 'History & Timeline', placeholder: 'Major eras, founding events, wars, discoveries.', content: '' },
  { key: 'geography', title: 'Geography & Regions', placeholder: 'Regions, climate, resources, notable locations.', content: '' },
  { key: 'factions', title: 'Factions & Organizations', placeholder: 'Power structures, alliances, conflicts.', content: '' },
  { key: 'magic', title: 'Magic / Tech System', placeholder: 'Rules, limitations, costs, tiers, visual manifestation.', content: '' },
  { key: 'species', title: 'Species & Races', placeholder: 'Inhabitants, biology, culture, naming conventions.', content: '' },
  { key: 'social', title: 'Social Structure', placeholder: 'Classes, economies, religions, cultures.', content: '' },
  { key: 'tone', title: 'Tone & Rules', placeholder: 'What fits this world, what doesn\'t. Content boundaries.', content: '' },
];

// ─── Auto-save ───────────────────────────────────────────────────────

const DRAFT_KEY = 'opensaga-studio-drafts';

function saveDraftToStorage(tool: StudioTool, data: any) {
  try {
    const all = JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}');
    all[tool] = { data, savedAt: new Date().toISOString() };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(all));
  } catch { /* localStorage full or unavailable */ }
}

function loadDraftFromStorage(tool: StudioTool): any | null {
  try {
    const all = JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}');
    return all[tool]?.data || null;
  } catch { return null; }
}

// ─── Tools Config ────────────────────────────────────────────────────

const TOOLS: { id: StudioTool; icon: any; label: string; desc: string }[] = [
  { id: 'character', icon: User, label: 'Character Forge', desc: 'Deep profiles, stats, and backstories.' },
  { id: 'worldseed', icon: Globe2, label: 'World Seed', desc: 'Structured World Bible editor.' },
  { id: 'lore', icon: FileText, label: 'Lore Crafter', desc: 'Historical events, mythology, rules.' },
  { id: 'brainstorm', icon: Lightbulb, label: 'Brainstorm', desc: 'Plot hooks, faction ideas, arcs.' },
  { id: 'canoncheck', icon: GitMerge, label: 'Canon Check', desc: 'Validate against World Bible.' },
];

// ─── Character Tabs ──────────────────────────────────────────────────

const CHARACTER_TABS = [
  { id: 'identity', label: 'Identity' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'backstory', label: 'Backstory' },
  { id: 'abilities', label: 'Abilities' },
];

// ─── Main Component ──────────────────────────────────────────────────

export const CreatorStudioView = () => {
  const [activeTool, setActiveTool] = useState<StudioTool>('character');
  const [charTab, setCharTab] = useState('identity');
  const [character, setCharacter] = useState<CharacterDraft>(EMPTY_CHARACTER);
  const [worldSections, setWorldSections] = useState<WorldSeedSection[]>(WORLD_SEED_TEMPLATE.map(s => ({ ...s })));
  const [activeSection, setActiveSection] = useState(0);
  const [lorePrompt, setLorePrompt] = useState('');
  const [brainstormPrompt, setBrainstormPrompt] = useState('');
  const [canonCheckInput, setCanonCheckInput] = useState('');
  const [canonCheckBible, setCanonCheckBible] = useState('');
  const [output, setOutput] = useState<string | null>(null);
  const [canonReport, setCanonReport] = useState<CanonReport | null>(null);
  const [deepenerResult, setDeepenerResult] = useState<DeepenerResult | null>(null);
  const agents = useAgents();
  const [brainstormIdeas, setBrainstormIdeas] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [selectedWorld, setSelectedWorld] = useState('');
  const [studioWorlds, setStudioWorlds] = useState<World[]>([]);

  const aiEngine = useAIEngine();

  // Fetch worlds for the world selector
  useEffect(() => {
    worldsApi.getAll().then(setStudioWorlds).catch(() => {});
  }, []);
  const aiStore = useAIStore();

  // Load drafts on mount
  useEffect(() => {
    const charDraft = loadDraftFromStorage('character');
    if (charDraft) setCharacter(charDraft);
    const worldDraft = loadDraftFromStorage('worldseed');
    if (worldDraft) setWorldSections(worldDraft);
  }, []);

  // Auto-save every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      saveDraftToStorage('character', character);
      saveDraftToStorage('worldseed', worldSections);
      setLastSaved(new Date().toLocaleTimeString());
    }, 30000);
    return () => clearInterval(interval);
  }, [character, worldSections]);

  const updateChar = (field: keyof CharacterDraft, value: string) => {
    setCharacter(prev => ({ ...prev, [field]: value }));
  };

  const updateSection = (index: number, content: string) => {
    setWorldSections(prev => prev.map((s, i) => i === index ? { ...s, content } : s));
  };

  // ─── AI Generation Handlers ─────────────────────────────────────

  const handleCharacterAI = async (field: string) => {
    setIsGenerating(true);
    try {
      const context = `Character: ${character.name || 'unnamed'}. Archetype: ${character.archetype || 'unknown'}. Species: ${character.species || 'unknown'}. World: ${selectedWorld || 'unspecified'}.`;
      let result = '';

      if (field === 'name') {
        result = await aiEngine.generateName(context, 'CHARACTER');
        updateChar('name', result);
      } else if (field === 'appearance') {
        result = await aiEngine.generate(
          `Describe the physical appearance of this character in vivid detail. ${context} Include distinguishing features and typical attire.`,
          { maxTokens: 400 }
        );
        updateChar('appearance', result);
      } else if (field === 'backstory') {
        result = await aiEngine.generate(
          `Write a compelling backstory for this character. ${context} Current backstory notes: ${character.backstory || 'none'}. Include formative events and secrets.`,
          { maxTokens: 800 }
        );
        updateChar('backstory', result);
      } else if (field === 'powers') {
        result = await aiEngine.generate(
          `Generate a set of powers/abilities for this character with clear limitations. ${context} Format as: Power Name — Description — Limitation.`,
          { maxTokens: 600 }
        );
        updateChar('powers', result);
      }
      setOutput(result);
    } catch (err: any) {
      setOutput(`Error: ${err.message}`);
    }
    setIsGenerating(false);
  };

  const handleWorldSeedAI = async (sectionIndex: number) => {
    setIsGenerating(true);
    try {
      const section = worldSections[sectionIndex];
      const overviewContext = worldSections[0].content || 'No overview provided yet.';
      const result = await aiEngine.generate(
        `Generate content for the "${section.title}" section of a World Bible. World overview: ${overviewContext}. Current notes for this section: ${section.content || 'empty'}. Be detailed, specific, and internally consistent.`,
        { maxTokens: 1000 }
      );
      updateSection(sectionIndex, result);
      setOutput(result);
    } catch (err: any) {
      setOutput(`Error: ${err.message}`);
    }
    setIsGenerating(false);
  };

  const handleLoreGenerate = async () => {
    if (!lorePrompt) return;
    setIsGenerating(true);
    try {
      const result = await aiEngine.generateLore(lorePrompt, 'CHARACTER');
      setOutput(result);
    } catch (err: any) {
      setOutput(`Error: ${err.message}`);
    }
    setIsGenerating(false);
  };

  const handleBrainstorm = async () => {
    if (!brainstormPrompt) return;
    setIsGenerating(true);
    try {
      const ideas = await aiEngine.brainstorm(brainstormPrompt, 5);
      setBrainstormIdeas(ideas);
      setOutput(ideas.join('\n\n'));
    } catch (err: any) {
      setOutput(`Error: ${err.message}`);
    }
    setIsGenerating(false);
  };

  const handleCanonCheck = async () => {
    if (!canonCheckInput) return;
    setIsGenerating(true);
    setCanonReport(null);
    try {
      const result = await agents.checkCanon(canonCheckInput, selectedWorld || 'manual', canonCheckBible || undefined);
      if (result) {
        setCanonReport(result);
        setOutput(`CANON CHECK — Score: ${result.score}/100 — ${result.recommendation}\n\n${result.summary}`);
      } else {
        setOutput('Canon check returned no result. Check your AI provider configuration.');
      }
    } catch (err: any) {
      setOutput(`Error: ${err.message}`);
    }
    setIsGenerating(false);
  };

  const handleDeepenCharacter = async () => {
    if (!character.name) return;
    setIsGenerating(true);
    setDeepenerResult(null);
    try {
      const concept = `Name: ${character.name}. Archetype: ${character.archetype || 'unknown'}. Species: ${character.species || 'unknown'}. Backstory so far: ${character.backstory || 'none'}. Powers: ${character.powers || 'none'}.`;
      const result = await agents.deepenCharacter(concept, selectedWorld || 'manual', canonCheckBible || undefined);
      if (result) {
        setDeepenerResult(result);
        setOutput(`CHARACTER DEEPENED\n\nBackstory:\n${result.backstory}\n\nRelationships:\n${result.relationships.map(r => `• ${r}`).join('\n')}\n\nPlot Hooks:\n${result.hooks.map(h => `• ${h}`).join('\n')}\n\nQuirks:\n${result.quirks.map(q => `• ${q}`).join('\n')}\n\nWorld Connections:\n${result.worldConnections}`);
      }
    } catch (err: any) {
      setOutput(`Error: ${err.message}`);
    }
    setIsGenerating(false);
  };

  const handleSaveDraft = () => {
    saveDraftToStorage('character', character);
    saveDraftToStorage('worldseed', worldSections);
    setLastSaved(new Date().toLocaleTimeString());
  };

  const copyOutput = () => {
    if (output) navigator.clipboard.writeText(output);
  };

  // ─── Render ─────────────────────────────────────────────────────

  return (
    <div className="flex h-screen overflow-hidden bg-surface-base animate-fade-in pt-16 md:pt-0">

      {/* ── Left Tool Panel ─────────────────────────────────────── */}
      <div className="w-64 border-r border-border bg-surface-elevated flex flex-col h-full shrink-0 hidden lg:flex">
        <div className="p-5 border-b border-border">
          <h2 className="font-serif text-lg text-text-primary flex items-center gap-2">
            <PenTool size={16} className="text-accent-primary" />
            Creator Studio
          </h2>
          <p className="text-[11px] text-text-tertiary mt-1">AI-Powered Worldbuilding Desk</p>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1 no-scrollbar">
          <div className="text-[10px] font-semibold text-text-tertiary uppercase tracking-widest mb-2 px-2">Tools</div>
          {TOOLS.map(tool => (
            <button
              key={tool.id}
              onClick={() => { setActiveTool(tool.id); setOutput(null); }}
              className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all duration-200 ${
                activeTool === tool.id
                  ? 'bg-accent-muted border border-border-accent'
                  : 'hover:bg-surface-overlay border border-transparent'
              }`}
            >
              <tool.icon size={15} className={activeTool === tool.id ? 'text-accent-primary mt-0.5' : 'text-text-tertiary mt-0.5'} />
              <div>
                <div className={`text-sm font-medium ${activeTool === tool.id ? 'text-accent-primary' : 'text-text-primary'}`}>{tool.label}</div>
                <div className="text-[11px] text-text-tertiary leading-snug">{tool.desc}</div>
              </div>
            </button>
          ))}
        </div>

        {/* World Selector */}
        <div className="p-3 border-t border-border">
          <label className="text-[10px] font-semibold text-text-tertiary uppercase tracking-widest block mb-1.5 px-1">Target World</label>
          <select
            value={selectedWorld}
            onChange={e => setSelectedWorld(e.target.value)}
            className="w-full bg-surface-overlay border border-border rounded-lg px-3 py-2 text-xs text-text-primary focus:border-border-accent focus:outline-none"
          >
            <option value="">No world selected</option>
            {studioWorlds.map(w => (
              <option key={w.id} value={w.name}>{w.name}</option>
            ))}
          </select>
        </div>

        {/* AI Status */}
        <div className="p-3 border-t border-border">
          <button onClick={() => setShowSettings(!showSettings)} className="flex items-center justify-between w-full px-2 py-1">
            <div className="flex items-center gap-2 text-xs text-text-secondary">
              <div className={`w-2 h-2 rounded-full ${aiEngine.isConfigured() ? 'bg-green-400 animate-pulse' : 'bg-amber-400'}`} />
              {aiStore.provider === 'mock' ? 'Mock Mode' : `${aiStore.provider} · ${aiStore.model || 'default'}`}
            </div>
            <Settings2 size={13} className="text-text-tertiary" />
          </button>
        </div>
      </div>

      {/* ── Main Content Area ───────────────────────────────────── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">

        {/* Mobile tool bar */}
        <div className="lg:hidden p-3 border-b border-border flex items-center gap-2 overflow-x-auto no-scrollbar">
          {TOOLS.map(tool => (
            <button
              key={tool.id}
              onClick={() => { setActiveTool(tool.id); setOutput(null); }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                activeTool === tool.id ? 'bg-accent-primary text-surface-base' : 'bg-surface-elevated text-text-secondary border border-border'
              }`}
            >
              {tool.label}
            </button>
          ))}
        </div>

        {/* Canvas + Inspector split */}
        <div className="flex-1 flex overflow-hidden">

          {/* ── Canvas (center) ───────────────────────────────── */}
          <div className="flex-1 flex flex-col overflow-hidden border-r border-border">

            {/* ──── CHARACTER FORGE ────────────────────────────── */}
            {activeTool === 'character' && (
              <>
                {/* Tab bar */}
                <div className="border-b border-border px-6 pt-4 flex gap-6">
                  {CHARACTER_TABS.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setCharTab(tab.id)}
                      className={`pb-3 text-sm transition-colors relative ${
                        charTab === tab.id ? 'text-text-primary font-medium' : 'text-text-tertiary hover:text-text-secondary'
                      }`}
                    >
                      {tab.label}
                      {charTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-px bg-accent-primary" />}
                    </button>
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-5 no-scrollbar">
                  {charTab === 'identity' && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="flex gap-4">
                        <FieldGroup label="Name" value={character.name} onChange={v => updateChar('name', v)} placeholder="e.g., Chrome Widow" className="flex-1"
                          onAI={() => handleCharacterAI('name')} isGenerating={isGenerating} />
                        <FieldGroup label="Pronouns" value={character.pronouns} onChange={v => updateChar('pronouns', v)} placeholder="e.g., she/her" className="w-32" />
                      </div>
                      <div className="flex gap-4">
                        <FieldGroup label="Archetype" value={character.archetype} onChange={v => updateChar('archetype', v)} placeholder="e.g., Reluctant Oracle" className="flex-1" />
                        <FieldGroup label="Species / Race" value={character.species} onChange={v => updateChar('species', v)} placeholder="e.g., Human (Augmented)" className="flex-1" />
                      </div>
                      <div className="flex gap-4">
                        <FieldGroup label="Age" value={character.age} onChange={v => updateChar('age', v)} placeholder="e.g., 34" className="w-24" />
                        <FieldGroup label="Aliases / Titles" value={character.aliases} onChange={v => updateChar('aliases', v)} placeholder="e.g., The Fixer, Ghost of Sector 7" className="flex-1" />
                      </div>
                    </div>
                  )}

                  {charTab === 'appearance' && (
                    <div className="space-y-4 animate-fade-in">
                      <FieldGroup label="Physical Description" value={character.appearance} onChange={v => updateChar('appearance', v)}
                        placeholder="Describe their physical appearance in detail..." multiline
                        onAI={() => handleCharacterAI('appearance')} isGenerating={isGenerating} />
                      <FieldGroup label="Distinguishing Features" value={character.distinguishingFeatures} onChange={v => updateChar('distinguishingFeatures', v)}
                        placeholder="Scars, tattoos, cybernetics, unusual traits..." multiline />
                      <FieldGroup label="Typical Attire" value={character.attire} onChange={v => updateChar('attire', v)}
                        placeholder="What they usually wear..." multiline />
                    </div>
                  )}

                  {charTab === 'backstory' && (
                    <div className="space-y-4 animate-fade-in">
                      <FieldGroup label="Origin & Backstory" value={character.backstory} onChange={v => updateChar('backstory', v)}
                        placeholder="Where they come from, how they became who they are..." multiline rows={8}
                        onAI={() => handleCharacterAI('backstory')} isGenerating={isGenerating} />
                      <FieldGroup label="Formative Events" value={character.formativeEvents} onChange={v => updateChar('formativeEvents', v)}
                        placeholder="Key moments that shaped them (one per line)..." multiline rows={4} />
                      <FieldGroup label="Secrets" value={character.secrets} onChange={v => updateChar('secrets', v)}
                        placeholder="What they hide from others..." multiline rows={3} />
                    </div>
                  )}

                  {charTab === 'abilities' && (
                    <div className="space-y-4 animate-fade-in">
                      <FieldGroup label="Powers / Skills" value={character.powers} onChange={v => updateChar('powers', v)}
                        placeholder="List powers with descriptions (one per line)..." multiline rows={6}
                        onAI={() => handleCharacterAI('powers')} isGenerating={isGenerating} />
                      <FieldGroup label="Limitations / Drawbacks" value={character.limitations} onChange={v => updateChar('limitations', v)}
                        placeholder="What are the costs, rules, or weaknesses?" multiline rows={4} />
                      <div className="flex gap-4">
                        <FieldGroup label="Fears" value={character.fears} onChange={v => updateChar('fears', v)} placeholder="What terrifies them?" className="flex-1" multiline rows={2} />
                        <FieldGroup label="Desires" value={character.desires} onChange={v => updateChar('desires', v)} placeholder="What drives them?" className="flex-1" multiline rows={2} />
                      </div>
                      <div className="flex gap-4">
                        <FieldGroup label="Quirks" value={character.quirks} onChange={v => updateChar('quirks', v)} placeholder="Habits, tics, preferences..." className="flex-1" />
                        <FieldGroup label="Speech Pattern" value={character.speechPattern} onChange={v => updateChar('speechPattern', v)} placeholder="Formal, slang, accent..." className="flex-1" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Deepen Character Agent Button */}
                <div className="px-6 py-3 border-t border-border flex items-center justify-between">
                  <p className="text-[10px] text-text-tertiary">Use the <span className="text-accent-primary font-medium">Character Deepener</span> agent to generate backstory, relationships, and plot hooks.</p>
                  <button
                    onClick={handleDeepenCharacter}
                    disabled={!character.name || isGenerating}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-500 transition-all disabled:opacity-50 shrink-0"
                  >
                    {isGenerating ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                    Deepen Character
                  </button>
                </div>
              </>
            )}

            {/* ──── WORLD SEED ─────────────────────────────────── */}
            {activeTool === 'worldseed' && (
              <div className="flex flex-1 overflow-hidden">
                {/* Section nav */}
                <div className="w-52 border-r border-border overflow-y-auto no-scrollbar bg-surface-elevated/50 shrink-0">
                  <div className="p-3">
                    <div className="text-[10px] font-semibold text-text-tertiary uppercase tracking-widest mb-2 px-2">Bible Sections</div>
                    {worldSections.map((section, i) => (
                      <button
                        key={section.key}
                        onClick={() => setActiveSection(i)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-all mb-0.5 ${
                          activeSection === i
                            ? 'bg-accent-muted text-accent-primary font-medium'
                            : 'text-text-secondary hover:bg-surface-overlay'
                        }`}
                      >
                        <Scroll size={12} />
                        <span className="truncate">{section.title}</span>
                        {section.content && <div className="w-1.5 h-1.5 rounded-full bg-green-400 ml-auto shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Section editor */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="p-4 border-b border-border flex items-center justify-between">
                    <h3 className="font-serif text-base text-text-primary">{worldSections[activeSection].title}</h3>
                    <button
                      onClick={() => handleWorldSeedAI(activeSection)}
                      disabled={isGenerating}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-muted border border-border-accent rounded-lg text-xs text-accent-primary hover:bg-accent-primary hover:text-surface-base transition-all disabled:opacity-50"
                    >
                      {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                      {isGenerating ? 'Generating...' : 'Consult the Oracle'}
                    </button>
                  </div>
                  <div className="flex-1 p-4">
                    <textarea
                      value={worldSections[activeSection].content}
                      onChange={e => updateSection(activeSection, e.target.value)}
                      placeholder={worldSections[activeSection].placeholder}
                      className="w-full h-full bg-transparent border-none outline-none resize-none text-text-primary placeholder-text-tertiary text-sm leading-relaxed focus:ring-0"
                    />
                  </div>
                </div>

                {/* World Architect Agent Button */}
                <div className="px-4 py-3 border-t border-border flex items-center justify-between">
                  <p className="text-[10px] text-text-tertiary">Use the <span className="text-accent-primary font-medium">World Architect</span> agent to check this section against all others.</p>
                  <button
                    onClick={async () => {
                      setIsGenerating(true);
                      const allSections: Record<string, string> = {};
                      worldSections.forEach(s => { allSections[s.title] = s.content; });
                      const result = await agents.checkBibleSection(
                        worldSections[activeSection].title,
                        worldSections[activeSection].content,
                        selectedWorld || 'manual',
                        allSections
                      );
                      if (result) {
                        setOutput(`WORLD ARCHITECT — Coherence: ${result.coherenceScore}/100\n\nCross-References:\n${result.crossReferences.map(r => `• ${r}`).join('\n')}\n\nInconsistencies:\n${result.inconsistencies.length > 0 ? result.inconsistencies.map(i => `⚠ ${i}`).join('\n') : '✓ None found'}\n\nSuggestions:\n${result.suggestions.map(s => `→ ${s}`).join('\n')}`);
                      }
                      setIsGenerating(false);
                    }}
                    disabled={!worldSections[activeSection].content || isGenerating}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-500 transition-all disabled:opacity-50 shrink-0"
                  >
                    {isGenerating ? <Loader2 size={13} className="animate-spin" /> : <GitMerge size={13} />}
                    Check Consistency
                  </button>
                </div>
              </div>
            )}

            {/* ──── LORE CRAFTER ───────────────────────────────── */}
            {activeTool === 'lore' && (
              <div className="flex-1 flex flex-col p-6">
                <h3 className="font-serif text-lg text-text-primary mb-4">Lore Crafter</h3>
                <textarea
                  value={lorePrompt}
                  onChange={e => setLorePrompt(e.target.value)}
                  placeholder="Describe the lore you want to create... e.g., 'The founding myth of the Ashenmire Empire, told from the perspective of their enemies.'"
                  className="flex-1 bg-surface-elevated border border-border rounded-xl p-4 text-text-primary placeholder-text-tertiary text-sm leading-relaxed resize-none focus:border-border-accent focus:outline-none"
                />
                <div className="flex justify-end mt-4">
                  <button
                    onClick={handleLoreGenerate}
                    disabled={!lorePrompt || isGenerating}
                    className="flex items-center gap-2 px-5 py-2.5 bg-accent-primary text-surface-base rounded-lg text-sm font-medium hover:bg-accent-hover transition-all disabled:opacity-50"
                  >
                    {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                    {isGenerating ? 'Consulting the Oracle...' : 'Generate Lore'}
                  </button>
                </div>
              </div>
            )}

            {/* ──── BRAINSTORM ─────────────────────────────────── */}
            {activeTool === 'brainstorm' && (
              <div className="flex-1 flex flex-col p-6">
                <h3 className="font-serif text-lg text-text-primary mb-4">Brainstorm Engine</h3>
                <textarea
                  value={brainstormPrompt}
                  onChange={e => setBrainstormPrompt(e.target.value)}
                  placeholder="Enter a premise, question, or 'what if' scenario... e.g., 'What if magic only works in complete darkness?'"
                  className="h-32 bg-surface-elevated border border-border rounded-xl p-4 text-text-primary placeholder-text-tertiary text-sm leading-relaxed resize-none focus:border-border-accent focus:outline-none"
                />
                <div className="flex justify-end mt-4">
                  <button
                    onClick={handleBrainstorm}
                    disabled={!brainstormPrompt || isGenerating}
                    className="flex items-center gap-2 px-5 py-2.5 bg-accent-primary text-surface-base rounded-lg text-sm font-medium hover:bg-accent-hover transition-all disabled:opacity-50"
                  >
                    {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Lightbulb size={14} />}
                    {isGenerating ? 'Brainstorming...' : 'Generate Ideas'}
                  </button>
                </div>
                {brainstormIdeas.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <div className="text-[10px] font-semibold text-text-tertiary uppercase tracking-widest">Ideas</div>
                    {brainstormIdeas.map((idea, i) => (
                      <div key={i} className="p-4 bg-surface-elevated border border-border rounded-xl text-sm text-text-secondary leading-relaxed hover:border-border-accent transition-colors">
                        <span className="text-accent-primary font-medium mr-2">{i + 1}.</span>
                        {idea}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ──── CANON CHECK ────────────────────────────────── */}
            {activeTool === 'canoncheck' && (
              <div className="flex-1 flex flex-col p-6 space-y-4">
                <h3 className="font-serif text-lg text-text-primary">Canon Check</h3>
                <p className="text-xs text-text-tertiary">Paste proposal content and the relevant World Bible to check for consistency.</p>
                <div className="flex-1 flex gap-4">
                  <div className="flex-1 flex flex-col">
                    <label className="text-[10px] font-semibold text-text-tertiary uppercase tracking-widest mb-1.5">Proposal Content</label>
                    <textarea
                      value={canonCheckInput}
                      onChange={e => setCanonCheckInput(e.target.value)}
                      placeholder="Paste the character, lore, or faction proposal here..."
                      className="flex-1 bg-surface-elevated border border-border rounded-xl p-4 text-text-primary placeholder-text-tertiary text-sm leading-relaxed resize-none focus:border-border-accent focus:outline-none"
                    />
                  </div>
                  <div className="flex-1 flex flex-col">
                    <label className="text-[10px] font-semibold text-text-tertiary uppercase tracking-widest mb-1.5">World Bible</label>
                    <textarea
                      value={canonCheckBible}
                      onChange={e => setCanonCheckBible(e.target.value)}
                      placeholder="Paste the World Bible or relevant sections here..."
                      className="flex-1 bg-surface-elevated border border-border rounded-xl p-4 text-text-primary placeholder-text-tertiary text-sm leading-relaxed resize-none focus:border-border-accent focus:outline-none"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleCanonCheck}
                    disabled={!canonCheckInput || isGenerating}
                    className="flex items-center gap-2 px-5 py-2.5 bg-accent-primary text-surface-base rounded-lg text-sm font-medium hover:bg-accent-hover transition-all disabled:opacity-50"
                  >
                    {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    {isGenerating ? 'Analyzing...' : 'Run Canon Check'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Inspector (right) ──────────────────────────────── */}
          <div className="w-80 bg-surface-elevated flex flex-col overflow-hidden shrink-0 hidden xl:flex">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-medium text-text-primary">
                {output ? 'Oracle Output' : 'Inspector'}
              </h3>
              <div className="flex gap-1">
                {output && (
                  <button onClick={copyOutput} className="p-1.5 text-text-tertiary hover:text-text-primary rounded transition-colors" title="Copy">
                    <Copy size={13} />
                  </button>
                )}
                <button onClick={handleSaveDraft} className="p-1.5 text-text-tertiary hover:text-text-primary rounded transition-colors" title="Save Draft">
                  <Save size={13} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
              {isGenerating ? (
                <div className="h-48 flex flex-col items-center justify-center text-text-tertiary space-y-3">
                  <Sparkles size={24} className="animate-breathe text-accent-primary" />
                  <p className="text-xs animate-pulse">Consulting the Oracle...</p>
                </div>
              ) : canonReport ? (
                <div className="space-y-4 animate-fade-in">
                  {/* Score Badge */}
                  <div className="text-center">
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
                      canonReport.score >= 80 ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                      canonReport.score >= 60 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {canonReport.score >= 80 ? <CheckCircle2 size={14} /> : <GitMerge size={14} />}
                      Canon Score: {canonReport.score}/100
                    </div>
                    <p className={`text-[10px] mt-1.5 font-medium uppercase tracking-widest ${
                      canonReport.recommendation === 'APPROVE' ? 'text-green-400' :
                      canonReport.recommendation === 'APPROVE_WITH_EDITS' ? 'text-amber-400' : 'text-red-400'
                    }`}>{canonReport.recommendation.replace(/_/g, ' ')}</p>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">{canonReport.summary}</p>
                  {canonReport.consistent.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-semibold text-green-400 uppercase tracking-widest mb-1">✓ Consistent</h4>
                      {canonReport.consistent.map((c, i) => <p key={i} className="text-xs text-text-secondary mb-0.5">• {c}</p>)}
                    </div>
                  )}
                  {canonReport.concerns.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-semibold text-amber-400 uppercase tracking-widest mb-1">⚠ Concerns</h4>
                      {canonReport.concerns.map((c, i) => <p key={i} className="text-xs text-text-secondary mb-0.5">• {c}</p>)}
                    </div>
                  )}
                  {canonReport.contradictions.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-semibold text-red-400 uppercase tracking-widest mb-1">✕ Contradictions</h4>
                      {canonReport.contradictions.map((c, i) => <p key={i} className="text-xs text-text-secondary mb-0.5">• {c}</p>)}
                    </div>
                  )}
                  <button onClick={() => { setCanonReport(null); setOutput(null); }} className="text-[10px] text-text-tertiary hover:text-text-primary mt-2">← Clear report</button>
                </div>
              ) : deepenerResult ? (
                <div className="space-y-4 animate-fade-in">
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      <Sparkles size={14} />
                      Character Deepened
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-semibold text-text-tertiary uppercase tracking-widest mb-1">Backstory</h4>
                    <p className="text-xs text-text-secondary leading-relaxed">{deepenerResult.backstory}</p>
                  </div>
                  {deepenerResult.relationships.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-semibold text-text-tertiary uppercase tracking-widest mb-1">Relationships</h4>
                      {deepenerResult.relationships.map((r, i) => <p key={i} className="text-xs text-text-secondary mb-0.5">• {r}</p>)}
                    </div>
                  )}
                  {deepenerResult.hooks.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-semibold text-accent-primary uppercase tracking-widest mb-1">Plot Hooks</h4>
                      {deepenerResult.hooks.map((h, i) => <p key={i} className="text-xs text-text-secondary mb-0.5">→ {h}</p>)}
                    </div>
                  )}
                  {deepenerResult.quirks.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-semibold text-text-tertiary uppercase tracking-widest mb-1">Quirks</h4>
                      {deepenerResult.quirks.map((q, i) => <p key={i} className="text-xs text-text-secondary mb-0.5">• {q}</p>)}
                    </div>
                  )}
                  {deepenerResult.worldConnections && (
                    <div>
                      <h4 className="text-[10px] font-semibold text-text-tertiary uppercase tracking-widest mb-1">World Connections</h4>
                      <p className="text-xs text-text-secondary leading-relaxed">{deepenerResult.worldConnections}</p>
                    </div>
                  )}
                  <button onClick={() => { setDeepenerResult(null); setOutput(null); }} className="text-[10px] text-text-tertiary hover:text-text-primary mt-2">← Clear result</button>
                </div>
              ) : output ? (
                <div className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                  {output}
                </div>
              ) : activeTool === 'character' ? (
                <CharacterPreview character={character} />
              ) : activeTool === 'worldseed' ? (
                <WorldSeedPreview sections={worldSections} />
              ) : (
                <div className="h-48 flex flex-col items-center justify-center text-text-tertiary space-y-2">
                  <Wand2 size={20} strokeWidth={1} />
                  <p className="text-xs">Oracle output will appear here</p>
                </div>
              )}
            </div>

            {/* Status bar */}
            <div className="p-3 border-t border-border text-[11px] text-text-tertiary flex items-center justify-between">
              <span>{lastSaved ? `Saved ${lastSaved}` : 'Not saved yet'}</span>
              <span>{aiStore.provider === 'mock' ? 'Mock mode' : aiStore.provider}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── AI Settings Modal ────────────────────────────────────── */}
      {showSettings && <AISettingsPanel onClose={() => setShowSettings(false)} />}
    </div>
  );
};

// ─── Sub-Components ──────────────────────────────────────────────────

function FieldGroup({ label, value, onChange, placeholder, className, multiline, rows, onAI, isGenerating }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string;
  className?: string; multiline?: boolean; rows?: number;
  onAI?: () => void; isGenerating?: boolean;
}) {
  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-[10px] font-semibold text-text-tertiary uppercase tracking-widest">{label}</label>
        {onAI && (
          <button
            onClick={onAI}
            disabled={isGenerating}
            className="flex items-center gap-1 text-[10px] text-accent-primary hover:underline disabled:opacity-50"
          >
            {isGenerating ? <Loader2 size={10} className="animate-spin" /> : <Wand2 size={10} />}
            AI
          </button>
        )}
      </div>
      {multiline ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows || 3}
          className="w-full bg-surface-overlay border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-tertiary resize-none focus:border-border-accent focus:outline-none leading-relaxed"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-surface-overlay border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-tertiary focus:border-border-accent focus:outline-none"
        />
      )}
    </div>
  );
}

function CharacterPreview({ character }: { character: CharacterDraft }) {
  const hasContent = character.name || character.archetype;
  if (!hasContent) return (
    <div className="text-center text-text-tertiary py-10 space-y-2">
      <User size={24} strokeWidth={1} className="mx-auto" />
      <p className="text-xs">Fill in the Identity tab to see a preview</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-surface-overlay border border-border flex items-center justify-center text-2xl font-serif text-accent-primary mb-3">
          {character.name?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <h4 className="font-serif text-base text-text-primary">{character.name || 'Unnamed'}</h4>
        {character.archetype && <p className="text-xs text-text-tertiary">{character.archetype}</p>}
        {character.species && <p className="text-[11px] text-text-tertiary">{character.species} · {character.age || '?'}</p>}
      </div>
      {character.appearance && (
        <div>
          <div className="text-[10px] font-semibold text-text-tertiary uppercase tracking-widest mb-1">Appearance</div>
          <p className="text-xs text-text-secondary leading-relaxed line-clamp-4">{character.appearance}</p>
        </div>
      )}
      {character.powers && (
        <div>
          <div className="text-[10px] font-semibold text-text-tertiary uppercase tracking-widest mb-1">Powers</div>
          <p className="text-xs text-text-secondary leading-relaxed line-clamp-4">{character.powers}</p>
        </div>
      )}
      {character.backstory && (
        <div>
          <div className="text-[10px] font-semibold text-text-tertiary uppercase tracking-widest mb-1">Backstory</div>
          <p className="text-xs text-text-secondary leading-relaxed line-clamp-6">{character.backstory}</p>
        </div>
      )}
    </div>
  );
}

function WorldSeedPreview({ sections }: { sections: WorldSeedSection[] }) {
  const filled = sections.filter(s => s.content);
  return (
    <div className="space-y-3">
      <div className="text-[10px] font-semibold text-text-tertiary uppercase tracking-widest">Bible Completion</div>
      <div className="text-sm text-text-primary font-medium">{filled.length} / {sections.length} sections</div>
      <div className="space-y-1.5">
        {sections.map(s => (
          <div key={s.key} className="flex items-center gap-2 text-xs">
            <div className={`w-2 h-2 rounded-full ${s.content ? 'bg-green-400' : 'bg-surface-overlay border border-border'}`} />
            <span className={s.content ? 'text-text-primary' : 'text-text-tertiary'}>{s.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AISettingsPanel({ onClose }: { onClose: () => void }) {
  const store = useAIStore();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface-elevated border border-border rounded-2xl w-full max-w-md p-6 space-y-5 animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-lg text-text-primary">AI Settings</h3>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-primary"><X size={18} /></button>
        </div>

        <div>
          <label className="text-[10px] font-semibold text-text-tertiary uppercase tracking-widest block mb-1.5">Provider</label>
          <select
            value={store.provider}
            onChange={e => store.setProvider(e.target.value as AIProvider)}
            className="w-full bg-surface-overlay border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:border-border-accent focus:outline-none"
          >
            <option value="mock">Mock (Offline Demo)</option>
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
            <option value="ollama">Ollama (Local)</option>
            <option value="openrouter">OpenRouter</option>
          </select>
        </div>

        {store.provider !== 'mock' && store.provider !== 'ollama' && (
          <div>
            <label className="text-[10px] font-semibold text-text-tertiary uppercase tracking-widest block mb-1.5">API Key</label>
            <input
              type="password"
              value={store.apiKey}
              onChange={e => store.setApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full bg-surface-overlay border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:border-border-accent focus:outline-none"
            />
            <p className="text-[11px] text-text-tertiary mt-1">Stored locally in your browser. Never sent to our servers.</p>
          </div>
        )}

        <div>
          <label className="text-[10px] font-semibold text-text-tertiary uppercase tracking-widest block mb-1.5">Model</label>
          <input
            type="text"
            value={store.model}
            onChange={e => store.setModel(e.target.value)}
            placeholder="e.g., gpt-4o"
            className="w-full bg-surface-overlay border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:border-border-accent focus:outline-none"
          />
        </div>

        {store.provider === 'ollama' && (
          <div>
            <label className="text-[10px] font-semibold text-text-tertiary uppercase tracking-widest block mb-1.5">Endpoint</label>
            <input
              type="text"
              value={store.endpoint}
              onChange={e => store.setEndpoint(e.target.value)}
              placeholder="http://localhost:11434"
              className="w-full bg-surface-overlay border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:border-border-accent focus:outline-none"
            />
          </div>
        )}

        <button onClick={onClose} className="w-full bg-accent-primary text-surface-base py-2.5 rounded-lg text-sm font-medium hover:bg-accent-hover transition-all">
          Save Settings
        </button>
      </div>
    </div>
  );
}
