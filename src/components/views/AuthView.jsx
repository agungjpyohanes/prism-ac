import React, { useState } from 'react';
import { supabase } from '../../services/supabase';
import { 
  Eye, 
  EyeOff, 
  KeyRound, 
  UserPlus, 
  LogIn, 
  ShieldCheck, 
  CheckCircle2, 
  Server, 
  Database,
  Lock,
  User,
  Sparkles
} from 'lucide-react';

export default function AuthView({ usersData = [], onLoginSuccess, onToast, serverStatus = {} }) {
  const [tab, setTab] = useState('login');
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
    { key: 'jop_active', label: 'JOB ACTIVE' },
    { key: 'rec_ctcp', label: 'CTCP' },
    { key: 'rec_ctp', label: 'CTP' },
    { key: 'rec_screen', label: 'SCREEN' },
    { key: 'rec_flexo', label: 'FLEXO' },
    { key: 'rec_etching', label: 'ETCHING' },
    { key: 'master_user', label: 'USER' }
  ];

  const allConnected = tables.every((t) => serverStatus[t.key] === 'live');

  return (
    <div className="relative min-h-screen w-full bg-[#090d16] text-slate-100 flex items-center justify-center p-4 sm:p-6 overflow-hidden select-none font-sans">
      
      {/* Background Aurora Lighting Effects */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-sky-500/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[160px] pointer-events-none" />
      
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Main Glassmorphic Card Container */}
      <div className="relative w-full max-w-[460px] bg-slate-900/70 backdrop-blur-2xl border border-slate-700/50 rounded-3xl p-7 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.6)] space-y-6 z-10 transition-all">
        
        {/* Brand Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-2xl blur opacity-70 group-hover:opacity-100 transition duration-300" />
              <div className="relative w-12 h-12 rounded-2xl bg-slate-950 border border-slate-700/80 flex items-center justify-center font-display font-black text-2xl text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 to-indigo-400 shadow-inner">
                P
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-black text-xl tracking-tight text-white">
                  PRISM
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                  V 1.0
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-400">
                Prepress Integrated System & Monitoring
              </p>
            </div>
          </div>
          
          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-[10px] font-semibold text-slate-300">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>Smart Suite</span>
          </div>
        </div>

        {/* Tab Navigation Switcher */}
        <div className="flex p-1 bg-slate-950/60 border border-slate-800/80 rounded-2xl text-xs font-bold">
          <button
            onClick={() => setTab('login')}
            className={`flex-1 py-2 rounded-xl transition-all duration-200 ${
              tab === 'login'
                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-600/30 font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Masuk
          </button>
          <button
            onClick={() => setTab('signup')}
            className={`flex-1 py-2 rounded-xl transition-all duration-200 ${
              tab === 'signup'
                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-600/30 font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign Up
          </button>
          <button
            onClick={() => setTab('change_pwd')}
            className={`flex-1 py-2 rounded-xl transition-all duration-200 ${
              tab === 'change_pwd'
                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-600/30 font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Ubah Sandi
          </button>
        </div>

        {/* Form Area */}
        <form
          onSubmit={
            tab === 'login' ? handleLogin : tab === 'signup' ? handleSignup : handleChangePassword
          }
          className="space-y-4"
        >
          {/* Username Input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block ml-1">
              Username
            </label>
            <div className="relative flex items-center">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-950/70 border border-slate-700/70 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-100 text-xs font-semibold rounded-xl pl-10 pr-4 py-2.5 outline-none transition placeholder:text-slate-600"
                placeholder="Masukkan username..."
              />
            </div>
          </div>

          {/* Role Selector (Only for Sign Up) */}
          {tab === 'signup' && (
            <div className="space-y-1.5 anim-in">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block ml-1">
                Role Akses
              </label>
              <div className="relative flex items-center">
                <ShieldCheck className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-950/70 border border-slate-700/70 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-100 text-xs font-semibold rounded-xl pl-10 pr-4 py-2.5 outline-none transition cursor-pointer"
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
            </div>
          )}

          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block ml-1">
              {tab === 'change_pwd' ? 'Password Lama' : 'Password'}
            </label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950/70 border border-slate-700/70 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-100 text-xs font-semibold rounded-xl pl-10 pr-10 py-2.5 outline-none transition placeholder:text-slate-600"
                placeholder="Masukkan password..."
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 text-slate-500 hover:text-slate-300 transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password Input (Only for Change Password) */}
          {tab === 'change_pwd' && (
            <div className="space-y-1.5 anim-in">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block ml-1">
                Password Baru
              </label>
              <div className="relative flex items-center">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-950/70 border border-slate-700/70 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-100 text-xs font-semibold rounded-xl pl-10 pr-4 py-2.5 outline-none transition placeholder:text-slate-600"
                  placeholder="Masukkan password baru..."
                />
              </div>
            </div>
          )}

          {/* Action Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-indigo-500 via-indigo-600 to-blue-600 hover:from-indigo-600 hover:to-blue-700 active:scale-[0.99] text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition duration-200 disabled:opacity-50 cursor-pointer"
          >
            {tab === 'login' && <LogIn className="w-4 h-4" />}
            {tab === 'signup' && <UserPlus className="w-4 h-4" />}
            {tab === 'change_pwd' && <KeyRound className="w-4 h-4" />}
            <span>
              {loading
                ? 'Memproses Autentikasi...'
                : tab === 'login'
                ? 'Masuk ke Sistem (Tekan Enter)'
                : tab === 'signup'
                ? 'Daftarkan Akun Baru'
                : 'Perbarui Kata Sandi'}
            </span>
          </button>
        </form>

        {/* Demo Account Indicator Box */}
        <div className="p-3 bg-emerald-950/30 border border-emerald-500/20 rounded-2xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="text-emerald-300 font-semibold text-[11px]">Akun Demo: </span>
              <span className="font-bold text-white text-[11px]">guest / 123456</span>
            </div>
          </div>
          <span className="text-[10px] text-emerald-400/80 font-medium">
            {(usersData || []).length} Akun Terdaftar
          </span>
        </div>

        {/* Database & Table Health Indicator Grid */}
        <div className="pt-4 border-t border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span>Koneksi Tabel Supabase</span>
            </div>
            <span className={allConnected ? 'text-emerald-400 font-extrabold' : 'text-amber-400'}>
              {allConnected ? 'ONLINE 100%' : 'CONNECTING...'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {tables.map((t) => {
              const isLive = serverStatus[t.key] === 'live';
              return (
                <div
                  key={t.key}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800/80"
                >
                  <span className="text-[10px] font-bold text-slate-300 truncate pr-1">
                    {t.label}
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      isLive 
                        ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' 
                        : 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}