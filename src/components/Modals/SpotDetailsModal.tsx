import React, { useState } from 'react';
import { CommunitySpot } from '../../types';
import { calculateDistance, formatDistance, formatElevation } from '../../utils/geoUtils';
import { X, ThumbsUp, ThumbsDown, CheckCircle, Clock, MapPin, Send, MessageSquare } from 'lucide-react';

interface SpotDetailsModalProps {
  spot: CommunitySpot | null;
  onClose: () => void;
  onVote: (spotId: string, direction: 'up' | 'down') => void;
  onVerify: (spotId: string) => void;
  onAddComment: (spotId: string, text: string) => void;
  userPosition: { lat: number; lng: number } | null;
}

export const SpotDetailsModal: React.FC<SpotDetailsModalProps> = ({
  spot,
  onClose,
  onVote,
  onVerify,
  onAddComment,
  userPosition,
}) => {
  const [newComment, setNewComment] = useState('');
  const [justVerified, setJustVerified] = useState(false);

  if (!spot) return null;

  const distanceToUser = userPosition
    ? calculateDistance(userPosition.lat, userPosition.lng, spot.lat, spot.lng)
    : null;

  const handleVerifyClick = () => {
    onVerify(spot.id);
    setJustVerified(true);
    setTimeout(() => setJustVerified(false), 3000);
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    onAddComment(spot.id, newComment.trim());
    setNewComment('');
  };

  return (
    <div className="fixed inset-0 z-[1100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Photo optionnelle en haut */}
        {spot.photoUrl && (
          <div className="relative w-full h-48 sm:h-56 bg-slate-950 shrink-0">
            <img
              src={spot.photoUrl}
              alt={spot.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-950/70 backdrop-blur hover:bg-slate-800 flex items-center justify-center text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* En-tête si pas de photo */}
        {!spot.photoUrl && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/50">
            <div className="flex items-center gap-2">
              <span className="text-2xl">
                {spot.category === 'hazard'
                  ? '⚠️'
                  : spot.category === 'water'
                  ? '💧'
                  : spot.category === 'viewpoint'
                  ? '🏔️'
                  : spot.category === 'bivouac'
                  ? '⛺'
                  : '📍'}
              </span>
              <span className="text-xs uppercase font-bold text-slate-400">
                Détail du signalement
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Contenu */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  spot.category === 'hazard'
                    ? 'bg-rose-950/80 text-rose-400 border border-rose-800'
                    : spot.category === 'water'
                    ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-800'
                    : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                }`}
              >
                {spot.category.toUpperCase()}
              </span>

              {spot.hazardSeverity && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-600 text-white">
                  Danger {spot.hazardSeverity === 'high' ? 'Critique' : 'Modéré'}
                </span>
              )}

              {spot.waterDrinkable !== undefined && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-cyan-800 text-cyan-100">
                  {spot.waterDrinkable ? 'Potable' : 'Non testée'}
                </span>
              )}
            </div>

            <h2 className="text-lg sm:text-xl font-extrabold text-white">{spot.title}</h2>

            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {spot.createdAt} par <b className="text-slate-300">{spot.reportedBy}</b>
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800 text-sm text-slate-200 leading-relaxed">
            {spot.description}
          </div>

          {/* Métriques : Altitude & Distance */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-950/60 text-emerald-400 flex items-center justify-center font-bold text-sm">
                ⛰️
              </div>
              <div>
                <div className="text-slate-400 font-medium">Altitude</div>
                <div className="text-white font-extrabold text-sm">{formatElevation(spot.elevation, false)}</div>
              </div>
            </div>

            <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-950/60 text-sky-400 flex items-center justify-center font-bold text-sm">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <div className="text-slate-400 font-medium">Distance actuelle</div>
                <div className="text-white font-extrabold text-sm">
                  {distanceToUser !== null ? formatDistance(distanceToUser) : 'En sentier'}
                </div>
              </div>
            </div>
          </div>

          {/* Action Waze : Confirmation communautaire */}
          <div className="p-4 bg-slate-950/90 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300">Confirmation Communauté</span>
              <span className="text-emerald-400 font-semibold">
                {spot.verifiedCount} randonneurs ont confirmé
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleVerifyClick}
                className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  justVerified
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                <span>{justVerified ? 'Merci pour votre confirmation !' : 'Toujours d\'actualité ? (+1)'}</span>
              </button>

              <button
                onClick={() => onVote(spot.id, 'up')}
                className={`px-3 py-2.5 rounded-xl border flex items-center gap-1 text-xs font-bold transition-colors ${
                  spot.userVoted === 'up'
                    ? 'bg-emerald-600 text-white border-emerald-400'
                    : 'border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300'
                }`}
                title="Utile"
              >
                <ThumbsUp className="w-4 h-4" />
                <span>{spot.upvotes}</span>
              </button>

              <button
                onClick={() => onVote(spot.id, 'down')}
                className={`px-3 py-2.5 rounded-xl border flex items-center gap-1 text-xs font-bold transition-colors ${
                  spot.userVoted === 'down'
                    ? 'bg-rose-600 text-white border-rose-400'
                    : 'border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300'
                }`}
                title="Obsolète ou faux"
              >
                <ThumbsDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Commentaires communautaires */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <MessageSquare className="w-4 h-4 text-slate-400" />
              <span>Commentaires ({spot.comments?.length || 0})</span>
            </div>

            {spot.comments && spot.comments.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {spot.comments.map((comm) => (
                  <div
                    key={comm.id}
                    className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80 text-xs"
                  >
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="font-bold text-slate-300">{comm.author}</span>
                      <span className="text-[10px]">{comm.createdAt}</span>
                    </div>
                    <p className="text-slate-200">{comm.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic">
                Aucun commentaire pour le moment. Soyez le premier !
              </div>
            )}

            {/* Formulaire nouveau commentaire */}
            <form onSubmit={handleCommentSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="Ajouter une précision..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
