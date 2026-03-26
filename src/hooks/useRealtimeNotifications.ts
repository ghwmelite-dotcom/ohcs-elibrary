/**
 * useRealtimeNotifications — hook that drives background notification polling.
 *
 * Behaviour:
 * - Polls `GET /api/v1/notifications/summary` every 30 seconds when the user
 *   is authenticated, keeping the unread badge in the header current.
 * - Suspends polling while the browser tab is hidden (Page Visibility API) and
 *   resumes immediately when the user brings the tab back to the foreground.
 * - Cleans up the interval and the visibility listener on unmount / auth change.
 *
 * Usage:
 *   Call once inside the authenticated layout (MainLayout) so the effect is
 *   mounted for the lifetime of the authenticated session.
 *
 *   ```tsx
 *   export function MainLayout() {
 *     useRealtimeNotifications();
 *     // ...
 *   }
 *   ```
 *
 * Note: MainLayout already polls fetchNotifications() + fetchSummary() in its
 * own useEffect. This hook is intentionally lightweight — it only calls
 * fetchSummary() on a visibility-aware schedule so it can be safely composed
 * alongside the existing full-notification fetch without doubling requests.
 * Callers who want to replace the MainLayout polling entirely can extend this
 * hook to also call fetchNotifications() and remove the setInterval in
 * MainLayout.
 */

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';

const POLL_INTERVAL_MS = 30_000; // 30 seconds — matches server-side cache TTL

export function useRealtimeNotifications(): void {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.token);

  // Stable refs to store actions so effects don't need them in the dep array.
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);
  const fetchSummary = useNotificationStore((s) => s.fetchSummary);
  const fetchNotificationsRef = useRef(fetchNotifications);
  const fetchSummaryRef = useRef(fetchSummary);

  // Keep refs current whenever Zustand returns a new function reference.
  useEffect(() => {
    fetchNotificationsRef.current = fetchNotifications;
  }, [fetchNotifications]);

  useEffect(() => {
    fetchSummaryRef.current = fetchSummary;
  }, [fetchSummary]);

  useEffect(() => {
    // Gate: only poll for authenticated users with a valid token.
    if (!isAuthenticated || !token) return;

    let intervalId: ReturnType<typeof setInterval> | null = null;

    /**
     * Fetch both the lightweight summary (unread count) and the full
     * notifications list so the bell badge AND notification centre stay fresh.
     */
    const tick = (): void => {
      void fetchSummaryRef.current();
      void fetchNotificationsRef.current();
    };

    const startPolling = (): void => {
      // Immediate fetch so the UI reflects current state right away.
      tick();
      intervalId = setInterval(tick, POLL_INTERVAL_MS);
    };

    const stopPolling = (): void => {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const handleVisibilityChange = (): void => {
      if (document.hidden) {
        // Tab went into the background — pause polling to conserve resources
        // and avoid hitting the API when the user isn't looking.
        stopPolling();
      } else {
        // Tab came back to the foreground — resume immediately so the user
        // sees up-to-date data without waiting for the next interval.
        startPolling();
      }
    };

    // Begin polling only if the tab is currently visible.
    if (!document.hidden) {
      startPolling();
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return (): void => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, token]);
}
