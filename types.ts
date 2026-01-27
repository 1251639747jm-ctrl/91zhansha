export type ProfessionType = 'PROGRAMMER' | 'SALES' | 'SECURITY' | 'DESIGNER' | 'UNEMPLOYED';

export interface Profession {
  id: ProfessionType;
  name: string;
  salaryBase: number; // Daily salary
  stressFactor: number; // How much mental health decreases per work hour
  healthRisk: number; // How much physical health decreases per work hour
  description: string;
}

export interface PlayerStats {
  physical: number; // 0-100
  mental: number; // 0-100
  money: number;
  satiety: number; // 0-100 (Hunger)
  cookingSkill: number; // 0-100
  daysSurvived: number;
}

export type GamePhase = 
  | 'START' 
  | 'MORNING' 
  | 'WORK_AM' 
  | 'LUNCH' 
  | 'WORK_PM' 
  | 'DINNER' 
  | 'FREE_TIME' 
  | 'SLEEP'
  | 'GAME_OVER';

export interface GameState {
  profession: Profession | null;
  stats: PlayerStats;
  phase: GamePhase;
  time: string; // "07:00"
  log: LogEntry[];
  flags: {
    isDepressed: boolean;
    hasInsurance: boolean;
    isSick: boolean;
  };
  gameOverReason: string;
}

export interface LogEntry {
  id: number;
  text: string;
  type: 'info' | 'danger' | 'success' | 'warning' | 'story';
}
