import React from 'react';
import { PlayerStats, Profession } from '../types';
import { formatCurrency, getHealthColor, getMentalColor, formatDateCN } from '../utils';
import {
  Heart,
  Brain,
  DollarSign,
  Utensils,
  Clock3,
  User,
  CloudSun,
  ThermometerSun,
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
 * 紧凑型数据卡：一图 + 一标题 + 一数值 + 可选副值
 */
const InfoBlock: React.FC<{
  icon: React.ReactNode;
  iconWrap: string; // eg. 'bg-red-500/10 border-red-500/20'
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  valueClass?: string;
}> = ({ icon, iconWrap, label, value, sub, valueClass }) => (
  <div className="glass-card rounded-2xl px-3.5 py-2.5 flex items-center gap-3 min-w-0">
    <div className={`w-9 h-9 shrink-0 rounded-xl border flex items-center justify-center ${iconWrap}`}>
      {icon}
    </div>
    <div className="leading-tight min-w-0">
      <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 truncate">{label}</div>
      <div className={`text-sm font-bold truncate ${valueClass || 'text-white'}`}>{value}</div>
      {sub && <div className="text-[10px] text-zinc-500 mt-0.5 truncate">{sub}</div>}
    </div>
  </div>
);

/**
 * 状态指标（大数字展示）
 */
const StatPill: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  valueClass?: string;
}> = ({ icon, label, value, valueClass }) => (
  <div className="glass-card rounded-2xl px-3 py-2 flex items-center gap-2.5 min-w-[96px]">
    <div className="w-8 h-8 shrink-0 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
      {icon}
    </div>
    <div className="leading-tight min-w-0">
      <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">{label}</div>
      <div className={`text-sm font-bold ${valueClass || 'text-white'}`}>{value}</div>
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

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-4 py-3">
        {/* 两行式布局：上行=身份与环境；下行=状态指标 */}
        <div className="flex flex-col gap-2.5">

          {/* ============== 上行：身份 + 环境 ============== */}
          <div className="flex flex-wrap items-stretch gap-2.5">
            {/* 日期 + 时间 合并 */}
            <InfoBlock
              icon={<Clock3 className="w-5 h-5 text-cyan-400" />}
              iconWrap="bg-cyan-500/10 border-cyan-500/20"
              label="Date / Time"
              value={<span className="tabular-nums">{time}</span>}
              sub={formatDateCN(date)}
            />

            {/* 天气 + 体温 合并 */}
            <InfoBlock
              icon={<CloudSun className="w-5 h-5 text-amber-400" />}
              iconWrap="bg-amber-500/10 border-amber-500/20"
              label="Weather"
              value={<span>{getSeasonName(season)} · {weatherTemp}℃</span>}
              sub={
                <span className="inline-flex items-center gap-1">
                  <ThermometerSun className={`w-3 h-3 ${bodyTempClass}`} />
                  <span className={bodyTempClass}>体温 {bodyTemp}℃</span>
                </span>
              }
            />

            {/* 职业 */}
            <InfoBlock
              icon={<User className="w-5 h-5 text-indigo-400" />}
              iconWrap="bg-indigo-500/10 border-indigo-500/20"
              label="Profession"
              value={profession?.name || '无业游民'}
              sub={profession?.schedule ? `班次 · ${profession.schedule}` : '自由身'}
            />

            {/* 占位，让右侧内容在大屏下靠右 */}
            <div className="flex-1 hidden xl:block" />
          </div>

          {/* ============== 下行：核心状态指标 ============== */}
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
