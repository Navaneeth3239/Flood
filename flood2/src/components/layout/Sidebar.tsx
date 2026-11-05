import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Activity,
  Map as MapIcon,
  BrainCircuit,
  Mountain,
  Orbit,
  AlertTriangle,
  Radio,
  FileText,
  Siren,
  Bot,
  Cpu,
  X,
  Waves,
} from 'lucide-react';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();

  const navItems = [
    { to: '/', label: t('nav.dashboard'), icon: LayoutDashboard },
    { to: '/live', label: t('nav.live'), icon: Activity },
    { to: '/map', label: t('nav.map'), icon: MapIcon },
    { to: '/prediction', label: t('nav.prediction'), icon: BrainCircuit },
    { to: '/terrain', label: t('nav.terrain'), icon: Mountain },
    { to: '/satellite', label: t('nav.satellite'), icon: Orbit },
    { to: '/alerts', label: t('nav.alerts'), icon: AlertTriangle },
    { to: '/stations', label: t('nav.stations'), icon: Radio },
    { to: '/reports', label: t('nav.reports'), icon: FileText },
    { to: '/emergency', label: t('nav.emergency'), icon: Siren },
    { to: '/assistant', label: t('nav.assistant'), icon: Bot },
    { to: '/health', label: t('nav.health'), icon: Cpu },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-slate-200 flex flex-col border-r border-slate-800 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500 text-white flex items-center justify-center font-bold shadow-md shadow-sky-500/30">
              <Waves className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-wide text-white block">
                FloodGuard
              </span>
              <span className="text-[10px] text-sky-400 font-semibold tracking-wider uppercase">
                Early Warning v1.0
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30 font-semibold'
                      : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Mobile Language Switcher */}
        <div className="p-3 border-t border-slate-800 lg:hidden">
          <div className="text-[11px] font-semibold text-slate-400 mb-1.5">Language / ഭാഷ</div>
          <LanguageSwitcher fullWidth />
        </div>

        {/* Bottom System Status Snapshot */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Hydrologic Engine</span>
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Active
            </span>
          </div>
          <div className="mt-1 text-[10px] text-slate-500 font-mono">
            CRS: EPSG:4326 | WGS84
          </div>
        </div>
      </aside>
    </>
  );
};
