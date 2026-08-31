import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function AuthView({ usersData = [], data = {}, serverStatus = {}, onLoginSuccess, onToast }) {
  const [tab, setTab] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Direct delivery image URL dari Google Drive
  const LOGO_URL = "https://drive.google.com/thumbnail?id=1A7Ws0vZZtO7nc-k8lNTzt4tlLt0xqODx&sz=w500";

  const handleLogin = (e) => {
    e.preventDefault();
    const uClean = username.trim().toLowerCase();
    const pClean = password.trim();

    // 1. Akun Demo Default (Selalu Aktif)
    if (uClean === 'guest' && pClean === '123456') {
      onLoginSuccess({ USER: 'guest', ROLE: 'guest', ID: 'guest_01' });
      return;
    }

    // 2. Verifikasi Akun Database Master User (Mendukung format Array maupun Object)
    const found = (usersData || []).find((r) => {
      const u = (Array.isArray(r) ? r[0] : (r.username || r.user || '')).toString().trim().toLowerCase();
      const p = (Array.isArray(r) ? r[2] : (r.password_hash || r.password || '')).toString().trim();
      return u === uClean && p === pClean;
    });

    if (found) {
      const uName = Array.isArray(found) ? found[0] : (found.username || found.user);
      const uRole = Array.isArray(found) ? found[1] : (found.role || 'operator');
      const uId = Array.isArray(found) ? found[3] : (found.id || '1');

      onLoginSuccess({
        USER: uName,
        ROLE: String(uRole).toLowerCase(),
        ID: String(uId)
      });
    } else {
      if (onToast) {
        onToast('Username atau password tidak cocok!', 'err');
      } else {
        alert('Username atau password tidak cocok!');
      }
    }
  };

  const isReady = (key) => {
    const rows = data[key];
    if (rows && Array.isArray(rows) && rows.length > 0) return true;
    if (serverStatus && serverStatus[key] === 'live') return true;
    return false;
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#0b0f19] select-none font-sans overflow-hidden">
      {/* ================= SISI KIRI: DARK BRANDING HERO ================= */}
      <div className="relative flex-1 flex flex-col justify-between p-8 lg:p-14 bg-[#080d1a] border-b lg:border-b-0 lg:border-r border-slate-800/60 overflow-hidden">
        
        {/* Grid Dot Pattern Background */}
        <div 
          className="absolute inset-0 opacity-15 pointer-events-none" 
          style={{ 
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.25) 1px, transparent 1px)', 
            backgroundSize: '24px 24px' 
          }} 
        />

        {/* Reticle / Optical Target */}
        <div className="absolute -bottom-24 -right-24 w-96 h-96 pointer-events-none opacity-20">
          <div className="w-full h-full rounded-full border border-cyan-500/40 flex items-center justify-center">
            <div className="w-64 h-64 rounded-full border border-dashed border-cyan-400/30 flex items-center justify-center">
              <div className="w-36 h-36 rounded-full border border-cyan-300/40" />
            </div>
          </div>
          <div className="absolute top-1/2 left-0 w-full h-[1px] bg-cyan-400/40 -translate-y-1/2" />
          <div className="absolute top-0 left-1/2 w-[1px] h-full bg-cyan-400/40 -translate-x-1/2" />
        </div>

        {/* Top Left Badge */}
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-700/80 p-1 flex items-center justify-center shadow-lg shadow-black/40 overflow-hidden">
            <img 
              src={LOGO_URL} 
              alt="PRISM Logo" 
              className="w-full h-full object-contain" 
              referrerPolicy="no-referrer" 
            />
          </div>
          <span className="font-extrabold text-xs tracking-widest text-slate-100">PRISM</span>
          <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#0284c7]/20 text-[#38bdf8] border border-[#0284c7]/40 font-semibold">
            V 1.0
          </span>
        </div>

        {/* Center Main Info */}
        <div className="relative z-10 my-auto py-10 max-w-md">
          <div className="w-16 h-16 mb-6 p-2 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-2xl flex items-center justify-center backdrop-blur-sm overflow-hidden">
            <img 
              src={LOGO_URL} 
              alt="PRISM" 
              className="w-full h-full object-contain drop-shadow-[0_0_12px_rgba(56,189,248,0.5)]" 
              referrerPolicy="no-referrer" 
            />
          </div>
          
          <h1 className="font-black text-4xl lg:text-5xl tracking-tight text-white mb-2">PRISM</h1>
          <p className="text-cyan-400 text-xs font-bold tracking-wide mb-4">Integrated System & Monitoring</p>
          <p className="text-xs text-slate-400 leading-relaxed mb-6 font-normal">
            Pusat kendali data prepress — monitoring plate CTCP & CTP, screen, flexo, dan etching dalam satu dashboard terintegrasi.
          </p>

          {/* Division Badges */}
          <div className="flex flex-wrap gap-2 text-[10px] font-bold">
            <span className="px-2.5 py-1 rounded-full bg-slate-900/90 border border-purple-500/30 text-purple-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" /> CTCP
            </span>
            <span className="px-2.5 py-1 rounded-full bg-slate-900/90 border border-emerald-500/30 text-emerald-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> CTP
            </span>
            <span className="px-2.5 py-1 rounded-full bg-slate-900/90 border border-cyan-500/30 text-cyan-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> SCREEN
            </span>
            <span className="px-2.5 py-1 rounded-full bg-slate-900/90 border border-pink-500/30 text-pink-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-pink-400" /> FLEXO
            </span>
            <span className="px-2.5 py-1 rounded-full bg-slate-900/90 border border-amber-500/30 text-amber-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> ETCHING
            </span>
          </div>
        </div>

        {/* Bottom CMYK Prepress Bar */}
        <div className="relative z-10 flex flex-col gap-1">
          <div className="flex gap-1.5 items-center">
            <div className="w-7 h-1.5 rounded-sm bg-[#00e5ff]" />
            <div className="w-7 h-1.5 rounded-sm bg-[#ff007f]" />
            <div className="w-7 h-1.5 rounded-sm bg-[#ffea00]" />
            <div className="w-7 h-1.5 rounded-sm bg-slate-800 border border-slate-700" />
          </div>
          <span className="text-[9px] font-mono text-slate-500 tracking-wider">
            C · M · Y · K — REGISTRATION OK
          </span>
        </div>
      </div>

      {/* ================= SISI KANAN: LIGHT LOGIN CARD ================= */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 bg-[#f4f7fc]">
        <div className="w-full max-w-[390px] bg-white rounded-3xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col justify-between">
          <div>
            {/* Top Navigation Tabs */}
            <div className="flex p-1 bg-slate-100/90 rounded-2xl mb-6">
              <button
                type="button"
                onClick={() => setTab('login')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                  tab === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Masuk
              </button>
              <button
                type="button"
                onClick={() => setTab('signup')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                  tab === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Sign Up
              </button>
              <button
                type="button"
                onClick={() => setTab('reset')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                  tab === 'reset' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Ubah Sandi
              </button>
            </div>

            {/* Form Input */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1.5">Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username"
                  className="w-full px-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-200/80 bg-slate-50/50 text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1.5">Password</label>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••"
                    className="w-full pl-4 pr-10 py-2.5 text-xs font-semibold rounded-xl border border-slate-200/80 bg-slate-50/50 text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-500 focus:bg-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#0e1726] hover:bg-black text-white font-bold text-xs rounded-xl shadow-lg shadow-slate-900/10 transition mt-2 active:scale-[0.99]"
              >
                {loading ? 'Memproses...' : 'Masuk ke Sistem'}
              </button>
            </form>

            <div className="text-center my-3">
              <span className="text-[10px] text-slate-400">
                Tekan <b className="text-slate-600 font-semibold">Enter</b> untuk masuk · belum punya akun? pilih tab <b className="text-slate-700 font-semibold">Sign Up</b>
              </span>
            </div>

            {/* Banner Akun Demo */}
            <div className="text-[11px] text-emerald-800 bg-[#e8f8f0] border border-emerald-200/70 rounded-2xl py-3 px-4 text-center mb-6">
              Akun demo (selalu aktif): <b className="font-mono text-emerald-700 font-bold">guest / 123456</b>
            </div>
          </div>

          {/* Indikator Database Status */}
          <div className="pt-4 border-t border-slate-100">
            <div className="grid grid-cols-2 gap-y-2.5 text-[10px]">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isReady('master_user') ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`} />
                <span className="font-bold text-slate-700">USER</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isReady('job_active') ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`} />
                <span className="font-bold text-slate-700">JOB ACTIVE</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isReady('rec_ctcp') ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`} />
                <span className="font-bold text-slate-700">CTCP</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isReady('rec_ctp') ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`} />
                <span className="font-bold text-slate-700">CTP</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isReady('rec_screen') ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`} />
                <span className="font-bold text-slate-700">SCREEN</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isReady('rec_flexo') ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`} />
                <span className="font-bold text-slate-700">FLEXO</span>
              </div>
              <div className="flex items-center gap-2 col-span-2">
                <span className={`w-2 h-2 rounded-full ${isReady('rec_etching') ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`} />
                <span className="font-bold text-slate-700">ETCHING</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Copyright */}
        <div className="mt-6 text-[10px] text-slate-400">
          &copy; 2026 Aether Code
        </div>
      </div>
    </div>
  );
}