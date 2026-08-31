import React from 'react';
import { X, ArrowLeft } from 'lucide-react';
import { SHEETS } from '../../constants/schema';
import { fmtDate, parseDateVal, hexA, cell } from '../../utils/formatters';

export default function Modal({ modalState, onClose, onSelectRow, onBack }) {
  if (!modalState) return null;
  const { title, type, key, rows, row, subtitle, withBack } = modalState;
  const cfg = SHEETS[key];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Backdrop Nebula Blur */}
      <div className="absolute inset-0 bg-[#030712]/80 backdrop-blur-md" onClick={onClose} />
      
      {/* Modal Dialog Card */}
      <div className="modal-panel relative w-full max-w-3xl max-h-[86vh] flex flex-col overflow-hidden pointer-events-auto z-10 border border-cyan-500/30 bg-[#0c1430]/95 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] rounded-3xl">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/10 bg-white/5">
          <div className="font-display font-bold text-white text-sm sm:text-base flex items-center gap-2">
            <span>{title}</span>
            {type === 'detail' && cfg && (
              <span className="badge" style={{ background: hexA(cfg.color, 0.2), color: cfg.color, borderColor: cfg.color }}>
                {cfg.label}
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-rose-500/20 ml-auto transition" title="Tutup">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-auto p-6 space-y-4 text-slate-200">
          {withBack && onBack && (
            <button onClick={onBack} className="btn-ghost !py-1.5 !px-3 text-xs mb-2 flex items-center gap-1.5 inline-flex">
              <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke daftar
            </button>
          )}

          {subtitle && <p className="text-xs text-cyan-300/80">{subtitle}</p>}

          {/* Modal Tipe Detail 1 Baris */}
          {type === 'detail' && row && cfg && (
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3.5">
              {cfg.headers.map((h, i) => {
                const v = row[i];
                const val = (i === cfg.i.date)
                  ? fmtDate(parseDateVal(v))
                  : ((v == null || v === '') ? <span className="text-slate-500">—</span> : String(v));
                return (
                  <div key={h} className="border-b border-white/10 pb-2.5">
                    <div className="text-[10px] font-bold tracking-wider text-cyan-400/80 uppercase">{h.replace(/_/g, ' ')}</div>
                    <div className="text-sm font-semibold text-slate-100 mt-0.5">{val}</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Modal Tipe List Records */}
          {type === 'list' && rows && (
            <div className="overflow-x-auto rounded-2xl border border-white/10">
              <table className="tbl">
                <thead>
                  <tr>
                    {cfg.dataCols.map((c) => (
                      <th key={c}>{cfg.headers[c].toUpperCase().replace(/_/g, ' ')}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, ri) => (
                    <tr key={ri} onClick={() => onSelectRow(key, r)}>
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
            <div className="overflow-x-auto rounded-2xl border border-white/10">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>{cfg.headers[cfg.i.id].toUpperCase()}</th>
                    <th>JOP NAME</th>
                    <th>NO JOP</th>
                    <th>DATE</th>
                    <th>{modalState.valLabel}</th>
                    {modalState.causeIdx != null && <th>PENYEBAB</th>}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, ri) => (
                    <tr key={ri} onClick={() => onSelectRow(key, r)}>
                      <td className="font-semibold text-cyan-300">{cell(r, cfg.i.id)}</td>
                      <td>{cell(r, cfg.i.jop)}</td>
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