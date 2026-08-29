import React, { useState, useMemo } from 'react';
import { SHEETS } from '../../constants/schema';
import { parseDateVal, fmtDate } from '../../utils/formatters';
import { Search } from 'lucide-react';

export default function DataTableView({ tabKey, data, period, onSelectRow }) {
  const cfg = SHEETS[tabKey];
  const rawRows = data[tabKey] || [];
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState(cfg.i.date);
  const [sortDir, setSortDir] = useState(-1); // -1: Descending, 1: Ascending

  // Filter Periode & Search Query
  const filteredRows = useMemo(() => {
    return rawRows.filter(r => {
      const idVal = String(r[cfg.i.id] || '').trim();
      const jopVal = String(r[cfg.i.jop] || '').trim();
      const noJopVal = String(r[cfg.i.nojop] || '').trim();
      if (!idVal || (!jopVal && !noJopVal)) return false;

      const d = parseDateVal(r[cfg.i.date]);
      const from = period.from ? new Date(period.from).setHours(0, 0, 0, 0) : null;
      const to = period.to ? new Date(period.to).setHours(23, 59, 59, 999) : null;
      if (d) {
        if (from && d.getTime() < from) return false;
        if (to && d.getTime() > to) return false;
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        return cfg.dataCols.some(ci => String(r[ci] || '').toLowerCase().includes(q));
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
      return String(va || '').localeCompare(String(vb || ''), 'id') * sortDir;
    });
  }, [filteredRows, sortCol, sortDir, cfg]);

  const handleSort = (colIdx) => {
    if (sortCol === colIdx) {
      setSortDir(prev => prev * -1);
    } else {
      setSortCol(colIdx);
      setSortDir(1);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Search */}
      <div className="card p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="card-title font-display font-bold text-slate-800">Data Produksi {cfg.label}</h3>
          <p className="text-xs text-slate-500">Klik baris untuk melihat detail semua kolom</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari ID / JOP..."
              className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-600 focus:bg-white w-48 sm:w-60"
            />
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
            {sortedRows.length} baris
          </span>
        </div>
      </div>

      {/* Tabel */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto max-h-[65vh]">
          <table className="tbl">
            <thead>
              <tr>
                {cfg.dataCols.map(ci => (
                  <th key={ci} onClick={() => handleSort(ci)} className="cursor-pointer select-none hover:text-blue-600">
                    {cfg.headers[ci]} {sortCol === ci ? (sortDir === 1 ? '▲' : '▼') : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedRows.length === 0 ? (
                <tr>
                  <td colSpan={cfg.dataCols.length} className="text-center py-10 text-slate-400 text-xs">
                    Tidak ada data yang cocok pada periode ini.
                  </td>
                </tr>
              ) : (
                sortedRows.map((r, idx) => (
                  <tr key={idx} onClick={() => onSelectRow(tabKey, r)}>
                    {cfg.dataCols.map(ci => (
                      <td key={ci} className={ci === cfg.i.date ? 'text-blue-600' : ''}>
                        {ci === cfg.i.date ? fmtDate(r[ci]) : (r[ci] || '—')}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}