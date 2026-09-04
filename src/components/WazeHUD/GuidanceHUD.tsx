import React from 'react';
import { CommunitySpot } from '../../types';
import { NavigationRoute } from '../../services/routingService';
import { formatDistance, formatElevation, formatDuration } from '../../utils/geoUtils';
import { SearchBar } from './SearchBar';
import { X, ArrowUpRight, Mountain, Play, Pause, MapPin, LocateFixed } from 'lucide-react';

interface GuidanceHUDProps {
  userPosition: { lat: number; lng: number; heading: number; source?: string; label?: string } | null;
  spots: CommunitySpot[];
  activeRoute: NavigationRoute | null;
  onStopNavigation: () => void;
  onNavigateToSpot: (spot: CommunitySpot) => void;
  onSelectSpot: (spot: CommunitySpot) => void;
  isSimulating: boolean;
  onToggleSimulation: () => void;
  onRecenter: () => void;
  isClickToMoveMode: boolean;
  onToggleClickToMove: () => void;
}

export const GuidanceHUD: React.FC<GuidanceHUDProps> = ({
  userPosition,
  spots,
  activeRoute,
  onStopNavigation,
  onNavigateToSpot,
  onSelectSpot,
  isSimulating,
  onToggleSimulation,
  onRecenter,
  isClickToMoveMode,
  onToggleClickToMove,
}) => {
  // 1. Mode Navigation active
  if (activeRoute) {
    const nextStep = activeRoute.steps[0] || {
      instruction: `Suivre le sentier vers ${activeRoute.destinationTitle}`,
      distance: activeRoute.distance,
    };

    const etaDate = new Date(Date.now() + activeRoute.duration * 1000);
    const etaFormatted = `${etaDate.getHours().toString().padStart(2, '0')}:${etaDate.getMinutes().toString().padStart(2, '0')}`;

    return (
      <div className="absolute top-4 left-4 right-4 max-w-lg mx-auto z-[950] pointer-events-auto select-none animate-fade-in">
        <div className="bg-slate-900/95 backdrop-blur-2xl border-2 border-emerald-500/60 rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-4 flex items-center justify-between gap-3 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600 text-white shadow-lg border border-emerald-400 shrink-0">
              <ArrowUpRight className="w-8 h-8 stroke-[2.5]" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-400 mb-0.5">
                <span>Dans {formatDistance(nextStep.distance)}</span>
                <span className="text-slate-500">•</span>
                <span className="text-emerald-300 flex items-center gap-1">
                  <Mountain className="w-3.5 h-3.5" />
                  {formatElevation(activeRoute.elevationGain)} D+
                </span>
              </div>

              <div className="text-base font-extrabold text-white truncate leading-tight">
                {nextStep.instruction}
              </div>

              <div className="text-xs font-semibold text-slate-400 truncate mt-0.5">
                Cap sur : <b className="text-slate-200">{activeRoute.destinationTitle}</b>
              </div>
            </div>

            <button
              onClick={onStopNavigation}
              className="w-10 h-10 rounded-2xl bg-rose-600/20 hover:bg-rose-600 border border-rose-500/40 hover:border-rose-400 text-rose-300 hover:text-white flex items-center justify-center transition-all shrink-0"
              title="Arrêter le guidage"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-4 py-2.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Arrivée estimée :</span>
              <span className="font-extrabold text-white text-sm">{etaFormatted}</span>
              <span className="text-slate-400">({formatDuration(Math.round(activeRoute.duration / 60))})</span>
            </div>

            <div className="font-bold text-slate-300">
              {formatDistance(activeRoute.distance)} restant
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Mode Recherche Waze & Barre de Contrôles GPS
  return (
    <div className="absolute top-4 left-4 right-4 max-w-lg mx-auto z-[950] pointer-events-auto select-none space-y-2">
      {/* Barre "Où aller ?" */}
      <SearchBar
        spots={spots}
        userLocation={userPosition}
        onNavigateToSpot={onNavigateToSpot}
        onSelectSpot={onSelectSpot}
      />

      {/* Barre d'état & Actions GPS Waze */}
      <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-md text-xs">
        {/* Statut GPS */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span
            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              userPosition?.source === 'gps'
                ? 'bg-emerald-400 animate-pulse'
                : userPosition?.source === 'simulated'
                ? 'bg-sky-400 animate-ping'
                : 'bg-amber-400'
            }`}
          />
          <span className="font-bold text-slate-200 truncate text-[11px]">
            {userPosition?.label || 'Limoges'}
          </span>
        </div>

        {/* Boutons d'interaction directe */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Bouton Simulation Marche */}
          <button
            onClick={onToggleSimulation}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all shadow-sm ${
              isSimulating
                ? 'bg-amber-500 text-slate-950 animate-pulse'
                : 'bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40'
            }`}
            title="Démarrer / arrêter la marche simulée"
          >
            {isSimulating ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
            <span>{isSimulating ? 'Pause' : 'Marcher'}</span>
          </button>

          {/* Bouton Recentrer */}
          <button
            onClick={onRecenter}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
            title="Recentrer sur ma position"
          >
            <LocateFixed className="w-3.5 h-3.5 text-sky-400" />
          </button>

          {/* Bouton Téléporter GPS sur la carte */}
          <button
            onClick={onToggleClickToMove}
            className={`flex items-center gap-1 px-2 py-1 rounded-xl text-[11px] font-bold transition-all border ${
              isClickToMoveMode
                ? 'bg-sky-500 text-white border-sky-300 shadow-md animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title="Cliquez n'importe où sur la carte pour placer votre GPS"
          >
            <MapPin className="w-3 h-3 text-amber-400" />
            <span className="hidden sm:inline">Déplacer GPS</span>
          </button>
        </div>
      </div>

      {isClickToMoveMode && (
        <div className="bg-sky-500/90 backdrop-blur text-white text-xs font-bold px-3 py-1.5 rounded-xl text-center shadow-lg border border-sky-300 animate-bounce">
          🎯 Cliquez n'importe où sur la carte pour y placer votre GPS
        </div>
      )}
    </div>
  );
};
