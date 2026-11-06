import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export type MapProfessional = {
  profileId: string;
  name: string;
  neighborhood: string;
  latitude: number;
  longitude: number;
};

export function ProfessionalMap({
  professionals,
}: {
  professionals: MapProfessional[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const map = L.map(container, {
      scrollWheelZoom: false,
      zoomControl: true,
    }).setView([-1.67, 29.22], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    professionals.forEach((professional) => {
      const marker = L.circleMarker(
        [professional.latitude, professional.longitude],
        {
          radius: 8,
          color: '#fff',
          weight: 2,
          fillColor: '#b98734',
          fillOpacity: 0.95,
        },
      ).addTo(map);
      const popup = document.createElement('div');
      const name = document.createElement('strong');
      name.textContent = professional.name;
      const neighborhood = document.createElement('div');
      neighborhood.textContent = professional.neighborhood;
      popup.append(name, neighborhood);
      marker.bindPopup(popup);
    });

    if (professionals.length > 0) {
      const bounds = L.latLngBounds(
        professionals.map(({ latitude, longitude }) => [latitude, longitude]),
      );
      map.fitBounds(bounds, { padding: [32, 32], maxZoom: 14 });
    }

    return () => {
      map.remove();
    };
  }, [professionals]);

  return (
    <div className="mb-5 overflow-hidden rounded-2xl border border-[#d7e0e3] bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e7ecee] px-4 py-3">
        <div>
          <h3 className="font-serif text-base font-bold text-[#183451]">
            Carte de démonstration
          </h3>
          <p className="text-[11px] text-[#627668]">
            Repères fictifs à Goma · fond OpenStreetMap
          </p>
        </div>
        <span className="rounded-full bg-[#fff7e9] px-3 py-1 text-[10px] font-bold text-[#80622c]">
          Coordonnées non réelles
        </span>
      </div>
      <div
        ref={containerRef}
        className="h-[300px] w-full"
        aria-label="Carte OpenStreetMap de démonstration"
      />
      <p className="px-4 py-2 text-[10px] text-[#65786a]">
        Les points sont fictifs et ne représentent pas des adresses réelles.
        © OpenStreetMap contributors
      </p>
    </div>
  );
}
