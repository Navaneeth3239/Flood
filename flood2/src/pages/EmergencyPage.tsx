import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Siren,
  PhoneCall,
  ShieldCheck,
  AlertTriangle,
  Send,
  MapPin,
  CheckCircle,
  Clock,
  XCircle,
  FileCheck,
  Plus,
} from 'lucide-react';

import { Incident, EmergencyContact, SafetyInstruction, IncidentPriority } from '@/types';
import { apiClient, isMockDataEnabled } from '@/api';
import { DemoBadge } from '@/components/common/DemoBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { timeAgo } from '@/utils/date';

export const EmergencyPage: React.FC = () => {
  const { t } = useTranslation();
  const isMock = isMockDataEnabled();

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [instructions, setInstructions] = useState<SafetyInstruction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formOpen, setFormOpen] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    address: string;
    latitude: number | string;
    longitude: number | string;
    priority: IncidentPriority;
    reportedBy: string;
    reporterContact: string;
    imageUrl: string;
  }>({
    title: '',
    description: '',
    address: '',
    latitude: 13.01,
    longitude: 80.22,
    priority: 'high',
    reportedBy: '',
    reporterContact: '',
    imageUrl: '',
  });

  const fetchData = async () => {
    try {
      setError(null);
      const [incs, cnts, instrs] = await Promise.all([
        apiClient.getIncidents(),
        apiClient.getEmergencyContacts(),
        apiClient.getSafetyInstructions(),
      ]);
      setIncidents(incs);
      setContacts(cnts);
      setInstructions(instrs);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch emergency response data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmitIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!formData.title.trim()) {
      setFormError('Please enter an incident summary headline.');
      return;
    }
    if (!formData.description.trim()) {
      setFormError('Please provide detailed field observation details.');
      return;
    }
    if (!formData.address.trim()) {
      setFormError('Please specify landmark / street location.');
      return;
    }
    const lat = parseFloat(String(formData.latitude));
    const lon = parseFloat(String(formData.longitude));
    if (isNaN(lat) || isNaN(lon)) {
      setFormError('Valid latitude and longitude coordinates are required.');
      return;
    }

    try {
      setFormSubmitting(true);
      const newInc = await apiClient.createIncident({
        title: formData.title.trim(),
        description: formData.description.trim(),
        location: {
          latitude: lat,
          longitude: lon,
          address: formData.address.trim(),
        },
        priority: formData.priority,
        reportedBy: formData.reportedBy.trim() || undefined,
        reporterContact: formData.reporterContact.trim() || undefined,
        imageUrl: formData.imageUrl.trim() || undefined,
      });

      setIncidents([newInc, ...incidents]);
      setFormSuccess(true);
      setFormOpen(false);
      setFormData({
        title: '',
        description: '',
        address: '',
        latitude: 13.01,
        longitude: 80.22,
        priority: 'high',
        reportedBy: '',
        reporterContact: '',
        imageUrl: '',
      });
      setTimeout(() => setFormSuccess(false), 4000);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to submit incident report.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            <CheckCircle className="w-3 h-3" /> Verified
          </span>
        );
      case 'under_review':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
            <Clock className="w-3 h-3" /> Under Review
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
            <XCircle className="w-3 h-3" /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            <AlertTriangle className="w-3 h-3" /> Unverified
          </span>
        );
    }
  };

  const renderPriorityBadge = (priority: IncidentPriority) => {
    const colors = {
      critical: 'bg-red-500 text-white',
      high: 'bg-orange-500 text-white',
      medium: 'bg-amber-500 text-white',
      low: 'bg-slate-500 text-white',
    }[priority];

    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${colors}`}>
        {priority}
      </span>
    );
  };

  if (loading) {
    return <LoadingSpinner label="Loading emergency management directives..." size="lg" />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchData} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t('emergency.title')}
            </h1>
            {isMock && <DemoBadge size="md" />}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('emergency.subtitle')}
          </p>
        </div>

        <button
          onClick={() => setFormOpen(!formOpen)}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs transition-colors self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          {t('emergency.reportIncident')}
        </button>
      </div>

      {formSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>
            Incident report submitted successfully. It has entered the verification triage queue.
          </span>
        </div>
      )}

      {/* Incident Reporting Modal / Drawer Form */}
      {formOpen && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/95 border border-red-200 dark:border-red-900/60 shadow-lg space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
            <h2 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Siren className="w-4 h-4 text-red-600" />
              {t('emergency.reportIncident')}
            </h2>
            <button
              onClick={() => setFormOpen(false)}
              className="text-slate-400 hover:text-slate-600 text-sm font-bold"
            >
              &times;
            </button>
          </div>

          {formError && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs border border-red-200">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmitIncident} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('emergency.incidentTitle')} *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Ring road subway submerged under 3 feet of water"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('emergency.incidentPriority')}
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: e.target.value as IncidentPriority })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 font-semibold"
                >
                  <option value="critical">Critical (Immediate rescue needed / Trapped persons)</option>
                  <option value="high">High (Severe road blockage / Infrastructure threat)</option>
                  <option value="medium">Medium (Moderate water ponding / Debris accumulation)</option>
                  <option value="low">Low (Minor drainage backwater)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('emergency.incidentDescription')} *
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed description of water ingress, rate of rise, trapped residents, or structural concerns..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('emergency.incidentLocation')} (Address / Landmark) *
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. Kotturpuram River View Road near Bridge Pillar 4"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Latitude Coordinate
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Longitude Coordinate
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reporter Name (Optional)
                </label>
                <input
                  type="text"
                  value={formData.reportedBy}
                  onChange={(e) => setFormData({ ...formData, reportedBy: e.target.value })}
                  placeholder="e.g. Field Officer K. Raman"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reporter Phone / Contact (Optional)
                </label>
                <input
                  type="text"
                  value={formData.reporterContact}
                  onChange={(e) => setFormData({ ...formData, reporterContact: e.target.value })}
                  placeholder="e.g. +91 94440 XXXXX"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors shadow-xs disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {formSubmitting ? 'Submitting...' : t('emergency.submitReport')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Official Emergency Contacts Section (HONESTY RULE: Never hard-code; if missing show "Not configured") */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-emerald-600" />
              {t('emergency.emergencyContacts')}
            </h2>
            <p className="text-xs text-slate-500">
              Verified national and district disaster control helplines loaded from official directory
            </p>
          </div>
          {isMock && <DemoBadge size="sm" />}
        </div>

        {contacts.length === 0 ? (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 text-slate-500 text-xs italic">
            {t('app.notConfigured')}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/60 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white truncate">
                    {contact.name}
                  </span>
                  {contact.isOfficial && (
                    <span title="Official">
                      <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 truncate">{contact.department}</p>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="font-mono font-bold text-sm text-sky-600 dark:text-sky-400">
                    {contact.phone}
                  </span>
                  <span className="text-[10px] text-slate-400">{contact.availableHours.split(' ')[0]}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Community Reports Queue & Official Safety Directives */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Community Incident Feed (2 Cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Siren className="w-4 h-4 text-red-500" />
                {t('emergency.communityReports')}
              </h2>
              <p className="text-xs text-slate-500">
                Ground-truth reports triage and dispatch coordination
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500">{incidents.length} Reports Logged</span>
          </div>

          <div className="space-y-3">
            {incidents.map((inc) => (
              <div
                key={inc.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-900/40 text-xs space-y-2 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {inc.title}
                      </span>
                      {renderPriorityBadge(inc.priority)}
                      {renderStatusBadge(inc.status)}
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      {inc.description}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 flex-wrap gap-2">
                  <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-red-500" />
                    {inc.location.address}
                  </span>
                  <span>
                    Reported {timeAgo(inc.timestamp)} {inc.reportedBy ? `by ${inc.reportedBy}` : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Official Safety Guidelines (1 Col) */}
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4 h-fit">
          <div className="pb-2 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-sky-500" />
              {t('emergency.trustedSafety')}
            </h2>
            <span className="text-[11px] text-slate-500">Government disaster protocol excerpts</span>
          </div>

          <div className="space-y-4 text-xs">
            {instructions.map((inst) => (
              <div
                key={inst.id}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/40 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {inst.title}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                    {inst.category}
                  </span>
                </div>

                <ul className="space-y-1.5 text-slate-600 dark:text-slate-300 list-disc list-inside text-[11px]">
                  {inst.steps.map((st, i) => (
                    <li key={i} className="leading-relaxed">
                      {st}
                    </li>
                  ))}
                </ul>

                <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-200 dark:border-slate-800">
                  Source: {inst.officialSource}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
