import React, { useState } from 'react';
import { useProductionData } from './hooks/useProductionData';
import Sidebar from './components/layout/Sidebar';
import MobileNav from './components/layout/MobileNav';
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
import { MENUS } from './constants/navigation';

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
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const currentMenuData = MENUS.find(m => m.id === currentMenu);

  const renderView = () => {
    switch (currentMenu) {
      case 'overview': return <OverviewView data={data} period={{}} onOpenList={() => {}} onSelectRow={() => {}} />;
      case 'production': return <ProductionView tabKey="rec_ctcp" data={data} period={{}} onSelectRow={() => {}} onOpenList={() => {}} onOpenMetric={() => {}} onOpenDayModal={() => {}} onGoToData={() => {}} />;
      case 'comparison': return <CompareView data={data} onToast={() => {}} />;
      case 'data': return <DataTableView tabKey="rec_ctcp" data={data} period={{}} onSelectRow={() => {}} />;
      case 'analytics': return <ProcessAnalyticsView tabKey="rec_ctcp" data={data} period={{}} onOpenList={() => {}} />;
      case 'team': return <OperatorShiftView data={data} period={{}} />;
      case 'leaderboard': return <LeaderboardView />;
      case 'executive': return <ExecutiveOverallView data={data} period={{}} onOpenList={() => {}} />;
      case 'personal': return <PersonalKpiView />;
      default: return <OverviewView data={data} period={{}} onOpenList={() => {}} onSelectRow={() => {}} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#050814] text-slate-100 relative">
      {/* Cosmic Background */}
      <div className="cosmic-bg" />

      {/* Sidebar - Desktop & Tablet Drawer */}
      <Sidebar
        currentMenu={currentMenu}
        onMenuChange={setCurrentMenu}
        user={currentUser}
        onLogout={handleLogout}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className={`relative z-10 flex flex-col min-h-screen transition-all duration-300
        ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}
        main-content
      `}>
        <Header
          period={{}}
          onPeriodChange={() => {}}
          onReset={reload}
          onOpenPrint={() => {}}
          onToggleSidebar={() => setSidebarOpen(true)}
          title={currentMenuData?.label || 'Dashboard'}
          subtitle="Prepress Integrated System & Monitoring"
        />

        <main className="flex-1 p-3 sm:p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 sm:py-32">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center mb-4 anim-pulse-glow">
                <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
              <p className="text-sm text-slate-400 font-semibold">Sinkronisasi data...</p>
            </div>
          ) : (
            renderView()
          )}
        </main>

        <footer className="hidden sm:block p-4 border-t border-cyan-500/15 text-center text-xs text-slate-500 font-mono">
          &copy; 2026 PRISM V2.0 Cosmic • Aether Code
        </footer>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav
        currentMenu={currentMenu}
        onMenuChange={setCurrentMenu}
        user={currentUser}
      />
    </div>
  );
}