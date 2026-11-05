import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import * as Cesium from 'cesium';
import { Station, Reading } from '@/types';
import { LayerVisibilityState } from './LayerControlPanel';
import { MapMode } from './DigitalTwinToolbar';
import { BuildingFootprint } from '@/services/buildingFootprintService';
import {
  createStationPinDataUri,
  flyCameraToLocation,
} from '@/utils/geospatialHelpers';
import {
  OBSERVED_FLOOD_EXTENT_GEOJSON,
  EMERGENCY_INFRASTRUCTURE,
} from '@/services/floodLayerService';
import { GNN_PREDICTED_RISK_ZONES_GEOJSON } from '@/services/predictionService';
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
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const viewerRef = useRef<Cesium.Viewer | null>(null);

    // Custom DataSources for efficient batching of thousands of entities
    const buildingsDataSourceRef = useRef<Cesium.CustomDataSource | null>(null);
    const mountainGisDataSourceRef = useRef<Cesium.CustomDataSource | null>(null);
    const vectorDataSourceRef = useRef<Cesium.CustomDataSource | null>(null);

    const [viewerReady, setViewerReady] = useState(false);

    // Expose camera action handles to parent / UI controls
    useImperativeHandle(ref, () => ({
      moveForward: () => {
        const v = viewerRef.current;
        if (!v || v.isDestroyed()) return;
        const alt = v.camera.positionCartographic.height;
        v.camera.moveForward(Math.max(100, alt * 0.15));
      },
      moveBackward: () => {
        const v = viewerRef.current;
        if (!v || v.isDestroyed()) return;
        const alt = v.camera.positionCartographic.height;
        v.camera.moveBackward(Math.max(100, alt * 0.15));
      },
      moveLeft: () => {
        const v = viewerRef.current;
        if (!v || v.isDestroyed()) return;
        const alt = v.camera.positionCartographic.height;
        v.camera.moveLeft(Math.max(80, alt * 0.12));
      },
      moveRight: () => {
        const v = viewerRef.current;
        if (!v || v.isDestroyed()) return;
        const alt = v.camera.positionCartographic.height;
        v.camera.moveRight(Math.max(80, alt * 0.12));
      },
      turnLeft: () => {
        const v = viewerRef.current;
        if (!v || v.isDestroyed()) return;
        v.camera.lookLeft(Cesium.Math.toRadians(12));
      },
      turnRight: () => {
        const v = viewerRef.current;
        if (!v || v.isDestroyed()) return;
        v.camera.lookRight(Cesium.Math.toRadians(12));
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
    }));

    // Initialize Cesium Viewer once
    useEffect(() => {
      if (!containerRef.current) return;

      // Configure Cesium Ion Access Token if provided in environment
      const ionToken = import.meta.env.VITE_CESIUM_ION_ACCESS_TOKEN;
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

        // Optimize visual quality and performance
        viewer.scene.globe.enableLighting = false;
        viewer.scene.globe.depthTestAgainstTerrain = true;
        viewer.scene.screenSpaceCameraController.minimumZoomDistance = 150;
        viewer.scene.screenSpaceCameraController.maximumZoomDistance = 2500000;
        viewer.scene.verticalExaggeration = terrainExaggeration;

        // Custom DataSources for high performance batched rendering
        const buildingsDS = new Cesium.CustomDataSource('buildingsDS');
        const mountainGisDS = new Cesium.CustomDataSource('mountainGisDS');
        const vectorDS = new Cesium.CustomDataSource('vectorDS');

        viewer.dataSources.add(buildingsDS);
        viewer.dataSources.add(mountainGisDS);
        viewer.dataSources.add(vectorDS);

        buildingsDataSourceRef.current = buildingsDS;
        mountainGisDataSourceRef.current = mountainGisDS;
        vectorDataSourceRef.current = vectorDS;

        // Attempt to load Cesium World Terrain asynchronously if token is present
        if (ionToken) {
          Cesium.createWorldTerrainAsync()
            .then((terrainProvider) => {
              if (!viewer.isDestroyed()) {
                viewer.terrainProvider = terrainProvider;
              }
            })
            .catch(() => {
              if (!viewer.isDestroyed()) {
                viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider();
              }
            });
        } else {
          viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider();
        }

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

        // Left Click Event: Pick Station or 3D Building
        handler.setInputAction((click: any) => {
          if (!viewer || viewer.isDestroyed()) return;
          const pickedObject = viewer.scene.pick(click.position);
          if (Cesium.defined(pickedObject) && pickedObject.id) {
            const entity = pickedObject.id as Cesium.Entity;

            // Picked station
            if (entity.properties && entity.properties.hasProperty('stationData')) {
              const stn = entity.properties.stationData.getValue();
              onSelectStation(stn);
              return;
            }

            // Picked building footprint
            if (entity.properties && entity.properties.hasProperty('buildingData')) {
              const bld = entity.properties.buildingData.getValue();
              onSelectBuilding(bld);
              return;
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

    // 1. Render 3D Extruded Building Footprints (Orange #F97316 fill, #EA580C outline)
    useEffect(() => {
      const ds = buildingsDataSourceRef.current;
      if (!ds || !viewerReady) return;

      ds.entities.removeAll();

      buildings.forEach((b) => {
        const flatCoords = b.polygon.flatMap(([lng, lat]) => [lng, lat]);
        const isSelected = selectedBuilding?.id === b.id;

        ds.entities.add({
          id: `bld-${b.id}`,
          name: b.name,
          polygon: {
            hierarchy: Cesium.Cartesian3.fromDegreesArray(flatCoords),
            height: 0,
            extrudedHeight: b.heightMeters,
            material: isSelected
              ? Cesium.Color.fromCssColorString('#00F0FF')
              : Cesium.Color.fromCssColorString('#F97316'), // Vivid orange
            outline: true,
            outlineColor: isSelected
              ? Cesium.Color.WHITE
              : Cesium.Color.fromCssColorString('#EA580C'), // Darker orange outline
            outlineWidth: 1.5,
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

    // 2. Render Mountain GIS Data (Cyan Rivers, Roads & Paths, Marked Area Boundary)
    useEffect(() => {
      const ds = mountainGisDataSourceRef.current;
      if (!ds || !viewerReady) return;

      ds.entities.removeAll();

      // Marked Study Area Boundary Polygon
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

      // Cyan River & Waterway Overlays (18 features)
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

      // Roads & Mountain Paths (142 features)
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

    // 3. Render Stations, Sentinel-1 Inundation, Risk Zones & Shelters
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
        let severity: 'normal' | 'watch' | 'warning' | 'danger' | 'unknown' = 'normal';
        if (stn.status === 'offline') {
          severity = 'unknown';
        } else if (reading?.waterLevel && reading.waterLevel >= stn.thresholds.dangerMax) {
          severity = 'danger';
        } else if (reading?.waterLevel && reading.waterLevel >= stn.thresholds.warningMax) {
          severity = 'warning';
        } else if (reading?.waterLevel && reading.waterLevel >= stn.thresholds.watchMax) {
          severity = 'watch';
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
            scale: isSelected ? 1.15 : 0.9,
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
          }),
          show: layers.stations,
        });
      });

      // Observed SAR Inundation
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
          show: layers.sarObservedFlood,
        });
      });

      // GNN Risk Zones
      GNN_PREDICTED_RISK_ZONES_GEOJSON.features.forEach((feat: any, idx) => {
        const ring = feat.geometry.coordinates[0];
        const degreesArray = ring.flatMap(([lng, lat]: [number, number]) => [lng, lat]);
        const isDanger = feat.properties.riskLevel === 'danger';

        ds.entities.add({
          id: `gnn-${idx}`,
          name: feat.properties.name,
          polygon: {
            hierarchy: Cesium.Cartesian3.fromDegreesArray(degreesArray),
            material: isDanger
              ? Cesium.Color.fromCssColorString('#EF4444').withAlpha(0.42)
              : Cesium.Color.fromCssColorString('#F97316').withAlpha(0.42),
            outline: true,
            outlineColor: isDanger
              ? Cesium.Color.fromCssColorString('#DC2626')
              : Cesium.Color.fromCssColorString('#EA580C'),
            outlineWidth: 2.5,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          },
          show: layers.gnnPredictedRisk,
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
          show: layers.emergencyShelters,
        });
      });
    }, [stations, readings, selectedStation, layers, viewerReady]);

    // Handle Map Mode changes (Flat View, Standard 3D, TIN Terrain, SRTM 30)
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
          duration: 1.2,
        });
      } else if (mapMode === 'standard3d' || mapMode === 'satellite') {
        if (viewer.camera.pitch < Cesium.Math.toRadians(-70)) {
          const carto = viewer.camera.positionCartographic;
          viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromRadians(carto.longitude, carto.latitude, Math.max(2800, carto.height)),
            orientation: {
              heading: Cesium.Math.toRadians(38),
              pitch: Cesium.Math.toRadians(-34),
              roll: 0,
            },
            duration: 1.2,
          });
        }
      }
    }, [mapMode, viewerReady]);

    // Handle external Reset button trigger
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

    // Update terrain exaggeration
    useEffect(() => {
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed()) return;
      viewer.scene.verticalExaggeration = terrainExaggeration;
    }, [terrainExaggeration]);

    return (
      <div className="w-full h-full relative">
        <div ref={containerRef} className="w-full h-full" />
      </div>
    );
  }
);
