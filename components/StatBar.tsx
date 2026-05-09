import React from 'react';
import { PlayerStats, Profession } from '../types';
import { formatCurrency, formatDateCN } from '../utils';
import {
  Heart,
  Brain,
  Utensils,
  Coins,
  Clock3,
  Briefcase,
  CloudSun,
  ThermometerSun,
  CalendarDays,
} from 'lucide-react';
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

/**
 * 单条状态指示器：小图标 + 标签 + 数值 + 进度条
 */
const StatMeter: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: number;
  max: number;
  gradient: string; // eg. 'from-rose-500 to-orange-400'
  critical?: boolean;
  pulseDot?: boolean;
}> = ({ icon, label, value, max, gradient, critical, pulseDot }) => {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="flex-1 min-w-[120px]">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5 text-[10px] tracking-[0.22em] uppercase text-zinc-400 font-semibold">
          <span className="w-4 h-4 flex items-center justify-center">{icon}</span>
          <span>{label}</span>
          {pulseDot && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
        </div>
        <div className={`text-xs font-bold tabular-nums ${critical ? 'text-red-300' : 'text-white'}`}>
          {value}
          <span className="text-zinc-500 font-normal">/{max}</span>
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden border border-white/[0.04]">
        <div
          className={`h-full bg-gradient-to-r ${gradient} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

/**
 * 信息小块：icon + 标签 + 主值
 */
const InfoCell: React.FC<{
  icon: React.ReactNode;
  iconWrap?: string;
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
}> = ({ icon, iconWrap, label, value, sub }) => (
  <div className="flex items-center gap-2.5 min-w-0">
    <div
      className={`w-8 h-8 shrink-0 rounded-lg border flex items-center justify-center ${
        iconWrap || 'bg-white/[0.04] border-white/[0.08]'
      }`}
    >
      {icon}
    </div>
    <div className="leading-tight min-w-0">
      <div className="text-[9px] uppercase tracking-[0.24em] text-zinc-500">{label}</div>
      <div className="text-sm font-bold text-white truncate">{value}</div>
      {sub && <div className="text-[10px] text-zinc-500 truncate">{sub}</div>}
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
  bodyTemp,
}) => {
  const bodyTempClass =
    bodyTemp >= 39 ? 'text-red-400' :
    bodyTemp >= 37.5 ? 'text-orange-400' :
    'text-emerald-400';

  const moneyNeg = stats.money < 0;

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-black/30 backdrop-blur-2xl">
      {/* 顶边渐变条，增加层级感 */}
      <div className="h-[2px] bg-gradient-to-r from-rose-500/50 via-amber-400/60 to-indigo-500/50" />

      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-3">
        {/* 上行：时间/日期/天气/职业 + 金钱 */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <InfoCell
            icon={<Clock3 className="w-4 h-4 text-rose-300" />}
            iconWrap="bg-rose-500/10 border-rose-400/20"
            label="TIME"
            value={<span className="tabular-nums tracking-wide">{time}</span>}
            sub={
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="w-3 h-3 opacity-60" />
                {formatDateCN(date)}
              </span>
            }
          />

          <div className="h-8 w-px bg-white/[0.06] hidden md:block" />

          <InfoCell
            icon={<CloudSun className="w-4 h-4 text-amber-300" />}
            iconWrap="bg-amber-500/10 border-amber-400/20"
            label="WEATHER"
            value={<span>{getSeasonName(season)} · {weatherTemp}℃</span>}
            sub={
              <span className={`inline-flex items-center gap-1 ${bodyTempClass}`}>
                <ThermometerSun className="w-3 h-3" />
                体温 {bodyTemp}℃
              </span>
            }
          />

          <div className="h-8 w-px bg-white/[0.06] hidden md:block" />

          <InfoCell
            icon={<Briefcase className="w-4 h-4 text-indigo-300" />}
            iconWrap="bg-indigo-500/10 border-indigo-400/20"
            label="PROFESSION"
            value={profession?.name || '无业游民'}
            sub={profession?.schedule ? `班次 · ${profession.schedule}` : '自由身'}
          />

          <div className="flex-1 hidden md:block" />

          {/* 金钱：放右端做强调 */}
          <div className="flex items-center gap-2">
            <div
              className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
                moneyNeg
                  ? 'bg-red-500/10 border-red-400/30'
                  : 'bg-emerald-500/10 border-emerald-400/25'
              }`}
            >
              <Coins className={`w-4 h-4 ${moneyNeg ? 'text-red-300' : 'text-emerald-300'}`} />
            </div>
            <div className="leading-tight">
              <div className="text-[9px] uppercase tracking-[0.24em] text-zinc-500">Balance</div>
              <div
                className={`text-lg font-black tabular-nums ${
                  moneyNeg ? 'text-red-300' : 'text-emerald-200'
                }`}
              >
                {formatCurrency(stats.money)}
              </div>
            </div>
          </div>
        </div>

        {/* 分隔 */}
        <div className="accent-divider" />

        {/* 下行：三条状态进度条 */}
        <div className="flex flex-wrap items-stretch gap-5">
          <StatMeter
            icon={<Heart className="w-3.5 h-3.5 text-rose-400" />}
            label="Physical"
            value={stats.physical}
            max={200}
            gradient="from-rose-500 via-orange-400 to-amber-300"
            critical={stats.physical < 40}
            pulseDot={stats.physical < 40}
          />
          <StatMeter
            icon={<Brain className="w-3.5 h-3.5 text-sky-400" />}
            label="Mental"
            value={stats.mental}
            max={100}
            gradient="from-sky-500 via-blue-400 to-cyan-300"
            critical={stats.mental < 30}
            pulseDot={isDepressed}
          />
          <StatMeter
            icon={<Utensils className="w-3.5 h-3.5 text-orange-300" />}
            label="Satiety"
            value={stats.satiety}
            max={100}
            gradient="from-yellow-400 via-orange-400 to-red-400"
            critical={stats.satiety < 25}
            pulseDot={stats.satiety < 25}
          />
        </div>
      </div>
    </header>
  );
};

export default StatBar;
