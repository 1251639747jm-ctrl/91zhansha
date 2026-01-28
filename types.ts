export type ProfessionType = 'PROGRAMMER' | 'SALES' | 'CIVIL_SERVANT' | 'DELIVERY' | 'FACTORY_WORKER' | 'UNEMPLOYED';

export type WorkSchedule = '965' | '996' | '007'; // 双休 | 单休 | 无休

export interface Profession {
  id: ProfessionType;
  name: string;
  salaryBase: number;
  stressFactor: number;
  healthRisk: number;
  description: string;
  schedule: WorkSchedule;
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
  | 'START' 
  | 'MORNING' 
  | 'WORK_AM' | 'REST_AM' // 工作日上午 / 休息日上午
  | 'LUNCH' 
  | 'WORK_PM' | 'REST_PM' // 工作日下午 / 休息日下午
  | 'DINNER' 
  | 'FREE_TIME' 
  | 'SLEEP'
  | 'GAME_OVER'
  | 'EVENT_CNY'; // 特殊事件：春节

export interface GameState {
  profession: Profession | null;
  stats: PlayerStats;
  phase: GamePhase;
  date: Date; // 真实日期对象
  time: string;
  log: LogEntry[];
  flags: {
    isDepressed: boolean;
    isSick: boolean;
    hasLoan: boolean;
    isSingle: boolean;
  };
  gameOverReason: string;
}

export interface LogEntry {
  id: number;
  text: string;
  type: 'info' | 'danger' | 'success' | 'warning' | 'story';
}
