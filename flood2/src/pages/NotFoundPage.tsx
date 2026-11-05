import React from 'react';
import { Link } from 'react-router-dom';
import { Waves, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-sky-500/10 text-sky-600 flex items-center justify-center mb-4">
        <Waves className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">404</h1>
      <p className="text-lg font-semibold text-slate-700 dark:text-slate-300 mt-2">
        Hydrologic Station or Page Not Found
      </p>
      <p className="text-xs text-slate-500 max-w-sm mt-1 mb-6">
        The requested URL path does not correspond to an active telemetry route or sensor stream.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs transition-colors"
      >
        <Home className="w-4 h-4" />
        Return to Flood Dashboard
      </Link>
    </div>
  );
};
