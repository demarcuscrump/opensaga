/**
 * Rate Limiter / Cost Guard — Prevents accidental API spend
 *
 * Tracks:
 * - Calls per minute (burst protection)
 * - Calls per hour (sustained protection)
 * - Daily call budget (cost cap)
 *
 * Persists counts to localStorage so they survive page refreshes.
 * Resets automatically when time windows expire.
 */

const STORAGE_KEY = 'opensaga-rate-limits';

interface RateLimitState {
  minuteCalls: number;
  minuteStart: number;
  hourCalls: number;
  hourStart: number;
  dayCalls: number;
  dayStart: number;
}

interface RateLimitConfig {
  maxPerMinute: number;
  maxPerHour: number;
  maxPerDay: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxPerMinute: 10,
  maxPerHour: 60,
  maxPerDay: 200,
};

class RateLimiterImpl {
  private config: RateLimitConfig;

  constructor(config?: Partial<RateLimitConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  private getState(): RateLimitState {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return this.freshState();
  }

  private setState(state: RateLimitState): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }

  private freshState(): RateLimitState {
    const now = Date.now();
    return {
      minuteCalls: 0,
      minuteStart: now,
      hourCalls: 0,
      hourStart: now,
      dayCalls: 0,
      dayStart: now,
    };
  }

  /**
   * Check if a call is allowed. Returns { allowed, reason }.
   */
  check(): { allowed: boolean; reason?: string; remaining: { minute: number; hour: number; day: number } } {
    const state = this.getState();
    const now = Date.now();

    // Reset windows if expired
    if (now - state.minuteStart > 60_000) {
      state.minuteCalls = 0;
      state.minuteStart = now;
    }
    if (now - state.hourStart > 3_600_000) {
      state.hourCalls = 0;
      state.hourStart = now;
    }
    if (now - state.dayStart > 86_400_000) {
      state.dayCalls = 0;
      state.dayStart = now;
    }

    const remaining = {
      minute: Math.max(0, this.config.maxPerMinute - state.minuteCalls),
      hour: Math.max(0, this.config.maxPerHour - state.hourCalls),
      day: Math.max(0, this.config.maxPerDay - state.dayCalls),
    };

    if (state.minuteCalls >= this.config.maxPerMinute) {
      this.setState(state);
      return { allowed: false, reason: `Rate limit: max ${this.config.maxPerMinute} calls/minute reached. Wait a moment.`, remaining };
    }
    if (state.hourCalls >= this.config.maxPerHour) {
      this.setState(state);
      return { allowed: false, reason: `Hourly limit: max ${this.config.maxPerHour} calls/hour reached. Take a break.`, remaining };
    }
    if (state.dayCalls >= this.config.maxPerDay) {
      this.setState(state);
      return { allowed: false, reason: `Daily budget: max ${this.config.maxPerDay} calls/day reached. Resets tomorrow.`, remaining };
    }

    this.setState(state);
    return { allowed: true, remaining };
  }

  /**
   * Record a call. Call this after a successful check.
   */
  record(): void {
    const state = this.getState();
    const now = Date.now();

    if (now - state.minuteStart > 60_000) {
      state.minuteCalls = 0;
      state.minuteStart = now;
    }
    if (now - state.hourStart > 3_600_000) {
      state.hourCalls = 0;
      state.hourStart = now;
    }
    if (now - state.dayStart > 86_400_000) {
      state.dayCalls = 0;
      state.dayStart = now;
    }

    state.minuteCalls++;
    state.hourCalls++;
    state.dayCalls++;
    this.setState(state);
  }

  /**
   * Get current usage stats
   */
  getUsage(): { minute: number; hour: number; day: number; limits: RateLimitConfig } {
    const state = this.getState();
    const now = Date.now();

    return {
      minute: now - state.minuteStart > 60_000 ? 0 : state.minuteCalls,
      hour: now - state.hourStart > 3_600_000 ? 0 : state.hourCalls,
      day: now - state.dayStart > 86_400_000 ? 0 : state.dayCalls,
      limits: this.config,
    };
  }

  /**
   * Update config (user can customize limits in settings)
   */
  updateConfig(config: Partial<RateLimitConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Reset all counters
   */
  reset(): void {
    this.setState(this.freshState());
  }
}

/** Singleton rate limiter instance */
export const RateLimiter = new RateLimiterImpl();
