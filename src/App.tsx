import React, { useState, useEffect, useMemo } from 'react';
import { Trail, CommunitySpot, MapTileLayer, SpotCategory, ElevationPoint, UserAvatarId } from './types';
import { MOCK_TRAILS, INITIAL_COMMUNITY_SPOTS } from './data/mockTrails';
import { useGeolocation } from './hooks/useGeolocation';
import { calculatePedestrianRoute, createNavigationRouteFromTrail, NavigationRoute } from './services/routingService';
import { calculateBearing, calculateDistance } from './utils/geoUtils';
import { TrailMap } from './components/Map/TrailMap';
import { ElevationProfile } from './components/Elevation/ElevationProfile';
import { GuidanceHUD } from './components/WazeHUD/GuidanceHUD';
import { WazeSpeedometer } from './components/WazeHUD/WazeSpeedometer';
import { TrailLaunchCard } from './components/Navigation/TrailLaunchCard';
import { ReportModal } from './components/Modals/ReportModal';
import { SpotDetailsModal } from './components/Modals/SpotDetailsModal';
import { TrailSelector } from './components/Sidebar/TrailSelector';
import { TrailPlannerModal } from './components/Studio/TrailPlannerModal';
import { UserAccountModal } from './components/Account/UserAccountModal';
import { AvatarSelectorModal } from './components/Modals/AvatarSelectorModal';
import { Menu, PlusCircle, LocateFixed, Monitor, User } from 'lucide-react';

export const App: React.FC = () => {
  // 1. Sentiers disponibles
  const [trails, setTrails] = useState<Trail[]>(() => {
    const saved = localStorage.getItem('wazerando_custom_trails');
    if (saved) {
      try {
        const custom = JSON.parse(saved);
        return [...MOCK_TRAILS, ...custom];
      } catch (e) {
        console.error(e);
      }
    }
    return MOCK_TRAILS;
  });

  const [selectedTrailId, setSelectedTrailId] = useState<string>(MOCK_TRAILS[0].id);
  const activeTrail = useMemo(() => {
    return trails.find((t) => t.id === selectedTrailId) || trails[0];
  }, [trails, selectedTrailId]);

  // 2. Géolocalisation Réelle & Simulation
  const {
    location: userLocation,
    isFollowing,
    setIsFollowing,
    isSimulating,
    toggleSimulation,
    setManualPosition,
    startGpsTracking,
    setSimulationRoute,
    resetSimulationProgress,
  } = useGeolocation();

  const [isClickToMoveMode, setIsClickToMoveMode] = useState<boolean>(false);
  const [recenterCount, setRecenterCount] = useState<number>(0);

  // 3. Spots communautaires Waze
  const [spots, setSpots] = useState<CommunitySpot[]>(() => {
    const saved = localStorage.getItem('wazerando_spots');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_COMMUNITY_SPOTS;
  });

  useEffect(() => {
    localStorage.setItem('wazerando_spots', JSON.stringify(spots));
  }, [spots]);

  // 4. Fond de carte & Filtres
  const [activeLayer, setActiveLayer] = useState<MapTileLayer>('outdoors');
  const [selectedCategories, setSelectedCategories] = useState<SpotCategory[]>([
    'viewpoint',
    'hazard',
    'water',
    'bivouac',
    'picnic',
    'fauna',
    'shelter',
  ]);

  const filteredSpots = useMemo(() => {
    return spots.filter((s) => selectedCategories.includes(s.category));
  }, [spots, selectedCategories]);

  // 5. Navigation & Guidage Waze (Démarrer la rando / Navigation vers un spot)
  const [activeRoute, setActiveRoute] = useState<NavigationRoute | null>(null);
  const [isRoutingLoading, setIsRoutingLoading] = useState<boolean>(false);

  // Lancement officiel d'une randonnée (Bouton Démarrer la rando GO)
  const handleStartTrailNavigation = (trailToStart: Trail) => {
    setSelectedTrailId(trailToStart.id);
    const navRoute = createNavigationRouteFromTrail(trailToStart);
    setActiveRoute(navRoute);

    // Si le randonneur est distant du point de départ (> 120m), on le cale directement au départ
    if (trailToStart.points.length > 0) {
      const startPt = trailToStart.points[0];
      const secondPt = trailToStart.points.length > 1 ? trailToStart.points[1] : startPt;
      const distToStart = calculateDistance(userLocation.lat, userLocation.lng, startPt.lat, startPt.lng);
      const initialBearing = calculateBearing(startPt.lat, startPt.lng, secondPt.lat, secondPt.lng);

      if (distToStart > 120) {
        setManualPosition(
          startPt.lat,
          startPt.lng,
          `Départ : ${trailToStart.name}`,
          Math.round(initialBearing)
        );
      }
    }

    // Connecter le parcours à la simulation de marche
    setSimulationRoute(trailToStart.points);
    resetSimulationProgress(0);

    // Activer le mode suivi cockpit immédiat (zoom 19.2)
    setIsFollowing(true);
    setRecenterCount((c) => c + 1);
  };

  const handleStartNavigationToSpot = async (spot: CommunitySpot) => {
    if (!userLocation) return;
    setIsRoutingLoading(true);
    try {
      const route = await calculatePedestrianRoute(
        userLocation.lat,
        userLocation.lng,
        spot.lat,
        spot.lng,
        spot.title,
        userLocation.altitude || 250,
        spot.elevation
      );
      setActiveRoute(route);
      setSimulationRoute(route.points);
      resetSimulationProgress(0);
      setIsFollowing(true);
      setRecenterCount((c) => c + 1);
    } catch (err) {
      console.error('Erreur de calcul d\'itinéraire:', err);
    } finally {
      setIsRoutingLoading(false);
    }
  };

  const handleStopNavigation = () => {
    setActiveRoute(null);
    setSimulationRoute(null);
  };

  // 6. Profil Altimétrique Actif
  const activeElevationTrail: Trail = useMemo(() => {
    if (activeRoute && activeRoute.points.length > 0) {
      return {
        id: 'active-nav-route',
        name: `Itinéraire vers ${activeRoute.destinationTitle}`,
        region: 'Navigation en direct',
        difficulty: 'moyen',
        totalDistance: activeRoute.distance,
        elevationGain: activeRoute.elevationGain,
        elevationLoss: activeRoute.elevationLoss,
        maxElevation: activeRoute.maxElevation,
        minElevation: activeRoute.minElevation,
        estimatedDuration: Math.round(activeRoute.duration / 60),
        points: activeRoute.points,
        initialCenter: [userLocation.lat, userLocation.lng],
        initialZoom: 15,
        description: 'Calcul d\'itinéraire Waze',
      };
    }
    return activeTrail;
  }, [activeRoute, activeTrail, userLocation]);

  const [hoveredPoint, setHoveredPoint] = useState<ElevationPoint | null>(null);

  // 7. Modales
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isStudioOpen, setIsStudioOpen] = useState<boolean>(false);
  const [isAccountOpen, setIsAccountOpen] = useState<boolean>(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState<boolean>(false);
  const [userAvatar, setUserAvatar] = useState<UserAvatarId>(() => {
    const saved = localStorage.getItem('wazerando_user_avatar');
    return (saved as UserAvatarId) || 'hiker';
  });

  const handleSelectAvatar = (newAvatar: UserAvatarId) => {
    setUserAvatar(newAvatar);
    localStorage.setItem('wazerando_user_avatar', newAvatar);
  };

  const [selectedSpot, setSelectedSpot] = useState<CommunitySpot | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isReportingMode, setIsReportingMode] = useState<boolean>(false);
  const [clickedCoords, setClickedCoords] = useState<{ lat: number; lng: number } | null>(null);

  const handleVote = (spotId: string, direction: 'up' | 'down') => {
    setSpots((prev) =>
      prev.map((s) => {
        if (s.id !== spotId) return s;
        if (s.userVoted === direction) {
          return {
            ...s,
            upvotes: direction === 'up' ? s.upvotes - 1 : s.upvotes,
            downvotes: direction === 'down' ? s.downvotes - 1 : s.downvotes,
            userVoted: undefined,
          };
        }
        const upDiff = direction === 'up' ? 1 : s.userVoted === 'up' ? -1 : 0;
        const downDiff = direction === 'down' ? 1 : s.userVoted === 'down' ? -1 : 0;
        return {
          ...s,
          upvotes: Math.max(0, s.upvotes + upDiff),
          downvotes: Math.max(0, s.downvotes + downDiff),
          userVoted: direction,
        };
      })
    );
  };

  const handleVerify = (spotId: string) => {
    setSpots((prev) =>
      prev.map((s) =>
        s.id === spotId
          ? { ...s, verifiedCount: s.verifiedCount + 1, lastVerifiedAt: 'À l\'instant' }
          : s
      )
    );
  };

  const handleAddComment = (spotId: string, text: string) => {
    const newComm = {
      id: `comm-${Date.now()}`,
      author: 'Vous',
      text,
      createdAt: 'À l\'instant',
    };
    setSpots((prev) =>
      prev.map((s) =>
        s.id === spotId ? { ...s, comments: [...(s.comments || []), newComm] } : s
      )
    );
  };

  const handleCreateReport = (
    newSpotData: Omit<CommunitySpot, 'id' | 'createdAt' | 'upvotes' | 'downvotes' | 'verifiedCount'>
  ) => {
    const newSpot: CommunitySpot = {
      ...newSpotData,
      id: `spot-${Date.now()}`,
      trailId: activeTrail.id,
      createdAt: 'À l\'instant',
      upvotes: 1,
      downvotes: 0,
      verifiedCount: 1,
      lastVerifiedAt: 'À l\'instant',
    };

    setSpots((prev) => [newSpot, ...prev]);
    setIsReportingMode(false);
    setClickedCoords(null);
  };

  const handleImportGpx = (newTrail: Trail) => {
    setTrails((prev) => {
      const updated = [newTrail, ...prev];
      const customOnly = updated.filter(
        (t) => !MOCK_TRAILS.some((m) => m.id === t.id)
      );
      localStorage.setItem('wazerando_custom_trails', JSON.stringify(customOnly));
      return updated;
    });
    setSelectedTrailId(newTrail.id);
    setActiveRoute(null);
  };

  const handleSavePlannedTrail = (newTrail: Trail) => {
    setTrails((prev) => {
      const updated = [newTrail, ...prev];
      const customOnly = updated.filter(
        (t) => !MOCK_TRAILS.some((m) => m.id === t.id)
      );
      localStorage.setItem('wazerando_custom_trails', JSON.stringify(customOnly));
      return updated;
    });
    setSelectedTrailId(newTrail.id);
    setActiveRoute(null);
  };

  const handleDeleteSavedTrail = (trailId: string) => {
    setTrails((prev) => {
      const updated = prev.filter((t) => t.id !== trailId);
      const customOnly = updated.filter(
        (t) => !MOCK_TRAILS.some((m) => m.id === t.id)
      );
      localStorage.setItem('wazerando_custom_trails', JSON.stringify(customOnly));
      return updated;
    });
    if (selectedTrailId === trailId) {
      setSelectedTrailId(MOCK_TRAILS[0].id);
      setActiveRoute(null);
    }
  };

  const savedTrails = useMemo(() => {
    return trails.filter((t) => !MOCK_TRAILS.some((m) => m.id === t.id));
  }, [trails]);

  const handleToggleCategory = (cat: SpotCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  // Clic carte : Téléportation GPS ou Signalement
  const handleMapClick = (lat: number, lng: number) => {
    if (isClickToMoveMode) {
      setManualPosition(lat, lng, 'Position manuelle');
      setIsClickToMoveMode(false);
      setIsFollowing(true);
      return;
    }

    if (isReportingMode) {
      setClickedCoords({ lat, lng });
      setIsReportModalOpen(true);
      setIsReportingMode(false);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col bg-slate-950">
      {/* 1. Guidage Waze HUD & Barre GPS */}
      <GuidanceHUD
        userPosition={userLocation}
        spots={filteredSpots}
        activeRoute={activeRoute}
        onStopNavigation={handleStopNavigation}
        onNavigateToSpot={handleStartNavigationToSpot}
        onSelectSpot={(spot) => setSelectedSpot(spot)}
        isSimulating={isSimulating}
        onToggleSimulation={toggleSimulation}
        onRecenter={() => {
          setIsFollowing(true);
          setRecenterCount((c) => c + 1);
          startGpsTracking();
        }}
        isClickToMoveMode={isClickToMoveMode}
        onToggleClickToMove={() => setIsClickToMoveMode(!isClickToMoveMode)}
        onSetUserLocation={(lat, lng, label) => {
          setManualPosition(lat, lng, label);
          setIsFollowing(true);
          setRecenterCount((c) => c + 1);
        }}
      />

      {/* 2. Boutons d'accès rapide flottants sur la carte */}
      <div className="absolute top-4 left-4 z-[960] flex flex-col gap-2">
        <button
          onClick={() => setIsMenuOpen(true)}
          className="w-11 h-11 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-white flex items-center justify-center shadow-hud border border-slate-700/80 transition-transform active:scale-95"
          title="Menu et randonnées"
        >
          <Menu className="w-5 h-5 text-emerald-400" />
        </button>
      </div>

      <div className="absolute top-4 right-4 z-[960] flex items-center gap-2">
        <button
          onClick={() => setIsStudioOpen(true)}
          className="h-11 px-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-white flex items-center gap-2 shadow-hud border border-slate-700/80 transition-transform active:scale-95"
          title="Studio de préparation PC"
        >
          <Monitor className="w-4 h-4 text-sky-400" />
          <span className="hidden sm:inline text-xs font-bold text-slate-200">Studio PC</span>
        </button>

        <button
          onClick={() => setIsAccountOpen(true)}
          className="h-11 px-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-white flex items-center gap-2 shadow-hud border border-slate-700/80 transition-transform active:scale-95"
          title="Mon Compte Randonneur"
        >
          <User className="w-4 h-4 text-emerald-400" />
          <span className="hidden sm:inline text-xs font-bold text-slate-200">Mon Compte</span>
        </button>

        <button
          onClick={() => {
            setIsFollowing(true);
            setRecenterCount((c) => c + 1);
            startGpsTracking();
          }}
          className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-hud border transition-all active:scale-95 ${
            isFollowing
              ? 'bg-sky-500 border-sky-300 text-white'
              : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border-slate-700/80'
          }`}
          title="Recentrer sur mon GPS"
        >
          <LocateFixed className="w-5 h-5" />
        </button>
      </div>

      {/* 3. Carte Interactive Principale */}
      <div className="flex-1 min-h-0 w-full h-full relative">
        <TrailMap
          trail={activeTrail}
          spots={filteredSpots}
          activeLayer={activeLayer}
          userPosition={userLocation}
          userAvatar={userAvatar}
          onOpenAvatarSelector={() => setIsAvatarModalOpen(true)}
          hoveredPoint={hoveredPoint}
          activeRoute={activeRoute}
          isFollowing={isFollowing}
          onSetIsFollowing={setIsFollowing}
          onSelectSpot={(spot) => setSelectedSpot(spot)}
          onMapClick={handleMapClick}
          isReportingMode={isReportingMode}
          recenterTrigger={recenterCount}
        />

        {/* Compteur Waze (Vitesse km/h + Altitude m) */}
        <WazeSpeedometer
          speed={userLocation.speed}
          altitude={userLocation.altitude}
          heading={userLocation.heading}
          accuracy={userLocation.accuracy}
        />

        {/* Bouton Waze Flottant : SIGNALER */}
        <div className="absolute bottom-24 right-4 z-[900] flex flex-col items-end gap-2.5">
          {isReportingMode ? (
            <button
              onClick={() => setIsReportingMode(false)}
              className="px-4 py-2.5 rounded-full bg-slate-900 text-white border border-slate-700 text-xs font-bold shadow-xl"
            >
              Annuler le pointage
            </button>
          ) : (
            <button
              onClick={() => {
                setClickedCoords(null);
                setIsReportModalOpen(true);
              }}
              className="flex items-center gap-2.5 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-black text-sm shadow-float border-2 border-white/60 transition-transform active:scale-95"
              title="Signaler un spot ou une alerte sur le sentier"
            >
              <PlusCircle className="w-5 h-5 stroke-[2.5]" />
              <span>SIGNALER</span>
            </button>
          )}
        </div>

        {/* Indicateur de calcul d'itinéraire */}
        {isRoutingLoading && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900/90 backdrop-blur px-4 py-2 rounded-full border border-sky-400 text-xs font-bold text-sky-300 shadow-xl flex items-center gap-2">
            <span className="w-3 h-3 rounded-full border-2 border-sky-400 border-t-transparent animate-spin"></span>
            <span>Calcul du meilleur sentier...</span>
          </div>
        )}
      </div>

      {/* 4. Carte Flottante de Lancement Waze (DÉMARRER LA RANDO GO) */}
      {!activeRoute && activeTrail && (
        <TrailLaunchCard
          trail={activeTrail}
          userPosition={userLocation}
          onStartNavigation={handleStartTrailNavigation}
          onOpenTrailMenu={() => setIsMenuOpen(true)}
        />
      )}

      {/* 5. Profil Altimétrique Dynamique & Dénivelé */}
      <ElevationProfile
        trail={activeElevationTrail}
        spots={filteredSpots}
        hoveredPoint={hoveredPoint}
        onHoverPoint={setHoveredPoint}
        onSelectSpot={(spot) => setSelectedSpot(spot)}
      />

      {/* 6. Modale de Signalement Waze */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmit={handleCreateReport}
        currentPosition={userLocation}
        clickedPosition={clickedCoords}
        currentElevation={userLocation.altitude}
      />

      {/* 7. Modale de Détails d'un Spot */}
      <SpotDetailsModal
        spot={selectedSpot}
        onClose={() => setSelectedSpot(null)}
        onVote={handleVote}
        onVerify={handleVerify}
        onAddComment={handleAddComment}
        userPosition={userLocation}
      />

      {/* 8. Volet Latéral Sélecteur de Rando & Calques */}
      <TrailSelector
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        trails={trails}
        selectedTrailId={selectedTrailId}
        onSelectTrail={(id) => {
          setSelectedTrailId(id);
          setActiveRoute(null);
        }}
        onStartTrail={handleStartTrailNavigation}
        onImportGpx={handleImportGpx}
        activeLayer={activeLayer}
        onChangeLayer={setActiveLayer}
        selectedCategories={selectedCategories}
        onToggleCategory={handleToggleCategory}
        onOpenStudio={() => setIsStudioOpen(true)}
        onOpenAccount={() => setIsAccountOpen(true)}
      />

      {/* 9. Studio PC de Préparation de Randonnée */}
      <TrailPlannerModal
        isOpen={isStudioOpen}
        onClose={() => setIsStudioOpen(false)}
        onSaveTrail={handleSavePlannedTrail}
        userCoords={userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : null}
      />

      {/* 10. Modale Compte Utilisateur & Sync Cloud */}
      <UserAccountModal
        isOpen={isAccountOpen}
        onClose={() => setIsAccountOpen(false)}
        savedTrails={savedTrails}
        onSelectTrail={(trailId) => {
          setSelectedTrailId(trailId);
          setActiveRoute(null);
        }}
        onStartTrail={handleStartTrailNavigation}
        onDeleteSavedTrail={handleDeleteSavedTrail}
        userAvatar={userAvatar}
        onOpenAvatarSelector={() => setIsAvatarModalOpen(true)}
      />

      {/* 10. Modale Choix du Personnage / Flèche Waze */}
      <AvatarSelectorModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        selectedAvatar={userAvatar}
        onSelectAvatar={handleSelectAvatar}
        currentHeading={userLocation?.heading}
        currentSpeed={userLocation?.speed}
      />
    </div>
  );
};

export default App;
