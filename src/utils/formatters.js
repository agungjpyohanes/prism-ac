// Helper parsing angka
export const num = (val) => {
  if (val === null || val === undefined || val === '') return 0;
  const n = Number(String(val).replace(/[^0-9.-]/g, ''));
  return isNaN(n) ? 0 : n;
};

// Helper pembacaan cell array atau object
export const cell = (row, idx) => {
  if (!row) return '';
  if (Array.isArray(row)) return row[idx] ?? '';
  if (typeof row === 'object') {
    const keys = Object.keys(row);
    return row[keys[idx]] ?? row[idx] ?? '';
  }
  return '';
};

// Helper parsing tanggal
export const parseDateVal = (val) => {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
};

// Helper awal hari (00:00:00.000)
export const startOfDay = (d) => {
  const date = parseDateVal(d) || new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

// Helper akhir hari (23:59:59.999)
export const endOfDay = (d) => {
  const date = parseDateVal(d) || new Date();
  date.setHours(23, 59, 59, 999);
  return date;
};

// Helper format ISO Date string YYYY-MM-DD
export const iso = (d = new Date()) => {
  const date = parseDateVal(d) || new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const nowISO = () => iso(new Date());

// Format Tanggal (fmtDate & formatDateID)
export const fmtDate = (val) => {
  const d = parseDateVal(val);
  if (!d) return '-';
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

export const formatDateID = fmtDate;

// Format Waktu (fmtTime)
export const fmtTime = (val) => {
  if (!val) return '-';
  if (typeof val === 'string' && val.includes(':')) return val.slice(0, 5);
  const d = parseDateVal(val);
  if (!d) return '-';
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
};

// Format Tanggal & Waktu (fmtDateTime)
export const fmtDateTime = (val) => {
  const d = parseDateVal(val);
  if (!d) return '-';
  return `${fmtDate(d)} ${fmtTime(d)}`;
};

// Format Rentang Periode (fmtPeriodRange) - Dibutuhkan oleh ProductionView.jsx
export const fmtPeriodRange = (period) => {
  if (!period) return 'Semua Periode';
  if (typeof period === 'string') return period;
  if (period.type === 'today') return `Hari Ini (${fmtDate(new Date())})`;
  if (period.type === 'all') return 'Semua Data';
  if (period.start && period.end) {
    if (iso(period.start) === iso(period.end)) return fmtDate(period.start);
    return `${fmtDate(period.start)} - ${fmtDate(period.end)}`;
  }
  if (period.start) return `Sejak ${fmtDate(period.start)}`;
  if (period.end) return `Hingga ${fmtDate(period.end)}`;
  return 'Semua Periode';
};

// Format Angka (fmtNum & formatNumber)
export const fmtNum = (n) => num(n).toLocaleString('id-ID');
export const formatNumber = fmtNum;

// Format Persen (fmtPct & formatPercent)
export const fmtPct = (n) => `${num(n).toFixed(1)}%`;
export const formatPercent = fmtPct;

// Helper konversi Hex Color ke RGBA
export const hexA = (hex, alpha = 1) => {
  if (!hex) return `rgba(100, 116, 139, ${alpha})`;
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  const numVal = parseInt(c, 16);
  return `rgba(${(numVal >> 16) & 255}, ${(numVal >> 8) & 255}, ${numVal & 255}, ${alpha})`;
};

// Helper cek status selesai
export const isDone = (val) => {
  if (!val) return false;
  const s = String(val).trim().toLowerCase();
  return s === 'done' || s === 'selesai' || s === 'finish' || s === 'finished' || s === 'ok';
};

// Helper konversi string durasi "HH:MM:SS" / "MM:SS" ke menit
export const durToMin = (durationStr) => {
  if (!durationStr) return 0;
  const parts = String(durationStr).split(':');
  if (parts.length === 2) return num(parts[0]) * 60 + num(parts[1]);
  if (parts.length === 3) return num(parts[0]) * 60 + num(parts[1]) + num(parts[2]) / 60;
  return num(durationStr);
};

export const safeArr = (arr) => (Array.isArray(arr) ? arr : []);

// Helper Group By
export const groupBy = (arr, keyFn) => {
  const list = safeArr(arr);
  return list.reduce((acc, item) => {
    const k = typeof keyFn === 'function' ? keyFn(item) : item[keyFn];
    const key = k || 'Lainnya';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
};

// Helper Count By
export const countBy = (arr, keyFn) => {
  const list = safeArr(arr);
  return list.reduce((acc, item) => {
    const k = typeof keyFn === 'function' ? keyFn(item) : item[keyFn];
    const key = k || 'Lainnya';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
};

// Helper Sum By
export const sumBy = (arr, valFn) => {
  const list = safeArr(arr);
  return list.reduce((sum, item) => {
    const v = typeof valFn === 'function' ? valFn(item) : item[valFn];
    return sum + num(v);
  }, 0);
};

// Helper warna badge status
export const badgeColor = (status) => {
  const s = String(status || '').toLowerCase();
  if (s.includes('done') || s.includes('selesai') || s.includes('ok')) return 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400';
  if (s.includes('progress') || s.includes('proses') || s.includes('running')) return 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400';
  if (s.includes('pending') || s.includes('hold') || s.includes('antri')) return 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-400';
  return 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-400';
};