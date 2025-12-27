import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Ghana National Colors
        ghana: {
          green: {
            50: '#e6f5ee',
            100: '#ccebdd',
            200: '#99d7bb',
            300: '#66c399',
            400: '#33af77',
            500: '#006B3F', // Primary Ghana Green
            600: '#005632',
            700: '#004026',
            800: '#002b19',
            900: '#00150d',
          },
          gold: {
            50: '#fffdf0',
            100: '#fffbe0',
            200: '#fff7c2',
            300: '#fff3a3',
            400: '#ffef85',
            500: '#FCD116', // Ghana Gold
            600: '#e6bc00',
            700: '#b39200',
            800: '#806900',
            900: '#4d3f00',
          },
          red: {
            50: '#fdf2f3',
            100: '#fbe5e7',
            200: '#f6ccd0',
            300: '#f2b2b9',
            400: '#ed99a1',
            500: '#CE1126', // Ghana Red
            600: '#a50e1f',
            700: '#7c0a17',
            800: '#520710',
            900: '#290308',
          },
          black: '#000000', // Black Star
        },
        // Extended palette for UI
        primary: {
          50: '#e6f5ee',
          100: '#ccebdd',
          200: '#99d7bb',
          300: '#66c399',
          400: '#33af77',
          500: '#006B3F',
          600: '#005632',
          700: '#004026',
          800: '#002b19',
          900: '#00150d',
          DEFAULT: '#006B3F',
        },
        secondary: {
          50: '#fffdf0',
          100: '#fffbe0',
          200: '#fff7c2',
          300: '#fff3a3',
          400: '#ffef85',
          500: '#FCD116',
          600: '#e6bc00',
          700: '#b39200',
          800: '#806900',
          900: '#4d3f00',
          DEFAULT: '#FCD116',
        },
        accent: {
          50: '#fdf2f3',
          100: '#fbe5e7',
          200: '#f6ccd0',
          300: '#f2b2b9',
          400: '#ed99a1',
          500: '#CE1126',
          600: '#a50e1f',
          700: '#7c0a17',
          800: '#520710',
          900: '#290308',
          DEFAULT: '#CE1126',
        },
        // Surface colors - warm, soft tones for light mode
        surface: {
          50: '#faf9f7',   // Warm off-white for cards
          100: '#f5f4f1',  // Softer background
          200: '#eeedea',  // Subtle dividers
          300: '#e0dfdb',  // Borders
          400: '#c8c7c1',  // Muted elements
          500: '#9a9990',  // Secondary text
          600: '#6b6a62',  // Icons
          700: '#464540',  // Dark text
          800: '#2a2926',  // Dark mode cards
          900: '#1a1918',  // Dark mode background
        },
        // Success (forest green variants)
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          DEFAULT: '#10b981',
        },
        // Warning (amber/gold variants)
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          DEFAULT: '#f59e0b',
        },
        // Error (ruby red variants)
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          DEFAULT: '#ef4444',
        },
        // Info (ocean blue)
        info: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          DEFAULT: '#3b82f6',
        },
      },
      fontFamily: {
        heading: ['Playfair Display', 'Georgia', 'serif'],
        body: ['"Bookman Old Style"', 'Bookman', 'Palatino Linotype', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      fontSize: {
        'display-1': ['4.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-2': ['3.75rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'heading-1': ['3rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'heading-2': ['2.25rem', { lineHeight: '1.25', letterSpacing: '-0.01em' }],
        'heading-3': ['1.875rem', { lineHeight: '1.3' }],
        'heading-4': ['1.5rem', { lineHeight: '1.35' }],
        'heading-5': ['1.25rem', { lineHeight: '1.4' }],
        'heading-6': ['1.125rem', { lineHeight: '1.4' }],
        'body-lg': ['1.125rem', { lineHeight: '1.75' }],
        'body-md': ['1rem', { lineHeight: '1.75' }],
        'body-sm': ['0.875rem', { lineHeight: '1.7' }],
        'body-xs': ['0.75rem', { lineHeight: '1.6' }],
      },
      boxShadow: {
        'elevation-1': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        'elevation-2': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        'elevation-3': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
        'elevation-4': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        'elevation-5': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        'ghana-glow': '0 0 20px rgba(0, 107, 63, 0.3)',
        'gold-glow': '0 0 20px rgba(252, 209, 22, 0.4)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
      },
      borderRadius: {
        'xs': '0.25rem',
        'sm': '0.375rem',
        'md': '0.5rem',
        'lg': '0.75rem',
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'fade-out': 'fadeOut 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.4s ease-out',
        'slide-left': 'slideLeft 0.4s ease-out',
        'slide-right': 'slideRight 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'scale-out': 'scaleOut 0.3s ease-out',
        'bounce-soft': 'bounceSoft 0.6s ease-out',
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideLeft: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideRight: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        scaleOut: {
          '0%': { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(0.95)' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      backgroundImage: {
        'ghana-gradient': 'linear-gradient(135deg, #006B3F 0%, #004026 100%)',
        'gold-gradient': 'linear-gradient(135deg, #FCD116 0%, #e6bc00 100%)',
        'red-gradient': 'linear-gradient(135deg, #CE1126 0%, #a50e1f 100%)',
        'flag-horizontal': 'linear-gradient(to bottom, #CE1126 0%, #CE1126 33.33%, #FCD116 33.33%, #FCD116 66.66%, #006B3F 66.66%, #006B3F 100%)',
        'flag-stripe': 'linear-gradient(to right, #CE1126 0%, #CE1126 33.33%, #FCD116 33.33%, #FCD116 66.66%, #006B3F 66.66%, #006B3F 100%)',
        'kente-pattern': 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(252, 209, 22, 0.1) 10px, rgba(252, 209, 22, 0.1) 20px)',
        'shimmer-gradient': 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '112': '28rem',
        '128': '32rem',
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
        '800': '800ms',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};

export default config;
