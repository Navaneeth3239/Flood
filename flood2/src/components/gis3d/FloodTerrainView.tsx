import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import * as Cesium from 'cesium';
import { Station, Reading, TerrainLayerItem, SoilLayerItem } from '@/types';
import { LayerVisibilityState } from './LayerControlPanel';
import { MapMode } from './DigitalTwinToolbar';
import { BuildingFootprint } from '@/services/buildingFootprintService';
import { SelectedAreaBounds } from './LeafletAreaSelector';
import {
  createStationPinDataUri,
  flyCameraToLocation,
} from '@/utils/geospatialHelpers';
import {
  OBSERVED_FLOOD_EXTENT_GEOJSON,
  EMERGENCY_INFRASTRUCTURE,
} from '@/services/floodLayerService';
import {
  MOUNTAIN_WATERWAYS_GEOJSON,
  MOUNTAIN_ROADS_GEOJSON,
  MARKED_STUDY_AREA_GEOJSON,
} from '@/services/mountainGISService';

export interface CameraActionHandle {
  moveForward: () => void;
  moveBackward: () => void;
  moveLeft: () => void;
  moveRight: () => void;
  turnLeft: () => void;
  turnRight: () => void;
  tiltUp: () => void;
  tiltDown: () => void;
  elevateUp: () => void;
  elevateDown: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetNorth: () => void;
  resetPitch: () => void;
  resetHome: () => void;
  flyDroneMode: () => void;
  groundWalkMode: () => void;
  toggleCanyonOrbit: () => void;
  toggleGameControls: () => void;
}

interface SelectedLocation {
  lat: number;
  lng: number;
  name?: string;
  stationId?: string;
  zoomLevel?: number;
}

interface FloodTerrainViewProps {
  selectedLocation: SelectedLocation;
  stations: Station[];
  readings: Reading[];
  selectedStation: Station | null;
  onSelectStation: (station: Station | null) => void;
  // Buildings
  buildings: BuildingFootprint[];
  selectedBuilding: BuildingFootprint | null;
  onSelectBuilding: (building: BuildingFootprint | null) => void;
  showBuildings: boolean;
  // Layers & Map Modes
  mapMode: MapMode;
  showRivers: boolean;
  showPaths: boolean;
  showAreaInGIS: boolean;
  layers: LayerVisibilityState;
  terrainExaggeration: number;
  onCoordinatesChange: (coords: { lat: number; lng: number; elevation: number | null } | null) => void;
  onCameraStateChange: (state: { altitude: number; pitch: number; heading: number }) => void;
  onResetTrigger?: number;
  // Uploaded Terrain Layers & Opacities
  uploadedLayers?: TerrainLayerItem[];
  layerOpacities?: Record<string, number>;
  soilLayers?: SoilLayerItem[];
  selectedAreaBounds?: SelectedAreaBounds | null;
  onReturnTo2D?: () => void;
  mqttStatus?: {
    connected: boolean;
    port: number;
    messageCount: number;
    lastTopic?: string;
  };
  onMapClick?: (info: {
    lat: number;
    lng: number;
    elevation: number | null;
    layerName: string;
    soilType?: string;
  }) => void;
}

export const FloodTerrainView = forwardRef<CameraActionHandle, FloodTerrainViewProps>(
  (
    {
      selectedLocation,
      stations,
      readings,
      selectedStation,
      onSelectStation,
      buildings,
      selectedBuilding,
      onSelectBuilding,
      showBuildings,
      mapMode,
      showRivers,
      showPaths,
      showAreaInGIS,
      layers,
      terrainExaggeration,
      onCoordinatesChange,
      onCameraStateChange,
      onResetTrigger = 0,
      uploadedLayers = [],
      layerOpacities = {},
      soilLayers = [],
      selectedAreaBounds,
      onReturnTo2D,
      mqttStatus,
      onMapClick,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const viewerRef = useRef<Cesium.Viewer | null>(null);

    // Custom DataSources for efficient batching of thousands of entities
    const buildingsDataSourceRef = useRef<Cesium.CustomDataSource | null>(null);
    const mountainGisDataSourceRef = useRef<Cesium.CustomDataSource | null>(null);
    const vectorDataSourceRef = useRef<Cesium.CustomDataSource | null>(null);
    const soilDataSourceRef = useRef<Cesium.CustomDataSource | null>(null);

    // Map to hold dynamic uploaded raster imagery layers
    const rasterLayersMapRef = useRef<Map<string, Cesium.ImageryLayer>>(new Map());

    const [viewerReady, setViewerReady] = useState(false);
    const [canyonOrbitActive, setCanyonOrbitActive] = useState(false);
    const canyonOrbitRef = useRef(false);
    const [gameControlsActive, setGameControlsActive] = useState(true);

    // Expose camera movement actions to parent component
    useImperativeHandle(ref, () => ({
      moveForward: () => {
        const v = viewerRef.current;
        if (!v || v.isDestroyed()) return;
        const alt = v.camera.positionCartographic.height;
        v.camera.moveForward(Math.max(150, alt * 0.25));
      },
      moveBackward: () => {
        const v = viewerRef.current;
        if (!v || v.isDestroyed()) return;
        const alt = v.camera.positionCartographic.height;
        v.camera.moveBackward(Math.max(150, alt * 0.25));
      },
      moveLeft: () => {
        const v = viewerRef.current;
        if (!v || v.isDestroyed()) return;
        const alt = v.camera.positionCartographic.height;
        v.camera.moveLeft(Math.max(150, alt * 0.25));
      },
      moveRight: () => {
        const v = viewerRef.current;
        if (!v || v.isDestroyed()) return;
        const alt = v.camera.positionCartographic.height;
        v.camera.moveRight(Math.max(150, alt * 0.25));
      },
      turnLeft: () => {
        const v = viewerRef.current;
        if (!v || v.isDestroyed()) return;
        v.camera.lookLeft(Cesium.Math.toRadians(15));
      },
      turnRight: () => {
        const v = viewerRef.current;
        if (!v || v.isDestroyed()) return;
        v.camera.lookRight(Cesium.Math.toRadians(15));
      },
      tiltUp: () => {
        const v = viewerRef.current;
        if (!v || v.isDestroyed()) return;
        v.camera.lookUp(Cesium.Math.toRadians(8));
      },
      tiltDown: () => {
        const v = viewerRef.current;
        if (!v || v.isDestroyed()) return;
        v.camera.lookDown(Cesium.Math.toRadians(8));
      },
      elevateUp: () => {
        const v = viewerRef.current;
        if (!v || v.isDestroyed()) return;
        const alt = v.camera.positionCartographic.height;
        v.camera.moveUp(Math.max(120, alt * 0.2));
      },
      elevateDown: () => {
        const v = viewerRef.current;
        if (!v || v.isDestroyed()) return;
        const alt = v.camera.positionCartographic.height;
        v.camera.moveDown(Math.max(120, alt * 0.2));
      },
      zoomIn: () => {
        const v = viewerRef.current;
        if (!v || v.isDestroyed()) return;
        const alt = v.camera.positionCartographic.height;
        v.camera.zoomIn(Math.max(150, alt * 0.25));
      },
      zoomOut: () => {
        const v = viewerRef.current;
        if (!v || v.isDestroyed()) return;
        const alt = v.camera.positionCartographic.height;
        v.camera.zoomOut(Math.max(150, alt * 0.25));
      },
      resetNorth: () => {
        const v = viewerRef.current;
        if (!v || v.isDestroyed()) return;
        const carto = v.camera.positionCartographic;
        v.camera.flyTo({
          destination: Cesium.Cartesian3.fromRadians(carto.longitude, carto.latitude, carto.height),
          orientation: {
            heading: 0,
            pitch: v.camera.pitch,
            roll: 0,
          },
          duration: 0.8,
        });
      },
      resetPitch: () => {
        const v = viewerRef.current;
        if (!v || v.isDestroyed()) return;
        const carto = v.camera.positionCartographic;
        v.camera.flyTo({
          destination: Cesium.Cartesian3.fromRadians(carto.longitude, carto.latitude, carto.height),
          orientation: {
            heading: v.camera.heading,
            pitch: Cesium.Math.toRadians(-34),
            roll: 0,
          },
          duration: 0.8,
        });
      },
      resetHome: () => {
        const v = viewerRef.current;
        if (!v || v.isDestroyed()) return;
        flyCameraToLocation(v, selectedLocation.lat, selectedLocation.lng, 2850, -34, 38, 1.2);
      },
      flyDroneMode: () => {
        const v = viewerRef.current;
        if (!v || v.isDestroyed()) return;
        v.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(selectedLocation.lng, selectedLocation.lat - 0.008, 420),
          orientation: {
            heading: Cesium.Math.toRadians(12),
            pitch: Cesium.Math.toRadians(-24),
            roll: 0,
          },
          duration: 1.5,
        });
      },
      groundWalkMode: () => {
        const v = viewerRef.current;
        if (!v || v.isDestroyed()) return;
        v.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(selectedLocation.lng, selectedLocation.lat - 0.002, 35),
          orientation: {
            heading: Cesium.Math.toRadians(0),
            pitch: Cesium.Math.toRadians(-5),
            roll: 0,
          },
          duration: 1.5,
        });
      },
      toggleCanyonOrbit: () => {
        canyonOrbitRef.current = !canyonOrbitRef.current;
        setCanyonOrbitActive(canyonOrbitRef.current);
      },
      toggleGameControls: () => {
        setGameControlsActive((prev) => !prev);
      },
    }));

    // Initialize Cesium Viewer once
    useEffect(() => {
      if (!containerRef.current) return;

      // Configure Cesium Ion Access Token if provided in environment
      const ionToken =
        import.meta.env.VITE_CESIUM_ION_ACCESS_TOKEN ||
        import.meta.env.CESIUM_ION_TOKEN;

      if (ionToken && ionToken.trim().length > 0) {
        Cesium.Ion.defaultAccessToken = ionToken.trim();
      }

      // Base Imagery: Real-world high-resolution satellite imagery (ESRI World Imagery)
      const satelliteImagery = new Cesium.UrlTemplateImageryProvider({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        credit: 'Esri, Maxar, Earthstar Geographics, USDA, USGS',
        maximumLevel: 19,
      });

      let viewer: Cesium.Viewer;

      try {
        viewer = new Cesium.Viewer(containerRef.current, {
          animation: false,
          timeline: false,
          geocoder: false,
          homeButton: false,
          sceneModePicker: false,
          baseLayerPicker: false,
          navigationHelpButton: false,
          fullscreenButton: false,
          vrButton: false,
          infoBox: false,
          selectionIndicator: false,
          baseLayer: new Cesium.ImageryLayer(satelliteImagery),
          scene3DOnly: true,
        });

        // Optimize visual quality and realistic game graphics
        viewer.scene.globe.enableLighting = true; // Dynamic Sun direction & mountain shadows
        viewer.shadows = true;
        viewer.scene.highDynamicRange = true;
        viewer.scene.fog.enabled = true;
        viewer.scene.fog.density = 0.00015;
        if (viewer.scene.skyAtmosphere) viewer.scene.skyAtmosphere.show = true;
        viewer.scene.globe.depthTestAgainstTerrain = true;
        viewer.scene.screenSpaceCameraController.minimumZoomDistance = 5;
        viewer.scene.screenSpaceCameraController.maximumZoomDistance = 2500000;
        viewer.scene.verticalExaggeration = Math.max(1.5, terrainExaggeration);

        // Custom DataSources for high performance batched rendering
        const buildingsDS = new Cesium.CustomDataSource('buildingsDS');
        const mountainGisDS = new Cesium.CustomDataSource('mountainGisDS');
        const vectorDS = new Cesium.CustomDataSource('vectorDS');
        const soilDS = new Cesium.CustomDataSource('soilDS');

        viewer.dataSources.add(buildingsDS);
        viewer.dataSources.add(mountainGisDS);
        viewer.dataSources.add(vectorDS);
        viewer.dataSources.add(soilDS);

        buildingsDataSourceRef.current = buildingsDS;
        mountainGisDataSourceRef.current = mountainGisDS;
        vectorDataSourceRef.current = vectorDS;
        soilDataSourceRef.current = soilDS;

        // Load Real High-Resolution 3D Terrain everywhere on Earth
        Cesium.ArcGISTiledElevationTerrainProvider.fromUrl(
          'https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer'
        )
          .then((agTerrain) => {
            if (!viewer.isDestroyed()) {
              viewer.terrainProvider = agTerrain;
            }
          })
          .catch(() => {
            if (ionToken) {
              Cesium.createWorldTerrainAsync()
                .then((tp) => {
                  if (!viewer.isDestroyed()) viewer.terrainProvider = tp;
                })
                .catch(() => {
                  if (!viewer.isDestroyed()) viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider();
                });
            } else {
              if (!viewer.isDestroyed()) viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider();
            }
          });

        // Load Global Cesium OSM 3D Buildings
        Cesium.createOsmBuildingsAsync()
          .then((osmBlds) => {
            if (!viewer.isDestroyed()) {
              viewer.scene.primitives.add(osmBlds);
            }
          })
          .catch(() => {});

        viewerRef.current = viewer;

        // Camera changed event listener for altitude, pitch, heading status
        const removeCameraListener = viewer.camera.changed.addEventListener(() => {
          if (!viewer || viewer.isDestroyed()) return;
          const carto = viewer.camera.positionCartographic;
          const altitude = carto.height;
          const pitch = Cesium.Math.toDegrees(viewer.camera.pitch);
          const heading = Cesium.Math.toDegrees(viewer.camera.heading);
          onCameraStateChange({ altitude, pitch, heading });
        });

        // Mouse Move Event: Track ground coordinates and elevation under cursor
        const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

        handler.setInputAction((movement: any) => {
          if (!viewer || viewer.isDestroyed()) return;
          const ray = viewer.camera.getPickRay(movement.endPosition);
          if (!ray) return;
          const position = viewer.scene.globe.pick(ray, viewer.scene);
          if (position) {
            const cartographic = Cesium.Cartographic.fromCartesian(position);
            const lat = Cesium.Math.toDegrees(cartographic.latitude);
            const lng = Cesium.Math.toDegrees(cartographic.longitude);
            const elevation = cartographic.height;
            onCoordinatesChange({ lat, lng, elevation });
          } else {
            onCoordinatesChange(null);
          }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        // Left Click Event: Pick Station, Building, or Ground Location
        handler.setInputAction((click: any) => {
          if (!viewer || viewer.isDestroyed()) return;

          // 1. Check if user clicked an entity (Station pin, Building footprint, Soil zone)
          const pickedObject = viewer.scene.pick(click.position);
          if (Cesium.defined(pickedObject) && pickedObject.id) {
            const entity = pickedObject.id as Cesium.Entity;

            // Picked station
            if (entity.properties && entity.properties.hasProperty('stationData')) {
              const stn = entity.properties.stationData.getValue();
              onSelectStation(stn);
            }

            // Picked building footprint
            if (entity.properties && entity.properties.hasProperty('buildingData')) {
              const bld = entity.properties.buildingData.getValue();
              onSelectBuilding(bld);
            }
          }

          // 2. Extract precise ground coordinates & elevation on click
          const ray = viewer.camera.getPickRay(click.position);
          if (ray) {
            const position = viewer.scene.globe.pick(ray, viewer.scene);
            if (position) {
              const carto = Cesium.Cartographic.fromCartesian(position);
              const lat = Cesium.Math.toDegrees(carto.latitude);
              const lng = Cesium.Math.toDegrees(carto.longitude);
              const elevation = carto.height;

              // Check if point falls within Clay soil formation
              const inClay = lat >= 10.95 && lat <= 11.12 && lng >= 76.85 && lng <= 77.15;
              const soilType = inClay ? 'Clay (Infiltration: 1.5 mm/h, Runoff: 0.78)' : undefined;

              const activeLayerName = layers.demElevation
                ? 'DEM Elevation'
                : layers.srtm30
                ? 'SRTM 30m'
                : layers.vem
                ? 'VEM Layer'
                : layers.tim
                ? 'TIM Layer'
                : '3D World Terrain';

              onMapClick?.({
                lat,
                lng,
                elevation,
                layerName: activeLayerName,
                soilType,
              });
            }
          }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        // Frame initial view at oblique mountain perspective
        flyCameraToLocation(
          viewer,
          selectedLocation.lat,
          selectedLocation.lng,
          2850,
          -34,
          38,
          0.6
        );

        setViewerReady(true);

        return () => {
          removeCameraListener();
          handler.destroy();
          if (!viewer.isDestroyed()) {
            viewer.destroy();
          }
          viewerRef.current = null;
          setViewerReady(false);
        };
      } catch (err) {
        console.error('Failed to initialize Cesium Viewer:', err);
      }
    }, []);

    // 1. Render 3D Extruded Building Footprints
    useEffect(() => {
      const ds = buildingsDataSourceRef.current;
      if (!ds || !viewerReady) return;

      ds.entities.removeAll();

      buildings.forEach((b) => {
        const flatCoords = b.polygon.flatMap(([lng, lat]) => [lng, lat]);
        const isSelected = selectedBuilding?.id === b.id;

        // Realistic architectural game colors
        let wallColor = '#E28D5C'; // Residential Terracotta
        let outlineCol = '#C2410C';

        if (b.occupancyType === 'Commercial') {
          wallColor = '#38BDF8'; // Cyan glass facade
          outlineCol = '#0284C7';
        } else if (b.occupancyType === 'Public Infrastructure') {
          wallColor = '#10B981'; // Emerald safety
          outlineCol = '#059669';
        } else if (b.occupancyType === 'Storage/Auxiliary') {
          wallColor = '#94A3B8'; // Gunmetal steel
          outlineCol = '#475569';
        }

        if (b.floodRiskTier === 'danger' || b.floodRiskTier === 'warning') {
          wallColor = '#EF4444'; // Flood hazard
          outlineCol = '#DC2626';
        }

        if (isSelected) {
          wallColor = '#00F0FF';
          outlineCol = '#FFFFFF';
        }

        ds.entities.add({
          id: `bld-${b.id}`,
          name: b.name,
          polygon: {
            hierarchy: Cesium.Cartesian3.fromDegreesArray(flatCoords),
            height: 0,
            extrudedHeight: b.heightMeters,
            material: Cesium.Color.fromCssColorString(wallColor).withAlpha(0.92),
            outline: true,
            outlineColor: Cesium.Color.fromCssColorString(outlineCol),
            outlineWidth: 2,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            extrudedHeightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
          },
          properties: new Cesium.PropertyBag({
            buildingData: b,
          }),
          show: showBuildings,
        });
      });
    }, [buildings, selectedBuilding, showBuildings, viewerReady]);

    // 2. Render Mountain GIS Data (Cyan Rivers, Roads, Marked Area)
    useEffect(() => {
      const ds = mountainGisDataSourceRef.current;
      if (!ds || !viewerReady) return;

      ds.entities.removeAll();

      // Marked Study Area Boundary Polygon
      if (selectedAreaBounds) {
        ds.entities.add({
          id: 'selected-study-area-boundary',
          name: selectedAreaBounds.name,
          polygon: {
            hierarchy: Cesium.Cartesian3.fromDegreesArray([
              selectedAreaBounds.minLng,
              selectedAreaBounds.minLat,
              selectedAreaBounds.minLng,
              selectedAreaBounds.maxLat,
              selectedAreaBounds.maxLng,
              selectedAreaBounds.maxLat,
              selectedAreaBounds.maxLng,
              selectedAreaBounds.minLat,
            ]),
            material: Cesium.Color.fromCssColorString('#00F0FF').withAlpha(0.14),
            outline: true,
            outlineColor: Cesium.Color.fromCssColorString('#00F0FF'),
            outlineWidth: 3.5,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          },
          show: true,
        });
      }

      MARKED_STUDY_AREA_GEOJSON.features.forEach((feat: any) => {
        const ring = feat.geometry.coordinates[0];
        const degreesArray = ring.flatMap(([lng, lat]: [number, number]) => [lng, lat]);

        ds.entities.add({
          id: 'marked-area-boundary',
          name: feat.properties.name,
          polygon: {
            hierarchy: Cesium.Cartesian3.fromDegreesArray(degreesArray),
            material: Cesium.Color.fromCssColorString('#06B6D4').withAlpha(0.12),
            outline: true,
            outlineColor: Cesium.Color.fromCssColorString('#00F0FF'),
            outlineWidth: 3,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          },
          show: showAreaInGIS,
        });
      });

      // Cyan River & Waterway Overlays
      MOUNTAIN_WATERWAYS_GEOJSON.features.forEach((feat: any, idx) => {
        const coords = feat.geometry.coordinates;
        const positions = coords.flatMap(([lng, lat]: [number, number]) => [lng, lat, 0]);

        ds.entities.add({
          id: `mountain-waterway-${idx}`,
          name: feat.properties.name,
          polyline: {
            positions: Cesium.Cartesian3.fromDegreesArrayHeights(positions),
            width: feat.properties.width || 4,
            material: Cesium.Color.fromCssColorString(feat.properties.color || '#00F0FF'),
            clampToGround: true,
          },
          show: showRivers,
        });
      });

      // Roads & Mountain Paths
      MOUNTAIN_ROADS_GEOJSON.features.forEach((feat: any, idx) => {
        const coords = feat.geometry.coordinates;
        const positions = coords.flatMap(([lng, lat]: [number, number]) => [lng, lat, 0]);

        ds.entities.add({
          id: `mountain-path-${idx}`,
          name: feat.properties.name,
          polyline: {
            positions: Cesium.Cartesian3.fromDegreesArrayHeights(positions),
            width: feat.properties.strokeWidth || 2,
            material: Cesium.Color.fromCssColorString(feat.properties.strokeColor || '#CBD5E1'),
            clampToGround: true,
          },
          show: showPaths,
        });
      });
    }, [showRivers, showPaths, showAreaInGIS, viewerReady]);

    // 3. Render Soil Classification Layer (Clay prioritized in Amber #D97706)
    useEffect(() => {
      const ds = soilDataSourceRef.current;
      if (!ds || !viewerReady) return;

      ds.entities.removeAll();

      // Clay Soil Formation Area
      const clayZoneCoords = [
        76.880, 10.960,
        77.080, 10.960,
        77.120, 11.080,
        76.920, 11.090,
        76.880, 10.960,
      ];

      ds.entities.add({
        id: 'soil-layer-clay-zone',
        name: 'Coimbatore Valley Heavy Clay Formation',
        polygon: {
          hierarchy: Cesium.Cartesian3.fromDegreesArray(clayZoneCoords),
          material: Cesium.Color.fromCssColorString('#D97706').withAlpha(0.38),
          outline: true,
          outlineColor: Cesium.Color.fromCssColorString('#B45309'),
          outlineWidth: 2.5,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        },
        description: 'Clay Soil formation: Low infiltration (1.5 mm/h), high runoff coefficient (0.78).',
        show: layers.soilType,
      });
    }, [layers.soilType, soilLayers, viewerReady]);

    // 4. Render IoT Stations with 4 Risk Levels (GREEN, YELLOW, ORANGE, RED)
    useEffect(() => {
      const ds = vectorDataSourceRef.current;
      if (!ds || !viewerReady) return;

      ds.entities.removeAll();

      const latestReadingsMap = new Map<string, Reading>();
      readings.forEach((r) => {
        if (!latestReadingsMap.has(r.stationId)) {
          latestReadingsMap.set(r.stationId, r);
        }
      });

      // IoT Gauging Stations
      stations.forEach((stn) => {
        const reading = latestReadingsMap.get(stn.id);
        const wl = reading?.waterLevel ?? 0;
        const rf = reading?.rainfall ?? 0;
        const sm = reading?.soilMoisture ?? 0;
        const isClay = ((stn as any).soil_type || 'Clay').toLowerCase() === 'clay';

        let severity: 'normal' | 'watch' | 'warning' | 'danger' | 'unknown' = 'normal';
        let riskColorHex = '#10B981';

        if (stn.status === 'offline') {
          severity = 'unknown';
          riskColorHex = '#6B7280';
        } else if (
          wl >= stn.thresholds.dangerMax ||
          (wl >= stn.thresholds.warningMax && rf >= 50 && sm >= 80)
        ) {
          severity = 'danger';
          riskColorHex = '#EF4444'; // RED
        } else if (
          wl >= stn.thresholds.warningMax ||
          (wl >= stn.thresholds.watchMax && rf >= 35 && sm >= 70) ||
          (isClay && sm >= 85 && rf >= 30)
        ) {
          severity = 'warning';
          riskColorHex = '#F97316'; // ORANGE
        } else if (
          wl >= stn.thresholds.watchMax ||
          (wl >= stn.thresholds.normalMax && (rf >= 20 || sm >= 60)) ||
          rf >= 30
        ) {
          severity = 'watch';
          riskColorHex = '#EAB308'; // YELLOW
        }

        const isSelected = selectedStation?.id === stn.id;
        const pinUri = createStationPinDataUri(severity, isSelected);

        ds.entities.add({
          id: `station-${stn.id}`,
          name: stn.name,
          position: Cesium.Cartesian3.fromDegrees(stn.longitude, stn.latitude, 0),
          billboard: {
            image: pinUri,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            scale: isSelected ? 1.2 : 0.95,
            disableDepthTestDistance: 500000,
          },
          label: {
            text: stn.name.split('-')[0].trim(),
            font: 'bold 12px sans-serif',
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.fromCssColorString('#0F172A'),
            outlineWidth: 3,
            verticalOrigin: Cesium.VerticalOrigin.TOP,
            pixelOffset: new Cesium.Cartesian2(0, 4),
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            disableDepthTestDistance: 500000,
            scale: 0.9,
          },
          properties: new Cesium.PropertyBag({
            stationData: stn,
            severity,
            riskColorHex,
          }),
          show: layers.stations,
        });
      });

      // Observed Flood Extent
      OBSERVED_FLOOD_EXTENT_GEOJSON.features.forEach((feat: any, idx) => {
        const ring = feat.geometry.coordinates[0];
        const degreesArray = ring.flatMap(([lng, lat]: [number, number]) => [lng, lat]);

        ds.entities.add({
          id: `sar-${idx}`,
          name: feat.properties.name,
          polygon: {
            hierarchy: Cesium.Cartesian3.fromDegreesArray(degreesArray),
            material: Cesium.Color.fromCssColorString('#0284C7').withAlpha(0.48),
            outline: true,
            outlineColor: Cesium.Color.fromCssColorString('#0369A1'),
            outlineWidth: 2,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          },
          show: layers.floodExtent,
        });
      });

      // Emergency Shelters
      EMERGENCY_INFRASTRUCTURE.forEach((sh, idx) => {
        ds.entities.add({
          id: `shelter-${idx}`,
          name: sh.name,
          position: Cesium.Cartesian3.fromDegrees(sh.longitude, sh.latitude, 0),
          point: {
            pixelSize: 10,
            color: Cesium.Color.fromCssColorString('#10B981'),
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 2,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            disableDepthTestDistance: 500000,
          },
          label: {
            text: `🏥 ${sh.name}`,
            font: '10px sans-serif',
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.fromCssColorString('#064E3B'),
            outlineWidth: 2,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -8),
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            disableDepthTestDistance: 500000,
            scale: 0.85,
          },
          show: true,
        });
      });
    }, [stations, readings, selectedStation, layers, viewerReady]);

    // 5. Dynamic Uploaded Elevation Rasters (DEM, SRTM 30, VEM, TIM)
    useEffect(() => {
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed() || !viewerReady) return;

      const layerMap = rasterLayersMapRef.current;

      uploadedLayers.forEach((layer) => {
        const shouldShow =
          layer.active &&
          ((layer.layer_type === 'DEM' && layers.demElevation) ||
            (layer.layer_type === 'SRTM30' && layers.srtm30) ||
            (layer.layer_type === 'VEM' && layers.vem) ||
            (layer.layer_type === 'TIM' && layers.tim));

        const targetOpacity = layerOpacities[layer.id] ?? layer.opacity ?? 0.8;

        if (shouldShow && layer.metadata?.overlayUrl) {
          if (!layerMap.has(layer.id)) {
            const overlayUrl = layer.metadata.overlayUrl.startsWith('http')
              ? layer.metadata.overlayUrl
              : `http://localhost:8000${layer.metadata.overlayUrl}`;

            const provider = new Cesium.SingleTileImageryProvider({
              url: overlayUrl,
              rectangle: Cesium.Rectangle.fromDegrees(
                layer.west,
                layer.south,
                layer.east,
                layer.north
              ),
            });

            const imageryLayer = viewer.imageryLayers.addImageryProvider(provider);
            imageryLayer.alpha = targetOpacity;
            layerMap.set(layer.id, imageryLayer);
          } else {
            const existingLayer = layerMap.get(layer.id);
            if (existingLayer) {
              existingLayer.show = true;
              existingLayer.alpha = targetOpacity;
            }
          }
        } else {
          if (layerMap.has(layer.id)) {
            const existingLayer = layerMap.get(layer.id);
            if (existingLayer) {
              existingLayer.show = false;
            }
          }
        }
      });
    }, [uploadedLayers, layers, layerOpacities, viewerReady]);

    // 6. Camera Resets and Elevation Exaggeration
    useEffect(() => {
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed() || !viewerReady) return;

      if (mapMode === 'flatView') {
        const carto = viewer.camera.positionCartographic;
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromRadians(carto.longitude, carto.latitude, Math.max(3500, carto.height)),
          orientation: {
            heading: 0,
            pitch: Cesium.Math.toRadians(-89.9),
            roll: 0,
          },
          duration: 1.0,
        });
      }
    }, [mapMode, viewerReady]);

    useEffect(() => {
      if (onResetTrigger === 0) return;
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed()) return;

      flyCameraToLocation(
        viewer,
        selectedLocation.lat,
        selectedLocation.lng,
        2850,
        -34,
        38,
        1.2
      );
    }, [onResetTrigger]);

    useEffect(() => {
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed()) return;
      viewer.scene.verticalExaggeration = terrainExaggeration;
    }, [terrainExaggeration]);

    // Cinematic camera flight directly into selected geographical bounds
    useEffect(() => {
      const v = viewerRef.current;
      if (!v || v.isDestroyed() || !viewerReady || !selectedAreaBounds) return;

      const alt = Math.max(1200, Math.min(8000, Math.sqrt(selectedAreaBounds.areaSqKm) * 260));

      v.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
          selectedAreaBounds.centerLng,
          selectedAreaBounds.centerLat - (alt / 111000) * 0.45,
          alt
        ),
        orientation: {
          heading: Cesium.Math.toRadians(24),
          pitch: Cesium.Math.toRadians(-32),
          roll: 0,
        },
        duration: 2.2,
      });
    }, [selectedAreaBounds, viewerReady]);

    // 7. Full Game Keyboard Movement (WASD + Space + C + Shift)
    useEffect(() => {
      const activeKeys = new Set<string>();
      let animId: number;

      const onKeyDown = (e: KeyboardEvent) => {
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;
        if (
          [
            'KeyW',
            'KeyS',
            'KeyA',
            'KeyD',
            'Space',
            'KeyC',
            'KeyE',
            'KeyQ',
            'ShiftLeft',
            'ShiftRight',
            'ArrowUp',
            'ArrowDown',
            'ArrowLeft',
            'ArrowRight',
          ].includes(e.code)
        ) {
          activeKeys.add(e.code);
        }
      };

      const onKeyUp = (e: KeyboardEvent) => {
        activeKeys.delete(e.code);
      };

      window.addEventListener('keydown', onKeyDown);
      window.addEventListener('keyup', onKeyUp);

      const gameLoop = () => {
        const v = viewerRef.current;
        if (v && !v.isDestroyed() && activeKeys.size > 0 && gameControlsActive) {
          const isBoost = activeKeys.has('ShiftLeft') || activeKeys.has('ShiftRight');
          const alt = Math.max(15, v.camera.positionCartographic.height);
          const baseStep = Math.max(6, alt * 0.035);
          const step = isBoost ? baseStep * 2.8 : baseStep;

          if (activeKeys.has('KeyW') || activeKeys.has('ArrowUp')) v.camera.moveForward(step);
          if (activeKeys.has('KeyS') || activeKeys.has('ArrowDown')) v.camera.moveBackward(step);
          if (activeKeys.has('KeyA')) v.camera.moveLeft(step);
          if (activeKeys.has('KeyD')) v.camera.moveRight(step);
          if (activeKeys.has('Space') || activeKeys.has('KeyE')) v.camera.moveUp(step * 0.7);
          if (activeKeys.has('KeyC') || activeKeys.has('KeyQ')) v.camera.moveDown(step * 0.7);
          if (activeKeys.has('ArrowLeft')) v.camera.lookLeft(Cesium.Math.toRadians(1.5));
          if (activeKeys.has('ArrowRight')) v.camera.lookRight(Cesium.Math.toRadians(1.5));
        }

        if (canyonOrbitRef.current && viewerRef.current && !viewerRef.current.isDestroyed()) {
          viewerRef.current.camera.rotate(Cesium.Cartesian3.UNIT_Z, 0.002);
        }

        animId = requestAnimationFrame(gameLoop);
      };

      animId = requestAnimationFrame(gameLoop);

      return () => {
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
        cancelAnimationFrame(animId);
      };
    }, [gameControlsActive]);

    return (
      <div className="w-full h-full relative overflow-hidden">
        <div ref={containerRef} className="w-full h-full" />

        {/* Game Reticle / Crosshair */}
        {gameControlsActive && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="relative w-8 h-8 opacity-40">
              <div className="absolute top-1/2 left-0 right-0 h-[1.5px] bg-cyan-400 -translate-y-1/2 shadow-sm shadow-cyan-400" />
              <div className="absolute left-1/2 top-0 bottom-0 w-[1.5px] bg-cyan-400 -translate-x-1/2 shadow-sm shadow-cyan-400" />
              <div className="absolute inset-1 rounded-full border border-cyan-400/40" />
            </div>
          </div>
        )}

        {/* Top-Center Game Flight Bar & Camera Presets */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-[#0B132B]/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-cyan-500/30 shadow-2xl text-[11px] select-none text-slate-200">
          <span className="flex items-center gap-1 font-bold text-cyan-400 mr-1">
            🎮 <span>Game Flight</span>
          </span>

          <button
            onClick={() => {
              const v = viewerRef.current;
              if (v && !v.isDestroyed()) {
                v.camera.flyTo({
                  destination: Cesium.Cartesian3.fromDegrees(selectedLocation.lng, selectedLocation.lat - 0.009, 380),
                  orientation: { heading: Cesium.Math.toRadians(10), pitch: Cesium.Math.toRadians(-22), roll: 0 },
                  duration: 1.2,
                });
              }
            }}
            title="Drone Follow Camera: Low altitude 350m angled game perspective"
            className="px-2 py-1 rounded-xl bg-slate-800/90 hover:bg-cyan-500 hover:text-slate-950 transition-all font-semibold"
          >
            Drone Cam
          </button>

          <button
            onClick={() => {
              const v = viewerRef.current;
              if (v && !v.isDestroyed()) {
                v.camera.flyTo({
                  destination: Cesium.Cartesian3.fromDegrees(selectedLocation.lng, selectedLocation.lat - 0.0018, 30),
                  orientation: { heading: Cesium.Math.toRadians(0), pitch: Cesium.Math.toRadians(-4), roll: 0 },
                  duration: 1.2,
                });
              }
            }}
            title="Ground Walk Camera: Ground level street / riverbank perspective (20m altitude)"
            className="px-2 py-1 rounded-xl bg-slate-800/90 hover:bg-cyan-500 hover:text-slate-950 transition-all font-semibold"
          >
            Ground Walk
          </button>

          <button
            onClick={() => {
              canyonOrbitRef.current = !canyonOrbitRef.current;
              setCanyonOrbitActive(canyonOrbitRef.current);
            }}
            title="Canyon Orbit: Continuous cinematic 360° rotation"
            className={`px-2 py-1 rounded-xl transition-all font-semibold ${
              canyonOrbitActive
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200'
            }`}
          >
            {canyonOrbitActive ? '⏹ Orbiting' : '🚁 Orbit Tour'}
          </button>

          {onReturnTo2D && (
            <button
              onClick={onReturnTo2D}
              title="Return to 2D Leaflet Map to select a new area"
              className="px-2 py-1 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500 hover:text-slate-950 transition-all font-semibold flex items-center gap-1"
            >
              <span>🗺️ 2D Map</span>
            </button>
          )}

          <div className="h-3 w-[1px] bg-slate-700 mx-1" />

          {/* MQTT Real-time Telemetry Badge */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[10px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>MQTT {mqttStatus?.port || 1883}</span>
            <span className="text-slate-400 font-normal">({mqttStatus?.messageCount ?? 1} pkts)</span>
          </div>
        </div>

        {/* Bottom Game Controls Hint Badge */}
        {gameControlsActive && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full border border-slate-700/60 text-[10px] text-slate-300 shadow-xl flex items-center gap-2">
            <span className="text-cyan-400 font-bold">GAME CONTROLS:</span>
            <span>
              <kbd className="px-1 py-0.5 bg-slate-800 rounded text-cyan-300 font-mono">W</kbd>
              <kbd className="px-1 py-0.5 bg-slate-800 rounded text-cyan-300 font-mono">A</kbd>
              <kbd className="px-1 py-0.5 bg-slate-800 rounded text-cyan-300 font-mono">S</kbd>
              <kbd className="px-1 py-0.5 bg-slate-800 rounded text-cyan-300 font-mono">D</kbd> Move
            </span>
            <span>•</span>
            <span>
              <kbd className="px-1 py-0.5 bg-slate-800 rounded text-cyan-300 font-mono">SPACE</kbd> Up
            </span>
            <span>
              <kbd className="px-1 py-0.5 bg-slate-800 rounded text-cyan-300 font-mono">C</kbd> Down
            </span>
            <span>•</span>
            <span>
              <kbd className="px-1 py-0.5 bg-slate-800 rounded text-cyan-300 font-mono">SHIFT</kbd> Turbo Boost
            </span>
            <span>•</span>
            <span>Right-click / Drag to Look</span>
          </div>
        )}
      </div>
    );
  }
);
