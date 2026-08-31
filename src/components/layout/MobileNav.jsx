import React from 'react';
import { MENUS } from '../../constants/navigation';

export default function MobileNav({ currentMenu, onMenuChange, user }) {
  const userRole = String(user?.ROLE || user?.role || 'guest').toLowerCase().trim();
  
  // Show only top 5 menus on mobile bottom nav
  const availableMenus = MENUS
    .filter((m) => {
      if (!m.roles || m.roles.length === 0) return true;
      if (userRole === 'admin' || userRole === 'manager' || userRole === 'manajemen') return true;
      return m.roles.includes(userRole);
    })
    .slice(0, 5);

  return (
    <nav 
      className="mobile-nav fixed bottom-0 left-0 right-0 z-40 lg:hidden"
      style={{
        background: 'linear-gradient(180deg, rgba(10, 14, 39, 0.95) 0%, rgba(5, 8, 20, 0.98) 100%)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(6, 182, 212, 0.2)',
        boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.5)'
      }}
    >
      <div className="flex items-center justify-around px-2 py-2">
        {availableMenus.map((m) => {
          const Icon = m.icon;
          const active = currentMenu === m.id;
          
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onMenuChange(m.id)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all min-w-[60px]
                ${active
                  ? 'text-cyan-400'
                  : 'text-slate-500'
                }
              `}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all
                ${active
                  ? 'bg-gradient-to-br from-cyan-500/30 to-purple-500/30 border border-cyan-500/40 shadow-lg shadow-cyan-500/20'
                  : 'bg-transparent'
                }
              `}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-[9px] font-semibold truncate max-w-[60px]
                ${active ? 'text-cyan-400' : 'text-slate-500'}
              `}>
                {m.label.split(' ')[0]}
              </span>
              {active && (
                <div className="absolute -top-0.5 w-8 h-0.5 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}