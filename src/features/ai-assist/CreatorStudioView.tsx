import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles, Save, PenTool, Settings2, CheckCircle2, Copy,
  User, FileText, GitMerge, Lightbulb, Globe2, Wand2,
  X, Eye, Loader2, Scroll, Upload, Dna
} from 'lucide-react';
import { useAIStore, useAIEngine } from '../../store/aiStore';
import type { AIProvider } from './AIEngine';
import { worldsApi } from '../../services/api.worlds';
import type { World } from '../../core/types';
import { useAgents } from '../../hooks/useAgents';
import { CHARACTER_BOARD_SECTIONS, CREATION_DNA_GENRE_GUIDE } from './agents/schemas';
import type { CanonReport, CharacterBoardSectionId, CreationDnaReport, DeepenerResult } from './agents/schemas';
import type { VisionAnalysis } from './agents/orchestrator';
import { AgentDebugPanel } from './AgentDebugPanel';
import { AgentErrorBoundary } from './AgentErrorBoundary';
import { CharacterExport } from './CharacterExport';
import { RateLimiter } from './agents/rate-limiter';

// ─── Types ───────────────────────────────────────────────────────────

type StudioTool = 'character' | 'worldseed' | 'lore' | 'brainstorm' | 'canoncheck' | 'dna';

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

interface CreationDnaVaultEntry extends CreationDnaReport {
  id: string;
  name: string;
  humanNotes: string;
  savedAt: string;
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
const DNA_VAULT_KEY = 'opensaga-creation-dna-vault';
const DEFAULT_CHARACTER_BOARD_SECTIONS: CharacterBoardSectionId[] = [
  'coreIdentity',
  'physicalAppearance',
  'personality',
  'background',
  'motivation',
  'skills',
  'relationships',
  'voiceStyle',
  'visualMotifs',
  'storyRole',
  'canonNotes',
];

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

function normalizeBoardSections(value: unknown): CharacterBoardSectionId[] {
  if (!Array.isArray(value)) return DEFAULT_CHARACTER_BOARD_SECTIONS;
  const valid = new Set(CHARACTER_BOARD_SECTIONS.map(section => section.id));
  const next = value.filter((id): id is CharacterBoardSectionId => typeof id === 'string' && valid.has(id as CharacterBoardSectionId));
  return next.length > 0 ? next : DEFAULT_CHARACTER_BOARD_SECTIONS;
}

function loadDnaVaultFromStorage(): CreationDnaVaultEntry[] {
  try {
    const stored = localStorage.getItem(DNA_VAULT_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveDnaVaultToStorage(entries: CreationDnaVaultEntry[]) {
  try {
    localStorage.setItem(DNA_VAULT_KEY, JSON.stringify(entries.slice(0, 50)));
  } catch { /* localStorage full or unavailable */ }
}

function makeDnaName(idea: string) {
  const clean = idea.replace(/\s+/g, ' ').trim();
  return clean.length > 46 ? `${clean.slice(0, 43)}...` : clean || 'Untitled DNA';
}

function overlapScore(a: string[], b: string[]) {
  const left = new Set(a);
  const right = new Set(b);
  const shared = [...left].filter(tag => right.has(tag)).length;
  const total = new Set([...a, ...b]).size || 1;
  return shared / total;
}

function scoreDnaSimilarity(report: CreationDnaReport, entry: CreationDnaVaultEntry) {
  return Math.min(1,
    overlapScore(report.genre, entry.genre) * 0.28 +
    overlapScore(report.emotion, entry.emotion) * 0.24 +
    overlapScore(report.vibe, entry.vibe) * 0.2 +
    (report.scale === entry.scale ? 0.14 : 0) +
    (report.power === entry.power ? 0.14 : 0)
  );
}

function isRareDnaCombo(report: CreationDnaReport) {
  return (
    (report.vibe.includes('Cozy') && report.vibe.includes('Brutal')) ||
    (report.genre.includes('Slice-of-Life With a Twist') && report.scale === 'World/Cosmic') ||
    (report.emotion.includes('Love') && report.power === 'Tech-driven' && report.vibe.includes('Minimalist'))
  );
}

function evaluateDnaAgainstVault(report: CreationDnaReport, vault: CreationDnaVaultEntry[]): CreationDnaReport {
  const similar = vault
    .map(entry => ({
      name: entry.name,
      score: Number(scoreDnaSimilarity(report, entry).toFixed(2)),
      pitch: entry.pitch,
    }))
    .filter(match => match.score >= 0.45)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  if (similar[0]?.score >= 0.72) {
    return {
      ...report,
      similar,
      comboStatus: 'NEAR_MATCH',
      comboNotes: `Near-match found in your DNA vault: ${similar[0].name}. Use the differentiators before saving.`,
    };
  }

  if (isRareDnaCombo(report)) {
    return {
      ...report,
      similar,
      comboStatus: 'RARE',
      comboNotes: 'Rare DNA combo. Lean into the contrast and make the rules concrete.',
    };
  }

  return {
    ...report,
    similar,
    comboStatus: 'UNIQUE',
    comboNotes: similar.length > 0
      ? 'Distinct from saved DNA, with a few adjacent ideas worth checking.'
      : 'Unique against your local DNA vault.',
  };
}

function buildOfflineCreationDnaReport(idea: string): CreationDnaReport {
  const text = idea.toLowerCase();
  const genre: CreationDnaReport['genre'] = text.match(/neon|cyber|tech|augmented/)
    ? ['Cyberpunk / Tech-Noir', 'Grounded Combat / Martial Realism']
    : text.match(/sport|team|match|tournament|rival|athlete|soccer|football|basketball|baseball|volleyball|boxing|race|coach|training/)
      ? ['Sports / Competitive Team Drama']
      : text.match(/fight|hitman|assassin|combat/)
      ? ['Grounded Combat / Martial Realism', 'Stylish Action']
      : text.match(/creature|monster|companion|partner/)
        ? ['Creature / Companion Adventure']
        : text.match(/frontier|bounty|space|western/)
          ? ['Sci-Fi Western / Space Frontier']
          : ['Epic Adventure / World-Saga'];
  const emotion: CreationDnaReport['emotion'] = text.match(/daughter|family|friend|crew/)
    ? ['Found Family', 'Redemption']
    : text.match(/revenge|betray/)
      ? ['Revenge', 'Survival']
      : ['Ambition'];
  const scale: CreationDnaReport['scale'] = text.match(/cosmic|world|planet/) ? 'World/Cosmic' : text.match(/city|kingdom/) ? 'City/Regional' : 'Street-level';
  const power: CreationDnaReport['power'] = text.match(/magic|spirit|curse/) ? 'Mystical/Spiritual' : text.match(/cyber|tech|augmented/) ? 'Tech-driven' : 'Pure Skill';
  const vibe: CreationDnaReport['vibe'] = text.match(/neon|cyber/)
    ? ['Sleek/Neon', 'Brutal', 'Gritty']
    : ['Stylish', 'Gritty'];

  return {
    idea,
    genre,
    emotion,
    scale,
    power,
    vibe,
    anchors: ['Cyberpunk: Edgerunners', 'Akudama Drive', 'John Wick'],
    similar: [],
    comboStatus: 'UNTESTED',
    comboNotes: 'Offline DNA draft. Connect an AI provider for deeper anchors and differentiators.',
    differentiators: [
      'Move one expected role into the opposite character.',
      'Give the central power or skill a cost that changes relationships.',
      'Anchor the conflict in a personal ritual, place, or rule only this world has.',
    ],
    pitch: makeDnaName(idea),
  };
}

// ─── Tools Config ────────────────────────────────────────────────────

const TOOLS: { id: StudioTool; icon: any; label: string; desc: string }[] = [
  { id: 'character', icon: User, label: 'Character Forge', desc: 'Deep profiles, stats, and backstories.' },
  { id: 'worldseed', icon: Globe2, label: 'World Seed', desc: 'Structured World Bible editor.' },
  { id: 'dna', icon: Dna, label: 'Creation DNA', desc: 'Tag originality before it becomes canon.' },
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
  const [selectedBoardSections, setSelectedBoardSections] = useState<CharacterBoardSectionId[]>(DEFAULT_CHARACTER_BOARD_SECTIONS);
  const [worldSections, setWorldSections] = useState<WorldSeedSection[]>(WORLD_SEED_TEMPLATE.map(s => ({ ...s })));
  const [activeSection, setActiveSection] = useState(0);
  const [lorePrompt, setLorePrompt] = useState('');
  const [brainstormPrompt, setBrainstormPrompt] = useState('');
  const [canonCheckInput, setCanonCheckInput] = useState('');
  const [canonCheckBible, setCanonCheckBible] = useState('');
  const [dnaIdea, setDnaIdea] = useState('');
  const [dnaReport, setDnaReport] = useState<CreationDnaReport | null>(null);
  const [dnaReviewNotes, setDnaReviewNotes] = useState('');
  const [dnaVault, setDnaVault] = useState<CreationDnaVaultEntry[]>([]);
  const [output, setOutput] = useState<string | null>(null);
  const [canonReport, setCanonReport] = useState<CanonReport | null>(null);
  const [deepenerResult, setDeepenerResult] = useState<DeepenerResult | null>(null);
  const agents = useAgents();
  const [brainstormIdeas, setBrainstormIdeas] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [charImagePreview, setCharImagePreview] = useState<string | null>(null);
  const [charImageBase64, setCharImageBase64] = useState<string | null>(null);
  const [charImageMime, setCharImageMime] = useState<string>('image/png');
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [visionResult, setVisionResult] = useState<VisionAnalysis | null>(null);
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
    if (charDraft) {
      if (charDraft.character) {
        setCharacter(charDraft.character);
        setSelectedBoardSections(normalizeBoardSections(charDraft.boardSections));
      } else {
        setCharacter(charDraft);
      }
    }
    const worldDraft = loadDraftFromStorage('worldseed');
    if (worldDraft) setWorldSections(worldDraft);
    const dnaDraft = loadDraftFromStorage('dna');
    if (dnaDraft?.idea) setDnaIdea(dnaDraft.idea);
    if (dnaDraft?.reviewNotes) setDnaReviewNotes(dnaDraft.reviewNotes);
    setDnaVault(loadDnaVaultFromStorage());
  }, []);

  // Auto-save every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      saveDraftToStorage('character', { character, boardSections: selectedBoardSections });
      saveDraftToStorage('worldseed', worldSections);
      saveDraftToStorage('dna', { idea: dnaIdea, reviewNotes: dnaReviewNotes });
      setLastSaved(new Date().toLocaleTimeString());
    }, 30000);
    return () => clearInterval(interval);
  }, [character, selectedBoardSections, worldSections, dnaIdea, dnaReviewNotes]);

  // Keyboard shortcuts (per CREATOR_STUDIO_PRD.md §Keyboard Shortcuts)
  useEffect(() => {
    const toolKeys: Record<string, StudioTool> = { '1': 'character', '2': 'lore', '3': 'brainstorm', '4': 'canoncheck', '5': 'worldseed', '6': 'dna' };
    const handler = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      // Cmd+S — Save draft
      if (isMod && e.key === 's') {
        e.preventDefault();
        saveDraftToStorage('character', { character, boardSections: selectedBoardSections });
        saveDraftToStorage('worldseed', worldSections);
        saveDraftToStorage('dna', { idea: dnaIdea, reviewNotes: dnaReviewNotes });
        setLastSaved(new Date().toLocaleTimeString());
      }
      // Cmd+Enter — Generate (trigger active AI action)
      if (isMod && e.key === 'Enter' && !isGenerating) {
        e.preventDefault();
        if (activeTool === 'character') handleDeepenCharacter();
        else if (activeTool === 'canoncheck') handleCanonCheck();
        else if (activeTool === 'brainstorm') handleBrainstorm();
        else if (activeTool === 'lore') handleLoreGenerate();
        else if (activeTool === 'dna') handleCreationDnaAnalyze();
      }
      // Cmd+Shift+P — Submit as Proposal (placeholder — shows toast)
      if (isMod && e.shiftKey && e.key === 'p') {
        e.preventDefault();
        setOutput('Submit as Proposal flow coming soon. Your draft has been saved.');
        saveDraftToStorage('character', { character, boardSections: selectedBoardSections });
        saveDraftToStorage('dna', { idea: dnaIdea, reviewNotes: dnaReviewNotes });
      }
      // Cmd+1-6 — Switch tool
      if (isMod && toolKeys[e.key]) {
        e.preventDefault();
        setActiveTool(toolKeys[e.key]);
      }
      // Escape — Close settings / exit focus
      if (e.key === 'Escape') {
        if (showSettings) setShowSettings(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [character, selectedBoardSections, worldSections, dnaIdea, dnaReviewNotes, showSettings, activeTool, isGenerating, dnaVault]);

  const updateChar = (field: keyof CharacterDraft, value: string) => {
    setCharacter(prev => ({ ...prev, [field]: value }));
  };

  const toggleBoardSection = (sectionId: CharacterBoardSectionId) => {
    setSelectedBoardSections(prev => {
      if (prev.includes(sectionId)) {
        return prev.length === 1 ? prev : prev.filter(id => id !== sectionId);
      }
      return [...prev, sectionId];
    });
  };

  // ─── Image Upload + Vision Analysis ─────────────────────────────

  const handleImageUpload = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setCharImageMime(file.type);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setCharImagePreview(dataUrl);
      // Extract base64 from data URL
      const base64 = dataUrl.split(',')[1];
      setCharImageBase64(base64);
      setVisionResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleImageUpload(file);
  };

  const handleVisionAnalyze = async () => {
    if (!charImageBase64) return;
    setIsAnalyzingImage(true);
    setVisionResult(null);
    try {
      const result = await agents.analyzeCharacterImage(charImageBase64, charImageMime);
      if (result) {
        setVisionResult(result);
        // Auto-populate character fields (only fill empty fields, don't overwrite user input)
        setCharacter(prev => ({
          ...prev,
          name: prev.name || result.suggestedName || '',
          archetype: prev.archetype || result.archetype || '',
          species: prev.species || result.species || '',
          age: prev.age || result.age || '',
          pronouns: prev.pronouns || result.pronouns || '',
          appearance: prev.appearance || result.appearance || '',
          distinguishingFeatures: prev.distinguishingFeatures || result.distinguishingFeatures || '',
          attire: prev.attire || result.attire || '',
          powers: prev.powers || result.powers || '',
          quirks: prev.quirks || result.personality || '',
        }));
        setOutput(`VISION ANALYSIS — Character identified\n\nSuggested Name: ${result.suggestedName}\nArchetype: ${result.archetype}\nSpecies: ${result.species}\nWorld Hints: ${result.worldHints}\n\nAll empty fields have been auto-populated. Edit any field to customize.`);
      }
    } catch (err: any) {
      setOutput(`The Oracle could not read this image. ${err.message || 'Try again in a moment.'}`);
    }
    setIsAnalyzingImage(false);
  };

  const clearCharImage = () => {
    setCharImagePreview(null);
    setCharImageBase64(null);
    setVisionResult(null);
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
      setOutput(`The Oracle is resting. ${err.message || 'Try again in a moment.'}`);
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
      setOutput(`The Oracle is resting. ${err.message || 'Try again in a moment.'}`);
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
      setOutput(`The Oracle is resting. ${err.message || 'Try again in a moment.'}`);
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
      setOutput(`The Oracle is resting. ${err.message || 'Try again in a moment.'}`);
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
      setOutput(`The Oracle is resting. ${err.message || 'Try again in a moment.'}`);
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
      setOutput(`The Oracle is resting. ${err.message || 'Try again in a moment.'}`);
    }
    setIsGenerating(false);
  };

  const handleCreationDnaAnalyze = async () => {
    const idea = dnaIdea.trim();
    if (!idea) return;
    setIsGenerating(true);
    setDnaReport(null);
    setCanonReport(null);
    setDeepenerResult(null);
    try {
      const agentResult = agents.isConfigured ? await agents.analyzeCreationDna(idea) : null;
      const baseReport = agentResult || buildOfflineCreationDnaReport(idea);
      const evaluated = evaluateDnaAgainstVault(baseReport, dnaVault);
      setDnaReport(evaluated);
      setOutput(
        `CREATION DNA — ${evaluated.comboStatus.replace('_', ' ')}\n\n` +
        `Pitch: ${evaluated.pitch}\n\n` +
        `Tags: ${evaluated.genre.join(' + ')} · ${evaluated.emotion.join(' + ')} · ${evaluated.scale} · ${evaluated.power}\n\n` +
        `${evaluated.comboNotes}\n\n` +
        `Differentiators:\n${evaluated.differentiators.map(item => `• ${item}`).join('\n')}`
      );
      saveDraftToStorage('dna', { idea, reviewNotes: dnaReviewNotes });
    } catch (err: any) {
      setOutput(`Creation DNA could not run. ${err.message || 'Try again in a moment.'}`);
    }
    setIsGenerating(false);
  };

  const handleSaveDnaToVault = () => {
    if (!dnaReport) return;
    const entry: CreationDnaVaultEntry = {
      ...dnaReport,
      id: globalThis.crypto?.randomUUID?.() || `${Date.now()}`,
      name: makeDnaName(dnaReport.idea),
      humanNotes: dnaReviewNotes,
      savedAt: new Date().toISOString(),
    };
    const next = [entry, ...dnaVault.filter(item => item.id !== entry.id)].slice(0, 50);
    setDnaVault(next);
    saveDnaVaultToStorage(next);
    saveDraftToStorage('dna', { idea: dnaIdea, reviewNotes: dnaReviewNotes });
    setLastSaved(new Date().toLocaleTimeString());
    setOutput(`Saved "${entry.name}" to the local Creation DNA vault.`);
  };

  const handleSaveDraft = () => {
    saveDraftToStorage('character', { character, boardSections: selectedBoardSections });
    saveDraftToStorage('worldseed', worldSections);
    saveDraftToStorage('dna', { idea: dnaIdea, reviewNotes: dnaReviewNotes });
    setLastSaved(new Date().toLocaleTimeString());
  };

  const copyOutput = () => {
    if (output) navigator.clipboard.writeText(output);
  };

  // ─── Render ─────────────────────────────────────────────────────

  return (
    <div className="flex h-screen overflow-hidden bg-surface-base animate-fade-in pt-16 md:pt-0" role="application" aria-label="Creator Studio">

      {/* ── Left Tool Panel ─────────────────────────────────────── */}
      <nav className="w-64 border-r border-border bg-surface-elevated flex flex-col h-full shrink-0 hidden lg:flex" aria-label="Studio tools">
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
          <label htmlFor="world-selector" className="text-[10px] font-semibold text-text-tertiary uppercase tracking-widest block mb-1.5 px-1">Target World</label>
          <select
            id="world-selector"
            value={selectedWorld}
            onChange={e => setSelectedWorld(e.target.value)}
            className="w-full bg-surface-overlay border border-border rounded-lg px-3 py-2 text-xs text-text-primary focus:border-border-accent focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
            aria-label="Select target world for AI context"
          >
            <option value="">No world selected</option>
            {studioWorlds.map(w => (
              <option key={w.id} value={w.name}>{w.name}</option>
            ))}
          </select>
        </div>

        {/* AI Status */}
        <div className="p-3 border-t border-border">
          <button onClick={() => setShowSettings(!showSettings)} className="flex items-center justify-between w-full px-2 py-1" aria-label="Open AI provider settings" aria-expanded={showSettings}>
            <div className="flex items-center gap-2 text-xs text-text-secondary">
              <div className={`w-2 h-2 rounded-full ${aiEngine.isConfigured() ? 'bg-status-canon animate-pulse' : 'bg-status-conflict'}`} />
              {aiStore.provider === 'mock' ? 'Mock Mode' : `${aiStore.provider} · ${aiStore.model || 'default'}`}
            </div>
            <Settings2 size={13} className="text-text-tertiary" />
          </button>
        </div>
      </nav>

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
        <AgentErrorBoundary>
        <div className="flex-1 flex overflow-hidden">

          {/* ── Canvas (center) ───────────────────────────────── */}
          <div className="flex-1 flex flex-col overflow-hidden border-r border-border">

            {/* ──── CHARACTER FORGE ────────────────────────────── */}
            {activeTool === 'character' && (
              <>
                {/* Image Upload Zone */}
                <div className="px-6 pt-4 pb-2">
                  {charImagePreview ? (
                    <div className="flex items-start gap-4">
                      <div className="relative group">
                        <img
                          src={charImagePreview}
                          alt="Character"
                          className="w-24 h-28 rounded-xl object-cover border border-border shadow-md"
                        />
                        <button
                          onClick={clearCharImage}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-status-conflict text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={10} />
                        </button>
                        {visionResult && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-status-canon rounded-full flex items-center justify-center">
                            <CheckCircle2 size={10} className="text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <button
                          onClick={handleVisionAnalyze}
                          disabled={isAnalyzingImage || !agents.isConfigured}
                          className="flex items-center gap-2 px-4 py-2 bg-status-proposal text-white rounded-lg text-xs font-medium hover:bg-status-vote transition-all disabled:opacity-50"
                        >
                          {isAnalyzingImage ? (
                            <><Loader2 size={13} className="animate-spin" /> Analyzing image...</>
                          ) : visionResult ? (
                            <><Eye size={13} /> Re-analyze</>
                          ) : (
                            <><Sparkles size={13} /> Analyze with AI</>
                          )}
                        </button>
                        {visionResult && (
                          <p className="text-[10px] text-status-canon mt-1.5">
                            Fields auto-populated from image. Edit any field to customize.
                          </p>
                        )}
                        {!agents.isConfigured && (
                          <p className="text-[10px] text-status-conflict mt-1.5">
                            Configure an AI provider in settings to use vision analysis.
                          </p>
                        )}
                        {agents.isConfigured && !visionResult && !isAnalyzingImage && (
                          <p className="text-[10px] text-text-tertiary mt-1.5">
                            Uses your configured model. Requires a vision-capable LLM.
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div
                      onDrop={handleImageDrop}
                      onDragOver={(e) => e.preventDefault()}
                      className="border-2 border-dashed border-border hover:border-accent-primary/50 rounded-xl p-4 flex items-center gap-4 cursor-pointer transition-colors group"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) handleImageUpload(file);
                        };
                        input.click();
                      }}
                    >
                      <div className="w-12 h-12 rounded-xl bg-surface-elevated border border-border flex items-center justify-center group-hover:border-accent-primary/30 transition-colors">
                        <Upload size={18} className="text-text-tertiary group-hover:text-accent-primary transition-colors" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-text-secondary group-hover:text-text-primary transition-colors">
                          Drop character art here or click to upload
                        </p>
                        <p className="text-[10px] text-text-tertiary mt-0.5">
                          AI will analyze the image and auto-fill character fields
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="px-6 py-3 border-y border-border bg-surface-elevated/40">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div>
                      <div className="text-[10px] font-semibold text-text-tertiary uppercase tracking-widest">Character Board</div>
                      <div className="text-xs text-text-secondary mt-0.5">{selectedBoardSections.length} sections selected</div>
                    </div>
                    <button
                      onClick={() => setSelectedBoardSections(DEFAULT_CHARACTER_BOARD_SECTIONS)}
                      className="text-[10px] text-text-tertiary hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30 rounded px-2 py-1"
                    >
                      Reset
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
                    {CHARACTER_BOARD_SECTIONS.map(section => (
                      <label
                        key={section.id}
                        className="flex items-center gap-2 min-h-10 px-2.5 py-2 rounded-lg bg-surface-overlay border border-border text-xs text-text-secondary hover:border-border-accent transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedBoardSections.includes(section.id)}
                          onChange={() => toggleBoardSection(section.id)}
                          className="h-3.5 w-3.5 rounded border-border accent-accent-primary"
                        />
                        <span className="leading-snug">{section.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

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

                {/* Deepen Character Agent Button + Export/Import */}
                <div className="px-6 py-3 border-t border-border flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <CharacterExport character={character} onImport={setCharacter} imagePreview={charImagePreview} />
                    <p className="text-[10px] text-text-tertiary hidden sm:block truncate">Use <span className="text-accent-primary font-medium">Character Deepener</span> to enrich.</p>
                  </div>
                  <button
                    onClick={handleDeepenCharacter}
                    disabled={!character.name || isGenerating}
                    className="flex items-center gap-2 px-4 py-2 bg-status-proposal text-white rounded-lg text-xs font-medium hover:bg-status-vote transition-all disabled:opacity-50 shrink-0"
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
                        {section.content && <div className="w-1.5 h-1.5 rounded-full bg-status-canon ml-auto shrink-0" />}
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
                    className="flex items-center gap-2 px-4 py-2 bg-status-vote text-white rounded-lg text-xs font-medium hover:bg-status-proposal transition-all disabled:opacity-50 shrink-0"
                  >
                    {isGenerating ? <Loader2 size={13} className="animate-spin" /> : <GitMerge size={13} />}
                    Check Consistency
                  </button>
                </div>
              </div>
            )}

            {/* ──── CREATION DNA ──────────────────────────────── */}
            {activeTool === 'dna' && (
              <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
                <div className="max-w-6xl mx-auto space-y-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-serif text-lg text-text-primary flex items-center gap-2">
                        <Dna size={17} className="text-accent-primary" />
                        Creation DNA
                      </h3>
                      <p className="text-xs text-text-tertiary mt-1">Genre, emotion, vibe, scale, power, anchors, and originality review.</p>
                    </div>
                    {dnaReport && (
                      <span className={`px-3 py-1.5 rounded-full border text-[11px] font-semibold uppercase tracking-widest ${
                        dnaReport.comboStatus === 'NEAR_MATCH' ? 'border-status-conflict/30 bg-status-conflict/10 text-status-conflict' :
                        dnaReport.comboStatus === 'RARE' ? 'border-status-proposal/30 bg-status-proposal/10 text-status-proposal' :
                        'border-status-canon/30 bg-status-canon/10 text-status-canon'
                      }`}>
                        {dnaReport.comboStatus.replace('_', ' ')}
                      </span>
                    )}
                  </div>

                  <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-5">
                    <div className="space-y-5">
                      <div className="bg-surface-elevated border border-border rounded-xl p-4">
                        <label htmlFor="creation-dna-idea" className="text-[10px] font-semibold text-text-tertiary uppercase tracking-widest mb-1.5 block">Concept</label>
                        <textarea
                          id="creation-dna-idea"
                          value={dnaIdea}
                          onChange={e => setDnaIdea(e.target.value)}
                          placeholder="A retired hitman is dragged back in when his adopted daughter gets trapped in a neon underground fight ring run by augmented gangs."
                          className="w-full min-h-36 bg-surface-overlay border border-border rounded-lg px-3 py-3 text-sm text-text-primary placeholder-text-tertiary resize-y focus:border-border-accent focus:outline-none focus:ring-2 focus:ring-accent-primary/30 leading-relaxed"
                        />
                        <div className="flex items-center justify-between gap-3 mt-3">
                          <p className="text-[11px] text-text-tertiary">{agents.isConfigured ? 'Structured agent mode' : 'Offline DNA draft mode'}</p>
                          <button
                            onClick={handleCreationDnaAnalyze}
                            disabled={!dnaIdea.trim() || isGenerating}
                            className="flex items-center gap-2 px-5 py-2.5 bg-accent-primary text-surface-base rounded-lg text-sm font-medium hover:bg-accent-hover transition-all disabled:opacity-50"
                          >
                            {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Dna size={14} />}
                            Analyze DNA
                          </button>
                        </div>
                      </div>

                      {dnaReport && (
                        <div className="bg-surface-elevated border border-border rounded-xl p-4 space-y-4 animate-fade-in">
                          <div className="grid md:grid-cols-2 gap-3">
                            <DnaTagGroup label="Genre" tags={dnaReport.genre} />
                            <DnaTagGroup label="Emotion" tags={dnaReport.emotion} />
                            <DnaTagGroup label="Vibe" tags={dnaReport.vibe} />
                            <DnaTagGroup label="Logic" tags={[dnaReport.scale, dnaReport.power]} />
                          </div>

                          <div>
                            <label htmlFor="creation-dna-pitch" className="text-[10px] font-semibold text-text-tertiary uppercase tracking-widest mb-1.5 block">Pitch</label>
                            <input
                              id="creation-dna-pitch"
                              value={dnaReport.pitch}
                              onChange={e => setDnaReport(prev => prev ? { ...prev, pitch: e.target.value } : prev)}
                              className="w-full bg-surface-overlay border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:border-border-accent focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
                            />
                          </div>

                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <div className="text-[10px] font-semibold text-text-tertiary uppercase tracking-widest mb-2">Anchors</div>
                              <div className="flex flex-wrap gap-2">
                                {dnaReport.anchors.map(anchor => <span key={anchor} className="px-2.5 py-1 rounded-full bg-surface-overlay border border-border text-xs text-text-secondary">{anchor}</span>)}
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] font-semibold text-text-tertiary uppercase tracking-widest mb-2">Vault Check</div>
                              <p className="text-xs text-text-secondary leading-relaxed">{dnaReport.comboNotes}</p>
                            </div>
                          </div>

                          <div>
                            <div className="text-[10px] font-semibold text-text-tertiary uppercase tracking-widest mb-2">Differentiators</div>
                            <div className="space-y-2">
                              {dnaReport.differentiators.map((item, i) => (
                                <div key={i} className="flex gap-2 text-xs text-text-secondary bg-surface-overlay border border-border rounded-lg px-3 py-2">
                                  <span className="text-accent-primary font-semibold">{i + 1}</span>
                                  <span>{item}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label htmlFor="creation-dna-review" className="text-[10px] font-semibold text-text-tertiary uppercase tracking-widest mb-1.5 block">Human Review Notes</label>
                            <textarea
                              id="creation-dna-review"
                              value={dnaReviewNotes}
                              onChange={e => setDnaReviewNotes(e.target.value)}
                              placeholder="Approve, edit direction, or personal twist to preserve before saving."
                              rows={3}
                              className="w-full bg-surface-overlay border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-tertiary resize-none focus:border-border-accent focus:outline-none focus:ring-2 focus:ring-accent-primary/30 leading-relaxed"
                            />
                          </div>

                          <div className="flex justify-end">
                            <button
                              onClick={handleSaveDnaToVault}
                              className="flex items-center gap-2 px-4 py-2 bg-status-canon text-brand-black rounded-lg text-xs font-medium hover:bg-brand-gold/80 transition-all"
                            >
                              <Save size={13} />
                              Save to DNA Vault
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="bg-surface-elevated border border-border rounded-xl p-4 h-fit">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-medium text-text-primary">DNA Vault</h4>
                          <span className="text-[10px] text-text-tertiary">{dnaVault.length} saved</span>
                        </div>
                        {dnaVault.length === 0 ? (
                          <div className="h-40 flex flex-col items-center justify-center text-text-tertiary text-center space-y-2">
                            <Dna size={20} strokeWidth={1} />
                            <p className="text-xs">Saved DNA cards appear here.</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {dnaVault.slice(0, 6).map(entry => (
                              <button
                                key={entry.id}
                                onClick={() => {
                                  setDnaIdea(entry.idea);
                                  setDnaReport(evaluateDnaAgainstVault(entry, dnaVault.filter(item => item.id !== entry.id)));
                                  setDnaReviewNotes(entry.humanNotes);
                                }}
                                className="w-full text-left p-3 rounded-lg border border-border bg-surface-overlay hover:border-border-accent transition-colors"
                              >
                                <div className="text-xs font-medium text-text-primary line-clamp-1">{entry.name}</div>
                                <div className="text-[10px] text-text-tertiary mt-1 line-clamp-2">{entry.pitch}</div>
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                  {[...entry.genre, entry.scale].slice(0, 3).map(tag => (
                                    <span key={tag} className="px-1.5 py-0.5 rounded bg-accent-muted text-[9px] text-accent-primary">{tag}</span>
                                  ))}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="bg-surface-elevated border border-border rounded-xl p-4">
                        <h4 className="text-sm font-medium text-text-primary">Genre Guide</h4>
                        <p className="text-[11px] text-text-tertiary mt-1 mb-3">Default lanes for creators who want strong starting points.</p>
                        <div className="space-y-3 max-h-[32rem] overflow-y-auto no-scrollbar pr-1">
                          {CREATION_DNA_GENRE_GUIDE.map(genre => (
                            <div key={genre.tag} className="border-b border-border/70 pb-3 last:border-b-0 last:pb-0">
                              <div className="text-xs font-medium text-text-primary">{genre.tag}</div>
                              <p className="text-[11px] text-text-tertiary leading-relaxed mt-1">{genre.description}</p>
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {genre.anchors.slice(0, 3).map(anchor => (
                                  <span key={anchor} className="px-1.5 py-0.5 rounded bg-surface-overlay border border-border text-[9px] text-text-secondary">{anchor}</span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
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
                    {isGenerating ? 'Consulting the Oracle...' : 'Consult the Oracle'}
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
                    {isGenerating ? 'Consulting the Oracle...' : 'Consult the Oracle'}
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
                      canonReport.score >= 80 ? 'bg-status-canon/10 text-status-canon border border-status-canon/20' :
                      canonReport.score >= 60 ? 'bg-status-conflict/10 text-status-conflict border border-status-conflict/20' :
                      'bg-status-rejected/10 text-status-rejected border border-status-rejected/20'
                    }`}>
                      {canonReport.score >= 80 ? <CheckCircle2 size={14} /> : <GitMerge size={14} />}
                      Canon Score: {canonReport.score}/100
                    </div>
                    <p className={`text-[10px] mt-1.5 font-medium uppercase tracking-widest ${
                      canonReport.recommendation === 'APPROVE' ? 'text-status-canon' :
                      canonReport.recommendation === 'APPROVE_WITH_EDITS' ? 'text-status-conflict' : 'text-status-rejected'
                    }`}>{canonReport.recommendation.replace(/_/g, ' ')}</p>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">{canonReport.summary}</p>
                  {canonReport.consistent.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-semibold text-status-canon uppercase tracking-widest mb-1">✓ Consistent</h4>
                      {canonReport.consistent.map((c, i) => <p key={i} className="text-xs text-text-secondary mb-0.5">• {c}</p>)}
                    </div>
                  )}
                  {canonReport.concerns.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-semibold text-status-conflict uppercase tracking-widest mb-1">⚠ Concerns</h4>
                      {canonReport.concerns.map((c, i) => <p key={i} className="text-xs text-text-secondary mb-0.5">• {c}</p>)}
                    </div>
                  )}
                  {canonReport.contradictions.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-semibold text-status-conflict uppercase tracking-widest mb-1">✕ Contradictions</h4>
                      {canonReport.contradictions.map((c, i) => <p key={i} className="text-xs text-text-secondary mb-0.5">• {c}</p>)}
                    </div>
                  )}
                  <button onClick={() => { setCanonReport(null); setOutput(null); }} className="text-[10px] text-text-tertiary hover:text-text-primary mt-2">← Clear report</button>
                </div>
              ) : deepenerResult ? (
                <div className="space-y-4 animate-fade-in">
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-status-proposal/10 text-status-proposal border border-status-proposal/20">
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
              ) : dnaReport ? (
                <div className="space-y-4 animate-fade-in">
                  <div className="text-center">
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border ${
                      dnaReport.comboStatus === 'NEAR_MATCH' ? 'bg-status-conflict/10 text-status-conflict border-status-conflict/20' :
                      dnaReport.comboStatus === 'RARE' ? 'bg-status-proposal/10 text-status-proposal border-status-proposal/20' :
                      'bg-status-canon/10 text-status-canon border-status-canon/20'
                    }`}>
                      <Dna size={14} />
                      {dnaReport.comboStatus.replace('_', ' ')}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-semibold text-text-tertiary uppercase tracking-widest mb-1">Pitch</h4>
                    <p className="text-xs text-text-secondary leading-relaxed">{dnaReport.pitch}</p>
                  </div>
                  <DnaTagGroup label="Genre" tags={dnaReport.genre} compact />
                  <DnaTagGroup label="Emotion" tags={dnaReport.emotion} compact />
                  <DnaTagGroup label="Vibe" tags={dnaReport.vibe} compact />
                  <DnaTagGroup label="Scale + Power" tags={[dnaReport.scale, dnaReport.power]} compact />
                  <div>
                    <h4 className="text-[10px] font-semibold text-text-tertiary uppercase tracking-widest mb-1">Vault Check</h4>
                    <p className="text-xs text-text-secondary leading-relaxed">{dnaReport.comboNotes}</p>
                  </div>
                  {dnaReport.similar.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-semibold text-status-conflict uppercase tracking-widest mb-1">Closest Saved DNA</h4>
                      {dnaReport.similar.map(match => (
                        <p key={match.name} className="text-xs text-text-secondary mb-1">{match.name} · {Math.round(match.score * 100)}%</p>
                      ))}
                    </div>
                  )}
                  <div>
                    <h4 className="text-[10px] font-semibold text-accent-primary uppercase tracking-widest mb-1">Differentiators</h4>
                    {dnaReport.differentiators.map((item, i) => <p key={i} className="text-xs text-text-secondary mb-1">→ {item}</p>)}
                  </div>
                  <button onClick={() => { setDnaReport(null); setOutput(null); }} className="text-[10px] text-text-tertiary hover:text-text-primary mt-2">← Clear DNA card</button>
                </div>
              ) : output ? (
                <div className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                  {output}
                </div>
              ) : activeTool === 'character' ? (
                <CharacterBoardPreview
                  character={character}
                  selectedSections={selectedBoardSections}
                  imagePreview={charImagePreview}
                  selectedWorld={selectedWorld}
                  aiAssisted={Boolean(visionResult || deepenerResult)}
                />
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
            <div className="p-3 border-t border-border text-[11px] text-text-tertiary flex items-center justify-between gap-4">
              <span>{lastSaved ? `Saved ${lastSaved}` : 'Not saved yet'} <span className="hidden sm:inline text-text-tertiary/50">· ⌘S to save</span></span>
              <div className="flex items-center gap-3">
                <span className="text-text-tertiary/60">{RateLimiter.getUsage().day}/{RateLimiter.getUsage().limits.maxPerDay} today</span>
                <span>{aiStore.provider === 'mock' ? 'Mock mode' : aiStore.provider}</span>
              </div>
            </div>

            {/* Agent Observability Panel */}
            <AgentDebugPanel />
          </div>
        </div>
        </AgentErrorBoundary>
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
  const fieldId = `field-${label.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-1.5">
        <label htmlFor={fieldId} className="text-[10px] font-semibold text-text-tertiary uppercase tracking-widest">{label}</label>
        {onAI && (
          <button
            onClick={onAI}
            disabled={isGenerating}
            className="flex items-center gap-1 text-[10px] text-accent-primary hover:underline disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-accent-primary/30 rounded"
            aria-label={`Consult the Oracle for ${label}`}
          >
            {isGenerating ? <Loader2 size={10} className="animate-spin" /> : <Wand2 size={10} />}
            AI
          </button>
        )}
      </div>
      {multiline ? (
        <textarea
          id={fieldId}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows || 3}
          className="w-full bg-surface-overlay border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-tertiary resize-none focus:border-border-accent focus:outline-none focus:ring-2 focus:ring-accent-primary/30 leading-relaxed"
        />
      ) : (
        <input
          id={fieldId}
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-surface-overlay border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-tertiary focus:border-border-accent focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
        />
      )}
    </div>
  );
}

function DnaTagGroup({ label, tags, compact }: { label: string; tags: string[]; compact?: boolean }) {
  return (
    <div>
      <div className="text-[10px] font-semibold text-text-tertiary uppercase tracking-widest mb-1.5">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {tags.map(tag => (
          <span
            key={tag}
            className={`${compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'} rounded-full bg-accent-muted border border-border-accent text-accent-primary`}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

function splitBoardText(value: string) {
  return value
    .split(/\n|;|\u2022/)
    .map(item => item.trim())
    .filter(Boolean);
}

function BoardDetailList({ items }: { items: Array<{ label: string; value?: string | null }> }) {
  const filled = items.filter(item => item.value && item.value.trim());
  if (filled.length === 0) return null;

  return (
    <div className="space-y-1.5">
      {filled.map(item => (
        <div key={item.label} className="text-xs">
          <span className="text-text-tertiary">{item.label}: </span>
          <span className="text-text-secondary">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

function BoardTextBlock({ value, clamp = 'line-clamp-4' }: { value?: string | null; clamp?: string }) {
  if (!value?.trim()) return null;
  return <p className={`text-xs text-text-secondary leading-relaxed ${clamp}`}>{value}</p>;
}

function BoardBulletList({ value }: { value?: string | null }) {
  const items = value ? splitBoardText(value) : [];
  if (items.length === 0) return null;

  return (
    <div className="space-y-1">
      {items.slice(0, 4).map(item => (
        <p key={item} className="text-xs text-text-secondary leading-relaxed">• {item}</p>
      ))}
    </div>
  );
}

function CharacterBoardSection({ title, children }: { title: string; children: React.ReactNode }) {
  if (!children) return null;
  return (
    <div className="border border-border rounded-xl bg-surface-overlay/60 p-3">
      <div className="text-[10px] font-semibold text-text-tertiary uppercase tracking-widest mb-2">{title}</div>
      {children}
    </div>
  );
}

function CharacterBoardPreview({
  character,
  selectedSections,
  imagePreview,
  selectedWorld,
  aiAssisted,
}: {
  character: CharacterDraft;
  selectedSections: CharacterBoardSectionId[];
  imagePreview: string | null;
  selectedWorld: string;
  aiAssisted: boolean;
}) {
  const hasContent = character.name || character.archetype;
  if (!hasContent) return (
    <div className="text-center text-text-tertiary py-10 space-y-2">
      <User size={24} strokeWidth={1} className="mx-auto" />
      <p className="text-xs">Character board preview appears here</p>
    </div>
  );

  const isSelected = (id: CharacterBoardSectionId) => selectedSections.includes(id);

  return (
    <div className="space-y-4">
      <div className="text-center">
        {imagePreview ? (
          <img src={imagePreview} alt="" className="w-20 h-24 mx-auto rounded-xl object-cover border border-border shadow-sm mb-3" />
        ) : (
          <div className="w-16 h-16 mx-auto rounded-full bg-surface-overlay border border-border flex items-center justify-center text-2xl font-serif text-accent-primary mb-3">
            {character.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
        )}
        <h4 className="font-serif text-base text-text-primary">{character.name || 'Unnamed'}</h4>
        {character.archetype && <p className="text-xs text-text-tertiary">{character.archetype}</p>}
        {character.species && <p className="text-[11px] text-text-tertiary">{character.species} · {character.age || '?'}</p>}
      </div>

      {isSelected('coreIdentity') && (
        <CharacterBoardSection title="Core Identity">
          <BoardDetailList items={[
            { label: 'Name', value: character.name },
            { label: 'Aliases', value: character.aliases },
            { label: 'Age', value: character.age },
            { label: 'Pronouns', value: character.pronouns },
            { label: 'Species', value: character.species },
            { label: 'Role', value: character.archetype },
          ]} />
        </CharacterBoardSection>
      )}

      {isSelected('physicalAppearance') && (
        <CharacterBoardSection title="Physical Appearance">
          <>
            <BoardTextBlock value={character.appearance} />
            <BoardDetailList items={[
              { label: 'Features', value: character.distinguishingFeatures },
              { label: 'Wardrobe', value: character.attire },
            ]} />
          </>
        </CharacterBoardSection>
      )}

      {isSelected('personality') && (
        <CharacterBoardSection title="Personality">
          <BoardDetailList items={[
            { label: 'Quirks', value: character.quirks },
            { label: 'Fears', value: character.fears },
            { label: 'Desires', value: character.desires },
          ]} />
        </CharacterBoardSection>
      )}

      {isSelected('background') && (
        <CharacterBoardSection title="Background / Backstory">
          <>
            <BoardTextBlock value={character.backstory} clamp="line-clamp-6" />
            <BoardBulletList value={character.formativeEvents} />
            <BoardDetailList items={[{ label: 'Secrets', value: character.secrets }]} />
          </>
        </CharacterBoardSection>
      )}

      {isSelected('motivation') && (
        <CharacterBoardSection title="Goals & Motivation">
          <BoardDetailList items={[
            { label: 'Drive', value: character.desires },
            { label: 'Internal pressure', value: character.fears },
          ]} />
        </CharacterBoardSection>
      )}

      {isSelected('skills') && (
        <CharacterBoardSection title="Skills, Powers & Limits">
          <>
            <BoardBulletList value={character.powers} />
            <BoardDetailList items={[{ label: 'Limits', value: character.limitations }]} />
          </>
        </CharacterBoardSection>
      )}

      {isSelected('relationships') && (
        <CharacterBoardSection title="Relationships">
          <BoardDetailList items={[
            { label: 'World', value: selectedWorld || 'Manual draft' },
            { label: 'Story ties', value: character.backstory ? 'Derived from backstory and proposal context' : '' },
          ]} />
        </CharacterBoardSection>
      )}

      {isSelected('voiceStyle') && (
        <CharacterBoardSection title="Voice & Style">
          <BoardDetailList items={[
            { label: 'Speech', value: character.speechPattern },
            { label: 'Mannerisms', value: character.quirks },
          ]} />
        </CharacterBoardSection>
      )}

      {isSelected('visualMotifs') && (
        <CharacterBoardSection title="Visual Motifs / Moodboard">
          <BoardDetailList items={[
            { label: 'Outfit', value: character.attire },
            { label: 'Features', value: character.distinguishingFeatures },
          ]} />
        </CharacterBoardSection>
      )}

      {isSelected('storyRole') && (
        <CharacterBoardSection title="Story Role & Arc">
          <BoardDetailList items={[
            { label: 'Archetype', value: character.archetype },
            { label: 'Arc pressure', value: character.desires || character.fears },
          ]} />
        </CharacterBoardSection>
      )}

      {isSelected('canonNotes') && (
        <CharacterBoardSection title="Canon / Creator Notes">
          <BoardDetailList items={[
            { label: 'Status', value: 'Draft' },
            { label: 'World', value: selectedWorld || 'Unassigned' },
            { label: 'AI-assisted', value: aiAssisted ? 'Yes' : 'No' },
          ]} />
        </CharacterBoardSection>
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
            <div className={`w-2 h-2 rounded-full ${s.content ? 'bg-status-canon' : 'bg-surface-overlay border border-border'}`} />
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal="true" aria-label="AI Settings">
      <div className="bg-surface-elevated border border-border rounded-2xl w-full max-w-md p-6 space-y-5 animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-lg text-text-primary">AI Settings</h3>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30 rounded" aria-label="Close settings"><X size={18} /></button>
        </div>

        <div>
          <label htmlFor="ai-provider-select" className="text-[10px] font-semibold text-text-tertiary uppercase tracking-widest block mb-1.5">Provider</label>
          <select
            id="ai-provider-select"
            value={store.provider}
            onChange={e => store.setProvider(e.target.value as AIProvider)}
            className="w-full bg-surface-overlay border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:border-border-accent focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
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
            <label htmlFor="ai-api-key" className="text-[10px] font-semibold text-text-tertiary uppercase tracking-widest block mb-1.5">API Key</label>
            <input
              id="ai-api-key"
              type="password"
              value={store.apiKey}
              onChange={e => store.setApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full bg-surface-overlay border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:border-border-accent focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
              aria-describedby="api-key-hint"
            />
            <p id="api-key-hint" className="text-[11px] text-text-tertiary mt-1">Stored locally in your browser. Never sent to our servers.</p>
          </div>
        )}

        <div>
          <label htmlFor="ai-model" className="text-[10px] font-semibold text-text-tertiary uppercase tracking-widest block mb-1.5">Model</label>
          <input
            id="ai-model"
            type="text"
            value={store.model}
            onChange={e => store.setModel(e.target.value)}
            placeholder="e.g., gpt-4o"
            className="w-full bg-surface-overlay border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:border-border-accent focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
          />
        </div>

        {store.provider === 'ollama' && (
          <div>
            <label htmlFor="ai-endpoint" className="text-[10px] font-semibold text-text-tertiary uppercase tracking-widest block mb-1.5">Endpoint</label>
            <input
              id="ai-endpoint"
              type="text"
              value={store.endpoint}
              onChange={e => store.setEndpoint(e.target.value)}
              placeholder="http://localhost:11434"
              className="w-full bg-surface-overlay border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:border-border-accent focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
            />
          </div>
        )}

        <button onClick={onClose} className="w-full bg-accent-primary text-surface-base py-2.5 rounded-lg text-sm font-medium hover:bg-accent-hover transition-all focus:outline-none focus:ring-2 focus:ring-accent-primary/50">
          Save Settings
        </button>
      </div>
    </div>
  );
}
