import { UserAvatarId, UserAvatarOption } from '../types';

export const USER_AVATARS: UserAvatarOption[] = [
  {
    id: 'hiker',
    name: 'Randonneur Éclaireur',
    badge: 'Populaire',
    emoji: '🚶‍♂️',
    description: 'Personnage avec sac à dos, bâton de rando et flèche directionnelle Waze',
  },
  {
    id: 'arrow',
    name: 'Flèche 3D Waze',
    badge: 'Cockpit',
    emoji: '🧭',
    description: 'Grande flèche de navigation 3D en relief avec biseau et faisceau lumineux',
  },
  {
    id: 'runner',
    name: 'Trail Runner',
    badge: 'Vitesse',
    emoji: '🥾',
    description: 'Chaussure de trail tout-terrain dynamique pour foulée rapide',
  },
  {
    id: 'fox',
    name: 'Renard des Sentiers',
    badge: 'Mascotte',
    emoji: '🦊',
    description: 'Mascotte exploratrice rusée, idéale pour dénicher les sentiers secrets',
  },
  {
    id: 'neon',
    name: 'Flèche Cyan Néon',
    badge: 'Ultra-Visibilité',
    emoji: '⚡',
    description: 'Pointeur laser haute visibilité pour cartes satellites et sentiers sombres',
  },
];

let markerCounter = 0;

/**
 * Génère le code HTML complet du repère Waze (Personnage + Cône de vision + Flèche 3D + Radar)
 */
export function generateUserMarkerHtml(
  avatarId: UserAvatarId = 'hiker',
  heading: number = 0,
  speed: number = 0
): string {
  markerCounter++;
  const uniqueId = `beam_${markerCounter}`;
  const roundedHeading = Math.round(heading || 0);

  // 1. Définition du centre (Personnage ou Flèche centrale)
  let centerPiece = '';
  let showTopPointer = true;

  switch (avatarId) {
    case 'arrow':
      // En mode flèche 3D : la flèche elle-même tourne avec le heading
      showTopPointer = false;
      centerPiece = `
        <div class="relative z-10 flex items-center justify-center w-14 h-14 select-none cursor-pointer transition-transform duration-200 hover:scale-110">
          <svg width="46" height="46" viewBox="0 0 48 48" class="filter drop-shadow-[0_4px_12px_rgba(2,132,199,0.9)]">
            <!-- Contour blanc épais -->
            <polygon points="24,3 44,43 24,34 4,43" fill="#0284c7" stroke="#ffffff" stroke-width="3.5" stroke-linejoin="round"/>
            <!-- Facette droite lumineuse (Cyan) -->
            <polygon points="24,3 44,43 24,34" fill="#38bdf8"/>
            <!-- Facette gauche ombrée (Bleu profond) -->
            <polygon points="24,3 4,43 24,34" fill="#0284c7"/>
            <!-- Centre de pivot -->
            <circle cx="24" cy="24" r="4.5" fill="#ffffff" stroke="#0369a1" stroke-width="1.5"/>
          </svg>
        </div>
      `;
      break;

    case 'runner':
      centerPiece = `
        <div class="relative z-10 flex items-center justify-center w-11 h-11 rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 border-2 border-white shadow-[0_4px_14px_rgba(0,0,0,0.5)] cursor-pointer transition-transform duration-200 hover:scale-110">
          <span class="text-xl select-none filter drop-shadow">🥾</span>
        </div>
      `;
      break;

    case 'fox':
      centerPiece = `
        <div class="relative z-10 flex items-center justify-center w-11 h-11 rounded-full bg-gradient-to-tr from-orange-600 via-amber-500 to-yellow-400 border-2 border-white shadow-[0_4px_14px_rgba(0,0,0,0.5)] cursor-pointer transition-transform duration-200 hover:scale-110">
          <span class="text-xl select-none filter drop-shadow">🦊</span>
        </div>
      `;
      break;

    case 'neon':
      showTopPointer = false;
      centerPiece = `
        <div class="relative z-10 flex items-center justify-center w-13 h-13 select-none cursor-pointer transition-transform duration-200 hover:scale-110">
          <svg width="44" height="44" viewBox="0 0 48 48" class="filter drop-shadow-[0_0_16px_rgba(6,182,212,1)]">
            <polygon points="24,2 45,44 24,35 3,44" fill="#06b6d4" stroke="#ffffff" stroke-width="3" stroke-linejoin="round"/>
            <polygon points="24,2 45,44 24,35" fill="#67e8f9"/>
            <polygon points="24,2 3,44 24,35" fill="#0891b2"/>
            <polygon points="24,9 38,38 24,30 10,38" fill="#ecfeff"/>
          </svg>
        </div>
      `;
      break;

    case 'hiker':
    default:
      centerPiece = `
        <div class="relative z-10 flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-tr from-sky-600 via-emerald-500 to-teal-400 border-2.5 border-white shadow-[0_4px_16px_rgba(2,132,199,0.65)] cursor-pointer transition-transform duration-200 hover:scale-110">
          <span class="text-2xl select-none filter drop-shadow translate-y-[-1px]">🚶‍♂️</span>
        </div>
      `;
      break;
  }

  // 2. Cône de vision Waze + Flèche de direction orientés vers heading
  const directionalUnit = `
    <div class="absolute inset-0 flex items-center justify-center pointer-events-none transition-transform duration-300" style="transform: rotate(${roundedHeading}deg); transform-origin: 40px 40px;">
      <!-- Faisceau lumineux Waze / Cône de vision -->
      <svg width="80" height="80" viewBox="0 0 80 80" class="overflow-visible absolute inset-0">
        <defs>
          <radialGradient id="${uniqueId}" cx="40" cy="40" r="46" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.8"/>
            <stop offset="45%" stop-color="#0284c7" stop-opacity="0.4"/>
            <stop offset="85%" stop-color="#0284c7" stop-opacity="0.1"/>
            <stop offset="100%" stop-color="#0284c7" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <!-- Cône angulaire de 44° projeté devant -->
        <path d="M 40 40 L 22 2 A 44 44 0 0 1 58 2 Z" fill="url(#${uniqueId})" />
      </svg>

      <!-- Flèche 3D de visée (au sommet du personnage) -->
      ${
        showTopPointer
          ? `
          <div class="absolute -top-3 flex flex-col items-center">
            <svg width="22" height="22" viewBox="0 0 24 24" class="filter drop-shadow-[0_2px_8px_rgba(2,132,199,0.95)]">
              <polygon points="12,1 21,21 12,16 3,21" fill="#0284c7" stroke="#ffffff" stroke-width="2.5" stroke-linejoin="round"/>
              <polygon points="12,1 21,21 12,16" fill="#38bdf8"/>
            </svg>
          </div>
          `
          : ''
      }

      ${
        avatarId === 'arrow' || avatarId === 'neon'
          ? centerPiece
          : ''
      }
    </div>
  `;

  // 3. Assemblage global (80x80px avec point d'ancrage exact au milieu à 40px, 40px)
  return `
    <div class="relative w-20 h-20 flex items-center justify-center select-none cursor-pointer">
      <!-- Onde radar Waze de repérage -->
      <div class="absolute w-16 h-16 rounded-full bg-sky-400/25 animate-pulse-ring pointer-events-none"></div>
      <div class="absolute w-11 h-11 rounded-full bg-sky-400/20 pointer-events-none"></div>

      <!-- Unité directionnelle (Flèche + Cône de vision) -->
      ${directionalUnit}

      <!-- Personnage (si mode avec personnage au centre) -->
      ${avatarId !== 'arrow' && avatarId !== 'neon' ? centerPiece : ''}

      <!-- Badge étiquette "VOUS" -->
      <div class="absolute -bottom-3.5 z-20 px-2 py-0.5 rounded-full bg-slate-950/95 border border-sky-400/80 text-[10px] font-black text-sky-200 shadow-xl flex items-center gap-1 select-none pointer-events-none whitespace-nowrap">
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>VOUS</span>
        ${speed > 0 ? `<span class="text-slate-400 font-medium">· ${speed}km/h</span>` : ''}
      </div>
    </div>
  `;
}
