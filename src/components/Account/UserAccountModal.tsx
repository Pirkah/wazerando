import React, { useState } from 'react';
import { Trail, UserAvatarId } from '../../types';
import { USER_AVATARS } from '../../data/avatarConfig';
import { formatDistance, formatElevation, formatDuration } from '../../utils/geoUtils';
import { X, User, ShieldCheck, Navigation, Compass, Trash2, Smartphone, Monitor } from 'lucide-react';

interface UserAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedTrails: Trail[];
  onSelectTrail: (trailId: string) => void;
  onDeleteSavedTrail: (trailId: string) => void;
  userAvatar?: UserAvatarId;
  onOpenAvatarSelector?: () => void;
}

export const UserAccountModal: React.FC<UserAccountModalProps> = ({
  isOpen,
  onClose,
  savedTrails,
  onSelectTrail,
  onDeleteSavedTrail,
  userAvatar = 'hiker',
  onOpenAvatarSelector,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'myTrails'>('myTrails');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* En-tête Profil */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-sky-600 flex items-center justify-center text-white shadow-lg font-black text-lg border border-white/20">
              JP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white">Julien (Pirkah)</h2>
                <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                  Compte Connecté
                </span>
              </div>
              <p className="text-xs text-slate-400">cacahuete8787@gmail.com • Limoges, France</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Onglets */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 p-1 gap-1">
          <button
            onClick={() => setActiveTab('myTrails')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'myTrails'
                ? 'bg-slate-800 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            <span>Mes Randos Préparées ({savedTrails.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'profile'
                ? 'bg-slate-800 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5 text-sky-400" />
            <span>Statistiques & Synchronisation</span>
          </button>
        </div>

        {/* Corps */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'myTrails' && (
            <div className="space-y-3">
              {/* Statut de synchronisation PC <-> Téléphone */}
              <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-2xl flex items-center gap-3 text-xs text-emerald-200">
                <div className="flex items-center gap-1.5 text-emerald-400 shrink-0 font-bold">
                  <Monitor className="w-4 h-4" />
                  <span>⇄</span>
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-white">Synchro Cloud Active : </span>
                  Tous les parcours préparés sur PC sont instantanément accessibles sur votre smartphone.
                </div>
              </div>

              {savedTrails.length > 0 ? (
                savedTrails.map((tr) => (
                  <div
                    key={tr.id}
                    className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-extrabold text-white truncate">
                          {tr.name}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-sky-950 text-sky-400 border border-sky-800/40">
                          {tr.region}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="font-semibold text-slate-300">
                          {formatDistance(tr.totalDistance)}
                        </span>
                        <span className="text-emerald-400 font-bold">
                          {formatElevation(tr.elevationGain)} D+
                        </span>
                        <span>{formatDuration(tr.estimatedDuration)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          onSelectTrail(tr.id);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition-transform active:scale-95 flex items-center gap-1"
                      >
                        <Navigation className="w-3.5 h-3.5 fill-current" />
                        <span>Lancer</span>
                      </button>
                      <button
                        onClick={() => onDeleteSavedTrail(tr.id)}
                        className="p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                        title="Supprimer ce parcours"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                  <div className="text-3xl">🗺️</div>
                  <div className="font-bold text-white">Aucune randonnée personnalisée</div>
                  <p>Utilisez le bouton "💻 Préparer sur PC" pour tracer vos parcours sur les routes de votre choix.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-4">
              {/* Grille de stats randonneur */}
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800">
                  <div className="text-lg font-black text-emerald-400">+4 320 m</div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">D+ Gravi</div>
                </div>
                <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800">
                  <div className="text-lg font-black text-sky-400">142 km</div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Parcourus</div>
                </div>
                <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800">
                  <div className="text-lg font-black text-amber-400">18</div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Alertes postées</div>
                </div>
              </div>

              {/* Statut du compte */}
              <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2.5 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="font-semibold">Niveau Randonneur :</span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" />
                    Éclaireur Haute-Vienne
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="font-semibold">ID Dépôt GitHub :</span>
                  <a
                    href="https://github.com/Pirkah/wazerando"
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-sky-400 hover:underline"
                  >
                    github.com/Pirkah/wazerando
                  </a>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="font-semibold">Mode Téléphone PWA :</span>
                  <span className="font-bold text-slate-200">Prêt à installer sur smartphone</span>
                </div>
                <div className="flex items-center justify-between text-slate-300 pt-1 border-t border-slate-800/80">
                  <span className="font-semibold">Repère sur la carte :</span>
                  <button
                    onClick={() => {
                      onClose();
                      if (onOpenAvatarSelector) onOpenAvatarSelector();
                    }}
                    className="font-bold text-sky-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-950/70 border border-sky-700/50 hover:border-sky-500 transition-colors"
                  >
                    <span>{USER_AVATARS.find((a) => a.id === userAvatar)?.emoji || '🚶‍♂️'}</span>
                    <span>{USER_AVATARS.find((a) => a.id === userAvatar)?.name || 'Randonneur'}</span>
                    <span className="text-[10px] text-sky-400 font-normal">➔ Modifier</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
