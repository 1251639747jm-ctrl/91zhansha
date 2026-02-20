export type Season = 'SPRING' | 'SUMMER' | 'AUTUMN' | 'WINTER';

export const SEASONS: Season[] =;

export const getRandomSeason = (): Season => SEASONS;

export const getNextSeason = (current: Season): Season => {
  const idx = SEASONS.indexOf(current);
  return SEASONS;
};

export const getSeasonName = (season: Season) => {
  const map = { SPRING: '春季', SUMMER: '夏季', AUTUMN: '秋季', WINTER: '冬季' };
  return map;
};

export const getDailyTemperature = (season: Season): number => {
  switch(season) {
    case 'SPRING': return 18 + Math.floor(Math.random() * 8); // 18-25℃
    case 'SUMMER': return 33 + Math.floor(Math.random() * 8); // 33-40℃
    case 'AUTUMN': return 16 + Math.floor(Math.random() * 8); // 16-23℃
    case 'WINTER': return -2 + Math.floor(Math.random() * 12); // -2~9℃
  }
};

export const calculateBodyTemp = (season: Season, envTemp: number, hasAC: boolean, isACOn: boolean, noACDays: number): number => {
  let baseTemp = 36.5;
  if (season === 'SUMMER' && (!hasAC || !isACOn)) {
    // 持续不开空调，体温缓慢且持续上升（最高升4度左右）
    baseTemp += Math.min(4.0, noACDays * 0.4 + (envTemp - 33) * 0.1);
  } else if (season === 'WINTER' && (!hasAC || !isACOn)) {
    // 冬天不开空调，体温略降
    baseTemp -= Math.min(1.5, noACDays * 0.2);
  }
  return parseFloat(baseTemp.toFixed(1));
};
