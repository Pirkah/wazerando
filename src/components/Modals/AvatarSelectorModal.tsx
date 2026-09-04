import React from 'react';
import { UserAvatarId } from '../../types';
import { USER_AVATARS } from '../../data/avatarConfig';
import { X, Check, Compass, Sparkles, Navigation } from 'lucide-react';

interface AvatarSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAvatar: UserAvatarId;
  onSelectAvatar: (id: UserAvatarId) => void;
  currentHeading?: number;
  currentSpeed?: number;
}

export const AvatarSelectorModal: React.FC<AvatarSelectorModalProps> = ({
  isOpen,
  onClose,
  selectedAvatar,
  onSelectAvatar,
  currentHeading = 0,
  currentSpeed = 0,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1250] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* En-tête */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-600 via-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg text-lg">
              🧭
            </div>
            <div>
              <h2 className="text-base font-black text-white">Mon Personnage & Flèche</h2>
              <p className="text-xs text-slate-400">Choisissez votre repère sur la carte Waze</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Cap & Vitesse */}
        <div className="px-4 py-2.5 bg-sky-950/40 border-b border-sky-800/30 flex items-center justify-between text-xs text-sky-200">
          <div className="flex items-center gap-1.5 font-bold">
            <Compass className="w-4 h-4 text-sky-400 animate-spin-slow" />
            <span>Orientation : {Math.round(currentHeading)}°</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium text-slate-400">
            <Navigation className="w-3.5 h-3.5 text-emerald-400" />
            <span>Vitesse : {currentSpeed} km/h</span>
          </div>
        </div>

        {/* Liste des Avatars */}
        <div className="p-4 space-y-2.5 overflow-y-auto flex-1">
          {USER_AVATARS.map((av) => {
            const isSelected = selectedAvatar === av.id;
            return (
              <div
                key={av.id}
                onClick={() => {
                  onSelectAvatar(av.id);
                }}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'border-sky-500 bg-sky-950/40 ring-2 ring-sky-500/40 shadow-lg'
                    : 'border-slate-800 bg-slate-950/50 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700/80 flex items-center justify-center text-2xl shrink-0 shadow">
                    {av.emoji}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-extrabold text-sm text-white">{av.name}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-800 text-sky-400 border border-slate-700">
                        {av.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-tight">
                      {av.description}
                    </p>
                  </div>
                </div>

                <div className="shrink-0">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                      isSelected
                        ? 'bg-sky-500 border-sky-400 text-white'
                        : 'border-slate-700 text-transparent'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pied de page */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>La flèche s'oriente automatiquement en marchant</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-500 hover:to-emerald-500 text-white font-black text-xs shadow-lg transition-transform active:scale-95"
          >
            Valider
          </button>
        </div>
      </div>
    </div>
  );
};
