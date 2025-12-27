import { motion } from 'framer-motion';
import {
  Bot,
  Sparkles,
  MessageSquare,
  FileText,
  Zap,
  Volume2,
  Brain,
  Wand2,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { cn } from '@/utils/cn';
import type { UserSettings } from '@/stores/settingsStore';

interface AIPreferencesProps {
  settings: UserSettings | null;
  isSaving?: boolean;
  onUpdate: (updates: Partial<UserSettings>) => Promise<void>;
}

export function AIPreferences({ settings, isSaving, onUpdate }: AIPreferencesProps) {
  const voiceOptions = [
    { id: 'default', label: 'Default', description: 'Balanced and neutral' },
    { id: 'professional', label: 'Professional', description: 'Formal and precise' },
    { id: 'friendly', label: 'Friendly', description: 'Casual and approachable' },
  ];

  const responseLengthOptions = [
    { id: 'concise', label: 'Concise', description: 'Brief and to the point', icon: '...' },
    { id: 'balanced', label: 'Balanced', description: 'Moderate detail', icon: '....' },
    { id: 'detailed', label: 'Detailed', description: 'Comprehensive responses', icon: '.....' },
  ];

  if (!settings) {
    return (
      <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      </div>
    );
  }

  const ToggleSwitch = ({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) => (
    <div className="relative">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only"
      />
      <div className={cn(
        'w-11 h-6 rounded-full transition-colors cursor-pointer',
        checked ? 'bg-primary-600' : 'bg-surface-300 dark:bg-surface-600',
        disabled && 'opacity-50 cursor-not-allowed'
      )} onClick={() => !disabled && onChange(!checked)}>
        <div className={cn(
          'w-5 h-5 bg-white rounded-full shadow transition-transform mt-0.5 ml-0.5',
          checked && 'translate-x-5'
        )} />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* AI Master Switch */}
      <div className="bg-gradient-to-br from-primary-500/10 via-secondary-500/10 to-primary-500/10 dark:from-primary-900/30 dark:via-secondary-900/30 dark:to-primary-900/30 rounded-2xl p-6 border border-primary-200 dark:border-primary-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center shadow-lg">
              <Bot className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-surface-900 dark:text-white">AI Assistant</h3>
              <p className="text-sm text-surface-600 dark:text-surface-400">
                Enable AI-powered features across the platform
              </p>
            </div>
          </div>
          <ToggleSwitch
            checked={settings.aiEnabled}
            onChange={(checked) => onUpdate({ aiEnabled: checked })}
          />
        </div>

        {settings.aiEnabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-6"
          >
            <div className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
              <Sparkles className="w-4 h-4 text-primary-500" />
              <span>AI features are enabled. Use the library search and document viewer to access AI-powered summaries and insights.</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* AI Features */}
      <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6">
        <h4 className="font-semibold text-surface-900 dark:text-white mb-6">AI Features</h4>

        <div className="space-y-4">
          {/* Suggestions */}
          <div className={cn(
            'flex items-center justify-between p-4 rounded-xl transition-colors',
            settings.aiEnabled
              ? 'bg-surface-50 dark:bg-surface-700/50'
              : 'bg-surface-100 dark:bg-surface-700/30 opacity-60'
          )}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <p className="font-medium text-surface-900 dark:text-white">Smart Suggestions</p>
                <p className="text-sm text-surface-500">Get AI-powered recommendations</p>
              </div>
            </div>
            <ToggleSwitch
              checked={settings.aiSuggestions}
              onChange={(checked) => onUpdate({ aiSuggestions: checked })}
              disabled={!settings.aiEnabled}
            />
          </div>

          {/* Summarization */}
          <div className={cn(
            'flex items-center justify-between p-4 rounded-xl transition-colors',
            settings.aiEnabled
              ? 'bg-surface-50 dark:bg-surface-700/50'
              : 'bg-surface-100 dark:bg-surface-700/30 opacity-60'
          )}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-secondary-100 dark:bg-secondary-900/30 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
              </div>
              <div>
                <p className="font-medium text-surface-900 dark:text-white">Document Summarization</p>
                <p className="text-sm text-surface-500">Auto-generate document summaries</p>
              </div>
            </div>
            <ToggleSwitch
              checked={settings.aiSummarization}
              onChange={(checked) => onUpdate({ aiSummarization: checked })}
              disabled={!settings.aiEnabled}
            />
          </div>

          {/* Writing Assist */}
          <div className={cn(
            'flex items-center justify-between p-4 rounded-xl transition-colors',
            settings.aiEnabled
              ? 'bg-surface-50 dark:bg-surface-700/50'
              : 'bg-surface-100 dark:bg-surface-700/30 opacity-60'
          )}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-warning-100 dark:bg-warning-900/30 rounded-lg flex items-center justify-center">
                <Wand2 className="w-5 h-5 text-warning-600 dark:text-warning-400" />
              </div>
              <div>
                <p className="font-medium text-surface-900 dark:text-white">Writing Assistant</p>
                <p className="text-sm text-surface-500">Help with drafting and editing</p>
              </div>
            </div>
            <ToggleSwitch
              checked={settings.aiWritingAssist}
              onChange={(checked) => onUpdate({ aiWritingAssist: checked })}
              disabled={!settings.aiEnabled}
            />
          </div>

          {/* Auto-complete */}
          <div className={cn(
            'flex items-center justify-between p-4 rounded-xl transition-colors',
            settings.aiEnabled
              ? 'bg-surface-50 dark:bg-surface-700/50'
              : 'bg-surface-100 dark:bg-surface-700/30 opacity-60'
          )}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-success-100 dark:bg-success-900/30 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-success-600 dark:text-success-400" />
              </div>
              <div>
                <p className="font-medium text-surface-900 dark:text-white">Auto-Complete</p>
                <p className="text-sm text-surface-500">Predictive text while typing</p>
              </div>
            </div>
            <ToggleSwitch
              checked={settings.aiAutoComplete}
              onChange={(checked) => onUpdate({ aiAutoComplete: checked })}
              disabled={!settings.aiEnabled}
            />
          </div>
        </div>
      </div>

      {/* AI Voice/Tone */}
      <div className={cn(
        'bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6 transition-opacity',
        !settings.aiEnabled && 'opacity-60 pointer-events-none'
      )}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
            <Volume2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h4 className="font-semibold text-surface-900 dark:text-white">AI Voice & Tone</h4>
            <p className="text-sm text-surface-500">How AI communicates with you</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {voiceOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => onUpdate({ aiVoice: option.id as UserSettings['aiVoice'] })}
              className={cn(
                'p-4 rounded-xl border-2 text-left transition-all',
                settings.aiVoice === option.id
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600'
              )}
            >
              <p className={cn(
                'font-medium',
                settings.aiVoice === option.id
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-surface-900 dark:text-white'
              )}>
                {option.label}
              </p>
              <p className="text-xs text-surface-500 mt-1">{option.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Response Length */}
      <div className={cn(
        'bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6 transition-opacity',
        !settings.aiEnabled && 'opacity-60 pointer-events-none'
      )}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
            <Brain className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h4 className="font-semibold text-surface-900 dark:text-white">Response Length</h4>
            <p className="text-sm text-surface-500">How detailed should AI responses be</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {responseLengthOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => onUpdate({ aiResponseLength: option.id as UserSettings['aiResponseLength'] })}
              className={cn(
                'p-4 rounded-xl border-2 text-center transition-all',
                settings.aiResponseLength === option.id
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600'
              )}
            >
              <div className="text-2xl mb-2 text-surface-400">{option.icon}</div>
              <p className={cn(
                'font-medium text-sm',
                settings.aiResponseLength === option.id
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-surface-900 dark:text-white'
              )}>
                {option.label}
              </p>
              <p className="text-xs text-surface-500 mt-0.5">{option.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Save indicator */}
      {isSaving && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg shadow-lg z-50"
        >
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Saving...
        </motion.div>
      )}
    </div>
  );
}
