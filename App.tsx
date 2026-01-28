import React, { useState, useEffect, useCallback } from 'react';
import { GameState, ProfessionType, LogEntry, Partner } from './types';
import { PROFESSIONS, INITIAL_STATS, COMPLEX_DEATHS, JOB_EVENTS, JOB_LOGS, DISEASES, POTENTIAL_PARTNERS, ASSET_COSTS } from './constants';
import { getRandomInt, formatDateCN, isWeekend } from './utils';
import StatBar from './components/StatBar';
import GameLog from './components/GameLog';
import EventModal, { ModalConfig } from './components/EventModal';
import RelationshipModal from './components/RelationshipModal';
import { 
  Play, RotateCcw, Utensils, Briefcase, Moon, 
  ShoppingBag, Beer, Dumbbell, Footprints, 
  MonitorPlay, Heart, Coffee, PartyPopper, HeartHandshake
} from 'lucide-react';

const DAILY_ACCIDENTS = [
  "走在路上玩手机，不慎掉进没有井盖的下水道。",
  "路过高层建筑时，被一个坠落的花盆精准命中。",
  "吃夜宵时被鱼刺卡住喉咙，引发剧烈咳血窒息。",
  "手机充电时玩大型游戏，电池爆炸引发火灾。",
  "过马路时被一辆闯红灯的渣土车卷入车底。",
  "洗澡时燃气热水器泄漏，在不知不觉中一氧化碳中毒。",
  "喝水喝太急呛到了，引发剧烈咳嗽导致肺泡破裂。",
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
    flags: { 
      isDepressed: false, disease: null, hasLoan: false, isSingle: true, streamerSimpCount: 0,
      partner: null, isPursuing: false, hasHouse: false, hasCar: false, parentPressure: 0 
    },
    modal: { isOpen: false, title: '', description: '', type: 'EVENT', actions: [] },
    showRelationshipPanel: false, 
    gameOverReason: ''
  });

  const addLog = useCallback((text: string, type: LogEntry['type'] = 'info') => {
    setGameState(prev => ({
      ...prev,
      log: [...prev.log, { id: Date.now() + Math.random(), text, type }]
    }));
  }, []);

  const showModal = (config: Omit<ModalConfig, 'isOpen'>) => {
    setGameState(prev => ({ ...prev, phase: 'MODAL_PAUSE', modal: { ...config, isOpen: true } }));
  };

  const closeModal = () => {
    setGameState(prev => ({
      ...prev,
      phase: prev.time.includes('23') ? 'SLEEP' : (prev.time.includes('12') ? 'LUNCH' : 'DINNER'),
      modal: { ...prev.modal, isOpen: false }
    }));
  };

  // --- 核心生存检查 ---
  useEffect(() => {
    if (gameState.phase === 'START' || gameState.phase === 'GAME_OVER' || gameState.phase === 'MODAL_PAUSE') return;
    const { stats, flags } = gameState;

    // 1. 动态资产负债死亡判定 (修复买房秒死Bug)
    // 基础破产线是 -2万，如果有房则允许负债到 -150万，有车 -40万
    let debtLimit = -20000;
    if (flags.hasHouse) debtLimit -= 1500000;
    if (flags.hasCar) debtLimit -= 300000;

    if (stats.money < debtLimit) {
        triggerDeath("资金链彻底断裂。你背负的债务超过了资产价值，被法院强制执行，绝望之下你选择了自我了断。");
        return;
    }

    // 2. 高体质被抓
    if (stats.physical >= 98 || (stats.physical > 92 && Math.random() < 0.005)) {
      triggerDeath("你在体检中数据过于完美。当晚，一辆黑色面包车停在你家楼下。你被某种不可抗力‘特招’了，从此查无此人（疑似被大人物看中器官）。"); return;
    }
    // 3. 复合死亡条件
    for (const death of COMPLEX_DEATHS) {
      if (death.condition(stats)) { triggerDeath(death.text); return; }
    }
    // 4. 基础数值死亡
    if (stats.physical <= 0) { triggerDeath("过劳死。为了那点窝囊费，你把命搭进去了。尸体在出租屋发臭了才被发现。"); return; }
    if (stats.mental <= 0) { triggerDeath("精神彻底崩溃，你赤身裸体冲上大街，最后被送进宛平南路600号终老。"); return; }
    if (stats.satiety <= 0) { triggerDeath("饿死。在这个全面小康的时代，你是个特例。"); return; }
    
    // 5. 日常随机暴毙 (0.3%)
    if (!gameState.phase.includes('SLEEP') && Math.random() < 0.003) {
        triggerDeath(`【飞来横祸】${DAILY_ACCIDENTS[getRandomInt(0, DAILY_ACCIDENTS.length - 1)]}`); return;
    }

    // 6. 工伤 (根据职业风险)
    const riskFactor = gameState.profession?.healthRisk || 0;
    if (gameState.phase.includes('WORK') && Math.random() < (0.0008 * riskFactor)) {
      triggerDeath("工伤事故。机器故障/交通事故带走了你的生命。没有保险，只有一张火化证明。");
      return;
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.stats, gameState.phase]);

  const updateStats = (changes: Partial<typeof INITIAL_STATS>, reason?: string) => {
    setGameState(prev => {
      const newStats = { ...prev.stats };
      let physicalChange = changes.physical || 0;
      // 生病 Debuff
      if (prev.flags.disease) {
          if (physicalChange > 0) physicalChange = Math.floor(physicalChange * 0.5);
          if (physicalChange < 0) physicalChange = Math.floor(physicalChange * 1.5);
      }
      if (changes.physical) newStats.physical = Math.min(100, Math.max(0, newStats.physical + physicalChange));
      if (changes.mental) newStats.mental = Math.min(100, Math.max(0, newStats.mental + (changes.mental || 0)));
      if (changes.money) newStats.money = newStats.money + (changes.money || 0);
      if (changes.satiety) newStats.satiety = Math.min(100, Math.max(0, newStats.satiety + (changes.satiety || 0)));
      return { ...prev, stats: newStats };
    });
    if (reason) addLog(reason, changes.physical && changes.physical < 0 ? 'warning' : 'info');
  };

  const triggerDeath = (reason: string) => {
    setGameState(prev => ({ 
      ...prev, phase: 'MODAL_PAUSE',
      modal: {
        isOpen: true, type: 'DEATH', title: '人生重启', description: reason,
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
      flags: { isDepressed: false, disease: null, hasLoan: false, isSingle: true, streamerSimpCount: 0, partner: null, isPursuing: false, hasHouse: false, hasCar: false, parentPressure: 0 },
      modal: { isOpen: false, title: '', description: '', type: 'EVENT', actions: [] },
      showRelationshipPanel: false,
      gameOverReason: ''
    });
  };

  // --- 情感系统 ---

  const openRelPanel = () => setGameState(prev => ({ ...prev, showRelationshipPanel: true }));
  const closeRelPanel = () => setGameState(prev => ({ ...prev, showRelationshipPanel: false }));

  const relActions = {
    findPartner: () => {
      const target = POTENTIAL_PARTNERS[getRandomInt(0, POTENTIAL_PARTNERS.length - 1)];
      setGameState(prev => ({ ...prev, flags: { ...prev.flags, partner: { ...target, affection: 15 }, isPursuing: true } }));
      addLog(`在相亲角认识了【${target.name}】，开始了漫长的追求。`, 'warning');
    },
    dateMovie: () => {
       if (gameState.stats.money < 300) { addLog("钱不够买票，被嫌弃了。", "danger"); return; }
       updateStats({ money: -300, mental: 10 }, "看了一场电影，对方心情不错。");
       modifyAffection(5);
    },
    dateShopping: () => {
       const partner = gameState.flags.partner;
       if (!partner) return;
       const cost = 2000 * partner.materialism;
       if (gameState.stats.money < cost) {
          modifyAffection(-20);
          showModal({
              title: "社死现场", description: `你豪气地冲向收银台说要清空购物车，结果显示【余额不足】。${partner.name}翻了个白眼，直接转身走了。`, type: 'LOVE',
              actions: [{ label: "找个地缝钻进去 (好感-20)", onClick: closeModal, style: 'secondary' }]
          });
          return;
       }
       updateStats({ money: -cost, mental: 5 });
       modifyAffection(15);
       showModal({
           title: "买买买！", description: `帮${partner.name}清空了购物车(¥${cost})。虽然心在滴血，但她笑得很开心。`, type: 'EVENT',
           actions: [{ label: "值得！(好感+15)", onClick: closeModal }]
       });
    },
    confess: () => {
      const partner = gameState.flags.partner;
      if (!partner) return;
      if (Math.random() < partner.affection / 150) {
        setGameState(prev => ({ ...prev, flags: { ...prev.flags, isPursuing: false, isSingle: false } }));
        showModal({ title: "表白成功！", description: "恭喜你，从舔狗升级为正式提款机。", type: 'LOVE', actions: [{ label: "太好了！", onClick: closeModal }] });
      } else {
        updateStats({ mental: -30, physical: -10 });
        modifyAffection(-20);
        showModal({
            title: "表白惨案", description: `你单膝跪地表白，${partner.name}却后退了一步：“你是个好人，但我只把你当哥哥。”`, type: 'DEATH',
            actions: [{ label: "痛彻心扉 (精神-30, 健康-10)", onClick: closeModal, style: 'danger' }]
        });
      }
    },
    breakup: () => {
       setGameState(prev => ({ ...prev, flags: { ...prev.flags, partner: null, isPursuing: false, isSingle: true } }));
       updateStats({ mental: -10 }, "你提出了分手。");
       closeRelPanel();
    },
    buyHouse: () => {
       if (gameState.flags.hasHouse) return;
       const cost = ASSET_COSTS.HOUSE_DOWN_PAYMENT;
       // 这里即使变成负数，因为有动态判定保护，不会立刻死
       updateStats({ money: -cost }, "你签下了购房合同，背上了巨额房贷。父母终于闭嘴了。");
       setGameState(prev => ({ ...prev, flags: { ...prev.flags, hasHouse: true, parentPressure: 0, hasLoan: true } }));
    },
    buyCar: () => {
       if (gameState.flags.hasCar) return;
       const cost = ASSET_COSTS.CAR_COST;
       updateStats({ money: -cost }, "你提了一辆新车，虽然存款空了，但至少相亲有底气了。");
       setGameState(prev => ({ ...prev, flags: { ...prev.flags, hasCar: true, hasLoan: true } }));
    }
  };

  const modifyAffection = (amount: number) => {
     setGameState(prev => {
       if (!prev.flags.partner) return prev;
       const newAff = Math.min(100, Math.max(0, prev.flags.partner.affection + amount));
       return { ...prev, flags: { ...prev.flags, partner: { ...prev.flags.partner, affection: newAff } } };
     });
  };

  // --- 主播剧情 ---
  const triggerStreamerEvent = () => {
    showModal({
      title: "主播的私信",
      description: "‘榜一大哥，为了感谢你的支持，今晚出来见一面？’ 你看着手机屏幕，心跳加速。",
      type: 'LOVE',
      actions: [
        {
          label: "必须去！(80%概率翻车)",
          onClick: () => {
            if (Math.random() < 0.8) {
              showModal({
                title: "奔现翻车", description: "到了约定地点，发现对方是开了十级美颜的乔碧萝，而且是个酒托。你被坑了酒钱还受了情伤。", type: 'DEATH',
                actions: [{ label: "含泪回家 (精神-50, 钱-3000)", onClick: () => {
                  updateStats({ mental: -50, money: -3000 }, "精神受到暴击，钱包被掏空。");
                  closeModal();
                }, style: 'danger' }]
              });
            } else {
              updateStats({ mental: 50 }, "虽然是酒托，但至少长得和照片一样。");
              closeModal();
            }
          }
        },
        { label: "算了，那是电子老婆", onClick: () => { updateStats({ mental: -5 }); closeModal(); }, style: 'secondary' }
      ]
    });
  };

  // --- 工作逻辑 ---
  const handleWork = () => {
    if (!gameState.profession) return;
    const profId = gameState.profession.id;
    const { stressFactor, healthRisk } = gameState.profession;
    
    // 职业专属事件 (30%)
    const profEvent = (JOB_EVENTS as any)[profId];
    if (profEvent && Math.random() < 0.3) {
      const event = profEvent[getRandomInt(0, profEvent.length - 1)];
      showModal({
        title: event.title, description: event.desc, type: 'WORK',
        actions: event.options.map((opt: any) => ({
          label: opt.text,
          onClick: () => { updateStats(opt.changes, "你做出了选择。"); closeModal(); finishWorkBlock(); }
        }))
      });
      return;
    }
    // 普通搬砖
    const profLog = (JOB_LOGS as any)[profId] || ["枯燥的工作..."];
    const desc = profLog[getRandomInt(0, profLog.length - 1)];
    const actualRisk = healthRisk + (gameState.flags.disease ? 8 : 0); 
    updateStats({ physical: -actualRisk, mental: -stressFactor, satiety: -15 }, desc);
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
              if (gameState.stats.money < 1288) { addLog("1288的套餐点不起。", "danger"); return; }
              updateStats({ money: -1288, physical: 25, mental: 20 }, "技师说你这腰得加钟。一阵酥麻后，感觉活过来了。");
              break;
          case 'STREAMER': 
              if (gameState.stats.money < 1000) { addLog("没钱刷礼物。", "warning"); return; }
              const newCount = gameState.flags.streamerSimpCount + 1;
              setGameState(prev => ({ ...prev, flags: { ...prev.flags, streamerSimpCount: newCount } }));
              updateStats({ money: -1000, mental: 15 }, "刷了一个嘉年华！");
              if (newCount >= 3 && Math.random() < 0.4) { triggerStreamerEvent(); return; }
              break;
          case 'BBQ': updateStats({ money: -100, physical: -5, mental: 10, satiety: 30 }, "路边摊撸串真香。"); break;
          case 'SQUARE_DANCE': updateStats({ physical: 5, mental: 5, satiety: -5 }, "跳广场舞身心舒畅。"); break;
      }
      if (gameState.phase !== 'MODAL_PAUSE') setGameState(prev => ({ ...prev, phase: 'SLEEP', time: '23:30' }));
  };

  const handleSleep = () => {
    // 1. 疾病
    if (!gameState.flags.disease) {
       if ((gameState.stats.physical < 60 && Math.random() < 0.3) || Math.random() < 0.05) {
         const disease = DISEASES[getRandomInt(0, DISEASES.length - 1)];
         setGameState(prev => ({ ...prev, flags: { ...prev.flags, disease: disease.name } }));
         showModal({
           title: "突发恶疾", description: `确诊【${disease.name}】。${disease.desc} 治疗费 ¥${disease.cost}。`, type: 'DISEASE',
           actions: [
             { label: `治疗 (-¥${disease.cost})`, onClick: () => {
                if (gameState.stats.money >= disease.cost) {
                   updateStats({ money: -disease.cost });
                   setGameState(prev => ({ ...prev, flags: { ...prev.flags, disease: null } }));
                   closeModal();
                } else { addLog("钱不够，被医生赶了出来。", "danger"); closeModal(); }
             }},
             { label: "硬扛", onClick: () => closeModal(), style: 'secondary' }
           ]
         });
         return; 
       }
    } else {
       updateStats({ physical: -8, mental: -5 }, `受到【${gameState.flags.disease}】的折磨。`);
    }

    // 2. 情感：出轨
    const partner = gameState.flags.partner;
    if (partner && !gameState.flags.isPursuing) {
        const cheatChance = 0.05 + ((100 - partner.fidelity) / 500); 
        if (Math.random() < cheatChance) {
            setGameState(prev => ({ ...prev, flags: { ...prev.flags, partner: null, isSingle: true } }));
            showModal({
                title: "被绿了！", description: `${partner.name}摊牌了，她爱上了一个开法拉利的富二代，把你甩了。`, type: 'LOVE',
                actions: [{ label: "痛彻心扉 (精神-50)", onClick: () => { updateStats({ mental: -50 }); closeModal(); }, style: 'danger' }]
            });
            return;
        }
    }

    // 3. 催婚
    if (gameState.flags.isSingle || !gameState.flags.hasHouse) {
        setGameState(prev => ({ ...prev, flags: { ...prev.flags, parentPressure: Math.min(100, prev.flags.parentPressure + 5) } }));
        if (gameState.flags.parentPressure > 80 && Math.random() < 0.25) {
             addLog("父母深夜打电话痛骂你：‘看看隔壁二狗！’", "danger");
             updateStats({ mental: -20 });
        }
    }

    // 4. 房贷/车贷利息计算 (如果是负债状态)
    let interest = 0;
    if (gameState.stats.money < 0) {
        // 每日万分之五的利息 (模拟)
        interest = Math.floor(Math.abs(gameState.stats.money) * 0.0005);
    }

    const nextDay = new Date(gameState.date);
    nextDay.setDate(nextDay.getDate() + 1);
    
    // 结算：回血，扣饱食，扣利息
    updateStats({ physical: 10, mental: 5, satiety: -20, money: -interest });
    
    setGameState(prev => ({ ...prev, date: nextDay, phase: 'MORNING', time: '07:00' }));
    if (interest > 0) addLog(`支付了今日贷款利息: ¥${interest}`, 'warning');
    addLog(`=== ${formatDateCN(nextDay)} ===`, 'info');
  };

  const handleRestDayActivity = (type: string) => {
     if (type === 'SLEEP_IN') updateStats({ physical: 20, mental: 15, satiety: -10 }, "睡到自然醒。");
     if (type === 'DATE_BLIND') {
        if (Math.random() < 0.5) updateStats({ money: -500, mental: -20 }, "遇到了奇葩相亲对象，饭托。");
        else updateStats({ money: -200, mental: 5 }, "相亲对象还算正常。");
     }
     if (gameState.phase === 'REST_AM') setGameState(prev => ({ ...prev, phase: 'LUNCH', time: '12:00' }));
     else setGameState(prev => ({ ...prev, phase: 'DINNER', time: '18:00' }));
  };
  
  const handleEat = (type: string) => {
      if (type === 'TAKEOUT') updateStats({ money: -30, satiety: 40, physical: -2 }, "吃了份外卖。");
      else if (type === 'COOK') updateStats({ money: -15, satiety: 35, cookingSkill: 1 }, "自己做饭。");
      setGameState(prev => {
        let nextP = prev.phase; let nextT = prev.time;
        if (prev.phase === 'MORNING') { nextP = isWeekend(prev.date, prev.profession?.schedule||'965') ? 'REST_AM' : 'WORK_AM'; nextT = '09:00'; }
        else if (prev.phase === 'LUNCH') { nextP = isWeekend(prev.date, prev.profession?.schedule||'965') ? 'REST_PM' : 'WORK_PM'; nextT = '13:00'; }
        else if (prev.phase === 'DINNER') { nextP = 'FREE_TIME'; nextT = '20:00'; }
        return { ...prev, phase: nextP, time: nextT };
      });
  };

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

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 font-sans selection:bg-red-500/30 pb-10">
      <EventModal config={gameState.modal} />
      <RelationshipModal 
        isOpen={gameState.showRelationshipPanel} 
        onClose={closeRelPanel} 
        partner={gameState.flags.partner}
        flags={gameState.flags}
        money={gameState.stats.money}
        actions={relActions}
      />

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
                    {/* 情感按钮 */}
                    <button onClick={openRelPanel} className="w-full bg-pink-900/30 border border-pink-800 text-pink-200 py-2 rounded text-xs font-bold flex items-center justify-center animate-pulse">
                        <Heart className="w-3 h-3 mr-2" /> 
                        {gameState.flags.partner ? (gameState.flags.isPursuing ? '追求中...' : '交往中') : '单身 (点击管理)'}
                    </button>
                    {gameState.flags.disease && (
                        <div className="bg-red-900/30 p-2 rounded border border-red-800 text-xs text-red-300 flex items-center">
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
                            {/* 休息日直接开放情感管理 */}
                            <button onClick={openRelPanel} className="bg-pink-900/20 border-pink-800 hover:border-pink-500 text-pink-200 p-3 rounded-lg border transition-all flex flex-col items-center justify-center text-center h-24 group hover:bg-pink-900/40">
                                <Heart className="w-6 h-6 mb-1 opacity-80 group-hover:scale-110 transition-transform" />
                                <span className="font-bold text-sm">约会/找对象</span>
                                <span className="text-[10px] opacity-60 mt-1 font-mono">Love & Debt</span>
                            </button>
                        </>
                    )}

                    {gameState.phase === 'FREE_TIME' && (
                        <>
                            <ActionButton onClick={() => handleFreeTime('SPA')} icon={<Footprints/>} label="高端会所" sub="-¥1288 | 帝王服务" color="pink" />
                            <ActionButton onClick={() => handleFreeTime('STREAMER')} icon={<MonitorPlay/>} label="打赏主播" sub="-¥1000 | 感谢大哥" color="purple" />
                            <ActionButton onClick={() => handleFreeTime('BBQ')} icon={<Beer/>} label="路边撸串" sub="-¥100 | 快乐" color="orange" />
                            <ActionButton onClick={() => handleFreeTime('SQUARE_DANCE')} icon={<Dumbbell/>} label="广场舞" sub="强身健体" color="teal" />
                            {/* 晚上也可以管理情感 */}
                            <button onClick={openRelPanel} className="bg-pink-900/20 border-pink-800 hover:border-pink-500 text-pink-200 p-3 rounded-lg border transition-all flex flex-col items-center justify-center text-center h-24 group hover:bg-pink-900/40">
                                <Heart className="w-6 h-6 mb-1 opacity-80 group-hover:scale-110 transition-transform" />
                                <span className="font-bold text-sm">联系对象</span>
                            </button>
                        </>
                    )}

                    {gameState.phase === 'SLEEP' && (
                         <button onClick={handleSleep} className="col-span-full py-10 bg-black hover:bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-zinc-300 rounded-xl transition-all flex flex-col items-center justify-center group">
                            <Moon className="w-6 h-6 mb-2 group-hover:text-yellow-200 transition-colors" />
                            <span className="font-bold">结束这一天 (结算事件)</span>
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
