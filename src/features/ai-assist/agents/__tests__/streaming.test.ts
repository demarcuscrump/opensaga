/**
 * Streaming Controller Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { AgentStreamController } from '../streaming';

describe('AgentStreamController', () => {
  it('starts and ends stream correctly', () => {
    const controller = new AgentStreamController();
    expect(controller.isStreaming).toBe(false);

    controller.startStream();
    expect(controller.isStreaming).toBe(true);
    expect(controller.partialText).toBe('');

    controller.appendToken('Hello ');
    controller.appendToken('world');
    expect(controller.partialText).toBe('Hello world');
    expect(controller.isStreaming).toBe(true);

    controller.endStream({ result: 'done' });
    expect(controller.isStreaming).toBe(false);
  });

  it('emits events to subscribers', () => {
    const controller = new AgentStreamController();
    const events: string[] = [];

    controller.subscribe((event) => {
      events.push(event.type);
    });

    controller.startStream();
    controller.appendToken('hi');
    controller.endStream({ result: 'ok' });

    expect(events).toEqual(['token', 'result']);
  });

  it('unsubscribe stops receiving events', () => {
    const controller = new AgentStreamController();
    const events: string[] = [];

    const unsub = controller.subscribe((event) => {
      events.push(event.type);
    });

    controller.appendToken('a');
    unsub();
    controller.appendToken('b');

    expect(events).toEqual(['token']);
  });

  it('error stream sets isStreaming false', () => {
    const controller = new AgentStreamController();
    controller.startStream();
    expect(controller.isStreaming).toBe(true);

    controller.errorStream('Model timeout');
    expect(controller.isStreaming).toBe(false);
  });

  it('reset clears all state', () => {
    const controller = new AgentStreamController();
    controller.startStream();
    controller.appendToken('partial');
    controller.reset();

    expect(controller.isStreaming).toBe(false);
    expect(controller.partialText).toBe('');
  });
});
