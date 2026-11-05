import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PhoneCall, Shield, Clock, Info } from 'lucide-react';
import { SafetyInfo } from '@/types';
import { apiClient } from '@/api';
import { getCachedSafetyInfo, setCachedSafetyInfo } from '@/storage';

export const SafetyInfoScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [safetyInfo, setSafetyInfo] = useState<SafetyInfo | null>(null);
  const [activeTab, setActiveTab] = useState<'before' | 'during' | 'after'>('during');
  const [offlineNotice, setOfflineNotice] = useState<string | null>(null);

  useEffect(() => {
    loadSafetyData();
  }, [i18n.language]);

  const loadSafetyData = async () => {
    try {
      const data = await apiClient.getSafetyInfo(i18n.language || 'en');
      setSafetyInfo(data);
      setCachedSafetyInfo(data);
      setOfflineNotice(null);
    } catch (e) {
      const cached = getCachedSafetyInfo();
      if (cached) {
        setSafetyInfo(cached.safetyInfo);
        const time = new Date(cached.lastUpdated).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
        setOfflineNotice(t('common.offlineCached', { time }));
      }
    }
  };

  const contacts = safetyInfo?.emergencyContacts || [];
  const instructions = (safetyInfo?.instructions || []).filter((i) => i.category === activeTab);

  return (
    <div className="p-4 sm:p-5 max-w-lg mx-auto pb-24 space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
          {t('safetyScreen.title')}
        </h1>
        {offlineNotice && (
          <div className="flex items-center gap-1.5 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 text-xs text-amber-800 dark:text-amber-200 mt-2">
            <Clock className="w-4 h-4 shrink-0 text-amber-600" />
            <span>{offlineNotice}</span>
          </div>
        )}
        {i18n.language !== 'en' && (
          <div className="flex items-center gap-1.5 p-2 rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-300 text-xs text-sky-800 dark:text-sky-200 mt-2">
            <Info className="w-4 h-4 shrink-0 text-sky-600" />
            <span>{t('common.needsNativeSpeakerReview')}</span>
          </div>
        )}
      </div>

      {/* 1. Emergency Helplines Section */}
      <div>
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2.5">
          {t('safetyScreen.contactsTitle')}
        </h2>

        {contacts.length === 0 ? (
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-xs text-slate-500">
            {t('safetyScreen.noContacts')}
          </div>
        ) : (
          <div className="space-y-2.5">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/90 shadow-xs flex items-center justify-between gap-3"
              >
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {contact.name}
                  </h3>
                  <p className="text-xs text-slate-500">{contact.department}</p>
                  <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                    {contact.availableHours}
                  </p>
                </div>

                <a
                  href={`tel:${contact.phone.replace(/\s+/g, '')}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 shadow-xs transition-colors"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>{contact.phone}</span>
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Official Safety Instructions */}
      <div>
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2.5">
          {t('safetyScreen.instructionsTitle')}
        </h2>

        {/* Phase Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-slate-200 dark:bg-slate-800 p-1 rounded-xl mb-3">
          {(['before', 'during', 'after'] as const).map((phase) => {
            const isSelected = activeTab === phase;
            const labels = {
              before: t('safetyScreen.categoryBefore'),
              during: t('safetyScreen.categoryDuring'),
              after: t('safetyScreen.categoryAfter'),
            };
            return (
              <button
                key={phase}
                onClick={() => setActiveTab(phase)}
                className={`py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {labels[phase]}
              </button>
            );
          })}
        </div>

        {/* Steps List */}
        <div className="space-y-3">
          {instructions.map((inst) => (
            <div
              key={inst.id}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/90 shadow-xs space-y-3"
            >
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {inst.title}
              </h3>
              <div className="space-y-2">
                {inst.steps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    <span className="w-5 h-5 rounded-full bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
              {inst.officialSource && (
                <p className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-100 dark:border-slate-800">
                  {t('safetyScreen.sourceLabel', { source: inst.officialSource })}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
