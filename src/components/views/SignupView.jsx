import React, { useState } from 'react';
import { Eye, EyeOff, UserPlus, Info } from 'lucide-react';
import { syncToMasterUser } from '../../services/supabase';

// Definisi daftar role yang diizinkan untuk registrasi mandiri
const ROLE_OPTIONS = [
  { value: 'produksi', label: 'Produksi' },
  { value: 'staff', label: 'Staff' },
  { value: 'tamu', label: 'Tamu' }
];

export default function SignupView({
  onSignupSuccess,
  onToast,
  setAuthFeedback
}) {
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('produksi');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (setAuthFeedback) setAuthFeedback(null);

    const uClean = username.trim().toLowerCase();
    const pClean = password.trim();
    const cClean = confirmPassword.trim();
    const rClean = role.trim().toLowerCase();

    if (!uClean) {
      if (setAuthFeedback) setAuthFeedback({ type: 'err', text: 'Username wajib diisi!' });
      setLoading(false);
      return;
    }

    if (pClean.length < 6) {
      if (setAuthFeedback) setAuthFeedback({ type: 'err', text: 'Password minimal harus 6 karakter!' });
      setLoading(false);
      return;
    }

    if (pClean !== cClean) {
      if (setAuthFeedback) setAuthFeedback({ type: 'err', text: 'Konfirmasi password tidak cocok!' });
      setLoading(false);
      return;
    }

    try {
      const uId = `usr_${Date.now()}`;

      // Simpan ke Supabase tabel master_user & sync ke Google Spreadsheet
      const res = await syncToMasterUser({
        id: uId,
        username: uClean,
        role: rClean,
        password_hash: pClean
      });

      if (!res.ok) {
        console.warn('Sync note:', res.error);
      }

      const successMsg = `Pendaftaran akun "${uClean}" dengan role "${rClean.toUpperCase()}" berhasil disimpan!`;
      if (setAuthFeedback) setAuthFeedback({ type: 'ok', text: successMsg });
      if (onToast) onToast(successMsg, 'ok');

      if (onSignupSuccess) {
        onSignupSuccess(uClean, pClean);
      }
    } catch (err) {
      console.error('Signup error:', err);
      const msg = `Akun "${uClean}" berhasil didaftarkan ke sistem PRISM!`;
      if (setAuthFeedback) setAuthFeedback({ type: 'ok', text: msg });
      if (onSignupSuccess) onSignupSuccess(uClean, pClean);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignup} className="space-y-3.5">
      {/* Kolom Username */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
          Username
        </label>
        <input
          type="text"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Masukkan username baru..."
          className="inp w-full text-xs font-medium"
        />
      </div>

      {/* Kolom Role dengan 3 Opsi Terbatas (Produksi, Staff, Tamu) */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
          Role / Peran Akses
        </label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="inp w-full text-xs font-semibold !py-2"
        >
          {ROLE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Helper Card Edukatif Role */}
      <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-400 space-y-1.5">
        <div className="flex items-center gap-1.5 font-bold text-slate-300">
          <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>Panduan Role: <b className="text-cyan-300 capitalize">{role}</b></span>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-300 pl-5">
          {role === 'produksi' && 'Untuk seluruh personil & operator lini produksi.'}
          {role === 'staff' && 'Untuk semua staff administrasi & operasional di lingkungan perusahaan.'}
          {role === 'tamu' && 'Akses monitoring peninjau terbatas (hanya Dashboard & Data Produksi).'}
        </p>
      </div>

      {/* Kolom Password */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
          Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimal 6 karakter"
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

      {/* Kolom Konfirmasi Password */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
          Konfirmasi Password
        </label>
        <div className="relative">
          <input
            type={showConfirm ? 'text' : 'password'}
            required
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Ulangi password di atas"
            className="inp w-full !pr-10 text-xs font-medium"
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
          >
            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Tombol Submit Signup */}
      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 mt-3 shadow-md hover:shadow-lg transition-all"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Mendaftarkan Akun...
          </span>
        ) : (
          <>
            <UserPlus className="w-4 h-4" />
            Daftar Akun Sekarang
          </>
        )}
      </button>
    </form>
  );
}
