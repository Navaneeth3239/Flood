import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { ConnectionState } from '@/types';
import { webSocketService } from '@/api';

export const ConnectionStatusIndicator: React.FC = () => {
  const { t } = useTranslation();
  const [state, setState] = useState<ConnectionState>(webSocketService.getState());
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const unsubscribe = webSocketService.onStateChange((newState) => {
      setState(newState);
    });
    return unsubscribe;
  }, []);

  const config = {
    live: {
      color: 'bg-emerald-500',
      text: t('status.connected'),
      textColor: 'text-emerald-700 dark:text-emerald-300',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800',
      icon: Wifi,
    },
    reconnecting: {
      color: 'bg-amber-500 animate-ping',
      text: t('status.reconnecting'),
      textColor: 'text-amber-700 dark:text-amber-300',
      bgColor: 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800',
      icon: RefreshCw,
    },
    offline: {
      color: 'bg-red-500',
      text: t('status.disconnected'),
      textColor: 'text-red-700 dark:text-red-300',
      bgColor: 'bg-red-50 dark:bg-red-950/60 border-red-300 dark:border-red-800',
      icon: WifiOff,
    },
  }[state];

  const Icon = config.icon;

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium border shadow-xs transition-colors ${config.bgColor} ${config.textColor}`}
        title="WebSocket Telemetry Link status (Click to toggle offline testing simulation)"
        aria-label={`Connection status: ${config.text}`}
      >
        <span className="relative flex h-2 w-2">
          <span
            className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
              state === 'live' ? 'animate-ping ' + config.color : ''
            }`}
          ></span>
          <span className={`relative inline-flex rounded-full h-2 w-2 ${config.color}`}></span>
        </span>
        <Icon className={`w-3.5 h-3.5 ${state === 'reconnecting' ? 'animate-spin' : ''}`} />
        <span className="hidden sm:inline font-medium">{config.text}</span>
      </button>

      {showMenu && (
        <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-slate-800 ring-1 ring-black ring-opacity-5 p-2 z-50 text-xs border border-slate-200 dark:border-slate-700">
          <div className="font-semibold text-slate-700 dark:text-slate-200 pb-1 mb-1 border-b border-slate-200 dark:border-slate-700">
            Telemetry Connection Controls
          </div>
          <p className="text-slate-500 dark:text-slate-400 mb-2">
            Status: <span className="font-bold">{String(state || 'unknown').toUpperCase()}</span>
          </p>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => {
                webSocketService.reconnect();
                setShowMenu(false);
              }}
              className="text-left px-2 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 font-medium text-emerald-600 dark:text-emerald-400"
            >
              Force Connect / Resume Stream
            </button>
            <button
              onClick={() => {
                webSocketService.disconnect();
                setShowMenu(false);
              }}
              className="text-left px-2 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 font-medium text-red-600 dark:text-red-400"
            >
              Simulate Network Offline (Test Mode)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
