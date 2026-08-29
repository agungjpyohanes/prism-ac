import React, { useState } from 'react';
import { supabase } from '../../services/supabase';
import { Eye, EyeOff, KeyRound, UserPlus, LogIn } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-2xl space-y-5 border border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-600 text-white flex items-center justify-center font-display font-extrabold text-2xl shadow-lg">
            P
          </div>
          <div>
            <div className="font-display font-black text-xl text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              PRISM
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300 font-bold">
                V 1.0
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium">Prepress Integrated System & Monitoring</div>
          </div>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl text-xs font-bold">
          <button
            onClick={() => setTab('login')}
            className={`flex-1 py-2 rounded-xl transition ${
              tab === 'login' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow' : 'text-slate-400'
            }`}
          >
            Masuk
          </button>
          <button
            onClick={() => setTab('signup')}
            className={`flex-1 py-2 rounded-xl transition ${
              tab === 'signup' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow' : 'text-slate-400'
            }`}
          >
            Sign Up
          </button>
          <button
            onClick={() => setTab('change_pwd')}
            className={`flex-1 py-2 rounded-xl transition ${
              tab === 'change_pwd' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow' : 'text-slate-400'
            }`}
          >
            Ubah Sandi
          </button>
        </div>

        <form
          onSubmit={
            tab === 'login' ? handleLogin : tab === 'signup' ? handleSignup : handleChangePassword
          }
          className="space-y-3.5"
        >
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="inp w-full py-2.5 px-3.5 text-xs font-semibold dark:bg-slate-800 dark:text-white dark:border-slate-700"
              placeholder="Masukkan username..."
            />
          </div>

          {tab === 'signup' && (
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Role Akses
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="inp w-full py-2.5 px-3.5 text-xs font-semibold dark:bg-slate-800 dark:text-white dark:border-slate-700"
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

          <div className="relative">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              {tab === 'change_pwd' ? 'Password Lama' : 'Password'}
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="inp w-full py-2.5 px-3.5 text-xs font-semibold pr-10 dark:bg-slate-800 dark:text-white dark:border-slate-700"
              placeholder="Masukkan password..."
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-8 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {tab === 'change_pwd' && (
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Password Baru
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="inp w-full py-2.5 px-3.5 text-xs font-semibold dark:bg-slate-800 dark:text-white dark:border-slate-700"
                placeholder="Masukkan password baru..."
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full py-2.5 text-xs font-bold rounded-xl shadow-lg mt-1 flex items-center justify-center gap-2"
          >
            {tab === 'login' && <LogIn className="w-4 h-4" />}
            {tab === 'signup' && <UserPlus className="w-4 h-4" />}
            {tab === 'change_pwd' && <KeyRound className="w-4 h-4" />}
            <span>
              {loading
                ? 'Memproses...'
                : tab === 'login'
                ? 'Masuk ke Sistem (Tekan Enter)'
                : tab === 'signup'
                ? 'Daftarkan Akun'
                : 'Simpan Password Baru'}
            </span>
          </button>
        </form>

        <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-[11px] text-emerald-800 dark:text-emerald-300">
          <div className="font-bold flex items-center justify-between">
            <span>Akun demo: <b>guest / 123456</b></span>
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
            ✓ {(usersData || []).length} akun master_user termuat dari Supabase.
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
            {tables.map((t) => {
              const isLive = serverStatus[t.key] === 'live';
              return (
                <div key={t.key} className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isLive ? 'bg-emerald-500 shadow-[0_0_6px_#10b981]' : 'bg-rose-500'
                    }`}
                  />
                  <span className="font-semibold">{t.label}</span>
                  <span className="text-[9px] text-slate-400">{isLive ? 'live ✓' : 'offline ✗'}</span>
                </div>
              );
            })}
          </div>

          <div className="text-[10px] flex items-center gap-1.5 pt-1 text-slate-500 dark:text-slate-400">
            <span
              className={`w-2 h-2 rounded-full ${
                allConnected ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
            <span>
              {allConnected
                ? '✓ Terhubung ke Database Supabase.'
                : 'Menghubungkan ke Database Supabase...'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}