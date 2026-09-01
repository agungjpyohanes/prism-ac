import React, { useState, useMemo } from 'react';
import { SHEETS, PROD_KEYS } from '../../constants/schema';
import { parseDateVal, fmtDate } from '../../utils/formatters';
import { Search, Database } from 'lucide-react';

export default function DataTableView({
  tabKey = 'rec_ctcp',
  onTabChange,
  data,
  period,
  onSelectRow
}) {
  const activeKey = tabKey || 'rec_ctcp';
  const cfg = SHEETS[activeKey] || SHEETS.rec_ctcp;
  const rawRows = data[activeKey] || [];
  
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState(cfg.i.date);
  const [sortDir, setSortDir] = useState(-1);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Filter Periode & Pencarian
  const filteredRows = useMemo(() => {
    return rawRows.filter((r) => {
      const idVal = String(r[cfg.i.id] || '').trim();
      const jopVal = String(r[cfg.i.jop] || '').trim();
      const noJopVal = String(r[cfg.i.nojop] || '').trim();
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
        return (cfg.dataCols || cfg.headers.map((_, i) => i)).some((ci) =>
          String(r[ci] || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [rawRows, cfg, period, search]);

  // Sorting Data
  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((a, b) => {
      const va = a[sortCol];
      const vb = b[sortCol];
      if (sortCol === cfg.i.date) {
        const da = parseDateVal(va)?.getTime() || 0;
        const db = parseDateVal(vb)?.getTime() || 0;
        return (da - db) * sortDir;
      }
      return String(va || '').localeCompare(String(vb || ''), 'id') * sortDir;
    });
  }, [filteredRows, sortCol, sortDir, cfg]);

  const totalPages = Math.ceil(sortedRows.length / pageSize) || 1;
  const paginatedRows = sortedRows.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (colIdx) => {
    if (sortCol === colIdx) {
      setSortDir((prev) => prev * -1);
    } else {
      setSortCol(colIdx);
      setSortDir(1);
    }
  };

  const visibleCols = cfg.dataCols || cfg.headers.map((_, i) => i);

  return (
    <div className="space-y-5 anim-in">
      {/* Pill Tabs Pemilihan Lini Proses */}
      <div className="card p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 max-w-full bg-slate-100 dark:bg-slate-900/90 p-1 rounded-2xl border border-slate-200 dark:border-slate-800" style={{ WebkitOverflowScrolling: 'touch' }}>
          {PROD_KEYS.map((k) => {
            const itemCfg = SHEETS[k];
            const isActive = activeKey === k;
            return (
              <button
                key={k}
                type="button"
                onClick={() => {
                  onTabChange?.(k);
                  setPage(1);
                }}
                className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm dark:bg-gradient-to-r dark:from-cyan-500 dark:to-blue-600'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800'
                }`}
              >
                {itemCfg.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl grid place-items-center bg-blue-50 dark:bg-cyan-500/10 border border-blue-200 dark:border-cyan-400/30 text-blue-600 dark:text-cyan-300 shadow-sm">
              <Database className="w-5 h-5" />
            </span>
            <div>
              <h3 className="card-title text-base text-slate-900 dark:text-white">Data Produksi {cfg.label}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Menampilkan <b className="text-blue-600 dark:text-cyan-300">{sortedRows.length.toLocaleString('id-ID')} baris</b> &bull; Klik baris untuk detail lengkap
              </p>
            </div>
          </div>

          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari ID, Job, Plate, Operator..."
              className="inp !pl-10 w-full sm:w-72"
            />
          </div>
        </div>

        <div className="table-responsive">
          <table className="tbl min-w-[850px]">
            <thead>
              <tr>
                {visibleCols.map((ci) => (
                  <th
                    key={ci}
                    onClick={() => handleSort(ci)}
                    className="whitespace-nowrap cursor-pointer select-none hover:text-blue-600 dark:hover:text-cyan-300 transition"
                  >
                    {cfg.headers[ci]?.toUpperCase().replace(/_/g, ' ')}{' '}
                    {sortCol === ci ? (sortDir === 1 ? '▲' : '▼') : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={visibleCols.length} className="text-center py-12 text-slate-500 dark:text-slate-400 text-xs">
                    Tidak ada data {cfg.label} yang cocok pada periode ini.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((r, idx) => (
                  <tr key={idx} onClick={() => onSelectRow?.(activeKey, r)} className="cursor-pointer">
                    {visibleCols.map((ci) => (
                      <td
                        key={ci}
                        className={`whitespace-nowrap ${
                          ci === cfg.i.date
                            ? 'text-blue-600 dark:text-cyan-300 font-semibold'
                            : ci === cfg.i.id
                            ? 'font-bold text-slate-900 dark:text-white'
                            : ''
                        }`}
                      >
                        {ci === cfg.i.date ? fmtDate(r[ci]) : r[ci] || '—'}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between pt-2 text-xs text-slate-500 dark:text-slate-400">
          <span>
            Halaman <b className="text-slate-900 dark:text-white">{page}</b> dari <b className="text-slate-900 dark:text-white">{totalPages}</b> (Total {sortedRows.length.toLocaleString('id-ID')} data)
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="btn-secondary !py-1.5 !px-3.5 text-xs disabled:opacity-40 rounded-xl"
            >
              Sebelumnya
            </button>
            <button
              type="button"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="btn-secondary !py-1.5 !px-3.5 text-xs disabled:opacity-40 rounded-xl"
            >
              Berikutnya
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}