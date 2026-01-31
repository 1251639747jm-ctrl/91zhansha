import React, { useState, useEffect, useCallback } from 'react';
import { GameState, ProfessionType, LogEntry, FamilyBackground, Child } from './types';
import { 
  PROFESSIONS, INITIAL_STATS, JOB_EVENTS, JOB_LOGS, DISEASES, POTENTIAL_PARTNERS, 
  ASSET_COSTS, INGREDIENTS_SHOP, RECIPES, FAMILY_BACKGROUNDS, HOSPITAL_SERVICES, EDUCATION_COSTS
} from './constants';
import { getRandomInt, formatDateCN, isWeekend } from './utils';
import StatBar from './components/StatBar';
import GameLog from './components/GameLog';
import EventModal, { ModalConfig } from './components/EventModal';
import RelationshipModal from './components/RelationshipModal';
import { 
  RotateCcw, Utensils, Briefcase, Moon, 
  ShoppingBag, XCircle, Users, Activity, Heart, Skull
} from 'lucide-react';

const DAILY_ACCIDENTS = [
  "走在路上玩手机，不慎掉进没有井盖的下水道。",
  "路过高层建筑时，被一个坠落的花盆精准命中。",
  "吃夜宵时被鱼刺卡住喉咙，引发剧烈咳血窒息。",
  "手机充电时玩大型游戏，电池爆炸引发火灾。",
  "过马路时被一辆闯红灯的渣土车卷入车底。",
  "洗澡时燃气热水器泄漏，在不知不觉中一氧化碳中毒。"
];

const App: React.FC = () => {
  // 开局临时状态
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
      isDepressed: false, disease: null, hasLoan: false, isSingle: true, streamerSimpCount: 0,
      partner: null, isPursuing: false, hasHouse: false, hasCar: false, parentPressure: 0,
      hasInsurance: false,
      hospitalDays: 0, 
      hospitalDailyCost: 0,
      // 新增风险标记
      blackVanRisk: 0, lastCheckupDate: null, knownHealth: null,
      inventory: { oil: 0, badOil: false, rice: 0, veggies: 0, meat: 0, seasoning: 0, milkPowder: 0, diapers: 0 },
      children: []
    },
    modal: { isOpen: false, title: '', description: '', type: 'EVENT', actions: [] },
    showRelationshipPanel: false, 
    gameOverReason: ''
  });

  // 初始化随机
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
      // 如果还在住院，保持 SLEEP/住院状态，否则恢复正常时间流
      phase: prev.flags.hospitalDays > 0 ? 'SLEEP' : (prev.time.includes('23') ? 'SLEEP' : (prev.time.includes('12') ? 'LUNCH' : 'DINNER')),
      modal: { ...prev.modal, isOpen: false }
    }));
  };

  const updateStats = (changes: Partial<typeof INITIAL_STATS>, reason?: string) => {
    setGameState(prev => {
      const newStats = { ...prev.stats };
      let physicalChange = changes.physical || 0;
      
      // 生病 Debuff
      if (prev.flags.disease) {
          if (physicalChange > 0) physicalChange = Math.floor(physicalChange * 0.5);
          if (physicalChange < 0) physicalChange = Math.floor(physicalChange * 1.5);
      }

      // 健康上限改为 200
      if (changes.physical) newStats.physical = Math.min(200, Math.max(0, newStats.physical + physicalChange));
      if (changes.mental) newStats.mental = Math.min(100, Math.max(0, newStats.mental + (changes.mental || 0)));
      if (changes.money) newStats.money = newStats.money + (changes.money || 0);
      if (changes.satiety) newStats.satiety = Math.min(100, Math.max(0, newStats.satiety + (changes.satiety || 0)));
      if (changes.age) newStats.age = changes.age;
      
      // 负债处理
      if (changes.debt) newStats.debt = Math.max(0, newStats.debt + (changes.debt || 0));
      // 厨艺处理
      if (changes.cookingSkill) newStats.cookingSkill = newStats.cookingSkill + (changes.cookingSkill || 0);

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

  // --- 核心：开局逻辑 ---
  const startGame = (profType: ProfessionType) => {
    const prof = PROFESSIONS[profType];
    const bg = tempBg;
    
    // 应用背景修正
    const startMoney = (prof.id === 'UNEMPLOYED' ? 2000 : 5000) + bg.moneyModifier;
    const startDebt = bg.debtModifier;
    const startStats = { ...INITIAL_STATS, ...bg.statModifier };
    
    // 确保数值合理
    startStats.physical = Math.min(200, Math.max(20, startStats.physical));
    startStats.money = startMoney;
    startStats.debt = startDebt;
    startStats.age = tempAge;

    setGameState({
      profession: prof,
      background: bg,
      stats: startStats,
      phase: 'MORNING',
      date: new Date('2024-01-01T07:30:00'),
      time: '07:30',
      log: [{ id: 1, text: `>>> 档案载入。${tempAge}岁。身份：${prof.name}。出身：${bg.name}。`, type: 'info' }],
      flags: { 
          isDepressed: false, disease: null, hasLoan: startDebt > 0, isSingle: true, streamerSimpCount: 0, 
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

  // --- 购买食材 (含煤油逻辑修复) ---
  const buyIngredient = (ing: typeof INGREDIENTS_SHOP[0]) => {
      setGameState(prev => {
          if (prev.stats.money < ing.cost) {
              return { ...prev, modal: { ...prev.modal, title: "余额不足", description: `买不起 ¥${ing.cost} 的 ${ing.name}。\n` + prev.modal.description.split('\n').pop() } };
          }

          let isNewBadOil = false;
          // 【修复】：概率下调至15%，且只在购买油的时候判定
          if (ing.id === 'oil' && Math.random() < 0.15) {
              isNewBadOil = true;
          }

          const nextInventory = {
              ...prev.flags.inventory,
              // @ts-ignore
              [ing.id]: (prev.flags.inventory[ing.id] || 0) + 1,
              // 如果新买的是坏油，或者原来就有坏油，那现在的库存就是坏的 (混合污染)
              badOil: prev.flags.inventory.badOil || isNewBadOil
          };

          const nextMoney = prev.stats.money - ing.cost;
          // 实时刷新模态框
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

  // --- 烹饪逻辑 (含煤油Bug修复) ---
  const doCook = (recipe: typeof RECIPES[0]) => {
    setGameState(prev => {
        const { inventory } = prev.flags;
        const { needs } = recipe;
        
        // 检查食材
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

        // 扣减库存
        const newInv = { ...inventory };
        // @ts-ignore
        Object.keys(needs).forEach(k => newInv[k] -= needs[k]);

        // 【关键修复点】：如果油用光了，强制重置 badOil 为 false
        if (newInv.oil <= 0) {
            newInv.badOil = false;
        }

        // 煤油判定
        let healthHit = 0;
        let logText = `烹饪了【${recipe.name}】，真香！`;
        let logType: LogEntry['type'] = 'success';

        // 只有当食谱需要油，且当前库存是坏油时才触发
        if (needs.oil && inventory.badOil) {
             healthHit = 40; 
             logText = `【食品安全】${recipe.name}里有一股浓烈的煤油味！你为了省钱含泪吃下，感觉胃在燃烧。`;
             logType = 'danger';
        }

        // 推进时间
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

  // --- 医院逻辑 ---
  const handleHospitalVisit = () => {
    const config: ModalConfig = {
        isOpen: true, title: "市第一人民医院", description: "消毒水的味道扑面而来。你要挂什么科？", type: 'EVENT',
        actions: HOSPITAL_SERVICES.map(service => ({
            label: `${service.name} (¥${service.cost})`,
            onClick: () => {
                if (gameState.stats.money < service.cost) { addLog("余额不足，无法支付医疗费。", "danger"); return; }
                
                updateStats({ money: -service.cost });

                if (service.id === 'checkup') {
                    const realHealth = gameState.stats.physical;
                    let resultDesc = "";
                    if (realHealth > 150) resultDesc = "医生看着你的报告，手在颤抖：“这...这简直是超人类的数据！”（医生偷偷打了个电话）";
                    else if (realHealth > 97) resultDesc = "身体素质极佳，甚至好得有点过分了。医生多看了你几眼。";
                    else if (realHealth > 80) resultDesc = "非常健康，继续保持。";
                    else if (realHealth < 40) resultDesc = "身体状况堪忧，建议住院。";
                    else resultDesc = "亚健康状态，多注意休息。";

                    setGameState(prev => ({
                        ...prev, 
                        flags: { 
                            ...prev.flags, 
                            lastCheckupDate: formatDateCN(prev.date), 
                            knownHealth: realHealth,
                            // 开启死亡倒计时风险：只有健康>97才开启，如果本来就有风险则保持或增加
                            blackVanRisk: realHealth > 97 ? (prev.flags.blackVanRisk > 0 ? prev.flags.blackVanRisk : 10) : 0
                        }
                    }));
                    showModal({ title: "体检报告", description: `体质评分: ${realHealth}/200\n结论: ${resultDesc}`, type: 'EVENT', actions: [{ label: "知道了", onClick: closeModal }] });
                } 
                else if (service.effect) {
                    // @ts-ignore
                    updateStats(service.effect, `进行了【${service.name}】。` + service.desc);
                    closeModal();
                } 
                else closeModal();
            }
        }))
    };
    config.actions.push({ label: "离开医院", onClick: closeModal, style: 'secondary' });
    setGameState(prev => ({ ...prev, phase: 'MODAL_PAUSE', modal: config }));
  };

  // --- 子女逻辑 ---
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
            if (newHealth <= 0) return null; 
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

  // 情感与家庭动作
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
          addLog("钱不够清空购物车，好感度大幅下降。", "danger");
          return;
       }
       updateStats({ money: -cost, mental: 5 });
       modifyAffection(15);
       addLog(`花费¥${cost}清空了购物车。`, "success");
    },
    confess: () => {
      const partner = gameState.flags.partner;
      if (!partner) return;
      const successChance = (partner.realAffection || 0) / 100; 
      if (Math.random() < successChance) {
        setGameState(prev => ({ ...prev, flags: { ...prev.flags, isPursuing: false, isSingle: false } }));
        showModal({ title: "表白成功！", description: "恭喜你，脱单了！", type: 'LOVE', actions: [{ label: "太好了！", onClick: closeModal }] });
      } else {
        updateStats({ mental: -30 });
        modifyAffection(-20, -50); 
        addLog("表白被拒，对方发了一张好人卡。", "danger");
      }
    },
    breakup: () => {
       setGameState(prev => ({ ...prev, flags: { ...prev.flags, partner: null, isPursuing: false, isSingle: true } }));
       updateStats({ mental: -10 }, "分手了。");
       setGameState(prev => ({ ...prev, showRelationshipPanel: false }));
    },
    buyHouse: () => {
       if (gameState.flags.hasHouse) return;
       const down = ASSET_COSTS.HOUSE_DOWN_PAYMENT;
       if (gameState.stats.money < down) { addLog("首付不够。", "danger"); return; }
       updateStats({ money: -down, debt: (ASSET_COSTS.HOUSE_TOTAL_PRICE - down) }, "背上了巨额房贷。");
       setGameState(prev => ({ ...prev, flags: { ...prev.flags, hasHouse: true, parentPressure: 0, hasLoan: true } }));
    },
    buyCar: () => {
       if (gameState.flags.hasCar) return;
       const cost = ASSET_COSTS.CAR_COST;
       if (gameState.stats.money < cost) { addLog("钱不够。", "danger"); return; }
       updateStats({ money: -cost }, "全款提车。");
       setGameState(prev => ({ ...prev, flags: { ...prev.flags, hasCar: true } }));
    },
    repayDebt: (amount: number) => {
        if (gameState.stats.money < amount) return;
        updateStats({ money: -amount, debt: -amount });
        addLog(`提前还贷 ¥${amount}。`, "success");
    },
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

  const handleWork = () => {
    if (!gameState.profession) return;
    const { stressFactor, healthRisk } = gameState.profession;
    const profEvent = (JOB_EVENTS as any)[gameState.profession.id];
    
    // 职业事件触发 (30%)
    if (profEvent && Math.random() < 0.3) {
        const event = profEvent[getRandomInt(0, profEvent.length - 1)];
        showModal({
            title: event.title, description: event.desc, type: 'WORK',
            actions: event.options.map((opt: any) => ({
                label: opt.text,
                onClick: () => { 
                    updateStats(opt.changes, "你做出了选择。"); 
                    closeModal(); 
                    // 只有事件结束后才推进时间
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
            // 这里不能直接调用 updateStats，因为是在 setState 内部
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

  const handleSleep = () => {
    // 1. 住院逻辑
    if (gameState.flags.hospitalDays > 0) {
        const { hospitalDays, hospitalDailyCost } = gameState.flags;
        const newMoney = gameState.stats.money - hospitalDailyCost;
        if (newMoney < -20000 && !gameState.flags.hasHouse) {
             triggerDeath("欠费停药，被扔出医院，死在街头。"); return;
        }
        updateStats({ money: -hospitalDailyCost, physical: 20 });
        setGameState(prev => ({
            ...prev,
            flags: { ...prev.flags, hospitalDays: hospitalDays - 1 },
            date: new Date(prev.date.getTime() + 86400000),
            phase: 'MORNING'
        }));
        return;
    }

    // 2. 黑色面包车逻辑 (仅在体检后触发)
    const { knownHealth, blackVanRisk } = gameState.flags;
    if (blackVanRisk > 0) {
        if (gameState.stats.physical > 97) {
            const deathChance = blackVanRisk / 100; 
            if (Math.random() < deathChance) {
                triggerDeath("你在睡梦中听到撬锁声，随后眼前一黑。醒来时发现自己躺在冰冷的手术台上，这是你最后的记忆。（死因：身体太好被特招了）");
                return;
            }
            // 风险每日递增
            setGameState(prev => ({ ...prev, flags: { ...prev.flags, blackVanRisk: Math.min(100, prev.flags.blackVanRisk + 5) } }));
            addLog("最近总感觉有人在跟踪你，窗外似乎有黑影...", "danger");
        } else {
            // 身体变差，风险降低
            setGameState(prev => ({ ...prev, flags: { ...prev.flags, blackVanRisk: Math.max(0, prev.flags.blackVanRisk - 20) } }));
        }
    }
    // 必死逻辑 (健康>150 且 体检过)
    if (knownHealth && knownHealth > 150 && gameState.stats.physical > 150) {
        triggerDeath("由于你的体检数据堪称‘人类进化奇迹’，某位顶级富豪看中了你的全部器官。专业团队在今晚光顾了你的住所。");
        return;
    }

    // 3. 基础生存判定
    if (gameState.stats.physical <= 0) { triggerDeath("过劳死。"); return; }
    if (gameState.stats.mental <= 0) { triggerDeath("精神崩溃，自我了断。"); return; }
    if (gameState.stats.satiety <= 0) { triggerDeath("饿死。"); return; }
    
    // 随机意外
    if (Math.random() < 0.003) {
         triggerDeath(`【飞来横祸】${DAILY_ACCIDENTS[getRandomInt(0, DAILY_ACCIDENTS.length - 1)]}`); return;
    }

    // 4. 疾病判定
    if (!gameState.flags.disease && Math.random() < 0.05) {
         const disease = DISEASES[getRandomInt(0, DISEASES.length - 1)];
         showModal({
           title: "突发恶疾", 
           description: `确诊【${disease.name}】。${disease.desc} 治疗费: ¥${disease.admission}`, 
           type: 'DISEASE',
           actions: [
             { 
                label: "治疗", 
                onClick: () => {
                    if (gameState.stats.money >= disease.admission) {
                        updateStats({ money: -disease.admission });
                        // @ts-ignore
                        if (disease.days > 0) {
                             // @ts-ignore
                             setGameState(prev => ({ ...prev, flags: { ...prev.flags, disease: disease.name, hospitalDays: disease.days, hospitalDailyCost: disease.daily }, phase: 'SLEEP' }));
                             closeModal();
                        } else closeModal();
                    } else triggerDeath("没钱治病，在家等死。");
                }
             }
           ]
         });
         return; 
    }

    // 5. 孩子成长与消耗
    handleChildLogic();

    // 6. 结算
    updateStats({ physical: 5, mental: 5, satiety: -20 });
    const nextDate = new Date(gameState.date);
    nextDate.setDate(nextDate.getDate() + 1);
    
    // 生日与孩子升学
    if (gameState.stats.daysSurvived % 365 === 0 && gameState.stats.daysSurvived > 0) {
        updateStats({ age: gameState.stats.age + 1 });
        setGameState(prev => ({
            ...prev,
            flags: {
                ...prev.flags,
                children: prev.flags.children.map(c => {
                    const newAge = c.age + 1;
                    let newStage = c.educationStage;
                    // 升学检查
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
  
  const handleEat = (type: string) => {
       if (type === 'SKIP') updateStats({ satiety: -10, mental: -5 }, "饿了一顿。");
       else if (type === 'TAKEOUT') updateStats({ money: -30, satiety: 40, physical: -2 }, "吃了份外卖。");
       else if (type === 'COOK_MENU') {
           const config = getKitchenModalConfig(gameState.flags.inventory, gameState.stats.money);
           showModal(config);
           return; 
       }
       
       // 推进时间 (非做饭情况)
       setGameState(prev => {
            let nextP = prev.phase; let nextT = prev.time;
            if (prev.phase === 'MORNING') { nextP = isWeekend(prev.date, prev.profession?.schedule||'965') ? 'REST_AM' : 'WORK_AM'; nextT = '09:00'; }
            else if (prev.phase === 'LUNCH') { nextP = isWeekend(prev.date, prev.profession?.schedule||'965') ? 'REST_PM' : 'WORK_PM'; nextT = '13:00'; }
            else if (prev.phase === 'DINNER') { nextP = 'FREE_TIME'; nextT = '20:00'; }
            return { ...prev, phase: nextP, time: nextT };
       });
  };

  const handleFreeTime = (type: string) => {
      if (type === 'MOVIE') updateStats({ money: -50, mental: 15 }, "看电影。");
      else if (type === 'HOME') updateStats({ mental: 5, physical: 5 }, "在家躺平。");
      setGameState(prev => ({ ...prev, phase: 'SLEEP', time: '23:00' }));
  };

  // --- UI: START SCREEN ---
  if (gameState.phase === 'START') {
     return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950 font-sans">
        <div className="max-w-5xl w-full bg-zinc-900/80 p-8 rounded-xl shadow-2xl border border-zinc-800 backdrop-blur">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-yellow-500 mb-2 text-center">中国式社畜模拟器</h1>
          
          <div className="flex flex-col md:flex-row justify-center gap-6 mb-8">
            <div className="bg-black/40 px-6 py-4 rounded-xl border border-zinc-700 flex flex-col items-center">
                 <span className="text-zinc-400 text-xs uppercase mb-1">Initial Age</span>
                 <div className="flex items-center gap-2">
                     <span className="text-3xl font-bold text-white font-mono">{tempAge}</span>
                     <button onClick={() => setTempAge(getRandomInt(18, 55))} className="p-1 hover:bg-zinc-700 rounded-full"><RotateCcw className="w-4 h-4 text-zinc-500"/></button>
                 </div>
            </div>
            <div className="bg-black/40 px-6 py-4 rounded-xl border border-zinc-700 flex flex-col items-center min-w-[200px]">
                 <span className="text-zinc-400 text-xs uppercase mb-1">Family Background</span>
                 <div className="flex items-center gap-2">
                     <span className="text-xl font-bold text-white">{tempBg.name}</span>
                     <button onClick={() => setTempBg(FAMILY_BACKGROUNDS[getRandomInt(0, FAMILY_BACKGROUNDS.length - 1)])} className="p-1 hover:bg-zinc-700 rounded-full"><RotateCcw className="w-4 h-4 text-zinc-500"/></button>
                 </div>
                 <span className="text-xs text-zinc-500 mt-1">{tempBg.desc}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.values(PROFESSIONS).map((p: any) => {
              const isEligible = tempAge >= (p.minAge || 0) && tempAge <= (p.maxAge || 100);
              return (
              <button key={p.id} onClick={() => isEligible && startGame(p.id as ProfessionType)} disabled={!isEligible}
                className={`p-4 border rounded-lg text-left transition-all hover:scale-[1.02] ${isEligible ? 'bg-zinc-800/50 hover:bg-red-900/10 border-zinc-700' : 'opacity-40 grayscale cursor-not-allowed'}`}>
                <div className="font-bold text-zinc-100 mb-1">{p.name}</div>
                <div className="text-xs text-zinc-500">{p.description}</div>
              </button>
            )})}
          </div>
        </div>
      </div>
     );
  }

  // --- UI: GAME OVER ---
  if (gameState.phase === 'GAME_OVER') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white p-4">
            <div className="text-center max-w-lg">
                <h1 className="text-6xl font-bold text-red-600 mb-4">已销户</h1>
                <div className="bg-red-950/20 p-6 rounded border border-red-900/50 mb-8">
                     <p className="text-2xl font-bold mb-2">享年 {gameState.stats.age} 岁</p>
                     <p className="text-zinc-400">{gameState.gameOverReason}</p>
                </div>
                <button onClick={() => setGameState({ ...gameState, phase: 'START', stats: INITIAL_STATS, log: [] })} className="bg-zinc-800 px-6 py-3 rounded border border-zinc-700 hover:bg-zinc-700 transition-colors">重新投胎</button>
            </div>
        </div>
      )
  }

  // --- UI: MAIN GAME SCREEN ---
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 font-sans pb-10">
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
      
      <main className="max-w-4xl mx-auto p-4 flex flex-col gap-6">
        <GameLog logs={gameState.log} />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 左侧状态板 */}
            <div className="lg:col-span-1 bg-zinc-900/80 p-5 rounded-xl border border-zinc-800 h-fit">
                <div className="flex justify-between items-center mb-4 border-b border-zinc-800 pb-2">
                    <span className="text-white font-bold">{gameState.phase}</span>
                    <span className="text-zinc-500 text-sm">{gameState.stats.age}岁</span>
                </div>
                
                <div className="space-y-3">
                    <button onClick={() => setGameState(prev => ({ ...prev, showRelationshipPanel: true }))} className="w-full bg-pink-900/20 text-pink-300 py-3 rounded border border-pink-900/50 flex items-center justify-center hover:bg-pink-900/30 transition-colors">
                        <Heart className="w-4 h-4 mr-2"/> 家庭 / 情感 / 资产
                    </button>
                    {gameState.flags.hospitalDays > 0 && (
                         <div className="bg-red-900/20 text-red-400 p-2 rounded text-sm text-center border border-red-900/50 animate-pulse">
                            🏥 住院中 (剩余{gameState.flags.hospitalDays}天)
                         </div>
                    )}
                    {gameState.flags.blackVanRisk > 0 && (
                        <div className="text-red-500 text-xs text-center animate-pulse mt-2 flex flex-col items-center">
                            <Skull className="w-4 h-4 mb-1"/>
                            <span>⚠ 已被暗中观察 (风险: {gameState.flags.blackVanRisk}%)</span>
                        </div>
                    )}
                </div>
            </div>

            {/* 右侧操作板 */}
            <div className="lg:col-span-2 bg-zinc-900/80 p-5 rounded-xl border border-zinc-800 grid grid-cols-3 gap-3">
                {gameState.flags.hospitalDays > 0 ? (
                     <button onClick={handleSleep} className="col-span-3 bg-red-950/40 py-12 rounded-xl text-red-200 border border-red-900/30 hover:bg-red-900/30 transition-all flex flex-col items-center justify-center">
                         <span className="text-xl font-bold mb-2">接受治疗</span>
                         <span className="text-sm opacity-70">点击度过这一天 (-¥{gameState.flags.hospitalDailyCost})</span>
                     </button>
                ) : (
                    <>
                        {gameState.phase.includes('WORK') && <ActionBtn label="努力搬砖" icon={<Briefcase/>} onClick={handleWork} color="zinc" large />}
                        
                        {(gameState.phase === 'MORNING' || gameState.phase === 'LUNCH' || gameState.phase === 'DINNER') && (
                            <>
                                <ActionBtn label="点外卖" icon={<ShoppingBag/>} onClick={() => handleEat('TAKEOUT')} color="orange" />
                                <ActionBtn label="做饭/买菜" icon={<Utensils/>} onClick={() => handleEat('COOK_MENU')} color="green" />
                                <ActionBtn label="不吃(省钱)" icon={<XCircle/>} onClick={() => handleEat('SKIP')} color="red" />
                            </>
                        )}
                        
                        {gameState.phase === 'FREE_TIME' && (
                            <>
                                <ActionBtn label="去医院体检" icon={<Activity/>} onClick={handleHospitalVisit} color="teal" />
                                <ActionBtn label="看电影" icon={<Users/>} onClick={() => handleFreeTime('MOVIE')} color="purple" />
                                <ActionBtn label="回家睡觉" icon={<Moon/>} onClick={() => handleFreeTime('HOME')} color="indigo" />
                            </>
                        )}

                        {gameState.phase === 'SLEEP' && (
                            <button onClick={handleSleep} className="col-span-3 bg-indigo-950/50 border border-indigo-900 py-6 rounded-xl text-indigo-200 font-bold hover:bg-indigo-900/50 transition-all flex items-center justify-center">
                                <Moon className="w-5 h-5 mr-2" /> 进入梦乡 (结算今日)
                            </button>
                        )}
                        
                        {/* 休息日显示 */}
                        {gameState.phase.includes('REST') && (
                             <>
                                <ActionBtn label="睡懒觉" icon={<Moon/>} onClick={() => handleFreeTime('HOME')} color="indigo" />
                                <ActionBtn label="做饭" icon={<Utensils/>} onClick={() => handleEat('COOK_MENU')} color="green" />
                                <ActionBtn label="去医院" icon={<Activity/>} onClick={handleHospitalVisit} color="teal" />
                             </>
                        )}
                    </>
                )}
            </div>
        </div>
      </main>
    </div>
  );
};

// 样式组件
const ActionBtn = ({ label, icon, onClick, color, large }: any) => {
    const colors: any = {
        zinc: 'text-zinc-300 bg-zinc-800 hover:bg-zinc-700 border-zinc-700',
        orange: 'text-orange-300 bg-orange-900/20 hover:bg-orange-900/40 border-orange-900/50',
        green: 'text-emerald-300 bg-emerald-900/20 hover:bg-emerald-900/40 border-emerald-900/50',
        red: 'text-red-300 bg-red-900/20 hover:bg-red-900/40 border-red-900/50',
        teal: 'text-teal-300 bg-teal-900/20 hover:bg-teal-900/40 border-teal-900/50',
        purple: 'text-purple-300 bg-purple-900/20 hover:bg-purple-900/40 border-purple-900/50',
        indigo: 'text-indigo-300 bg-indigo-900/20 hover:bg-indigo-900/40 border-indigo-900/50',
    };
    
    return (
        <button onClick={onClick} className={`${colors[color] || colors.zinc} ${large ? 'col-span-3 py-8 text-lg' : 'p-4'} rounded-lg border transition-all flex flex-col items-center justify-center active:scale-95 group`}>
            {React.cloneElement(icon, { className: `mb-2 ${large ? 'w-8 h-8' : 'w-6 h-6'} group-hover:scale-110 transition-transform` })}
            <span className="font-bold">{label}</span>
        </button>
    );
};

export default App;
