/**
 * AIEngine — Provider-agnostic BYOK AI layer
 *
 * All LLM calls run client-side. The user's API key never leaves their browser.
 * Supports: OpenAI, Anthropic, Ollama (local), OpenRouter (any model).
 */

// ─── Types ───────────────────────────────────────────────────────────

export type AIProvider = 'openai' | 'anthropic' | 'ollama' | 'openrouter' | 'mock';

export interface AIProviderConfig {
  provider: AIProvider;
  apiKey?: string;
  model?: string;
  endpoint?: string;   // For Ollama / custom endpoints
  temperature?: number;
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIGenerateOptions {
  systemPrompt?: string;
  worldBible?: string;       // Injected as context
  existingCanon?: string;    // For contradiction avoidance
  maxTokens?: number;
  temperature?: number;
}

export interface AIEngine {
  generate(prompt: string, options?: AIGenerateOptions): Promise<string>;
  generateName(context: string, type: 'WORLD' | 'CHARACTER'): Promise<string>;
  generateDescription(context: string, type: 'WORLD' | 'CHARACTER'): Promise<string>;
  generateLore(context: string, type: 'WORLD' | 'CHARACTER'): Promise<string>;
  analyzeConsistency(proposalContent: string, worldBible: string): Promise<string>;
  brainstorm(premise: string, count?: number): Promise<string[]>;
  isConfigured(): boolean;
}

// ─── System Prompts ──────────────────────────────────────────────────

const SYSTEM_PROMPTS = {
  character: `You are the Oracle — OpenSaga's creative AI co-pilot. You help creators forge compelling characters for collaborative fictional universes. Be specific, vivid, and original. Avoid clichés. When a World Bible is provided, ensure consistency with its rules.`,

  lore: `You are the Oracle — OpenSaga's lore specialist. You write in-world documents: historical accounts, technology specs, mythology, faction manifestos. Match the world's tone. Be detailed but concise.`,

  brainstorm: `You are the Oracle — OpenSaga's brainstorm engine. Generate creative, diverse ideas. Each idea should be distinct and explorable. Return ideas as a numbered list.`,

  consistency: `You are the Oracle — OpenSaga's Canon Check engine. Analyze the proposed content against the World Bible. Report:
- CONSISTENT items (things that align)
- MINOR CONCERNS (possible conflicts, suggest fixes)
- CONTRADICTIONS (clear violations)
Give a compatibility score from 0-100 and a recommendation (Approve / Approve with edits / Reject).`,

  worldSeed: `You are the Oracle — OpenSaga's world architect. You help creators design rich, internally consistent fictional universes. Generate structured world-building content: history, geography, factions, magic/tech systems, cultures.`,
};

// ─── Build Messages ──────────────────────────────────────────────────

function buildMessages(prompt: string, options?: AIGenerateOptions): AIMessage[] {
  const messages: AIMessage[] = [];

  // System prompt
  const system = options?.systemPrompt || SYSTEM_PROMPTS.character;
  let fullSystem = system;

  // Inject World Bible as context
  if (options?.worldBible) {
    fullSystem += `\n\n--- WORLD BIBLE (Source of Truth) ---\n${options.worldBible}`;
  }

  // Inject existing Canon for contradiction avoidance
  if (options?.existingCanon) {
    fullSystem += `\n\n--- EXISTING CANON (Do not contradict) ---\n${options.existingCanon}`;
  }

  messages.push({ role: 'system', content: fullSystem });
  messages.push({ role: 'user', content: prompt });

  return messages;
}

// ─── OpenAI Adapter ──────────────────────────────────────────────────

async function callOpenAI(
  config: AIProviderConfig,
  messages: AIMessage[],
  maxTokens = 1500,
  temperature = 0.7
): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model || 'gpt-4o',
      messages,
      max_tokens: maxTokens,
      temperature: config.temperature ?? temperature,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`OpenAI error: ${err.error?.message || res.statusText}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}

// ─── Anthropic Adapter ───────────────────────────────────────────────

async function callAnthropic(
  config: AIProviderConfig,
  messages: AIMessage[],
  maxTokens = 1500,
  temperature = 0.7
): Promise<string> {
  const systemMsg = messages.find(m => m.role === 'system');
  const userMsgs = messages.filter(m => m.role !== 'system');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey || '',
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: config.model || 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      temperature: config.temperature ?? temperature,
      system: systemMsg?.content || '',
      messages: userMsgs.map(m => ({ role: m.role, content: m.content })),
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Anthropic error: ${err.error?.message || res.statusText}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text?.trim() || '';
}

// ─── Ollama Adapter (Local) ──────────────────────────────────────────

async function callOllama(
  config: AIProviderConfig,
  messages: AIMessage[],
  _maxTokens = 1500,
  temperature = 0.7
): Promise<string> {
  const endpoint = config.endpoint || 'http://localhost:11434';

  const res = await fetch(`${endpoint}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.model || 'llama3',
      messages,
      stream: false,
      options: { temperature: config.temperature ?? temperature },
    }),
  });

  if (!res.ok) throw new Error(`Ollama error: ${res.statusText}`);

  const data = await res.json();
  return data.message?.content?.trim() || '';
}

// ─── OpenRouter Adapter ──────────────────────────────────────────────

async function callOpenRouter(
  config: AIProviderConfig,
  messages: AIMessage[],
  maxTokens = 1500,
  temperature = 0.7
): Promise<string> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
      'X-Title': 'OpenSaga Creator Studio',
    },
    body: JSON.stringify({
      model: config.model || 'openai/gpt-4o',
      messages,
      max_tokens: maxTokens,
      temperature: config.temperature ?? temperature,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`OpenRouter error: ${err.error?.message || res.statusText}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}

// ─── Router ──────────────────────────────────────────────────────────

async function callProvider(
  config: AIProviderConfig,
  messages: AIMessage[],
  maxTokens?: number,
  temperature?: number
): Promise<string> {
  switch (config.provider) {
    case 'openai':
      return callOpenAI(config, messages, maxTokens, temperature);
    case 'anthropic':
      return callAnthropic(config, messages, maxTokens, temperature);
    case 'ollama':
      return callOllama(config, messages, maxTokens, temperature);
    case 'openrouter':
      return callOpenRouter(config, messages, maxTokens, temperature);
    default:
      throw new Error(`Unknown provider: ${config.provider}`);
  }
}

// ─── Live Engine ─────────────────────────────────────────────────────

export class LiveAIEngine implements AIEngine {
  constructor(private config: AIProviderConfig) {}

  isConfigured(): boolean {
    if (this.config.provider === 'ollama') return true; // No key needed
    return Boolean(this.config.apiKey);
  }

  async generate(prompt: string, options?: AIGenerateOptions): Promise<string> {
    const messages = buildMessages(prompt, options);
    return callProvider(this.config, messages, options?.maxTokens, options?.temperature);
  }

  async generateName(context: string, type: 'WORLD' | 'CHARACTER'): Promise<string> {
    return this.generate(
      `Generate a single compelling, original name for a ${type.toLowerCase()}. Context: ${context}. Reply with ONLY the name, nothing else.`,
      { systemPrompt: SYSTEM_PROMPTS.character, maxTokens: 50 }
    );
  }

  async generateDescription(context: string, type: 'WORLD' | 'CHARACTER'): Promise<string> {
    return this.generate(
      `Write a vivid, compelling 2-3 paragraph description for this ${type.toLowerCase()}. Context: ${context}`,
      { systemPrompt: SYSTEM_PROMPTS.character, maxTokens: 500 }
    );
  }

  async generateLore(context: string, type: 'WORLD' | 'CHARACTER'): Promise<string> {
    return this.generate(
      `Write a detailed lore entry for this ${type.toLowerCase()}. Include history, significance, and connections to the broader world. Context: ${context}`,
      { systemPrompt: SYSTEM_PROMPTS.lore, maxTokens: 1000 }
    );
  }

  async analyzeConsistency(proposalContent: string, worldBible: string): Promise<string> {
    return this.generate(
      `Analyze this proposed content for consistency:\n\n${proposalContent}`,
      { systemPrompt: SYSTEM_PROMPTS.consistency, worldBible, maxTokens: 1500 }
    );
  }

  async brainstorm(premise: string, count = 5): Promise<string[]> {
    const raw = await this.generate(
      `Generate ${count} creative, distinct ideas based on this premise: "${premise}". Return as a numbered list (1. 2. 3. etc). Each idea should be 1-2 sentences.`,
      { systemPrompt: SYSTEM_PROMPTS.brainstorm, maxTokens: 800 }
    );
    // Parse numbered list
    return raw.split('\n')
      .map(line => line.replace(/^\d+[\.\)]\s*/, '').trim())
      .filter(line => line.length > 5);
  }
}

// ─── Mock Engine (Offline / Demo) ────────────────────────────────────

export class MockAIEngine implements AIEngine {
  isConfigured(): boolean { return false; }

  async generate(prompt: string): Promise<string> {
    await new Promise(r => setTimeout(r, 1200));
    return `[Mock Oracle Response]\n\n${prompt.substring(0, 100)}...\n\nThis is a simulated response. Configure your AI provider in Settings to get real generations.`;
  }

  async generateName(_context: string, type: 'WORLD' | 'CHARACTER'): Promise<string> {
    await new Promise(r => setTimeout(r, 800));
    const names = type === 'WORLD'
      ? ['Ashenmire', 'Velanthos', 'Kira\'s Crossing', 'The Drift', 'Novaterra']
      : ['Kael Voss', 'Serin the Unbound', 'Chrome Widow', 'Lyra Dawnforge', 'The Fixer'];
    return names[Math.floor(Math.random() * names.length)];
  }

  async generateDescription(_context: string, type: 'WORLD' | 'CHARACTER'): Promise<string> {
    await new Promise(r => setTimeout(r, 1200));
    if (type === 'WORLD') {
      return 'A sprawling realm where ancient technology and living magic intertwine. The skies shift between amber and violet, and the ruins of a forgotten civilization hum with dormant energy. Communities thrive in the spaces between the old and the new, building their futures on the bones of a world that once was.';
    }
    return 'A figure forged by circumstance and driven by quiet conviction. They move through the world with purpose but carry the weight of choices that can never be undone. Those who know them see both the steel and the fractures beneath it.';
  }

  async generateLore(_context: string, type: 'WORLD' | 'CHARACTER'): Promise<string> {
    await new Promise(r => setTimeout(r, 1500));
    return `# The Chronicle\n\nIn the age before reckoning, this ${type.toLowerCase()} emerged from the convergence of three great forces. The old records speak of a time when boundaries between realms grew thin, and what crossed over changed everything that followed.\n\n*[This is a mock generation. Connect your AI provider for real lore.]*`;
  }

  async analyzeConsistency(_proposal: string, _bible: string): Promise<string> {
    await new Promise(r => setTimeout(r, 1800));
    return `CONSISTENCY REPORT\n━━━━━━━━━━━━━━━━━━\n\nCOMPATIBILITY SCORE: 78/100\n\n✅ CONSISTENT:\n- Character archetype aligns with world tone\n- Power system references are valid\n\n⚠️ MINOR CONCERNS:\n- Timeline reference needs verification\n\n❌ CONTRADICTIONS:\n- None detected\n\nRECOMMENDATION: Approve with minor revision.\n\n*[Mock analysis. Connect your AI provider for real consistency checks.]*`;
  }

  async brainstorm(premise: string, count = 5): Promise<string[]> {
    await new Promise(r => setTimeout(r, 1000));
    return [
      'What if the power source is sentient and chooses its wielder?',
      'A faction that worships the technology of the fallen civilization',
      'Twin characters with opposite moral compasses bound by shared memory',
      'A region where time flows differently — visitors age at random rates',
      'The discovery of a message left by the creators of the world itself',
    ].slice(0, count);
  }
}

// ─── Factory ─────────────────────────────────────────────────────────

export function createAIEngine(config?: AIProviderConfig): AIEngine {
  if (!config || config.provider === 'mock') return new MockAIEngine();
  return new LiveAIEngine(config);
}

export { SYSTEM_PROMPTS };
