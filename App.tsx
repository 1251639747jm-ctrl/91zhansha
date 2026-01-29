--- START OF FILE App.tsx ---

import React, { useState, useEffect, useCallback } from 'react';
import { GameState, ProfessionType, LogEntry } from './types';
import { PROFESSIONS, INITIAL_STATS, COMPLEX_DEATHS, JOB_EVENTS, JOB_LOGS, DISEASES, POTENTIAL_PARTNERS, ASSET_COSTS } from './constants';
import { getRandomInt, formatDateCN, isWeekend } from './utils';
import StatBar from './components/StatBar';
import GameLog from './components/GameLog';
import EventModal, { ModalConfig } from './components/EventModal';
import RelationshipModal from './components/RelationshipModal';
import { 
  Play, RotateCcw, Utensils, Briefcase, Moon, 
  ShoppingBag, Beer, Dumbbell, Footprints, 
  MonitorPlay, Heart, Skull, AlertOctagon
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
  // --- 新增：开局临时年龄状态 ---
  const [tempAge, setTempAge] = useState(22);

  const [gameState, setGameState] = useState<GameState>({
    profession: null,
    stats: INITIAL_STATS,
    phase: 'START',
    date: new Date('2024-01-01T07:00:00'),
    time: '07:00',
    log: [],
    flags: { 
      isDepressed: false, disease: null, hasLoan: false, isSingle: true, streamerSimpCount: 0,
      partner: null, isPursuing: false, hasHouse: false, hasCar: false, parentPressure: 0,
      // --- 新增：住院相关标记 ---
      hospitalDays: 0, 
      hospitalDailyCost: 0
    },
    modal: { isOpen: false, title: '', description: '', type: 'EVENT', actions: [] },
    showRelationshipPanel: false, 
    gameOverReason: ''
  });

  // 初始化随机年龄
  useEffect(() => {
    setTempAge(getRandomInt(18, 55));
  }, []);

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
      // 如果还在住院，保持 SLEEP/住院状态，否则恢复正常时间流
      phase: prev.flags.hospitalDays > 0 ? 'SLEEP' : (prev.time.includes('23') ? 'SLEEP' : (prev.time.includes('12') ? 'LUNCH' : 'DINNER')),
      modal: { ...prev.modal, isOpen: false }
    }));
  };

  // --- 核心生存检查 ---
  useEffect(() => {
    if (gameState.phase === 'START' || gameState.phase === 'GAME_OVER' || gameState.phase === 'MODAL_PAUSE') return;
    const { stats, flags } = gameState;

    // 1. 动态资产负债死亡判定
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
    
    // 5. 日常随机暴毙 (住院期间豁免)
    if (!gameState.phase.includes('SLEEP') && flags.hospitalDays === 0 && Math.random() < 0.003) {
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
      // 同步更新年龄 (如果有)
      if (changes.age) newStats.age = changes.age;
      
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
      // 使用 tempAge 初始化 stats
      stats: { ...INITIAL_STATS, age: tempAge, money: prof.id === 'UNEMPLOYED' ? 2000 : 5000 },
      phase: 'MORNING',
      date: new Date('2024-01-01T07:30:00'),
      time: '07:30',
      log: [{ id: 1, text: `>>> 档案载入。年龄：${tempAge}岁。身份：${prof.name}。排班：${prof.schedule}。`, type: 'info' }],
      flags: { 
          isDepressed: false, disease: null, hasLoan: false, isSingle: true, streamerSimpCount: 0, 
          partner: null, isPursuing: false, hasHouse: false, hasCar: false, parentPressure: 0,
          hospitalDays: 0, hospitalDailyCost: 0 
      },
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

  // --- 新增：住院日逻辑 ---
  const handleHospitalDay = () => {
    const { hospitalDays, hospitalDailyCost } = gameState.flags;
    const { money } = gameState.stats;
    const nextDays = hospitalDays - 1;

    // 1. 扣费
    const newMoney = money - hospitalDailyCost;
    
    // 2. 拔管判定 (没钱了 && 还有较长住院期)
    // 阈值：负债超过10000元，且还没出院
    if (newMoney < -10000) { 
        triggerDeath("【放弃治疗】账户余额已耗尽，且欠下巨额医药费。家属在缴费单前沉默了许久，最终含泪签署了《放弃抢救同意书》。氧气管被拔掉了。");
        return;
    }

    addLog(`【住院中】今日治疗费 ¥${hospitalDailyCost}。账户余额: ¥${newMoney}。剩余疗程: ${nextDays}天。`, 'warning');

    if (nextDays <= 0) {
        // 出院
        const nextDate = new Date(gameState.date);
        nextDate.setDate(nextDate.getDate() + 1);
        
        setGameState(prev => ({
            ...prev,
            stats: { ...prev.stats, money: newMoney, physical: Math.min(100, prev.stats.physical + 40) }, // 出院回血
            flags: { ...prev.flags, hospitalDays: 0, hospitalDailyCost: 0, disease: null }, // 清除疾病
            phase: 'MORNING',
            time: '08:00',
            date: nextDate
        }));
        showModal({
            title: "康复出院", 
            description: "虽然钱包空了，但好歹捡回一条命。医生叮嘱你以后别太拼了。", 
            type: 'EVENT', 
            actions: [{ label: "活着真好", onClick: closeModal }]
        });
    } else {
        // 继续住院
        const nextDate = new Date(gameState.date);
        nextDate.setDate(nextDate.getDate() + 1);

        setGameState(prev => ({
            ...prev,
            stats: { ...prev.stats, money: newMoney },
            flags: { ...prev.flags, hospitalDays: nextDays },
            date: nextDate
        }));
    }
  };

  const handleSleep = () => {
    // 优先检查是否在住院 (防止逻辑穿透)
    if (gameState.flags.hospitalDays > 0) {
        handleHospitalDay();
        return;
    }

    // 1. 疾病判定 (修改版)
    if (!gameState.flags.disease) {
       if ((gameState.stats.physical < 60 && Math.random() < 0.3) || Math.random() < 0.05) {
         const disease = DISEASES[getRandomInt(0, DISEASES.length - 1)];
         
         showModal({
           title: "突发恶疾", 
           // @ts-ignore (assume disease object has daily/days props)
           description: `确诊【${disease.name}】。${disease.desc}\n` + 
                        (disease.days > 0 ? `需住院 ${disease.days} 天，押金 ¥${disease.admission}，日费用 ¥${disease.daily}。` : `需治疗费 ¥${disease.admission}。`), 
           type: 'DISEASE',
           actions: [
             { 
                label: disease.days > 0 ? "办理住院 (停工扣费)" : `治疗 (-¥${disease.admission})`, 
                onClick: () => {
                    // @ts-ignore
                    if (gameState.stats.money >= disease.admission || gameState.flags.hasHouse) {
                        // @ts-ignore
                        updateStats({ money: -disease.admission });
                        // @ts-ignore
                        if (disease.days > 0) {
                            setGameState(prev => ({ 
                                ...prev, 
                                flags: { 
                                    ...prev.flags, 
                                    disease: disease.name,
                                    // @ts-ignore
                                    hospitalDays: disease.days,
                                    // @ts-ignore
                                    hospitalDailyCost: disease.daily
                                },
                                phase: 'SLEEP' // 保持状态让 UI 切换到住院按钮
                            }));
                            // @ts-ignore
                            addLog(`办理了【${disease.name}】住院手续，预缴押金 ¥${disease.admission}。`, 'warning');
                            closeModal();
                        } else {
                             setGameState(prev => ({ ...prev, flags: { ...prev.flags, disease: null } }));
                             closeModal();
                        }
                    } else { 
                        addLog("没钱交押金，被保安甚至还有家属抬出了医院。", "danger"); 
                        triggerDeath("因无钱医治，病情恶化死在出租屋里。");
                    }
                },
                style: 'primary'
             },
             { 
                 label: "放弃治疗 (赌命)", 
                 onClick: () => { 
                     closeModal(); 
                     if (disease.harm > 30) triggerDeath(`【${disease.name}】恶化，你在痛苦中离世。`);
                     else {
                         setGameState(prev => ({ ...prev, flags: { ...prev.flags, disease: disease.name } }));
                         addLog("你选择了硬抗，身体状况每况愈下。", "danger");
                     }
                 }, 
                 style: 'secondary' 
             }
           ]
         });
         return; 
       }
    } else if (!gameState.flags.hospitalDays) {
       // 带病且不住院
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

    // 4. 房贷/车贷利息计算
    let interest = 0;
    if (gameState.stats.money < 0) {
        interest = Math.floor(Math.abs(gameState.stats.money) * 0.0005);
    }

    const nextDay = new Date(gameState.date);
    nextDay.setDate(nextDay.getDate() + 1);
    
    // --- 新增：生日逻辑 ---
    if (gameState.stats.daysSurvived > 0 && gameState.stats.daysSurvived % 365 === 0) {
        updateStats({ age: gameState.stats.age + 1 }, `🎂 今天是你的生日，你 ${gameState.stats.age + 1} 岁了。`);
    }
    
    // 结算
    updateStats({ physical: 10, mental: 5, satiety: -20, money: -interest });
    
    setGameState(prev => ({ 
        ...prev, 
        date: nextDay, 
        phase: 'MORNING', 
        time: '07:00',
        stats: {...prev.stats, daysSurvived: prev.stats.daysSurvived + 1}
    }));

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
      if (type === 'TAKEOUT') {
          updateStats({ money: -30, satiety: 40, physical: -2 }, "吃了份外卖。");
      } 
      else if (type === 'COOK') {
          // --- 新增：煤油车混装油事件 (5%概率) ---
          if (Math.random() < 0.05) {
             updateStats({ money: -50, satiety: 20, physical: -15, mental: -20 }, "【食品安全】糟糕！买的散装食用油有股奇怪的煤油味。你吃完后上吐下泻，严重损害了健康。");
             addLog("新闻报道：某罐车未清洗直接装运食用油...你看着空油瓶陷入沉思。", "danger");
          } else {
             updateStats({ money: -20, satiety: 35, cookingSkill: 1 }, "买菜做饭 (买菜 ¥20)。");
          }
      }

      setGameState(prev => {
        let nextP = prev.phase; let nextT = prev.time;
        if (prev.phase === 'MORNING') { nextP = isWeekend(prev.date, prev.profession?.schedule||'965') ? 'REST_AM' : 'WORK_AM'; nextT = '09:00'; }
        else if (prev.phase === 'LUNCH') { nextP = isWeekend(prev.date, prev.profession?.schedule||'965') ? 'REST_PM' : 'WORK_PM'; nextT = '13:00'; }
        else if (prev.phase === 'DINNER') { nextP = 'FREE_TIME'; nextT = '20:00'; }
        return { ...prev, phase: nextP, time: nextT };
      });
  };

  // --- UI: START SCREEN ---
  if (gameState.phase === 'START') {
     return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950 font-sans">
        <div className="max-w-4xl w-full bg-zinc-900/80 p-8 rounded-xl shadow-2xl border border-zinc-800 backdrop-blur">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-yellow-500 mb-2 text-center tracking-tighter">中国式社畜模拟器</h1>
          <p className="text-zinc-500 text-center mb-8 font-mono text-sm">/// 选择你的开局 ///</p>
          
          {/* --- 新增：随机年龄控制区 --- */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center space-x-4 bg-black/40 px-6 py-3 rounded-full border border-zinc-700">
                 <span className="text-zinc-400 text-sm uppercase">Initial Age</span>
                 <span className="text-3xl font-bold text-white font-mono">{tempAge}</span>
                 <button onClick={() => setTempAge(getRandomInt(18, 55))} className="p-2 hover:bg-zinc-700 rounded-full transition-colors text-zinc-400 hover:text-white" title="重新随机年龄">
                    <RotateCcw className="w-5 h-5"/>
                 </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.values(PROFESSIONS).map((p: any) => {
              // --- 新增：职业年龄限制判定 ---
              const isEligible = tempAge >= (p.minAge || 0) && tempAge <= (p.maxAge || 100);

              return (
              <button key={p.id} onClick={() => isEligible && startGame(p.id as ProfessionType)} disabled={!isEligible}
                className={`p-4 border rounded-lg text-left transition-all group relative overflow-hidden flex flex-col justify-between h-40
                    ${isEligible ? 'bg-zinc-800/50 hover:bg-red-900/10 border-zinc-700 hover:border-red-500/50 cursor-pointer' : 'bg-zinc-900/30 border-zinc-800 opacity-40 cursor-not-allowed grayscale'}`}>
                
                <div className="relative z-10">
                  <div className="font-bold text-zinc-100 group-hover:text-red-400 flex justify-between items-center mb-2">
                      {p.name} 
                      {isEligible 
                        ? <span className="text-xs bg-zinc-900 px-2 py-0.5 rounded text-zinc-400 border border-zinc-700">{p.schedule}</span>
                        : <span className="text-xs bg-red-950 px-2 py-0.5 rounded text-red-500 border border-red-900">年龄不符</span>
                      }
                  </div>
                  <div className="text-xs text-zinc-400 leading-relaxed mb-2">{p.description}</div>
                </div>
                
                <div className="mt-auto pt-3 border-t border-zinc-700/50 text-[10px] text-zinc-500 font-mono flex justify-between items-center relative z-10">
                    <span>底薪: ¥{p.salaryBase}</span>
                    <span className={!isEligible ? "text-red-500 font-bold" : ""}>限制: {p.minAge || 0}-{p.maxAge || 100}岁</span>
                </div>
              </button>
            )})}
          </div>
        </div>
      </div>
     );
  }

  // --- UI: GAME OVER SCREEN ---
  if (gameState.phase === 'GAME_OVER') {
     const diffTime = Math.abs(gameState.date.getTime() - new Date('2024-01-01T07:00:00').getTime());
     const survivedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
     return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-black font-mono">
        <div className="max-w-md w-full text-center relative">
          <h1 className="text-6xl font-black text-red-600 mb-6 tracking-widest">已销户</h1>
          <div className="bg-red-950/20 p-6 rounded border border-red-900/50 mb-8 backdrop-blur">
            <p className="text-zinc-400 mb-2 text-sm uppercase">享年</p>
            <p className="text-4xl text-white font-bold mb-6">{gameState.stats.age} 岁</p>
            <p className="text-zinc-400 mb-2 text-sm uppercase">生存时长</p>
            <p className="text-2xl text-white font-bold mb-6">{survivedDays} 天</p>
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

  // --- UI: MAIN GAME SCREEN ---
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
                                if (gameState.flags.hospitalDays > 0) return '🏥 住院治疗'; // 新增状态显示
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
                                    default: return '摸鱼中';
                                }
                            })()}
                        </span>
                    </div>
                    {/* --- 新增：年龄显示 --- */}
                    <div className="flex justify-between items-center text-sm border-b border-zinc-800 pb-2">
                        <span className="text-zinc-400">当前年龄</span>
                        <span className="text-white font-bold">{gameState.stats.age} 岁</span>
                    </div>

                    {/* 情感按钮 */}
                    <button onClick={openRelPanel} disabled={gameState.flags.hospitalDays > 0} className={`w-full bg-pink-900/30 border border-pink-800 text-pink-200 py-2 rounded text-xs font-bold flex items-center justify-center ${gameState.flags.hospitalDays > 0 ? 'opacity-50 cursor-not-allowed' : 'animate-pulse'}`}>
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
                    
                    {/* --- 新增：住院状态拦截所有操作 --- */}
                    {gameState.flags.hospitalDays > 0 ? (
                       <button onClick={handleHospitalDay} className="col-span-full py-20 bg-red-950/20 border border-red-900/50 text-red-200 rounded-xl flex flex-col items-center justify-center animate-pulse hover:bg-red-900/30 transition-colors">
                           <div className="bg-red-900/50 p-4 rounded-full mb-4">
                                <Skull className="w-8 h-8" />
                           </div>
                           <span className="text-2xl font-bold tracking-widest">住院治疗中...</span>
                           <span className="mt-2 text-sm font-mono bg-black/50 px-3 py-1 rounded border border-red-900/30">
                              剩余疗程: {gameState.flags.hospitalDays} 天
                           </span>
                           <span className="mt-2 text-xs opacity-70 flex items-center">
                              <AlertOctagon className="w-3 h-3 mr-1"/>
                              点击度过这一天 (日费: ¥{gameState.flags.hospitalDailyCost})
                           </span>
                       </button>
                    ) : (
                        // 正常操作按钮
                        <>
                            {(gameState.phase === 'MORNING' || gameState.phase === 'LUNCH' || gameState.phase === 'DINNER') && (
                                <>
                                   <ActionButton onClick={() => handleEat('TAKEOUT')} icon={<ShoppingBag/>} label="拼好饭" sub="-¥30" color="orange" />
                                   <ActionButton onClick={() => handleEat('COOK')} icon={<Utensils/>} label="自己做饭" sub="健康卫生?" color="teal" />
                                </>
                            )}

                            {gameState.phase.includes('WORK') && (
                                <button onClick={handleWork} className="col-span-full py-12 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white rounded-xl transition-all group flex flex-col items-center justify-center gap-2 hover:shadow-lg hover:shadow-zinc-900/50">
                                    <Briefcase className="w-8 h-8 group-hover:animate-bounce text-zinc-400 group-hover:text-white" />
                                    <span className="text-xl font-bold tracking-widest">
                                        {gameState.profession?.id === 'PROGRAMMER' ? '写代码 (修BUG)' : 
                                         gameState.profession?.id === 'DELIVERY' ? '接单跑腿' : 
                                         gameState.profession?.id === 'STREAMER' ? '直播 (谢大哥)' :
                                         gameState.profession?.id === 'TAXI_DRIVER' ? '出车接客' : '打工 (搬砖)'}
                                    </span>
                                    <span className="text-xs text-zinc-500 font-mono">CLICK TO WORK</span>
                                </button>
                            )}

                            {gameState.phase.includes('REST') && (
                                <>
                                    <ActionButton onClick={() => handleRestDayActivity('SLEEP_IN')} icon={<Moon/>} label="睡懒觉" sub="回血神器" color="indigo" />
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
                        </>
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
