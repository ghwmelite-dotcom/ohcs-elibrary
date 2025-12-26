import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  isUpdateAvailable: boolean;
  isIOS: boolean;
  isStandalone: boolean;
}

interface UsePWAReturn extends PWAState {
  installApp: () => Promise<boolean>;
  dismissInstallPrompt: () => void;
  updateApp: () => void;
}

export function usePWA(): UsePWAReturn {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [state, setState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isUpdateAvailable: false,
    isIOS: false,
    isStandalone: false,
  });

  // Check if running on iOS
  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                         (window.navigator as any).standalone === true;
    const isInstalled = isStandalone || localStorage.getItem('pwa-installed') === 'true';

    setState(prev => ({
      ...prev,
      isIOS,
      isStandalone,
      isInstalled,
    }));
  }, []);

  // Handle beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setState(prev => ({ ...prev, isInstallable: true }));
    };

    const handleAppInstalled = () => {
      setInstallPrompt(null);
      localStorage.setItem('pwa-installed', 'true');
      setState(prev => ({
        ...prev,
        isInstallable: false,
        isInstalled: true,
      }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setState(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setState(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Install the app
  const installApp = useCallback(async (): Promise<boolean> => {
    if (!installPrompt) {
      // For iOS, we can't trigger install - user must do it manually
      if (state.isIOS) {
        return false;
      }
      return false;
    }

    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;

      if (outcome === 'accepted') {
        setInstallPrompt(null);
        setState(prev => ({
          ...prev,
          isInstallable: false,
          isInstalled: true,
        }));
        localStorage.setItem('pwa-installed', 'true');
        return true;
      }
      return false;
    } catch (error) {
      console.error('[PWA] Install failed:', error);
      return false;
    }
  }, [installPrompt, state.isIOS]);

  // Dismiss install prompt
  const dismissInstallPrompt = useCallback(() => {
    setInstallPrompt(null);
    setState(prev => ({ ...prev, isInstallable: false }));
    // Remember dismissal for 7 days
    localStorage.setItem('pwa-dismiss-time', Date.now().toString());
  }, []);

  // Update the app (reload)
  const updateApp = useCallback(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.update();
      });
    }
    window.location.reload();
  }, []);

  return {
    ...state,
    installApp,
    dismissInstallPrompt,
    updateApp,
  };
}

// Check if install prompt was recently dismissed
export function shouldShowInstallPrompt(): boolean {
  const dismissTime = localStorage.getItem('pwa-dismiss-time');
  if (!dismissTime) return true;

  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  return Date.now() - parseInt(dismissTime, 10) > sevenDays;
}

export default usePWA;
