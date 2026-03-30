import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  Link2,
  Unlink,
  Loader2,
  QrCode,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
  BellOff,
} from 'lucide-react';
import QRCode from 'qrcode';
import { cn } from '@/utils/cn';

interface TelegramConnectProps {
  telegramStatus: {
    linked: boolean;
    status?: string;
    username?: string;
    firstName?: string;
    mutedUntil?: string;
    linkedAt?: string;
  } | null;
  isLoading: boolean;
  onLink: () => Promise<{ deepLink: string; token: string; expiresAt: string } | null>;
  onUnlink: () => Promise<void>;
  onRefreshStatus: () => Promise<void>;
}

const POLL_INTERVAL_MS = 3_000;
const TOKEN_TTL_MS = 10 * 60 * 1_000; // 10 minutes

export function TelegramConnect({
  telegramStatus,
  isLoading,
  onLink,
  onUnlink,
  onRefreshStatus,
}: TelegramConnectProps) {
  const [deepLink, setDeepLink] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isLinking, setIsLinking] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const expiryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── helpers ──────────────────────────────────────────────────────────────

  const stopPolling = useCallback(() => {
    if (pollRef.current !== null) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (expiryRef.current !== null) {
      clearTimeout(expiryRef.current);
      expiryRef.current = null;
    }
  }, []);

  const cancelLinking = useCallback(() => {
    stopPolling();
    setDeepLink(null);
    setQrDataUrl(null);
    setIsLinking(false);
    setError(null);
  }, [stopPolling]);

  // Stop polling once linked or on unmount
  useEffect(() => {
    if (telegramStatus?.linked && pollRef.current !== null) {
      stopPolling();
      setDeepLink(null);
      setQrDataUrl(null);
      setIsLinking(false);
    }
  }, [telegramStatus?.linked, stopPolling]);

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  // ── generate QR code whenever deepLink changes ────────────────────────────

  useEffect(() => {
    if (!deepLink) {
      setQrDataUrl(null);
      return;
    }

    let cancelled = false;
    QRCode.toDataURL(deepLink, {
      width: 200,
      margin: 2,
      color: { dark: '#1a1a2e', light: '#ffffff' },
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setError('Could not generate QR code.');
      });

    return () => {
      cancelled = true;
    };
  }, [deepLink]);

  // ── actions ───────────────────────────────────────────────────────────────

  const handleConnect = async () => {
    setError(null);
    setIsLinking(true);

    try {
      const result = await onLink();
      if (!result) {
        setError('Failed to generate connection link. Please try again.');
        setIsLinking(false);
        return;
      }

      setDeepLink(result.deepLink);

      // Start polling
      pollRef.current = setInterval(async () => {
        try {
          await onRefreshStatus();
        } catch {
          // non-fatal; keep polling
        }
      }, POLL_INTERVAL_MS);

      // Auto-cancel when token expires
      const msUntilExpiry =
        new Date(result.expiresAt).getTime() - Date.now() || TOKEN_TTL_MS;

      expiryRef.current = setTimeout(() => {
        cancelLinking();
        setError('The connection link expired. Please try again.');
      }, msUntilExpiry);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start Telegram linking.');
      setIsLinking(false);
    }
  };

  const handleUnlink = async () => {
    setError(null);
    setIsUnlinking(true);
    try {
      await onUnlink();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect Telegram.');
    } finally {
      setIsUnlinking(false);
    }
  };

  // ── derived state ─────────────────────────────────────────────────────────

  const isConnected = telegramStatus?.linked === true;

  const isMuted =
    !!telegramStatus?.mutedUntil &&
    new Date(telegramStatus.mutedUntil) > new Date();

  const linkedDate = telegramStatus?.linkedAt
    ? new Date(telegramStatus.linkedAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  const muteUntilFormatted = telegramStatus?.mutedUntil
    ? new Date(telegramStatus.mutedUntil).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 overflow-hidden">
      {/* Card header */}
      <div
        className="p-4"
        style={{ background: 'linear-gradient(135deg, #0088cc 0%, #0077b5 100%)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white">Telegram Notifications</h3>
            <p className="text-white/80 text-sm">Receive alerts directly in Telegram</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        <AnimatePresence mode="wait">
          {/* ── CONNECTED state ──────────────────────────────────────────── */}
          {isConnected && (
            <motion.div
              key="connected"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Success card */}
              <div className="p-4 rounded-xl border-2 bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-full bg-success-500 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-success-700 dark:text-success-400">
                      Telegram Connected
                    </p>
                    {telegramStatus?.username && (
                      <p className="text-sm text-success-600 dark:text-success-500 mt-0.5 truncate">
                        @{telegramStatus.username}
                      </p>
                    )}
                    {!telegramStatus?.username && telegramStatus?.firstName && (
                      <p className="text-sm text-success-600 dark:text-success-500 mt-0.5">
                        {telegramStatus.firstName}
                      </p>
                    )}
                    {linkedDate && (
                      <p className="text-xs text-success-500 dark:text-success-600 mt-1">
                        Linked on {linkedDate}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Mute warning */}
              {isMuted && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="flex items-start gap-3 p-3 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg"
                >
                  <BellOff className="w-4 h-4 text-warning-600 dark:text-warning-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-warning-700 dark:text-warning-400">
                    Notifications are muted until{' '}
                    <span className="font-medium">{muteUntilFormatted}</span>.
                  </p>
                </motion.div>
              )}

              {/* Disconnect button */}
              <button
                onClick={handleUnlink}
                disabled={isUnlinking || isLoading}
                className={cn(
                  'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all',
                  'bg-error-50 dark:bg-error-900/20 text-error-600 dark:text-error-400',
                  'border border-error-200 dark:border-error-800',
                  'hover:bg-error-100 dark:hover:bg-error-900/40',
                  'disabled:opacity-60 disabled:cursor-not-allowed'
                )}
              >
                {isUnlinking ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Disconnecting…
                  </>
                ) : (
                  <>
                    <Unlink className="w-4 h-4" />
                    Disconnect Telegram
                  </>
                )}
              </button>
            </motion.div>
          )}

          {/* ── LINKING IN PROGRESS state ─────────────────────────────────── */}
          {!isConnected && isLinking && deepLink && (
            <motion.div
              key="linking"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              <p className="text-sm text-surface-600 dark:text-surface-400 text-center">
                Scan the QR code with your Telegram app or tap the button below.
              </p>

              {/* QR code */}
              <div className="flex justify-center">
                <div className="p-3 bg-white rounded-xl border border-surface-200 dark:border-surface-600 shadow-sm inline-block">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="Telegram connection QR code"
                      width={200}
                      height={200}
                      className="rounded-lg block"
                    />
                  ) : (
                    <div className="w-[200px] h-[200px] flex items-center justify-center">
                      <QrCode className="w-12 h-12 text-surface-300 dark:text-surface-600" />
                    </div>
                  )}
                </div>
              </div>

              {/* Open in Telegram */}
              <a
                href={deepLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-white transition-all"
                style={{ backgroundColor: '#0088cc' }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.backgroundColor = '#0077b5')
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.backgroundColor = '#0088cc')
                }
              >
                <ExternalLink className="w-4 h-4" />
                Open in Telegram
              </a>

              {/* Waiting indicator */}
              <div className="flex items-center justify-center gap-2 text-sm text-surface-500 dark:text-surface-400">
                <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
                <span>Waiting for connection…</span>
              </div>

              {/* Cancel */}
              <button
                onClick={cancelLinking}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-surface-600 dark:text-surface-400 bg-surface-100 dark:bg-surface-700 hover:bg-surface-200 dark:hover:bg-surface-600 transition-colors"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </motion.div>
          )}

          {/* ── NOT CONNECTED state ───────────────────────────────────────── */}
          {!isConnected && !isLinking && (
            <motion.div
              key="not-connected"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <p className="text-sm text-surface-600 dark:text-surface-400 leading-relaxed">
                Connect your Telegram account to receive real-time notifications for messages,
                document updates, group activity, and important announcements — right inside
                Telegram.
              </p>

              {/* Feature list */}
              <ul className="space-y-2">
                {[
                  'Instant message &amp; mention alerts',
                  'Document publish notifications',
                  'Group and broadcast updates',
                  'Important system announcements',
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400"
                  >
                    <span
                      className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center"
                      style={{ backgroundColor: '#0088cc1a' }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: '#0088cc' }}
                      />
                    </span>
                    <span dangerouslySetInnerHTML={{ __html: item }} />
                  </li>
                ))}
              </ul>

              {/* Connect button */}
              <button
                onClick={handleConnect}
                disabled={isLoading}
                className={cn(
                  'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-white transition-all',
                  'disabled:opacity-60 disabled:cursor-not-allowed'
                )}
                style={{ backgroundColor: '#0088cc' }}
                onMouseEnter={(e) => {
                  if (!(e.currentTarget as HTMLButtonElement).disabled)
                    (e.currentTarget as HTMLElement).style.backgroundColor = '#0077b5';
                }}
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.backgroundColor = '#0088cc')
                }
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading…
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4" />
                    Connect Telegram
                  </>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error display — always rendered outside AnimatePresence so it persists across state transitions */}
        <AnimatePresence>
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="flex items-start gap-3 p-3 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg"
            >
              <AlertCircle className="w-4 h-4 text-error-600 dark:text-error-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-error-700 dark:text-error-400 flex-1">{error}</p>
              <button
                onClick={() => setError(null)}
                aria-label="Dismiss error"
                className="text-error-400 hover:text-error-600 dark:hover:text-error-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
