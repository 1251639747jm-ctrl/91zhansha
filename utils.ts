export const getRandomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDateCN = (date: Date): string => {
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${weekDays[date.getDay()]}`;
};

export const isWeekend = (date: Date, schedule: string): boolean => {
  const day = date.getDay(); // 0 is Sunday, 6 is Saturday
  if (schedule === '007') return false; // 永不休息
  if (schedule === '996') return day === 0; // 只有周日休息
  if (schedule === '965') return day === 0 || day === 6; // 双休
  return true; // 失业全休
};

export const getHealthColor = (value: number): string => {
  if (value > 90) return 'text-purple-400';
  if (value > 70) return 'text-green-400';
  if (value > 40) return 'text-yellow-400';
  return 'text-red-500';
};

export const getMentalColor = (value: number): string => {
  if (value > 70) return 'text-blue-400';
  if (value > 40) return 'text-yellow-400';
  return 'text-red-500';
};
