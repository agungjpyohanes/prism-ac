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
    <header
      className="sticky top-0 z-30 bg-[#0b1329]/90 border-b border-slate-700/60 px-3 sm:px-6 py-2.5 sm:py-3 no-print transition-colors"
      style={{
        WebkitBackdropFilter: 'blur(20px)',
        backdropFilter: 'blur(20px)'
      }}
    >
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-4">
        
        {/* Left Side: Mobile Hamburger & Title */}
        <div className="flex items-center justify-between sm:justify-start gap-2.5">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-xl text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 transition border border-slate-700/80 shrink-0"
              title="Menu Navigasi"
              type="button"
            >
              <Menu className="w-5 h-5 text-cyan-300" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-black text-base sm:text-lg text-white leading-tight tracking-wide">
                  PRISM
                </h1>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  V2.5
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-cyan-400 font-semibold truncate max-w-[220px] sm:max-w-none">
                Prepress Integrated System & Monitoring
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Date Filter & Controls */}
        <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap sm:flex-nowrap">
          {/* Date Picker Range */}
          <div
            className="flex items-center gap-1 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-700/80 flex-1 sm:flex-none justify-center shadow-inner"
            style={{
              WebkitBackdropFilter: 'blur(12px)',
              backdropFilter: 'blur(12px)'
            }}
          >
            <Calendar className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <input
              type="date"
              value={fromStr}
              onChange={(e) => handleDateChange('from', e.target.value)}
              aria-label="Tanggal Mulai Periode"
              className="bg-transparent text-[11px] sm:text-xs font-semibold text-slate-100 outline-none w-[92px] sm:w-28 text-center cursor-pointer [color-scheme:dark]"
            />
            <span className="text-slate-500 text-xs font-bold px-0.5">–</span>
            <input
              type="date"
              value={toStr}
              onChange={(e) => handleDateChange('to', e.target.value)}
              aria-label="Tanggal Akhir Periode"
              className="bg-transparent text-[11px] sm:text-xs font-semibold text-slate-100 outline-none w-[92px] sm:w-28 text-center cursor-pointer [color-scheme:dark]"
            />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Reload Data */}
            <button
              onClick={onReset}
              className="p-2 rounded-xl bg-slate-900/90 text-slate-200 hover:text-cyan-300 hover:bg-slate-800 transition border border-slate-700/80"
              title="Muat Ulang Data"
              type="button"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Print Button */}
            <button
              onClick={onOpenPrint}
              type="button"
              className="btn-primary text-xs py-1.5 sm:py-2 px-3 sm:px-4 font-semibold flex items-center gap-1.5 rounded-xl shadow-md"
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