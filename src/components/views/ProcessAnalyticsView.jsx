import React, { useMemo, useState } from 'react';
import { SHEETS, PROD_KEYS } from '../../constants/schema';
import {
  parseDateVal,
  num,
  cell,
  getJobCategoryByNo,
  JOB_CATEGORY_MAP,
  fmtPeriodRange,
  startOfDay,
  iso,
  hexA,
  getChartTheme,
  formatYMD,
  getRowQtyGood,
  getRowQtyDefect,
  getRowQtyReplace
} from '../../utils/formatters';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import {
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Layers,
  Percent,
  Award,
  Search,
  Users,
  Briefcase,
  GitCompare,
  Cpu,
  Tag,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import CountUp from '../common/CountUp';
import DatePickerInput from '../ui/DatePickerInput';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

export default function ProcessAnalyticsView({
  tabKey = 'rec_ctcp',
  onTabChange,
  data = {},
  period,
  onOpenList,
  onOpenMetric,
  onOpenDayModal,
  onGoToData,
  onSelectRow: _onSelectRow
}) {
  // Sub-View Tabs: 'overview' | 'category_machine' | 'comparison'
  const [subView, setSubView] = useState('overview');

  const activeKey = tabKey || 'rec_ctcp';
  const cfg = SHEETS[activeKey] || SHEETS.rec_ctcp;
  const rawRows = data[activeKey] || [];

  // Filter Baris berdasarkan rentang tanggal aktif
  const rows = useMemo(() => {
    const fromStr = period?.from ? formatYMD(period.from) : '';
    const toStr = period?.to ? formatYMD(period.to) : '';

    const res = (rawRows || []).filter((r) => {
      if (!r) return false;
      const idVal = cell(r, cfg?.i?.id, '').trim();
      const jopVal = cell(r, cfg?.i?.jop, '').trim();
      const noJopVal = cell(r, cfg?.i?.nojop, '').trim();
      if (!idVal || idVal === '-' || (!jopVal && !noJopVal) || (jopVal === '-' && noJopVal === '-')) return false;

      if (fromStr && toStr) {
        const itemDate = formatYMD(cell(r, cfg?.i?.date, ''));
        if (itemDate && (itemDate < fromStr || itemDate > toStr)) return false;
      }
      return true;
    });

    console.log("Active Filter:", {
      startDate: fromStr,
      endDate: toStr,
      activeLini: cfg?.label || activeKey,
      rawCount: (rawRows || []).length,
      filteredCount: res.length
    });

    return res;
  }, [rawRows, cfg, period, activeKey]);

  // ==========================================
  // TAB 1: METRIK OVERVIEW PRODUKSI
  // ==========================================
  const overviewMetrics = useMemo(() => {
    let baik = 0, rusak = 0, ganti = 0;
    (rows || []).forEach((r) => {
      if (!r) return;
      baik += getRowQtyGood(r, cfg);
      rusak += getRowQtyDefect(r, cfg);
      ganti += getRowQtyReplace(r, cfg);
    });
    const pakai = baik + rusak;
    const pct = pakai > 0 ? (rusak / pakai) * 100 : 0;
    return { baik, rusak, ganti, pakai, pct };
  }, [rows, cfg]);

  // Data Tren Harian
  const dailyTrend = useMemo(() => {
    const map = new Map();
    (rows || []).forEach((r) => {
      if (!r) return;
      const d = parseDateVal(cell(r, cfg?.i?.date, ''));
      if (!d) return;
      const k = startOfDay(d).getTime();
      const e = map.get(k) || { baik: 0, rusak: 0 };
      e.baik += getRowQtyGood(r, cfg);
      e.rusak += getRowQtyDefect(r, cfg);
      map.set(k, e);
    });
    const keys = [...map.keys()].sort((a, b) => a - b);
    return {
      keys,
      labels: keys.map((k) => {
        const d = new Date(k);
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
      }),
      baik: keys.map((k) => map.get(k).baik),
      rusak: keys.map((k) => map.get(k).rusak)
    };
  }, [rows, cfg]);

  // Perhitungan Regresi Linear Garis Tren (Trendline: y = mx + c)
  const trendlineAnalysis = useMemo(() => {
    const n = dailyTrend.keys.length;
    const totals = dailyTrend.keys.map((_, i) => (dailyTrend.baik[i] || 0) + (dailyTrend.rusak[i] || 0));

    if (n === 0) {
      return { trend: [], direction: 'equal', slope: 0, totals: [] };
    }
    if (n === 1) {
      return { trend: totals, direction: 'equal', slope: 0, totals };
    }

    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    for (let i = 0; i < n; i++) {
      const x = i;
      const y = totals[i];
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
    }

    const denominator = n * sumXX - sumX * sumX;
    const slope = denominator !== 0 ? (n * sumXY - sumX * sumY) / denominator : 0;
    const intercept = (sumY - slope * sumX) / n;

    const trend = totals.map((_, i) => {
      const val = slope * i + intercept;
      return Math.max(0, Math.round(val * 10) / 10);
    });

    const direction = slope > 0.05 ? 'up' : slope < -0.05 ? 'down' : 'equal';
    return { trend, direction, slope, totals };
  }, [dailyTrend]);

  // ==========================================
  // TAB 2: ANALITIK KATEGORI & MESIN
  // ==========================================
  const kpiAnalytics = useMemo(() => {
    let good = 0, reject = 0, replace = 0;
    (rows || []).forEach((r) => {
      if (!r) return;
      good += getRowQtyGood(r, cfg);
      reject += getRowQtyDefect(r, cfg);
      replace += getRowQtyReplace(r, cfg);
    });
    const output = good + reject;
    const lossRate = output > 0 ? (reject / output) * 100 : 0;
    const perfScore = Math.max(0, 100 - lossRate * 5);
    return { good, reject, replace, output, lossRate, perfScore };
  }, [rows, cfg]);

  // 1. Breakdown Mesin & Alat
  const machineBreakdown = useMemo(() => {
    let machineCol = -1;
    let label = 'Mesin Produksi';

    if (activeKey === 'rec_ctcp') {
      machineCol = cfg.i?.expose_mach ?? 5;
      label = 'Mesin Expose CTCP';
    } else if (activeKey === 'rec_ctp') {
      machineCol = cfg.i?.expose_mach ?? 5;
      label = 'Mesin Expose CTP';
    } else if (activeKey === 'rec_screen') {
      machineCol = cfg.i?.screen_type ?? 4;
      label = 'Tipe / Unit Screen';
    } else if (activeKey === 'rec_flexo') {
      machineCol = cfg.i?.print_mach ?? 12;
      label = 'Mesin Cetak Flexo';
    } else if (activeKey === 'rec_etching') {
      machineCol = cfg.i?.plate_type ?? 4;
      label = 'Tipe Plat Etching';
    }

    const map = new Map();
    let totalAllOutput = 0;

    (rows || []).forEach((r) => {
      if (!r) return;
      let m = (machineCol !== -1 && cell(r, machineCol, '').trim()) || '';
      if (!m || m === '-' || m.toUpperCase() === 'NULL') m = 'Standard / Unassigned';

      const e = map.get(m) || { name: m, good: 0, reject: 0, replace: 0, count: 0, rowList: [] };
      const g = getRowQtyGood(r, cfg);
      const rj = getRowQtyDefect(r, cfg);
      const rp = getRowQtyReplace(r, cfg);

      e.good += g;
      e.reject += rj;
      e.replace += rp;
      e.count += 1;
      e.rowList.push(r);
      totalAllOutput += (g + rj);
      map.set(m, e);
    });

    const list = [...map.values()]
      .map((item) => {
        const output = item.good + item.reject;
        const lossRate = output > 0 ? (item.reject / output) * 100 : 0;
        const share = totalAllOutput > 0 ? (output / totalAllOutput) * 100 : 0;
        return { ...item, output, lossRate, share };
      })
      .sort((a, b) => b.output - a.output);

    return {
      label,
      machineCol,
      list,
      labels: list.map((x) => x.name),
      good: list.map((x) => x.good),
      reject: list.map((x) => x.reject),
      output: list.map((x) => x.output),
      share: list.map((x) => x.share)
    };
  }, [rows, activeKey, cfg]);

  // 2. Evaluasi Kategori Job Berdasarkan Karakter Pertama Kolom job_no (0-9)
  const jobCategoryEvaluation = useMemo(() => {
    const jobNoCol = cfg.i?.nojop ?? cfg.i?.job_no ?? 2;
    const map = new Map();
    let totalVolume = 0;
    let totalOutputAll = 0;

    Object.values(JOB_CATEGORY_MAP).concat(['Uncategorized']).forEach((cat) => {
      map.set(cat, {
        category: cat,
        volume: 0,
        good: 0,
        reject: 0,
        replace: 0,
        rowList: []
      });
    });

    (rows || []).forEach((r) => {
      if (!r) return;
      const jNo = cell(r, jobNoCol, '');
      const cat = getJobCategoryByNo(jNo);
      const e = map.get(cat) || {
        category: cat,
        volume: 0,
        good: 0,
        reject: 0,
        replace: 0,
        rowList: []
      };

      const g = getRowQtyGood(r, cfg);
      const rj = getRowQtyDefect(r, cfg);
      const rp = getRowQtyReplace(r, cfg);

      e.volume += 1;
      e.good += g;
      e.reject += rj;
      e.replace += rp;
      e.rowList.push(r);
      totalVolume += 1;
      totalOutputAll += (g + rj);
      map.set(cat, e);
    });

    const list = [...map.values()]
      .filter((c) => c.volume > 0 || c.good > 0 || c.reject > 0)
      .map((item) => {
        const output = item.good + item.reject;
        const lossRate = output > 0 ? (item.reject / output) * 100 : 0;
        const volumeShare = totalVolume > 0 ? (item.volume / totalVolume) * 100 : 0;
        return { ...item, output, lossRate, volumeShare };
      })
      .sort((a, b) => b.volume - a.volume);

    return {
      list,
      labels: list.map((x) => x.category),
      volume: list.map((x) => x.volume),
      output: list.map((x) => x.output),
      good: list.map((x) => x.good),
      reject: list.map((x) => x.reject),
      lossRate: list.map((x) => x.lossRate),
      totalVolume,
      totalOutputAll
    };
  }, [rows, cfg]);

  // 3. Agregasi Shift & Leaderboard
  const [activeLeaderboardTab, setActiveLeaderboardTab] = useState('OP');
  const [searchQuery, setSearchQuery] = useState('');

  const shiftData = useMemo(() => {
    const map = new Map();
    (rows || []).forEach((r) => {
      if (!r) return;
      let sh = cell(r, cfg?.i?.shift, '').toUpperCase().trim();
      if (!sh || sh === '-' || sh === 'UNDEFINED') sh = 'NON-SHIFT';
      const e = map.get(sh) || { good: 0, reject: 0 };
      e.good += getRowQtyGood(r, cfg);
      e.reject += getRowQtyDefect(r, cfg);
      map.set(sh, e);
    });

    const labels = [...map.keys()].sort();
    return {
      labels,
      good: labels.map((l) => map.get(l).good),
      reject: labels.map((l) => map.get(l).reject)
    };
  }, [rows, cfg]);

  const opRanking = useMemo(() => {
    const map = new Map();
    (rows || []).forEach((r) => {
      if (!r) return;
      const op = cell(r, cfg?.i?.op, '').trim() || 'Unassigned';
      const e = map.get(op) || { name: op, good: 0, reject: 0, replace: 0, rowList: [] };
      e.good += getRowQtyGood(r, cfg);
      e.reject += getRowQtyDefect(r, cfg);
      e.replace += getRowQtyReplace(r, cfg);
      e.rowList.push(r);
      map.set(op, e);
    });

    return [...map.values()]
      .map((o) => {
        const output = o.good + o.reject;
        const lossRate = output > 0 ? (o.reject / output) * 100 : 0;
        return { ...o, output, lossRate };
      })
      .sort((a, b) => b.output - a.output);
  }, [rows, cfg]);

  const poRanking = useMemo(() => {
    const map = new Map();
    const poCol = cfg.i?.po_helper ?? -1;

    (rows || []).forEach((r) => {
      if (!r) return;
      const po = (poCol !== -1 && cell(r, poCol, '').trim()) || 'Tanpa PO';
      const e = map.get(po) || { name: po, good: 0, reject: 0, replace: 0, rowList: [] };
      e.good += getRowQtyGood(r, cfg);
      e.reject += getRowQtyDefect(r, cfg);
      e.replace += getRowQtyReplace(r, cfg);
      e.rowList.push(r);
      map.set(po, e);
    });

    return [...map.values()]
      .map((o) => {
        const output = o.good + o.reject;
        const lossRate = output > 0 ? (o.reject / output) * 100 : 0;
        return { ...o, output, lossRate };
      })
      .sort((a, b) => b.output - a.output);
  }, [rows, cfg]);

  const activeLeaderboardData = activeLeaderboardTab === 'OP' ? opRanking : poRanking;

  const filteredLeaderboard = useMemo(() => {
    if (!searchQuery.trim()) return activeLeaderboardData;
    const q = searchQuery.toLowerCase();
    return activeLeaderboardData.filter((o) => o.name.toLowerCase().includes(q));
  }, [activeLeaderboardData, searchQuery]);

  // ==========================================
  // TAB 3: KOMPARASI PERIODE
  // ==========================================
  const defaultPeriods = () => {
    const today = new Date();
    const p2To = today;
    const p2From = new Date(today.getFullYear(), today.getMonth(), 1);
    const p1To = new Date(today.getFullYear(), today.getMonth(), 0);
    const p1From = new Date(p1To.getFullYear(), p1To.getMonth(), 1);
    return { p1: { from: formatYMD(p1From), to: formatYMD(p1To) }, p2: { from: formatYMD(p2From), to: formatYMD(p2To) } };
  };

  const [comparePeriods, setComparePeriods] = useState(defaultPeriods);

  const getCompareMetrics = (fromStr, toStr) => {
    const fStr = formatYMD(fromStr);
    const tStr = formatYMD(toStr);
    const compRows = (data[activeKey] || []).filter((r) => {
      if (!r) return false;
      const idVal = cell(r, cfg?.i?.id, '').trim();
      if (!idVal || idVal === '-') return false;
      if (fStr && tStr) {
        const itemDate = formatYMD(cell(r, cfg?.i?.date, ''));
        if (itemDate && (itemDate < fStr || itemDate > tStr)) return false;
      }
      return true;
    });

    let baik = 0, rusak = 0, ganti = 0;
    compRows.forEach((r) => {
      if (!r) return;
      baik += getRowQtyGood(r, cfg);
      rusak += getRowQtyDefect(r, cfg);
      ganti += getRowQtyReplace(r, cfg);
    });
    return { pakai: baik + rusak, rusak, ganti, rows: compRows };
  };

  const m1 = useMemo(() => getCompareMetrics(comparePeriods.p1.from, comparePeriods.p1.to), [data, activeKey, comparePeriods.p1]);
  const m2 = useMemo(() => getCompareMetrics(comparePeriods.p2.from, comparePeriods.p2.to), [data, activeKey, comparePeriods.p2]);

  const delta = (a, b) => {
    if (b === 0 && a === 0) return { pct: 0, dir: 'equal' };
    if (b === 0) return { pct: 100, dir: 'up' };
    const p = ((a - b) / b) * 100;
    return { pct: p, dir: p > 0.01 ? 'up' : p < -0.01 ? 'down' : 'equal' };
  };

  const dHasil = delta(m2.pakai, m1.pakai);
  const dRusak = delta(m2.rusak, m1.rusak);
  const dGanti = delta(m2.ganti, m1.ganti);

  const renderStatus = (d, metricType) => {
    const isHigherBetter = metricType === 'higher_is_better';
    const isZero = d.dir === 'equal' || Math.abs(d.pct) < 0.01;
    const sign = d.pct > 0 ? '+' : '';
    const pctStr = `${sign}${d.pct.toFixed(1)}%`;

    if (isZero) {
      return {
        badge: (
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 inline-flex items-center gap-1 shadow-sm">
            &mdash; 0.0% (STABIL)
          </span>
        ),
        deltaColor: 'text-slate-500 dark:text-slate-400',
        deltaText: '0.0%'
      };
    }

    if (isHigherBetter) {
      if (d.dir === 'up') {
        return {
          badge: (
            <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30 inline-flex items-center gap-1 shadow-sm">
              &uarr; {pctStr} (NAIK)
            </span>
          ),
          deltaColor: 'text-emerald-600 dark:text-emerald-400',
          deltaText: pctStr
        };
      }
      return {
        badge: (
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30 inline-flex items-center gap-1 shadow-sm">
            &darr; {pctStr} (TURUN)
          </span>
        ),
        deltaColor: 'text-rose-600 dark:text-rose-400',
        deltaText: pctStr
      };
    }

    // Lower is better (defect, ganti)
    if (d.dir === 'down') {
      return {
        badge: (
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30 inline-flex items-center gap-1 shadow-sm">
            &darr; {pctStr} (MEMBAIK)
          </span>
        ),
        deltaColor: 'text-emerald-600 dark:text-emerald-400',
        deltaText: pctStr
      };
    }
    return {
      badge: (
        <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30 inline-flex items-center gap-1 shadow-sm">
          &uarr; {pctStr} (MEMBURUK)
        </span>
      ),
      deltaColor: 'text-rose-600 dark:text-rose-400',
      deltaText: pctStr
    };
  };

  const statusHasil = renderStatus(dHasil, 'higher_is_better');
  const statusRusak = renderStatus(dRusak, 'lower_is_better');
  const statusGanti = renderStatus(dGanti, 'lower_is_better');

  return (
    <div className="space-y-5 anim-in">
      {/* Sub-View Navigation Tabs */}
      <div className="card p-2 sm:p-3 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5 shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-100 dark:bg-[#090d16] rounded-2xl border border-slate-200 dark:border-slate-800 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setSubView('overview')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              subView === 'overview'
                ? 'bg-blue-600 text-white shadow-sm dark:bg-gradient-to-r dark:from-cyan-500 dark:to-blue-600'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Overview Produksi</span>
          </button>
          <button
            type="button"
            onClick={() => setSubView('category_machine')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              subView === 'category_machine'
                ? 'bg-blue-600 text-white shadow-sm dark:bg-gradient-to-r dark:from-cyan-500 dark:to-blue-600'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Analitik Kategori &amp; Mesin</span>
          </button>
          <button
            type="button"
            onClick={() => setSubView('comparison')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              subView === 'comparison'
                ? 'bg-blue-600 text-white shadow-sm dark:bg-gradient-to-r dark:from-cyan-500 dark:to-blue-600'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <GitCompare className="w-4 h-4" />
            <span>Komparasi Periode</span>
          </button>
        </div>

        {/* Division Selector */}
        <div className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-100 dark:bg-[#090d16] rounded-2xl border border-slate-200 dark:border-slate-800 w-full sm:w-auto">
          {PROD_KEYS.map((k) => {
            const itemCfg = SHEETS[k];
            const isActive = activeKey === k;
            return (
              <button
                key={k}
                type="button"
                onClick={() => onTabChange?.(k)}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm dark:bg-gradient-to-r dark:from-indigo-500 dark:to-cyan-500'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                }`}
              >
                {itemCfg.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-VIEW 1: OVERVIEW PRODUKSI */}
      {/* ========================================================================= */}
      {subView === 'overview' && (
        <div className="space-y-5 anim-in">
          {/* Header Banner */}
          <div className="card p-5 bg-gradient-to-r from-slate-900 via-sky-950/80 to-slate-900 text-white flex flex-wrap items-center justify-between gap-4 border border-cyan-500/30">
            <div>
              <div className="flex items-center gap-2">
                <span className="badge bg-cyan-500/20 text-cyan-300 border-cyan-400/40 font-bold">
                  OVERVIEW PRODUKSI {cfg.label.toUpperCase()}
                </span>
                <span className="text-xs text-slate-300">&bull; Live Monitoring Output</span>
              </div>
              <h2 className="font-display font-black text-xl sm:text-2xl mt-1 text-white tracking-wide">
                Rekapitulasi Produksi {cfg.label}
              </h2>
              <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
                Pantau output plate/screen baik, jumlah defect rusak, reprint/ganti, dan rasio kualitas harian.
              </p>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider font-semibold">Rentang Aktif</div>
              <div className="font-bold text-sm text-cyan-300 mt-0.5">{fmtPeriodRange(period?.from, period?.to)}</div>
              <div className="text-xs text-slate-400 mt-0.5">{rows.length.toLocaleString('id-ID')} Transaksi</div>
            </div>
          </div>

          {/* KPI Stat Cards (5 Kartu) */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
            <button
              type="button"
              onClick={() => onOpenMetric?.(activeKey, 'baik', rows)}
              className="card p-4 sm:p-5 text-left cursor-pointer hover:scale-[1.02] flex flex-col justify-between border-l-4 border-l-emerald-500"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {cfg.cards?.baik || 'Qty Good'}
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="mt-2 font-display font-black text-2xl sm:text-3xl text-emerald-400 tracking-tight">
                <CountUp target={overviewMetrics.baik} />
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">{cfg.unit} lolos QC &bull; Klik detail</div>
            </button>

            <button
              type="button"
              onClick={() => onOpenMetric?.(activeKey, 'rusak', rows)}
              className="card p-4 sm:p-5 text-left cursor-pointer hover:scale-[1.02] flex flex-col justify-between border-l-4 border-l-rose-500"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {cfg.cards?.rusak || 'Qty Defect'}
                </span>
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              </div>
              <div className="mt-2 font-display font-black text-2xl sm:text-3xl text-rose-400 tracking-tight">
                <CountUp target={overviewMetrics.rusak} />
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">{cfg.unit} afval &bull; Klik detail</div>
            </button>

            <button
              type="button"
              onClick={() => onOpenMetric?.(activeKey, 'ganti', rows)}
              className="card p-4 sm:p-5 text-left cursor-pointer hover:scale-[1.02] flex flex-col justify-between border-l-4 border-l-amber-500"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {cfg.cards?.ganti || 'Qty Replace'}
                </span>
                <RotateCcw className="w-4 h-4 text-amber-400" />
              </div>
              <div className="mt-2 font-display font-black text-2xl sm:text-3xl text-amber-400 tracking-tight">
                <CountUp target={overviewMetrics.ganti} />
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">{cfg.unit} ganti &bull; Klik detail</div>
            </button>

            <button
              type="button"
              onClick={() => onOpenMetric?.(activeKey, 'pakai', rows)}
              className="card p-4 sm:p-5 text-left cursor-pointer hover:scale-[1.02] flex flex-col justify-between border-l-4 border-l-cyan-500"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {cfg.cards?.pakai || 'Total Pakai'}
                </span>
                <Layers className="w-4 h-4 text-cyan-300" />
              </div>
              <div className="mt-2 font-display font-black text-2xl sm:text-3xl text-blue-600 dark:text-cyan-300 tracking-tight">
                <CountUp target={overviewMetrics.pakai} />
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Total {cfg.unit} &bull; Klik detail</div>
            </button>

            <button
              type="button"
              onClick={() => onOpenMetric?.(activeKey, 'pct', rows)}
              className="card p-4 sm:p-5 text-left cursor-pointer hover:scale-[1.02] flex flex-col justify-between border-l-4 border-l-purple-500"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Defect Rate
                </span>
                <Percent className="w-4 h-4 text-purple-400" />
              </div>
              <div className={`mt-2 font-display font-black text-2xl sm:text-3xl tracking-tight ${overviewMetrics.pct > 1.0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                <CountUp target={overviewMetrics.pct} isPct={true} />
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Target &le; 1.0% &bull; Klik audit</div>
            </button>
          </div>

          {/* LINE CHART: Tren Harian Output + Garis Tren Linear (Trendline) */}
          <div className="card p-5">
            <div className="flex justify-between items-center flex-wrap gap-3 mb-4">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="card-title text-slate-900 dark:text-white">
                  Grafik Garis Tren Harian Output {cfg.label}
                </h3>
                {/* Badge Arah Tren Linear */}
                {trendlineAnalysis.direction === 'up' && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40 inline-flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" /> Tren: NAIK
                  </span>
                )}
                {trendlineAnalysis.direction === 'down' && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40 inline-flex items-center gap-1">
                    <TrendingDown className="w-3.5 h-3.5" /> Tren: TURUN
                  </span>
                )}
                {trendlineAnalysis.direction === 'equal' && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 inline-flex items-center gap-1">
                    <Minus className="w-3.5 h-3.5" /> Tren: STABIL
                  </span>
                )}
              </div>

              {onGoToData && (
                <button
                  type="button"
                  onClick={() => onGoToData(activeKey)}
                  className="btn-primary text-xs py-1.5 px-3.5 rounded-xl shadow-sm flex items-center gap-1.5"
                >
                  <span>Buka Tabel Data</span>
                  <span>&rarr;</span>
                </button>
              )}
            </div>

            <div className="h-72 sm:h-80">
              {(() => {
                const ct = getChartTheme();
                const isLight = ct.isLight;

                const lineChartData = {
                  labels: dailyTrend.labels,
                  datasets: [
                    {
                      label: `Total Output (${cfg.unit})`,
                      data: trendlineAnalysis.totals,
                      borderColor: '#0284c7',
                      backgroundColor: isLight ? 'rgba(2, 132, 199, 0.12)' : 'rgba(6, 182, 212, 0.18)',
                      fill: true,
                      tension: 0.35,
                      pointRadius: 4,
                      pointHoverRadius: 6,
                      pointBackgroundColor: '#0284c7',
                      borderWidth: 2.5
                    },
                    {
                      label: `Good (${cfg.unit})`,
                      data: dailyTrend.baik,
                      borderColor: '#10b981',
                      backgroundColor: 'transparent',
                      borderDash: [3, 3],
                      tension: 0.35,
                      pointRadius: 3,
                      borderWidth: 2
                    },
                    {
                      label: `Defect / Rusak (${cfg.unit})`,
                      data: dailyTrend.rusak,
                      borderColor: '#f43f5e',
                      backgroundColor: 'transparent',
                      borderDash: [2, 2],
                      tension: 0.35,
                      pointRadius: 3,
                      borderWidth: 1.5
                    },
                    {
                      label: `Garis Tren (Trendline: ${trendlineAnalysis.direction === 'up' ? 'Naik ↑' : trendlineAnalysis.direction === 'down' ? 'Turun ↓' : 'Stabil ↔'})`,
                      data: trendlineAnalysis.trend,
                      borderColor: '#f59e0b',
                      backgroundColor: 'transparent',
                      borderWidth: 2.5,
                      borderDash: [6, 4],
                      pointRadius: 0,
                      fill: false,
                      tension: 0
                    }
                  ]
                };

                return (
                  <Line
                    data={lineChartData}
                    options={{
                      maintainAspectRatio: false,
                      interaction: {
                        mode: 'index',
                        intersect: false
                      },
                      scales: {
                        x: {
                          ticks: { color: ct.tickColor, maxRotation: 45, minRotation: 20 },
                          grid: { color: ct.gridColor }
                        },
                        y: {
                          beginAtZero: true,
                          ticks: { color: ct.tickColor },
                          grid: { color: ct.gridColor }
                        }
                      },
                      plugins: {
                        legend: {
                          labels: {
                            color: ct.legendColor,
                            font: { size: 11, weight: 'bold' }
                          }
                        },
                        tooltip: {
                          backgroundColor: '#0f172a',
                          titleColor: '#ffffff',
                          bodyColor: '#f8fafc',
                          padding: 10,
                          cornerRadius: 8
                        }
                      },
                      onClick: (e, els) => {
                        if (!els || !Array.isArray(els) || !els.length || !els[0] || !onOpenDayModal) return;
                        onOpenDayModal(activeKey, dailyTrend.keys[els[0].index]);
                      }
                    }}
                  />
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 2: ANALITIK KATEGORI & MESIN */}
      {/* ========================================================================= */}
      {subView === 'category_machine' && (
        <div className="space-y-6 anim-in">
          {/* Header Banner */}
          <div className="card p-5 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 text-white flex flex-wrap items-center justify-between gap-4 border border-cyan-500/30">
            <div>
              <div className="flex items-center gap-2">
                <span className="badge bg-cyan-500/20 text-cyan-300 border-cyan-400/40 font-bold">
                  ANALITIK MENDALAM
                </span>
                <span className="text-xs text-slate-300">&bull; Mesin &amp; Kategori JOP 0–9</span>
              </div>
              <h2 className="font-display font-black text-xl sm:text-2xl mt-1 text-white tracking-wide">
                Evaluasi Mesin &amp; Klasifikasi Kategori JOP
              </h2>
              <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
                Breakdown performa utilisasi mesin/alat, evaluasi mutu berdasarkan digit pertama JOP (0: Sticker, 1: School, 2: Office, dst), serta performa shift.
              </p>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider font-semibold">Total Output Analisis</div>
              <div className="font-bold text-lg text-cyan-300 mt-0.5">{kpiAnalytics.output.toLocaleString('id-ID')} {cfg.unit}</div>
              <div className="text-xs text-slate-400">Score Indeks: {kpiAnalytics.perfScore.toFixed(0)} / 100</div>
            </div>
          </div>

          {/* 6 Metric Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            <div className="card p-4 border-l-4 border-l-blue-600">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">TOTAL OUTPUT</span>
                <Layers className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="mt-2 font-display font-black text-2xl text-slate-900 dark:text-white">
                {kpiAnalytics.output.toLocaleString('id-ID')}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">{cfg.unit} diproses</div>
            </div>

            <div className="card p-4 border-l-4 border-l-emerald-500">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">GOOD</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="mt-2 font-display font-black text-2xl text-emerald-400">
                {kpiAnalytics.good.toLocaleString('id-ID')}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">{cfg.unit} lolos QC</div>
            </div>

            <div className="card p-4 border-l-4 border-l-rose-500">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">REJECT</span>
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              </div>
              <div className="mt-2 font-display font-black text-2xl text-rose-400">
                {kpiAnalytics.reject.toLocaleString('id-ID')}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">{cfg.unit} rusak / loss</div>
            </div>

            <div className="card p-4 border-l-4 border-l-amber-500">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">REPLACE</span>
                <RotateCcw className="w-4 h-4 text-amber-400" />
              </div>
              <div className="mt-2 font-display font-black text-2xl text-amber-400">
                {kpiAnalytics.replace.toLocaleString('id-ID')}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">{cfg.unit} ganti plate</div>
            </div>

            <div className="card p-4 border-l-4 border-l-purple-500">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">LOSS RATE</span>
                <Percent className="w-4 h-4 text-purple-400" />
              </div>
              <div className={`mt-2 font-display font-black text-2xl ${kpiAnalytics.lossRate > 1.0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {kpiAnalytics.lossRate.toFixed(1)}%
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Target: &le; 1.0%</div>
            </div>

            <div className="card p-4 border-l-4 border-l-cyan-500">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">INDEX SCORE</span>
                <Award className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="mt-2 font-display font-black text-2xl text-cyan-300">
                {kpiAnalytics.perfScore.toFixed(0)}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Skor Kinerja (0-100)</div>
            </div>
          </div>

          {/* SECTION 1: BREAKDOWN MESIN & UTILISASI */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-cyan-500/10 border border-blue-200 dark:border-cyan-400/30 flex items-center justify-center text-blue-600 dark:text-cyan-300">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="card-title text-slate-900 dark:text-white">Breakdown Kinerja &amp; Utilisasi Mesin</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Audit total output, kuantitas reject, dan porsi beban per nama mesin ({machineBreakdown.label})
                  </p>
                </div>
              </div>
              <span className="badge bg-blue-50 text-blue-700 dark:bg-cyan-500/20 dark:text-cyan-300 font-bold">
                {machineBreakdown.list.length} Unit Mesin/Alat
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Bar Chart Mesin */}
              <div className="h-64">
                {(() => {
                  const ct = getChartTheme();
                  return (
                    <Bar
                      data={{
                        labels: machineBreakdown.labels,
                        datasets: [
                          { label: 'Good Output', data: machineBreakdown.good, backgroundColor: ct.goodColor, borderRadius: 4 },
                          { label: 'Reject / Defect', data: machineBreakdown.reject, backgroundColor: ct.defectColor, borderRadius: 4 }
                        ]
                      }}
                      options={{
                        maintainAspectRatio: false,
                        scales: {
                          x: { stacked: true, ticks: { color: ct.tickColor }, grid: { color: ct.gridColor } },
                          y: { stacked: true, ticks: { color: ct.tickColor }, grid: { color: ct.gridColor } }
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
                        onClick: (e, els) => {
                          if (!els || !Array.isArray(els) || !els.length || !els[0] || !onOpenList) return;
                          const mName = machineBreakdown.labels[els[0].index];
                          const item = machineBreakdown.list.find((x) => x.name === mName);
                          if (item) onOpenList(`Detail Mesin: ${mName}`, activeKey, item.rowList);
                        }
                      }}
                    />
                  );
                })()}
              </div>

              {/* Doughnut Chart Share Utilisasi Mesin */}
              <div className="h-64 flex items-center justify-center">
                {(() => {
                  const ct = getChartTheme();
                  return (
                    <Doughnut
                      data={{
                        labels: machineBreakdown.labels,
                        datasets: [
                          {
                            data: machineBreakdown.output,
                            backgroundColor: ['#0284c7', '#059669', '#d97706', '#6366f1', '#ec4899', '#8b5cf6', '#64748b'],
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
                        onClick: (e, els) => {
                          if (!els || !Array.isArray(els) || !els.length || !els[0] || !onOpenList) return;
                          const mName = machineBreakdown.labels[els[0].index];
                          const item = machineBreakdown.list.find((x) => x.name === mName);
                          if (item) onOpenList(`Detail Mesin: ${mName}`, activeKey, item.rowList);
                        }
                      }}
                    />
                  );
                })()}
              </div>
            </div>

            {/* Tabel Rincian Kinerja per Mesin */}
            <div className="table-responsive pt-2">
              <table className="tbl min-w-[650px]">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Nama Mesin / Parameter</th>
                    <th>Total Output</th>
                    <th>Good</th>
                    <th>Reject</th>
                    <th>Replace</th>
                    <th>Defect Rate (%)</th>
                    <th>Share Output (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {machineBreakdown.list.map((m, idx) => (
                    <tr
                      key={m.name}
                      onClick={() => onOpenList?.(`Rincian Mesin: ${m.name}`, activeKey, m.rowList)}
                      className="cursor-pointer"
                    >
                      <td className="font-mono text-slate-500 dark:text-slate-400 font-bold">{idx + 1}</td>
                      <td className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        {m.name}
                        <span className="text-[10px] text-blue-600 dark:text-cyan-400">&rarr;</span>
                      </td>
                      <td className="font-bold text-slate-900 dark:text-white">{m.output.toLocaleString('id-ID')}</td>
                      <td className="text-emerald-600 dark:text-emerald-400 font-semibold">{m.good.toLocaleString('id-ID')}</td>
                      <td className="text-rose-600 dark:text-rose-400 font-semibold">{m.reject.toLocaleString('id-ID')}</td>
                      <td className="text-amber-600 dark:text-amber-400">{m.replace.toLocaleString('id-ID')}</td>
                      <td>
                        <span className={`badge ${m.lossRate > 1.0 ? 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40' : 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40'} font-bold`}>
                          {m.lossRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="font-mono text-blue-600 dark:text-cyan-300 font-bold">{m.share.toFixed(1)}%</td>
                    </tr>
                  ))}
                  {machineBreakdown.list.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-6 text-slate-500 dark:text-slate-400 text-xs">
                        Tidak ada data mesin pada periode ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 2: EVALUASI KATEGORI JOB (0-9) */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-400/30 flex items-center justify-center text-purple-600 dark:text-purple-300">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="card-title text-slate-900 dark:text-white">Evaluasi Kategori Job (Digit Pertama JOP)</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Klasifikasi cerdas berdasarkan karakter pertama kolom job_no: 0: Sticker, 1: School, 2: Office, 3: Kertas Surat, 4: Envelope, 5: Gift Wrap, 6: Others, 7: Jasa, 8: Export, 9: Carton Box
                  </p>
                </div>
              </div>
              <span className="badge bg-purple-50 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 font-bold">
                {jobCategoryEvaluation.list.length} Kategori Terdeteksi
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Bar Chart Evaluasi Kategori */}
              <div className="h-64">
                {(() => {
                  const ct = getChartTheme();
                  return (
                    <Bar
                      data={{
                        labels: jobCategoryEvaluation.labels,
                        datasets: [
                          { label: 'Good Output', data: jobCategoryEvaluation.good, backgroundColor: ct.goodColor, borderRadius: 4 },
                          { label: 'Reject / Defect', data: jobCategoryEvaluation.reject, backgroundColor: ct.defectColor, borderRadius: 4 }
                        ]
                      }}
                      options={{
                        maintainAspectRatio: false,
                        scales: {
                          x: { stacked: true, ticks: { color: ct.tickColor, maxRotation: 45, minRotation: 20 }, grid: { color: ct.gridColor } },
                          y: { stacked: true, ticks: { color: ct.tickColor }, grid: { color: ct.gridColor } }
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
                        onClick: (e, els) => {
                          if (!els || !Array.isArray(els) || !els.length || !els[0] || !onOpenList) return;
                          const cName = jobCategoryEvaluation.labels[els[0].index];
                          const item = jobCategoryEvaluation.list.find((x) => x.category === cName);
                          if (item) onOpenList(`Detail Kategori: ${cName}`, activeKey, item.rowList);
                        }
                      }}
                    />
                  );
                })()}
              </div>

              {/* Doughnut Chart Volume Job per Kategori */}
              <div className="h-64 flex items-center justify-center">
                {(() => {
                  const ct = getChartTheme();
                  return (
                    <Doughnut
                      data={{
                        labels: jobCategoryEvaluation.labels,
                        datasets: [
                          {
                            data: jobCategoryEvaluation.volume,
                            backgroundColor: ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6', '#14b8a6', '#f97316', '#64748b'],
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
                        onClick: (e, els) => {
                          if (!els || !Array.isArray(els) || !els.length || !els[0] || !onOpenList) return;
                          const cName = jobCategoryEvaluation.labels[els[0].index];
                          const item = jobCategoryEvaluation.list.find((x) => x.category === cName);
                          if (item) onOpenList(`Detail Kategori: ${cName}`, activeKey, item.rowList);
                        }
                      }}
                    />
                  );
                })()}
              </div>
            </div>

            {/* Tabel Rekap Kategori Job */}
            <div className="table-responsive pt-2">
              <table className="tbl min-w-[650px]">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Kategori Produk</th>
                    <th>Volume Job (JOP)</th>
                    <th>Porsi Volume (%)</th>
                    <th>Total Output</th>
                    <th>Good</th>
                    <th>Reject</th>
                    <th>Defect Rate (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {jobCategoryEvaluation.list.map((c, idx) => (
                    <tr
                      key={c.category}
                      onClick={() => onOpenList?.(`Rincian Kategori: ${c.category}`, activeKey, c.rowList)}
                      className="cursor-pointer"
                    >
                      <td className="font-mono text-slate-500 dark:text-slate-400 font-bold">{idx + 1}</td>
                      <td className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        {c.category}
                        <span className="text-[10px] text-blue-600 dark:text-cyan-400">&rarr;</span>
                      </td>
                      <td className="font-bold text-slate-900 dark:text-white">{c.volume.toLocaleString('id-ID')} JOP</td>
                      <td className="font-mono text-blue-600 dark:text-cyan-300 font-bold">{c.volumeShare.toFixed(1)}%</td>
                      <td className="font-bold text-slate-900 dark:text-slate-200">{c.output.toLocaleString('id-ID')}</td>
                      <td className="text-emerald-600 dark:text-emerald-400 font-semibold">{c.good.toLocaleString('id-ID')}</td>
                      <td className="text-rose-600 dark:text-rose-400 font-semibold">{c.reject.toLocaleString('id-ID')}</td>
                      <td>
                        <span className={`badge ${c.lossRate > 1.0 ? 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40' : 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40'} font-bold`}>
                          {c.lossRate.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                  {jobCategoryEvaluation.list.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-6 text-slate-500 dark:text-slate-400 text-xs">
                        Tidak ada data kategori job pada periode ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 3: PERFORMA SHIFT & LEADERBOARD OPERATOR VS PO */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Performa Shift */}
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                <h3 className="card-title text-slate-900 dark:text-white">Performa Shift {cfg.label}</h3>
              </div>
              <div className="h-64">
                {(() => {
                  const ct = getChartTheme();
                  return (
                    <Bar
                      data={{
                        labels: shiftData.labels,
                        datasets: [
                          { label: 'Good Output', data: shiftData.good, backgroundColor: ct.goodColor, borderRadius: 4 },
                          { label: 'Reject / Defect', data: shiftData.reject, backgroundColor: ct.defectColor, borderRadius: 4 }
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
                        },
                        onClick: (e, els) => {
                          if (!els || !Array.isArray(els) || !els.length || !els[0] || !onOpenList) return;
                          const sh = shiftData.labels[els[0].index];
                          onOpenList(
                            `Detail Shift: ${sh}`,
                            activeKey,
                            (rows || []).filter((r) => {
                              if (!r) return false;
                              let s = cell(r, cfg?.i?.shift, '').toUpperCase().trim();
                              if (!s || s === '-' || s === 'UNDEFINED') s = 'NON-SHIFT';
                              return s === sh;
                            })
                          );
                        }
                      }}
                    />
                  );
                })()}
              </div>
            </div>

            {/* Porsi Output Shift */}
            <div className="card p-5">
              <h3 className="card-title mb-3 text-slate-900 dark:text-white">Distribusi Porsi Output Shift</h3>
              <div className="h-64 flex items-center justify-center">
                {(() => {
                  const ct = getChartTheme();
                  return (
                    <Doughnut
                      data={{
                        labels: shiftData.labels,
                        datasets: [
                          {
                            data: shiftData.good,
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

          {/* SECTION 4: LEADERBOARD OPERATOR VS PO */}
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
                    {activeLeaderboardTab === 'OP' ? 'Leaderboard Performa Operator' : 'Leaderboard Performa PO (Customer)'}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Daftar peringkat berdasarkan total output dan rasio reject terendah
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

                <div className="relative w-full sm:w-56">
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
              <table className="tbl min-w-[650px]">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>{activeLeaderboardTab === 'OP' ? 'Nama Operator' : 'Nama PO'}</th>
                    <th>Total Output</th>
                    <th>Good</th>
                    <th>Reject</th>
                    <th>Replace</th>
                    <th>Loss Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeaderboard.map((o, idx) => (
                    <tr
                      key={o.name}
                      onClick={() => onOpenList?.(`Rekap Transaksi: ${o.name}`, activeKey, o.rowList)}
                      className="cursor-pointer"
                    >
                      <td className="font-mono font-bold text-slate-500 dark:text-slate-400">#{idx + 1}</td>
                      <td className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        {o.name}
                        <span className="text-[10px] text-blue-600 dark:text-cyan-400">&rarr;</span>
                      </td>
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
                  {filteredLeaderboard.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-500 dark:text-slate-400">
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
      {/* SUB-VIEW 3: KOMPARASI PERIODE */}
      {/* ========================================================================= */}
      {subView === 'comparison' && (
        <div className="space-y-4 anim-in">
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-11 h-11 rounded-2xl grid place-items-center bg-blue-50 dark:bg-indigo-500/20 text-blue-600 dark:text-cyan-300 border border-blue-200 dark:border-indigo-400/40 shadow-sm">
                <GitCompare className="w-5 h-5" />
              </span>
              <div>
                <h3 className="card-title text-base sm:text-lg text-slate-900 dark:text-white">
                  Dashboard Komparasi Capaian ({cfg.label})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Bandingkan capaian antar rentang periode untuk menganalisis tren efisiensi produksi
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                  Periode 1 (Pembanding)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <DatePickerInput
                    label="Dari"
                    value={comparePeriods.p1.from}
                    onChange={(val) => setComparePeriods((prev) => ({ ...prev, p1: { ...prev.p1, from: val } }))}
                  />
                  <DatePickerInput
                    label="Sampai"
                    value={comparePeriods.p1.to}
                    onChange={(val) => setComparePeriods((prev) => ({ ...prev, p1: { ...prev.p1, to: val } }))}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                  Periode 2 (Dibandingkan)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <DatePickerInput
                    label="Dari"
                    value={comparePeriods.p2.from}
                    onChange={(val) => setComparePeriods((prev) => ({ ...prev, p2: { ...prev.p2, from: val } }))}
                  />
                  <DatePickerInput
                    label="Sampai"
                    value={comparePeriods.p2.to}
                    onChange={(val) => setComparePeriods((prev) => ({ ...prev, p2: { ...prev.p2, to: val } }))}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-4 flex-wrap items-center">
              <button
                type="button"
                onClick={() => setComparePeriods({ p1: comparePeriods.p2, p2: comparePeriods.p1 })}
                className="btn-secondary text-xs py-2 px-3 rounded-xl"
              >
                <RotateCcw className="w-4 h-4 mr-1" /> Tukar Periode
              </button>
              <button
                type="button"
                onClick={() => setComparePeriods(defaultPeriods())}
                className="btn-secondary text-xs py-2 px-3 rounded-xl"
              >
                Bulan Lalu vs Bulan Ini
              </button>
              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  const p2To = today;
                  const p2From = new Date(today);
                  p2From.setDate(today.getDate() - 29);
                  const p1To = new Date(today);
                  p1To.setDate(today.getDate() - 30);
                  const p1From = new Date(today);
                  p1From.setDate(today.getDate() - 59);
                  setComparePeriods({
                    p1: { from: iso(p1From), to: iso(p1To) },
                    p2: { from: iso(p2From), to: iso(p2To) }
                  });
                }}
                className="btn-secondary text-xs py-2 px-3 rounded-xl"
              >
                30 Hari Lalu vs 30 Hari Ini
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {/* Card 1: Total Hasil */}
            <div className="card p-5 relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-blue-600"></div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">Total Hasil</span>
                {statusHasil.badge}
              </div>
              <div className="mt-3 flex items-end gap-3">
                <div className="flex-1">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Periode 1</div>
                  <div className="font-display font-extrabold text-2xl text-slate-900 dark:text-slate-200">{m1.pakai.toLocaleString('id-ID')}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{fmtPeriodRange(new Date(comparePeriods.p1.from), new Date(comparePeriods.p1.to))}</div>
                </div>
                <div className="text-slate-400 text-xl pb-1">&rarr;</div>
                <div className="flex-1">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Periode 2</div>
                  <div className="font-display font-extrabold text-2xl text-blue-600 dark:text-cyan-300">{m2.pakai.toLocaleString('id-ID')}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{fmtPeriodRange(new Date(comparePeriods.p2.from), new Date(comparePeriods.p2.to))}</div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Delta</span>
                <span className={`font-bold ${statusHasil.deltaColor}`}>{statusHasil.deltaText}</span>
              </div>
            </div>

            {/* Card 2: Total Rusak */}
            <div className="card p-5 relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-rose-500"></div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">Total Rusak</span>
                {statusRusak.badge}
              </div>
              <div className="mt-3 flex items-end gap-3">
                <div className="flex-1">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Periode 1</div>
                  <div className="font-display font-extrabold text-2xl text-rose-600 dark:text-rose-400">{m1.rusak.toLocaleString('id-ID')}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{fmtPeriodRange(new Date(comparePeriods.p1.from), new Date(comparePeriods.p1.to))}</div>
                </div>
                <div className="text-slate-400 text-xl pb-1">&rarr;</div>
                <div className="flex-1">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Periode 2</div>
                  <div className="font-display font-extrabold text-2xl text-rose-600 dark:text-rose-400">{m2.rusak.toLocaleString('id-ID')}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{fmtPeriodRange(new Date(comparePeriods.p2.from), new Date(comparePeriods.p2.to))}</div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Delta</span>
                <span className={`font-bold ${statusRusak.deltaColor}`}>{statusRusak.deltaText}</span>
              </div>
            </div>

            {/* Card 3: Total Ganti */}
            <div className="card p-5 relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-amber-500"></div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">Total Ganti</span>
                {statusGanti.badge}
              </div>
              <div className="mt-3 flex items-end gap-3">
                <div className="flex-1">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Periode 1</div>
                  <div className="font-display font-extrabold text-2xl text-amber-600 dark:text-amber-400">{m1.ganti.toLocaleString('id-ID')}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{fmtPeriodRange(new Date(comparePeriods.p1.from), new Date(comparePeriods.p1.to))}</div>
                </div>
                <div className="text-slate-400 text-xl pb-1">&rarr;</div>
                <div className="flex-1">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Periode 2</div>
                  <div className="font-display font-extrabold text-2xl text-amber-600 dark:text-amber-400">{m2.ganti.toLocaleString('id-ID')}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{fmtPeriodRange(new Date(comparePeriods.p2.from), new Date(comparePeriods.p2.to))}</div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Delta</span>
                <span className={`font-bold ${statusGanti.deltaColor}`}>{statusGanti.deltaText}</span>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="card-title mb-3 text-slate-900 dark:text-white">Grafik Komparasi — Total Hasil &amp; Total Ganti</h3>
            <div className="h-80">
              {(() => {
                const ct = getChartTheme();
                return (
                  <Bar
                    data={{
                      labels: ['Total Hasil', 'Total Ganti', 'Total Rusak'],
                      datasets: [
                        { label: 'Periode 1', data: [m1.pakai, m1.ganti, m1.rusak], backgroundColor: hexA(cfg.color, 0.35), borderColor: cfg.color, borderWidth: 2, borderRadius: 6 },
                        { label: 'Periode 2', data: [m2.pakai, m2.ganti, m2.rusak], backgroundColor: hexA(cfg.color, 0.9), borderColor: cfg.color, borderWidth: 2, borderRadius: 6 }
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
                      }
                    }}
                  />
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}