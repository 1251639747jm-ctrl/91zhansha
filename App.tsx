import React, { useState, useEffect, useCallback } from 'react';
import { GameState, ProfessionType, LogEntry, FamilyBackground, Child } from './types';
import { getRandomSeason, getNextSeason, getDailyTemperature, calculateBodyTemp } from './components/weather';
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
// App.tsx 内部新增
const bankActions = {
  deposit: (amount: number) => {
    if (gameState.flags.isBankFrozen) return addLog("柜台显示：该账户因‘系统升级’暂停业务。", "danger");
    if (gameState.stats.money < amount) return addLog("余额不足，无法存款。", "warning");
    
    setGameState(prev => ({
      ...prev,
      stats: { ...prev.stats, money: prev.stats.money - amount },
      flags: { ...prev.flags, bankBalance: prev.flags.bankBalance + amount }
    }));
    addLog(`存入 ¥${amount}。虽然只有电子数字，但你觉得比放在枕头底下安全。`, "success");
  },

  withdraw: () => {
    if (gameState.flags.isBankFrozen) return addLog("无法取款！屏幕显示：由于银行流动性风险，您的账户已被依法冻结。", "danger");
    
    // 2% 概率：银行暴雷/钱被挪用/充公
    if (Math.random() < 0.02) {
      setGameState(prev => ({ ...prev, flags: { ...prev.flags, isBankFrozen: true } }));
      triggerDeath("【金融铁拳】你尝试取钱时，发现ATM机贴着‘设备故障’。随后新闻报出该村镇银行负责人已携带20亿资金通过‘海豚计划’出境。由于存款未进预售资金监管账户，你的血汗钱被告知‘充公以抵债’。你看着卡里归零的余额，心脏剧烈抽搐。（死因：被时代的一粒沙精准砸中）");
      return;
    }

    const amount = gameState.flags.bankBalance;
    setGameState(prev => ({
      ...prev,
      stats: { ...prev.stats, money: prev.stats.money + amount },
      flags: { ...prev.flags, bankBalance: 0 }
    }));
    addLog(`取出了全部存款 ¥${amount}。那一刻你觉得厚厚的现金才是唯一的真理。`, "info");
  }
};

const marriageActions = {
  propose: () => {
    const partner = gameState.flags.partner;
    if (!partner) return;

    // 内置好感度逻辑（RealAffection）
    const realAff = partner.realAffection || 0;
    const materialism = partner.materialism;

    // 1. 求婚成功门槛：隐藏好感度必须 > 40
    if (realAff < 40) {
      updateStats({ mental: -30 });
      showModal({
        title: "求婚失败",
        description: `${partner.name} 沉默了很久，最后说：“你是个好人，但我妈说没房没车没50万彩礼不能结婚。我们还是算了吧。”`,
        type: 'LOVE',
        actions: [{ label: "含泪分手", onClick: () => { relActions.breakup(); closeModal(); }, style: 'danger' }]
      });
      return;
    }

    // 2. 彩礼计算：物质指数 * 10万，隐藏好感度越高折扣越多
    let dowryPrice = Math.floor(materialism * 100000);
    if (realAff > 80) dowryPrice *= 0.2; // 真爱：只要象征性的一点

    showModal({
      title: "谈婚论嫁",
      description: `${partner.name} 同意了！但她家里提出：\n1. 彩礼 ¥${dowryPrice}\n2. 必须有房 (House)\n3. 婚后你管钱 (假象)`,
      type: 'LOVE',
      actions: [
        {
          label: "成交 (结婚)",
          onClick: () => {
            if (gameState.stats.money < dowryPrice) return addLog("钱不够，婚事吹了。", "danger");
            if (!gameState.flags.hasHouse) return addLog("没房，丈母娘不同意这门亲事。", "warning");
            
             if (partner.fidelity < 30 && Math.random() < 0.3) {
               updateStats({ money: -dowryPrice, mental: -60 });
        triggerDeath(`【彩礼诈骗】你刚把 ¥${dowryPrice} 汇入对方指定的“弟弟购房账户”，${partner.name} 就反手把你拉黑并注销了账号。你报案后发现，对方连身份证都是假的。你不仅倾家荡产，还成了全村的笑柄。`);
        return;
    }

            updateStats({ money: -dowryPrice, mental: 30 });
            setGameState(prev => ({
              ...prev,
              flags: { ...prev.flags, isMarried: true, weddedPartner: partner, partner: null, isSingle: false }
            }));
            addLog("新婚大喜！你获得了‘合法繁衍权’，同时也背上了沉重的家庭责任。", "success");
            closeModal();
          }
        },
        { label: "还是单身好", onClick: closeModal, style: 'secondary' }
      ]
    });
  },

  tryToHaveChild: () => {
    if (!gameState.flags.isMarried) return;
    showModal({
      title: "繁衍后代？",
      description: "孩子是生命的延续，也是钞票的焚化炉。确定要在这个充满卷味的世界生孩子吗？",
      type: 'EVENT',
      actions: [
        { label: "为了传宗接代 (造人计划)", onClick: () => {
            addLog("你们开始准备要孩子了，生活成本将大幅增加。", "warning");
            // 直接触发之前的 adoptChild 逻辑即可，或者加一个怀孕期
            relActions.adoptChild(); 
            closeModal();
        }},
        { label: "丁克保平安", onClick: closeModal, style: 'secondary' }
      ]
    });
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
    const hasInitialAC = ['RICH_2', 'SCHOLAR', 'AVERAGE'].includes(bg.id);
    const initSeason = getRandomSeason();
    const initialChildren = generateInitialChildren(finalAge);
    setGameState({
      profession: prof,
      background: bg,
      playerName: playerName,
      deathHistory: JSON.parse(localStorage.getItem('death_records') || '[]'), 
      workPerformance: 0,
      workRounds: 0,
      stats: startStats,
      phase: 'MORNING',
      date: new Date('2024-01-01T07:30:00'),
      time: '07:30',
      season: initSeason,
      weatherTemp: getDailyTemperature(initSeason),
      log: [
        { id: 1, text: `>>> 档案载入完毕。年龄：${finalAge}岁。身份：${prof.name}。背景：${bg.name}。`, type: 'info' },
            ...(initialChildren.length > 0 ? [{ 
              id: 2, 
              text: `>>> 发现家庭档案：你已有 ${initialChildren.length} 个孩子需要抚养，碎钞机已启动。`, 
              type: 'warning' as const 
          }] : [])
           ],
      flags: { 
        isDepressed: false, 
        disease: null, 
        hasLoan: startDebt > 0, 
        bankBalance: 0,
        isBankFrozen: false,   // 必须初始化
        isMarried: false,      // 必须初始化
        weddedPartner: null,
        streamerSimpCount: 0,
        partner: null, 
        isPursuing: false, 
        hasHouse: false, 
        hasCar: false, 
        hasInsurance: prof.hasInsurance,
        hospitalDays: 0, 
        hospitalDailyCost: 0,
        blackVanRisk: 0, 
        lastCheckupDate: null, 
        knownHealth: null,
        inventory: { oil: 0, badOil: false, rice: 0, veggies: 0, meat: 0, seasoning: 0, milkPowder: 0, diapers: 0 },
        hasToxicMilk: false,
        children: initialChildren,
        // --- 修复点：确保这里不重复 ---
        isSingle: initialChildren.length === 0, 
        parentPressure: initialChildren.length > 0 ? 0 : 30,
        hasAC: ['RICH_2', 'SCHOLAR', 'AVERAGE'].includes(bg.id),
        isACOn: ['RICH_2', 'SCHOLAR', 'AVERAGE'].includes(bg.id),
        bodyTemp: 36.5,
        summerDaysWithoutAC: 0,
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
    // 关闭当前的医院选择弹窗，直接切换游戏阶段到停尸间
    setGameState(prev => ({ 
      ...prev, 
      phase: 'MORTUARY', 
      modal: { ...prev.modal, isOpen: false } 
    }));
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
      
      // 1. 检查食材是否足够 (现在的需求数值是 0.1, 0.2 等)
      const missingItems: string[] = [];
      Object.keys(needs).forEach(k => {
          // @ts-ignore
          const required = needs[k] || 0;
          // @ts-ignore
          if ((inventory[k] || 0) < required) {
              missingItems.push(k);
          }
      });

      if (missingItems.length > 0) {
          return {
              ...prev,
              modal: { 
                  isOpen: true,
                  title: "巧妇难为无米之炊", 
                  description: `做【${recipe.name}】食材不足！\n缺少：${missingItems.join(', ')}\n温馨提示：去“家庭中心-菜市场”买一袋米可以吃10顿。`,
                  type: 'EVENT',
                  actions: [{ label: "知道了", onClick: closeModal }]
              }
          };
      }

      // 2. 扣除食材库存 (使用 parseFloat 解决 0.1 + 0.2 = 0.30000004 的 JS 精度问题)
      const newInv = { ...inventory };
      Object.keys(needs).forEach(k => {
          // @ts-ignore
          newInv[k] = Math.max(0, parseFloat((newInv[k] - needs[k]).toFixed(1)));
      });
      
      // 核心修复：油用光了，自动清除坏油标记
      if (newInv.oil <= 0) {
          newInv.badOil = false;
      }

      // 3. 营养与中毒结算
      let healthHit = 0;
      let healthRecover = (recipe.stats.health || 0) + 15; // 自炊回血增强
      let logText = `你展示了精湛的厨艺，烹饪了【${recipe.name}】。锅气升腾的那一刻，你觉得自己还没被生活彻底打败。`;
      let logType: LogEntry['type'] = 'success';

      // 坏油判定
      if (needs.oil && inventory.badOil) {
           healthHit = 40; 
           healthRecover = 0;
           logText = `【海克斯科技残留】这桶混装油不仅有煤油味，吃完你感觉肝脏隐隐作痛。这顿饭白做了。`;
           logType = 'danger';
      }

      // 4. 精准时间跳转逻辑
      let nextP = prev.phase; 
      let nextT = prev.time;
      const isWknd = isWeekend(prev.date, prev.profession?.schedule || '965');
      const currentHour = parseInt(prev.time.split(':')[0]);

      if (currentHour < 10) { 
          nextP = isWknd ? 'REST_AM' : 'WORK_AM';
          nextT = '08:30'; 
      } else if (currentHour >= 10 && currentHour <= 14) {
          nextP = isWknd ? 'REST_PM' : 'WORK_PM';
          nextT = '13:00';
      } else {
          nextP = 'FREE_TIME';
          nextT = '19:30';
      }

      return {
          ...prev,
          stats: { 
              ...prev.stats, 
              satiety: Math.min(100, prev.stats.satiety + recipe.stats.satiety),
              mental: Math.min(100, prev.stats.mental + recipe.stats.mental + 5),
              physical: Math.min(200, Math.max(0, prev.stats.physical + healthRecover - healthHit)),
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
        description: `资金: ¥${money} | 库存: 油x${inv.oil.toFixed(1)}${inv.badOil?'(毒)':''} | 米x${inv.rice} | 面x${inv.flour} | 蔬x${inv.veggies} | 肉x${inv.meat}`,
        type: 'EVENT',
        actions: [
            // 第一组：购买（精简文案以节省空间）
            ...INGREDIENTS_SHOP.map(ing => ({ 
                label: `${ing.name.split('(')[0]} ¥${ing.cost}`, // 只显示名字前缀
                onClick: () => buyIngredient(ing), 
                style: 'secondary' as const 
            })),
            // 第二组：做饭
            ...RECIPES.map(recipe => ({ 
                label: `🍳 ${recipe.name}`, 
                onClick: () => doCook(recipe), 
                style: 'primary' as const 
            })),
            // 第三组：清理与离开
            { 
                label: inv.badOil ? "🧨 倒掉毒油" : "清理灶台", 
                onClick: () => {
                    setGameState(prev => ({
                        ...prev,
                        flags: { ...prev.flags, inventory: { ...prev.flags.inventory, oil: 0, badOil: false } }
                    }));
                    addLog("你清理了厨房。", "info");
                    closeModal();
                }, 
                style: 'danger' as const
            },
            { label: "❌ 离开", onClick: closeModal, style: 'secondary' as const }
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
        // 在 handleChildLogic 的循环内添加
if (child.age < 3 && prev.flags.inventory.hasToxicMilk && Math.random() < 0.1) {
    // 如果是婴儿，且库存有毒奶粉，每天 10% 概率出事
    triggerMilkScandal(child.name);
    return; // 立即中断后续逻辑，跳转弹窗
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
    buyAC: () => {
      if (gameState.stats.money < 2500) { addLog("买不起空调，心静自然凉吧。", "warning"); return; }
      updateStats({ money: -2500 });
      setGameState(prev => ({ ...prev, flags: { ...prev.flags, hasAC: true, isACOn: true } }));
      addLog("花了 ¥2500 买了一台空调，终于不用当烤肉了！", "success");
  },
  toggleAC: () => {
      setGameState(prev => ({ ...prev, flags: { ...prev.flags, isACOn: !prev.flags.isACOn } }));
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
    const totalPrice = 3000000; // 总价 300万
    const currentMoney = gameState.stats.money;

    // 修复点：支付金额不能超过房子的总价
    const actualPayment = Math.min(currentMoney, totalPrice);
    const loanAmount = Math.max(0, totalPrice - actualPayment);

    // 文案判定
    const logDesc = loanAmount > 0 
        ? `你支付了 ¥${actualPayment} 作为首付，剩下的 ¥${loanAmount} 办理了30年贷款。你正式成为了房奴。`
        : `你豪掷 ¥${totalPrice} 全款买下了这套房。销售小姐的笑容从未如此灿烂，你感受到了金钱的绝对力量。`;

    updateStats({ 
        money: -actualPayment, 
        debt: loanAmount, 
        mental: loanAmount > 0 ? -30 : 50 // 全款买房加精神，贷款买房扣精神
    }, logDesc);
    
    setGameState(prev => ({ 
        ...prev, 
        flags: { 
            ...prev.flags, 
            hasHouse: true, 
            hasLoan: loanAmount > 0 ? true : prev.flags.hasLoan,
            parentPressure: 0 
        } 
    }));
},

buyCar: () => {
    if (gameState.flags.hasCar) return;
    const carPrice = 200000; // 20万
    const currentMoney = gameState.stats.money;

    // 修复点：支付金额不能超过车的总价
    const actualPayment = Math.min(currentMoney, carPrice);
    const loanAmount = Math.max(0, carPrice - actualPayment);

    const logDesc = loanAmount > 0
        ? `你首付 ¥${actualPayment} 提了车，剩下 ¥${loanAmount} 分期支付。虽然背了债，但出门总算有面子了。`
        : `你直接刷卡 ¥${carPrice} 全款提车。感受着新车的皮椅味，你觉得这就是成功的味道。`;

    updateStats({ 
        money: -actualPayment, 
        debt: loanAmount,
        mental: loanAmount > 0 ? -10 : 20
    }, logDesc);
    
    setGameState(prev => ({ 
        ...prev, 
        flags: { 
            ...prev.flags, 
            hasCar: true, 
            hasLoan: loanAmount > 0 ? true : prev.flags.hasLoan 
        } 
    }));
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
        if (gameState.stats.money < item.cost) { addLog("钱包比脸还干净，娃只能喝米汤了。", "danger"); return; }
    
    // 隐藏风险：5% 概率买到毒奶粉，不提示玩家
    const isToxic = item.id === 'milkPowder' && Math.random() < 0.05;
    
    updateStats({ money: -item.cost });
    setGameState(prev => ({
        ...prev,
        flags: {
            ...prev.flags,
            inventory: {
                ...prev.flags.inventory,
                // 每次买 1 单位（实际可吃10次，因为每天消耗0.1）
                [item.id]: (prev.flags.inventory as any)[item.id] + 1,
                // 只要库存里有毒奶粉，就会标记
                hasToxicMilk: isToxic || prev.flags.hasToxicMilk
            }
        }
    }));
    addLog(`购买了${item.name}。看着包装上的金奖标志，你觉得很安心。`, "success");
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
const proceedToNextDay = () => {
  // 1. 基础属性自然结算
  updateStats({ physical: 5, mental: 5, satiety: -20 });

  setGameState(prev => {
    const nextDate = new Date(prev.date);
    nextDate.setDate(nextDate.getDate() + 1);
    const newDaysSurvived = prev.stats.daysSurvived + 1;
    let bankInterest = 0;
  if (gameState.flags.bankBalance > 0 && !gameState.flags.isBankFrozen) {
      bankInterest = Math.floor(gameState.flags.bankBalance * 0.00015);
  }
if (gameState.flags.isMarried && Math.random() < 0.01) {
    const wife = gameState.flags.weddedPartner;
    if ((wife?.fidelity || 100) < 40 || (wife?.realAffection || 100) < 20) {
        setGameState(prev => ({
            ...prev,
            phase: 'MODAL_PAUSE',
            modal: {
                isOpen: true,
                title: "💔 婚姻彻底破裂",
                description: `你推开门，发现家里多了一个正在练腹肌的陌生男子。${wife?.name} 递给你一份离婚协议：“彩礼我是不会退的，家产我也要分一半，孩子归我，你就滚吧。”`,
                type: 'DEATH',
                actions: [{ 
                    label: "签了它 (净身出户)", 
                    style: 'danger',
                    onClick: () => {
                        // 逻辑：直接判定是否满足“社会性死亡”
                        const currentMoney = gameState.stats.money;
                        if (currentMoney < 5000) {
                            // 如果钱不够，直接判定为流落街头而死
                            triggerDeath("【流落街头】你签了字，提着一个破蛇皮袋被赶出了家门。由于你之前为了买房掏空了所有存款，现在身无分文且背负贷款。在寒冷的冬夜，你蜷缩在公园的长椅上，再也没有醒来。");
                        } else {
                            // 否则，虽然没死，但大出血
                            setGameState(p => ({
                                ...p,
                                flags: { ...p.flags, isMarried: false, weddedPartner: null, isSingle: true, children: [] },
                                stats: { ...p.stats, money: p.stats.money / 2, mental: -50 }
                            }));
                            closeModal();
                            addLog("你离婚了，虽然保住了命，但你的一半积蓄被带走了，精神极度萎靡。", "danger");
                        }
                    } 
                }]
            }
        }));
    }
}
    // 2. 年龄与升学逻辑 (周年判定)
    let updatedChildren = [...prev.flags.children];
    let currentAge = prev.stats.age;

    if (newDaysSurvived > 0 && newDaysSurvived % 365 === 0) {
      currentAge += 1;
      updatedChildren = prev.flags.children.map(c => {
        const newAge = c.age + 1;
        let nextStage = c.educationStage;
        if (newAge === 3) nextStage = 'KINDER';
        else if (newAge === 7) nextStage = 'PRIMARY';
        else if (newAge === 13) nextStage = 'MIDDLE';
        else if (newAge === 16) nextStage = 'HIGH';
        else if (newAge === 19) nextStage = 'UNI';
        return { ...c, age: newAge, educationStage: nextStage, schoolFeePaid: false };
      });

      // 升学压力提示
      const schoolCount = updatedChildren.filter(c => c.age >= 3).length;
      if (schoolCount > 0) {
        setTimeout(() => {
          showModal({
            title: "开学季的噩梦",
            description: `又到了一年一度的开学季。你看着家里的 ${schoolCount} 个吞金兽，感觉到一阵窒息。请尽快前往家庭中心缴纳学费，否则孩子将被劝退。`,
            type: 'EVENT',
            actions: [{ label: "知道了 (含泪搬砖)", onClick: closeModal }]
          });
        }, 500);
      }
    }
    // 1. 换季与天气生成 (每30天换一次季)
let nextSeason = prev.season;
if (newDaysSurvived > 0 && newDaysSurvived % 30 === 0) {
  nextSeason = getNextSeason(prev.season);
}
const newEnvTemp = getDailyTemperature(nextSeason);

// 2. 空调惩罚天数判定
let newSummerDays = prev.flags.summerDaysWithoutAC;
if (nextSeason === 'SUMMER' && (!prev.flags.hasAC || !prev.flags.isACOn)) {
  newSummerDays++;
} else {
  newSummerDays = 0;
}
let interest = 0;
if (gameState.flags.bankBalance > 0 && !gameState.flags.isBankFrozen) {
    interest = Math.floor(gameState.flags.bankBalance * 0.0001);
}

// 2. 婚姻稳定性判定 (每天 1% 几率判定)
if (gameState.flags.isMarried && Math.random() < 0.01) {
    const wife = gameState.flags.weddedPartner;
    const realAff = wife?.realAffection || 0;
    
    if (realAff < 20) {
        // 出轨或退婚剧情
        showModal({
            title: "头顶有点绿",
            description: `你出差提前回家，发现衣柜里藏着一个自称是‘修水管’的健身教练。${wife?.name} 冷冷地说：‘我们结束了，彩礼我是不会退的，那是我的青春损失费。’`,
            type: 'DEATH',
            actions: [{
                label: "净身出户",
                onClick: () => {
                    setGameState(prev => ({
                        ...prev,
                        flags: { ...prev.flags, isMarried: false, weddedPartner: null, isSingle: true },
                        stats: { ...prev.stats, mental: -50 }
                    }));
                    closeModal();
                },
                style: 'danger'
            }]
        });
    }
}
// 3. 计算体温
const newBodyTemp = calculateBodyTemp(nextSeason, newEnvTemp, prev.flags.hasAC, prev.flags.isACOn, newSummerDays);

// 4. 结算空调电费 (每天15块)
const acCost = (prev.flags.hasAC && prev.flags.isACOn) ? 15 : 0;
    return {
      ...prev,
      date: nextDate,
      phase: 'MORNING',
      time: '07:00',
      season: nextSeason,
      weatherTemp: newEnvTemp,
      stats: {
        ...prev.stats,
        age: currentAge,
        money: prev.stats.money - acCost + bankInterest,
        daysSurvived: newDaysSurvived
      },
      flags: {
        ...prev.flags,
        bodyTemp: newBodyTemp, summerDaysWithoutAC: newSummerDays,
        children: updatedChildren
      }
    };
  });
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
    
    // [数值优化]：内卷体力消耗 -12 -> -8，摸鱼体力消耗 0 -> +3
    const pChange = isHard ? -8 : 3;
    const mChange = isHard ? -8 : 8; // 摸鱼精神回更多
    const sChange = -8; // 只要干活就饿

    // 1. 立即更新基础数值
    updateStats({
      physical: pChange,
      mental: mChange,
      satiety: sChange
    }, isHard 
       ? "你疯狂内卷，试图在老板面前表现，虽然腰椎隐隐作痛，但你觉得离升职又近了一步（其实并没有）。" 
       : "你熟练地切换到桌面背景，开启带薪摸鱼模式，甚至在工位上偷偷做起了扩胸运动，精神得到了升华。");

    // 2. 更新表现和轮次
    setGameState(prev => {
      const newPerformance = (prev.workPerformance || 0) + (isHard ? 20 : -10);
      const newRounds = (prev.workRounds || 0) + 1;

      // 如果达到3轮，执行下班结算
      if (newRounds >= 3) {
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
const triggerMilkScandal = (childName: string) => {
    setGameState(prev => ({
        ...prev,
        phase: 'MODAL_PAUSE',
        modal: {
            isOpen: true,
            title: "🆘 突发：深夜急诊",
            description: `你的孩子 ${childName} 持续高烧并伴随剧烈呕吐。医生翻开孩子的眼睑，沉默良久后低声对你说：“是肾衰竭...而且孩子颅骨发育异常（大头娃娃）。你们最近喂的是什么奶粉？” \n\n 你瘫坐在地，那是你省吃俭用买的“大牌”奶粉。`,
            type: 'DEATH',
            actions: [
                {
                    label: "闹事：去相关部门讨说法 (高风险)",
                    style: 'danger',
                    onClick: () => {
                        // 80% 几率人间消失
                        if (Math.random() < 0.8) {
                            triggerDeath("【人间消失】你带上化验单和横幅准备发声。在前往部门的路上，一辆没有牌照的面包车停在你身边，两名壮汉将你拖入车内。从此，这个世界上再也没有人见过你，甚至连你的社交账号也因“违反法律法规”被永久注销。（死因：试图寻求正义时不幸人间消失）");
                        } else {
                            updateStats({ money: -30000, mental: -80 }, "你闹事被判处“寻衅滋事”，缴纳了巨额罚金并被拘留。虽然没消失，但你发现自己已经成了所有公司眼中的“危险分子”。");
                            closeModal();
                        }
                    }
                },
                {
                    label: "忍气吞声：吃个哑巴亏",
                    onClick: () => {
                        updateStats({ mental: -50, money: -5000 }, "你默默销毁了奶粉罐，借钱交了孩子的透析费。在漫长的黑夜里，你看着孩子变形的头部，第一次感受到了绝望的重量。");
                        closeModal();
                    }
                }
            ]
        }
    }));
};
const finishWorkBlock = (finalPerformance: number) => {
    setGameState(prev => {
      const isMorningShift = prev.phase === 'WORK_AM';
      
      // 计算工资：底薪 * (1 + 表现倍率)
      const baseSalary = prev.profession?.salaryBase || 0;
      const performanceBonus = 1 + (finalPerformance / 100);
      const earnedSalary = Math.floor(baseSalary * performanceBonus);

      if (isMorningShift) {
          // 上午下班：不领钱，去吃午饭
          return { 
              ...prev, 
              phase: 'LUNCH', 
              time: '12:00',
              log: [...prev.log, { id: Date.now(), text: ">>> 上午的任务勉强应付完了，领饭盒去！", type: 'info' }]
          };
      } else {
          // 下午下班：判定加班文化
          const schedule = prev.profession?.schedule || '965';
          const isOvertimeCulture = schedule.includes('996') || schedule.includes('007');
          const overtimeChance = isOvertimeCulture ? 0.85 : 0.2;
          
          if (Math.random() < overtimeChance) {
              // --- 触发加班流程 ---
              showModal({
                  title: "【老板的夺命连环Call】",
                  description: `你刚拎起包，老板发来语音：“那个方案，客户说要五彩斑斓的黑，今晚改不出来别走。” \n\n 今天的窝囊费 ¥${earnedSalary} 已入账。`,
                  type: 'WORK',
                  actions: [{ 
                      label: "含泪坐回工位", 
                      onClick: () => {
                          // 加班猝死判定
                          if (gameState.stats.physical < 30 && Math.random() < 0.3) {
                              triggerDeath(`【过劳死】凌晨两点，你眼前的Excel表格开始重叠，心脏传来一阵剧烈的刺痛。你试图呼救，但空荡荡的办公室只有自动饮水机加热的声音。`);
                              return;
                          }

                          // [数值优化]：加班体力/精神消耗 -25 -> -15
                          updateStats({ 
                              money: earnedSalary, 
                              physical: -15, 
                              mental: -15, 
                              satiety: -10 
                          }, `你被迫加班到深夜。总算拿到了今天的 ¥${earnedSalary}。`);
                          
                          // 强制推进时间到深夜
                          setGameState(p => ({ ...p, phase: 'DINNER', time: '22:45' }));
                          closeModal();
                      } 
                  }]
              });
              return prev; 
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
if (gameState.season === 'SUMMER' && (!gameState.flags.hasAC || !gameState.flags.isACOn)) {
  if (Math.random() < 0.20) {
    const heatstroke = DISEASES.find(d => d.name === '热射病');
    if (heatstroke) {
      showModal({
        title: "🌡️ 极度高温警告：热射病",
        description: `【${heatstroke.name}】袭来！${heatstroke.desc}\n当前体温：${gameState.flags.bodyTemp}℃。你感觉大脑快要被煮熟了。\nICU抢救押金：¥${heatstroke.admission}`,
        type: 'DISEASE',
        actions: [
          { 
            label: `缴纳押金抢救 (¥${heatstroke.admission})`, 
            onClick: () => {
              if (gameState.stats.money >= heatstroke.admission) {
                updateStats({ money: -heatstroke.admission });
                setGameState(prev => ({ 
                  ...prev, 
                  flags: { ...prev.flags, disease: heatstroke.name, hospitalDays: heatstroke.days, hospitalDailyCost: heatstroke.daily },
                  phase: 'SLEEP'
                }));
                closeModal();
              } else {
                triggerDeath("由于交不起ICU住院费，你被抬出了急诊室，死在了医院走廊的长椅上。");
              }
            }
          },
          { 
            label: "放弃治疗", 
            style: 'danger',
            onClick: () => {
              if (Math.random() < 0.8) {
                triggerDeath("你拒绝了抢救。凌晨四点，你的体温达到了42℃，脏器在高温下彻底停止了工作工作。");
              } else {
                addLog("你竟然奇迹般地挺过来了，但大脑受损严重，感觉自己变笨了。", "warning");
                updateStats({ mental: -50, physical: -30 });
                closeModal();
              }
            }
          }
        ]
      });
      return; // 拦截成功，中断后续代码
    }
  }
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
  // === 8. 插入：领导视察逻辑 (拦截器) ===
  if (Math.random() < 0.08) {
    setGameState(prev => ({
      ...prev,
      phase: 'MODAL_PAUSE',
      modal: {
        isOpen: true,
        title: "⚠️ 社区紧急通知",
        description: "网格员发来语音：‘大领导视察，全楼即刻严禁开窗，严禁使用天然气做饭！否则直接带走！’",
        type: 'WORK',
        actions: [
          { 
            label: "忍了 (关窗断气)", 
            onClick: () => { 
              updateStats({ mental: -20, physical: -10 }); 
              closeModal();
              proceedToNextDay(); // 选完忍，才执行进入明天
            } 
          },
          { 
            label: "偏要开窗做饭", 
            style: 'danger',
            onClick: () => {
              if (Math.random() < 0.5) {
                triggerDeath("【顶风违纪】你刚拧开天然气，就被红外热成像仪捕捉。三分钟后特警破窗而入。你的人生在这一刻杀青了。");
              } else {
                addLog("算你走运，领导车队改道了，你保住了一条命。", "warning");
                closeModal();
                proceedToNextDay(); // 没死也执行进入明天
              }
            } 
          }
        ]
      }
    }));
    return; // 重点：拦截，不让代码继续往下跑
  }

  // === 9. 如果没触发视察，正常进入明天 ===
  proceedToNextDay();
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
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-red-500/10 blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[520px] h-[520px] bg-yellow-500/10 blur-[150px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_30%)]" />
        </div>
        <div className="relative max-w-6xl w-full glass-card rounded-[32px] p-6 md:p-10 border border-white/10">
          <div className="text-center mb-10">
            <div className="inline-flex px-3 py-1 rounded-full border border-white/10 bg-white/[0.04] text-[10px] uppercase tracking-[0.35em] text-zinc-400 mb-4">
              Life Simulation Terminal
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-300 to-yellow-300">
              中国式社畜模拟器
            </h1>
            <p className="text-zinc-400 mt-3 text-sm md:text-base">
              在高压、低薪、家庭责任与随机暴击中，努力活过明天
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <div className="panel-title mb-2">Initial Age</div>
              <div className="flex items-center justify-between">
                <div className="text-4xl font-black text-white">{tempAge}</div>
                <button
                  onClick={() => setTempAge(getRandomInt(18, 55))}
                  className="w-10 h-10 rounded-2xl border border-white/10 bg-white/[0.04] flex items-center justify-center hover:bg-white/[0.08] transition-all"
                >
                  <RotateCcw className="w-4 h-4 text-zinc-300" />
                </button>
              </div>
              <p className="text-xs text-zinc-500 mt-3">随机刷新开局年龄</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <div className="panel-title mb-2">Family Background</div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xl font-bold text-white">{tempBg.name}</div>
                  <div className="text-xs text-zinc-500 mt-2 leading-relaxed">{tempBg.desc}</div>
                </div>
                <button
                  onClick={() => setTempBg(FAMILY_BACKGROUNDS[getRandomInt(0, FAMILY_BACKGROUNDS.length - 1)])}
                  className="w-10 h-10 shrink-0 rounded-2xl border border-white/10 bg-white/[0.04] flex items-center justify-center hover:bg-white/[0.08] transition-all"
                >
                  <RotateCcw className="w-4 h-4 text-zinc-300" />
                </button>
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <div className="panel-title mb-2">Archive Name</div>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value.slice(0, 8))}
                placeholder="输入你的牛马编号"
                className="w-full mt-1 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white text-lg font-bold outline-none focus:border-red-400/40 focus:bg-black/40 transition-all"
              />
              <p className="text-xs text-zinc-500 mt-3">最多 8 个字符</p>
            </div>
          </div>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="panel-title">Profession Selection</div>
              <h2 className="text-2xl font-black text-white mt-1">选择你的职业剧本</h2>
            </div>
            <div className="hidden md:flex items-center gap-2 text-xs text-zinc-500">
              <Sparkles className="w-4 h-4" />
              年龄不符合将无法选择
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Object.values(PROFESSIONS).map((p: any) => {
              const isEligible = tempAge >= (p.minAge || 0) && tempAge <= (p.maxAge || 100);
              return (
                <button
                  key={p.id}
                  onClick={() => isEligible && startGame(p.id as ProfessionType)}
                  disabled={!isEligible}
                  className={`p-5 rounded-2xl border text-left transition-all duration-200 h-40 flex flex-col justify-between relative overflow-hidden group
                    ${isEligible
                      ? 'bg-white/[0.04] border-white/10 hover:border-red-400/30 hover:bg-red-500/10 hover:scale-[1.02]'
                      : 'bg-white/[0.02] border-white/5 opacity-30 grayscale cursor-not-allowed'
                    }`}
                >
                  <div className="absolute -right-5 -top-5 w-20 h-20 rounded-full bg-white/5 blur-2xl" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <h3 className="text-lg font-bold text-white">{p.name}</h3>
                      <span className="text-[10px] px-2 py-1 rounded-full bg-black/30 border border-white/10 text-zinc-400">
                        {p.schedule}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-400 leading-relaxed">{p.description}</p>
                  </div>
                  <div className="relative z-10 flex items-center justify-between text-xs text-zinc-500 border-t border-white/10 pt-3">
                    <span>底薪 ¥{p.salaryBase}</span>
                    <span>{p.minAge || 0}-{p.maxAge || 100} 岁</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
  // ===============================
  // GAME OVER 页面
  // ===============================
  if (gameState.phase === 'GAME_OVER') {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-gradient-to-b from-red-950/30 via-black to-black" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-red-500/10 blur-[140px]" />
        <div className="relative max-w-2xl w-full text-center">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full border border-red-500/20 bg-red-500/10 text-red-300 text-xs uppercase tracking-[0.28em]">
              <Skull className="w-3 h-3" />
              Game Over
            </div>
            <h1 className="mt-5 text-6xl md:text-8xl font-black text-red-500 tracking-tight drop-shadow-[0_8px_30px_rgba(255,0,0,.2)]">
              你死了
            </h1>
            <p className="text-zinc-500 mt-3">这个城市又吞掉了一名普通打工人</p>
          </div>
          <div className="glass-card rounded-[28px] border border-red-500/20 p-6 md:p-8 text-left">
            <div className="panel-title mb-4">Death Archive</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
              <InfoCard label="姓名" value={gameState.playerName} />
              <InfoCard label="职业" value={gameState.profession?.name || '未知'} />
              <InfoCard label="生存年龄" value={`${gameState.stats.age} 岁`} />
              <InfoCard label="档案编号" value={`#00${gameState.deathHistory.length}`} />
            </div>
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
              <div className="text-xs uppercase tracking-[0.24em] text-red-300 mb-2">Cause of death</div>
              <p className="text-red-100 leading-7">{gameState.gameOverReason}</p>
            </div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-8 px-8 py-4 rounded-2xl border border-white/10 bg-white/[0.05] hover:bg-white/[0.08] text-white font-bold transition-all"
          >
            回到主菜单
          </button>
        </div>
      </div>
    );
  }
  // ===============================
  // MORTUARY 页面
  // ===============================
  if (gameState.phase === 'MORTUARY') {
    return (
      <div className="min-h-screen relative overflow-hidden p-4 md:p-8">
        <div className="absolute inset-0 bg-black" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-red-600/10 blur-[120px]" />
        <div className="relative max-w-6xl mx-auto">
          <div className="glass-card rounded-[28px] p-6 md:p-8 border border-white/10 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
              <div>
                <div className="panel-title">Biological Asset Recycling Archives</div>
                <h1 className="text-3xl md:text-5xl font-black text-white mt-2 flex items-center gap-3">
                  <Skull className="w-9 h-9 text-red-500" />
                  生物资产回收档案库
                </h1>
                <p className="text-zinc-500 mt-3">记录那些被城市消化掉的人生残片</p>
              </div>
              <button
                onClick={() => setGameState(p => ({ ...p, phase: 'FREE_TIME' } as any))}
                className="px-6 py-3 rounded-2xl border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-300 font-semibold transition-all"
              >
                返回阳间
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {(gameState.deathHistory || []).length > 0 ? (
              gameState.deathHistory.map((d: any, i: number) => (
                <div
                  key={i}
                  className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-6 hover:border-red-500/20 transition-all"
                >
                  <div className="absolute -right-4 -bottom-5 text-8xl font-black text-white/[0.03] italic">
                    #{String(i + 1).padStart(3, '0')}
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-start justify-between gap-3 mb-5">
                      <div>
                        <h3 className="text-2xl font-bold text-white">{d.name}</h3>
                        <p className="text-sm text-zinc-500 mt-1">{d.profession}</p>
                      </div>
                      <span className="text-[10px] px-3 py-1 rounded-full border border-red-500/20 bg-red-500/10 text-red-300">
                        {d.date}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-5">
                      <InfoCard label="销户年龄" value={`${d.age} 岁`} />
                      <InfoCard label="记录编号" value={`#${String(i + 1).padStart(3, '0')}`} />
                    </div>
                    <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
                      <div className="text-xs uppercase tracking-[0.24em] text-red-300 mb-2">死亡鉴定结论</div>
                      <p className="text-sm text-zinc-300 leading-7">{d.reason}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full rounded-3xl border border-dashed border-white/10 bg-white/[0.03] py-20 text-center">
                <p className="text-zinc-500 text-lg font-semibold">暂无生物资产回收记录</p>
                <p className="text-zinc-600 text-sm mt-2">看来你还没在这座城市留下足够惨烈的血泪史</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
  // ===============================
  // 主游戏界面
  // ===============================
  return (
    <div className="min-h-screen relative overflow-hidden text-zinc-200 font-sans selection:bg-fuchsia-500/20">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-fuchsia-600/10 blur-[140px]" />
        <div className="absolute right-0 top-1/4 w-[400px] h-[400px] bg-cyan-500/10 blur-[120px]" />
        <div className="absolute left-0 bottom-0 w-[500px] h-[400px] bg-indigo-500/10 blur-[130px]" />
      </div>
      <EventModal config={gameState.modal} />
      <RelationshipModal
        isOpen={gameState.showRelationshipPanel}
        onClose={() => setGameState(prev => ({ ...prev, showRelationshipPanel: false } as any))}
        partner={gameState.flags.partner}
        childrenList={gameState.flags.children}
        flags={gameState.flags as any}
        money={gameState.stats.money}
        debt={gameState.stats.debt}
        actions={{
          ...relActions,
          ...bankActions,
          ...marriageActions,
          deposit: bankActions.deposit
        } as any}
      />
      <StatBar
        stats={gameState.stats}
        profession={gameState.profession}
        time={gameState.time}
        isDepressed={gameState.flags.isDepressed}
        date={gameState.date}
        season={gameState.season}
        weatherTemp={gameState.weatherTemp}
        bodyTemp={gameState.flags.bodyTemp}
      />
      <main className="relative max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
        <GameLog logs={gameState.log} />
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* 左侧面板 */}
          <aside className="xl:col-span-4 space-y-6">
            <div className="glass-card rounded-3xl p-5 md:p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="panel-title">Character Overview</div>
                  <h3 className="text-2xl font-black text-white mt-1">{gameState.playerName}</h3>
                </div>
                <div className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-sm text-zinc-300">
                  {gameState.stats.age} 岁
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-5">
                <InfoCard label="职业" value={gameState.profession?.name || '未知'} />
                <InfoCard label="背景" value={gameState.background?.name || '未知'} />
                <InfoCard label="生存天数" value={`${gameState.stats.daysSurvived} 天`} />
                <InfoCard label="负债" value={`¥${gameState.stats.debt.toLocaleString()}`} danger={gameState.stats.debt > 0} />
              </div>
              <div className="space-y-3 mb-5">
                <MiniBar label="体力" value={gameState.stats.physical} max={200} color="bg-gradient-to-r from-red-500 to-orange-400" />
                <MiniBar label="精神" value={gameState.stats.mental} max={100} color="bg-gradient-to-r from-blue-500 to-cyan-400" />
                <MiniBar label="饱食" value={gameState.stats.satiety} max={100} color="bg-gradient-to-r from-yellow-500 to-orange-400" />
              </div>
              <button
                onClick={() => setGameState(prev => ({ ...prev, showRelationshipPanel: true } as any))}
                className="w-full rounded-2xl border border-pink-400/20 bg-pink-500/10 hover:bg-pink-500/20 text-pink-200 px-4 py-4 transition-all flex items-center justify-center gap-2 font-semibold"
              >
                <Heart className="w-4 h-4" />
                打开家庭 / 情感 / 资产中心
              </button>
            </div>
            <div className="glass-card rounded-3xl p-5 md:p-6">
              <div className="panel-title mb-4">Environment & Risk</div>
              <div className="grid grid-cols-2 gap-3 mb-5">
                <EnvCard icon={<CalendarDays className="w-4 h-4 text-red-400" />} label="日期" value={formatDateCN(gameState.date)} />
                <EnvCard icon={<Wallet className="w-4 h-4 text-emerald-400" />} label="现金" value={`¥${gameState.stats.money.toLocaleString()}`} />
                <EnvCard icon={<Thermometer className="w-4 h-4 text-orange-400" />} label="体温" value={`${gameState.flags.bodyTemp}℃`} />
                <EnvCard icon={<ShieldAlert className="w-4 h-4 text-cyan-400" />} label="季节" value={`${gameState.season} / ${gameState.weatherTemp}℃`} />
              </div>
              <div className="space-y-3">
                {gameState.flags.hospitalDays > 0 && (
                  <StatusAlert
                    color="red"
                    title={`住院治疗中 · 剩余 ${gameState.flags.hospitalDays} 天`}
                    desc={`每日花费 ¥${gameState.flags.hospitalDailyCost}`}
                    icon={<Activity className="w-4 h-4" />}
                  />
                )}
                {gameState.flags.blackVanRisk > 0 && (
                  <StatusAlert
                    color="amber"
                    title={`生物资产风险 ${gameState.flags.blackVanRisk}%`}
                    desc="你已进入高价值健康目标观察名单"
                    icon={<Skull className="w-4 h-4" />}
                  />
                )}
                {gameState.flags.disease && (
                  <StatusAlert
                    color="purple"
                    title={`当前疾病：${gameState.flags.disease}`}
                    desc="身体处于异常状态，属性恢复将受影响"
                    icon={<AlertOctagon className="w-4 h-4" />}
                  />
                )}
                {!gameState.flags.hospitalDays && !gameState.flags.blackVanRisk && !gameState.flags.disease && (
                  <div className="rounded-2xl border border-emerald-400/10 bg-emerald-500/10 px-4 py-4 text-emerald-200 text-sm">
                    当前暂无高危事件，恭喜你暂时还活着。
                  </div>
                )}
              </div>
            </div>
          </aside>
          {/* 右侧操作中心 */}
          <section className="xl:col-span-8 glass-card rounded-3xl p-5 md:p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="panel-title">Action Center</div>
                <h3 className="text-2xl font-black text-white mt-1">今日行动面板</h3>
              </div>
              <div className="text-xs text-zinc-500 font-mono">
                PHASE: {gameState.phase}
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {gameState.flags.hospitalDays > 0 ? (
                <button
                  onClick={handleSleep}
                  className="col-span-full rounded-3xl border border-red-500/20 bg-red-500/10 hover:bg-red-500/15 p-10 text-red-100 transition-all"
                >
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
                      <Activity className="w-8 h-8" />
                    </div>
                    <div className="text-2xl font-black mb-2">接受治疗</div>
                    <div className="text-sm text-red-200/70">
                      点击度过这一天 · -¥{gameState.flags.hospitalDailyCost}
                    </div>
                  </div>
                </button>
              ) : (
                <>
                  {gameState.phase.includes('WORK') && (
                    <div className="col-span-full">
                      {(!gameState.workRounds || gameState.workRounds === 0) ? (
                        <button
                          onClick={handleWork}
                          className="w-full rounded-3xl border border-cyan-400/20 bg-cyan-500/10 hover:bg-cyan-500/15 p-8 transition-all"
                        >
                          <div className="flex flex-col items-center justify-center">
                            <div className="w-16 h-16 rounded-3xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4">
                              <Briefcase className="w-8 h-8 text-cyan-300" />
                            </div>
                            <div className="text-2xl font-black text-white">进入工位</div>
                            <div className="text-sm text-cyan-200/70 mt-1">
                              感受空气中弥漫的 PUA 气息
                            </div>
                          </div>
                        </button>
                      ) : (
                        <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-5">
                          <div className="flex items-center justify-between mb-4">
                            <div className="text-lg font-bold text-amber-200">搬砖进行中</div>
                            <div className="text-sm text-amber-300/80">进度 {gameState.workRounds} / 3</div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <button
                              onClick={() => handleWorkChoice('HARD')}
                              disabled={gameState.stats.physical < 15}
                              className={`rounded-2xl p-6 border transition-all ${
                                gameState.stats.physical < 15
                                  ? 'bg-zinc-800/60 border-white/10 text-zinc-500 cursor-not-allowed'
                                  : 'bg-red-500/10 border-red-500/20 text-red-100 hover:bg-red-500/20'
                              }`}
                            >
                              <div className="text-lg font-bold">
                                {gameState.stats.physical < 15 ? '体力透支' : '疯狂内卷'}
                              </div>
                              <div className="text-xs opacity-70 mt-1">
                                {gameState.stats.physical < 15 ? '无法执行高强度劳动' : '表现 +20 · 体力消耗'}
                              </div>
                            </button>
                            <button
                              onClick={() => handleWorkChoice('SLACK')}
                              className="rounded-2xl p-6 border border-emerald-500/20 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/20 transition-all"
                            >
                              <div className="text-lg font-bold">带薪摸鱼</div>
                              <div className="text-xs opacity-70 mt-1">表现 -10 · 精神恢复</div>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {(gameState.phase === 'MORNING' || gameState.phase === 'LUNCH' || gameState.phase === 'DINNER') && (
                    <>
                      <ActionBtn label="拼好饭" icon={<ShoppingBag />} onClick={() => handleEat('TAKEOUT')} color="orange" sub="-¥10 · 临时续命" />
                      <ActionBtn label="下厨做饭" icon={<Utensils />} onClick={() => handleEat('COOK_MENU')} color="green" sub="更高恢复收益" />
                      <ActionBtn label="跳过用餐" icon={<XCircle />} onClick={() => handleEat('SKIP')} color="red" sub="修仙但掉状态" />
                    </>
                  )}
                  {(gameState.phase === 'FREE_TIME' || gameState.phase.includes('REST')) && (
                    <>
                      <ActionBtn label="医院 / 体检" icon={<Activity />} onClick={handleHospitalVisit} color="teal" sub="健康检查与治疗" />
                      <ActionBtn label="家庭中心" icon={<Home />} onClick={() => setGameState(p => ({ ...p, showRelationshipPanel: true } as any))} color="pink" sub="伴侣 / 孩子 / 资产" />
                      <ActionBtn label="做顿好的" icon={<Utensils />} onClick={() => handleEat('COOK_MENU')} color="green" sub="厨房模式" />
                      <ActionBtn label="金帝皇洗脚城" icon={<Footprints />} onClick={() => handleFreeTime('SPA')} color="pink" sub="-¥1288 · 帝王套" />
                      <ActionBtn label="守护女主播" icon={<Heart />} onClick={() => handleFreeTime('STREAMER')} color="purple" sub="-¥1000 · 嘉年华" />
                      <ActionBtn label="海克斯烧烤" icon={<Beer />} onClick={() => handleFreeTime('BBQ')} color="orange" sub="-¥100 · 碳水快乐" />
                      <ActionBtn label="网吧通宵" icon={<MonitorPlay />} onClick={() => handleFreeTime('INTERNET_CAFE')} color="indigo" sub="-¥20 · 回到青春" />
                      <ActionBtn label="私人影院" icon={<Users />} onClick={() => handleFreeTime('MOVIE')} color="zinc" sub="-¥50 · 夜间娱乐" />
                      <ActionBtn label="广场舞混子" icon={<Dumbbell />} onClick={() => handleFreeTime('SQUARE_DANCE')} color="zinc" sub="寻找富婆未果" />
                      <ActionBtn label="City Walk" icon={<Footprints />} onClick={() => handleFreeTime('WALK')} color="zinc" sub="散步降压" />
                      <ActionBtn label="在家躺平" icon={<Home />} onClick={() => handleFreeTime('HOME')} color="zinc" sub="低成本回血" />
                    </>
                  )}
                  {gameState.phase === 'SLEEP' && (
                    <button
                      onClick={handleSleep}
                      className="col-span-full rounded-3xl border border-indigo-400/20 bg-indigo-500/10 hover:bg-indigo-500/15 p-10 transition-all"
                    >
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
                          <Moon className="w-8 h-8 text-indigo-300" />
                        </div>
                        <div className="text-2xl font-black text-white">结束这一天</div>
                        <div className="text-sm text-indigo-200/70 mt-1">Proceed to next day</div>
                      </div>
                    </button>
                  )}
                </>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};
// --- UI 组件：操作按钮 ---
const InfoCard = ({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) => (
  <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
    <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">{label}</div>
    <div className={`mt-1 text-sm font-bold ${danger ? 'text-red-300' : 'text-white'}`}>
      {value}
    </div>
  </div>
);
const EnvCard = ({
  icon,
  label,
  value
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
    <div className="flex items-center gap-2 mb-2">
      {icon}
      <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">{label}</span>
    </div>
    <div className="text-sm font-semibold text-white break-words">{value}</div>
  </div>
);
const MiniBar = ({
  label,
  value,
  max,
  color
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) => (
  <div>
    <div className="flex justify-between text-xs text-zinc-400 mb-1">
      <span>{label}</span>
      <span>{value}/{max}</span>
    </div>
    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
      <div className={`h-full ${color}`} style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
    </div>
  </div>
);
const StatusAlert = ({
  color,
  title,
  desc,
  icon,
}: {
  color: 'red' | 'amber' | 'purple';
  title: string;
  desc: string;
  icon: React.ReactNode;
}) => {
  const map = {
    red: 'border-red-500/20 bg-red-500/10 text-red-200',
    amber: 'border-amber-500/20 bg-amber-500/10 text-amber-200',
    purple: 'border-purple-500/20 bg-purple-500/10 text-purple-200',
  };
  return (
    <div className={`rounded-2xl border px-4 py-4 ${map[color]}`}>
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-black/20 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div>
          <div className="font-semibold">{title}</div>
          <div className="text-sm opacity-75 mt-1">{desc}</div>
        </div>
      </div>
    </div>
  );
};
const ActionBtn = ({ label, icon, onClick, color, sub }: any) => {
  const colors: any = {
    zinc: 'border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200',
    orange: 'border-orange-400/20 bg-orange-500/10 hover:bg-orange-500/20 text-orange-200',
    green: 'border-emerald-400/20 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-200',
    red: 'border-red-400/20 bg-red-500/10 hover:bg-red-500/20 text-red-200',
    teal: 'border-teal-400/20 bg-teal-500/10 hover:bg-teal-500/20 text-teal-200',
    purple: 'border-purple-400/20 bg-purple-500/10 hover:bg-purple-500/20 text-purple-200',
    indigo: 'border-indigo-400/20 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-200',
    pink: 'border-pink-400/20 bg-pink-500/10 hover:bg-pink-500/20 text-pink-200',
  };
  return (
    <button
      onClick={onClick}
      className={`${colors[color] || colors.zinc} group relative overflow-hidden rounded-3xl border p-4 min-h-[130px] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] text-left`}
    >
      <div className="absolute -right-3 -top-3 opacity-10 group-hover:opacity-20 transition-all">
        {React.cloneElement(icon, { size: 64 })}
      </div>
      <div className="relative z-10 flex flex-col justify-between h-full">
        <div className="w-11 h-11 rounded-2xl bg-black/20 border border-white/10 flex items-center justify-center mb-4">
          {React.cloneElement(icon, { className: 'w-5 h-5 group-hover:scale-110 transition-transform' })}
        </div>
        <div>
          <div className="font-bold text-base">{label}</div>
          <div className="text-xs opacity-70 mt-1">{sub}</div>
        </div>
      </div>
    </button>
  );
};
export default App;
