/**
 * Rate Limiter Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RateLimiter } from '../rate-limiter';

describe('Rate Limiter', () => {
  beforeEach(() => {
    RateLimiter.reset();
  });

  it('allows calls within limits', () => {
    const result = RateLimiter.check();
    expect(result.allowed).toBe(true);
    expect(result.remaining.day).toBe(200);
  });

  it('records calls and decrements remaining', () => {
    RateLimiter.record();
    RateLimiter.record();
    RateLimiter.record();
    const result = RateLimiter.check();
    expect(result.allowed).toBe(true);
    expect(result.remaining.day).toBe(197);
  });

  it('blocks when minute limit reached', () => {
    RateLimiter.updateConfig({ maxPerMinute: 3 });
    RateLimiter.record();
    RateLimiter.record();
    RateLimiter.record();
    const result = RateLimiter.check();
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('calls/minute');
  });

  it('reports usage correctly', () => {
    RateLimiter.record();
    RateLimiter.record();
    const usage = RateLimiter.getUsage();
    expect(usage.day).toBe(2);
    expect(usage.hour).toBe(2);
    expect(usage.minute).toBe(2);
  });

  it('reset clears all counters', () => {
    RateLimiter.record();
    RateLimiter.record();
    RateLimiter.reset();
    const usage = RateLimiter.getUsage();
    expect(usage.day).toBe(0);
  });
});
