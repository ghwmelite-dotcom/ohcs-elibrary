import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/utils/cn';

interface Language {
  code: string;
  name: string;
  nativeName: string;
}

const languages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'tw', name: 'Twi', nativeName: 'Twi' },
  { code: 'ee', name: 'Ewe', nativeName: 'Eʋegbe' },
  { code: 'gaa', name: 'Ga', nativeName: 'Gã' },
  { code: 'ha', name: 'Hausa', nativeName: 'Hausa' },
];

export function LanguageSelector() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = languages.find((l) => l.code === i18n.language) || languages[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (code: string) => {
    i18n.changeLanguage(code);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors',
          'text-surface-600 hover:text-surface-900 hover:bg-surface-100',
          'dark:text-surface-300 dark:hover:text-surface-50 dark:hover:bg-surface-700'
        )}
        aria-label="Select language"
        aria-expanded={isOpen}
      >
        <Globe className="w-4 h-4" />
        <span className="hidden sm:inline">{currentLang.nativeName}</span>
        <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div
          className={cn(
            'absolute right-0 top-full mt-1 w-48 py-1 rounded-xl shadow-lg border z-50',
            'bg-white border-surface-200',
            'dark:bg-surface-800 dark:border-surface-700'
          )}
        >
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors text-left',
                'hover:bg-surface-50 dark:hover:bg-surface-700',
                lang.code === currentLang.code
                  ? 'text-primary-600 dark:text-primary-400 font-medium'
                  : 'text-surface-700 dark:text-surface-300'
              )}
            >
              <span className="flex-1">
                <span className="block">{lang.nativeName}</span>
                {lang.nativeName !== lang.name && (
                  <span className="block text-xs text-surface-500">{lang.name}</span>
                )}
              </span>
              {lang.code === currentLang.code && (
                <Check className="w-4 h-4 text-primary-600 dark:text-primary-400" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
