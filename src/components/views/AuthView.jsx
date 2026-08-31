import React, { useState } from 'react';
import { Eye, EyeOff, Sparkles, Shield, Zap, TrendingUp, Menu, X } from 'lucide-react';

export default function AuthView({ usersData = [], data = {}, serverStatus = {}, onLoginSuccess, onToast }) {
  const [tab, setTab] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);

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
        if (onToast) onToast('Username atau password tidak cocok!', 'err');
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
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#050814] relative overflow-hidden">
      {/* Cosmic Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-72 h-72 sm:w-96 sm:h-96 bg-purple-500/20 rounded-full mix-blend-screen filter blur-3xl anim-float" />
        <div className="absolute bottom-0 right-0 w-72 h-72 sm:w-96 sm:h-96 bg-cyan-500/20 rounded-full mix-blend-screen filter blur-3xl anim-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 w-72 h-72 sm:w-96 sm:h-96 bg-pink-500/10 rounded-full mix-blend-screen filter blur-3xl anim-float" style={{ animationDelay: '4s' }} />
      </div>

      {/* Stars */}
      <div 
        className="fixed inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(1px 1px at 20px 30px, rgba(255,255,255,0.4), transparent),
            radial-gradient(1px 1px at 40px 70px, rgba(255,255,255,0.3), transparent),
            radial-gradient(1px 1px at 90px 40px, rgba(255,255,255,0.5), transparent),
            radial-gradient(1px 1px at 130px 80px, rgba(255,255,255,0.3), transparent)
          `,
          backgroundSize: '200px 100px',
          backgroundRepeat: 'repeat'
        }}
      />

      {/* Mobile Top Bar */}
      <div className="lg:hidden relative z-10 flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg anim-pulse-glow">
            <img src={LOGO_URL} alt="PRISM" className="w-6 h-6 object-contain" referrerPolicy="no-referrer" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">PRISM</h1>
            <p className="text-[9px] text-cyan-400 font-mono uppercase tracking-wider">V 2.0</p>
          </div>
        </div>
        <button 
          onClick={() => setShowFeatures(!showFeatures)}
          className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
        >
          {showFeatures ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {/* Left Side - Branding (Desktop) */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-cyan-500/50 anim-pulse-glow">
            <img src={LOGO_URL} alt="PRISM" className="w-8 h-8 object-contain" referrerPolicy="no-referrer" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">PRISM</h1>
            <p className="text-xs text-cyan-400 font-mono uppercase tracking-wider">V 2.0 • Cosmic</p>
          </div>
        </div>

        <div className="max-w-lg">
          <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
            Prepress Integrated<br />
            <span className="gradient-text">System & Monitoring</span>
          </h2>
          <p className="text-lg text-slate-300 mb-8 leading-relaxed">
            Pusat kendali data prepress modern — monitoring plate CTCP & CTP, screen, flexo, dan etching dalam satu dashboard terintegrasi.
          </p>

          <div className="space-y-4">
            {[
              { icon: Zap, color: 'from-cyan-500 to-blue-600', title: 'Real-time Monitoring', desc: 'Pantau semua lini produksi secara real-time' },
              { icon: TrendingUp, color: 'from-purple-500 to-pink-600', title: 'Advanced Analytics', desc: 'Analisis mendalam dengan visualisasi interaktif' },
              { icon: Shield, color: 'from-pink-500 to-rose-600', title: 'Secure & Reliable', desc: 'Sistem aman dengan enkripsi end-to-end' }
            ].map((f, i) => (
              <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-cyan-500/5 backdrop-blur-sm border border-cyan-500/20 hover:border-cyan-500/40 transition-all">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                  <f.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">{f.title}</h3>
                  <p className="text-xs text-slate-400">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 pt-8 border-t border-cyan-500/20">
          {[
            { val: '99.9%', label: 'Uptime' },
            { val: '5+', label: 'Lini Produksi' },
            { val: '24/7', label: 'Monitoring' }
          ].map((s, i) => (
            <div key={i}>
              <div className="text-3xl font-bold text-white mb-1">{s.val}</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Features Panel */}
      {showFeatures && (
        <div className="lg:hidden fixed inset-0 z-20 bg-[#050814]/95 backdrop-blur-lg p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white">Fitur PRISM</h2>
            <button onClick={() => setShowFeatures(false)} className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-3">
            {[
              { icon: Zap, color: 'from-cyan-500 to-blue-600', title: 'Real-time Monitoring', desc: 'Pantau semua lini produksi secara real-time' },
              { icon: TrendingUp, color: 'from-purple-500 to-pink-600', title: 'Advanced Analytics', desc: 'Analisis mendalam dengan visualisasi interaktif' },
              { icon: Shield, color: 'from-pink-500 to-rose-600', title: 'Secure & Reliable', desc: 'Sistem aman dengan enkripsi end-to-end' }
            ].map((f, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/20">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center flex-shrink-0`}>
                  <f.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">{f.title}</h3>
                  <p className="text-xs text-slate-400">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-cyan-500/20">
            {[
              { val: '99.9%', label: 'Uptime' },
              { val: '5+', label: 'Lini' },
              { val: '24/7', label: 'Monitor' }
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl font-bold text-white">{s.val}</div>
                <div className="text-[10px] text-slate-400 uppercase">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 relative z-10">
        <div className="w-full max-w-md">
          {/* Login Card */}
          <div className="card p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Selamat Datang</h2>
              <p className="text-sm text-slate-400">Masuk ke akun PRISM Anda</p>
            </div>

            {/* Tabs */}
            <div className="flex p-1 bg-cyan-500/5 rounded-xl mb-6 border border-cyan-500/20">
              {['login', 'signup', 'reset'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all
                    ${tab === t 
                      ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-lg' 
                      : 'text-slate-400 hover:text-cyan-300'
                    }
                  `}
                >
                  {t === 'login' ? 'Masuk' : t === 'signup' ? 'Sign Up' : 'Reset'}
                </button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  className="inp"
                  autoComplete="username"
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
                    className="inp pr-10"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-400"
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
            <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-xs text-emerald-300 text-center">
                <span className="font-bold">Demo:</span> guest / 123456
              </p>
            </div>

            {/* Database Status */}
            <div className="mt-4 pt-4 border-t border-cyan-500/15">
              <p className="text-[10px] text-slate-500 mb-2 font-semibold uppercase tracking-wider">Status Database</p>
              <div className="grid grid-cols-2 gap-1.5">
                {['master_user', 'job_active', 'rec_ctcp', 'rec_ctp', 'rec_screen', 'rec_flexo', 'rec_etching'].map((key) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isReady(key) ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                    <span className="text-[9px] font-mono text-slate-400 uppercase truncate">
                      {key.replace('rec_', '').replace('master_', '')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-[10px] text-slate-500 mt-4">
            &copy; 2026 PRISM • Cosmic Theme
          </p>
        </div>
      </div>
    </div>
  );
}