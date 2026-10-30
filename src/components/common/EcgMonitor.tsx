import React, { useState, useEffect } from 'react';
import { Activity, Heart, ShieldAlert } from 'lucide-react';

interface EcgMonitorProps {
  heartRate?: number;
  label?: string;
}

export const EcgMonitor: React.FC<EcgMonitorProps> = ({ heartRate = 74, label = 'Lead II Telemetry' }) => {
  const [pulseScale, setPulseScale] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulseScale((prev) => !prev);
    }, (60 / heartRate) * 1000);
    return () => clearInterval(interval);
  }, [heartRate]);

  return (
    <div className="rounded-2xl bg-slate-950 p-4 border border-slate-800 text-white shadow-xl relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-15 pointer-events-none">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="ecg-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#10b981" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#ecg-grid)" />
        </svg>
      </div>

      <div className="relative z-10 flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
            {label} • LIVE MONITOR
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400">
          <Heart className={`w-3.5 h-3.5 text-rose-500 transition-transform duration-150 ${pulseScale ? 'scale-125' : 'scale-100'}`} />
          <span>{heartRate} BPM</span>
        </div>
      </div>

      {/* ECG Animated Waveform Line */}
      <div className="relative h-14 w-full flex items-center">
        <svg className="w-full h-full" viewBox="0 0 500 80" preserveAspectRatio="none">
          {/* Faint trail */}
          <path
            d="M 0 40 L 40 40 L 50 35 L 60 45 L 70 40 L 100 40 L 110 10 L 120 70 L 130 40 L 140 40 L 155 35 L 170 40 L 220 40 L 230 35 L 240 45 L 250 40 L 280 40 L 290 10 L 300 70 L 310 40 L 320 40 L 335 35 L 350 40 L 400 40 L 410 35 L 420 45 L 430 40 L 460 40 L 470 10 L 480 70 L 490 40 L 500 40"
            fill="none"
            stroke="#059669"
            strokeWidth="1.5"
            opacity="0.3"
          />
          {/* Glowing pulse path */}
          <path
            d="M 0 40 L 40 40 L 50 35 L 60 45 L 70 40 L 100 40 L 110 10 L 120 70 L 130 40 L 140 40 L 155 35 L 170 40 L 220 40 L 230 35 L 240 45 L 250 40 L 280 40 L 290 10 L 300 70 L 310 40 L 320 40 L 335 35 L 350 40 L 400 40 L 410 35 L 420 45 L 430 40 L 460 40 L 470 10 L 480 70 L 490 40 L 500 40"
            fill="none"
            stroke="#34d399"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-ecg"
          />
        </svg>
      </div>

      <div className="relative z-10 flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800">
        <span>Rhythm: Normal Sinus</span>
        <span>SpO2: <strong className="text-emerald-400">98%</strong></span>
        <span>Resp: <strong className="text-cyan-400">16/m</strong></span>
        <span>Temp: <strong className="text-amber-400">36.8°C</strong></span>
      </div>
    </div>
  );
};

