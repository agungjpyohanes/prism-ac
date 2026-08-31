import React, { useState, useMemo } from 'react';
import { X, ArrowLeft, ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import { SHEETS } from '../../constants/schema';
import { fmtDate, parseDateVal, hexA, cell } from '../../utils/formatters';

export default function Modal({ modalState, onClose, onSelectRow, onBack }) {
  if (!modalState) return null;
  const { title, type, key, rows = [], row, subtitle, withBack } = modalState;
  const cfg = SHEETS[key] || SHEETS.rec_ctcp;

  // Pagination untuk modal bertipe List
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const totalPages = Math.ceil(rows.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    return rows.slice((page - 1) * pageSize, page * pageSize);
  }, [rows, page, pageSize]);

  const columns = cfg?.dataCols || (cfg?.headers ? cfg.headers.map((_, i) => i) : []);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6 select-none font-sans">
      {/* Backdrop Gelap */}
      <div 
        className="fixed inset-0 bg-[#060a12]/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Panel Modal */}
      <div className="relative w-full max-w-5xl max-h-[88vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden pointer-events-auto z-10">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span 
              className="w-9 h-9 rounded-xl grid place-items-center text-white font-extrabold text-sm shrink-0 shadow-sm"
              style={{ background: cfg?.color || '#0284c7' }}
            >
              <Layers className="w-4 h-4" />
            </span>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <h3 className="font-display font-extrabold text-slate-900 dark:text-white text-base truncate">
                  {title || 'Detail Data'}
                </h3>
                {cfg && (
                  <span 
                    className="badge text-[10px] px-2 py-0.5 rounded-md font-bold"
                    style={{ background: hexA(cfg.color, 0.15), color: cfg.color }}
                  >
                    {cfg.label}
                  </span>
                )}
              </div>
              {subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
          </div>

          <button 
            type="button"
            onClick={onClose} 
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer" 
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Container */}
        <div className="overflow-y-auto p-6 flex-1 space-y-4">
          {withBack && onBack && (
            <button 
              onClick={onBack} 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition mb-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Kembali ke daftar
            </button>
          )}

          {/* ================= TIPE 1: DETAIL 1 BARIS (RECORD INSPECTOR) ================= */}
          {type === 'detail' && row && cfg && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {cfg.headers.map((h, i) => {
                const v = row[i];
                const isDate = i === cfg.i?.date;
                const isGood = i === cfg.i?.baik;
                const isDefect = i === cfg.i?.rusak;
                const isReplace = i === cfg.i?.ganti;

                const displayVal = isDate
                  ? fmtDate(parseDateVal(v))
                  : ((v == null || String(v).trim() === '') ? '—' : String(v));

                return (
                  <div key={h} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80">
                    <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                      {h.replace(/_/g, ' ')}
                    </div>
                    <div className={`text-sm font-semibold mt-1 truncate ${
                      isDate ? 'text-cyan-600 dark:text-cyan-400 font-bold' :
                      isGood ? 'text-emerald-600 font-bold' :
                      isDefect && Number(v) > 0 ? 'text-rose-600 font-bold' :
                      isReplace && Number(v) > 0 ? 'text-amber-600 font-bold' :
                      'text-slate-800 dark:text-slate-100'
                    }`}>
                      {displayVal}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ================= TIPE 2: DAFTAR BANYAK BARIS (LIST TABULAR) ================= */}
          {type === 'list' && (
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
              <div className="overflow-x-auto max-h-[58vh]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-3 px-3.5 whitespace-nowrap text-slate-400">No</th>
                      {columns.map(ci => (
                        <th key={ci} className="py-3 px-3.5 whitespace-nowrap text-slate-700 dark:text-slate-300 font-bold">
                          {(cfg?.headers[ci] || '').replace(/_/g, ' ')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                    {paginatedRows.length === 0 ? (
                      <tr>
                        <td colSpan={columns.length + 1} className="text-center py-10 text-slate-400">
                          Tidak ada rincian transaksi.
                        </td>
                      </tr>
                    ) : (
                      paginatedRows.map((r, ri) => (
                        <tr 
                          key={ri} 
                          onClick={() => onSelectRow?.(key, r)}
                          className="hover:bg-cyan-500/10 dark:hover:bg-slate-800/70 transition cursor-pointer"
                        >
                          <td className="py-3 px-3.5 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                            {(page - 1) * pageSize + ri + 1}
                          </td>
                          {columns.map(ci => {
                            const val = r[ci];
                            const isDate = ci === cfg.i?.date;
                            const isGood = ci === cfg.i?.baik;
                            const isDefect = ci === cfg.i?.rusak;
                            const isShift = ci === cfg.i?.shift;

                            return (
                              <td 
                                key={ci} 
                                className={`py-3 px-3.5 whitespace-nowrap ${
                                  isDate ? 'text-cyan-600 dark:text-cyan-400 font-bold' :
                                  isGood ? 'text-emerald-600 font-bold' :
                                  isDefect && Number(val) > 0 ? 'text-rose-600 font-bold' :
                                  isShift ? 'text-indigo-600 dark:text-indigo-400 font-semibold' :
                                  'text-slate-800 dark:text-slate-200'
                                }`}
                              >
                                {isDate ? fmtDate(val) : (cell(r, ci) || '—')}
                              </td>
                            );
                          })}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer Paginasi Modal */}
              {totalPages > 1 && (
                <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>
                    Halaman <b>{page}</b> dari <b>{totalPages}</b> ({rows.length.toLocaleString('id-ID')} baris)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={page === 1}
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 hover:bg-slate-100 transition cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={page === totalPages}
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 hover:bg-slate-100 transition cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}