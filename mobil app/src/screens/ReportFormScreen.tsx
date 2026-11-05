import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeft,
  ChevronRight,
  Camera,
  Image as ImageIcon,
  MapPin,
  Trash2,
  CheckCircle,
  Send,
  ShieldCheck,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { ProblemType, SeverityLevel, LocationCoords } from '@/types';
import { DisclaimerBanner } from '@/components/common/DisclaimerBanner';
import { CustomButton } from '@/components/common/CustomButton';
import { LeafletMap } from '@/components/map/LeafletMap';
import { compressImageFile, MAX_PHOTOS_ALLOWED } from '@/utils/image';
import { sanitizeText, sanitizePhoneNumber } from '@/utils/sanitize';
import { syncManager } from '@/features/sync/syncManager';
import {
  getLastSubmissionTimestamp,
  recordSubmissionTimestamp,
  getUserSettings,
} from '@/storage';

const COOLDOWN_SECONDS = 15;

interface ReportFormScreenProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const ReportFormScreen: React.FC<ReportFormScreenProps> = ({ onBack, onSuccess }) => {
  const { t, i18n } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 6;

  const [problemType, setProblemType] = useState<ProblemType | null>(null);
  const [severity, setSeverity] = useState<SeverityLevel | null>(null);

  const [location, setLocation] = useState<LocationCoords>({
    latitude: 13.015,
    longitude: 80.215,
    landmark: '',
  });
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const [photos, setPhotos] = useState<string[]>([]);
  const [compressing, setCompressing] = useState<boolean>(false);
  const [description, setDescription] = useState<string>('');

  const [contactPhone, setContactPhone] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);

  const problemTypeCatalog: { key: ProblemType; icon: string }[] = [
    { key: 'flooded_road', icon: '🚗' },
    { key: 'water_entering_homes', icon: '🏠' },
    { key: 'river_overflow', icon: '🌊' },
    { key: 'embankment_damage', icon: '🧱' },
    { key: 'landslide_erosion', icon: '⛰️' },
    { key: 'power_line_water', icon: '⚡' },
    { key: 'person_needs_help', icon: '🆘' },
    { key: 'blocked_drain', icon: '🚧' },
    { key: 'other', icon: '⚠️' },
  ];

  const severityCatalog: { key: SeverityLevel; badgeColor: string }[] = [
    { key: 'low', badgeColor: '#2563eb' },
    { key: 'medium', badgeColor: '#d97706' },
    { key: 'high', badgeColor: '#ea580c' },
    { key: 'urgent', badgeColor: '#dc2626' },
  ];

  useEffect(() => {
    detectLocation();
    checkCooldown();
    const settings = getUserSettings();
    if (settings.defaultAnonymous) setIsAnonymous(true);
    if (settings.defaultContactPhone) setContactPhone(settings.defaultContactPhone);
  }, []);

  const checkCooldown = () => {
    const lastSub = getLastSubmissionTimestamp();
    const elapsedSeconds = Math.floor((Date.now() - lastSub) / 1000);
    if (elapsedSeconds < COOLDOWN_SECONDS) {
      setCooldownRemaining(COOLDOWN_SECONDS - elapsedSeconds);
      const timer = setInterval(() => {
        setCooldownRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const detectLocation = () => {
    if (!('geolocation' in navigator)) {
      setGpsError('Geolocation is not supported by your browser. Please tap the map to set a pin.');
      return;
    }

    setIsLocating(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation((prev) => ({
          ...prev,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracyMeters: Math.round(pos.coords.accuracy),
        }));
        setIsLocating(false);
      },
      (err) => {
        setGpsError('Could not retrieve GPS coordinates. You can pinpoint location on the map.');
        setIsLocating(false);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const handleMapPinChange = (lat: number, lng: number) => {
    setLocation((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      accuracyMeters: undefined,
    }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (photos.length + files.length > MAX_PHOTOS_ALLOWED) {
      alert(`You can attach up to ${MAX_PHOTOS_ALLOWED} photos in total.`);
      return;
    }

    setCompressing(true);
    try {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const compressed = await compressImageFile(files[i]);
        newUrls.push(compressed);
      }
      setPhotos((prev) => [...prev, ...newUrls].slice(0, MAX_PHOTOS_ALLOWED));
    } catch (err) {
      alert('Failed to process image.');
    } finally {
      setCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const canProceed = (): boolean => {
    if (currentStep === 1) return problemType !== null;
    if (currentStep === 2) return severity !== null;
    if (currentStep === 3) return location.latitude !== 0 && location.longitude !== 0;
    return true;
  };

  const handleNext = () => {
    if (!canProceed()) {
      if (currentStep === 1) alert(t('reportForm.validationErrorType'));
      if (currentStep === 2) alert(t('reportForm.validationErrorSeverity'));
      if (currentStep === 3) alert(t('reportForm.validationErrorLocation'));
      return;
    }
    if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      onBack();
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting || cooldownRemaining > 0) return;
    if (!problemType || !severity) return;

    setIsSubmitting(true);
    try {
      const sanitizedDesc = sanitizeText(description, 500);
      const sanitizedPhone = isAnonymous ? undefined : sanitizePhoneNumber(contactPhone);

      await syncManager.queueReport({
        title: t(`reportForm.problemTypes.${problemType}`),
        description: sanitizedDesc,
        type: problemType,
        severity: severity,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracyMeters: location.accuracyMeters,
          landmark: sanitizeText(location.landmark || '', 100),
        },
        localPhotoUris: photos,
        contact: sanitizedPhone,
        anonymous: isAnonymous,
        language: i18n.language || 'en',
      });

      recordSubmissionTimestamp();
      setSubmitSuccess(true);
    } catch (err: any) {
      alert(err?.message || 'Failed to submit report locally.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="p-6 max-w-lg mx-auto text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
          <CheckCircle className="w-10 h-10" />
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
          {t('reportForm.submitSuccessTitle')}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {t('reportForm.submitSuccessMsg')}
        </p>
        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
          {t('myReports.statusExplainer')}
        </div>
        <CustomButton
          title={t('home.viewAllReports')}
          onClick={onSuccess}
          size="lg"
          className="w-full"
        />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-5 max-w-lg mx-auto pb-24">
      {/* Top Bar with Step Progress */}
      <div className="flex items-center gap-3 pb-3 mb-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={handleBack}
          className="p-2 rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {t('reportForm.stepCounter', { current: currentStep, total: totalSteps })}
          </p>
          <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full mt-1 overflow-hidden">
            <div
              className="h-full bg-sky-600 transition-all duration-200"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <DisclaimerBanner compact />

      {/* STEP 1: Problem Type */}
      {currentStep === 1 && (
        <div className="mt-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
            {t('reportForm.step1Title')}
          </h2>
          <div className="grid grid-cols-2 gap-2.5">
            {problemTypeCatalog.map((item) => {
              const isSelected = problemType === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setProblemType(item.key)}
                  className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-center min-h-[76px] cursor-pointer ${
                    isSelected
                      ? 'border-sky-600 bg-sky-50 dark:bg-sky-950/60 dark:border-sky-500'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:border-slate-300'
                  }`}
                >
                  <span className="text-2xl mb-1">{item.icon}</span>
                  <span
                    className={`text-xs font-bold leading-snug ${
                      isSelected ? 'text-sky-700 dark:text-sky-300' : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {t(`reportForm.problemTypes.${item.key}`)}
                  </span>
                  {isSelected && (
                    <CheckCircle className="w-4 h-4 text-sky-600 dark:text-sky-400 absolute top-2.5 right-2.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 2: Severity */}
      {currentStep === 2 && (
        <div className="mt-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
            {t('reportForm.step2Title')}
          </h2>
          <div className="space-y-2.5">
            {severityCatalog.map((item) => {
              const isSelected = severity === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setSeverity(item.key)}
                  className={`w-full p-4 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'border-2 bg-slate-50 dark:bg-slate-800'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80'
                  }`}
                  style={{ borderColor: isSelected ? item.badgeColor : undefined }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.badgeColor }}
                    />
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      {t(`reportForm.severities.${item.key}`)}
                    </span>
                  </div>
                  {isSelected && (
                    <CheckCircle className="w-5 h-5" style={{ color: item.badgeColor }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 3: Location */}
      {currentStep === 3 && (
        <div className="mt-4 space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {t('reportForm.step3Title')}
          </h2>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-sky-600 font-semibold">
              <MapPin className="w-4 h-4" />
              <span>
                {location.accuracyMeters
                  ? t('reportForm.locationAccuracy', { meters: location.accuracyMeters })
                  : 'Manual Map Pin Selected'}
              </span>
            </div>
            <button
              type="button"
              onClick={detectLocation}
              disabled={isLocating}
              className="text-xs text-slate-600 dark:text-slate-300 underline font-medium hover:text-sky-600"
            >
              {isLocating ? 'Detecting...' : 'Redetect GPS'}
            </button>
          </div>

          {gpsError && <p className="text-xs text-rose-600 font-medium">{gpsError}</p>}
          <p className="text-xs text-slate-500">{t('reportForm.locationManualNote')}</p>

          <LeafletMap
            initialLat={location.latitude}
            initialLng={location.longitude}
            zoom={15}
            editablePin={true}
            onLocationChange={handleMapPinChange}
            height="220px"
          />

          <input
            type="text"
            placeholder={t('reportForm.landmarkPlaceholder')}
            value={location.landmark}
            onChange={(e) => setLocation((prev) => ({ ...prev, landmark: e.target.value }))}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
          />
        </div>
      )}

      {/* STEP 4: Photos & Observations */}
      {currentStep === 4 && (
        <div className="mt-4 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {t('reportForm.step4Title')}
          </h2>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            multiple
            className="hidden"
          />

          {photos.length < MAX_PHOTOS_ALLOWED && (
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={compressing}
                className="p-3.5 rounded-xl border-2 border-dashed border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 flex items-center justify-center gap-2 font-bold text-xs sm:text-sm hover:bg-sky-100 transition-colors cursor-pointer"
              >
                {compressing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Camera className="w-5 h-5" />
                )}
                <span>{t('reportForm.takePhoto')} / Upload</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={compressing}
                className="p-3.5 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center gap-2 font-bold text-xs sm:text-sm hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <ImageIcon className="w-5 h-5" />
                <span>{t('reportForm.choosePhoto')}</span>
              </button>
            </div>
          )}

          {/* Photo Previews */}
          {photos.length > 0 && (
            <div className="flex gap-2.5 overflow-x-auto pb-1">
              {photos.map((url, idx) => (
                <div
                  key={idx}
                  className="w-20 h-20 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 relative shrink-0"
                >
                  <img src={url} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(idx)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700"
                    title="Remove"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div>
            <textarea
              rows={4}
              maxLength={500}
              placeholder={t('reportForm.descriptionPlaceholder')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
            />
            <p className="text-[11px] text-slate-400 text-right mt-1">
              {t('reportForm.charCount', { current: description.length })}
            </p>
          </div>
        </div>
      )}

      {/* STEP 5: Contact & Privacy */}
      {currentStep === 5 && (
        <div className="mt-4 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {t('reportForm.step5Title')}
          </h2>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {t('reportForm.anonymousLabel')}
              </p>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                {t('reportForm.anonymousHelp')}
              </p>
            </div>
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="w-5 h-5 text-sky-600 rounded mt-1 cursor-pointer"
            />
          </div>

          {!isAnonymous && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t('reportForm.phonePlaceholder')}
              </label>
              <input
                type="tel"
                placeholder="+91 XXXXX XXXXX"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
              />
              <p className="text-[11px] text-slate-500 mt-1">{t('reportForm.phoneHelp')}</p>
            </div>
          )}
        </div>
      )}

      {/* STEP 6: Review & Submit */}
      {currentStep === 6 && (
        <div className="mt-4 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {t('reportForm.step6Title')}
          </h2>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-1.5">
              <span className="text-slate-500">Hazard Type:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {problemType ? t(`reportForm.problemTypes.${problemType}`) : '-'}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-1.5">
              <span className="text-slate-500">Severity:</span>
              <span className="font-bold text-red-600 uppercase">
                {severity || '-'}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-1.5">
              <span className="text-slate-500">Location:</span>
              <span className="font-bold text-slate-900 dark:text-white text-right">
                {location.landmark || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-1.5">
              <span className="text-slate-500">Photos Attached:</span>
              <span className="font-bold text-slate-900 dark:text-white">{photos.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Identity:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {isAnonymous ? 'Anonymous' : (contactPhone || 'No contact provided')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-sky-50 dark:bg-sky-950/40 rounded-xl text-sky-800 dark:text-sky-300 text-xs">
            <ShieldCheck className="w-4 h-4 shrink-0 text-sky-600" />
            <span>{t('reportForm.savedOfflineNotice')}</span>
          </div>

          {cooldownRemaining > 0 && (
            <p className="text-xs text-amber-700 dark:text-amber-400 text-center font-semibold">
              {t('reportForm.rateLimitNotice', { seconds: cooldownRemaining })}
            </p>
          )}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
        {currentStep < totalSteps ? (
          <CustomButton
            title={t('common.next')}
            onClick={handleNext}
            size="lg"
            icon={<ChevronRight className="w-5 h-5" />}
            className="w-full"
          />
        ) : (
          <CustomButton
            title={t('common.submit')}
            onClick={handleSubmit}
            variant="danger"
            size="lg"
            loading={isSubmitting}
            disabled={cooldownRemaining > 0}
            icon={<Send className="w-5 h-5" />}
            className="w-full"
          />
        )}
      </div>
    </div>
  );
};
