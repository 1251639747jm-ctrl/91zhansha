import { Profession } from './types';

export const PROFESSIONS: Record<string, Profession> = {
  PROGRAMMER: {
    id: 'PROGRAMMER',
    name: '大厂架构师',
    description: '薪资极高，但你的头发和心脏都是易耗品。',
    salary: 800,
    stressFactor: 1.8
  },
  RIDER: {
    id: 'RIDER',
    name: '外卖蓝骑士',
    description: '穿梭在车流中的博弈大师，红灯是你唯一的敌人。',
    salary: 400,
    stressFactor: 1.2
  },
  FLEXIBLE: {
    id: 'FLEXIBLE',
    name: '自媒体博主',
    description: '自由但焦虑，精神内耗的终极形态。',
    salary: 300,
    stressFactor: 1.5
  }
};

export const INITIAL_STATS = {
  physical: 80,
  mental: 20,
  money: 500,
  satiety: 100,
  daysSurvived: 1
};

export const DEATH_EVENTS = [
  "凌晨三点刷到“年轻人不加班在干什么”的短视频，气血上涌，当场气绝。",
  "由于连续吃了一个月劣质外卖，你的肠道菌群发动了政变。",
  "体检报告出来了，因为体质过于健康被神秘组织盯上，消失在下班路上。",
  "老板在周会上画的饼太大，你当场被噎死。",
  "在网络争论中被对方气到脑溢血，临死前还在打：‘你IP哪里...’",
  "疯狂星期四由于吃得太快，被原味鸡骨头卡住气管，物理超度。",
  "过马路回老板微信，被一辆闯红灯的渣土车送往异世界。"
];
