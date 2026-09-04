import { Trail, CommunitySpot, ElevationPoint } from '../types';

function generateTrailPoints(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  baseElevation: number,
  peakElevation: number,
  numPoints: number,
  variance: number = 0.003
): ElevationPoint[] {
  const points: ElevationPoint[] = [];
  let currentDistance = 0;

  for (let i = 0; i < numPoints; i++) {
    const progress = i / (numPoints - 1);
    const curve = Math.sin(progress * Math.PI) * variance;
    const lat = startLat + (endLat - startLat) * progress + curve * 0.8;
    const lng = startLng + (endLng - startLng) * progress + curve * 1.2;

    const elevationFactor = Math.sin(progress * Math.PI);
    const elevation = Math.round(
      baseElevation + (peakElevation - baseElevation) * Math.pow(elevationFactor, 1.2) +
      Math.sin(progress * 15) * 8
    );

    if (i > 0) {
      const prev = points[i - 1];
      const dLat = (lat - prev.lat) * 111320;
      const dLng = (lng - prev.lng) * 40075000 * Math.cos(((lat + prev.lat) / 2) * (Math.PI / 180)) / 360;
      const dist = Math.sqrt(dLat * dLat + dLng * dLng);
      currentDistance += dist;

      const dElev = elevation - prev.elevation;
      const slope = dist > 0 ? (dElev / dist) * 100 : 0;
      prev.slopePercentage = Math.round(slope);
    }

    points.push({
      lat,
      lng,
      elevation,
      distanceFromStart: Math.round(currentDistance),
      slopePercentage: 0,
    });
  }

  return points;
}

// 1. Parcours Bords de Vienne - Limoges
const limogesPoints = generateTrailPoints(
  45.8280, 1.2670, // Pont Saint-Étienne
  45.8450, 1.2580, // Vers Parc de l'Auzette & Uzurat
  225,
  295,
  50,
  0.004
);

// 2. Forêt des Vaseix - Limoges Ouest
const vaseixPoints = generateTrailPoints(
  45.8390, 1.1550,
  45.8520, 1.1720,
  310,
  395,
  60,
  0.006
);

// 3. Monts d'Ambazac - Pierre Branlante
const ambazacPoints = generateTrailPoints(
  45.9580, 1.4050,
  45.9850, 1.4320,
  410,
  665,
  70,
  0.008
);

export const MOCK_TRAILS: Trail[] = [
  {
    id: 'limoges-bords-de-vienne',
    name: 'Boucle des Bords de Vienne & Pont Saint-Étienne',
    region: 'Limoges, Haute-Vienne',
    difficulty: 'facile',
    totalDistance: 6400,
    elevationGain: 85,
    elevationLoss: 85,
    maxElevation: 295,
    minElevation: 225,
    estimatedDuration: 90, // 1h30
    points: limogesPoints,
    initialCenter: [45.8336, 1.2611],
    initialZoom: 14,
    description: 'Balade incontournable le long de la Vienne, reliant les ponts médiévaux, la cathédrale et les berges calmes.',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'limoges-foret-vaseix',
    name: 'Sentier Botanique & Écrin Boisé des Vaseix',
    region: 'Verneuil-sur-Vienne (Limoges Ouest)',
    difficulty: 'moyen',
    totalDistance: 8200,
    elevationGain: 145,
    elevationLoss: 145,
    maxElevation: 395,
    minElevation: 310,
    estimatedDuration: 130, // 2h10
    points: vaseixPoints,
    initialCenter: [45.8450, 1.1630],
    initialZoom: 14,
    description: 'Oxygénation totale en forêt domaniale avec étangs, pins sylvestres et allées sablonneuses.',
    imageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'ambazac-pierre-branlante',
    name: 'Chaos Granitique & Pierre Branlante d\'Ambazac',
    region: 'Monts d\'Ambazac, Haute-Vienne',
    difficulty: 'difficile',
    totalDistance: 11500,
    elevationGain: 360,
    elevationLoss: 360,
    maxElevation: 665,
    minElevation: 410,
    estimatedDuration: 210, // 3h30
    points: ambazacPoints,
    initialCenter: [45.9715, 1.4185],
    initialZoom: 13,
    description: 'Une vraie rando sauvage au cœur des forêts de châtaigniers et des rochers mystiques du Limousin.',
    imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'lac-blanc-chamonix',
    name: 'Boucle du Lac Blanc (Massif du Mont-Blanc)',
    region: 'Haute-Savoie, Chamonix',
    difficulty: 'expert',
    totalDistance: 8600,
    elevationGain: 940,
    elevationLoss: 940,
    maxElevation: 2352,
    minElevation: 1410,
    estimatedDuration: 270,
    points: generateTrailPoints(45.9550, 6.8850, 45.9820, 6.8980, 1410, 2352, 70, 0.008),
    initialCenter: [45.9685, 6.8915],
    initialZoom: 14,
    description: 'Une des plus belles randonnées d\'Europe face à toute la chaîne du Mont-Blanc.',
    imageUrl: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=800&q=80'
  }
];

export const INITIAL_COMMUNITY_SPOTS: CommunitySpot[] = [
  // Spots à Limoges et alentours
  {
    id: 'spot-lim-1',
    trailId: 'limoges-bords-de-vienne',
    title: 'Belvédère des Jardins de l\'Évêché',
    category: 'viewpoint',
    description: 'Superbe vue plongeante sur la Vienne, le pont Saint-Étienne et les toits historiques.',
    lat: 45.8290,
    lng: 1.2660,
    elevation: 275,
    distanceOnTrail: 950,
    createdAt: 'Il y a 25 min',
    reportedBy: 'Julien_Limoges',
    upvotes: 28,
    downvotes: 0,
    verifiedCount: 16,
    lastVerifiedAt: 'Il y a 5 min',
    photoUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
    comments: [
      { id: 'c-lim-1', author: 'Lucas87', text: 'Magnifique au soleil couchant !', createdAt: 'Il y a 10 min' }
    ]
  },
  {
    id: 'spot-lim-2',
    trailId: 'limoges-bords-de-vienne',
    title: 'Fontaine du Port du Naveix',
    category: 'water',
    description: 'Point d\'eau potable frais et accessible le long de la voie verte.',
    lat: 45.8315,
    lng: 1.2685,
    elevation: 230,
    distanceOnTrail: 1800,
    createdAt: 'Il y a 1h',
    reportedBy: 'Marc_Rando87',
    upvotes: 19,
    downvotes: 0,
    verifiedCount: 12,
    waterDrinkable: true,
    waterFlowing: true,
    lastVerifiedAt: 'Il y a 20 min'
  },
  {
    id: 'spot-lim-3',
    trailId: 'limoges-bords-de-vienne',
    title: 'Alerte Travaux sur berge & boue',
    category: 'hazard',
    description: 'Aménagement de sentier en cours près de la passerelle. Prudence, sol glissant par temps de pluie.',
    lat: 45.8350,
    lng: 1.2650,
    elevation: 232,
    distanceOnTrail: 2600,
    createdAt: 'Ce matin',
    reportedBy: 'Pierre_Trailer',
    upvotes: 14,
    downvotes: 1,
    verifiedCount: 8,
    hazardSeverity: 'medium',
    lastVerifiedAt: 'Il y a 40 min'
  },
  {
    id: 'spot-lim-4',
    trailId: 'limoges-bords-de-vienne',
    title: 'Aire de pique-nique du Mas Jambost',
    category: 'picnic',
    description: 'Grandes tables sous les marronniers, calme et verdoyant au bord de l\'eau.',
    lat: 45.8240,
    lng: 1.2480,
    elevation: 235,
    distanceOnTrail: 4200,
    createdAt: 'Hier',
    reportedBy: 'Emma_V',
    upvotes: 35,
    downvotes: 0,
    verifiedCount: 15,
    lastVerifiedAt: 'Il y a 2h'
  },
  {
    id: 'spot-lim-5',
    trailId: 'limoges-foret-vaseix',
    title: 'Étang des Vaseix & Abri forestier',
    category: 'shelter',
    description: 'Abri couvert en bois parfait pour s\'abriter d\'une averse ou faire une pause.',
    lat: 45.8460,
    lng: 1.1640,
    elevation: 355,
    distanceOnTrail: 3400,
    createdAt: 'Il y a 2h',
    reportedBy: 'Sylvain_Nature',
    upvotes: 22,
    downvotes: 0,
    verifiedCount: 11,
    lastVerifiedAt: 'Il y a 15 min'
  },
  {
    id: 'spot-lim-6',
    trailId: 'ambazac-pierre-branlante',
    title: 'Rocher de la Pierre Branlante',
    category: 'viewpoint',
    description: 'Énorme bloc de granit de plusieurs tonnes posé en équilibre. Panorama dégagé à 360° sur les Monts d\'Ambazac.',
    lat: 45.9720,
    lng: 1.4190,
    elevation: 650,
    distanceOnTrail: 5800,
    createdAt: 'Hier',
    reportedBy: 'HauteVienneRando',
    upvotes: 54,
    downvotes: 0,
    verifiedCount: 26,
    lastVerifiedAt: 'Ce matin',
    photoUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80'
  }
];
