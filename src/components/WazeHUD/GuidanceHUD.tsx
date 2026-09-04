import React from 'react';
import { CommunitySpot } from '../../types';
import { NavigationRoute } from '../../services/routingService';
import { formatDistance, formatElevation, formatDuration } from '../../utils/geoUtils';
import { SearchBar } from './SearchBar';
import { X, ArrowUpRight, Mountain, AlertTriangle } from 'lucide-react';

interface GuidanceHUDProps {
  userPosition: { lat: number; lng: number; heading: number } | null;
  spots: CommunitySpot[];
  activeRoute: NavigationRoute | null;
  onStopNavigation: () => void;
  onNavigateToSpot: (spot: CommunitySpot) => void;
  onSelectSpot: (spot: CommunitySpot) => void;
  isLiveGps: boolean;
  gpsError: string | null;
  onEnableGps: () => void;
}

export const GuidanceHUD: React.FC<GuidanceHUDProps> = ({
  userPosition,
  spots,
  activeRoute,
  onStopNavigation,
  onNavigateToSpot,
  onSelectSpot,
  isLiveGps,
  gpsError,
  onEnableGps,
}) => {
  // 1. Si une navigation active est en cours (Mode Guidage Waze)
  if (activeRoute) {
    const nextStep = activeRoute.steps[0] || {
      instruction: `Suivre le sentier vers ${activeRoute.destinationTitle}`,
      distance: activeRoute.distance,
    };

    // Calcul de l'heure d'arrivée estimée (ETA)
    const etaDate = new Date(Date.now() + activeRoute.duration * 1000);
    const etaFormatted = `${etaDate.getHours().toString().padStart(2, '0')}:${etaDate.getMinutes().toString().padStart(2, '0')}`;

    return (
      <div className="absolute top-4 left-4 right-4 max-w-lg mx-auto z-[950] pointer-events-auto select-none animate-fade-in">
        <div className="bg-slate-900/95 backdrop-blur-2xl border-2 border-emerald-500/60 rounded-3xl shadow-2xl overflow-hidden">
          {/* Bandeau principal de manœuvre Waze */}
          <div className="p-4 flex items-center justify-between gap-3 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900">
            {/* Flèche de manœuvre */}
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600 text-white shadow-lg border border-emerald-400 shrink-0">
              <ArrowUpRight className="w-8 h-8 stroke-[2.5]" />
            </div>

            {/* Instruction textuelle & Destination */}
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

            {/* Bouton Quitter Navigation */}
            <button
              onClick={onStopNavigation}
              className="w-10 h-10 rounded-2xl bg-rose-600/20 hover:bg-rose-600 border border-rose-500/40 hover:border-rose-400 text-rose-300 hover:text-white flex items-center justify-center transition-all shrink-0"
              title="Arrêter le guidage"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Bandeau d'estimation : ETA, Distance restante & Temps */}
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

  // 2. Mode Recherche & État GPS par défaut
  return (
    <div className="absolute top-4 left-4 right-4 max-w-lg mx-auto z-[950] pointer-events-auto select-none space-y-2">
      {/* Barre de recherche "Où aller ?" */}
      <SearchBar
        spots={spots}
        userLocation={userPosition}
        onNavigateToSpot={onNavigateToSpot}
        onSelectSpot={onSelectSpot}
      />

      {/* Alerte GPS si refusé ou désactivé */}
      {gpsError && (
        <div className="p-3 bg-amber-950/90 backdrop-blur-md border border-amber-500/50 rounded-2xl shadow-lg flex items-center justify-between gap-3 text-xs text-amber-200 animate-fade-in">
          <div className="flex items-center gap-2 flex-1">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{gpsError}</span>
          </div>
          <button
            onClick={onEnableGps}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shrink-0 shadow"
          >
            Activer GPS
          </button>
        </div>
      )}

      {/* Badge GPS actif */}
      {isLiveGps && !gpsError && (
        <div className="flex items-center justify-between px-3 py-1 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-full text-[11px] text-slate-400 max-w-fit mx-auto shadow">
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>GPS En direct</span>
          </div>
        </div>
      )}
    </div>
  );
};
