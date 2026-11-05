import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe2, MapPin, Camera, Bell, CheckCircle2, ChevronRight } from 'lucide-react';
import { SUPPORTED_LANGUAGES, SupportedLanguageCode, setAppLanguage } from '@/i18n';
import { setOnboardingCompleted } from '@/storage';
import { CustomButton } from '@/components/common/CustomButton';
import { DemoBadge } from '@/components/common/DemoBadge';

interface OnboardingScreenProps {
  onComplete: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const { t, i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguageCode>(
    (i18n.language as SupportedLanguageCode) || 'en'
  );
  const [requesting, setRequesting] = useState<boolean>(false);

  const handleLanguageSelect = (lang: SupportedLanguageCode) => {
    setSelectedLanguage(lang);
    setAppLanguage(lang);
  };

  const handlePermissionsAndFinish = async () => {
    setRequesting(true);
    // Request browser permissions if available
    try {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          () => {},
          () => {},
          { timeout: 3000 }
        );
      }
      if ('Notification' in window && Notification.permission !== 'granted') {
        try {
          await Notification.requestPermission();
        } catch (e) {}
      }
    } finally {
      setRequesting(false);
      setOnboardingCompleted(true);
      onComplete();
    }
  };

  const handleSkip = () => {
    setOnboardingCompleted(true);
    onComplete();
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col justify-between p-5 max-w-lg mx-auto">
      <div>
        {/* Header */}
        <div className="mb-6 pt-2">
          <DemoBadge />
          <p className="text-xs uppercase tracking-wider text-sky-600 font-extrabold mt-2">
            {t('common.appName')}
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1 leading-tight">
            {t('onboarding.welcomeTitle')}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
            {t('onboarding.welcomeSubtitle')}
          </p>
        </div>

        {/* 1. Language Selection */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Globe2 className="w-5 h-5 text-sky-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {t('onboarding.selectLanguage')}
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = selectedLanguage === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleLanguageSelect(lang.code)}
                  className={`relative p-3.5 rounded-xl border text-left transition-all cursor-pointer min-h-[64px] flex flex-col justify-center ${
                    isSelected
                      ? 'border-sky-600 bg-sky-50 dark:bg-sky-950/60 dark:border-sky-500'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:border-slate-300'
                  }`}
                >
                  <span className={`text-base font-bold ${isSelected ? 'text-sky-700 dark:text-sky-300' : 'text-slate-900 dark:text-slate-100'}`}>
                    {lang.nativeName}
                  </span>
                  <span className={`text-xs ${isSelected ? 'text-sky-600 dark:text-sky-400' : 'text-slate-500 dark:text-slate-400'}`}>
                    {lang.label}
                  </span>
                  {isSelected && (
                    <CheckCircle2 className="w-4 h-4 text-sky-600 dark:text-sky-400 absolute top-3 right-3" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Transparent Permissions Explanation */}
        <div className="mb-6">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {t('onboarding.permissionsTitle')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-3">
            {t('onboarding.permissionsSubtitle')}
          </p>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
              <div className="w-9 h-9 rounded-full bg-sky-100 dark:bg-sky-900/60 flex items-center justify-center shrink-0 text-sky-600 dark:text-sky-300">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {t('onboarding.locationPermTitle')}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                  {t('onboarding.locationPermDesc')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
              <div className="w-9 h-9 rounded-full bg-sky-100 dark:bg-sky-900/60 flex items-center justify-center shrink-0 text-sky-600 dark:text-sky-300">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {t('onboarding.cameraPermTitle')}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                  {t('onboarding.cameraPermDesc')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
              <div className="w-9 h-9 rounded-full bg-sky-100 dark:bg-sky-900/60 flex items-center justify-center shrink-0 text-sky-600 dark:text-sky-300">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {t('onboarding.notificationPermTitle')}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                  {t('onboarding.notificationPermDesc')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2.5">
        <CustomButton
          title={t('onboarding.grantPermissions')}
          onClick={handlePermissionsAndFinish}
          size="lg"
          loading={requesting}
          icon={<ChevronRight className="w-5 h-5" />}
          className="w-full"
        />
        <button
          type="button"
          onClick={handleSkip}
          className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-center py-2"
        >
          {t('onboarding.skipPermissions')}
        </button>
      </div>
    </div>
  );
};
