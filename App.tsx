import React, { useState, useEffect, useCallback } from 'react';
import { GameState, ProfessionType, LogEntry } from './types';
import { PROFESSIONS, INITIAL_STATS, COMPLEX_DEATHS, JOB_EVENTS, JOB_LOGS, DISEASES } from './constants';
import { getRandomInt, formatDateCN, isWeekend } from './utils';
import StatBar from './components/StatBar';
import GameLog from './components/GameLog';
import EventModal, { ModalConfig } from './components/EventModal';
import { 
  Play, RotateCcw, Utensils, Briefcase, Moon, 
  Gamepad2, ShoppingBag, Beer, 
  Dumbbell, Footprints, MonitorPlay, HeartHandshake, Coffee, PartyPopper
} from 'lucide-react';

// 日常意外死亡库
const DAILY_ACCIDENTS = [
  "走在路上玩手机，不慎掉进没有井盖的下水道。",
  "路过高层建筑时，被一个坠落的花盆精准命中。",
  "吃夜宵时被鱼刺卡住喉咙，引发剧烈咳血窒息。",
  "手机充电时玩大型游戏，电池爆炸引发火灾。",
  "过马路时被一辆闯红灯的渣土车卷入车底。",
  "洗澡时燃气热水器泄漏，在不知不觉中一氧化碳中毒。",
  "喝水喝太急呛到了，引发剧烈咳嗽导致肺泡破裂。",
  "早高峰挤地铁时被人群挤压导致肋骨骨折刺破内脏。",
  "在路边看热闹，被失控的车辆撞飞。",
  "熬夜后突然猛地起床，导致脑血管破裂。"
];

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    profession: null,
    stats: INITIAL_STATS,
    phase: 'START',
    date: new Date('2024-01-01T07:00:00'),
    time: '07:00',
    log: [],
    flags: { isDepressed: false, disease: null, hasLoan: false, isSingle: true, streamerSimpCount: 0 },
    modal: { isOpen: false, title: '', description: '', type: 'EVENT', actions: [] },
    gameOverReason: ''
  });

  const addLog = useCallback((text: string, type: LogEntry['type'] = 'info') => {
    setGameState(prev => ({
      ...prev,
      log: [...prev.log, { id: Date.now() + Math.random(), text, type }]
    }));
  }, []);

  // --- 弹窗控制器 ---
  const showModal = (config: Omit<ModalConfig, 'isOpen'>) => {
    setGameState(prev => ({
      ...prev,
      phase: 'MODAL_PAUSE', 
      modal: { ...config, isOpen: true }
    }));
  };

  const closeModal = () => {
    setGameState(prev => ({
      ...prev,
      phase: prev.time.includes('23') ? 'SLEEP' : (prev.time.includes('12') ? 'LUNCH' : 'DINNER'),
      modal: { ...prev.modal, isOpen: false }
    }));
  };

  // --- 核心生存检查 (死亡判定) ---
  useEffect(() => {
    if (gameState.phase === 'START' || gameState.phase === 'GAME_OVER' || gameState.phase === 'MODAL_PAUSE') return;

    const { stats } = gameState;

    // 1. 优先检查高体质“被消失”
    if (stats.physical >= 98 || (stats.physical > 92 && Math.random() < 0.005)) {
      triggerDeath("你在单位组织的体检中，身体数据过于完美。当晚，一辆黑色面包车停在你家楼下。你被某种不可抗力‘特招’了，从此查无此人（传闻某位大人物急需一个健康的器官）。");
      return;
    }

    // 2. 复合死亡判定
    for (const death of COMPLEX_DEATHS) {
      if (death.condition(stats)) {
        triggerDeath(death.text);
        return;
      }
    }

    // 3. 基础数值死亡
    if (stats.physical <= 0) { triggerDeath("过劳死。为了那点窝囊费，你把命搭进去了。尸体在出租屋发臭了才被发现。"); return; }
    if (stats.mental <= 0) { triggerDeath("由于长期精神内耗，你的理智断线了。你赤身裸体冲上大街，最后被送进宛平南路600号终老。"); return; }
    if (stats.satiety <= 0) { triggerDeath("饿死。在这个全面小康的时代，你是个特例。"); return; }

    // 4. 日常意外 (0.3% 概率)
    if (!gameState.phase.includes('SLEEP') && Math.random() < 0.003) {
        const accident = DAILY_ACCIDENTS[getRandomInt(0, DAILY_ACCIDENTS.length - 1)];
        triggerDeath(`【飞来横祸】${accident}`);
        return;
    }
    
    // 5. 职业高风险意外 (骑手/工厂 额外概率)
    const riskFactor = gameState.profession?.healthRisk || 0;
    if (gameState.phase.includes('WORK') && Math.random() < (0.001 * riskFactor)) {
      triggerDeath("工伤事故。机器故障/交通事故带走了你的生命。没有保险，没有人道主义赔偿，只有一张火化证明。");
      return;
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.stats, gameState.phase]);

  // 春节判定
  useEffect(() => {
    const month = gameState.date.getMonth();
    const day = gameState.date.getDate();
    if (month === 1 && day === 9 && gameState.phase === 'MORNING') {
        setGameState(prev => ({...prev, phase: 'EVENT_CNY'}));
        addLog("【除夕夜】即使再不想回家，也得面对七大姑八大姨的审判。", "warning");
    }
  }, [gameState.date, gameState.phase, addLog]);

  const updateStats = (changes: Partial<typeof INITIAL_STATS>, reason?: string) => {
    setGameState(prev => {
      const newStats = { ...prev.stats };
      let physicalChange = changes.physical || 0;
      if (prev.flags.disease) {
          if (physicalChange > 0) physicalChange = Math.floor(physicalChange * 0.5);
          if (physicalChange < 0) physicalChange = Math.floor(physicalChange * 1.5);
      }

      if (changes.physical) newStats.physical = Math.min(100, Math.max(0, newStats.physical + physicalChange));
      if (changes.mental) newStats.mental = Math.min(100, Math.max(0, newStats.mental + (changes.mental || 0)));
      if (changes.money) newStats.money = newStats.money + (changes.money || 0);
      if (changes.satiety) newStats.satiety = Math.min(100, Math.max(0, newStats.satiety + (changes.satiety || 0)));
      if (changes.cookingSkill) newStats.cookingSkill = newStats.cookingSkill + (changes.cookingSkill || 0);
      return { ...prev, stats: newStats };
    });
    if (reason) addLog(reason, changes.physical && changes.physical < 0 ? 'warning' : 'info');
  };

  const triggerDeath = (reason: string) => {
    setGameState(prev => ({ 
      ...prev, 
      phase: 'MODAL_PAUSE',
      modal: {
        isOpen: true,
        type: 'DEATH',
        title: '人生重启',
        description: reason,
        actions: [{ label: '投胎重开', onClick: () => setGameState({ ...gameState, phase: 'GAME_OVER', gameOverReason: reason, modal: { ...gameState.modal, isOpen: false } }), style: 'danger' }]
      }
    }));
  };

  const startGame = (profType: ProfessionType) => {
    const prof = PROFESSIONS[profType];
    setGameState({
      profession: prof,
      stats: { ...INITIAL_STATS, money: prof.id === 'UNEMPLOYED' ? 2000 : 5000 },
      phase: 'MORNING',
      date: new Date('2024-01-01T07:30:00'),
      time: '07:30',
      log: [{ id: 1, text: `>>> 档案载入。身份：${prof.name}。排班：${prof.schedule}。`, type: 'info' }],
      flags: { isDepressed: false, disease: null, hasLoan: false, isSingle: true, streamerSimpCount: 0 },
      modal: { isOpen: false, title: '', description: '', type: 'EVENT', actions: [] },
      gameOverReason: ''
    });
  };

  // --- 核心工作逻辑 (重写版) ---

  const handleWork = () => {
    if (!gameState.profession) return;
    const profId = gameState.profession.id;
    const { stressFactor, healthRisk } = gameState.profession;
    
    // 30% 概率触发【职业专属】特殊抉择
    // 检查是否存在对应的事件库，防止报错
    const events = JOB_EVENTS[profId];
    if (events && events.length > 0 && Math.random() < 0.3) {
      const event = events[getRandomInt(0, events.length - 1)];
      showModal({
        title: event.title,
        description: event.desc,
        type: 'WORK',
        actions: event.options.map(opt => ({
          label: opt.text,
          onClick: () => {
            updateStats(opt.changes, "你做出了选择。");
            closeModal();
            finishWorkBlock();
          }
        }))
      });
      return;
    }

    // 正常工作 (从职业Log库中随机抽取)
    const logs = JOB_LOGS[profId];
    const desc = logs ? logs[getRandomInt(0, logs.length - 1)] : "枯燥的工作...";
    
    // 生病工作风险大幅增加
    const actualRisk = healthRisk + (gameState.flags.disease ? 8 : 0); 
    
    updateStats({
      physical: -actualRisk,
      mental: -stressFactor,
      satiety: -15
    }, desc);

    finishWorkBlock();
  };

  const finishWorkBlock = () => {
    if (gameState.phase === 'WORK_AM') {
        setGameState(prev => ({ ...prev, phase: 'LUNCH', time: '12:00' }));
    } else {
      const salary = (gameState.profession?.salaryBase || 0) + getRandomInt(-50, 50); 
      updateStats({ money: salary });
      addLog(`【下班】入账 ¥${salary}`, 'success');
      setGameState(prev => ({ ...prev, phase: 'DINNER', time: '18:30' }));
    }
  };

  // --- 自由时间逻辑 ---

  const handleFreeTime = (action: string) => {
      switch(action) {
          case 'SPA': 
              if (gameState.stats.money < 1288) { addLog("1288的至尊套餐点不起，只能在前台喝杯水。", "danger"); return; }
              updateStats({ money: -1288, physical: 25, mental: 20 }, "技师说你这腰得加钟。一阵酥麻后，感觉活过来了。");
              break;
          case 'STREAMER': 
              if (gameState.stats.money < 1000) { addLog("只刷1000块？主播连头都没抬。", "warning"); return; }
              const newCount = gameState.flags.streamerSimpCount + 1;
              setGameState(prev => ({ ...prev, flags: { ...prev.flags, streamerSimpCount: newCount } }));
              updateStats({ money: -1000, mental: 15 }, "刷了一个嘉年华！主播喊了句‘感谢大哥’。");
              
              // 触发奔现剧情
              if (newCount >= 3 && Math.random() < 0.4) {
                 triggerStreamerEvent();
                 return; 
              }
              break;
          case 'BBQ': 
              updateStats({ money: -100, physical: -5, mental: 10, satiety: 30 }, "路边摊撸串，虽然不卫生但是真香。");
              break;
          case 'SQUARE_DANCE': 
              updateStats({ physical: 5, mental: 5, satiety: -5 }, "和楼下大妈抢地盘跳舞，身心舒畅。");
              break;
      }
      setGameState(prev => ({ ...prev, phase: 'SLEEP', time: '23:30' }));
  };

  const triggerStreamerEvent = () => {
    showModal({
      title: "主播的私信",
      description: "‘榜一大哥，为了感谢你的支持，今晚出来见一面？’ 你看着手机屏幕，心跳加速。",
      type: 'LOVE',
      actions: [
        {
          label: "必须去！(充满期待)",
          onClick: () => {
            if (Math.random() < 0.8) {
              showModal({
                title: "奔现翻车",
                description: "你到了约定地点，发现对方和直播间不能说一模一样，只能说毫无关系。是一个开了十级美颜的乔碧萝，而且还是个酒托。你被坑了酒钱还受了情伤。",
                type: 'DEATH', // 震惊图标
                actions: [{ label: "含泪回家 (精神-50, 钱-2000)", onClick: () => {
                  updateStats({ mental: -50, money: -2000 }, "精神受到了一万点暴击，钱包也被掏空。");
                  closeModal();
                }, style: 'danger' }]
              });
            } else {
              updateStats({ mental: 50 }, "虽然是酒托，但至少长得和照片一样，你度过了愉快的一晚。");
              closeModal();
            }
          }
        },
        {
          label: "算了，那是电子老婆",
          onClick: () => {
            updateStats({ mental: -5 }, "你拒绝了诱惑，虽然有点遗憾。");
            closeModal();
          },
          style: 'secondary'
        }
      ]
    });
  };

  const handleSleep = () => {
    let diseaseText = "";
    // 疾病判定
    if (!gameState.flags.disease) {
       if ((gameState.stats.physical < 60 && Math.random() < 0.3) || Math.random() < 0.05) {
         const disease = DISEASES[getRandomInt(0, DISEASES.length - 1)];
         setGameState(prev => ({ ...prev, flags: { ...prev.flags, disease: disease.name } }));
         diseaseText = `你感觉身体不适，确诊了【${disease.name}】。`;
         
         showModal({
           title: "突发恶疾",
           description: `早起感觉不对劲。医生告诉你确诊了【${disease.name}】。${disease.desc} 治疗需要花费 ¥${disease.cost}。`,
           type: 'DISEASE',
           actions: [
             { label: `去医院治疗 (-¥${disease.cost})`, onClick: () => {
                if (gameState.stats.money >= disease.cost) {
                   updateStats({ money: -disease.cost });
                   setGameState(prev => ({ ...prev, flags: { ...prev.flags, disease: null } }));
                   closeModal();
                } else {
                   addLog("钱不够，被医生赶了出来。只能硬扛了。", "danger");
                   closeModal();
                }
             }},
             { label: "硬扛 (体力回复减半)", onClick: () => closeModal(), style: 'secondary' }
           ]
         });
         return; 
       }
    } else {
       updateStats({ physical: -8, mental: -5 }, `受到【${gameState.flags.disease}】的折磨，身体在衰弱。`);
    }

    const nextDay = new Date(gameState.date);
    nextDay.setDate(nextDay.getDate() + 1);

    updateStats({ 
        physical: 10, 
        mental: 5, 
        satiety: -20, 
    });

    setGameState(prev => ({ 
        ...prev, 
        date: nextDay,
        phase: 'MORNING', 
        time: '07:00' 
    }));
    if (diseaseText) addLog(diseaseText, 'danger');
    addLog(`=== ${formatDateCN(nextDay)} ===`, 'info');
  };

  // --- Actions Wrappers ---
  const handleRestDayActivity = (type: string) => {
     if (type === 'DATE_BLIND') {
        if (Math.random() < 0.5) {
            updateStats({ money: -500, mental: -20 }, "遇到了奇葩相亲对象，对方带了全家来蹭饭，吃完就拉黑了你。");
        } else {
            updateStats({ money: -200, mental: 5 }, "对方还算正常，加了微信，但回复很慢。");
        }
     } else if (type === 'SLEEP_IN') {
        updateStats({ physical: 20, mental: 15, satiety: -10 }, "睡到自然醒，这才是生活！");
     }
     if (gameState.phase === 'REST_AM') setGameState(prev => ({ ...prev, phase: 'LUNCH', time: '12:00' }));
     else setGameState(prev => ({ ...prev, phase: 'DINNER', time: '18:00' }));
  };
  
  const handleEat = (type: string) => {
      if (type === 'TAKEOUT') {
        if (Math.random() < 0.1) {
            updateStats({ money: -30, satiety: 40, physical: -10 }, "外卖里吃出了半只蟑螂，恶心得你吐了一天。");
        } else {
            updateStats({ money: -30, satiety: 40, physical: -2 }, "拼好饭的外卖，科技与狠活的味道。");
        }
      } else if (type === 'COOK') {
        updateStats({ money: -15, satiety: 35, cookingSkill: 1 }, "自己做饭，虽然刷碗很累，但吃得放心。");
      }
      advanceTime();
  };

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

  const advanceTime = () => {
    setGameState(prev => {
      let nextPhase = prev.phase;
      let nextTime = prev.time;
      const schedule = prev.profession?.schedule || '965';
      const isTodayWeekend = isWeekend(prev.date, schedule);

      if (prev.phase === 'MORNING') {
          if (isTodayWeekend) { nextPhase = 'REST_AM'; nextTime = '10:00'; addLog("休息日！", 'success'); } 
          else { nextPhase = 'WORK_AM'; nextTime = '09:00'; }
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
     // 计算准确生存天数
     const startDate = new Date('2024-01-01T07:00:00');
     const diffTime = Math.abs(gameState.date.getTime() - startDate.getTime());
     const survivedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

     return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-black font-mono">
        <div className="max-w-md w-full text-center relative">
          <h1 className="text-6xl font-black text-red-600 mb-6 tracking-widest">已销户</h1>
          <div className="bg-red-950/20 p-6 rounded border border-red-900/50 mb-8 backdrop-blur">
            <p className="text-zinc-400 mb-2 text-sm uppercase">生存时长</p>
            <p className="text-4xl text-white font-bold mb-6">{survivedDays} 天</p>
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

  // EVENT_CNY 保持一致

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 font-sans selection:bg-red-500/30 pb-10">
      <EventModal config={gameState.modal} />

      <StatBar stats={gameState.stats} profession={gameState.profession} time={gameState.time} isDepressed={gameState.flags.isDepressed} date={gameState.date} />
      
      <main className="max-w-4xl mx-auto p-4 flex flex-col gap-6">
        <GameLog logs={gameState.log} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-zinc-900/80 p-5 rounded-xl border border-zinc-800 shadow-lg h-fit">
                 <h3 className="text-zinc-500 text-xs font-mono uppercase tracking-widest mb-4 flex items-center">
                    <Play className="w-3 h-3 mr-2" /> Current Status
                 </h3>
                 <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm border-b border-zinc-800 pb-2">
                        <span className="text-zinc-400">当前阶段</span>
                        <span className="text-white font-bold">
                             {(() => {
                                switch (gameState.phase) {
                                    case 'MORNING': return '通勤/准备';
                                    case 'WORK_AM': return '上午搬砖';
                                    case 'LUNCH': return '午休干饭';
                                    case 'WORK_PM': return '下午搬砖';
                                    case 'REST_AM': return '周末赖床';
                                    case 'REST_PM': return '周末休闲';
                                    case 'DINNER': return '下班/晚餐';
                                    case 'FREE_TIME': return '夜生活';
                                    case 'SLEEP': return '梦乡';
                                    case 'EVENT_CNY': return '春节渡劫';
                                    default: return '摸鱼中';
                                }
                            })()}
                        </span>
                    </div>
                    {gameState.flags.disease && (
                        <div className="bg-red-900/30 p-2 rounded border border-red-800 text-xs text-red-300 flex items-center animate-pulse">
                             <span className="mr-2">●</span> 患病: {gameState.flags.disease}
                        </div>
                    )}
                 </div>
            </div>

            <div className="lg:col-span-2 bg-zinc-900/80 p-5 rounded-xl border border-zinc-800 shadow-lg">
                 <h3 className="text-zinc-500 text-xs font-mono uppercase tracking-widest mb-4">Available Actions</h3>
                 <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    
                    {(gameState.phase === 'MORNING' || gameState.phase === 'LUNCH' || gameState.phase === 'DINNER') && (
                        <>
                           <ActionButton onClick={() => handleEat('TAKEOUT')} icon={<ShoppingBag/>} label="拼好饭" sub="-¥30" color="orange" />
                           <ActionButton onClick={() => handleEat('COOK')} icon={<Utensils/>} label="自己做饭" sub="健康卫生" color="teal" />
                        </>
                    )}

                    {gameState.phase.includes('WORK') && (
                        <button onClick={handleWork} className="col-span-full py-12 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white rounded-xl transition-all group flex flex-col items-center justify-center gap-2 hover:shadow-lg hover:shadow-zinc-900/50">
                            <Briefcase className="w-8 h-8 group-hover:animate-bounce text-zinc-400 group-hover:text-white" />
                            <span className="text-xl font-bold tracking-widest">
                                {gameState.profession?.id === 'PROGRAMMER' ? '写代码 (修BUG)' : 
                                 gameState.profession?.id === 'DELIVERY' ? '接单跑腿' : '打工 (搬砖)'}
                            </span>
                            <span className="text-xs text-zinc-500 font-mono">CLICK TO WORK</span>
                        </button>
                    )}

                    {gameState.phase.includes('REST') && (
                        <>
                            <ActionButton onClick={() => handleRestDayActivity('SLEEP_IN')} icon={<Moon/>} label="睡懒觉" sub="回血神器" color="indigo" />
                            <ActionButton onClick={() => handleRestDayActivity('DATE_BLIND')} icon={<HeartHandshake/>} label="去相亲" sub="赌博行为" color="red" />
                        </>
                    )}

                    {gameState.phase === 'FREE_TIME' && (
                        <>
                            <ActionButton onClick={() => handleFreeTime('SPA')} icon={<Footprints/>} label="高端会所" sub="-¥1288 | 帝王服务" color="pink" />
                            <ActionButton onClick={() => handleFreeTime('STREAMER')} icon={<MonitorPlay/>} label="打赏主播" sub="-¥1000 | 感谢大哥" color="purple" />
                            <ActionButton onClick={() => handleFreeTime('BBQ')} icon={<Beer/>} label="路边撸串" sub="-¥100 | 快乐" color="orange" />
                            <ActionButton onClick={() => handleFreeTime('SQUARE_DANCE')} icon={<Dumbbell/>} label="广场舞" sub="强身健体" color="teal" />
                        </>
                    )}

                    {gameState.phase === 'SLEEP' && (
                         <button onClick={handleSleep} className="col-span-full py-10 bg-black hover:bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-zinc-300 rounded-xl transition-all flex flex-col items-center justify-center group">
                            <Moon className="w-6 h-6 mb-2 group-hover:text-yellow-200 transition-colors" />
                            <span className="font-bold">结束这一天 (结算疾病)</span>
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
