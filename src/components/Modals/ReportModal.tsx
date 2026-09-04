import React, { useState } from 'react';
import { SpotCategory, CommunitySpot } from '../../types';
import { X, AlertTriangle, Droplet, Mountain, Tent, Coffee, Compass, Check } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newSpot: Omit<CommunitySpot, 'id' | 'createdAt' | 'upvotes' | 'downvotes' | 'verifiedCount'>) => void;
  currentPosition: { lat: number; lng: number } | null;
  clickedPosition: { lat: number; lng: number } | null;
  currentElevation?: number;
}

interface CategoryOption {
  id: SpotCategory;
  label: string;
  icon: React.ReactNode;
  color: string;
  border: string;
  bg: string;
  description: string;
}

const CATEGORIES: CategoryOption[] = [
  {
    id: 'viewpoint',
    label: 'Point de vue',
    icon: <Mountain className="w-6 h-6" />,
    color: 'text-emerald-400',
    border: 'border-emerald-500/50',
    bg: 'bg-emerald-950/40',
    description: 'Panorama, coucher de soleil, belvédère',
  },
  {
    id: 'hazard',
    label: 'Danger / Alerte',
    icon: <AlertTriangle className="w-6 h-6" />,
    color: 'text-rose-400',
    border: 'border-rose-500/50',
    bg: 'bg-rose-950/40',
    description: 'Arbre tombé, patou, passage glissant, éboulis',
  },
  {
    id: 'water',
    label: 'Point d\'eau',
    icon: <Droplet className="w-6 h-6" />,
    color: 'text-cyan-400',
    border: 'border-cyan-500/50',
    bg: 'bg-cyan-950/40',
    description: 'Source potable, fontaine, ruisseau clair',
  },
  {
    id: 'bivouac',
    label: 'Coin Bivouac',
    icon: <Tent className="w-6 h-6" />,
    color: 'text-indigo-400',
    border: 'border-indigo-500/50',
    bg: 'bg-indigo-950/40',
    description: 'Emplacement plat, abrité du vent pour tente',
  },
  {
    id: 'picnic',
    label: 'Pique-nique',
    icon: <Coffee className="w-6 h-6" />,
    color: 'text-amber-400',
    border: 'border-amber-500/50',
    bg: 'bg-amber-950/40',
    description: 'Table en bois, clairière, coin d\'ombre',
  },
  {
    id: 'shelter',
    label: 'Abri / Refuge',
    icon: <Compass className="w-6 h-6" />,
    color: 'text-pink-400',
    border: 'border-pink-500/50',
    bg: 'bg-pink-950/40',
    description: 'Cabane non gardée, abri en cas d\'orage',
  },
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  currentPosition,
  clickedPosition,
  currentElevation = 1500,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<SpotCategory>('viewpoint');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [hazardSeverity, setHazardSeverity] = useState<'low' | 'medium' | 'high'>('medium');
  const [waterDrinkable, setWaterDrinkable] = useState(true);
  const [waterFlowing, setWaterFlowing] = useState(true);

  if (!isOpen) return null;

  const targetCoords = clickedPosition || currentPosition || { lat: 45.9685, lng: 6.8915 };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      title: title.trim(),
      category: selectedCategory,
      description: description.trim() || 'Signalé en direct sur le sentier.',
      lat: targetCoords.lat,
      lng: targetCoords.lng,
      elevation: Math.round(currentElevation),
      reportedBy: 'Vous (Randonneur)',
      hazardSeverity: selectedCategory === 'hazard' ? hazardSeverity : undefined,
      waterDrinkable: selectedCategory === 'water' ? waterDrinkable : undefined,
      waterFlowing: selectedCategory === 'water' ? waterFlowing : undefined,
    });

    setTitle('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* En-tête modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2">
            <span className="text-xl">📢</span>
            <div>
              <h2 className="text-base font-bold text-white">Signaler un spot ou une alerte</h2>
              <p className="text-xs text-slate-400">Partagez l'info avec la communauté de randonneurs</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps formulaire */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-5">
          {/* Choix de la catégorie - Grille Waze */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Type de signalement
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all text-center ${
                      isSelected
                        ? `${cat.border} ${cat.bg} ring-2 ring-emerald-500/40 scale-[1.02] shadow-lg`
                        : 'border-slate-800 bg-slate-950/40 hover:bg-slate-800/40 text-slate-400'
                    }`}
                  >
                    <div className={`${isSelected ? cat.color : 'text-slate-400'} mb-1.5`}>
                      {cat.icon}
                    </div>
                    <span className="text-xs font-bold text-slate-200">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Options spécifiques aux dangers */}
          {selectedCategory === 'hazard' && (
            <div className="p-3.5 rounded-2xl bg-rose-950/30 border border-rose-900/40 space-y-2">
              <span className="text-xs font-bold text-rose-300">Gravité de l'obstacle</span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'low', label: 'Gênant (Boue)' },
                  { id: 'medium', label: 'Modéré (Arbre)' },
                  { id: 'high', label: 'Critique (Patou/Glissade)' },
                ].map((sev) => (
                  <button
                    key={sev.id}
                    type="button"
                    onClick={() => setHazardSeverity(sev.id as any)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors ${
                      hazardSeverity === sev.id
                        ? 'bg-rose-600 text-white border-rose-400'
                        : 'bg-slate-900 text-slate-300 border-slate-700'
                    }`}
                  >
                    {sev.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Options spécifiques aux points d'eau */}
          {selectedCategory === 'water' && (
            <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-900/40 space-y-2.5">
              <span className="text-xs font-bold text-cyan-300">État de la source</span>
              <div className="flex gap-4 text-xs font-medium text-slate-300">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={waterDrinkable}
                    onChange={(e) => setWaterDrinkable(e.target.checked)}
                    className="rounded text-cyan-500 focus:ring-cyan-400 bg-slate-800"
                  />
                  <span>Eau déclarée potable</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={waterFlowing}
                    onChange={(e) => setWaterFlowing(e.target.checked)}
                    className="rounded text-cyan-500 focus:ring-cyan-400 bg-slate-800"
                  />
                  <span>L'eau coule actuellement</span>
                </label>
              </div>
            </div>
          )}

          {/* Titre du spot */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Titre ou nom du spot
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Belvédère du coucher de soleil, Arbre en travers..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Description & conseils pour les autres randonneurs
            </label>
            <textarea
              rows={3}
              placeholder="Donnez des précisions : accès, état actuel, précaution à prendre..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Coordonnées & altitude automatiques */}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <span>📍</span>
              <span>
                {targetCoords.lat.toFixed(4)}, {targetCoords.lng.toFixed(4)}
              </span>
            </span>
            <span className="font-bold text-emerald-400">~{Math.round(currentElevation)} m d'altitude</span>
          </div>

          {/* Boutons d'action */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Publier l'alerte</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
