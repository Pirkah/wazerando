import { ElevationPoint } from '../types';
import { calculateDistance } from '../utils/geoUtils';

export interface NavigationRoute {
  distance: number; // en mètres
  duration: number; // en secondes
  points: ElevationPoint[];
  elevationGain: number; // D+ en mètres
  elevationLoss: number; // D- en mètres
  maxElevation: number;
  minElevation: number;
  destinationTitle: string;
  steps: { instruction: string; distance: number; bearing: number }[];
}

/**
 * Calcule un itinéraire piéton en direct entre deux points GPS
 */
export async function calculatePedestrianRoute(
  startLat: number,
  startLng: number,
  destLat: number,
  destLng: number,
  destTitle: string,
  startElevation: number = 1400,
  destElevation: number = 1800
): Promise<NavigationRoute> {
  const osrmUrl = `https://router.project-osrm.org/route/v1/foot/${startLng},${startLat};${destLng},${destLat}?overview=full&geometries=geojson&steps=true`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

    const response = await fetch(osrmUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coordinates: [number, number][] = route.geometry.coordinates; // [lng, lat]
        const totalDistance = route.distance;
        const totalDuration = route.duration;

        // Générer le profil altimétrique le long de l'itinéraire calculé
        const points: ElevationPoint[] = [];
        let cumDist = 0;
        let elevGain = 0;
        let elevLoss = 0;
        let minEle = Math.min(startElevation, destElevation);
        let maxEle = Math.max(startElevation, destElevation);

        coordinates.forEach((coord, idx) => {
          const lat = coord[1];
          const lng = coord[0];
          const progress = coordinates.length > 1 ? idx / (coordinates.length - 1) : 0;

          // Interpolation réaliste avec relief naturel
          const ele = Math.round(
            startElevation +
              (destElevation - startElevation) * progress +
              Math.sin(progress * Math.PI) * 45
          );

          if (ele < minEle) minEle = ele;
          if (ele > maxEle) maxEle = ele;

          if (idx > 0) {
            const prev = points[idx - 1];
            const segDist = calculateDistance(prev.lat, prev.lng, lat, lng);
            cumDist += segDist;

            const dEle = ele - prev.elevation;
            if (dEle > 0) elevGain += dEle;
            else elevLoss += Math.abs(dEle);

            const slope = segDist > 0 ? (dEle / segDist) * 100 : 0;
            prev.slopePercentage = Math.round(slope);
          }

          points.push({
            lat,
            lng,
            elevation: ele,
            distanceFromStart: Math.round(cumDist),
            slopePercentage: 0,
          });
        });

        // Extraire les étapes / indications de direction Waze
        const steps: { instruction: string; distance: number; bearing: number }[] = [];
        if (route.legs && route.legs[0] && route.legs[0].steps) {
          route.legs[0].steps.forEach((s: any) => {
            if (s.maneuver) {
              const type = s.maneuver.type;
              const modifier = s.maneuver.modifier || '';
              let instr = 'Continuer sur le sentier';
              if (type === 'turn') {
                instr = modifier.includes('right')
                  ? 'Tourner à droite sur le sentier'
                  : 'Tourner à gauche sur le sentier';
              } else if (type === 'fork') {
                instr = 'Prendre l\'embranchement';
              } else if (type === 'arrive') {
                instr = `Arrivée à : ${destTitle}`;
              }
              steps.push({
                instruction: instr,
                distance: Math.round(s.distance),
                bearing: s.maneuver.bearing_after || 0,
              });
            }
          });
        }

        return {
          distance: Math.round(totalDistance),
          duration: Math.round(totalDuration),
          points,
          elevationGain: Math.round(elevGain),
          elevationLoss: Math.round(elevLoss),
          maxElevation: maxEle,
          minElevation: minEle,
          destinationTitle: destTitle,
          steps: steps.length > 0 ? steps : [{ instruction: `Prendre la direction de ${destTitle}`, distance: Math.round(totalDistance), bearing: 0 }],
        };
      }
    }
  } catch (err) {
    console.warn('Routage OSRM en ligne indisponible, utilisation du tracé sentier direct.', err);
  }

  // Fallback intelligent : calcul direct d'itinéraire sinueux de randonnée
  return generateDirectHikingRoute(
    startLat,
    startLng,
    destLat,
    destLng,
    destTitle,
    startElevation,
    destElevation
  );
}

/**
 * Générateur de sentier de repli si le réseau est coupé
 */
function generateDirectHikingRoute(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  destTitle: string,
  ele1: number,
  ele2: number
): NavigationRoute {
  const directDist = calculateDistance(lat1, lng1, lat2, lng2);
  const numPts = Math.max(15, Math.min(60, Math.round(directDist / 80)));
  const points: ElevationPoint[] = [];

  let cumDist = 0;
  let elevGain = 0;
  let elevLoss = 0;

  for (let i = 0; i < numPts; i++) {
    const t = i / (numPts - 1);
    // Sinuosité du sentier en montagne
    const wobble = Math.sin(t * Math.PI * 3) * 0.0008;
    const lat = lat1 + (lat2 - lat1) * t + wobble * 0.6;
    const lng = lng1 + (lat2 - lat1) * 0.0001 + (lng2 - lng1) * t + wobble;

    const ele = Math.round(ele1 + (ele2 - ele1) * t + Math.sin(t * Math.PI) * 30);

    if (i > 0) {
      const prev = points[i - 1];
      const dist = calculateDistance(prev.lat, prev.lng, lat, lng);
      cumDist += dist;

      const dEle = ele - prev.elevation;
      if (dEle > 0) elevGain += dEle;
      else elevLoss += Math.abs(dEle);

      prev.slopePercentage = Math.round(dist > 0 ? (dEle / dist) * 100 : 0);
    }

    points.push({
      lat,
      lng,
      elevation: ele,
      distanceFromStart: Math.round(cumDist),
      slopePercentage: 0,
    });
  }

  // Vitesse moyenne estimée : 4 km/h en marche + temps de montée (300m D+/h)
  const durationSec = Math.round((cumDist / 1000 / 4 + elevGain / 300) * 3600);

  return {
    distance: Math.round(cumDist),
    duration: durationSec,
    points,
    elevationGain: Math.round(elevGain),
    elevationLoss: Math.round(elevLoss),
    maxElevation: Math.max(ele1, ele2),
    minElevation: Math.min(ele1, ele2),
    destinationTitle: destTitle,
    steps: [
      {
        instruction: `Suivre le sentier vers ${destTitle}`,
        distance: Math.round(cumDist),
        bearing: 0,
      },
    ],
  };
}
