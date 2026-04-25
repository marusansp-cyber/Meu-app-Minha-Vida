import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Loader2, AlertCircle, Users, Maximize } from 'lucide-react';
import { cn } from '../lib/utils';
import { Client, Proposal, Installation } from '../types';

// Fix for default marker icons in Leaflet
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface ClientsMapProps {
  clients: Client[];
  proposals: Proposal[];
  installations: Installation[];
  className?: string;
  onSelectClient?: (client: Client) => void;
  onEditClient?: (client: Client) => void;
}

interface ClientMarker {
  client: Client;
  coords: [number, number];
}

const RecenterMap = ({ coords }: { coords: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.setView(coords, 12);
    }
  }, [coords, map]);
  return null;
};

const FitBounds = ({ markers, trigger }: { markers: ClientMarker[], trigger: number }) => {
  const map = useMap();
  useEffect(() => {
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(m => m.coords));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [trigger, markers, map]);
  return null;
};

export const ClientsMap: React.FC<ClientsMapProps> = ({ 
  clients, 
  proposals, 
  installations, 
  className, 
  onSelectClient,
  onEditClient
}) => {
  const [markers, setMarkers] = useState<ClientMarker[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fitTrigger, setFitTrigger] = useState(0);

  useEffect(() => {
    const geocodeClients = async () => {
      setLoading(true);
      setError(null);
      const newMarkers: ClientMarker[] = [];

      try {
        // Geocode each client address if coordinates are missing
        for (const client of clients) {
          if (client.latitude && client.longitude) {
            newMarkers.push({
              client,
              coords: [client.latitude, client.longitude]
            });
            continue;
          }

          if (!client.address) continue;

          try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(client.address)}`);
            const data = await response.json();

            if (data && data.length > 0) {
              newMarkers.push({
                client,
                coords: [parseFloat(data[0].lat), parseFloat(data[0].lon)]
              });
            }
            // Add a small delay to respect Nominatim rate limits
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (err) {
            console.error(`Geocoding error for client ${client.name}:`, err);
          }
        }
        setMarkers(newMarkers);
      } catch (err) {
        console.error('Geocoding error:', err);
        setError('Erro ao carregar mapa de clientes');
      } finally {
        setLoading(false);
      }
    };

    if (clients.length > 0) {
      geocodeClients();
    }
  }, [clients]);

  useEffect(() => {
    if (!loading && markers.length > 0) {
      setFitTrigger(prev => prev + 1);
    }
  }, [loading, markers.length]);

  if (loading && markers.length === 0) {
    return (
      <div className={`bg-slate-100 dark:bg-white/5 rounded-3xl flex flex-col items-center justify-center text-slate-400 p-12 ${className}`}>
        <Loader2 className="w-12 h-12 mb-4 animate-spin text-[#fdb612]" />
        <p className="text-lg font-bold">Mapeando clientes...</p>
        <p className="text-sm opacity-60">Localizando endereços no mapa</p>
      </div>
    );
  }

  if (error && markers.length === 0) {
    return (
      <div className={`bg-slate-100 dark:bg-white/5 rounded-3xl flex flex-col items-center justify-center text-slate-400 p-12 ${className}`}>
        <AlertCircle className="w-12 h-12 mb-4 text-amber-500/50" />
        <p className="text-lg font-bold">{error}</p>
      </div>
    );
  }

  const center: [number, number] = markers.length > 0 ? markers[0].coords : [-23.5505, -46.6333]; // Default to São Paulo

  return (
    <div className={`rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm relative z-0 ${className}`}>
      {markers.length > 0 && (
        <button
          onClick={() => setFitTrigger(prev => prev + 1)}
          className="absolute top-4 right-4 z-[1000] bg-white dark:bg-[#231d0f] p-3 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-[#fdb612] transition-all flex items-center gap-2 font-bold text-xs uppercase tracking-widest"
          title="Centralizar todos os marcadores"
        >
          <Maximize className="w-4 h-4" />
          Centralizar Tudo
        </button>
      )}
      <MapContainer 
        center={center} 
        zoom={12} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((marker) => {
          const clientProposals = proposals.filter(p => p.client === marker.client.name).length;
          const clientInstallations = installations.filter(i => i.name === marker.client.name).length;
          const totalProjects = clientProposals + clientInstallations;

          return (
            <Marker 
              key={marker.client.id} 
              position={marker.coords}
              eventHandlers={{
                click: () => onSelectClient?.(marker.client)
              }}
            >
              <Popup>
                <div className="p-2 min-w-[150px]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="size-8 rounded-lg bg-[#fdb612]/20 flex items-center justify-center text-[#fdb612]">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 leading-tight">{marker.client.name}</div>
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "text-[9px] font-black uppercase tracking-widest",
                          marker.client.status === 'active' ? "text-emerald-600" : "text-rose-600"
                        )}>
                          {marker.client.status === 'active' ? 'Ativo' : 'Inativo'}
                        </div>
                        {marker.client.type && (
                          <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                            • {marker.client.type}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-center shadow-sm border border-slate-100 dark:border-slate-700">
                      <p className="text-[8px] font-black uppercase text-slate-400">Propostas</p>
                      <p className="text-sm font-black text-[#fdb612]">{clientProposals}</p>
                    </div>
                    <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-center shadow-sm border border-slate-100 dark:border-slate-700">
                      <p className="text-[8px] font-black uppercase text-slate-400">Instal.</p>
                      <p className="text-sm font-black text-blue-600 dark:text-blue-400">{clientInstallations}</p>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-500 mb-2 truncate" title={marker.client.address}>{marker.client.address}</div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => onSelectClient?.(marker.client)}
                      className="flex-1 py-1.5 bg-[#fdb612] text-[#231d0f] rounded-lg text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all text-center"
                    >
                      Detalhes
                    </button>
                    {onEditClient && (
                      <button 
                        onClick={() => onEditClient(marker.client)}
                        className="flex-1 py-1.5 bg-blue-500/10 text-blue-500 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all text-center"
                      >
                        Editar
                      </button>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
        {markers.length > 0 && <FitBounds markers={markers} trigger={fitTrigger} />}
      </MapContainer>
    </div>
  );
};
