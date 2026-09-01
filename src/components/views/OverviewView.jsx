import React, { useState, useMemo } from 'react';
import { SHEETS } from '../../constants/schema';
import { cell, fmtDate, jopCat } from '../../utils/formatters';
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

export default function OverviewView({ data = {}, onOpenList, onSelectRow }) {
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

  // Mengambil seluruh data dari tabel job_active
  const rawRows = data.job_active || [];

  // Helper cerdas deteksi Kategori jika kolom category di DB bernilai NULL
  const getRowCategory = (r) => {
    const directCat = cell(r, cfg.i.category).trim();
    if (directCat && directCat !== '-' && directCat.toUpperCase() !== 'NULL') {
      return directCat.toUpperCase();
    }
    
    // Auto-detect dari prefix ID (FLX -> FLEXO, SCRN -> SCREEN, dst)
    const idVal = cell(r, cfg.i.id).toUpperCase();
    if (idVal.startsWith('FLX')) return 'FLEXO';
    if (idVal.startsWith('SCRN')) return 'SCREEN';
    if (idVal.startsWith('CTCP')) return 'CTCP';
    if (idVal.startsWith('CTP')) return 'CTP';
    if (idVal.startsWith('ETCH')) return 'ETCHING';

    return jopCat(cell(r, cfg.i.job_no || cfg.i.nojop));
  };

  // Filter HANYA berdasarkan Search Query, Kategori, dan Status (Tanpa Batasan Tanggal)
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return rawRows.filter((r) => {
      const idVal = cell(r, cfg.i.id).trim();
      if (!idVal || idVal.toUpperCase() === 'NULL') return false;

      const st = cell(r, cfg.i.status).trim();
      if (statusFilter !== 'ALL' && st.toLowerCase() !== statusFilter.toLowerCase()) return false;

      const cat = getRowCategory(r);
      if (categoryFilter !== 'ALL' && cat.toLowerCase() !== categoryFilter.toLowerCase()) return false;

      if (q) {
        return r.some((c) => String(c || '').toLowerCase().includes(q));
      }
      return true;
    });
  }, [rawRows, search, statusFilter, categoryFilter, cfg]);

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

  // Agregasi Status & Kategori untuk Chart & KPI
  const stats = useMemo(() => {
    const statusCount = {};
    const categoryCount = {};
    const categoryRows = {};
    const statusRows = {};

    filtered.forEach((r) => {
      const st = cell(r, cfg.i.status).trim() || 'ANTRI';
      const cat = getRowCategory(r) || 'GENERAL';

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
    return Array.from(new Set(rawRows.map((r) => getRowCategory(r)).filter(Boolean)));
  }, [rawRows, cfg]);

  const distinctStatuses = useMemo(() => {
    return Array.from(new Set(rawRows.map((r) => cell(r, cfg.i.status).trim()).filter(Boolean)));
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
      {/* Header Info Panel */}
      <div className="card p-5 bg-gradient-to-r from-slate-900 via-sky-950/80 to-slate-900 text-white flex flex-wrap items-center justify-between gap-4 border border-cyan-500/30">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge bg-cyan-500/20 text-cyan-300 border-cyan-400/40 font-bold">MONITORING PRODUKSI</span>
            <span className="text-xs text-slate-300">· Real-time Job Status</span>
          </div>
          <h2 className="font-display font-black text-xl sm:text-2xl mt-1 text-white tracking-wide">
            Dashboard Overview — Job Aktif (WIP)
          </h2>
          <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
            Daftar seluruh pekerjaan yang sedang dalam antrean atau proses pembuatan di Prepress
          </p>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider font-semibold">Status Data</div>
          <div className="font-bold text-sm text-cyan-300 mt-0.5">Semua Antrean Berjalan (Live)</div>
        </div>
      </div>

      {/* 4 Kartu KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div
          onClick={() => onOpenList?.('Seluruh Job Aktif', 'job_active', filtered)}
          className="card p-4 sm:p-5 border-l-4 border-l-cyan-500 cursor-pointer hover:scale-[1.02] transition"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">TOTAL JOB AKTIF</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 font-display font-black text-2xl sm:text-3xl text-white">
            {filtered.length.toLocaleString('id-ID')}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Seluruh pekerjaan dalam sistem</div>
        </div>

        <div
          onClick={() => {
            const inProg = filtered.filter((r) => {
              const s = cell(r, cfg.i.status).toLowerCase();
              return s.includes('progress') || s.includes('proses') || s.includes('screen') || s.includes('hdi');
            });
            onOpenList?.('Job Sedang Berjalan (In Progress)', 'job_active', inProg);
          }}
          className="card p-4 sm:p-5 border-l-4 border-l-emerald-500 cursor-pointer hover:scale-[1.02] transition"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">IN PROGRESS / PROSES</span>
            <PlayCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 font-display font-black text-2xl sm:text-3xl text-emerald-400">
            {filtered.filter((r) => {
              const s = cell(r, cfg.i.status).toLowerCase();
              return s.includes('progress') || s.includes('proses') || s.includes('screen') || s.includes('hdi');
            }).length.toLocaleString('id-ID')}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Sedang dikerjakan mesin/operator</div>
        </div>

        <div
          onClick={() => {
            const pending = filtered.filter((r) => {
              const s = cell(r, cfg.i.status).toLowerCase();
              return s.includes('queue') || s.includes('pending') || s.includes('antri') || s.includes('tunggu');
            });
            onOpenList?.('Job Dalam Antrean (Queue)', 'job_active', pending);
          }}
          className="card p-4 sm:p-5 border-l-4 border-l-amber-500 cursor-pointer hover:scale-[1.02] transition"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">IN QUEUE / ANTREAN</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 font-display font-black text-2xl sm:text-3xl text-amber-400">
            {filtered.filter((r) => {
              const s = cell(r, cfg.i.status).toLowerCase();
              return s.includes('queue') || s.includes('pending') || s.includes('antri') || s.includes('tunggu');
            }).length.toLocaleString('id-ID')}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Menunggu giliran / kelengkapan</div>
        </div>

        <div className="card p-4 sm:p-5 border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">KATEGORI PROSES</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 font-display font-black text-2xl sm:text-3xl text-indigo-300">
            {Object.keys(stats.categoryCount).length}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Divisi percetakan aktif</div>
        </div>
      </div>

      {/* Visualisasi Grafik Status & Kategori */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="card-title">Porsi Job Berdasarkan Kategori</h3>
            <span className="text-[10px] text-cyan-400 font-mono">Klik grafik untuk rincian</span>
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
                      backgroundColor: ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#64748b'],
                      borderColor: '#0f172a',
                      borderWidth: 2
                    }
                  ]
                }}
                options={{
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { labels: { color: '#e2e8f0', font: { size: 11 } } }
                  },
                  onClick: handleDoughnutClick
                }}
              />
            )}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="card-title">Distribusi Status Pengerjaan</h3>
            <span className="text-[10px] text-cyan-400 font-mono">Klik bar untuk rincian</span>
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
                      borderRadius: 6
                    }
                  ]
                }}
                options={{
                  maintainAspectRatio: false,
                  scales: {
                    x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                    y: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
                  },
                  plugins: {
                    legend: { labels: { color: '#e2e8f0', font: { size: 11 } } }
                  },
                  onClick: handleBarClick
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Tabel Data Job Aktif */}
      <div className="card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display font-extrabold text-base sm:text-lg text-white">
              Daftar Antrean & Eksekusi Job Aktif
            </h2>
            <p className="text-xs text-slate-400">
              Menampilkan <b className="text-cyan-300">{sorted.length.toLocaleString('id-ID')} pekerjaan</b> · Klik baris untuk detail lengkap
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="inp text-xs py-1.5 px-2.5 w-full sm:w-auto"
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
              className="inp text-xs py-1.5 px-2.5 w-full sm:w-auto"
            >
              <option value="ALL">Semua Status</option>
              {distinctStatuses.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <div className="relative w-full sm:w-auto">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari Job, No SPK, File..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="inp !pl-9 text-xs py-1.5 w-full sm:w-56"
              />
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="tbl min-w-[700px]">
            <thead>
              <tr>
                <th>No</th>
                {(cfg.headers || []).map((h, i) => (
                  <th
                    key={i}
                    onClick={() => handleSort(i)}
                    className="cursor-pointer hover:text-cyan-300 transition select-none"
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
                  className="cursor-pointer"
                >
                  <td className="text-slate-400">{(page - 1) * pageSize + idx + 1}</td>
                  {(cfg.headers || []).map((_, colIdx) => {
                    const val = row[colIdx];

                    // Kategori
                    if (colIdx === cfg.i.category) {
                      const displayCat = val && val !== '-' && String(val).toUpperCase() !== 'NULL' ? val : getRowCategory(row);
                      return (
                        <td key={colIdx} className="whitespace-nowrap font-bold text-cyan-300">
                          {displayCat}
                        </td>
                      );
                    }

                    // Status Badge
                    if (colIdx === cfg.i.status) {
                      const str = String(val || '').toLowerCase();
                      const isDone = str.includes('selesai') || str.includes('done');
                      const isInProg = str.includes('progress') || str.includes('proses') || str.includes('screen') || str.includes('hdi');
                      return (
                        <td key={colIdx} className="whitespace-nowrap">
                          <span
                            className={`badge ${
                              isDone
                                ? 'badge-success'
                                : isInProg
                                ? 'badge-info'
                                : 'badge-warning'
                            }`}
                          >
                            {val || 'ANTRI'}
                          </span>
                        </td>
                      );
                    }

                    return (
                      <td key={colIdx} className={`whitespace-nowrap ${colIdx === cfg.i.id ? 'font-bold text-white' : 'text-slate-200'}`}>
                        {colIdx === cfg.i.date ? (val && String(val).toUpperCase() !== 'NULL' ? fmtDate(val) : '—') : (val ?? '—')}
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

        {/* Pagination Control */}
        <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
          <span>
            Halaman <b className="text-white">{page}</b> dari <b className="text-white">{totalPages}</b>
          </span>
          <div className="flex items-center gap-1.5">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="btn-ghost !py-1 !px-2.5 text-xs disabled:opacity-30 rounded-lg"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="btn-ghost !py-1 !px-2.5 text-xs disabled:opacity-30 rounded-lg"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}