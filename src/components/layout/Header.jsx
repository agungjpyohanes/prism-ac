import React from 'react';
import { Menu, RotateCcw, Printer, Calendar, Moon, Sun } from 'lucide-react';
import { iso, parseDateVal } from '../../utils/formatters';

export default function Header({
  period,
  onPeriodChange,
  onReset,
  onOpenPrint,
  onToggleSidebar,
  theme,
  onToggleTheme
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
    <header className="sticky top-0 z-30 bg-[#070c1e]/70 dark:bg-[#070c1e]/70 light:bg-white/80 backdrop-blur-xl border-b border-slate-700/60 light:border-slate-200 px-4 lg:px-6 py-3 no-print transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-3">
        
        {/* Left Side Branding */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-300 dark:text-slate-300 light:text-slate-700 hover:bg-white/10 light:hover:bg-slate-100 transition border border-slate-700 light:border-slate-300"
            title="Menu Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-display font-black text-base lg:text-lg text-white dark:text-white light:text-slate-900 leading-tight">
              PRISM
            </h1>
            <p className="text-[11px] text-cyan-400 dark:text-cyan-400 light:text-indigo-600 font-semibold">
              Prepress Integrated System & Monitoring
            </p>
          </div>
        </div>

        {/* Right Side Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Date Picker Range */}
          <div className="flex items-center gap-1.5 bg-[#0b1329] dark:bg-[#0b1329] light:bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-700 light:border-slate-300">
            <Calendar className="w-4 h-4 text-cyan-400 light:text-indigo-600 shrink-0" />
            <input
              type="date"
              value={fromStr}
              onChange={(e) => handleDateChange('from', e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-200 dark:text-slate-200 light:text-slate-800 outline-none w-28"
            />
            <span className="text-slate-500 text-xs font-bold">s/d</span>
            <input
              type="date"
              value={toStr}
              onChange={(e) => handleDateChange('to', e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-200 dark:text-slate-200 light:text-slate-800 outline-none w-28"
            />
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl bg-[#0b1329] dark:bg-[#0b1329] light:bg-slate-100 text-amber-400 dark:text-amber-400 light:text-slate-700 hover:scale-105 transition border border-slate-700 light:border-slate-300"
            title={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>

          {/* Reload Data */}
          <button
            onClick={onReset}
            className="p-2 rounded-xl bg-[#0b1329] dark:bg-[#0b1329] light:bg-slate-100 text-slate-300 light:text-slate-700 hover:text-cyan-400 transition border border-slate-700 light:border-slate-300"
            title="Muat Ulang Data"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Print Button */}
          <button
            onClick={onOpenPrint}
            className="btn-primary text-xs py-2 px-3 font-semibold flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>
    </header>
  );
}