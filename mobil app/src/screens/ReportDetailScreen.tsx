import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeft,
  MapPin,
  Clock,
  ShieldCheck,
  Edit3,
  XCircle,
  AlertCircle,
  Check,
} from 'lucide-react';
import { LocalReport } from '@/types';
import { getLocalReports, updateLocalReport } from '@/storage';
import { apiClient } from '@/api';
import { StatusBadge } from '@/components/common/StatusBadge';
import { SeverityBadge } from '@/components/common/SeverityBadge';
import { LeafletMap } from '@/components/map/LeafletMap';
import { CustomButton } from '@/components/common/CustomButton';
import { sanitizeText } from '@/utils/sanitize';

interface ReportDetailScreenProps {
  reportId: string;
  onBack: () => void;
}

export const ReportDetailScreen: React.FC<ReportDetailScreenProps> = ({ reportId, onBack }) => {
  const { t } = useTranslation();
  const [report, setReport] = useState<LocalReport | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedDescription, setEditedDescription] = useState<string>('');

  const loadReport = async () => {
    const reports = getLocalReports();
    const found = reports.find((r) => r.localId === reportId);
    if (found) {
      setReport(found);
      setEditedDescription(found.description || '');

      // Check server for latest responder notes if serverId exists
      if (found.serverId) {
        try {
          const remote = await apiClient.getIncidentById(found.serverId);
          if (remote) {
            const updated = updateLocalReport(found.localId, {
              status: remote.status,
              responderNotes: remote.responderNotes,
              timeline: remote.timeline || found.timeline,
            });
            if (updated) setReport(updated);
          }
        } catch (e) {}
      }
    }
  };

  useEffect(() => {
    loadReport();
  }, [reportId]);

  const handleWithdraw = async () => {
    if (!report || report.status !== 'unverified') return;
    if (!confirm(t('myReports.withdrawConfirm'))) return;

    try {
      if (report.serverId) {
        await apiClient.withdrawIncident(report.serverId);
      }
      const updated = updateLocalReport(report.localId, {
        status: 'rejected',
        responderNotes: 'Withdrawn by reporter',
        timeline: [
          ...(report.timeline || []),
          {
            status: 'rejected',
            timestamp: new Date().toISOString(),
            note: 'Withdrawn by community member',
          },
        ],
      });
      if (updated) setReport(updated);
      alert('Report has been withdrawn.');
    } catch (e: any) {
      alert(e?.message || 'Could not withdraw report.');
    }
  };

  const handleSaveEdit = async () => {
    if (!report || report.status !== 'unverified') return;

    try {
      const sanitized = sanitizeText(editedDescription, 500);
      if (report.serverId) {
        await apiClient.updateIncident(report.serverId, { description: sanitized });
      }
      const updated = updateLocalReport(report.localId, { description: sanitized });
      if (updated) setReport(updated);
      setIsEditing(false);
      alert('Report description updated.');
    } catch (e: any) {
      alert(e?.message || 'Failed to update report.');
    }
  };

  if (!report) {
    return (
      <div className="p-6 text-center max-w-lg mx-auto">
        <p className="text-slate-500 mb-4">Report not found on this device.</p>
        <CustomButton title="Back" onClick={onBack} variant="secondary" />
      </div>
    );
  }

  const isEditable = report.status === 'unverified';
  const displayPhotos = report.uploadedPhotoUrls.length > 0 ? report.uploadedPhotoUrls : report.localPhotoUris;

  return (
    <div className="p-4 sm:p-5 max-w-lg mx-auto pb-24 space-y-4">
      {/* Top Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={onBack}
          className="p-2 rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-black text-slate-900 dark:text-white">
          {t('myReports.detailTitle')}
        </h1>
      </div>

      {/* Main Header Card */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/90 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <SeverityBadge severity={report.severity} />
          <StatusBadge status={report.status} />
        </div>
        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
          {report.title}
        </h2>
        <p className="text-xs text-slate-400">
          Reported: {new Date(report.createdAt).toLocaleString()}
        </p>
      </div>

      {/* Photos Gallery */}
      {displayPhotos.length > 0 && (
        <div>
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2">
            Attached Photos ({displayPhotos.length})
          </h3>
          <div className="flex gap-2.5 overflow-x-auto pb-1">
            {displayPhotos.map((url, idx) => (
              <img
                key={idx}
                src={url}
                alt="Flood Evidence"
                className="w-36 h-36 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
              />
            ))}
          </div>
        </div>
      )}

      {/* Observation Text */}
      <div>
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2">
          Observation Details
        </h3>
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/90 text-sm text-slate-700 dark:text-slate-300">
          {report.description || 'No additional observation text provided.'}
        </div>
      </div>

      {/* Map Location */}
      <div>
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2">
          Incident Location
        </h3>
        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 mb-2">
          <MapPin className="w-4 h-4 text-sky-600" />
          <span>{report.location.address || report.location.landmark || 'Coordinates Recorded'}</span>
        </div>
        <LeafletMap
          initialLat={report.location.latitude}
          initialLng={report.location.longitude}
          zoom={16}
          editablePin={false}
          height="180px"
        />
      </div>

      {/* Official Responder Notes */}
      <div>
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2">
          {t('myReports.responderNotesTitle')}
        </h3>
        <div
          className={`p-3.5 rounded-xl border text-xs sm:text-sm flex items-start gap-2.5 ${
            report.responderNotes
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-800 text-slate-500'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>{report.responderNotes || t('myReports.noResponderNotes')}</span>
        </div>
      </div>

      {/* Status Timeline */}
      {report.timeline && report.timeline.length > 0 && (
        <div>
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2">
            {t('myReports.timelineTitle')}
          </h3>
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/90 space-y-3">
            {report.timeline.map((entry, idx) => (
              <div key={idx} className="flex items-start gap-3 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-600 mt-1 shrink-0" />
                <div className="flex-1">
                  <p className="font-bold text-slate-900 dark:text-white uppercase">
                    {entry.status}
                  </p>
                  {entry.note && (
                    <p className="text-slate-600 dark:text-slate-400 mt-0.5">{entry.note}</p>
                  )}
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {new Date(entry.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions (Only Allowed While Unverified) */}
      <div className="pt-2">
        {isEditable ? (
          <div className="space-y-2">
            <CustomButton
              title={t('myReports.editReport')}
              onClick={() => setIsEditing(true)}
              variant="outline"
              icon={<Edit3 className="w-4 h-4" />}
              className="w-full"
            />
            <CustomButton
              title={t('myReports.withdrawReport')}
              onClick={handleWithdraw}
              variant="danger"
              icon={<XCircle className="w-4 h-4" />}
              className="w-full"
            />
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-xs text-slate-500">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{t('myReports.onlyUnverifiedEditable')}</span>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 max-w-sm w-full space-y-3 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {t('myReports.editReport')}
            </h3>
            <textarea
              rows={4}
              maxLength={500}
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
            />
            <div className="flex gap-2 pt-2">
              <CustomButton
                title={t('common.cancel')}
                onClick={() => setIsEditing(false)}
                variant="secondary"
                className="flex-1"
              />
              <CustomButton
                title={t('common.save')}
                onClick={handleSaveEdit}
                variant="primary"
                className="flex-1"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
