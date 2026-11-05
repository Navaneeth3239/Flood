import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Globe2,
  Bell,
  Shield,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { SUPPORTED_LANGUAGES, SupportedLanguageCode, setAppLanguage } from '@/i18n';
import {
  getUserSettings,
  saveUserSettings,
  clearAllLocalUserData,
} from '@/storage';
import { isMockDataEnabled } from '@/mocks';
import { CustomButton } from '@/components/common/CustomButton';
import { DemoBadge } from '@/components/common/DemoBadge';
import { UserSettings, AlertSeverity } from '@/types';

interface SettingsScreenProps {
  onResetApp?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onResetApp }) => {
  const { t, i18n } = useTranslation();
  const isMock = isMockDataEnabled();

  const [settings, setSettings] = useState<UserSettings>(getUserSettings());

  const handleLanguageChange = (lang: SupportedLanguageCode) => {
    setAppLanguage(lang);
    setSettings((prev) => ({ ...prev, language: lang }));
  };

  const handleSeverityChange = (severity: AlertSeverity) => {
    const updated = saveUserSettings({ minAlertSeverity: severity });
    setSettings(updated);
  };

  const handleRadiusChange = (radius: number) => {
    const updated = saveUserSettings({ alertRadiusKm: radius });
    setSettings(updated);
  };

  const handleDeleteData = () => {
    if (!confirm(t('settings.deleteConfirm'))) return;
    clearAllLocalUserData();
    alert('All local reports, cached alerts, and preferences have been cleared.');
    if (onResetApp) onResetApp();
  };

  return (
    <div className="p-4 sm:p-5 max-w-lg mx-auto pb-24 space-y-4">
      <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
        {t('settings.title')}
      </h1>

      {/* Mode Status Card */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/90 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            {t('settings.modeLabel', {
              mode: isMock ? t('settings.modeMock') : t('settings.modeLive'),
            })}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isMock ? t('common.mockModeNotice') : 'Connected to live disaster management API'}
          </p>
        </div>
        <DemoBadge />
      </div>

      {/* 1. Language Preference */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/90 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <Globe2 className="w-5 h-5 text-sky-600" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            {t('settings.languageTitle')}
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {SUPPORTED_LANGUAGES.map((item) => {
            const isSelected = i18n.language === item.code;
            return (
              <button
                key={item.code}
                onClick={() => handleLanguageChange(item.code)}
                className={`p-3 rounded-xl border text-left flex flex-col justify-center cursor-pointer transition-all ${
                  isSelected
                    ? 'border-sky-600 bg-sky-50 dark:bg-sky-950/60 dark:border-sky-500'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60'
                }`}
              >
                <span className={`text-sm font-bold ${isSelected ? 'text-sky-700 dark:text-sky-300' : 'text-slate-900 dark:text-white'}`}>
                  {item.nativeName}
                </span>
                <span className="text-[11px] text-slate-500">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Notification Preferences */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/90 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-sky-600" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            {t('settings.notificationsTitle')}
          </h2>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
            {t('settings.minSeverityLabel')}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['watch', 'warning', 'danger'] as AlertSeverity[]).map((s) => {
              const isSelected = settings.minAlertSeverity === s;
              return (
                <button
                  key={s}
                  onClick={() => handleSeverityChange(s)}
                  className={`py-2 px-3 rounded-lg border text-xs font-extrabold uppercase tracking-wider cursor-pointer ${
                    isSelected
                      ? 'bg-sky-600 text-white border-sky-600'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
            {t('settings.radiusLabel', { km: settings.alertRadiusKm })}
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[5, 10, 20, 50].map((r) => {
              const isSelected = settings.alertRadiusKm === r;
              return (
                <button
                  key={r}
                  onClick={() => handleRadiusChange(r)}
                  className={`py-2 rounded-lg border text-xs font-bold cursor-pointer ${
                    isSelected
                      ? 'bg-sky-600 text-white border-sky-600'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {r} km
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Data & Privacy */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/90 shadow-xs space-y-2">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-600" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            {t('settings.privacyTitle')}
          </h2>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          {t('settings.privacyDesc')}
        </p>
      </div>

      {/* 4. Delete Data Action */}
      <div className="pt-2">
        <CustomButton
          title={t('settings.deleteDataButton')}
          onClick={handleDeleteData}
          variant="danger"
          icon={<Trash2 className="w-4 h-4" />}
          className="w-full"
        />
      </div>

      <p className="text-center text-xs text-slate-400 pt-2">
        {t('settings.version', { version: '1.0.0 Web Edition' })}
      </p>
    </div>
  );
};
