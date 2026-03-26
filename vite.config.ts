import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    // Cloudflare Pages handles compression automatically — no pre-compression needed
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@api': path.resolve(__dirname, './src/api'),
      '@types': path.resolve(__dirname, './src/types'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@mocks': path.resolve(__dirname, './src/mocks'),
    },
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    target: 'esnext',
    minify: 'terser',
    cssCodeSplit: true,
    cssMinify: 'lightningcss',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        passes: 2, // Multiple passes for better compression
        pure_funcs: ['console.info', 'console.debug', 'console.warn'],
      },
      mangle: {
        safari10: true,
      },
      format: {
        comments: false, // Remove all comments
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React - loaded immediately
          'react-core': ['react', 'react-dom'],
          // Router - loaded with app shell
          router: ['react-router-dom'],
          // Animation library - can be deferred
          animation: ['framer-motion'],
          // Icons - tree-shaken but still sizeable
          icons: ['lucide-react'],
          // Form handling
          forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
          // State management
          state: ['zustand', '@tanstack/react-query'],
          // PDF viewer - only loaded when needed
          pdf: ['react-pdf'],
          // Date utilities
          dates: ['date-fns'],
          // Common utilities
          utils: ['axios', 'clsx', 'tailwind-merge'],
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
  },
});
