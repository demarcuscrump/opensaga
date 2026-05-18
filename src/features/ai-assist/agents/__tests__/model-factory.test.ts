/**
 * Model Factory Tests — BYOK config → ChatModel
 */

import { describe, it, expect } from 'vitest';
import { createChatModel } from '../model-factory';

describe('createChatModel', () => {
  it('returns null for mock provider', async () => {
    const model = await createChatModel({ provider: 'mock', apiKey: '', model: '' });
    expect(model).toBeNull();
  });

  it('returns null for empty config', async () => {
    const model = await createChatModel({ provider: '' as any, apiKey: '', model: '' });
    expect(model).toBeNull();
  });

  it('returns a model for openai with key', async () => {
    const model = await createChatModel({ provider: 'openai', apiKey: 'sk-test', model: 'gpt-4o' });
    expect(model).not.toBeNull();
  });

  it('returns a model for anthropic with key', async () => {
    const model = await createChatModel({ provider: 'anthropic', apiKey: 'sk-ant-test', model: 'claude-3-sonnet' });
    expect(model).not.toBeNull();
  });

  it('returns a model for ollama without key', async () => {
    const model = await createChatModel({ provider: 'ollama', apiKey: '', model: 'llama3', endpoint: 'http://localhost:11434' });
    expect(model).not.toBeNull();
  });

  it('returns a model for openrouter with key', async () => {
    const model = await createChatModel({ provider: 'openrouter', apiKey: 'sk-or-test', model: 'anthropic/claude-3' });
    expect(model).not.toBeNull();
  });
});
