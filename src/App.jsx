import React, { useState, useEffect } from 'react';
import { useProductionData } from './hooks/useProductionData';
import { useIdleTimer } from './hooks/useIdleTimer';
import { SHEETS } from './constants/schema';
import { num, cell, parseDateVal, startOfDay } from './utils/formatters';

import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import AuthView from './components/views/AuthView';
import OverviewView from './components/views/OverviewView';
import ProductionView from './components/views/ProductionView';
import CompareView from './components/views/CompareView';
import DataTableView from './components/views/DataTableView';
import FormsView from './components/views/FormsView';
import ProcessAnalyticsView from './components/views/ProcessAnalyticsView';
import OperatorShiftView from './components/views/OperatorShiftView';
import LeaderboardView from './components/views/LeaderboardView';
import ExecutiveOverallView from './components/views/ExecutiveOverallView';
import PersonalKpiView from './components/views/PersonalKpiView';
import Modal from './components/common/Modal';

export default function App() {
  const { data, status, loading, period, setPeriod, reload } = useProductionData();
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const s = sessionStorage.getItem('pf_session');
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  });

  const [theme, setTheme] = useState(() => localStorage.getItem('pf_theme') || 'light');
  const [view, setView] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [modalState, setModalState] = useState(null);
  const [modalBack, setModalBack] = useState(null);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('pf_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  const addToast = (msg, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3600);
  };

  useIdleTimer({
    active: !!currentUser,
    warnMs: 13 * 60 * 1000,
    timeoutMs: 15 * 60 * 1000,
    onWarn: () => addToast('⚠ Sesi akan berakhir dalam 2 menit karena tidak ada aktivitas', 'warn'),
    onTimeout: () => {
      addToast('⏱ Sesi berakhir karena idle 15 menit', 'warn');
      handleLogout();
    }
  });

  const handleLogin = (u) => {
    setCurrentUser(u);
    sessionStorage.setItem('pf_session', JSON.stringify(u));
    addToast(`Selamat datang, ${u.USER} 👋`, 'ok');
  };

  const handleLogout = () => {
    sessionStorage.removeItem('pf_session');
    setCurrentUser(null);
    addToast('Anda telah keluar', 'info');
  };

  const openDetail = (key, row, withBack = false) => {
    const cfg = SHEETS[key] || { i: { id: 0 } };
    setModalState({
      type: 'detail',
      title: `Detail ${cell(row, cfg.i.id)}`,
      key,
      row,
      withBack
    });
  };

  const openRecordList = (title, key, rows, subtitle = '') => {
    const stateObj = {
      type: 'list',
      title,
      key,
      rows: rows || [],
      subtitle: subtitle || `${(rows || []).length} baris · klik baris untuk detail lengkap`
    };
    setModalBack(stateObj);
    setModalState(stateObj);
  };

  const openMetricModal = (key, metric, rows) => {
    const cfg = SHEETS[key] || { unit: 'Unit', i: { qty_good: 11, qty_defect: 12, qty_replace: 10 } };
    let list = [], valFn = null, causeIdx = null;

    if (metric === 'baik') {
      list = rows.filter((r) => num(r[cfg.i.qty_good]) > 0);
      valFn = (r) => num(r[cfg.i.qty_good]);
    } else if (metric === 'rusak') {
      list = rows.filter((r) => num(r[cfg.i.qty_defect]) > 0);
      valFn = (r) => num(r[cfg.i.qty_defect]);
      causeIdx = cfg.i.defect_reason;
    } else if (metric === 'ganti') {
      list = rows.filter((r) => num(r[cfg.i.qty_replace]) > 0);
      valFn = (r) => num(r[cfg.i.qty_replace]);
      causeIdx = cfg.i.replace_reason;
    } else {
      list = rows;
      valFn = (r) => num(r[cfg.i.qty_good]) + num(r[cfg.i.qty_defect]);
    }

    setModalState({
      type: 'metric',
      title: metric.toUpperCase(),
      key,
      rows: list,
      metric,
      valFn,
      causeIdx,
      subtitle: `Total ${list.reduce((s, r) => s + valFn(r), 0).toLocaleString('id-ID')} · klik untuk audit`
    });
  };

  let viewType = view;
  let viewKey = 'rec_ctcp';
  if (view.includes(':')) {
    const parts = view.split(':');
    viewType = parts[0];
    viewKey = parts[1];
  }

  if (!currentUser) {
    return (
      <AuthView
        usersData={data.rec_user}
        onLoginSuccess={handleLogin}
        onToast={addToast}
        serverStatus={status}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f2f5fb] dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors flex flex-col justify-between">
      <div id="toasts" className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none no-print">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type} pointer-events-auto`} dangerouslySetInnerHTML={{ __html: t.msg }} />
        ))}
      </div>

      <Sidebar
        view={view}
        onViewChange={(v) => {
          setView(v);
          setSidebarOpen(false);
        }}
        user={currentUser}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <div id="mainWrap" className="lg:pl-64 flex flex-col min-h-screen">
        <Header
          view={view}
          period={period}
          onPeriodChange={setPeriod}
          onReset={reload}
          onOpenPrint={() => window.print()}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        <main id="mainContent" className="p-4 lg:p-6 space-y-4 flex-1">
          {loading ? (
            <div className="text-center py-24 text-slate-400 text-sm font-semibold">
              Memuat data database...
            </div>
          ) : (
            <>
              {viewType === 'overview' && (
                <OverviewView
                  data={data}
                  period={period}
                  onOpenList={openRecordList}
                />
              )}

              {viewType === 'prod' && (
                <ProductionView
                  tabKey={viewKey}
                  data={data}
                  period={period}
                  onSelectRow={openDetail}
                  onOpenList={openRecordList}
                  onOpenMetric={openMetricModal}
                  onGoToData={(k) => setView(`data:${k}`)}
                />
              )}

              {viewType === 'compare' && (
                <CompareView data={data} />
              )}

              {viewType === 'data' && (
                <DataTableView
                  tabKey={viewKey}
                  data={data}
                  period={period}
                  onSelectRow={openDetail}
                />
              )}

              {viewType === 'analytics' && (
                <ProcessAnalyticsView
                  tabKey={viewKey}
                  data={data}
                  period={period}
                />
              )}

              {viewType === 'team_shift' && (
                <OperatorShiftView
                  data={data}
                  period={period}
                  onOpenList={openRecordList}
                />
              )}

              {viewType === 'leaderboard' && (
                <LeaderboardView
                  data={data}
                  period={period}
                  onOpenList={openRecordList}
                />
              )}

              {viewType === 'executive_overall' && (
                <ExecutiveOverallView
                  data={data}
                  period={period}
                  onOpenList={openRecordList}
                />
              )}

              {viewType === 'kpi_personal' && (
                <PersonalKpiView
                  user={currentUser}
                  data={data}
                  period={period}
                  onOpenList={openRecordList}
                />
              )}

              {viewType === 'forms' && (
                <FormsView />
              )}
            </>
          )}
        </main>

        <footer className="px-6 py-4 border-t border-slate-200/70 dark:border-slate-800 text-center text-xs text-slate-400 dark:text-slate-500 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm no-print">
          &copy; 2026 <b>PRISM V1.0 (Prepress Integrated System & Monitoring)</b> &bull; Developed by <b>Aether Code</b>. All rights reserved.
        </footer>

        <div className="print-footer">
          Laporan Resmi Produksi Prepress &bull; Dicetak pada: {new Date().toLocaleString('id-ID')} &bull; &copy; 2026 PRISM - <b>Aether Code</b>
        </div>
      </div>

      {modalState && (
        <Modal
          modalState={modalState}
          onClose={() => setModalState(null)}
          onSelectRow={(k, r) => openDetail(k, r, true)}
          onBack={modalBack ? () => setModalState(modalBack) : null}
        />
      )}
    </div>
  );
}