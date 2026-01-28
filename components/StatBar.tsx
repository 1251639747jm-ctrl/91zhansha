import React from 'react';
import { PlayerStats, Profession } from './types';
import { formatCurrency, getHealthColor, getMentalColor, formatDateCN } from './utils';
import { Heart, Brain, DollarSign, Clock, User, Calendar } from 'lucide-react';

interface Props {
  stats: PlayerStats;
  profession: Profession | null;
  time: string;
  isDepressed: boolean;
  date: Date;
}

const StatBar: React.FC<Props> = ({ stats, profession, time, isDepressed, date }) => {
  return (
    <div className="bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800 p-3 sticky top-0 z-50 shadow-2xl">
      <div className="max-w-4xl mx-auto flex flex-wrap justify-between items-center gap-y-3">
        
        {/* Date & Time Group */}
        <div className="flex items-center space-x-3 bg-zinc-900/80 px-4 py-2 rounded-lg border border-zinc-700">
          <div className="flex items-center space-x-2 text-zinc-300">
             <Calendar className="w-4 h-4 text-red-500" />
             <span className="font-mono text-sm font-bold tracking-tight">{formatDateCN(date)}</span>
          </div>
          <div className="h-4 w-px bg-zinc-600"></div>
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-cyan-500 animate-pulse" />
            <span className="font-mono text-lg text-white font-bold">{time}</span>
          </div>
        </div>

        {/* Profession Badge */}
         <div className="flex items-center space-x-2 px-3 py-1 rounded bg-zinc-900/50 border border-zinc-700">
            <User className="w-4 h-4 text-zinc-400" />
            <span className="text-sm font-bold text-zinc-200">{profession?.name || '无业'}</span>
            {profession && <span className="text-xs bg-zinc-800 px-1.5 rounded text-zinc-500">{profession.schedule}</span>}
          </div>

        {/* Stats Group */}
        <div className="flex flex-wrap items-center gap-4">
          
          {/* Physical */}
          <div className="flex flex-col items-center w-12 group">
            <Heart className={`w-5 h-5 mb-1 ${getHealthColor(stats.physical)}`} />
            <span className={`text-xs font-mono font-bold ${getHealthColor(stats.physical)}`}>{stats.physical}</span>
            <div className="w-full bg-zinc-800 h-1 mt-1 rounded-full overflow-hidden">
                <div className={`h-full ${getHealthColor(stats.physical).replace('text', 'bg')}`} style={{width: `${stats.physical}%`}}></div>
            </div>
          </div>

          {/* Mental */}
          <div className="flex flex-col items-center w-12 group">
            <Brain className={`w-5 h-5 mb-1 ${getMentalColor(stats.mental)}`} />
            <span className={`text-xs font-mono font-bold ${getMentalColor(stats.mental)}`}>{stats.mental}</span>
            <div className="w-full bg-zinc-800 h-1 mt-1 rounded-full overflow-hidden">
                <div className={`h-full ${getMentalColor(stats.mental).replace('text', 'bg')}`} style={{width: `${stats.mental}%`}}></div>
            </div>
          </div>

          {/* Money */}
          <div className="flex items-center space-x-1 bg-green-950/20 px-3 py-1.5 rounded border border-green-900/30">
            <DollarSign className="w-4 h-4 text-green-500" />
            <span className={`text-sm font-mono font-bold ${stats.money < 0 ? 'text-red-400' : 'text-green-400'}`}>
              {formatCurrency(stats.money)}
            </span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default StatBar;
