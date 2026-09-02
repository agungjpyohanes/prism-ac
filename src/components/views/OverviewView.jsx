import React, { useState, useMemo } from 'react';
import { SHEETS, FORMS } from '../../constants/schema';
import { cell, fmtDate, jopCat, getStatusBadgeClass, getCategoryBadgeClass, getChartTheme } from '../../utils/formatters';
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
import {
  Activity,
  Clock,
  PlayCircle,
  Layers,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ExternalLink,
  Copy,
  Printer,
  FileText,
  Frame,
  Package,
  Sparkles,
  ClipboardList,
  CheckCircle2
} from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function OverviewView({ data = {}, onOpenList, onSelectRow, onToast }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [sortCol, setSortCol] = useState(0);
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const [copiedId, setCopiedId] = useState(null);
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
    if (idVal.startsWith('CTP')) return 'CTP';
    if (idVal.startsWith('CTCP')) return 'CTCP';
    if (idVal.startsWith('ETCH')) return 'ETCHING';

    // Auto-detect dari nama JOP
    const jopName = cell(r, cfg.i.job_name || cfg.i.jop);
    return jopCat(jopName);
  };

  // Filter Baris Aktif
  const filtered = useMemo(() => {
    return rawRows.filter((r) => {
      const idVal = cell(r, cfg.i.id).trim();
      const jopVal = cell(r, cfg.i.job_name || cfg.i.jop).trim();
      const noJopVal = cell(r, cfg.i.job_no || cfg.i.nojop).trim();

      // Skip baris kosong
      if (!idVal || (!jopVal && !noJopVal)) return false;

      // Status Filter
      if (statusFilter !== 'ALL') {
        const s = cell(r, cfg.i.status).trim();
        if (s !== statusFilter) return false;
      }

      // Kategori Filter
      if (categoryFilter !== 'ALL') {
        const cat = getRowCategory(r);
        if (cat !== categoryFilter) return false;
      }

      // Search Query
      if (search.trim()) {
        const q = search.toLowerCase();
        const combined = (cfg.headers || []).map((_, i) => cell(r, i)).join(' ').toLowerCase();
        if (!combined.includes(q)) return false;
      }

      return true;
    });
  }, [rawRows, cfg, statusFilter, categoryFilter, search]);

  // Statistik & Agregasi
  const stats = useMemo(() => {
    const statusCount = {};
    const categoryCount = {};
    const statusRows = {};
    const categoryRows = {};

    filtered.forEach((r) => {
      // Hitung Status
      let s = cell(r, cfg.i.status).trim();
      if (!s || s === '-' || s.toUpperCase() === 'NULL') s = 'ANTRI';
      statusCount[s] = (statusCount[s] || 0) + 1;
      if (!statusRows[s]) statusRows[s] = [];
      statusRows[s].push(r);

      // Hitung Kategori
      const cat = getRowCategory(r);
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
      if (!categoryRows[cat]) categoryRows[cat] = [];
      categoryRows[cat].push(r);
    });

    return { statusCount, categoryCount, statusRows, categoryRows };
  }, [filtered, cfg]);

  // Sorting
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let vA = cell(a, sortCol);
      let vB = cell(b, sortCol);
      if (sortCol === cfg.i.date) {
        vA = new Date(vA).getTime() || 0;
        vB = new Date(vB).getTime() || 0;
      }
      if (vA < vB) return sortAsc ? -1 : 1;
      if (vA > vB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [filtered, sortCol, sortAsc, cfg]);

  // Pagination
  const totalPages = Math.ceil(sorted.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page, pageSize]);

  const handleSort = (colIdx) => {
    if (sortCol === colIdx) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(colIdx);
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

  const handleCopyLink = (url, label, id) => {
    try {
      navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      if (onToast) onToast(`Link Form ${label} disalin ke clipboard!`, 'ok');
    } catch {
      if (onToast) onToast('Gagal menyalin link.', 'err');
    }
  };

  const getDivisionIcon = (iconType) => {
    switch (iconType) {
      case 'printer':
        return <Printer className="w-4 h-4" />;
      case 'file-text':
        return <FileText className="w-4 h-4" />;
      case 'frame':
        return <Frame className="w-4 h-4" />;
      case 'package':
        return <Package className="w-4 h-4" />;
      case 'sparkles':
        return <Sparkles className="w-4 h-4" />;
      default:
        return <Layers className="w-4 h-4" />;
    }
  };

  // Distinct Filter Options
  const distinctStatuses = useMemo(() => {
    const s = new Set();
    rawRows.forEach((r) => {
      const v = cell(r, cfg.i.status).trim();
      if (v && v !== '-' && v.toUpperCase() !== 'NULL') s.add(v);
    });
    return Array.from(s);
  }, [rawRows, cfg]);

  const distinctCategories = useMemo(() => {
    const c = new Set();
    rawRows.forEach((r) => {
      const cat = getRowCategory(r);
      if (cat) c.add(cat);
    });
    return Array.from(c);
  }, [rawRows]);

  return (
    <div className="space-y-5 anim-in">
      {/* ========================================================================= */}
      {/* 1. HEADER INFO PANEL */}
      {/* ========================================================================= */}
      <div className="card p-5 bg-gradient-to-r from-slate-900 via-sky-950/80 to-slate-900 text-white flex flex-wrap items-center justify-between gap-4 border border-cyan-500/30">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge bg-cyan-500/20 text-cyan-300 border-cyan-400/40 font-bold">MONITORING PRODUKSI</span>
            <span className="text-xs text-slate-300">&bull; Real-time Job Status</span>
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

      {/* ========================================================================= */}
      {/* 2. 4 KARTU METRIC RINGKASAN */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div
          onClick={() => onOpenList?.('Seluruh Job Aktif (WIP)', 'job_active', filtered)}
          className="card p-4 sm:p-5 border-l-4 border-l-cyan-500 cursor-pointer hover:scale-[1.02] transition"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">TOTAL JOB AKTIF</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 font-display font-black text-2xl sm:text-3xl text-slate-900 dark:text-white">
            {filtered.length.toLocaleString('id-ID')}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Seluruh pekerjaan dalam sistem &bull; Klik detail</div>
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
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Sedang dikerjakan &bull; Klik detail</div>
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
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Menunggu giliran &bull; Klik detail</div>
        </div>

        <div
          onClick={() => onOpenList?.('Daftar Job Aktif Berdasarkan Kategori', 'job_active', filtered)}
          className="card p-4 sm:p-5 border-l-4 border-l-indigo-500 cursor-pointer hover:scale-[1.02] transition"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">KATEGORI PROSES</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 font-display font-black text-2xl sm:text-3xl text-indigo-400">
            {Object.keys(stats.categoryCount).length}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Divisi aktif &bull; Klik detail</div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. CHART SECTION (POSISI JOB KATEGORI & DISTRIBUSI STATUS) */}
      {/* ========================================================================= */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="card-title text-slate-900 dark:text-white">Porsi Job Berdasarkan Kategori</h3>
            <span className="text-[10px] text-cyan-400 font-mono">Klik grafik untuk rincian</span>
          </div>
          <div className="h-64 flex items-center justify-center">
            {Object.keys(stats.categoryCount).length === 0 ? (
              <span className="text-xs text-slate-400">Tidak ada data kategori</span>
            ) : (() => {
              const ct = getChartTheme();
              return (
                <Doughnut
                  data={{
                    labels: Object.keys(stats.categoryCount),
                    datasets: [
                      {
                        data: Object.values(stats.categoryCount),
                        backgroundColor: ['#0284c7', '#6366f1', '#059669', '#d97706', '#d946ef', '#2563eb', '#64748b'],
                        borderColor: ct.isLight ? '#ffffff' : '#0f172a',
                        borderWidth: 2
                      }
                    ]
                  }}
                  options={{
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { labels: { color: ct.legendColor, font: { size: 11, weight: 'bold' } } },
                      tooltip: {
                        backgroundColor: '#0f172a',
                        titleColor: '#ffffff',
                        bodyColor: '#f8fafc',
                        padding: 10,
                        cornerRadius: 8
                      }
                    },
                    onClick: handleDoughnutClick
                  }}
                />
              );
            })()}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="card-title text-slate-900 dark:text-white">Distribusi Status Pengerjaan</h3>
            <span className="text-[10px] text-cyan-400 font-mono">Klik bar untuk rincian</span>
          </div>
          <div className="h-64">
            {Object.keys(stats.statusCount).length === 0 ? (
              <span className="text-xs text-slate-400">Tidak ada data status</span>
            ) : (() => {
              const ct = getChartTheme();
              return (
                <Bar
                  data={{
                    labels: Object.keys(stats.statusCount),
                    datasets: [
                      {
                        label: 'Jumlah Job',
                        data: Object.values(stats.statusCount),
                        backgroundColor: ct.totalColor,
                        borderRadius: 6
                      }
                    ]
                  }}
                  options={{
                    maintainAspectRatio: false,
                    scales: {
                      x: { ticks: { color: ct.tickColor }, grid: { color: ct.gridColor } },
                      y: { beginAtZero: true, ticks: { color: ct.tickColor }, grid: { color: ct.gridColor } }
                    },
                    plugins: {
                      legend: { labels: { color: ct.legendColor, font: { size: 11, weight: 'bold' } } },
                      tooltip: {
                        backgroundColor: '#0f172a',
                        titleColor: '#ffffff',
                        bodyColor: '#f8fafc',
                        padding: 10,
                        cornerRadius: 8
                      }
                    },
                    onClick: handleBarClick
                  }}
                />
              );
            })()}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. BLOK FORM PERMINTAAN PEKERJAAN (5 DIVISI PREPRESS) */}
      {/* ========================================================================= */}
      <div className="card p-4 sm:p-5 bg-white dark:bg-[#0c1430]/90 border border-slate-200 dark:border-cyan-500/30 shadow-sm space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-cyan-500/20 text-blue-600 dark:text-cyan-300 flex items-center justify-center">
              <ClipboardList className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-black text-xs sm:text-sm text-slate-900 dark:text-white tracking-wide">
                Form Permintaan Pekerjaan (5 Divisi Prepress)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Isi formulir permintaan plate/master baru secara langsung — otomatis tersinkronisasi ke sistem monitoring
              </p>
            </div>
          </div>
          <span className="badge bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 font-mono text-[10px] font-bold">
            Google Form Terhubung
          </span>
        </div>

        {/* 5 Division Interactive Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {FORMS.map((f, idx) => {
            const isCopied = copiedId === (f.id || idx);
            return (
              <div
                key={f.id || idx}
                className={`p-3.5 rounded-2xl border ${f.borderClass} bg-slate-50/60 dark:bg-slate-900/70 hover:scale-[1.02] hover:shadow-md transition duration-150 flex flex-col justify-between relative overflow-hidden group`}
              >
                {/* Top Accent Line */}
                <div
                  className="absolute top-0 inset-x-0 h-1"
                  style={{ background: f.color }}
                />

                <div>
                  <div className="flex items-center justify-between gap-1.5 mb-2">
                    <div
                      className="w-7 h-7 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
                      style={{ background: f.color }}
                    >
                      {getDivisionIcon(f.iconType)}
                    </div>
                    <span className={`badge ${f.bgBadge} font-mono text-[9px] font-bold uppercase`}>
                      {f.badge}
                    </span>
                  </div>

                  <h4 className="font-display font-black text-xs text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-cyan-300 transition">
                    {f.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {f.desc}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-200/70 dark:border-slate-800 flex items-center gap-1.5">
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold text-white shadow-sm flex items-center justify-center gap-1 transition-all active:scale-95"
                    style={{ background: f.color }}
                    title="Buka Form di Tab Baru"
                  >
                    <span>Buka</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCopyLink(f.url, f.label, f.id || idx)}
                    className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-cyan-300 transition shrink-0"
                    title="Salin Link Form"
                  >
                    {isCopied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. TABEL DATA JOB AKTIF */}
      {/* ========================================================================= */}
      <div className="card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
              Daftar Antrean &amp; Eksekusi Job Aktif
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Menampilkan <b className="text-blue-600 dark:text-cyan-300">{sorted.length.toLocaleString('id-ID')} pekerjaan</b> &bull; Klik baris untuk detail lengkap
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="inp text-xs py-1.5 px-2.5 w-full sm:w-auto font-semibold"
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
              className="inp text-xs py-1.5 px-2.5 w-full sm:w-auto font-semibold"
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
                placeholder="Cari Job, No JOP, File..."
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
                    className="cursor-pointer hover:text-blue-600 dark:hover:text-cyan-300 transition select-none"
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
                  <td className="text-slate-500 dark:text-slate-400 font-mono font-bold">{(page - 1) * pageSize + idx + 1}</td>
                  {(cfg.headers || []).map((_, colIdx) => {
                    const val = row[colIdx];

                    // Kategori
                    if (colIdx === cfg.i.category) {
                      const displayCat = val && val !== '-' && String(val).toUpperCase() !== 'NULL' ? val : getRowCategory(row);
                      return (
                        <td key={colIdx} className="whitespace-nowrap">
                          <span className={`badge ${getCategoryBadgeClass(displayCat)} font-bold`}>
                            {displayCat}
                          </span>
                        </td>
                      );
                    }

                    // Status Badge
                    if (colIdx === cfg.i.status) {
                      const str = String(val || 'ANTRI');
                      return (
                        <td key={colIdx} className="whitespace-nowrap">
                          <span className={`badge ${getStatusBadgeClass(str)} font-bold`}>
                            {str}
                          </span>
                        </td>
                      );
                    }

                    return (
                      <td key={colIdx} className={`whitespace-nowrap ${colIdx === cfg.i.id ? 'font-bold text-slate-900 dark:text-white font-mono' : 'text-slate-800 dark:text-slate-200'}`}>
                        {colIdx === cfg.i.date ? (val && String(val).toUpperCase() !== 'NULL' ? fmtDate(val) : '—') : (val ?? '—')}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {paginatedRows.length === 0 && (
                <tr>
                  <td colSpan={cfg.headers.length + 1} className="text-center py-8 text-slate-500 dark:text-slate-400">
                    Tidak ada pekerjaan aktif yang cocok dengan kriteria pencarian/filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Control */}
        <div className="flex items-center justify-between pt-2 text-xs text-slate-500 dark:text-slate-400">
          <span>
            Halaman <b className="text-slate-900 dark:text-white">{page}</b> dari <b className="text-slate-900 dark:text-white">{totalPages}</b>
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