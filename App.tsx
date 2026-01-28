--- START OF FILE App.tsx ---
import React, { useState, useEffect, useCallback } from 'react';
import { GameState, Profession, ProfessionType, LogEntry } from './types';
import { PROFESSIONS, INITIAL_STATS, EVENTS } from './constants';
import { getRandomInt } from './utils';
import StatBar from './StatBar';
import GameLog from './GameLog';
import { 
  Play, RotateCcw, Utensils, Briefcase, Moon, 
  Gamepad2, Pill, ShoppingBag, Beer, 
  Dumbbell, Footprints, Dice5, Skull
} from 'lucide-react';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    profession: null,
    stats: INITIAL_STATS,
    phase: 'START',
    time: '07:00',
    log: [],
    flags: { isDepressed: false, hasInsurance: false, isSick: false },
    gameOverReason: ''
  });

  const addLog = useCallback((text: string, type: LogEntry['type'] = 'info') => {
    setGameState(prev => ({
      ...prev,
      log: [...prev.log, { id: Date.now() + Math.random(), text, type }]
    }));
  }, []);

  // --- Core Game Loop Checks ---
  useEffect(() => {
    if (gameState.phase === 'START' || gameState.phase === 'GAME_OVER') return;

    const { physical, mental, money, satiety } = gameState.stats;

    // 1. Physical Death
    if (physical > 95) { 
      if (Math.random() < 0.15) endGame(EVENTS.HIGH_HEALTH_DEATH[getRandomInt(0, EVENTS.HIGH_HEALTH_DEATH.length - 1)]);
    }
    if (physical <= 0) endGame(EVENTS.LOW_HEALTH_DEATH[getRandomInt(0, EVENTS.LOW_HEALTH_DEATH.length - 1)]);

    // 2. Mental Death
    if (mental <= 0) endGame(EVENTS.LOW_MENTAL_DEATH[getRandomInt(0, EVENTS.LOW_MENTAL_DEATH.length - 1)]);

    // 3. Starvation
    if (satiety <= 0) {
        if (physical > 5) updateStats({ physical: -10 }, "饿得头晕眼花，生命在流逝！");
        else endGame("你饿死在了出租屋里，直到房东来收租才发现。");
    }

    // 4. Debt Death (New)
    if (money < -2000) {
        if (Math.random() < 0.3) endGame(EVENTS.DEBT_DEATH[getRandomInt(0, EVENTS.DEBT_DEATH.length - 1)]);
        else addLog("警告：催收人员正在疯狂打你电话，由于欠款过多，你的生命受到威胁。", "danger");
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.stats, gameState.phase]);

  // Check Depression
  useEffect(() => {
    if (gameState.stats.mental < 30 && !gameState.flags.isDepressed) {
      setGameState(prev => ({ ...prev, flags: { ...prev.flags, isDepressed: true } }));
      addLog("【确诊重度抑郁】心理防线崩塌。所有娱乐活动效果减半，必须去医院治疗。", "danger");
    }
  }, [gameState.stats.mental, gameState.flags.isDepressed, addLog]);

  const updateStats = (changes: Partial<typeof INITIAL_STATS>, reason?: string) => {
    setGameState(prev => {
      const newStats = { ...prev.stats };
      // Apply changes with limits
      if (changes.physical) newStats.physical = Math.min(100, Math.max(0, newStats.physical + changes.physical));
      if (changes.mental) newStats.mental = Math.min(100, Math.max(0, newStats.mental + changes.mental));
      if (changes.money) newStats.money = newStats.money + changes.money;
      if (changes.satiety) newStats.satiety = Math.min(100, Math.max(0, newStats.satiety + changes.satiety));
      if (changes.cookingSkill) newStats.cookingSkill = newStats.cookingSkill + changes.cookingSkill;
      if (changes.daysSurvived) newStats.daysSurvived = newStats.daysSurvived + changes.daysSurvived;
      return { ...prev, stats: newStats };
    });
    if (reason) addLog(reason, changes.physical && changes.physical < 0 ? 'warning' : 'info');
  };

  const endGame = (reason: string) => {
    setGameState(prev => ({ ...prev, phase: 'GAME_OVER', gameOverReason: reason }));
    addLog(reason, 'danger');
  };

  // Random Accidents that can happen anytime logic runs
  const checkRandomEvents = () => {
      if (Math.random() < 0.005) { // 0.5% chance per action for instant death
          endGame(EVENTS.ACCIDENT_DEATH[getRandomInt(0, EVENTS.ACCIDENT_DEATH.length - 1)]);
          return true;
      }
      return false;
  };

  const startGame = (profType: ProfessionType) => {
    const prof = PROFESSIONS[profType];
    setGameState({
      profession: prof,
      stats: { ...INITIAL_STATS },
      phase: 'MORNING',
      time: '07:30',
      log: [{ id: 1, text: `>>> 初始化完成。身份绑定：${prof.name}。目标：活下去。`, type: 'info' }],
      flags: { isDepressed: false, hasInsurance: false, isSick: false },
      gameOverReason: ''
    });
  };

  // --- Action Handlers ---

  const handleEat = (type: 'COOK' | 'TAKEOUT' | 'RESTAURANT' | 'BENTO' | 'SKIP') => {
    if(checkRandomEvents()) return;

    let cost = 0, satGain = 0, healthChange = 0, mentalChange = 0, msg = "";

    if (type === 'SKIP') {
      satGain = -10; healthChange = -2; mentalChange = -2;
      msg = "为了省钱/省时间，你选择不吃。胃酸在腐蚀你的意志。";
    } else if (type === 'COOK') {
      const skill = gameState.stats.cookingSkill;
      cost = 15;
      if (skill < 10 && Math.random() < 0.4) {
        satGain = 10; healthChange = -5; mentalChange = -5;
        msg = "厨房发生小型爆炸，做出一坨黑炭。含泪吃下。";
      } else {
        satGain = 35 + (skill / 5); healthChange = 3; mentalChange = 5;
        msg = "亲自下厨，味道不错，感觉像个人样了。";
        updateStats({ cookingSkill: 1 });
      }
    } else if (type === 'TAKEOUT') {
      cost = 35; satGain = 40; healthChange = -2; mentalChange = 2;
      msg = "地沟油外卖，真香。血管在哀嚎。";
    } else if (type === 'RESTAURANT') {
      cost = 120; satGain = 60; healthChange = 2; mentalChange = 15;
      msg = "去高档餐厅消费，钱包在滴血，但心情极佳。";
    } else if (type === 'BENTO') {
      cost = 15; satGain = 25; healthChange = -1;
      msg = "公司的廉价盒饭，维持生命体征而已。";
    }

    if (gameState.stats.money < cost) {
      addLog("余额不足！交易失败。", "danger");
      return;
    }

    updateStats({ money: -cost, satiety: satGain, physical: healthChange, mental: mentalChange });
    addLog(msg, healthChange < 0 ? 'warning' : 'success');
    advanceTime();
  };

  const handleWork = () => {
    if (!gameState.profession || checkRandomEvents()) return;
    
    const { stressFactor, healthRisk, salaryBase } = gameState.profession;
    let stress = stressFactor;
    let risk = healthRisk;
    
    const roll = Math.random();
    if (roll < 0.25) {
      const evt = EVENTS.WORK_EVENTS[getRandomInt(0, EVENTS.WORK_EVENTS.length - 1)];
      addLog(evt, 'warning');
      stress += 8; risk += 3;
    } else if (roll > 0.9) {
       addLog("摸鱼成功！带薪拉屎半小时。", 'success');
       stress = 0; risk = 0;
    } else {
      addLog("枯燥的工作... 寿命-1s", 'info');
    }

    updateStats({
      physical: -risk * getRandomInt(1, 3),
      mental: -stress * getRandomInt(1, 3),
      satiety: -15
    });

    if (gameState.phase === 'WORK_AM') setGameState(prev => ({ ...prev, phase: 'LUNCH', time: '12:00' }));
    else if (gameState.phase === 'WORK_PM') {
      const dailyPay = salaryBase + getRandomInt(-20, 50); 
      updateStats({ money: dailyPay });
      addLog(`【下班打卡】 到账 ¥${dailyPay}`, 'success');
      setGameState(prev => ({ ...prev, phase: 'DINNER', time: '18:30' }));
    }
  };

  const handleFreeTimeAction = (action: string) => {
    if(checkRandomEvents()) return;

    const isDepressed = gameState.flags.isDepressed;
    const moodMult = isDepressed ? 0.5 : 1;

    switch (action) {
      case 'GAME':
        addLog("沉迷赛博游戏，" + (isDepressed ? "但内心依然空虚。" : "短暂逃避现实。"), 'success');
        updateStats({ mental: 15 * moodMult, physical: -2, satiety: -5 });
        break;
      case 'GYM':
        if(gameState.stats.money < 50) { addLog("办不起健身卡。", "danger"); return; }
        updateStats({ money: -50, physical: 8, mental: 5 * moodMult, satiety: -15 });
        addLog("在健身房挥汗如雨，肌肉酸痛但很爽。", "success");
        break;
      case 'BAR':
        if(gameState.stats.money < 150) { addLog("酒保把你赶了出来，因为没钱。", "danger"); return; }
        updateStats({ money: -150, physical: -5, mental: 25 * moodMult, satiety: 5 });
        addLog("酒精麻痹了神经，今晚你是自由的。", "warning");
        break;
      case 'GAMBLE':
        const bet = 200;
        if(gameState.stats.money < bet) { addLog("没赌本了。", "danger"); return; }
        const win = Math.random() > 0.6; // 40% win rate
        if(win) {
            updateStats({ money: bet * 1.5, mental: 20 * moodMult });
            addLog(`赌赢了！赢了 ¥${bet * 1.5}，这种快感令人上瘾。`, "success");
        } else {
            updateStats({ money: -bet, mental: -10 });
            addLog(`全输光了... 甚至想剁手。`, "danger");
        }
        break;
      case 'WALK':
         if(Math.random() < 0.1) {
             updateStats({ money: -200, physical: -10, mental: -20 });
             addLog("在小巷子里被抢劫了！破财消灾。", "danger");
         } else {
             updateStats({ mental: 5 * moodMult, physical: 2, satiety: -5 });
             addLog("在城市漫步，看尽人间百态。", "info");
         }
         break;
      case 'HOSPITAL':
        if (gameState.stats.money < 600) { addLog("医院大门朝南开，有病没钱莫进来。", 'danger'); return; }
        updateStats({ money: -600, physical: 15, mental: 15 });
        if (isDepressed && Math.random() > 0.4) {
            setGameState(prev => ({ ...prev, flags: { ...prev.flags, isDepressed: false } }));
            addLog("医生开了特效药，抑郁症状缓解了。", 'success');
        } else {
            addLog("稍微检查了一下，身体恢复了一些。", 'info');
        }
        break;
      case 'SLEEP_EARLY':
        addLog("养生局。放弃夜生活，保住狗命。", 'success');
        updateStats({ physical: 8, mental: 5 });
        setGameState(prev => ({ ...prev, phase: 'SLEEP', time: '22:00' }));
        return; 
    }
    setGameState(prev => ({ ...prev, phase: 'SLEEP', time: '23:45' }));
  };

  const handleSleep = () => {
    const { physical, satiety, money } = gameState.stats;
    let healPhys = 10, healMental = 10;

    if (satiety < 20) {
      addLog("饿得睡不着，胃在抽搐。", 'warning');
      healPhys = 2; healMental = -5;
    }
    if (money < 0) {
       addLog("梦里都在被追债，冷汗直流。", 'danger');
       healMental = -15;
    }
    
    // Random night event
    if (Math.random() < 0.1) {
       addLog("邻居半夜吵架/装修，睡眠质量极差。", 'warning');
       healPhys = 5; healMental = -5;
    }

    updateStats({ physical: healPhys, mental: healMental, satiety: -20, daysSurvived: 1 });
    setGameState(prev => ({ ...prev, phase: 'MORNING', time: '07:00' }));
    addLog(`=== 第 ${gameState.stats.daysSurvived + 1} 天 ===`, 'info');
  };

  const advanceTime = () => {
    setGameState(prev => {
      let nextPhase = prev.phase;
      let nextTime = prev.time;
      if (prev.phase === 'MORNING') { nextPhase = 'WORK_AM'; nextTime = '09:00'; }
      else if (prev.phase === 'LUNCH') { nextPhase = 'WORK_PM'; nextTime = '13:00'; }
      else if (prev.phase === 'DINNER') { nextPhase = 'FREE_TIME'; nextTime = '20:00'; }
      return { ...prev, phase: nextPhase, time: nextTime };
    });
  };

  // --- Render ---

  if (gameState.phase === 'START') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950 font-sans">
        <div className="max-w-2xl w-full bg-zinc-900/80 p-8 rounded-xl shadow-2xl border border-zinc-800 backdrop-blur">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-2 text-center tracking-tighter">SURVIVE_OS</h1>
          <p className="text-zinc-500 text-center mb-10 font-mono text-sm">/// 选择你的开局身份载入模拟 ///</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.values(PROFESSIONS).map((p) => (
              <button key={p.id} onClick={() => startGame(p.id as ProfessionType)}
                className="p-4 bg-zinc-800/50 hover:bg-cyan-900/20 border border-zinc-700 hover:border-cyan-500/50 rounded-lg text-left transition-all group relative overflow-hidden">
                <div className="relative z-10">
                  <div className="font-bold text-cyan-100 group-hover:text-cyan-400 flex justify-between">
                      {p.name} <span className="text-xs font-mono opacity-50">SALARY: {p.salaryBase}</span>
                  </div>
                  <div className="text-xs text-zinc-400 mt-1">{p.description}</div>
                  <div className="mt-2 flex gap-2 text-[10px] text-zinc-500 font-mono uppercase">
                      <span>压力: {'★'.repeat(Math.ceil(p.stressFactor))}</span>
                      <span>危险: {'★'.repeat(Math.ceil(p.healthRisk))}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (gameState.phase === 'GAME_OVER') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-black font-mono">
        <div className="max-w-md w-full text-center relative">
          <Skull className="w-20 h-20 text-red-600 mx-auto mb-4 animate-pulse" />
          <h1 className="text-6xl font-black text-red-600 mb-6 tracking-widest glitch-text">TERMINATED</h1>
          <div className="bg-red-950/20 p-6 rounded border border-red-900/50 mb-8 backdrop-blur">
            <p className="text-zinc-400 mb-2 text-sm uppercase">Survival Time</p>
            <p className="text-4xl text-white font-bold mb-6">{gameState.stats.daysSurvived} DAYS</p>
            <p className="text-zinc-500 mb-2 text-xs uppercase">Cause of Death</p>
            <p className="text-lg text-red-400 font-bold border-t border-red-900/30 pt-4">{gameState.gameOverReason}</p>
          </div>
          <button onClick={() => setGameState({ ...gameState, phase: 'START', log: [], stats: INITIAL_STATS, gameOverReason: '' })}
            className="bg-zinc-800 hover:bg-zinc-700 text-white py-3 px-8 rounded font-bold transition-all flex items-center justify-center mx-auto border border-zinc-600 hover:border-white">
            <RotateCcw className="w-4 h-4 mr-2" /> RESTART_SYSTEM
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 font-sans selection:bg-cyan-500/30 pb-10">
      <StatBar stats={gameState.stats} profession={gameState.profession} time={gameState.time} isDepressed={gameState.flags.isDepressed} />
      
      <main className="max-w-4xl mx-auto p-4 flex flex-col gap-6">
        <GameLog logs={gameState.log} />

        {/* Action Command Center */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Status Panel */}
            <div className="lg:col-span-1 bg-zinc-900/80 p-5 rounded-xl border border-zinc-800 shadow-lg">
                <h3 className="text-zinc-500 text-xs font-mono uppercase tracking-widest mb-4 flex items-center">
                    <Play className="w-3 h-3 mr-2 text-cyan-500" /> System Status
                </h3>
                <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-zinc-400">当前阶段</span>
                        <span className="text-cyan-300 font-bold bg-cyan-950/50 px-2 py-1 rounded border border-cyan-900">
                             {gameState.phase === 'MORNING' ? '清晨准备' :
                              gameState.phase.includes('WORK') ? '工作中' :
                              gameState.phase === 'LUNCH' ? '午休' :
                              gameState.phase === 'DINNER' ? '下班时间' :
                              gameState.phase === 'FREE_TIME' ? '自由活动' :
                              gameState.phase === 'SLEEP' ? '休眠中' : ''}
                        </span>
                    </div>
                    <div className="text-xs text-zinc-500 leading-relaxed border-t border-zinc-800 pt-4">
                        提示：保持所有数值在安全范围。太高或太低都会导致系统崩溃（死亡）。注意随机事件和债务危机。
                    </div>
                </div>
            </div>

            {/* Controls Panel */}
            <div className="lg:col-span-2 bg-zinc-900/80 p-5 rounded-xl border border-zinc-800 shadow-lg">
                 <h3 className="text-zinc-500 text-xs font-mono uppercase tracking-widest mb-4">Available Actions</h3>
                 <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    
                    {/* Morning & Eating Actions */}
                    {(gameState.phase === 'MORNING' || gameState.phase === 'DINNER' || gameState.phase === 'LUNCH') && (
                        <>
                            <ActionButton onClick={() => handleEat('COOK')} icon={<Utensils/>} label="自己做饭" sub="Cheap & Healthy" color="teal" />
                            <ActionButton onClick={() => handleEat('TAKEOUT')} icon={<ShoppingBag/>} label="点外卖" sub="-¥35 | Unhealthy" color="orange" />
                            {gameState.phase !== 'LUNCH' && <ActionButton onClick={() => handleEat('RESTAURANT')} icon={<Utensils/>} label="下馆子" sub="-¥120 | ++Mood" color="purple" />}
                            {gameState.phase === 'LUNCH' && <ActionButton onClick={() => handleEat('BENTO')} icon={<Utensils/>} label="公司盒饭" sub="-¥15 | Sad" color="zinc" />}
                            {gameState.phase === 'MORNING' && <ActionButton onClick={() => handleEat('SKIP')} icon={<RotateCcw className="rotate-180"/>} label="不吃了" sub="Save Money" color="red" />}
                        </>
                    )}

                    {/* Work Actions */}
                    {gameState.phase.includes('WORK') && (
                        <button onClick={handleWork} className="col-span-full py-12 bg-blue-900/20 hover:bg-blue-900/40 border border-blue-800/50 hover:border-blue-500 text-blue-200 rounded-xl transition-all group flex flex-col items-center justify-center gap-2">
                            <Briefcase className="w-8 h-8 group-hover:scale-110 transition-transform" />
                            <span className="text-xl font-bold tracking-widest">推进工作进度</span>
                            <span className="text-xs text-blue-400 opacity-60 font-mono">CLICK TO WORK</span>
                        </button>
                    )}

                    {/* Free Time Actions */}
                    {gameState.phase === 'FREE_TIME' && (
                        <>
                            <ActionButton onClick={() => handleFreeTimeAction('GAME')} icon={<Gamepad2/>} label="打游戏" sub="Free | +Mental" color="indigo" />
                            <ActionButton onClick={() => handleFreeTimeAction('GYM')} icon={<Dumbbell/>} label="健身房" sub="-¥50 | +Phys" color="cyan" />
                            <ActionButton onClick={() => handleFreeTimeAction('BAR')} icon={<Beer/>} label="酒吧买醉" sub="-¥150 | ++Mental" color="pink" />
                            <ActionButton onClick={() => handleFreeTimeAction('GAMBLE')} icon={<Dice5/>} label="地下赌博" sub="Risk High" color="yellow" />
                            <ActionButton onClick={() => handleFreeTimeAction('WALK')} icon={<Footprints/>} label="城市漫步" sub="Random Event" color="zinc" />
                            <ActionButton onClick={() => handleFreeTimeAction('HOSPITAL')} icon={<Pill/>} label="私人医院" sub="-¥600 | Cure" color="red" />
                            <ActionButton onClick={() => handleFreeTimeAction('SLEEP_EARLY')} icon={<Moon/>} label="早睡" sub="Safe Choice" color="slate" />
                        </>
                    )}

                    {/* Sleep Action */}
                    {gameState.phase === 'SLEEP' && (
                         <button onClick={handleSleep} className="col-span-full py-10 bg-black/40 hover:bg-black/60 border border-zinc-700 hover:border-zinc-500 text-zinc-300 rounded-xl transition-all flex flex-col items-center justify-center">
                            <Moon className="w-6 h-6 mb-2" />
                            <span className="font-bold">进入休眠 (NEXT DAY)</span>
                        </button>
                    )}
                 </div>
            </div>
        </div>
      </main>
    </div>
  );
};

// Helper Component for consistency
const ActionButton = ({ onClick, icon, label, sub, color }: any) => {
    const colors: any = {
        teal: 'bg-teal-900/30 border-teal-800 hover:border-teal-500 text-teal-200 hover:bg-teal-900/50',
        orange: 'bg-orange-900/30 border-orange-800 hover:border-orange-500 text-orange-200 hover:bg-orange-900/50',
        purple: 'bg-purple-900/30 border-purple-800 hover:border-purple-500 text-purple-200 hover:bg-purple-900/50',
        red: 'bg-red-900/30 border-red-800 hover:border-red-500 text-red-200 hover:bg-red-900/50',
        indigo: 'bg-indigo-900/30 border-indigo-800 hover:border-indigo-500 text-indigo-200 hover:bg-indigo-900/50',
        cyan: 'bg-cyan-900/30 border-cyan-800 hover:border-cyan-500 text-cyan-200 hover:bg-cyan-900/50',
        pink: 'bg-pink-900/30 border-pink-800 hover:border-pink-500 text-pink-200 hover:bg-pink-900/50',
        yellow: 'bg-yellow-900/30 border-yellow-800 hover:border-yellow-500 text-yellow-200 hover:bg-yellow-900/50',
        slate: 'bg-slate-800/50 border-slate-700 hover:border-slate-500 text-slate-300 hover:bg-slate-800',
        zinc: 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:bg-zinc-800'
    };

    return (
        <button onClick={onClick} className={`${colors[color] || colors.zinc} p-3 rounded-lg border transition-all flex flex-col items-center justify-center text-center h-24 group relative overflow-hidden`}>
             <div className="mb-1 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-transform">
                {React.cloneElement(icon, { size: 20 })}
             </div>
             <span className="font-bold text-sm">{label}</span>
             <span className="text-[10px] opacity-60 font-mono mt-1">{sub}</span>
        </button>
    );
};

export default App;
