import React, { useState, useEffect } from 'react';
import { useProductionData } from './hooks/useProductionData';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Modal from './components/common/Modal';
import AuthView from './components/views/AuthView';
import OverviewView from './components/views/OverviewView';
import ProductionView from './components/views/ProductionView';
import CompareView from './components/views/CompareView';
import DataTableView from './components/views/DataTableView';
import ProcessAnalyticsView from './components/views/ProcessAnalyticsView';
import OperatorShiftView from './components/views/OperatorShiftView';
import LeaderboardView from './components/views/LeaderboardView';
import ExecutiveOverallView from './components/views/ExecutiveOverallView';
import PersonalKpiView from './components/views/PersonalKpiView';
import FormsView from './components/views/FormsView';
import { SHEETS } from './constants/schema';
import { getDefaultPeriod, num, parseDateVal } from './utils/formatters';

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

  const handleOpenList = (title, key, rows, subtitle) => {
    setModalState({ type: 'list', title, key, rows, subtitle });
  };

  const handleSelectRow = (key, row) => {
    setModalState({ type: 'detail', title: 'Detail Data Transaksi', key, row });
  };

  const handleOpenMetric = (key, metric, rows) => {
    const cfg = SHEETS[key] || SHEETS.rec_ctcp;
    let filteredRows = rows || [];
    let label = metric.toUpperCase();

    if (metric === 'baik') {
      filteredRows = (rows || []).filter((r) => num(r[cfg.i.baik]) > 0);
      label = cfg.cards?.baik || 'PLATE BAIK';
    } else if (metric === 'rusak') {
      filteredRows = (rows || []).filter((r) => num(r[cfg.i.rusak]) > 0);
      label = cfg.cards?.rusak || 'PLATE RUSAK / DEFECT';
    } else if (metric === 'ganti') {
      filteredRows = (rows || []).filter((r) => num(r[cfg.i.ganti]) > 0);
      label = cfg.cards?.ganti || 'PLATE GANTI / REPRINT';
    } else if (metric === 'pakai') {
      filteredRows = (rows || []).filter((r) => (num(r[cfg.i.baik]) + num(r[cfg.i.rusak])) > 0);
      label = cfg.cards?.pakai || 'TOTAL PLATE DIPROSES';
    } else if (metric === 'pct') {
      filteredRows = (rows || []).filter((r) => num(r[cfg.i.rusak]) > 0);
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
        if (metric === 'baik') return num(r[cfg.i.baik]);
        if (metric === 'rusak') return num(r[cfg.i.rusak]);
        if (metric === 'ganti') return num(r[cfg.i.ganti]);
        if (metric === 'pakai') return num(r[cfg.i.baik]) + num(r[cfg.i.rusak]);
        if (metric === 'pct') {
          const p = num(r[cfg.i.baik]) + num(r[cfg.i.rusak]);
          return p > 0 ? (num(r[cfg.i.rusak]) / p) * 100 : 0;
        }
        return 0;
      },
      causeIdx: metric === 'rusak' ? cfg.i.penyRusak : (metric === 'ganti' ? cfg.i.penyGanti : null)
    });
  };

  const handleOpenDayModal = (key, timestamp) => {
    const cfg = SHEETS[key] || SHEETS.rec_ctcp;
    const dateObj = new Date(timestamp);
    const dateStr = dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    const filteredRows = (data[key] || []).filter((r) => {
      const d = parseDateVal(r[cfg.i.date]);
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
        setCurrentMenu('data');
      },
      onMenuChange: setCurrentMenu
    };

    switch (currentMenu) {
      case 'overview':
        return <OverviewView {...commonProps} />;
      case 'production':
        return <ProductionView {...commonProps} />;
      case 'comparison':
        return <CompareView data={data} onToast={(msg) => alert(msg)} />;
      case 'data':
        return <DataTableView tabKey={activeTabKey} {...commonProps} user={currentUser} />;
      case 'analytics':
        return <ProcessAnalyticsView tabKey={activeTabKey} {...commonProps} />;
      case 'team':
        return <OperatorShiftView data={data} period={period} />;
      case 'leaderboard':
        return <LeaderboardView data={data} period={period} />;
      case 'executive':
        return <ExecutiveOverallView {...commonProps} />;
      case 'personal':
        return <PersonalKpiView data={data} user={currentUser} period={period} />;
      case 'forms':
        return <FormsView onToast={(msg) => alert(msg)} />;
      default:
        return <OverviewView {...commonProps} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#060a14] dark:bg-[#060a14] text-slate-100 dark:text-slate-100 flex overflow-x-hidden transition-colors">
      <Sidebar
        currentMenu={currentMenu}
        onMenuChange={setCurrentMenu}
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
            <div className="flex items-center justify-center py-32 text-slate-400 text-sm font-semibold">
              Sinkronisasi data sistem...
            </div>
          ) : (
            renderView()
          )}
        </main>

        <footer className="p-4 border-t border-slate-800/80 dark:border-slate-800/80 text-center text-xs text-slate-500 dark:text-slate-400 font-mono">
          &copy; 2026 PRISM Integrated System & Monitoring V2.5 &bull; Aether Code
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