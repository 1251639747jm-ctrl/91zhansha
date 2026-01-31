import React, { useState, useEffect, useCallback } from 'react';
import { GameState, ProfessionType, LogEntry, FamilyBackground, Child } from './types';
import { 
  PROFESSIONS, INITIAL_STATS, COMPLEX_DEATHS, 
  JOB_EVENTS, JOB_LOGS, DISEASES, POTENTIAL_PARTNERS, 
  ASSET_COSTS, INGREDIENTS_SHOP, RECIPES, FAMILY_BACKGROUNDS, 
  HOSPITAL_SERVICES, EDUCATION_COSTS
} from './constants';
import { getRandomInt, formatDateCN, isWeekend } from './utils';
import StatBar from './components/StatBar';
import GameLog from './components/GameLog';
import EventModal, { ModalConfig } from './components/EventModal';
import RelationshipModal from './components/RelationshipModal';
import { 
  Play, RotateCcw, Utensils, Briefcase, Moon, 
  ShoppingBag, Beer, Dumbbell, Footprints, 
  MonitorPlay, Heart, Skull, AlertOctagon,
  XCircle, Users, Activity, Baby, Home
} from 'lucide-react';

// === 常量定义：保留所有文本描述 ===
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
  // --- 状态定义 ---
  const [tempAge, setTempAge] = useState(22);
  const [tempBg, setTempBg] = useState<FamilyBackground>(FAMILY_BACKGROUNDS[1]); 

  const [gameState, setGameState] = useState<GameState>({
    profession: null,
    background: null,
    stats: INITIAL_STATS,
    phase: 'START',
    date: new Date('2024-01-01T07:00:00'),
    time: '07:00',
    log: [],
    flags: { 
      // 基础标记
      isDepressed: false, disease: null, hasLoan: false, isSingle: true, 
      partner: null, isPursuing: false, hasHouse: false, hasCar: false, parentPressure: 0,
      hasInsurance: false,
      
      // 主播剧情标记 (App 17)
      streamerSimpCount: 0,

      // 住院与健康标记 (App 18)
      hospitalDays: 0, 
      hospitalDailyCost: 0,
      blackVanRisk: 0, 
      lastCheckupDate: null, 
      knownHealth: null,

      // 物品库存 (合并版)
      inventory: { 
          oil: 0, badOil: false, rice: 0, veggies: 0, meat: 0, seasoning: 0, 
          milkPowder: 0, diapers: 0 
      },
      
      // 子女列表 (App 18)
      children: []
    },
    modal: { isOpen: false, title: '', description: '', type: 'EVENT', actions: [] },
    showRelationshipPanel: false, 
    gameOverReason: ''
  });

  // --- 初始化逻辑 ---
  useEffect(() => {
    setTempAge(getRandomInt(18, 55));
    setTempBg(FAMILY_BACKGROUNDS[getRandomInt(0, FAMILY_BACKGROUNDS.length - 1)]);
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
      // 智能判断恢复的阶段
      phase: prev.flags.hospitalDays > 0 ? 'SLEEP' : (prev.time.includes('23') ? 'SLEEP' : (prev.time.includes('12') ? 'LUNCH' : 'DINNER')),
      modal: { ...prev.modal, isOpen: false }
    }));
  };

  // --- 核心数值更新逻辑 ---
  const updateStats = (changes: Partial<typeof INITIAL_STATS>, reason?: string) => {
    setGameState(prev => {
      const newStats = { ...prev.stats };
      let physicalChange = changes.physical || 0;
      
      // 生病 Debuff 逻辑
      if (prev.flags.disease) {
          if (physicalChange > 0) physicalChange = Math.floor(physicalChange * 0.5);
          if (physicalChange < 0) physicalChange = Math.floor(physicalChange * 1.5);
      }

      // 限制数值范围 (App 18 将上限提升至 200)
      if (changes.physical) newStats.physical = Math.min(200, Math.max(0, newStats.physical + physicalChange));
      if (changes.mental) newStats.mental = Math.min(100, Math.max(0, newStats.mental + (changes.mental || 0)));
      if (changes.money) newStats.money = newStats.money + (changes.money || 0);
      if (changes.satiety) newStats.satiety = Math.min(100, Math.max(0, newStats.satiety + (changes.satiety || 0)));
      if (changes.age) newStats.age = changes.age;
      
      // 负债与技能
      if (changes.debt) newStats.debt = Math.max(0, newStats.debt + (changes.debt || 0));
      if (changes.cookingSkill) newStats.cookingSkill = newStats.cookingSkill + (changes.cookingSkill || 0);

      return { ...prev, stats: newStats };
    });
    // 自动记录负面状态日志
    if (reason) {
        const isBad = (changes.physical && changes.physical < 0) || (changes.money && changes.money < -100);
        addLog(reason, isBad ? 'warning' : 'info');
    }
  };

  // --- 死亡触发器 ---
  const triggerDeath = (reason: string) => {
    setGameState(prev => ({ 
      ...prev, phase: 'MODAL_PAUSE',
      modal: {
        isOpen: true, type: 'DEATH', title: '人生重启', description: reason,
        actions: [{ label: '投胎重开', onClick: () => setGameState({ ...gameState, phase: 'GAME_OVER', gameOverReason: reason, modal: { ...gameState.modal, isOpen: false } }), style: 'danger' }]
      }
    }));
  };

  // --- 游戏开始逻辑 (整合背景与职业) ---
  const startGame = (profType: ProfessionType) => {
    const prof = PROFESSIONS[profType];
    const bg = tempBg;
    
    // 计算初始资金与负债
    const startMoney = (prof.id === 'UNEMPLOYED' ? 2000 : 5000) + bg.moneyModifier;
    const startDebt = bg.debtModifier;
    // 初始属性修正
    const startStats = { 
        ...INITIAL_STATS, 
        ...bg.statModifier, 
        physical: Math.min(200, Math.max(20, (INITIAL_STATS.physical + (bg.statModifier.physical || 0)))),
        money: startMoney, 
        debt: startDebt, 
        age: tempAge 
    };

    setGameState({
      profession: prof,
      background: bg,
      stats: startStats,
      phase: 'MORNING',
      date: new Date('2024-01-01T07:30:00'),
      time: '07:30',
      log: [{ id: 1, text: `>>> 档案载入完毕。年龄：${tempAge}岁。身份：${prof.name}。家庭背景：${bg.name}。`, type: 'info' }],
      flags: { 
          isDepressed: false, disease: null, hasLoan: startDebt > 0, isSingle: true, 
          streamerSimpCount: 0, // 恢复主播计数
          partner: null, isPursuing: false, hasHouse: false, hasCar: false, parentPressure: 0,
          hasInsurance: prof.hasInsurance,
          hospitalDays: 0, hospitalDailyCost: 0,
          blackVanRisk: 0, lastCheckupDate: null, knownHealth: null,
          inventory: { oil: 0, badOil: false, rice: 0, veggies: 0, meat: 0, seasoning: 0, milkPowder: 0, diapers: 0 },
          children: []
      },
      modal: { isOpen: false, title: '', description: '', type: 'EVENT', actions: [] },
      showRelationshipPanel: false,
      gameOverReason: ''
    });
  };

  // --- App 17: 主播剧情系统 (完整保留) ---
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

  // --- App 18: 厨房逻辑 (修复版) ---
  const buyIngredient = (ing: typeof INGREDIENTS_SHOP[0]) => {
      setGameState(prev => {
          if (prev.stats.money < ing.cost) {
              return { 
                  ...prev, 
                  modal: { ...prev.modal, title: "余额不足", description: `你买不起 ¥${ing.cost} 的 ${ing.name}。\n` + prev.modal.description.split('\n').pop() } 
              };
          }

          // 煤油车判定逻辑
          let isNewBadOil = false;
          if (ing.id === 'oil' && Math.random() < 0.2) { // 20% 概率买到坏油
              isNewBadOil = true;
          }

          const nextInventory = {
              ...prev.flags.inventory,
              // @ts-ignore
              [ing.id]: (prev.flags.inventory[ing.id] || 0) + 1,
              badOil: prev.flags.inventory.badOil || isNewBadOil
          };

          const nextMoney = prev.stats.money - ing.cost;
          const newModalConfig = getKitchenModalConfig(nextInventory, nextMoney);

          const logText = isNewBadOil 
              ? `购买了【${ing.name}】，虽然是大品牌，但你总觉得颜色有点怪...` 
              : `购买了【${ing.name}】，花费 ¥${ing.cost}`;
          
          return {
              ...prev,
              stats: { ...prev.stats, money: nextMoney },
              flags: { ...prev.flags, inventory: nextInventory },
              modal: { ...newModalConfig, isOpen: true },
              log: [...prev.log, { id: Date.now(), text: logText, type: isNewBadOil ? 'warning' : 'info' }]
          };
      });
  };

  const doCook = (recipe: typeof RECIPES[0]) => {
    setGameState(prev => {
        const { inventory } = prev.flags;
        const { needs } = recipe;
        
        const missingItems: string[] = [];
        // @ts-ignore
        Object.keys(needs).forEach(k => {
            // @ts-ignore
            if ((inventory[k] || 0) < needs[k]) missingItems.push(k);
        });

        if (missingItems.length > 0) {
            return {
                ...prev,
                modal: { ...prev.modal, title: "食材不足", description: `缺：${missingItems.join(', ')}\n当前库存: 油${inventory.oil} 米${inventory.rice} 蔬${inventory.veggies} 肉${inventory.meat}` }
            };
        }

        const newInv = { ...inventory };
        // @ts-ignore
        Object.keys(needs).forEach(k => newInv[k] -= needs[k]);
        
        // 如果油用光了，重置坏油标记
        if (newInv.oil <= 0) {
            newInv.badOil = false;
        }

        let healthHit = 0;
        let logText = `烹饪了【${recipe.name}】，色香味俱全！`;
        let logType: LogEntry['type'] = 'success';

        if (needs.oil && inventory.badOil) {
             healthHit = 40; 
             logText = `【食品安全】做好的${recipe.name}有一股浓烈的煤油味！你含泪吃下，感觉胃在燃烧。`;
             logType = 'danger';
        }

        // 时间推进逻辑
        let nextP = prev.phase; let nextT = prev.time;
        const currentHour = parseInt(prev.time.split(':')[0]);
        if (currentHour < 10) { nextP = isWeekend(prev.date, prev.profession?.schedule||'965') ? 'REST_AM' : 'WORK_AM'; nextT = '09:00'; }
        else if (currentHour < 14) { nextP = isWeekend(prev.date, prev.profession?.schedule||'965') ? 'REST_PM' : 'WORK_PM'; nextT = '13:00'; }
        else { nextP = 'FREE_TIME'; nextT = '20:00'; }

        return {
            ...prev,
            stats: { 
                ...prev.stats, 
                satiety: Math.min(100, prev.stats.satiety + recipe.stats.satiety),
                mental: Math.min(100, prev.stats.mental + recipe.stats.mental),
                physical: Math.min(200, prev.stats.physical + (recipe.stats.health || 0) - healthHit),
                cookingSkill: (prev.stats.cookingSkill || 0) + 1
            },
            flags: { ...prev.flags, inventory: newInv },
            phase: nextP, time: nextT,
            modal: { ...prev.modal, isOpen: false },
            log: [...prev.log, { id: Date.now(), text: logText, type: logType }]
        };
    });
  };

  const getKitchenModalConfig = (inv: any, money: number): Omit<ModalConfig, 'isOpen'> => {
      return {
          title: "自家厨房 & 菜市场",
          description: `资金: ¥${money}\n库存：油x${inv.oil} ${inv.badOil?'(疑)':''} | 米面x${inv.rice} | 蔬x${inv.veggies} | 肉x${inv.meat} | 料x${inv.seasoning}`,
          type: 'EVENT',
          actions: [
              ...INGREDIENTS_SHOP.map(ing => ({ label: `买${ing.name} (¥${ing.cost})`, onClick: () => buyIngredient(ing), style: 'secondary' as const })),
              ...RECIPES.map(recipe => ({ label: `做【${recipe.name}】`, onClick: () => doCook(recipe), style: 'primary' as const })),
              { label: "离开", onClick: closeModal, style: 'secondary' as const }
          ]
      };
  };

  // --- App 18: 子女逻辑 ---
  const handleChildLogic = () => {
     setGameState(prev => {
        if (prev.flags.children.length === 0) return prev;
        
        let milkUsed = 0;
        const newChildren = prev.flags.children.map(child => {
            let newHunger = child.hunger - 10;
            let newHealth = child.health;

            // 自动喂食
            if (newHunger < 30 && prev.flags.inventory.milkPowder > milkUsed) {
                 milkUsed++;
                 newHunger = 100;
            } else if (newHunger <= 0) {
                 newHealth -= 10;
            }
            if (newHealth <= 0) return null; // 夭折
            return { ...child, hunger: newHunger, health: newHealth };
        }).filter(Boolean) as Child[];
        
        if (newChildren.length < prev.flags.children.length) {
            addLog("【悲报】你的孩子因为照顾不周不幸离世了...", "danger");
            return { ...prev, flags: { ...prev.flags, children: newChildren }, stats: { ...prev.stats, mental: prev.stats.mental - 50 } };
        }

        if (milkUsed > 0) {
             addLog(`消耗了 ${milkUsed} 罐奶粉喂孩子。`, "info");
        } else if (prev.flags.children.some(c => c.hunger < 20)) {
             addLog("家里没有奶粉了！孩子饿得哇哇大哭！", "danger");
        }

        return { 
            ...prev, 
            flags: { 
                ...prev.flags, 
                children: newChildren,
                inventory: { ...prev.flags.inventory, milkPowder: prev.flags.inventory.milkPowder - milkUsed }
            } 
        };
     });
  };

  // --- 整合版：情感与家庭动作 ---
  const relActions = {
    findPartner: () => {
      const target = POTENTIAL_PARTNERS[getRandomInt(0, POTENTIAL_PARTNERS.length - 1)];
      setGameState(prev => ({ ...prev, flags: { ...prev.flags, partner: { ...target, affection: 15, realAffection: 5 }, isPursuing: true } }));
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
              actions: [{ label: "找个地缝钻进去", onClick: closeModal, style: 'secondary' }]
          });
          return;
       }
       updateStats({ money: -cost, mental: 5 });
       modifyAffection(15);
       showModal({
           title: "买买买！", description: `帮${partner.name}清空了购物车(¥${cost})。虽然心在滴血，但她笑得很开心。`, type: 'EVENT',
           actions: [{ label: "值得！", onClick: closeModal }]
       });
    },
    confess: () => {
      const partner = gameState.flags.partner;
      if (!partner) return;
      // @ts-ignore
      const successChance = (partner.realAffection || 0) / 100; 
      if (Math.random() < successChance) {
        setGameState(prev => ({ ...prev, flags: { ...prev.flags, isPursuing: false, isSingle: false } }));
        showModal({ title: "表白成功！", description: "恭喜你，脱单了！", type: 'LOVE', actions: [{ label: "太好了！", onClick: closeModal }] });
      } else {
        updateStats({ mental: -30, physical: -10 });
        modifyAffection(-20, -50); 
        let failReason = "你是个好人。";
        // @ts-ignore
        if (partner.realAffection < 0) failReason = "她心里其实挺讨厌你的，只把你当提款机。";
        else if (partner.affection > 80) failReason = "虽然表面上和你很亲密，但她内心还没完全接纳你。";

        showModal({
            title: "表白惨案", description: `你单膝跪地表白，${partner.name}却后退了一步：“${failReason}”`, type: 'DEATH',
            actions: [{ label: "痛彻心扉", onClick: closeModal, style: 'danger' }]
        });
      }
    },
    breakup: () => {
       setGameState(prev => ({ ...prev, flags: { ...prev.flags, partner: null, isPursuing: false, isSingle: true } }));
       updateStats({ mental: -10 }, "你提出了分手。");
       setGameState(prev => ({ ...prev, showRelationshipPanel: false }));
    },
    buyHouse: () => {
       if (gameState.flags.hasHouse) return;
       const down = ASSET_COSTS.HOUSE_DOWN_PAYMENT;
       if (gameState.stats.money < down) { addLog("首付不够，售楼小姐给了你一个白眼。", "danger"); return; }
       updateStats({ money: -down, debt: (ASSET_COSTS.HOUSE_TOTAL_PRICE - down) }, "支付首付，背上了巨额房贷，成为了光荣的房奴。");
       setGameState(prev => ({ ...prev, flags: { ...prev.flags, hasHouse: true, parentPressure: 0, hasLoan: true } }));
    },
    buyCar: () => {
       if (gameState.flags.hasCar) return;
       const cost = ASSET_COSTS.CAR_COST;
       if (gameState.stats.money < cost) { addLog("钱不够，买个车模吧。", "danger"); return; }
       updateStats({ money: -cost }, "全款提了一辆新车，虽然存款空了，但至少相亲有底气了。");
       setGameState(prev => ({ ...prev, flags: { ...prev.flags, hasCar: true } }));
    },
    repayDebt: (amount: number) => {
        if (gameState.stats.money < amount) return;
        updateStats({ money: -amount, debt: -amount });
        addLog(`提前还贷 ¥${amount}，感觉肩膀轻了一点点。`, "success");
    },
    // App 18: 领养/生育
    adoptChild: () => {
        if (gameState.stats.money < 5000) { addLog("领养/生育手续费/营养费至少需要5000元。", "warning"); return; }
        updateStats({ money: -5000 });
        const newChild: Child = {
            id: Date.now().toString(),
            name: Math.random() > 0.5 ? "宝宝(男)" : "宝宝(女)",
            gender: Math.random() > 0.5 ? 'boy' : 'girl',
            age: 0, educationStage: 'NONE', health: 100, hunger: 100, schoolFeePaid: false
        };
        setGameState(prev => ({ ...prev, flags: { ...prev.flags, children: [...prev.flags.children, newChild] } }));
        addLog("家里迎来了一个新生命！记得买奶粉！", "success");
    },
    buyBabyItem: (item: any) => {
        if (gameState.stats.money < item.cost) { addLog("余额不足。", "danger"); return; }
        updateStats({ money: -item.cost });
        setGameState(prev => ({
            ...prev,
            flags: {
                ...prev.flags,
                inventory: {
                    ...prev.flags.inventory,
                    [item.id]: (prev.flags.inventory as any)[item.id] + 5 
                }
            }
        }));
        addLog(`购买了${item.name}。`, "success");
    },
    payTuition: (childId: string, cost: number) => {
        if (gameState.stats.money < cost) { addLog("学费不够，孩子要被退学了！", "danger"); return; }
        updateStats({ money: -cost });
        setGameState(prev => ({
            ...prev,
            flags: {
                ...prev.flags,
                children: prev.flags.children.map(c => c.id === childId ? { ...c, schoolFeePaid: true } : c)
            }
        }));
        addLog("缴纳了学费。", "success");
    }
  };

  const modifyAffection = (displayedAmount: number, realAmount?: number) => {
     setGameState(prev => {
       if (!prev.flags.partner) return prev;
       const currentPartner = prev.flags.partner;
       let calculatedReal = realAmount !== undefined ? realAmount : displayedAmount * 0.2;
       if (currentPartner.materialism > 2 && displayedAmount > 0) calculatedReal = displayedAmount * 0.1; 
       const newDisplay = Math.min(100, Math.max(0, currentPartner.affection + displayedAmount));
       // @ts-ignore
       const newReal = Math.min(100, Math.max(-50, (currentPartner.realAffection || 0) + calculatedReal));
       return { ...prev, flags: { ...prev.flags, partner: { ...currentPartner, affection: newDisplay, realAffection: newReal } } };
     });
  };

  // --- 工作与时间逻辑 ---
  const handleWork = () => {
    if (!gameState.profession) return;
    const { stressFactor, healthRisk } = gameState.profession;
    const profEvent = (JOB_EVENTS as any)[gameState.profession.id];
    
    // 30% 触发职业专属事件
    if (profEvent && Math.random() < 0.3) {
        const event = profEvent[getRandomInt(0, profEvent.length - 1)];
        showModal({
            title: event.title, description: event.desc, type: 'WORK',
            actions: event.options.map((opt: any) => ({
                label: opt.text,
                onClick: () => { 
                    updateStats(opt.changes, "你做出了选择。"); 
                    closeModal(); 
                    finishWorkBlock();
                }
            }))
        });
    } else {
        // 普通搬砖
        const profLog = (JOB_LOGS as any)[gameState.profession.id] || ["枯燥的工作..."];
        const desc = profLog[getRandomInt(0, profLog.length - 1)];
        const actualRisk = healthRisk + (gameState.flags.disease ? 8 : 0); 
        updateStats({ physical: -actualRisk, mental: -stressFactor, satiety: -15 }, desc);
        finishWorkBlock();
    }
  };

  const finishWorkBlock = () => {
    setGameState(prev => {
        if (prev.phase === 'WORK_AM') return { ...prev, phase: 'LUNCH', time: '12:00' };
        else {
            const salary = (prev.profession?.salaryBase || 0) + getRandomInt(-50, 50); 
            const newMoney = prev.stats.money + salary;
            return { 
                ...prev, 
                stats: { ...prev.stats, money: newMoney },
                phase: 'DINNER', time: '18:30',
                log: [...prev.log, { id: Date.now(), text: `【下班】入账 ¥${salary}`, type: 'success' }]
            };
        }
    });
  };

  // --- 自由时间逻辑 (恢复 App 17 所有选项) ---
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
          case 'MOVIE':
              if (gameState.stats.money < 50) { addLog("电影票都买不起了。", "warning"); return; }
              updateStats({ money: -50, mental: 15 }, "看了一场爆米花电影，暂时忘记了烦恼。");
              break;
          case 'INTERNET_CAFE':
              if (gameState.stats.money < 20) { addLog("网费不足。", "warning"); return; }
              updateStats({ money: -20, mental: 20, physical: -5 }, "在网吧五连坐，大杀四方。");
              break;
          case 'WALK':
              updateStats({ mental: 5, physical: 2, satiety: -5 }, "在江边散步，看着对岸的豪宅发呆。");
              break;
          case 'HOME':
              updateStats({ mental: 5, physical: 5 }, "在家躺平，哪里也不去。");
              break;
      }
      if (gameState.phase !== 'MODAL_PAUSE') setGameState(prev => ({ ...prev, phase: 'SLEEP', time: '23:30' }));
  };

  // --- 睡眠与结算逻辑 (整合所有死亡判定) ---
  const handleSleep = () => {
    // 1. 住院日结算 (App 18)
    if (gameState.flags.hospitalDays > 0) {
        const { hospitalDays, hospitalDailyCost } = gameState.flags;
        const newMoney = gameState.stats.money - hospitalDailyCost;
        if (newMoney < -20000 && !gameState.flags.hasHouse) {
             triggerDeath("欠费停药。因长期拖欠医疗费，你被保安扔出了医院，在寒风中咽下了最后一口气。"); return;
        }
        updateStats({ money: -hospitalDailyCost, physical: 25 });
        const nextDays = hospitalDays - 1;
        
        if (nextDays <= 0) {
            setGameState(prev => ({
                ...prev,
                flags: { ...prev.flags, hospitalDays: 0, hospitalDailyCost: 0, disease: null },
                phase: 'MORNING',
                date: new Date(prev.date.getTime() + 86400000)
            }));
            showModal({ title: "康复出院", description: "虽然钱包空了，但好歹捡回一条命。", type: 'EVENT', actions: [{ label: "活着真好", onClick: closeModal }] });
        } else {
            setGameState(prev => ({
                ...prev,
                flags: { ...prev.flags, hospitalDays: nextDays },
                date: new Date(prev.date.getTime() + 86400000),
                phase: 'MORNING'
            }));
        }
        return;
    }

    // 2. 黑色面包车逻辑 (App 18) - 移至结算时触发
    const { knownHealth, blackVanRisk } = gameState.flags;
    if (blackVanRisk > 0 && gameState.stats.physical > 97) {
        if (Math.random() < (blackVanRisk / 100)) {
            triggerDeath("你在睡梦中听到撬锁声，随后眼前一黑。醒来时发现自己躺在冰冷的手术台上。（死因：身体太好被特招了）");
            return;
        }
        setGameState(prev => ({ ...prev, flags: { ...prev.flags, blackVanRisk: Math.min(100, prev.flags.blackVanRisk + 5) } }));
    }

    // 3. 基础生存判定 (App 17)
    let debtLimit = -20000;
    if (gameState.flags.hasHouse) debtLimit -= 1500000;
    if (gameState.stats.money < debtLimit) { triggerDeath("资金链断裂。你背负的债务超过了资产价值，绝望之下选择了自我了断。"); return; }
    if (gameState.stats.physical <= 0) { triggerDeath("过劳死。为了那点窝囊费，你把命搭进去了。"); return; }
    if (gameState.stats.mental <= 0) { triggerDeath("精神彻底崩溃，你赤身裸体冲上大街，最后被送进精神病院。"); return; }
    if (gameState.stats.satiety <= 0) { triggerDeath("饿死。在这个全面小康的时代，你是个特例。"); return; }

    // 4. 随机暴毙 (App 17) - 移至结算触发
    if (Math.random() < 0.003) {
         triggerDeath(`【飞来横祸】${DAILY_ACCIDENTS[getRandomInt(0, DAILY_ACCIDENTS.length - 1)]}`); return;
    }

    // 5. 疾病判定 (整合)
    if (!gameState.flags.disease && Math.random() < 0.05) {
         const disease = DISEASES[getRandomInt(0, DISEASES.length - 1)];
         // 医保计算
         const hasInsurance = gameState.flags.hasInsurance;
         const actualAdmission = hasInsurance ? Math.floor(disease.admission * 0.3) : disease.admission;
         const actualDaily = hasInsurance ? Math.floor(disease.daily * 0.3) : disease.daily;

         showModal({
           title: "突发恶疾", 
           description: `确诊【${disease.name}】。${disease.desc}\n需治疗费/押金: ¥${actualAdmission} ${hasInsurance ? '(医保已报销)' : '(自费)'}`, 
           type: 'DISEASE',
           actions: [
             { 
                label: "治疗", 
                onClick: () => {
                    if (gameState.stats.money >= actualAdmission) {
                        updateStats({ money: -actualAdmission });
                        // @ts-ignore
                        if (disease.days > 0) {
                             // @ts-ignore
                             setGameState(prev => ({ ...prev, flags: { ...prev.flags, disease: disease.name, hospitalDays: disease.days, hospitalDailyCost: actualDaily }, phase: 'SLEEP' }));
                             closeModal();
                        } else closeModal();
                    } else triggerDeath("没钱治病，病情恶化死在出租屋里。");
                }
             },
             {
                 label: "放弃治疗",
                 onClick: () => {
                     closeModal();
                     // @ts-ignore
                     if (disease.harm > 30) triggerDeath(`【${disease.name}】恶化，你在痛苦中离世。`);
                     else {
                         setGameState(prev => ({ ...prev, flags: { ...prev.flags, disease: disease.name } }));
                         addLog("你选择了硬抗，身体状况每况愈下。", "danger");
                     }
                 }, style: 'secondary'
             }
           ]
         });
         return; 
    }

    // 6. 子女成长与消耗 (App 18)
    handleChildLogic();

    // 7. 利息结算
    if (gameState.stats.debt > 0) {
        const interest = Math.floor(gameState.stats.debt * 0.0005);
        updateStats({ money: -interest });
        addLog(`支付了今日利息: ¥${interest}`, "warning");
    }

    // 8. 结算与日期推进
    updateStats({ physical: 5, mental: 5, satiety: -20 });
    const nextDate = new Date(gameState.date);
    nextDate.setDate(nextDate.getDate() + 1);
    
    // 生日与升学逻辑
    if (gameState.stats.daysSurvived > 0 && gameState.stats.daysSurvived % 365 === 0) {
        updateStats({ age: gameState.stats.age + 1 });
        // 孩子升学逻辑
        setGameState(prev => ({
            ...prev,
            flags: {
                ...prev.flags,
                children: prev.flags.children.map(c => {
                    const newAge = c.age + 1;
                    let newStage = c.educationStage;
                    if (newAge >= 3 && newAge < 7) newStage = 'KINDER';
                    else if (newAge >= 7 && newAge < 13) newStage = 'PRIMARY';
                    else if (newAge >= 13 && newAge < 16) newStage = 'MIDDLE';
                    else if (newAge >= 16 && newAge < 19) newStage = 'HIGH';
                    else if (newAge >= 19 && newAge < 23) newStage = 'UNI';
                    return { ...c, age: newAge, educationStage: newStage as any, schoolFeePaid: false };
                })
            }
        }));
    }

    setGameState(prev => ({ 
        ...prev, 
        date: nextDate, phase: 'MORNING', time: '07:00',
        stats: {...prev.stats, daysSurvived: prev.stats.daysSurvived + 1}
    }));
  };
  
  // --- 饮食主入口 ---
  const handleEat = (type: string) => {
       if (type === 'SKIP') {
           updateStats({ satiety: -10, mental: -5 }, "饿了一顿，感觉头晕眼花。");
       }
       else if (type === 'TAKEOUT') {
           updateStats({ money: -30, satiety: 40, physical: -2 }, "吃了份外卖，希望能活过今晚。");
       }
       else if (type === 'COOK_MENU') {
           const config = getKitchenModalConfig(gameState.flags.inventory, gameState.stats.money);
           showModal(config);
           return; // 不直接推进时间
       }
       
       // 推进时间
       setGameState(prev => {
            let nextP = prev.phase; let nextT = prev.time;
            if (prev.phase === 'MORNING') { nextP = isWeekend(prev.date, prev.profession?.schedule||'965') ? 'REST_AM' : 'WORK_AM'; nextT = '09:00'; }
            else if (prev.phase === 'LUNCH') { nextP = isWeekend(prev.date, prev.profession?.schedule||'965') ? 'REST_PM' : 'WORK_PM'; nextT = '13:00'; }
            else if (prev.phase === 'DINNER') { nextP = 'FREE_TIME'; nextT = '20:00'; }
            return { ...prev, phase: nextP, time: nextT };
       });
  };

  // --- UI: 开始界面 ---
  if (gameState.phase === 'START') {
     return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950 font-sans">
        <div className="max-w-5xl w-full bg-zinc-900/80 p-8 rounded-xl shadow-2xl border border-zinc-800 backdrop-blur">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-yellow-500 mb-6 text-center tracking-tighter">中国式社畜模拟器 <span className="text-sm font-mono text-zinc-600 block mt-2">ULTIMATE EDITION</span></h1>
          
          <div className="flex flex-col md:flex-row justify-center gap-6 mb-8">
            <div className="bg-black/40 px-6 py-4 rounded-xl border border-zinc-700 flex flex-col items-center">
                 <span className="text-zinc-500 text-xs uppercase mb-1">Initial Age</span>
                 <div className="flex items-center gap-2">
                     <span className="text-3xl font-bold text-white font-mono">{tempAge}</span>
                     <button onClick={() => setTempAge(getRandomInt(18, 55))} className="p-1 hover:bg-zinc-700 rounded-full transition-colors"><RotateCcw className="w-4 h-4 text-zinc-500 hover:text-white"/></button>
                 </div>
            </div>
            <div className="bg-black/40 px-6 py-4 rounded-xl border border-zinc-700 flex flex-col items-center min-w-[200px]">
                 <span className="text-zinc-500 text-xs uppercase mb-1">Family Background</span>
                 <div className="flex items-center gap-2">
                     <span className="text-xl font-bold text-white">{tempBg.name}</span>
                     <button onClick={() => setTempBg(FAMILY_BACKGROUNDS[getRandomInt(0, FAMILY_BACKGROUNDS.length - 1)])} className="p-1 hover:bg-zinc-700 rounded-full transition-colors"><RotateCcw className="w-4 h-4 text-zinc-500 hover:text-white"/></button>
                 </div>
                 <span className="text-xs text-zinc-500 mt-1">{tempBg.desc}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.values(PROFESSIONS).map((p: any) => {
              const isEligible = tempAge >= (p.minAge || 0) && tempAge <= (p.maxAge || 100);
              return (
              <button key={p.id} onClick={() => isEligible && startGame(p.id as ProfessionType)} disabled={!isEligible}
                className={`p-4 border rounded-lg text-left transition-all hover:scale-[1.02] relative overflow-hidden group h-32 flex flex-col justify-between ${isEligible ? 'bg-zinc-800/50 hover:bg-red-900/10 border-zinc-700 cursor-pointer' : 'opacity-30 grayscale cursor-not-allowed border-zinc-800'}`}>
                <div>
                    <div className="font-bold text-zinc-100 mb-1 flex justify-between items-center">
                        {p.name}
                        <span className="text-[10px] bg-zinc-900 px-2 py-0.5 rounded text-zinc-500">{p.schedule}</span>
                    </div>
                    <div className="text-xs text-zinc-500">{p.description}</div>
                </div>
                <div className="text-[10px] text-zinc-600 font-mono border-t border-zinc-700/50 pt-2 mt-2 flex justify-between">
                    <span>底薪: ¥{p.salaryBase}</span>
                    <span>{p.minAge}-{p.maxAge}岁</span>
                </div>
              </button>
            )})}
          </div>
        </div>
      </div>
     );
  }

  // --- UI: 游戏结束 ---
  if (gameState.phase === 'GAME_OVER') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white p-4 font-mono">
            <div className="text-center max-w-xl w-full">
                <h1 className="text-6xl font-black text-red-600 mb-6 tracking-[0.2em] uppercase">TERMINATED</h1>
                <div className="bg-red-950/20 p-8 rounded-xl border border-red-900/50 mb-8 backdrop-blur relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-50"></div>
                     <p className="text-zinc-500 text-xs uppercase mb-2">生存记录</p>
                     <p className="text-4xl font-bold mb-6 text-white">{gameState.stats.age} 岁</p>
                     <p className="text-zinc-500 text-xs uppercase mb-2">销户原因</p>
                     <p className="text-xl text-red-400 font-bold leading-relaxed">{gameState.gameOverReason}</p>
                </div>
                <button onClick={() => window.location.reload()} className="bg-zinc-800 px-8 py-4 rounded-full border border-zinc-700 hover:bg-zinc-700 hover:border-white transition-all flex items-center justify-center mx-auto text-sm font-bold tracking-widest uppercase">
                    <RotateCcw className="w-4 h-4 mr-2" /> Restart System
                </button>
            </div>
        </div>
      )
  }

  // --- UI: 主游戏界面 ---
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 font-sans pb-10 selection:bg-red-500/30">
      <EventModal config={gameState.modal} />
      <RelationshipModal 
        isOpen={gameState.showRelationshipPanel} 
        onClose={() => setGameState(prev => ({ ...prev, showRelationshipPanel: false }))} 
        partner={gameState.flags.partner}
        childrenList={gameState.flags.children}
        flags={gameState.flags}
        money={gameState.stats.money}
        debt={gameState.stats.debt}
        actions={relActions}
      />
      
      <StatBar stats={gameState.stats} profession={gameState.profession} time={gameState.time} isDepressed={gameState.flags.isDepressed} date={gameState.date} />
      
      <main className="max-w-5xl mx-auto p-4 flex flex-col gap-6">
        <GameLog logs={gameState.log} />
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* 左侧状态板 */}
            <div className="lg:col-span-1 bg-zinc-900/80 p-5 rounded-xl border border-zinc-800 h-fit shadow-xl">
                <div className="flex justify-between items-center mb-4 border-b border-zinc-800 pb-2">
                    <span className="text-zinc-500 text-xs font-mono uppercase tracking-widest">Status</span>
                    <span className="text-white font-bold">{gameState.stats.age} 岁</span>
                </div>
                
                <div className="space-y-3">
                    <button onClick={() => setGameState(prev => ({ ...prev, showRelationshipPanel: true }))} className="w-full bg-pink-900/10 text-pink-300 py-3 rounded-lg border border-pink-900/30 flex items-center justify-center hover:bg-pink-900/30 transition-all group">
                        <Heart className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform"/> 
                        <span className="text-xs font-bold">家庭 / 情感 / 资产</span>
                    </button>

                    {gameState.flags.hospitalDays > 0 && (
                         <div className="bg-red-900/20 text-red-400 p-3 rounded-lg text-sm text-center border border-red-900/50 animate-pulse font-bold flex flex-col items-center">
                            <Activity className="w-5 h-5 mb-1"/>
                            住院治疗中 ({gameState.flags.hospitalDays}天)
                         </div>
                    )}
                    
                    {gameState.flags.blackVanRisk > 0 && (
                        <div className="bg-amber-900/10 text-amber-500 text-[10px] p-2 rounded border border-amber-900/30 text-center animate-pulse flex flex-col items-center mt-2">
                            <Skull className="w-4 h-4 mb-1"/>
                            <span>⚠ 已被暗中观察 (风险: {gameState.flags.blackVanRisk}%)</span>
                        </div>
                    )}
                </div>
            </div>

            {/* 右侧操作板：使用 grid 布局容纳所有按钮 */}
            <div className="lg:col-span-3 bg-zinc-900/80 p-5 rounded-xl border border-zinc-800 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {gameState.flags.hospitalDays > 0 ? (
                     <button onClick={handleSleep} className="col-span-full bg-red-950/40 py-16 rounded-xl text-red-200 border border-red-900/30 hover:bg-red-900/30 transition-all flex flex-col items-center justify-center group cursor-pointer">
                         <div className="bg-red-900/50 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
                             <Activity className="w-8 h-8" />
                         </div>
                         <span className="text-xl font-bold mb-2">接受治疗</span>
                         <span className="text-sm opacity-70 font-mono bg-black/30 px-3 py-1 rounded">点击度过这一天 (-¥{gameState.flags.hospitalDailyCost})</span>
                     </button>
                ) : (
                    <>
                        {/* 1. 工作按钮 */}
                        {gameState.phase.includes('WORK') && (
                            <button onClick={handleWork} className="col-span-full py-12 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white rounded-xl transition-all group flex flex-col items-center justify-center gap-2 shadow-lg shadow-black/50">
                                <Briefcase className="w-8 h-8 group-hover:animate-bounce text-zinc-400 group-hover:text-white" />
                                <span className="text-xl font-bold tracking-[0.2em] uppercase">Start Working</span>
                                <span className="text-xs text-zinc-500 font-mono">CLICK TO PROCEED</span>
                            </button>
                        )}
                        
                        {/* 2. 饮食按钮 */}
                        {(gameState.phase === 'MORNING' || gameState.phase === 'LUNCH' || gameState.phase === 'DINNER') && (
                            <>
                                <ActionBtn label="拼好饭" icon={<ShoppingBag/>} onClick={() => handleEat('TAKEOUT')} color="orange" sub="-¥30 | 续命" />
                                <ActionBtn label="做饭/买菜" icon={<Utensils/>} onClick={() => handleEat('COOK_MENU')} color="green" sub="居家生存" />
                                <ActionBtn label="不吃(省钱)" icon={<XCircle/>} onClick={() => handleEat('SKIP')} color="red" sub="消耗健康" />
                            </>
                        )}
                        
                        {/* 3. 自由时间/周末按钮 - 完整恢复 App 17 的所有选项 + App 18 的医院 */}
                        {(gameState.phase === 'FREE_TIME' || gameState.phase.includes('REST')) && (
                            <>
                                {/* App 18: 医院体检 */}
                                <ActionBtn label="去医院体检" icon={<Activity/>} onClick={() => {
                                    const config: ModalConfig = { 
                                        isOpen: true, title: "市第一人民医院", description: "消毒水的味道扑面而来。", type: 'EVENT',
                                        actions: HOSPITAL_SERVICES.map(service => ({
                                            label: `${service.name} (¥${service.cost})`,
                                            onClick: () => {
                                                if (gameState.stats.money < service.cost) { addLog("余额不足。", "danger"); return; }
                                                updateStats({ money: -service.cost });
                                                if (service.id === 'checkup') {
                                                    const realHealth = gameState.stats.physical;
                                                    setGameState(prev => ({ ...prev, flags: { ...prev.flags, lastCheckupDate: formatDateCN(prev.date), knownHealth: realHealth, blackVanRisk: realHealth > 97 ? (prev.flags.blackVanRisk || 10) : 0 } }));
                                                    showModal({ title: "体检报告", description: `体质评分: ${realHealth}/200\n结论: ${realHealth > 150 ? '人类巅峰！' : '尚可。'}`, type: 'EVENT', actions: [{ label: "确认", onClick: closeModal }] });
                                                } else if (service.effect) {
                                                    // @ts-ignore
                                                    updateStats(service.effect); closeModal();
                                                } else closeModal();
                                            }
                                        }))
                                    };
                                    config.actions.push({ label: "离开", onClick: closeModal, style: 'secondary' });
                                    showModal(config);
                                }} color="teal" sub="健康管理" />

                                {/* App 17: 丰富娱乐 */}
                                <ActionBtn label="看电影" icon={<Users/>} onClick={() => handleFreeTime('MOVIE')} color="purple" sub="-¥50" />
                                <ActionBtn label="高端SPA" icon={<Footprints/>} onClick={() => handleFreeTime('SPA')} color="pink" sub="-¥1288" />
                                <ActionBtn label="打赏主播" icon={<MonitorPlay/>} onClick={() => handleFreeTime('STREAMER')} color="indigo" sub="-¥1000" />
                                <ActionBtn label="路边撸串" icon={<Beer/>} onClick={() => handleFreeTime('BBQ')} color="orange" sub="-¥100" />
                                <ActionBtn label="去网吧" icon={<MonitorPlay/>} onClick={() => handleFreeTime('INTERNET_CAFE')} color="zinc" sub="-¥20" />
                                <ActionBtn label="广场舞" icon={<Dumbbell/>} onClick={() => handleFreeTime('SQUARE_DANCE')} color="zinc" sub="免费" />
                                <ActionBtn label="江边散步" icon={<Footprints/>} onClick={() => handleFreeTime('WALK')} color="zinc" sub="免费" />
                                <ActionBtn label="回家睡觉" icon={<Home/>} onClick={() => handleFreeTime('HOME')} color="zinc" sub="休息" />
                            </>
                        )}

                        {/* 4. 睡觉按钮 */}
                        {gameState.phase === 'SLEEP' && (
                            <button onClick={handleSleep} className="col-span-full bg-indigo-950/50 border border-indigo-900 py-10 rounded-xl text-indigo-200 font-bold hover:bg-indigo-900/50 transition-all flex flex-col items-center justify-center group">
                                <Moon className="w-8 h-8 mb-2 group-hover:text-yellow-200 transition-colors" />
                                <span className="text-lg">结束这一天</span>
                                <span className="text-xs opacity-50 font-mono mt-1">PROCEED TO NEXT DAY</span>
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
      </main>
    </div>
  );
};

// --- UI 组件：操作按钮 ---
const ActionBtn = ({ label, icon, onClick, color, sub }: any) => {
    const colors: any = {
        zinc: 'text-zinc-300 bg-zinc-800 hover:bg-zinc-700 border-zinc-700',
        orange: 'text-orange-300 bg-orange-900/20 hover:bg-orange-900/40 border-orange-900/50',
        green: 'text-emerald-300 bg-emerald-900/20 hover:bg-emerald-900/40 border-emerald-900/50',
        red: 'text-red-300 bg-red-900/20 hover:bg-red-900/40 border-red-900/50',
        teal: 'text-teal-300 bg-teal-900/20 hover:bg-teal-900/40 border-teal-900/50',
        purple: 'text-purple-300 bg-purple-900/20 hover:bg-purple-900/40 border-purple-900/50',
        indigo: 'text-indigo-300 bg-indigo-900/20 hover:bg-indigo-900/40 border-indigo-900/50',
        pink: 'text-pink-300 bg-pink-900/20 hover:bg-pink-900/40 border-pink-900/50',
    };
    
    return (
        <button onClick={onClick} className={`${colors[color] || colors.zinc} p-4 rounded-xl border transition-all flex flex-col items-center justify-center active:scale-95 group h-28 relative overflow-hidden`}>
            <div className="absolute top-0 right-0 p-1 opacity-20">
                {React.cloneElement(icon, { size: 40 })}
            </div>
            {React.cloneElement(icon, { className: `mb-2 w-6 h-6 group-hover:scale-110 transition-transform z-10` })}
            <span className="font-bold text-sm z-10">{label}</span>
            <span className="text-[10px] opacity-60 mt-1 font-mono z-10">{sub}</span>
        </button>
    );
};

export default App;
