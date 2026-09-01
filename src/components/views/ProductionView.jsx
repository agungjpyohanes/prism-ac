import React, { useMemo } from 'react';
import { SHEETS, PROD_KEYS } from '../../constants/schema';
import { parseDateVal, num, cell, startOfDay, getChartTheme } from '../../utils/formatters';
import CountUp from '../common/CountUp';
import { Bar } from 'react-chartjs-2';
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
import { Check, AlertTriangle, RotateCcw, Layers, Percent } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function ProductionView({
  tabKey = 'rec_ctcp',
  onTabChange,
  data,
  period,
  onSelectRow,
  onOpenList,
  onOpenMetric,
  onOpenDayModal,
  onGoToData
}) {
  const activeKey = tabKey || 'rec_ctcp';
  const cfg = SHEETS[activeKey] || SHEETS.rec_ctcp;
  const rawRows = data[activeKey] || [];

  const rows = useMemo(() => {
    return rawRows.filter((r) => {
      const idVal = cell(r, cfg.i.id).trim();
      const jopVal = cell(r, cfg.i.jop).trim();
      const noJopVal = cell(r, cfg.i.nojop).trim();
      if (!idVal || (!jopVal && !noJopVal)) return false;

      const d = parseDateVal(r[cfg.i.date]);
      if (!d) return true;
      const from = period?.from ? startOfDay(period.from).getTime() : null;
      const to = period?.to ? new Date(period.to).setHours(23, 59, 59, 999) : null;
      if (from && d.getTime() < from) return false;
      if (to && d.getTime() > to) return false;
      return true;
    });
  }, [rawRows, cfg, period]);

  const m = useMemo(() => {
    let baik = 0, rusak = 0, ganti = 0;
    rows.forEach((r) => {
      baik += num(r[cfg.i.baik]);
      rusak += num(r[cfg.i.rusak]);
      ganti += num(r[cfg.i.ganti]);
    });
    const pakai = baik + rusak;
    const pct = pakai > 0 ? (rusak / pakai) * 100 : 0;
    return { baik, rusak, ganti, pakai, pct };
  }, [rows, cfg]);

  const cards = [
    { metric: 'baik', label: cfg.cards?.baik || 'Qty Good', val: m.baik, icon: Check, color: 'text-emerald-400' },
    { metric: 'rusak', label: cfg.cards?.rusak || 'Qty Defect', val: m.rusak, icon: AlertTriangle, color: 'text-rose-400' },
    { metric: 'ganti', label: cfg.cards?.ganti || 'Qty Replace', val: m.ganti, icon: RotateCcw, color: 'text-amber-400' },
    { metric: 'pakai', label: cfg.cards?.pakai || 'Total Pakai', val: m.pakai, icon: Layers, color: 'text-cyan-300' },
    { metric: 'pct', label: 'Defect Rate', val: m.pct, icon: Percent, color: m.pct > 1.0 ? 'text-rose-400' : 'text-cyan-300', pct: true }
  ];

  // Daily Data
  const daily = useMemo(() => {
    const map = new Map();
    rows.forEach((r) => {
      const d = parseDateVal(r[cfg.i.date]);
      if (!d) return;
      const k = startOfDay(d).getTime();
      const e = map.get(k) || { baik: 0, rusak: 0 };
      e.baik += num(r[cfg.i.baik]);
      e.rusak += num(r[cfg.i.rusak]);
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

  return (
    <div className="space-y-5 anim-in">
      {/* Pill Selector 5 Lini + Tombol Print */}
      <div className="card p-4 flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 max-w-full" style={{ WebkitOverflowScrolling: 'touch' }}>
          {PROD_KEYS.map((k) => {
            const itemCfg = SHEETS[k];
            const isActive = activeKey === k;
            return (
              <button
                key={k}
                type="button"
                onClick={() => onTabChange?.(k)}
                className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'btn-primary text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] scale-105'
                    : 'bg-slate-800/80 border border-slate-700 text-slate-300 hover:bg-slate-700/80 hover:text-white'
                }`}
              >
                {itemCfg.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => onGoToData?.(activeKey)}
            className="btn-primary text-xs py-2 px-4 rounded-xl shadow-md flex items-center gap-1.5"
          >
            <span>Lihat Tabel Data {cfg.label}</span>
            <span>&rarr;</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Glow */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <button
              key={c.metric}
              type="button"
              onClick={() => onOpenMetric(activeKey, c.metric, rows)}
              className="card p-4 sm:p-5 text-left cursor-pointer hover:scale-[1.02] flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">{c.label}</span>
                <Icon className={`w-4 h-4 ${c.color}`} />
              </div>
              <div className={`mt-2 font-display font-black text-2xl sm:text-3xl ${c.color} tracking-tight`}>
                <CountUp target={c.val} isPct={c.pct} />
              </div>
              <div className="text-[10px] text-slate-400 mt-1">{c.pct ? 'Target: ≤ 1.0%' : `${cfg.unit} diproses`}</div>
            </button>
          );
        })}
      </div>

      {/* Daily Chart */}
      <div className="card p-5">
        <div className="flex justify-between items-center flex-wrap gap-2 mb-3">
          <h3 className="card-title">Tren Harian Output {cfg.label}</h3>
          <span className="text-[10px] text-cyan-400 font-mono">Klik batang grafik untuk rincian harian</span>
        </div>
        <div className="h-72">
          {(() => {
            const ct = getChartTheme();
            return (
              <Bar
                data={{
                  labels: daily.labels,
                  datasets: [
                    { label: `${cfg.unit} Baik`, data: daily.baik, backgroundColor: ct.goodColor, stack: 's', borderRadius: 6 },
                    { label: `${cfg.unit} Defect`, data: daily.rusak, backgroundColor: ct.defectColor, stack: 's', borderRadius: 6 }
                  ]
                }}
                options={{
                  maintainAspectRatio: false,
                  scales: {
                    x: { stacked: true, ticks: { color: ct.tickColor }, grid: { color: ct.gridColor } },
                    y: { stacked: true, beginAtZero: true, ticks: { color: ct.tickColor }, grid: { color: ct.gridColor } }
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
                    if (!els.length) return;
                    onOpenDayModal(activeKey, daily.keys[els[0].index]);
                  }
                }}
              />
            );
          })()}
        </div>
      </div>
    </div>
  );
}