import React from 'react';
import { Menu, RotateCcw, Printer, Calendar, Bell, Search, X } from 'lucide-react';
import { iso, parseDateVal } from '../../utils/formatters';

export default function Header({
  period,
  onPeriodChange,
  onReset,
  onOpenPrint,
  onToggleSidebar,
  title,
  subtitle,
  showSearch = false,
  searchValue = '',
  onSearchChange
}) {
  const [showDate, setShowDate] = React.useState(false);
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
    <header className="sticky top-0 z-30 glass border-b border-cyan-500/15 px-3 sm:px-6 py-3 no-print">
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Menu Toggle & Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 transition-all border border-cyan-500/20 shrink-0"
            title="Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          {title && (
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-bold text-white truncate">{title}</h1>
              {subtitle && (
                <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">{subtitle}</p>
              )}
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Search - Mobile Icon / Desktop Full */}
          {showSearch && (
            <div className="hidden sm:block relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari..."
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="inp pl-10 text-xs w-48"
              />
            </div>
          )}

          {/* Date Picker - Toggle on Mobile */}
          <button
            onClick={() => setShowDate(!showDate)}
            className="sm:hidden p-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 transition-all border border-cyan-500/20"
            title="Periode"
          >
            <Calendar className="w-4 h-4" />
          </button>

          {/* Date Range - Desktop Always / Mobile Dropdown */}
          <div className={`${showDate ? 'fixed inset-0 z-50 p-4 flex items-center justify-center bg-black/80' : 'hidden'} sm:relative sm:inset-auto sm:z-auto sm:p-0 sm:bg-transparent sm:flex`}>
            {showDate && (
              <div className="card p-4 w-full max-w-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-white">Pilih Periode</span>
                  <button onClick={() => setShowDate(false)} className="p-1 text-slate-400">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Dari</label>
                    <input
                      type="date"
                      value={fromStr}
                      onChange={(e) => handleDateChange('from', e.target.value)}
                      className="inp text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Sampai</label>
                    <input
                      type="date"
                      value={toStr}
                      onChange={(e) => handleDateChange('to', e.target.value)}
                      className="inp text-sm"
                    />
                  </div>
                  <button onClick={() => setShowDate(false)} className="btn btn-primary w-full text-sm">
                    Terapkan
                  </button>
                </div>
              </div>
            )}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500/5 border border-cyan-500/20">
              <Calendar className="w-4 h-4 text-cyan-400 shrink-0" />
              <input
                type="date"
                value={fromStr}
                onChange={(e) => handleDateChange('from', e.target.value)}
                className="bg-transparent text-xs font-semibold text-white outline-none w-24"
              />
              <span className="text-slate-500 text-xs">→</span>
              <input
                type="date"
                value={toStr}
                onChange={(e) => handleDateChange('to', e.target.value)}
                className="bg-transparent text-xs font-semibold text-white outline-none w-24"
              />
            </div>
          </div>

          {/* Refresh */}
          <button
            onClick={onReset}
            className="p-2 sm:p-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 transition-all border border-cyan-500/20"
            title="Refresh"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Export */}
          <button
            onClick={onOpenPrint}
            className="hidden sm:flex px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white text-xs font-semibold items-center gap-1.5 shadow-lg shadow-cyan-500/30 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>
    </header>
  );
}