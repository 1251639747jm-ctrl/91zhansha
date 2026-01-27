import React, { useState, useEffect, useCallback } from 'react';
import { GameState, Profession, ProfessionType, GamePhase, LogEntry } from './types';
import { PROFESSIONS, INITIAL_STATS, EVENTS } from './constants';
import { getRandomInt, formatCurrency } from './utils';
import StatBar from './components/StatBar';
import GameLog from './components/GameLog';
import { Play, RotateCcw, Utensils, Briefcase, Moon, Coffee, Gamepad2, Pill, ShoppingBag } from 'lucide-react';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    profession: null,
    stats: INITIAL_STATS,
    phase: 'START',
    time: '07:00',
    log: [],
    flags: {
      isDepressed: false,
      hasInsurance: false,
      isSick: false
    },
    gameOverReason: ''
  });

  // Helper to add log
  const addLog = useCallback((text: string, type: LogEntry['type'] = 'info') => {
    setGameState(prev => ({
      ...prev,
      log: [...prev.log, { id: Date.now() + Math.random(), text, type }]
    }));
  }, []);

  // Check for Death Conditions
  useEffect(() => {
    if (gameState.phase === 'START' || gameState.phase === 'GAME_OVER') return;

    const { physical, mental, money, satiety } = gameState.stats;

    // Condition 1: High Health -> Kidnapped
    if (physical > 92) { // Threshold
      // Small random chance each tick if super healthy, or guaranteed if hits 100
      if (physical >= 98 || Math.random() < 0.2) {
        const reason = EVENTS.HIGH_HEALTH_DEATH[getRandomInt(0, EVENTS.HIGH_HEALTH_DEATH.length - 1)];
        endGame(reason);
        return;
      }
    }

    // Condition 2: Low Health -> Overwork
    if (physical <= 0) {
      const reason = EVENTS.LOW_HEALTH_DEATH[getRandomInt(0, EVENTS.LOW_HEALTH_DEATH.length - 1)];
      endGame(reason);
      return;
    }

    // Condition 3: Low Mental -> Depression/Suicide
    if (mental <= 0) {
       const reason = EVENTS.LOW_MENTAL_DEATH[getRandomInt(0, EVENTS.LOW_MENTAL_DEATH.length - 1)];
       endGame(reason);
       return;
    }

    // Condition 4: Starvation
    if (satiety <= 0) {
      if (physical > 10) {
        updateStats({ physical: -20 }, "饿得头晕眼花，身体机能下降！");
      } else {
        endGame("你饿死在了出租屋里，直到房东来收租才发现。");
      }
      return;
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.stats, gameState.phase]);

  // Check Depression Flag
  useEffect(() => {
    if (gameState.stats.mental < 30 && !gameState.flags.isDepressed) {
      setGameState(prev => ({ ...prev, flags: { ...prev.flags, isDepressed: true } }));
      addLog("警告：你的心理防线已崩溃，确诊为重度抑郁。现在做任何娱乐活动效果减半，必须去医院治疗。", "danger");
    }
  }, [gameState.stats.mental, gameState.flags.isDepressed, addLog]);

  const updateStats = (changes: Partial<typeof INITIAL_STATS>, reason?: string) => {
    setGameState(prev => {
      const newStats = { ...prev.stats };
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

  const startGame = (profType: ProfessionType) => {
    const prof = PROFESSIONS[profType];
    setGameState({
      profession: prof,
      stats: { ...INITIAL_STATS },
      phase: 'MORNING',
      time: '07:30',
      log: [{ id: 1, text: `你开始了新的生活。职业：${prof.name}。${prof.description}`, type: 'info' }],
      flags: { isDepressed: false, hasInsurance: false, isSick: false },
      gameOverReason: ''
    });
  };

  // --- Actions ---

  const handleEat = (type: 'COOK' | 'TAKEOUT' | 'RESTAURANT' | 'BENTO' | 'SKIP') => {
    let cost = 0;
    let satGain = 0;
    let healthChange = 0;
    let mentalChange = 0;
    let message = "";

    if (type === 'SKIP') {
      satGain = -10;
      healthChange = -2;
      mentalChange = -2;
      message = "为了省钱/省时间，你选择不吃。肚子在抗议。";
    } else if (type === 'COOK') {
      const skill = gameState.stats.cookingSkill;
      cost = 15;
      if (skill < 10 && Math.random() < 0.4) {
        satGain = 10;
        healthChange = -5;
        mentalChange = -5;
        message = "你炸了厨房，做出一坨不可名状的物体。含泪吃下。";
      } else {
        satGain = 30 + (skill / 5);
        healthChange = 2;
        mentalChange = 5;
        message = "你亲自下厨，味道不错，感觉生活有了盼头。";
        updateStats({ cookingSkill: 1 });
      }
    } else if (type === 'TAKEOUT') {
      cost = 35;
      satGain = 40;
      healthChange = -1; // Heavy oil
      mentalChange = 2;
      message = "点了份重油重辣的外卖，虽然不健康但是真香。";
    } else if (type === 'RESTAURANT') {
      cost = 100;
      satGain = 50;
      healthChange = 1;
      mentalChange = 10;
      message = "去馆子搓了一顿，钱包痛但心情舒畅。";
    } else if (type === 'BENTO') {
      cost = 15;
      satGain = 25;
      healthChange = -1;
      message = "吃了公司提供的劣质盒饭，味同嚼蜡。";
    }

    if (gameState.stats.money < cost) {
      addLog("余额不足！只能饿肚子了。", "danger");
      handleEat('SKIP');
      return;
    }

    updateStats({
      money: -cost,
      satiety: satGain,
      physical: healthChange,
      mental: mentalChange
    });
    addLog(message, healthChange < 0 ? 'warning' : 'success');
    advanceTime();
  };

  const handleWork = () => {
    if (!gameState.profession) return;
    
    // Work Stats Logic
    const { stressFactor, healthRisk, salaryBase } = gameState.profession;
    let actualStress = stressFactor;
    let actualHealthRisk = healthRisk;
    
    // Random Event
    const roll = Math.random();
    let eventText = "";

    if (roll < 0.2) {
      const evt = EVENTS.WORK_EVENTS[getRandomInt(0, EVENTS.WORK_EVENTS.length - 1)];
      addLog(evt, 'warning');
      actualStress += 5;
      actualHealthRisk += 2;
    } else if (roll > 0.9) {
       addLog("今天出奇的顺利，甚至还能摸鱼。", 'success');
       actualStress = 0;
       actualHealthRisk = 0;
    } else {
      addLog("枯燥的工作时间...", 'info');
    }

    updateStats({
      physical: -actualHealthRisk * (getRandomInt(2, 4)),
      mental: -actualStress * (getRandomInt(2, 4)),
      satiety: -20
    });

    // Check phase for transition
    if (gameState.phase === 'WORK_AM') {
      setGameState(prev => ({ ...prev, phase: 'LUNCH', time: '12:00' }));
    } else if (gameState.phase === 'WORK_PM') {
      // Calculate daily earning
      const dailyPay = salaryBase + getRandomInt(-50, 50); 
      updateStats({ money: dailyPay });
      addLog(`下班了！今日工资到账: ¥${dailyPay}`, 'success');
      setGameState(prev => ({ ...prev, phase: 'DINNER', time: '18:30' }));
    }
  };

  const handleFreeTimeAction = (action: 'GAME' | 'SLEEP_EARLY' | 'HOSPITAL' | 'STUDY' | 'PART_TIME') => {
    const isDepressed = gameState.flags.isDepressed;
    const moodMultiplier = isDepressed ? 0.5 : 1;

    switch (action) {
      case 'GAME':
        addLog("打了一晚上游戏，" + (isDepressed ? "但内心依然空虚。" : "爽！"), 'success');
        updateStats({ mental: 15 * moodMultiplier, physical: -2, satiety: -5 });
        break;
      case 'HOSPITAL':
        if (gameState.stats.money < 500) {
          addLog("医院挂号费太贵了，你付不起。", 'danger');
          return;
        }
        updateStats({ money: -500, physical: 10, mental: 20 });
        if (isDepressed) {
          if (Math.random() > 0.5) {
            setGameState(prev => ({ ...prev, flags: { ...prev.flags, isDepressed: false } }));
            addLog("经过医生的治疗，你的抑郁症状有所缓解。", 'success');
          } else {
             addLog("医生给你开了药，但效果似乎不明显。", 'warning');
          }
        } else {
          addLog("做了个体检，身体稍微舒服了点。", 'success');
        }
        break;
      case 'STUDY':
        updateStats({ cookingSkill: 5, mental: -5, satiety: -5 });
        addLog("你钻研了菜谱，厨艺大涨。", 'info');
        break;
      case 'PART_TIME':
        const pay = 150;
        updateStats({ money: pay, physical: -5, mental: -5, satiety: -10 });
        addLog(`你去送了几单外卖，赚了 ¥${pay}，累得像狗。`, 'warning');
        break;
      case 'SLEEP_EARLY':
        addLog("你决定放弃夜生活，早点睡觉保狗命。", 'success');
        updateStats({ physical: 5, mental: 5 });
        setGameState(prev => ({ ...prev, phase: 'SLEEP', time: '22:00' }));
        return; // Skip advanceTime here as sleep handles it
    }
    
    // Advance specific amount of time or move to Sleep
    setGameState(prev => ({ ...prev, phase: 'SLEEP', time: '23:30' }));
  };

  const handleSleep = () => {
    const { physical, mental, satiety } = gameState.stats;
    let healPhys = 10;
    let healMental = 10;

    if (satiety < 30) {
      addLog("肚子太饿了，睡不踏实。", 'warning');
      healPhys = 2;
      healMental = -5;
    }
    
    // Random night event
    if (Math.random() < 0.1) {
       addLog("失眠了，想到了房贷和未来。", 'warning');
       healMental = -10;
    }

    updateStats({ 
      physical: healPhys, 
      mental: healMental, 
      satiety: -15, 
      daysSurvived: 1 
    });

    setGameState(prev => ({ ...prev, phase: 'MORNING', time: '07:00' }));
    addLog(`=== 第 ${gameState.stats.daysSurvived + 1} 天 ===`, 'info');
  };

  const advanceTime = () => {
    // State machine transitions
    setGameState(prev => {
      let nextPhase = prev.phase;
      let nextTime = prev.time;

      if (prev.phase === 'MORNING') {
        nextPhase = 'WORK_AM';
        nextTime = '09:00';
      } else if (prev.phase === 'LUNCH') {
        nextPhase = 'WORK_PM';
        nextTime = '13:00';
      } else if (prev.phase === 'DINNER') {
        nextPhase = 'FREE_TIME';
        nextTime = '20:00';
      }
      return { ...prev, phase: nextPhase, time: nextTime };
    });
  };

  // --- Render Functions ---

  if (gameState.phase === 'START') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 p-8 rounded-xl shadow-2xl border border-slate-700">
          <h1 className="text-4xl font-bold text-red-500 mb-2 text-center tracking-tighter">牢中秒杀线</h1>
          <p className="text-slate-400 text-center mb-8">职场求生指南 v1.0</p>
          <div className="space-y-4">
            <p className="text-white mb-4">请选择你的开局身份：</p>
            {Object.values(PROFESSIONS).map((p) => (
              <button
                key={p.id}
                onClick={() => startGame(p.id as ProfessionType)}
                className="w-full p-4 bg-slate-700 hover:bg-slate-600 rounded-lg text-left transition-colors flex justify-between items-center group"
              >
                <div>
                  <div className="font-bold text-indigo-300 group-hover:text-indigo-200">{p.name}</div>
                  <div className="text-xs text-slate-400">{p.description}</div>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <div>薪资: {p.salaryBase}</div>
                  <div>压力: {p.stressFactor}</div>
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
      <div className="min-h-screen flex items-center justify-center p-4 bg-black">
        <div className="max-w-md w-full text-center">
          <h1 className="text-6xl font-black text-red-600 mb-6 animate-pulse">GAME OVER</h1>
          <div className="bg-slate-900 p-6 rounded-lg border border-red-900 mb-8">
            <p className="text-xl text-slate-200 mb-2">生存天数: <span className="text-white font-bold">{gameState.stats.daysSurvived}</span></p>
            <p className="text-slate-400 mb-4">死因:</p>
            <p className="text-2xl text-red-400 font-serif border-t border-slate-800 pt-4">{gameState.gameOverReason}</p>
          </div>
          <button
            onClick={() => setGameState({ ...gameState, phase: 'START', log: [], stats: INITIAL_STATS, gameOverReason: '' })}
            className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-8 rounded-full font-bold transition-all transform hover:scale-105 flex items-center justify-center mx-auto"
          >
            <RotateCcw className="w-5 h-5 mr-2" /> 再来一次
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 max-w-4xl mx-auto flex flex-col">
      <StatBar 
        stats={gameState.stats} 
        profession={gameState.profession} 
        time={gameState.time} 
        isDepressed={gameState.flags.isDepressed}
      />
      
      <GameLog logs={gameState.log} />

      {/* Action Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-auto">
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
          <h3 className="text-slate-400 text-sm uppercase tracking-widest mb-3 flex items-center">
            <Play className="w-4 h-4 mr-1" /> 当前状态: {
              gameState.phase === 'MORNING' ? '清晨 - 准备上班' :
              gameState.phase === 'WORK_AM' || gameState.phase === 'WORK_PM' ? '打工中...' :
              gameState.phase === 'LUNCH' ? '午休 - 干饭' :
              gameState.phase === 'DINNER' ? '下班 - 晚餐' :
              gameState.phase === 'FREE_TIME' ? '自由活动' :
              gameState.phase === 'SLEEP' ? '准备睡觉' : ''
            }
          </h3>

          <div className="grid grid-cols-2 gap-3">
            {gameState.phase === 'MORNING' && (
              <>
                <button onClick={() => handleEat('COOK')} className="btn-action bg-teal-800 hover:bg-teal-700">
                  <Utensils className="w-4 h-4 mr-1" /> 自己做早餐
                </button>
                <button onClick={() => handleEat('TAKEOUT')} className="btn-action bg-orange-800 hover:bg-orange-700">
                  <ShoppingBag className="w-4 h-4 mr-1" /> 买路边摊 (-¥35)
                </button>
                <button onClick={() => handleEat('SKIP')} className="btn-action bg-slate-700 hover:bg-slate-600 col-span-2">
                  不吃赶地铁 (空腹上班)
                </button>
              </>
            )}

            {(gameState.phase === 'WORK_AM' || gameState.phase === 'WORK_PM') && (
              <button onClick={handleWork} className="btn-action bg-blue-900 hover:bg-blue-800 col-span-2 py-8 text-lg animate-pulse">
                <Briefcase className="w-6 h-6 mr-2" /> 搬砖 (点击推进时间)
              </button>
            )}

            {gameState.phase === 'LUNCH' && (
               <>
                <button onClick={() => handleEat('BENTO')} className="btn-action bg-slate-700 hover:bg-slate-600">
                   吃公司盒饭 (-¥15)
                </button>
                <button onClick={() => handleEat('TAKEOUT')} className="btn-action bg-orange-800 hover:bg-orange-700">
                   点外卖 (-¥35)
                </button>
              </>
            )}

            {gameState.phase === 'DINNER' && (
               <>
                <button onClick={() => handleEat('COOK')} className="btn-action bg-teal-800 hover:bg-teal-700">
                  <Utensils className="w-4 h-4 mr-1" /> 自己做饭
                </button>
                <button onClick={() => handleEat('RESTAURANT')} className="btn-action bg-purple-800 hover:bg-purple-700">
                   下馆子 (-¥100)
                </button>
                <button onClick={() => handleEat('TAKEOUT')} className="btn-action bg-orange-800 hover:bg-orange-700 col-span-2">
                   点外卖 (-¥35)
                </button>
              </>
            )}

            {gameState.phase === 'FREE_TIME' && (
              <>
                <button onClick={() => handleFreeTimeAction('GAME')} className="btn-action bg-indigo-900 hover:bg-indigo-800">
                  <Gamepad2 className="w-4 h-4 mr-1" /> 打游戏/刷剧
                </button>
                <button onClick={() => handleFreeTimeAction('PART_TIME')} className="btn-action bg-yellow-900 hover:bg-yellow-800">
                  <Briefcase className="w-4 h-4 mr-1" /> 兼职送外卖
                </button>
                <button onClick={() => handleFreeTimeAction('STUDY')} className="btn-action bg-emerald-900 hover:bg-emerald-800">
                  <Utensils className="w-4 h-4 mr-1" /> 练习厨艺
                </button>
                <button onClick={() => handleFreeTimeAction('HOSPITAL')} className="btn-action bg-red-900 hover:bg-red-800">
                  <Pill className="w-4 h-4 mr-1" /> 去医院 (-¥500)
                </button>
                <button onClick={() => handleFreeTimeAction('SLEEP_EARLY')} className="btn-action bg-slate-600 hover:bg-slate-500 col-span-2">
                   早点睡 (养生)
                </button>
              </>
            )}

            {gameState.phase === 'SLEEP' && (
              <button onClick={handleSleep} className="btn-action bg-slate-900 hover:bg-black border border-slate-600 col-span-2 py-6">
                <Moon className="w-5 h-5 mr-2" /> 睡觉 (进入下一天)
              </button>
            )}
          </div>
        </div>

        {/* Info Panel */}
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 text-sm text-slate-300">
          <h3 className="text-slate-400 text-sm uppercase tracking-widest mb-3">生存提示</h3>
          <ul className="list-disc pl-5 space-y-1">
             <li><span className="text-red-400">身体健康</span> 过低会猝死。但如果超过92，会被神秘组织盯上。</li>
             <li><span className="text-blue-400">心理健康</span> 过低会触发抑郁，降低所有回复效果。</li>
             <li>自己做饭更健康，但需要运气和熟练度。</li>
             <li>除了上班，你也可以选择兼职，或者去医院挥霍存款。</li>
             <li>保持中庸，不要太强，也不要太弱。</li>
          </ul>
        </div>
      </div>
      
      {/* CSS Helper for buttons */}
      <style>{`
        .btn-action {
          @apply text-white font-bold py-3 px-4 rounded transition-all flex items-center justify-center;
        }
      `}</style>
    </div>
  );
};

export default App;
