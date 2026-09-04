import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Trail, CommunitySpot, MapTileLayer, ElevationPoint } from '../../types';
import { NavigationRoute } from '../../services/routingService';

interface TrailMapProps {
  trail: Trail | null;
  spots: CommunitySpot[];
  activeLayer: MapTileLayer;
  userPosition: { lat: number; lng: number; heading: number; accuracy?: number } | null;
  hoveredPoint: ElevationPoint | null;
  activeRoute: NavigationRoute | null;
  isFollowing: boolean;
  onSetIsFollowing: (following: boolean) => void;
  onSelectSpot: (spot: CommunitySpot) => void;
  onMapClick?: (lat: number, lng: number) => void;
  isReportingMode?: boolean;
}

// 100% Tuiles Gratuites et Publiques - Aucune clé API requise
const TILE_PROVIDERS: Record<MapTileLayer, { url: string; attribution: string; maxZoom: number; subdomains?: string }> = {
  outdoors: {
    url: 'https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap France | Données &copy; OpenStreetMap',
    maxZoom: 20,
    subdomains: 'abc',
  },
  standard: {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, IGN',
    maxZoom: 18,
  },
  opentopo: {
    url: 'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
    attribution: '&copy; CyclOSM &copy; OpenStreetMap',
    maxZoom: 18,
    subdomains: 'abc',
  },
};

const CATEGORY_COLORS: Record<string, { bg: string; border: string; emoji: string }> = {
  viewpoint: { bg: 'bg-emerald-600', border: 'border-emerald-300', emoji: '🏔️' },
  water: { bg: 'bg-cyan-600', border: 'border-cyan-300', emoji: '💧' },
  hazard: { bg: 'bg-rose-600', border: 'border-rose-300', emoji: '⚠️' },
  bivouac: { bg: 'bg-indigo-600', border: 'border-indigo-300', emoji: '⛺' },
  picnic: { bg: 'bg-amber-600', border: 'border-amber-300', emoji: '🥪' },
  fauna: { bg: 'bg-purple-600', border: 'border-purple-300', emoji: '🦌' },
  shelter: { bg: 'bg-pink-600', border: 'border-pink-300', emoji: '🛖' },
};

export const TrailMap: React.FC<TrailMapProps> = ({
  trail,
  spots,
  activeLayer,
  userPosition,
  hoveredPoint,
  activeRoute,
  isFollowing,
  onSetIsFollowing,
  onSelectSpot,
  onMapClick,
  isReportingMode,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const polylineOutlineRef = useRef<L.Polyline | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const routeOutlineRef = useRef<L.Polyline | null>(null);
  const spotMarkersLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);
  const hoveredMarkerRef = useRef<L.Marker | null>(null);
  const startEndMarkersRef = useRef<L.LayerGroup | null>(null);

  // 1. Initialisation de la carte Leaflet
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Centrage initial sur l'utilisateur (Limoges)
    const initialLat = userPosition?.lat || 45.8336;
    const initialLng = userPosition?.lng || 1.2611;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 14,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const initialProvider = TILE_PROVIDERS[activeLayer] || TILE_PROVIDERS.outdoors;
    const tileLayer = L.tileLayer(initialProvider.url, {
      attribution: initialProvider.attribution,
      maxZoom: initialProvider.maxZoom,
      subdomains: initialProvider.subdomains || 'abc',
    }).addTo(map);

    tileLayerRef.current = tileLayer;
    spotMarkersLayerRef.current = L.layerGroup().addTo(map);
    startEndMarkersRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    map.on('dragstart', () => {
      onSetIsFollowing(false);
    });

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Changement de fond de carte
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    const provider = TILE_PROVIDERS[activeLayer] || TILE_PROVIDERS.outdoors;
    tileLayerRef.current.setUrl(provider.url);
  }, [activeLayer]);

  // 3. Clic sur la carte
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleClick = (e: L.LeafletMouseEvent) => {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    };

    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [onMapClick]);

  // 4. Tracé d'un sentier prédéfini (sans forcer le centrage dessus si l'utilisateur est ailleurs)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (polylineRef.current) map.removeLayer(polylineRef.current);
    if (polylineOutlineRef.current) map.removeLayer(polylineOutlineRef.current);
    if (startEndMarkersRef.current) startEndMarkersRef.current.clearLayers();

    if (!activeRoute && trail && trail.points.length > 0) {
      const latLngs = trail.points.map((p) => [p.lat, p.lng] as [number, number]);

      polylineOutlineRef.current = L.polyline(latLngs, {
        color: '#0f172a',
        weight: 8,
        opacity: 0.7,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      polylineRef.current = L.polyline(latLngs, {
        color: '#10b981',
        weight: 5,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      const startIcon = L.divIcon({
        className: 'custom-start-marker',
        html: `<div class="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500 text-white font-black text-xs shadow-lg border-2 border-white ring-2 ring-emerald-500/50">D</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      L.marker(latLngs[0], { icon: startIcon }).addTo(startEndMarkersRef.current!);

      const endIcon = L.divIcon({
        className: 'custom-end-marker',
        html: `<div class="flex items-center justify-center w-7 h-7 rounded-full bg-slate-900 text-amber-400 font-black text-xs shadow-lg border-2 border-white ring-2 ring-amber-400/50">🏁</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      L.marker(latLngs[latLngs.length - 1], { icon: endIcon }).addTo(startEndMarkersRef.current!);
    }
  }, [trail, activeRoute]);

  // 5. Affichage de l'itinéraire de navigation calculé (Navigation Waze)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (routePolylineRef.current) map.removeLayer(routePolylineRef.current);
    if (routeOutlineRef.current) map.removeLayer(routeOutlineRef.current);

    if (activeRoute && activeRoute.points.length > 0) {
      const latLngs = activeRoute.points.map((p) => [p.lat, p.lng] as [number, number]);

      routeOutlineRef.current = L.polyline(latLngs, {
        color: '#1e3a8a',
        weight: 10,
        opacity: 0.8,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      routePolylineRef.current = L.polyline(latLngs, {
        color: '#38bdf8',
        weight: 6,
        opacity: 1,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      map.fitBounds(routePolylineRef.current.getBounds(), { padding: [80, 80] });
    }
  }, [activeRoute]);

  // 6. Marqueurs des spots communautaires
  useEffect(() => {
    const spotGroup = spotMarkersLayerRef.current;
    if (!spotGroup) return;

    spotGroup.clearLayers();

    spots.forEach((spot) => {
      const cat = CATEGORY_COLORS[spot.category] || {
        bg: 'bg-slate-700',
        border: 'border-slate-400',
        emoji: '📍',
      };

      const isHazard = spot.category === 'hazard';

      const markerHtml = `
        <div class="relative group cursor-pointer transition-transform duration-200 hover:scale-125">
          ${
            isHazard
              ? `<div class="absolute -inset-1 rounded-full bg-rose-500 animate-ping opacity-60"></div>`
              : ''
          }
          <div class="relative flex items-center justify-center w-10 h-10 rounded-2xl ${cat.bg} border-2 ${cat.border} shadow-float text-lg select-none">
            ${cat.emoji}
          </div>
          ${
            spot.upvotes > 0
              ? `<span class="absolute -top-1.5 -right-1.5 px-1.5 py-0.2 bg-slate-900/90 text-[10px] font-bold text-amber-300 rounded-full border border-amber-400/40 shadow">
                  +${spot.upvotes}
                </span>`
              : ''
          }
        </div>
      `;

      const icon = L.divIcon({
        className: 'custom-spot-pin',
        html: markerHtml,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      const marker = L.marker([spot.lat, spot.lng], { icon });
      marker.on('click', () => onSelectSpot(spot));
      marker.addTo(spotGroup);
    });
  }, [spots, onSelectSpot]);

  // 7. Repère GPS utilisateur & halo de précision
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !userPosition) return;

    const heading = userPosition.heading || 0;

    const userHtml = `
      <div class="relative flex items-center justify-center">
        <div class="absolute w-14 h-14 rounded-full bg-sky-500/20 animate-pulse-ring"></div>
        <div class="absolute w-10 h-10 rounded-full bg-sky-400/25"></div>
        <div style="transform: rotate(${heading}deg);" class="absolute -top-4 w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-b-[14px] border-b-sky-400 drop-shadow transition-transform duration-300"></div>
        <div class="w-6 h-6 rounded-full bg-sky-500 border-2 border-white shadow-lg z-10 flex items-center justify-center">
          <div class="w-2.5 h-2.5 rounded-full bg-white"></div>
        </div>
      </div>
    `;

    const userIcon = L.divIcon({
      className: 'user-location-pin',
      html: userHtml,
      iconSize: [48, 48],
      iconAnchor: [24, 24],
    });

    if (!userMarkerRef.current) {
      userMarkerRef.current = L.marker([userPosition.lat, userPosition.lng], {
        icon: userIcon,
        zIndexOffset: 1000,
      }).addTo(map);
    } else {
      userMarkerRef.current.setLatLng([userPosition.lat, userPosition.lng]);
      userMarkerRef.current.setIcon(userIcon);
    }

    const accuracy = userPosition.accuracy || 15;
    if (!accuracyCircleRef.current) {
      accuracyCircleRef.current = L.circle([userPosition.lat, userPosition.lng], {
        radius: Math.min(accuracy, 100),
        color: '#38bdf8',
        fillColor: '#0284c7',
        fillOpacity: 0.12,
        weight: 1,
      }).addTo(map);
    } else {
      accuracyCircleRef.current.setLatLng([userPosition.lat, userPosition.lng]);
      accuracyCircleRef.current.setRadius(Math.min(accuracy, 100));
    }

    if (isFollowing) {
      map.panTo([userPosition.lat, userPosition.lng], { animate: true, duration: 0.5 });
    }
  }, [userPosition, isFollowing]);

  // 8. Point survolé sur le profil altimétrique
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!hoveredPoint) {
      if (hoveredMarkerRef.current) {
        map.removeLayer(hoveredMarkerRef.current);
        hoveredMarkerRef.current = null;
      }
      return;
    }

    const hoverHtml = `
      <div class="relative flex flex-col items-center">
        <div class="px-2 py-0.5 bg-slate-950 text-emerald-400 font-bold text-xs rounded-full border border-emerald-400/50 shadow-lg -translate-y-8 whitespace-nowrap">
          ${hoveredPoint.elevation} m
        </div>
        <div class="w-4 h-4 rounded-full bg-emerald-400 border-2 border-white shadow-lg animate-ping absolute"></div>
        <div class="w-4 h-4 rounded-full bg-emerald-400 border-2 border-white shadow-lg"></div>
      </div>
    `;

    const hoverIcon = L.divIcon({
      className: 'elevation-hover-pin',
      html: hoverHtml,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    if (!hoveredMarkerRef.current) {
      hoveredMarkerRef.current = L.marker([hoveredPoint.lat, hoveredPoint.lng], {
        icon: hoverIcon,
        zIndexOffset: 999,
      }).addTo(map);
    } else {
      hoveredMarkerRef.current.setLatLng([hoveredPoint.lat, hoveredPoint.lng]);
      hoveredMarkerRef.current.setIcon(hoverIcon);
    }
  }, [hoveredPoint]);

  return (
    <div className="relative w-full h-full min-h-0">
      <div
        ref={mapContainerRef}
        className={`w-full h-full min-h-full ${
          isReportingMode ? 'cursor-crosshair' : ''
        }`}
      />

      {/* Bouton Waze : Recentrer sur ma position */}
      {!isFollowing && userPosition && (
        <button
          onClick={() => {
            onSetIsFollowing(true);
            if (mapInstanceRef.current && userPosition) {
              mapInstanceRef.current.setView([userPosition.lat, userPosition.lng], 15, { animate: true });
            }
          }}
          className="absolute bottom-28 right-4 z-[900] flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-sky-500/60 text-sky-400 text-xs font-bold shadow-float animate-bounce"
        >
          <span>🎯</span>
          <span>Recentrer (Suis-moi)</span>
        </button>
      )}

      {isReportingMode && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[1000] bg-rose-600/90 backdrop-blur-md text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-full shadow-lg border border-rose-400/40 flex items-center gap-2 animate-bounce">
          <span>📍</span>
          <span>Touchez la carte où se trouve le spot à signaler</span>
        </div>
      )}
    </div>
  );
};
