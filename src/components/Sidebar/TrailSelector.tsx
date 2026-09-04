import React, { useRef } from 'react';
import { Trail, MapTileLayer, SpotCategory } from '../../types';
import { formatDistance, formatElevation, formatDuration } from '../../utils/geoUtils';
import { parseGpxContent } from '../../services/gpxParser';
import { Layers, Upload, Compass, Mountain, TrendingUp, X, Filter, Check } from 'lucide-react';

interface TrailSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  trails: Trail[];
  selectedTrailId: string;
  onSelectTrail: (trailId: string) => void;
  onImportGpx: (newTrail: Trail) => void;
  activeLayer: MapTileLayer;
  onChangeLayer: (layer: MapTileLayer) => void;
  selectedCategories: SpotCategory[];
  onToggleCategory: (category: SpotCategory) => void;
}

const TILE_OPTIONS: { id: MapTileLayer; label: string; icon: string; desc: string }[] = [
  { id: 'opentopo', label: 'Topographique (IGN/Topo)', icon: '🏔️', desc: 'Courbes de niveau & ombrage du relief' },
  { id: 'outdoors', label: 'Sentiers Rando (Outdoors)', icon: '🥾', desc: 'Balisage officiel & sentiers pédestres' },
  { id: 'satellite', label: 'Satellite HD', icon: '🛰️', desc: 'Photos aériennes précises' },
  { id: 'standard', label: 'Standard OSM', icon: '🗺️', desc: 'Carte routière & géographique claire' },
];

const CATEGORY_FILTERS: { id: SpotCategory; label: string; emoji: string }[] = [
  { id: 'viewpoint', label: 'Points de vue', emoji: '🏔️' },
  { id: 'hazard', label: 'Dangers & Alertes', emoji: '⚠️' },
  { id: 'water', label: 'Points d\'eau', emoji: '💧' },
  { id: 'bivouac', label: 'Coins Bivouac', emoji: '⛺' },
  { id: 'picnic', label: 'Pique-nique', emoji: '🥪' },
  { id: 'fauna', label: 'Faune sauvage', emoji: '🦌' },
  { id: 'shelter', label: 'Refuges & Abris', emoji: '🛖' },
];

export const TrailSelector: React.FC<TrailSelectorProps> = ({
  isOpen,
  onClose,
  trails,
  selectedTrailId,
  onSelectTrail,
  onImportGpx,
  activeLayer,
  onChangeLayer,
  selectedCategories,
  onToggleCategory,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      try {
        const parsedTrail = parseGpxContent(content, file.name);
        onImportGpx(parsedTrail);
        onClose();
      } catch (err: any) {
        alert(err.message || 'Erreur lors de la lecture du fichier GPX.');
      }
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1150] flex justify-start bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border-r border-slate-700/80 w-full max-w-sm sm:max-w-md h-full shadow-2xl flex flex-col overflow-hidden">
        {/* En-tête */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md font-bold">
              🥾
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Menu & Randonnées</h2>
              <p className="text-xs text-slate-400">WazeRando Community</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenu défilant */}
        <div className="p-4 overflow-y-auto space-y-6 flex-1">
          {/* Section Randonnées */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-emerald-400" />
                Parcours disponibles
              </span>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-800/60 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Importer GPX</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".gpx"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>

            <div className="space-y-3">
              {trails.map((t) => {
                const isSelected = t.id === selectedTrailId;
                return (
                  <div
                    key={t.id}
                    onClick={() => {
                      onSelectTrail(t.id);
                      onClose();
                    }}
                    className={`cursor-pointer rounded-2xl border transition-all overflow-hidden ${
                      isSelected
                        ? 'border-emerald-500 bg-slate-800/80 ring-2 ring-emerald-500/40 shadow-lg'
                        : 'border-slate-800 bg-slate-950/50 hover:bg-slate-800/50'
                    }`}
                  >
                    {t.imageUrl && (
                      <div className="relative h-28 w-full overflow-hidden">
                        <img
                          src={t.imageUrl}
                          alt={t.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                        <span
                          className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            t.difficulty === 'difficile' || t.difficulty === 'expert'
                              ? 'bg-rose-600 text-white'
                              : t.difficulty === 'moyen'
                              ? 'bg-amber-600 text-white'
                              : 'bg-emerald-600 text-white'
                          }`}
                        >
                          {t.difficulty}
                        </span>
                      </div>
                    )}

                    <div className="p-3.5">
                      <h3 className="font-bold text-sm text-white leading-tight mb-1">
                        {t.name}
                      </h3>
                      <p className="text-xs text-slate-400 mb-2.5 line-clamp-1">
                        {t.region}
                      </p>

                      <div className="flex items-center gap-3 text-xs font-semibold text-slate-300">
                        <span className="flex items-center gap-1 text-slate-300">
                          <Mountain className="w-3.5 h-3.5 text-slate-400" />
                          {formatDistance(t.totalDistance)}
                        </span>
                        <span className="flex items-center gap-1 text-emerald-400">
                          <TrendingUp className="w-3.5 h-3.5" />
                          {formatElevation(t.elevationGain)} D+
                        </span>
                        <span className="text-slate-400">
                          {formatDuration(t.estimatedDuration)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section Fond de Carte */}
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-3">
              <Layers className="w-4 h-4 text-sky-400" />
              Fond de carte
            </span>

            <div className="grid grid-cols-2 gap-2">
              {TILE_OPTIONS.map((opt) => {
                const isActive = activeLayer === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => onChangeLayer(opt.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isActive
                        ? 'border-sky-500 bg-sky-950/40 ring-2 ring-sky-500/30 text-white'
                        : 'border-slate-800 bg-slate-950/40 text-slate-300 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">{opt.icon}</span>
                      <span className="text-xs font-bold">{opt.label}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      {opt.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section Filtre des Spots */}
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-3">
              <Filter className="w-4 h-4 text-amber-400" />
              Filtres des spots affichés
            </span>

            <div className="flex flex-wrap gap-2">
              {CATEGORY_FILTERS.map((cat) => {
                const isSelected = selectedCategories.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    onClick={() => onToggleCategory(cat.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                      isSelected
                        ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50'
                        : 'bg-slate-950/60 text-slate-500 border-slate-800 hover:text-slate-400'
                    }`}
                  >
                    <span>{cat.emoji}</span>
                    <span>{cat.label}</span>
                    {isSelected && <Check className="w-3 h-3 text-emerald-400 ml-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
