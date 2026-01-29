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
}

export interface PlayerStats {
  age: number; // [新增] 当前年龄
  physical: number;
  mental: number;
  money: number;
  satiety: number;
  cookingSkill: number;
  daysSurvived: number;
}

export interface Partner {
  name: string;
  type: string; // "绿茶", "扶弟魔", "白富美" 等
  affection: number; // 隐藏好感度 0-100
  materialism: number; // 拜金程度 (消耗倍率)
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
  time: string;
  log: LogEntry[];
  flags: {
    isDepressed: boolean;
    disease: string | null;
    hospitalDays: number; // 剩余住院天数，0表示未住院
    hospitalDailyCost: number; // 住院日花费
    hasLoan: boolean;
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
