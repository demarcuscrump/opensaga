import React from 'react';
import { X, Key, ShieldAlert } from 'lucide-react';
import { useAIStore } from '../../store/aiStore';
import { Button, Input, Select } from '../../components';
import type { AIProvider } from './AIEngine';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AISettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    provider,
    apiKey,
    model,
    endpoint,
    temperature,
    setProvider,
    setApiKey,
    setModel,
    setEndpoint,
    setTemperature,
  } = useAIStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-surface-elevated border border-border rounded-xl w-full max-w-md p-6 shadow-2xl animate-slide-up">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-serif text-xl text-text-primary flex items-center gap-2">
            <Key size={18} className="text-accent-primary" />
            AI Provider Settings
          </h2>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-primary transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-6">
          <div className="p-4 bg-accent-muted border border-border-accent rounded-lg flex gap-3">
            <ShieldAlert className="text-accent-primary shrink-0 mt-0.5" size={16} />
            <p className="text-xs text-text-secondary leading-relaxed">
              OpenSaga uses a Bring-Your-Own-Key model. Keys stay in this browser's local storage and are never sent to OpenSaga servers.
            </p>
          </div>

          <Select 
            label="Active Provider"
            value={provider}
            onChange={(e) => setProvider(e.target.value as AIProvider)}
            options={[
              { value: 'mock', label: 'Mock Engine (Local Testing)' },
              { value: 'openai', label: 'OpenAI' },
              { value: 'anthropic', label: 'Anthropic' },
              { value: 'openrouter', label: 'OpenRouter' },
              { value: 'ollama', label: 'Ollama (Local)' },
            ]}
          />

          {provider !== 'mock' && (
            <div className="space-y-4">
              {provider !== 'ollama' && (
                <Input 
                  label="API Key" 
                  type="password"
                  placeholder={provider === 'anthropic' ? 'sk-ant-...' : 'sk-...'} 
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
              )}

              <Input
                label="Model"
                value={model}
                placeholder={
                  provider === 'openrouter'
                    ? 'openai/gpt-4o'
                    : provider === 'anthropic'
                      ? 'claude-sonnet-4-20250514'
                      : provider === 'ollama'
                        ? 'llama3'
                        : 'gpt-4o'
                }
                onChange={(e) => setModel(e.target.value)}
              />

              {provider === 'ollama' && (
                <Input
                  label="Endpoint"
                  value={endpoint}
                  placeholder="http://localhost:11434"
                  onChange={(e) => setEndpoint(e.target.value)}
                />
              )}

              <Input
                label="Temperature"
                type="number"
                min="0"
                max="2"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
              />
            </div>
          )}

          <div className="pt-4 border-t border-border flex justify-end">
            <Button onClick={onClose}>Save Preferences</Button>
          </div>
        </div>
      </div>
    </div>
  );
};
