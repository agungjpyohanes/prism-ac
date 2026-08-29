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

// Helper akhir hari (23:59:59.999) - Dibutuhkan oleh OverviewView.jsx
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

// Helper ISO format saat ini
export const nowISO = () => iso(new Date());

// Helper cek status pekerjaan selesai
export const isDone = (val) => {
  if (!val) return false;
  const s = String(val).trim().toLowerCase();
  return s === 'done' || s === 'selesai' || s === 'finish' || s === 'finished' || s === 'ok';
};

// Format mata uang / angka desimal
export const formatNumber = (n) => {
  return num(n).toLocaleString('id-ID');
};

// Format persentase
export const formatPercent = (n) => {
  return `${num(n).toFixed(1)}%`;
};

// Format tanggal standar ID
export const formatDateID = (val) => {
  const d = parseDateVal(val);
  if (!d) return '-';
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

// Helper warna badge status
export const badgeColor = (status) => {
  const s = String(status || '').toLowerCase();
  if (s.includes('done') || s.includes('selesai') || s.includes('ok')) return 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400';
  if (s.includes('progress') || s.includes('proses') || s.includes('running')) return 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400';
  if (s.includes('pending') || s.includes('hold') || s.includes('antri')) return 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-400';
  return 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-400';
};