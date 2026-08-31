import React from 'react';
import { MENUS } from '../../constants/navigation';
import { LogOut, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

export default function Sidebar({ currentMenu, onMenuChange, user, onLogout, collapsed, onToggle }) {
  const userRole = String(user?.ROLE || user?.role || 'guest').toLowerCase().trim();
  
  const availableMenus = MENUS.filter((m) => {
    if (!m.roles || m.roles.length === 0) return true;
    if (userRole === 'admin' || userRole === 'manager' || userRole === 'manajemen') return true;
    return m.roles.includes(userRole);
  });

  return (
    <aside 
      className={`fixed top-0 left-0 h-full z-40 transition-all duration-300 flex flex-col ${
        collapsed ? 'w-20' : 'w-72'
      }`}
      style={{
        background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)'
      }}
    >
      {/* Header Branding */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">PRISM</h2>
                <p className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider">V 2.0 • Prepress</p>
              </div>
            </div>
          )}
          <button 
            type="button"
            onClick={onToggle} 
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {availableMenus.map((m) => {
          const Icon = m.icon;
          const active = currentMenu === m.id;
          
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onMenuChange(m.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                active
                  ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-white border border-indigo-500/30 shadow-lg shadow-indigo-500/10'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              title={collapsed ? m.label : ''}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                active 
                  ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md shadow-indigo-500/30' 
                  : 'bg-white/5 group-hover:bg-white/10'
              }`}>
                <Icon className="w-4 h-4" />
              </div>
              {!collapsed && (
                <span className="text-sm font-semibold truncate">{m.label}</span>
              )}
              {active && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              )}
            </button>
          );
        })}
      </nav>

      {/* User Profile Footer */}
      <div className="p-4 border-t border-white/5">
        <div className={`flex items-center gap-3 p-3 rounded-xl bg-white/5 ${collapsed ? 'justify-center' : ''}`}>
          {!collapsed ? (
            <>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-500/30">
                {String(user?.USER || user?.username || 'A').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{user?.USER || user?.username || 'User'}</p>
                <p className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider">
                  {user?.ROLE || user?.role || 'Operator'}
                </p>
              </div>
            </>
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
              {String(user?.USER || user?.username || 'A').charAt(0).toUpperCase()}
            </div>
          )}
          <button 
            type="button"
            onClick={onLogout} 
            title="Logout" 
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}