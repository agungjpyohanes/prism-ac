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
      {/* Pill Tabs Pemilihan Lini Proses (Sesuai Slide 5 PDF) */}
      <div className="card p-4 flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 max-w-full" style={{ WebkitOverflowScrolling: 'touch' }}>
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
                    ? 'btn-primary text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] scale-105'
                    : 'bg-slate-800/80 border border-slate-700 text-slate-300 hover:bg-slate-700/80 hover:text-white'
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
            <span className="w-10 h-10 rounded-2xl grid place-items-center bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
              <Database className="w-5 h-5" />
            </span>
            <div>
              <h3 className="card-title text-base">Data Produksi {cfg.label}</h3>
              <p className="text-xs text-slate-400">
                Menampilkan <b className="text-cyan-300">{sortedRows.length.toLocaleString('id-ID')} baris</b> &bull; Klik baris untuk melihat detail semua kolom
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
                    className="whitespace-nowrap cursor-pointer select-none hover:text-cyan-300 transition"
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
                  <td colSpan={visibleCols.length} className="text-center py-12 text-slate-400 text-xs">
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
                            ? 'text-cyan-300 font-semibold'
                            : ci === cfg.i.id
                            ? 'font-bold text-white'
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
        <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
          <span>
            Halaman <b className="text-white">{page}</b> dari <b className="text-white">{totalPages}</b> (Total {sortedRows.length} data)
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="btn-ghost !py-1.5 !px-3 text-xs disabled:opacity-30 rounded-xl"
            >
              Sebelumnya
            </button>
            <button
              type="button"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="btn-ghost !py-1.5 !px-3 text-xs disabled:opacity-30 rounded-xl"
            >
              Berikutnya
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}