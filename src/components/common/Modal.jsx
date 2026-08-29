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
      <div className="absolute inset-0 bg-[#0b1220]/60 backdrop-blur-[2px]" onClick={onClose}></div>
      <div className="modal-panel relative w-full max-w-3xl max-h-[86vh] flex flex-col card overflow-hidden pointer-events-auto">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200 bg-white">
          <div className="font-display font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
            <span>{title}</span>
            {type === 'detail' && cfg && (
              <span className="badge" style={{ background: hexA(cfg.color, 0.12), color: cfg.color }}>
                {cfg.label}
              </span>
            )}
          </div>
          <button onClick={onClose} className="icon-btn ml-auto !w-8 !h-8" title="Tutup">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-auto p-5 bg-white space-y-4">
          {withBack && onBack && (
            <button onClick={onBack} className="btn btn-ghost text-xs mb-2">
              <ArrowLeft className="w-4 h-4 mr-1" /> Kembali ke daftar
            </button>
          )}

          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}

          {/* Modal Tipe Detail 1 Baris */}
          {type === 'detail' && row && cfg && (
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
              {cfg.headers.map((h, i) => {
                const v = row[i];
                const val = (i === cfg.i.date)
                  ? fmtDate(parseDateVal(v))
                  : ((v == null || v === '') ? <span className="text-slate-300">—</span> : String(v));
                return (
                  <div key={h} className="border-b border-slate-100 pb-2">
                    <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">{h}</div>
                    <div className="text-sm font-medium text-slate-700 mt-0.5">{val}</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Modal Tipe List Records */}
          {type === 'list' && rows && (
            <div className="overflow-x-auto">
              <table className="tbl">
                <thead>
                  <tr>
                    {cfg.dataCols.map(c => (
                      <th key={c}>{cfg.headers[c].toUpperCase()}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, ri) => (
                    <tr key={ri} onClick={() => onSelectRow(key, r)}>
                      {cfg.dataCols.map(c => (
                        <td key={c} className={c === cfg.i.date ? 'text-blue-600' : ''}>
                          {c === cfg.i.date ? fmtDate(parseDateVal(r[c])) : (cell(r, c) || <span className="text-slate-300">—</span>)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Modal Tipe Metric / Sebab Rusak List */}
          {type === 'metric' && rows && (
            <div className="overflow-x-auto">
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
                      <td className="font-semibold text-slate-700">{cell(r, cfg.i.id)}</td>
                      <td>{cell(r, cfg.i.jop)}</td>
                      <td>{cell(r, cfg.i.nojop)}</td>
                      <td>{fmtDate(parseDateVal(r[cfg.i.date]))}</td>
                      <td className="font-bold">
                        {modalState.metric === 'pct' ? `${modalState.valFn(r).toFixed(1)}%` : modalState.valFn(r).toLocaleString('id-ID')}
                      </td>
                      {modalState.causeIdx != null && (
                        <td>{cell(r, modalState.causeIdx) || <span className="text-slate-300">—</span>}</td>
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