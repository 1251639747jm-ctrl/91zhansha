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
  "走路刷只有3个粉丝的抖音，没看路掉进没有井盖的下水道。",
  "路过烂尾楼时，被一块脱落的‘文明城市’宣传牌精准爆头。",
  "吃‘科技与狠活’的路边摊，海克斯科技含量超标，当场变异（划掉）去世。",
  "在拼夕夕买的劣质充电宝，半夜爆炸把家点了。",
  "骑共享单车抢黄灯，被一辆超速的泥头车（异世界转生车）送走了。",
  "洗澡时燃气热水器泄漏，在不知不觉中重开。",
  "熬夜看霸总短剧太上头，情绪激动导致脑血管原地爆炸。",
  "喝了过期的‘9.9元酱香拿铁’，引发剧烈喷射导致脱水而亡。"
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
// --- 开局子女生成逻辑 ---
  const generateInitialChildren = (parentAge: number): Child[] => {
    const children: Child[] = [];
    // 基础概率：25岁以下几乎没孩子，30岁以上概率激增
    let chance = 0;
    if (parentAge >= 25 && parentAge < 30) chance = 0.2;
    if (parentAge >= 30 && parentAge < 40) chance = 0.6;
    if (parentAge >= 40) chance = 0.9;

    if (Math.random() < chance) {
      // 随机 1-3 个孩子
      const count = parentAge > 40 ? getRandomInt(1, 3) : getRandomInt(1, 2);
      for (let i = 0; i < count; i++) {
        // 孩子年龄随机：通常比父母小 20-35 岁，但最小为 0
        const childAge = Math.max(0, parentAge - getRandomInt(22, 35));
        
        // 如果孩子太老（超过23岁），视为已成年独立，不计入负担列表
        if (childAge > 23) continue;

        let stage: Child['educationStage'] = 'NONE';
        if (childAge >= 3 && childAge < 7) stage = 'KINDER';
        else if (childAge >= 7 && childAge < 13) stage = 'PRIMARY';
        else if (childAge >= 13 && childAge < 16) stage = 'MIDDLE';
        else if (childAge >= 16 && childAge < 19) stage = 'HIGH';
        else if (childAge >= 19 && childAge <= 23) stage = 'UNI';

        children.push({
          id: `initial-${i}-${Date.now()}`,
          name: Math.random() > 0.5 ? `大宝${i+1}(男)` : `小宝${i+1}(女)`,
          gender: Math.random() > 0.5 ? 'boy' : 'girl',
          age: childAge,
          educationStage: stage,
          health: 100,
          hunger: 100,
          schoolFeePaid: true // 开局默认本学期已缴费，否则开局直接负债暴毙
        });
      }
    }
    return children;
  };
  const startGame = (profType: ProfessionType) => {
    const prof = PROFESSIONS[profType];
    const bg = tempBg;
    
    // 1. 计算金钱和债务
    const startMoney = (prof.id === 'UNEMPLOYED' ? 2000 : 5000) + bg.moneyModifier;
    const startDebt = bg.debtModifier;

    // 2. 计算初始属性并增加【保底逻辑】
    const startStats = { 
        ...INITIAL_STATS, 
        ...bg.statModifier, 
        // 核心修改：使用 Math.max(30, ...) 确保健康、精神、饱食度开局至少有30点，不会直接死
        physical: Math.max(30, Math.min(200, (INITIAL_STATS.physical + (bg.statModifier.physical || 0)))),
        mental: Math.max(30, Math.min(100, (INITIAL_STATS.mental + (bg.statModifier.mental || 0)))),
        satiety: Math.max(30, Math.min(100, (INITIAL_STATS.satiety + (bg.statModifier.satiety || 0)))),
        money: startMoney, 
        debt: startDebt, 
        age: tempAge 
    };
    const initialChildren = generateInitialChildren(tempAge);
    setGameState({
      profession: prof,
      background: bg,
      stats: startStats,
      phase: 'MORNING',
      date: new Date('2024-01-01T07:30:00'),
      time: '07:30',
      log: [
        { id: 1, text: `>>> 档案载入完毕。年龄：${tempAge}岁。身份：${prof.name}。背景：${bg.name}。`, type: 'info' },
            ...(initialChildren.length > 0 ? [{ 
              id: 2, 
              text: `>>> 发现家庭档案：你已有 ${initialChildren.length} 个孩子需要抚养，碎钞机已启动。`, 
              type: 'warning' as const 
          }] : [])
           ],
      flags: { 
          isDepressed: false, disease: null, hasLoan: startDebt > 0, isSingle: true, 
          streamerSimpCount: 0,
          partner: null, isPursuing: false, hasHouse: false, hasCar: false, parentPressure: 0,
          hasInsurance: prof.hasInsurance,
          hospitalDays: 0, hospitalDailyCost: 0,
          blackVanRisk: 0, lastCheckupDate: null, knownHealth: null,
          inventory: { oil: 0, badOil: false, rice: 0, veggies: 0, meat: 0, seasoning: 0, milkPowder: 0, diapers: 0 },
          children: initialChildren, // <--- 替换这里
          isSingle: initialChildren.length > 0 ? false : true, // 有孩子默认不是单身状态（或者设定为离异/丧偶）
          parentPressure: initialChildren.length > 0 ? 0 : 30, // 有了孩子，父母催婚压力消失
      },
      modal: { isOpen: false, title: '', description: '', type: 'EVENT', actions: [] },
      showRelationshipPanel: false,
      gameOverReason: ''
    });
  };
  // --- App 17: 主播剧情系统 (完整保留) ---
  const triggerStreamerEvent = () => {
    showModal({
      title: "女神的专属私信",
      description: "‘哥哥~ 最近房租好贵哦，能不能帮帮人家？’ 你的女神发来一张‘露得很少但很纯’的照片，你感觉这就是爱情。",
      type: 'LOVE',
      actions: [
        {
          label: "冲！全仓梭哈 (80%几率遇到坦克)",
          onClick: () => {
            if (Math.random() < 0.8) {
              showModal({
                title: "奔现翻车现场", description: "到了约定地点，发现对方是使用了‘量子纠缠美颜术’的乔碧萝殿下，而且还带了三个男闺蜜来蹭饭。", type: 'DEATH',
                actions: [{ label: "小丑竟是我自己 (破防-50, 钱包-3000)", onClick: () => {
                  updateStats({ mental: -50, money: -3000 }, "作为沸羊羊，你含泪买单，并在朋友圈发了句‘累了’。");
                  closeModal();
                }, style: 'danger' }]
              });
            } else {
              updateStats({ mental: 50 }, "虽然是酒托，但至少长得和精修图只有三分像，你觉得这波不亏。");
              closeModal();
            }
          }
        },
        { label: "算了吧，电子厂还要上夜班", onClick: () => { updateStats({ mental: -5 }); closeModal(); }, style: 'secondary' }
      ]
    });
  };

  // --- App 18: 厨房逻辑 (修复版) ---
 const buyIngredient = (ing: typeof INGREDIENTS_SHOP[0]) => {
      setGameState(prev => {
          if (prev.stats.money < ing.cost) {
              return { 
                  ...prev, 
                  modal: { ...prev.modal, title: "余额不足", description: `你买不起 ¥${ing.cost} 的 ${ing.name}。` } 
              };
          }

          let isNewBadOil = false;
          // 仅在买油时判定概率（建议调低到 0.05 即 5%，0.2 太高了）
          if (ing.id === 'oil' && Math.random() < 0.05) { 
              isNewBadOil = true;
          }

          const currentOil = prev.flags.inventory.oil || 0;

          const nextInventory = {
              ...prev.flags.inventory,
              // @ts-ignore
              [ing.id]: (prev.flags.inventory[ing.id] || 0) + 1,
              // 【修复核心】：如果当前油量 > 0，则混合污染；如果当前没油了，只看这桶新买的坏不坏
              badOil: currentOil > 0 ? (prev.flags.inventory.badOil || isNewBadOil) : isNewBadOil
          };

          const nextMoney = prev.stats.money - ing.cost;
          const newModalConfig = getKitchenModalConfig(nextInventory, nextMoney);

          return {
              ...prev,
              stats: { ...prev.stats, money: nextMoney },
              flags: { ...prev.flags, inventory: nextInventory },
              modal: { ...newModalConfig, isOpen: true },
              log: [...prev.log, { 
                  id: Date.now(), 
                  text: isNewBadOil ? `买了桶【${ing.name}】，闻起来有股怪味...` : `购买了【${ing.name}】。`, 
                  type: isNewBadOil ? 'warning' : 'info' 
              }]
          };
      });
  };

// --- 核心烹饪逻辑：含坏油物理清除与时间精准跳转 ---
  const doCook = (recipe: typeof RECIPES[0]) => {
    setGameState(prev => {
        const { inventory } = prev.flags;
        const { needs } = recipe;
        
        // 1. 检查食材是否足够
        const missingItems: string[] = [];
        Object.keys(needs).forEach(k => {
            // @ts-ignore
            if ((inventory[k] || 0) < (needs[k] || 0)) {
                missingItems.push(k);
            }
        });

        if (missingItems.length > 0) {
            return {
                ...prev,
                modal: { 
                    ...prev.modal, 
                    title: "食材不足", 
                    description: `做【${recipe.name}】还缺：${missingItems.join(', ')}\n当前库存: 油${inventory.oil} 米${inventory.rice} 蔬${inventory.veggies} 肉${inventory.meat}` 
                }
            };
        }

        // 2. 扣除食材库存
        const newInv = { ...inventory };
        Object.keys(needs).forEach(k => {
            // @ts-ignore
            newInv[k] -= needs[k];
        });
        
        // 【核心修复点】：如果油用光了，必须强制重置坏油状态，防止污染下一桶好油
        if (newInv.oil <= 0) {
            newInv.badOil = false;
        }

        // 3. 煤油中毒判定逻辑
        let healthHit = 0;
        let logText = `烹饪了【${recipe.name}】，色香味俱全！`;
        let logType: LogEntry['type'] = 'success';

        // 只有当食谱需要油，且当前库存的油是坏的时候才触发
        if (needs.oil && inventory.badOil) {
             healthHit = 40; 
             logText = `【海克斯科技】做好的${recipe.name}有一股刺鼻的煤油味！为了不浪费钱你含泪吃下，感觉胃里像有刀在割。`;
             logType = 'danger';
        }

        // 4. 精准时间跳转逻辑 (修复跳过时段问题)
        let nextP = prev.phase; 
        let nextT = prev.time;
        const isWknd = isWeekend(prev.date, prev.profession?.schedule || '965');
        
        // 基于小时数判定当前属于哪个餐次
        const currentHour = parseInt(prev.time.split(':')[0]);

        if (currentHour < 10) { 
            // 早餐结束 (07:xx -> 08:30)
            nextP = isWknd ? 'REST_AM' : 'WORK_AM';
            nextT = '08:30'; 
        } else if (currentHour >= 10 && currentHour <= 14) {
            // 午餐结束 (12:xx -> 13:00)
            nextP = isWknd ? 'REST_PM' : 'WORK_PM';
            nextT = '13:00';
        } else {
            // 晚餐结束 (18:xx -> 19:30)
            nextP = 'FREE_TIME';
            nextT = '19:30';
        }

        // 5. 返回新状态
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
            phase: nextP,
            time: nextT,
            modal: { ...prev.modal, isOpen: false }, // 关闭做饭菜单
            log: [...prev.log, { id: Date.now(), text: logText, type: logType }]
        };
    });
  };
// --- 休息日专属活动 (完善版) ---
  const handleRestDayActivity = (type: string) => {
      switch(type) {
          case 'SLEEP_IN': 
              updateStats({ physical: 25, mental: 15, satiety: -15 }, "你睡到了下午一点，醒来时阳光刺眼，分不清自己是在哪一年。"); 
              break;
          case 'LIBRARY': 
              updateStats({ mental: -15, cookingSkill: 1, physical: -5 }, "在图书馆卷了一整天考公资料，虽然一个字也没看进去，但发了朋友圈显得很努力。"); 
              break;
          case 'PART_TIME': 
              const earned = getRandomInt(150, 300);
              updateStats({ money: earned, physical: -20, mental: -10, satiety: -20 }, `周末去发传单/当人肉背景墙，赚了 ¥${earned} 的辛苦钱。`); 
              break;
          case 'MARKET': 
              updateStats({ physical: 5, satiety: -10 }, "早起去菜市场捡漏，和卖菜大妈为了两毛钱吵了十分钟，感觉战斗力爆表。"); 
              break;
          case 'BLIND_DATE': 
              if (gameState.stats.money < 500) {
                  addLog("兜里就几百块钱还想去相亲？大妈直接把你简历扔垃圾桶了。", "danger");
                  return;
              }
              if (Math.random() < 0.4) {
                  updateStats({ money: -500, mental: -30 }, "遇到了著名的“饭托”，吃了一顿 ¥500 的天价拉面后，你被拉黑了。");
              } else {
                  updateStats({ money: -200, mental: 5 }, "相亲对象很正常，甚至还有点同情你的发际线。");
                  // 几率直接认识新伴侣
                  if (gameState.flags.isSingle && Math.random() < 0.3) relActions.findPartner();
              }
              break;
          case 'HOSPITAL':
              handleHospitalVisit(); // 调用之前的医院逻辑
              return; // 医院逻辑自带时间推进，这里直接返回
      }

      // 时间推进逻辑
      setGameState(prev => {
          let nextP = prev.phase; 
          let nextT = prev.time;
          if (prev.phase === 'REST_AM') { 
              nextP = 'LUNCH'; 
              nextT = '12:00'; 
          } else { 
              nextP = 'DINNER'; 
              nextT = '18:00'; 
          }
          return { ...prev, phase: nextP, time: nextT };
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
            { 
        label: "倒掉剩下的油", 
        onClick: () => {
            setGameState(prev => ({
                ...prev,
                flags: { ...prev.flags, inventory: { ...prev.flags.inventory, oil: 0, badOil: false } }
            }));
            addLog("你把怀疑有问题的油全部倒进了下水道，虽然心疼钱，但保命要紧。", "warning");
            closeModal();
        }, 
        style: 'danger' as const 
    },
              { label: "离开", onClick: closeModal, style: 'secondary' as const }
          ]
      };
  };

 const handleChildLogic = () => {
    setGameState(prev => {
      if (prev.flags.children.length === 0) return prev;

      let milkUsed = 0;
      let totalFoodCost = 0;
      let mentalStress = 0;

      const newChildren = prev.flags.children.map(child => {
        let newHunger = child.hunger - 15; // 每天自然饿
        let newHealth = child.health;

        // 婴儿期 (0-3岁)：强力消耗奶粉和尿布
        if (child.age < 3) {
          if (prev.flags.inventory.milkPowder > milkUsed) {
            milkUsed++;
            newHunger = 100;
          } else {
            newHealth -= 20; // 没奶粉掉血极快
          }
          mentalStress += 5; // 婴儿半夜哭闹，精神压力大
        } 
        // 学龄期 (3岁以上)：直接消耗金钱（伙食费/零花钱）
        else {
          const dailyCost = child.educationStage === 'UNI' ? 100 : 50; // 大学生开销大
          totalFoodCost += dailyCost;
          newHunger = 100; // 默认给钱就能吃饱
          mentalStress += 3;
        }

        // 没交学费的后果：孩子产生自卑感，健康/精神双降
        if (child.educationStage !== 'NONE' && !child.schoolFeePaid) {
          newHealth -= 5;
          mentalStress += 10;
        }

        if (newHealth <= 0) return null; // 夭折逻辑
        return { ...child, hunger: newHunger, health: newHealth };
      }).filter(Boolean) as Child[];

      // 孩子去世的惩罚
      if (newChildren.length < prev.flags.children.length) {
        addLog("【碎钞机报废】你的孩子因为照顾不周不幸离世了...你陷入了巨大的自我怀疑。", "danger");
        return { 
          ...prev, 
          flags: { ...prev.flags, children: newChildren }, 
          stats: { ...prev.stats, mental: Math.max(0, prev.stats.mental - 60) } 
        };
      }

      if (totalFoodCost > 0) addLog(`今日养娃伙食费支出: ¥${totalFoodCost}`, "warning");
      if (milkUsed > 0) addLog(`消耗了 ${milkUsed} 罐进口奶粉，娃吃得很开心。`, "info");

      return {
        ...prev,
        stats: { 
          ...prev.stats, 
          money: prev.stats.money - totalFoodCost,
          mental: Math.max(0, prev.stats.mental - mentalStress) 
        },
        flags: {
          ...prev.flags,
          children: newChildren,
          inventory: { ...prev.flags.inventory, milkPowder: prev.flags.inventory.milkPowder - milkUsed }
        }
      };
    });
  };

// --- 核心动作：情感、资产与家庭 (魔改热梗版) ---
  const relActions = {
    findPartner: () => {
      const target = POTENTIAL_PARTNERS[getRandomInt(0, POTENTIAL_PARTNERS.length - 1)];
      setGameState(prev => ({ ...prev, flags: { ...prev.flags, partner: { ...target, affection: 15, realAffection: 5 }, isPursuing: true } }));
      addLog(`在“探探/陌陌”上滑到了【${target.name}】，备注改成了“女神”，你的舔狗生涯开始了。`, 'warning');
    },
    dateMovie: () => {
       if (gameState.stats.money < 300) { addLog("团购票都买不起，对方回了句“我去洗澡了”就再也没理你。", "danger"); return; }
       updateStats({ money: -300, mental: 10 }, "看了场爆米花烂片，全程帮她拿包、递奶茶，手都酸了，但她对你笑了一下。");
       modifyAffection(5);
    },
    dateShopping: () => {
       const partner = gameState.flags.partner;
       if (!partner) return;
       const cost = 2000 * partner.materialism;
       if (gameState.stats.money < cost) {
          modifyAffection(-20);
          showModal({
              title: "社死现场", description: `你豪气地冲向收银台大喊“刷我的卡”，结果POS机播报【余额不足】。${partner.name}翻了个白眼，发朋友圈屏蔽了你，并把你备注改为“穷逼”。`, type: 'LOVE',
              actions: [{ label: "找个地缝钻进去", onClick: closeModal, style: 'secondary' }]
          });
          return;
       }
       updateStats({ money: -cost, mental: 5 });
       modifyAffection(15);
       showModal({
           title: "ATM奴的觉醒", description: `帮${partner.name}清空了购物车(¥${cost})。虽然心在滴血，但她叫了你一声“宝”，你觉得自己是世界上最幸福的沸羊羊。`, type: 'EVENT',
           actions: [{ label: "我是自愿的！", onClick: closeModal }]
       });
    },
    confess: () => {
      const partner = gameState.flags.partner;
      if (!partner) return;
      // @ts-ignore
      const successChance = (partner.realAffection || 0) / 100; 
      if (Math.random() < successChance) {
        setGameState(prev => ({ ...prev, flags: { ...prev.flags, isPursuing: false, isSingle: false } }));
        showModal({ title: "上岸了！", description: "恭喜你，接盘成功（划掉），脱单成功！今晚不用在那自导自演了，朋友圈文案都想好了。", type: 'LOVE', actions: [{ label: "泪流满面", onClick: closeModal }] });
      } else {
        updateStats({ mental: -30, physical: -10 });
        modifyAffection(-20, -50); 
        let failReason = "你是个好人，但我现在不想谈恋爱（想谈也不找你）。";
        // @ts-ignore
        if (partner.realAffection < 0) failReason = "其实我一直把你当哥哥/提款机/司机/备胎。";
        else if (partner.affection > 80) failReason = "虽然你对我很好，但你给不了我想要的生活（指保时捷和爱马仕）。";

        showModal({
            title: "小丑竟是我自己", description: `你摆了一地的蜡烛表白，引来路人围观，${partner.name}却后退了一步：“${failReason}”`, type: 'DEATH',
            actions: [{ label: "痛彻心扉", onClick: closeModal, style: 'danger' }]
        });
      }
    },
    breakup: () => {
       setGameState(prev => ({ ...prev, flags: { ...prev.flags, partner: null, isPursuing: false, isSingle: true } }));
       updateStats({ mental: -10 }, "你提出了分手。虽然很难过，但终于不用吃泡面养别人了。");
       setGameState(prev => ({ ...prev, showRelationshipPanel: false }));
    },
    buyHouse: () => {
       if (gameState.flags.hasHouse) return;
       const down = ASSET_COSTS.HOUSE_DOWN_PAYMENT;
       if (gameState.stats.money < down) { addLog("首付不够，售楼小姐用看“臭要饭的”眼神送走了你。", "danger"); return; }
       updateStats({ money: -down, debt: (ASSET_COSTS.HOUSE_TOTAL_PRICE - down) }, "掏空六个钱包付了首付，背上30年房贷，成功入住远郊钢筋水泥鸽子笼，成为光荣的房奴。");
       setGameState(prev => ({ ...prev, flags: { ...prev.flags, hasHouse: true, parentPressure: 0, hasLoan: true } }));
    },
    buyCar: () => {
       if (gameState.flags.hasCar) return;
       const cost = ASSET_COSTS.CAR_COST;
       if (gameState.stats.money < cost) { addLog("钱不够，去买辆雅迪电动车吧，那个不堵车。", "danger"); return; }
       updateStats({ money: -cost }, "全款提了一辆“尊贵的”代步车，虽然存款归零，但在村口停车时腰杆硬了，相亲也有底气了。");
       setGameState(prev => ({ ...prev, flags: { ...prev.flags, hasCar: true } }));
    },
    repayDebt: (amount: number) => {
        if (gameState.stats.money < amount) return;
        updateStats({ money: -amount, debt: -amount });
        addLog(`提前还贷 ¥${amount}，感觉肩膀轻了一点点，离自由又近了一毫米。`, "success");
    },
    adoptChild: () => {
        if (gameState.stats.money < 5000) { addLog("领养/生育手续费/营养费至少需要5000元，没钱养什么吞金兽？", "warning"); return; }
        updateStats({ money: -5000 });
        const newChild: Child = {
            id: Date.now().toString(),
            name: Math.random() > 0.5 ? "宝宝(男)" : "宝宝(女)",
            gender: Math.random() > 0.5 ? 'boy' : 'girl',
            age: 0, educationStage: 'NONE', health: 100, hunger: 100, schoolFeePaid: false
        };
        setGameState(prev => ({ ...prev, flags: { ...prev.flags, children: [...prev.flags.children, newChild] } }));
        addLog("家里迎来了一只四脚吞金兽！你的钱包开始颤抖！", "success");
    },
    buyBabyItem: (item: any) => {
        if (gameState.stats.money < item.cost) { addLog("余额不足，孩子要饿哭了。", "danger"); return; }
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
        addLog(`含泪购买了${item.name}，这就是为人父母的代价。`, "success");
    },
    payTuition: (childId: string, cost: number) => {
        if (gameState.stats.money < cost) { addLog("学费不够，老师在家长群里点名批评你了！", "danger"); return; }
        updateStats({ money: -cost });
        setGameState(prev => ({
            ...prev,
            flags: {
                ...prev.flags,
                children: prev.flags.children.map(c => c.id === childId ? { ...c, schoolFeePaid: true } : c)
            }
        }));
        addLog(`缴纳了天价学费 ¥${cost}，感觉身体被掏空。`, "success");
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
// --- 工作处理逻辑 ---
  const handleWork = () => {
    if (!gameState.profession) return;
    const { stressFactor, healthRisk } = gameState.profession;
    const profEvent = (JOB_EVENTS as any)[gameState.profession.id];
    
    // 30% 几率触发社畜专属破事
    if (profEvent && Math.random() < 0.3) {
        const event = profEvent[getRandomInt(0, profEvent.length - 1)];
        showModal({
            title: event.title, 
            description: event.desc, 
            type: 'WORK',
            actions: event.options.map((opt: any) => ({
                label: opt.text,
                onClick: () => { 
                    // 1. 更新数值
                    updateStats(opt.changes, "面对职场PUA，你做出了选择。"); 
                    // 2. 关闭弹窗
                    closeModal(); 
                    // 3. 执行时间推进
                    finishWorkBlock();
                }
            }))
        });
    } else {
        // 普通搬砖逻辑
        const profLog = (JOB_LOGS as any)[gameState.profession.id] || ["枯燥的工作..."];
        const desc = profLog[getRandomInt(0, profLog.length - 1)];
        const actualRisk = healthRisk + (gameState.flags.disease ? 8 : 0); 
        
        // 更新属性
        updateStats({ physical: -actualRisk, mental: -stressFactor, satiety: -15 }, desc);
        // 执行时间推进
        finishWorkBlock();
    }
  };

// --- 搬砖结算逻辑 (修复跳转Bug，加入时间感知) ---
  const finishWorkBlock = () => {
    setGameState(prev => {
        // 【核心修复点】：判定是“上午搬砖”还是“下午搬砖”
        // 逻辑：如果当前 phase 是 WORK_AM，或者当前时间是早上 09:00（即便在弹窗暂停状态）
        const isMorningShift = prev.phase === 'WORK_AM' || prev.time.includes('09');

        if (isMorningShift) {
            // 上午搬砖结束 -> 去吃午饭
            return { 
                ...prev, 
                phase: 'LUNCH', 
                time: '12:00',
                log: [...prev.log, { id: Date.now(), text: ">>> 上午的砖搬完了，腰酸背痛，该去吃午饭续命了。", type: 'info' }]
            };
        } else {
            // 下午搬砖结束 -> 结算工资 -> 进入晚餐阶段
            const salary = (prev.profession?.salaryBase || 0) + getRandomInt(-50, 50); 
            const newMoney = prev.stats.money + salary;
            return { 
                ...prev, 
                stats: { ...prev.stats, money: newMoney },
                phase: 'DINNER', 
                time: '18:30',
                log: [...prev.log, { id: Date.now(), text: `【下班】今天的窝囊费 ¥${salary} 已到账，又是为资本家法拉利添砖加瓦的一天。`, type: 'success' }]
            };
        }
    });
  };
  const handleFreeTime = (action: string) => {
      switch(action) {
          case 'SPA': 
              if (gameState.stats.money < 1288) { addLog("金帝皇洗脚城也是有门槛的，攒够钱再来点88号技师吧。", "danger"); return; }
              updateStats({ money: -1288, physical: 25, mental: 20 }, "在金帝皇洗脚城点了尊贵帝王套。88号技师的手法让你灵魂升天，临走时还加了微信。");
              break;
          case 'STREAMER': 
              if (gameState.stats.money < 1000) { addLog("没钱刷礼物，被房管禁言了。", "warning"); return; }
              const newCount = gameState.flags.streamerSimpCount + 1;
              setGameState(prev => ({ ...prev, flags: { ...prev.flags, streamerSimpCount: newCount } }));
              updateStats({ money: -1000, mental: 15 }, "刷了一个嘉年华！女神终于念了你的名字，虽然念错了。");
              if (newCount >= 3 && Math.random() < 0.4) { triggerStreamerEvent(); return; }
              break;
          case 'BBQ': updateStats({ money: -100, physical: -5, mental: 10, satiety: 30 }, "路边摊狂撸‘科技与狠活’，每一口都是化学元素周期表的味道，真香！"); break;
          case 'SQUARE_DANCE': updateStats({ physical: 5, mental: 5, satiety: -5 }, "混入大妈的队伍跳广场舞，试图寻找富婆，未果。"); break;
          case 'MOVIE':
              if (gameState.stats.money < 50) { addLog("团购票都买不起。", "warning"); return; }
              updateStats({ money: -50, mental: 15 }, "去私人影院看了一部只有两个人能看懂的电影，心情复杂。");
              break;
          case 'INTERNET_CAFE':
              if (gameState.stats.money < 20) { addLog("网费不足，被网管赶出来了。", "warning"); return; }
              updateStats({ money: -20, mental: 20, physical: -5 }, "在网吧通宵，仿佛回到了‘三和挂壁’的快乐时光，大喊一声：网管，加钟！");
              break;
          case 'WALK':
              updateStats({ mental: 5, physical: 2, satiety: -5 }, "在江边City Walk（其实是该溜子），看着对岸买不起的豪宅，立志下辈子投个好胎。");
              break;
          case 'HOME':
              updateStats({ mental: 5, physical: 5 }, "我在家躺平，我为国家省资源。刷了一整天土味视频。");
              break;
      }
      if (gameState.phase !== 'MODAL_PAUSE') setGameState(prev => ({ ...prev, phase: 'SLEEP', time: '23:30' }));
  };
  const handleSleep = () => {
    // 建议放在 handleSleep 的开头
  if (gameState.flags.children.length > 0 && Math.random() < 0.05) {
      const child = gameState.flags.children[getRandomInt(0, gameState.flags.children.length - 1)];
      showModal({
          title: "娃又整活了",
          description: `${child.name} 在学校把同学的鼻梁骨打歪了/把老师的保时捷划了。对方家长要求赔偿医药费/维修费 ¥5000。`,
          type: 'LOVE', // 借用 LOVE 图标，其实是家庭事件
          actions: [
              { label: "含泪赔钱 (-¥5000)", onClick: () => { updateStats({ money: -5000, mental: -20 }); closeModal(); } },
              { label: "拒不赔钱 (精神大崩)", onClick: () => { updateStats({ mental: -50 }); addLog("你成了校门口著名的赖账家长，每天接孩子都被指指点点。", "danger"); closeModal(); } }
          ]
      });
      return; // 暂停后续结算
  }
    // 1. 优先处理住院逻辑 (如果 hospitalDays > 0，则进入强制住院流程)
    if (gameState.flags.hospitalDays > 0) {
        const { hospitalDays, hospitalDailyCost } = gameState.flags;
        // 扣除今日住院费
        const newMoney = gameState.stats.money - hospitalDailyCost;
        
        // 没钱治病的死亡判定
        if (newMoney < -20000 && !gameState.flags.hasHouse) {
             triggerDeath("欠费停药。因长期拖欠医疗费，你被保安扔出了医院，在寒风中咽下了最后一口气。"); 
             return;
        }

        // 更新状态：扣钱、回血
        updateStats({ money: -hospitalDailyCost, physical: 25 });
        const nextDays = hospitalDays - 1;
        
        // 判断是否出院
        if (nextDays <= 0) {
            // 出院：清除标记，恢复自由
            setGameState(prev => ({
                ...prev,
                flags: { ...prev.flags, hospitalDays: 0, hospitalDailyCost: 0, disease: null },
                phase: 'MORNING',
                date: new Date(prev.date.getTime() + 86400000)
            }));
            showModal({ title: "康复出院", description: "虽然钱包空了，但好歹捡回一条命。医生叮嘱你别再作死了。", type: 'EVENT', actions: [{ label: "活着真好", onClick: closeModal }] });
        } else {
            // 继续住院：只推进日期，Phase 保持或者在 UI 层锁死
            setGameState(prev => ({
                ...prev,
                flags: { ...prev.flags, hospitalDays: nextDays },
                date: new Date(prev.date.getTime() + 86400000),
                phase: 'MORNING' // 第二天早上
            }));
        }
        return; // 住院期间，跳过后续所有普通结算
    }

    // 2. 黑色面包车逻辑 (App 18: 体检后身体太好会被抓走)
    const { knownHealth, blackVanRisk } = gameState.flags;
    if (blackVanRisk > 0 && gameState.stats.physical > 97) {
        if (Math.random() < (blackVanRisk / 100)) {
            triggerDeath("你在睡梦中听到撬锁声，随后眼前一黑。醒来时发现自己躺在冰冷的手术台上。（死因：身体太好被特招了）");
            return;
        }
        // 没被抓走，风险增加
        setGameState(prev => ({ ...prev, flags: { ...prev.flags, blackVanRisk: Math.min(100, prev.flags.blackVanRisk + 5) } }));
    }

    // 3. 基础生存判定 (热梗文案版)
    let debtLimit = -20000;
    if (gameState.flags.hasHouse) debtLimit -= 1500000; // 有房可以欠更多
    if (gameState.stats.money < debtLimit) { triggerDeath("征信黑名单。你被列为失信被执行人，不仅坐不了高铁，连外卖都点不起了，绝望之下重开。"); return; }
    if (gameState.stats.physical <= 0) { triggerDeath("ICU一日游。长期996福报让你身体透支，为了那点窝囊费把命搭进去了。"); return; }
    if (gameState.stats.mental <= 0) { triggerDeath("彻底疯了。你光着身子冲上大街高喊‘我没疯，我要上班’，最后被送进宛平南路600号。"); return; }
    if (gameState.stats.satiety <= 0) { triggerDeath("饿死街头。在全面小康的时代，你凭实力把自己饿死了，也是一种本事。"); return; }

    // 4. 随机暴毙 (3% 概率)
    if (Math.random() < 0.003) {
         triggerDeath(`【飞来横祸】${DAILY_ACCIDENTS[getRandomInt(0, DAILY_ACCIDENTS.length - 1)]}`); return;
    }

    // --- 关键点：疾病触发判定 ---
    // 逻辑：如果没有生病，且随机数 < 0.05 (5%概率)，或者身体极差时概率提升
    const sickChance = gameState.stats.physical < 40 ? 0.2 : 0.05;

    if (!gameState.flags.disease && Math.random() < sickChance) {
         const disease = DISEASES[getRandomInt(0, DISEASES.length - 1)];
         // 医保计算逻辑
         const hasInsurance = gameState.flags.hasInsurance;
         const actualAdmission = hasInsurance ? Math.floor(disease.admission * 0.3) : disease.admission;
         const actualDaily = hasInsurance ? Math.floor(disease.daily * 0.3) : disease.daily;
         const insuranceText = hasInsurance ? '(医保已报销)' : '(自费)';

         showModal({
           title: "突发恶疾", 
           description: `确诊【${disease.name}】。${disease.desc}\n需治疗费/押金: ¥${actualAdmission} ${insuranceText}`, 
           type: 'DISEASE',
           actions: [
             { 
                label: disease.days > 0 ? `办理住院 (需${disease.days}天)` : "门诊治疗", 
                onClick: () => {
                    if (gameState.stats.money >= actualAdmission) {
                        updateStats({ money: -actualAdmission });
                        
                        // 【这里是进入住院状态的关键】
                        if (disease.days > 0) {
                             setGameState(prev => ({ 
                                 ...prev, 
                                 flags: { 
                                     ...prev.flags, 
                                     disease: disease.name, 
                                     hospitalDays: disease.days, // 设置住院天数
                                     hospitalDailyCost: actualDaily // 设置每日扣费
                                 }, 
                                 phase: 'SLEEP' // 保持在结算状态，等待 UI 渲染住院界面
                             }));
                             closeModal();
                        } else {
                             // 小病，治好就行
                             closeModal();
                        }
                    } else {
                        triggerDeath("没钱交押金，被保安扔出医院，病情恶化死在出租屋里。");
                    }
                },
                style: 'primary'
             },
             {
                 label: "放弃治疗 (赌命)",
                 onClick: () => {
                     closeModal();
                     // 重病放弃治疗直接死
                     if (disease.harm > 30) triggerDeath(`放弃治疗【${disease.name}】，你在极度痛苦中离世。`);
                     else {
                         // 轻病硬抗，带病生存
                         setGameState(prev => ({ ...prev, flags: { ...prev.flags, disease: disease.name } }));
                         addLog(`你选择了硬抗【${disease.name}】，身体状况每况愈下。`, "danger");
                     }
                 }, style: 'secondary'
             }
           ]
         });
         return; // 触发疾病弹窗后，暂停后续结算
    }

    // 6. 子女成长逻辑
    handleChildLogic();

    // 7. 负债利息结算
    if (gameState.stats.debt > 0) {
        const interest = Math.floor(gameState.stats.debt * 0.0005);
        updateStats({ money: -interest });
        addLog(`支付了今日房贷/车贷利息: ¥${interest}`, "warning");
    }

    // 8. 正常结算与日期推进
    updateStats({ physical: 5, mental: 5, satiety: -20 });
    const nextDate = new Date(gameState.date);
    nextDate.setDate(nextDate.getDate() + 1);
    
    // 生日与升学逻辑
// 在 handleSleep 最后的日期推进逻辑中
    if (gameState.stats.daysSurvived > 0 && gameState.stats.daysSurvived % 365 === 0) {
        updateStats({ age: gameState.stats.age + 1 });
        
        setGameState(prev => ({
            ...prev,
            flags: {
                ...prev.flags,
                children: prev.flags.children.map(c => {
                    const newAge = c.age + 1;
                    let nextStage = c.educationStage;
                    
                    // 阶段判定
                    if (newAge === 3) nextStage = 'KINDER';
                    if (newAge === 7) nextStage = 'PRIMARY';
                    if (newAge === 13) nextStage = 'MIDDLE';
                    if (newAge === 16) nextStage = 'HIGH';
                    if (newAge === 19) nextStage = 'UNI';
                    
                    // 每年学费重置为未缴纳
                    return { ...c, age: newAge, educationStage: nextStage, schoolFeePaid: false };
                })
            }
        }));
        
        // 弹窗提示：学费压力
        const schoolCount = gameState.flags.children.filter(c => c.age >= 3).length;
        if (schoolCount > 0) {
            showModal({
                title: "开学季的噩梦",
                description: `又到了一年一度的开学季。你看着家里的 ${schoolCount} 个吞金兽，再看看存折，感觉到一阵窒息。请尽快前往家庭中心缴纳学费，否则孩子将被劝退。`,
                type: 'EVENT',
                actions: [{ label: "知道了 (含泪搬砖)", onClick: closeModal }]
            });
        }
    }

    setGameState(prev => ({ 
        ...prev, 
        date: nextDate, phase: 'MORNING', time: '07:00',
        stats: {...prev.stats, daysSurvived: prev.stats.daysSurvived + 1}
    }));
  };
  
  // --- 饮食主入口 ---
// --- 饮食处理逻辑 (彻底修复跳时间Bug版) ---
  const handleEat = (type: string) => {
      // 1. 数值更新 (热梗文案)
      if (type === 'SKIP') {
          updateStats({ satiety: -15, mental: -10, physical: -5 }, "光合作用失败。你决定修仙不吃饭，省下的30块钱离法拉利又近了一步。");
      }
      else if (type === 'TAKEOUT') {
          updateStats({ money: -30, satiety: 40, physical: -2 }, "吃了份拼好饭。虽然是海克斯科技预制菜，但僵尸肉的口感让你感到了活着的尊严。");
      }
      else if (type === 'COOK_MENU') {
          // 仅打开菜单，不做时间跳转，跳转在 doCook 中处理
          const config = getKitchenModalConfig(gameState.flags.inventory, gameState.stats.money);
          showModal(config);
          return; 
      }

      // 2. 核心时间推进：根据【当前阶段】精准跳转到【下一阶段】
      setGameState(prev => {
          let nextP = prev.phase; 
          let nextT = prev.time;
          
          // 判断是否是周末
          const isWknd = isWeekend(prev.date, prev.profession?.schedule || '965');

          // 使用严格的阶段判断
          switch (prev.phase) {
              case 'MORNING':
                  // 早餐吃完 -> 去上午搬砖/休息
                  nextP = isWknd ? 'REST_AM' : 'WORK_AM';
                  nextT = '09:00';
                  break;
              case 'LUNCH':
                  // 午餐吃完 -> 去下午搬砖/休息
                  nextP = isWknd ? 'REST_PM' : 'WORK_PM';
                  nextT = '13:00';
                  break;
              case 'DINNER':
                  // 晚餐吃完 -> 进入夜生活
                  nextP = 'FREE_TIME';
                  nextT = '20:00';
                  break;
              default:
                  // 如果在非用餐阶段误触，保持原样或保守推进
                  break;
          }

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
                                <span className="text-xl font-bold tracking-[0.2em] uppercase">我是牛马</span>
                                <span className="text-xs text-zinc-500 font-mono">给资本家赚法拉利</span>
                            </button>
                        )}
                        
                        {/* 2. 饮食按钮 */}
                        {(gameState.phase === 'MORNING' || gameState.phase === 'LUNCH' || gameState.phase === 'DINNER') && (
                            <>
                                <ActionBtn label="拼好饭" icon={<ShoppingBag/>} onClick={() => handleEat('TAKEOUT')} color="orange" sub="-¥30 | 也是吃上饭了" />
                                <ActionBtn label="小当家模式" icon={<Utensils/>} onClick={() => handleEat('COOK_MENU')} color="green" sub="科技与狠活" />
                                <ActionBtn label="修仙(不吃)" icon={<XCircle/>} onClick={() => handleEat('SKIP')} color="red" sub="光合作用" />
                            </>
                        )}
                        
                        {/* 3. 自由时间/周末按钮 - 赛博社畜热梗版 */}
                        {(gameState.phase === 'FREE_TIME' || gameState.phase.includes('REST')) && (
                            <>
                                {/* App 18: 医院体检 - 销金窟文案 */}
                                <ActionBtn label="去医院修仙" icon={<Activity/>} onClick={() => {
                                    const config: ModalConfig = { 
                                        isOpen: true, title: "莆田系...啊不，第一人民医院", description: "浓烈的消毒水味，这里是销金窟，也是碎钞机。请选择你的消费项目：", type: 'EVENT',
                                        actions: HOSPITAL_SERVICES.map(service => ({
                                            label: `${service.name} (¥${service.cost})`,
                                            onClick: () => {
                                                if (gameState.stats.money < service.cost) { addLog("余额不足，保安让你出门左转去百度看病。", "danger"); return; }
                                                updateStats({ money: -service.cost });
                                                if (service.id === 'checkup') {
                                                    const realHealth = gameState.stats.physical;
                                                    setGameState(prev => ({ ...prev, flags: { ...prev.flags, lastCheckupDate: formatDateCN(prev.date), knownHealth: realHealth, blackVanRisk: realHealth > 97 ? (prev.flags.blackVanRisk || 10) : 0 } }));
                                                    showModal({ title: "体检审判书", description: `你的肉体评分: ${realHealth}/200\n结论: ${realHealth > 150 ? '唐僧肉转世！已被大佬盯上。' : '典型的脆皮大学生/社畜体质，建议重开。'}`, type: 'EVENT', actions: [{ label: "这就去养生", onClick: closeModal }] });
                                                } else if (service.effect) {
                                                    // @ts-ignore
                                                    updateStats(service.effect); closeModal();
                                                } else closeModal();
                                            }
                                        }))
                                    };
                                    config.actions.push({ label: "润了，治不起", onClick: closeModal, style: 'secondary' });
                                    showModal(config);
                                }} color="teal" sub="甚至想挂个急诊" />
                               {/* 4. 周末/休息日专属操作面板 */}
                        {gameState.phase.includes('REST') && (
                            <>
                                {/* 上午特有选项 */}
                                {gameState.phase === 'REST_AM' && (
                                    <>
                                        <ActionBtn label="睡死过去" icon={<Moon/>} onClick={() => handleRestDayActivity('SLEEP_IN')} color="indigo" sub="回血/回神" />
                                        <ActionBtn label="早市捡漏" icon={<ShoppingBag/>} onClick={() => handleRestDayActivity('MARKET')} color="green" sub="省钱/健康" />
                                    </>
                                )}

                                {/* 下午特有选项 */}
                                {gameState.phase === 'REST_PM' && (
                                    <>
                                        <ActionBtn label="去图书馆卷" icon={<Users/>} onClick={() => handleRestDayActivity('LIBRARY')} color="teal" sub="考公/考证" />
                                        <ActionBtn label="周末兼职" icon={<Briefcase/>} onClick={() => handleRestDayActivity('PART_TIME')} color="orange" sub="赚外快" />
                                    </>
                                )}

                                {/* 通用周末选项 */}
                                <ActionBtn label="相亲角受辱" icon={<Heart/>} onClick={() => handleRestDayActivity('BLIND_DATE')} color="pink" sub="-¥200/500" />
                                <ActionBtn label="去医院修仙" icon={<Activity/>} onClick={handleHospitalVisit} color="teal" sub="健康管理" />
                                <ActionBtn label="打开家庭中心" icon={<Home/>} onClick={() => setGameState(p => ({...p, showRelationshipPanel: true}))} color="zinc" sub="看娃/理财" />
                                <ActionBtn label="做顿好的" icon={<Utensils/>} onClick={() => handleEat('COOK_MENU')} color="green" sub="大厨模式" />
                            </>
                        )}
                                {/* App 17: 魔改娱乐项目 */}
                                <ActionBtn label="金帝皇洗脚城" icon={<Footprints/>} onClick={() => handleFreeTime('SPA')} color="pink" sub="-¥1288 | 帝王套" />
                                <ActionBtn label="守护最好的Gigi" icon={<Heart/>} onClick={() => handleFreeTime('STREAMER')} color="purple" sub="-¥1000 | 沸羊羊" />
                                <ActionBtn label="海克斯科技烧烤" icon={<Beer/>} onClick={() => handleFreeTime('BBQ')} color="orange" sub="-¥100 | 喷射战士" />
                                <ActionBtn label="三和挂壁网吧" icon={<MonitorPlay/>} onClick={() => handleFreeTime('INTERNET_CAFE')} color="indigo" sub="-¥20 | 大神" />
                                <ActionBtn label="私人影院" icon={<Users/>} onClick={() => handleFreeTime('MOVIE')} color="zinc" sub="-¥50 | 懂的都懂" />
                                <ActionBtn label="混入广场舞" icon={<Dumbbell/>} onClick={() => handleFreeTime('SQUARE_DANCE')} color="zinc" sub="寻找富婆" />
                                <ActionBtn label="Gai溜子" icon={<Footprints/>} onClick={() => handleFreeTime('WALK')} color="zinc" sub="City Walk" />
                                <ActionBtn label="家里蹲" icon={<Home/>} onClick={() => handleFreeTime('HOME')} color="zinc" sub="彻底摆烂" />
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
