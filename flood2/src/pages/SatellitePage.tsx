import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertCircle,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

import { SatelliteImage } from '@/types';
import { apiClient, isMockDataEnabled } from '@/api';
import { DemoBadge } from '@/components/common/DemoBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { EmptyState } from '@/components/common/EmptyState';

export const SatellitePage: React.FC = () => {
  const { t } = useTranslation();
  const isMock = isMockDataEnabled();

  const [images, setImages] = useState<SatelliteImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<SatelliteImage | null>(null);
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSatelliteData = async () => {
    try {
      setError(null);
      const data = await apiClient.getSatelliteImages();
      setImages(data);
      if (data.length > 0) {
        setSelectedImage(data[0]);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch satellite observation imagery.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSatelliteData();
  }, []);

  if (loading) {
    return <LoadingSpinner label="Fetching multispectral satellite rasters..." size="lg" />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchSatelliteData} />;
  }

  if (images.length === 0 || !selectedImage) {
    return (
      <EmptyState
        title="No Satellite Imagery Available"
        description="No cloud-free optical or SAR radar passes currently indexed for this region."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t('satellite.title')}
            </h1>
            {isMock && <DemoBadge size="md" />}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('satellite.subtitle')}
          </p>
        </div>
      </div>

      {/* Mandatory Limitations Note */}
      <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-800/80 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold text-xs mb-0.5">{t('satellite.limitationsTitle')}</h3>
          <p className="leading-relaxed text-amber-800 dark:text-amber-300">
            {t('satellite.limitationsText')}
          </p>
          {selectedImage.limitationsNotice && (
            <p className="mt-1 text-[11px] font-medium opacity-90 border-t border-amber-200 dark:border-amber-800/60 pt-1">
              Scene Specific Notice: {selectedImage.limitationsNotice}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Image Selection List */}
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            Available Satellite Overpasses ({images.length})
          </h2>

          <div className="space-y-2">
            {images.map((img) => (
              <div
                key={img.id}
                onClick={() => {
                  setSelectedImage(img);
                  setSliderPosition(50);
                  setZoomLevel(1);
                }}
                className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                  selectedImage.id === img.id
                    ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/30 ring-1 ring-sky-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900 dark:text-white line-clamp-1">
                    {img.title}
                  </span>
                </div>
                <p className="text-slate-500 text-[11px] mb-2">{img.source}</p>

                <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span>Date: {img.date}</span>
                  <span>Cloud: {img.cloudCoverPercent}%</span>
                  <span>Res: {img.resolution.split(' ')[0]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 2 Columns: Before/After Comparison Viewer with Slider */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {t('satellite.beforeAfter')}
                </h3>
                <p className="text-xs text-slate-500">{t('satellite.dragSlider')}</p>
              </div>

              {/* Zoom controls */}
              <div className="flex items-center gap-1.5 self-start sm:self-center">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(1, z - 0.25))}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                  aria-label="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono px-1 font-bold text-slate-700 dark:text-slate-300">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                  aria-label="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Split Comparison Image Viewer */}
            <div
              className="relative w-full h-80 sm:h-96 rounded-xl overflow-hidden select-none bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-ew-resize"
              onMouseMove={(e) => {
                if (e.buttons === 1) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
                  setSliderPosition((x / rect.width) * 100);
                }
              }}
              onTouchMove={(e) => {
                const touch = e.touches[0];
                const rect = e.currentTarget.getBoundingClientRect();
                const x = Math.max(0, Math.min(touch.clientX - rect.left, rect.width));
                setSliderPosition((x / rect.width) * 100);
              }}
            >
              {/* After (Flood Inundation) - Full Background */}
              <div
                className="absolute inset-0 transition-transform duration-75"
                style={{ transform: `scale(${zoomLevel})` }}
              >
                <img
                  src={selectedImage.afterUrl}
                  alt="Post-Flood Satellite Inundation"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Before (Pre-Flood Baseline) - Clipped by Slider */}
              <div
                className="absolute inset-0 overflow-hidden transition-transform duration-75"
                style={{
                  clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`,
                  transform: `scale(${zoomLevel})`,
                }}
              >
                <img
                  src={selectedImage.beforeUrl}
                  alt="Pre-Flood Baseline Satellite"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Visual Divider Line with Handle */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-white shadow-lg pointer-events-none"
                style={{ left: `${sliderPosition}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white shadow-xl flex items-center justify-center text-slate-800 text-xs font-bold border border-slate-300">
                  &#8644;
                </div>
              </div>

              {/* Floating Labels */}
              <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded shadow-sm">
                Pre-Flood Baseline
              </div>
              <div className="absolute top-3 right-3 bg-red-600/85 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded shadow-sm">
                Peak Inundation Extent
              </div>
            </div>

            {/* Slider input control */}
            <div className="mt-4 flex items-center gap-3">
              <span className="text-xs font-bold text-slate-500">Before</span>
              <input
                type="range"
                min="0"
                max="100"
                value={sliderPosition}
                onChange={(e) => setSliderPosition(parseFloat(e.target.value))}
                className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-600"
              />
              <span className="text-xs font-bold text-slate-500">After</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
