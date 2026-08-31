import React from 'react';
import { Menu, RotateCcw, Printer, Calendar } from 'lucide-react';
import { iso, parseDateVal } from '../../utils/formatters';

export default function Header({
  period,
  onPeriodChange,
  onReset,
  onOpenPrint,
  onToggleSidebar
}) {
  const fromStr = period?.from ? iso(period.from) : '';
  const toStr = period?.to ? iso(period.to) : '';

  const handleDateChange = (type, valStr) => {
    if (!onPeriodChange) return;
    const parsed = parseDateVal(valStr);
    onPeriodChange((prev) => ({
      ...prev,
      [type]: parsed
    }));
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 lg:px-6 py-3 no-print">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition border border-slate-200 dark:border-slate-700"
            title="Menu Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-display font-extrabold text-base lg:text-lg text-slate-900 dark:text-white leading-tight">
              PRISM
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Integrated System & Monitoring
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="date"
              value={fromStr}
              onChange={(e) => handleDateChange('from', e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none w-28"
            />
            <span className="text-slate-400 text-xs">s/d</span>
            <input
              type="date"
              value={toStr}
              onChange={(e) => handleDateChange('to', e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none w-28"
            />
          </div>

          <button
            onClick={onReset}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition border border-slate-200 dark:border-slate-700 cursor-pointer"
            title="Muat Ulang Data"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenPrint}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs py-2 px-3 font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>
    </header>
  );
}