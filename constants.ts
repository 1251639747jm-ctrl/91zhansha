import { PlayerStats, Profession, ProfessionType } from './types';

export const INITIAL_STATS: PlayerStats = {
  physical: 75, // 初始调低一点，太高容易死
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
    description: '宇宙尽头编制内。',
    workDesc: ['整理毫无意义的表格', '给领导写某种材料', '接待愤怒的居民', '在茶水间研究茶叶']
  },
  PROGRAMMER: {
    id: 'PROGRAMMER',
    name: '大厂架构师',
    salaryBase: 1200,
    stressFactor: 7,
    healthRisk: 5,
    schedule: '996',
    description: '拿命换钱。',
    workDesc: ['在屎山上雕花', '因为一个分号排查了3小时', '与产品经理进行亲切友好的格斗', '参加无效的复盘会议']
  },
  FACTORY_WORKER: {
    id: 'FACTORY_WORKER',
    name: '电子厂普工',
    salaryBase: 280,
    stressFactor: 4,
    healthRisk: 4,
    schedule: '007',
    description: '提桶跑路是常态。',
    workDesc: ['打第1000个螺丝', '在流水线上发呆', '被线长怒吼', '偷偷在厕所抽烟']
  },
  DELIVERY: {
    id: 'DELIVERY',
    name: '金牌骑手',
    salaryBase: 500,
    stressFactor: 5,
    healthRisk: 8,
    schedule: '007',
    description: '困在算法里的人。',
    workDesc: ['在暴雨中狂奔', '爬了8楼送一份奶茶', '被保安拦在小区门口', '超时了，向客户道歉']
  },
  SALES: {
    id: 'SALES',
    name: '房产销售',
    salaryBase: 400,
    stressFactor: 6,
    healthRisk: 3,
    schedule: '996',
    description: '不开单就吃土。',
    workDesc: ['打了50个骚扰电话', '被客户拉黑', '陪客户喝到胃出血', '在朋友圈发鸡汤']
  },
  UNEMPLOYED: {
    id: 'UNEMPLOYED',
    name: '全职儿女',
    salaryBase: 50,
    stressFactor: 1,
    healthRisk: 1,
    schedule: '965',
    description: '家里蹲。',
    workDesc: ['假装在考研复习', '帮妈妈洗了一次碗', '被亲戚阴阳怪气', '躺在床上刷视频']
  }
};

// 疾病池
export const DISEASES = [
  { name: '重感冒', harm: 5, cost: 200, desc: '头昏脑涨，浑身无力。' },
  { name: '急性肠胃炎', harm: 8, cost: 500, desc: '喷射战士，虚脱了。' },
  { name: '腰椎间盘突出', harm: 3, cost: 1000, desc: '直不起腰，坐立难安。' },
  { name: '偏头痛', harm: 4, cost: 300, desc: '脑袋像被容嬷嬷扎针一样疼。' }
];

// 工作中触发的随机选择事件
export const WORK_CHOICES = [
  {
    title: "领导的暗示",
    desc: "领导暗示你今晚留下来‘自愿’加班，完成一个紧急需求。",
    options: [
      { text: "立刻答应 (压力+10, 钱+200)", changes: { mental: -10, money: 200, physical: -5 } },
      { text: "果断拒绝 (压力-5, 钱-100)", changes: { mental: 5, money: -100, physical: 0 } } // 扣钱是因为绩效
    ]
  },
  {
    title: "同事的求助",
    desc: "同事想把他的黑锅甩给你，并承诺请你喝奶茶。",
    options: [
      { text: "帮他背锅 (人缘好? 压力+15)", changes: { mental: -15, money: 50 } },
      { text: "当众拆穿 (心情+20, 职场危机)", changes: { mental: 20, money: 0 } }
    ]
  }
];
// 复合死亡条件
export const COMPLEX_DEATHS = [
  {
    // 高体质秒杀：必须体质极高，且有一定随机性
    condition: (s: PlayerStats) => s.physical > 97, 
    text: "你在单位组织的体检中，身体数据过于完美。当晚，一辆黑色面包车停在你家楼下。你被某种不可抗力‘特招’了，从此查无此人（疑似器官被大人物看中）。"
  },
  {
    condition: (s: PlayerStats) => s.money < -50000,
    text: "你的网贷全面崩盘。你在睡梦中被带到了公海的一艘渔船上，这是你最后一次看日出。"
  },
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
