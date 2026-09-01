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
  const activeKey = tabKey || 'rec_ctcp';
  const cfg = SHEETS[activeKey] || SHEETS.rec_ctcp;
  const rawRows = data[activeKey] || [];
  
  const [activeLeaderboardTab, setActiveLeaderboardTab] = useState('OP');
  const [searchQuery, setSearchQuery] = useState('');

  const rows = useMemo(() => {
    return rawRows.filter(r => {
      const idVal = cell(r, cfg.i.id).trim();
      const jopVal = cell(r, cfg.i.jop).trim();
      const noJopVal = cell(r, cfg.i.nojop).trim();
      if (!idVal || idVal === '-' || (!jopVal && !noJopVal)) return false;

      const d = parseDateVal(r[cfg.i.date]);
      if (!d) return true;
      const from = period?.from ? startOfDay(period.from)?.getTime() : null;
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

    if (activeKey === 'rec_ctcp' || activeKey === 'rec_ctp') {
      colIdx = cfg.i.expose_mach ?? 5;
      label = 'Mesin Expose';
    } else if (activeKey === 'rec_screen') {
      colIdx = cfg.i.screen_type ?? 4;
      label = 'Tipe Screen';
    } else if (activeKey === 'rec_flexo') {
      colIdx = cfg.i.flexo_thickness ?? 11;
      label = 'Tebal Flexo';
    } else if (activeKey === 'rec_etching') {
      colIdx = cfg.i.plate_type ?? 4;
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
    if (activeKey === 'rec_ctcp' || activeKey === 'rec_ctp') {
      const colIdx = cfg.i.print_mach ?? 6;
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
    if (activeKey === 'rec_etching') {
      const colIdx = cfg.i.plate_thickness ?? 11;
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
      if (!sh || sh === '-' || sh === 'UNDEFINED') sh = 'NON-SHIFT';
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

  const poRanking = useMemo(() => {
    const map = new Map();
    const poCol = cfg.i.po_helper ?? -1;

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
      <div className="card p-5 bg-gradient-to-r from-slate-900 via-[#0e172e] to-slate-900 text-white flex flex-wrap items-center justify-between gap-4 border border-cyan-500/30">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge bg-cyan-500/20 text-cyan-300 border-cyan-400/40 font-bold">INTERNAL PREPRESS ANALYTICS</span>
            <span className="text-xs text-slate-300">· {cfg.label} Focus Mode</span>
          </div>
          <h2 className="font-display font-black text-xl sm:text-2xl mt-1.5 text-white tracking-wide">{cfg.label} Performance & Parameter Control</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Audit mendalam efisiensi mesin expose/cetak, kategori JOP, performa shift, dan evaluasi performa individu Operator vs PO. Klik elemen kartu atau grafik untuk melihat data transaksi detail.
          </p>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider font-semibold">Rentang Periode</div>
          <div className="font-bold text-sm text-cyan-300 mt-0.5">{fmtPeriodRange(period?.from, period?.to)}</div>
          <div className="text-xs text-slate-400 mt-0.5">{rows.length} Transaksi Teranalisis</div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 stagger">
        <button
          type="button"
          onClick={() => onOpenList?.(`Total Output ${cfg.label}`, activeKey, rows)}
          className="card p-4 border-l-4 border-l-cyan-500 text-left cursor-pointer hover:scale-[1.02] transition"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">TOTAL OUTPUT</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 font-display font-black text-2xl text-white">{kpi.output.toLocaleString('id-ID')}</div>
          <div className="text-[10px] text-slate-400 mt-1">{cfg.unit} diproses</div>
        </button>

        <button
          type="button"
          onClick={() => onOpenList?.(`Good Output ${cfg.label}`, activeKey, rows.filter(r => num(r[cfg.i.baik]) > 0))}
          className="card p-4 border-l-4 border-l-emerald-500 text-left cursor-pointer hover:scale-[1.02] transition"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">GOOD</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 font-display font-black text-2xl text-emerald-400">{kpi.good.toLocaleString('id-ID')}</div>
          <div className="text-[10px] text-slate-400 mt-1">{cfg.unit} lolos QC</div>
        </button>

        <button
          type="button"
          onClick={() => onOpenList?.(`Reject / Rusak ${cfg.label}`, activeKey, rows.filter(r => num(r[cfg.i.rusak]) > 0))}
          className="card p-4 border-l-4 border-l-rose-500 text-left cursor-pointer hover:scale-[1.02] transition"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">REJECT</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 font-display font-black text-2xl text-rose-400">{kpi.reject.toLocaleString('id-ID')}</div>
          <div className="text-[10px] text-slate-400 mt-1">{cfg.unit} rusak / loss</div>
        </button>

        <button
          type="button"
          onClick={() => onOpenList?.(`Replace / Ganti ${cfg.label}`, activeKey, rows.filter(r => num(r[cfg.i.ganti]) > 0))}
          className="card p-4 border-l-4 border-l-amber-500 text-left cursor-pointer hover:scale-[1.02] transition"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">REPLACE</span>
            <RotateCcw className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 font-display font-black text-2xl text-amber-400">{kpi.replace.toLocaleString('id-ID')}</div>
          <div className="text-[10px] text-slate-400 mt-1">{cfg.unit} diproduksi ulang</div>
        </button>

        <button
          type="button"
          onClick={() => onOpenList?.(`Audit Loss Rate ${cfg.label}`, activeKey, rows.filter(r => num(r[cfg.i.rusak]) > 0))}
          className="card p-4 border-l-4 border-l-purple-500 text-left cursor-pointer hover:scale-[1.02] transition"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">LOSS RATE</span>
            <Percent className="w-4 h-4 text-purple-400" />
          </div>
          <div className={`mt-2 font-display font-black text-2xl ${kpi.lossRate > 1.0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {kpi.lossRate.toFixed(1)}%
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Toleransi Max &le; 1.0%</div>
        </button>

        <button
          type="button"
          onClick={() => onOpenList?.(`Semua Data ${cfg.label}`, activeKey, rows)}
          className="card p-4 border-l-4 border-l-cyan-500 text-left cursor-pointer hover:scale-[1.02] transition"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">SCORE</span>
            <Award className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 font-display font-black text-2xl text-cyan-300">{kpi.perfScore.toFixed(0)}</div>
          <div className="text-[10px] text-slate-400 mt-1">Indeks Kinerja (0-100)</div>
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="card-title">Breakdown: {paramData.label}</h3>
              <p className="text-xs text-slate-400">Klik batang grafik untuk melihat detail transaksi</p>
            </div>
            <span className="badge bg-slate-800 text-slate-200 border-slate-700 font-semibold">{paramData.labels.length} Kategori</span>
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
                scales: {
                  x: { stacked: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                  y: { stacked: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
                },
                plugins: {
                  legend: { labels: { color: '#e2e8f0', font: { size: 11 } } }
                },
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
              <p className="text-xs text-slate-400">Klik batang grafik untuk melihat rincian pekerjaan</p>
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
                scales: {
                  x: { stacked: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                  y: { stacked: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
                },
                plugins: {
                  legend: { labels: { color: '#e2e8f0', font: { size: 11 } } }
                },
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
            <p className="text-xs text-slate-400 mb-3">Klik batang grafik untuk melihat daftar record</p>
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
                  scales: {
                    x: { stacked: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                    y: { stacked: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
                  },
                  plugins: {
                    legend: { labels: { color: '#e2e8f0', font: { size: 11 } } }
                  },
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
          <p className="text-xs text-slate-400 mb-3">Klik segmen donat untuk melihat detail transaksi per shift</p>
          <div className="h-64 flex items-center justify-center">
            <Doughnut
              data={{
                labels: shiftData.labels,
                datasets: [
                  {
                    data: shiftData.good,
                    backgroundColor: ['#0284c7', '#10b981', '#f59e0b', '#8b5cf6', '#64748b'],
                    borderColor: '#0f172a',
                    borderWidth: 2
                  }
                ]
              }}
              options={{
                maintainAspectRatio: false,
                plugins: {
                  legend: { labels: { color: '#e2e8f0', font: { size: 11 } } }
                },
                onClick: (e, els) => {
                  if (!els.length) return;
                  const sh = shiftData.labels[els[0].index];
                  onOpenList?.(`Detail Shift: ${sh}`, activeKey, rows.filter(r => {
                    let s = cell(r, cfg.i.shift).toUpperCase().trim();
                    if (!s || s === '-' || s === 'UNDEFINED') s = 'NON-SHIFT';
                    return s === sh;
                  }));
                }
              }}
            />
          </div>
        </div>
      </div>

      <div className="card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              {activeLeaderboardTab === 'OP' ? (
                <Users className="w-5 h-5 text-cyan-400" />
              ) : (
                <Briefcase className="w-5 h-5 text-amber-400" />
              )}
              <h3 className="card-title">
                {activeLeaderboardTab === 'OP' ? 'Leaderboard Performa Operator' : 'Leaderboard Performa PO (Customer)'}
              </h3>
            </div>
            <p className="text-xs text-slate-400">Klik baris nama untuk melihat detail seluruh transaksi individu</p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => { setActiveLeaderboardTab('OP'); setSearchQuery(''); }}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition ${
                  activeLeaderboardTab === 'OP' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Operator
              </button>
              <button
                type="button"
                onClick={() => { setActiveLeaderboardTab('PO'); setSearchQuery(''); }}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition ${
                  activeLeaderboardTab === 'PO' ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30 shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                PO
              </button>
            </div>

            <div className="relative w-full sm:w-56">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={activeLeaderboardTab === 'OP' ? 'Cari Operator...' : 'Cari PO...'}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="inp !pl-9 text-xs py-1.5 w-full"
              />
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="tbl min-w-[650px]">
            <thead>
              <tr>
                <th>Rank</th>
                <th>{activeLeaderboardTab === 'OP' ? 'Nama Operator' : 'Nama PO'}</th>
                <th>Total Output</th>
                <th>Good</th>
                <th>Reject</th>
                <th>Replace</th>
                <th>Loss Rate</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeaderboard.map((o, idx) => (
                <tr
                  key={o.name}
                  onClick={() => onOpenList?.(`Rekap Transaksi: ${o.name}`, activeKey, o.rowList)}
                  className="cursor-pointer"
                >
                  <td className="font-mono font-bold text-slate-400">#{idx + 1}</td>
                  <td className="font-semibold text-slate-100 flex items-center gap-1.5">
                    {o.name}
                    <span className="text-[10px] text-cyan-400">→</span>
                  </td>
                  <td className="font-bold text-white">{o.output.toLocaleString('id-ID')}</td>
                  <td className="text-emerald-400 font-semibold">{o.good.toLocaleString('id-ID')}</td>
                  <td className="text-rose-400 font-semibold">{o.reject.toLocaleString('id-ID')}</td>
                  <td className="text-amber-400">{o.replace.toLocaleString('id-ID')}</td>
                  <td className={`font-bold ${o.lossRate > 1.0 ? 'text-rose-400' : 'text-cyan-300'}`}>{o.lossRate.toFixed(1)}%</td>
                </tr>
              ))}
              {filteredLeaderboard.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    Tidak ada data ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}