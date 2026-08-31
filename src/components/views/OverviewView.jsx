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
import { Activity, Clock, PlayCircle, Layers, Search, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function OverviewView({ data = {}, period, onOpenList, onSelectRow }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [sortCol, setSortCol] = useState(0);
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // PERBAIKAN: Gunakan SHEETS.job_active (bukan jop_active)
  const cfg = SHEETS.job_active || {
    headers: ['id', 'job_name', 'job_no', 'file_no', 'status', 'start_time', 'date', 'category'],
    i: { id: 0, job_name: 1, jop: 1, job_no: 2, nojop: 2, file_no: 3, status: 4, start_time: 5, date: 6, category: 7 }
  };

  // PERBAIKAN: Ambil data dari job_active
  const rawRows = data.job_active || [];

  // Filter baris data Job Aktif
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

  // Sorting
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

  // Pagination
  const totalPages = Math.ceil(sorted.length / pageSize) || 1;
  const paginatedRows = sorted.slice((page - 1) * pageSize, page * pageSize);

  // Agregasi Status & Kategori
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

  return (
    <div className="space-y-5 anim-in">
      <div className="card p-5 bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge bg-sky-400/20 text-sky-300 font-bold">MONITORING PRODUKSI</span>
            <span className="text-xs text-slate-300">· Real-time Job Status</span>
          </div>
          <h2 className="font-display font-extrabold text-2xl mt-1 text-white">
            Dashboard Overview — Job Aktif (WIP)
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Daftar seluruh pekerjaan yang sedang dalam antrean atau proses pembuatan di Prepress
          </p>
        </div>
        <div className="text-right">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Periode</div>
          <div className="font-bold text-sm text-sky-300 mt-0.5">{fmtPeriodRange(period?.from, period?.to)}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div
          onClick={() => onOpenList?.('Seluruh Job Aktif Terfilter', 'job_active', filtered)}
          className="card p-4 bg-white dark:bg-slate-900 border-l-4 border-l-sky-500 cursor-pointer hover:shadow-md transition"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase">TOTAL JOB AKTIF</span>
            <Activity className="w-4 h-4 text-sky-500" />
          </div>
          <div className="mt-2 font-display font-extrabold text-2xl text-slate-800 dark:text-white">
            {filtered.length.toLocaleString('id-ID')}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Klik untuk lihat seluruh antrean</div>
        </div>

        <div
          onClick={() => {
            const inProg = filtered.filter(r => cell(r, cfg.i.status).toLowerCase().includes('progress') || cell(r, cfg.i.status).toLowerCase().includes('proses'));
            onOpenList?.('Job Sedang Berjalan (In Progress)', 'job_active', inProg);
          }}
          className="card p-4 bg-white dark:bg-slate-900 border-l-4 border-l-emerald-500 cursor-pointer hover:shadow-md transition"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase">IN PROGRESS</span>
            <PlayCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 font-display font-extrabold text-2xl text-emerald-600">
            {filtered.filter(r => cell(r, cfg.i.status).toLowerCase().includes('progress') || cell(r, cfg.i.status).toLowerCase().includes('proses')).length.toLocaleString('id-ID')}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Sedang dikerjakan mesin/operator</div>
        </div>

        <div
          onClick={() => {
            const pending = filtered.filter(r => cell(r, cfg.i.status).toLowerCase().includes('queue') || cell(r, cfg.i.status).toLowerCase().includes('pending') || cell(r, cfg.i.status).toLowerCase().includes('antri'));
            onOpenList?.('Job Dalam Antrean (Queue)', 'job_active', pending);
          }}
          className="card p-4 bg-white dark:bg-slate-900 border-l-4 border-l-amber-500 cursor-pointer hover:shadow-md transition"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase">IN QUEUE / ANTREAN</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 font-display font-extrabold text-2xl text-amber-600">
            {filtered.filter(r => cell(r, cfg.i.status).toLowerCase().includes('queue') || cell(r, cfg.i.status).toLowerCase().includes('pending') || cell(r, cfg.i.status).toLowerCase().includes('antri')).length.toLocaleString('id-ID')}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Menunggu giliran mesin</div>
        </div>

        <div className="card p-4 bg-white dark:bg-slate-900 border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase">KATEGORI PROSES</span>
            <Layers className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 font-display font-extrabold text-2xl text-indigo-600">
            {Object.keys(stats.categoryCount).length}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Divisi percetakan pemohon</div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card p-5 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between mb-2">
            <h3 className="card-title">Porsi Job Berdasarkan Kategori</h3>
            <span className="text-[10px] text-slate-400">Klik grafik untuk rincian</span>
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
                      backgroundColor: ['#0284c7', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#64748b']
                    }
                  ]
                }}
                options={{
                  maintainAspectRatio: false,
                  onClick: handleDoughnutClick
                }}
              />
            )}
          </div>
        </div>

        <div className="card p-5 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between mb-2">
            <h3 className="card-title">Distribusi Status Pengerjaan</h3>
            <span className="text-[10px] text-slate-400">Klik bar untuk rincian</span>
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
                      backgroundColor: '#0284c7',
                      borderRadius: 4
                    }
                  ]
                }}
                options={{
                  maintainAspectRatio: false,
                  onClick: handleBarClick
                }}
              />
            )}
          </div>
        </div>
      </div>

      <div className="card p-5 bg-white dark:bg-slate-900 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display font-extrabold text-lg text-slate-800 dark:text-white">
              Daftar Antrean & Eksekusi Job Aktif
            </h2>
            <p className="text-xs text-slate-500">
              Menampilkan <b>{sorted.length.toLocaleString('id-ID')} pekerjaan</b> · Klik baris untuk detail lengkap
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="inp text-xs py-1.5 px-2.5 dark:bg-slate-800 dark:text-white"
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
              className="inp text-xs py-1.5 px-2.5 dark:bg-slate-800 dark:text-white"
            >
              <option value="ALL">Semua Status</option>
              {distinctStatuses.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari Job, No SPK, File..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="inp !pl-8 text-xs py-1.5 w-48 sm:w-56 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">No</th>
                {(cfg.headers || []).map((h, i) => (
                  <th
                    key={i}
                    onClick={() => handleSort(i)}
                    className="py-2.5 px-3 whitespace-nowrap cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                  >
                    <div className="flex items-center gap-1">
                      <span>{h.replace(/_/g, ' ')}</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedRows.map((row, idx) => (
                <tr
                  key={idx}
                  onClick={() => onSelectRow?.('job_active', row)}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer"
                >
                  <td className="py-2.5 px-3 text-slate-400">{(page - 1) * pageSize + idx + 1}</td>
                  {(cfg.headers || []).map((_, colIdx) => {
                    const val = row[colIdx];
                    if (colIdx === cfg.i.status) {
                      const isDone = String(val).toLowerCase().includes('selesai') || String(val).toLowerCase().includes('done');
                      const isInProg = String(val).toLowerCase().includes('progress') || String(val).toLowerCase().includes('proses');
                      return (
                        <td key={colIdx} className="py-2.5 px-3 whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isDone
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                                : isInProg
                                ? 'bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                            }`}
                          >
                            {val || '-'}
                          </span>
                        </td>
                      );
                    }
                    return (
                      <td key={colIdx} className="py-2.5 px-3 whitespace-nowrap text-slate-700 dark:text-slate-300">
                        {colIdx === cfg.i.date ? fmtDate(val) : (val ?? '-')}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {paginatedRows.length === 0 && (
                <tr>
                  <td colSpan={cfg.headers.length + 1} className="text-center py-8 text-slate-400">
                    Tidak ada pekerjaan aktif yang cocok dengan kriteria pencarian/filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
          <span>
            Halaman <b>{page}</b> dari <b>{totalPages}</b>
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
