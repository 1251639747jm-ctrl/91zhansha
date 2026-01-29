import { ModalConfig } from './components/EventModal';

export type ProfessionType = 
  | 'PROGRAMMER' | 'SALES' | 'CIVIL_SERVANT' | 'DELIVERY' | 'FACTORY_WORKER' | 'UNEMPLOYED'
  | 'SECURITY' | 'TAXI_DRIVER' | 'STREAMER'; // [新增] 保安、出租车、主播
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
  hasInsurance: boolean; // [新增] 是否有医保
}

export interface PlayerStats {
  age: number; // [新增] 当前年龄
  physical: number;
  mental: number;
  money: number;
  satiety: number;
  debt: number; // [新增] 负债总额 (房贷车贷)
  cookingSkill: number;
  daysSurvived: number;
}

export interface Partner {
  name: string;
  type: string; // "绿茶", "扶弟魔", "白富美" 等
  materialism: number; // 拜金程度 (消耗倍率)
  affection: number; // 【表象好感度】(玩家看得到的，可能全是虚情假意)
  realAffection: number; // [新增] 【真实好感度】(决定成败，对玩家隐藏)
  fidelity: number; // 忠诚度 (出轨概率)
}

export type GamePhase = 
  | 'START' | 'MORNING' | 'WORK_AM' | 'REST_AM' 
  | 'LUNCH' | 'WORK_PM' | 'REST_PM' 
  | 'DINNER' | 'FREE_TIME' | 'SLEEP'
  | 'GAME_OVER' | 'EVENT_CNY' | 'MODAL_PAUSE';

export interface GameState {
  profession: Profession | null;
  stats: PlayerStats;
  phase: GamePhase;
  date: Date;
  debt: number;          // 新增
  cookingSkill: number;  // 新增
  time: string;
  log: LogEntry[];
  flags: {
    isDepressed: boolean;
    disease: string | null;
    hasInsurance: boolean; // [新增] 
    hospitalDays: number; // 剩余住院天数，0表示未住院
    hospitalDailyCost: number; // 住院日花费
    hasLoan: boolean;
    inventory: {
      oil: number;     // 食用油 (单位: 瓶)
      badOil: boolean; // [新增] 是否买到了煤油混装油
      rice: number;    // 米面 (单位: 份)
      veggies: number; // 蔬菜 (单位: 份)
      meat: number;    // 肉类 (单位: 份)
      seasoning: number; // 调料 (单位: 份)
    };
    streamerSimpCount: number;
    partner: Partner | null;
    isPursuing: boolean;
    hasHouse: boolean;
    hasCar: boolean;
    parentPressure: number;
  };
  modal: ModalConfig;
  showRelationshipPanel: boolean; // 控制新UI显示
  gameOverReason: string;
}

export interface LogEntry {
  id: number;
  text: string;
  type: 'info' | 'danger' | 'success' | 'warning' | 'story';
}
