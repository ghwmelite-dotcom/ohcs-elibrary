import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

// TEMPORARY: Catch any import-level crash
try {
  console.log('[BOOT] Loading i18n...');
  await import('./i18n');
  console.log('[BOOT] i18n loaded OK');
} catch (e) {
  console.error('[BOOT] i18n CRASHED:', e);
  alert('i18n crash: ' + (e as Error)?.message);
}

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import './styles/globals.css';

console.log('[BOOT] All imports loaded, rendering app...');

// Global error catcher for anything that escapes React
window.addEventListener('error', (e) => {
  console.error('[GLOBAL ERROR]', e.error?.message, e.error?.stack);
  alert('Global error: ' + e.error?.message);
});
window.addEventListener('unhandledrejection', (e) => {
  console.error('[UNHANDLED REJECTION]', e.reason);
  alert('Unhandled rejection: ' + String(e.reason));
});

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
