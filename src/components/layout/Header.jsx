import React from 'react';
import { Menu, RotateCcw, Calendar, Sun, Moon } from 'lucide-react';
import { iso, parseDateVal, DATE_PRESETS, getActivePresetId } from '../../utils/formatters';

export default function Header({
  period,
  onPeriodChange,
  onReset,
  onToggleSidebar,
  theme = 'dark',
  onToggleTheme
}) {
  const fromStr = period?.from ? iso(period.from) : '';
  const toStr = period?.to ? iso(period.to) : '';
  const activePreset = getActivePresetId(period);

  const handleDateChange = (type, valStr) => {
    if (!onPeriodChange) return;
    const parsed = parseDateVal(valStr);
    onPeriodChange((prev) => ({
      ...prev,
      [type]: parsed
    }));
  };

  const handleSelectPreset = (preset) => {
    if (!onPeriodChange) return;
    const range = preset.getRange();
    onPeriodChange(range);
  };

  return (
    <header
      className="sticky top-0 z-30 bg-[#0b1329]/95 dark:bg-[#0b1329]/95 border-b border-slate-700/70 px-3 sm:px-6 py-2.5 sm:py-3 no-print transition-colors shadow-lg"
      style={{
        WebkitBackdropFilter: 'blur(20px)',
        backdropFilter: 'blur(20px)'
      }}
    >
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 lg:gap-4">
        
        {/* Left Side: Mobile Hamburger & Title & Theme Switch */}
        <div className="flex items-center justify-between gap-2.5">
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
              <p className="text-[10px] sm:text-[11px] text-cyan-400 font-semibold truncate max-w-[200px] sm:max-w-none">
                Integrated System & Monitoring
              </p>
            </div>
          </div>

          {/* Mobile Right Controls: Theme Toggle & Reload */}
          <div className="flex items-center gap-1.5 lg:hidden">
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-xl bg-slate-900/90 text-amber-300 hover:text-amber-200 hover:bg-slate-800 transition border border-slate-700/80"
              title={theme === 'dark' ? 'Ganti ke Tema Terang (Light Mode)' : 'Ganti ke Tema Gelap (Dark Mode)'}
              type="button"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
            </button>
            <button
              onClick={onReset}
              className="p-2 rounded-xl bg-slate-900/90 text-slate-200 hover:text-cyan-300 hover:bg-slate-800 transition border border-slate-700/80"
              title="Muat Ulang Data"
              type="button"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Side: Presets, Date Filter & Controls */}
        <div className="flex items-center justify-between lg:justify-end gap-2 flex-wrap sm:flex-nowrap">
          
          {/* Quick Date Presets (Hari Ini, 7 Hari, 30 Hari, Bulan Ini, Bulan Lalu) */}
          <div
            className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-700/80 overflow-x-auto max-w-full shadow-inner"
            style={{
              WebkitBackdropFilter: 'blur(12px)',
              backdropFilter: 'blur(12px)',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {DATE_PRESETS.map((p) => {
              const isActive = activePreset === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPreset(p)}
                  className={`px-2 sm:px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all whitespace-nowrap select-none ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/30 to-indigo-500/30 text-cyan-200 border border-cyan-400/50 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-transparent'
                  }`}
                  title={p.fullLabel}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Date Picker Custom Range */}
          <div
            className="flex items-center gap-1 bg-slate-900/90 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-700/80 flex-1 sm:flex-none justify-center shadow-inner"
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
              className="bg-transparent text-[10px] sm:text-xs font-semibold text-slate-100 outline-none w-[84px] sm:w-28 text-center cursor-pointer [color-scheme:dark]"
            />
            <span className="text-slate-500 text-xs font-bold px-0.5">–</span>
            <input
              type="date"
              value={toStr}
              onChange={(e) => handleDateChange('to', e.target.value)}
              aria-label="Tanggal Akhir Periode"
              className="bg-transparent text-[10px] sm:text-xs font-semibold text-slate-100 outline-none w-[84px] sm:w-28 text-center cursor-pointer [color-scheme:dark]"
            />
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-1.5 shrink-0">
            {/* Theme Toggle (Dark / Light) */}
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-xl bg-slate-900/90 text-amber-300 hover:text-amber-200 hover:bg-slate-800 transition border border-slate-700/80 flex items-center gap-1.5"
              title={theme === 'dark' ? 'Ganti ke Tema Terang (Light Mode)' : 'Ganti ke Tema Gelap (Dark Mode)'}
              type="button"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-semibold text-slate-300">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-semibold text-slate-700">Dark</span>
                </>
              )}
            </button>

            {/* Reload Data */}
            <button
              onClick={onReset}
              className="p-2 rounded-xl bg-slate-900/90 text-slate-200 hover:text-cyan-300 hover:bg-slate-800 transition border border-slate-700/80"
              title="Muat Ulang Data"
              type="button"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </header>
  );
}