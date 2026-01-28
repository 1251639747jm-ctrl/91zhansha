--- START OF FILE constants.ts ---
import { PlayerStats, Profession, ProfessionType } from './types';

export const INITIAL_STATS: PlayerStats = {
  physical: 75,
  mental: 80,
  money: 2000,
  satiety: 80,
  cookingSkill: 0,
  daysSurvived: 0,
};

export const PROFESSIONS: Record<ProfessionType, Profession> = {
  PROGRAMMER: {
    id: 'PROGRAMMER',
    name: '全栈程员',
    salaryBase: 900,
    stressFactor: 4,
    healthRisk: 3,
    description: '以发际线换取金钱。高薪，但很容易猝死。'
  },
  SALES: {
    id: 'SALES',
    name: '王牌销售',
    salaryBase: 600,
    stressFactor: 5,
    healthRisk: 4,
    description: '酒桌是你的战场。高压力，容易精神崩溃。'
  },
  SECURITY: {
    id: 'SECURITY',
    name: '夜班保安',
    salaryBase: 350,
    stressFactor: 1,
    healthRisk: 1,
    description: '少走四十年弯路。钱少，但命长。'
  },
  DESIGNER: {
    id: 'DESIGNER',
    name: '苦逼设计',
    salaryBase: 550,
    stressFactor: 6,
    healthRisk: 2,
    description: '五彩斑斓的黑。如果甲方死了，世界就和平了。'
  },
  UNEMPLOYED: {
    id: 'UNEMPLOYED',
    name: '家里蹲',
    salaryBase: 0,
    stressFactor: 0.5,
    healthRisk: 0.5,
    description: '啃老本。虽然自由，但由于没钱，极易被饿死。'
  }
};

export const EVENTS = {
  HIGH_HEALTH_DEATH: [
    "你的身体过于健康，被路过的非法器官贩卖组织强行掳上面包车。",
    "你被选中参加绝密超级士兵实验，从此人间蒸发。",
    "你的各项体征完美得不像人类，被抓去研究所切片研究了。"
  ],
  LOW_HEALTH_DEATH: [
    "在连续熬夜后的清晨，你的心脏停止了跳动。",
    "过劳死。新闻上只留下短短的一行字：某男子猝死家中。",
    "由于免疫力低下，一场普通感冒夺走了你的生命。"
  ],
  LOW_MENTAL_DEATH: [
    "你无法承受生活的重压，选择了一个永远不会醒来的夜晚。",
    "精神彻底崩溃，你疯了，被送进了精神病院度过余生。",
    "绝望吞噬了你，你看着窗外的霓虹灯，纵身一跃..."
  ],
  DEBT_DEATH: [
    "你欠了太多的网贷。暴力催收人员破门而入，你被打死在巷子里。",
    "因为还不起钱，你被迫签署了‘自愿’器官捐赠协议，并在当天执行。",
    "走投无路的你试图抢劫便利店，被店主掏出的散弹枪击毙。"
  ],
  ACCIDENT_DEATH: [
    "你在过马路时低头看手机，没注意到那辆失控的渣土车。",
    "你路过一栋高楼，不幸被一个坠落的花盆砸中头部。",
    "家里煤气泄漏，你在睡梦中再也没有醒来。",
    "你在吃夜宵时被鱼刺卡住喉咙，没能抢救过来。"
  ],
  WORK_EVENTS: [
    "服务器崩溃！全员紧急修复BUG，压力激增。",
    "甲方爸爸在下班前一分钟提出了修改意见。",
    "领导心情不好，把你在会议上痛骂了一顿。",
    "同事甩锅给你，你被迫背了黑锅。",
    "公司的咖啡机坏了，全员陷入焦躁状态。"
  ]
};
