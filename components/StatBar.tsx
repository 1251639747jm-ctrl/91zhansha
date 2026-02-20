import React from 'react';
import { PlayerStats, Profession } from '../types';
import { formatCurrency, getHealthColor, getMentalColor, formatDateCN } from '../utils';
import { Heart, Brain, DollarSign, Utensils, Clock, User, Calendar } from 'lucide-react';

import { Season, getSeasonName } from './weather'; // 根据你的实际路径引入

interface Props {
  stats: PlayerStats;
  profession: Profession | null;
  time: string;
  isDepressed: boolean;
  date: Date;
  season: Season;
  weatherTemp: number;
  bodyTemp: number;
}

const StatBar: React.FC<Props> = ({ stats, profession, time, isDepressed, date, season, weatherTemp, bodyTemp }) => {
  return (
    <div className="bg-black/90 backdrop-blur-md border-b border-zinc-800 p-3 sticky top-0 z-50 shadow-2xl">
      <div className="max-w-4xl mx-auto flex flex-wrap justify-between items-center gap-y-2">
        
        {/* Date & Time Group */}
        <div className="flex items-center space-x-3 bg-zinc-900/80 px-4 py-2 rounded-lg border border-zinc-700">
          <div className="flex items-center space-x-2 text-zinc-300 border-r border-zinc-600 pr-3">
             <Calendar className="w-4 h-4 text-red-500" />
             <span className="font-mono text-sm font-bold tracking-tight">{formatDateCN(date)}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-cyan-500 animate-pulse" />
            <span className="font-mono text-lg text-white font-bold">{time}</span>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center bg-zinc-900/80 px-3 py-1 rounded-lg border border-zinc-700">
          <span className="text- text-zinc-400 font-mono flex items-center gap-1">
             {getSeasonName(season)} <span className="text-white font-bold">{weatherTemp}℃</span>
          </span>
          <span className={`text- font-mono font-bold mt-0.5 ${bodyTemp > 38 ? 'text-red-500 animate-pulse' : 'text-green-400'}`}>
            体温 {bodyTemp}℃
          </span>
        </div>
        {/* Profession Badge */}
         <div className="hidden md:flex items-center space-x-2 px-3 py-1 rounded bg-zinc-900/50 border border-zinc-700">
            <User className="w-3 h-3 text-zinc-400" />
            <span className="text-sm font-bold text-zinc-200">{profession?.name || '无业'}</span>
            <span className="text-xs bg-zinc-800 px-1 rounded text-zinc-500">{profession?.schedule}</span>
          </div>

        {/* Stats Group */}
        <div className="flex flex-wrap items-center gap-4">
          
          <div className="flex flex-col items-center group relative">
            <Heart className={`w-5 h-5 ${getHealthColor(stats.physical)}`} />
            <span className={`text-[10px] font-mono font-bold mt-0.5 ${getHealthColor(stats.physical)}`}>{stats.physical}</span>
          </div>

          <div className="flex flex-col items-center group relative">
            <Brain className={`w-5 h-5 ${getMentalColor(stats.mental)}`} />
            <span className={`text-[10px] font-mono font-bold mt-0.5 ${getMentalColor(stats.mental)}`}>{stats.mental}</span>
            {isDepressed && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>}
          </div>

          <div className="flex flex-col items-center group relative">
            <Utensils className={`w-5 h-5 ${stats.satiety < 20 ? 'text-red-500 animate-pulse' : 'text-orange-400'}`} />
            <span className="text-[10px] font-mono font-bold mt-0.5 text-orange-200">{stats.satiety}</span>
          </div>

          <div className="flex items-center space-x-1 bg-green-900/20 px-3 py-1.5 rounded border border-green-900/40 ml-2">
            <DollarSign className="w-4 h-4 text-green-500" />
            <span className={`font-mono font-bold ${stats.money < 0 ? 'text-red-400' : 'text-green-400'}`}>
              {formatCurrency(stats.money)}
            </span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default StatBar;
