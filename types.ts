export type ProfessionType = 'PROGRAMMER' | 'SALES' | 'CIVIL_SERVANT' | 'DELIVERY' | 'FACTORY_WORKER' | 'UNEMPLOYED';

export type WorkSchedule = '965' | '996' | '007'; // 双休 | 单休 | 无休
import { ModalConfig } from './components/EventModal'; // 引用新组件类型
export interface Profession {
  id: ProfessionType;
  name: string;
  salaryBase: number;
  stressFactor: number;
  healthRisk: number;
  description: string;
  schedule: WorkSchedule;
  workDesc: string[]; // 新增：职业专属工作描述
}

export interface PlayerStats {
  physical: number; // 0-100
  mental: number;   // 0-100
  money: number;
  satiety: number;  // 0-100
  cookingSkill: number;
  daysSurvived: number;
}

export type GamePhase = 
  | 'START' | 'MORNING' | 'WORK_AM' | 'REST_AM' 
  | 'LUNCH' | 'WORK_PM' | 'REST_PM' 
  | 'DINNER' | 'FREE_TIME' | 'SLEEP'
  | 'GAME_OVER' | 'EVENT_CNY' | 'MODAL_PAUSE'; // 新增 MODAL_PAUSE

export interface GameState {
  profession: Profession | null;
  stats: PlayerStats;
  phase: GamePhase;
  date: Date;
  time: string;
  log: LogEntry[];
  flags: {
    isDepressed: boolean;
    disease: string | null; // 具体的疾病名称，null为健康
    hasLoan: boolean;
    isSingle: boolean;
    streamerSimpCount: number; // 打赏计数
  };
  modal: ModalConfig; // 新增模态框状态
  gameOverReason: string;
}

export interface LogEntry {
  id: number;
  text: string;
  type: 'info' | 'danger' | 'success' | 'warning' | 'story';
}
