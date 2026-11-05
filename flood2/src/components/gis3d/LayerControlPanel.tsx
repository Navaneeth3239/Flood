import React, { useState } from 'react';
import {
  Layers,
  ChevronDown,
  ChevronUp,
  Mountain,
  Radio,
  Waves,
  Satellite,
  Eye,
  EyeOff,
  Upload,
  Droplets,
  CloudRain,
  Compass,
  Sliders,
  Info,
  Trash2,
  Layers3,
} from 'lucide-react';
import { TerrainLayerItem, TerrainLayerType, SoilLayerItem } from '@/types';
import { UploadLayerModal } from './UploadLayerModal';

export interface LayerVisibilityState {
  terrain: boolean;
  satelliteImagery: boolean;
  demElevation: boolean;
  srtm30: boolean;
  vem: boolean;
  tim: boolean;
  slope: boolean;
  aspect: boolean;
  contour: boolean;
  soilType: boolean;
  rainfall: boolean;
  soilMoisture: boolean;
  floodExtent: boolean;
  stations: boolean;
  rivers: boolean;
}

interface LayerControlPanelProps {
  layers: LayerVisibilityState;
  onToggleLayer: (key: keyof LayerVisibilityState, val: boolean) => void;
  onToggleAll: (enable: boolean) => void;
  // Uploaded Terrain Layers
  uploadedLayers: TerrainLayerItem[];
  onLayerUploaded: (layer: TerrainLayerItem) => void;
  onDeleteLayer?: (id: string) => void;
  layerOpacities: Record<string, number>;
  onOpacityChange: (layerKey: string, opacity: number) => void;
  // Soil Layers
  soilLayers: SoilLayerItem[];
}

export const LayerControlPanel: React.FC<LayerControlPanelProps> = ({
  layers,
  onToggleLayer,
  onToggleAll,
  uploadedLayers,
  onLayerUploaded,
  onDeleteLayer,
  layerOpacities,
  onOpacityChange,
  soilLayers,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'layers' | 'datasets' | 'soil'>('layers');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadTargetType, setUploadTargetType] = useState<TerrainLayerType>('DEM');
  const [selectedLayerMetadata, setSelectedLayerMetadata] = useState<TerrainLayerItem | null>(null);

  const allVisible = Object.values(layers).every(Boolean);

  const openUploadModal = (type: TerrainLayerType) => {
    setUploadTargetType(type);
    setUploadModalOpen(true);
  };

  return (
    <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl p-3.5 shadow-xl border border-slate-200 dark:border-slate-800 text-xs w-72 sm:w-80 space-y-3 transition-all max-h-[calc(100vh-170px)] overflow-y-auto no-scrollbar">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
          <Layers className="w-4 h-4 text-sky-500" />
          <span>3D Digital Twin Layers</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onToggleAll(!allVisible)}
            title={allVisible ? 'Hide all layers' : 'Show all layers'}
            className="p-1 rounded text-slate-400 hover:text-sky-600 transition-colors"
          >
            {allVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label={collapsed ? 'Expand Layer Controls' : 'Collapse Layer Controls'}
          >
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          {/* Subtabs: Layers / Uploaded Datasets / Soil */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 text-[11px] font-semibold">
            <button
              onClick={() => setActiveTab('layers')}
              className={`flex-1 py-1 px-2 rounded-lg transition-all ${
                activeTab === 'layers'
                  ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              GIS Layers
            </button>
            <button
              onClick={() => setActiveTab('datasets')}
              className={`flex-1 py-1 px-2 rounded-lg transition-all ${
                activeTab === 'datasets'
                  ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Datasets ({uploadedLayers.length})
            </button>
            <button
              onClick={() => setActiveTab('soil')}
              className={`flex-1 py-1 px-2 rounded-lg transition-all ${
                activeTab === 'soil'
                  ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Soil (Clay{soilLayers.length > 0 ? ` ${soilLayers.length}` : ''})
            </button>
          </div>

          {activeTab === 'layers' && (
            <div className="space-y-3.5">
              {/* Category 1: Base Terrain & Imagery */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500">
                  Elevation & Terrain Models
                </span>

                {/* 3D World Terrain */}
                <label className="flex items-center justify-between cursor-pointer select-none py-0.5">
                  <span className="flex items-center gap-2">
                    <Mountain className="w-3.5 h-3.5 text-amber-500" />
                    <span>3D Terrain (Cesium World)</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={layers.terrain}
                    onChange={(e) => onToggleLayer('terrain', e.target.checked)}
                    className="rounded text-sky-600 focus:ring-sky-500"
                  />
                </label>

                {/* Satellite Imagery */}
                <label className="flex items-center justify-between cursor-pointer select-none py-0.5">
                  <span className="flex items-center gap-2">
                    <Satellite className="w-3.5 h-3.5 text-sky-400" />
                    <span>Satellite Imagery</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={layers.satelliteImagery}
                    onChange={(e) => onToggleLayer('satelliteImagery', e.target.checked)}
                    className="rounded text-sky-600 focus:ring-sky-500"
                  />
                </label>

                {/* DEM Elevation Layer */}
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1.5 border border-slate-200/60 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <Layers3 className="w-3.5 h-3.5 text-cyan-500" />
                      <span className="font-semibold">DEM / DEML Elevation</span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openUploadModal('DEM')}
                        title="Upload DEM GeoTIFF (.tif, .tiff)"
                        className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-cyan-100 hover:bg-cyan-200 text-cyan-800 dark:bg-cyan-950 dark:hover:bg-cyan-900 dark:text-cyan-300 flex items-center gap-1"
                      >
                        <Upload className="w-3 h-3" />
                        Upload
                      </button>
                      <input
                        type="checkbox"
                        checked={layers.demElevation}
                        onChange={(e) => onToggleLayer('demElevation', e.target.checked)}
                        className="rounded text-sky-600 focus:ring-sky-500"
                      />
                    </div>
                  </div>
                  {layers.demElevation && (
                    <div className="flex items-center gap-2 pt-1 text-[10px] text-slate-500">
                      <span>Opacity:</span>
                      <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.05"
                        value={layerOpacities['demElevation'] ?? 0.8}
                        onChange={(e) => onOpacityChange('demElevation', parseFloat(e.target.value))}
                        className="flex-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="font-mono w-7 text-right">
                        {Math.round((layerOpacities['demElevation'] ?? 0.8) * 100)}%
                      </span>
                    </div>
                  )}
                </div>

                {/* SRTM 30 Layer */}
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1.5 border border-slate-200/60 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <Mountain className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="font-semibold">SRTM 30m Elevation</span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openUploadModal('SRTM30')}
                        title="Upload SRTM 30 GeoTIFF"
                        className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:hover:bg-emerald-900 dark:text-emerald-300 flex items-center gap-1"
                      >
                        <Upload className="w-3 h-3" />
                        Upload
                      </button>
                      <input
                        type="checkbox"
                        checked={layers.srtm30}
                        onChange={(e) => onToggleLayer('srtm30', e.target.checked)}
                        className="rounded text-sky-600 focus:ring-sky-500"
                      />
                    </div>
                  </div>
                  {layers.srtm30 && (
                    <div className="flex items-center gap-2 pt-1 text-[10px] text-slate-500">
                      <span>Opacity:</span>
                      <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.05"
                        value={layerOpacities['srtm30'] ?? 0.75}
                        onChange={(e) => onOpacityChange('srtm30', parseFloat(e.target.value))}
                        className="flex-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="font-mono w-7 text-right">
                        {Math.round((layerOpacities['srtm30'] ?? 0.75) * 100)}%
                      </span>
                    </div>
                  )}
                </div>

                {/* VEM Layer (Preserved name with confirmed definition) */}
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1.5 border border-slate-200/60 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                      <span className="font-semibold">VEM Layer</span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openUploadModal('VEM')}
                        title="Upload VEM GeoTIFF"
                        className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-teal-100 hover:bg-teal-200 text-teal-800 dark:bg-teal-950 dark:hover:bg-teal-900 dark:text-teal-300 flex items-center gap-1"
                      >
                        <Upload className="w-3 h-3" />
                        Upload
                      </button>
                      <input
                        type="checkbox"
                        checked={layers.vem}
                        onChange={(e) => onToggleLayer('vem', e.target.checked)}
                        className="rounded text-sky-600 focus:ring-sky-500"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 italic">
                    Vegetation Elevation Model (Canopy structure & hydraulic roughness)
                  </p>
                </div>

                {/* TIM Layer (Preserved name with confirmed definition) */}
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1.5 border border-slate-200/60 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                      <span className="font-semibold">TIM Layer</span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openUploadModal('TIM')}
                        title="Upload TIM GeoTIFF"
                        className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-100 hover:bg-indigo-200 text-indigo-800 dark:bg-indigo-950 dark:hover:bg-indigo-900 dark:text-indigo-300 flex items-center gap-1"
                      >
                        <Upload className="w-3 h-3" />
                        Upload
                      </button>
                      <input
                        type="checkbox"
                        checked={layers.tim}
                        onChange={(e) => onToggleLayer('tim', e.target.checked)}
                        className="rounded text-sky-600 focus:ring-sky-500"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 italic">
                    Topographic Inundation Model (Depression storage & depth matrix)
                  </p>
                </div>
              </div>

              {/* Category 2: Geomorphological Analyses */}
              <div className="space-y-1.5 pt-1 border-t border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500">
                  Surface Analyses & Gradients
                </span>

                {/* Slope Analysis */}
                <label className="flex items-center justify-between cursor-pointer select-none py-0.5">
                  <span className="flex items-center gap-2">
                    <Sliders className="w-3.5 h-3.5 text-amber-500" />
                    <span>Slope Analysis</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={layers.slope}
                    onChange={(e) => onToggleLayer('slope', e.target.checked)}
                    className="rounded text-sky-600 focus:ring-sky-500"
                  />
                </label>

                {/* Aspect Analysis */}
                <label className="flex items-center justify-between cursor-pointer select-none py-0.5">
                  <span className="flex items-center gap-2">
                    <Compass className="w-3.5 h-3.5 text-purple-500" />
                    <span>Aspect Orientation</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={layers.aspect}
                    onChange={(e) => onToggleLayer('aspect', e.target.checked)}
                    className="rounded text-sky-600 focus:ring-sky-500"
                  />
                </label>

                {/* Elevation Contours */}
                <label className="flex items-center justify-between cursor-pointer select-none py-0.5">
                  <span className="flex items-center gap-2">
                    <Waves className="w-3.5 h-3.5 text-slate-400" />
                    <span>Elevation Contours (10m)</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={layers.contour}
                    onChange={(e) => onToggleLayer('contour', e.target.checked)}
                    className="rounded text-sky-600 focus:ring-sky-500"
                  />
                </label>
              </div>

              {/* Category 3: Environmental & Telemetry Layers */}
              <div className="space-y-1.5 pt-1 border-t border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500">
                  Hydrology & Sensors
                </span>

                {/* Soil Type */}
                <label className="flex items-center justify-between cursor-pointer select-none py-0.5">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-md bg-[#D97706] inline-block shadow-xs" />
                    <span>Soil Classification (Clay)</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={layers.soilType}
                    onChange={(e) => onToggleLayer('soilType', e.target.checked)}
                    className="rounded text-sky-600 focus:ring-sky-500"
                  />
                </label>

                {/* Rainfall */}
                <label className="flex items-center justify-between cursor-pointer select-none py-0.5">
                  <span className="flex items-center gap-2">
                    <CloudRain className="w-3.5 h-3.5 text-blue-500" />
                    <span>Rainfall Intensity (mm/h)</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={layers.rainfall}
                    onChange={(e) => onToggleLayer('rainfall', e.target.checked)}
                    className="rounded text-sky-600 focus:ring-sky-500"
                  />
                </label>

                {/* Soil Moisture */}
                <label className="flex items-center justify-between cursor-pointer select-none py-0.5">
                  <span className="flex items-center gap-2">
                    <Droplets className="w-3.5 h-3.5 text-cyan-500" />
                    <span>Soil Moisture Saturation (%)</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={layers.soilMoisture}
                    onChange={(e) => onToggleLayer('soilMoisture', e.target.checked)}
                    className="rounded text-sky-600 focus:ring-sky-500"
                  />
                </label>

                {/* Flood Extent */}
                <label className="flex items-center justify-between cursor-pointer select-none py-0.5">
                  <span className="flex items-center gap-2">
                    <Satellite className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Observed Flood Extent</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={layers.floodExtent}
                    onChange={(e) => onToggleLayer('floodExtent', e.target.checked)}
                    className="rounded text-sky-600 focus:ring-sky-500"
                  />
                </label>

                {/* IoT Sensor Markers */}
                <label className="flex items-center justify-between cursor-pointer select-none py-0.5">
                  <span className="flex items-center gap-2">
                    <Radio className="w-3.5 h-3.5 text-sky-500" />
                    <span>IoT Sensor Locations</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={layers.stations}
                    onChange={(e) => onToggleLayer('stations', e.target.checked)}
                    className="rounded text-sky-600 focus:ring-sky-500"
                  />
                </label>
              </div>
            </div>
          )}

          {/* TAB 2: Uploaded Datasets Management & Metadata */}
          {activeTab === 'datasets' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Uploaded Rasters
                </span>
                <button
                  onClick={() => openUploadModal('DEM')}
                  className="px-2 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs"
                >
                  <Upload className="w-3 h-3" />
                  Upload New
                </button>
              </div>

              {uploadedLayers.length === 0 ? (
                <div className="py-8 text-center text-slate-400 space-y-2 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl p-4">
                  <Mountain className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                  <p className="text-xs">No GeoTIFF rasters uploaded yet.</p>
                  <p className="text-[10px] text-slate-500">
                    Upload DEM, SRTM 30, VEM or TIM (.tif, .tiff) elevation files to drape them onto the 3D globe.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {uploadedLayers.map((layer) => (
                    <div
                      key={layer.id}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white truncate block">
                            {layer.name}
                          </span>
                          <span className="text-[10px] font-mono text-sky-600 dark:text-sky-400 font-semibold uppercase">
                            {layer.layer_type} • {layer.resolution || '30m'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setSelectedLayerMetadata(layer)}
                            title="Inspect Dataset Metadata"
                            className="p-1 rounded text-slate-400 hover:text-sky-600"
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>
                          {onDeleteLayer && (
                            <button
                              onClick={() => onDeleteLayer(layer.id)}
                              title="Delete layer"
                              className="p-1 rounded text-slate-400 hover:text-rose-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="text-[10px] text-slate-500 font-mono">
                        Bounds: [{layer.west.toFixed(2)}, {layer.south.toFixed(2)}] to [{layer.east.toFixed(2)}, {layer.north.toFixed(2)}]
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Soil Classification (Clay) */}
          {activeTab === 'soil' && (
            <div className="space-y-3">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-900/60 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200 text-xs">
                  <span className="w-3 h-3 rounded bg-[#D97706] inline-block shadow-xs" />
                  <span>Primary Soil Type: Clay</span>
                </div>
                <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                  Clay soils feature microscopic dense mineral platelets resulting in low water infiltration (approx. 1.5 mm/h). During high rain events, saturated clay yields rapid surface runoff and flash ponding.
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3 space-y-2 text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                  Soil Hydraulic Characteristics
                </span>
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500">Infiltration Rate:</span>
                  <strong className="text-slate-800 dark:text-slate-200">1.5 mm/h (Slow)</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500">Water Holding Capacity:</span>
                  <strong className="text-slate-800 dark:text-slate-200">48%</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500">Runoff Coefficient:</span>
                  <strong className="text-slate-800 dark:text-slate-200">0.78 (High)</strong>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Flood Vulnerability:</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400">
                    Elevated Ponding
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Extended Soil Classification Matrix
                </span>
                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                  <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FBBF24]" />
                    <span>Sandy (30 mm/h)</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#A78BFA]" />
                    <span>Silty (8 mm/h)</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                    <span>Loamy (12.5 mm/h)</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#78350F]" />
                    <span>Peaty (18 mm/h)</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Upload Modal */}
      <UploadLayerModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onLayerUploaded={onLayerUploaded}
        initialLayerType={uploadTargetType}
      />

      {/* Metadata Detail Dialog */}
      {selectedLayerMetadata && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
              <span className="font-bold text-sm text-slate-900 dark:text-white">
                Dataset Metadata: {selectedLayerMetadata.name}
              </span>
              <button
                onClick={() => setSelectedLayerMetadata(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 text-xs font-mono">
              <p>Type: <strong>{selectedLayerMetadata.layer_type}</strong></p>
              <p>Resolution: <strong>{selectedLayerMetadata.resolution}</strong></p>
              <p>CRS: <strong>{selectedLayerMetadata.crs || 'WGS 84 (EPSG:4326)'}</strong></p>
              <p>Elevation Range: <strong>{selectedLayerMetadata.min_elevation}m – {selectedLayerMetadata.max_elevation}m</strong></p>
              <p>Geographic Coverage: <strong>{selectedLayerMetadata.west}°W, {selectedLayerMetadata.south}°S to {selectedLayerMetadata.east}°E, {selectedLayerMetadata.north}°N</strong></p>
            </div>
            <button
              onClick={() => setSelectedLayerMetadata(null)}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
