import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';

interface DisclaimerBannerProps {
  compact?: boolean;
}

export const DisclaimerBanner: React.FC<DisclaimerBannerProps> = ({ compact = false }) => {
  const { t } = useTranslation();

  return (
    <div
      role="note"
      className={`flex items-start gap-2.5 bg-amber-50 dark:bg-amber-950/40 border-l-4 border-amber-600 rounded-r-lg border-y border-r border-amber-200 dark:border-amber-900/60 ${
        compact ? 'p-2 my-2 text-xs' : 'p-3 my-3 text-xs sm:text-sm'
      }`}
    >
      <AlertTriangle className={`text-amber-700 dark:text-amber-400 shrink-0 mt-0.5 ${compact ? 'w-4 h-4' : 'w-5 h-5'}`} />
      <p className="text-amber-900 dark:text-amber-200 font-medium leading-relaxed">
        {t('common.disclaimer')}
      </p>
    </div>
  );
};
