import React, { useState, useRef, useMemo } from 'react';
import { Trail, ElevationPoint, CommunitySpot } from '../../types';
import { formatDistance, formatElevation, formatDuration, getSlopeColor } from '../../utils/geoUtils';
import { ChevronUp, ChevronDown, Mountain, TrendingUp, TrendingDown, Timer, Navigation } from 'lucide-react';

interface ElevationProfileProps {
  trail: Trail;
  spots: CommunitySpot[];
  hoveredPoint: ElevationPoint | null;
  onHoverPoint: (point: ElevationPoint | null) => void;
  onSelectSpot: (spot: CommunitySpot) => void;
}

export const ElevationProfile: React.FC<ElevationProfileProps> = ({
  trail,
  spots,
  hoveredPoint,
  onHoverPoint,
  onSelectSpot,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const svgRef = useRef<SVGSVGElement>(null);

  const points = trail.points;
  const totalDist = trail.totalDistance;
  const minEle = trail.minElevation;
  const maxEle = trail.maxElevation;
  const eleSpan = Math.max(1, maxEle - minEle);

  // Dimensions SVG
  const width = 800;
  const height = 140;
  const padTop = 15;
  const padBottom = 25;
  const usableHeight = height - padTop - padBottom;

  // Conversion Coordonnées Altimétrie -> SVG
  const getCoordinates = (dist: number, ele: number) => {
    const x = totalDist > 0 ? (dist / totalDist) * width : 0;
    const y = padTop + usableHeight - ((ele - minEle) / eleSpan) * usableHeight;
    return { x, y };
  };

  // Tracé SVG de la courbe
  const { pathD, areaD } = useMemo(() => {
    if (points.length < 2) return { pathD: '', areaD: '' };

    let pD = '';
    points.forEach((p, idx) => {
      const { x, y } = getCoordinates(p.distanceFromStart, p.elevation);
      if (idx === 0) {
        pD += `M ${x} ${y}`;
      } else {
        pD += ` L ${x} ${y}`;
      }
    });

    const lastX = width;
    const bottomY = height - padBottom;
    const aD = `${pD} L ${lastX} ${bottomY} L 0 ${bottomY} Z`;

    return { pathD: pD, areaD: aD };
  }, [points, totalDist, minEle, maxEle]);

  // Gestion du survol / drag sur le profil
  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current || points.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clientX / rect.width));
    const targetDist = ratio * totalDist;

    // Trouver le point le plus proche
    let closest = points[0];
    let minDiff = Math.abs(closest.distanceFromStart - targetDist);
    for (let i = 1; i < points.length; i++) {
      const diff = Math.abs(points[i].distanceFromStart - targetDist);
      if (diff < minDiff) {
        minDiff = diff;
        closest = points[i];
      }
    }
    onHoverPoint(closest);
  };

  const handlePointerLeave = () => {
    onHoverPoint(null);
  };

  // Coordonnées du curseur actif
  const activeCoord = hoveredPoint
    ? getCoordinates(hoveredPoint.distanceFromStart, hoveredPoint.elevation)
    : null;

  // Spots positionnés le long du profil
  const spotsOnTrail = useMemo(() => {
    return spots
      .filter((s) => s.trailId === trail.id && s.distanceOnTrail !== undefined)
      .map((s) => {
        const { x, y } = getCoordinates(s.distanceOnTrail!, s.elevation);
        return { ...s, svgX: x, svgY: y };
      });
  }, [spots, trail, minEle, maxEle, totalDist]);

  return (
    <div className="bg-slate-900/90 backdrop-blur-xl border-t border-slate-700/60 shadow-2xl transition-all duration-300 select-none">
      {/* Barre de stats & toggle mobile */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800/80">
        <div className="flex items-center gap-3 sm:gap-6 overflow-x-auto no-scrollbar py-0.5 text-xs sm:text-sm">
          <div className="flex items-center gap-1.5 font-bold text-slate-200">
            <Navigation className="w-4 h-4 text-emerald-400" />
            <span>{formatDistance(trail.totalDistance)}</span>
          </div>

          <div className="flex items-center gap-1 font-semibold text-emerald-400">
            <TrendingUp className="w-4 h-4" />
            <span>{formatElevation(trail.elevationGain)} D+</span>
          </div>

          <div className="flex items-center gap-1 font-semibold text-sky-400">
            <TrendingDown className="w-4 h-4" />
            <span>{formatElevation(trail.elevationLoss, false)} D-</span>
          </div>

          <div className="flex items-center gap-1 text-slate-300 font-medium hidden sm:flex">
            <Mountain className="w-4 h-4 text-amber-400" />
            <span>
              {trail.minElevation}m - {trail.maxElevation}m
            </span>
          </div>

          <div className="flex items-center gap-1 text-slate-400 font-medium">
            <Timer className="w-4 h-4 text-slate-400" />
            <span>{formatDuration(trail.estimatedDuration)}</span>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700/50 ml-2 shrink-0"
        >
          <span className="hidden sm:inline">{isExpanded ? 'Réduire' : 'Profil Dénivelé'}</span>
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      {/* Graphique SVG interactif */}
      {isExpanded && (
        <div className="px-3 pt-2 pb-2 relative">
          {/* Bulle d'information flottante sur le curseur */}
          {hoveredPoint && activeCoord && (
            <div
              style={{
                left: `${(activeCoord.x / width) * 100}%`,
              }}
              className="absolute top-2 -translate-x-1/2 -translate-y-2 pointer-events-none z-20 bg-slate-950/95 border border-emerald-500/50 shadow-xl px-2.5 py-1 rounded-lg text-center whitespace-nowrap animate-fade-in"
            >
              <div className="text-emerald-400 font-extrabold text-sm leading-tight">
                {hoveredPoint.elevation} m
              </div>
              <div className="flex items-center justify-center gap-2 text-[10px] text-slate-300">
                <span>{formatDistance(hoveredPoint.distanceFromStart)}</span>
                {hoveredPoint.slopePercentage !== undefined && (
                  <span
                    style={{ color: getSlopeColor(hoveredPoint.slopePercentage) }}
                    className="font-bold"
                  >
                    {hoveredPoint.slopePercentage > 0 ? '+' : ''}
                    {hoveredPoint.slopePercentage}%
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="relative w-full h-28 sm:h-32">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-full cursor-pointer touch-none"
              preserveAspectRatio="none"
              onPointerMove={handlePointerMove}
              onPointerLeave={handlePointerLeave}
              onPointerDown={handlePointerMove}
            >
              <defs>
                {/* Dégradé sous la courbe du dénivelé */}
                <linearGradient id="elevationGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
                  <stop offset="70%" stopColor="#059669" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#047857" stopOpacity="0.0" />
                </linearGradient>

                {/* Dégradé de la ligne selon la pente */}
                <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="50%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
              </defs>

              {/* Lignes de repère horizontales (altitudes) */}
              <line
                x1="0"
                y1={padTop}
                x2={width}
                y2={padTop}
                stroke="#334155"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <line
                x1="0"
                y1={padTop + usableHeight / 2}
                x2={width}
                y2={padTop + usableHeight / 2}
                stroke="#1e293b"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              <line
                x1="0"
                y1={height - padBottom}
                x2={width}
                y2={height - padBottom}
                stroke="#334155"
                strokeWidth="1"
              />

              {/* Remplissage de la surface altimétrique */}
              <path d={areaD} fill="url(#elevationGrad)" />

              {/* Ligne de relief */}
              <path
                d={pathD}
                fill="none"
                stroke="url(#lineGrad)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Spots communautaires sur la courbe */}
              {spotsOnTrail.map((spot) => (
                <g
                  key={spot.id}
                  className="cursor-pointer group"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectSpot(spot);
                  }}
                >
                  <line
                    x1={spot.svgX}
                    y1={spot.svgY}
                    x2={spot.svgX}
                    y2={height - padBottom}
                    stroke="#475569"
                    strokeDasharray="2 2"
                    strokeWidth="1"
                    className="group-hover:stroke-emerald-400 transition-colors"
                  />
                  <circle
                    cx={spot.svgX}
                    cy={spot.svgY}
                    r="5"
                    className={`${
                      spot.category === 'hazard'
                        ? 'fill-rose-500 stroke-rose-200'
                        : spot.category === 'water'
                        ? 'fill-cyan-400 stroke-cyan-100'
                        : 'fill-emerald-400 stroke-white'
                    } stroke-2 shadow-md transition-transform group-hover:scale-150`}
                  />
                </g>
              ))}

              {/* Ligne verticale & point au survol */}
              {activeCoord && (
                <g>
                  <line
                    x1={activeCoord.x}
                    y1={padTop}
                    x2={activeCoord.x}
                    y2={height - padBottom}
                    stroke="#34d399"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                  <circle
                    cx={activeCoord.x}
                    cy={activeCoord.y}
                    r="5"
                    className="fill-emerald-300 stroke-white stroke-2 shadow-lg"
                  />
                </g>
              )}

              {/* Labels d'altitude min / max */}
              <text x="6" y={padTop + 10} fill="#94a3b8" fontSize="10" fontWeight="bold">
                {maxEle} m
              </text>
              <text x="6" y={height - padBottom - 4} fill="#64748b" fontSize="10">
                {minEle} m
              </text>
              <text x={width - 50} y={height - 8} fill="#64748b" fontSize="10" textAnchor="end">
                {formatDistance(totalDist)}
              </text>
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};
