import React, { useState } from 'react';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import OverviewView from './components/views/OverviewView';
import ProductionView from './components/views/ProductionView';
import OperatorShiftView from './components/views/OperatorShiftView';
import ProcessAnalyticsView from './components/views/ProcessAnalyticsView';
import LeaderboardView from './components/views/LeaderboardView';
import ExecutiveOverallView from './components/views/ExecutiveOverallView';
import PersonalKpiView from './components/views/PersonalKpiView';
import CompareView from './components/views/CompareView';
import DataTableView from './components/views/DataTableView';
import FormsView from './components/views/FormsView';
import AuthView from './components/views/AuthView';
import Modal from './components/common/Modal';
import { useProductionData } from './hooks/useProductionData';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [modalConfig, setModalConfig] = useState(null);

  const {
    data,
    status,
    loading,
    period,
    setPeriod,
    reload
  } = useProductionData();

  if (!user) {
    return <AuthView onLogin={(authenticatedUser) => setUser(authenticatedUser)} status={status} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewView data={data} period={period} onOpenModal={(cfg) => setModalConfig(cfg)} />;
      case 'production':
        return <ProductionView data={data} period={period} onOpenModal={(cfg) => setModalConfig(cfg)} />;
      case 'operator-shift':
        return <OperatorShiftView data={data} period={period} />;
      case 'process-analytics':
        return <ProcessAnalyticsView data={data} period={period} />;
      case 'leaderboard':
        return <LeaderboardView data={data} period={period} />;
      case 'executive':
        return <ExecutiveOverallView data={data} period={period} />;
      case 'personal-kpi':
        return <PersonalKpiView data={data} period={period} currentUser={user} />;
      case 'compare':
        return <CompareView data={data} />;
      case 'datatable':
        return <DataTableView data={data} period={period} onReload={reload} />;
      case 'forms':
        return <FormsView onReload={reload} user={user} />;
      default:
        return <OverviewView data={data} period={period} onOpenModal={(cfg) => setModalConfig(cfg)} />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans antialiased">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogout={() => setUser(null)}
      />

      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Header
          user={user}
          period={period}
          setPeriod={setPeriod}
          status={status}
          loading={loading}
          onReload={reload}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-900/50">
          {renderContent()}
        </main>
      </div>

      {modalConfig && (
        <Modal
          config={modalConfig}
          onClose={() => setModalConfig(null)}
          onReload={reload}
        />
      )}
    </div>
  );
}