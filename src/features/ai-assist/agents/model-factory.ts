/**
 * Model Factory — Maps BYOK config to the small chat-model interface used by agents.
 *
 * This intentionally avoids provider SDKs in the browser bundle. The agents only
 * need `invoke(messages)`, so direct fetch adapters keep the runtime lighter and
 * easier to split.
 */

import type { AIProviderConfig } from '../AIEngine';

export type AgentMessageContent =
  | string
  | Array<
    | { type: 'text'; text: string }
    | { type: 'image_url'; image_url: { url: string; detail?: 'low' | 'high' | 'auto' } }
  >;

export interface AgentMessage {
  role: 'system' | 'user' | 'assistant';
  content: AgentMessageContent;
}

export interface AgentChatModel {
  invoke(messages: AgentMessage[]): Promise<{ content: string }>;
}

function textFromContent(content: AgentMessageContent): string {
  if (typeof content === 'string') return content;
  return content
    .map(part => part.type === 'text' ? part.text : '[Image attached]')
    .join('\n');
}

function toOpenAIMessage(message: AgentMessage) {
  return {
    role: message.role,
    content: message.content,
  };
}

function toAnthropicContent(content: AgentMessageContent) {
  if (typeof content === 'string') return content;

  return content.map(part => {
    if (part.type === 'text') {
      return { type: 'text', text: part.text };
    }

    const match = part.image_url.url.match(/^data:(.+);base64,(.+)$/);
    if (!match) {
      return { type: 'text', text: '[Unsupported image URL]' };
    }

    return {
      type: 'image',
      source: {
        type: 'base64',
        media_type: match[1],
        data: match[2],
      },
    };
  });
}

class FetchChatModel implements AgentChatModel {
  constructor(private config: AIProviderConfig) {}

  async invoke(messages: AgentMessage[]): Promise<{ content: string }> {
    switch (this.config.provider) {
      case 'openai':
        return { content: await this.callOpenAI(messages) };
      case 'anthropic':
        return { content: await this.callAnthropic(messages) };
      case 'openrouter':
        return { content: await this.callOpenRouter(messages) };
      case 'ollama':
        return { content: await this.callOllama(messages) };
      default:
        throw new Error(`Unknown provider: ${this.config.provider}`);
    }
  }

  private async callOpenAI(messages: AgentMessage[]): Promise<string> {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model || 'gpt-4o',
        messages: messages.map(toOpenAIMessage),
        max_tokens: 1800,
        temperature: this.config.temperature ?? 0.3,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`OpenAI error: ${err.error?.message || res.statusText}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || '';
  }

  private async callAnthropic(messages: AgentMessage[]): Promise<string> {
    const system = messages.find(message => message.role === 'system');
    const userMessages = messages
      .filter(message => message.role !== 'system')
      .map(message => ({
        role: message.role === 'assistant' ? 'assistant' : 'user',
        content: toAnthropicContent(message.content),
      }));

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey || '',
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: this.config.model || 'claude-sonnet-4-20250514',
        max_tokens: 1800,
        temperature: this.config.temperature ?? 0.3,
        system: system ? textFromContent(system.content) : '',
        messages: userMessages,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Anthropic error: ${err.error?.message || res.statusText}`);
    }

    const data = await res.json();
    return data.content?.map((block: any) => block.text).filter(Boolean).join('\n').trim() || '';
  }

  private async callOpenRouter(messages: AgentMessage[]): Promise<string> {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
        'X-Title': 'OpenSaga Creator Studio',
      },
      body: JSON.stringify({
        model: this.config.model || 'openai/gpt-4o',
        messages: messages.map(toOpenAIMessage),
        max_tokens: 1800,
        temperature: this.config.temperature ?? 0.3,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`OpenRouter error: ${err.error?.message || res.statusText}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || '';
  }

  private async callOllama(messages: AgentMessage[]): Promise<string> {
    const endpoint = this.config.endpoint || 'http://localhost:11434';
    const res = await fetch(`${endpoint}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.config.model || 'llama3',
        messages: messages.map(message => ({
          role: message.role,
          content: textFromContent(message.content),
        })),
        stream: false,
        options: { temperature: this.config.temperature ?? 0.3 },
      }),
    });

    if (!res.ok) throw new Error(`Ollama error: ${res.statusText}`);

    const data = await res.json();
    return data.message?.content?.trim() || '';
  }
}

export async function createChatModel(config: AIProviderConfig): Promise<AgentChatModel | null> {
  if (!config || config.provider === 'mock') return null;
  if (config.provider !== 'ollama' && !config.apiKey) return null;
  return new FetchChatModel(config);
}
