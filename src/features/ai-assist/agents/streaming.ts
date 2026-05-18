/**
 * Streaming support for agent workflows
 *
 * Provides a stream wrapper that emits partial tokens during the LLM call,
 * then final structured output after Zod validation.
 *
 * Events:
 * - 'token': partial text token from the LLM
 * - 'node_start': a workflow step is starting
 * - 'node_end': a workflow step completed
 * - 'result': final validated output
 * - 'error': an error occurred
 */

export type StreamEvent =
  | { type: 'token'; text: string }
  | { type: 'node_start'; node: string }
  | { type: 'node_end'; node: string; durationMs: number }
  | { type: 'result'; data: unknown }
  | { type: 'error'; message: string };

export type StreamCallback = (event: StreamEvent) => void;

/**
 * Creates a streaming-compatible model wrapper.
 * Wraps the model's stream method and emits token events to a callback.
 * Falls back to non-streaming invoke if stream isn't available.
 */
export async function streamModelCall(
  model: any,
  messages: any[],
  onToken: (token: string) => void
): Promise<string> {
  let fullText = '';

  try {
    // Try streaming first
    const stream = await model.stream(messages);

    for await (const chunk of stream) {
      const token = typeof chunk.content === 'string'
        ? chunk.content
        : (chunk.content?.[0]?.text || '');
      if (token) {
        fullText += token;
        onToken(token);
      }
    }
  } catch {
    // Fallback to non-streaming invoke
    const response = await model.invoke(messages);
    fullText = typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content);
    onToken(fullText);
  }

  return fullText;
}

/**
 * Agent stream controller — manages streaming state for a single agent run.
 * Used by the UI to subscribe to partial output.
 */
export class AgentStreamController {
  private listeners: Set<StreamCallback> = new Set();
  private _isStreaming = false;
  private _partialText = '';

  get isStreaming() { return this._isStreaming; }
  get partialText() { return this._partialText; }

  subscribe(cb: StreamCallback): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  emit(event: StreamEvent): void {
    this.listeners.forEach(cb => cb(event));
  }

  startStream(): void {
    this._isStreaming = true;
    this._partialText = '';
  }

  appendToken(token: string): void {
    this._partialText += token;
    this.emit({ type: 'token', text: token });
  }

  endStream(result: unknown): void {
    this._isStreaming = false;
    this.emit({ type: 'result', data: result });
  }

  errorStream(message: string): void {
    this._isStreaming = false;
    this.emit({ type: 'error', message });
  }

  reset(): void {
    this._isStreaming = false;
    this._partialText = '';
  }
}

/** Singleton stream controllers for each agent */
export const agentStreams = {
  canonKeeper: new AgentStreamController(),
  worldArchitect: new AgentStreamController(),
  characterDeepener: new AgentStreamController(),
  proposalAnalyst: new AgentStreamController(),
  visionAnalyzer: new AgentStreamController(),
};
