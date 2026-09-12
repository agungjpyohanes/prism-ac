import React, { useState, useEffect } from 'react';
import {
  Shield,
  Zap,
  TrendingUp,
  UserPlus,
  LogIn,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ArrowLeft,
  Mail,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { supabase, updateMasterUserPassword } from '../../services/supabase';
import LoginView from './LoginView';
import SignupView from './SignupView';

export default function AuthView({ usersData = [], data = {}, serverStatus = {}, onLoginSuccess, onToast }) {
  // Mode: 'login' | 'signup' | 'forgot_password' | 'set_new_password'
  const [mode, setMode] = useState('login');

  // Forgot / Reset Password State
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  // Set New Password State
  const [resetUsername, setResetUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmNewPass, setShowConfirmNewPass] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // Feedback Banner
  const [authFeedback, setAuthFeedback] = useState(null); // { type: 'ok' | 'err', text: '' }

  // Deteksi Otomatis Event Pemulihan Password dari Link Email
  useEffect(() => {
    const hash = window.location.hash || '';
    const search = window.location.search || '';
    const isRecovery =
      hash.includes('type=recovery') ||
      hash.includes('access_token') ||
      search.includes('type=recovery') ||
      window.location.pathname.includes('reset-password');

    if (isRecovery) {
      setMode('set_new_password');
      setAuthFeedback({
        type: 'ok',
        text: 'Sesi pemulihan akun terverifikasi. Silakan buat password baru Anda.'
      });
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMode('set_new_password');
        if (session?.user?.email) {
          setResetUsername(session.user.email);
        }
        setAuthFeedback({
          type: 'ok',
          text: 'Sesi pemulihan akun terverifikasi. Silakan masukkan password baru Anda.'
        });
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe?.();
    };
  }, []);

  // 1. Eksekusi Minta Link Reset Password via Email
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setAuthFeedback(null);

    const email = forgotEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      setAuthFeedback({ type: 'err', text: 'Masukkan alamat email yang valid untuk reset password!' });
      setForgotLoading(false);
      return;
    }

    try {
      const redirectTo = `${window.location.origin}${window.location.pathname}#type=recovery`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo
      });

      if (error) {
        console.warn('Supabase resetPasswordForEmail note:', error.message);
      }

      setAuthFeedback({
        type: 'ok',
        text: `Link reset password telah dikirim ke "${email}". Silakan periksa inbox atau folder spam email Anda.`
      });
      if (onToast) onToast('Link reset password berhasil dikirim!', 'ok');

    } catch (err) {
      console.error('Reset password error:', err);
      setAuthFeedback({
        type: 'ok',
        text: `Jika email terdaftar, instruksi reset password telah dikirim ke "${email}".`
      });
    } finally {
      setForgotLoading(false);
    }
  };

  // 2. Eksekusi Set Password Baru
  const handleSetNewPassword = async (e) => {
    e.preventDefault();
    setResetLoading(true);
    setAuthFeedback(null);

    const pClean = newPassword.trim();
    const cClean = confirmNewPassword.trim();
    const uClean = resetUsername.trim().toLowerCase();

    if (pClean.length < 6) {
      setAuthFeedback({ type: 'err', text: 'Password baru minimal harus 6 karakter!' });
      setResetLoading(false);
      return;
    }

    if (pClean !== cClean) {
      setAuthFeedback({ type: 'err', text: 'Konfirmasi password baru tidak cocok!' });
      setResetLoading(false);
      return;
    }

    try {
      // 1. Update di Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: pClean
      });

      if (error) {
        console.warn('Supabase auth updateUser note:', error.message);
      }

      // 2. Update di tabel master_user (Supabase & Google Spreadsheet)
      if (uClean) {
        await updateMasterUserPassword(uClean, pClean);
      }

      // Bersihkan hash URL
      if (window.history.replaceState) {
        window.history.replaceState(null, '', window.location.pathname);
      }

      setAuthFeedback({
        type: 'ok',
        text: 'Password Anda berhasil diperbarui! Mengarahkan ke halaman login...'
      });
      if (onToast) onToast('Password berhasil diperbarui!', 'ok');

      setTimeout(() => {
        setMode('login');
        setResetLoading(false);
      }, 1500);

    } catch (err) {
      console.error('Error update user password:', err);
      setAuthFeedback({ type: 'err', text: 'Terjadi kesalahan sistem saat memperbarui password.' });
      setResetLoading(false);
    }
  };

  const isReady = (key) => {
    const rows = data[key];
    if (rows && Array.isArray(rows) && rows.length > 0) return true;
    if (serverStatus && serverStatus[key] === 'live') return true;
    return false;
  };

  return (
    <div className="min-h-screen w-full flex bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 relative overflow-hidden">
        {/* Animated Background Orbs */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
        </div>

        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}
        />

        {/* Content */}
        <div className="relative z-10 max-w-lg">
          {/* Large Visual Logo Panel */}
          <div className="text-center mb-6">
            <img
              src="/favicon.png"
              alt="PRISM Logo"
              className="w-40 h-40 object-contain mx-auto drop-shadow-[0_0_20px_rgba(56,189,248,0.45)] mb-6"
            />
            <h1 className="font-display font-black text-4xl tracking-wider text-white">
              PRISM
            </h1>
            <p className="text-sm font-mono text-cyan-400 font-bold mt-1">
              Integrated System &amp; Monitoring V2.5
            </p>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-4 leading-tight">
              Pusat Kendali Data Prepress Modern
            </h2>
            <p className="text-sm text-slate-300 mb-8 leading-relaxed font-medium">
              Monitoring plate CTCP &amp; CTP, screen sablon, flexo packaging, dan etching dalam satu platform terintegrasi.
            </p>

            {/* Feature Cards */}
            <div className="space-y-3.5">
              <div
                className="flex items-start gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-700/60"
                style={{ WebkitBackdropFilter: 'blur(12px)', backdropFilter: 'blur(12px)' }}
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-cyan-500/30">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white mb-0.5">Real-time Monitoring &amp; Antrean</h3>
                  <p className="text-xs text-slate-300">Pantau status pengerjaan seluruh lini prepress secara langsung dan akurat.</p>
                </div>
              </div>

              <div
                className="flex items-start gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-700/60"
                style={{ WebkitBackdropFilter: 'blur(12px)', backdropFilter: 'blur(12px)' }}
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/30">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white mb-0.5">Dual-Sync Database &amp; Spreadsheet</h3>
                  <p className="text-xs text-slate-300">Sinkronisasi instan akun master_user ke Supabase dan Google Spreadsheet.</p>
                </div>
              </div>

              <div
                className="flex items-start gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-700/60"
                style={{ WebkitBackdropFilter: 'blur(12px)', backdropFilter: 'blur(12px)' }}
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/30">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white mb-0.5">Role-Based Access Control (RBAC)</h3>
                  <p className="text-xs text-slate-300">Hak navigasi terstruktur untuk Developer, Prepress, Manager, Tamu, User, dan Staff.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Stats */}
        <div className="relative z-10 grid grid-cols-3 gap-6 pt-8 border-t border-white/10">
          <div>
            <div className="text-3xl font-black text-cyan-300 mb-1">5+</div>
            <div className="text-xs text-slate-400 uppercase tracking-wider font-mono">Lini Proses</div>
          </div>
          <div>
            <div className="text-3xl font-black text-emerald-400 mb-1">99.9%</div>
            <div className="text-xs text-slate-400 uppercase tracking-wider font-mono">SLA Uptime</div>
          </div>
          <div>
            <div className="text-3xl font-black text-indigo-300 mb-1">24/7</div>
            <div className="text-xs text-slate-400 uppercase tracking-wider font-mono">Live Tracking</div>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Forms */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          {/* Logo Mobile */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-6">
            <img
              src="/favicon.png"
              alt="PRISM Logo"
              className="w-10 h-10 object-contain"
            />
            <div>
              <h2 className="font-display font-black text-xl text-white">PRISM</h2>
              <p className="text-[10px] font-mono text-cyan-400 font-bold">Integrated System</p>
            </div>
          </div>

          {/* Form Card Container */}
          <div
            className="card p-6 sm:p-8 border border-cyan-500/30 shadow-[0_0_50px_rgba(0,0,0,0.8)] bg-slate-900/90"
            style={{
              WebkitBackdropFilter: 'blur(20px)',
              backdropFilter: 'blur(20px)'
            }}
          >
            {/* Top Card Branding Logo Header */}
            <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-slate-800">
              <img
                src="/favicon.png"
                alt="PRISM Logo"
                className="w-10 h-10 object-contain shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-black text-lg sm:text-xl tracking-wider text-white">
                    PRISM
                  </h3>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                    V2.5
                  </span>
                </div>
                <p className="text-xs font-mono text-cyan-400 font-semibold truncate">
                  Integrated System &amp; Monitoring
                </p>
              </div>
            </div>

            {/* Header Titles Based on Mode */}
            <div className="mb-5">
              {mode === 'login' && (
                <>
                  <h2 className="text-2xl font-black text-white mb-1 tracking-tight">Selamat Datang Kembali</h2>
                  <p className="text-xs sm:text-sm text-slate-300">Masuk ke akun PRISM Anda untuk mengakses sistem</p>
                </>
              )}
              {mode === 'signup' && (
                <>
                  <h2 className="text-2xl font-black text-white mb-1 tracking-tight">Pendaftaran Akun Baru</h2>
                  <p className="text-xs sm:text-sm text-slate-300">Daftarkan akun operator / staff untuk akses data PRISM</p>
                </>
              )}
              {mode === 'forgot_password' && (
                <>
                  <h2 className="text-2xl font-black text-white mb-1 tracking-tight flex items-center gap-2">
                    <KeyRound className="w-6 h-6 text-amber-400" />
                    Reset Password
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300">Masukkan email Anda untuk menerima tautan ubah password</p>
                </>
              )}
              {mode === 'set_new_password' && (
                <>
                  <h2 className="text-2xl font-black text-white mb-1 tracking-tight flex items-center gap-2">
                    <Lock className="w-6 h-6 text-emerald-400" />
                    Set Password Baru
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300">Buat password baru yang aman untuk akun Anda</p>
                </>
              )}
            </div>

            {/* Navigation Tabs (Hanya ditampilkan pada mode login & signup) */}
            {(mode === 'login' || mode === 'signup') && (
              <div className="flex p-1 bg-slate-800/90 rounded-2xl mb-5 border border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setAuthFeedback(null);
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    mode === 'login' 
                      ? 'btn-primary text-white shadow-md' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Masuk (Login)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setAuthFeedback(null);
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    mode === 'signup' 
                      ? 'btn-primary text-white shadow-md' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Daftar (Sign Up)
                </button>
              </div>
            )}

            {/* Feedback Alert */}
            {authFeedback && (
              <div
                className={`mb-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  authFeedback.type === 'ok'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}
              >
                {authFeedback.type === 'ok' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{authFeedback.text}</span>
              </div>
            )}

            {/* ========================================================= */}
            {/* 1. FORM LOGIN */}
            {/* ========================================================= */}
            {mode === 'login' && (
              <LoginView
                usersData={usersData}
                data={data}
                serverStatus={serverStatus}
                onLoginSuccess={onLoginSuccess}
                onForgotPasswordClick={(u) => {
                  setForgotEmail(u && u.includes('@') ? u : '');
                  setResetUsername(u || '');
                  setMode('forgot_password');
                  setAuthFeedback(null);
                }}
                onToast={onToast}
                setAuthFeedback={setAuthFeedback}
              />
            )}

            {/* ========================================================= */}
            {/* 2. FORM SIGNUP (Opsi Role: Produksi, Staff, Tamu) */}
            {/* ========================================================= */}
            {mode === 'signup' && (
              <SignupView
                onSignupSuccess={(u, p) => {
                  setTimeout(() => {
                    setMode('login');
                  }, 1200);
                }}
                onToast={onToast}
                setAuthFeedback={setAuthFeedback}
              />
            )}

            {/* ========================================================= */}
            {/* 3. FORM FORGOT PASSWORD (Kirim Link Reset via Email) */}
            {/* ========================================================= */}
            {mode === 'forgot_password' && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Alamat Email Terdaftar
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="Masukkan email akun Anda..."
                      className="inp w-full !pl-9 text-xs font-medium"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="btn-primary w-full py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
                >
                  {forgotLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Mengirim Link...
                    </span>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      Kirim Link Reset Password
                    </>
                  )}
                </button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setAuthFeedback(null);
                    }}
                    className="text-xs text-slate-400 hover:text-white flex items-center justify-center gap-1.5 mx-auto font-semibold transition"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Kembali ke Halaman Masuk
                  </button>
                </div>
              </form>
            )}

            {/* ========================================================= */}
            {/* 4. FORM SET NEW PASSWORD (Setelah klik link email) */}
            {/* ========================================================= */}
            {mode === 'set_new_password' && (
              <form onSubmit={handleSetNewPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Username / Email Akun
                  </label>
                  <input
                    type="text"
                    value={resetUsername}
                    onChange={(e) => setResetUsername(e.target.value)}
                    placeholder="Masukkan username atau email..."
                    className="inp w-full text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Password Baru (Min. 6 Karakter)
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Masukkan password baru..."
                      className="inp w-full !pr-10 text-xs font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                    >
                      {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Konfirmasi Password Baru
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmNewPass ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Ulangi password baru..."
                      className="inp w-full !pr-10 text-xs font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmNewPass(!showConfirmNewPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                    >
                      {showConfirmNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="btn-primary w-full py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
                >
                  {resetLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Menyimpan Password...
                    </span>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Simpan Password Baru
                    </>
                  )}
                </button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setAuthFeedback(null);
                    }}
                    className="text-xs text-slate-400 hover:text-white flex items-center justify-center gap-1.5 mx-auto font-semibold transition"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Kembali ke Halaman Masuk
                  </button>
                </div>
              </form>
            )}

            {/* Demo Account Callout */}
            <div className="mt-5 p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-center">
              <p className="text-xs text-cyan-300">
                <span className="font-bold text-white">Akun Demo Cepat:</span> guest / 123456
              </p>
            </div>

            {/* Database Status Indicators */}
            <div className="mt-5 pt-4 border-t border-slate-800">
              <p className="text-[10px] text-slate-400 mb-2 font-bold uppercase tracking-wider font-mono">
                Status Konektivitas Data Live
              </p>
              <div className="grid grid-cols-2 gap-2">
                {['master_user', 'job_active', 'rec_ctcp', 'rec_ctp', 'rec_screen', 'rec_flexo', 'rec_etching'].map((key) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isReady(key) ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-amber-400'}`} />
                    <span className="text-[10px] font-mono text-slate-300 uppercase">{key.replace('rec_', '').replace('master_', '')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-slate-400 mt-6">
            &copy; 2026 PRISM V2.5 &bull; Aether Code
          </p>
        </div>
      </div>
    </div>
  );
}