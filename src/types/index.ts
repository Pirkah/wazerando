export type SpotCategory = 
  | 'viewpoint'    // 🏔️ Vue panoramique / Belvédère
  | 'water'        // 💧 Point d'eau / Source
  | 'hazard'       // ⚠️ Danger / Obstacle (patou, arbre, éboulis)
  | 'bivouac'      // ⛺ Coin bivouac / Tente
  | 'picnic'       // 🥪 Table pique-nique / Repos
  | 'fauna'        // 🦌 Faune sauvage remarquable
  | 'shelter';     // 🛖 Refuge / Abri

export interface ElevationPoint {
  lat: number;
  lng: number;
  elevation: number; // en mètres
  distanceFromStart: number; // en mètres
  slopePercentage?: number; // % de pente
}

export interface SpotComment {
  id: string;
  author: string;
  avatar?: string;
  text: string;
  createdAt: string;
}

export interface CommunitySpot {
  id: string;
  trailId?: string;
  title: string;
  category: SpotCategory;
  description: string;
  lat: number;
  lng: number;
  elevation: number;
  distanceOnTrail?: number; // Distance le long du parcours en mètres
  createdAt: string;
  reportedBy: string;
  upvotes: number;
  downvotes: number;
  userVoted?: 'up' | 'down';
  verifiedCount: number; // "Toujours là ?"
  lastVerifiedAt?: string;
  photoUrl?: string;
  hazardSeverity?: 'low' | 'medium' | 'high'; // Si c'est un danger
  waterDrinkable?: boolean; // Si c'est un point d'eau
  waterFlowing?: boolean; // L'eau coule-t-elle encore ?
  comments?: SpotComment[];
}

export interface Trail {
  id: string;
  name: string;
  region: string;
  difficulty: 'facile' | 'moyen' | 'difficile' | 'expert';
  totalDistance: number; // en mètres
  elevationGain: number; // D+ en mètres
  elevationLoss: number; // D- en mètres
  maxElevation: number; // en mètres
  minElevation: number; // en mètres
  estimatedDuration: number; // en minutes
  points: ElevationPoint[];
  initialCenter: [number, number];
  initialZoom: number;
  description: string;
  imageUrl?: string;
}

export type MapTileLayer = 'opentopo' | 'outdoors' | 'satellite' | 'standard';

export type UserAvatarId = 'hiker' | 'arrow' | 'runner' | 'fox' | 'neon';

export interface UserAvatarOption {
  id: UserAvatarId;
  name: string;
  badge: string;
  emoji: string;
  description: string;
}
