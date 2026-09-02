import React, { useState, useMemo } from 'react';
import { SHEETS, PROD_KEYS } from '../../constants/schema';
import { parseDateVal, num, cell, startOfDay, fmtPeriodRange, getChartTheme } from '../../utils/formatters';
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
  Users,
  Clock,
  Search,
  Filter,
  Briefcase,
  User,
  Crown,
  Medal,
  CheckCircle2,
  AlertTriangle,
  Award,
  Sparkles,
  UserCheck,
  Flame
} from 'lucide-react';
import StatCard from '../ui/StatCard';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function TeamKpiView({ data = {}, user, period, onOpenList }) {
  // Sub-tabs: 'team_leader' | 'personal_kpi' | 'star_podium'
  const [activeTab, setActiveTab] = useState('team_leader');

  const [selectedProcess, setSelectedProcess] = useState('ALL');
  const [activeLeaderboardTab, setActiveLeaderboardTab] = useState('OP');
  const [searchQuery, setSearchQuery] = useState('');

  const targetKeys = selectedProcess === 'ALL' ? PROD_KEYS : [selectedProcess];

  // Ekstraksi baris data sesuai lini & rentang tanggal
  const allRows = useMemo(() => {
    const res = [];
    targetKeys.forEach((key) => {
      const cfg = SHEETS[key];
      const raw = data[key] || [];
      const poCol = cfg?.i?.po ?? cfg?.i?.po_helper ?? -1;

      raw.forEach((r) => {
        const idVal = cell(r, cfg.i?.id).trim();
        const jopVal = cell(r, cfg.i?.jop).trim();
        const noJopVal = cell(r, cfg.i?.nojop).trim();
        if (!idVal || (!jopVal && !noJopVal)) return;

        const d = parseDateVal(r[cfg.i?.date]);
        if (d && period?.from && period?.to) {
          const from = startOfDay(period.from).getTime();
          const to = new Date(period.to).setHours(23, 59, 59, 999);
          if (d.getTime() < from || d.getTime() > to) return;
        }

        res.push({
          key,
          process: cfg.label,
          good: num(r[cfg.i?.baik]),
          reject: num(r[cfg.i?.rusak]),
          replace: num(r[cfg.i?.ganti]),
          operator: cell(r, cfg.i?.op || cfg.i?.operator).trim() || 'Unassigned',
          shift: cell(r, cfg.i?.shift).toUpperCase().trim() || 'NON-SHIFT',
          po: (poCol !== -1 && cell(r, poCol).trim()) || 'Tanpa PO',
          raw: r
        });
      });
    });
    return res;
  }, [data, targetKeys, period]);

  // Agregasi Operator
  const operatorStats = useMemo(() => {
    const map = new Map();
    allRows.forEach((r) => {
      const e = map.get(r.operator) || {
        name: r.operator,
        good: 0,
        reject: 0,
        replace: 0,
        process: r.process,
        rowList: []
      };
      e.good += r.good;
      e.reject += r.reject;
      e.replace += r.replace;
      e.rowList.push(r.raw);
      map.set(r.operator, e);
    });

    return [...map.values()]
      .map((o) => {
        const output = o.good + o.reject;
        const lossRate = output > 0 ? (o.reject / output) * 100 : 0;
        const score = output > 0 ? Math.max(0, Math.round(100 - lossRate * 8 + o.good * 0.05)) : 0;
        return { ...o, output, lossRate, score };
      })
      .sort((a, b) => b.output - a.output);
  }, [allRows]);

  // Agregasi PO (Customer)
  const poStats = useMemo(() => {
    const map = new Map();
    allRows.forEach((r) => {
      const e = map.get(r.po) || {
        name: r.po,
        good: 0,
        reject: 0,
        replace: 0,
        process: r.process,
        rowList: []
      };
      e.good += r.good;
      e.reject += r.reject;
      e.replace += r.replace;
      e.rowList.push(r.raw);
      map.set(r.po, e);
    });

    return [...map.values()]
      .map((o) => {
        const output = o.good + o.reject;
        const lossRate = output > 0 ? (o.reject / output) * 100 : 0;
        return { ...o, output, lossRate };
      })
      .sort((a, b) => b.output - a.output);
  }, [allRows]);

  const activeData = activeLeaderboardTab === 'OP' ? operatorStats : poStats;

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return activeData;
    const q = searchQuery.toLowerCase();
    return activeData.filter((o) => o.name.toLowerCase().includes(q));
  }, [activeData, searchQuery]);

  // Agregasi Shift
  const shiftStats = useMemo(() => {
    const map = new Map();
    allRows.forEach((r) => {
      const e = map.get(r.shift) || { good: 0, reject: 0, replace: 0 };
      e.good += r.good;
      e.reject += r.reject;
      e.replace += r.replace;
      map.set(r.shift, e);
    });

    const labels = [...map.keys()].sort();
    return {
      labels,
      good: labels.map((l) => map.get(l).good),
      reject: labels.map((l) => map.get(l).reject)
    };
  }, [allRows]);

  // Star Podium Rankings (berdasarkan Skor)
  const starRankings = useMemo(() => {
    return [...operatorStats].sort((a, b) => b.score - a.score);
  }, [operatorStats]);

  const topThree = starRankings.slice(0, 3);

  // ==========================================
  // PERSONAL KPI AGGREGATION
  // ==========================================
  const currentUsername = String(user?.USER || user?.username || 'guest').trim().toLowerCase();

  const userStats = useMemo(() => {
    let good = 0, reject = 0, replace = 0, totalJob = 0;
    const records = [];

    PROD_KEYS.forEach((key) => {
      const cfg = SHEETS[key];
      const rows = data[key] || [];

      rows.forEach((r) => {
        const idVal = cell(r, cfg.i?.id).trim();
        const opVal = cell(r, cfg.i?.op || cfg.i?.operator).trim().toLowerCase();
        if (!idVal || (currentUsername !== 'guest' && !opVal.includes(currentUsername))) return;

        const d = parseDateVal(r[cfg.i?.date]);
        if (d && period?.from && period?.to) {
          const from = startOfDay(period.from).getTime();
          const to = new Date(period.to).setHours(23, 59, 59, 999);
          if (d.getTime() < from || d.getTime() > to) return;
        }

        const g = num(r[cfg.i?.baik]);
        const rj = num(r[cfg.i?.rusak]);
        const rp = num(r[cfg.i?.ganti]);

        good += g;
        reject += rj;
        replace += rp;
        totalJob += 1;

        records.push({
          key,
          process: cfg.label,
          job: cell(r, cfg.i?.jop) || cell(r, cfg.i?.nojop),
          date: r[cfg.i?.date],
          good: g,
          reject: rj,
          replace: rp
        });
      });
    });

    const output = good + reject;
    const lossRate = output > 0 ? (reject / output) * 100 : 0;
    const score = output > 0 ? Math.max(0, Math.round(100 - lossRate * 10)) : 100;

    return { good, reject, replace, output, lossRate, score, totalJob, records };
  }, [data, currentUsername, period]);

  return (
    <div className="space-y-5 anim-in">
      {/* Sub-View Tabs Header (Pengawasan Shift & Operator | Evaluasi KPI Personal | KPI Podium) */}
      <div className="card p-2 sm:p-3 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5 shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-100 dark:bg-[#090d16] rounded-2xl border border-slate-200 dark:border-slate-800 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('team_leader')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'team_leader'
                ? 'bg-blue-600 text-white shadow-sm dark:bg-gradient-to-r dark:from-cyan-500 dark:to-blue-600'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Pengawasan Shift &amp; Operator (Leader View)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('personal_kpi')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'personal_kpi'
                ? 'bg-blue-600 text-white shadow-sm dark:bg-gradient-to-r dark:from-cyan-500 dark:to-blue-600'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Evaluasi &amp; Scorecard KPI Personal</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('star_podium')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'star_podium'
                ? 'bg-blue-600 text-white shadow-sm dark:bg-gradient-to-r dark:from-cyan-500 dark:to-blue-600'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Crown className="w-4 h-4" />
            <span>KPI Leaderboard &amp; Star Ranking</span>
          </button>
        </div>

        {/* Filter Lini Proses (Khusus Tab Leader & Podium) */}
        {activeTab !== 'personal_kpi' && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-blue-600 dark:text-cyan-400 shrink-0" />
            <select
              value={selectedProcess}
              onChange={(e) => setSelectedProcess(e.target.value)}
              className="inp text-xs !py-1.5 font-semibold w-full sm:w-auto"
            >
              <option value="ALL">Semua Lini Proses (Gabungan)</option>
              {PROD_KEYS.map((k) => (
                <option key={k} value={k}>{SHEETS[k].label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PENGAWASAN SHIFT & OPERATOR (LEADER VIEW) */}
      {/* ========================================================================= */}
      {activeTab === 'team_leader' && (
        <div className="space-y-5 anim-in">
          {/* Header Banner */}
          <div className="card p-5 bg-gradient-to-r from-slate-900 via-sky-950/80 to-slate-900 text-white flex flex-wrap items-center justify-between gap-4 border border-cyan-500/30">
            <div>
              <div className="flex items-center gap-2">
                <span className="badge bg-cyan-500/20 text-cyan-300 border-cyan-400/40 font-bold">
                  PENGAWASAN OPERASIONAL TIM
                </span>
                <span className="text-xs text-slate-300">&bull; Shift &amp; Output Monitoring</span>
              </div>
              <h2 className="font-display font-black text-xl sm:text-2xl mt-1 text-white tracking-wide">
                Evaluasi Performa Operator, PO &amp; Shift
              </h2>
              <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
                Analisis produktivitas tim harian/bulanan, perbandingan beban antar shift, dan rasio kualitas per individu.
              </p>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider font-semibold">Rentang Aktif</div>
              <div className="font-bold text-sm text-cyan-300 mt-0.5">{fmtPeriodRange(period?.from, period?.to)}</div>
              <div className="text-xs text-slate-400">{allRows.length.toLocaleString('id-ID')} Transaksi Tercatat</div>
            </div>
          </div>

          {/* Grid Shift Analysis */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                <h3 className="card-title text-slate-900 dark:text-white">Performa Output per Shift</h3>
              </div>
              <div className="h-64">
                {(() => {
                  const ct = getChartTheme();
                  return (
                    <Bar
                      data={{
                        labels: shiftStats.labels,
                        datasets: [
                          { label: 'Good Output', data: shiftStats.good, backgroundColor: ct.goodColor, borderRadius: 4 },
                          { label: 'Defect / Reject', data: shiftStats.reject, backgroundColor: ct.defectColor, borderRadius: 4 }
                        ]
                      }}
                      options={{
                        maintainAspectRatio: false,
                        scales: {
                          x: { stacked: true, ticks: { color: ct.tickColor }, grid: { color: ct.gridColor } },
                          y: { stacked: true, ticks: { color: ct.tickColor }, grid: { color: ct.gridColor } }
                        },
                        plugins: {
                          legend: { labels: { color: ct.legendColor, font: { size: 11, weight: 'bold' } } }
                        }
                      }}
                    />
                  );
                })()}
              </div>
            </div>

            <div className="card p-5">
              <h3 className="card-title mb-3 text-slate-900 dark:text-white">Porsi Good Output Antar Shift</h3>
              <div className="h-64 flex items-center justify-center">
                {(() => {
                  const ct = getChartTheme();
                  return (
                    <Doughnut
                      data={{
                        labels: shiftStats.labels,
                        datasets: [
                          {
                            data: shiftStats.good,
                            backgroundColor: ['#0284c7', '#059669', '#d97706', '#6366f1', '#64748b'],
                            borderColor: ct.isLight ? '#ffffff' : '#0f172a',
                            borderWidth: 2
                          }
                        ]
                      }}
                      options={{
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { labels: { color: ct.legendColor, font: { size: 11, weight: 'bold' } } }
                        }
                      }}
                    />
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Tabel Leaderboard Terpisah (Operator vs PO) */}
          <div className="card p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  {activeLeaderboardTab === 'OP' ? (
                    <Users className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
                  ) : (
                    <Briefcase className="w-5 h-5 text-amber-500" />
                  )}
                  <h3 className="card-title text-slate-900 dark:text-white">
                    {activeLeaderboardTab === 'OP' ? 'Ranking Produktivitas Operator' : 'Ranking Produktivitas PO (Customer)'}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Daftar peringkat berdasarkan volume output dan rasio reject terkecil
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1 h-9">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveLeaderboardTab('OP');
                      setSearchQuery('');
                    }}
                    className={`h-7 px-4 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center justify-center ${
                      activeLeaderboardTab === 'OP'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Operator
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveLeaderboardTab('PO');
                      setSearchQuery('');
                    }}
                    className={`h-7 px-4 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center justify-center ${
                      activeLeaderboardTab === 'PO'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    PO
                  </button>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder={activeLeaderboardTab === 'OP' ? 'Cari Operator...' : 'Cari PO...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="inp !pl-9 text-xs h-9 w-full"
                  />
                </div>
              </div>
            </div>

            <div className="table-responsive">
              <table className="tbl min-w-[700px]">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>{activeLeaderboardTab === 'OP' ? 'Nama Operator' : 'Nama PO'}</th>
                    <th>Lini Terakhir</th>
                    <th>Total Output</th>
                    <th>Good</th>
                    <th>Reject</th>
                    <th>Replace</th>
                    <th>Loss Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((o, idx) => (
                    <tr
                      key={o.name}
                      onClick={() => onOpenList?.(`Rekap: ${o.name}`, o.process || 'rec_ctcp', o.rowList)}
                      className="cursor-pointer"
                    >
                      <td className="font-mono font-bold text-slate-500 dark:text-slate-400">#{idx + 1}</td>
                      <td className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        {o.name}
                        <span className="text-[10px] text-blue-600 dark:text-cyan-400">&rarr;</span>
                      </td>
                      <td className="text-slate-600 dark:text-slate-400">{o.process}</td>
                      <td className="font-bold text-slate-900 dark:text-white">{o.output.toLocaleString('id-ID')}</td>
                      <td className="text-emerald-600 dark:text-emerald-400 font-semibold">{o.good.toLocaleString('id-ID')}</td>
                      <td className="text-rose-600 dark:text-rose-400 font-semibold">{o.reject.toLocaleString('id-ID')}</td>
                      <td className="text-amber-600 dark:text-amber-400">{o.replace.toLocaleString('id-ID')}</td>
                      <td>
                        <span className={`badge ${o.lossRate > 1.0 ? 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40' : 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40'} font-bold`}>
                          {o.lossRate.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredData.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-slate-500 dark:text-slate-400">
                        Tidak ada data ditemukan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: EVALUASI & SCORECARD KPI PERSONAL */}
      {/* ========================================================================= */}
      {activeTab === 'personal_kpi' && (
        <div className="space-y-5 anim-in">
          {/* Profile Card Header */}
          <div className="card p-5 sm:p-6 bg-gradient-to-r from-indigo-950 via-purple-950/80 to-slate-900 border border-cyan-500/30 flex flex-wrap items-center justify-between gap-4 text-white">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 border border-cyan-400/40 flex items-center justify-center text-white font-black text-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] shrink-0">
                {currentUsername.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="badge bg-cyan-500/20 text-cyan-300 border-cyan-400/40 font-bold">
                    OPERATOR SCORECARD
                  </span>
                  <span className="text-xs text-slate-300">Periode: {fmtPeriodRange(period?.from, period?.to)}</span>
                </div>
                <h2 className="font-display font-black text-xl sm:text-2xl text-white mt-1 capitalize tracking-wide">
                  {currentUsername}
                </h2>
                <p className="text-xs text-slate-300">
                  Ringkasan produktivitas personal &amp; kontrol kualitas Anda di Prepress
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider font-semibold">
                Personal Performance Index
              </span>
              <div className="text-2xl sm:text-3xl font-black text-cyan-300">
                {userStats.score} <span className="text-xs text-slate-400 font-normal">/ 100</span>
              </div>
            </div>
          </div>

          {/* 4 Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Total Good Output" value={userStats.good.toLocaleString('id-ID')} icon={CheckCircle2} color="emerald" />
            <StatCard label="Total Reject" value={userStats.reject.toLocaleString('id-ID')} icon={AlertTriangle} color="rose" />
            <StatCard label="Personal Loss Rate" value={`${userStats.lossRate.toFixed(1)}%`} sub="Target: ≤ 1.0%" icon={Award} color="cyan" />
            <StatCard label="Total Transaksi" value={userStats.totalJob.toLocaleString('id-ID')} icon={UserCheck} color="purple" />
          </div>

          {/* Riwayat Pekerjaan Terakhir */}
          <div className="card p-5 space-y-3">
            <h3 className="card-title flex items-center gap-2 text-slate-900 dark:text-white">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-cyan-400" /> Riwayat Kontribusi Pekerjaan Anda
            </h3>
            <div className="table-responsive max-h-80">
              <table className="tbl min-w-[450px]">
                <thead>
                  <tr>
                    <th>Lini</th>
                    <th>JOP / Pekerjaan</th>
                    <th>Good</th>
                    <th>Reject</th>
                    <th>Replace</th>
                  </tr>
                </thead>
                <tbody>
                  {userStats.records.map((r, i) => (
                    <tr key={i} className="cursor-pointer">
                      <td className="text-blue-600 dark:text-cyan-300 font-semibold">{r.process}</td>
                      <td className="text-slate-900 dark:text-slate-100 font-medium">{r.job || '-'}</td>
                      <td className="text-emerald-600 dark:text-emerald-400 font-semibold">{r.good}</td>
                      <td className="text-rose-600 dark:text-rose-400 font-semibold">{r.reject}</td>
                      <td className="text-amber-600 dark:text-amber-400">{r.replace || 0}</td>
                    </tr>
                  ))}
                  {userStats.records.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-500 dark:text-slate-400">
                        Tidak ada riwayat pekerjaan tercatat pada periode ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: KPI LEADERBOARD & STAR RANKING */}
      {/* ========================================================================= */}
      {activeTab === 'star_podium' && (
        <div className="space-y-6 anim-in">
          {/* Header Panel */}
          <div className="card p-5 sm:p-6 bg-gradient-to-r from-purple-950/80 via-indigo-950 to-slate-900 text-white border border-purple-500/30 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="badge bg-purple-500/20 text-purple-300 border-purple-400/40 font-bold">
                  STAR RANKING
                </span>
                <span className="text-xs text-slate-300">Periode: {fmtPeriodRange(period?.from, period?.to)}</span>
              </div>
              <h2 className="font-display font-black text-xl sm:text-2xl text-white mt-1.5 tracking-wide">
                Prepress KPI Star Leaderboard
              </h2>
              <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
                Peringkat performa operator berdasarkan efisiensi output, konsistensi mutu, dan rasio reject terendah
              </p>
            </div>
          </div>

          {/* Podium Top 3 */}
          {topThree.length > 0 && (
            <div className="grid md:grid-cols-3 gap-4">
              {topThree.map((item, idx) => {
                const podiumStyles = [
                  'border-amber-400/60 bg-amber-50/50 dark:bg-gradient-to-b dark:from-amber-950/50 dark:via-slate-900 dark:to-slate-900 shadow-sm dark:shadow-[0_0_30px_rgba(245,158,11,0.25)] order-1 md:order-2 md:-translate-y-2',
                  'border-slate-300 dark:border-slate-400/60 bg-slate-50/50 dark:bg-gradient-to-b dark:from-slate-800/50 dark:via-slate-900 dark:to-slate-900 shadow-sm dark:shadow-[0_0_25px_rgba(148,163,184,0.2)] order-2 md:order-1',
                  'border-amber-600/40 dark:border-amber-700/60 bg-orange-50/50 dark:bg-gradient-to-b dark:from-amber-950/30 dark:via-slate-900 dark:to-slate-900 shadow-sm dark:shadow-[0_0_25px_rgba(180,83,9,0.2)] order-3'
                ];
                const badges = ['Champion #1', 'Runner Up #2', 'Third Place #3'];

                return (
                  <div
                    key={item.name}
                    className={`card p-5 ${podiumStyles[idx]} relative flex flex-col items-center text-center`}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 flex items-center justify-center mb-2 shadow-sm">
                      {idx === 0 ? <Crown className="w-6 h-6 text-amber-500" /> : <Medal className="w-6 h-6 text-blue-600 dark:text-cyan-400" />}
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 dark:text-slate-400 font-bold">
                      {badges[idx]}
                    </span>
                    <h3 className="font-display font-black text-lg text-slate-900 dark:text-white mt-0.5 truncate max-w-full">
                      {item.name}
                    </h3>
                    <div className="text-3xl font-black text-blue-600 dark:text-cyan-300 mt-2 tracking-tight">
                      {item.score} <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">pts</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 w-full mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold">Good Output</span>
                        <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{item.good.toLocaleString('id-ID')}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold">Loss Rate</span>
                        <p className={`font-bold mt-0.5 ${item.lossRate > 1.0 ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-cyan-300'}`}>{item.lossRate.toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full Leaderboard Table */}
          <div className="card p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="card-title flex items-center gap-2 text-slate-900 dark:text-white">
                <Flame className="w-4 h-4 text-amber-500" /> Seluruh Peringkat Operator
              </h3>
              <div className="relative w-full sm:w-auto">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari Operator..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="inp !pl-9 text-xs w-full sm:w-56"
                />
              </div>
            </div>

            <div className="table-responsive">
              <table className="tbl min-w-[550px]">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Operator</th>
                    <th>Good</th>
                    <th>Reject</th>
                    <th>Loss Rate</th>
                    <th className="text-right">Skor Total</th>
                  </tr>
                </thead>
                <tbody>
                  {starRankings
                    .filter((r) => r.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((item, idx) => (
                      <tr key={item.name} className="cursor-pointer" onClick={() => onOpenList?.(`Rekap: ${item.name}`, 'rec_ctcp', item.rowList)}>
                        <td className="font-mono font-bold text-slate-500 dark:text-slate-400">#{idx + 1}</td>
                        <td className="font-semibold text-slate-900 dark:text-white">{item.name}</td>
                        <td className="text-emerald-600 dark:text-emerald-400 font-semibold">{item.good.toLocaleString('id-ID')}</td>
                        <td className="text-rose-600 dark:text-rose-400 font-semibold">{item.reject.toLocaleString('id-ID')}</td>
                        <td>
                          <span className={`badge ${item.lossRate > 1.0 ? 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40' : 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40'} font-bold`}>
                            {item.lossRate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="text-right font-black text-blue-600 dark:text-cyan-300 text-sm">{item.score}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
