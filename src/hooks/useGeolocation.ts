import { useState, useEffect, useCallback, useRef } from 'react';

export interface UserLocation {
  lat: number;
  lng: number;
  altitude: number | null; // en mètres
  accuracy: number; // en mètres
  speed: number | null; // en km/h
  heading: number | null; // en degrés (0-360)
  timestamp: number;
  city?: string;
}

// Coordonnées par défaut : Limoges (Haute-Vienne)
const LIMOGES_COORDS = { lat: 45.8336, lng: 1.2611, altitude: 280, city: 'Limoges' };

export function useGeolocation(initialCoords?: { lat: number; lng: number }) {
  const [location, setLocation] = useState<UserLocation>(() => {
    return {
      lat: initialCoords?.lat || LIMOGES_COORDS.lat,
      lng: initialCoords?.lng || LIMOGES_COORDS.lng,
      altitude: LIMOGES_COORDS.altitude,
      accuracy: 10,
      speed: 0,
      heading: 0,
      timestamp: Date.now(),
      city: 'Limoges',
    };
  });

  const [error, setError] = useState<string | null>(null);
  const [isLiveGps, setIsLiveGps] = useState<boolean>(false);
  const [isFollowing, setIsFollowing] = useState<boolean>(true); // Mode "Suis-moi" Waze
  const watchIdRef = useRef<number | null>(null);
  const lastLocationRef = useRef<UserLocation | null>(null);

  // 1. Détection rapide de la ville par IP (instantané pour situer Limoges avant même l'autorisation GPS)
  useEffect(() => {
    let isMounted = true;
    fetch('https://get.geojs.io/v1/ip/geo.json')
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted || !data.latitude || !data.longitude) return;
        const ipLat = parseFloat(data.latitude);
        const ipLng = parseFloat(data.longitude);
        const cityName = data.city || 'Limoges';

        // Mettre à jour si le GPS matériel n'a pas encore répondu
        setLocation((prev) => {
          if (isLiveGps) return prev; // Ne pas écraser un vrai GPS matériel
          return {
            ...prev,
            lat: ipLat,
            lng: ipLng,
            city: cityName,
          };
        });
      })
      .catch(() => {
        // En cas d'erreur réseau, Limoges reste la référence par défaut
      });

    return () => {
      isMounted = false;
    };
  }, [isLiveGps]);

  // 2. Démarrer l'écoute GPS en direct haute précision
  const startTracking = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setError('La géolocalisation n\'est pas supportée par votre navigateur.');
      return;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    const successHandler = (position: GeolocationPosition) => {
      const { latitude, longitude, altitude, accuracy, speed, heading } = position.coords;

      let computedHeading = heading;
      if (computedHeading === null && lastLocationRef.current) {
        const dLat = latitude - lastLocationRef.current.lat;
        const dLng = longitude - lastLocationRef.current.lng;
        if (Math.abs(dLat) > 0.00005 || Math.abs(dLng) > 0.00005) {
          computedHeading = ((Math.atan2(dLng, dLat) * 180) / Math.PI + 360) % 360;
        } else {
          computedHeading = lastLocationRef.current.heading;
        }
      }

      const speedKmH = speed !== null ? Math.round(speed * 3.6 * 10) / 10 : 0;

      const newLoc: UserLocation = {
        lat: latitude,
        lng: longitude,
        altitude: altitude !== null ? Math.round(altitude) : 280,
        accuracy: Math.round(accuracy),
        speed: speedKmH,
        heading: computedHeading !== null ? Math.round(computedHeading) : 0,
        timestamp: position.timestamp,
        city: 'Position GPS Réelle',
      };

      lastLocationRef.current = newLoc;
      setLocation(newLoc);
      setIsLiveGps(true);
      setError(null);
    };

    const errorHandler = (err: GeolocationPositionError) => {
      let msg = 'Position GPS en attente...';
      switch (err.code) {
        case err.PERMISSION_DENIED:
          msg = 'Autorisation GPS refusée par le navigateur. Position centrée sur Limoges.';
          break;
        case err.POSITION_UNAVAILABLE:
          msg = 'Signal GPS temporairement indisponible.';
          break;
        case err.TIMEOUT:
          msg = 'Délai d\'attente GPS dépassé.';
          break;
      }
      setError(msg);
      setIsLiveGps(false);
    };

    // Obtenir une première position immédiatement
    navigator.geolocation.getCurrentPosition(successHandler, errorHandler, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });

    // Puis surveiller en continu
    watchIdRef.current = navigator.geolocation.watchPosition(
      successHandler,
      errorHandler,
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 1000,
      }
    );
  }, []);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  useEffect(() => {
    startTracking();
    return () => stopTracking();
  }, [startTracking, stopTracking]);

  return {
    location,
    isLiveGps,
    error,
    isFollowing,
    setIsFollowing,
    startTracking,
  };
}
