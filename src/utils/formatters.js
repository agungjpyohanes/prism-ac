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

// Helper awal hari
export const startOfDay = (d) => {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
};

// Helper format ISO Date string YYYY-MM-DD (Dibutuhkan oleh Header.jsx)
export const iso = (d = new Date()) => {
  const date = parseDateVal(d) || new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper cek status pekerjaan selesai (isDone)
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