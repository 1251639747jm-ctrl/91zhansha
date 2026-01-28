import React, { useState, useEffect, useCallback } from 'react';
import { GameState, ProfessionType, LogEntry } from './types';
import { PROFESSIONS, INITIAL_STATS, COMPLEX_DEATHS } from './constants';
import { getRandomInt, formatDateCN, isWeekend } from './utils';
import StatBar from './StatBar';
import GameLog from './GameLog';
import { 
  Play, RotateCcw, Utensils, Briefcase, Moon, 
  Gamepad2, ShoppingBag, Beer, 
  Dumbbell, Footprints, MonitorPlay, HeartHandshake, Coffee, PartyPopper
} from 'lucide-react';

const App: React.FC = () => {
  // 初始化日期为2024年1月1日
  const [gameState, setGameState] = useState<GameState>({
    profession: null,
    stats: INITIAL_STATS,
    phase: 'START',
    date: new Date('2024-01-01T07:00:00'),
    time: '07:00',
    log: [],
    flags: { isDepressed: false, isSick: false, hasLoan: false, isSingle: true },
    gameOverReason: ''
  });

  const addLog = useCallback((text: string, type: LogEntry['type'] = 'info') => {
    setGameState(prev => ({
      ...prev,
      log: [...prev.log, { id: Date.now() + Math.random(), text, type }]
    }));
  }, []);

  // --- 核心生存检查 ---
  useEffect(() => {
    if (gameState.phase === 'START' || gameState.phase === 'GAME_OVER') return;

    const { stats } = gameState;

    // 1. 复合死亡判定 (Priority 1)
    for (const death of COMPLEX_DEATHS) {
      if (death.condition(stats)) {
        endGame(death.text);
        return;
      }
    }

    // 2. 基础数值死亡
    if (stats.physical <= 0) endGame("过劳死。为了那点窝囊费，你把命搭进去了。");
    if (stats.mental <= 0) endGame("由于长期精神内耗，你彻底疯了，被送进宛平南路600号。");
    if (stats.satiety <= 0) endGame("饿死。在这个全面小康的时代，你是个特例。");
    
    // 3. 随机意外 (骑手高风险)
    const riskFactor = gameState.profession?.healthRisk || 1;
    if (gameState.phase.includes('WORK') && Math.random() < (0.0005 * riskFactor)) {
      endGame("工伤事故。没有保险，没有人道主义赔偿，只有一张火化证明。");
      return;
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.stats, gameState.phase]);

  // 春节判定 logic
  useEffect(() => {
    const month = gameState.date.getMonth();
    const day = gameState.date.getDate();
    // 简化：设定2月9日除夕 (2024年真实日期)
    if (month === 1 && day === 9 && gameState.phase === 'MORNING') {
        setGameState(prev => ({...prev, phase: 'EVENT_CNY'}));
        addLog("【除夕夜】即使再不想回家，也得面对七大姑八大姨的审判。", "warning");
    }
  }, [gameState.date, gameState.phase, addLog]);

  const updateStats = (changes: Partial<typeof INITIAL_STATS>, reason?: string) => {
    setGameState(prev => {
      const newStats = { ...prev.stats };
      if (changes.physical) newStats.physical = Math.min(100, Math.max(0, newStats.physical + changes.physical));
      if (changes.mental) newStats.mental = Math.min(100, Math.max(0, newStats.mental + changes.mental));
      if (changes.money) newStats.money = newStats.money + changes.money;
      if (changes.satiety) newStats.satiety = Math.min(100, Math.max(0, newStats.satiety + changes.satiety));
      if (changes.cookingSkill) newStats.cookingSkill = newStats.cookingSkill + changes.cookingSkill;
      // Survived days increment is handled in Sleep
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
      stats: { ...INITIAL_STATS, money: prof.id === 'UNEMPLOYED' ? 2000 : 5000 },
      phase: 'MORNING',
      date: new Date('2024-01-01T07:30:00'),
      time: '07:30',
      log: [{ id: 1, text: `>>> 也是这一天。身份：${prof.name}。排班：${prof.schedule}。祝你好运。`, type: 'info' }],
      flags: { isDepressed: false, isSick: false, hasLoan: false, isSingle: true },
      gameOverReason: ''
    });
  };

  // --- Actions ---

  const handleCNYChoice = (choice: 'ARGUE' | 'SILENT' | 'GIVE_MONEY') => {
      if (choice === 'ARGUE') {
          updateStats({ mental: 20, physical: -5 }, "你舌战群儒，怼得亲戚哑口无言！心里爽翻了。");
      } else if (choice === 'SILENT') {
          updateStats({ mental: -15 }, "你默默忍受了催婚和攀比，感觉自己像个废物。");
      } else if (choice === 'GIVE_MONEY') {
          if (gameState.stats.money < 2000) { addLog("没钱发红包，被亲戚翻了白眼。", "danger"); updateStats({mental: -20}); }
          else { updateStats({ money: -2000, mental: 10 }, "破财免灾，发了红包后耳根子清净了。"); }
      }
      setGameState(prev => ({ ...prev, phase: 'SLEEP', time: '23:00' }));
  };

  const handleWork = () => {
    if (!gameState.profession) return;
    const { stressFactor, healthRisk, salaryBase } = gameState.profession;
    
    // 摸鱼判定
    const isSlacking = Math.random() > 0.8;
    const actualStress = isSlacking ? 0 : stressFactor + getRandomInt(0, 2);
    const actualRisk = isSlacking ? 0 : healthRisk;

    let msg = isSlacking ? "带薪拉屎半小时，神清气爽。" : "疯狂搬砖，感觉身体被掏空。";
    if (gameState.profession.id === 'DELIVERY' && Math.random() < 0.2) msg = "差点被逆行的三轮车撞到，吓出一身冷汗。";
    if (gameState.profession.id === 'PROGRAMMER' && Math.random() < 0.2) msg = "遇到一个史山代码，改BUG改到头秃。";

    updateStats({
      physical: -actualRisk,
      mental: -actualStress,
      satiety: -15
    });
    addLog(msg, isSlacking ? 'success' : 'info');

    if (gameState.phase === 'WORK_AM') setGameState(prev => ({ ...prev, phase: 'LUNCH', time: '12:00' }));
    else {
      // 下班结算
      const dailyPay = salaryBase + getRandomInt(-50, 50); 
      updateStats({ money: dailyPay });
      addLog(`【下班】今日也是牛马的一天。获得: ¥${dailyPay}`, 'success');
      setGameState(prev => ({ ...prev, phase: 'DINNER', time: '18:30' }));
    }
  };

  const handleRestDayActivity = (type: string) => {
    // 休息日专属活动
    switch(type) {
        case 'SLEEP_IN':
            updateStats({ physical: 15, mental: 10, satiety: -10 }, "睡到自然醒，这才是生活！");
            break;
        case 'STUDY':
            updateStats({ mental: -5, money: -50 }, "去图书馆卷了一上午，感觉离升职加薪近了一步。");
            break;
        case 'GAME_ALL_DAY':
            updateStats({ mental: 20, physical: -5, satiety: -10 }, "通宵排位，虽然赢了但腰快断了。");
            break;
        case 'DATE_BLIND': // 相亲
             if (Math.random() < 0.4) {
                 updateStats({ mental: -20, money: -300 }, "遇到了奇葩相亲对象，气得你当场买单走人。");
             } else {
                 updateStats({ mental: 10, money: -300 }, "对方还不错，加了微信，但花了一大笔饭钱。");
             }
             break;
    }
    // 休息日时间流逝快
    if (gameState.phase === 'REST_AM') setGameState(prev => ({ ...prev, phase: 'LUNCH', time: '12:00' }));
    else setGameState(prev => ({ ...prev, phase: 'DINNER', time: '18:00' }));
  };

  const handleFreeTime = (action: string) => {
      // 中国特色夜生活
      switch(action) {
          case 'SPA': // 洗脚城
              if (gameState.stats.money < 298) { addLog("298的套餐都点不起，被服务员鄙视了。", "danger"); return; }
              updateStats({ money: -298, physical: 15, mental: 15 }, "‘贵宾一位！’ 技师的手法让你忘记了尘世的烦恼。");
              break;
          case 'STREAMER': // 打赏主播
              if (gameState.stats.money < 500) { addLog("余额不足，无法守护最好的giegie/妹妹。", "warning"); return; }
              updateStats({ money: -500, mental: 25 }, "刷了一个大火箭！主播喊了你的名字，你感觉人生到达了巅峰。");
              break;
          case 'BBQ': // 撸串
              updateStats({ money: -100, physical: -5, mental: 10, satiety: 30 }, "没有什么是一顿烧烤解决不了的，如果有，就两顿。");
              break;
          case 'SQUARE_DANCE': // 广场舞
              updateStats({ physical: 5, mental: 5, satiety: -5 }, "混入大妈队伍跳广场舞，意外地解压。");
              break;
      }
      setGameState(prev => ({ ...prev, phase: 'SLEEP', time: '23:30' }));
  };

  const handleEat = (type: string) => {
      if (type === 'TAKEOUT') {
          updateStats({ money: -30, satiety: 40, physical: -2 }, "拼好饭的外卖，不知道是不是淋巴肉，凑合吃吧。");
          addLog("吃了份重油重盐的外卖。");
      } else if (type === 'COOK') {
          updateStats({ satiety: 35, cookingSkill: 1, money: -15 }, "自己做的西红柿炒蛋，虽然卖相不好但健康。");
          addLog("自己做饭，充满生活气息。");
      }
      advanceTime();
  };

  const advanceTime = () => {
    setGameState(prev => {
      let nextPhase = prev.phase;
      let nextTime = prev.time;

      const schedule = prev.profession?.schedule || '965';
      const isTodayWeekend = isWeekend(prev.date, schedule);

      if (prev.phase === 'MORNING') {
          // 判断今天是否休息
          if (isTodayWeekend) {
              nextPhase = 'REST_AM'; nextTime = '10:00';
              addLog(`今天是休息日 (${schedule})，不用去当牛马了！`, 'success');
          } else {
              nextPhase = 'WORK_AM'; nextTime = '09:00';
          }
      } 
      else if (prev.phase === 'REST_AM') { nextPhase = 'LUNCH'; nextTime = '12:00'; }
      else if (prev.phase === 'LUNCH') {
          if (isTodayWeekend) { nextPhase = 'REST_PM'; nextTime = '14:00'; }
          else { nextPhase = 'WORK_PM'; nextTime = '13:00'; }
      }
      else if (prev.phase === 'DINNER') { nextPhase = 'FREE_TIME'; nextTime = '20:00'; }

      return { ...prev, phase: nextPhase, time: nextTime };
    });
  };

  const handleSleep = () => {
    const nextDay = new Date(gameState.date);
    nextDay.setDate(nextDay.getDate() + 1);

    updateStats({ 
        physical: 10, 
        mental: 5, 
        satiety: -20, 
        daysSurvived: 1 
    });

    setGameState(prev => ({ 
        ...prev, 
        date: nextDay,
        phase: 'MORNING', 
        time: '07:00' 
    }));
    addLog(`=== ${formatDateCN(nextDay)} ===`, 'info');
  };

  // --- Render ---

  if (gameState.phase === 'START') {
     return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950 font-sans">
        <div className="max-w-3xl w-full bg-zinc-900/80 p-8 rounded-xl shadow-2xl border border-zinc-800 backdrop-blur">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-yellow-500 mb-2 text-center tracking-tighter">中国式社畜模拟器</h1>
          <p className="text-zinc-500 text-center mb-10 font-mono text-sm">/// 选择你的开局 ///</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.values(PROFESSIONS).map((p) => (
              <button key={p.id} onClick={() => startGame(p.id as ProfessionType)}
                className="p-4 bg-zinc-800/50 hover:bg-red-900/10 border border-zinc-700 hover:border-red-500/50 rounded-lg text-left transition-all group relative overflow-hidden">
                <div className="relative z-10">
                  <div className="font-bold text-zinc-100 group-hover:text-red-400 flex justify-between items-center">
                      {p.name} <span className="text-xs bg-zinc-900 px-2 py-0.5 rounded text-zinc-400 border border-zinc-700">{p.schedule}</span>
                  </div>
                  <div className="text-xs text-zinc-400 mt-2 leading-relaxed">{p.description}</div>
                  <div className="mt-3 text-[10px] text-zinc-500 font-mono flex gap-3">
                      <span>底薪: ¥{p.salaryBase}/天</span>
                      <span>压力: {'★'.repeat(p.stressFactor)}</span>
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
          <h1 className="text-6xl font-black text-red-600 mb-6 tracking-widest">已销户</h1>
          <div className="bg-red-950/20 p-6 rounded border border-red-900/50 mb-8 backdrop-blur">
            <p className="text-zinc-400 mb-2 text-sm uppercase">生存时长</p>
            <p className="text-4xl text-white font-bold mb-6">{gameState.stats.daysSurvived} 天</p>
            <p className="text-zinc-400 mb-2 text-sm uppercase">死亡日期</p>
            <p className="text-xl text-white font-bold mb-6">{formatDateCN(gameState.date)}</p>
            <p className="text-zinc-500 mb-2 text-xs uppercase">销户原因</p>
            <p className="text-lg text-red-400 font-bold border-t border-red-900/30 pt-4 leading-relaxed">{gameState.gameOverReason}</p>
          </div>
          <button onClick={() => setGameState({ ...gameState, phase: 'START', log: [], stats: INITIAL_STATS, gameOverReason: '' })}
            className="bg-zinc-800 hover:bg-zinc-700 text-white py-3 px-8 rounded font-bold transition-all flex items-center justify-center mx-auto border border-zinc-600 hover:border-white">
            <RotateCcw className="w-4 h-4 mr-2" /> 投胎重开
          </button>
        </div>
      </div>
      );
  }

  if (gameState.phase === 'EVENT_CNY') {
      return (
          <div className="min-h-screen bg-red-950 flex items-center justify-center p-4 font-sans">
              <div className="max-w-md w-full bg-red-900 p-8 rounded-xl shadow-2xl border-4 border-yellow-500 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/chinese-new-year.png')] opacity-10"></div>
                  <div className="relative z-10 text-center">
                    <PartyPopper className="w-16 h-16 text-yellow-400 mx-auto mb-4 animate-bounce" />
                    <h2 className="text-3xl font-black text-yellow-100 mb-4 tracking-tighter">春节 · 渡劫</h2>
                    <p className="text-red-100 mb-8 text-sm leading-relaxed opacity-90">
                        除夕夜，七大姑八大姨围坐在你身边。
                        空气中弥漫着攀比和催婚的味道。
                        这是一个比996更危险的战场。
                    </p>
                    <div className="space-y-3">
                        <button onClick={() => handleCNYChoice('ARGUE')} className="w-full p-4 bg-red-800 hover:bg-red-700 text-white rounded-lg font-bold border border-red-600 transition-colors flex items-center justify-center">
                            <Briefcase className="w-4 h-4 mr-2"/> 舌战群儒 (精神+20, 身体-5)
                        </button>
                        <button onClick={() => handleCNYChoice('GIVE_MONEY')} className="w-full p-4 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg font-bold border border-yellow-400 transition-colors flex items-center justify-center shadow-lg">
                            <ShoppingBag className="w-4 h-4 mr-2"/> 发红包封口 (-¥2000, 精神+10)
                        </button>
                        <button onClick={() => handleCNYChoice('SILENT')} className="w-full p-4 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-300 rounded-lg font-bold transition-colors flex items-center justify-center">
                            <Moon className="w-4 h-4 mr-2"/> 装聋作哑 (精神-15)
                        </button>
                    </div>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 font-sans selection:bg-red-500/30 pb-10">
      <StatBar stats={gameState.stats} profession={gameState.profession} time={gameState.time} isDepressed={gameState.flags.isDepressed} date={gameState.date} />
      
      <main className="max-w-4xl mx-auto p-4 flex flex-col gap-6">
        <GameLog logs={gameState.log} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 左侧状态栏 */}
            <div className="lg:col-span-1 bg-zinc-900/80 p-5 rounded-xl border border-zinc-800 shadow-lg h-fit">
                 <h3 className="text-zinc-500 text-xs font-mono uppercase tracking-widest mb-4 flex items-center">
                    <Play className="w-3 h-3 mr-2" /> Current Status
                 </h3>
                 <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm border-b border-zinc-800 pb-2">
                        <span className="text-zinc-400">当前阶段</span>
                        <span className="text-white font-bold">
                             {gameState.phase.includes('WORK') ? '搬砖中' :
                              gameState.phase.includes('REST') ? '休息日' :
                              gameState.phase === 'LUNCH' ? '午休' :
                              gameState.phase === 'DINNER' ? '下班时间' :
                              gameState.phase === 'FREE_TIME' ? '夜生活' :
                              gameState.phase === 'SLEEP' ? '梦乡' : '通勤'}
                        </span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-zinc-800 pb-2">
                        <span className="text-zinc-400">排班制度</span>
                        <span className="text-zinc-200 font-mono bg-zinc-800 px-2 rounded text-xs py-0.5">{gameState.profession?.schedule || '无'}</span>
                    </div>
                     <div className="flex justify-between items-center text-sm">
                        <span className="text-zinc-400">今日类型</span>
                        <span className={`${gameState.phase.includes('REST') ? 'text-green-400' : 'text-zinc-500'} font-bold text-xs`}>
                            {gameState.phase.includes('REST') ? 'WEEKEND / HOLIDAY' : 'WORKDAY'}
                        </span>
                    </div>
                 </div>
            </div>

            {/* 右侧操作栏 */}
            <div className="lg:col-span-2 bg-zinc-900/80 p-5 rounded-xl border border-zinc-800 shadow-lg">
                 <h3 className="text-zinc-500 text-xs font-mono uppercase tracking-widest mb-4">Available Actions</h3>
                 <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    
                    {/* 饮食 (通用) */}
                    {(gameState.phase === 'MORNING' || gameState.phase === 'LUNCH' || gameState.phase === 'DINNER') && (
                        <>
                           <ActionButton onClick={() => handleEat('TAKEOUT')} icon={<ShoppingBag/>} label="拼好饭" sub="-¥30" color="orange" />
                           <ActionButton onClick={() => handleEat('COOK')} icon={<Utensils/>} label="自己做饭" sub="健康卫生" color="teal" />
                        </>
                    )}

                    {/* 工作 (工作日) */}
                    {gameState.phase.includes('WORK') && (
                        <button onClick={handleWork} className="col-span-full py-12 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white rounded-xl transition-all group flex flex-col items-center justify-center gap-2 hover:shadow-lg hover:shadow-zinc-900/50">
                            <Briefcase className="w-8 h-8 group-hover:animate-bounce text-zinc-400 group-hover:text-white" />
                            <span className="text-xl font-bold tracking-widest">打工 (搬砖)</span>
                            <span className="text-xs text-zinc-500 font-mono">CLICK TO SURVIVE</span>
                        </button>
                    )}

                    {/* 休息日活动 */}
                    {gameState.phase.includes('REST') && (
                        <>
                            <ActionButton onClick={() => handleRestDayActivity('SLEEP_IN')} icon={<Moon/>} label="睡懒觉" sub="回血神器" color="indigo" />
                            <ActionButton onClick={() => handleRestDayActivity('GAME_ALL_DAY')} icon={<Gamepad2/>} label="通宵游戏" sub="很爽但伤身" color="purple" />
                            <ActionButton onClick={() => handleRestDayActivity('DATE_BLIND')} icon={<HeartHandshake/>} label="去相亲" sub="赌博行为" color="red" />
                            <ActionButton onClick={() => handleRestDayActivity('STUDY')} icon={<Coffee/>} label="内卷学习" sub="提升自我" color="zinc" />
                        </>
                    )}

                    {/* 晚间自由活动 */}
                    {gameState.phase === 'FREE_TIME' && (
                        <>
                            <ActionButton onClick={() => handleFreeTime('SPA')} icon={<Footprints/>} label="洗脚城" sub="-¥298 | 帝王服务" color="pink" />
                            <ActionButton onClick={() => handleFreeTime('STREAMER')} icon={<MonitorPlay/>} label="打赏主播" sub="-¥500 | 感谢老铁" color="purple" />
                            <ActionButton onClick={() => handleFreeTime('BBQ')} icon={<Beer/>} label="路边撸串" sub="-¥100 | 快乐" color="orange" />
                            <ActionButton onClick={() => handleFreeTime('SQUARE_DANCE')} icon={<Dumbbell/>} label="广场舞" sub="强身健体" color="teal" />
                        </>
                    )}

                     {/* 睡觉 */}
                    {gameState.phase === 'SLEEP' && (
                         <button onClick={handleSleep} className="col-span-full py-10 bg-black hover:bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-zinc-300 rounded-xl transition-all flex flex-col items-center justify-center group">
                            <Moon className="w-6 h-6 mb-2 group-hover:text-yellow-200 transition-colors" />
                            <span className="font-bold">结束这一天</span>
                        </button>
                    )}
                 </div>
            </div>
        </div>
      </main>
    </div>
  );
};

const ActionButton = ({ onClick, icon, label, sub, color }: any) => {
    const colors: any = {
        teal: 'bg-teal-900/20 border-teal-800 hover:border-teal-500 text-teal-200 hover:bg-teal-900/40',
        orange: 'bg-orange-900/20 border-orange-800 hover:border-orange-500 text-orange-200 hover:bg-orange-900/40',
        purple: 'bg-purple-900/20 border-purple-800 hover:border-purple-500 text-purple-200 hover:bg-purple-900/40',
        red: 'bg-red-900/20 border-red-800 hover:border-red-500 text-red-200 hover:bg-red-900/40',
        pink: 'bg-pink-900/20 border-pink-800 hover:border-pink-500 text-pink-200 hover:bg-pink-900/40',
        indigo: 'bg-indigo-900/20 border-indigo-800 hover:border-indigo-500 text-indigo-200 hover:bg-indigo-900/40',
        zinc: 'bg-zinc-800/40 border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:bg-zinc-800'
    };
    return (
        <button onClick={onClick} className={`${colors[color] || colors.zinc} p-3 rounded-lg border transition-all flex flex-col items-center justify-center text-center h-24 group relative overflow-hidden`}>
             <div className="mb-1 opacity-80 group-hover:scale-110 transition-transform duration-300">
                {React.cloneElement(icon, { size: 24 })}
             </div>
             <span className="font-bold text-sm z-10">{label}</span>
             <span className="text-[10px] opacity-60 mt-1 font-mono z-10">{sub}</span>
        </button>
    );
};

export default App;
