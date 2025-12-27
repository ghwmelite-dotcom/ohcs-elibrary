import { useState, useEffect, useCallback } from 'react';

interface OfflineArticle {
  id: string;
  title: string;
  summary: string;
  content?: string;
  imageUrl?: string;
  category: string;
  publishedAt: string;
  source?: {
    name: string;
    logoUrl?: string;
  };
  aiSummary?: string;
  readingTimeMinutes?: number;
  savedAt: string;
}

export function useOfflineArticles() {
  const [offlineArticles, setOfflineArticles] = useState<OfflineArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Listen for online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listen for messages from service worker
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'CACHED_ARTICLES') {
        setOfflineArticles(event.data.articles || []);
        setIsLoading(false);
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleMessage);

    // Request cached articles
    getCachedArticles();

    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleMessage);
    };
  }, []);

  // Get all cached articles
  const getCachedArticles = useCallback(() => {
    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'GET_CACHED_ARTICLES'
      });
    } else {
      setIsLoading(false);
    }
  }, []);

  // Save article for offline reading
  const saveForOffline = useCallback(async (article: Omit<OfflineArticle, 'savedAt'>) => {
    if (!navigator.serviceWorker?.controller) {
      console.warn('Service worker not available');
      return false;
    }

    const offlineArticle: OfflineArticle = {
      ...article,
      savedAt: new Date().toISOString(),
    };

    navigator.serviceWorker.controller.postMessage({
      type: 'CACHE_ARTICLE',
      article: offlineArticle
    });

    // Update local state
    setOfflineArticles(prev => {
      const exists = prev.find(a => a.id === article.id);
      if (exists) return prev;
      return [...prev, offlineArticle];
    });

    return true;
  }, []);

  // Remove article from offline storage
  const removeFromOffline = useCallback((articleId: string) => {
    if (!navigator.serviceWorker?.controller) {
      console.warn('Service worker not available');
      return false;
    }

    navigator.serviceWorker.controller.postMessage({
      type: 'UNCACHE_ARTICLE',
      articleId
    });

    // Update local state
    setOfflineArticles(prev => prev.filter(a => a.id !== articleId));

    return true;
  }, []);

  // Check if article is saved for offline
  const isArticleSaved = useCallback((articleId: string) => {
    return offlineArticles.some(a => a.id === articleId);
  }, [offlineArticles]);

  // Toggle offline status for an article
  const toggleOffline = useCallback((article: Omit<OfflineArticle, 'savedAt'>) => {
    if (isArticleSaved(article.id)) {
      removeFromOffline(article.id);
      return false;
    } else {
      saveForOffline(article);
      return true;
    }
  }, [isArticleSaved, removeFromOffline, saveForOffline]);

  return {
    offlineArticles,
    isLoading,
    isOnline,
    saveForOffline,
    removeFromOffline,
    isArticleSaved,
    toggleOffline,
    refreshOfflineArticles: getCachedArticles,
  };
}

// Hook to show offline status indicator
export function useOfflineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
