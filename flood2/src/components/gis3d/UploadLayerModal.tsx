import React, { useState } from 'react';
import {
  X,
  Upload,
  FileCheck,
  AlertCircle,
  Loader2,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { apiClient } from '@/api';
import { TerrainLayerType, TerrainLayerItem } from '@/types';

interface UploadLayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLayerUploaded: (layer: TerrainLayerItem) => void;
  initialLayerType?: TerrainLayerType;
}

const LAYER_DEFINITIONS: Record<
  TerrainLayerType,
  { title: string; description: string; expectedFormat: string }
> = {
  DEM: {
    title: 'DEM / DEML (Digital Elevation Model)',
    description:
      'High-resolution bare-earth raster representing topographic elevations of the ground surface. Essential for slope computation and gravity flow drainage.',
    expectedFormat: 'GeoTIFF (.tif, .tiff) with elevation in float32/int16 meters above sea level.',
  },
  SRTM30: {
    title: 'SRTM 30 (30-Metre Elevation Data)',
    description:
      'Shuttle Radar Topography Mission 1-arc-second (~30m spatial resolution) global elevation grid. Standardized hydrological baseline for regional catchments.',
    expectedFormat: '1-arc-second GeoTIFF tile covering the study basin coordinates.',
  },
  VEM: {
    title: 'VEM (Vegetation Elevation Model)',
    description:
      'Canopy and vegetative surface structure model. Used to quantify hydraulic surface roughness (Manning’s n coefficient) and vegetative flow retardation.',
    expectedFormat: 'GeoTIFF (.tif, .tiff) raster encoding vegetation height or vegetative digital surface model.',
  },
  TIM: {
    title: 'TIM (Topographic Inundation Model)',
    description:
      'Hydrodynamic inundation raster representing maximum modeled water depths across terrain depressions, valleys, and river floodplains.',
    expectedFormat: 'GeoTIFF (.tif, .tiff) depth or probability raster in meters WGS84.',
  },
};

export const UploadLayerModal: React.FC<UploadLayerModalProps> = ({
  isOpen,
  onClose,
  onLayerUploaded,
  initialLayerType = 'DEM',
}) => {
  const [layerType, setLayerType] = useState<TerrainLayerType>(initialLayerType);
  const [layerName, setLayerName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<TerrainLayerItem | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
      if (!['.tif', '.tiff'].includes(ext)) {
        setError('Invalid file format. Please select a valid GeoTIFF file (.tif, .tiff).');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setError(null);
      if (!layerName) {
        setLayerName(`${layerType} - ${file.name.replace(/\.[^/.]+$/, '')}`);
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select a GeoTIFF elevation file to upload.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('layer_type', layerType);
      formData.append('name', layerName || `${layerType} Dataset`);

      const uploadedLayer = await apiClient.uploadTerrainLayer(formData);
      setSuccessResult(uploadedLayer);
      onLayerUploaded(uploadedLayer);
    } catch (err: any) {
      setError(err.message || 'Failed to process and store GeoTIFF elevation dataset.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setLayerName('');
    setError(null);
    setSuccessResult(null);
    onClose();
  };

  const currentDef = LAYER_DEFINITIONS[layerType];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Upload Elevation & Terrain Layer
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Support for DEM, SRTM 30, VEM, and TIM GeoTIFF (.tif, .tiff) rasters
              </p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {successResult ? (
          <div className="space-y-4 py-3">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300 text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span>GeoTIFF Successfully Processed & Integrated!</span>
              </div>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                Extracted elevation metrics, generated 3D map overlay, and stored metadata in backend database.
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-500">Layer Name:</span>
                <strong className="text-slate-900 dark:text-white">{successResult.name}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-500">Layer Type:</span>
                <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 font-mono font-bold">
                  {successResult.layer_type}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-500">Coordinate Reference System:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{successResult.crs || 'WGS 84'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-500">Elevation Range:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  {successResult.min_elevation?.toFixed(1)}m – {successResult.max_elevation?.toFixed(1)}m MSL
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-500">Geographic Bounds:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300 text-[11px]">
                  [{successResult.west.toFixed(3)}°W, {successResult.south.toFixed(3)}°S] to [{successResult.east.toFixed(3)}°E, {successResult.north.toFixed(3)}°N]
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Resolution:</span>
                <span className="text-slate-700 dark:text-slate-300">{successResult.resolution || '30m'}</span>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm transition-all"
            >
              Done & View on 3D Map
            </button>
          </div>
        ) : (
          <form onSubmit={handleUpload} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Layer Type Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Target Elevation Layer
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['DEM', 'SRTM30', 'VEM', 'TIM'] as TerrainLayerType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setLayerType(t);
                      if (selectedFile && !layerName) {
                        setLayerName(`${t} - ${selectedFile.name.replace(/\.[^/.]+$/, '')}`);
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      layerType === t
                        ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 font-bold shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="block text-xs">{t}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Definition Card */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                <Info className="w-3.5 h-3.5 text-sky-500" />
                <span>{currentDef.title}</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                {currentDef.description}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-500 italic pt-1">
                Expected: {currentDef.expectedFormat}
              </p>
            </div>

            {/* Dataset Name Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Dataset Display Name
              </label>
              <input
                type="text"
                value={layerName}
                onChange={(e) => setLayerName(e.target.value)}
                placeholder={`e.g. ${layerType} Coimbatore Basin 30m`}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
              />
            </div>

            {/* File Dropzone */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Select GeoTIFF File (.tif, .tiff)
              </label>
              <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-cyan-500 rounded-2xl p-6 text-center transition-colors">
                <input
                  type="file"
                  accept=".tif,.tiff,image/tiff"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center gap-2 pointer-events-none">
                  {selectedFile ? (
                    <>
                      <FileCheck className="w-8 h-8 text-emerald-500" />
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {selectedFile.name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </div>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-slate-400" />
                      <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Click or drag GeoTIFF file here
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Extracts CRS, bounds, and elevation values automatically
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUploading || !selectedFile}
                className="flex-1 py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing GeoTIFF & Generating 3D Surface...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Upload & Render in CesiumJS</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
