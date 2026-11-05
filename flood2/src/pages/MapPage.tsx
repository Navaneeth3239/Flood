import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  GeoJSON,
  useMapEvents,
} from 'react-leaflet';
import {
  Layers,
  MapPin,
  AlertTriangle,
  Radio,
  Mountain,
  X,
} from 'lucide-react';

import { Station, Reading, RiskZoneCollection, Incident } from '@/types';
import { apiClient, isMockDataEnabled } from '@/api';
import { DemoBadge, IllustrativeNotice } from '@/components/common/DemoBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { formatWaterLevel, formatRainfall } from '@/utils/formatters';
import { timeAgo } from '@/utils/date';
import { createColorIcon, severityMarkerColors, setupLeafletIcons } from '@/utils/leafletIcons';

setupLeafletIcons();

// Map click listener component that captures user selected location
const MapClickHandler: React.FC<{
  onSelectLocation: (lat: number, lng: number) => void;
}> = ({ onSelectLocation }) => {
  useMapEvents({
    click(e) {
      onSelectLocation(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

export const MapPage: React.FC = () => {
  const { t } = useTranslation();
  const isMock = isMockDataEnabled();

  const [stations, setStations] = useState<Station[]>([]);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [riskZones, setRiskZones] = useState<RiskZoneCollection | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Layer toggles
  const [showStations, setShowStations] = useState(true);
  const [showRiskZones, setShowRiskZones] = useState(true);
  const [showIncidents, setShowIncidents] = useState(true);

  // Selected feature details
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);

  // User clicked custom location on Leaflet map
  const [clickedLocation, setClickedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      const [stns, rds, zones, incs] = await Promise.all([
        apiClient.getStations(),
        apiClient.getReadings({ limit: 100 }),
        apiClient.getRiskZones(),
        apiClient.getIncidents(),
      ]);
      setStations(stns);
      setReadings(rds);
      setRiskZones(zones);
      setIncidents(incs);
    } catch (err: any) {
      setError(err?.message || 'Failed to load geospatial and hydrologic map data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const latestReadingsMap = useMemo(() => {
    const map = new Map<string, Reading>();
    readings.forEach((r) => {
      if (!map.has(r.stationId)) {
        map.set(r.stationId, r);
      }
    });
    return map;
  }, [readings]);

  // Polygon styling function for GeoJSON risk zones
  const getRiskZoneStyle = (feature: any) => {
    const riskLevel = feature?.properties?.riskLevel || 'normal';
    let fillColor = '#10B981';
    let strokeColor = '#059669';

    if (riskLevel === 'danger') {
      fillColor = '#EF4444';
      strokeColor = '#DC2626';
    } else if (riskLevel === 'warning') {
      fillColor = '#F97316';
      strokeColor = '#EA580C';
    } else if (riskLevel === 'watch') {
      fillColor = '#F59E0B';
      strokeColor = '#D97706';
    }

    return {
      fillColor,
      weight: 2,
      opacity: 0.85,
      color: strokeColor,
      dashArray: '4, 4',
      fillOpacity: 0.35,
    };
  };

  const onEachRiskZoneFeature = (feature: any, layer: any) => {
    if (feature.properties) {
      const p = feature.properties;
      const html = `
        <div style="font-family: sans-serif; font-size: 12px; padding: 4px; max-width: 240px;">
          <div style="font-weight: bold; color: #0f172a; margin-bottom: 2px;">${p.name}</div>
          <div style="color: #64748b; margin-bottom: 4px;">${p.description || ''}</div>
          <div style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 10px; text-transform: uppercase; background: #fee2e2; color: #991b1b; margin-bottom: 6px;">
            Risk: ${p.riskLevel}
          </div>
          <div style="border-top: 1px solid #e2e8f0; padding-top: 4px; font-size: 11px; color: #b45309; font-weight: 500;">
            ⚠️ ${p.simulated ? 'Illustrative / simulated boundary' : 'Official zone'}
          </div>
        </div>
      `;
      layer.bindPopup(html);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading GIS layers, river basins, and sensor coordinates..." size="lg" />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchData} />;
  }

  return (
    <div className="space-y-4 flex flex-col h-[calc(100vh-140px)] min-h-[550px]">
      {/* Top Banner with Illustrative Notice, Demo Badge & 3D Terrain shortcut */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t('map.title')}
            </h1>
            {isMock && <DemoBadge size="md" />}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Click any station, hazard zone, or map point to launch focused 3D GIS Terrain
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <IllustrativeNotice text={t('map.illustrativeBoundary')} />

          {/* Quick link to 3D Terrain */}
          <Link
            to="/terrain"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-sky-300 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 text-xs font-semibold hover:bg-sky-100 transition-colors shadow-xs"
          >
            <Mountain className="w-3.5 h-3.5" />
            <span>Open 3D GIS Terrain</span>
          </Link>
        </div>
      </div>

      {/* Main Map Container & Floating Controls */}
      <div className="flex-1 relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
        <MapContainer
          center={[18.0, 79.0]}
          zoom={5}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%', zIndex: 1 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Captures arbitrary map clicks for 3D navigation */}
          <MapClickHandler
            onSelectLocation={(lat, lng) => {
              setClickedLocation({ lat, lng });
              setSelectedStation(null);
            }}
          />

          {/* User clicked location pin */}
          {clickedLocation && (
            <Marker
              position={[clickedLocation.lat, clickedLocation.lng]}
              icon={createColorIcon('#0284c7')}
            >
              <Popup autoPan={false}>
                <div className="text-xs p-1 min-w-[200px]">
                  <div className="flex items-center justify-between pb-1 border-b mb-1.5 font-bold text-slate-900">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-sky-600" />
                      Selected Location
                    </span>
                    <span className="text-[10px] text-sky-600 font-mono">3D Target</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-600 mb-2">
                    {clickedLocation.lat.toFixed(4)}°N, {clickedLocation.lng.toFixed(4)}°E
                  </div>
                  <Link
                    to={`/terrain?lat=${clickedLocation.lat}&lng=${clickedLocation.lng}&name=${encodeURIComponent('Selected Coordinate')}`}
                    className="flex items-center justify-center gap-1.5 w-full py-1.5 px-2 bg-sky-600 hover:bg-sky-700 text-white rounded font-medium text-[11px] shadow-xs transition-colors"
                  >
                    <Mountain className="w-3.5 h-3.5" />
                    <span>View Location in 3D GIS</span>
                  </Link>
                </div>
              </Popup>
            </Marker>
          )}

          {/* GeoJSON Simulated Risk Zones */}
          {showRiskZones && riskZones && (
            <GeoJSON
              key={JSON.stringify(riskZones)}
              data={riskZones as any}
              style={getRiskZoneStyle}
              onEachFeature={onEachRiskZoneFeature}
            />
          )}

          {/* Hydrometric Station Markers */}
          {showStations &&
            stations.map((stn, idx) => {
              const stnId = String(stn.id || (stn as any).sensor_id || `map-stn-marker-${idx}`);
              const reading = latestReadingsMap.get(stnId) || latestReadingsMap.get(stn.id);
              let sevColor = severityMarkerColors.normal;
              const dangerThresh = stn.thresholds?.dangerMax ?? 11.0;
              const warningThresh = stn.thresholds?.warningMax ?? 9.5;
              const watchThresh = stn.thresholds?.watchMax ?? 8.0;

              if (stn.status === 'offline') {
                sevColor = severityMarkerColors.unknown;
              } else if (reading?.waterLevel != null && reading.waterLevel >= dangerThresh) {
                sevColor = severityMarkerColors.danger;
              } else if (reading?.waterLevel != null && reading.waterLevel >= warningThresh) {
                sevColor = severityMarkerColors.warning;
              } else if (reading?.waterLevel != null && reading.waterLevel >= watchThresh) {
                sevColor = severityMarkerColors.watch;
              }

              const stnName = stn.name || (stn as any).location_name || stnId;
              const stnCode = stn.code || (stn as any).sensor_id || stnId;
              const stnBasin = stn.riverBasin || (stn as any).river_basin || 'General Basin';

              return (
                <Marker
                  key={stnId}
                  position={[stn.latitude, stn.longitude]}
                  icon={createColorIcon(sevColor)}
                  eventHandlers={{
                    click: () => {
                      setSelectedStation(stn);
                      setClickedLocation(null);
                    },
                  }}
                >
                  <Popup>
                    <div className="text-xs p-1 min-w-[200px]">
                      <div className="flex items-center justify-between gap-2 border-b pb-1 mb-1.5">
                        <span className="font-bold text-slate-900">{stnName}</span>
                        <span className="text-[10px] uppercase font-bold text-sky-600 bg-sky-50 px-1 py-0.5 rounded">
                          {stnCode}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px] mb-1">{stnBasin}</p>
                      <div className="space-y-1 text-slate-700">
                        <div className="flex justify-between">
                          <span>Water Level:</span>
                          <span className="font-bold text-sky-700">
                            {formatWaterLevel(reading?.waterLevel)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Rainfall (1h):</span>
                          <span className="font-semibold">{formatRainfall(reading?.rainfall)}</span>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-400 pt-1 border-t">
                          <span>Battery: {stn.batteryLevel ?? 100}%</span>
                          <span>{reading ? timeAgo(reading.timestamp) : 'No data'}</span>
                        </div>
                      </div>

                      {/* Direct 3D GIS Action Button */}
                      <Link
                        to={`/terrain?lat=${stn.latitude}&lng=${stn.longitude}&name=${encodeURIComponent(stnName)}&stationId=${stnId}`}
                        className="mt-2.5 flex items-center justify-center gap-1.5 w-full py-1.5 px-2 bg-sky-600 hover:bg-sky-700 text-white rounded font-medium text-[11px] shadow-xs transition-colors"
                      >
                        <Mountain className="w-3.5 h-3.5" />
                        <span>View Station in 3D GIS</span>
                      </Link>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

          {/* Community Reported Incident Markers */}
          {showIncidents &&
            incidents.map((inc, idx) => {
              const incId = String(inc.id || (inc as any)._id || `inc-marker-${idx}`);
              const lat = inc.location?.latitude ?? 11.0;
              const lng = inc.location?.longitude ?? 76.9;
              return (
                <Marker
                  key={incId}
                  position={[lat, lng]}
                  icon={createColorIcon('#dc2626')}
                >
                  <Popup>
                    <div className="text-xs p-1 max-w-[220px]">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-red-100 text-red-800">
                        Community Incident ({inc.priority})
                      </span>
                      <h4 className="font-bold text-slate-900 mt-1">{inc.title}</h4>
                      <p className="text-slate-600 text-[11px] mt-1">{inc.description}</p>
                      <p className="text-slate-400 text-[10px] mt-1">Status: {inc.status}</p>

                      <Link
                        to={`/terrain?lat=${lat}&lng=${lng}&name=${encodeURIComponent(inc.title || 'Incident')}`}
                        className="mt-2 flex items-center justify-center gap-1.5 w-full py-1 px-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium text-[11px] text-center transition-colors"
                      >
                        <Mountain className="w-3.5 h-3.5" />
                        <span>Inspect Terrain in 3D</span>
                      </Link>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
        </MapContainer>

        {/* Floating Layer Control Panel */}
        <div className="absolute top-4 right-4 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl p-3.5 shadow-lg border border-slate-200 dark:border-slate-800 text-xs w-56 space-y-2.5">
          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-1.5 border-b border-slate-200 dark:border-slate-800">
            <Layers className="w-4 h-4 text-sky-500" />
            <span>{t('map.layers')}</span>
          </div>

          <div className="space-y-2 text-slate-700 dark:text-slate-300">
            <label className="flex items-center justify-between cursor-pointer select-none">
              <span className="flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-sky-500" />
                {t('map.layerStations')}
              </span>
              <input
                type="checkbox"
                checked={showStations}
                onChange={(e) => setShowStations(e.target.checked)}
                className="rounded text-sky-600 focus:ring-sky-500"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer select-none">
              <span className="flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
                {t('map.layerRiskZones')}
              </span>
              <input
                type="checkbox"
                checked={showRiskZones}
                onChange={(e) => setShowRiskZones(e.target.checked)}
                className="rounded text-sky-600 focus:ring-sky-500"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer select-none">
              <span className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-red-500" />
                {t('map.layerIncidents')}
              </span>
              <input
                type="checkbox"
                checked={showIncidents}
                onChange={(e) => setShowIncidents(e.target.checked)}
                className="rounded text-sky-600 focus:ring-sky-500"
              />
            </label>
          </div>

          {/* Map Legend */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5 text-[11px]">
            <span className="font-semibold text-slate-500 block mb-1">
              {t('map.legendTitle')}
            </span>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>Normal (&lt; Watch Mark)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span>Watch Stage</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
              <span>Warning Stage</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
              <span>Danger (&gt; Evacuation Level)</span>
            </div>
          </div>
        </div>

        {/* Selected Station Bottom Card with Direct 3D Navigation */}
        {selectedStation && (
          <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:w-96 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-slate-200 dark:border-slate-800 text-xs animate-in slide-in-from-bottom-2 duration-150">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {selectedStation.name}
                </h3>
                <p className="text-[11px] text-slate-500">{selectedStation.riverBasin}</p>
              </div>
              <button
                onClick={() => setSelectedStation(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/60">
                <span className="text-[10px] text-slate-400 block">Water Level</span>
                <span className="font-bold text-sky-600 dark:text-sky-400 text-sm">
                  {formatWaterLevel(latestReadingsMap.get(selectedStation.id)?.waterLevel)}
                </span>
              </div>
              <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/60">
                <span className="text-[10px] text-slate-400 block">Rainfall (1h)</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  {formatRainfall(latestReadingsMap.get(selectedStation.id)?.rainfall)}
                </span>
              </div>
            </div>

            {/* Direct 3D Terrain Action Button */}
            <Link
              to={`/terrain?lat=${selectedStation.latitude}&lng=${selectedStation.longitude}&name=${encodeURIComponent(selectedStation.name)}&stationId=${selectedStation.id}`}
              className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-semibold text-xs shadow-xs transition-colors"
            >
              <Mountain className="w-4 h-4" />
              <span>Open in 3D GIS Terrain View</span>
            </Link>
          </div>
        )}

        {/* Selected Arbitrary Point Bottom Card */}
        {clickedLocation && !selectedStation && (
          <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:w-88 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-sky-300 dark:border-sky-800 text-xs animate-in slide-in-from-bottom-2 duration-150">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-sky-600 tracking-wider">
                  Map Point Selected
                </span>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">
                  Custom Geographical Coordinates
                </h3>
                <p className="font-mono text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {clickedLocation.lat.toFixed(4)}°N, {clickedLocation.lng.toFixed(4)}°E
                </p>
              </div>
              <button
                onClick={() => setClickedLocation(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <Link
              to={`/terrain?lat=${clickedLocation.lat}&lng=${clickedLocation.lng}&name=${encodeURIComponent('Selected Coordinate')}`}
              className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-semibold text-xs shadow-xs transition-colors"
            >
              <Mountain className="w-4 h-4" />
              <span>Inspect 3D Terrain at this Point</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
