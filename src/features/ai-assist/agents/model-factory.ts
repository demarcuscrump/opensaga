/**
 * Model Factory — Maps BYOK config → LangChain ChatModel instances
 *
 * Supports: OpenAI, Anthropic, OpenRouter (via OpenAI-compatible), Ollama
 * The user's API key never leaves their browser.
 */

import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { AIProviderConfig } from '../AIEngine';

/**
 * Creates a LangChain ChatModel from the user's BYOK config.
 * Returns null if the provider is 'mock' or no key is configured.
 */
export function createChatModel(config: AIProviderConfig): BaseChatModel | null {
  if (!config || config.provider === 'mock') return null;

  switch (config.provider) {
    case 'openai':
      if (!config.apiKey) return null;
      return new ChatOpenAI({
        openAIApiKey: config.apiKey,
        modelName: config.model || 'gpt-4o',
        temperature: config.temperature ?? 0.3,
        configuration: {
          dangerouslyAllowBrowser: true,
        },
      });

    case 'anthropic':
      if (!config.apiKey) return null;
      return new ChatAnthropic({
        anthropicApiKey: config.apiKey,
        modelName: config.model || 'claude-sonnet-4-20250514',
        temperature: config.temperature ?? 0.3,
        clientOptions: {
          dangerouslyAllowBrowser: true,
        },
      });

    case 'openrouter':
      if (!config.apiKey) return null;
      return new ChatOpenAI({
        openAIApiKey: config.apiKey,
        modelName: config.model || 'openai/gpt-4o',
        temperature: config.temperature ?? 0.3,
        configuration: {
          baseURL: 'https://openrouter.ai/api/v1',
          dangerouslyAllowBrowser: true,
          defaultHeaders: {
            'X-Title': 'OpenSaga Creator Studio',
          },
        },
      });

    case 'ollama':
      return new ChatOpenAI({
        openAIApiKey: 'ollama',
        modelName: config.model || 'llama3',
        temperature: config.temperature ?? 0.3,
        configuration: {
          baseURL: (config.endpoint || 'http://localhost:11434') + '/v1',
          dangerouslyAllowBrowser: true,
        },
      });

    default:
      return null;
  }
}
