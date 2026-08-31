export const fmtNum = (n) => {
  if (n === null || n === undefined) return '0';
  return Number(n).toLocaleString('id-ID');
};

export const fmtPct = (n) => `${((Number(n) || 0) * 100).toFixed(1)}%`;

export const fmtDate = (d) => {
  if (!d) return '-';
  const date = new Date(d);
  return isNaN(date.getTime()) ? d : date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};