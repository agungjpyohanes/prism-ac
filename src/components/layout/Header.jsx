import React from 'react';
import { Menu, RotateCcw, Printer, Calendar, Bell, Search } from 'lucide-react';
import { iso, parseDateVal } from '../../utils/formatters';

export default function Header({
  period,
  onPeriodChange,
  onReset,
  onOpenPrint,
  onToggleSidebar,
  title,
  subtitle
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
    <header className="sticky top-0 z-30 glass border-b border-white/5 px-6 py-4 no-print">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Menu Toggle & Title */}
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
            title="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          {title && (
            <div>
              <h1 className="text-xl font-bold text-white">{title}</h1>
              {subtitle && (
                <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
              )}
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Date Range Picker */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <input
              type="date"
              value={fromStr}
              onChange={(e) => handleDateChange('from', e.target.value)}
              className="bg-transparent text-xs font-semibold text-white outline-none w-28"
            />
            <span className="text-slate-500 text-xs">→</span>
            <input
              type="date"
              value={toStr}
              onChange={(e) => handleDateChange('to', e.target.value)}
              className="bg-transparent text-xs font-semibold text-white outline-none w-28"
            />
          </div>

          {/* Action Buttons */}
          <button
            onClick={onReset}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
            title="Refresh Data"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          </button>

          <button
            onClick={onOpenPrint}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-500/30 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>
    </header>
  );
}