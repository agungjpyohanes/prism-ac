import React, { useState, useMemo } from 'react';
import { SHEETS } from '../../constants/schema';
import { cell, parseDateVal, startOfDay, endOfDay, fmtDate, fmtPeriodRange } from '../../utils/formatters';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Activity, Clock, PlayCircle, Layers, Search, ChevronLeft, ChevronRight, ArrowUpDown, TrendingUp, CheckCircle2, Filter, X } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function OverviewView({ data = {}, period, onOpenList, onSelectRow }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [sortCol, setSortCol] = useState(0);
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'
  const pageSize = 10;

  const cfg = SHEETS.job_active || {
    headers: ['id', 'job_name', 'job_no', 'file_no', 'status', 'start_time', 'date', 'category'],
    i: { id: 0, job_name: 1, jop: 1, job_no: 2, nojop: 2, file_no: 3, status: 4, start_time: 5, date: 6, category: 7 }
  };

  const rawRows = data.job_active || [];

  const filtered = useMemo(() => {
    const fromTime = period?.from ? startOfDay(period.from).getTime() : null;
    const toTime = period?.to ? endOfDay(period.to).getTime() : null;
    const q = search.trim().toLowerCase();
    
    return rawRows.filter((r) => {
      const idVal = cell(r, cfg.i.id).trim();
      if (!idVal) return false;
      
      const d = parseDateVal(r[cfg.i.date]);
      if (d) {
        const t = d.getTime();
        if (fromTime && t < fromTime) return false;
        if (toTime && t > toTime) return false;
      }
      
      const st = cell(r, cfg.i.status).trim();
      if (statusFilter !== 'ALL' && st.toLowerCase() !== statusFilter.toLowerCase()) return false;
      
      const cat = cell(r, cfg.i.category).trim();
      if (categoryFilter !== 'ALL' && cat.toLowerCase() !== categoryFilter.toLowerCase()) return false;
      
      if (q) {
        return r.some((c) => String(c || '').toLowerCase().includes(q));
      }
      
      return true;
    });
  }, [rawRows, period, search, statusFilter, categoryFilter, cfg]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const valA = a[sortCol] ?? '';
      const valB = b[sortCol] ?? '';
      
      if (!isNaN(valA) && !isNaN(valB) && valA !== '' && valB !== '') {
        return sortAsc ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
      }
      
      return sortAsc
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [filtered, sortCol, sortAsc]);

  const totalPages = Math.ceil(sorted.length / pageSize) || 1;
  const paginatedRows = sorted.slice((page - 1) * pageSize, page * pageSize);

  const stats = useMemo(() => {
    const statusCount = {};
    const categoryCount = {};
    const categoryRows = {};
    const statusRows = {};
    
    filtered.forEach((r) => {
      const st = cell(r, cfg.i.status).trim() || 'Pending';
      const cat = cell(r, cfg.i.category).trim() || 'General';
      
      statusCount[st] = (statusCount[st] || 0) + 1;
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
      
      if (!statusRows[st]) statusRows[st] = [];
      statusRows[st].push(r);
      
      if (!categoryRows[cat]) categoryRows[cat] = [];
      categoryRows[cat].push(r);
    });
    
    return { statusCount, categoryCount, statusRows, categoryRows };
  }, [filtered, cfg]);

  const distinctCategories = useMemo(() => {
    return Array.from(new Set(rawRows.map(r => cell(r, cfg.i.category).trim()).filter(Boolean)));
  }, [rawRows, cfg]);

  const distinctStatuses = useMemo(() => {
    return Array.from(new Set(rawRows.map(r => cell(r, cfg.i.status).trim()).filter(Boolean)));
  }, [rawRows, cfg]);

  const handleSort = (idx) => {
    if (sortCol === idx) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(idx);
      setSortAsc(true);
    }
  };

  const inProgressCount = filtered.filter(r => 
    cell(r, cfg.i.status).toLowerCase().includes('progress') || 
    cell(r, cfg.i.status).toLowerCase().includes('proses')
  ).length;

  const queueCount = filtered.filter(r => 
    cell(r, cfg.i.status).toLowerCase().includes('queue') || 
    cell(r, cfg.i.status).toLowerCase().includes('pending') || 
    cell(r, cfg.i.status).toLowerCase().includes('antri')
  ).length;

  const getStatusBadge = (val) => {
    const isDone = String(val).toLowerCase().includes('selesai') || String(val).toLowerCase().includes('done');
    const isInProg = String(val).toLowerCase().includes('progress') || String(val).toLowerCase().includes('proses');
    
    if (isDone) return { cls: 'badge-emerald', label: val || '-' };
    if (isInProg) return { cls: 'badge-cyan', label: val || '-' };
    return { cls: 'badge-amber', label: val || '-' };
  };

  return (
    <div className="space-y-4 sm:space-y-6 anim-in">
      {/* Header */}
      <div className="card p-5 sm:p-8 border-cyan-500/30">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="badge badge-cyan">
                <Activity className="w-3 h-3" />
                MONITORING
              </span>
              <span className="text-xs text-slate-400">Real-time Job Status</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">
              Dashboard Overview
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Pantau seluruh pekerjaan aktif dan status produksi
            </p>
          </div>
          
          <div className="text-right">
            <div className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Periode</div>
            <div className="text-sm sm:text-lg font-bold text-white">{fmtPeriodRange(period?.from, period?.to)}</div>
          </div>
        </div>
      </div>

      {/* Stats Grid - Responsive */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Jobs */}
        <div 
          onClick={() => onOpenList?.('Seluruh Job Aktif', 'job_active', filtered)}
          className="stat-card"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="stat-card-icon">
              <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
            </div>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="stat-card-value">{filtered.length.toLocaleString('id-ID')}</div>
          <div className="stat-card-label mt-1 sm:mt-2">Total Job Aktif</div>
        </div>

        {/* In Progress */}
        <div 
          onClick={() => {
            const inProg = filtered.filter(r => 
              cell(r, cfg.i.status).toLowerCase().includes('progress') || 
              cell(r, cfg.i.status).toLowerCase().includes('proses')
            );
            onOpenList?.('Job In Progress', 'job_active', inProg);
          }}
          className="stat-card"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(20, 184, 166, 0.2) 100%)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
              <PlayCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
            </div>
            <span className="badge badge-emerald text-[9px] sm:text-xs">Active</span>
          </div>
          <div className="stat-card-value">{inProgressCount.toLocaleString('id-ID')}</div>
          <div className="stat-card-label mt-1 sm:mt-2">In Progress</div>
        </div>

        {/* Queue */}
        <div 
          onClick={() => {
            const pending = filtered.filter(r => 
              cell(r, cfg.i.status).toLowerCase().includes('queue') || 
              cell(r, cfg.i.status).toLowerCase().includes('pending') || 
              cell(r, cfg.i.status).toLowerCase().includes('antri')
            );
            onOpenList?.('Job Queue', 'job_active', pending);
          }}
          className="stat-card"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(251, 191, 36, 0.2) 100%)', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
            </div>
            <span className="badge badge-amber text-[9px] sm:text-xs">Waiting</span>
          </div>
          <div className="stat-card-value">{queueCount.toLocaleString('id-ID')}</div>
          <div className="stat-card-label mt-1 sm:mt-2">In Queue</div>
        </div>

        {/* Categories */}
        <div className="stat-card">
          <div className="flex items-start justify-between mb-3">
            <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)', borderColor: 'rgba(139, 92, 246, 0.3)' }}>
              <Layers className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
            </div>
            <CheckCircle2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="stat-card-value">{Object.keys(stats.categoryCount).length}</div>
          <div className="stat-card-label mt-1 sm:mt-2">Kategori</div>
        </div>
      </div>

      {/* Charts - Stack on mobile, side-by-side on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Category Distribution */}
        <div className="card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-1">Distribusi Kategori</h3>
              <p className="text-[10px] sm:text-xs text-slate-400">Klik segmen untuk detail</p>
            </div>
          </div>
          <div className="h-56 sm:h-72 flex items-center justify-center">
            {Object.keys(stats.categoryCount).length === 0 ? (
              <div className="text-center">
                <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-500">Tidak ada data</p>
              </div>
            ) : (
              <Doughnut
                data={{
                  labels: Object.keys(stats.categoryCount),
                  datasets: [{
                    data: Object.values(stats.categoryCount),
                    backgroundColor: ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#64748b'],
                    borderWidth: 0,
                    hoverOffset: 10
                  }]
                }}
                options={{
                  maintainAspectRatio: false,
                  cutout: '65%',
                  onClick: (event, elements) => {
                    if (!elements || elements.length === 0) return;
                    const catName = Object.keys(stats.categoryCount)[elements[0].index];
                    if (catName && stats.categoryRows[catName]) {
                      onOpenList?.(`Kategori: ${catName}`, 'job_active', stats.categoryRows[catName]);
                    }
                  },
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        usePointStyle: true,
                        pointStyle: 'circle',
                        padding: 10,
                        font: { size: 10 },
                        color: '#94a3b8'
                      }
                    }
                  }
                }}
              />
            )}
          </div>
        </div>

        {/* Status Distribution */}
        <div className="card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-1">Status Pengerjaan</h3>
              <p className="text-[10px] sm:text-xs text-slate-400">Klik bar untuk detail</p>
            </div>
          </div>
          <div className="h-56 sm:h-72">
            {Object.keys(stats.statusCount).length === 0 ? (
              <div className="text-center h-full flex items-center justify-center">
                <div>
                  <Activity className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">Tidak ada data</p>
                </div>
              </div>
            ) : (
              <Bar
                data={{
                  labels: Object.keys(stats.statusCount),
                  datasets: [{
                    label: 'Jumlah Job',
                    data: Object.values(stats.statusCount),
                    backgroundColor: 'rgba(6, 182, 212, 0.8)',
                    borderRadius: 8,
                    borderSkipped: false
                  }]
                }}
                options={{
                  maintainAspectRatio: false,
                  onClick: (event, elements) => {
                    if (!elements || elements.length === 0) return;
                    const statusName = Object.keys(stats.statusCount)[elements[0].index];
                    if (statusName && stats.statusRows[statusName]) {
                      onOpenList?.(`Status: ${statusName}`, 'job_active', stats.statusRows[statusName]);
                    }
                  },
                  plugins: { legend: { display: false } },
                  scales: {
                    x: {
                      grid: { display: false },
                      ticks: { color: '#94a3b8', font: { size: 10 } }
                    },
                    y: {
                      grid: { color: 'rgba(6, 182, 212, 0.05)' },
                      ticks: { color: '#94a3b8', font: { size: 10 } }
                    }
                  }
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Jobs Section */}
      <div className="card p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 sm:mb-6">
          <div>
            <h2 className="text-base sm:text-xl font-bold text-white mb-1">Daftar Job Aktif</h2>
            <p className="text-xs text-slate-400">
              <span className="text-white font-semibold">{sorted.length}</span> pekerjaan
            </p>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Toggle - Mobile */}
            <div className="flex bg-cyan-500/5 rounded-lg p-1 border border-cyan-500/20 sm:hidden">
              <button
                onClick={() => setViewMode('table')}
                className={`px-2 py-1 text-[10px] font-bold rounded transition-all
                  ${viewMode === 'table' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400'}
                `}
              >
                Tabel
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`px-2 py-1 text-[10px] font-bold rounded transition-all
                  ${viewMode === 'cards' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400'}
                `}
              >
                Kartu
              </button>
            </div>

            {/* Filter Button - Mobile */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="sm:hidden p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
            >
              {showFilters ? <X className="w-4 h-4" /> : <Filter className="w-4 h-4" />}
            </button>

            {/* Search */}
            <div className="relative flex-1 sm:flex-none">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari job..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="inp pl-10 text-xs w-full sm:w-56"
              />
            </div>
          </div>
        </div>

        {/* Filters Panel - Mobile Dropdown / Desktop Always Visible */}
        <div className={`${showFilters ? 'flex' : 'hidden'} sm:flex flex-wrap gap-2 mb-4 p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/20`}>
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="inp text-xs flex-1 sm:flex-none sm:w-40"
          >
            <option value="ALL">Semua Kategori</option>
            {distinctCategories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="inp text-xs flex-1 sm:flex-none sm:w-40"
          >
            <option value="ALL">Semua Status</option>
            {distinctStatuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Table View - Desktop & Tablet */}
        <div className="hidden sm:block table-container">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th className="w-12">No</th>
                  {(cfg.headers || []).map((h, i) => (
                    <th
                      key={i}
                      onClick={() => handleSort(i)}
                      className="cursor-pointer hover:text-cyan-300 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span>{h.replace(/_/g, ' ').toUpperCase()}</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedRows.map((row, idx) => (
                  <tr
                    key={idx}
                    onClick={() => onSelectRow?.('job_active', row)}
                    className="cursor-pointer"
                  >
                    <td className="text-slate-500 font-mono">{(page - 1) * pageSize + idx + 1}</td>
                    {(cfg.headers || []).map((_, colIdx) => {
                      const val = row[colIdx];
                      if (colIdx === cfg.i.status) {
                        const badge = getStatusBadge(val);
                        return (
                          <td key={colIdx}>
                            <span className={`badge ${badge.cls}`}>
                              {badge.label}
                            </span>
                          </td>
                        );
                      }
                      return (
                        <td key={colIdx}>
                          {colIdx === cfg.i.date ? fmtDate(val) : (val ?? '-')}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                
                {paginatedRows.length === 0 && (
                  <tr>
                    <td colSpan={cfg.headers.length + 1} className="text-center py-12">
                      <div className="flex flex-col items-center">
                        <Activity className="w-12 h-12 text-slate-600 mb-3" />
                        <p className="text-sm text-slate-500">Tidak ada data</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cards View - Mobile */}
        <div className="sm:hidden space-y-2">
          {paginatedRows.map((row, idx) => (
            <div
              key={idx}
              onClick={() => onSelectRow?.('job_active', row)}
              className="card p-3 cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white truncate">
                    {cell(row, cfg.i.job_name)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {cell(row, cfg.i.job_no)} • {cell(row, cfg.i.category)}
                  </div>
                </div>
                <span className={`badge ${getStatusBadge(cell(row, cfg.i.status)).cls} shrink-0`}>
                  {getStatusBadge(cell(row, cfg.i.status)).label}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-white/5">
                <span>{fmtDate(row[cfg.i.date])}</span>
                <span className="font-mono">#{(page - 1) * pageSize + idx + 1}</span>
              </div>
            </div>
          ))}
          
          {paginatedRows.length === 0 && (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-500">Tidak ada data</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-cyan-500/15">
          <span className="text-xs text-slate-400">
            Hal <span className="text-white font-semibold">{page}</span> / <span className="text-white font-semibold">{totalPages}</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="btn-icon disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="btn-icon disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}