import React from 'react';
import { MENUS } from '../../constants/navigation';
import { LogOut, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Sidebar({ currentMenu, onMenuChange, user, onLogout, collapsed, onToggle }) {
  const role = user?.ROLE || 'guest';
  const availableMenus = MENUS.filter((m) => m.roles.includes(role));

  return (
    <aside className={`fixed top-0 left-0 h-full z-40 bg-[#080d1a] border-r border-slate-800/80 transition-all flex flex-col justify-between ${collapsed ? 'w-20' : 'w-64'}`}>
      <div>
        {/* Header Branding */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          {!collapsed && (
            <div>
              <h2 className="font-black text-lg tracking-wider text-white">PRISM</h2>
              <p className="text-[10px] font-mono text-cyan-400">V 1.0 &bull; Prepress</p>
            </div>
          )}
          <button onClick={onToggle} className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white mx-auto">
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Menu Items */}
        <nav className="p-3 space-y-1">
          {availableMenus.map((m) => {
            const Icon = m.icon;
            const active = currentMenu === m.id;
            return (
              <button
                key={m.id}
                onClick={() => onMenuChange(m.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                  active
                    ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
                title={collapsed ? m.label : ''}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span>{m.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Footer */}
      <div className="p-4 border-t border-slate-800/80 flex items-center justify-between">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 flex items-center justify-center font-bold text-xs">
              {user?.USER?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-bold text-white leading-tight">{user?.USER}</p>
              <p className="text-[10px] font-mono text-slate-400 uppercase">{user?.ROLE}</p>
            </div>
          </div>
        ) : null}
        <button onClick={onLogout} title="Keluar" className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition">
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}