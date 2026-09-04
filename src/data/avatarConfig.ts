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

/**
 * Génère le code HTML complet du repère Waze (Personnage + Cône de vision + Flèche 3D + Radar)
 * Utilise des styles inline explicites pour garantir un affichage parfait dans Leaflet
 */
export function generateUserMarkerHtml(
  avatarId: UserAvatarId = 'hiker',
  heading: number = 0,
  speed: number = 0
): string {
  const roundedHeading = Math.round(heading || 0);

  // 1. Définition du centre (Flèche Cockpit seule ou Personnage avec Flèche au sommet)
  let centerContent = '';

  if (avatarId === 'arrow') {
    // Mode Flèche 3D Cockpit Waze (la grande flèche tourne directement)
    centerContent = `
      <div style="position: relative; width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; transform: rotate(${roundedHeading}deg); filter: drop-shadow(0 6px 16px rgba(2, 132, 199, 0.95));">
        <svg width="56" height="56" viewBox="0 0 56 56">
          <polygon points="28,3 52,51 28,40 4,51" fill="#0284c7" stroke="#ffffff" stroke-width="4" stroke-linejoin="round"/>
          <polygon points="28,3 52,51 28,40" fill="#38bdf8"/>
          <polygon points="28,3 4,51 28,40" fill="#0284c7"/>
          <circle cx="28" cy="28" r="5" fill="#ffffff" stroke="#0284c7" stroke-width="2"/>
        </svg>
      </div>
    `;
  } else if (avatarId === 'neon') {
    // Mode Flèche Cyan Néon Laser
    centerContent = `
      <div style="position: relative; width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; transform: rotate(${roundedHeading}deg); filter: drop-shadow(0 0 16px #06b6d4);">
        <svg width="56" height="56" viewBox="0 0 56 56">
          <polygon points="28,2 53,52 28,41 3,52" fill="#06b6d4" stroke="#ffffff" stroke-width="3.5" stroke-linejoin="round"/>
          <polygon points="28,2 53,52 28,41" fill="#67e8f9"/>
          <polygon points="28,2 3,52 28,41" fill="#0891b2"/>
          <polygon points="28,10 44,44 28,35 12,44" fill="#ecfeff"/>
        </svg>
      </div>
    `;
  } else {
    // Mode Personnage (Randonneur, Trail Runner, Renard)
    const emoji = avatarId === 'runner' ? '🥾' : avatarId === 'fox' ? '🦊' : '🚶‍♂️';
    const bgGradient =
      avatarId === 'runner'
        ? 'linear-gradient(135deg, #f59e0b, #ea580c)'
        : avatarId === 'fox'
        ? 'linear-gradient(135deg, #ea580c, #e11d48)'
        : 'linear-gradient(135deg, #0284c7, #10b981)';

    centerContent = `
      <!-- Unité Flèche 3D & Cône de vision qui pivote selon le cap -->
      <div style="position: absolute; width: 90px; height: 90px; left: 0; top: 0; transform: rotate(${roundedHeading}deg); transform-origin: 45px 45px; pointer-events: none; transition: transform 0.25s ease-out;">
        <!-- Faisceau lumineux / Cône de vision -->
        <svg width="90" height="90" viewBox="0 0 90 90" style="position: absolute; inset: 0; overflow: visible;">
          <defs>
            <linearGradient id="userVisionConeGrad" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stop-color="#0284c7" stop-opacity="0"/>
              <stop offset="40%" stop-color="#0284c7" stop-opacity="0.3"/>
              <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.75"/>
            </linearGradient>
          </defs>
          <path d="M 45 45 L 24 2 A 48 48 0 0 1 66 2 Z" fill="url(#userVisionConeGrad)"/>
        </svg>

        <!-- Flèche 3D Waze au sommet du personnage -->
        <div style="position: absolute; left: 32px; top: -3px; width: 26px; height: 26px; filter: drop-shadow(0 3px 6px rgba(0,0,0,0.7));">
          <svg width="26" height="26" viewBox="0 0 26 26">
            <polygon points="13,1 25,24 13,18 1,24" fill="#0284c7" stroke="#ffffff" stroke-width="2.5" stroke-linejoin="round"/>
            <polygon points="13,1 25,24 13,18" fill="#38bdf8"/>
            <polygon points="13,1 1,24 13,18" fill="#0284c7"/>
            <circle cx="13" cy="13" r="2.5" fill="#ffffff"/>
          </svg>
        </div>
      </div>

      <!-- Badge Personnage Central 50x50px -->
      <div style="position: relative; z-index: 10; width: 50px; height: 50px; border-radius: 50%; background: ${bgGradient}; border: 3px solid #ffffff; box-shadow: 0 4px 18px rgba(0,0,0,0.55), 0 0 0 3px rgba(56,189,248,0.5); display: flex; align-items: center; justify-content: center; cursor: pointer;">
        <span style="font-size: 28px; line-height: 1; user-select: none; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));">${emoji}</span>
      </div>
    `;
  }

  // 2. Assemblage avec Ondes Radar et Étiquette "VOUS"
  return `
    <div style="position: relative; width: 90px; height: 90px; display: flex; align-items: center; justify-content: center; cursor: pointer; user-select: none;">
      <!-- Onde radar Waze de repérage -->
      <div style="position: absolute; width: 76px; height: 76px; border-radius: 50%; background: rgba(56, 189, 248, 0.25); animation: pulse-ring 2.5s infinite; pointer-events: none;"></div>
      <div style="position: absolute; width: 58px; height: 58px; border-radius: 50%; background: rgba(56, 189, 248, 0.2); pointer-events: none;"></div>

      ${centerContent}

      <!-- Badge "VOUS" -->
      <div style="position: absolute; bottom: -6px; z-index: 25; padding: 2px 8px; border-radius: 9999px; background: rgba(2, 6, 23, 0.95); border: 1.5px solid #38bdf8; color: #bae6fd; font-size: 10px; font-weight: 900; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(0,0,0,0.6); display: flex; align-items: center; gap: 4px; pointer-events: none; white-space: nowrap;">
        <span style="width: 6px; height: 6px; border-radius: 50%; background: #4ade80; display: inline-block;"></span>
        <span>VOUS</span>
        ${speed > 0 ? `<span style="color: #94a3b8; font-weight: 600;">· ${speed}km/h</span>` : ''}
      </div>
    </div>
  `;
}
