import { ModalConfig } from './components/EventModal';

export type ProfessionType = 'PROGRAMMER' | 'SALES' | 'CIVIL_SERVANT' | 'DELIVERY' | 'FACTORY_WORKER' | 'UNEMPLOYED';
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
}

export interface PlayerStats {
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
    hasLoan: boolean;
    streamerSimpCount: number;
    // --- 新增情感/资产标记 ---
    partner: Partner | null; // 当前对象
    isPursuing: boolean; // 是否正在追求中
    hasHouse: boolean;
    hasCar: boolean;
    parentPressure: number; // 父母施压值 0-100
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
