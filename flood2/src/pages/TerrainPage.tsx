import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import {
  Map as MapIcon,
  PanelLeft,
} from 'lucide-react';

import { Station, Reading, TerrainData } from '@/types';
import { apiClient, isMockDataEnabled } from '@/api';
import { DemoBadge } from '@/components/common/DemoBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';

// 3D GIS CesiumJS Digital Twin Components & Utilities
import { FloodTerrainView, CameraActionHandle } from '@/components/gis3d/FloodTerrainView';
import { DigitalTwinToolbar, MapMode } from '@/components/gis3d/DigitalTwinToolbar';
import { BuildingInfoPanel } from '@/components/gis3d/BuildingInfoPanel';
import { GISSummaryPanel } from '@/components/gis3d/GISSummaryPanel';
import { CameraNavControls } from '@/components/gis3d/CameraNavControls';
import { MapRightControls } from '@/components/gis3d/MapRightControls';
import { StatusAltitudeBar } from '@/components/gis3d/StatusAltitudeBar';
import { AreaAnalyticsModal } from '@/components/gis3d/AreaAnalyticsModal';
import { LayerVisibilityState } from '@/components/gis3d/LayerControlPanel';
import { StationDetailsPanel } from '@/components/gis3d/StationDetailsPanel';
import { FloodRiskLegend } from '@/components/gis3d/FloodRiskLegend';
import { LOCATION_PRESETS } from '@/utils/geospatialHelpers';

// Services
import {
  buildingFootprintService,
  BuildingFootprint,
  BuildingFootprintStats,
} from '@/services/buildingFootprintService';

// Legacy Three.js DEM Mesh for comparative simulation
const LegacyTerrainMesh: React.FC<{
  terrainData: TerrainData;
  waterLevel: number;
}> = ({ terrainData, waterLevel }) => {
  const { width, height, gridData, minElevation, maxElevation } = terrainData;

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(60, 60, width - 1, height - 1);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    const colors: number[] = [];
    const elevationRange = maxElevation - minElevation || 1;

    for (let i = 0; i < pos.count; i++) {
      const ix = i % width;
      const iy = Math.floor(i / width);
      const elevation = gridData[iy]?.[ix] ?? minElevation;

      const scaledY = ((elevation - minElevation) / elevationRange) * 12;
      pos.setY(i, scaledY);

      const t = (elevation - minElevation) / elevationRange;
      const color = new THREE.Color();
      if (t < 0.2) {
        color.setHSL(0.12, 0.6, 0.45);
      } else if (t < 0.5) {
        color.setHSL(0.3, 0.65, 0.35);
      } else if (t < 0.8) {
        color.setHSL(0.08, 0.5, 0.35);
      } else {
        color.setHSL(0.0, 0.0, 0.7);
      }
      colors.push(color.r, color.g, color.b);
    }

    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, [terrainData]);

  const scaledWaterY = ((waterLevel - minElevation) / (maxElevation - minElevation || 1)) * 12;

  return (
    <group>
      <mesh geometry={geometry} receiveShadow castShadow>
        <meshStandardMaterial vertexColors roughness={0.85} metalness={0.1} flatShading />
      </mesh>
      <mesh position={[0, scaledWaterY, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#0284c7" transparent opacity={0.65} roughness={0.1} metalness={0.2} />
      </mesh>
      {terrainData.stationsInArea.map((stn) => {
        const posX = (stn.gridX / width - 0.5) * 60;
        const posZ = (stn.gridY / height - 0.5) * 60;
        const posY = ((stn.elevation - minElevation) / (maxElevation - minElevation || 1)) * 12 + 1.2;
        const pinColor =
          stn.severity === 'danger'
            ? '#ef4444'
            : stn.severity === 'warning'
            ? '#f97316'
            : stn.severity === 'watch'
            ? '#f59e0b'
            : '#10b981';

        return (
          <group key={stn.stationId} position={[posX, posY, posZ]}>
            <mesh position={[0, 0, 0]}>
              <cylinderGeometry args={[0.2, 0.2, 2.5, 12]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
            <mesh position={[0, 1.5, 0]}>
              <sphereGeometry args={[0.7, 16, 16]} />
              <meshStandardMaterial color={pinColor} emissive={pinColor} emissiveIntensity={0.6} />
            </mesh>
            <Text
              position={[0, 2.8, 0]}
              fontSize={1.2}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.15}
              outlineColor="#0f172a"
            >
              {stn.stationName.split('-')[0]}
            </Text>
          </group>
        );
      })}
    </group>
  );
};

export const TerrainPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isMock = isMockDataEnabled();

  // Root container ref for full-screen mode
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Toggle for side panels outside the map
  const [showSidePanels, setShowSidePanels] = useState(true);

  // Imperative handle to Cesium camera movements
  const cameraActionRef = useRef<CameraActionHandle>(null);

  // Active view engine
  const [engineMode] = useState<'cesium' | 'threejs'>('cesium');

  // Digital Twin Map Mode: standard3d | satellite | tinTerrain | flatView | srtm30
  const [mapMode, setMapMode] = useState<MapMode>('standard3d');

  // Digital Twin Vector Layer Toggles
  const [showRivers, setShowRivers] = useState(true);
  const [showPaths, setShowPaths] = useState(true);
  const [showBuildings, setShowBuildings] = useState(true);
  const [showAreaInGIS, setShowAreaInGIS] = useState(true);
  const [showAreaAnalytics, setShowAreaAnalytics] = useState(false);

  // Building Footprints State
  const [buildings, setBuildings] = useState<BuildingFootprint[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingFootprint | null>(null);
  const [isReloadingBuildings, setIsReloadingBuildings] = useState(false);
  const [buildingStats, setBuildingStats] = useState<BuildingFootprintStats>({
    totalCount: 1849,
    extrudedCount: 1849,
    avgHeight: 8.4,
    minHeight: 4.5,
    maxHeight: 18.0,
    totalRoofAreaSqM: 218500,
    highRiskCount: 148,
  });

  // Query parameters from Leaflet map selection
  const queryLat = searchParams.get('lat');
  const queryLng = searchParams.get('lng');
  const queryName = searchParams.get('name');
  const queryStationId = searchParams.get('stationId');

  // Selected location state (defaults to Mountain Valley Gorge if none passed)
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
    name?: string;
    stationId?: string;
    zoomLevel?: number;
  }>(() => {
    if (queryLat && queryLng) {
      return {
        lat: parseFloat(queryLat),
        lng: parseFloat(queryLng),
        name: queryName || 'Selected Map Location',
        stationId: queryStationId || undefined,
      };
    }
    const defaultPreset = LOCATION_PRESETS[0];
    return {
      lat: defaultPreset.latitude,
      lng: defaultPreset.longitude,
      name: defaultPreset.name,
    };
  });

  // Telemetry & Stations data
  const [stations, setStations] = useState<Station[]>([]);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);

  // Legacy Three.js terrain dataset
  const [legacyTerrainData, setLegacyTerrainData] = useState<TerrainData | null>(null);
  const [simulatedWaterLevel, setSimulatedWaterLevel] = useState<number>(204.0);

  // Loading & error state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Live Camera Navigation & Orientation State
  const [freeMoveMode, setFreeMoveMode] = useState(true);
  const [cameraState, setCameraState] = useState<{
    altitude: number;
    pitch: number;
    heading: number;
  }>({
    altitude: 2850,
    pitch: -34,
    heading: 38,
  });

  const [cursorCoords, setCursorCoords] = useState<{
    lat: number;
    lng: number;
    elevation: number | null;
  } | null>(null);

  const [resetTrigger, setResetTrigger] = useState(0);

  // Layer toggles for stations, SAR, risk zones, shelters
  const [layers, setLayers] = useState<LayerVisibilityState>({
    terrain: true,
    stations: true,
    rivers: true,
    sarObservedFlood: true,
    gnnPredictedRisk: true,
    satelliteImagery: true,
    emergencyShelters: true,
  });

  // Load building footprints on mount
  useEffect(() => {
    buildingFootprintService.getFootprints().then((data) => {
      setBuildings(data);
      const st = buildingFootprintService.getStats(data);
      setBuildingStats(st);
    });
  }, []);

  // Reload building footprints action
  const handleReloadBuildings = async () => {
    setIsReloadingBuildings(true);
    try {
      const reloaded = await buildingFootprintService.reloadFootprints();
      setBuildings(reloaded);
      const st = buildingFootprintService.getStats(reloaded);
      setBuildingStats(st);
      setSelectedBuilding(null);
    } finally {
      setIsReloadingBuildings(false);
    }
  };

  // Synchronize when query params change from external navigation
  useEffect(() => {
    if (queryLat && queryLng) {
      const parsedLat = parseFloat(queryLat);
      const parsedLng = parseFloat(queryLng);
      if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
        setSelectedLocation({
          lat: parsedLat,
          lng: parsedLng,
          name: queryName || 'Selected Location',
          stationId: queryStationId || undefined,
        });

        if (queryStationId && stations.length > 0) {
          const found = stations.find((s) => s.id === queryStationId);
          if (found) setSelectedStation(found);
        }
      }
    }
  }, [queryLat, queryLng, queryName, queryStationId, stations]);

  // Fetch telemetry & stations from API
  const fetchData = async () => {
    try {
      setError(null);
      const [stns, rds, tData] = await Promise.all([
        apiClient.getStations(),
        apiClient.getReadings({ limit: 100 }),
        apiClient.getTerrain('basin-yamuna').catch(() => null),
      ]);
      setStations(stns);
      setReadings(rds);
      if (tData) {
        setLegacyTerrainData(tData);
        setSimulatedWaterLevel(tData.minElevation + (tData.maxElevation - tData.minElevation) * 0.35);
      }

      if (queryStationId) {
        const found = stns.find((s) => s.id === queryStationId);
        if (found) setSelectedStation(found);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to initialize geospatial hydrologic data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Preset region change handler
  const handleSelectPreset = (presetId: string) => {
    const preset = LOCATION_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setSelectedLocation({
      lat: preset.latitude,
      lng: preset.longitude,
      name: preset.name,
    });
    setSelectedStation(null);
    setSelectedBuilding(null);
    setSearchParams({
      lat: preset.latitude.toString(),
      lng: preset.longitude.toString(),
      name: preset.name,
    });
    cameraActionRef.current?.resetHome();
  };

  // Fullscreen toggle handler
  const handleToggleFullscreen = () => {
    if (!pageContainerRef.current) return;
    if (!document.fullscreenElement) {
      pageContainerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Find active reading for selected station
  const activeReading = useMemo(() => {
    if (!selectedStation) return undefined;
    return readings.find((r) => r.stationId === selectedStation.id);
  }, [selectedStation, readings]);

  if (loading) {
    return <LoadingSpinner label="Constructing 3D Cesium GIS terrain view & hydrograph mesh..." size="lg" />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchData} />;
  }

  return (
    <div
      ref={pageContainerRef}
      className={`w-full flex flex-col font-sans transition-all ${
        isFullscreen
          ? 'fixed inset-0 z-50 h-screen w-screen bg-slate-950 p-3'
          : 'space-y-3 h-[calc(100vh-110px)] min-h-[720px]'
      }`}
    >
      {/* 1. TOP HEADER BAR (OUTSIDE THE GIS MAP) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
              3D GIS Digital Twin
            </h1>
            {isMock && <DemoBadge size="sm" />}
          </div>
          <span className="text-xs text-slate-500 hidden md:inline">|</span>
          <span className="text-xs text-cyan-300 font-mono hidden md:inline">
            {selectedLocation.name || 'Mountain Study Basin'}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Study Region Preset Selector */}
          <select
            value={
              LOCATION_PRESETS.find(
                (p) =>
                  Math.abs(p.latitude - selectedLocation.lat) < 0.01 &&
                  Math.abs(p.longitude - selectedLocation.lng) < 0.01
              )?.id || 'mountain-valley'
            }
            onChange={(e) => handleSelectPreset(e.target.value)}
            className="text-xs font-semibold rounded-xl border border-slate-700 bg-slate-900 text-cyan-300 px-3 py-1.5 shadow-md focus:ring-2 focus:ring-cyan-500"
          >
            {LOCATION_PRESETS.map((p) => (
              <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                {p.name}
              </option>
            ))}
          </select>

          {/* Toggle Side Panels Button */}
          <button
            onClick={() => setShowSidePanels(!showSidePanels)}
            title={showSidePanels ? 'Collapse side panels to expand 3D map' : 'Show side panels'}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-colors ${
              showSidePanels
                ? 'border-cyan-500/40 bg-cyan-950/60 text-cyan-300'
                : 'border-slate-700 bg-slate-900 text-slate-300 hover:text-white'
            }`}
          >
            <PanelLeft className="w-3.5 h-3.5" />
            <span>{showSidePanels ? 'Hide Panels' : 'Show Panels'}</span>
          </button>

          {/* Return to 2D Leaflet Map */}
          <Link
            to="/map"
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900 text-slate-300 hover:text-white transition-colors"
          >
            <MapIcon className="w-3.5 h-3.5 text-sky-400" />
            <span>2D Map</span>
          </Link>
        </div>
      </div>

      {/* 2. TOP TOOLBAR (OUTSIDE THE GIS MAP) */}
      <div className="w-full flex-shrink-0">
        <DigitalTwinToolbar
          currentMode={mapMode}
          onSelectMode={(mode) => setMapMode(mode)}
          showRivers={showRivers}
          onToggleRivers={(val) => setShowRivers(val)}
          showPaths={showPaths}
          onTogglePaths={(val) => setShowPaths(val)}
          showBuildings={showBuildings}
          onToggleBuildings={(val) => setShowBuildings(val)}
          buildingCount={buildingStats.totalCount}
          showAreaInGIS={showAreaInGIS}
          onToggleAreaInGIS={(val) => setShowAreaInGIS(val)}
          showAreaAnalytics={showAreaAnalytics}
          onToggleAreaAnalytics={(val) => setShowAreaAnalytics(val)}
          showFlashFlood={layers.gnnPredictedRisk}
          onToggleFlashFlood={(val) => setLayers((prev) => ({ ...prev, gnnPredictedRisk: val }))}
          showSensors={layers.stations}
          onToggleSensors={(val) => setLayers((prev) => ({ ...prev, stations: val }))}
          showEvacuation={layers.emergencyShelters}
          onToggleEvacuation={(val) => setLayers((prev) => ({ ...prev, emergencyShelters: val }))}
          onOpenAIChat={() => navigate('/assistant')}
          onResetView={() => cameraActionRef.current?.resetHome()}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
        />
      </div>

      {/* 3. MAIN WORKSPACE: SIDEBAR + PURE 3D GIS MAP */}
      <div className="flex-1 flex flex-col lg:flex-row gap-3.5 min-h-0 overflow-hidden">
        {/* LEFT COLUMN: SIDE PANELS OUTSIDE MAP */}
        {showSidePanels && (
          <aside className="w-full lg:w-80 xl:w-88 flex-shrink-0 flex flex-col gap-3 overflow-y-auto pr-1 no-scrollbar animate-in slide-in-from-left-2 duration-200">
            {/* Building Information Panel (Houses in Marked Area) */}
            <BuildingInfoPanel
              stats={buildingStats}
              selectedBuilding={selectedBuilding}
              onClearSelectedBuilding={() => setSelectedBuilding(null)}
              showBuildings={showBuildings}
              onToggleBuildings={(val) => setShowBuildings(val)}
              onReloadBuildings={handleReloadBuildings}
              isReloading={isReloadingBuildings}
            />

            {/* GIS Summary Panel (Paths, Waterways, Buildings counts & sync status) */}
            <GISSummaryPanel
              pathsCount={142}
              waterwaysCount={18}
              buildingsCount={buildingStats.totalCount}
              syncStatus="Synchronized & Clamped to DEM"
              isMLModelConfigured={true}
            />
          </aside>
        )}

        {/* RIGHT COLUMN: PURE 3D GIS MAP CANVAS (COMPLETELY UNOBSTRUCTED) */}
        <div className="flex-1 h-full min-h-[480px] relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
          {engineMode === 'cesium' ? (
            <FloodTerrainView
              ref={cameraActionRef}
              selectedLocation={selectedLocation}
              stations={stations}
              readings={readings}
              selectedStation={selectedStation}
              onSelectStation={(stn) => {
                setSelectedStation(stn);
                setSelectedBuilding(null);
              }}
              buildings={buildings}
              selectedBuilding={selectedBuilding}
              onSelectBuilding={(bld) => {
                setSelectedBuilding(bld);
                setSelectedStation(null);
              }}
              showBuildings={showBuildings}
              mapMode={mapMode}
              showRivers={showRivers}
              showPaths={showPaths}
              showAreaInGIS={showAreaInGIS}
              layers={layers}
              terrainExaggeration={1.5}
              onCoordinatesChange={(coords) => setCursorCoords(coords)}
              onCameraStateChange={(state) => setCameraState(state)}
              onResetTrigger={resetTrigger}
            />
          ) : (
            /* Legacy Three.js DEM Mesh */
            legacyTerrainData && (
              <div className="w-full h-full relative">
                <Canvas camera={{ position: [35, 40, 45], fov: 45 }}>
                  <ambientLight intensity={0.65} />
                  <directionalLight position={[40, 60, 20]} intensity={1.2} castShadow />
                  <pointLight position={[-20, 30, -20]} intensity={0.5} color="#38bdf8" />
                  <LegacyTerrainMesh terrainData={legacyTerrainData} waterLevel={simulatedWaterLevel} />
                  <OrbitControls makeDefault enableDamping dampingFactor={0.05} />
                </Canvas>
                <div className="absolute top-4 left-4 z-10 bg-slate-900/90 p-3 rounded-xl border border-slate-800 text-xs">
                  <span>Elevation: {simulatedWaterLevel.toFixed(1)}m</span>
                </div>
              </div>
            )
          )}

          {/* LOWER-LEFT: COMPACT CAMERA NAVIGATION D-PAD (HUD) */}
          <div className="absolute bottom-3 left-3 z-20 pointer-events-auto">
            <CameraNavControls
              onMoveForward={() => cameraActionRef.current?.moveForward()}
              onMoveBackward={() => cameraActionRef.current?.moveBackward()}
              onMoveLeft={() => cameraActionRef.current?.moveLeft()}
              onMoveRight={() => cameraActionRef.current?.moveRight()}
              onTurnLeft={() => cameraActionRef.current?.turnLeft()}
              onTurnRight={() => cameraActionRef.current?.turnRight()}
              onTiltUp={() => cameraActionRef.current?.tiltUp()}
              onTiltDown={() => cameraActionRef.current?.tiltDown()}
              onElevateUp={() => cameraActionRef.current?.elevateUp()}
              onElevateDown={() => cameraActionRef.current?.elevateDown()}
              freeMoveMode={freeMoveMode}
              onToggleFreeMove={() => setFreeMoveMode(!freeMoveMode)}
            />
          </div>

          {/* RIGHT-SIDE: COMPASS & ZOOM CONTROLS (HUD) */}
          <div className="absolute top-4 right-3 z-20 pointer-events-auto">
            <MapRightControls
              headingDegrees={cameraState.heading}
              onResetNorth={() => cameraActionRef.current?.resetNorth()}
              onZoomIn={() => cameraActionRef.current?.zoomIn()}
              onZoomOut={() => cameraActionRef.current?.zoomOut()}
              onResetPitch={() => cameraActionRef.current?.resetPitch()}
            />
          </div>

          {/* BOTTOM-RIGHT: LIVE STATUS BAR (HUD) */}
          <div className="absolute bottom-3 right-3 z-20 pointer-events-auto">
            <StatusAltitudeBar
              cameraAltitudeMeters={cameraState.altitude}
              pitchDegrees={cameraState.pitch}
              headingDegrees={cameraState.heading}
              cursorCoordinates={cursorCoords}
            />
          </div>

          {/* AREA ANALYTICS DRAWER (MODAL OVERLAY) */}
          {showAreaAnalytics && (
            <AreaAnalyticsModal
              stats={buildingStats}
              onClose={() => setShowAreaAnalytics(false)}
            />
          )}

          {/* SELECTED STATION SLIDE-OVER */}
          <StationDetailsPanel
            station={selectedStation}
            reading={activeReading}
            onClose={() => setSelectedStation(null)}
            onFlyTo={(lat, lng) => {
              setSelectedLocation({ lat, lng, name: selectedStation?.name });
              setResetTrigger((n) => n + 1);
            }}
          />

          {/* FLOATING BOTTOM LEGEND */}
          <div className="absolute bottom-12 right-3 z-10 pointer-events-auto hidden md:block">
            <FloodRiskLegend isMock={isMock} />
          </div>
        </div>
      </div>
    </div>
  );
};
