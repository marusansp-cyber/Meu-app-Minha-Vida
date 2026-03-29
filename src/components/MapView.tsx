import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Loader2, AlertCircle } from 'lucide-react';

// Fix for default marker icons in Leaflet
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapViewProps {
  address?: string;
  title?: string;
  className?: string;
}

const RecenterMap = ({ coords }: { coords: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(coords, 15);
  }, [coords, map]);
  return null;
};

export const MapView: React.FC<MapViewProps> = ({ address, title, className }) => {
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) return;

    const geocode = async () => {
      setLoading(true);
      setError(null);
      try {
        // Use Nominatim for free geocoding
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
        const data = await response.json();

        if (data && data.length > 0) {
          setCoords([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        } else {
          setError('Endereço não encontrado');
        }
      } catch (err) {
        console.error('Geocoding error:', err);
        setError('Erro ao carregar mapa');
      } finally {
        setLoading(false);
      }
    };

    geocode();
  }, [address]);

  if (!address) {
    return (
      <div className={`bg-slate-100 dark:bg-white/5 rounded-2xl flex flex-col items-center justify-center text-slate-400 p-8 ${className}`}>
        <MapPin className="w-12 h-12 mb-2 opacity-20" />
        <p className="text-sm font-bold">Nenhum endereço fornecido</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`bg-slate-100 dark:bg-white/5 rounded-2xl flex flex-col items-center justify-center text-slate-400 p-8 ${className}`}>
        <Loader2 className="w-12 h-12 mb-2 animate-spin text-[#fdb612]" />
        <p className="text-sm font-bold">Localizando endereço...</p>
      </div>
    );
  }

  if (error || !coords) {
    return (
      <div className={`bg-slate-100 dark:bg-white/5 rounded-2xl flex flex-col items-center justify-center text-slate-400 p-8 ${className}`}>
        <AlertCircle className="w-12 h-12 mb-2 text-amber-500/50" />
        <p className="text-sm font-bold">{error || 'Não foi possível carregar o mapa'}</p>
        <p className="text-[10px] mt-1">{address}</p>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm relative z-0 ${className}`}>
      <MapContainer 
        center={coords} 
        zoom={15} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={coords}>
          <Popup>
            <div className="text-sm font-bold">{title || 'Localização'}</div>
            <div className="text-xs text-slate-500">{address}</div>
          </Popup>
        </Marker>
        <RecenterMap coords={coords} />
      </MapContainer>
    </div>
  );
};
