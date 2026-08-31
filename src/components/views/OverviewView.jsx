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
import { Activity, Clock, PlayCircle, Layers, Search, ChevronLeft, ChevronRight, ArrowUpDown, CheckCircle2 } from 'lucide-react';

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

  const inProgCount = filtered.filter(r => cell(r, cfg.i.status).toLowerCase().includes('progress') || cell(r, cfg.i.status).toLowerCase().includes('proses')).length;
  const pendingCount = filtered.filter(r => cell(r, cfg.i.status).toLowerCase().includes('queue') || cell(r, cfg.i.status).toLowerCase().includes('pending') || cell(r, cfg.i.status).toLowerCase().includes('antri')).length;
  const doneCount = filtered.filter(r => cell(r, cfg.i.status).toLowerCase().includes('selesai') || cell(r, cfg.i.status).toLowerCase().includes('done')).length;

  return (
    <div className="space-y-6 anim-in">
      {/* Header Overview Banner */}
      <div className="card p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge">MONITORING WIP</span>
            <span className="text-xs text-slate-300">Live Active Queue</span>
          </div>
          <h2 className="font-display font-black text-2xl text-white mt-1">
            Dashboard Overview — Job Aktif (WIP)
          </h2>
          <p className="text-xs text-slate-300">
            Daftar seluruh pekerjaan yang sedang dalam antrean atau proses pembuatan di Prepress[cite: 1, 2]
          </p>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Periode Aktif</div>
          <div className="font-bold text-sm text-cyan-300 mt-0.5">{fmtPeriodRange(period?.from, period?.to)}[cite: 1, 2]</div>
        </div>
      </div>

      {/* 4 Scorecards Sesuai Slide 2 PDF */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          onClick={() => onOpenList?.('Seluruh Job Aktif Terfilter', 'job_active', filtered)}
          className="card p-5 cursor-pointer hover:border-cyan-400 flex items-center justify-between"
        >
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Job Aktif</p>
            <h3 className="text-3xl font-black text-white mt-1 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
              {filtered.length.toLocaleString('id-ID')}
            </h3>
            <p className="text-[10px] text-cyan-400 mt-1">Klik untuk audit antrean</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        <div className="card p-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Berjalan / In Progress</p>
            <h3 className="text-3xl font-black text-emerald-400 mt-1 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">
              {inProgCount.toLocaleString('id-ID')}
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">Sedang diproses mesin</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
            <PlayCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="card p-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pending / Antrean</p>
            <h3 className="text-3xl font-black text-amber-400 mt-1 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">
              {pendingCount.toLocaleString('id-ID')}
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">Menunggu giliran</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="card p-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Selesai / Passed</p>
            <h3 className="text-3xl font-black text-indigo-300 mt-1 drop-shadow-[0_0_10px_rgba(129,140,248,0.5)]">
              {doneCount.toLocaleString('id-ID')}
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">Siap kirim / arsip</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Chart Grid Sesuai Slide 2 PDF */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="card-title">Breakdown per Category[cite: 3]</h3>
            <span className="text-[10px] text-cyan-400 font-mono">Porsi Lini</span>
          </div>
          <div className="h-64 flex items-center justify-center">
            {Object.keys(stats.categoryCount).length === 0 ? (
              <span className="text-xs text-slate-400">Tidak ada data kategori</span>
            ) : (
              <Doughnut
                data={{
                  labels: Object.keys(stats.categoryCount),
                  datasets: [
                    {
                      data: Object.values(stats.categoryCount),
                      backgroundColor: ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'],
                      borderColor: 'rgba(5, 7, 22, 0.8)',
                      borderWidth: 3
                    }
                  ]
                }}
                options={{
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { labels: { color: '#e2e8f0', font: { size: 11 } } }
                  }
                }}
              />
            )}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="card-title">Distribusi Status Pengerjaan</h3>
            <span className="text-[10px] text-cyan-400 font-mono">Volume Job</span>
          </div>
          <div className="h-64">
            {Object.keys(stats.statusCount).length === 0 ? (
              <span className="text-xs text-slate-400">Tidak ada data status</span>
            ) : (
              <Bar
                data={{
                  labels: Object.keys(stats.statusCount),
                  datasets: [
                    {
                      label: 'Jumlah Job',
                      data: Object.values(stats.statusCount),
                      backgroundColor: '#06b6d4',
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: '#22d3ee'
                    }
                  ]
                }}
                options={{
                  maintainAspectRatio: false,
                  scales: {
                    x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                    y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
                  },
                  plugins: {
                    legend: { display: false }
                  }
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Tabel Data Job Aktif WIP */}
      <div className="card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display font-bold text-lg text-white">
              Job Aktif Saat Ini[cite: 3]
            </h2>
            <p className="text-xs text-slate-400">
              Menampilkan <b>{sorted.length.toLocaleString('id-ID')} pekerjaan</b>
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              className="inp"
            >
              <option value="ALL">Semua Kategori</option>
              {distinctCategories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="inp"
            >
              <option value="ALL">Semua Status</option>
              {distinctStatuses.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari Job, SPK..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="inp !pl-10 w-48 sm:w-56"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="tbl">
            <thead>
              <tr>
                <th>No</th>
                {(cfg.headers || []).map((h, i) => (
                  <th
                    key={i}
                    onClick={() => handleSort(i)}
                    className="whitespace-nowrap cursor-pointer hover:text-cyan-300 transition"
                  >
                    <div className="flex items-center gap-1">
                      <span>{h.replace(/_/g, ' ')}</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
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
                >
                  <td className="text-slate-400 font-mono">{(page - 1) * pageSize + idx + 1}</td>
                  {(cfg.headers || []).map((_, colIdx) => {
                    const val = row[colIdx];
                    if (colIdx === cfg.i.status) {
                      const isDone = String(val).toLowerCase().includes('selesai') || String(val).toLowerCase().includes('done');
                      const isInProg = String(val).toLowerCase().includes('progress') || String(val).toLowerCase().includes('proses');
                      return (
                        <td key={colIdx} className="whitespace-nowrap">
                          <span
                            className={`badge ${
                              isDone
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : isInProg
                                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            }`}
                          >
                            {val || '-'}
                          </span>
                        </td>
                      );
                    }
                    return (
                      <td key={colIdx} className="whitespace-nowrap text-slate-200 font-medium">
                        {colIdx === cfg.i.date ? fmtDate(val) : (val ?? '-')}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {paginatedRows.length === 0 && (
                <tr>
                  <td colSpan={cfg.headers.length + 1} className="text-center py-10 text-slate-400">
                    Tidak ada pekerjaan aktif yang cocok dengan kriteria pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
          <span>Halaman <b>{page}</b> dari <b>{totalPages}</b></span>
          <div className="flex items-center gap-1">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="p-2 rounded-full border border-white/10 disabled:opacity-30 hover:bg-white/10 text-cyan-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="p-2 rounded-full border border-white/10 disabled:opacity-30 hover:bg-white/10 text-cyan-300"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}