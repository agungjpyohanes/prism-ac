import React, { useState } from 'react';
import { useProductionData } from './hooks/useProductionData';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
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
  const [selectedProcessKey, setSelectedProcessKey] = useState('rec_ctcp');
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
      case 'overview': return <OverviewView data={data} period={period} onMenuChange={setCurrentMenu} />;
      case 'production': return <ProductionView tabKey={selectedProcessKey} data={data} period={period} onGoToData={() => setCurrentMenu('data')} />;
      case 'comparison': return <CompareView data={data} />;
      case 'data': return <DataTableView tabKey={selectedProcessKey} data={data} period={period} user={currentUser} />;
      case 'analytics': return <ProcessAnalyticsView tabKey={selectedProcessKey} data={data} period={period} />;
      case 'team': return <OperatorShiftView data={data} period={period} />;
      case 'leaderboard': return <LeaderboardView data={data} />;
      case 'executive': return <ExecutiveOverallView data={data} period={period} />;
      case 'personal': return <PersonalKpiView data={data} user={currentUser} />;
      default: return <OverviewView data={data} period={period} onMenuChange={setCurrentMenu} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#050714] text-slate-100 flex relative overflow-x-hidden">
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
          onOpenPrint={() => window.print()}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        <main className="p-6 flex-1 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin shadow-[0_0_15px_rgba(6,182,212,0.5)]" />
              <p className="text-cyan-400/80 text-xs font-mono tracking-widest uppercase">Connecting to Cosmic Data Grid...</p>
            </div>
          ) : (
            renderView()
          )}
        </main>

        <footer className="p-4 border-t border-white/5 text-center text-xs text-slate-500 font-mono bg-slate-950/30 backdrop-blur-md">
          &copy; 2026 PRISM Cosmic V1.0 &bull; Prepress Integrated System & Monitoring
        </footer>
      </div>
    </div>
  );
}