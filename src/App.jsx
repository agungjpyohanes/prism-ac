import React, { useState } from 'react';
import { useProductionData } from './hooks/useProductionData';
import Sidebar from './components/layout/Sidebar';
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
      case 'overview': return <OverviewView data={data} onMenuChange={setCurrentMenu} />;
      case 'production': return <ProductionView data={data} />;
      case 'comparison': return <CompareView data={data} />;
      case 'data': return <DataTableView data={data} user={currentUser} />;
      case 'analytics': return <ProcessAnalyticsView data={data} />;
      case 'team': return <OperatorShiftView data={data} />;
      case 'leaderboard': return <LeaderboardView data={data} />;
      case 'executive': return <ExecutiveOverallView data={data} />;
      case 'personal': return <PersonalKpiView data={data} user={currentUser} />;
      default: return <OverviewView data={data} onMenuChange={setCurrentMenu} />;
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
          &copy; 2026 PRISM V1.0 (Prepress Integrated System & Monitoring) &bull; Aether Code
        </footer>
      </div>
    </div>
  );
}