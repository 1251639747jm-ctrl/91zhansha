export type LogType = 'info' | 'danger' | 'success' | 'story';

export interface LogEntry {
  id: number;
  text: string;
  type: LogType;
}

export interface PlayerStats {
  physical: number; // 身体 (0-100)
  mental: number;   // 压力值 (0-100，越高越危险)
  money: number;    // 金钱
  satiety: number;  // 饱食度
  daysSurvived: number;
}

export interface Profession {
  id: string;
  name: string;
  description: string;
  salary: number;
  stressFactor: number; // 基础压力倍率
}

export type GamePhase = 'START' | 'MORNING' | 'WORKING' | 'LUNCH' | 'FREE' | 'GAMEOVER';
