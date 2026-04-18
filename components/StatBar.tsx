import React from 'react';
import { PlayerStats, Profession } from '../types';
import { formatCurrency, getHealthColor, getMentalColor, formatDateCN } from '../utils';
import { Heart, Brain, DollarSign, Utensils, Clock3, User, CalendarDays, ThermometerSun, CloudSun } from 'lucide-react';
import { Season, getSeasonName } from './weather';

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

const StatPill = ({
  icon,
  label,
  value,
  valueClass,
  extra,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  valueClass?: string;
  extra?: React.ReactNode;
}) => (
  <div className="glass-card rounded-2xl px-3 py-2 min-w-[88px] flex items-center gap-3 hover:scale-[1.02] transition-all duration-200">
    <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
      {icon}
    </div>
    <div className="leading-tight">
      <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">{label}</div>
      <div className={`text-sm font-bold ${valueClass || 'text-white'}`}>{value}</div>
      {extra}
    </div>
  </div>
);

const StatBar: React.FC<Props> = ({
  stats,
  profession,
  time,
  isDepressed,
  date,
  season,
  weatherTemp,
  bodyTemp
}) => {
  const bodyTempClass =
    bodyTemp >= 39 ? 'text-red-400' :
    bodyTemp >= 37.5 ? 'text-orange-400' :
    'text-emerald-400';

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/35 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
          
          {/* 左侧信息 */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="glass-card rounded-2xl px-4 py-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Date</div>
                <div className="text-sm font-semibold text-zinc-100">{formatDateCN(date)}</div>
              </div>
            </div>

            <div className="glass-card rounded-2xl px-4 py-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <Clock3 className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Time</div>
                <div className="text-lg font-black text-white tracking-wide">{time}</div>
              </div>
            </div>

            <div className="glass-card rounded-2xl px-4 py-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <CloudSun className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Weather</div>
                <div className="text-sm font-semibold text-zinc-100">
                  {getSeasonName(season)} · {weatherTemp}℃
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl px-4 py-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
                <ThermometerSun className={`w-5 h-5 ${bodyTempClass}`} />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Body Temp</div>
                <div className={`text-sm font-bold ${bodyTempClass}`}>
                  {bodyTemp}℃
                </div>
              </div>
            </div>
          </div>

          {/* 中间职业 */}
          <div className="glass-card rounded-2xl px-4 py-3 flex items-center gap-3 self-start xl:self-auto">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <User className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Profession</div>
              <div className="text-sm font-bold text-white">
                {profession?.name || '无业游民'}
                {profession?.schedule && (
                  <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-400">
                    {profession.schedule}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 右侧状态 */}
          <div className="flex flex-wrap items-center gap-2">
            <StatPill
              icon={<Heart className={`w-4 h-4 ${getHealthColor(stats.physical)}`} />}
              label="Physical"
              value={stats.physical}
              valueClass={getHealthColor(stats.physical)}
            />
            <StatPill
              icon={<Brain className={`w-4 h-4 ${getMentalColor(stats.mental)}`} />}
              label="Mental"
              value={
                <span className="inline-flex items-center gap-1">
                  {stats.mental}
                  {isDepressed && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                </span>
              }
              valueClass={getMentalColor(stats.mental)}
            />
            <StatPill
              icon={<Utensils className={`w-4 h-4 ${stats.satiety < 20 ? 'text-red-400' : 'text-orange-300'}`} />}
              label="Satiety"
              value={stats.satiety}
              valueClass={stats.satiety < 20 ? 'text-red-400' : 'text-orange-300'}
            />
            <StatPill
              icon={<DollarSign className={`w-4 h-4 ${stats.money < 0 ? 'text-red-400' : 'text-emerald-400'}`} />}
              label="Money"
              value={formatCurrency(stats.money)}
              valueClass={stats.money < 0 ? 'text-red-400' : 'text-emerald-400'}
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default StatBar;
