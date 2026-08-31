import React from 'react';
import { MENUS } from '../../constants/navigation';
import { LogOut, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Sidebar({ currentMenu, onMenuChange, user, onLogout, collapsed, onToggle }) {
  const userRole = String(user?.ROLE || user?.role || 'guest').toLowerCase().trim();

  // Filter menu berdasarkan hak akses role pengguna
  const availableMenus = MENUS.filter((m) => {
    if (!m.roles || m.roles.length === 0) return true;
    if (userRole === 'admin' || userRole === 'manager' || userRole === 'manajemen') return true;
    return m.roles.includes(userRole);
  });

  return (
    <aside className={`fixed top-0 left-0 h-full z-40 bg-[#080d1a] border-r border-slate-800/80 transition-all flex flex-col justify-between ${collapsed ? 'w-20' : 'w-64'}`}>
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Branding */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between shrink-0">
          {!collapsed && (
            <div>
              <h2 className="font-black text-lg tracking-wider text-white">PRISM</h2>
              <p className="text-[10px] font-mono text-cyan-400">V 1.0 &bull; Prepress</p>
            </div>
          )}
          <button 
            type="button"
            onClick={onToggle} 
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white mx-auto cursor-pointer"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Menu Items Container */}
        <nav className="p-3 space-y-1.5 overflow-y-auto flex-1">
          {availableMenus.map((m) => {
            const Icon = m.icon;
            const active = currentMenu === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onMenuChange(m.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  active
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
                title={collapsed ? m.label : ''}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span className="truncate">{m.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Footer Profile */}
      <div className="p-4 border-t border-slate-800/80 flex items-center justify-between shrink-0 bg-[#060a14]">
        {!collapsed ? (
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 flex items-center justify-center font-bold text-xs shrink-0">
              {String(user?.USER || user?.username || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-white truncate leading-tight">{user?.USER || user?.username || 'agung'}</p>
              <p className="text-[10px] font-mono text-cyan-400 uppercase font-semibold">{user?.ROLE || user?.role || 'MANAGER'}</p>
            </div>
          </div>
        ) : null}
        <button 
          type="button"
          onClick={onLogout} 
          title="Keluar / Logout" 
          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer shrink-0"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}