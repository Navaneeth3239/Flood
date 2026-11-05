import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Globe2,
  Bell,
  Shield,
  Trash2,
  CheckCircle2,
  User,
  Phone,
  KeyRound,
  LogOut,
  Sparkles,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { SUPPORTED_LANGUAGES, SupportedLanguageCode, setAppLanguage } from '@/i18n';
import {
  getUserSettings,
  saveUserSettings,
  clearAllLocalUserData,
  getAuthUser,
  getAuthToken,
  clearAuth,
} from '@/storage';
import { apiClient } from '@/api';
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
  const [authUser, setAuthUser] = useState<any>(getAuthUser());
  const [phoneInput, setPhoneInput] = useState('+91 ');
  const [otpInput, setOtpInput] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      const res = await apiClient.sendOtp(phoneInput);
      if (res.devOtp) setDevOtpHint(res.devOtp);
      setOtpSent(true);
      setAuthSuccess('Verification code dispatched.');
    } catch (err: any) {
      setAuthError(err.response?.data?.error || err.message || 'Failed to dispatch code');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      const res = await apiClient.verifyOtp(phoneInput, otpInput);
      setAuthUser(res.user);
      setOtpSent(false);
      setOtpInput('');
      setDevOtpHint(null);
      setAuthSuccess('Successfully authenticated! Account linked with website.');
    } catch (err: any) {
      setAuthError(err.response?.data?.error || err.message || 'Verification failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    apiClient.logout();
    setAuthUser(null);
    setAuthSuccess('Signed out successfully.');
  };

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

      {/* Shared Authentication Card */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/90 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-sky-600" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Citizen Account & Shared Login
            </h2>
          </div>
          {authUser && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              Linked with Web
            </span>
          )}
        </div>

        {authError && (
          <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        {authSuccess && (
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 flex-shrink-0" />
            <span>{authSuccess}</span>
          </div>
        )}

        {authUser ? (
          <div className="space-y-3 pt-1">
            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Phone:</span>
                <strong className="text-slate-900 dark:text-white font-mono">{authUser.phone}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Name:</span>
                <span className="text-slate-700 dark:text-slate-300">{authUser.name || 'Citizen'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Database Role:</span>
                <span className="capitalize font-mono text-sky-600 dark:text-sky-400">{authUser.role || 'citizen'}</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
              This account is unified across both the mobile application and the desktop 3D GIS website dashboard.
            </p>
            <button
              onClick={handleLogout}
              className="w-full py-2 px-3 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out of Shared Account</span>
            </button>
          </div>
        ) : !otpSent ? (
          <form onSubmit={handleSendOtp} className="space-y-3 pt-1">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Sign in with your mobile number to synchronize reports and alerts with the SCMS website.
            </p>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="tel"
                required
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {authLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Dispatching OTP...</span>
                </>
              ) : (
                <span>Request Verification Code</span>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-3 pt-1">
            {devOtpHint && (
              <div className="p-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-lg text-xs flex justify-between items-center text-amber-800 dark:text-amber-300">
                <span>Dev Code: <strong>{devOtpHint}</strong></span>
                <button
                  type="button"
                  onClick={() => setOtpInput(devOtpHint)}
                  className="font-bold underline text-[11px]"
                >
                  Fill Code
                </button>
              </div>
            )}
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                required
                maxLength={6}
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                placeholder="Enter 6-digit OTP"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-mono tracking-widest text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOtpSent(false)}
                className="py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={authLoading || otpInput.length < 4}
                className="flex-1 py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {authLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Verify & Log In</span>}
              </button>
            </div>
          </form>
        )}
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
