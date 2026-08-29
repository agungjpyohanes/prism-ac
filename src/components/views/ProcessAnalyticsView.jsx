import React, { useMemo, useState } from 'react';
import { SHEETS, JOP_CATS } from '../../constants/schema';
import { parseDateVal, num, cell, jopCat, fmtPeriodRange, startOfDay } from '../../utils/formatters';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { CheckCircle2, AlertTriangle, RotateCcw, Layers, Percent, Award, Search, Users, Briefcase } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function ProcessAnalyticsView({ tabKey, data, period, onOpenList }) {
  const activeKey = tabKey || 'db_ctcp';
  const cfg = SHEETS[activeKey] || SHEETS.db_ctcp;
  const rawRows = data[activeKey] || [];
  
  const [activeLeaderboardTab, setActiveLeaderboardTab] = useState('OP');
  const [searchQuery, setSearchQuery] = useState('');

  const rows = useMemo(() => {
    return rawRows.filter(r => {
      const idVal = cell(r, cfg.i.id).trim();
      const jopVal = cell(r, cfg.i.jop).trim();
      const noJopVal = cell(r, cfg.i.nojop).trim();
      if (!idVal || (!jopVal && !noJopVal)) return false;

      const d = parseDateVal(r[cfg.i.date]);
      if (!d) return true;
      const from = period?.from ? startOfDay(period.from).getTime() : null;
      const to = period?.to ? new Date(period.to).setHours(23, 59, 59, 999) : null;
      if (from && d.getTime() < from) return false;
      if (to && d.getTime() > to) return false;
      return true;
    });
  }, [rawRows, cfg, period]);

  const kpi = useMemo(() => {
    let good = 0, reject = 0, replace = 0;
    rows.forEach(r => {
      good += num(r[cfg.i.baik]);
      reject += num(r[cfg.i.rusak]);
      replace += num(r[cfg.i.ganti]);
    });
    const output = good + reject;
    const lossRate = output > 0 ? (reject / output) * 100 : 0;
    const perfScore = output > 0 ? Math.max(0, 100 - (lossRate * 10)) : 100;
    return { good, reject, replace, output, lossRate, perfScore };
  }, [rows, cfg]);

  const paramData = useMemo(() => {
    let colIdx = -1;
    let label = 'Parameter Mesin';

    if (activeKey === 'db_ctcp' || activeKey === 'db_ctp') {
      colIdx = cfg.i.mesin_expose ?? 5;
      label = 'Mesin Expose';
    } else if (activeKey === 'db_screen') {
      colIdx = cfg.i.tipe ?? 4;
      label = 'Tipe Screen';
    } else if (activeKey === 'db_flexo') {
      colIdx = cfg.i.tebal ?? 7;
      label = 'Tebal Flexo';
    } else if (activeKey === 'db_etching') {
      colIdx = cfg.i.tipe ?? 4;
      label = 'Tipe Plate';
    }

    if (colIdx === -1 || colIdx === undefined) return { label, colIdx, labels: [], good: [], reject: [] };

    const map = new Map();
    rows.forEach(r => {
      const val = cell(r, colIdx).trim() || 'Lainnya / Standar';
      const e = map.get(val) || { good: 0, reject: 0 };
      e.good += num(r[cfg.i.baik]);
      e.reject += num(r[cfg.i.rusak]);
      map.set(val, e);
    });

    const labels = [...map.keys()];
    return {
      label,
      colIdx,
      labels,
      good: labels.map(l => map.get(l).good),
      reject: labels.map(l => map.get(l).reject)
    };
  }, [rows, activeKey, cfg]);

  const secondaryParamData = useMemo(() => {
    if (activeKey === 'db_ctcp' || activeKey === 'db_ctp') {
      const colIdx = cfg.i.mesin_cetak ?? 6;
      const map = new Map();
      rows.forEach(r => {
        const printMachine = cell(r, colIdx).trim() || 'Mesin Cetak Standar';
        const e = map.get(printMachine) || { good: 0, reject: 0 };
        e.good += num(r[cfg.i.baik]);
        e.reject += num(r[cfg.i.rusak]);
        map.set(printMachine, e);
      });
      const labels = [...map.keys()].slice(0, 8);
      return { colIdx, title: 'Breakdown Mesin Cetak', labels, good: labels.map(l => map.get(l).good), reject: labels.map(l => map.get(l).reject) };
    }
    if (activeKey === 'db_etching') {
      const colIdx = cfg.i.tebal ?? 7;
      const map = new Map();
      rows.forEach(r => {
        const tebal = cell(r, colIdx).trim() || 'Standard';
        const e = map.get(tebal) || { good: 0, reject: 0 };
        e.good += num(r[cfg.i.baik]);
        e.reject += num(r[cfg.i.rusak]);
        map.set(tebal, e);
      });
      const labels = [...map.keys()];
      return { colIdx, title: 'Breakdown Tebal Plate', labels, good: labels.map(l => map.get(l).good), reject: labels.map(l => map.get(l).reject) };
    }
    return null;
  }, [rows, activeKey, cfg]);

  const jopData = useMemo(() => {
    const order = JOP_CATS.map(x => x[1]).concat(['Lainnya']);
    const map = new Map(order.map(o => [o, { good: 0, reject: 0 }]));

    rows.forEach(r => {
      const cat = jopCat(cell(r, cfg.i.nojop));
      const e = map.get(cat) || { good: 0, reject: 0 };
      e.good += num(r[cfg.i.baik]);
      e.reject += num(r[cfg.i.rusak]);
      map.set(cat, e);
    });

    const labels = [], good = [], reject = [];
    order.forEach(o => {
      const val = map.get(o);
      if (val && (val.good > 0 || val.reject > 0)) {
        labels.push(o);
        good.push(val.good);
        reject.push(val.reject);
      }
    });

    return { labels, good, reject };
  }, [rows, cfg]);

  const shiftData = useMemo(() => {
    const map = new Map();
    rows.forEach(r => {
      let sh = cell(r, cfg.i.shift).toUpperCase().trim();
      if (!sh || sh === '-') sh = 'NON-SHIFT';
      const e = map.get(sh) || { good: 0, reject: 0 };
      e.good += num(r[cfg.i.baik]);
      e.reject += num(r[cfg.i.rusak]);
      map.set(sh, e);
    });

    const labels = [...map.keys()].sort();
    return {
      labels,
      good: labels.map(l => map.get(l).good),
      reject: labels.map(l => map.get(l).reject)
    };
  }, [rows, cfg]);

  // Ranking Operator
  const opRanking = useMemo(() => {
    const map = new Map();
    rows.forEach(r => {
      const op = cell(r, cfg.i.op).trim() || 'Unassigned';
      const e = map.get(op) || { name: op, good: 0, reject: 0, replace: 0, rowList: [] };
      e.good += num(r[cfg.i.baik]);
      e.reject += num(r[cfg.i.rusak]);
      e.replace += num(r[cfg.i.ganti]);
      e.rowList.push(r);
      map.set(op, e);
    });

    return [...map.values()]
      .map(o => {
        const output = o.good + o.reject;
        const lossRate = output > 0 ? (o.reject / output) * 100 : 0;
        return { ...o, output, lossRate };
      })
      .sort((a, b) => b.output - a.output);
  }, [rows, cfg]);

  // Ranking PO
  const poRanking = useMemo(() => {
    const map = new Map();
    const poCol = cfg.i.po ?? -1;

    rows.forEach(r => {
      const po = (poCol !== -1 && cell(r, poCol).trim()) || 'Tanpa PO';
      const e = map.get(po) || { name: po, good: 0, reject: 0, replace: 0, rowList: [] };
      e.good += num(r[cfg.i.baik]);
      e.reject += num(r[cfg.i.rusak]);
      e.replace += num(r[cfg.i.ganti]);
      e.rowList.push(r);
      map.set(po, e);
    });

    return [...map.values()]
      .map(o => {
        const output = o.good + o.reject;
        const lossRate = output > 0 ? (o.reject / output) * 100 : 0;
        return { ...o, output, lossRate };
      })
      .sort((a, b) => b.output - a.output);
  }, [rows, cfg]);

  const activeLeaderboardData = activeLeaderboardTab === 'OP' ? opRanking : poRanking;

  const filteredLeaderboard = useMemo(() => {
    if (!searchQuery.trim()) return activeLeaderboardData;
    const q = searchQuery.toLowerCase();
    return activeLeaderboardData.filter(o => o.name.toLowerCase().includes(q));
  }, [activeLeaderboardData, searchQuery]);

  return (
    <div className="space-y-4 anim-in">
      {/* Header Info Panel */}
      <div className="card p-5 bg-gradient-to-r from-slate-900 to-[#101c36] text-white flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge bg-cyan-400/20 text-cyan-300 font-bold">INTERNAL PREPRESS ANALYTICS</span>
            <span className="text-xs text-slate-400">· {cfg.label} Focus Mode</span>
          </div>
          <h2 className="font-display font-extrabold text-2xl mt-1.5">{cfg.label} Performance & Parameter Control</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Audit mendalam efisiensi mesin expose/cetak, kategori JOP, performa shift, dan evaluasi performa individu Operator vs PO. Klik elemen kartu atau grafik untuk melihat data transaksi detail.
          </p>
        </div>
        <div className="text-right">
          <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Rentang Periode</div>
          <div className="font-bold text-sm text-cyan-300 mt-0.5">{fmtPeriodRange(period?.from, period?.to)}</div>
          <div className="text-xs text-slate-400 mt-0.5">{rows.length} Transaksi Teranalisis</div>
        </div>
      </div>

      {/* 6 KPI Scorecards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 stagger">
        <button
          onClick={() => onOpenList?.(`Total Output ${cfg.label}`, activeKey, rows)}
          className="card card-h p-4 bg-white border-l-4 border-l-blue-500 text-left cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">TOTAL OUTPUT</span>
            <Layers className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 font-display font-extrabold text-2xl text-slate-800">{kpi.output.toLocaleString('id-ID')}</div>
          <div className="text-[10px] text-slate-400 mt-1">{cfg.unit} diproses</div>
        </button>

        <button
          onClick={() => onOpenList?.(`Good Output ${cfg.label}`, activeKey, rows.filter(r => num(r[cfg.i.baik]) > 0))}
          className="card card-h p-4 bg-white border-l-4 border-l-emerald-500 text-left cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">GOOD</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 font-display font-extrabold text-2xl text-emerald-600">{kpi.good.toLocaleString('id-ID')}</div>
          <div className="text-[10px] text-slate-400 mt-1">{cfg.unit} lolos QC</div>
        </button>

        <button
          onClick={() => onOpenList?.(`Reject / Rusak ${cfg.label}`, activeKey, rows.filter(r => num(r[cfg.i.rusak]) > 0))}
          className="card card-h p-4 bg-white border-l-4 border-l-rose-500 text-left cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">REJECT</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 font-display font-extrabold text-2xl text-rose-600">{kpi.reject.toLocaleString('id-ID')}</div>
          <div className="text-[10px] text-slate-400 mt-1">{cfg.unit} rusak / loss</div>
        </button>

        <button
          onClick={() => onOpenList?.(`Replace / Ganti ${cfg.label}`, activeKey, rows.filter(r => num(r[cfg.i.ganti]) > 0))}
          className="card card-h p-4 bg-white border-l-4 border-l-amber-500 text-left cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">REPLACE</span>
            <RotateCcw className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 font-display font-extrabold text-2xl text-amber-600">{kpi.replace.toLocaleString('id-ID')}</div>
          <div className="text-[10px] text-slate-400 mt-1">{cfg.unit} diproduksi ulang</div>
        </button>

        <button
          onClick={() => onOpenList?.(`Audit Loss Rate ${cfg.label}`, activeKey, rows.filter(r => num(r[cfg.i.rusak]) > 0))}
          className="card card-h p-4 bg-white border-l-4 border-l-purple-500 text-left cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">LOSS RATE</span>
            <Percent className="w-4 h-4 text-purple-500" />
          </div>
          <div className={`mt-2 font-display font-extrabold text-2xl ${kpi.lossRate > 1.0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {kpi.lossRate.toFixed(1)}%
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Toleransi Max &le; 1.0%</div>
        </button>

        <button
          onClick={() => onOpenList?.(`Semua Data ${cfg.label}`, activeKey, rows)}
          className="card card-h p-4 bg-white border-l-4 border-l-cyan-500 text-left cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">SCORE</span>
            <Award className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="mt-2 font-display font-extrabold text-2xl text-cyan-600">{kpi.perfScore.toFixed(0)}</div>
          <div className="text-[10px] text-slate-400 mt-1">Indeks Kinerja (0-100)</div>
        </button>
      </div>

      {/* Grid Analisis Parameter Spesifik & Jenis JOP */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="card-title">Breakdown: {paramData.label}</h3>
              <p className="text-xs text-slate-500">Klik batang grafik untuk melihat detail transaksi</p>
            </div>
            <span className="badge bg-slate-100 text-slate-600 font-semibold">{paramData.labels.length} Kategori</span>
          </div>
          <div className="h-64">
            <Bar
              data={{
                labels: paramData.labels,
                datasets: [
                  { label: 'Good', data: paramData.good, backgroundColor: '#10b981', borderRadius: 4 },
                  { label: 'Reject', data: paramData.reject, backgroundColor: '#f43f5e', borderRadius: 4 }
                ]
              }}
              options={{
                maintainAspectRatio: false,
                scales: { x: { stacked: true }, y: { stacked: true } },
                onClick: (e, els) => {
                  if (!els.length || paramData.colIdx === -1) return;
                  const cat = paramData.labels[els[0].index];
                  onOpenList?.(`${paramData.label}: ${cat}`, activeKey, rows.filter(r => cell(r, paramData.colIdx) === cat));
                }
              }}
            />
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="card-title">Evaluasi Kategori JOP</h3>
              <p className="text-xs text-slate-500">Klik batang grafik untuk melihat rincian pekerjaan</p>
            </div>
          </div>
          <div className="h-64">
            <Bar
              data={{
                labels: jopData.labels,
                datasets: [
                  { label: 'Good', data: jopData.good, backgroundColor: '#6366f1', borderRadius: 4 },
                  { label: 'Reject', data: jopData.reject, backgroundColor: '#f43f5e', borderRadius: 4 }
                ]
              }}
              options={{
                maintainAspectRatio: false,
                scales: { x: { stacked: true }, y: { stacked: true } },
                onClick: (e, els) => {
                  if (!els.length) return;
                  const cat = jopData.labels[els[0].index];
                  onOpenList?.(`Kategori JOP: ${cat}`, activeKey, rows.filter(r => jopCat(cell(r, cfg.i.nojop)) === cat));
                }
              }}
            />
          </div>
        </div>

        {secondaryParamData && (
          <div className="card p-5">
            <h3 className="card-title mb-1">{secondaryParamData.title}</h3>
            <p className="text-xs text-slate-500 mb-3">Klik batang grafik untuk melihat daftar record</p>
            <div className="h-64">
              <Bar
                data={{
                  labels: secondaryParamData.labels,
                  datasets: [
                    { label: 'Good', data: secondaryParamData.good, backgroundColor: '#06b6d4', borderRadius: 4 },
                    { label: 'Reject', data: secondaryParamData.reject, backgroundColor: '#f43f5e', borderRadius: 4 }
                  ]
                }}
                options={{
                  maintainAspectRatio: false,
                  scales: { x: { stacked: true }, y: { stacked: true } },
                  onClick: (e, els) => {
                    if (!els.length) return;
                    const cat = secondaryParamData.labels[els[0].index];
                    onOpenList?.(`${secondaryParamData.title}: ${cat}`, activeKey, rows.filter(r => cell(r, secondaryParamData.colIdx) === cat));
                  }
                }}
              />
            </div>
          </div>
        )}

        <div className={`card p-5 ${secondaryParamData ? '' : 'md:col-span-2'}`}>
          <h3 className="card-title mb-1">Performa Shift</h3>
          <p className="text-xs text-slate-500 mb-3">Klik segmen donat untuk melihat detail transaksi per shift</p>
          <div className="h-64 flex items-center justify-center">
            <Doughnut
              data={{
                labels: shiftData.labels,
                datasets: [
                  {
                    data: shiftData.good,
                    backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#64748b']
                  }
                ]
              }}
              options={{
                maintainAspectRatio: false,
                onClick: (e, els) => {
                  if (!els.length) return;
                  const sh = shiftData.labels[els[0].index];
                  onOpenList?.(`Detail Shift: ${sh}`, activeKey, rows.filter(r => {
                    let s = cell(r, cfg.i.shift).toUpperCase().trim();
                    if (!s || s === '-') s = 'NON-SHIFT';
                    return s === sh;
                  }));
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Leaderboard Terpisah OP vs PO */}
      <div className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              {activeLeaderboardTab === 'OP' ? (
                <Users className="w-5 h-5 text-indigo-600" />
              ) : (
                <Briefcase className="w-5 h-5 text-amber-600" />
              )}
              <h3 className="card-title">
                {activeLeaderboardTab === 'OP' ? 'Leaderboard Performa Operator' : 'Leaderboard Performa PO (Customer)'}
              </h3>
            </div>
            <p className="text-xs text-slate-500">Klik baris nama untuk melihat detail seluruh transaksi individu</p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => { setActiveLeaderboardTab('OP'); setSearchQuery(''); }}
                className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                  activeLeaderboardTab === 'OP' ? 'bg-white shadow text-indigo-700' : 'text-slate-500'
                }`}
              >
                Operator
              </button>
              <button
                onClick={() => { setActiveLeaderboardTab('PO'); setSearchQuery(''); }}
                className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                  activeLeaderboardTab === 'PO' ? 'bg-white shadow text-amber-700' : 'text-slate-500'
                }`}
              >
                PO
              </button>
            </div>

            <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-1.5 w-full sm:w-56">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={activeLeaderboardTab === 'OP' ? 'Cari Operator...' : 'Cari PO...'}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-transparent text-xs outline-none w-full text-slate-700"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-3">Rank</th>
                <th className="py-2.5 px-3">{activeLeaderboardTab === 'OP' ? 'Nama Operator' : 'Nama PO'}</th>
                <th className="py-2.5 px-3">Total Output</th>
                <th className="py-2.5 px-3">Good</th>
                <th className="py-2.5 px-3">Reject</th>
                <th className="py-2.5 px-3">Replace</th>
                <th className="py-2.5 px-3">Loss Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeaderboard.map((o, idx) => (
                <tr
                  key={o.name}
                  onClick={() => onOpenList?.(`Rekap Transaksi: ${o.name}`, activeKey, o.rowList)}
                  className="hover:bg-indigo-50/50 transition cursor-pointer"
                >
                  <td className="py-2 px-3 font-bold text-slate-400">#{idx + 1}</td>
                  <td className="py-2 px-3 font-semibold text-slate-800 flex items-center gap-1.5">
                    {o.name}
                    <span className="text-[10px] text-slate-400">→</span>
                  </td>
                  <td className="py-2 px-3 font-bold">{o.output.toLocaleString('id-ID')}</td>
                  <td className="py-2 px-3 text-emerald-600 font-semibold">{o.good.toLocaleString('id-ID')}</td>
                  <td className="py-2 px-3 text-rose-600 font-semibold">{o.reject.toLocaleString('id-ID')}</td>
                  <td className="py-2 px-3 text-amber-600">{o.replace.toLocaleString('id-ID')}</td>
                  <td className="py-2 px-3 font-bold">{o.lossRate.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}