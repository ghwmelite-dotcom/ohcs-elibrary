/**
 * RealtimePoller — singleton service for managing optimized polling across features.
 *
 * Design goals:
 * - One polling registry for the entire app; avoids duplicate timers for the same resource.
 * - Auth-token-aware: update once via setToken(), all active pollers pick it up.
 * - Silent failures: a transient network blip never surfaces an unhandled rejection.
 * - Cheap to start/stop: callers use stable string IDs to register and cancel pollers.
 */

export type EventType = 'messages' | 'notifications' | 'typing' | 'presence';

export interface PollerConfig {
  /** Semantic label — used for debugging, not for routing. */
  type: EventType;
  /** Fully-qualified URL that will be GET-fetched on each tick. */
  endpoint: string;
  /** Polling interval in milliseconds. */
  interval: number;
  /** Callback invoked with the parsed JSON body whenever the response is OK. */
  onData: (data: unknown) => void;
  /** When false, start() is a no-op. Allows conditional polling without extra guards. */
  enabled: boolean;
}

class RealtimePoller {
  private pollers: Map<string, ReturnType<typeof setInterval>> = new Map();
  private token: string | null = null;

  /**
   * Update the bearer token used by all subsequent fetch calls.
   * Call this whenever the auth state changes (login / token refresh / logout).
   */
  setToken(token: string | null): void {
    this.token = token;
  }

  /**
   * Register and immediately start a polling loop for the given ID.
   * If a poller with the same ID is already running it will be stopped first,
   * making this safe to call inside React effects that re-run.
   */
  start(id: string, config: PollerConfig): void {
    // Always clear any existing poller for this ID before creating a new one.
    this.stop(id);

    if (!config.enabled) return;

    const poll = async (): Promise<void> => {
      try {
        const headers: Record<string, string> = {};
        if (this.token) {
          headers['Authorization'] = `Bearer ${this.token}`;
        }

        const res = await fetch(config.endpoint, { headers });

        if (res.ok) {
          const data: unknown = await res.json();
          config.onData(data);
        }
        // Non-2xx responses are silently ignored — the server may be temporarily
        // unavailable (rate-limit, deploy, etc.) and we don't want console noise.
      } catch {
        // Network failures (offline, DNS, timeout) are silently swallowed.
        // The next tick will retry automatically.
      }
    };

    // Fire once immediately so the UI is populated before the first interval fires.
    void poll();

    this.pollers.set(id, setInterval(poll, config.interval));
  }

  /**
   * Stop and remove a specific poller by its registration ID.
   * Safe to call even if the ID was never registered.
   */
  stop(id: string): void {
    const timer = this.pollers.get(id);
    if (timer !== undefined) {
      clearInterval(timer);
      this.pollers.delete(id);
    }
  }

  /**
   * Stop all active pollers. Call this on logout or full app teardown.
   */
  stopAll(): void {
    this.pollers.forEach((timer) => clearInterval(timer));
    this.pollers.clear();
  }

  /**
   * Returns the number of currently active polling loops.
   * Useful for debugging / DevTools display.
   */
  get activeCount(): number {
    return this.pollers.size;
  }

  /**
   * Returns the IDs of all currently active polling loops.
   */
  get activeIds(): string[] {
    return Array.from(this.pollers.keys());
  }
}

// Export a single app-wide instance. Import this object wherever you need
// to start, stop, or reconfigure a polling loop.
export const realtimePoller = new RealtimePoller();
