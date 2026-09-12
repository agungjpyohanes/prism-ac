import React, { useState, useEffect, useCallback } from 'react';
import { useProductionData } from './hooks/useProductionData';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Modal from './components/common/Modal';
import AuthView from './components/views/AuthView';
import OverviewView from './components/views/OverviewView';
import ProcessAnalyticsView from './components/views/ProcessAnalyticsView';
import DataTableView from './components/views/DataTableView';
import TeamKpiView from './components/views/TeamKpiView';
import ExecutiveOverallView from './components/views/ExecutiveOverallView';
import { SHEETS } from './constants/schema';
import { hasMenuAccess } from './constants/navigation';
import { getDefaultPeriod, num, parseDateVal, cell, getRowQtyGood, getRowQtyDefect, getRowQtyReplace } from './utils/formatters';

export default function App() {
  const { data, loading, serverStatus, reload } = useProductionData();
  
  // Theme State (Dark / Light) dengan persistensi localStorage
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('prism_theme') || 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('prism_theme', theme);
    } catch {
      /* ignore storage errors */
    }
    if (theme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const s = sessionStorage.getItem('prism_session') || sessionStorage.getItem('pf_session');
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  });

  const [currentMenu, setCurrentMenu] = useState('overview');
  const [activeTabKey, setActiveTabKey] = useState('rec_ctcp');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [modalState, setModalState] = useState(null);

  // State Rentang Periode Global (Default: Awal Bulan Berjalan / 30 Hari Terakhir s.d. Hari Ini)
  const [period, setPeriod] = useState(getDefaultPeriod);

  const userRole = String(currentUser?.ROLE || currentUser?.role || 'tamu').toLowerCase().trim();

  // ==========================================
  // ROUTE GUARD: Proteksi Akses Menu Berdasarkan Role
  // Matriks:
  // - developer, prepress, manager : Akses menu 1, 2, 3, 4, 5
  // - tamu, user, staff           : Hanya menu 1 (overview) dan 3 (data)
  // ==========================================
  const handleMenuChange = useCallback((menuId) => {
    if (!hasMenuAccess(userRole, menuId)) {
      alert(`Akses Terbatas: Role "${userRole.toUpperCase()}" tidak memiliki izin untuk membuka menu ini.`);
      setCurrentMenu('overview');
      return;
    }
    setCurrentMenu(menuId);
  }, [userRole]);

  useEffect(() => {
    if (currentUser && !hasMenuAccess(userRole, currentMenu)) {
      alert(`Akses Terbatas: Role "${userRole.toUpperCase()}" dialihkan kembali ke Dashboard Overview.`);
      setCurrentMenu('overview');
    }
  }, [currentUser, userRole, currentMenu]);

  const handleOpenList = (title, key, rows, subtitle, extraOptions = {}) => {
    setModalState({ type: 'list', title, key, rows, subtitle, ...extraOptions });
  };

  const handleSelectRow = (key, row) => {
    setModalState({ type: 'detail', title: 'Detail Data Transaksi', key, row });
  };

  const handleOpenMetric = (key, metric, rows) => {
    const cfg = SHEETS[key] || SHEETS.rec_ctcp;
    let filteredRows = rows || [];
    let label = metric.toUpperCase();

    if (metric === 'baik') {
      filteredRows = (rows || []).filter((r) => r && getRowQtyGood(r, cfg) > 0);
      label = cfg.cards?.baik || 'PLATE BAIK';
    } else if (metric === 'rusak') {
      filteredRows = (rows || []).filter((r) => r && getRowQtyDefect(r, cfg) > 0);
      label = cfg.cards?.rusak || 'PLATE RUSAK / DEFECT';
    } else if (metric === 'ganti') {
      filteredRows = (rows || []).filter((r) => r && getRowQtyReplace(r, cfg) > 0);
      label = cfg.cards?.ganti || 'PLATE GANTI / REPRINT';
    } else if (metric === 'pakai') {
      filteredRows = (rows || []).filter((r) => r && (getRowQtyGood(r, cfg) + getRowQtyDefect(r, cfg)) > 0);
      label = cfg.cards?.pakai || 'TOTAL PLATE DIPROSES';
    } else if (metric === 'pct') {
      filteredRows = (rows || []).filter((r) => r && getRowQtyDefect(r, cfg) > 0);
      label = 'DEFECT RATE & RECORD LOSS';
    }

    setModalState({
      type: 'metric',
      title: `Detail Data: ${label} (${cfg.label})`,
      subtitle: `Menampilkan ${filteredRows.length} baris transaksi spesifik pada periode aktif`,
      key,
      rows: filteredRows,
      metric,
      valLabel: label,
      valFn: (r) => {
        if (!r) return 0;
        const b = getRowQtyGood(r, cfg);
        const rk = getRowQtyDefect(r, cfg);
        const g = getRowQtyReplace(r, cfg);
        if (metric === 'baik') return b;
        if (metric === 'rusak') return rk;
        if (metric === 'ganti') return g;
        if (metric === 'pakai') return b + rk;
        if (metric === 'pct') {
          const p = b + rk;
          return p > 0 ? (rk / p) * 100 : 0;
        }
        return 0;
      },
      causeIdx: metric === 'rusak' ? cfg.i?.penyRusak : (metric === 'ganti' ? cfg.i?.penyGanti : null)
    });
  };

  const handleOpenDayModal = (key, timestamp) => {
    const cfg = SHEETS[key] || SHEETS.rec_ctcp;
    const dateObj = new Date(timestamp);
    const dateStr = dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    const filteredRows = (data[key] || []).filter((r) => {
      if (!r) return false;
      const d = parseDateVal(cell(r, cfg?.i?.date, ''));
      return d && d.toDateString() === dateObj.toDateString();
    });
    setModalState({
      type: 'list',
      title: `Data Produksi Harian: ${dateStr} (${cfg.label})`,
      subtitle: `Menampilkan ${filteredRows.length} transaksi pada tanggal ${dateStr}`,
      key,
      rows: filteredRows
    });
  };

  const handleLogin = (u) => {
    setCurrentUser(u);
    sessionStorage.setItem('prism_session', JSON.stringify(u));
  };

  const handleLogout = () => {
    sessionStorage.removeItem('prism_session');
    sessionStorage.removeItem('pf_session');
    setCurrentUser(null);
  };

  if (!currentUser) {
    return (
      <AuthView
        usersData={data.master_user}
        data={data}
        serverStatus={serverStatus}
        onLoginSuccess={handleLogin}
        onToast={(msg) => alert(msg)}
      />
    );
  }

  const renderView = () => {
    const commonProps = {
      tabKey: activeTabKey,
      onTabChange: setActiveTabKey,
      data,
      period,
      onSelectRow: handleSelectRow,
      onOpenList: handleOpenList,
      onOpenMetric: handleOpenMetric,
      onOpenDayModal: handleOpenDayModal,
      onGoToData: (k) => {
        if (k) setActiveTabKey(k);
        handleMenuChange('data');
      },
      onMenuChange: handleMenuChange,
      onToast: (msg) => alert(msg)
    };

    switch (currentMenu) {
      case 'overview':
        return <OverviewView {...commonProps} />;
      case 'analytics':
        return <ProcessAnalyticsView {...commonProps} />;
      case 'data':
        return <DataTableView tabKey={activeTabKey} {...commonProps} user={currentUser} />;
      case 'team_kpi':
        return <TeamKpiView data={data} user={currentUser} period={period} onOpenList={handleOpenList} />;
      case 'executive':
        return <ExecutiveOverallView {...commonProps} />;
      default:
        return <OverviewView {...commonProps} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] dark:bg-[#090d16] text-slate-900 dark:text-slate-100 flex overflow-x-hidden transition-colors duration-200">
      <Sidebar
        currentMenu={currentMenu}
        onMenuChange={handleMenuChange}
        user={currentUser}
        onLogout={handleLogout}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      <div className={`flex-1 transition-all duration-300 flex flex-col min-h-screen ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'} pl-0 min-w-0`}>
        <Header
          period={period}
          onPeriodChange={setPeriod}
          onReset={reload}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onToggleSidebar={() => {
            if (window.innerWidth < 1024) {
              setMobileSidebarOpen(!mobileSidebarOpen);
            } else {
              setSidebarCollapsed(!sidebarCollapsed);
            }
          }}
        />

        <main className="p-3 sm:p-5 lg:p-6 flex-1 space-y-5 sm:space-y-6 overflow-x-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-28 space-y-4">
              <div className="relative w-16 h-16 rounded-3xl bg-blue-50 dark:bg-cyan-500/10 border border-blue-200 dark:border-cyan-400/30 p-2.5 flex items-center justify-center shadow-lg shadow-cyan-500/20 animate-pulse overflow-hidden">
                <img
                  src="/favicon.png"
                  alt="PRISM Logo"
                  className="w-full h-full object-contain"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </div>
              <div className="text-center">
                <h3 className="font-display font-black text-sm tracking-wider text-slate-900 dark:text-white">
                  PRISM V2.5
                </h3>
                <p className="text-xs font-mono text-blue-600 dark:text-cyan-400 font-semibold mt-1 flex items-center justify-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  Sinkronisasi data sistem live...
                </p>
              </div>
            </div>
          ) : (
            renderView()
          )}
        </main>

        <footer className="p-4 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400 font-mono bg-white dark:bg-[#090d16]">
          &copy; 2026 PRISM Integrated System &amp; Monitoring V2.5 &bull; Aether Code
        </footer>
      </div>

      <Modal
        modalState={modalState}
        onClose={() => setModalState(null)}
        onSelectRow={handleSelectRow}
      />
    </div>
  );
}