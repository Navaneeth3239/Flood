import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Home,
  PlusCircle,
  MapPin,
  ClipboardList,
  Shield,
  Settings as SettingsIcon,
  Globe2,
  Smartphone,
  Maximize2,
} from 'lucide-react';

import { isOnboardingCompleted } from '@/storage';
import { ConnectivityIndicator } from '@/components/common/ConnectivityIndicator';
import { OnboardingScreen } from '@/screens/OnboardingScreen';
import { HomeScreen } from '@/screens/HomeScreen';
import { ReportFormScreen } from '@/screens/ReportFormScreen';
import { MyReportsScreen } from '@/screens/MyReportsScreen';
import { ReportDetailScreen } from '@/screens/ReportDetailScreen';
import { NearbyMapScreen } from '@/screens/NearbyMapScreen';
import { SafetyInfoScreen } from '@/screens/SafetyInfoScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { SUPPORTED_LANGUAGES, setAppLanguage, SupportedLanguageCode } from '@/i18n';

type ActiveTab = 'home' | 'report' | 'map' | 'myReports' | 'safety';

export default function App() {
  const { t, i18n } = useTranslation();
  const [showOnboarding, setShowOnboarding] = useState<boolean>(!isOnboardingCompleted());
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [isMobileFrameMode, setIsMobileFrameMode] = useState<boolean>(true);
  const [showLangMenu, setShowLangMenu] = useState<boolean>(false);

  const handleNavigate = (tab: string, params?: any) => {
    setShowSettings(false);
    setSelectedReportId(null);
    if (tab === 'myReports' && params?.reportId) {
      setSelectedReportId(params.reportId);
    }
    setActiveTab(tab as ActiveTab);
  };

  const currentLanguageLabel =
    SUPPORTED_LANGUAGES.find((l) => l.code === i18n.language)?.nativeName || 'English';

  if (showOnboarding) {
    return <OnboardingScreen onComplete={() => setShowOnboarding(false)} />;
  }

  const renderContent = () => {
    if (showSettings) {
      return <SettingsScreen onResetApp={() => setShowOnboarding(true)} />;
    }
    if (selectedReportId) {
      return (
        <ReportDetailScreen
          reportId={selectedReportId}
          onBack={() => setSelectedReportId(null)}
        />
      );
    }

    switch (activeTab) {
      case 'report':
        return (
          <ReportFormScreen
            onBack={() => setActiveTab('home')}
            onSuccess={() => setActiveTab('myReports')}
          />
        );
      case 'map':
        return <NearbyMapScreen />;
      case 'myReports':
        return (
          <MyReportsScreen
            onSelectReport={(id) => setSelectedReportId(id)}
          />
        );
      case 'safety':
        return <SafetyInfoScreen />;
      case 'home':
      default:
        return <HomeScreen onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col items-center justify-start sm:p-4 md:p-6">
      {/* Top Desktop Bar with Frame Toggle */}
      <div className="hidden sm:flex items-center justify-between w-full max-w-lg mb-2 text-xs text-slate-400">
        <span className="font-semibold text-slate-300">
          FloodWatch Community • Web Edition
        </span>
        <button
          onClick={() => setIsMobileFrameMode(!isMobileFrameMode)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
        >
          {isMobileFrameMode ? <Maximize2 className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
          <span>{isMobileFrameMode ? 'Full Width' : 'Phone Mockup'}</span>
        </button>
      </div>

      {/* Main Container / Mobile Device Container */}
      <div
        className={`w-full bg-slate-50 dark:bg-slate-950 flex flex-col shadow-2xl relative transition-all duration-200 ${
          isMobileFrameMode
            ? 'max-w-md sm:rounded-3xl sm:border-[8px] sm:border-slate-800 sm:ring-1 sm:ring-slate-700 min-h-[780px] h-screen sm:h-[844px] overflow-hidden'
            : 'max-w-2xl sm:rounded-2xl sm:border border-slate-800 min-h-screen'
        }`}
      >
        {/* Top Connectivity Banner */}
        <ConnectivityIndicator onPressPending={() => handleNavigate('myReports')} />

        {/* Top App Bar */}
        <header className="px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between z-20 shrink-0">
          <div
            onClick={() => handleNavigate('home')}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
              FW
            </div>
            <div>
              <p className="text-sm font-black text-slate-900 dark:text-white leading-none">
                {t('common.appName')}
              </p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                Community Portal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 relative">
            {/* Language Dropdown Button */}
            <div className="relative">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:border-slate-300 cursor-pointer"
              >
                <Globe2 className="w-3.5 h-3.5 text-sky-600" />
                <span>{currentLanguageLabel}</span>
              </button>

              {showLangMenu && (
                <div className="absolute right-0 top-10 w-36 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl py-1 z-50">
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setAppLanguage(lang.code as SupportedLanguageCode);
                        setShowLangMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs font-bold transition-colors cursor-pointer ${
                        i18n.language === lang.code
                          ? 'bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-300'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {lang.nativeName} ({lang.label})
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Settings Button */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                showSettings
                  ? 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
              title="Settings"
            >
              <SettingsIcon className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Scrollable View Area */}
        <main className="flex-1 overflow-y-auto relative bg-slate-50 dark:bg-slate-950">
          {renderContent()}
        </main>

        {/* Fixed Mobile Bottom Tab Navigation */}
        <nav className="h-16 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 grid grid-cols-5 items-center px-1 shrink-0 z-30 select-none">
          <button
            onClick={() => handleNavigate('home')}
            className={`flex flex-col items-center justify-center h-full transition-colors cursor-pointer ${
              activeTab === 'home' && !showSettings && !selectedReportId
                ? 'text-sky-600 dark:text-sky-400 font-bold'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] mt-1">{t('nav.home')}</span>
          </button>

          <button
            onClick={() => handleNavigate('report')}
            className={`flex flex-col items-center justify-center h-full transition-colors cursor-pointer ${
              activeTab === 'report' && !showSettings && !selectedReportId
                ? 'text-red-600 font-bold'
                : 'text-slate-400 hover:text-red-600'
            }`}
          >
            <PlusCircle className="w-5 h-5 text-red-600" />
            <span className="text-[10px] mt-1 text-red-600 font-bold">{t('nav.report')}</span>
          </button>

          <button
            onClick={() => handleNavigate('map')}
            className={`flex flex-col items-center justify-center h-full transition-colors cursor-pointer ${
              activeTab === 'map' && !showSettings && !selectedReportId
                ? 'text-sky-600 dark:text-sky-400 font-bold'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <MapPin className="w-5 h-5" />
            <span className="text-[10px] mt-1">{t('nav.map')}</span>
          </button>

          <button
            onClick={() => handleNavigate('myReports')}
            className={`flex flex-col items-center justify-center h-full transition-colors cursor-pointer ${
              activeTab === 'myReports' && !showSettings
                ? 'text-sky-600 dark:text-sky-400 font-bold'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <ClipboardList className="w-5 h-5" />
            <span className="text-[10px] mt-1">{t('nav.myReports')}</span>
          </button>

          <button
            onClick={() => handleNavigate('safety')}
            className={`flex flex-col items-center justify-center h-full transition-colors cursor-pointer ${
              activeTab === 'safety' && !showSettings && !selectedReportId
                ? 'text-sky-600 dark:text-sky-400 font-bold'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Shield className="w-5 h-5" />
            <span className="text-[10px] mt-1">{t('nav.safety')}</span>
          </button>
        </nav>
      </div>
    </div>
  );
}

