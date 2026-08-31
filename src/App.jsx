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
      title: 'Detail Catatan Data',
      type: 'detail',
      key,
      row
    });
  };

  const handleOpenList = (title, key, rows) => {
    setModalState({
      title,
      type: 'list',
      key,
      rows
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

  const renderView = () => {
    switch (currentMenu) {
      case 'overview':
        return <OverviewView data={data} period={period} onOpenList={handleOpenList} onSelectRow={handleSelectRow} onMenuChange={setCurrentMenu} />;
      case 'production':
        return (
          <div className="space-y-4">
            <div className="flex gap-2 p-1 bg-slate-800/80 rounded-xl w-fit">
              {['rec_ctcp', 'rec_ctp', 'rec_screen', 'rec_flexo', 'rec_etching'].map((k) => (
                <button
                  key={k}
                  onClick={() => setActiveTabKey(k)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${activeTabKey === k ? 'bg-cyan-500 text-slate-900' : 'text-slate-400 hover:text-white'}`}
                >
                  {k.replace('rec_', '').toUpperCase()}
                </button>
              ))}
            </div>
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
            <div className="flex gap-2 p-1 bg-slate-800/80 rounded-xl w-fit">
              {['rec_ctcp', 'rec_ctp', 'rec_screen', 'rec_flexo', 'rec_etching'].map((k) => (
                <button
                  key={k}
                  onClick={() => setActiveTabKey(k)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${activeTabKey === k ? 'bg-cyan-500 text-slate-900' : 'text-slate-400 hover:text-white'}`}
                >
                  {k.replace('rec_', '').toUpperCase()}
                </button>
              ))}
            </div>
            <DataTableView tabKey={activeTabKey} data={data} period={period} onSelectRow={handleSelectRow} />
          </div>
        );
      case 'analytics':
        return (
          <div className="space-y-4">
            <div className="flex gap-2 p-1 bg-slate-800/80 rounded-xl w-fit">
              {['rec_ctcp', 'rec_ctp', 'rec_screen', 'rec_flexo', 'rec_etching'].map((k) => (
                <button
                  key={k}
                  onClick={() => setActiveTabKey(k)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${activeTabKey === k ? 'bg-cyan-500 text-slate-900' : 'text-slate-400 hover:text-white'}`}
                >
                  {k.replace('rec_', '').toUpperCase()}
                </button>
              ))}
            </div>
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
        return <OverviewView data={data} period={period} onOpenList={handleOpenList} onSelectRow={handleSelectRow} onMenuChange={setCurrentMenu} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#060a12] text-slate-100 flex">
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
          &copy; 2026 PRISM V1.0 (Prepress Integrated System & Monitoring) &bull; PT Solo Murni
        </footer>
      </div>

      <Modal modalState={modalState} onClose={() => setModalState(null)} onSelectRow={handleSelectRow} />
    </div>
  );
}