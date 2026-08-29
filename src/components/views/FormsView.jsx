import React from 'react';
import { FORMS, SHEETS } from '../../constants/schema';
import { ExternalLink, Copy } from 'lucide-react';

export default function FormsView({ onToast }) {
  const handleCopy = (url) => {
    navigator.clipboard.writeText(url);
    onToast('Link disalin ke clipboard!', 'ok');
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {FORMS.map((f) => {
          const cfg = SHEETS[f.key];
          return (
            <div key={f.key} className="card p-5 relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1" style={{ background: cfg.color }}></div>
              <div className="flex items-center gap-3">
                <span className="w-11 h-11 rounded-xl grid place-items-center text-white font-display font-extrabold text-base" style={{ background: cfg.color }}>
                  {cfg.label.charAt(0)}
                </span>
                <div>
                  <h3 className="font-display font-bold text-slate-800 text-sm">Form Permintaan {f.label}</h3>
                  <p className="text-[11px] text-slate-400">{f.key}</p>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-3">Catat permintaan pekerjaan baru. Isian form akan otomatis tersinkron ke database.</p>
              <div className="mt-4 flex gap-2">
                <a
                  href={f.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                  style={{ background: cfg.color }}
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Buka Google Form
                </a>
                <button
                  onClick={() => handleCopy(f.url)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 hover:bg-slate-50 text-slate-600"
                >
                  <Copy className="w-3.5 h-3.5" /> Salin
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}