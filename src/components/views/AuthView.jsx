import React, { useState } from 'react';
import { supabase } from '../../services/supabase';
import { Eye, EyeOff } from 'lucide-react';

export default function AuthView({ usersData = [], onLoginSuccess, onToast, serverStatus = {} }) {
  const [tab, setTab] = useState('login'); // 'login' | 'signup' | 'change_pwd'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [role, setRole] = useState('operator');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    const uClean = username.trim().toLowerCase();
    const pClean = password.trim();

    if (uClean === 'guest' && pClean === '123456') {
      onLoginSuccess({ USER: 'guest', ROLE: 'guest', ID: 'guest_01' });
      return;
    }

    const found = (usersData || []).find(
      (r) => String(r[0] || '').toLowerCase() === uClean && String(r[2] || '') === pClean
    );

    if (found) {
      onLoginSuccess({
        USER: found[0],
        ROLE: String(found[1] || 'guest').toLowerCase(),
        ID: found[3] || '1'
      });
    } else {
      onToast('Username atau password tidak cocok!', 'err');
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    const uClean = username.trim().toLowerCase();
    const pClean = password.trim();

    try {
      const { error } = await supabase.from('master_user').insert([
        {
          username: uClean,
          role: role.toLowerCase(),
          password_hash: pClean
        }
      ]);
      if (error) throw error;
      onToast('Pendaftaran berhasil! Silakan login.', 'ok');
      setTab('login');
    } catch (err) {
      onToast(`Pendaftaran gagal: ${err.message}`, 'err');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    const uClean = username.trim().toLowerCase();
    const pOld = password.trim();
    const pNew = newPassword.trim();

    const found = (usersData || []).find(
      (r) => String(r[0] || '').toLowerCase() === uClean && String(r[2] || '') === pOld
    );

    if (!found) {
      onToast('Username atau password lama salah!', 'err');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('master_user')
        .update({ password_hash: pNew })
        .eq('username', uClean);
      if (error) throw error;
      onToast('Password berhasil diubah! Silakan login kembali.', 'ok');
      setTab('login');
      setPassword('');
      setNewPassword('');
    } catch (err) {
      onToast(`Gagal update password: ${err.message}`, 'err');
    } finally {
      setLoading(false);
    }
  };

  const tables = [
    { key: 'master_user', label: 'USER' },
    { key: 'jop_active', label: 'JOB ACTIVE' },
    { key: 'rec_ctcp', label: 'CTCP' },
    { key: 'rec_ctp', label: 'CTP' },
    { key: 'rec_screen', label: 'SCREEN' },
    { key: 'rec_flexo', label: 'FLEXO' },
    { key: 'rec_etching', label: 'ETCHING' }
  ];

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#0b101b] font-sans select-none">
      
      {/* SISI KIRI: Branding & Graphic Art Decor (Dark Panel) */}
      <div className="relative flex-1 bg-[#0b101b] text-white p-8 lg:p-16 flex flex-col justify-between overflow-hidden">
        {/* Dot Pattern Background */}
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none" 
          style={{ 
            backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)', 
            backgroundSize: '24px 24px' 
          }} 
        />

        {/* Watermark Target / Registration Mark Cetak */}
        <div className="absolute right-[-40px] bottom-[-40px] w-96 h-96 opacity-10 pointer-events-none">
          <svg viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full text-slate-300">
            <circle cx="100" cy="100" r="80" />
            <circle cx="100" cy="100" r="40" />
            <line x1="100" y1="0" x2="100" y2="200" />
            <line x1="0" y1="100" x2="200" y2="100" />
          </svg>
        </div>

        {/* Top Header Tag */}
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 p-1 flex items-center justify-center font-black text-xs text-sky-400">
            P
          </div>
          <span className="font-extrabold tracking-wider text-xs uppercase text-slate-200">
            PREPRESS SMART
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 font-bold border border-sky-500/30">
            V 1.0
          </span>
        </div>

        {/* Middle Hero Typography */}
        <div className="relative z-10 my-auto py-12 max-w-lg space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-white p-2 shadow-xl flex items-center justify-center border border-slate-700">
            <span className="text-xl font-black tracking-tight text-slate-900 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              PRISM
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              Prepress<br />Smart
            </h1>
            <p className="text-xs lg:text-sm text-slate-400 leading-relaxed max-w-md pt-2">
              Pusat kendali data prepress — monitoring plate CTCP & CTP, screen, flexo, dan etching dalam satu dashboard terintegrasi.
            </p>
          </div>

          {/* Badges Proses Cetak */}
          <div className="flex flex-wrap gap-2 pt-2">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-900 border border-slate-800 text-purple-400">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" /> CTCP
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-900 border border-slate-800 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> CTP
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-900 border border-slate-800 text-cyan-400">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" /> SCREEN
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-900 border border-slate-800 text-pink-400">
              <span className="w-1.5 h-1.5 rounded-full bg-pink-500" /> FLEXO
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-900 border border-slate-800 text-amber-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> ETCHING
            </span>
          </div>
        </div>

        {/* Bottom CMYK Control Bar */}
        <div className="relative z-10 space-y-1.5">
          <div className="flex gap-1 h-1.5 w-40">
            <div className="flex-1 bg-cyan-400 rounded-sm" />
            <div className="flex-1 bg-pink-500 rounded-sm" />
            <div className="flex-1 bg-yellow-400 rounded-sm" />
            <div className="flex-1 bg-slate-900 border border-slate-700 rounded-sm" />
          </div>
          <p className="text-[9px] font-bold tracking-widest text-slate-500 uppercase">
            C · M · Y · K — REGISTRATION OK
          </p>
        </div>
      </div>

      {/* SISI KANAN: White Clean Authentication Card Area */}
      <div className="flex-1 bg-[#f4f7fb] flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-[420px] bg-white rounded-3xl p-8 sm:p-9 shadow-[0_15px_40px_rgba(0,0,0,0.06)] border border-slate-100 space-y-5">
          
          {/* Tab Selector */}
          <div className="flex bg-slate-100/90 p-1 rounded-xl text-xs font-bold text-slate-500">
            <button
              onClick={() => setTab('login')}
              className={`flex-1 py-2 rounded-lg transition-all ${
                tab === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
              }`}
            >
              Masuk
            </button>
            <button
              onClick={() => setTab('signup')}
              className={`flex-1 py-2 rounded-lg transition-all ${
                tab === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
              }`}
            >
              Sign Up
            </button>
            <button
              onClick={() => setTab('change_pwd')}
              className={`flex-1 py-2 rounded-lg transition-all ${
                tab === 'change_pwd' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
              }`}
            >
              Ubah Sandi
            </button>
          </div>

          {/* Form */}
          <form
            onSubmit={
              tab === 'login' ? handleLogin : tab === 'signup' ? handleSignup : handleChangePassword
            }
            className="space-y-4"
          >
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 block">
                Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                className="w-full bg-[#f8fafc] border border-slate-200 focus:border-slate-800 focus:bg-white text-slate-800 text-xs font-medium rounded-xl px-3.5 py-2.5 outline-none transition"
              />
            </div>

            {tab === 'signup' && (
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 block">
                  Role Akses
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-slate-200 focus:border-slate-800 focus:bg-white text-slate-800 text-xs font-medium rounded-xl px-3.5 py-2.5 outline-none transition"
                >
                  <option value="operator">Operator (Menu 1-5)</option>
                  <option value="staff">Staff (Menu 1-5)</option>
                  <option value="koordinator">Koordinator (Menu 1-5)</option>
                  <option value="supervisor">Supervisor (Menu 1-5)</option>
                  <option value="prepress">Prepress (Menu 1-10)</option>
                  <option value="manager">Manager (Menu 1-10)</option>
                  <option value="developer">Developer (Menu 1-10)</option>
                </select>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 block">
                {tab === 'change_pwd' ? 'Password Lama' : 'Password'}
              </label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full bg-[#f8fafc] border border-slate-200 focus:border-slate-800 focus:bg-white text-slate-800 text-xs font-medium rounded-xl pl-3.5 pr-10 py-2.5 outline-none transition"
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

            {tab === 'change_pwd' && (
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 block">
                  Password Baru
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full bg-[#f8fafc] border border-slate-200 focus:border-slate-800 focus:bg-white text-slate-800 text-xs font-medium rounded-xl px-3.5 py-2.5 outline-none transition"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-[#0d1527] hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {loading
                ? 'Memproses...'
                : tab === 'login'
                ? 'Masuk ke Sistem'
                : tab === 'signup'
                ? 'Daftarkan Akun'
                : 'Ubah Password'}
            </button>
          </form>

          <p className="text-[10px] text-center text-slate-400">
            Tekan <b className="text-slate-600">Enter</b> untuk masuk · belum punya akun? pilih tab <b className="text-slate-600">Sign Up</b>
          </p>

          {/* Akun Demo Alert Box */}
          <div className="p-3.5 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl text-xs space-y-1">
            <div className="text-[11px] text-emerald-900">
              <span className="font-bold">Akun demo (selalu aktif):</span> <b>guest / 123456</b>
            </div>
            <div className="text-[10px] text-emerald-700">
              ✓ {(usersData || []).length} akun master_user termuat dari Database.
            </div>
          </div>

          {/* Database Health Grid */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px]">
              {tables.map((t) => {
                const isLive = serverStatus[t.key] === 'live';
                return (
                  <div key={t.key} className="flex items-center gap-1.5 text-slate-600">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isLive ? 'bg-emerald-500' : 'bg-amber-400'
                      }`}
                    />
                    <span className="font-bold">{t.label}</span>
                    <span className="text-[9px] text-slate-400">
                      {isLive ? 'live ✓' : 'mencari...'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        <p className="mt-8 text-[11px] text-slate-400 text-center">
          &copy; 2026 Prepress Smart &bull; Database Supabase Cloud
        </p>
      </div>

    </div>
  );
}