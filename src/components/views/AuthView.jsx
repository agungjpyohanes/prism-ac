import React, { useState } from 'react';
import { Eye, EyeOff, Sparkles, Shield, Zap, TrendingUp } from 'lucide-react';

export default function AuthView({ usersData = [], data = {}, serverStatus = {}, onLoginSuccess, onToast }) {
  const [tab, setTab] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const LOGO_URL = "https://drive.google.com/thumbnail?id=1A7Ws0vZZtO7nc-k8lNTzt4tlLt0xqODx&sz=w500";

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    
    setTimeout(() => {
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
        }
      }
      setLoading(false);
    }, 500);
  };

  const isReady = (key) => {
    const rows = data[key];
    if (rows && Array.isArray(rows) && rows.length > 0) return true;
    if (serverStatus && serverStatus[key] === 'live') return true;
    return false;
  };

  return (
    <div className="min-h-screen w-full flex bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 relative overflow-hidden">
        {/* Animated Background */}
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
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-500/50">
              <img src={LOGO_URL} alt="PRISM" className="w-8 h-8 object-contain" referrerPolicy="no-referrer" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">PRISM</h1>
              <p className="text-xs text-indigo-400 font-mono uppercase tracking-wider">V 2.0</p>
            </div>
          </div>

          <div className="max-w-lg">
            <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
              Prepress Integrated<br />
              <span className="gradient-text">System & Monitoring</span>
            </h2>
            <p className="text-lg text-slate-300 mb-8 leading-relaxed">
              Pusat kendali data prepress modern — monitoring plate CTCP & CTP, screen, flexo, dan etching dalam satu dashboard terintegrasi yang powerful.
            </p>

            {/* Feature Cards */}
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">Real-time Monitoring</h3>
                  <p className="text-xs text-slate-400">Pantau semua lini produksi secara real-time dengan data yang selalu update</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">Advanced Analytics</h3>
                  <p className="text-xs text-slate-400">Analisis mendalam dengan visualisasi data yang interaktif dan informatif</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">Secure & Reliable</h3>
                  <p className="text-xs text-slate-400">Sistem aman dengan enkripsi end-to-end dan backup otomatis</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Stats */}
        <div className="relative z-10 grid grid-cols-3 gap-6 pt-8 border-t border-white/10">
          <div>
            <div className="text-3xl font-bold text-white mb-1">99.9%</div>
            <div className="text-xs text-slate-400 uppercase tracking-wider">Uptime</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-white mb-1">5+</div>
            <div className="text-xs text-slate-400 uppercase tracking-wider">Lini Produksi</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-white mb-1">24/7</div>
            <div className="text-xs text-slate-400 uppercase tracking-wider">Monitoring</div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo Mobile */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-500/50">
              <img src={LOGO_URL} alt="PRISM" className="w-8 h-8 object-contain" referrerPolicy="no-referrer" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">PRISM</h1>
              <p className="text-xs text-indigo-400 font-mono uppercase tracking-wider">V 2.0</p>
            </div>
          </div>

          {/* Login Card */}
          <div className="card p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Selamat Datang</h2>
              <p className="text-sm text-slate-400">Masuk ke akun PRISM Anda untuk melanjutkan</p>
            </div>

            {/* Tabs */}
            <div className="flex p-1 bg-white/5 rounded-xl mb-6">
              <button
                type="button"
                onClick={() => setTab('login')}
                className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${
                  tab === 'login' 
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Masuk
              </button>
              <button
                type="button"
                onClick={() => setTab('signup')}
                className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${
                  tab === 'signup' 
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  className="input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password"
                    className="input pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Memproses...
                  </span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Masuk ke Sistem
                  </>
                )}
              </button>
            </form>

            {/* Demo Account */}
            <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
              <p className="text-xs text-emerald-300 text-center">
                <span className="font-bold">Demo Account:</span> guest / 123456
              </p>
            </div>

            {/* Database Status */}
            <div className="mt-6 pt-6 border-t border-white/5">
              <p className="text-xs text-slate-500 mb-3 font-semibold uppercase tracking-wider">Status Database</p>
              <div className="grid grid-cols-2 gap-2">
                {['master_user', 'job_active', 'rec_ctcp', 'rec_ctp', 'rec_screen', 'rec_flexo', 'rec_etching'].map((key) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isReady(key) ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                    <span className="text-[10px] font-mono text-slate-400 uppercase">{key.replace('rec_', '').replace('master_', '')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-slate-500 mt-6">
            &copy; 2026 PRISM V2.0 • Aether Code
          </p>
        </div>
      </div>
    </div>
  );
}