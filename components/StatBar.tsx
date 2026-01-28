--- START OF FILE StatBar.tsx ---
import React from 'react';
import { PlayerStats, Profession } from '../types';
import { formatCurrency, getHealthColor, getMentalColor } from '../utils';
import { Heart, Brain, DollarSign, Utensils, Clock, User, AlertTriangle, ShieldAlert } from 'lucide-react';

interface Props {
  stats: PlayerStats;
  profession: Profession | null;
  time: string;
  isDepressed: boolean;
}

const StatBar: React.FC<Props> = ({ stats, profession, time, isDepressed }) => {
  return (
    <div className="bg-black/80 backdrop-blur-md border-b-2 border-cyan-900/50 p-3 sticky top-0 z-50 shadow-[0_5px_20px_rgba(0,0,0,0.8)]">
      <div className="max-w-4xl mx-auto flex flex-wrap justify-between items-center gap-y-2">
        
        {/* Time & Profession Group */}
        <div className="flex items-center space-x-4 bg-slate-900/50 px-3 py-1 rounded border border-slate-700">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="font-mono text-xl text-cyan-100 font-bold tracking-widest">{time}</span>
          </div>
          <div className="h-4 w-px bg-slate-600"></div>
          <div className="flex items-center space-x-2">
             <span className="text-xs text-slate-400">DAY</span>
             <span className="font-mono text-lg text-white font-bold">{stats.daysSurvived}</span>
          </div>
          <div className="h-4 w-px bg-slate-600"></div>
          <div className="flex items-center space-x-1">
            <User className="w-3 h-3 text-slate-400" />
            <span className="text-sm font-bold text-slate-300">{profession?.name || '无业'}</span>
          </div>
        </div>

        {/* Stats Group */}
        <div className="flex flex-wrap items-center gap-3 md:gap-6">
          
          {/* Physical */}
          <div className="flex flex-col items-center w-12 group relative">
            <Heart className={`w-5 h-5 mb-1 ${getHealthColor(stats.physical)} transition-colors`} />
            <span className={`text-xs font-mono font-bold ${getHealthColor(stats.physical)}`}>{stats.physical}</span>
            {stats.physical > 90 && <ShieldAlert className="absolute -top-1 -right-1 w-3 h-3 text-purple-500 animate-bounce" />}
            <div className="w-full bg-gray-800 h-1 mt-1 rounded-full overflow-hidden">
                <div className={`h-full ${stats.physical > 90 ? 'bg-purple-500' : 'bg-red-500'}`} style={{width: `${stats.physical}%`}}></div>
            </div>
          </div>

          {/* Mental */}
          <div className="flex flex-col items-center w-12">
            <div className="relative">
                <Brain className={`w-5 h-5 mb-1 ${getMentalColor(stats.mental)}`} />
                {isDepressed && <AlertTriangle className="absolute -top-2 -right-2 w-3 h-3 text-red-500 animate-ping" />}
            </div>
            <span className={`text-xs font-mono font-bold ${getMentalColor(stats.mental)}`}>{stats.mental}</span>
             <div className="w-full bg-gray-800 h-1 mt-1 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{width: `${stats.mental}%`}}></div>
            </div>
          </div>

          {/* Satiety */}
          <div className="flex flex-col items-center w-12">
            <Utensils className={`w-5 h-5 mb-1 ${stats.satiety < 20 ? 'text-red-500 animate-pulse' : 'text-orange-400'}`} />
            <span className="text-xs font-mono font-bold text-orange-200">{stats.satiety}</span>
             <div className="w-full bg-gray-800 h-1 mt-1 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500" style={{width: `${stats.satiety}%`}}></div>
            </div>
          </div>

          {/* Money */}
          <div className="flex items-center space-x-1 bg-green-900/20 px-3 py-1 rounded border border-green-900/50">
            <DollarSign className="w-4 h-4 text-green-400" />
            <span className={`font-mono font-bold ${stats.money < 0 ? 'text-red-400' : 'text-green-300'}`}>
              {formatCurrency(stats.money)}
            </span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default StatBar;
