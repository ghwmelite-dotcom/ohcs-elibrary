import { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Sun,
  Moon,
  Monitor,
  Type,
  Palette,
  Eye,
  Sparkles,
  Check,
  Minus,
  Plus
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useThemeStore } from '@/stores/themeStore';
import type { UserSettings } from '@/stores/settingsStore';

interface AppearanceSettingsProps {
  settings: UserSettings | null;
  isSaving: boolean;
  onUpdate: (updates: Partial<UserSettings>) => Promise<void>;
}

// CSS variable mappings for different settings
const fontSizeMap = {
  small: '14px',
  medium: '16px',
  large: '18px',
  xlarge: '20px',
};

const accentColorMap = {
  green: { primary: '#006B3F', secondary: '#FFD700' },
  blue: { primary: '#3B82F6', secondary: '#60A5FA' },
  purple: { primary: '#8B5CF6', secondary: '#A78BFA' },
  orange: { primary: '#F97316', secondary: '#FB923C' },
  red: { primary: '#CE1126', secondary: '#EF4444' },
};

export function AppearanceSettings({ settings, isSaving, onUpdate }: AppearanceSettingsProps) {
  const { theme: currentTheme, setTheme } = useThemeStore();

  const themeOptions = [
    { id: 'light', label: 'Light', icon: Sun, description: 'Light background with dark text' },
    { id: 'dark', label: 'Dark', icon: Moon, description: 'Dark background with light text' },
    { id: 'system', label: 'System', icon: Monitor, description: 'Match your system preferences' },
  ];

  const accentColors = [
    { id: 'green', label: 'Ghana Green', color: 'bg-[#006B3F]', hover: 'hover:ring-[#006B3F]' },
    { id: 'blue', label: 'Ocean Blue', color: 'bg-blue-500', hover: 'hover:ring-blue-500' },
    { id: 'purple', label: 'Royal Purple', color: 'bg-purple-500', hover: 'hover:ring-purple-500' },
    { id: 'orange', label: 'Sunset Orange', color: 'bg-orange-500', hover: 'hover:ring-orange-500' },
    { id: 'red', label: 'Ghana Red', color: 'bg-[#CE1126]', hover: 'hover:ring-[#CE1126]' },
  ];

  const fontSizes = [
    { id: 'small', label: 'Small', preview: 'text-sm' },
    { id: 'medium', label: 'Medium', preview: 'text-base' },
    { id: 'large', label: 'Large', preview: 'text-lg' },
    { id: 'xlarge', label: 'Extra Large', preview: 'text-xl' },
  ];

  const fontFamilies = [
    { id: 'system', label: 'System Default', preview: 'font-sans' },
    { id: 'inter', label: 'Inter', preview: 'font-sans' },
    { id: 'roboto', label: 'Roboto', preview: 'font-sans' },
    { id: 'open-sans', label: 'Open Sans', preview: 'font-sans' },
  ];

  // Apply settings to CSS variables when settings change
  useEffect(() => {
    if (!settings) return;

    const root = document.documentElement;

    // Apply font size
    if (settings.fontSize) {
      root.style.setProperty('--app-font-size', fontSizeMap[settings.fontSize] || '16px');
      root.style.fontSize = fontSizeMap[settings.fontSize] || '16px';
    }

    // Apply reduced motion
    if (settings.reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }

    // Apply high contrast
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Apply compact mode
    if (settings.compactMode) {
      root.classList.add('compact-mode');
    } else {
      root.classList.remove('compact-mode');
    }
  }, [settings]);

  // Handle theme change - update both themeStore (for immediate effect) and settingsStore (for persistence)
  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'system') => {
    // Update themeStore for immediate effect
    setTheme(newTheme);
    // Update settingsStore for API persistence
    await onUpdate({ theme: newTheme });
  };

  if (!settings) {
    return (
      <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Theme Selection */}
      <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-secondary-100 dark:bg-secondary-900/30 rounded-lg flex items-center justify-center">
            <Palette className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
          </div>
          <div>
            <h3 className="font-semibold text-surface-900 dark:text-white">Theme</h3>
            <p className="text-sm text-surface-500">Choose your preferred color scheme</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {themeOptions.map((option) => (
            <motion.button
              key={option.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleThemeChange(option.id as 'light' | 'dark' | 'system')}
              className={cn(
                'relative flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all',
                currentTheme === option.id
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600'
              )}
            >
              {currentTheme === option.id && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
              <div className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center',
                currentTheme === option.id
                  ? 'bg-primary-100 dark:bg-primary-900/40'
                  : 'bg-surface-100 dark:bg-surface-700'
              )}>
                <option.icon className={cn(
                  'w-6 h-6',
                  currentTheme === option.id
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-surface-500'
                )} />
              </div>
              <div className="text-center">
                <p className={cn(
                  'font-medium',
                  currentTheme === option.id
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-surface-700 dark:text-surface-300'
                )}>
                  {option.label}
                </p>
                <p className="text-xs text-surface-500 mt-1">{option.description}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Accent Color */}
      <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-surface-900 dark:text-white">Accent Color</h3>
            <p className="text-sm text-surface-500">Customize your interface color</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {accentColors.map((color) => (
            <button
              key={color.id}
              onClick={() => onUpdate({ accentColor: color.id as UserSettings['accentColor'] })}
              className={cn(
                'relative w-12 h-12 rounded-xl transition-all ring-2 ring-offset-2 ring-offset-white dark:ring-offset-surface-800',
                color.color,
                settings.accentColor === color.id
                  ? 'ring-surface-900 dark:ring-white scale-110'
                  : 'ring-transparent hover:scale-105',
                color.hover
              )}
              title={color.label}
            >
              {settings.accentColor === color.id && (
                <Check className="absolute inset-0 m-auto w-5 h-5 text-white" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Font Size */}
      <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-warning-100 dark:bg-warning-900/30 rounded-lg flex items-center justify-center">
            <Type className="w-5 h-5 text-warning-600 dark:text-warning-400" />
          </div>
          <div>
            <h3 className="font-semibold text-surface-900 dark:text-white">Font Size</h3>
            <p className="text-sm text-surface-500">Adjust text size for better readability</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {fontSizes.map((size) => (
            <button
              key={size.id}
              onClick={() => onUpdate({ fontSize: size.id as UserSettings['fontSize'] })}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                settings.fontSize === size.id
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600'
              )}
            >
              <span className={cn(
                'font-medium text-surface-900 dark:text-white',
                size.preview
              )}>
                Aa
              </span>
              <span className="text-xs text-surface-500">{size.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Display Options */}
      <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-success-100 dark:bg-success-900/30 rounded-lg flex items-center justify-center">
            <Eye className="w-5 h-5 text-success-600 dark:text-success-400" />
          </div>
          <div>
            <h3 className="font-semibold text-surface-900 dark:text-white">Display Options</h3>
            <p className="text-sm text-surface-500">Customize your viewing experience</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Compact Mode */}
          <label className="flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-700/50 rounded-xl cursor-pointer">
            <div>
              <p className="font-medium text-surface-900 dark:text-white">Compact Mode</p>
              <p className="text-sm text-surface-500">Reduce spacing for more content</p>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={settings.compactMode}
                onChange={(e) => onUpdate({ compactMode: e.target.checked })}
                className="sr-only"
              />
              <div className={cn(
                'w-11 h-6 rounded-full transition-colors',
                settings.compactMode ? 'bg-primary-600' : 'bg-surface-300 dark:bg-surface-600'
              )}>
                <div className={cn(
                  'w-5 h-5 bg-white rounded-full shadow transition-transform mt-0.5 ml-0.5',
                  settings.compactMode && 'translate-x-5'
                )} />
              </div>
            </div>
          </label>

          {/* Reduced Motion */}
          <label className="flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-700/50 rounded-xl cursor-pointer">
            <div>
              <p className="font-medium text-surface-900 dark:text-white">Reduced Motion</p>
              <p className="text-sm text-surface-500">Minimize animations</p>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={settings.reducedMotion}
                onChange={(e) => onUpdate({ reducedMotion: e.target.checked })}
                className="sr-only"
              />
              <div className={cn(
                'w-11 h-6 rounded-full transition-colors',
                settings.reducedMotion ? 'bg-primary-600' : 'bg-surface-300 dark:bg-surface-600'
              )}>
                <div className={cn(
                  'w-5 h-5 bg-white rounded-full shadow transition-transform mt-0.5 ml-0.5',
                  settings.reducedMotion && 'translate-x-5'
                )} />
              </div>
            </div>
          </label>

          {/* High Contrast */}
          <label className="flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-700/50 rounded-xl cursor-pointer">
            <div>
              <p className="font-medium text-surface-900 dark:text-white">High Contrast</p>
              <p className="text-sm text-surface-500">Increase contrast for accessibility</p>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={settings.highContrast}
                onChange={(e) => onUpdate({ highContrast: e.target.checked })}
                className="sr-only"
              />
              <div className={cn(
                'w-11 h-6 rounded-full transition-colors',
                settings.highContrast ? 'bg-primary-600' : 'bg-surface-300 dark:bg-surface-600'
              )}>
                <div className={cn(
                  'w-5 h-5 bg-white rounded-full shadow transition-transform mt-0.5 ml-0.5',
                  settings.highContrast && 'translate-x-5'
                )} />
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Save indicator */}
      {isSaving && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg shadow-lg"
        >
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Saving...
        </motion.div>
      )}
    </div>
  );
}
