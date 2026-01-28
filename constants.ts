import { Profession, ProfessionType } from './types';

export const PROFESSIONS: Record<ProfessionType, Profession> = {
  PROGRAMMER: {
    id: 'PROGRAMMER',
    name: '牛马程序员',
    salaryBase: 800,
    stressFactor: 2.5,
    healthRisk: 1.5,
    description: '高薪由于高风险。发际线与存款成反比。'
  },
  SALES: {
    id: 'SALES',
    name: '背锅销售',
    salaryBase: 400, // + commission random
    stressFactor: 3.0,
    healthRisk: 1.0,
    description: '每天都在喝酒应酬和被客户骂之间反复横跳。'
  },
  DESIGNER: {
    id: 'DESIGNER',
    name: '秃头设计师',
    salaryBase: 500,
    stressFactor: 2.0,
    healthRisk: 1.2,
    description: '五彩斑斓的黑，这版不行还是用回第一版吧。'
  },
  SECURITY: {
    id: 'SECURITY',
    name: '摸鱼保安',
    salaryBase: 200,
    stressFactor: 0.5,
    healthRisk: 0.2,
    description: '少走四十年弯路。身体倍儿棒，就是没钱。'
  },
  UNEMPLOYED: {
    id: 'UNEMPLOYED',
    name: '灵活就业者',
    salaryBase: 0,
    stressFactor: 1.0, // Anxiety
    healthRisk: 0.5,
    description: '只要不饿死，每天都是假期。'
  }
};

export const EVENTS = {
  HIGH_HEALTH_DEATH: [
    "你感觉身体充满了力量，甚至能打死一头牛。突然，一辆黑色面包车停在你身边，几个黑衣人说你的肾源...啊不，你的体质非常适合他们的'超级士兵计划'。你被带走了。",
    "体检报告显示你的身体指标完美得像个假人。当晚，神秘组织'健康收割者'潜入你家。你失踪了。",
    "你过于健康，在公司显得格格不入。老板怀疑你是商业间谍，派人把你做掉了。"
  ],
  LOW_HEALTH_DEATH: [
    "心脏一阵剧痛，眼前的代码变成了乱码。你倒在了工位上，成为了新闻里的又一个'过劳死'案例。",
    "身体彻底罢工了。你在去医院的路上倒下，再也没有醒来。",
    "连续熬夜让你免疫力归零，一场小感冒引发了多器官衰竭。"
  ],
  LOW_MENTAL_DEATH: [
    "世界变成了灰色。你站在天台上，觉得引力是唯一的解脱。",
    "精神崩溃了。你开始对着空气说话，被强制送进了精神病院，游戏结束。",
    "抑郁症彻底吞噬了你。你失去了起床的力气，在绝望中自行了断。"
  ],
  WORK_EVENTS: [
    "老板画了个巨大的饼，虽然没吃饱，但你觉得有点恶心。（心情 -5）",
    "需求又改了！这已经是第12版了！（心情 -10，健康 -2）",
    "同事甩锅给你，你被迫加班背锅。（时间流逝，心情 -15）",
    "摸鱼被抓个正着，扣除工资200元。",
    "公司下午茶，抢到一块劣质蛋糕。（饱腹 +5，心情 +2）"
  ]
};

export const INITIAL_STATS = {
  physical: 60,
  mental: 60,
  money: 2000,
  satiety: 80,
  cookingSkill: 5,
  daysSurvived: 1
};
