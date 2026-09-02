import React, { useState, useRef, useEffect } from 'react';
import { Menu, RotateCcw, Calendar, Sun, Moon, ChevronDown, Check, X } from 'lucide-react';
import { iso, parseDateVal, DATE_PRESETS, getActivePresetId, fmtDDMMYYYY, startOfDay, endOfDay } from '../../utils/formatters';
import DatePickerInput from '../ui/DatePickerInput';

export default function Header({
  period,
  onPeriodChange,
  onReset,
  onToggleSidebar,
  theme = 'dark',
  onToggleTheme
}) {
  const [isOpenPicker, setIsOpenPicker] = useState(false);
  const popoverRef = useRef(null);

  const fromStr = period?.from ? iso(period.from) : '';
  const toStr = period?.to ? iso(period.to) : '';
  const activePreset = getActivePresetId(period);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpenPicker(false);
      }
    };
    if (isOpenPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpenPicker]);

  const handleDateChange = (type, valStr) => {
    if (!onPeriodChange) return;
    const parsed = parseDateVal(valStr);
    onPeriodChange((prev) => ({
      ...prev,
      [type]: type === 'to' ? endOfDay(parsed) : startOfDay(parsed)
    }));
  };

  const handleSelectPreset = (preset) => {
    if (!onPeriodChange) return;
    const range = preset.getRange();
    onPeriodChange(range);
  };

  const dateRangeDisplay = `${fmtDDMMYYYY(period?.from)} – ${fmtDDMMYYYY(period?.to)}`;

  return (
    <header
      className="sticky top-0 z-40 bg-white/95 dark:bg-[#0f172a]/95 border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 py-2.5 sm:py-3 no-print transition-colors shadow-sm"
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
              className="lg:hidden p-2 rounded-xl text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 transition border border-slate-200 dark:border-slate-700 shrink-0"
              title="Menu Navigasi"
              type="button"
            >
              <Menu className="w-5 h-5 text-blue-600 dark:text-cyan-300" />
            </button>
            
            <div className="flex items-center gap-2.5">
              <img
                src="/favicon.png"
                alt="PRISM Logo"
                className="w-8 h-8 object-contain shrink-0"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="font-display font-black text-base sm:text-lg text-slate-900 dark:text-white leading-tight tracking-wide">
                    PRISM
                  </h1>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-blue-50 dark:bg-cyan-500/20 text-blue-700 dark:text-cyan-300 border border-blue-200 dark:border-cyan-400/30">
                    V2.5
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-blue-600 dark:text-cyan-400 font-bold truncate max-w-[200px] sm:max-w-none">
                  Integrated System &amp; Monitoring
                </p>
              </div>
            </div>
          </div>

          {/* Mobile Right Controls: Theme Toggle & Reload */}
          <div className="flex items-center gap-1.5 lg:hidden">
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-xl bg-slate-100 dark:bg-[#090d16] text-amber-600 dark:text-amber-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition border border-slate-200 dark:border-slate-800"
              title={theme === 'dark' ? 'Ganti ke Tema Terang (Light Mode)' : 'Ganti ke Tema Gelap (Dark Mode)'}
              type="button"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>
            <button
              onClick={onReset}
              className="p-2 rounded-xl bg-slate-100 dark:bg-[#090d16] text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-cyan-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition border border-slate-200 dark:border-slate-800"
              title="Muat Ulang Data"
              type="button"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Side: Presets, Date Filter & Controls */}
        <div className="flex items-center justify-between lg:justify-end gap-2 flex-wrap sm:flex-nowrap">
          
          {/* Quick Date Presets */}
          <div
            className="flex items-center gap-1 bg-slate-100 dark:bg-[#090d16] p-1 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto max-w-full"
            style={{
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
                      ? 'bg-blue-600 text-white shadow-sm dark:bg-gradient-to-r dark:from-cyan-500/30 dark:to-indigo-500/30 dark:text-cyan-200 dark:border dark:border-cyan-400/50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/80 border border-transparent'
                  }`}
                  title={p.fullLabel}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Date Picker Trigger Wrapper with Interactive Popover */}
          <div className="relative" ref={popoverRef}>
            <button
              type="button"
              onClick={() => setIsOpenPicker((prev) => !prev)}
              className="flex items-center gap-2 bg-slate-100 dark:bg-[#090d16] hover:bg-slate-200/80 dark:hover:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 transition cursor-pointer shadow-sm text-left"
              title="Klik untuk memilih rentang tanggal kalender"
            >
              <Calendar className="w-4 h-4 text-blue-600 dark:text-cyan-400 shrink-0" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 select-none whitespace-nowrap">
                {dateRangeDisplay}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${isOpenPicker ? 'rotate-180' : ''}`} />
            </button>

            {/* Popover Date Range Picker Dropdown (z-50) */}
            {isOpenPicker && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-4 z-50 anim-in">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Pilih Rentang Tanggal
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOpenPicker(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Quick Presets Inside Dropdown */}
                <div className="mt-3">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                    Preset Waktu Cepat
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {DATE_PRESETS.map((p) => {
                      const isActive = activePreset === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            handleSelectPreset(p);
                            setIsOpenPicker(false);
                          }}
                          className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold transition ${
                            isActive
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Start & End Date Inputs */}
                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
                    Kustomisasi Periode (DD/MM/YYYY)
                  </span>
                  <div className="grid grid-cols-2 gap-2.5">
                    <DatePickerInput
                      label="Mulai (Start Date)"
                      value={fromStr}
                      onChange={(val) => handleDateChange('from', val)}
                    />
                    <DatePickerInput
                      label="Sampai (End Date)"
                      value={toStr}
                      onChange={(val) => handleDateChange('to', val)}
                    />
                  </div>
                </div>

                {/* Apply Button */}
                <div className="mt-4 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsOpenPicker(false)}
                    className="w-full btn-primary py-2 text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm font-bold"
                  >
                    <Check className="w-4 h-4" /> Terapkan Filter Tanggal
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-1.5 shrink-0">
            {/* Theme Toggle (Dark / Light) */}
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-xl bg-slate-100 dark:bg-[#090d16] text-slate-700 dark:text-amber-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition border border-slate-200 dark:border-slate-800 flex items-center gap-1.5"
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
                  <Moon className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-semibold text-slate-700">Dark</span>
                </>
              )}
            </button>

            {/* Reload Data */}
            <button
              onClick={onReset}
              className="p-2 rounded-xl bg-slate-100 dark:bg-[#090d16] text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-cyan-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition border border-slate-200 dark:border-slate-800"
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