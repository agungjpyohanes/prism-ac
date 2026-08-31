import React, { useMemo, useState } from 'react';
import { SHEETS, PROD_KEYS, JOP_CATS } from '../../constants/schema';
import { parseDateVal, num, cell, jopCat, fmtPeriodRange, startOfDay } from '../../utils/formatters';
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
import { CheckCircle2, AlertTriangle, RotateCcw, Layers, Percent, Award, Printer } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function ProcessAnalyticsView({
  tabKey = 'rec_ctcp',
  onTabChange,
  data,
  period,
  onOpenList,
  onOpenPrint
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

  const kpi = useMemo(() => {
    let good = 0, reject = 0, replace = 0;
    rows.forEach((r) => {
      good += num(r[cfg.i.baik]);
      reject += num(r[cfg.i.rusak]);
      replace += num(r[cfg.i.ganti]);
    });
    const output = good + reject;
    const lossRate = output > 0 ? (reject / output) * 100 : 0;
    const perfScore = output > 0 ? Math.max(0, 100 - lossRate * 10) : 100;
    return { good, reject, replace, output, lossRate, perfScore };
  }, [rows, cfg]);

  return (
    <div className="space-y-5 anim-in">
      {/* Pill Selector Lini + Print */}
      <div className="card p-4 flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {PROD_KEYS.map((k) => {
            const itemCfg = SHEETS[k];
            const isActive = activeKey === k;
            return (
              <button
                key={k}
                type="button"
                onClick={() => onTabChange?.(k)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  isActive
                    ? 'btn-primary text-white shadow-[0_0_15px_rgba(6,182,212,0.5)] scale-105'
                    : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                {itemCfg.label}
              </button>
            );
          })}
        </div>

        <button
          onClick={onOpenPrint || (() => window.print())}
          className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print Analitik {cfg.label}</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <button
          onClick={() => onOpenList?.(`Total Output ${cfg.label}`, activeKey, rows)}
          className="card p-4 text-left cursor-pointer"
        >
          <span className="text-[10px] font-bold uppercase text-slate-400">TOTAL OUTPUT</span>
          <div className="mt-1 font-display font-black text-2xl text-cyan-300">{kpi.output.toLocaleString('id-ID')}</div>
        </button>
        <button
          onClick={() => onOpenList?.(`Good Output ${cfg.label}`, activeKey, rows.filter((r) => num(r[cfg.i.baik]) > 0))}
          className="card p-4 text-left cursor-pointer"
        >
          <span className="text-[10px] font-bold uppercase text-slate-400">GOOD</span>
          <div className="mt-1 font-display font-black text-2xl text-emerald-400">{kpi.good.toLocaleString('id-ID')}</div>
        </button>
        <button
          onClick={() => onOpenList?.(`Reject ${cfg.label}`, activeKey, rows.filter((r) => num(r[cfg.i.rusak]) > 0))}
          className="card p-4 text-left cursor-pointer"
        >
          <span className="text-[10px] font-bold uppercase text-slate-400">DEFECT</span>
          <div className="mt-1 font-display font-black text-2xl text-rose-400">{kpi.reject.toLocaleString('id-ID')}</div>
        </button>
        <button
          onClick={() => onOpenList?.(`Replace ${cfg.label}`, activeKey, rows.filter((r) => num(r[cfg.i.ganti]) > 0))}
          className="card p-4 text-left cursor-pointer"
        >
          <span className="text-[10px] font-bold uppercase text-slate-400">REPLACE</span>
          <div className="mt-1 font-display font-black text-2xl text-amber-400">{kpi.replace.toLocaleString('id-ID')}</div>
        </button>
        <div className="card p-4 text-left">
          <span className="text-[10px] font-bold uppercase text-slate-400">DEFECT RATE</span>
          <div className={`mt-1 font-display font-black text-2xl ${kpi.lossRate > 1.0 ? 'text-rose-400' : 'text-cyan-300'}`}>
            {kpi.lossRate.toFixed(1)}%
          </div>
        </div>
        <div className="card p-4 text-left">
          <span className="text-[10px] font-bold uppercase text-slate-400">SCORE</span>
          <div className="mt-1 font-display font-black text-2xl text-indigo-300">{kpi.perfScore.toFixed(0)}</div>
        </div>
      </div>
    </div>
  );
}