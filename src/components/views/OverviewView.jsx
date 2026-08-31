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
import { Activity, Clock, PlayCircle, Layers, Search, ChevronLeft, ChevronRight, ArrowUpDown, TrendingUp, CheckCircle2 } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function OverviewView({ data = {}, period, onOpenList, onSelectRow }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [sortCol, setSortCol] = useState(0);
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 15;

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

  const handleDoughnutClick = (event, elements) => {
    if (!elements || elements.length === 0) return;
    const clickedIndex = elements[0].index;
    const catName = Object.keys(stats.categoryCount)[clickedIndex];
    if (catName && stats.categoryRows[catName]) {
      onOpenList?.(`Job Aktif Kategori: ${catName}`, 'job_active', stats.categoryRows[catName]);
    }
  };

  const handleBarClick = (event, elements) => {
    if (!elements || elements.length === 0) return;
    const clickedIndex = elements[0].index;
    const statusName = Object.keys(stats.statusCount)[clickedIndex];
    if (statusName && stats.statusRows[statusName]) {
      onOpenList?.(`Job Aktif Status: ${statusName}`, 'job_active', stats.statusRows[statusName]);
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Section */}
      <div className="card-gradient p-8 rounded-3xl">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="badge badge-primary">
                <Activity className="w-3 h-3" />
                MONITORING PRODUKSI
              </span>
              <span className="text-xs text-slate-400">Real-time Job Status</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Dashboard Overview
            </h1>
            <p className="text-slate-300">
              Pantau seluruh pekerjaan aktif dan status produksi secara real-time
            </p>
          </div>
          
          <div className="text-right">
            <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Periode</div>
            <div className="text-lg font-bold text-white">{fmtPeriodRange(period?.from, period?.to)}</div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Jobs */}
        <div 
          onClick={() => onOpenList?.('Seluruh Job Aktif', 'job_active', filtered)}
          className="stat-card cursor-pointer group"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="stat-card-icon">
              <Activity className="w-6 h-6 text-indigo-400" />
            </div>
            <TrendingUp className="w-4 h-4 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="stat-card-value">{filtered.length.toLocaleString('id-ID')}</div>
          <div className="stat-card-label mt-2">Total Job Aktif</div>
          <div className="text-xs text-slate-500 mt-1">Klik untuk detail</div>
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
          className="stat-card cursor-pointer group"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(20, 184, 166, 0.2) 100%)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
              <PlayCircle className="w-6 h-6 text-emerald-400" />
            </div>
            <span className="badge badge-success">Active</span>
          </div>
          <div className="stat-card-value">{inProgressCount.toLocaleString('id-ID')}</div>
          <div className="stat-card-label mt-2">In Progress</div>
          <div className="text-xs text-slate-500 mt-1">Sedang dikerjakan</div>
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
          className="stat-card cursor-pointer group"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(251, 191, 36, 0.2) 100%)', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
              <Clock className="w-6 h-6 text-amber-400" />
            </div>
            <span className="badge badge-warning">Waiting</span>
          </div>
          <div className="stat-card-value">{queueCount.toLocaleString('id-ID')}</div>
          <div className="stat-card-label mt-2">In Queue</div>
          <div className="text-xs text-slate-500 mt-1">Menunggu giliran</div>
        </div>

        {/* Categories */}
        <div className="stat-card">
          <div className="flex items-start justify-between mb-4">
            <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)', borderColor: 'rgba(139, 92, 246, 0.3)' }}>
              <Layers className="w-6 h-6 text-purple-400" />
            </div>
            <CheckCircle2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="stat-card-value">{Object.keys(stats.categoryCount).length}</div>
          <div className="stat-card-label mt-2">Kategori</div>
          <div className="text-xs text-slate-500 mt-1">Divisi proses</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Distribusi Kategori</h3>
              <p className="text-xs text-slate-400">Klik segmen untuk detail</p>
            </div>
          </div>
          <div className="h-72 flex items-center justify-center">
            {Object.keys(stats.categoryCount).length === 0 ? (
              <div className="text-center">
                <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-500">Tidak ada data kategori</p>
              </div>
            ) : (
              <Doughnut
                data={{
                  labels: Object.keys(stats.categoryCount),
                  datasets: [{
                    data: Object.values(stats.categoryCount),
                    backgroundColor: [
                      '#6366f1', '#8b5cf6', '#10b981', '#f59e0b', 
                      '#ec4899', '#06b6d4', '#64748b'
                    ],
                    borderWidth: 0,
                    hoverOffset: 10
                  }]
                }}
                options={{
                  maintainAspectRatio: false,
                  cutout: '65%',
                  onClick: handleDoughnutClick,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        usePointStyle: true,
                        pointStyle: 'circle',
                        padding: 15,
                        font: { size: 11 },
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
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Status Pengerjaan</h3>
              <p className="text-xs text-slate-400">Klik bar untuk detail</p>
            </div>
          </div>
          <div className="h-72">
            {Object.keys(stats.statusCount).length === 0 ? (
              <div className="text-center h-full flex items-center justify-center">
                <div>
                  <Activity className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">Tidak ada data status</p>
                </div>
              </div>
            ) : (
              <Bar
                data={{
                  labels: Object.keys(stats.statusCount),
                  datasets: [{
                    label: 'Jumlah Job',
                    data: Object.values(stats.statusCount),
                    backgroundColor: 'rgba(99, 102, 241, 0.8)',
                    borderRadius: 8,
                    borderSkipped: false
                  }]
                }}
                options={{
                  maintainAspectRatio: false,
                  onClick: handleBarClick,
                  plugins: {
                    legend: { display: false }
                  },
                  scales: {
                    x: {
                      grid: { display: false },
                      ticks: { color: '#94a3b8', font: { size: 11 } }
                    },
                    y: {
                      grid: { color: 'rgba(255, 255, 255, 0.05)' },
                      ticks: { color: '#94a3b8', font: { size: 11 } }
                    }
                  }
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Daftar Job Aktif</h2>
            <p className="text-sm text-slate-400">
              Menampilkan <span className="text-white font-semibold">{sorted.length}</span> pekerjaan
            </p>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="select text-xs"
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
              className="select text-xs"
            >
              <option value="ALL">Semua Status</option>
              {distinctStatuses.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari job..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="input pl-10 text-xs w-56"
              />
            </div>
          </div>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th className="w-12">No</th>
                {(cfg.headers || []).map((h, i) => (
                  <th
                    key={i}
                    onClick={() => handleSort(i)}
                    className="cursor-pointer hover:text-white transition-colors"
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
                      const isDone = String(val).toLowerCase().includes('selesai') || String(val).toLowerCase().includes('done');
                      const isInProg = String(val).toLowerCase().includes('progress') || String(val).toLowerCase().includes('proses');
                      
                      return (
                        <td key={colIdx}>
                          <span className={`badge ${
                            isDone ? 'badge-success' : 
                            isInProg ? 'badge-info' : 
                            'badge-warning'
                          }`}>
                            {val || '-'}
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
                      <p className="text-sm text-slate-500">Tidak ada pekerjaan yang cocok</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/5">
          <span className="text-sm text-slate-400">
            Halaman <span className="text-white font-semibold">{page}</span> dari <span className="text-white font-semibold">{totalPages}</span>
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