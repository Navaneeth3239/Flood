import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Bell, Sun, Moon, Menu, ShieldAlert, CheckCircle2, User, LogIn, LogOut } from 'lucide-react';
import { DemoBadge } from '@/components/common/DemoBadge';
import { ConnectionStatusIndicator } from '@/components/common/ConnectionStatusIndicator';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/api';
import { Alert } from '@/types';
import { getSeverityClasses } from '@/utils/formatters';

interface TopBarProps {
  onToggleSidebar: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onToggleSidebar }) => {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();
  const [activeAlerts, setActiveAlerts] = useState<Alert[]>([]);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);

  useEffect(() => {
    const fetchActiveAlerts = async () => {
      try {
        const alerts = await apiClient.getAlerts({ status: 'active' });
        setActiveAlerts(alerts);
      } catch (err) {
        console.error('Failed to fetch active alerts for bell', err);
      }
    };
    fetchActiveAlerts();
    const interval = setInterval(fetchActiveAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = activeAlerts.length;

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500 lg:hidden"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold shadow-sm shadow-sky-500/20">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="hidden sm:block">
            <h1 className="font-bold text-base tracking-tight text-slate-900 dark:text-white leading-tight">
              {t('app.shortTitle')}
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Early Flood Detection & Dispatch
            </p>
          </div>
        </div>

        {/* Global Demo or Live Badge */}
        <div className="ml-2 hidden xs:block">
          <DemoBadge size="sm" />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <ConnectionStatusIndicator />

        <LanguageSwitcher />

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotificationMenu(!showNotificationMenu)}
            className="relative p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label={`Alert notifications (${unreadCount} unread active warnings)`}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center px-1 rounded-full bg-red-500 text-[10px] font-bold text-white shadow-xs">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotificationMenu && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl shadow-xl bg-white dark:bg-slate-800 ring-1 ring-black/5 dark:ring-white/10 p-3 z-50 border border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-slate-700">
                <span className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-500" />
                  Active Flood Alerts ({unreadCount})
                </span>
                <Link
                  to="/alerts"
                  onClick={() => setShowNotificationMenu(false)}
                  className="text-xs text-sky-600 dark:text-sky-400 font-medium hover:underline"
                >
                  {t('dashboard.viewAllAlerts')} &rarr;
                </Link>
              </div>

              {activeAlerts.length === 0 ? (
                <div className="py-6 text-center text-slate-500 dark:text-slate-400 text-xs flex flex-col items-center gap-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  <span>No active high-risk flood warnings currently reported.</span>
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
                  {activeAlerts.slice(0, 4).map((alert) => {
                    const sev = getSeverityClasses(alert.severity);
                    return (
                      <div
                        key={alert.id}
                        className={`p-2.5 rounded-lg border text-xs ${sev.bg} ${sev.border}`}
                      >
                        <div className="flex items-center justify-between font-bold mb-1">
                          <span className="truncate">{alert.stationName}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${sev.badge}`}
                          >
                            {alert.severity}
                          </span>
                        </div>
                        <p className="line-clamp-2 text-slate-700 dark:text-slate-300 font-normal">
                          {alert.title}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
        </button>

        {/* Authentication: Login Button or User Profile Dropdown */}
        {isAuthenticated && user ? (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-sky-50 dark:bg-slate-800 border border-sky-200 dark:border-slate-700 text-xs">
              <User className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[100px]">
                {user.name || user.phone}
              </span>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={openAuthModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-sm shadow-sky-600/30 transition-all cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Login</span>
          </button>
        )}
      </div>
    </header>
  );
};
