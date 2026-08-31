import React, { useState } from 'react';
import { Eye, EyeOff, User, Lock } from 'lucide-react';

export default function AuthView({ usersData = [], data = {}, serverStatus = {}, onLoginSuccess, onToast }) {
  const [tab, setTab] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const LOGO_URL = "https://drive.google.com/thumbnail?id=1A7Ws0vZZtO7nc-k8lNTzt4tlLt0xqODx&sz=w500";

  const handleLogin = (e) => {
    e.preventDefault();
    const uClean = username.trim().toLowerCase();
    const pClean = password.trim();

    if (uClean === 'guest' && pClean === '123456') {
      onLoginSuccess({ USER: 'guest', ROLE: 'guest', ID: 'guest_01' });
      return;
    }

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
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden select-none font-sans">
      
      {/* Background Cosmic Starfield Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(99,102,241,0.25)_0%,transparent_60%)] pointer-events-none" />
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glass Center Modal - Sesuai Slide 1 PDF */}
      <div className="w-full max-w-[440px] card p-8 sm:p-10 relative z-10 flex flex-col items-center">
        
        {/* Glowing Logo */}
        <div className="w-20 h-20 mb-4 p-2 rounded-2xl bg-white/5 border border-white/20 flex items-center justify-center backdrop-blur-xl shadow-[0_0_30px_rgba(56,189,248,0.4)]">
          <img 
            src={LOGO_URL} 
            alt="PRISM Logo" 
            className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(56,189,248,0.7)]" 
            referrerPolicy="no-referrer" 
          />
        </div>

        <h1 className="font-display font-black text-3xl tracking-wider text-white">PRISM</h1>
        <p className="text-cyan-300 text-xs font-semibold tracking-wide mb-6">
          Integrated System & Monitoring
        </p>

        {/* Input Form Pill Shaped */}
        <form onSubmit={handleLogin} className="w-full space-y-3.5">
          <div className="relative flex items-center">
            <User className="absolute left-4 w-4 h-4 text-slate-400" />
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="inp w-full !pl-11"
            />
          </div>

          <div className="relative flex items-center">
            <Lock className="absolute left-4 w-4 h-4 text-slate-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="inp w-full !pl-11 !pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 text-slate-400 hover:text-cyan-300 transition"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 text-xs tracking-wider uppercase mt-2 active:scale-[0.99]"
          >
            {loading ? 'Memproses...' : 'Masuk ke Sistem'}
          </button>
        </form>

        {/* Action Pills */}
        <div className="flex gap-2 w-full mt-3.5">
          <button
            type="button"
            onClick={() => onToast?.('Pendaftaran mandiri dinonaktifkan oleh Administrator.', 'info')}
            className="flex-1 py-2 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] font-medium transition"
          >
            Daftar Akun
          </button>
          <button
            type="button"
            onClick={() => onToast?.('Silakan hubungi IT/Admin untuk reset password.', 'info')}
            className="flex-1 py-2 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] font-medium transition"
          >
            Lupa Kata Sandi
          </button>
        </div>

        {/* Demo Badge */}
        <div className="text-[11px] text-cyan-300/80 bg-cyan-950/40 border border-cyan-500/30 rounded-full py-2 px-4 text-center mt-6 w-full font-mono">
          Demo: <b className="text-white font-bold">guest / 123456</b>
        </div>

        {/* Database Status Pills */}
        <div className="flex items-center justify-center gap-3 pt-6 mt-4 border-t border-white/10 w-full text-[10px]">
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className={`w-2 h-2 rounded-full ${isReady('master_user') ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'bg-amber-400'}`} /> Online
          </span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]" /> Syncing
          </span>
        </div>

      </div>
    </div>
  );
}