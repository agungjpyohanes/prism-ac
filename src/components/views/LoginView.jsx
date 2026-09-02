import React, { useState } from 'react';
import { Eye, EyeOff, Sparkles, KeyRound, Info, Database } from 'lucide-react';
import { loginFromMasterUser } from '../../services/supabase';

export default function LoginView({
  usersData = [],
  data = {},
  serverStatus = {},
  onLoginSuccess,
  onForgotPasswordClick,
  onToast,
  setAuthFeedback
}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Status Koneksi Tunggal Database (Live / Ready)
  const isDatabaseReady = (usersData && usersData.length > 0) || (serverStatus && serverStatus.master_user === 'live') || (data && Object.keys(data).length > 0);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (setAuthFeedback) setAuthFeedback(null);

    const uClean = username.trim().toLowerCase();
    const pClean = password.trim();

    // 1. Akun Demo Cepat
    if (uClean === 'guest' && pClean === '123456') {
      setTimeout(() => {
        onLoginSuccess({
          USER: 'guest',
          username: 'guest',
          ROLE: 'tamu',
          role: 'tamu',
          ID: 'guest_01'
        });
        setLoading(false);
      }, 300);
      return;
    }

    // 2. Cek Langsung ke Tabel master_user di Supabase
    try {
      const res = await loginFromMasterUser(uClean, pClean);
      if (res.ok && res.user) {
        onLoginSuccess(res.user);
        setLoading(false);
        return;
      }
    } catch {
      /* lanjut fallback cache */
    }

    // 3. Cek via master_user Cache / Matrix [id, username, role, password_hash]
    const found = (usersData || []).find((r) => {
      let u = '', p = '';
      if (Array.isArray(r)) {
        if (r.length === 4 && r[0] && String(r[0]).startsWith('usr_')) {
          u = String(r[1] || '').trim().toLowerCase();
          p = String(r[3] || '').trim();
        } else {
          u = String(r[0] || '').trim().toLowerCase();
          p = String(r[2] || '').trim();
        }
      } else if (r && typeof r === 'object') {
        u = String(r.username || r.user || '').trim().toLowerCase();
        p = String(r.password_hash || r.password || '').trim();
      }
      return u === uClean && p === pClean;
    });

    if (found) {
      let uName = uClean, uRole = 'prepress', uId = '1';
      if (Array.isArray(found)) {
        if (found.length === 4 && found[0] && String(found[0]).startsWith('usr_')) {
          uId = found[0];
          uName = found[1];
          uRole = found[2];
        } else {
          uName = found[0];
          uRole = found[1];
          uId = found[3] || '1';
        }
      } else {
        uName = found.username || found.user;
        uRole = found.role || 'prepress';
        uId = found.id || '1';
      }

      setTimeout(() => {
        onLoginSuccess({
          USER: uName,
          username: uName,
          ROLE: String(uRole).toLowerCase(),
          role: String(uRole).toLowerCase(),
          ID: String(uId)
        });
        setLoading(false);
      }, 300);
      return;
    }

    // Gagal
    setTimeout(() => {
      const errTxt = 'Username atau password tidak sesuai!';
      if (setAuthFeedback) setAuthFeedback({ type: 'err', text: errTxt });
      if (onToast) onToast(errTxt, 'err');
      setLoading(false);
    }, 300);
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      {/* Notice Box Instruksi Kesiapan Koneksi */}
      <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-200 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold text-white">Perhatian: </span>
          Harap pastikan lampu indikator Database telah berwarna <b className="text-emerald-400">HIJAU</b> sebelum menekan tombol Login.
        </div>
      </div>

      {/* Indikator Tunggal Koneksi Database */}
      <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="text-xs font-bold text-slate-200">Database</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isDatabaseReady
                ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse'
                : 'bg-amber-400 animate-ping'
            }`}
          />
          <span className={`text-[11px] font-mono font-bold ${isDatabaseReady ? 'text-emerald-400' : 'text-amber-400'}`}>
            {isDatabaseReady ? 'Ready / Live' : 'Connecting...'}
          </span>
        </div>
      </div>

      {/* Kolom Username dengan Label Tegas */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
          Username
        </label>
        <input
          type="text"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Masukkan username..."
          className="inp w-full text-xs font-medium"
        />
      </div>

      {/* Kolom Password dengan Label Tegas */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
          Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Masukkan password..."
            className="inp w-full !pr-10 text-xs font-medium"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Tombol Utama Login */}
      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 mt-2 shadow-md hover:shadow-lg transition-all"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Memproses...
          </span>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Login ke Sistem
          </>
        )}
      </button>

      {/* Posisi Link "Lupa Password?" / "Ganti Password" tepat di BAGIAN BAWAH tombol Login */}
      <div className="pt-2 text-center">
        <button
          type="button"
          onClick={() => {
            if (onForgotPasswordClick) onForgotPasswordClick(username);
          }}
          className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition inline-flex items-center gap-1.5 py-1"
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Lupa Password? / Ganti Password</span>
        </button>
      </div>
    </form>
  );
}
