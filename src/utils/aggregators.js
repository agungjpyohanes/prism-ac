export const aggregateByDate = (rows = [], days = 30) => {
  const map = {};
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  rows.forEach((r) => {
    if (!r.date) return;
    const d = new Date(r.date);
    if (d < cutoff) return;
    const key = r.date.slice(0, 10);
    if (!map[key]) map[key] = { date: key, qty_good: 0, qty_defect: 0, qty_replace: 0 };
    map[key].qty_good += Number(r.qty_good || 0);
    map[key].qty_defect += Number(r.qty_defect || 0);
    map[key].qty_replace += Number(r.qty_replace || 0);
  });

  return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
};

export const aggregateByGroup = (rows = [], key) => {
  const map = {};
  rows.forEach((r) => {
    const k = r[key] || '-';
    if (!map[k]) map[k] = { name: k, qty_good: 0, qty_defect: 0, qty_replace: 0, qty_new: 0, count: 0 };
    map[k].qty_good += Number(r.qty_good || 0);
    map[k].qty_defect += Number(r.qty_defect || 0);
    map[k].qty_replace += Number(r.qty_replace || 0);
    map[k].qty_new += Number(r.qty_new || 0);
    map[k].count += 1;
  });

  return Object.values(map).map((v) => ({
    ...v,
    defect_rate: v.qty_good + v.qty_defect > 0 ? v.qty_defect / (v.qty_good + v.qty_defect) : 0,
    replace_rate: v.qty_new > 0 ? v.qty_replace / v.qty_new : 0
  })).sort((a, b) => b.qty_good - a.qty_good);
};

export const aggregateReasons = (rows = [], reasonKey) => {
  const map = {};
  rows.forEach((r) => {
    const reason = (r[reasonKey] || '').trim();
    if (!reason) return;
    if (!map[reason]) map[reason] = { reason, count: 0, qty: 0 };
    map[reason].count += 1;
    map[reason].qty += Number(r.qty_defect || r.qty_replace || 0);
  });
  return Object.values(map).sort((a, b) => b.count - a.count);
};