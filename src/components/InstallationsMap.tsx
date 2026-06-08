import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Installation } from '../types';

const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface InstallationsMapProps {
  installations: Installation[];
}

const FitBounds = ({ coords, trigger }: { coords: [number, number][], trigger: number }) => {
  const map = useMap();
  useEffect(() => {
    if (coords.length > 0) {
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15, animate: true });
    }
  }, [trigger, coords, map]);
  return null;
};

export const InstallationsMap: React.FC<InstallationsMapProps> = ({ installations }) => {
  const [markers, setMarkers] = useState<{ inst: Installation, coords: [number, number] }[]>([]);

  useEffect(() => {
    let active = true;

    const geocode = async () => {
      // Small debounce
      await new Promise(resolve => setTimeout(resolve, 500));
      if (!active) return;

      const m: { inst: Installation, coords: [number, number] }[] = [];
      for (const inst of installations) {
        if (!active) return;

        if (inst.address) {
          try {
            await new Promise(resolve => setTimeout(resolve, 300)); // rate limiting roughly
            if (!active) return;

            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(inst.address)}&countrycodes=br&limit=1`);
            const data = await res.json();
            if (data && data.length > 0) {
              m.push({ inst, coords: [parseFloat(data[0].lat), parseFloat(data[0].lon)] });
            }
          } catch (e) {
            console.error(e);
          }
        }
      }
      if (active) setMarkers(m);
    };
    geocode();

    return () => { active = false; };
  }, [installations]);

  return (
    <div className="w-full h-[400px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm relative z-0 mb-6 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center">
      <MapContainer center={[-23.5505, -46.6333]} zoom={5} className="w-full h-full z-0 relative">
        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
        {markers.map((m, i) => (
          <Marker key={i} position={m.coords}>
            <Popup>
              <div className="font-bold text-slate-800">{m.inst.name || 'Instalação'}</div>
              <div className="text-xs text-slate-500 mt-1">{m.inst.address}</div>
            </Popup>
          </Marker>
        ))}
        {markers.length > 0 && <FitBounds coords={markers.map(m => m.coords)} trigger={markers.length} />}
      </MapContainer>
    </div>
  );
};
