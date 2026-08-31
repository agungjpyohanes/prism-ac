import React from 'react';
import { Menu, RotateCcw, Printer, Calendar, Sun, Moon } from 'lucide-react';
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
    <header className="sticky top-0 z-30 bg-[#070b1a]/85 dark:bg-[#070b1a]/85 light:bg-white/90 backdrop-blur-xl border-b border-white/10 light:border-slate-200 px-3 sm:px-6 py-2.5 sm:py-3 no-print transition-colors">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-4">
        
        {/* Sisi Kiri: Tombol Hamburger Mobile & Title */}
        <div className="flex items-center justify-between sm:justify-start gap-2.5">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-2xl text-slate-300 light:text-slate-700 bg-white/5 light:bg-slate-100 hover:bg-white/10 transition border border-white/10 light:border-slate-300 shrink-0"
              title="Menu Navigasi"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-display font-black text-sm sm:text-base lg:text-lg text-white light:text-slate-900 leading-tight">
                PRISM
              </h1>
              <p className="text-[10px] sm:text-[11px] text-cyan-400 light:text-indigo-600 font-semibold truncate max-w-[200px] sm:max-w-none">
                Integrated System & Monitoring
              </p>
            </div>
          </div>

          {/* Quick theme toggle button di mobile kanan atas */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="sm:hidden p-2 rounded-full bg-slate-950/60 light:bg-slate-100 text-amber-400 hover:text-amber-300 transition border border-white/10 light:border-slate-300"
            title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>
        </div>

        {/* Sisi Kanan: Date Filter & Action Controls */}
        <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap">
          {/* Date Picker Range (Auto-adjust di HP) */}
          <div className="flex items-center gap-1 bg-slate-950/60 light:bg-slate-100 px-2.5 sm:px-3.5 py-1.5 rounded-full border border-cyan-500/30 light:border-slate-300 backdrop-blur-md flex-1 sm:flex-none justify-center">
            <Calendar className="w-3.5 h-3.5 text-cyan-400 light:text-indigo-600 shrink-0" />
            <input
              type="date"
              value={fromStr}
              onChange={(e) => handleDateChange('from', e.target.value)}
              className="bg-transparent text-[11px] sm:text-xs font-semibold text-slate-200 light:text-slate-800 outline-none w-[90px] sm:w-28 text-center"
            />
            <span className="text-slate-500 text-[10px] sm:text-xs font-bold px-0.5">-</span>
            <input
              type="date"
              value={toStr}
              onChange={(e) => handleDateChange('to', e.target.value)}
              className="bg-transparent text-[11px] sm:text-xs font-semibold text-slate-200 light:text-slate-800 outline-none w-[90px] sm:w-28 text-center"
            />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Theme Toggle (Desktop/Tablet) */}
            <button
              type="button"
              onClick={onToggleTheme}
              className="hidden sm:flex p-2 rounded-full bg-slate-950/60 light:bg-slate-100 text-amber-400 hover:text-amber-300 transition border border-white/10 light:border-slate-300 backdrop-blur-md"
              title={theme === 'dark' ? 'Mode Terang (Light)' : 'Mode Gelap (Dark)'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>

            {/* Reload Data */}
            <button
              onClick={onReset}
              className="p-2 rounded-full bg-slate-950/60 light:bg-slate-100 text-slate-300 light:text-slate-700 hover:text-cyan-300 transition border border-white/10 light:border-slate-300 backdrop-blur-md"
              title="Muat Ulang Data"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Print Button */}
            <button
              onClick={onOpenPrint}
              className="btn-primary text-xs py-1.5 sm:py-2 px-3 sm:px-4 font-semibold flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print / PDF</span>
              <span className="sm:hidden">Print</span>
            </button>
          </div>
        </div>

      </div>
    </header>
  );
}