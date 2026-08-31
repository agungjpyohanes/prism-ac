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

const PROCESS_TABS = [
  { key: 'rec_ctcp', label: 'CTCP' },
  { key: 'rec_ctp', label: 'CTP' },
  { key: 'rec_screen', label: 'SCREEN' },
  { key: 'rec_flexo', label: 'FLEXO' },
  { key: 'rec_etching', label: 'ETCHING' }
];

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
  const [activeTabKey, setActiveTabKey] = useState('rec_ctcp');
  const [modalState, setModalState] = useState(null);

  // Filter Tanggal Default: 30 Hari Terakhir
  const [period, setPeriod] = useState(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 30);
    return { from, to };
  });

  const handleLogin = (u) => {
    setCurrentUser(u);
    sessionStorage.setItem('pf_session', JSON.stringify(u));
  };

  const handleLogout = () => {
    sessionStorage.removeItem('pf_session');
    setCurrentUser(null);
  };

  const handleSelectRow = (key, row) => {
    setModalState({
      title: 'Detail Catatan Produksi',
      type: 'detail',
      key: key || activeTabKey,
      row
    });
  };

  const handleOpenList = (title, key, rows) => {
    setModalState({
      title,
      type: 'list',
      key: key || activeTabKey,
      rows: rows || []
    });
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

  const renderProcessTabBar = () => (
    <div className="flex gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl w-fit mb-4">
      {PROCESS_TABS.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => setActiveTabKey(t.key)}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
            activeTabKey === t.key
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );

  const renderView = () => {
    switch (currentMenu) {
      case 'overview':
        return (
          <OverviewView 
            data={data} 
            period={period} 
            onOpenList={handleOpenList} 
            onSelectRow={handleSelectRow} 
            onMenuChange={setCurrentMenu} 
          />
        );
      case 'production':
        return (
          <div className="space-y-4">
            {renderProcessTabBar()}
            <ProductionView
              tabKey={activeTabKey}
              data={data}
              period={period}
              onSelectRow={handleSelectRow}
              onOpenList={handleOpenList}
              onOpenMetric={(k, m, r) => handleOpenList(`Metrik ${m}`, k, r)}
              onOpenDayModal={(k, d) => handleOpenList(`Data Tanggal ${d}`, k, data[k])}
              onGoToData={() => setCurrentMenu('data')}
            />
          </div>
        );
      case 'comparison':
        return <CompareView data={data} onToast={(msg) => alert(msg)} />;
      case 'data':
        return (
          <div className="space-y-4">
            {renderProcessTabBar()}
            <DataTableView tabKey={activeTabKey} data={data} period={period} onSelectRow={handleSelectRow} />
          </div>
        );
      case 'analytics':
        return (
          <div className="space-y-4">
            {renderProcessTabBar()}
            <ProcessAnalyticsView tabKey={activeTabKey} data={data} period={period} onOpenList={handleOpenList} />
          </div>
        );
      case 'team':
        return <OperatorShiftView data={data} period={period} />;
      case 'leaderboard':
        return <LeaderboardView data={data} period={period} onOpenList={handleOpenList} />;
      case 'executive':
        return <ExecutiveOverallView data={data} period={period} onOpenList={handleOpenList} />;
      case 'personal':
        return <PersonalKpiView data={data} period={period} user={currentUser} />;
      default:
        return (
          <OverviewView 
            data={data} 
            period={period} 
            onOpenList={handleOpenList} 
            onSelectRow={handleSelectRow} 
            onMenuChange={setCurrentMenu} 
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#060a12] text-slate-100 flex font-sans">
      <Sidebar
        currentMenu={currentMenu}
        onMenuChange={setCurrentMenu}
        user={currentUser}
        onLogout={handleLogout}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className={`flex-1 transition-all flex flex-col min-h-screen ${sidebarCollapsed ? 'pl-20' : 'pl-64'}`}>
        <Header
          period={period}
          onPeriodChange={setPeriod}
          onReset={reload}
          onOpenPrint={() => window.print()}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        <main className="p-6 flex-1 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-32 text-slate-400 text-sm font-semibold">
              Sinkronisasi data sistem...
            </div>
          ) : (
            renderView()
          )}
        </main>

        <footer className="p-4 border-t border-slate-800/80 text-center text-xs text-slate-500 font-mono">
          &copy; Aether Code 2026 PRISM Integrated System & Monitoring
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