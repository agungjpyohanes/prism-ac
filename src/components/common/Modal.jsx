import React from 'react';
import { X, ArrowLeft } from 'lucide-react';
import { SHEETS } from '../../constants/schema';
import { fmtDate, parseDateVal, hexA, cell } from '../../utils/formatters';

export default function Modal({ modalState, onClose, onSelectRow, onBack }) {
  if (!modalState) return null;
  const { title, type, key, rows, row, subtitle, withBack } = modalState;
  const cfg = SHEETS[key];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop Nebula Blur */}
      <div
        className="absolute inset-0 bg-[#030712]/85 transition-opacity"
        style={{
          WebkitBackdropFilter: 'blur(12px)',
          backdropFilter: 'blur(12px)'
        }}
        onClick={onClose}
      />
      
      {/* Modal Dialog Card */}
      <div
        className="modal-panel relative w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden pointer-events-auto z-10 border border-cyan-500/30 bg-[#0c1430]/95 shadow-[0_0_50px_rgba(0,0,0,0.9)] rounded-3xl"
        style={{
          WebkitBackdropFilter: 'blur(24px)',
          backdropFilter: 'blur(24px)'
        }}
      >
        <div className="flex items-center gap-3 px-5 sm:px-6 py-3.5 sm:py-4 border-b border-slate-700/80 bg-slate-900/60 shrink-0">
          <div className="font-display font-bold text-white text-sm sm:text-base flex items-center gap-2 min-w-0">
            <span className="truncate">{title}</span>
            {type === 'detail' && cfg && (
              <span className="badge shrink-0" style={{ background: hexA(cfg.color, 0.25), color: '#ffffff', borderColor: cfg.color }}>
                {cfg.label}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white hover:bg-rose-500/30 ml-auto transition shrink-0"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-4 sm:p-6 space-y-4 text-slate-200" style={{ WebkitOverflowScrolling: 'touch' }}>
          {withBack && onBack && (
            <button
              type="button"
              onClick={onBack}
              className="btn-ghost !py-1.5 !px-3 text-xs mb-2 flex items-center gap-1.5 inline-flex rounded-xl"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke daftar
            </button>
          )}

          {subtitle && <p className="text-xs text-cyan-300 font-medium">{subtitle}</p>}

          {/* Modal Tipe Detail 1 Baris */}
          {type === 'detail' && row && cfg && (
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3.5 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
              {cfg.headers.map((h, i) => {
                const v = row[i];
                const val = (i === cfg.i.date)
                  ? fmtDate(parseDateVal(v))
                  : ((v == null || v === '') ? <span className="text-slate-500">—</span> : String(v));
                return (
                  <div key={h} className="border-b border-slate-800 pb-2.5">
                    <div className="text-[10px] font-bold tracking-wider text-cyan-400 uppercase">{h.replace(/_/g, ' ')}</div>
                    <div className="text-xs sm:text-sm font-semibold text-slate-100 mt-0.5 break-words">{val}</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Modal Tipe List Records */}
          {type === 'list' && rows && (
            <div className="table-responsive">
              <table className="tbl min-w-[600px]">
                <thead>
                  <tr>
                    {cfg.dataCols.map((c) => (
                      <th key={c}>{cfg.headers[c]?.toUpperCase().replace(/_/g, ' ')}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, ri) => (
                    <tr key={ri} onClick={() => onSelectRow(key, r)} className="cursor-pointer">
                      {cfg.dataCols.map((c) => (
                        <td key={c} className={c === cfg.i.date ? 'text-cyan-300 font-semibold' : ''}>
                          {c === cfg.i.date ? fmtDate(parseDateVal(r[c])) : (cell(r, c) || <span className="text-slate-500">—</span>)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Modal Tipe Metric List */}
          {type === 'metric' && rows && (
            <div className="table-responsive">
              <table className="tbl min-w-[600px]">
                <thead>
                  <tr>
                    <th>{cfg.headers[cfg.i.id]?.toUpperCase()}</th>
                    <th>JOP NAME</th>
                    <th>NO JOP</th>
                    <th>TANGGAL</th>
                    <th>{modalState.valLabel}</th>
                    {modalState.causeIdx != null && <th>PENYEBAB</th>}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, ri) => (
                    <tr key={ri} onClick={() => onSelectRow(key, r)} className="cursor-pointer">
                      <td className="font-semibold text-cyan-300">{cell(r, cfg.i.id)}</td>
                      <td className="font-medium text-slate-100">{cell(r, cfg.i.jop)}</td>
                      <td>{cell(r, cfg.i.nojop)}</td>
                      <td>{fmtDate(parseDateVal(r[cfg.i.date]))}</td>
                      <td className="font-bold text-white">
                        {modalState.metric === 'pct' ? `${modalState.valFn(r).toFixed(1)}%` : modalState.valFn(r).toLocaleString('id-ID')}
                      </td>
                      {modalState.causeIdx != null && (
                        <td>{cell(r, modalState.causeIdx) || <span className="text-slate-500">—</span>}</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}