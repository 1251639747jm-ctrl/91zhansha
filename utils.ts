export const getRandomInt = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const formatCurrency = (amount: number) => {
  return `¥${amount.toLocaleString()}`;
};

export const getHealthColor = (val: number) => {
  if (val > 90) return 'text-purple-400 animate-pulse'; // Danger zone high
  if (val > 60) return 'text-green-400';
  if (val > 30) return 'text-yellow-400';
  return 'text-red-500 font-bold';
};

export const getMentalColor = (val: number) => {
  if (val > 60) return 'text-blue-400';
  if (val > 30) return 'text-yellow-400';
  return 'text-red-500 font-bold';
};
