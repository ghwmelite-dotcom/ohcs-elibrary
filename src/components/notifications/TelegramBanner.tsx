import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Link2, X, ArrowRight } from 'lucide-react';
import { useNotificationStore } from '@/stores/notificationStore';
import QRCode from 'qrcode';

const DISMISS_KEY = 'ohcs-telegram-banner-dismissed';
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function TelegramBanner() {
  const { telegramStatus, isTelegramLoading, fetchTelegramStatus, linkTelegram } = useNotificationStore();
  const [dismissed, setDismissed] = useState(true); // start hidden to avoid flash
  const [linking, setLinking] = useState(false);
  const [deepLink, setDeepLink] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchTelegramStatus();
  }, [fetchTelegramStatus]);

  // Check dismiss state from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DISMISS_KEY);
      if (raw) {
        const dismissedAt = parseInt(raw, 10);
        if (Date.now() - dismissedAt < DISMISS_DURATION_MS) {
          setDismissed(true);
          return;
        }
      }
      setDismissed(false);
    } catch {
      setDismissed(false);
    }
  }, []);

  // Auto-hide if already connected
  const isConnected = telegramStatus?.linked && telegramStatus?.status === 'active';
  if (isConnected || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch { /* ignore */ }
  };

  const handleConnect = async () => {
    setLinking(true);
    const result = await linkTelegram();
    if (result) {
      setDeepLink(result.deepLink);
      try {
        const dataUrl = await QRCode.toDataURL(result.deepLink, {
          width: 140,
          margin: 2,
          color: { dark: '#1a1a2e', light: '#ffffff' },
        });
        setQrDataUrl(dataUrl);
      } catch { /* QR optional */ }
    }
    setLinking(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.98 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-2xl mb-8"
      >
        {/* Background */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, #0088cc 0%, #0077b3 50%, #006699 100%)',
          }}
        />

        {/* Animated pattern */}
        <motion.div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
          animate={{ x: [0, 60], y: [0, 60] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        />

        {/* Floating icons */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-white/15"
            style={{ left: `${20 + i * 30}%`, top: '15%' }}
            animate={{
              y: [-8, 8, -8],
              rotate: [0, 8, -8, 0],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{ duration: 4 + i * 0.5, repeat: Infinity, delay: i * 0.4 }}
          >
            <MessageCircle className="w-8 h-8" />
          </motion.div>
        ))}

        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white/70 hover:text-white"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="relative p-6">
          <AnimatePresence mode="wait">
            {!deepLink ? (
              /* CTA state */
              <motion.div
                key="cta"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <motion.div
                    className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg flex-shrink-0"
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  >
                    <MessageCircle className="w-7 h-7 text-white" />
                  </motion.div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">
                      Get Instant Notifications on Telegram
                    </h3>
                    <p className="text-blue-100 text-sm max-w-lg">
                      Never miss important updates — documents, approvals, and announcements delivered straight to your Telegram.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <button
                    onClick={handleConnect}
                    disabled={isTelegramLoading || linking}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-[#0088cc] font-semibold text-sm hover:bg-blue-50 transition-colors shadow-lg disabled:opacity-60"
                  >
                    <Link2 className="w-4 h-4" />
                    Connect Telegram
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="hidden sm:inline-flex items-center px-4 py-2.5 rounded-xl bg-white/15 text-white/90 font-medium text-sm hover:bg-white/25 transition-colors backdrop-blur-sm"
                  >
                    Maybe Later
                  </button>
                </div>
              </motion.div>
            ) : (
              /* QR / Deep link state */
              <motion.div
                key="link"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col sm:flex-row items-center gap-5"
              >
                {qrDataUrl && (
                  <img
                    src={qrDataUrl}
                    alt="Scan to connect Telegram"
                    className="w-[120px] h-[120px] rounded-xl shadow-lg flex-shrink-0"
                  />
                )}
                <div className="text-center sm:text-left">
                  <h3 className="text-lg font-bold text-white mb-2">
                    Scan or tap to connect
                  </h3>
                  <p className="text-blue-100 text-sm mb-4">
                    Open the link in Telegram to complete the connection. This page will update automatically.
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <a
                      href={deepLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-[#0088cc] font-semibold text-sm hover:bg-blue-50 transition-colors shadow-lg"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Open in Telegram
                    </a>
                    <button
                      onClick={() => { setDeepLink(null); setQrDataUrl(null); }}
                      className="text-sm text-white/70 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
