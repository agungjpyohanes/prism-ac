import React, { useState } from 'react';
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
  const [activeTabKey, setActiveTabKey] = useState('rec_ctcp');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [modalState, setModalState] = useState(null);

  // State Rentang Periode Global
  const [period, setPeriod] = useState(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    return { from: firstDay, to: today };
  });

  const handleOpenList = (title, key, rows) => {
    setModalState({ type: 'list', title, key, rows });
  };

  const handleSelectRow = (key, row) => {
    setModalState({ type: 'detail', title: 'Detail Data', key, row });
  };

  const handleOpenMetric = (key, metric, rows) => {
    setModalState({
      type: 'metric',
      title: `Rincian Metrik: ${metric.toUpperCase()}`,
      key,
      rows,
      metric,
      valLabel: metric.toUpperCase(),
      valFn: (r) => {
        const cfg = { rec_ctcp: { i: { baik: 11, rusak: 12, ganti: 10 } } }[key] || { i: { baik: 11, rusak: 12, ganti: 10 } };
        if (metric === 'baik') return Number(r[cfg.i.baik] || 0);
        if (metric === 'rusak') return Number(r[cfg.i.rusak] || 0);
        if (metric === 'ganti') return Number(r[cfg.i.ganti] || 0);
        return 0;
      }
    });
  };

  const handleOpenDayModal = (key, timestamp) => {
    const dateObj = new Date(timestamp);
    const dateStr = dateObj.toLocaleDateString('id-ID');
    const filteredRows = (data[key] || []).filter((r) => {
      const d = new Date(r[4] || r[6] || r[8] || r[9]);
      return d.toDateString() === dateObj.toDateString();
    });
    setModalState({
      type: 'list',
      title: `Data Harian: ${dateStr}`,
      key,
      rows: filteredRows
    });
  };

  const handleLogin = (u) => {
    setCurrentUser(u);
    sessionStorage.setItem('pf_session', JSON.stringify(u));
  };

  const handleLogout = () => {
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
    <div className="min-h-screen bg-[#060a14] text-slate-100 flex overflow-x-hidden">
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
          onOpenPrint={() => window.print()}
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

        <footer className="p-4 border-t border-slate-800/80 text-center text-xs text-slate-500 font-mono">
          &copy; 2026 PRISM V2.5 (Prepress Integrated System & Monitoring) &bull; Aether Code
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