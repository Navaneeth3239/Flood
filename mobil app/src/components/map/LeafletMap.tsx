import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Incident, Alert } from '@/types';

// Fix leaflet default icon assets
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface LeafletMapProps {
  initialLat?: number;
  initialLng?: number;
  zoom?: number;
  editablePin?: boolean;
  incidents?: Incident[];
  alerts?: Alert[];
  onLocationChange?: (lat: number, lng: number) => void;
  onMarkerPress?: (item: Incident | Alert) => void;
  className?: string;
  height?: string;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  initialLat = 13.015,
  initialLng = 80.215,
  zoom = 13,
  editablePin = false,
  incidents = [],
  alerts = [],
  onLocationChange,
  onMarkerPress,
  className = '',
  height = '300px',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const editableMarkerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Cleanup previous map instance if exists
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: false,
    }).setView([initialLat, initialLng], zoom);

    mapInstanceRef.current = map;

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    if (editablePin) {
      // Draggable marker mode for location picking
      const pinIcon = L.divIcon({
        className: 'custom-pin-draggable',
        html: `
          <div style="width:34px;height:34px;background:#dc2626;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #ffffff;box-shadow:0 3px 8px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;">
            <div style="width:10px;height:10px;background:#ffffff;border-radius:50%;transform:rotate(45deg);"></div>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
      });

      const marker = L.marker([initialLat, initialLng], {
        draggable: true,
        icon: pinIcon,
      }).addTo(map);

      editableMarkerRef.current = marker;

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        if (onLocationChange) onLocationChange(pos.lat, pos.lng);
      });

      map.on('click', (e: L.LeafletMouseEvent) => {
        marker.setLatLng(e.latlng);
        if (onLocationChange) onLocationChange(e.latlng.lat, e.latlng.lng);
      });
    } else {
      // User location marker
      const userIcon = L.divIcon({
        className: 'user-pin',
        html: `
          <div style="width:28px;height:28px;background:#0284c7;border-radius:50%;border:3px solid #ffffff;box-shadow:0 2px 6px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;">
            📍
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      L.marker([initialLat, initialLng], { icon: userIcon })
        .addTo(map)
        .bindPopup('<b>Your Approximate Position</b>');

      // Plot incidents
      incidents.forEach((inc) => {
        if (!inc.location?.latitude || !inc.location?.longitude) return;

        let bg = '#2563eb';
        let emoji = '🌊';
        if (inc.severity === 'urgent') {
          bg = '#dc2626';
          emoji = '⚠️';
        } else if (inc.severity === 'high') {
          bg = '#ea580c';
          emoji = '🌊';
        } else if (inc.severity === 'medium') {
          bg = '#d97706';
          emoji = '💧';
        }

        const icon = L.divIcon({
          className: 'incident-pin',
          html: `
            <div style="width:30px;height:30px;background:${bg};border-radius:50%;border:2px solid #ffffff;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:13px;cursor:pointer;">
              ${emoji}
            </div>
          `,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        });

        const m = L.marker([inc.location.latitude, inc.location.longitude], { icon }).addTo(map);
        m.bindPopup(`
          <div style="font-family:sans-serif;font-size:12px;color:#1e293b;">
            <div style="font-weight:bold;margin-bottom:2px;">${inc.title}</div>
            <span style="display:inline-block;padding:1px 5px;border-radius:4px;font-size:9px;font-weight:bold;text-transform:uppercase;color:#fff;background:#0284c7;margin-bottom:4px;">${inc.status}</span>
            <div>${inc.location.address || ''}</div>
          </div>
        `);

        m.on('click', () => {
          if (onMarkerPress) onMarkerPress(inc);
        });
      });

      // Plot alerts
      alerts.forEach((alt) => {
        if (!alt.location?.latitude || !alt.location?.longitude) return;
        const color = alt.severity === 'danger' || alt.severity === 'critical' ? '#dc2626' : '#ea580c';

        const circle = L.circle([alt.location.latitude, alt.location.longitude], {
          color,
          fillColor: color,
          fillOpacity: 0.2,
          radius: 1200,
        }).addTo(map);

        circle.bindPopup(`
          <div style="font-family:sans-serif;font-size:12px;color:#1e293b;">
            <div style="font-weight:bold;color:${color};margin-bottom:2px;">🚨 ${alt.title}</div>
            <div>${alt.message}</div>
          </div>
        `);

        circle.on('click', () => {
          if (onMarkerPress) onMarkerPress(alt);
        });
      });
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [initialLat, initialLng, zoom, editablePin, incidents, alerts]);

  return (
    <div
      ref={mapContainerRef}
      style={{ height, minHeight: '180px' }}
      className={`w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner z-0 ${className}`}
    />
  );
};

