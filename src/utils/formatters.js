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

// Parser Tanggal yang Andal (Format ISO, Timestamp, YYYY-MM-DD, DD/MM/YYYY)
export const parseDateVal = (val) => {
  if (!val) return null;
  if (val instanceof Date && !isNaN(val)) return val;
  const s = String(val).trim();

  // Tangani format timestamp Supabase: 2026-01-05 00:00:00+00 atau 2026-01-05T...
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const datePart = s.slice(0, 10);
    const parts = datePart.split('-');
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return isNaN(d.getTime()) ? null : d;
  }

  // Tangani format DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}/.test(s)) {
    const parts = s.split('/');
    const d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    return isNaN(d.getTime()) ? null : d;
  }

  const parsed = new Date(s);
  return isNaN(parsed.getTime()) ? null : parsed;
};

// Format Date ke String ISO (YYYY-MM-DD)
export const iso = (d) => {
  if (!d) return '';
  const parsed = parseDateVal(d);
  if (!parsed) return '';
  const y = parsed.getFullYear();
  const m = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const startOfDay = (d) => {
  if (!d) return null;
  const date = parseDateVal(d);
  if (!date) return null;
  date.setHours(0, 0, 0, 0);
  return date;
};

export const endOfDay = (d) => {
  if (!d) return null;
  const date = parseDateVal(d);
  if (!date) return null;
  date.setHours(23, 59, 59, 999);
  return date;
};

// Format Tanggal Tampilan Indonesia (05 Jan 2026)
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

// Preset Filter Tanggal Cepat
export const DATE_PRESETS = [
  {
    id: 'today',
    label: 'Hari Ini',
    fullLabel: 'Hari Ini',
    getRange: () => {
      const today = new Date();
      return { from: startOfDay(today), to: endOfDay(today) };
    }
  },
  {
    id: '7days',
    label: '7 Hari',
    fullLabel: '7 Hari Terakhir',
    getRange: () => {
      const today = new Date();
      const from = new Date(today);
      from.setDate(today.getDate() - 6);
      return { from: startOfDay(from), to: endOfDay(today) };
    }
  },
  {
    id: '30days',
    label: '30 Hari',
    fullLabel: '30 Hari Terakhir',
    getRange: () => {
      const today = new Date();
      const from = new Date(today);
      from.setDate(today.getDate() - 29);
      return { from: startOfDay(from), to: endOfDay(today) };
    }
  },
  {
    id: 'thisMonth',
    label: 'Bulan Ini',
    fullLabel: 'Bulan Ini',
    getRange: () => {
      const today = new Date();
      const from = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from: startOfDay(from), to: endOfDay(today) };
    }
  },
  {
    id: 'lastMonth',
    label: 'Bulan Lalu',
    fullLabel: 'Bulan Lalu',
    getRange: () => {
      const today = new Date();
      const from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const to = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
      return { from: startOfDay(from), to: to };
    }
  }
];

// Inisialisasi Default Period (Awal bulan berjalan s.d. hari ini)
export const getDefaultPeriod = () => {
  const today = new Date();
  const from = new Date(today.getFullYear(), today.getMonth(), 1);
  return { from: startOfDay(from), to: endOfDay(today) };
};

// Cek preset yang aktif
export const getActivePresetId = (period) => {
  if (!period || !period.from || !period.to) return null;
  const fromStr = iso(period.from);
  const toStr = iso(period.to);
  for (const p of DATE_PRESETS) {
    const range = p.getRange();
    if (iso(range.from) === fromStr && iso(range.to) === toStr) {
      return p.id;
    }
  }
  return null;
};

// Pewarnaan Dinamis Status Badge
export const getStatusBadgeClass = (statusStr = '') => {
  const s = String(statusStr || '').toUpperCase().trim();
  if (s.includes('SELESAI') || s.includes('OK') || s.includes('DONE') || s.includes('GOOD')) {
    return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';
  }
  if (s.includes('REJECT') || s.includes('ERROR') || s.includes('RUSAK') || s.includes('DEFECT')) {
    return 'bg-rose-500/20 text-rose-300 border border-rose-500/40';
  }
  if (s.includes('WASHING') || s.includes('EXPOSE')) {
    return 'bg-purple-500/20 text-purple-300 border border-purple-500/40';
  }
  if (s.includes('HDI') || s.includes('PROGRESS') || s.includes('PROSES') || s.includes('RUNNING')) {
    return 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40';
  }
  if (s.includes('TUNGGU') || s.includes('INFO') || s.includes('FILE') || s.includes('PENDING') || s.includes('HOLD')) {
    return 'bg-orange-500/20 text-orange-300 border border-orange-500/40';
  }
  // Default: ANTRI / QUEUE
  return 'bg-amber-500/20 text-amber-300 border border-amber-500/40';
};

// Pewarnaan Dinamis Category Badge
export const getCategoryBadgeClass = (categoryStr = '') => {
  const c = String(categoryStr || '').toUpperCase().trim();
  if (c.includes('CTCP')) {
    return 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
  }
  if (c.includes('CTP')) {
    return 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30';
  }
  if (c.includes('FLEXO')) {
    return 'bg-teal-500/20 text-teal-300 border border-teal-500/30';
  }
  if (c.includes('SCREEN')) {
    return 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30';
  }
  if (c.includes('ETCHING') || c.includes('ETCH')) {
    return 'bg-amber-600/20 text-amber-200 border border-amber-600/30';
  }
  return 'bg-slate-700/30 text-slate-300 border border-slate-600/40';
};