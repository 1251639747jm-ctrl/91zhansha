import { ModalConfig } from './components/EventModal';

export type ProfessionType = 
  | 'PROGRAMMER' | 'SALES' | 'CIVIL_SERVANT' | 'DELIVERY' | 'FACTORY_WORKER' | 'UNEMPLOYED'
  | 'SECURITY' | 'TAXI_DRIVER' | 'STREAMER';
export type WorkSchedule = '965' | '996' | '007'; 

export interface Profession {
  id: ProfessionType;
  name: string;
  salaryBase: number;
  stressFactor: number;
  healthRisk: number;
  description: string;
  schedule: WorkSchedule;
  workDesc: string[];
  minAge?: number;
  maxAge?: number;
  hasInsurance: boolean;
}

// [新增] 家庭背景
export interface FamilyBackground {
  id: string;
  name: string;
  desc: string;
  moneyModifier: number; // 初始金钱修正
  debtModifier: number;  // 初始负债修正
  statModifier: Partial<PlayerStats>; // 初始属性修正
}

// [新增] 子女系统
export interface Child {
  id: string;
  name: string;
  gender: 'boy' | 'girl';
  age: number;
  educationStage: 'NONE' | 'KINDER' | 'PRIMARY' | 'MIDDLE' | 'HIGH' | 'UNI';
  health: number; // 孩子健康度，过低会生病/夭折
  hunger: number; // 孩子饥饿度，需要奶粉/吃饭
  schoolFeePaid: boolean; // 当前学期学费是否已交
}

export interface PlayerStats {
  age: number;
  physical: number; // 上限 200
  mental: number;
  money: number;
  satiety: number;
  debt: number;
  cookingSkill: number;
  daysSurvived: number;
}

export interface Partner {
  name: string;
  type: string;
  materialism: number;
  affection: number;
  realAffection: number;
  fidelity: number;
}

export type GamePhase = 
  | 'START' | 'MORNING' | 'WORK_AM' | 'REST_AM' 
  | 'LUNCH' | 'WORK_PM' | 'REST_PM' 
  | 'DINNER' | 'FREE_TIME' | 'SLEEP'
  | 'GAME_OVER' | 'EVENT_CNY' | 'MODAL_PAUSE';

export interface GameState {
  profession: Profession | null;
  background: FamilyBackground | null; // [新增]
  stats: PlayerStats;
  phase: GamePhase;
  season: 'SPRING' | 'SUMMER' | 'AUTUMN' | 'WINTER';
  weatherTemp: number; // 当前环境温度
  date: Date;
  debt: number;
  cookingSkill: number;
  time: string;
  log: LogEntry[];
  flags: {
    isDepressed: boolean;
    disease: string | null;
    hasInsurance: boolean;
    hasAC: boolean;       // 是否有空调
    isACOn: boolean;      // 空调是否开启
    bodyTemp: number;     // 玩家体温
    summerDaysWithoutAC: number; // 连续不吹空调天数（用于推高体温）
    hospitalDays: number;
    hospitalDailyCost: number;
    hasLoan: boolean;
    
    // [新增] 医院与黑色面包车相关
    blackVanRisk: number; // 被抓走的风险值 0-100
    lastCheckupDate: string | null; // 上次体检日期
    knownHealth: number | null; // 体检时得知的健康值（只有体检了才知道自己很健康）

    inventory: {
      oil: number;
      badOil: boolean;
      rice: number;
      veggies: number;
      meat: number;
      seasoning: number;
      // [新增] 育儿用品
      milkPowder: number; // 奶粉
      diapers: number;    // 尿布
    };
    streamerSimpCount: number;
    partner: Partner | null;
    children: Child[]; // [新增] 子女列表
    isPursuing: boolean;
    hasHouse: boolean;
    hasCar: boolean;
    parentPressure: number;
  };
  modal: ModalConfig;
  showRelationshipPanel: boolean;
  gameOverReason: string;
}

export interface LogEntry {
  id: number;
  text: string;
  type: 'info' | 'danger' | 'success' | 'warning' | 'story';
}
