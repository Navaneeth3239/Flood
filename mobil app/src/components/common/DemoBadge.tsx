import React from 'react';
import { useTranslation } from 'react-i18next';
import { isMockDataEnabled } from '@/mocks';

export const DemoBadge: React.FC = () => {
  const { t } = useTranslation();

  if (!isMockDataEnabled()) {
    return null;
  }

  return (
    <div
      role="status"
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-amber-900/80 text-amber-200 border border-amber-500/60 shadow-xs"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
      {t('common.demoDataBadge')}
    </div>
  );
};
