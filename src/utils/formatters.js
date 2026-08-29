export const num = (v) => {
  if (v === null || v === undefined || v === '') return 0;
  if (typeof v === 'number') return isNaN(v) ? 0 : v;
  const cleaned = String(v).replace(/[^0-9.-]+/g, '');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
};

export const cell = (row, idx) => {
  if (!row || !Array.isArray(row) || idx === undefined || idx < 0 || idx >= row.length) return '';
  const val = row[idx];
  return val === null || val === undefined ? '' : String(val);
};

export const parseDateVal = (val) => {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;

  if (typeof val === 'string') {
    const s = val.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
      const parts = s.substring(0, 10).split('-');
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      return isNaN(d.getTime()) ? null : d;
    }
    if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}/.test(s)) {
      const parts = s.split(/[\/\-]/);
      const d = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
      return isNaN(d.getTime()) ? null : d;
    }
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }

  if (typeof val === 'number') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }

  return null;
};

export const iso = (d) => {
  const parsed = parseDateVal(d);
  if (!parsed) return '';
  const y = parsed.getFullYear();
  const m = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const hexA = (hex, alpha = 0.2) => {
  if (!hex || typeof hex !== 'string') return `rgba(59, 130, 246, ${alpha})`;
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const numVal = parseInt(c, 16);
  if (isNaN(numVal)) return `rgba(59, 130, 246, ${alpha})`;
  const r = (numVal >> 16) & 255;
  const g = (numVal >> 8) & 255;
  const b = numVal & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const jopCat = (jopName) => {
  const s = String(jopName || '').toUpperCase();
  if (s.startsWith('O') || s.includes('OFFSET')) return 'Offset';
  if (s.startsWith('F') || s.includes('FLEXO')) return 'Flexo';
  if (s.startsWith('S') || s.includes('SCREEN') || s.includes('SABLON')) return 'Screen';
  if (s.startsWith('E') || s.includes('ETCHING')) return 'Etching';
  if (s.startsWith('D') || s.includes('DIGITAL')) return 'Digital';
  return 'Lainnya';
};

export const countBy = (arr, fn) => {
  return (arr || []).reduce((acc, item) => {
    const key = typeof fn === 'function' ? fn(item) : item[fn];
    if (key !== undefined && key !== null && key !== '') {
      acc[key] = (acc[key] || 0) + 1;
    }
    return acc;
  }, {});
};

export const startOfDay = (d) => {
  if (!d) return null;
  const dateObj = d instanceof Date ? new Date(d) : parseDateVal(d);
  if (!dateObj || isNaN(dateObj.getTime())) return null;
  dateObj.setHours(0, 0, 0, 0);
  return dateObj;
};

export const endOfDay = (d) => {
  if (!d) return null;
  const dateObj = d instanceof Date ? new Date(d) : parseDateVal(d);
  if (!dateObj || isNaN(dateObj.getTime())) return null;
  dateObj.setHours(23, 59, 59, 999);
  return dateObj;
};

export const fmtDate = (d) => {
  const parsed = parseDateVal(d);
  if (!parsed) return '-';
  return parsed.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

export const fmtPeriodRange = (from, to) => {
  if (!from && !to) return 'Semua Periode';
  const f = parseDateVal(from);
  const t = parseDateVal(to);
  if (f && t) return `${fmtDate(f)} — ${fmtDate(t)}`;
  if (f) return `Sejak ${fmtDate(f)}`;
  if (t) return `Hingga ${fmtDate(t)}`;
  return 'Semua Periode';
};

export const calcRowMetrics = (good, defect, replace, calcType = 'offset') => {
  const g = num(good);
  const d = num(defect);
  const r = num(replace);

  let output = 0;
  let defectRate = 0;
  let replaceRate = 0;

  if (calcType === 'offset') {
    output = g + d;
    defectRate = output > 0 ? (d / output) * 100 : 0;
    replaceRate = output > 0 ? (r / output) * 100 : 0;
  } else {
    output = g;
    defectRate = g > 0 ? (d / g) * 100 : 0;
    replaceRate = g > 0 ? (r / g) * 100 : 0;
  }

  return { good: g, defect: d, replace: r, output, defectRate, replaceRate };
};