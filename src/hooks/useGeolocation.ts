import { useState, useEffect, useCallback, useRef } from 'react';
import { calculateBearing } from '../utils/geoUtils';

export interface UserLocation {
  lat: number;
  lng: number;
  altitude: number; // en mètres
  accuracy: number; // en mètres
  speed: number; // en km/h
  heading: number; // en degrés (0-360)
  timestamp: number;
  source: 'gps' | 'ip' | 'simulated' | 'manual';
  label: string;
}

// Coordonnées par défaut : Limoges (Pont Saint-Étienne - Départ Sentier)
const LIMOGES_COORDS = { lat: 45.8285, lng: 1.2672, altitude: 235, label: 'Limoges (Pont Saint-Étienne)' };

export function useGeolocation() {
  const [location, setLocation] = useState<UserLocation>({
    lat: LIMOGES_COORDS.lat,
    lng: LIMOGES_COORDS.lng,
    altitude: LIMOGES_COORDS.altitude,
    accuracy: 10,
    speed: 0,
    heading: 0,
    timestamp: Date.now(),
    source: 'ip',
    label: 'Limoges (Pont Saint-Étienne)',
  });

  const [isFollowing, setIsFollowing] = useState<boolean>(true); // Suivi caméra Waze
  const [isSimulating, setIsSimulating] = useState<boolean>(false); // Simulation de marche
  const [simulationRoute, setSimulationRoute] = useState<{ lat: number; lng: number; elevation?: number }[] | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const simIntervalRef = useRef<any>(null);
  const simRouteIndexRef = useRef<number>(0);
  const lastLocationRef = useRef<UserLocation>(location);

  // 1. Récupération instantanée par IP (place l'utilisateur directement à Limoges/Nouvelle-Aquitaine)
  useEffect(() => {
    let isMounted = true;
    fetch('https://get.geojs.io/v1/ip/geo.json')
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.latitude && data.longitude) {
          const lat = parseFloat(data.latitude);
          const lng = parseFloat(data.longitude);
          const city = data.city || 'Limoges';

          // Si l'IP détectée est dans le secteur de Limoges / Agglo (Limoges, Panazol, Couzeix, etc.)
          // On place l'utilisateur au départ officiel du sentier Pont Saint-Étienne
          const isLimogesArea =
            city.toLowerCase().includes('limoges') ||
            city.toLowerCase().includes('panazol') ||
            (Math.abs(lat - 45.83) < 0.15 && Math.abs(lng - 1.26) < 0.15);

          const finalLat = isLimogesArea ? LIMOGES_COORDS.lat : lat;
          const finalLng = isLimogesArea ? LIMOGES_COORDS.lng : lng;

          setLocation((prev) => {
            if (prev.source === 'gps') return prev; // Ne pas écraser un vrai GPS actif
            const updated: UserLocation = {
              ...prev,
              lat: finalLat,
              lng: finalLng,
              source: 'ip',
              label: isLimogesArea ? 'Limoges (Pont Saint-Étienne)' : `${city} (Détecté)`,
            };
            lastLocationRef.current = updated;
            return updated;
          });
        }
      })
      .catch(() => {
        // Reste sur Limoges par défaut
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // 1b. Écoute de la boussole mobile (Device Orientation / Compass)
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      const compassHeading = (e as any).webkitCompassHeading;
      let angle: number | null = null;
      if (typeof compassHeading === 'number' && !isNaN(compassHeading)) {
        angle = compassHeading;
      } else if (e.alpha !== null && !isNaN(e.alpha)) {
        angle = (360 - e.alpha) % 360;
      }
      if (angle !== null) {
        setLocation((prev) => {
          if (prev.speed < 1.5) {
            const updated = { ...prev, heading: Math.round(angle!) };
            lastLocationRef.current = updated;
            return updated;
          }
          return prev;
        });
      }
    };

    if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
      window.addEventListener('deviceorientation', handleOrientation, true);
    }
    return () => {
      if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
        window.removeEventListener('deviceorientation', handleOrientation, true);
      }
    };
  }, []);

  // 2. Écoute du GPS matériel avec stratégie double-palier (Haute précision puis Basse précision)
  const startGpsTracking = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setErrorNotice('La géolocalisation n\'est pas supportée par ce navigateur.');
      return;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    const handleSuccess = (position: GeolocationPosition) => {
      const { latitude, longitude, altitude, accuracy, speed, heading } = position.coords;

      let computedHeading = heading;
      if (computedHeading === null || isNaN(computedHeading)) {
        const prev = lastLocationRef.current;
        const dLat = latitude - prev.lat;
        const dLng = longitude - prev.lng;
        if (Math.abs(dLat) > 0.00002 || Math.abs(dLng) > 0.00002) {
          computedHeading = ((Math.atan2(dLng, dLat) * 180) / Math.PI + 360) % 360;
        } else {
          computedHeading = prev.heading;
        }
      }

      const speedKmH = speed !== null && !isNaN(speed) ? Math.round(speed * 3.6 * 10) / 10 : 0;
      const elev = altitude !== null && !isNaN(altitude) ? Math.round(altitude) : 250;

      const newLoc: UserLocation = {
        lat: latitude,
        lng: longitude,
        altitude: elev,
        accuracy: Math.round(accuracy || 10),
        speed: speedKmH,
        heading: Math.round(computedHeading || 0),
        timestamp: position.timestamp,
        source: 'gps',
        label: 'GPS Réel Connecté',
      };

      lastLocationRef.current = newLoc;
      setLocation(newLoc);
      setErrorNotice(null);
    };

    // Palier 1 : Tenter en haute précision (pour smartphones & GPS réels)
    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      (err) => {
        console.warn('GPS haute précision indisponible, passage en mode standard:', err.message);
        // Palier 2 : Tenter en mode standard / Wi-Fi (fonctionne sur 100% des ordinateurs portables Mac/Windows)
        navigator.geolocation.getCurrentPosition(
          handleSuccess,
          (err2) => {
            console.warn('GPS matériel non disponible, positionnement Limoges conservé:', err2.message);
            setErrorNotice('GPS matériel en attente d\'autorisation. Vous êtes positionné à Limoges.');
          },
          { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
        );
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );

    // Écoute continue en direct
    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      () => {},
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 2000 }
    );
  }, []);

  // 3. Mode Simulation de Randonnée (Marche active le long d'un tracé ou sur sentier sinueux)
  const toggleSimulation = useCallback(() => {
    setIsSimulating((prev) => !prev);
  }, []);

  const resetSimulationProgress = useCallback((index = 0) => {
    simRouteIndexRef.current = index;
  }, []);

  useEffect(() => {
    if (isSimulating) {
      // Cas A : Suivre pas à pas le tracé officiel de la randonnée active
      if (simulationRoute && simulationRoute.length > 1) {
        simIntervalRef.current = setInterval(() => {
          let nextIdx = simRouteIndexRef.current + 1;
          if (nextIdx >= simulationRoute.length) {
            nextIdx = 0; // Boucle
          }
          simRouteIndexRef.current = nextIdx;

          const currPt = simulationRoute[nextIdx];
          const forwardPt = simulationRoute[Math.min(nextIdx + 1, simulationRoute.length - 1)];
          const stepAngle = calculateBearing(currPt.lat, currPt.lng, forwardPt.lat, forwardPt.lng);

          const updated: UserLocation = {
            lat: currPt.lat,
            lng: currPt.lng,
            altitude: Math.round(currPt.elevation || 240),
            accuracy: 5,
            speed: 4.8, // 4.8 km/h vitesse de marche
            heading: Math.round(stepAngle),
            timestamp: Date.now(),
            source: 'simulated',
            label: 'Navigation en direct (Simulation 4.8 km/h)',
          };
          lastLocationRef.current = updated;
          setLocation(updated);
        }, 1000);
      } else {
        // Cas B : Simulation libre (sentier sinueux)
        let stepAngle = lastLocationRef.current.heading || 45;
        simIntervalRef.current = setInterval(() => {
          setLocation((current) => {
            stepAngle = (stepAngle + (Math.random() - 0.5) * 15 + 360) % 360;
            const rad = (stepAngle * Math.PI) / 180;
            const distDeltaDeg = 0.000045; // ~5 mètres

            const nextLat = current.lat + Math.cos(rad) * distDeltaDeg;
            const nextLng = current.lng + Math.sin(rad) * distDeltaDeg * 1.4;
            const nextAlt = current.altitude + (Math.random() - 0.45) * 2;

            const updated: UserLocation = {
              lat: nextLat,
              lng: nextLng,
              altitude: Math.round(nextAlt),
              accuracy: 5,
              speed: 4.8,
              heading: Math.round(stepAngle),
              timestamp: Date.now(),
              source: 'simulated',
              label: 'Simulation de marche (4.8 km/h)',
            };
            lastLocationRef.current = updated;
            return updated;
          });
        }, 1000);
      }
    } else {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    }

    return () => {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    };
  }, [isSimulating, simulationRoute]);

  // 4. Définition manuelle de la position (Clic sur la carte ou départ rando)
  const setManualPosition = useCallback((lat: number, lng: number, label: string = 'Position choisie', heading?: number) => {
    setIsSimulating(false);
    setLocation((prev) => {
      const updated: UserLocation = {
        ...prev,
        lat,
        lng,
        speed: 0,
        heading: heading !== undefined ? heading : prev.heading,
        source: 'manual',
        label,
        timestamp: Date.now(),
      };
      lastLocationRef.current = updated;
      return updated;
    });
  }, []);

  useEffect(() => {
    startGpsTracking();
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [startGpsTracking]);

  return {
    location,
    isFollowing,
    setIsFollowing,
    isSimulating,
    toggleSimulation,
    setManualPosition,
    startGpsTracking,
    setSimulationRoute,
    resetSimulationProgress,
    errorNotice,
  };
}
