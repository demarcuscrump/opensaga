/**
 * useAgentStream — React hook for subscribing to agent streaming output
 *
 * Returns partial text as the LLM generates tokens, providing real-time
 * feedback in the UI during agent execution.
 */

import { useState, useEffect, useCallback } from 'react';
import { agentStreams, type StreamEvent } from '../features/ai-assist/agents/streaming';

type AgentName = keyof typeof agentStreams;

export function useAgentStream(agentName: AgentName) {
  const [partialText, setPartialText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    const controller = agentStreams[agentName];
    const unsub = controller.subscribe((event: StreamEvent) => {
      switch (event.type) {
        case 'token':
          setPartialText(prev => prev + event.text);
          setIsStreaming(true);
          break;
        case 'result':
          setIsStreaming(false);
          break;
        case 'error':
          setIsStreaming(false);
          break;
        case 'node_start':
          break;
        case 'node_end':
          break;
      }
    });

    return unsub;
  }, [agentName]);

  const reset = useCallback(() => {
    setPartialText('');
    setIsStreaming(false);
    agentStreams[agentName].reset();
  }, [agentName]);

  return { partialText, isStreaming, reset };
}
