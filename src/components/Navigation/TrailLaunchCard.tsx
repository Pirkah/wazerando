import React from 'react';
import { Trail } from '../../types';
import { calculateDistance, formatDistance, formatElevation, formatDuration } from '../../utils/geoUtils';
import { Navigation, Compass, Mountain, TrendingUp, Clock, MapPin, ChevronRight } from 'lucide-react';

interface TrailLaunchCardProps {
  trail: Trail;
  userPosition: { lat: number; lng: number } | null;
  onStartNavigation: (trail: Trail) => void;
  onOpenTrailMenu: () => void;
}

export const TrailLaunchCard: React.FC<TrailLaunchCardProps> = ({
  trail,
  userPosition,
  onStartNavigation,
  onOpenTrailMenu,
}) => {
  const startPoint = trail.points[0];
  const distToStart =
    userPosition && startPoint
      ? calculateDistance(userPosition.lat, userPosition.lng, startPoint.lat, startPoint.lng)
      : null;

  const isAtStart = distToStart !== null && distToStart < 120;

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'difficile':
      case 'expert':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/40';
      case 'moyen':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      default:
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
    }
  };

  return (
    <div className="absolute bottom-20 sm:bottom-24 left-4 right-4 max-w-lg mx-auto z-[940] pointer-events-auto select-none animate-slide-up">
      <div className="bg-slate-900/95 backdrop-blur-2xl border-2 border-emerald-500/50 rounded-3xl shadow-float overflow-hidden">
        {/* Barre d'état supérieure */}
        <div className="px-4 py-2 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-bold uppercase tracking-wider text-[10px] text-slate-300">
              Randonnée sélectionnée
            </span>
          </div>

          <button
            onClick={onOpenTrailMenu}
            className="text-[11px] font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors"
          >
            <span>Changer</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* Détails du sentier */}
        <div className="p-4 space-y-3.5">
          <div>
            <div className="flex items-start justify-between gap-2 mb-1">
              <h2 className="text-base sm:text-lg font-black text-white leading-snug">
                {trail.name}
              </h2>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border shrink-0 ${getDifficultyColor(
                  trail.difficulty
                )}`}
              >
                {trail.difficulty}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">{trail.region}</span>
            </div>
          </div>

          {/* Badges métriques */}
          <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-slate-950/60 rounded-2xl border border-slate-800/80">
            <div className="flex flex-col items-center justify-center text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <Mountain className="w-3 h-3 text-sky-400" />
                Distance
              </span>
              <span className="text-sm font-extrabold text-white">
                {formatDistance(trail.totalDistance)}
              </span>
            </div>

            <div className="flex flex-col items-center justify-center text-center border-x border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-400" />
                Dénivelé
              </span>
              <span className="text-sm font-extrabold text-emerald-400">
                {formatElevation(trail.elevationGain)} D+
              </span>
            </div>

            <div className="flex flex-col items-center justify-center text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" />
                Durée
              </span>
              <span className="text-sm font-extrabold text-white">
                {formatDuration(trail.estimatedDuration)}
              </span>
            </div>
          </div>

          {/* Info Proximité Départ */}
          <div className="text-xs flex items-center justify-between text-slate-400">
            {isAtStart ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Vous êtes sur place au départ du sentier</span>
              </span>
            ) : distToStart !== null ? (
              <span className="text-slate-300 font-semibold flex items-center gap-1">
                <span>📍 Départ à {formatDistance(distToStart)} • Guidage vers le départ</span>
              </span>
            ) : (
              <span>Départ : {trail.name}</span>
            )}
          </div>

          {/* LE GRAND BOUTON D'ACTION PRINCIPAL WAZE : DÉMARRER LA RANDO */}
          <button
            onClick={() => onStartNavigation(trail)}
            className="w-full group relative py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 hover:from-emerald-400 hover:to-sky-400 text-slate-950 font-black text-base shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-3 transition-all duration-200 active:scale-[0.98] border border-white/40 overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none" />
            <Navigation className="w-5 h-5 fill-slate-950 stroke-slate-950 transition-transform group-hover:scale-110" />
            <span className="tracking-wide">DÉMARRER LA RANDO (GO)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
