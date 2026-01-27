import React from 'react';
import { PlayerStats, Profession } from '../types';
import { Heart, Brain, Zap, Coins } from 'lucide-react';

interface Props {
  stats: PlayerStats;
  profession: Profession | null;
}

const StatBar: React.FC<Props> = ({ stats, profession }) => {
  const statItems = [
    { label: '体质', val: stats.physical, color: 'bg-rose-500', icon: <Heart className="w-3 h-3 text-rose-500" /> },
    { label: '压力', val: stats.mental, color: 'bg-indigo-500', icon: <Brain className="w-3 h-3 text-indigo-500" /> },
    { label: '饱食', val: stats.satiety, color: 'bg-amber-500', icon: <Zap className="w-3 h-3 text-amber-500" /> },
  ];

  return (
    <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-3xl mb-4 backdrop-blur-md">
      <div className="flex justify-between items-center mb-4">
        <span className="text-xs font-black text-slate-500 tracking-widest uppercase">
          {profession?.name || '待业'}
        </span>
        <div className="flex items-center gap-1 text-emerald-400 font-mono font-bold">
          <Coins className="w-4 h-4" /> ¥{stats.money}
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-3">
        {statItems.map((s, i) => (
          <div key={i}>
            <div className="flex items-center gap-1 mb-1 text-[10px] text-slate-500 uppercase font-bold">
              {s.icon} {s.label}
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${s.color}`} 
                style={{ width: `${Math.min(100, Math.max(0, s.val))}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatBar;
