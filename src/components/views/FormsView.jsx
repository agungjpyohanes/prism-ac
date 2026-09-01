import React from 'react';
import { FORMS, SHEETS } from '../../constants/schema';
import { ExternalLink, Copy } from 'lucide-react';

export default function FormsView({ onToast }) {
  const handleCopy = (url) => {
    navigator.clipboard.writeText(url);
    onToast('Link form disalin ke clipboard!', 'ok');
  };

  return (
    <div className="space-y-4 anim-in">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {FORMS.map((f) => {
          const cfg = SHEETS[f.key];
          return (
            <div key={f.key} className="card p-5 relative overflow-hidden flex flex-col justify-between hover:scale-[1.02] transition">
              <div className="absolute top-0 inset-x-0 h-1" style={{ background: cfg.color }}></div>
              <div>
                <div className="flex items-center gap-3">
                  <span className="w-11 h-11 rounded-2xl grid place-items-center text-white font-display font-black text-base shadow-md" style={{ background: cfg.color }}>
                    {cfg.label.charAt(0)}
                  </span>
                  <div>
                    <h3 className="font-display font-bold text-white text-sm">Form Permintaan {f.label}</h3>
                    <p className="text-[11px] text-slate-400 font-mono">{f.key}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-300 mt-3">Catat permintaan pekerjaan baru. Isian form akan otomatis tersinkron ke database PRISM.</p>
              </div>
              <div className="mt-5 flex gap-2 pt-3 border-t border-slate-800">
                <a
                  href={f.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white shadow-md hover:opacity-95 transition"
                  style={{ background: cfg.color }}
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Buka Form
                </a>
                <button
                  type="button"
                  onClick={() => handleCopy(f.url)}
                  className="btn-ghost !py-2 !px-3 text-xs flex items-center gap-1 rounded-xl"
                >
                  <Copy className="w-3.5 h-3.5" /> Salin Link
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}