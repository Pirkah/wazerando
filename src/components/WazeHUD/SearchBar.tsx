import React, { useState, useMemo, useRef, useEffect } from 'react';
import { CommunitySpot, SpotCategory } from '../../types';
import { calculateDistance, formatDistance, formatElevation } from '../../utils/geoUtils';
import { Search, X, Navigation2 } from 'lucide-react';

interface SearchBarProps {
  spots: CommunitySpot[];
  userLocation: { lat: number; lng: number } | null;
  onNavigateToSpot: (spot: CommunitySpot) => void;
  onSelectSpot: (spot: CommunitySpot) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  spots,
  userLocation,
  onNavigateToSpot,
  onSelectSpot,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<SpotCategory | 'all'>('all');
  const containerRef = useRef<HTMLDivElement>(null);

  // Fermer quand on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Trier les spots par distance par rapport à l'utilisateur
  const filteredSpots = useMemo(() => {
    let result = spots.map((spot) => {
      const dist = userLocation
        ? calculateDistance(userLocation.lat, userLocation.lng, spot.lat, spot.lng)
        : 0;
      return { ...spot, distFromUser: dist };
    });

    if (userLocation) {
      result.sort((a, b) => a.distFromUser - b.distFromUser);
    }

    if (categoryFilter !== 'all') {
      result = result.filter((s) => s.category === categoryFilter);
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q)
      );
    }

    return result;
  }, [spots, userLocation, categoryFilter, query]);

  const getCategoryEmoji = (category: string) => {
    switch (category) {
      case 'viewpoint':
        return '🏔️';
      case 'water':
        return '💧';
      case 'hazard':
        return '⚠️';
      case 'bivouac':
        return '⛺';
      case 'picnic':
        return '🥪';
      case 'shelter':
        return '🛖';
      default:
        return '📍';
    }
  };

  return (
    <div ref={containerRef} className="relative w-full select-none">
      {/* Barre d'input principale façon Waze */}
      <div
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 shadow-hud cursor-pointer hover:border-emerald-500/50 transition-all"
      >
        <Search className="w-5 h-5 text-emerald-400 shrink-0" />
        <input
          type="text"
          placeholder="Où aller ? Belvédère, source d'eau, refuge..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="flex-1 bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none"
        />
        {query && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setQuery('');
            }}
            className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Menu déroulant des résultats Waze */}
      {isOpen && (
        <div className="absolute top-12 left-0 right-0 z-[1050] bg-slate-900/95 backdrop-blur-2xl border border-slate-700 rounded-2xl shadow-2xl overflow-hidden mt-1.5 animate-fade-in max-h-80 flex flex-col">
          {/* Filtres rapides par pilules */}
          <div className="p-2 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-slate-950/50">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                categoryFilter === 'all'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setCategoryFilter('viewpoint')}
              className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1 transition-colors ${
                categoryFilter === 'viewpoint'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🏔️</span>
              <span>Panoramas</span>
            </button>
            <button
              onClick={() => setCategoryFilter('water')}
              className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1 transition-colors ${
                categoryFilter === 'water'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>💧</span>
              <span>Sources</span>
            </button>
            <button
              onClick={() => setCategoryFilter('hazard')}
              className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1 transition-colors ${
                categoryFilter === 'hazard'
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>⚠️</span>
              <span>Alertes</span>
            </button>
          </div>

          {/* Liste des spots */}
          <div className="overflow-y-auto divide-y divide-slate-800/80">
            {filteredSpots.length > 0 ? (
              filteredSpots.map((spot) => (
                <div
                  key={spot.id}
                  className="p-3 hover:bg-slate-800/60 transition-colors flex items-center justify-between gap-3"
                >
                  <div
                    onClick={() => {
                      onSelectSpot(spot);
                      setIsOpen(false);
                    }}
                    className="flex-1 min-w-0 cursor-pointer"
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-base">{getCategoryEmoji(spot.category)}</span>
                      <h4 className="font-bold text-sm text-white truncate">{spot.title}</h4>
                      {spot.upvotes > 0 && (
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-800/40">
                          +{spot.upvotes}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 truncate">{spot.description}</p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                      {userLocation && (
                        <span className="font-semibold text-slate-300">
                          {formatDistance(spot.distFromUser)}
                        </span>
                      )}
                      <span className="text-emerald-400 font-medium">
                        {formatElevation(spot.elevation, false)}
                      </span>
                    </div>
                  </div>

                  {/* Bouton Waze "Y ALLER" */}
                  <button
                    onClick={() => {
                      onNavigateToSpot(spot);
                      setIsOpen(false);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md shrink-0 transition-transform active:scale-95"
                  >
                    <Navigation2 className="w-3.5 h-3.5 fill-current" />
                    <span>Y ALLER</span>
                  </button>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                Aucun spot trouvé correspondant à votre recherche.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
