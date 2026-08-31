import React from 'react';
import { MENUS } from '../../constants/navigation';
import { LogOut, ChevronLeft, ChevronRight, Sparkles, X } from 'lucide-react';

export default function Sidebar({ currentMenu, onMenuChange, user, onLogout, collapsed, onToggle, isOpen, onClose }) {
  const userRole = String(user?.ROLE || user?.role || 'guest').toLowerCase().trim();
  
  const availableMenus = MENUS.filter((m) => {
    if (!m.roles || m.roles.length === 0) return true;
    if (userRole === 'admin' || userRole === 'manager' || userRole === 'manajemen') return true;
    return m.roles.includes(userRole);
  });

  const handleMenuClick = (id) => {
    onMenuChange(id);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar - Desktop & Tablet Drawer */}
      <aside 
        className={`fixed top-0 left-0 h-full z-50 transition-all duration-300 flex flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${collapsed ? 'lg:w-20' : 'lg:w-64'}
          w-72 lg:w-auto
        `}
        style={{
          background: 'linear-gradient(180deg, rgba(5, 8, 20, 0.98) 0%, rgba(10, 14, 39, 0.98) 100%)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(6, 182, 212, 0.15)',
          boxShadow: '0 0 40px rgba(6, 182, 212, 0.1)'
        }}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-cyan-500/15 flex items-center justify-between shrink-0">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg anim-pulse-glow">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">PRISM</h2>
                <p className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">V 2.0 • Cosmic</p>
              </div>
            </div>
          )}
          <button 
            type="button"
            onClick={onToggle} 
            className="p-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 transition-all border border-cyan-500/20"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          {/* Close button for mobile */}
          <button 
            type="button"
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {availableMenus.map((m) => {
            const Icon = m.icon;
            const active = currentMenu === m.id;
            
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => handleMenuClick(m.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group
                  ${active
                    ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-white border border-cyan-500/40 shadow-lg shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/5 border border-transparent'
                  }
                  ${collapsed && !isOpen ? 'lg:justify-center lg:px-2' : ''}
                `}
                title={collapsed ? m.label : ''}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all shrink-0
                  ${active 
                    ? 'bg-gradient-to-br from-cyan-500 to-purple-600 shadow-md shadow-cyan-500/30' 
                    : 'bg-cyan-500/10 group-hover:bg-cyan-500/20 border border-cyan-500/20'
                  }
                `}>
                  <Icon className="w-4 h-4" />
                </div>
                {!collapsed && (
                  <span className="text-sm font-semibold truncate">{m.label}</span>
                )}
                {active && !collapsed && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />
                )}
              </button>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="p-3 sm:p-4 border-t border-cyan-500/15 shrink-0">
          <div className={`flex items-center gap-3 p-2.5 rounded-xl bg-cyan-500/5 border border-cyan-500/20
            ${collapsed && !isOpen ? 'lg:justify-center' : ''}
          `}>
            {!collapsed || isOpen ? (
              <>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-cyan-500/30 shrink-0">
                  {String(user?.USER || user?.username || 'A').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{user?.USER || user?.username || 'User'}</p>
                  <p className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">
                    {user?.ROLE || user?.role || 'Operator'}
                  </p>
                </div>
              </>
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {String(user?.USER || user?.username || 'A').charAt(0).toUpperCase()}
              </div>
            )}
            <button 
              type="button"
              onClick={onLogout} 
              title="Logout" 
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all border border-transparent hover:border-rose-500/20 shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}