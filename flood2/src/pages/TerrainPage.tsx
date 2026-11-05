import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  Layers,
} from 'lucide-react';

import { Station, Reading, TerrainLayerItem, SoilLayerItem } from '@/types';
import { apiClient, isMockDataEnabled } from '@/api';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';

// 3D GIS CesiumJS Digital Twin Components & Utilities
import { FloodTerrainView, CameraActionHandle } from '@/components/gis3d/FloodTerrainView';
import { DigitalTwinToolbar, MapMode } from '@/components/gis3d/DigitalTwinToolbar';
import { CameraNavControls } from '@/components/gis3d/CameraNavControls';
import { MapRightControls } from '@/components/gis3d/MapRightControls';
import { StatusAltitudeBar, ClickedLocationInfo } from '@/components/gis3d/StatusAltitudeBar';
import { AreaAnalyticsModal } from '@/components/gis3d/AreaAnalyticsModal';
import { LayerControlPanel, LayerVisibilityState } from '@/components/gis3d/LayerControlPanel';
import { StationDetailsPanel } from '@/components/gis3d/StationDetailsPanel';
import { FloodRiskLegend } from '@/components/gis3d/FloodRiskLegend';
import { LeafletAreaSelector, SelectedAreaBounds } from '@/components/gis3d/LeafletAreaSelector';
import { LOCATION_PRESETS } from '@/utils/geospatialHelpers';

// Services
import {
  buildingFootprintService,
  BuildingFootprint,
  BuildingFootprintStats,
} from '@/services/buildingFootprintService';

export const TerrainPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMock = isMockDataEnabled();

  // Root container ref for full-screen mode
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Workflow Stage: '2d_select' (Initial 2D Leaflet Area Selection) | '3d_explore' (Cesium 3D Game Digital Twin)
  const [viewStage, setViewStage] = useState<'2d_select' | '3d_explore'>('2d_select');
  const [selectedAreaBounds, setSelectedAreaBounds] = useState<SelectedAreaBounds | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionProgress, setTransitionProgress] = useState(0);

  // Left & Right Panels visibility toggle
  const [showLeftPanel, setShowLeftPanel] = useState(true);

  // Imperative handle to Cesium camera movements
  const cameraActionRef = useRef<CameraActionHandle>(null);

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

  // Uploaded Terrain Layers & Soil Layers from backend
  const [uploadedLayers, setUploadedLayers] = useState<TerrainLayerItem[]>([]);
  const [soilLayers, setSoilLayers] = useState<SoilLayerItem[]>([]);
  const [layerOpacities, setLayerOpacities] = useState<Record<string, number>>({
    demElevation: 0.85,
    srtm30: 0.8,
    vem: 0.75,
    tim: 0.8,
  });

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

  const [clickedCoords, setClickedCoords] = useState<ClickedLocationInfo | null>(null);

  const [resetTrigger, setResetTrigger] = useState(0);

  // Complete Layer Visibility State matching requirements
  const [layers, setLayers] = useState<LayerVisibilityState>({
    terrain: true,
    satelliteImagery: true,
    demElevation: true,
    srtm30: false,
    vem: false,
    tim: false,
    slope: false,
    aspect: false,
    contour: false,
    soilType: true,
    rainfall: true,
    soilMoisture: true,
    floodExtent: true,
    stations: true,
    rivers: true,
  });

  // Load building footprints on mount
  useEffect(() => {
    buildingFootprintService.getFootprints().then((data) => {
      setBuildings(data);
      const st = buildingFootprintService.getStats(data);
      setBuildingStats(st);
    });
  }, []);

  const [mqttStatus, setMqttStatus] = useState<{
    connected: boolean;
    port: number;
    messageCount: number;
    lastTopic?: string;
  }>({
    connected: true,
    port: 1883,
    messageCount: 1,
  });

  // Fetch telemetry, stations, terrain layers, and soil layers
  const fetchData = async () => {
    try {
      setError(null);
      const [stns, rds, tLayers, sLayers] = await Promise.all([
        apiClient.getStations(),
        apiClient.getReadings({ limit: 100 }),
        apiClient.getTerrainLayers().catch(() => []),
        apiClient.getSoilLayers().catch(() => []),
      ]);

      setStations(stns);
      setReadings(rds);
      setUploadedLayers(tLayers);
      setSoilLayers(sLayers);

      if (queryStationId) {
        const found = stns.find((s) => s.id === queryStationId);
        if (found) setSelectedStation(found);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to initialize 3D digital twin telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Query MQTT broker status
    const fetchMqtt = async () => {
      try {
        const st = await apiClient.getMqttStatus();
        if (st && st.broker) {
          setMqttStatus((prev) => ({
            connected: st.clientConnected || st.broker.running,
            port: st.broker.port || 1883,
            messageCount: Math.max(prev.messageCount, st.broker.totalMessages || 1),
            lastTopic: st.broker.lastMessage?.topic,
          }));
        }
      } catch {
        // silent fallback
      }
    };
    fetchMqtt();
    const interval = setInterval(fetchMqtt, 5000);
    return () => clearInterval(interval);
  }, []);

  // Real-time WebSocket connection to backend (receives both REST & MQTT sensor events)
  useEffect(() => {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';
    let ws: WebSocket | null = null;

    try {
      ws = new WebSocket(wsUrl);
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if ((msg.type === 'SENSOR_READING_UPDATE' || msg.type === 'MQTT_SENSOR_UPDATE') && msg.reading) {
            setReadings((prev) => [msg.reading, ...prev.slice(0, 99)]);
            setMqttStatus((prev) => ({
              ...prev,
              connected: true,
              messageCount: prev.messageCount + 1,
              lastTopic: `scms/sensors/${msg.sensorId || 'all'}/readings`,
            }));
          }
        } catch (e) {
          console.warn('WS parse error:', e);
        }
      };
    } catch (e) {
      console.warn('WebSocket connection failed:', e);
    }

    return () => {
      if (ws) ws.close();
    };
  }, [selectedStation]);

  // Fullscreen toggle handler & event listeners
  const handleToggleFullscreen = () => {
    if (!pageContainerRef.current) return;
    if (!document.fullscreenElement) {
      pageContainerRef.current
        .requestFullscreen()
        .then(() => {
          setIsFullscreen(true);
          setShowLeftPanel(false); // Hide 3D layers panel in full screen mode
        })
        .catch(() => {});
    } else {
      document
        .exitFullscreen()
        .then(() => {
          setIsFullscreen(false);
        })
        .catch(() => {});
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      const isFs = Boolean(document.fullscreenElement);
      setIsFullscreen(isFs);
      if (isFs) {
        setShowLeftPanel(false); // Automatically collapse/hide layer panel in full screen
      }
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    document.addEventListener('mozfullscreenchange', handleFsChange);
    document.addEventListener('MSFullscreenChange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
      document.removeEventListener('mozfullscreenchange', handleFsChange);
      document.removeEventListener('MSFullscreenChange', handleFsChange);
    };
  }, []);

  const handleToggleLayer = (key: keyof LayerVisibilityState, val: boolean) => {
    setLayers((prev) => ({ ...prev, [key]: val }));
  };

  const handleToggleAll = (enable: boolean) => {
    setLayers({
      terrain: enable,
      satelliteImagery: enable,
      demElevation: enable,
      srtm30: enable,
      vem: enable,
      tim: enable,
      slope: enable,
      aspect: enable,
      contour: enable,
      soilType: enable,
      rainfall: enable,
      soilMoisture: enable,
      floodExtent: enable,
      stations: enable,
      rivers: enable,
    });
  };

  const handleLayerUploaded = (newLayer: TerrainLayerItem) => {
    setUploadedLayers((prev) => [newLayer, ...prev]);
    // Enable corresponding layer switch automatically
    if (newLayer.layer_type === 'DEM') setLayers((p) => ({ ...p, demElevation: true }));
    if (newLayer.layer_type === 'SRTM30') setLayers((p) => ({ ...p, srtm30: true }));
    if (newLayer.layer_type === 'VEM') setLayers((p) => ({ ...p, vem: true }));
    if (newLayer.layer_type === 'TIM') setLayers((p) => ({ ...p, tim: true }));
  };

  const handleDeleteLayer = async (id: string) => {
    await apiClient.deleteTerrainLayer(id);
    setUploadedLayers((prev) => prev.filter((l) => l.id !== id));
  };

  const handleOpacityChange = (key: string, opacity: number) => {
    setLayerOpacities((prev) => ({ ...prev, [key]: opacity }));
  };

  const handleConfirmArea = (area: SelectedAreaBounds) => {
    setSelectedAreaBounds(area);
    setSelectedLocation({
      lat: area.centerLat,
      lng: area.centerLng,
      name: area.name,
    });

    // Save selected area to backend API / database
    apiClient
      .saveSelectedArea({
        name: area.name,
        minLat: area.minLat,
        maxLat: area.maxLat,
        minLng: area.minLng,
        maxLng: area.maxLng,
        centerLat: area.centerLat,
        centerLng: area.centerLng,
        areaSqKm: area.areaSqKm,
        coordinates: area.coordinates,
      })
      .catch(() => {});

    // Trigger smooth cinematic transition sequence
    setIsTransitioning(true);
    setTransitionProgress(15);

    setTimeout(() => setTransitionProgress(45), 250);
    setTimeout(() => setTransitionProgress(80), 550);
    setTimeout(() => {
      setTransitionProgress(100);
      setViewStage('3d_explore');
      setIsTransitioning(false);
    }, 850);
  };

  const activeReading = useMemo(() => {
    if (!selectedStation) return undefined;
    return readings.find((r) => r.stationId === selectedStation.id);
  }, [selectedStation, readings]);

  const activeLayerName = useMemo(() => {
    if (layers.demElevation) return 'DEM Elevation';
    if (layers.srtm30) return 'SRTM 30m';
    if (layers.vem) return 'VEM (Vegetation)';
    if (layers.tim) return 'TIM (Inundation)';
    if (layers.soilType) return 'Soil Classification';
    if (layers.rainfall) return 'Precipitation Grid';
    return '3D World Terrain';
  }, [layers]);

  if (loading) {
    return <LoadingSpinner label="Constructing CesiumJS 3D digital twin terrain..." size="lg" />;
  }

  return (
    <div
      ref={pageContainerRef}
      className={`flex flex-col gap-2.5 transition-all w-full ${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-[#0B132B] p-2.5 h-screen w-screen overflow-hidden'
          : 'h-[calc(100vh-100px)] min-h-[640px]'
      }`}
    >
      {error && <ErrorMessage message={error} onRetry={fetchData} />}

      {/* TRANSITION OVERLAY */}
      {isTransitioning && (
        <div className="fixed inset-0 z-[2000] bg-[#070D1F]/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="relative w-20 h-20 mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20 animate-ping" />
            <div className="absolute inset-2 rounded-full border-4 border-cyan-400 border-t-transparent animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center text-cyan-300 font-bold text-xs">
              {transitionProgress}%
            </div>
          </div>

          <h2 className="text-xl font-bold text-white tracking-wide">
            Entering 3D GIS Digital Twin
          </h2>
          <p className="text-xs text-cyan-300/80 mt-1.5 max-w-md">
            Calibrating real 3D terrain elevation, satellite imagery, building models, and river channels for{' '}
            <span className="text-white font-semibold">{selectedAreaBounds?.name}</span>...
          </p>

          <div className="w-64 h-1.5 bg-slate-800 rounded-full mt-6 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300 rounded-full"
              style={{ width: `${transitionProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* VIEW STAGE 1: INITIAL 2D LEAFLET AREA SELECTION */}
      {viewStage === '2d_select' ? (
        <LeafletAreaSelector
          stations={stations}
          onConfirmArea={handleConfirmArea}
          initialBounds={selectedAreaBounds}
        />
      ) : (
        /* VIEW STAGE 2: REALISTIC 3D CESIUM OPEN-WORLD GAME DIGITAL TWIN */
        <>
          {/* TOP TOOLBAR: Modes, Toggles, Reset & AI Assistant */}
          <div className="flex-shrink-0 z-20">
            <DigitalTwinToolbar
              currentMode={mapMode}
              onSelectMode={(mode) => setMapMode(mode)}
              showRivers={showRivers}
              onToggleRivers={(val) => setShowRivers(val)}
              showPaths={showPaths}
              onTogglePaths={(val) => setShowPaths(val)}
              showBuildings={showBuildings}
              onToggleBuildings={(val) => setShowBuildings(val)}
              buildingCount={buildings.length}
              showAreaInGIS={showAreaInGIS}
              onToggleAreaInGIS={(val) => setShowAreaInGIS(val)}
              showAreaAnalytics={showAreaAnalytics}
              onToggleAreaAnalytics={(val) => setShowAreaAnalytics(val)}
              showFlashFlood={layers.floodExtent}
              onToggleFlashFlood={(val) => setLayers((prev) => ({ ...prev, floodExtent: val }))}
              showSensors={layers.stations}
              onToggleSensors={(val) => setLayers((prev) => ({ ...prev, stations: val }))}
              showEvacuation={true}
              onToggleEvacuation={() => {}}
              onOpenAIChat={() => navigate('/assistant')}
              onResetView={() => cameraActionRef.current?.resetHome()}
              onToggleGameMode={() => cameraActionRef.current?.flyDroneMode()}
              onReturnTo2DMap={() => setViewStage('2d_select')}
              isFullscreen={isFullscreen}
              onToggleFullscreen={handleToggleFullscreen}
              showLayersPanel={!isFullscreen && showLeftPanel}
              onToggleLayersPanel={() => setShowLeftPanel(!showLeftPanel)}
            />
          </div>

          {/* MAIN 3D WORKSPACE WITH LEFT, MAIN, RIGHT & BOTTOM PANELS */}
          <div className="flex-1 flex gap-3 min-h-0 relative overflow-hidden">
            {/* LEFT PANEL: GIS LAYERS, DEM, SRTM30, VEM, TIM, SOIL TYPE, UPLOADS (HIDDEN IN FULL SCREEN MODE) */}
            {!isFullscreen && showLeftPanel && (
              <div className="transition-all duration-300 flex-shrink-0 z-30 w-72 sm:w-80">
                <LayerControlPanel
                  layers={layers}
                  onToggleLayer={handleToggleLayer}
                  onToggleAll={handleToggleAll}
                  uploadedLayers={uploadedLayers}
                  onLayerUploaded={handleLayerUploaded}
                  onDeleteLayer={handleDeleteLayer}
                  layerOpacities={layerOpacities}
                  onOpacityChange={handleOpacityChange}
                  soilLayers={soilLayers}
                  onClose={() => setShowLeftPanel(false)}
                />
              </div>
            )}

            {/* Expand button for left panel - only visible when panel is collapsed AND not in fullscreen mode */}
            {!isFullscreen && !showLeftPanel && (
              <button
                onClick={() => setShowLeftPanel(true)}
                title="Open 3D GIS Layers Panel"
                className="absolute top-3 left-3 z-30 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-cyan-400 border border-cyan-500/30 shadow-xl backdrop-blur-md transition-all text-xs font-semibold hover:border-cyan-400/60"
              >
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>GIS Layers</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}

            {/* MAIN PANEL: FULL-SCREEN CESIUMJS 3D MAP */}
            <div className="flex-1 h-full relative rounded-3xl overflow-hidden border border-cyan-500/20 shadow-2xl bg-slate-950">
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
                terrainExaggeration={1.6}
                onCoordinatesChange={(coords) => setCursorCoords(coords)}
                onCameraStateChange={(state) => setCameraState(state)}
                onResetTrigger={resetTrigger}
                uploadedLayers={uploadedLayers}
                layerOpacities={layerOpacities}
                soilLayers={soilLayers}
                selectedAreaBounds={selectedAreaBounds}
                onReturnTo2D={() => setViewStage('2d_select')}
                mqttStatus={mqttStatus}
                onMapClick={(info) => {
                  setClickedCoords(info);
                }}
              />

              {/* LOWER-LEFT: CAMERA NAVIGATION D-PAD (HUD) */}
              <div className="absolute bottom-16 left-3 z-20 pointer-events-auto">
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

              {/* AREA ANALYTICS DRAWER */}
              {showAreaAnalytics && (
                <AreaAnalyticsModal
                  stats={buildingStats}
                  onClose={() => setShowAreaAnalytics(false)}
                />
              )}

              {/* RIGHT PANEL: SELECTED SENSOR INFORMATION */}
              {selectedStation && (
                <StationDetailsPanel
                  station={selectedStation}
                  reading={activeReading}
                  onClose={() => setSelectedStation(null)}
                  onFlyTo={(lat, lng) => {
                    setSelectedLocation({ lat, lng, name: selectedStation.name });
                    setResetTrigger((n) => n + 1);
                  }}
                />
              )}

              {/* FLOATING RISK LEGEND */}
              <div className="absolute bottom-16 right-3 z-10 pointer-events-auto hidden md:block">
                <FloodRiskLegend isMock={isMock} />
              </div>

              {/* BOTTOM PANEL: ELEVATION, ACTIVE LAYER, COORDINATES, SENSOR STATUS */}
              <div className="absolute bottom-2 inset-x-2 z-20 pointer-events-auto">
                <StatusAltitudeBar
                  cameraAltitudeMeters={cameraState.altitude}
                  pitchDegrees={cameraState.pitch}
                  headingDegrees={cameraState.heading}
                  cursorCoordinates={cursorCoords}
                  clickedCoordinates={clickedCoords}
                  activeLayerName={activeLayerName}
                  activeSensorCount={stations.filter((s) => s.status === 'online').length || stations.length}
                  totalSensorCount={stations.length}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
