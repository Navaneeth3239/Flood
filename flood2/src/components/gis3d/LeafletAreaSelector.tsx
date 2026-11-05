import React, { useState, useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Rectangle,
  Polygon,
  Marker,
  Popup,
  useMapEvents,
  useMap,
} from 'react-leaflet';
import {
  Search,
  Crosshair,
  Square,
  Pentagon,
  Trash2,
  Compass,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { Station } from '@/types';
import { setupLeafletIcons } from '@/utils/leafletIcons';

setupLeafletIcons();

export interface SelectedAreaBounds {
  name: string;
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  centerLat: number;
  centerLng: number;
  areaSqKm: number;
  coordinates: [number, number][]; // [lat, lng] array
  drawMode: 'rectangle' | 'polygon' | 'preset';
}

interface LeafletAreaSelectorProps {
  stations: Station[];
  onConfirmArea: (area: SelectedAreaBounds) => void;
  initialBounds?: SelectedAreaBounds | null;
}

// Preset regions for rapid 1-click selection
const REGION_PRESETS: SelectedAreaBounds[] = [
  {
    name: 'Coimbatore Monitoring Area & Noyyal Basin',
    minLat: 10.950,
    maxLat: 11.085,
    minLng: 76.880,
    maxLng: 77.060,
    centerLat: 11.0168,
    centerLng: 76.9558,
    areaSqKm: 285.4,
    coordinates: [
      [10.950, 76.880],
      [11.085, 76.880],
      [11.085, 77.060],
      [10.950, 77.060],
    ],
    drawMode: 'preset',
  },
  {
    name: 'Siruvani Mountain Gorge & Reservoir',
    minLat: 10.890,
    maxLat: 10.985,
    minLng: 76.630,
    maxLng: 76.750,
    centerLat: 10.9382,
    centerLng: 76.6854,
    areaSqKm: 142.0,
    coordinates: [
      [10.890, 76.630],
      [10.985, 76.630],
      [10.985, 76.750],
      [10.890, 76.750],
    ],
    drawMode: 'preset',
  },
  {
    name: 'Bhavani River Confluence & Pilloor Valley',
    minLat: 11.140,
    maxLat: 11.350,
    minLng: 76.770,
    maxLng: 77.020,
    centerLat: 11.245,
    centerLng: 76.895,
    areaSqKm: 620.5,
    coordinates: [
      [11.140, 76.770],
      [11.350, 76.770],
      [11.350, 77.020],
      [11.140, 77.020],
    ],
    drawMode: 'preset',
  },
  {
    name: 'Garhwal Mountain Gorge (Mandakini Valley)',
    minLat: 30.118,
    maxLat: 30.165,
    minLng: 78.290,
    maxLng: 78.345,
    centerLat: 30.138,
    centerLng: 78.312,
    areaSqKm: 15.4,
    coordinates: [
      [30.118, 78.290],
      [30.165, 78.290],
      [30.165, 78.345],
      [30.118, 78.345],
    ],
    drawMode: 'preset',
  },
  {
    name: 'Chennai Coastal River Basin (Adyar/Cooum)',
    minLat: 12.960,
    maxLat: 13.090,
    minLng: 80.140,
    maxLng: 80.290,
    centerLat: 13.015,
    centerLng: 80.215,
    areaSqKm: 235.8,
    coordinates: [
      [12.960, 80.140],
      [13.090, 80.140],
      [13.090, 80.290],
      [12.960, 80.290],
    ],
    drawMode: 'preset',
  },
];

// Helper to compute approximate bounding box and area from points
function calculateBoundsFromPoints(
  points: [number, number][],
  mode: 'rectangle' | 'polygon',
  customName?: string
): SelectedAreaBounds {
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  points.forEach(([lat, lng]) => {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
  });

  const centerLat = Number(((minLat + maxLat) / 2).toFixed(5));
  const centerLng = Number(((minLng + maxLng) / 2).toFixed(5));

  // Approx surface area in sq km
  const latDiffKm = (maxLat - minLat) * 111;
  const lngDiffKm = (maxLng - minLng) * 111 * Math.cos((centerLat * Math.PI) / 180);
  const areaSqKm = Number((latDiffKm * lngDiffKm).toFixed(1));

  return {
    name: customName || `Custom ${mode === 'rectangle' ? 'Rectangle' : 'Polygon'} Area (${centerLat}, ${centerLng})`,
    minLat: Number(minLat.toFixed(5)),
    maxLat: Number(maxLat.toFixed(5)),
    minLng: Number(minLng.toFixed(5)),
    maxLng: Number(maxLng.toFixed(5)),
    centerLat,
    centerLng,
    areaSqKm,
    coordinates: points,
    drawMode: mode,
  };
}

// Map Click Listener to handle Rectangle/Polygon Drawing
const MapDrawingHandler: React.FC<{
  activeTool: 'none' | 'rectangle' | 'polygon';
  polygonPoints: [number, number][];
  onAddPolygonPoint: (point: [number, number]) => void;
  onSetRectangleCorner: (corner: [number, number]) => void;
}> = ({ activeTool, onAddPolygonPoint, onSetRectangleCorner }) => {
  useMapEvents({
    click(e) {
      if (activeTool === 'polygon') {
        onAddPolygonPoint([e.latlng.lat, e.latlng.lng]);
      } else if (activeTool === 'rectangle') {
        onSetRectangleCorner([e.latlng.lat, e.latlng.lng]);
      }
    },
  });
  return null;
};

// Map View Controller
const MapViewController: React.FC<{
  center: [number, number];
  zoom: number;
}> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.0 });
  }, [center, zoom, map]);
  return null;
};

export const LeafletAreaSelector: React.FC<LeafletAreaSelectorProps> = ({
  stations,
  onConfirmArea,
  initialBounds,
}) => {
  // Basemap type: 'osm' | 'satellite'
  const [basemap, setBasemap] = useState<'osm' | 'satellite'>('osm');

  // Drawing tool: 'none' | 'rectangle' | 'polygon'
  const [activeTool, setActiveTool] = useState<'none' | 'rectangle' | 'polygon'>('none');

  // Working selection state
  const [selectedArea, setSelectedArea] = useState<SelectedAreaBounds | null>(() => {
    return initialBounds || REGION_PRESETS[0];
  });

  // Temporary points during drawing
  const [rectFirstCorner, setRectFirstCorner] = useState<[number, number] | null>(null);
  const [polyPoints, setPolyPoints] = useState<[number, number][]>([]);

  // Search query
  const [searchQuery, setSearchQuery] = useState('');
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    initialBounds?.centerLat || REGION_PRESETS[0].centerLat,
    initialBounds?.centerLng || REGION_PRESETS[0].centerLng,
  ]);
  const [mapZoom, setMapZoom] = useState(12);

  // Search location handler
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const q = searchQuery.toLowerCase().trim();
    // Match presets
    const foundPreset = REGION_PRESETS.find(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (q.includes('coimbatore') && p.name.includes('Coimbatore')) ||
        (q.includes('siruvani') && p.name.includes('Siruvani')) ||
        (q.includes('bhavani') && p.name.includes('Bhavani')) ||
        (q.includes('garhwal') && p.name.includes('Garhwal')) ||
        (q.includes('chennai') && p.name.includes('Chennai'))
    );

    if (foundPreset) {
      setSelectedArea(foundPreset);
      setMapCenter([foundPreset.centerLat, foundPreset.centerLng]);
      setMapZoom(12);
      return;
    }

    // Match stations
    const foundStation = stations.find(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.riverBasin.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q)
    );

    if (foundStation) {
      const area = calculateBoundsFromPoints(
        [
          [foundStation.latitude - 0.04, foundStation.longitude - 0.05],
          [foundStation.latitude + 0.04, foundStation.longitude - 0.05],
          [foundStation.latitude + 0.04, foundStation.longitude + 0.05],
          [foundStation.latitude - 0.04, foundStation.longitude + 0.05],
        ],
        'rectangle',
        `${foundStation.name} Basin Area`
      );
      setSelectedArea(area);
      setMapCenter([foundStation.latitude, foundStation.longitude]);
      setMapZoom(13);
      return;
    }

    // Generic geocoding fallback via Nominatim
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`)
      .then((r) => r.json())
      .then((results) => {
        if (results && results.length > 0) {
          const first = results[0];
          const lat = parseFloat(first.lat);
          const lon = parseFloat(first.lon);
          const area = calculateBoundsFromPoints(
            [
              [lat - 0.05, lon - 0.06],
              [lat + 0.05, lon - 0.06],
              [lat + 0.05, lon + 0.06],
              [lat - 0.05, lon + 0.06],
            ],
            'rectangle',
            first.display_name.split(',')[0]
          );
          setSelectedArea(area);
          setMapCenter([lat, lon]);
          setMapZoom(12);
        }
      })
      .catch(() => {});
  };

  // Current GPS location
  const handleCurrentLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const area = calculateBoundsFromPoints(
          [
            [lat - 0.03, lng - 0.04],
            [lat + 0.03, lng - 0.04],
            [lat + 0.03, lng + 0.04],
            [lat - 0.03, lng + 0.04],
          ],
          'rectangle',
          'Current Location Area'
        );
        setSelectedArea(area);
        setMapCenter([lat, lng]);
        setMapZoom(13);
      },
      (err) => console.warn('Geolocation error:', err)
    );
  };

  // Rectangle Drawing Handler
  const handleRectangleCorner = (corner: [number, number]) => {
    if (!rectFirstCorner) {
      setRectFirstCorner(corner);
    } else {
      const minLat = Math.min(rectFirstCorner[0], corner[0]);
      const maxLat = Math.max(rectFirstCorner[0], corner[0]);
      const minLng = Math.min(rectFirstCorner[1], corner[1]);
      const maxLng = Math.max(rectFirstCorner[1], corner[1]);

      const area = calculateBoundsFromPoints(
        [
          [minLat, minLng],
          [maxLat, minLng],
          [maxLat, maxLng],
          [minLat, maxLng],
        ],
        'rectangle'
      );
      setSelectedArea(area);
      setRectFirstCorner(null);
      setActiveTool('none');
    }
  };

  // Polygon Drawing Handler
  const handleAddPolygonPoint = (point: [number, number]) => {
    setPolyPoints((prev) => [...prev, point]);
  };

  const handleFinishPolygon = () => {
    if (polyPoints.length >= 3) {
      const area = calculateBoundsFromPoints(polyPoints, 'polygon');
      setSelectedArea(area);
    }
    setPolyPoints([]);
    setActiveTool('none');
  };

  const handleClearSelection = () => {
    setSelectedArea(null);
    setRectFirstCorner(null);
    setPolyPoints([]);
    setActiveTool('none');
  };

  // Validation
  const isAreaValid = selectedArea && selectedArea.areaSqKm > 0.1 && selectedArea.areaSqKm <= 5000;
  const isAreaTooLarge = selectedArea && selectedArea.areaSqKm > 5000;

  return (
    <div className="relative w-full h-[calc(100vh-100px)] min-h-[640px] flex flex-col bg-[#070D1F] overflow-hidden rounded-2xl border border-cyan-500/20 shadow-2xl">
      {/* TOP FLOATING SEARCH & CONTROLS BAR */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex flex-wrap items-center justify-between gap-3 pointer-events-auto">
        {/* Left Group: Location Search & Geolocation */}
        <div className="flex items-center gap-2 bg-[#0B132B]/95 backdrop-blur-md px-3 py-2 rounded-2xl border border-cyan-500/30 shadow-2xl">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <Search className="w-4 h-4 text-cyan-400" />
            <input
              type="text"
              placeholder="Search river basin, station or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none text-xs text-slate-100 placeholder-slate-400 focus:outline-hidden w-60 md:w-80"
            />
            <button
              type="submit"
              className="px-2.5 py-1 bg-cyan-500 text-slate-950 font-bold rounded-xl text-[11px] hover:bg-cyan-400 transition-colors shadow-xs"
            >
              Search
            </button>
          </form>

          <div className="h-4 w-[1px] bg-slate-700 mx-1" />

          <button
            onClick={handleCurrentLocation}
            title="Locate my position"
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-300 transition-all"
          >
            <Crosshair className="w-4 h-4" />
          </button>
        </div>

        {/* Center Group: Draw Rectangle, Draw Polygon, Clear */}
        <div className="flex items-center gap-1.5 bg-[#0B132B]/95 backdrop-blur-md p-1.5 rounded-2xl border border-cyan-500/30 shadow-2xl text-xs select-none">
          <button
            onClick={() => {
              setActiveTool(activeTool === 'rectangle' ? 'none' : 'rectangle');
              setRectFirstCorner(null);
            }}
            title="Draw Rectangle (Click two opposite corners on map)"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all ${
              activeTool === 'rectangle'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/30'
                : 'text-slate-200 hover:bg-slate-800/80'
            }`}
          >
            <Square className="w-3.5 h-3.5" />
            <span>Draw Rectangle</span>
          </button>

          <button
            onClick={() => {
              setActiveTool(activeTool === 'polygon' ? 'none' : 'polygon');
              setPolyPoints([]);
            }}
            title="Draw Custom Polygon (Click points on map, then finish)"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all ${
              activeTool === 'polygon'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/30'
                : 'text-slate-200 hover:bg-slate-800/80'
            }`}
          >
            <Pentagon className="w-3.5 h-3.5" />
            <span>
              Draw Polygon {polyPoints.length > 0 && `(${polyPoints.length} pts)`}
            </span>
          </button>

          {activeTool === 'polygon' && polyPoints.length >= 3 && (
            <button
              onClick={handleFinishPolygon}
              className="px-2.5 py-1.5 bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-emerald-400 transition-all shadow-md shadow-emerald-500/30"
            >
              Complete Polygon
            </button>
          )}

          <button
            onClick={handleClearSelection}
            title="Clear current selection"
            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Right Group: Basemap Selector */}
        <div className="flex items-center gap-1 bg-[#0B132B]/95 backdrop-blur-md p-1 rounded-2xl border border-cyan-500/30 shadow-2xl text-xs select-none">
          <button
            onClick={() => setBasemap('osm')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
              basemap === 'osm'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            OpenStreetMap
          </button>
          <button
            onClick={() => setBasemap('satellite')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
              basemap === 'satellite'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Satellite
          </button>
        </div>
      </div>

      {/* DRAWING INSTRUCTION HINT BAR */}
      {activeTool !== 'none' && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[1000] bg-amber-500 text-slate-950 font-bold text-xs px-4 py-1.5 rounded-full shadow-2xl flex items-center gap-2 pointer-events-none animate-pulse">
          <Compass className="w-4 h-4" />
          {activeTool === 'rectangle'
            ? rectFirstCorner
              ? 'Click second opposite corner to complete rectangle'
              : 'Click first corner of rectangle on the map'
            : 'Click map to place polygon vertices. Click Complete when finished.'}
        </div>
      )}

      {/* MAIN 2D LEAFLET MAP CONTAINER */}
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        className="w-full h-full z-0"
        zoomControl={false}
      >
        <MapViewController center={mapCenter} zoom={mapZoom} />

        {/* Basemap Tile Layer */}
        {basemap === 'osm' ? (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
        ) : (
          <TileLayer
            attribution='&copy; <a href="https://www.esri.com/">Esri</a>, Maxar, Earthstar'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={19}
          />
        )}

        <MapDrawingHandler
          activeTool={activeTool}
          polygonPoints={polyPoints}
          onAddPolygonPoint={handleAddPolygonPoint}
          onSetRectangleCorner={handleRectangleCorner}
        />

        {/* Selected Area Rendering */}
        {selectedArea && (
          <Rectangle
            bounds={[
              [selectedArea.minLat, selectedArea.minLng],
              [selectedArea.maxLat, selectedArea.maxLng],
            ]}
            pathOptions={{
              color: '#00F0FF',
              weight: 3,
              fillColor: '#00F0FF',
              fillOpacity: 0.18,
              dashArray: '6, 6',
            }}
          />
        )}

        {/* Temporary Polygon Points while drawing */}
        {polyPoints.length > 0 && (
          <Polygon
            positions={polyPoints}
            pathOptions={{
              color: '#F59E0B',
              weight: 2,
              fillColor: '#F59E0B',
              fillOpacity: 0.25,
            }}
          />
        )}

        {/* Sensor Stations Markers on 2D Map */}
        {stations.map((stn) => (
          <Marker
            key={stn.id}
            position={[stn.latitude, stn.longitude]}
            eventHandlers={{
              click: () => {
                const area = calculateBoundsFromPoints(
                  [
                    [stn.latitude - 0.04, stn.longitude - 0.05],
                    [stn.latitude + 0.04, stn.longitude - 0.05],
                    [stn.latitude + 0.04, stn.longitude + 0.05],
                    [stn.latitude - 0.04, stn.longitude + 0.05],
                  ],
                  'rectangle',
                  `${stn.name} Monitoring Zone`
                );
                setSelectedArea(area);
              },
            }}
          >
            <Popup>
              <div className="p-2 text-xs">
                <div className="font-bold text-slate-900">{stn.name}</div>
                <div className="text-slate-600">
                  {stn.riverBasin} • {(stn as any).soilType || 'Clay'} Soil
                </div>
                <div className="mt-1 text-cyan-600 font-semibold cursor-pointer">
                  Click station to select bounding area
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* BOTTOM-LEFT: PRESET BASIN SELECTION CHIPS */}
      <div className="absolute bottom-6 left-6 z-[1000] flex flex-col gap-2 max-w-md pointer-events-auto">
        <div className="bg-[#0B132B]/95 backdrop-blur-md p-3 rounded-2xl border border-cyan-500/25 shadow-2xl text-xs space-y-2 select-none">
          <div className="flex items-center gap-1.5 font-bold text-white text-xs">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>1-Click Preset Study Basins</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {REGION_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => {
                  setSelectedArea(preset);
                  setMapCenter([preset.centerLat, preset.centerLng]);
                  setMapZoom(12);
                }}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-medium transition-all ${
                  selectedArea?.name === preset.name
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/40'
                    : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {preset.name.split(' (')[0].split(' & ')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* BOTTOM-RIGHT: SELECTED BOUNDS CARD & EXPLORE IN 3D ACTION */}
      {selectedArea && (
        <div className="absolute bottom-6 right-6 z-[1000] w-80 md:w-96 bg-[#0B132B]/95 backdrop-blur-md p-4 rounded-3xl border border-cyan-500/40 shadow-2xl space-y-3 pointer-events-auto select-none">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                Selected Geographical Area
              </div>
              <h3 className="text-sm font-bold text-white mt-0.5 line-clamp-1">
                {selectedArea.name}
              </h3>
            </div>
            {isAreaValid ? (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold">
                <ShieldCheck className="w-3 h-3" /> Valid
              </span>
            ) : isAreaTooLarge ? (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[10px] font-bold">
                <AlertCircle className="w-3 h-3" /> Too Large
              </span>
            ) : null}
          </div>

          {/* Coordinates Grid */}
          <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-950/70 p-2.5 rounded-2xl border border-slate-800/80 font-mono">
            <div>
              <span className="text-slate-400 block text-[9px] uppercase">Center Point</span>
              <span className="text-cyan-300 font-semibold">
                {selectedArea.centerLat.toFixed(4)}, {selectedArea.centerLng.toFixed(4)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[9px] uppercase">Estimated Surface</span>
              <span className="text-emerald-300 font-semibold">
                {selectedArea.areaSqKm} km²
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[9px] uppercase">Lat Bounds</span>
              <span className="text-slate-300 text-[10px]">
                {selectedArea.minLat.toFixed(3)}° to {selectedArea.maxLat.toFixed(3)}°
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[9px] uppercase">Lng Bounds</span>
              <span className="text-slate-300 text-[10px]">
                {selectedArea.minLng.toFixed(3)}° to {selectedArea.maxLng.toFixed(3)}°
              </span>
            </div>
          </div>

          {/* Explore in 3D Button */}
          <button
            onClick={() => onConfirmArea(selectedArea)}
            disabled={!isAreaValid}
            className={`w-full py-3 px-4 rounded-2xl font-bold flex items-center justify-center gap-2 text-sm transition-all shadow-xl ${
              isAreaValid
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-cyan-500/30 active:scale-[0.98]'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <span>Explore in 3D Digital Twin</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
