import React, { useState, useMemo } from 'react';
import { X, Search, ArrowUpDown, Layers, ChevronLeft, ChevronRight } from 'lucide-react';
import { SHEETS } from '../../constants/schema';
import { cell, fmtDate, fmtStartTime, getRowJobCategory, getStatusBadgeClass, getCategoryBadgeClass } from '../../utils/formatters';

export default function JobDetailModal({
  title = 'Daftar Job Aktif (WIP)',
  subtitle,
  rows = [],
  initialCategory = 'SEMUA',
  showCategoryFilter = false,
  onClose,
  onSelectRow
}) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || 'SEMUA');
  const [sortCol, setSortCol] = useState(0); // 0: id, 1: jop, 2: nojop, 4: status, 5: start_time, 6: date, 7: category
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const cfg = SHEETS.job_active || {
    headers: ['id', 'job_name', 'job_no', 'file_no', 'status', 'start_time', 'date', 'category'],
    i: { id: 0, job_name: 1, jop: 1, job_no: 2, nojop: 2, file_no: 3, status: 4, start_time: 5, date: 6, category: 7 }
  };

  // Kategori unik dari data yang ada
  const categoryList = useMemo(() => {
    const set = new Set();
    (rows || []).forEach((r) => {
      const cat = getRowJobCategory(r);
      if (cat && cat !== '-' && cat !== 'O') set.add(cat);
    });
    return ['SEMUA', ...Array.from(set).sort()];
  }, [rows]);

  // Filtering data modal
  const filteredRows = useMemo(() => {
    return (rows || []).filter((r) => {
      if (!r) return false;
      const idVal = cell(r, cfg.i.id, '');
      const jopVal = cell(r, cfg.i.job_name, '');
      const noJopVal = cell(r, cfg.i.job_no, '');
      const fileNoVal = cell(r, cfg.i.file_no, '');
      const statusVal = cell(r, cfg.i.status, '');
      const catVal = getRowJobCategory(r);

      // Filter Kategori
      if (selectedCategory !== 'SEMUA') {
        if (catVal.toUpperCase() !== selectedCategory.toUpperCase()) return false;
      }

      // Filter Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const combined = `${idVal} ${jopVal} ${noJopVal} ${fileNoVal} ${statusVal} ${catVal}`.toLowerCase();
        if (!combined.includes(q)) return false;
      }

      return true;
    });
  }, [rows, selectedCategory, search, cfg]);

  // Sorting
  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((a, b) => {
      let vA = cell(a, sortCol);
      let vB = cell(b, sortCol);
      if (sortCol === cfg.i.category) {
        vA = getRowJobCategory(a);
        vB = getRowJobCategory(b);
      }
      if (sortCol === cfg.i.date || sortCol === cfg.i.start_time) {
        vA = new Date(vA).getTime() || 0;
        vB = new Date(vB).getTime() || 0;
      }
      if (vA < vB) return sortAsc ? -1 : 1;
      if (vA > vB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [filteredRows, sortCol, sortAsc, cfg]);

  // Pagination
  const totalPages = Math.ceil(sortedRows.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, page, pageSize]);

  const handleSort = (colIdx) => {
    if (sortCol === colIdx) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(colIdx);
      setSortAsc(true);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#030712]/85 transition-opacity"
        style={{
          WebkitBackdropFilter: 'blur(12px)',
          backdropFilter: 'blur(12px)'
        }}
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div
        className="modal-panel relative w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden pointer-events-auto z-10 border border-slate-200 dark:border-cyan-500/30 bg-white dark:bg-[#0c1430]/95 shadow-2xl rounded-3xl"
        style={{
          WebkitBackdropFilter: 'blur(24px)',
          backdropFilter: 'blur(24px)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-900/60 shrink-0">
          <div className="min-w-0">
            <div className="font-display font-bold text-slate-900 dark:text-white text-base sm:text-lg flex items-center gap-2">
              <span className="truncate">{title}</span>
              <span className="badge bg-cyan-500/20 text-cyan-400 border-cyan-500/30 font-bold shrink-0">
                Job Aktif
              </span>
            </div>
            {subtitle ? (
              <p className="text-xs text-blue-600 dark:text-cyan-300 font-medium mt-0.5">{subtitle}</p>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Menampilkan <b className="text-blue-600 dark:text-cyan-300">{filteredRows.length.toLocaleString('id-ID')}</b> pekerjaan aktif
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-white hover:bg-rose-50 dark:hover:bg-rose-500/30 ml-auto transition shrink-0"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 sm:px-6 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Quick Filter Pills Kategori */}
          {(showCategoryFilter || categoryList.length > 2) && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                Lini:
              </span>
              {categoryList.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat);
                      setPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          )}

          {/* Search Box */}
          <div className="relative w-full sm:w-64 ml-auto">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari ID, Job, File No..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="inp !pl-9 text-xs py-1.5 w-full font-medium"
            />
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-y-auto p-4 sm:p-6 text-slate-800 dark:text-slate-200 flex-1" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="table-responsive">
            <table className="tbl min-w-[850px]">
              <thead>
                <tr>
                  <th className="w-12 text-center">NO</th>
                  <th
                    onClick={() => handleSort(cfg.i.id)}
                    className="cursor-pointer hover:text-blue-600 dark:hover:text-cyan-300 transition select-none"
                  >
                    <div className="flex items-center gap-1">
                      <span>ID</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort(cfg.i.job_name)}
                    className="cursor-pointer hover:text-blue-600 dark:hover:text-cyan-300 transition select-none"
                  >
                    <div className="flex items-center gap-1">
                      <span>JOB NAME</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort(cfg.i.job_no)}
                    className="cursor-pointer hover:text-blue-600 dark:hover:text-cyan-300 transition select-none"
                  >
                    <div className="flex items-center gap-1">
                      <span>JOB NO</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="select-none">FILE NO</th>
                  <th
                    onClick={() => handleSort(cfg.i.status)}
                    className="cursor-pointer hover:text-blue-600 dark:hover:text-cyan-300 transition select-none"
                  >
                    <div className="flex items-center gap-1">
                      <span>STATUS</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort(cfg.i.start_time)}
                    className="cursor-pointer hover:text-blue-600 dark:hover:text-cyan-300 transition select-none"
                  >
                    <div className="flex items-center gap-1">
                      <span>START TIME</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort(cfg.i.date)}
                    className="cursor-pointer hover:text-blue-600 dark:hover:text-cyan-300 transition select-none"
                  >
                    <div className="flex items-center gap-1">
                      <span>DATE</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort(cfg.i.category)}
                    className="cursor-pointer hover:text-blue-600 dark:hover:text-cyan-300 transition select-none"
                  >
                    <div className="flex items-center gap-1">
                      <span>CATEGORY</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-slate-500 dark:text-slate-400 text-xs">
                      Tidak ada pekerjaan aktif yang cocok dengan kriteria filter.
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row, idx) => {
                    if (!row) return null;
                    const rowNumber = (page - 1) * pageSize + idx + 1;
                    const idVal = cell(row, cfg.i.id);
                    const jopVal = cell(row, cfg.i.job_name);
                    const noJopVal = cell(row, cfg.i.job_no);
                    const fileNoVal = cell(row, cfg.i.file_no);
                    const statusVal = cell(row, cfg.i.status) || 'ANTRI';
                    const startTimeVal = cell(row, cfg.i.start_time);
                    const dateVal = cell(row, cfg.i.date);
                    const catVal = getRowJobCategory(row);

                    return (
                      <tr
                        key={idx}
                        onClick={() => onSelectRow?.('job_active', row)}
                        className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                      >
                        {/* 1. NO */}
                        <td className="text-center text-slate-500 dark:text-slate-400 font-mono font-bold text-xs">
                          {rowNumber}
                        </td>

                        {/* 2. ID */}
                        <td className="font-bold font-mono text-xs uppercase text-slate-900 dark:text-white whitespace-nowrap">
                          {idVal || '—'}
                        </td>

                        {/* 3. JOB NAME */}
                        <td className="font-semibold text-slate-900 dark:text-slate-100 max-w-[220px] truncate" title={jopVal}>
                          {jopVal || '—'}
                        </td>

                        {/* 4. JOB NO */}
                        <td className="whitespace-nowrap font-mono text-xs text-slate-700 dark:text-slate-300">
                          {noJopVal || '—'}
                        </td>

                        {/* 5. FILE NO */}
                        <td className="whitespace-nowrap font-mono text-xs text-blue-600 dark:text-cyan-300">
                          {fileNoVal || '—'}
                        </td>

                        {/* 6. STATUS */}
                        <td className="whitespace-nowrap">
                          <span className={`badge ${getStatusBadgeClass(statusVal)} font-bold`}>
                            {statusVal}
                          </span>
                        </td>

                        {/* 7. START TIME */}
                        <td className="whitespace-nowrap text-xs font-mono text-slate-600 dark:text-slate-300">
                          {fmtStartTime(startTimeVal)}
                        </td>

                        {/* 8. DATE */}
                        <td className="whitespace-nowrap text-xs text-blue-600 dark:text-cyan-300 font-semibold">
                          {fmtDate(dateVal)}
                        </td>

                        {/* 9. CATEGORY */}
                        <td className="whitespace-nowrap">
                          <span className={`badge ${getCategoryBadgeClass(catVal)} font-bold`}>
                            {catVal}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Pagination */}
        <div className="px-5 sm:px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 shrink-0">
          <span>
            Halaman <b className="text-slate-900 dark:text-white">{page}</b> dari <b className="text-slate-900 dark:text-white">{totalPages}</b> ({filteredRows.length} data)
          </span>
          <div className="flex items-center gap-1.5">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="btn-secondary !py-1 !px-2.5 text-xs disabled:opacity-40 rounded-lg"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="btn-secondary !py-1 !px-2.5 text-xs disabled:opacity-40 rounded-lg"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
