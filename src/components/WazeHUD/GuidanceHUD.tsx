import React from 'react';
import { CommunitySpot } from '../../types';
import { NavigationRoute } from '../../services/routingService';
import { calculateDistance, formatDistance, formatElevation, formatDuration } from '../../utils/geoUtils';
import { SearchBar } from './SearchBar';
import {
  X,
  ArrowUp,
  ArrowUpRight,
  ArrowUpLeft,
  CornerUpRight,
  CornerUpLeft,
  Flag,
  Mountain,
  Play,
  Pause,
  MapPin,
  LocateFixed,
} from 'lucide-react';

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
  onSetUserLocation?: (lat: number, lng: number, label: string) => void;
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
  onSetUserLocation,
}) => {
  // 1. Mode Navigation active
  if (activeRoute) {
    // A. Calculer le point le plus proche sur le tracé
    let closestIndex = 0;
    let minDistance = Infinity;
    if (userPosition && activeRoute.points.length > 0) {
      activeRoute.points.forEach((pt, idx) => {
        const d = calculateDistance(userPosition.lat, userPosition.lng, pt.lat, pt.lng);
        if (d < minDistance) {
          minDistance = d;
          closestIndex = idx;
        }
      });
    }

    // B. Déterminer la prochaine manœuvre à venir
    let currentStep = activeRoute.steps[0];
    for (const s of activeRoute.steps) {
      if (s.pointIndex !== undefined && s.pointIndex > closestIndex) {
        currentStep = s;
        break;
      }
    }
    if (!currentStep) {
      currentStep = activeRoute.steps[activeRoute.steps.length - 1] || {
        instruction: `Suivre le sentier vers ${activeRoute.destinationTitle}`,
        distance: activeRoute.distance,
        bearing: 0,
      };
    }

    // C. Distance jusqu'à la prochaine manœuvre
    let distToStep = currentStep.distance;
    if (userPosition && currentStep.lat && currentStep.lng) {
      distToStep = calculateDistance(userPosition.lat, userPosition.lng, currentStep.lat, currentStep.lng);
    }

    // D. Progression globale, distance restante & ETA
    const totalPts = activeRoute.points.length;
    const progressRatio = totalPts > 1 ? closestIndex / (totalPts - 1) : 0;
    const remainingDistance = Math.max(0, Math.round(activeRoute.distance * (1 - progressRatio)));
    const remainingDurationSec = Math.max(0, Math.round(activeRoute.duration * (1 - progressRatio)));
    const etaDate = new Date(Date.now() + remainingDurationSec * 1000);
    const etaFormatted = `${etaDate.getHours().toString().padStart(2, '0')}:${etaDate
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;

    const renderManeuverIcon = () => {
      const type = currentStep.maneuverType;
      if (type === 'right' || type === 'sharp_right') {
        return <CornerUpRight className="w-8 h-8 stroke-[3]" />;
      }
      if (type === 'left' || type === 'sharp_left') {
        return <CornerUpLeft className="w-8 h-8 stroke-[3]" />;
      }
      if (type === 'slight_right') {
        return <ArrowUpRight className="w-8 h-8 stroke-[3]" />;
      }
      if (type === 'slight_left') {
        return <ArrowUpLeft className="w-8 h-8 stroke-[3]" />;
      }
      if (type === 'arrive') {
        return <Flag className="w-8 h-8 stroke-[2.5]" />;
      }
      return <ArrowUp className="w-8 h-8 stroke-[3]" />;
    };

    return (
      <>
        {/* Bandeau Supérieur Waze Turn-by-Turn */}
        <div className="absolute top-4 left-4 right-4 max-w-lg mx-auto z-[950] pointer-events-auto select-none animate-fade-in">
          <div className="bg-slate-900/95 backdrop-blur-2xl border-2 border-emerald-500/70 rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-4 flex items-center justify-between gap-3 bg-gradient-to-r from-emerald-950/90 via-slate-900 to-slate-900">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600 text-white shadow-lg border border-emerald-400 shrink-0">
                {renderManeuverIcon()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-400 mb-0.5">
                  <span>
                    {distToStep < 20
                      ? 'Prendre la bifurcation !'
                      : `Dans ${formatDistance(distToStep)}`}
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="text-emerald-300 flex items-center gap-1">
                    <Mountain className="w-3.5 h-3.5" />
                    {formatElevation(activeRoute.elevationGain)} D+
                  </span>
                </div>

                <div className="text-base font-extrabold text-white truncate leading-tight">
                  {currentStep.instruction}
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
          </div>
        </div>

        {/* Barre Inférieure Cockpit de Navigation Waze */}
        <div className="absolute bottom-20 sm:bottom-24 left-4 right-4 max-w-lg mx-auto z-[950] pointer-events-auto select-none animate-slide-up">
          <div className="bg-slate-900/95 backdrop-blur-2xl border-2 border-slate-700/80 rounded-3xl shadow-float p-3.5 flex items-center justify-between gap-3">
            {/* Arrivée estimée & Distance restante */}
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Arrivée estimée
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-white">{etaFormatted}</span>
                <span className="text-xs font-semibold text-slate-400 truncate">
                  ({formatDuration(Math.round(remainingDurationSec / 60))})
                </span>
              </div>
              <span className="text-xs font-extrabold text-emerald-400 truncate">
                {formatDistance(remainingDistance)} restant
              </span>
            </div>

            {/* Actions Cockpit : Simulation Marche, Recentrer, Arrêter */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={onToggleSimulation}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-xs font-black shadow-md transition-all active:scale-95 ${
                  isSimulating
                    ? 'bg-amber-500 text-slate-950 animate-pulse ring-2 ring-amber-300/50'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400/40'
                }`}
                title={isSimulating ? 'Pause simulation' : 'Marcher en direct sur le sentier'}
              >
                {isSimulating ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current" />
                )}
                <span>{isSimulating ? 'Pause' : 'Marcher'}</span>
              </button>

              <button
                onClick={onRecenter}
                className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 transition-colors active:scale-95"
                title="Recentrer sur ma position"
              >
                <LocateFixed className="w-4 h-4" />
              </button>

              <button
                onClick={onStopNavigation}
                className="px-3.5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-lg flex items-center gap-1.5 transition-all active:scale-95 border border-rose-400/40"
                title="Arrêter la randonnée"
              >
                <X className="w-4 h-4 stroke-[3]" />
                <span className="hidden sm:inline">ARRÊTER</span>
              </button>
            </div>
          </div>
        </div>
      </>
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
        onSetUserLocation={onSetUserLocation}
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
