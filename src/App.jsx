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
import { SHEETS } from './constants/schema';
import { num, startOfDay } from './utils/formatters';

export default function App() {
  const { data, loading, serverStatus, reload } = useProductionData();
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const s = sessionStorage.getItem('pf_session');
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  });

  const [currentMenu, setCurrentMenu] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedProcessKey, setSelectedProcessKey] = useState('rec_ctcp');
  const [modalState, setModalState] = useState(null);
  const [modalHistory, setModalHistory] = useState([]);

  // Theme State
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('prism_theme') || 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'light');
    root.classList.add(theme);
    localStorage.setItem('prism_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const [period, setPeriod] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });

  const handleLogin = (u) => {
    setCurrentUser(u);
    sessionStorage.setItem('pf_session', JSON.stringify(u));
  };

  const handleLogout = () => {
    sessionStorage.removeItem('pf_session');
    setCurrentUser(null);
  };

  // Modal Handlers Global
  const openListModal = (title, key, rows, subtitle = '') => {
    setModalHistory([]);
    setModalState({ type: 'list', title, key, rows, subtitle });
  };

  const openMetricModal = (key, metric, rows) => {
    const cfg = SHEETS[key];
    if (!cfg) return;
    setModalHistory([]);
    let filtered = rows;
    let valFn = () => 0;
    let valLabel = 'QTY';
    let causeIdx = null;

    if (metric === 'baik') {
      filtered = rows.filter((r) => num(r[cfg.i.baik]) > 0);
      valFn = (r) => num(r[cfg.i.baik]);
      valLabel = 'QTY BAIK';
    } else if (metric === 'rusak') {
      filtered = rows.filter((r) => num(r[cfg.i.rusak]) > 0);
      valFn = (r) => num(r[cfg.i.rusak]);
      valLabel = 'QTY RUSAK';
      causeIdx = cfg.i.defect_reason ?? cfg.i.penyRusak;
    } else if (metric === 'ganti') {
      filtered = rows.filter((r) => num(r[cfg.i.ganti]) > 0);
      valFn = (r) => num(r[cfg.i.ganti]);
      valLabel = 'QTY GANTI';
      causeIdx = cfg.i.replace_reason ?? cfg.i.penyGanti;
    } else if (metric === 'pakai') {
      valFn = (r) => num(r[cfg.i.baik]) + num(r[cfg.i.rusak]);
      valLabel = 'TOTAL PAKAI';
    } else if (metric === 'pct') {
      filtered = rows.filter((r) => num(r[cfg.i.rusak]) > 0);
      valFn = (r) => {
        const p = num(r[cfg.i.baik]) + num(r[cfg.i.rusak]);
        return p > 0 ? (num(r[cfg.i.rusak]) / p) * 100 : 0;
      };
      valLabel = 'LOSS %';
      causeIdx = cfg.i.defect_reason ?? cfg.i.penyRusak;
    }

    setModalState({
      type: 'metric',
      title: `Detail Metrik: ${metric.toUpperCase()} (${cfg.label})`,
      key,
      rows: filtered,
      valFn,
      valLabel,
      causeIdx,
      metric
    });
  };

  const openDayModal = (key, timestamp) => {
    const cfg = SHEETS[key];
    const dTarget = new Date(timestamp);
    const dayStart = startOfDay(dTarget).getTime();
    const rows = (data[key] || []).filter((r) => {
      const d = r[cfg.i.date] ? new Date(r[cfg.i.date]) : null;
      return d && startOfDay(d).getTime() === dayStart;
    });

    openListModal(`Detail Harian: ${dTarget.toLocaleDateString('id-ID')}`, key, rows);
  };

  const handleSelectRow = (key, row) => {
    if (modalState && modalState.type !== 'detail') {
      setModalHistory((prev) => [...prev, modalState]);
    }
    setModalState({
      type: 'detail',
      title: `Detail Transaksi — ${cell(row, SHEETS[key]?.i?.id || 0)}`,
      key,
      row,
      withBack: modalHistory.length > 0 || (modalState && modalState.type !== 'detail')
    });
  };

  const handleModalBack = () => {
    if (modalHistory.length > 0) {
      const prev = modalHistory[modalHistory.length - 1];
      setModalHistory((h) => h.slice(0, -1));
      setModalState(prev);
    } else {
      setModalState(null);
    }
  };

  function cell(r, idx) {
    return r && r[idx] !== undefined && r[idx] !== null ? String(r[idx]) : '-';
  }

  const triggerPrint = () => window.print();

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
    switch (currentMenu) {
      case 'overview':
        return (
          <OverviewView
            data={data}
            period={period}
            onOpenList={openListModal}
            onSelectRow={handleSelectRow}
            onMenuChange={setCurrentMenu}
          />
        );
      case 'production':
        return (
          <ProductionView
            tabKey={selectedProcessKey}
            onTabChange={setSelectedProcessKey}
            data={data}
            period={period}
            onSelectRow={handleSelectRow}
            onOpenList={openListModal}
            onOpenMetric={openMetricModal}
            onOpenDayModal={openDayModal}
            onGoToData={() => setCurrentMenu('data')}
            onOpenPrint={triggerPrint}
          />
        );
      case 'comparison':
        return <CompareView data={data} />;
      case 'data':
        return (
          <DataTableView
            tabKey={selectedProcessKey}
            onTabChange={setSelectedProcessKey}
            data={data}
            period={period}
            onSelectRow={handleSelectRow}
            user={currentUser}
            onOpenPrint={triggerPrint}
          />
        );
      case 'analytics':
        return (
          <ProcessAnalyticsView
            tabKey={selectedProcessKey}
            onTabChange={setSelectedProcessKey}
            data={data}
            period={period}
            onOpenList={openListModal}
            onOpenPrint={triggerPrint}
          />
        );
      case 'team':
        return <OperatorShiftView data={data} period={period} />;
      case 'leaderboard':
        return <LeaderboardView data={data} period={period} />;
      case 'executive':
        return (
          <ExecutiveOverallView
            data={data}
            period={period}
            onOpenList={openListModal}
          />
        );
      case 'personal':
        return <PersonalKpiView data={data} user={currentUser} period={period} />;
      default:
        return (
          <OverviewView
            data={data}
            period={period}
            onOpenList={openListModal}
            onSelectRow={handleSelectRow}
            onMenuChange={setCurrentMenu}
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-x-hidden">
      <Sidebar
        currentMenu={currentMenu}
        onMenuChange={setCurrentMenu}
        user={currentUser}
        onLogout={handleLogout}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className={`flex-1 transition-all duration-300 flex flex-col min-h-screen ${sidebarCollapsed ? 'pl-20' : 'pl-64'}`}>
        <Header
          period={period}
          onPeriodChange={setPeriod}
          onReset={reload}
          onOpenPrint={triggerPrint}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        <main className="p-6 flex-1 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
              <p className="text-cyan-400 text-xs font-mono uppercase tracking-widest">Sinkronisasi Data...</p>
            </div>
          ) : (
            renderView()
          )}
        </main>

        <footer className="p-4 border-t border-white/10 text-center text-xs opacity-60 font-mono bg-black/10 backdrop-blur-md">
          &copy; 2026 PRISM &bull; Integrated System & Monitoring
        </footer>
      </div>

      <Modal
        modalState={modalState}
        onClose={() => setModalState(null)}
        onSelectRow={handleSelectRow}
        onBack={handleModalBack}
      />
    </div>
  );
}