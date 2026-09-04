import React, { useState } from 'react';
import { Trail, ElevationPoint } from '../../types';
import { calculatePedestrianRoute } from '../../services/routingService';
import { formatDistance, formatElevation, formatDuration } from '../../utils/geoUtils';
import { X, Trash2, TrendingUp, Compass, Save } from 'lucide-react';

interface Waypoint {
  id: string;
  lat: number;
  lng: number;
  label: string;
}

interface TrailPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTrail: (newTrail: Trail) => void;
  userCoords: { lat: number; lng: number } | null;
}

export const TrailPlannerModal: React.FC<TrailPlannerModalProps> = ({
  isOpen,
  onClose,
  onSaveTrail,
  userCoords,
}) => {
  const [trailName, setTrailName] = useState('');
  const [region, setRegion] = useState('Limoges & Environs');
  const [difficulty, setDifficulty] = useState<Trail['difficulty']>('facile');
  const [description, setDescription] = useState('');
  const [waypoints, setWaypoints] = useState<Waypoint[]>(() => {
    if (userCoords) {
      return [
        {
          id: 'wp-start',
          lat: userCoords.lat,
          lng: userCoords.lng,
          label: 'Départ (Ma position)',
        },
      ];
    }
    return [
      { id: 'wp-1', lat: 45.8285, lng: 1.2672, label: 'Départ (Pont Saint-Étienne)' },
    ];
  });

  const [isCalculating, setIsCalculating] = useState(false);
  const [calculatedPoints, setCalculatedPoints] = useState<ElevationPoint[]>([]);
  const [stats, setStats] = useState<{ distance: number; gain: number; loss: number; duration: number }>({
    distance: 0,
    gain: 0,
    loss: 0,
    duration: 0,
  });

  if (!isOpen) return null;

  // Calcul du tracé reliant les étapes
  const handleCalculateRoute = async () => {
    if (waypoints.length < 2) {
      alert('Veuillez ajouter au moins 2 points pour tracer un parcours.');
      return;
    }

    setIsCalculating(true);
    try {
      let allPoints: ElevationPoint[] = [];
      let totalDist = 0;
      let totalGain = 0;
      let totalLoss = 0;
      let totalDur = 0;

      for (let i = 0; i < waypoints.length - 1; i++) {
        const p1 = waypoints[i];
        const p2 = waypoints[i + 1];
        const leg = await calculatePedestrianRoute(
          p1.lat,
          p1.lng,
          p2.lat,
          p2.lng,
          p2.label,
          240,
          280
        );

        allPoints = [...allPoints, ...leg.points];
        totalDist += leg.distance;
        totalGain += leg.elevationGain;
        totalLoss += leg.elevationLoss;
        totalDur += leg.duration;
      }

      setCalculatedPoints(allPoints);
      setStats({
        distance: totalDist,
        gain: totalGain,
        loss: totalLoss,
        duration: Math.round(totalDur / 60),
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleAddPresetPoint = (name: string, lat: number, lng: number) => {
    setWaypoints((prev) => [
      ...prev,
      {
        id: `wp-${Date.now()}`,
        lat,
        lng,
        label: name,
      },
    ]);
  };

  const handleRemoveWaypoint = (index: number) => {
    setWaypoints((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!trailName.trim()) {
      alert('Veuillez donner un nom à votre randonnée.');
      return;
    }

    const firstPt = waypoints[0] || { lat: 45.8336, lng: 1.2611 };

    const newTrail: Trail = {
      id: `pc-studio-${Date.now()}`,
      name: trailName.trim(),
      region: region.trim() || 'Randonnée personnalisée',
      difficulty,
      totalDistance: stats.distance || 4200,
      elevationGain: stats.gain || 95,
      elevationLoss: stats.loss || 95,
      maxElevation: 310,
      minElevation: 220,
      estimatedDuration: stats.duration || 65,
      points: calculatedPoints.length > 0 ? calculatedPoints : [
        { lat: firstPt.lat, lng: firstPt.lng, elevation: 240, distanceFromStart: 0 }
      ],
      initialCenter: [firstPt.lat, firstPt.lng],
      initialZoom: 15,
      description: description.trim() || 'Randonnée préparée sur le Studio PC WazeRando.',
      imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
    };

    onSaveTrail(newTrail);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* En-tête Studio PC */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-600 to-emerald-600 flex items-center justify-center text-white shadow-lg text-lg">
              💻
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Studio de Préparation PC</h2>
              <p className="text-xs text-slate-400">Tracez votre rando sur grand écran, retrouvez-la sur votre téléphone</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Informations Rando */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Nom de la randonnée
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Boucle des bords de Vienne secrète"
                value={trailName}
                onChange={(e) => setTrailName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Région / Secteur
              </label>
              <input
                type="text"
                placeholder="Ex: Limoges, Haute-Vienne"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Difficulté
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Trail['difficulty'])}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-sky-500"
              >
                <option value="facile">Facile</option>
                <option value="moyen">Moyen</option>
                <option value="difficile">Difficile</option>
                <option value="expert">Expert</option>
              </select>
            </div>
          </div>

          {/* Étapes du parcours */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-sky-400" />
                Étapes du parcours ({waypoints.length})
              </label>
              <span className="text-[11px] text-slate-400">Ajout rapide de points à Limoges :</span>
            </div>

            {/* Suggestions de points à ajouter */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {[
                { name: 'Cathédrale Saint-Étienne', lat: 45.8290, lng: 1.2660 },
                { name: 'Quai Louis Goujaud', lat: 45.8305, lng: 1.2678 },
                { name: 'Port du Naveix', lat: 45.8318, lng: 1.2686 },
                { name: 'Passerelle des Casseaux', lat: 45.8362, lng: 1.2645 },
                { name: 'Pont Saint-Martial', lat: 45.8290, lng: 1.2560 },
              ].map((pt) => (
                <button
                  key={pt.name}
                  type="button"
                  onClick={() => handleAddPresetPoint(pt.name, pt.lat, pt.lng)}
                  className="px-2.5 py-1 rounded-lg bg-slate-950/80 hover:bg-slate-800 text-sky-300 text-xs font-semibold border border-slate-800 hover:border-sky-500/50 transition-colors flex items-center gap-1"
                >
                  <span>+</span>
                  <span>{pt.name}</span>
                </button>
              ))}
            </div>

            {/* Liste ordonnée des étapes */}
            <div className="space-y-2 bg-slate-950/60 p-3 rounded-2xl border border-slate-800 max-h-40 overflow-y-auto">
              {waypoints.map((wp, index) => (
                <div
                  key={wp.id}
                  className="flex items-center justify-between gap-3 p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-sky-600 text-white font-black flex items-center justify-center text-[10px]">
                      {index + 1}
                    </span>
                    <span className="font-bold text-white">{wp.label}</span>
                    <span className="text-[10px] text-slate-500">
                      ({wp.lat.toFixed(4)}, {wp.lng.toFixed(4)})
                    </span>
                  </div>
                  {waypoints.length > 1 && (
                    <button
                      onClick={() => handleRemoveWaypoint(index)}
                      className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                      title="Supprimer cette étape"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleCalculateRoute}
                disabled={waypoints.length < 2 || isCalculating}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-xs shadow flex items-center gap-1.5 transition-all"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{isCalculating ? 'Calcul du tracé routier...' : 'Tracer sur les routes & calculer le D+'}</span>
              </button>
            </div>
          </div>

          {/* Résumé Métriques calculées */}
          {stats.distance > 0 && (
            <div className="p-3.5 bg-emerald-950/30 border border-emerald-800/40 rounded-2xl flex items-center justify-around text-xs">
              <div className="text-center">
                <div className="text-slate-400 font-medium">Distance</div>
                <div className="text-white font-black text-sm">{formatDistance(stats.distance)}</div>
              </div>
              <div className="text-center">
                <div className="text-slate-400 font-medium">Dénivelé D+</div>
                <div className="text-emerald-400 font-black text-sm">{formatElevation(stats.gain)}</div>
              </div>
              <div className="text-center">
                <div className="text-slate-400 font-medium">Durée estimée</div>
                <div className="text-white font-black text-sm">{formatDuration(stats.duration)}</div>
              </div>
            </div>
          )}

          {/* Description optionnelle */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Notes & Conseils de préparation
            </label>
            <textarea
              rows={2}
              placeholder="Conseils de matériel, passages remarquables, points de ravitaillement..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {/* Pied de page action */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 font-bold text-xs hover:bg-slate-800 transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!trailName.trim()}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-500 hover:to-emerald-500 text-white font-black text-xs shadow-lg flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>Enregistrer dans mon compte</span>
          </button>
        </div>
      </div>
    </div>
  );
};
