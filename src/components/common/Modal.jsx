import React from 'react';
import { X, ArrowLeft } from 'lucide-react';
import { SHEETS } from '../../constants/schema';
import { fmtDate, parseDateVal, hexA, cell, getStatusBadgeClass, getCategoryBadgeClass } from '../../utils/formatters';

export default function Modal({ modalState, onClose, onSelectRow, onBack }) {
  if (!modalState) return null;
  const { title, type, key, rows, row, subtitle, withBack } = modalState;
  const cfg = SHEETS[key] || SHEETS.rec_ctcp;

  const getMachineVal = (r) => {
    if (!cfg || !r) return '—';
    const exp = cfg.i?.expose_mach != null ? cell(r, cfg.i.expose_mach) : '';
    const prn = cfg.i?.print_mach != null ? cell(r, cfg.i.print_mach) : '';
    const scr = cfg.i?.screen_type != null ? cell(r, cfg.i.screen_type) : '';
    const thk = cfg.i?.flexo_thickness != null ? cell(r, cfg.i.flexo_thickness) : '';
    const m = [exp, prn, scr, thk].filter(Boolean).join(' / ');
    return m || '—';
  };

  const getPlateNoVal = (r) => {
    if (!cfg || !r) return '—';
    const pNo = cfg.i?.plate_no != null ? cell(r, cfg.i.plate_no) : '';
    const fNo = cfg.i?.file_no != null ? cell(r, cfg.i.file_no) : '';
    return pNo || fNo || '—';
  };

  const getOperatorVal = (r) => {
    if (!cfg || !r) return '—';
    const op = cfg.i?.operator != null ? cell(r, cfg.i.operator) : '';
    const hl = cfg.i?.po_helper != null ? cell(r, cfg.i.po_helper) : '';
    return [op, hl].filter(Boolean).join(' & ') || '—';
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4">
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
        className="modal-panel relative w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden pointer-events-auto z-10 border border-slate-200 dark:border-cyan-500/30 bg-white dark:bg-[#0c1430]/95 shadow-2xl rounded-3xl"
        style={{
          WebkitBackdropFilter: 'blur(24px)',
          backdropFilter: 'blur(24px)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-900/60 shrink-0">
          <div className="min-w-0">
            <div className="font-display font-bold text-slate-900 dark:text-white text-sm sm:text-base flex items-center gap-2">
              <span className="truncate">{title}</span>
              {cfg && (
                <span className="badge shrink-0 font-bold" style={{ background: hexA(cfg.color || '#06b6d4', 0.15), color: cfg.color || '#0284c7', borderColor: cfg.color || '#06b6d4' }}>
                  {cfg.label}
                </span>
              )}
            </div>
            {subtitle && <p className="text-xs text-blue-600 dark:text-cyan-300 font-medium mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-white hover:bg-rose-50 dark:hover:bg-rose-500/30 ml-auto transition shrink-0"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-4 text-slate-800 dark:text-slate-200" style={{ WebkitOverflowScrolling: 'touch' }}>
          {withBack && onBack && (
            <button
              type="button"
              onClick={onBack}
              className="btn-secondary !py-1.5 !px-3 text-xs mb-2 flex items-center gap-1.5 inline-flex rounded-xl"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke daftar
            </button>
          )}

          {/* Modal Tipe Detail 1 Baris */}
          {type === 'detail' && row && cfg && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3.5 bg-slate-50 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
              {cfg.headers.map((h, i) => {
                const v = row[i];
                const isDate = i === cfg.i?.date;
                const isStatus = i === cfg.i?.status;
                const isCat = i === cfg.i?.category;
                
                let valDisplay = (v == null || v === '' || String(v).toUpperCase() === 'NULL') ? <span className="text-slate-400 dark:text-slate-500">—</span> : String(v);
                if (isDate) valDisplay = fmtDate(parseDateVal(v));
                if (isStatus) valDisplay = <span className={`badge ${getStatusBadgeClass(v)} font-bold`}>{v || 'ANTRI'}</span>;
                if (isCat) valDisplay = <span className={`badge ${getCategoryBadgeClass(v)} font-bold`}>{v}</span>;

                return (
                  <div key={h} className="border-b border-slate-200 dark:border-slate-800/80 pb-2.5">
                    <div className="text-[10px] font-bold tracking-wider text-blue-600 dark:text-cyan-400 uppercase">{h.replace(/_/g, ' ')}</div>
                    <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0.5 break-words">{valDisplay}</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Modal Tipe List Records & Drill-down Metrics */}
          {(type === 'list' || type === 'metric') && rows && (
            <div className="space-y-3">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Ditemukan <b className="text-blue-600 dark:text-cyan-300">{rows.length.toLocaleString('id-ID')} data transaksi</b> &bull; Klik pada baris untuk membuka rincian lengkap
              </div>
              <div className="table-responsive">
                <table className="tbl min-w-[850px]">
                  <thead>
                    <tr>
                      <th>NO</th>
                      <th>ID</th>
                      <th>JOB NAME</th>
                      <th>JOB NO / JOP</th>
                      <th>PLATE / FILE NO</th>
                      <th>MESIN</th>
                      <th>OPERATOR</th>
                      <th>SHIFT</th>
                      <th>TANGGAL</th>
                      {type === 'metric' ? (
                        <>
                          <th className="text-blue-600 dark:text-cyan-300">{modalState.valLabel}</th>
                          {modalState.causeIdx != null && <th>PENYEBAB / ALASAN</th>}
                        </>
                      ) : (
                        <>
                          <th>BAIK</th>
                          <th>RUSAK</th>
                          <th>GANTI</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="text-center py-10 text-slate-500 dark:text-slate-400 text-xs">
                          Tidak ada data transaksi yang sesuai dengan filter ini.
                        </td>
                      </tr>
                    ) : (
                      rows.map((r, ri) => (
                        <tr
                          key={ri}
                          onClick={() => onSelectRow?.(key, r)}
                          className="cursor-pointer hover:bg-slate-100 dark:hover:bg-cyan-500/10 transition"
                        >
                          <td className="text-slate-500 dark:text-slate-400 text-[11px]">{ri + 1}</td>
                          <td className="font-bold text-slate-900 dark:text-white whitespace-nowrap">{cell(r, cfg.i?.id) || '—'}</td>
                          <td className="font-semibold text-slate-900 dark:text-slate-100 max-w-[200px] truncate" title={cell(r, cfg.i?.jop)}>
                            {cell(r, cfg.i?.jop) || '—'}
                          </td>
                          <td className="whitespace-nowrap font-mono text-[11px] text-slate-700 dark:text-slate-300">{cell(r, cfg.i?.nojop) || '—'}</td>
                          <td className="whitespace-nowrap font-mono text-[11px] text-blue-600 dark:text-cyan-300">{getPlateNoVal(r)}</td>
                          <td className="whitespace-nowrap text-slate-700 dark:text-slate-300 text-[11px]">{getMachineVal(r)}</td>
                          <td className="whitespace-nowrap text-slate-800 dark:text-slate-200">{getOperatorVal(r)}</td>
                          <td className="whitespace-nowrap text-center font-bold text-slate-700 dark:text-slate-300">{cell(r, cfg.i?.shift) || '—'}</td>
                          <td className="whitespace-nowrap text-blue-600 dark:text-cyan-300 font-semibold">{fmtDate(parseDateVal(r[cfg.i?.date]))}</td>
                          
                          {type === 'metric' ? (
                            <>
                              <td className="whitespace-nowrap font-black text-slate-900 dark:text-white text-right">
                                {modalState.metric === 'pct' ? `${modalState.valFn(r).toFixed(1)}%` : modalState.valFn(r).toLocaleString('id-ID')}
                              </td>
                              {modalState.causeIdx != null && (
                                <td className="text-rose-600 dark:text-rose-300 font-medium">
                                  {cell(r, modalState.causeIdx) || <span className="text-slate-400 dark:text-slate-500">—</span>}
                                </td>
                              )}
                            </>
                          ) : (
                            <>
                              <td className="text-emerald-600 dark:text-emerald-400 font-bold text-right">{cell(r, cfg.i?.baik) || '0'}</td>
                              <td className="text-rose-600 dark:text-rose-400 font-bold text-right">{cell(r, cfg.i?.rusak) || '0'}</td>
                              <td className="text-amber-600 dark:text-amber-400 font-bold text-right">{cell(r, cfg.i?.ganti) || '0'}</td>
                            </>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}