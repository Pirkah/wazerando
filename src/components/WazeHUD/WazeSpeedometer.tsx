import React from 'react';
import { Mountain, Compass } from 'lucide-react';

interface WazeSpeedometerProps {
  speed: number | null;
  altitude: number | null;
  heading: number | null;
  accuracy?: number;
  slope?: number;
}

export const WazeSpeedometer: React.FC<WazeSpeedometerProps> = ({
  speed = 0,
  altitude = 1200,
  heading = 0,
  slope = 0,
}) => {
  const displaySpeed = speed !== null ? speed : 0;
  const displayAltitude = altitude !== null ? Math.round(altitude) : '--';

  return (
    <div className="absolute bottom-24 left-4 z-[900] pointer-events-auto select-none">
      <div className="flex items-center gap-2.5">
        {/* Compteur Vitesse Waze */}
        <div className="flex flex-col items-center justify-center w-16 h-16 rounded-2xl bg-slate-900/90 backdrop-blur-xl border-2 border-slate-700/80 shadow-hud text-white">
          <div className="text-xl font-black tracking-tight leading-none text-emerald-400">
            {displaySpeed.toFixed(1)}
          </div>
          <div className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">
            km/h
          </div>
        </div>

        {/* Badge Altimétrie & Boussole */}
        <div className="flex flex-col gap-1.5">
          {/* Altitude */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 shadow-md text-xs font-bold text-white">
            <Mountain className="w-3.5 h-3.5 text-amber-400" />
            <span>{displayAltitude} m</span>
            {slope !== undefined && slope !== 0 && (
              <span
                className={`text-[10px] px-1 py-0.2 rounded font-extrabold ${
                  slope > 0 ? 'bg-rose-950 text-rose-400' : 'bg-emerald-950 text-emerald-400'
                }`}
              >
                {slope > 0 ? '+' : ''}
                {slope}%
              </span>
            )}
          </div>

          {/* Boussole / Cap */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900/85 backdrop-blur-xl border border-slate-700/80 shadow-md text-[11px] font-semibold text-slate-300">
            <Compass
              style={{ transform: `rotate(${heading || 0}deg)` }}
              className="w-3.5 h-3.5 text-sky-400 transition-transform duration-200"
            />
            <span>{Math.round(heading || 0)}°</span>
          </div>
        </div>
      </div>
    </div>
  );
};
