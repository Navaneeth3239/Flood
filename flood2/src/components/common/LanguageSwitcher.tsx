import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

interface LanguageSwitcherProps {
  className?: string;
  fullWidth?: boolean;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  className = '',
  fullWidth = false,
}) => {
  const { i18n } = useTranslation();

  const languages = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
    { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
    { code: 'ml', label: 'Malayalam', native: 'മലയാളം' },
  ];

  const handleLanguageChange = (code: string) => {
    i18n.changeLanguage(code);
    document.documentElement.lang = code;
  };

  return (
    <div
      role="radiogroup"
      aria-label="Language selection"
      className={`flex items-center rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700 ${
        fullWidth ? 'w-full justify-between' : ''
      } ${className}`}
    >
      <div className="hidden md:flex items-center px-1.5 text-slate-400">
        <Globe className="w-3.5 h-3.5" aria-hidden="true" />
      </div>
      {languages.map((lang) => {
        const isActive = i18n.resolvedLanguage === lang.code || i18n.language === lang.code;
        return (
          <button
            key={lang.code}
            role="radio"
            aria-checked={isActive}
            onClick={() => handleLanguageChange(lang.code)}
            className={`px-2 py-1 text-xs font-semibold rounded-md transition-all ${
              fullWidth ? 'flex-1 text-center' : ''
            } ${
              isActive
                ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            aria-label={`Switch language to ${lang.native} (${lang.label})`}
          >
            {lang.native}
          </button>
        );
      })}
    </div>
  );
};
