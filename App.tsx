import React, { useState, useCallback } from 'react';
import { PlayerStats, Profession, LogEntry, GamePhase } from './types';
import { PROFESSIONS, INITIAL_STATS, DEATH_EVENTS } from './constants';
import StatBar from './components/StatBar';
import GameLog from './components/GameLog';
import { Skull, Coffee, Laptop, Trash2, ArrowRight } from 'lucide-react';

const App: React.FC = () => {
  const [phase, setPhase] = useState<GamePhase>('START');
  const [stats, setStats] = useState<PlayerStats>(INITIAL_STATS);
  const [job, setJob] = useState<Profession | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [deathReason, setDeathReason] = useState('');

  const addLog = (text: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [{ id: Date.now(), text, type }, ...prev]);
  };

  const checkSuddenDeath = useCallback((newStats: PlayerStats) => {
    // 基础死法
    if (newStats.physical <= 0) return "你的身体负荷已达上限，心跳在工位上悄然停止。";
    if (newStats.mental >= 100) return "精神防线彻底崩溃，你消失在深夜的城市边缘。";
    
    // 随机秒杀逻辑 (压力越高，概率越大)
    const deathChance = (newStats.mental / 200) + (job?.stressFactor || 1) * 0.05;
    if (newStats.daysSurvived > 1 && Math.random() < deathChance * 0.1) {
      return DEATH_EVENTS[Math.floor(Math.random() * DEATH_EVENTS.length)];
    }
    return null;
  }, [job]);

  const updateStats = (changes: Partial<PlayerStats>, logMsg?: string, logType: LogEntry['type'] = 'info') => {
    setStats(prev => {
      const next = { ...prev };
      if (changes.physical !== undefined) next.physical = Math.min(100, Math.max(0, next.physical + changes.physical));
      if (changes.mental !== undefined) next.mental = Math.min(100, Math.max(0, next.mental + changes.mental));
      if (changes.money !== undefined) next.money += changes.money;
      if (changes.satiety !== undefined) next.satiety = Math.min(100, Math.max(0, next.satiety + changes.satiety));
      
      const death = checkSuddenDeath(next);
      if (death) {
        setDeathReason(death);
        setPhase('GAMEOVER');
      }
      return next;
    });
    if (logMsg) addLog(logMsg, logType);
  };

  const handleAction = (type: string) => {
    switch (type) {
      case 'WORK':
        updateStats({ money: job!.salary, mental: 20, physical: -10, satiety: -20 }, `在工位上疯狂输出，获得工资 ¥${job!.salary}`, 'info');
        break;
      case 'KFC':
        updateStats({ money: -50, mental: -20, satiety: 40 }, "V我50！吃了顿炸鸡，压力大减，但肚子更圆了。", 'success');
        break;
      case 'MO_YU':
        if (Math.random() < 0.1) {
          setDeathReason("由于摸鱼被老板背后灵现身，惊吓过度导致心源性猝死。");
          setPhase('GAMEOVER');
        } else {
          updateStats({ mental: -15, physical: 5 }, "在厕所带薪如厕40分钟，灵魂得到了净化。", 'success');
        }
        break;
    }
    setStats(prev => ({ ...prev, daysSurvived: prev.daysSurvived + 1 }));
  };

  if (phase === 'START') {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 text-slate-300">
        <div className="max-w-md w-full">
          <h1 className="text-6xl font-black text-white mb-2 tracking-tighter italic">秒杀人生<span className="text-indigo-500">.</span></h1>
          <p className="text-slate-500 mb-12 text-sm tracking-widest uppercase font-bold">Sudden Death Simulator</p>
          <div className="space-y-4">
            {Object.values(PROFESSIONS).map(p => (
              <button 
                key={p.id}
                onClick={() => { setJob(p); setPhase('MORNING'); addLog(`你入职了 ${p.name}。`, 'story'); }}
                className="w-full bg-slate-900 border border-slate-800 p-6 rounded-[2rem] text-left hover:border-indigo-500 transition-all group"
              >
                <div className="font-bold text-white text-lg group-hover:text-indigo-400">{p.name}</div>
                <div className="text-xs text-slate-500 mt-1">{p.description}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'GAMEOVER') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full">
          <div className="w-20 h-20 bg-rose-600/20 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
            <Skull className="text-rose-600 w-10 h-10" />
          </div>
          <h2 className="text-4xl font-black text-white mb-6">卒。</h2>
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-[3rem] mb-12">
            <p className="text-rose-400 text-lg font-serif italic mb-6 leading-relaxed">“{deathReason}”</p>
            <div className="flex justify-around text-[10px] text-slate-600 uppercase font-bold tracking-widest">
              <div>生存天数: {stats.daysSurvived}</div>
              <div>最终资产: ¥{stats.money}</div>
            </div>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="bg-white text-black font-black py-5 px-10 rounded-full flex items-center gap-2 mx-auto hover:scale-105 transition-transform"
          >
            再次重开 <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-slate-300 p-6 flex flex-col max-w-md mx-auto">
      <div className="mb-8">
        <div className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.3em] mb-1">Surviving Day</div>
        <div className="text-5xl font-black text-white font-mono leading-none">{stats.daysSurvived}</div>
      </div>

      <StatBar stats={stats} profession={job} />
      <GameLog logs={logs} />

      <div className="grid grid-cols-2 gap-3 mt-auto">
        <button onClick={() => handleAction('WORK')} className="bg-indigo-600 hover:bg-indigo-500 text-white p-6 rounded-[2rem] flex flex-col items-center gap-2 transition-all">
          <Laptop className="w-6 h-6" /> <span className="font-bold text-sm">拼命卷</span>
        </button>
        <button onClick={() => handleAction('KFC')} className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] flex flex-col items-center gap-2 hover:border-amber-500 transition-all">
          <Coffee className="w-6 h-6" /> <span className="font-bold text-sm">啃德鸡</span>
        </button>
        <button onClick={() => handleAction('MO_YU')} className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] flex flex-col items-center gap-2 col-span-2 hover:border-emerald-500 transition-all">
          <Trash2 className="w-6 h-6 text-emerald-500" /> <span className="font-bold text-sm">带薪如厕</span>
        </button>
      </div>
    </div>
  );
};

export default App;
