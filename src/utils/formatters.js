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

// Format Tanggal DD/MM/YYYY
export const fmtDDMMYYYY = (d) => {
  if (!d) return '--/--/----';
  const parsed = parseDateVal(d);
  if (!parsed) return String(d);
  const day = String(parsed.getDate()).padStart(2, '0');
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const year = parsed.getFullYear();
  return `${day}/${month}/${year}`;
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

// Map Evaluasi Kategori Job Berdasarkan Karakter Pertama Kolom job_no (0-9)
export const JOB_CATEGORY_MAP = {
  '0': 'Sticker Flexo',
  '1': 'School Supply',
  '2': 'Office Supply',
  '3': 'Kertas Surat',
  '4': 'Envelope',
  '5': 'Gift Wrap',
  '6': 'Others',
  '7': 'Jasa',
  '8': 'Export',
  '9': 'Carton Box'
};

export const getJobCategoryByNo = (jobNo) => {
  if (jobNo === undefined || jobNo === null) return 'Uncategorized';
  const clean = String(jobNo).trim();
  if (!clean) return 'Uncategorized';
  const firstChar = clean.charAt(0);
  return JOB_CATEGORY_MAP[firstChar] || 'Uncategorized';
};

// Pewarnaan Dinamis Status Badge Berdasarkan Tahapan Proses (Light Mode & Dark Mode Optimized)
export const getStatusBadgeClass = (statusStr = '') => {
  const s = String(statusStr || '').toLowerCase().trim();
  if (!s) {
    return 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
  }

  // 1. Antri / Antrean
  if (s === 'antri' || s === 'antrean' || s.includes('queue') || s === 'pending') {
    return 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
  }
  // 2. Tunggu File
  if (s.includes('tunggu file')) {
    return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40';
  }
  // 3. Tunggu Info
  if (s.includes('tunggu info')) {
    return 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-500/20 dark:text-yellow-300 dark:border-yellow-500/40';
  }
  // 4. Film & File
  if (s.includes('film & file') || s.includes('film and file') || s === 'film' || s === 'file') {
    return 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/40';
  }
  // 5. Layout
  if (s.includes('layout')) {
    return 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-500/20 dark:text-sky-300 dark:border-sky-500/40';
  }
  // 6. HDI
  if (s.includes('hdi')) {
    return 'bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-500/20 dark:text-violet-300 dark:border-violet-500/40';
  }
  // 7. Main Expose
  if (s.includes('main expose')) {
    return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/40';
  }
  // 8. Expose
  if (s.includes('expose')) {
    return 'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/40';
  }
  // 9. Washing
  if (s.includes('washing') || s.includes('wash') || s.includes('cuci')) {
    return 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-500/20 dark:text-teal-300 dark:border-teal-500/40';
  }
  // 10. Drying
  if (s.includes('drying') || s.includes('dry') || s.includes('kering')) {
    return 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-500/40';
  }
  // 11. Gerinda
  if (s.includes('gerinda') || s.includes('grind')) {
    return 'bg-zinc-200 text-zinc-800 border-zinc-400 dark:bg-zinc-700/40 dark:text-zinc-200 dark:border-zinc-600';
  }
  // 12. Hapus Screen
  if (s.includes('hapus screen') || s.includes('hapus') || s.includes('afdruuk') || s.includes('afdruk')) {
    return 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40';
  }
  // 13. Poles
  if (s.includes('poles') || s.includes('polish')) {
    return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/40';
  }
  // 14. Keraskan
  if (s.includes('keraskan') || s.includes('hard') || s.includes('hardening')) {
    return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40';
  }
  // 15. Lem Screen
  if (s.includes('lem screen') || s.includes('lem') || s.includes('glue')) {
    return 'bg-lime-100 text-lime-800 border-lime-300 dark:bg-lime-500/20 dark:text-lime-300 dark:border-lime-500/40';
  }
  // 16. Selesai / OK / Done / Default
  return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40';
};

// Pewarnaan Dinamis Category Badge (Light Mode & Dark Mode Optimized)
export const getCategoryBadgeClass = (categoryStr = '') => {
  const c = String(categoryStr || '').toUpperCase().trim();
  if (c.includes('CTCP')) {
    return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30';
  }
  if (c.includes('CTP')) {
    return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30';
  }
  if (c.includes('FLEXO')) {
    return 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-500/20 dark:text-teal-300 dark:border-teal-500/30';
  }
  if (c.includes('SCREEN')) {
    return 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-500/20 dark:text-fuchsia-300 dark:border-fuchsia-500/30';
  }
  if (c.includes('ETCHING') || c.includes('ETCH')) {
    return 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-600/20 dark:text-amber-200 dark:border-amber-600/30';
  }
  return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700/30 dark:text-slate-300 dark:border-slate-600/40';
};

// Konfigurasi Dinamis Tema Grafik (Light / Dark Mode)
export const getChartTheme = () => {
  const isLight = typeof document !== 'undefined' && document.documentElement.classList.contains('light');
  return {
    isLight,
    gridColor: isLight ? 'rgba(203, 213, 225, 0.7)' : 'rgba(255, 255, 255, 0.06)',
    tickColor: isLight ? '#475569' : '#94a3b8',
    legendColor: isLight ? '#1e293b' : '#e2e8f0',
    tooltipBg: '#0f172a',
    tooltipText: '#f8fafc',
    goodColor: isLight ? '#059669' : '#10b981',
    defectColor: isLight ? '#dc2626' : '#f43f5e',
    totalColor: isLight ? '#2563eb' : '#38bdf8'
  };
};