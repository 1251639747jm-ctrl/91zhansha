import { PlayerStats, Profession, ProfessionType } from './types';

export const INITIAL_STATS: PlayerStats = {
  physical: 80,
  mental: 80,
  money: 5000,
  satiety: 80,
  cookingSkill: 0,
  daysSurvived: 0,
};

export const PROFESSIONS: Record<ProfessionType, Profession> = {
  CIVIL_SERVANT: {
    id: 'CIVIL_SERVANT',
    name: '街道办科员',
    salaryBase: 240, 
    stressFactor: 2,
    healthRisk: 1,
    schedule: '965',
    description: '宇宙尽头编制内。工资不高，但丈母娘最爱。双休是你的底气。'
  },
  PROGRAMMER: {
    id: 'PROGRAMMER',
    name: '大厂架构师',
    salaryBase: 1200,
    stressFactor: 7,
    healthRisk: 5,
    schedule: '996',
    description: '年薪百万不是梦，只要你能活到拿年终奖的那天。'
  },
  FACTORY_WORKER: {
    id: 'FACTORY_WORKER',
    name: '电子厂普工',
    salaryBase: 280,
    stressFactor: 4,
    healthRisk: 4,
    schedule: '007',
    description: '流水线上的螺丝钉。两班倒，人歇机不歇。提桶跑路是常态。'
  },
  DELIVERY: {
    id: 'DELIVERY',
    name: '金牌骑手',
    salaryBase: 500, // 多劳多得
    stressFactor: 5,
    healthRisk: 8, // 极高交通风险
    schedule: '007',
    description: '困在算法里的人。与死神赛跑，只为不超时的五星好评。'
  },
  SALES: {
    id: 'SALES',
    name: '房产销售',
    salaryBase: 400, // 波动极大
    stressFactor: 6,
    healthRisk: 3,
    schedule: '996',
    description: '每天打两百个骚扰电话。不开单就吃土，开单吃三年。'
  },
  UNEMPLOYED: {
    id: 'UNEMPLOYED',
    name: '全职儿女',
    salaryBase: 50, // 父母给的零花钱
    stressFactor: 1,
    healthRisk: 1,
    schedule: '965',
    description: '由于找不到工作，决定在家考研/考公（实则打游戏）。'
  }
};

// 复合死亡条件
export const COMPLEX_DEATHS = [
  {
    condition: (s: PlayerStats) => s.physical < 20 && s.mental < 20 && s.money > 100000,
    text: "你在工位上突发脑溢血。遗产变成了亲戚间的纠纷，公司赔偿金还没谈拢。"
  },
  {
    condition: (s: PlayerStats) => s.satiety < 5 && s.physical < 10,
    text: "你在出租屋里饿昏了，为了省钱买的劣质煤气灶发生泄露，你没力气爬出去。"
  },
  {
    condition: (s: PlayerStats) => s.money < -20000,
    text: "网贷逾期全面爆发。催收人员在你的家门口泼油漆，你因精神崩溃冲上天台。"
  },
  {
    condition: (s: PlayerStats) => s.physical > 95 && s.mental < 10,
    text: "你的身体很强壮，但精神已死。你加入了一个邪教组织，去深山老林寻找'升华'，最后死于食物中毒。"
  }
];

export const EVENTS = {
  WORK_ACCIDENTS: [
    "连续加班30天，你感到胸闷气短，这可能是猝死的前兆。",
    "老板画的饼太大，你消化不良（精神-10）。",
    "被迫参加团建，内容是荒野求生，身体更累了。",
    "体检报告出来了，除了身高其他指标全都有箭头。"
  ],
  CNY_QUESTIONS: [
    "大姑：'哎呀，今年怎么还没带对象回来？隔壁二狗孩子都打酱油了！'",
    "二舅：'听说是大厂员工？年终奖发了几十万吧？借舅舅五万周转一下？'",
    "熊孩子：'把你手办拆了你不介意吧？反正只是塑料小人。'"
  ]
};
