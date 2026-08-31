import React, { useState, useMemo } from 'react';
import { SHEETS } from '../../constants/schema';
import { parseDateVal, fmtDate, cell } from '../../utils/formatters';
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, Database } from 'lucide-react';

export default function DataTableView({ tabKey, data, period, onSelectRow }) {
  const cfg = SHEETS[tabKey] || SHEETS.rec_ctcp;
  const rawRows = (data && data[tabKey]) || [];
  
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState(cfg.i.date ?? 4);
  const [sortDir, setSortDir] = useState(-1); // -1: Descending (terbaru duluan), 1: Ascending
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Filter Periode & Search Query
  const filteredRows = useMemo(() => {
    return rawRows.filter(r => {
      const idVal = cell(r, cfg.i.id).trim();
      const jopVal = cell(r, cfg.i.jop).trim();
      const noJopVal = cell(r, cfg.i.nojop).trim();
      if (!idVal || (!jopVal && !noJopVal)) return false;

      const d = parseDateVal(r[cfg.i.date]);
      const from = period?.from ? new Date(period.from).setHours(0, 0, 0, 0) : null;
      const to = period?.to ? new Date(period.to).setHours(23, 59, 59, 999) : null;
      if (d) {
        if (from && d.getTime() < from) return false;
        if (to && d.getTime() > to) return false;
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        return (cfg.dataCols || []).some(ci => String(r[ci] || '').toLowerCase().includes(q));
      }
      return true;
    });
  }, [rawRows, cfg, period, search]);

  // Sorting
  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((a, b) => {
      const va = a[sortCol];
      const vb = b[sortCol];
      if (sortCol === cfg.i.date) {
        const da = parseDateVal(va)?.getTime() || 0;
        const db = parseDateVal(vb)?.getTime() || 0;
        return (da - db) * sortDir;
      }
      if (!isNaN(va) && !isNaN(vb) && va !== '' && vb !== '') {
        return (Number(va) - Number(vb)) * sortDir;
      }
      return String(va || '').localeCompare(String(vb || ''), 'id') * sortDir;
    });
  }, [filteredRows, sortCol, sortDir, cfg]);

  // Pagination
  const totalPages = Math.ceil(sortedRows.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    return sortedRows.slice((page - 1) * pageSize, page * pageSize);
  }, [sortedRows, page, pageSize]);

  const handleSort = (colIdx) => {
    if (sortCol === colIdx) {
      setSortDir(prev => prev * -1);
    } else {
      setSortCol(colIdx);
      setSortDir(1);
    }
  };

  const columns = cfg.dataCols || cfg.headers.map((_, i) => i);

  return (
    <div className="space-y-4 anim-in">
      {/* Header Info & Pencarian */}
      <div className="card p-5 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 grid place-items-center">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="card-title text-base text-slate-900 dark:text-white">
              Data Produksi {cfg.label}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Menampilkan {sortedRows.length.toLocaleString('id-ID')} baris data · Klik baris untuk melihat detail semua kolom
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Cari ID, Job, Plate, Operator..."
              className="inp !pl-9 pr-3 py-2 text-xs w-56 sm:w-64 dark:bg-slate-800 dark:text-white border-slate-200 dark:border-slate-700"
            />
          </div>
          <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            {sortedRows.length.toLocaleString('id-ID')} baris
          </span>
        </div>
      </div>

      {/* Tabel Data Responsif */}
      <div className="card bg-white dark:bg-slate-900 overflow-hidden border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
        <div className="overflow-x-auto max-h-[62vh]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-3.5 whitespace-nowrap text-slate-400">No</th>
                {columns.map(ci => (
                  <th
                    key={ci}
                    onClick={() => handleSort(ci)}
                    className="py-3 px-3.5 whitespace-nowrap cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{(cfg.headers[ci] || '').replace(/_/g, ' ')}</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      {sortCol === ci && (
                        <span className="text-cyan-500 font-bold">{sortDir === 1 ? '▲' : '▼'}</span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200 font-medium">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="text-center py-12 text-slate-400 dark:text-slate-500 text-xs">
                    Tidak ada data yang cocok dengan kriteria filter atau pencarian.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((r, idx) => (
                  <tr
                    key={idx}
                    onClick={() => onSelectRow?.(tabKey, r)}
                    className="hover:bg-cyan-500/5 dark:hover:bg-slate-800/60 transition cursor-pointer"
                  >
                    <td className="py-3 px-3.5 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                      {(page - 1) * pageSize + idx + 1}
                    </td>
                    {columns.map(ci => {
                      const val = r[ci];
                      const isDate = ci === cfg.i.date;
                      const isGood = ci === cfg.i.baik;
                      const isDefect = ci === cfg.i.rusak;
                      const isShift = ci === cfg.i.shift;

                      return (
                        <td
                          key={ci}
                          className={`py-3 px-3.5 whitespace-nowrap ${
                            isDate
                              ? 'text-cyan-600 dark:text-cyan-400 font-bold'
                              : isGood
                              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                              : isDefect && Number(val) > 0
                              ? 'text-rose-600 dark:text-rose-400 font-bold'
                              : isShift
                              ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                              : ''
                          }`}
                        >
                          {isDate ? fmtDate(val) : (val != null && String(val).trim() !== '' ? String(val) : '—')}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Kontrol Paginasi */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div>
            Menampilkan halaman <b className="text-slate-800 dark:text-white">{page}</b> dari <b className="text-slate-800 dark:text-white">{totalPages}</b>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold flex items-center gap-1 cursor-pointer transition"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Sebelumnya
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold flex items-center gap-1 cursor-pointer transition"
            >
              Berikutnya <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}