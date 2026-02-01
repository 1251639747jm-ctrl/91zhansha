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
  const [playerName, setPlayerName] = useState("王小二");
  const [gameState, setGameState] = useState<GameState>({
    profession: null,
    background: null,
    playerName: "未命名",
    workPerformance: 0, // 工作表现，影响工资
    workRounds: 0,      // 当前工作轮次
    deathHistory: JSON.parse(localStorage.getItem('death_records') || '[]'), // 从本地读取死者档案
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
  // 新增：全局数值监控，一旦数值归零立即触发死亡
useEffect(() => {
  if (gameState.phase === 'START' || gameState.phase === 'GAME_OVER' || gameState.phase === 'MODAL_PAUSE') return;

  const { physical, mental, satiety, money, debt } = gameState.stats;
  
  // 1. 体力斩杀
  if (physical <= 0) {
    triggerDeath("【猝死】你眼前的屏幕突然变成了一片漆黑，耳边最后的声响是同事推搡你的惊呼。你为了那点窝囊费，燃尽了最后一点生命的灯油。");
  }
  // 2. 精神斩杀
  else if (mental <= 0) {
    triggerDeath("【精神失常】你无法再忍受永无止境的表格和PUA，你当众撕碎了所有合同，狂笑着冲出了办公室，从此消失在城市最幽暗的角落。");
  }
  // 3. 饱食度斩杀
  else if (satiety <= 0) {
    triggerDeath("【饿死】在这个外卖半小时必达的时代，你竟然因为卡里没钱且没人接济，生生饿死在自己的出租屋里。");
  }
}, [gameState.stats.physical, gameState.stats.mental, gameState.stats.satiety, gameState.phase]);

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
  setGameState(prev => {
    let nextPhase = prev.phase;

    // 如果当前是因为弹窗暂停了，我们需要根据时间恢复到对应的操作阶段
    if (prev.phase === 'MODAL_PAUSE') {
      // 只有在 hospitalDays 大于 0（即真正办理了住院手续）时才强制 SLEEP
      // 否则根据时间恢复阶段
      if (prev.flags.hospitalDays > 0) {
        nextPhase = 'SLEEP';
      } else if (prev.time.includes('23')) {
        nextPhase = 'SLEEP';
      } else if (prev.time.includes('07') || prev.time.includes('08')) {
        nextPhase = 'MORNING';
      } else if (prev.time.includes('12')) {
        nextPhase = 'LUNCH';
      } else if (prev.time.includes('18')) {
        nextPhase = 'DINNER';
      } else {
        nextPhase = 'FREE_TIME'; 
      }
    }

    return {
      ...prev,
      phase: nextPhase,
      modal: { ...prev.modal, isOpen: false }
    };
  });
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

const triggerDeath = (reason: string) => {
    const newRecord = {
        name: gameState.playerName,
        age: gameState.stats.age,
        profession: gameState.profession?.name,
        reason: reason,
        date: new Date().toLocaleDateString()
    };
    const history = JSON.parse(localStorage.getItem('death_records') || '[]');
    const updatedHistory = [newRecord, ...history].slice(0, 5);
    localStorage.setItem('death_records', JSON.stringify(updatedHistory));

    setGameState(prev => ({ 
      ...prev, 
      deathHistory: updatedHistory, // 同步更新内存中的历史记录
      phase: 'MODAL_PAUSE',
      modal: {
        isOpen: true, type: 'DEATH', title: '人生重启', description: reason,
        actions: [{ 
          label: "接受命运", 
          onClick: () => setGameState(p => ({ 
            ...p, 
            phase: 'GAME_OVER', 
            gameOverReason: reason, 
            modal: { ...p.modal, isOpen: false } 
          })), 
          style: 'danger' 
        }]
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
    const finalAge = tempAge; // 锁定当前看到的年龄
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
        age: finalAge 
    };
    const initialChildren = generateInitialChildren(finalAge);
    setGameState({
      profession: prof,
      background: bg,
      playerName: playerName,
      stats: startStats,
      phase: 'MORNING',
      date: new Date('2024-01-01T07:30:00'),
      time: '07:30',
      log: [
        { id: 1, text: `>>> 档案载入完毕。年龄：${finalAge}岁。身份：${prof.name}。背景：${bg.name}。`, type: 'info' },
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
// --- 医院结算辅助逻辑：确保看病后时间正常推进 ---
const finishHospitalBlock = () => {
  setGameState(prev => {
    let nextP = prev.phase;
    let nextT = prev.time;
    const currentHour = parseInt(prev.time.split(':')[0]);

    if (currentHour < 11) { 
        nextP = 'LUNCH'; // 早上看完病，该吃午饭了
        nextT = '12:00';
    } else if (currentHour >= 11 && currentHour <= 17) {
        nextP = 'DINNER'; // 下午看完病，该吃晚饭了
        nextT = '18:30';
    } else {
        nextP = 'SLEEP'; // 晚上看完病，该睡觉了
        nextT = '23:30';
    }
    // 重点：手动关闭 Modal 并更新 Phase
    return { ...prev, phase: nextP, time: nextT, modal: { ...prev.modal, isOpen: false } };
  });
};

// --- 完整版：医院访问逻辑 (含体检、停尸间、时间推进) ---
  const handleHospitalVisit = () => {
    const config: ModalConfig = {
      isOpen: true,
      title: "市第一人民医院",
      description: "浓烈的消毒水味扑面而来。走廊里挤满了人，墙上贴着标语：‘今天工作不努力，明天开除送这里。’",
      type: 'EVENT',
      actions: [
        // 1. 动态生成常量中的医疗服务列表
        ...HOSPITAL_SERVICES.map(service => ({
          label: `${service.name} (¥${service.cost})`,
          onClick: () => {
            // 检查余额
            if (gameState.stats.money < service.cost) {
              addLog("余额不足。挂号处大妈面无表情地指了指门外的共享单车，示意你赶紧润。", "danger");
              return;
            }
            
            // 扣费
            updateStats({ money: -service.cost });

            // A. 如果是体检服务
            if (service.id === 'checkup') {
              const realHealth = gameState.stats.physical;
              let resultDesc = "";
              
              if (realHealth > 150) resultDesc = "这肉体简直是人类进化奇迹！(医生悄悄拍了张你的照片发到了暗网)";
              else if (realHealth > 97) resultDesc = "身体素质极佳。医生看你的眼神就像看一块极品五花肉。";
              else if (realHealth < 40) resultDesc = "身体状况极差，建议直接去二楼尽头订个柜子，别费钱治了。";
              else resultDesc = "典型的社畜体质：颈椎反弓、腰椎突出、重度脂肪肝。";

              // 激活数据与风险
              setGameState(prev => ({
                ...prev,
                flags: {
                  ...prev.flags,
                  lastCheckupDate: formatDateCN(prev.date),
                  knownHealth: realHealth,
                  // SSR体质激活黑面包车风险 (基础10%)
                  blackVanRisk: realHealth > 97 ? Math.max(prev.flags.blackVanRisk, 10) : 0
                }
              }));

              showModal({
                title: "体检审判书",
                description: `【核心体质】：${realHealth} / 200\n【结论】：${resultDesc}\n${realHealth > 97 ? '⚠️ 注意：你已被列入“生物资产”重点观察名单。' : ''}`,
                type: 'EVENT',
                actions: [{ 
                  label: "我知道了", 
                  onClick: () => { finishHospitalBlock(); closeModal(); } 
                }]
              });
            } 
            // B. 正常治疗服务
            else {
              if ((service as any).effect) {
                // @ts-ignore
                updateStats(service.effect, `进行了【${service.name}】。`);
              }
              finishHospitalBlock();
              closeModal();
            }
          }
        })),

        // 2. 停尸间逻辑 (读取 LocalStorage)
        {
  label: "二楼尽头：停尸间",
  style: 'secondary' as const,
  onClick: () => {
    const history = JSON.parse(localStorage.getItem('death_records') || '[]');
    
    // 生成格式化的档案列表
    const mortuaryUI = history.length > 0 
      ? history.map((d: any, i: number) => (
          `--------------------------\n` +
          `【 尸体编号：#00${i + 1} 】\n` +
          ` 姓名：${d.name}\n` +
          ` 职业：${d.profession}\n` +
          ` 寿命：${d.age} 岁\n` +
          ` 结论：${d.reason}\n` +
          ` 销户日期：${d.date}`
        )).join('\n')
      : "这里空荡荡的，只有冷风吹过。\n（目前还没有死亡记录）";

    showModal({
      title: "☣️ 圣玛丽医院·地下冷库",
      description: `这里保存着被社会“淘汰”的生物资产：\n\n${mortuaryUI}\n\n--------------------------`,
      type: 'EVENT', // 这里的图标会变成 AlertOctagon 或者其他定义的图标
      actions: [{ label: "离开这股死人味", onClick: closeModal }]
    });
  }
},

        // 3. 退出按钮
        { 
          label: "润了，治不起", 
          onClick: closeModal, 
          style: 'secondary' as const 
        }
      ]
    };

    // 开启弹窗并暂停游戏
    setGameState(prev => ({ ...prev, phase: 'MODAL_PAUSE', modal: config }));
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

const doCook = (recipe: typeof RECIPES[0]) => {
    setGameState(prev => {
      const { inventory } = prev.flags;
      const { needs } = recipe;
      
      // 1. 检查食材是否足够 (逻辑：油检查 0.1，其他按原需求)
      const missingItems: string[] = [];
      Object.keys(needs).forEach(k => {
          const required = k === 'oil' ? 0.1 : (needs[k] || 0);
          // @ts-ignore
          if ((inventory[k] || 0) < required) {
              missingItems.push(k);
          }
      });

      if (missingItems.length > 0) {
          return {
              ...prev,
              modal: { 
                  ...prev.modal, 
                  title: "食材不足", 
                  description: `做【${recipe.name}】还缺：${missingItems.join(', ')}\n当前油量: ${inventory.oil.toFixed(1)} 桶` 
              }
          };
      }

      // 2. 扣除食材库存
      const newInv = { ...inventory };
      Object.keys(needs).forEach(k => {
          if (k === 'oil') {
              // 每次用 0.1 桶，并解决 JS 精度问题
              newInv.oil = Math.max(0, parseFloat((newInv.oil - 0.1).toFixed(1)));
          } else {
              // @ts-ignore
              newInv[k] -= needs[k];
          }
      });
      
      // 【核心修复】：油用光了，自动清除坏油标记
      if (newInv.oil <= 0) {
          newInv.badOil = false;
      }

      // 3. 煤油/坏油中毒判定
      let healthHit = 0;
      let logText = `你展示了精湛的厨艺，烹饪了【${recipe.name}】，色香味俱全！`;
      let logType: LogEntry['type'] = 'success';

      // 只要这桶油是坏的，且你还在用它做饭，每顿都扣血
      if (needs.oil && inventory.badOil) {
           healthHit = 35; // 每次中毒扣 35 血
           logText = `【海克斯科技残留】这桶坏油还没用完！做出来的${recipe.name}有股刺鼻的煤油味，吃完你感觉胃部像被火烧一样。`;
           logType = 'danger';
      }

      // 4. 精准时间跳转逻辑
      let nextP = prev.phase; 
      let nextT = prev.time;
      const isWknd = isWeekend(prev.date, prev.profession?.schedule || '965');
      const currentHour = parseInt(prev.time.split(':')[0]);

      if (currentHour < 10) { 
          // 早餐后 -> 上午工作/休息
          nextP = isWknd ? 'REST_AM' : 'WORK_AM';
          nextT = '08:30'; 
      } else if (currentHour >= 10 && currentHour <= 14) {
          // 午餐后 -> 下午工作/休息
          nextP = isWknd ? 'REST_PM' : 'WORK_PM';
          nextT = '13:00';
      } else {
          // 晚餐后 -> 自由时间
          nextP = 'FREE_TIME';
          nextT = '19:30';
      }

      // 5. 更新状态
      return {
          ...prev,
          stats: { 
              ...prev.stats, 
              satiety: Math.min(100, prev.stats.satiety + recipe.stats.satiety),
              mental: Math.min(100, prev.stats.mental + recipe.stats.mental),
              // 扣除中毒伤害
              physical: Math.max(0, prev.stats.physical + (recipe.stats.health || 0) - healthHit),
              cookingSkill: (prev.stats.cookingSkill || 0) + 1
          },
          flags: { ...prev.flags, inventory: newInv },
          phase: nextP,
          time: nextT,
          modal: { ...prev.modal, isOpen: false }, 
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
          description: `资金: ¥${money}\n库存：油x${inv.oil.toFixed(1)} ${inv.badOil?'(有怪味)':''} | 米面x${inv.rice} | 蔬x${inv.veggies} | 肉x${inv.meat}`,
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
        addLog("你把那桶散发着煤油味的毒药倒进了下水道，感觉呼吸都顺畅了。", "warning");
        closeModal();
    }, 
    style: 'danger' 
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
   const totalPrice = 3000000; // 总价300万
   const currentMoney = gameState.stats.money;
   
   // 逻辑：有多少钱扣多少钱作为首付，剩下的全部变债务
   const downPayment = Math.max(0, currentMoney); 
   const loanAmount = totalPrice - downPayment;

   updateStats({ 
       money: -downPayment, 
       debt: loanAmount, 
       mental: -30 
   }, "你签下了那份长达30年的卖身契。即便兜里没钱，银行也贴心地为你办理了‘零首付’非法贷，你正式成为了尊贵的房奴。");
   
   setGameState(prev => ({ ...prev, flags: { ...prev.flags, hasHouse: true, hasLoan: true, parentPressure: 0 } }));
},

buyCar: () => {
   if (gameState.flags.hasCar) return;
   const carPrice = 200000; // 20万
   const currentMoney = gameState.stats.money;

   // 逻辑：同上，不够的钱全算贷款
   const payByCash = Math.max(0, Math.min(currentMoney, carPrice));
   const payByLoan = carPrice - payByCash;

   updateStats({ 
       money: -payByCash, 
       debt: payByLoan 
   }, "销售小姐笑靥如花，为你办理了‘零首付’提车。即便卡里是0，你也能开上这辆让你腰杆变硬（但口袋空空）的铁壳子。");
   
   setGameState(prev => ({ ...prev, flags: { ...prev.flags, hasCar: true, hasLoan: true } }));
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
const handleWork = () => {
      setGameState(prev => ({ ...prev, workRounds: 1 }));
      addLog("你坐在了工位上，感受着空气中弥漫的PUA气息，工作开始了。", "info");
  };
const handleWorkChoice = (type: 'SLACK' | 'HARD') => {
    const isHard = type === 'HARD';
    
    // 1. 先扣除属性（即时更新）
    updateStats({
      physical: isHard ? -12 : -4,
      mental: isHard ? -8 : 6,   // 摸鱼回神
      satiety: -8
    }, isHard ? "你疯狂内卷，试图引起老板的注意，但只引起了腰椎间盘的注意。" : "你熟练地切换到桌面背景，开启带薪摸鱼模式，精神得到了升华。");

    // 2. 更新表现和轮次
    setGameState(prev => {
      const newPerformance = (prev.workPerformance || 0) + (isHard ? 20 : -10);
      const newRounds = (prev.workRounds || 0) + 1;

      // 如果达到3轮，执行结算
      if (newRounds >= 3) {
        // 使用 setTimeout 确保结算在当前 State 更新完成后触发
        setTimeout(() => finishWorkBlock(newPerformance), 50);
        return { 
          ...prev, 
          workRounds: 0, 
          workPerformance: 0 
        };
      }

      return { 
        ...prev, 
        workRounds: newRounds, 
        workPerformance: newPerformance 
      };
    });
  };

const finishWorkBlock = (finalPerformance: number) => {
    setGameState(prev => {
      // 判定是上午还是下午
      const isMorningShift = prev.phase === 'WORK_AM';
      
      // 计算这一趟下来的工资：底薪 * 表现倍率 (表现0为100%，表现60为160%，表现-30为70%)
      const baseSalary = prev.profession?.salaryBase || 0;
      const performanceBonus = 1 + (finalPerformance / 100);
      const earnedSalary = Math.floor(baseSalary * performanceBonus);

      if (isMorningShift) {
          // 上午下班：直接去吃饭，不领钱，不加班
          return { 
              ...prev, 
              phase: 'LUNCH', 
              time: '12:00',
              log: [...prev.log, { id: Date.now(), text: ">>> 上午的任务勉强应付完了，领饭盒去！", type: 'info' }]
          };
      } else {
          // 下午下班：领钱 + 判定加班
          const schedule = prev.profession?.schedule || '965';
          const isOvertimeCulture = schedule.includes('996') || schedule.includes('007');
          // 概率设定：996职种85%概率加班，普通职种20%
          const overtimeChance = isOvertimeCulture ? 0.85 : 0.2;
          
          if (Math.random() < overtimeChance) {
              // --- 触发加班流程 ---
              showModal({
                  title: "【老板的夺命连环Call】",
                  description: `你刚拎起包，老板发来语音：“那个方案，客户说要五彩斑斓的黑，今晚改不出来别走。” \n\n 今天的窝囊费 ¥${earnedSalary} 已在结算中。`,
                  type: 'WORK',
                  actions: [{ 
                      label: "含泪坐回工位", 
                      onClick: () => {
                          // 加班扣属性，同时把钱加进去
                        if (gameState.stats.physical < 30 && Math.random() < 0.3) {
        triggerDeath(`【过劳死】凌晨两点，你眼前的Excel表格开始重叠，心脏传来一阵剧烈的刺痛。你试图呼救，但空荡荡的办公室只有自动饮水机加热的声音。（死因：长期极限加班导致的心源性猝死）`);
        return;
    }
                          updateStats({ 
                              money: earnedSalary, 
                              physical: -25, 
                              mental: -25, 
                              satiety: -15 
                          }, `你被迫加班到深夜。总算拿到了今天的 ¥${earnedSalary}。`);
                          
                          // 强制推进时间到 22:45
                          setGameState(p => ({ ...p, phase: 'DINNER', time: '22:45' }));
                          closeModal();
                      } 
                  }]
              });
              return prev; // 返回 prev 等待弹窗点击
          }

          // --- 正常下班流程 ---
          addLog(`【准时下班】今日无事，领取窝囊费 ¥${earnedSalary}。快跑，别回头！`, "success");
          return { 
              ...prev, 
              stats: { ...prev.stats, money: prev.stats.money + earnedSalary },
              phase: 'DINNER', 
              time: '18:30'
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
    let debtLimit = -20000;
    if (gameState.flags.hasHouse) debtLimit -= 1500000;
    if (gameState.stats.money < debtLimit) { triggerDeath("【破产】由于资不抵债，你被列入失信名单。"); return; }
    // 注意：physical/mental 的检查现在由上面的 useEffect 接管，这里可以保留作为双重保险

    // B. 随机暴毙（提到前面）
    if (Math.random() < 0.003) {
         triggerDeath(`【飞来横祸】${DAILY_ACCIDENTS[getRandomInt(0, DAILY_ACCIDENTS.length - 1)]}`); return;
    }
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
      if (Math.random() < 0.01) {
    const accidents = [
        "实习护士在玩手机，不小心把你的营养液和洁厕灵搞混了。",
        "主治医生昨晚打麻将输了钱，做手术时手抖得像在蹦迪，顺手切了你点别的。",
        "医院电路老化，你所在的楼层因为欠费停电，呼吸机停止转动的那一刻，你甚至觉得很安静。"
    ];
    triggerDeath(`【医疗事故】${accidents[getRandomInt(0, accidents.length - 1)]}`);
    return;
}
    const { hospitalDays, hospitalDailyCost, partner, children } = gameState.flags;
    const currentMoney = gameState.stats.money;

    // --- 新增：拔氧气罐判定 ---
    // 逻辑：如果余额为负且没有房产作为抵押，或者存款低于每日开销
    if (currentMoney < hospitalDailyCost) {
        // 如果有伴侣且亲密度极低，伴侣可能会主动拔管
        if (partner && (partner.realAffection || 0) < 0) {
            triggerDeath(
                `【医患纠纷（物理）】你躺在ICU意识模糊时，听见${partner.name}在和医生争吵：‘这每天几千块的烧钱，我下半辈子怎么过？’ 随后你感觉到氧气罩被一只熟悉的手猛地扯掉，监护仪发出了刺耳的长鸣。（死因：亲密度过低导致的‘大义灭亲’）`
            );
            return;
        }

        // 如果是孤家寡人且没钱
        if (!partner && children.length === 0) {
            triggerDeath(
                `【欠费停机】医院财务处在系统里点击了‘终止治疗’。由于你没有直系亲属担保，护士面无表情地拔掉了你的呼吸机电源，把你推到了走廊尽头的阴影里。（死因：账户余额不足导致的物理性断气）`
            );
            return;
        }
    }

    // 正常扣费逻辑
    updateStats({ money: -hospitalDailyCost, physical: 25 }, `正在住院，呼吸机每响一下，¥${hospitalDailyCost}就没了。`);
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
            triggerDeath("【匹夫无罪，怀肉其罪】由于你在体检中心留下了‘满分体质’的记录，你的数据在暗网被拍出了800万高价。深夜，一辆挂着假牌照的黑色面包车停在楼下。你醒来时只感觉到腰部一阵剧痛，身旁的医生正在缝合。他冷冷地看了你一眼：‘别喊了，你已经不是‘人’了，你现在是某位大佬延寿30年的‘电池组’。’（死因：作为全城唯一的健康社畜，你被强制执行了‘生物资产再分配’）");
            return;
        }
        // 没被抓走，风险增加
        setGameState(prev => ({ ...prev, flags: { ...prev.flags, blackVanRisk: Math.min(100, prev.flags.blackVanRisk + 20) } }));
    }

    // 3. 基础生存判定 (热梗文案版)
    let debtLimit = -20000;
    if (gameState.flags.hasHouse) debtLimit -= 1500000; // 有房可以欠更多
    if (gameState.stats.money < debtLimit) { triggerDeath("征信黑名单。你被列为失信被执行人，不仅坐不了高铁，连外卖都点不起了，绝望之下重开。"); return; }
    if (gameState.stats.physical <= 0) { triggerDeath("ICU一日游。长期996福报让你身体透支，为了那点窝囊费把命搭进去了。"); return; }
    if (gameState.stats.mental <= 0) {
    const socialDeaths = [
        "你删除了所有社交软件，拉黑了所有人，在一个雨天走进了深山，再也没有出来。",
        "你站在天台上看着霓虹灯火，觉得自己像一粒微不足道的灰尘。你决定跳下去，看看风的声音。",
        "你彻底疯了，在地铁站对着每一个穿西装的人下跪乞讨，嘴里喊着：‘老板再给次机会吧。’"
    ];
    triggerDeath(`【精神崩溃】${socialDeaths[getRandomInt(0, 2)]}`); 
    return; 
}
    if (gameState.stats.satiety <= 0) { triggerDeath("饿死街头。在全面小康的时代，你凭实力把自己饿死了，也是一种本事。"); return; }

    // 4. 随机暴毙 (3% 概率)
    if (Math.random() < 0.003) {
         triggerDeath(`【飞来横祸】${DAILY_ACCIDENTS[getRandomInt(0, DAILY_ACCIDENTS.length - 1)]}`); return;
    }

// --- 找到 handleSleep 里的疾病触发判定并替换 ---

// 1. 计算动态生病概率 (基础概率 8% + 体力惩罚 + 年龄惩罚)
const currentHealth = gameState.stats.physical;
const currentAge = gameState.stats.age;

// 基础病发率
let sickChance = 0.08; 

// 体力惩罚：体力越低，几率加成越高
if (currentHealth < 120) sickChance += 0.10; // 亚健康状态
if (currentHealth < 80)  sickChance += 0.20; // 虚弱状态
if (currentHealth < 40)  sickChance += 0.40; // 濒死状态

// 年龄惩罚：35岁后每10年增加 5% 概率
if (currentAge > 35) sickChance += (currentAge - 35) * 0.005;

// 2. 如果已经有病了，且体力还低，有 15% 几率恶化（触发更重的病）
const isAlreadySick = !!gameState.flags.disease;

if (!isAlreadySick && Math.random() < sickChance) {
    // 触发新疾病
    const disease = DISEASES[getRandomInt(0, DISEASES.length - 1)];
    
    // 如果体力极低，强制过滤掉“感冒”这种小病，直接上重病
    const finalDisease = (currentHealth < 50 && disease.harm < 20) 
        ? DISEASES.find(d => d.harm > 40) || disease 
        : disease;

    const hasInsurance = gameState.flags.hasInsurance;
    const actualAdmission = hasInsurance ? Math.floor(finalDisease.admission * 0.3) : finalDisease.admission;
    const actualDaily = hasInsurance ? Math.floor(finalDisease.daily * 0.3) : finalDisease.daily;

    showModal({
        title: "身体报警",
        description: `【${finalDisease.name}】袭来！${finalDisease.desc}\n当前体力：${currentHealth}。医生叹了口气：‘再晚来几天就直接送火葬场了。’\n治疗押金：¥${actualAdmission}`,
        type: 'DISEASE',
        actions: [
            { 
                label: finalDisease.days > 0 ? `办理住院 (${finalDisease.days}天)` : "门诊开药", 
                onClick: () => {
                    if (gameState.stats.money >= actualAdmission) {
                        updateStats({ money: -actualAdmission });
                        if (finalDisease.days > 0) {
                            setGameState(prev => ({ 
                                ...prev, 
                                flags: { ...prev.flags, disease: finalDisease.name, hospitalDays: finalDisease.days, hospitalDailyCost: actualDaily },
                                phase: 'SLEEP'
                            }));
                        }
                        closeModal();
                    } else {
                        triggerDeath("没钱交住院押金。你被医院保安劝离，最后死在了冰冷的地下室出租屋里。");
                    }
                }
            },
            {
                label: "死硬抗 (不花这冤枉钱)",
                onClick: () => {
                    // 硬抗重病直接死，轻病掉上限
                    if (finalDisease.harm > 40) {
                        triggerDeath(`你试图通过‘喝热水’治愈【${finalDisease.name}】，结果在半夜由于脏器衰竭去世。`);
                    } else {
                        setGameState(prev => ({ ...prev, flags: { ...prev.flags, disease: finalDisease.name } }));
                        updateStats({ physical: -20 }, "你选择了硬抗，身体留下了永久性损伤。");
                        closeModal();
                    }
                },
                style: 'danger'
            }
        ]
    });
    return; // 触发疾病后中断后续结算
}

    // 6. 子女成长逻辑
    handleChildLogic();

    // 7. 负债利息结算
    if (gameState.stats.debt > 0) {
    const interest = Math.floor(gameState.stats.debt * 0.0005);
    updateStats({ money: -interest });
    
    // 增加：暴力催收逻辑
    if (gameState.stats.money < -50000) {
        if (Math.random() < 0.1) {
            triggerDeath("【暴力催收】你家门口被喷上了红漆，锁眼被堵死。深夜，几个壮汉闯入你的出租屋，把你塞进了后备箱。（死因：由于无法偿还巨额网贷，你被送往了东南亚某电诈园区）");
            return;
        }
    }
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
          updateStats({ money: -10, satiety: 40, physical: -2 }, "吃了份拼好饭。虽然是海克斯科技预制菜，但僵尸肉的口感让你感到了活着的尊严。");
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
          <div className="mb-8 max-w-xs mx-auto text-center">
              <label className="text-zinc-500 text-[10px] block mb-2 uppercase tracking-widest font-bold">档案姓名 / Name</label>
              <input 
                  type="text" 
                  value={playerName} 
                  onChange={(e) => setPlayerName(e.target.value.slice(0, 8))} // 限制8个字
                  placeholder="输入你的牛马编号"
                  className="w-full bg-black border-2 border-zinc-700 p-3 text-center text-xl font-bold text-white focus:border-red-500 outline-none transition-all rounded-lg"
              />
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
    <div className="min-h-screen bg-red-900/40 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="text-center animate-in zoom-in duration-300">
        <h1 className="text-8xl font-black text-red-600 mb-8 drop-shadow-[0_5px_5px_rgba(0,0,0,1)] tracking-tighter shadow-black">
          你死了！
        </h1>
        <div className="bg-black/80 p-8 border-4 border-zinc-700 max-w-lg mx-auto text-left font-mono">
          <p className="text-yellow-400 mb-2">【 档案编号：#00{gameState.deathHistory.length} 】</p>
          <p className="text-white text-xl mb-1">姓名：{gameState.playerName}</p>
          <p className="text-white text-xl mb-1">职业：{gameState.profession?.name}</p>
          <p className="text-white text-xl mb-1">生存至：{gameState.stats.age} 岁</p>
          <p className="text-red-400 text-lg mt-4 font-bold">原因：{gameState.gameOverReason}</p>
        </div>
        <div className="mt-10 space-y-4">
          <button onClick={() => window.location.reload()} className="w-64 py-3 bg-zinc-800 border-2 border-zinc-600 text-white hover:bg-zinc-700 transition-all font-bold">
            回到主菜单
          </button>
        </div>
      </div>
    </div>
  );
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
    <div className="col-span-full">
        {/* 修改点：只有在数值不存在或者为 0 的时候才显示“进入工位” */}
        {(!gameState.workRounds || gameState.workRounds === 0) ? (
            <button 
                onClick={handleWork} 
                className="w-full py-12 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white rounded-xl transition-all group flex flex-col items-center justify-center gap-2"
            >
                <Briefcase className="w-8 h-8 text-zinc-400 group-hover:text-white" />
                <span className="text-xl font-bold tracking-[0.2em] uppercase">我是牛马 (进入工位)</span>
            </button>
        ) : (
            /* 只要 workRounds > 0，就显示选项，不消失 */
            <div className="grid grid-cols-2 gap-4 bg-zinc-900/90 p-6 rounded-xl border-2 border-yellow-600/50 mt-2 animate-in fade-in slide-in-from-bottom-4">
                <div className="col-span-full text-center mb-2 font-bold text-yellow-500 flex justify-between px-2">
                    <span>当前任务: 搬砖中</span>
                    <span>进度: {gameState.workRounds} / 3 阶段</span>
                </div>
                <button 
    onClick={() => handleWorkChoice('HARD')} 
    // --- 新增逻辑：体力小于 15 时禁用按钮 ---
    disabled={gameState.stats.physical < 15} 
    className={`py-8 rounded-lg transition-all active:scale-95 border ${
        gameState.stats.physical < 15 
        ? 'bg-zinc-800 text-zinc-600 border-zinc-700 cursor-not-allowed opacity-50' 
        : 'bg-red-900/40 border-red-500 text-white hover:bg-red-800/60'
    }`}
>
    <p className="font-bold">{gameState.stats.physical < 15 ? '体力透支' : '疯狂内卷'}</p>
    <p className="text-[10px] opacity-60">
        {gameState.stats.physical < 15 ? '无法进行高强度劳动' : '表现+20 | 体力-15'}
    </p>
</button>
                <button onClick={() => handleWorkChoice('SLACK')} className="py-8 bg-green-900/40 border border-green-500 text-white rounded-lg hover:bg-green-800/60 transition-all active:scale-95">
                    <p className="font-bold">带薪摸鱼</p>
                    <p className="text-[10px] opacity-60">表现-10 | 精神+5</p>
                </button>
            </div>
        )}
    </div>
)}
                        
                        {/* 2. 饮食按钮 */}
                        {(gameState.phase === 'MORNING' || gameState.phase === 'LUNCH' || gameState.phase === 'DINNER') && (
                            <>
                                <ActionBtn label="拼好饭" icon={<ShoppingBag/>} onClick={() => handleEat('TAKEOUT')} color="orange" sub="-¥10 | 也是吃上饭了" />
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
                                <ActionBtn 
  label="去医院修仙" 
  icon={<Activity/>} 
  onClick={handleHospitalVisit} // 统一调用函数，不要在这里写 config
  color="teal" 
  sub="查看体检与档案" 
/>
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
                      // 在 App.tsx 的 UI 渲染部分
if (gameState.phase === 'MORTUARY') {
    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-400 p-8 font-mono">
            <h1 className="text-4xl font-black text-white mb-8 border-b-2 border-zinc-800 pb-4">
                冷库档案管理系统 v1.0
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {gameState.deathHistory.map((d: any, i: number) => (
                    <div key={i} className="p-4 border-2 border-zinc-800 bg-zinc-900/50 hover:border-red-900/50 transition-colors">
                        <div className="text-red-500 font-bold mb-2">档案 #{i+1}</div>
                        <p>姓名: {d.name}</p>
                        <p>死因: {d.reason}</p>
                        <p>最终职业: {d.profession}</p>
                        <p>卒年: {d.age}岁</p>
                    </div>
                ))}
            </div>
            <button 
                onClick={() => setGameState(p => ({...p, phase: 'FREE_TIME'}))}
                className="mt-8 px-6 py-2 bg-zinc-800 text-white hover:bg-zinc-700"
            >
                返回医院走廊
            </button>
        </div>
    );
}
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
