import { Trail, ElevationPoint } from '../types';
import { calculateDistance } from '../utils/geoUtils';

/**
 * Service pour parser des fichiers GPX (GPS Exchange Format) côté client
 */
export function parseGpxContent(xmlContent: string, fileName: string): Trail {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');

  // Vérification d'erreurs de parsing XML
  const parseError = xmlDoc.getElementsByTagName('parsererror');
  if (parseError.length > 0) {
    throw new Error('Fichier GPX invalide ou mal formaté.');
  }

  // Récupérer le nom de la trace si présent
  const nameElement = xmlDoc.querySelector('trk > name') || xmlDoc.querySelector('gpx > name');
  const trailName = nameElement?.textContent?.trim() || fileName.replace(/\.[^/.]+$/, '');

  // Récupérer tous les points de trace (trkpt)
  const trkpts = Array.from(xmlDoc.getElementsByTagName('trkpt'));
  if (trkpts.length === 0) {
    throw new Error('Aucun point de trace (<trkpt>) trouvé dans ce fichier GPX.');
  }

  const points: ElevationPoint[] = [];
  let totalDistance = 0;
  let elevationGain = 0;
  let elevationLoss = 0;
  let minElevation = Infinity;
  let maxElevation = -Infinity;

  let prevLat = 0;
  let prevLng = 0;
  let prevEle = 0;

  trkpts.forEach((pt, index) => {
    const lat = parseFloat(pt.getAttribute('lat') || '0');
    const lng = parseFloat(pt.getAttribute('lon') || '0');
    const eleElement = pt.getElementsByTagName('ele')[0];
    const ele = eleElement ? parseFloat(eleElement.textContent || '0') : 0;

    if (ele < minElevation) minElevation = ele;
    if (ele > maxElevation) maxElevation = ele;

    if (index > 0) {
      const stepDist = calculateDistance(prevLat, prevLng, lat, lng);
      totalDistance += stepDist;

      const dEle = ele - prevEle;
      if (dEle > 0) {
        elevationGain += dEle;
      } else {
        elevationLoss += Math.abs(dEle);
      }

      const slope = stepDist > 0 ? (dEle / stepDist) * 100 : 0;
      if (points[index - 1]) {
        points[index - 1].slopePercentage = Math.round(slope);
      }
    }

    points.push({
      lat,
      lng,
      elevation: Math.round(ele),
      distanceFromStart: Math.round(totalDistance),
      slopePercentage: 0,
    });

    prevLat = lat;
    prevLng = lng;
    prevEle = ele;
  });

  // Calcul du centre et zoom approximatif
  const firstPt = points[0];
  const midPt = points[Math.floor(points.length / 2)];
  const centerLat = (firstPt.lat + midPt.lat) / 2;
  const centerLng = (firstPt.lng + midPt.lng) / 2;

  // Estimation durée (Méthode suisse / FFRandonnée : 4 km/h à plat + 1h pour 300m D+)
  const hours = (totalDistance / 1000) / 4 + elevationGain / 300;
  const estimatedDuration = Math.round(hours * 60);

  // Difficulté
  let difficulty: Trail['difficulty'] = 'facile';
  if (elevationGain > 900 || totalDistance > 18000) {
    difficulty = 'expert';
  } else if (elevationGain > 600 || totalDistance > 12000) {
    difficulty = 'difficile';
  } else if (elevationGain > 300 || totalDistance > 7000) {
    difficulty = 'moyen';
  }

  return {
    id: `custom-gpx-${Date.now()}`,
    name: trailName,
    region: 'Trace GPX importée',
    difficulty,
    totalDistance: Math.round(totalDistance),
    elevationGain: Math.round(elevationGain),
    elevationLoss: Math.round(elevationLoss),
    maxElevation: maxElevation === -Infinity ? 0 : Math.round(maxElevation),
    minElevation: minElevation === Infinity ? 0 : Math.round(minElevation),
    estimatedDuration,
    points,
    initialCenter: [centerLat, centerLng],
    initialZoom: 13,
    description: `Fichier importé comprenant ${points.length} points GPS et ${Math.round(totalDistance / 1000 * 10) / 10} km de parcours.`,
  };
}
