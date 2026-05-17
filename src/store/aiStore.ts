import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useMemo } from 'react';
import { createAIEngine, type AIProvider, type AIProviderConfig } from '../features/ai-assist/AIEngine';

interface AIState {
  provider: AIProvider;
  apiKey: string;
  model: string;
  endpoint: string;
  temperature: number;
  setProvider: (provider: AIProvider) => void;
  setApiKey: (key: string) => void;
  setModel: (model: string) => void;
  setEndpoint: (endpoint: string) => void;
  setTemperature: (temp: number) => void;
  getConfig: () => AIProviderConfig;
}

const DEFAULT_MODELS: Record<AIProvider, string> = {
  openai: 'gpt-4o',
  anthropic: 'claude-sonnet-4-20250514',
  ollama: 'llama3',
  openrouter: 'openai/gpt-4o',
  mock: '',
};

export const useAIStore = create<AIState>()(
  persist(
    (set, get) => ({
      provider: 'mock',
      apiKey: '',
      model: '',
      endpoint: '',
      temperature: 0.7,
      setProvider: (provider) => set({ provider, model: DEFAULT_MODELS[provider] || '' }),
      setApiKey: (apiKey) => set({ apiKey }),
      setModel: (model) => set({ model }),
      setEndpoint: (endpoint) => set({ endpoint }),
      setTemperature: (temperature) => set({ temperature }),
      getConfig: (): AIProviderConfig => {
        const state = get();
        return {
          provider: state.provider,
          apiKey: state.apiKey,
          model: state.model || DEFAULT_MODELS[state.provider] || '',
          endpoint: state.endpoint,
          temperature: state.temperature,
        };
      },
    }),
    {
      name: 'opensaga-ai-settings',
    }
  )
);

/** Hook to get the current AI engine instance */
export function useAIEngine() {
  const config = useAIStore(s => s.getConfig)();
  return useMemo(() => createAIEngine(config), [config.provider, config.apiKey, config.model, config.endpoint, config.temperature]);
}
