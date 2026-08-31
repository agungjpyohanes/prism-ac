export const parseDateVal = (val) => {
  if (!val) return null;
  if (val instanceof Date && !isNaN(val)) return val;
  const s = String(val).trim();

  // Tangani format timestamp Supabase: 2026-01-05 00:00:00+00 atau 2026-01-05T...
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const datePart = s.slice(0, 10); // Ambil YYYY-MM-DD
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