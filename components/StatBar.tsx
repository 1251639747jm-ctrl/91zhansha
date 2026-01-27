import React from 'react';
import { PlayerStats, Profession } from '../types';
import { formatCurrency, getHealthColor, getMentalColor } from '../utils';
import { Heart, Brain, DollarSign, Utensils, Clock, User, AlertTriangle } from 'lucide-react';

interface Props {
  stats: PlayerStats;
  profession: Profession | null;
  time: string;
  isDepressed: boolean;
}

const StatBar: React.FC<Props> = ({ stats, profession, time, isDepressed }) => {
  return (
    <div className="bg-slate-800 p-4 rounded-lg shadow-lg border border-slate-700 mb-4 sticky top-0 z-10">
      <div className="flex flex-wrap justify-between items-center gap-4 text-sm md:text-base">
        
        <div className="flex items-center space-x-2 w-full md:w-auto border-b md:border-b-0 border-slate-700 pb-2 md:pb-0">
          <Clock className="w-5 h-5 text-slate-400" />
          <span className="font-mono text-xl text-white">{time}</span>
          <span className="text-slate-400 ml-2">第 {stats.daysSurvived} 天</span>
        </div>

        <div className="flex items-center space-x-2">
          <User className="w-5 h-5 text-indigo-400" />
          <span className="font-bold text-indigo-200">{profession?.name || '无业'}</span>
        </div>

        <div className="flex items-center space-x-2" title="身体健康：过低猝死，过高被抓">
          <Heart className={`w-5 h-5 ${getHealthColor(stats.physical)}`} />
          <span className={`font-mono font-bold ${getHealthColor(stats.physical)}`}>
            {stats.physical}
          </span>
          {stats.physical > 85 && <AlertTriangle className="w-4 h-4 text-purple-500 animate-bounce" />}
        </div>

        <div className="flex items-center space-x-2" title="心理健康：过低抑郁/自杀">
          <Brain className={`w-5 h-5 ${getMentalColor(stats.mental)}`} />
          <span className={`font-mono font-bold ${getMentalColor(stats.mental)}`}>
            {stats.mental}
          </span>
          {isDepressed && <span className="text-xs bg-red-900 text-red-200 px-1 rounded">抑郁</span>}
        </div>

        <div className="flex items-center space-x-2">
          <Utensils className="w-5 h-5 text-orange-400" />
          <span className="font-mono text-orange-200">{stats.satiety}</span>
        </div>

        <div className="flex items-center space-x-2">
          <DollarSign className="w-5 h-5 text-green-400" />
          <span className="font-mono text-green-200">{formatCurrency(stats.money)}</span>
        </div>
        
      </div>
      
      {/* Progress Bars for visual feedback */}
      <div className="grid grid-cols-3 gap-2 mt-2 h-1">
        <div className="bg-slate-700 rounded overflow-hidden">
            <div className={`h-full transition-all duration-500 ${stats.physical > 90 ? 'bg-purple-500' : 'bg-red-500'}`} style={{width: `${stats.physical}%`}}></div>
        </div>
        <div className="bg-slate-700 rounded overflow-hidden">
            <div className="bg-blue-500 h-full transition-all duration-500" style={{width: `${stats.mental}%`}}></div>
        </div>
        <div className="bg-slate-700 rounded overflow-hidden">
            <div className="bg-orange-500 h-full transition-all duration-500" style={{width: `${stats.satiety}%`}}></div>
        </div>
      </div>
    </div>
  );
};

export default StatBar;
