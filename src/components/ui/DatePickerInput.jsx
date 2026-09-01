import React, { useRef } from 'react';
import { Calendar } from 'lucide-react';
import { iso, fmtDDMMYYYY } from '../../utils/formatters';

export default function DatePickerInput({
  value,
  onChange,
  label,
  min,
  max,
  disabled = false,
  className = ''
}) {
  const inputRef = useRef(null);
  const isoVal = value ? iso(value) : '';
  const displayVal = value ? fmtDDMMYYYY(value) : '--/--/----';

  const handleClick = () => {
    if (disabled) return;
    if (inputRef.current) {
      if (typeof inputRef.current.showPicker === 'function') {
        try {
          inputRef.current.showPicker();
        } catch {
          inputRef.current.focus();
        }
      } else {
        inputRef.current.focus();
      }
    }
  };

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 block">
          {label}
        </label>
      )}
      <div
        onClick={handleClick}
        className="group relative flex items-center justify-between gap-2 px-3 py-2 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-cyan-400 rounded-xl cursor-pointer transition shadow-sm"
      >
        <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 select-none">
          {displayVal}
        </span>
        <Calendar className="w-4 h-4 text-blue-600 dark:text-cyan-400 shrink-0 group-hover:scale-110 transition-transform" />
        
        {/* Invisible native input over the container to support keyboard, mobile touch and showPicker */}
        <input
          ref={inputRef}
          type="date"
          value={isoVal}
          min={min}
          max={max}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.value)}
          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
        />
      </div>
    </div>
  );
}
