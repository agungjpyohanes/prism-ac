// Nilai aman pembacaan cell dari baris array
export const cell = (row, idx, fallback = '-') => {
  if (!row || idx === undefined || idx === null || idx < 0) return fallback;
  const val = row[idx];
  if (val === undefined || val === null || String(val).trim() === '') return fallback;
  return String(val);
};

// Parsing angka aman
export const num = (val, fallback = 0) => {
  if (val === undefined || val === null || val === '') return fallback;
  if (typeof val === 'number') return isNaN(val) ? fallback : val;
  const clean = String(val).replace(/[^\d.-]/g, '');
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? fallback : parsed;
};

// Format Angka Ribuan Indonesia
export const fmtNum = (n) => {
  if (n === null || n === undefined) return '0';
  return Number(n).toLocaleString('id-ID');
};

// Format Persentase
export const fmtPct = (n) => {
  const val = Number(n) || 0;
  return `${(val * 100).toFixed(1)}%`;
};

// Hex to RGBA generator
export const hexA = (hex, alpha = 0.2) => {
  if (!hex || typeof hex !== 'string') return `rgba(100, 116, 139, ${alpha})`;
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const numVal = parseInt(c, 16);
  if (isNaN(numVal)) return `rgba(100, 116, 139, ${alpha})`;
  return `rgba(${(numVal >> 16) & 255}, ${(numVal >> 8) & 255}, ${numVal & 255}, ${alpha})`;
};

// Deteksi Kategori JOP
export const jopCat = (str = '') => {
  const s = String(str).toUpperCase();
  if (s.includes('FLEXO')) return 'FLEXO';
  if (s.includes('SCREEN') || s.includes('SAB') || s.includes('POLY')) return 'SCREEN';
  if (s.includes('ETCH') || s.includes('EMBOSS') || s.includes('FOIL')) return 'ETCHING';
  if (s.includes('SAMPLE') || s.includes('PROTOTYPE')) return 'SAMPLE';
  if (s.includes('REPRINT') || s.includes('ULANG')) return 'REPRINT';
  return 'O';
};

// Agregasi Penghitung (Count By)
export const countBy = (arr = [], keyFn = (x) => x) => {
  const counts = {};
  arr.forEach((item) => {
    const k = typeof keyFn === 'function' ? keyFn(item) : item[keyFn];
    if (k !== undefined && k !== null && String(k).trim() !== '') {
      counts[k] = (counts[k] || 0) + 1;
    }
  });
  return counts;
};

// Parsing Date
export const parseDateVal = (val) => {
  if (!val) return null;
  if (val instanceof Date && !isNaN(val)) return val;
  const s = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const parts = s.slice(0, 10).split('-');
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return isNaN(d) ? null : d;
  }
  const parsed = new Date(s);
  return isNaN(parsed) ? null : parsed;
};

export const startOfDay = (d) => {
  if (!d) return null;
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
};

export const endOfDay = (d) => {
  if (!d) return null;
  const date = new Date(d);
  date.setHours(23, 59, 59, 999);
  return date;
};

// Format Tanggal
export const fmtDate = (d) => {
  if (!d) return '-';
  const parsed = parseDateVal(d);
  if (!parsed) return String(d);
  return parsed.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Format Rentang Periode
export const fmtPeriodRange = (start, end) => {
  if (!start && !end) return 'Semua Periode';
  if (start && !end) return `Mulai ${fmtDate(start)}`;
  if (!start && end) return `Sampai ${fmtDate(end)}`;
  return `${fmtDate(start)} – ${fmtDate(end)}`;
};

export const fmtDateRange = fmtPeriodRange;