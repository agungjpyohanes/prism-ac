import React, { useState } from 'react';
import { RotateCcw, PenTool } from 'lucide-react';

/**
 * Komponen Select dengan opsi "+ Ketik Manual / Lainnya..." (Combobox pattern)
 */
export default function SelectWithCustom({
  label,
  value = '',
  onChange,
  options = [],
  placeholder = '-- Pilih --',
  customPlaceholder = 'Ketik nilai manual / kustom...',
  required = false,
  disabled = false,
  className = '',
  inputClassName = ''
}) {
  const [isCustom, setIsCustom] = useState(false);

  const isValueInOptions = options.includes(value);

  const handleSelectChange = (e) => {
    const val = e.target.value;
    if (val === '__CUSTOM__') {
      setIsCustom(true);
      if (isValueInOptions) {
        onChange('');
      }
    } else {
      setIsCustom(false);
      onChange(val);
    }
  };

  const handleResetToSelect = () => {
    setIsCustom(false);
    onChange(options[0] || '');
  };

  return (
    <div className={className}>
      {label && (
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
          {isCustom && (
            <span className="text-[10px] font-semibold text-blue-600 dark:text-cyan-400 flex items-center gap-1">
              <PenTool className="w-2.5 h-2.5" /> Input Manual
            </span>
          )}
        </div>
      )}

      <div className="space-y-1.5">
        <select
          value={isCustom ? '__CUSTOM__' : (value || '')}
          onChange={handleSelectChange}
          disabled={disabled}
          className={`inp w-full text-xs font-medium ${
            isCustom
              ? '!border-blue-400 dark:!border-cyan-400 !text-blue-600 dark:!text-cyan-300 bg-blue-50/20 dark:bg-cyan-950/20'
              : ''
          }`}
        >
          <option value="">{placeholder}</option>
          {/* Jika nilai tersimpan di DB tapi belum masuk di predefined options */}
          {value && !isValueInOptions && !isCustom && (
            <option value={value}>{value} (Tersimpan)</option>
          )}
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
          <option value="__CUSTOM__" className="font-bold text-blue-600 dark:text-cyan-400">
            + Ketik Manual / Lainnya...
          </option>
        </select>

        {isCustom && (
          <div className="flex items-center gap-1.5 animate-fadeIn">
            <input
              type="text"
              autoFocus
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={customPlaceholder}
              disabled={disabled}
              required={required}
              className={`inp w-full text-xs font-semibold !border-blue-400 dark:!border-cyan-400 ${inputClassName}`}
            />
            <button
              type="button"
              onClick={handleResetToSelect}
              title="Batal custom & kembali ke daftar pilihan"
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:border-rose-300 dark:hover:border-rose-500/30 transition shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
