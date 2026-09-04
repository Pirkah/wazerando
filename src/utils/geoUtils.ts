/**
 * Utilitaires géographiques et altimétriques pour WazeRando
 */

// Rayon de la Terre en mètres
const EARTH_RADIUS = 6371000;

/**
 * Calcule la distance en mètres entre deux coordonnées GPS (formule de Haversine)
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS * c;
}

/**
 * Calcule le cap (azimut / bearing) en degrés (0 - 360) d'un point A vers un point B
 */
export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

  const theta = Math.atan2(y, x);
  return ((theta * 180) / Math.PI + 360) % 360;
}

/**
 * Convertit un cap en degrés vers une direction cardinale abrégée (N, NE, E, etc.)
 */
export function bearingToCardinal(bearing: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
}

/**
 * Formate une distance lisible pour le randonneur (ex: "450 m" ou "4.2 km")
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Formate un dénivelé (ex: "+340 m" ou "-120 m")
 */
export function formatElevation(meters: number, sign: boolean = true): string {
  const rounded = Math.round(meters);
  if (sign && rounded > 0) return `+${rounded} m`;
  return `${rounded} m`;
}

/**
 * Formate une durée en minutes vers "2h15" ou "45 min"
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours === 0) return `${mins} min`;
  return `${hours}h${mins < 10 ? '0' : ''}${mins}`;
}

/**
 * Couleur selon le pourcentage de pente
 */
export function getSlopeColor(slopePercentage: number): string {
  const absSlope = Math.abs(slopePercentage);
  if (absSlope < 5) return '#22c55e'; // Vert : plat / faux-plat
  if (absSlope < 12) return '#eab308'; // Jaune : montée modérée
  if (absSlope < 20) return '#f97316'; // Orange : montée raide
  return '#ef4444'; // Rouge : très forte pente / mur
}
