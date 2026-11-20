import React, { useState, useMemo } from 'react';
import { SHEETS } from '../../constants/schema';
import {
  cell,
  fmtPeriodRange,
  getChartTheme,
  formatYMD,
  getRowQtyGood,
  getRowQtyDefect,
  getRowQtyReplace
} from '../../utils/formatters';
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
  Filler
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import {
  Layers,
  Activity,
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  ShieldAlert,
  Award,
  Zap,
  Target,
  BarChart3,
  RotateCcw,
  Clock,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Konfigurasi 5 Divisi Utama PRISM (Urutan Sesuai Standar PRISM)
const PRODUCTION_LINES = [
  {
    key: 'rec_ctp',
    code: 'CTP',
    name: 'CTP Line',
    badge: 'CTP Thermal',
    color: '#10b981',
    lightBorder: 'border-emerald-200 dark:border-emerald-500/30',
    lightBg: 'bg-emerald-50 dark:bg-emerald-500/10',
    textColor: 'text-emerald-600 dark:text-emerald-400'
  },
  {
    key: 'rec_ctcp',
    code: 'CTCP',
    name: 'CTCP Line',
    badge: 'CTCP Offset',
    color: '#8b5cf6',
    lightBorder: 'border-violet-200 dark:border-violet-500/30',
    lightBg: 'bg-violet-50 dark:bg-violet-500/10',
    textColor: 'text-violet-600 dark:text-violet-400'
  },
  {
    key: 'rec_etching',
    code: 'ETCHING',
    name: 'Etching Line',
    badge: 'Etching Plate',
    color: '#f59e0b',
    lightBorder: 'border-amber-200 dark:border-amber-500/30',
    lightBg: 'bg-amber-50 dark:bg-amber-500/10',
    textColor: 'text-amber-600 dark:text-amber-400'
  },
  {
    key: 'rec_flexo',
    code: 'FLEXO',
    name: 'Flexo Line',
    badge: 'Flexography',
    color: '#6366f1',
    lightBorder: 'border-indigo-200 dark:border-indigo-500/30',
    lightBg: 'bg-indigo-50 dark:bg-indigo-500/10',
    textColor: 'text-indigo-600 dark:text-indigo-400'
  },
  {
    key: 'rec_screen',
    code: 'SCREEN',
    name: 'Screen Line',
    badge: 'Screen Printing',
    color: '#06b6d4',
    lightBorder: 'border-cyan-200 dark:border-cyan-500/30',
    lightBg: 'bg-cyan-50 dark:bg-cyan-500/10',
    textColor: 'text-cyan-600 dark:text-cyan-400'
  }
];

// Helper 1: Klasifikasi Otomatis Alasan Penggantian Plate (replace_reason)
function classifyReplaceReason(reasonStr) {
  if (!reasonStr) return 'Teknis / Internal Prepress';
  const s = String(reasonStr).toUpperCase().trim();

  // Kategori 1: "Pressroom / Aus Cetak" (External / Normal Wear di Mesin Cetak)
  // Menangkap kata AUS (seperti AUS < 50 RIBU, AUS 50 - 100 RIBU, AUS > 100 RIBU, AUS CETAK, KEAUSAN)
  // atau ORDER TAMBAH / REPEAT ORDER / OPLASH
  if (
    s.includes('AUS') ||
    s.includes('ORDER TAMBAH') ||
    s.includes('REPEAT ORDER') ||
    s.includes('TAMBAH ORDER') ||
    s.includes('TAMBAH CETAK') ||
    s.includes('OPLASH') ||
    s.includes('OPLAAG') ||
    s.includes('HABIS CETAK')
  ) {
    return 'Pressroom / Aus Cetak';
  }

  // Kategori 2: "Revisi Customer / File" (External Request)
  // Menangkap kata REVISI, CUSTOMER, PPIC, DESIGN, DESAIN, ACC, KLIEN, LAYOUT, SALAH FILE, dll.
  if (
    s.includes('REVISI') ||
    s.includes('CUSTOMER') ||
    s.includes('PPIC') ||
    s.includes('DESIGN') ||
    s.includes('DESAIN') ||
    s.includes('ACC') ||
    s.includes('KLIEN') ||
    s.includes('CLIENT') ||
    s.includes('LAYOUT') ||
    s.includes('TEKS') ||
    s.includes('TEXT') ||
    s.includes('SALAH FILE') ||
    s.includes('FILE SALAH') ||
    s.includes('PERUBAHAN') ||
    s.includes('KOREKSI') ||
    s.includes('ORDER BATAL')
  ) {
    return 'Revisi Customer / File';
  }

  // Kategori 3: "Teknis / Internal Prepress" (Internal / Avoidable Rework)
  return 'Teknis / Internal Prepress';
}

// Cek apakah replace_reason tergolong Eksternal (Pressroom Wear atau Customer Revision)
function isExternalReplace(reasonStr) {
  const cat = classifyReplaceReason(reasonStr);
  return cat === 'Pressroom / Aus Cetak' || cat === 'Revisi Customer / File';
}

// Helper 2: Klasifikasi Pemicu Kerusakan Plate (defect_reason)
function classifyDefectReason(reasonStr) {
  if (!reasonStr) return 'Teknis Mesin/Material';
  const s = String(reasonStr).toUpperCase().trim();

  if (
    s.includes('OPERATOR') ||
    s.includes('HUMAN') ||
    s.includes('SALAH PASANG') ||
    s.includes('TERBALIK') ||
    s.includes('JATUH') ||
    s.includes('SALAH SET') ||
    s.includes('SALAH UKURAN') ||
    s.includes('KELALAIAN') ||
    s.includes('HANDLING') ||
    s.includes('MISS') ||
    s.includes('LUPA') ||
    s.includes('SALAH MESIN')
  ) {
    return 'Operator / Human';
  }

  if (
    s.includes('FILE') ||
    s.includes('REVISI') ||
    s.includes('DESAIN') ||
    s.includes('ACC') ||
    s.includes('CUSTOMER')
  ) {
    return 'Revisi File/Customer';
  }

  return 'Teknis Mesin/Material';
}

// Normalisasi Shift
function normalizeShift(rawShift) {
  if (!rawShift) return 'Shift A';
  const s = String(rawShift).toUpperCase().trim();
  if (s.includes('C') || s.includes('3') || s.includes('MALAM')) return 'Shift C';
  if (s.includes('B') || s.includes('2') || s.includes('SIANG')) return 'Shift B';
  if (s.includes('A') || s.includes('1') || s.includes('PAGI')) return 'Shift A';
  return 'Shift A';
}

// Helper Ekstraksi & Standarisasi Baris Data Produksi
function parseProductionRecord(r, key) {
  if (!r) return null;
  const cfg = SHEETS[key];
  if (!cfg) return null;

  const idVal = cell(r, cfg?.i?.id, '').trim();
  const jobName = cell(r, cfg?.i?.jop ?? cfg?.i?.job_name, '').trim();
  const jobNo = cell(r, cfg?.i?.nojop ?? cfg?.i?.job_no, '').trim();
  const fileNo = cell(r, cfg?.i?.file_no, '').trim();
  const dateVal = cell(r, cfg?.i?.date, '').trim();
  const descVal = cell(r, cfg?.i?.description, '').trim();

  // Filter baris kosong/header invalid
  if (!idVal || idVal === '-' || (!jobName && !jobNo) || (jobName === '-' && jobNo === '-')) {
    return null;
  }

  const good = getRowQtyGood(r, cfg);
  const defect = getRowQtyDefect(r, cfg);
  const replace = getRowQtyReplace(r, cfg);

  let defectReason = cell(r, cfg?.i?.penyRusak ?? cfg?.i?.defect_reason, '').trim();
  if (
    !defectReason ||
    defectReason === '-' ||
    defectReason === '0' ||
    defectReason.toUpperCase() === 'UNDEFINED' ||
    defectReason.toUpperCase() === 'NULL'
  ) {
    defectReason = '';
  }

  let replaceReason = cell(r, cfg?.i?.penyGanti ?? cfg?.i?.replace_reason, '').trim();
  if (
    !replaceReason ||
    replaceReason === '-' ||
    replaceReason === '0' ||
    replaceReason.toUpperCase() === 'UNDEFINED' ||
    replaceReason.toUpperCase() === 'NULL'
  ) {
    replaceReason = '';
  }

  const rawShift = cell(r, cfg?.i?.shift, '');
  const shift = normalizeShift(rawShift);
  const ymd = formatYMD(dateVal);

  // Kategorisasi Replace
  const replaceCategory = replaceReason ? classifyReplaceReason(replaceReason) : 'Teknis / Internal Prepress';
  const isExt = replaceReason ? isExternalReplace(replaceReason) : false;
  const replaceExt = isExt ? replace : 0;
  const replaceInt = isExt ? 0 : replace;
  const replaceAus = replaceCategory === 'Pressroom / Aus Cetak' ? replace : 0;
  const replaceRev = replaceCategory === 'Revisi Customer / File' ? replace : 0;

  return {
    raw: r,
    key,
    id: idVal,
    jobName,
    jobNo,
    fileNo,
    desc: descVal,
    dateVal,
    ymd,
    good,
    defect,
    replace,
    replaceExt,
    replaceInt,
    replaceAus,
    replaceRev,
    replaceCategory,
    defectCategory: defectReason ? classifyDefectReason(defectReason) : 'Teknis Mesin/Material',
    totalVolume: good + defect + replace,
    shift,
    defectReason,
    replaceReason,
    operator: cell(r, cfg?.i?.op ?? cfg?.i?.operator, '').trim()
  };
}

// Mini SVG Sparkline Component
function MiniSparkline({ data = [], color = '#10b981', height = 36, width = 110 }) {
  if (!data || data.length < 2) {
    return <span className="text-[10px] text-slate-400 italic">Histori minim</span>;
  }
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = 4;
  const w = width - pad * 2;
  const h = height - pad * 2;

  const points = data.map((val, idx) => {
    const x = pad + (idx / (data.length - 1)) * w;
    const y = pad + h - ((val - min) / range) * h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const areaD = `M ${pad},${height} L ${points.join(' L ')} L ${width - pad},${height} Z`;
  const lastPoint = points[points.length - 1].split(',');

  return (
    <svg width={width} height={height} className="overflow-visible inline-block">
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#grad-${color.replace('#', '')})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastPoint[0]} cy={lastPoint[1]} r="3" fill={color} />
    </svg>
  );
}

// Plugin Garis Target Khusus Chart.js (Target 95% & Batas 90%)
const targetThresholdLinesPlugin = {
  id: 'targetThresholdLines',
  afterDraw(chart) {
    const { ctx, chartArea, scales } = chart;
    const yFpy = scales?.yFpy;
    if (!yFpy || !chartArea) return;

    const { left, right, top, bottom } = chartArea;

    // Garis 95% Target Ideal
    const y95 = yFpy.getPixelForValue(95);
    if (y95 >= top && y95 <= bottom) {
      ctx.save();
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.85)';
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(left, y95);
      ctx.lineTo(right, y95);
      ctx.stroke();
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('Target 95%', right - 64, y95 - 4);
      ctx.restore();
    }

    // Garis 90% Batas Toleransi Minimum
    const y90 = yFpy.getPixelForValue(90);
    if (y90 >= top && y90 <= bottom) {
      ctx.save();
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.85)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(left, y90);
      ctx.lineTo(right, y90);
      ctx.stroke();
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('Min 90%', right - 50, y90 - 4);
      ctx.restore();
    }
  }
};

export default function ExecutiveOverallView({ data, period, onOpenList }) {
  // State Filter Divisi Khusus Modul 2 (Defect & Replace Reasons)
  const [selectedReasonLine, setSelectedReasonLine] = useState('ALL');

  // Format String Periode Global
  const fromStr = period?.from ? formatYMD(period.from) : '';
  const toStr = period?.to ? formatYMD(period.to) : '';

  // 1. Ekstraksi Seluruh Record Historis dari 5 Lini
  const allHistoricalRecords = useMemo(() => {
    const list = [];
    PRODUCTION_LINES.forEach((line) => {
      const rawRows = data[line.key] || [];
      rawRows.forEach((r) => {
        const rec = parseProductionRecord(r, line.key);
        if (rec) {
          list.push({ ...rec, lineName: line.name, lineBadge: line.badge, lineCode: line.code });
        }
      });
    });
    return list;
  }, [data]);

  // 2. Filter Record Berdasarkan Global Date Filter
  const activeRecords = useMemo(() => {
    if (!fromStr || !toStr) return allHistoricalRecords;
    return allHistoricalRecords.filter((r) => {
      if (!r.ymd) return false;
      return r.ymd >= fromStr && r.ymd <= toStr;
    });
  }, [allHistoricalRecords, fromStr, toStr]);

  // =========================================================================
  // MODUL 1: First Pass Yield (FPY) per Lini & Prepress Net Yield
  // =========================================================================
  const lineFpyData = useMemo(() => {
    // Bangun data histori bulanan per lini untuk mini sparklines (6 bulan terakhir)
    const lineMonthlyMap = {};
    PRODUCTION_LINES.forEach((l) => {
      lineMonthlyMap[l.key] = {};
    });

    allHistoricalRecords.forEach((r) => {
      if (!r.ymd) return;
      const monthKey = r.ymd.substring(0, 7); // YYYY-MM
      if (!lineMonthlyMap[r.key][monthKey]) {
        lineMonthlyMap[r.key][monthKey] = { good: 0, replaceExt: 0, total: 0 };
      }
      lineMonthlyMap[r.key][monthKey].good += r.good;
      lineMonthlyMap[r.key][monthKey].replaceExt += r.replaceExt;
      lineMonthlyMap[r.key][monthKey].total += r.totalVolume;
    });

    return PRODUCTION_LINES.map((line) => {
      const lineActiveRecs = activeRecords.filter((r) => r.key === line.key);
      let good = 0;
      let defect = 0;
      let replace = 0;
      let replaceExt = 0;
      let replaceInt = 0;
      let replaceAus = 0;
      let replaceRev = 0;

      lineActiveRecs.forEach((r) => {
        good += r.good;
        defect += r.defect;
        replace += r.replace;
        replaceExt += r.replaceExt;
        replaceInt += r.replaceInt;
        replaceAus += r.replaceAus;
        replaceRev += r.replaceRev;
      });

      const total = good + defect + replace;

      // 1. Prepress Net Yield (%): (good + replaceExt) / total * 100
      // Memisahkan faktor keausan pressroom (AUS) dan revisi customer/file
      const netYield = total > 0 ? ((good + replaceExt) / total) * 100 : 100.0;

      // 2. Gross FPY (%): good / total * 100
      // Memasukkan seluruh replace sebagai beban kapasitas
      const grossFpy = total > 0 ? (good / total) * 100 : 100.0;

      const hasData = total > 0;

      // Penentu Warna Status Target Menggunakan Prepress Net Yield:
      // Hijau (Ideal): >= 95.00%
      // Kuning (Warning / Minimal): 90.00% – 94.99%
      // Merah (Critical): < 90.00%
      let status = 'IDEAL';
      let statusColor = 'text-emerald-600 dark:text-emerald-400';
      let statusBadge = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
      let cardBorder = 'border-emerald-200 dark:border-emerald-500/30';

      if (!hasData) {
        status = 'NO DATA';
        statusColor = 'text-slate-500 dark:text-slate-400';
        statusBadge = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700';
        cardBorder = 'border-slate-200 dark:border-slate-800';
      } else if (netYield < 90.0) {
        status = 'CRITICAL';
        statusColor = 'text-rose-600 dark:text-rose-400';
        statusBadge = 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800';
        cardBorder = 'border-rose-300 dark:border-rose-500/40 ring-1 ring-rose-500/20';
      } else if (netYield < 95.0) {
        status = 'WARNING';
        statusColor = 'text-amber-600 dark:text-amber-400';
        statusBadge = 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800';
        cardBorder = 'border-amber-300 dark:border-amber-500/40';
      }

      // Hitung deret histori Prepress Net Yield 6 bulan terakhir untuk mini sparkline
      const monthsAvailable = Object.keys(lineMonthlyMap[line.key]).sort();
      const recentMonths = monthsAvailable.slice(-6);
      const sparklineData = recentMonths.map((m) => {
        const item = lineMonthlyMap[line.key][m];
        return item.total > 0 ? ((item.good + item.replaceExt) / item.total) * 100 : 100.0;
      });

      // Hitung selisih tren Net Yield (MoM delta)
      let trendDelta = 0;
      if (sparklineData.length >= 2) {
        trendDelta = sparklineData[sparklineData.length - 1] - sparklineData[sparklineData.length - 2];
      }

      return {
        ...line,
        good,
        defect,
        replace,
        replaceExt,
        replaceInt,
        replaceAus,
        replaceRev,
        total,
        netYield,
        grossFpy,
        hasData,
        status,
        statusColor,
        statusBadge,
        cardBorder,
        sparklineData,
        trendDelta,
        activeRecords: lineActiveRecs
      };
    });
  }, [activeRecords, allHistoricalRecords]);

  // Cari Lini Prioritas Perbaikan (Lini dengan Prepress Net Yield terendah di bawah target 95%)
  const priorityLine = useMemo(() => {
    const validLines = lineFpyData.filter((l) => l.hasData);
    if (validLines.length === 0) return null;
    const sorted = [...validLines].sort((a, b) => a.netYield - b.netYield);
    const lowest = sorted[0];
    if (lowest.netYield < 95.0) return lowest;
    return null; // Semua lini memenuhi target ideal (>= 95%)
  }, [lineFpyData]);

  // Grand Total Ringkasan Pabrik (Global Active Period)
  const factorySummary = useMemo(() => {
    let good = 0;
    let defect = 0;
    let replace = 0;
    let replaceExt = 0;
    let replaceInt = 0;
    let replaceAus = 0;
    let replaceRev = 0;

    activeRecords.forEach((r) => {
      good += r.good;
      defect += r.defect;
      replace += r.replace;
      replaceExt += r.replaceExt;
      replaceInt += r.replaceInt;
      replaceAus += r.replaceAus;
      replaceRev += r.replaceRev;
    });

    const totalVolume = good + defect + replace;
    const netYield = totalVolume > 0 ? ((good + replaceExt) / totalVolume) * 100 : 100.0;
    const grossFpy = totalVolume > 0 ? (good / totalVolume) * 100 : 100.0;
    const hiddenLossRate = totalVolume > 0 ? (replace / totalVolume) * 100 : 0.0;
    const extLossRate = totalVolume > 0 ? (replaceExt / totalVolume) * 100 : 0.0;
    const intLossRate = totalVolume > 0 ? (replaceInt / totalVolume) * 100 : 0.0;

    return {
      good,
      defect,
      replace,
      replaceExt,
      replaceInt,
      replaceAus,
      replaceRev,
      totalVolume,
      netYield,
      grossFpy,
      hiddenLossRate,
      extLossRate,
      intLossRate
    };
  }, [activeRecords]);

  // =========================================================================
  // MODUL 2: Top 5 Defect Reason & Top 5 Replace Reason
  // =========================================================================
  const reasonsData = useMemo(() => {
    let filteredRecs = activeRecords;
    if (selectedReasonLine !== 'ALL') {
      const matchLine = PRODUCTION_LINES.find((l) => l.code === selectedReasonLine);
      if (matchLine) {
        filteredRecs = activeRecords.filter((r) => r.key === matchLine.key);
      }
    }

    const defectMap = {};
    const replaceMap = {};
    let totalDefectUnits = 0;
    let totalReplaceUnits = 0;

    filteredRecs.forEach((r) => {
      if (r.defectReason && r.defectReason !== '-' && r.defectReason !== '0') {
        const dUnits = r.defect > 0 ? r.defect : 1;
        defectMap[r.defectReason] = (defectMap[r.defectReason] || 0) + dUnits;
        totalDefectUnits += dUnits;
      }
      if (r.replaceReason && r.replaceReason !== '-' && r.replaceReason !== '0') {
        const rUnits = r.replace > 0 ? r.replace : 1;
        replaceMap[r.replaceReason] = (replaceMap[r.replaceReason] || 0) + rUnits;
        totalReplaceUnits += rUnits;
      }
    });

    const topDefects = Object.entries(defectMap)
      .map(([reason, units]) => ({
        reason,
        units,
        pct: totalDefectUnits > 0 ? (units / totalDefectUnits) * 100 : 0,
        category: classifyDefectReason(reason)
      }))
      .sort((a, b) => b.units - a.units)
      .slice(0, 5);

    const topReplaces = Object.entries(replaceMap)
      .map(([reason, units]) => ({
        reason,
        units,
        pct: totalReplaceUnits > 0 ? (units / totalReplaceUnits) * 100 : 0,
        category: classifyReplaceReason(reason)
      }))
      .sort((a, b) => b.units - a.units)
      .slice(0, 5);

    // Kategori Ringkasan Pemicu Replace (Pressroom Wear vs Customer vs Internal)
    const replaceCatCounts = {
      'Pressroom / Aus Cetak': 0,
      'Revisi Customer / File': 0,
      'Teknis / Internal Prepress': 0
    };
    filteredRecs.forEach((r) => {
      if (r.replaceReason) {
        const cat = classifyReplaceReason(r.replaceReason);
        replaceCatCounts[cat] = (replaceCatCounts[cat] || 0) + (r.replace > 0 ? r.replace : 1);
      }
    });

    // Kategori Ringkasan Defect (Afval)
    const defectCatCounts = {
      'Teknis Mesin/Material': 0,
      'Operator / Human': 0,
      'Revisi File/Customer': 0
    };
    filteredRecs.forEach((r) => {
      if (r.defectReason) {
        const cat = classifyDefectReason(r.defectReason);
        defectCatCounts[cat] = (defectCatCounts[cat] || 0) + (r.defect > 0 ? r.defect : 1);
      }
    });

    return {
      topDefects,
      topReplaces,
      totalDefectUnits,
      totalReplaceUnits,
      replaceCatCounts,
      defectCatCounts,
      filteredRecs
    };
  }, [activeRecords, selectedReasonLine]);

  // =========================================================================
  // MODUL 3: Volume & Yield per Shift (Shift A, Shift B, Shift C)
  // =========================================================================
  const shiftComparison = useMemo(() => {
    const shifts = ['Shift A', 'Shift B', 'Shift C'];
    const map = {
      'Shift A': { name: 'Shift A', jobs: 0, good: 0, defect: 0, replace: 0, replaceExt: 0, replaceInt: 0, records: [] },
      'Shift B': { name: 'Shift B', jobs: 0, good: 0, defect: 0, replace: 0, replaceExt: 0, replaceInt: 0, records: [] },
      'Shift C': { name: 'Shift C', jobs: 0, good: 0, defect: 0, replace: 0, replaceExt: 0, replaceInt: 0, records: [] }
    };

    activeRecords.forEach((r) => {
      const sh = r.shift || 'Shift A';
      const targetMap = map[sh] || map['Shift A'];
      targetMap.jobs += 1;
      targetMap.good += r.good;
      targetMap.defect += r.defect;
      targetMap.replace += r.replace;
      targetMap.replaceExt += r.replaceExt;
      targetMap.replaceInt += r.replaceInt;
      targetMap.records.push(r);
    });

    const list = shifts.map((sh) => {
      const item = map[sh];
      const totalVolume = item.good + item.defect + item.replace;

      // 1. Prepress Net Yield: memisahkan keausan cetak & revisi customer
      const netYield = totalVolume > 0 ? ((item.good + item.replaceExt) / totalVolume) * 100 : 100.0;
      // 2. Gross FPY: seluruh replace masuk pengurang
      const grossFpy = totalVolume > 0 ? (item.good / totalVolume) * 100 : 100.0;

      let badgeClass = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
      let status = 'IDEAL';

      if (totalVolume === 0) {
        badgeClass = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700';
        status = 'NO DATA';
      } else if (netYield < 90.0) {
        badgeClass = 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800';
        status = 'CRITICAL';
      } else if (netYield < 95.0) {
        badgeClass = 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800';
        status = 'WARNING';
      }

      return {
        ...item,
        totalVolume,
        netYield,
        grossFpy,
        badgeClass,
        status
      };
    });

    // Cari Best Practice & Focus Coaching Shift berdasarkan Prepress Net Yield
    const activeShifts = list.filter((s) => s.totalVolume > 0);
    let bestShift = null;
    let worstShift = null;
    if (activeShifts.length > 0) {
      const sorted = [...activeShifts].sort((a, b) => b.netYield - a.netYield);
      bestShift = sorted[0];
      worstShift = sorted[sorted.length - 1];
    }

    return { list, bestShift, worstShift };
  }, [activeRecords]);

  // =========================================================================
  // MODUL 4: Analisis Job Replace / Ulang & Hidden Capacity Loss (Pecah Ext vs Int)
  // =========================================================================
  const replaceAnalysis = useMemo(() => {
    const REPEAT_KEYWORDS = ['ULANG', 'REVISI', 'EDT', '#2', 'GANTI', 'REPLACE'];

    // 1. Hitung frekuensi kemunculan nomor job dalam dataset aktif
    const jobFreqMap = {};
    activeRecords.forEach((r) => {
      const idKey = (r.jobNo || r.fileNo || r.jobName || '').toUpperCase().trim();
      if (idKey && idKey !== '-' && idKey !== 'NULL') {
        jobFreqMap[idKey] = (jobFreqMap[idKey] || 0) + 1;
      }
    });

    // 2. Filter record yang tergolong Job Ulang / Replace
    const repeatRecords = [];
    const groupedRepeatJobs = {};

    activeRecords.forEach((r) => {
      const text = `${r.jobName} ${r.desc}`.toUpperCase();
      const hasKeyword = REPEAT_KEYWORDS.some((kw) => text.includes(kw));
      const idKey = (r.jobNo || r.fileNo || r.jobName || '').toUpperCase().trim();
      const freq = jobFreqMap[idKey] || 0;
      const isRepeat = r.replace > 0 || hasKeyword || freq > 1;

      if (isRepeat) {
        repeatRecords.push(r);

        const groupKey = idKey || r.jobName;
        if (!groupedRepeatJobs[groupKey]) {
          groupedRepeatJobs[groupKey] = {
            jobName: r.jobName || r.desc || 'Order Tanpa Nama',
            jobNo: r.jobNo || r.fileNo || r.id,
            lineCode: r.lineCode,
            lineKey: r.key,
            count: 0,
            totalReplace: 0,
            replaceExt: 0,
            replaceInt: 0,
            reasons: new Set(),
            records: []
          };
        }
        groupedRepeatJobs[groupKey].count += 1;
        groupedRepeatJobs[groupKey].totalReplace += r.replace;
        groupedRepeatJobs[groupKey].replaceExt += r.replaceExt;
        groupedRepeatJobs[groupKey].replaceInt += r.replaceInt;
        if (r.replaceReason) groupedRepeatJobs[groupKey].reasons.add(r.replaceReason);
        if (r.defectReason) groupedRepeatJobs[groupKey].reasons.add(r.defectReason);
        groupedRepeatJobs[groupKey].records.push(r);
      }
    });

    // 3. Top Repeat Jobs (Masalah Kronis)
    const topRepeatJobs = Object.values(groupedRepeatJobs)
      .map((item) => {
        const mainReason = Array.from(item.reasons)[0] || 'Revisi / Penggantian Plate';
        const category = classifyReplaceReason(mainReason);
        return {
          ...item,
          mainReason,
          category
        };
      })
      .sort((a, b) => b.count - a.count || b.totalReplace - a.totalReplace)
      .slice(0, 10);

    // 4. Breakdown Replace Unit per Lini (dengan rincian External vs Internal)
    const replacePerLine = PRODUCTION_LINES.map((l) => {
      const recs = activeRecords.filter((r) => r.key === l.key);
      const units = recs.reduce((sum, r) => sum + r.replace, 0);
      const ext = recs.reduce((sum, r) => sum + r.replaceExt, 0);
      const int = recs.reduce((sum, r) => sum + r.replaceInt, 0);
      return {
        ...l,
        units,
        ext,
        int
      };
    });

    const totalJobs = activeRecords.length;
    const repeatJobsCount = repeatRecords.length;
    const repeatRate = totalJobs > 0 ? (repeatJobsCount / totalJobs) * 100 : 0.0;

    return {
      repeatRecords,
      topRepeatJobs,
      replacePerLine,
      totalJobs,
      repeatJobsCount,
      repeatRate
    };
  }, [activeRecords]);

  // =========================================================================
  // MODUL 5: Tren Bulanan — Volume vs Prepress Net Yield & Gross FPY
  // =========================================================================
  const monthlyTrendData = useMemo(() => {
    const monthlyMap = {};

    allHistoricalRecords.forEach((r) => {
      if (!r.ymd) return;
      const mKey = r.ymd.substring(0, 7); // YYYY-MM
      if (!monthlyMap[mKey]) {
        monthlyMap[mKey] = {
          month: mKey,
          good: 0,
          defect: 0,
          replace: 0,
          replaceExt: 0,
          total: 0
        };
      }
      monthlyMap[mKey].good += r.good;
      monthlyMap[mKey].defect += r.defect;
      monthlyMap[mKey].replace += r.replace;
      monthlyMap[mKey].replaceExt += r.replaceExt;
      monthlyMap[mKey].total += r.totalVolume;
    });

    // Urutkan kronologis
    const allMonths = Object.keys(monthlyMap).sort();
    // Ambil minimal 6–12 bulan terakhir
    const trendMonths = allMonths.slice(-12);

    const labels = trendMonths.map((m) => {
      const [year, month] = m.split('-');
      const date = new Date(Number(year), Number(month) - 1, 1);
      return date.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
    });

    const volumes = trendMonths.map((m) => monthlyMap[m].total);

    // Prepress Net Yield (Line Utama)
    const netYields = trendMonths.map((m) => {
      const it = monthlyMap[m];
      return it.total > 0 ? parseFloat((((it.good + it.replaceExt) / it.total) * 100).toFixed(2)) : 100.0;
    });

    // Gross FPY (Line Pembanding Kapasitas)
    const grossFpys = trendMonths.map((m) => {
      const it = monthlyMap[m];
      return it.total > 0 ? parseFloat(((it.good / it.total) * 100).toFixed(2)) : 100.0;
    });

    // Deteksi Anomali Otomatis Antar-Bulan
    const anomalies = [];
    for (let i = 1; i < trendMonths.length; i++) {
      const prevM = trendMonths[i - 1];
      const currM = trendMonths[i];
      const prevVol = monthlyMap[prevM].total;
      const currVol = monthlyMap[currM].total;
      const prevNet = prevVol > 0 ? ((monthlyMap[prevM].good + monthlyMap[prevM].replaceExt) / prevVol) * 100 : 100.0;
      const currNet = currVol > 0 ? ((monthlyMap[currM].good + monthlyMap[currM].replaceExt) / currVol) * 100 : 100.0;

      const volChangePct = prevVol > 0 ? ((currVol - prevVol) / prevVol) * 100 : 0;
      const netDelta = currNet - prevNet;

      // Anomali 1: Kapasitas Tertekan (Volume naik tajam >= 15%, Net Yield turun >= 1.5%)
      if (volChangePct >= 15.0 && netDelta <= -1.5) {
        anomalies.push({
          type: 'STRAIN',
          month: labels[i],
          title: `Kapasitas Tertekan & Lonjakan Defect Internal (${labels[i]})`,
          desc: `Volume produksi naik +${volChangePct.toFixed(1)}% (${currVol.toLocaleString('id-ID')} unit), namun Prepress Net Yield turun ${Math.abs(netDelta).toFixed(2)}% menjadi ${currNet.toFixed(2)}%. Indikasi beban mesin tinggi atau rush order di prepress.`,
          level: 'warning'
        });
      }

      // Anomali 2: Keberhasilan Perbaikan Mutu (Volume stabil/naik & Net Yield ikut naik >= 1.0%)
      if (volChangePct >= 0 && netDelta >= 1.0) {
        anomalies.push({
          type: 'IMPROVEMENT',
          month: labels[i],
          title: `Optimalisasi Proses Prepress Berhasil (${labels[i]})`,
          desc: `Output produksi stabil/meningkat (+${volChangePct.toFixed(1)}%) diimbangi kenaikan Prepress Net Yield sebesar +${netDelta.toFixed(2)}% menjadi ${currNet.toFixed(2)}%. Kontrol mutu teknis prepress berjalan sangat efektif.`,
          level: 'success'
        });
      }

      // Anomali 3: Critical Dip (Net Yield turun di bawah batas 90%)
      if (currNet < 90.0) {
        anomalies.push({
          type: 'CRITICAL_DIP',
          month: labels[i],
          title: `Pelanggaran Batas Toleransi Mutu Prepress (${labels[i]})`,
          desc: `Prepress Net Yield turun ke ${currNet.toFixed(2)}% (di bawah batas toleransi minimum 90.00%). Diperlukan investigasi mendalam terhadap defect internal prepress.`,
          level: 'critical'
        });
      }
    }

    // Perbandingan Year-to-Date (YTD) jika data lintas tahun tersedia
    const currentYear = new Date().getFullYear();
    const prevYear = currentYear - 1;

    let ytdCurrVol = 0, ytdCurrNetGood = 0;
    let ytdPrevVol = 0, ytdPrevNetGood = 0;

    allHistoricalRecords.forEach((r) => {
      if (!r.ymd) return;
      const y = parseInt(r.ymd.substring(0, 4), 10);
      if (y === currentYear) {
        ytdCurrVol += r.totalVolume;
        ytdCurrNetGood += r.good + r.replaceExt;
      } else if (y === prevYear) {
        ytdPrevVol += r.totalVolume;
        ytdPrevNetGood += r.good + r.replaceExt;
      }
    });

    const ytdCurrNet = ytdCurrVol > 0 ? (ytdCurrNetGood / ytdCurrVol) * 100 : 100.0;
    const ytdPrevNet = ytdPrevVol > 0 ? (ytdPrevNetGood / ytdPrevVol) * 100 : 100.0;

    return {
      labels,
      volumes,
      netYields,
      grossFpys,
      anomalies,
      ytd: {
        currentYear,
        prevYear,
        currVol: ytdCurrVol,
        currNet: ytdCurrNet,
        prevVol: ytdPrevVol,
        prevNet: ytdPrevNet,
        hasPrevYear: ytdPrevVol > 0
      }
    };
  }, [allHistoricalRecords]);

  const ct = getChartTheme();

  return (
    <div className="space-y-6 pb-12 anim-in">
      {/* =====================================================================
          EXECUTIVE DASHBOARD HEADER
      ===================================================================== */}
      <div className="card p-6 flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-blue-50 via-indigo-50/50 to-slate-50 dark:from-slate-900 dark:via-[#0c1427] dark:to-slate-900 border border-indigo-200/80 dark:border-indigo-500/30">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-400/40 font-bold">
              MANAGEMENT EXECUTIVE
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">&bull; Prepress Quality & Capacity Control</span>
          </div>
          <h1 className="font-display font-black text-xl sm:text-2xl mt-1 text-slate-900 dark:text-white tracking-wide flex items-center gap-2.5">
            <Target className="w-6 h-6 text-indigo-600 dark:text-indigo-400 inline" />
            Executive Quality & Capacity Control Dashboard
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Sistem evaluasi mutu murni divisi Prepress (<strong>Prepress Net Yield</strong>) yang memisahkan keausan wajar mesin cetak (AUS) dan revisi eksternal dari penilaian kualitas teknis internal.
          </p>
        </div>

        <div className="flex flex-col sm:items-end justify-center">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-mono tracking-wider font-semibold">
            Global Active Period
          </span>
          <div className="font-bold text-sm text-indigo-600 dark:text-cyan-300 mt-0.5 flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            {fmtPeriodRange(period?.from, period?.to)}
          </div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
            {activeRecords.length.toLocaleString('id-ID')} Total Record Transaksi
          </span>
        </div>
      </div>

      {/* =====================================================================
          EXECUTIVE MACRO KPI SUMMARY RIBBON
      ===================================================================== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Prepress Net Yield (KPI Utama Mutu Prepress) */}
        <div className="card p-4 sm:p-5 flex items-center justify-between border-slate-200 dark:border-slate-800">
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate block">
                Prepress Net Yield
              </span>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                  factorySummary.netYield >= 95.0
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                    : factorySummary.netYield >= 90.0
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                }`}
              >
                {factorySummary.netYield >= 95.0 ? 'IDEAL' : factorySummary.netYield >= 90.0 ? 'WARNING' : 'CRITICAL'}
              </span>
            </div>
            <div
              className={`mt-1 font-display font-black text-2xl sm:text-3xl ${
                factorySummary.netYield >= 95.0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : factorySummary.netYield >= 90.0
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {factorySummary.netYield.toFixed(2)}%
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between gap-1">
              <span>Gross FPY: <strong className="text-slate-700 dark:text-slate-300">{factorySummary.grossFpy.toFixed(2)}%</strong></span>
              <span className="text-cyan-600 dark:text-cyan-400 font-semibold">+{factorySummary.replaceExt} ext</span>
            </div>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-400/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <Award className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Total Production Volume */}
        <div className="card p-4 sm:p-5 flex items-center justify-between border-slate-200 dark:border-slate-800">
          <div className="min-w-0 pr-2">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate block">
              Total Volume Produksi
            </span>
            <div className="mt-1 font-display font-black text-2xl sm:text-3xl text-blue-600 dark:text-cyan-300">
              {factorySummary.totalVolume.toLocaleString('id-ID')}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              Good: {factorySummary.good.toLocaleString('id-ID')} ({((factorySummary.good / (factorySummary.totalVolume || 1)) * 100).toFixed(1)}%)
            </div>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-blue-50 dark:bg-cyan-500/10 border border-blue-200 dark:border-cyan-400/30 flex items-center justify-center text-blue-600 dark:text-cyan-300 shrink-0">
            <Layers className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Total Defect & Replace Units */}
        <div className="card p-4 sm:p-5 flex items-center justify-between border-slate-200 dark:border-slate-800">
          <div className="min-w-0 pr-2">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate block">
              Total Defect & Replace
            </span>
            <div className="mt-1 font-display font-black text-2xl sm:text-3xl text-rose-600 dark:text-rose-400">
              {(factorySummary.defect + factorySummary.replace).toLocaleString('id-ID')}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              Afval: {factorySummary.defect} &bull; Ganti: {factorySummary.replace} (Int: {factorySummary.replaceInt})
            </div>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-400/30 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
            <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Hidden Capacity Loss Rate */}
        <div className="card p-4 sm:p-5 flex items-center justify-between border-slate-200 dark:border-slate-800">
          <div className="min-w-0 pr-2">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate block">
              Hidden Capacity Loss
            </span>
            <div className={`mt-1 font-display font-black text-2xl sm:text-3xl ${factorySummary.hiddenLossRate > 2.0 ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {factorySummary.hiddenLossRate.toFixed(2)}%
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              Ext: {factorySummary.extLossRate.toFixed(1)}% | Int: {factorySummary.intLossRate.toFixed(1)}%
            </div>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-400/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>
      </div>

      {/* =====================================================================
          MODUL 1: PREPRESS NET YIELD & FIRST PASS YIELD PER LINI (5 KARTU)
      ===================================================================== */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display font-extrabold text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Modul 1: Prepress Net Yield & First Pass Yield per Lini
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Skor mutu murni Prepress: memisahkan keausan wajar mesin cetak (AUS) dan revisi eksternal dari Gross FPY.
            </p>
          </div>
          {priorityLine && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-bold animate-pulse">
              <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>Prioritas Perbaikan: Lini {priorityLine.name} ({priorityLine.netYield.toFixed(2)}% Net Yield)</span>
            </div>
          )}
        </div>

        {/* 5 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {lineFpyData.map((line) => {
            const isPriority = priorityLine?.key === line.key;
            return (
              <div
                key={line.key}
                onClick={() => {
                  if (line.activeRecords && line.activeRecords.length > 0) {
                    onOpenList?.(
                      `Audit Transaksi ${line.name}`,
                      line.key,
                      line.activeRecords.map((r) => r.raw),
                      `Menampilkan ${line.activeRecords.length} record produksi pada periode aktif`
                    );
                  }
                }}
                className={`card p-4 flex flex-col justify-between transition-all duration-200 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 relative ${
                  line.cardBorder
                } ${isPriority ? 'ring-2 ring-rose-500 dark:ring-rose-500/70 bg-rose-50/20 dark:bg-rose-950/20' : ''}`}
              >
                {/* Top Badge & Priority Tag */}
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: line.color }} />
                      {line.code}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${line.statusBadge}`}>
                      {line.status}
                    </span>
                  </div>

                  {isPriority && (
                    <div className="mb-2 px-2 py-0.5 rounded bg-rose-500 text-white text-[9px] font-extrabold uppercase tracking-wide inline-flex items-center gap-1 shadow-sm">
                      <AlertCircle className="w-3 h-3" /> Prioritas Perbaikan
                    </div>
                  )}

                  {/* Primary Metric: Prepress Net Yield */}
                  <div className="mt-1">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold block">
                      Prepress Net Yield
                    </span>
                    <div className={`font-display font-black text-2xl sm:text-3xl ${line.statusColor}`}>
                      {line.hasData ? `${line.netYield.toFixed(2)}%` : 'No Data'}
                    </div>

                    {/* Secondary Metric: Gross FPY */}
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between mt-0.5">
                      <span>Gross FPY: <strong className="text-slate-700 dark:text-slate-300">{line.grossFpy.toFixed(2)}%</strong></span>
                      {line.replaceExt > 0 && (
                        <span className="text-[9px] text-cyan-600 dark:text-cyan-400 font-semibold" title="Unit replace akibat aus cetak & revisi customer yang dikecualikan dari penilaian internal">
                          +{line.replaceExt} ext
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Volume Breakdown */}
                  <div className="grid grid-cols-3 gap-1.5 mt-3 pt-3 border-t border-slate-200/80 dark:border-slate-800 text-[10px]">
                    <div>
                      <div className="text-slate-400">Good</div>
                      <div className="font-bold text-emerald-600 dark:text-emerald-400">{line.good.toLocaleString('id-ID')}</div>
                    </div>
                    <div>
                      <div className="text-slate-400">Defect</div>
                      <div className="font-bold text-rose-600 dark:text-rose-400">{line.defect.toLocaleString('id-ID')}</div>
                    </div>
                    <div>
                      <div className="text-slate-400">Replace</div>
                      <div className="font-bold text-amber-600 dark:text-amber-400">
                        {line.replace.toLocaleString('id-ID')}
                        <span className="block text-[8px] font-normal text-slate-400">({line.replaceInt} int)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Sparkline & Trend */}
                <div className="mt-4 pt-2.5 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-semibold block">Tren 6 Bln</span>
                    <div className="flex items-center gap-1 mt-0.5">
                      {line.trendDelta >= 0 ? (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
                          <ArrowUpRight className="w-3 h-3" />+{line.trendDelta.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 flex items-center">
                          <ArrowDownRight className="w-3 h-3" />{line.trendDelta.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>
                  <MiniSparkline data={line.sparklineData} color={line.color} width={80} height={28} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =====================================================================
          MODUL 2: TOP 5 DEFECT REASON & TOP 5 REPLACE REASON
      ===================================================================== */}
      <div className="card p-5 sm:p-6 space-y-5 border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display font-extrabold text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Modul 2: Top 5 Defect Reason & Top 5 Replace Reason
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Analisis pareto penyebab kerusakan plate & penggantian plate dengan pemisahan faktor keausan cetak (AUS) vs kesalahan teknis.
            </p>
          </div>

          {/* Quick Division Filter Buttons */}
          <div className="flex items-center flex-wrap gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
            {['ALL', 'CTP', 'CTCP', 'ETCHING', 'FLEXO', 'SCREEN'].map((code) => (
              <button
                key={code}
                onClick={() => setSelectedReasonLine(code)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  selectedReasonLine === code
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {code}
              </button>
            ))}
          </div>
        </div>

        {/* Trigger Summary Breakdown (Root Cause Distribution) */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
              Kategorisasi Pemicu Masalah ({selectedReasonLine}):
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Replace Distribution */}
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mr-1">Replace:</span>
            <span className="px-2.5 py-1 rounded-md bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 font-semibold">
              Pressroom / Aus Cetak: {reasonsData.replaceCatCounts['Pressroom / Aus Cetak']} unit (
              {reasonsData.totalReplaceUnits > 0
                ? ((reasonsData.replaceCatCounts['Pressroom / Aus Cetak'] / reasonsData.totalReplaceUnits) * 100).toFixed(0)
                : 0}
              %)
            </span>
            <span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-semibold">
              Revisi Customer / File: {reasonsData.replaceCatCounts['Revisi Customer / File']} unit (
              {reasonsData.totalReplaceUnits > 0
                ? ((reasonsData.replaceCatCounts['Revisi Customer / File'] / reasonsData.totalReplaceUnits) * 100).toFixed(0)
                : 0}
              %)
            </span>
            <span className="px-2.5 py-1 rounded-md bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30 font-semibold">
              Teknis Internal Prepress: {reasonsData.replaceCatCounts['Teknis / Internal Prepress']} unit (
              {reasonsData.totalReplaceUnits > 0
                ? ((reasonsData.replaceCatCounts['Teknis / Internal Prepress'] / reasonsData.totalReplaceUnits) * 100).toFixed(0)
                : 0}
              %)
            </span>
          </div>
        </div>

        {/* 2 Panels Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Panel A: Top 5 Defect Reasons */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white">
                  Top 5 Defect Reason (Afval / Rusak)
                </h3>
              </div>
              <span className="text-xs text-rose-600 dark:text-rose-400 font-bold">
                {reasonsData.totalDefectUnits.toLocaleString('id-ID')} Total Unit Rusak
              </span>
            </div>

            {reasonsData.topDefects.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 italic">
                Tidak ada record defect reason pada lini {selectedReasonLine} untuk periode ini.
              </div>
            ) : (
              <div className="space-y-3">
                {reasonsData.topDefects.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      const matchRecs = reasonsData.filteredRecs.filter((r) => r.defectReason === item.reason);
                      onOpenList?.(
                        `Detail Defect: ${item.reason}`,
                        matchRecs[0]?.key || 'rec_ctcp',
                        matchRecs.map((r) => r.raw),
                        `Audit ${matchRecs.length} transaksi defect akibat ${item.reason}`
                      );
                    }}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 cursor-pointer hover:border-rose-400 transition"
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 font-black text-[10px] flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-100 truncate">{item.reason}</span>
                      </div>
                      <span className="font-extrabold text-rose-600 dark:text-rose-400 shrink-0 ml-2">
                        {item.units} unit ({item.pct.toFixed(1)}%)
                      </span>
                    </div>

                    {/* Progress Bar & Category Pill */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-rose-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, item.pct)}%` }}
                        />
                      </div>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded border shrink-0 ${
                          item.category === 'Operator / Human'
                            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800'
                            : item.category === 'Revisi File/Customer'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                        }`}
                      >
                        {item.category}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Panel B: Top 5 Replace Reasons */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white">
                  Top 5 Replace Reason (Ganti / Cetak Ulang)
                </h3>
              </div>
              <span className="text-xs text-amber-600 dark:text-amber-400 font-bold">
                {reasonsData.totalReplaceUnits.toLocaleString('id-ID')} Total Unit Replace
              </span>
            </div>

            {reasonsData.topReplaces.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 italic">
                Tidak ada record replace reason pada lini {selectedReasonLine} untuk periode ini.
              </div>
            ) : (
              <div className="space-y-3">
                {reasonsData.topReplaces.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      const matchRecs = reasonsData.filteredRecs.filter((r) => r.replaceReason === item.reason);
                      onOpenList?.(
                        `Detail Replace: ${item.reason}`,
                        matchRecs[0]?.key || 'rec_ctcp',
                        matchRecs.map((r) => r.raw),
                        `Audit ${matchRecs.length} transaksi replace akibat ${item.reason}`
                      );
                    }}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 cursor-pointer hover:border-amber-400 transition"
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 font-black text-[10px] flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-100 truncate">{item.reason}</span>
                      </div>
                      <span className="font-extrabold text-amber-600 dark:text-amber-400 shrink-0 ml-2">
                        {item.units} unit ({item.pct.toFixed(1)}%)
                      </span>
                    </div>

                    {/* Progress Bar & Category Pill Sesuai Permintaan User */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            item.category === 'Pressroom / Aus Cetak'
                              ? 'bg-cyan-500'
                              : item.category === 'Revisi Customer / File'
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${Math.min(100, item.pct)}%` }}
                        />
                      </div>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded border shrink-0 ${
                          item.category === 'Pressroom / Aus Cetak'
                            ? 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/30'
                            : item.category === 'Revisi Customer / File'
                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
                            : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {item.category}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =====================================================================
          MODUL 3: VOLUME & YIELD PER SHIFT (SHIFT A, B, C)
      ===================================================================== */}
      <div className="card p-5 sm:p-6 space-y-5 border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="font-display font-extrabold text-lg text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Modul 3: Volume & Yield per Shift Kerja
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Komparasi produktivitas, stabilitas mutu Prepress Net Yield (KPI Murni), serta total Gross FPY antar regu Shift A, B, dan C.
          </p>
        </div>

        {/* Insight Banner Otomatis */}
        {shiftComparison.bestShift && shiftComparison.worstShift && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-3">
              <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 block">
                  Best Practice Shift: {shiftComparison.bestShift.name} ({shiftComparison.bestShift.netYield.toFixed(2)}% Net Yield)
                </span>
                <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 mt-0.5">
                  Menghasilkan efisiensi mutu prepress tertinggi dengan Gross FPY {shiftComparison.bestShift.grossFpy.toFixed(2)}% dari total{' '}
                  {shiftComparison.bestShift.totalVolume.toLocaleString('id-ID')} unit produksi. Direkomendasikan sebagai acuan standar operasional regu lain.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-rose-900 dark:text-rose-200 block">
                  Fokus Coaching & Audit: {shiftComparison.worstShift.name} ({shiftComparison.worstShift.netYield.toFixed(2)}% Net Yield)
                </span>
                <p className="text-[11px] text-rose-800/80 dark:text-rose-300/80 mt-0.5">
                  Mencatatkan {shiftComparison.worstShift.defect} defect afval dan {shiftComparison.worstShift.replaceInt} rework teknis internal (Gross FPY: {shiftComparison.worstShift.grossFpy.toFixed(2)}%). Perlu audit prosedur handling dan verifikasi output teknis.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Comparison Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100/80 dark:bg-slate-800/80 uppercase font-bold text-slate-600 dark:text-slate-300 text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Shift Regu</th>
                <th className="py-3 px-4">Total SPK</th>
                <th className="py-3 px-4">Total Output</th>
                <th className="py-3 px-4">Good Output</th>
                <th className="py-3 px-4">Defect (Afval)</th>
                <th className="py-3 px-4">Replace (Ganti)</th>
                <th className="py-3 px-4">Prepress Net Yield</th>
                <th className="py-3 px-4">Gross FPY</th>
                <th className="py-3 px-4">Status Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
              {shiftComparison.list.map((sh, idx) => (
                <tr
                  key={idx}
                  onClick={() => {
                    if (sh.records && sh.records.length > 0) {
                      onOpenList?.(
                        `Data Produksi ${sh.name}`,
                        sh.records[0]?.key || 'rec_ctcp',
                        sh.records.map((r) => r.raw),
                        `Audit seluruh transaksi kerja ${sh.name}`
                      );
                    }
                  }}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition"
                >
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    {sh.name}
                  </td>
                  <td className="py-3 px-4">{sh.jobs.toLocaleString('id-ID')} SPK</td>
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{sh.totalVolume.toLocaleString('id-ID')}</td>
                  <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400 font-bold">{sh.good.toLocaleString('id-ID')}</td>
                  <td className="py-3 px-4 text-rose-600 dark:text-rose-400 font-bold">
                    {sh.defect.toLocaleString('id-ID')} ({sh.totalVolume > 0 ? ((sh.defect / sh.totalVolume) * 100).toFixed(1) : 0}%)
                  </td>
                  <td className="py-3 px-4 text-amber-600 dark:text-amber-400 font-bold">
                    {sh.replace.toLocaleString('id-ID')}
                    <span className="block text-[10px] font-normal text-slate-400">
                      (Ext: {sh.replaceExt} &bull; Int: {sh.replaceInt})
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`font-display font-black text-sm ${
                        sh.netYield >= 95.0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : sh.netYield >= 90.0
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {sh.totalVolume > 0 ? `${sh.netYield.toFixed(2)}%` : 'No Data'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-bold font-mono">
                    {sh.totalVolume > 0 ? `${sh.grossFpy.toFixed(2)}%` : '-'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${sh.badgeClass}`}>
                      {sh.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Visual Bar Comparison per Shift */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {shiftComparison.list.map((sh, idx) => {
            const goodPct = sh.totalVolume > 0 ? (sh.good / sh.totalVolume) * 100 : 0;
            const defectPct = sh.totalVolume > 0 ? (sh.defect / sh.totalVolume) * 100 : 0;
            const replacePct = sh.totalVolume > 0 ? (sh.replace / sh.totalVolume) * 100 : 0;

            return (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{sh.name}</span>
                  <span className="font-display font-bold text-indigo-600 dark:text-indigo-400">{sh.netYield.toFixed(2)}% Net Yield</span>
                </div>

                {/* Stacked Bar Ratio */}
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 flex overflow-hidden">
                  <div style={{ width: `${goodPct}%` }} className="bg-emerald-500 h-full" title={`Good: ${goodPct.toFixed(1)}%`} />
                  <div style={{ width: `${defectPct}%` }} className="bg-rose-500 h-full" title={`Defect: ${defectPct.toFixed(1)}%`} />
                  <div style={{ width: `${replacePct}%` }} className="bg-amber-500 h-full" title={`Replace: ${replacePct.toFixed(1)}%`} />
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> {goodPct.toFixed(1)}% Good
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> {defectPct.toFixed(1)}% Defect
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> {replacePct.toFixed(1)}% Replace
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =====================================================================
          MODUL 4: ANALISIS JOB REPLACE / ULANG & HIDDEN CAPACITY LOSS (PECAH DUA BEBAN)
      ===================================================================== */}
      <div className="card p-5 sm:p-6 space-y-5 border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="font-display font-extrabold text-lg text-slate-900 dark:text-white flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Modul 4: Analisis Job Replace / Ulang & Hidden Capacity Loss
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Evaluasi beban kapasitas produksi prepress yang terserap untuk penggantian plate, dipisahkan antara keausan cetak/revisi eksternal vs kesalahan internal.
          </p>
        </div>

        {/* 3 KPI Cards Ringkasan Replace */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Rasio Job Replace / Ulang
            </span>
            <div className="mt-1 font-display font-black text-2xl text-amber-600 dark:text-amber-400">
              {replaceAnalysis.repeatRate.toFixed(1)}%
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              {replaceAnalysis.repeatJobsCount.toLocaleString('id-ID')} dari {replaceAnalysis.totalJobs.toLocaleString('id-ID')} SPK mengalami pengerjaan ulang.
            </p>
          </div>

          {/* Hidden Capacity Loss dengan Pemecahan Dua Komponen Sesuai Permintaan */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Hidden Capacity Loss
              </span>
              <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                Total: {factorySummary.replace} unit
              </span>
            </div>
            <div className="font-display font-black text-2xl text-rose-600 dark:text-rose-400">
              {factorySummary.hiddenLossRate.toFixed(2)}%
            </div>

            {/* Segmented Progress Bar Eksternal vs Internal */}
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 flex overflow-hidden">
              <div
                style={{ width: `${factorySummary.replace > 0 ? (factorySummary.replaceExt / factorySummary.replace) * 100 : 0}%` }}
                className="bg-cyan-500 h-full"
                title={`Eksternal: ${factorySummary.replaceExt} unit`}
              />
              <div
                style={{ width: `${factorySummary.replace > 0 ? (factorySummary.replaceInt / factorySummary.replace) * 100 : 0}%` }}
                className="bg-rose-500 h-full"
                title={`Internal: ${factorySummary.replaceInt} unit`}
              />
            </div>

            {/* Pemecahan Dua Rincian Beban */}
            <div className="space-y-1 pt-1 text-[11px]">
              <div className="flex items-center justify-between text-cyan-700 dark:text-cyan-300 font-semibold">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-500 inline-block" />
                  Beban Aus Cetak & Revisi Customer:
                </span>
                <span>
                  {factorySummary.replaceExt} unit ({factorySummary.extLossRate.toFixed(2)}%)
                </span>
              </div>
              <div className="flex items-center justify-between text-rose-700 dark:text-rose-300 font-semibold">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                  Beban Rework Internal Prepress:
                </span>
                <span>
                  {factorySummary.replaceInt} unit ({factorySummary.intLossRate.toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Replace Breakdown per Lini
            </span>
            <div className="flex flex-col gap-1.5 mt-2">
              {replaceAnalysis.replacePerLine.map((l) => (
                <div
                  key={l.key}
                  className="flex items-center justify-between text-[11px] px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                >
                  <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: l.color }} />
                    {l.code}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">{l.units} unit</span>
                    <span className="text-[10px] text-slate-400">(Ext: {l.ext} &bull; Int: {l.int})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabel Top Repeat Jobs (Masalah Kronis) */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              Top Repeat Jobs: Order Paling Sering Diulang (Masalah Kronis)
            </h3>
            <span className="text-xs text-slate-400">Top 10 Order</span>
          </div>

          {replaceAnalysis.topRepeatJobs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 italic rounded-xl border border-dashed border-slate-300 dark:border-slate-800">
              Tidak ada repeat job kronis yang terdeteksi pada periode filter ini.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100/80 dark:bg-slate-800/80 uppercase font-bold text-slate-600 dark:text-slate-300 text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-3">No</th>
                    <th className="py-3 px-3">Nama Order / Job</th>
                    <th className="py-3 px-3">No. Job / SPK</th>
                    <th className="py-3 px-3">Divisi</th>
                    <th className="py-3 px-3">Frekuensi Ulang</th>
                    <th className="py-3 px-3">Total Qty Replace</th>
                    <th className="py-3 px-3">Kategori</th>
                    <th className="py-3 px-3">Alasan Utama</th>
                    <th className="py-3 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                  {replaceAnalysis.topRepeatJobs.map((job, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                      <td className="py-2.5 px-3 font-bold text-slate-500">#{idx + 1}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white max-w-xs truncate">
                        {job.jobName}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 font-mono">{job.jobNo || '-'}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                          {job.lineCode}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                          {job.count}x Ulang
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-rose-600 dark:text-rose-400">
                        {job.totalReplace} unit
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                            job.category === 'Pressroom / Aus Cetak'
                              ? 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/30'
                              : job.category === 'Revisi Customer / File'
                              ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
                              : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30'
                          }`}
                        >
                          {job.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                        {job.mainReason}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => {
                            onOpenList?.(
                              `Audit Repeat Job: ${job.jobName}`,
                              job.lineKey,
                              job.records.map((r) => r.raw),
                              `Daftar riwayat ${job.records.length} transaksi order berulang`
                            );
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          Audit &rarr;
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* =====================================================================
          MODUL 5: TREN BULANAN — VOLUME VS PREPRESS NET YIELD & GROSS FPY
      ===================================================================== */}
      <div className="card p-5 sm:p-6 space-y-5 border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="badge bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800 font-bold">
                HISTORIS MULTI-BULAN
              </span>
              <span className="text-xs text-slate-400">&bull; Lintas Periode (Semua Record Tersedia)</span>
            </div>
            <h2 className="font-display font-extrabold text-lg text-slate-900 dark:text-white flex items-center gap-2 mt-1">
              <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Modul 5: Tren Bulanan — Volume Produksi vs Prepress Net Yield (%) & Gross FPY
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Grafik combo korelasi antara output pabrik (Bar), Prepress Net Yield (Garis Hijau), dan Gross FPY (Garis Putus-Putus).
            </p>
          </div>

          {/* Year to Date Badge */}
          {monthlyTrendData.ytd.hasPrevYear && (
            <div className="text-left sm:text-right p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs">
              <span className="text-[10px] text-slate-400 block font-semibold">YTD Net Yield Growth</span>
              <div className="font-bold text-slate-800 dark:text-slate-100">
                {monthlyTrendData.ytd.currentYear}: {monthlyTrendData.ytd.currNet.toFixed(1)}% vs {monthlyTrendData.ytd.prevYear}: {monthlyTrendData.ytd.prevNet.toFixed(1)}%
              </div>
            </div>
          )}
        </div>

        {/* Combo Chart */}
        <div className="h-80 w-full relative">
          <Chart
            type="bar"
            plugins={[targetThresholdLinesPlugin]}
            data={{
              labels: monthlyTrendData.labels,
              datasets: [
                {
                  type: 'line',
                  label: 'Prepress Net Yield (%)',
                  data: monthlyTrendData.netYields,
                  yAxisID: 'yFpy',
                  borderColor: '#10b981',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  borderWidth: 3,
                  pointRadius: 5,
                  pointBackgroundColor: '#10b981',
                  pointBorderColor: '#ffffff',
                  pointBorderWidth: 2,
                  pointHoverRadius: 7,
                  tension: 0.35,
                  order: 1
                },
                {
                  type: 'line',
                  label: 'Gross FPY (%)',
                  data: monthlyTrendData.grossFpys,
                  yAxisID: 'yFpy',
                  borderColor: '#94a3b8',
                  borderDash: [5, 5],
                  borderWidth: 2,
                  pointRadius: 3,
                  pointBackgroundColor: '#94a3b8',
                  pointHoverRadius: 5,
                  tension: 0.35,
                  order: 2
                },
                {
                  type: 'bar',
                  label: 'Volume Produksi (Unit)',
                  data: monthlyTrendData.volumes,
                  yAxisID: 'yVolume',
                  backgroundColor: 'rgba(99, 102, 241, 0.75)',
                  hoverBackgroundColor: 'rgba(79, 70, 229, 0.9)',
                  borderRadius: 6,
                  barPercentage: 0.55,
                  order: 3
                }
              ]
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              interaction: {
                mode: 'index',
                intersect: false
              },
              scales: {
                x: {
                  ticks: { color: ct.tickColor, font: { size: 11, weight: 'bold' } },
                  grid: { color: ct.gridColor }
                },
                yVolume: {
                  type: 'linear',
                  position: 'left',
                  title: {
                    display: true,
                    text: 'Volume Produksi (Unit / Plate)',
                    color: ct.tickColor,
                    font: { size: 10, weight: 'bold' }
                  },
                  ticks: { color: ct.tickColor },
                  grid: { color: ct.gridColor }
                },
                yFpy: {
                  type: 'linear',
                  position: 'right',
                  min: 75,
                  max: 100,
                  title: {
                    display: true,
                    text: 'Prepress Yield (%)',
                    color: '#10b981',
                    font: { size: 10, weight: 'bold' }
                  },
                  ticks: {
                    color: ct.tickColor,
                    callback: (val) => `${val}%`
                  },
                  grid: { drawOnChartArea: false }
                }
              },
              plugins: {
                legend: {
                  position: 'top',
                  labels: {
                    color: ct.legendColor,
                    font: { size: 11, weight: 'bold' },
                    usePointStyle: true,
                    padding: 15
                  }
                },
                tooltip: {
                  backgroundColor: '#0f172a',
                  titleColor: '#ffffff',
                  bodyColor: '#f8fafc',
                  padding: 12,
                  cornerRadius: 8,
                  callbacks: {
                    label: (context) => {
                      if (context.dataset.label.includes('Net Yield')) {
                        return `Prepress Net Yield: ${context.parsed.y.toFixed(2)}% (Murni Prepress)`;
                      }
                      if (context.dataset.label.includes('Gross FPY')) {
                        return `Gross FPY: ${context.parsed.y.toFixed(2)}% (Total Kapasitas)`;
                      }
                      return `Volume Produksi: ${context.parsed.y.toLocaleString('id-ID')} unit`;
                    }
                  }
                }
              }
            }}
          />
        </div>

        {/* Deteksi Anomali Otomatis (Executive Insight Cards) */}
        <div>
          <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 mb-2.5">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            Deteksi Anomali Otomatis & Catatan Manajerial:
          </h3>

          {monthlyTrendData.anomalies.length === 0 ? (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
              Performa stabil: Tidak ada fluktuasi tajam abnormal antara volume dan Prepress Net Yield pada histori beberapa bulan terakhir.
            </div>
          ) : (
            <div className="space-y-2">
              {monthlyTrendData.anomalies.map((anom, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border flex items-start gap-3 transition ${
                    anom.level === 'critical'
                      ? 'bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/60 dark:border-rose-500/50 dark:text-rose-200'
                      : anom.level === 'warning'
                      ? 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/60 dark:border-amber-500/50 dark:text-amber-200'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/60 dark:border-emerald-500/50 dark:text-emerald-200'
                  }`}
                >
                  {anom.level === 'success' ? (
                    <TrendingUp className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                  ) : anom.level === 'warning' ? (
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  ) : (
                    <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-xs sm:text-sm">{anom.title}</div>
                    <div className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      {anom.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
