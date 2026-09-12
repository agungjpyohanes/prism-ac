import React from 'react';
import { FORMS } from '../../constants/schema';
import {
  ExternalLink,
  Copy,
  Printer,
  FileText,
  Frame,
  Package,
  Sparkles,
  ClipboardList,
  Layers,
  CheckCircle2
} from 'lucide-react';

export default function FormsView({ onToast }) {
  const handleCopy = (url, label) => {
    try {
      navigator.clipboard.writeText(url);
      if (onToast) onToast(`Link Form ${label} disalin ke clipboard!`, 'ok');
    } catch {
      if (onToast) onToast('Gagal menyalin link.', 'err');
    }
  };

  const getDivisionIcon = (iconType) => {
    switch (iconType) {
      case 'printer':
        return <Printer className="w-6 h-6" />;
      case 'file-text':
        return <FileText className="w-6 h-6" />;
      case 'frame':
        return <Frame className="w-6 h-6" />;
      case 'package':
        return <Package className="w-6 h-6" />;
      case 'sparkles':
        return <Sparkles className="w-6 h-6" />;
      default:
        return <Layers className="w-6 h-6" />;
    }
  };

  return (
    <div className="space-y-6 anim-in">
      {/* Header Banner */}
      <div className="card p-6 bg-gradient-to-r from-slate-900 via-sky-950/80 to-slate-900 text-white flex flex-wrap items-center justify-between gap-4 border border-cyan-500/30">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge bg-cyan-500/20 text-cyan-300 border-cyan-400/40 font-bold">
              PORTAL PERMINTAAN PREPRESS
            </span>
            <span className="text-xs text-slate-300">&bull; Google Form Terintegrasi</span>
          </div>
          <h2 className="font-display font-black text-xl sm:text-2xl mt-1.5 text-white tracking-wide">
            Form Permintaan Pembuatan Plate &amp; Master Prepress
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Pilih divisi prepress di bawah untuk mengisi formulir permintaan pekerjaan baru atau penggantian plate. Isian form otomatis tersinkronisasi ke dalam database sistem monitoring PRISM.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
            <ClipboardList className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Grid 5 Divisi Form */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {FORMS.map((f, idx) => {
          return (
            <div
              key={f.id || f.key}
              className={`card p-6 relative overflow-hidden flex flex-col justify-between hover:scale-[1.02] hover:shadow-2xl transition duration-200 border ${f.borderClass} bg-white dark:bg-[#0c1430]/90 group`}
            >
              {/* Top Accent Color Bar */}
              <div
                className="absolute top-0 inset-x-0 h-1.5 transition-all duration-300 group-hover:h-2"
                style={{ background: f.color }}
              />

              <div>
                <div className="flex items-start justify-between gap-3">
                  {/* Icon & Title */}
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-110 duration-200 shrink-0"
                      style={{ background: f.color }}
                    >
                      {getDivisionIcon(f.iconType)}
                    </div>
                    <div>
                      <span className={`badge ${f.bgBadge} font-mono font-bold text-[10px] uppercase tracking-wider`}>
                        {f.badge}
                      </span>
                      <h3 className="font-display font-black text-base sm:text-lg text-slate-900 dark:text-white mt-1 group-hover:text-blue-600 dark:group-hover:text-cyan-300 transition">
                        {f.title}
                      </h3>
                    </div>
                  </div>

                  <span className="font-mono text-[10px] font-bold text-slate-400 dark:text-slate-500">
                    #0{idx + 1}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 mt-4 leading-relaxed">
                  {f.desc}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Auto-sync ke Google Sheets &amp; Database PRISM</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <a
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white shadow-md hover:shadow-lg transition-all duration-150 transform active:scale-95"
                  style={{ background: f.color }}
                  title="Buka Form di Tab Baru"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Buka Form</span>
                </a>

                <button
                  type="button"
                  onClick={() => handleCopy(f.url, f.label)}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-cyan-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition active:scale-95 shrink-0"
                  title="Salin Link Google Form"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Informational Box */}
      <div className="card p-4 sm:p-5 bg-blue-50/60 dark:bg-slate-900/60 border border-blue-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <ClipboardList className="w-5 h-5 text-blue-600 dark:text-cyan-400 shrink-0" />
          <span>
            Ada kendala dengan formulir permintaan atau membutuhkan akses penambahan link? Hubungi tim Admin / Prepress Leader.
          </span>
        </div>
      </div>
    </div>
  );
}