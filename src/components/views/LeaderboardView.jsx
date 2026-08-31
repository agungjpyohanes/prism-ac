import React, { useState, useMemo } from 'react';
import { SHEETS, PROD_KEYS } from '../../constants/schema';
import { parseDateVal, num, cell, fmtPeriodRange, startOfDay } from '../../utils/formatters';
import { Trophy, Users, Cpu, Clock, Search, Filter } from 'lucide-react';

export default function LeaderboardView({ data, period, onOpenList }) {
  const [activeTab, setActiveTab] = useState('operator'); // operator | shift | machine
  const [selectedProcess, setSelectedProcess] = useState('ALL');
  const [search, setSearch] = useState('');

  const targetKeys = selectedProcess === 'ALL' ? PROD_KEYS : [selectedProcess];

  const aggregatedData = useMemo(() => {
    const opMap = new Map();
    const shiftMap = new Map();
    const machineMap = new Map();

    targetKeys.forEach(k => {
      const cfg = SHEETS[k];
      const rows = data[k] || [];

      rows.forEach(r => {
        const idVal = cell(r, cfg.i.id).trim();
        if (!idVal) return;

        const d = parseDateVal(r[cfg.i.date]);
        if (d) {
          const from = period?.from ? startOfDay(period.from).getTime() : null;
          const to = period?.to ? new Date(period.to).setHours(23, 59, 59, 999) : null;
          if (from && d.getTime() < from) return;
          if (to && d.getTime() > to) return;
        }

        const good = num(r[cfg.i.baik]);
        const defect = num(r[cfg.i.rusak]);
        const replace = num(r[cfg.i.ganti]);
        const op = cell(r, cfg.i.operator).trim() || 'Unassigned';
        const sh = cell(r, cfg.i.shift).toUpperCase().trim() || 'NON-SHIFT';
        const mach = (cfg.i.expose_mach !== undefined ? cell(r, cfg.i.expose_mach) : cell(r, 4)).trim() || 'Mesin Utama';

        // Operator
        const opEntry = opMap.get(op) || { name: op, process: cfg.label, good: 0, defect: 0, replace: 0, rows: [] };
        opEntry.good += good; opEntry.defect += defect; opEntry.replace += replace; opEntry.rows.push(r);
        opMap.set(op, opEntry);

        // Shift
        const shEntry = shiftMap.get(sh) || { name: sh, good: 0, defect: 0, replace: 0, rows: [] };
        shEntry.good += good; shEntry.defect += defect; shEntry.replace += replace; shEntry.rows.push(r);
        shiftMap.set(sh, shEntry);

        // Machine
        const mEntry = machineMap.get(mach) || { name: mach, process: cfg.label, good: 0, defect: 0, replace: 0, rows: [] };
        mEntry.good += good; mEntry.defect += defect; mEntry.replace += replace; mEntry.rows.push(r);
        machineMap.set(mach, mEntry);
      });
    });

    const calcRank = (map) => {
      return [...map.values()].map(item => {
        const total = item.good + item.defect;
        const defectRate = total > 0 ? (item.defect / total) * 100 : 0;
        const qualityScore = Math.max(0, 100 - (defectRate * 10));
        // Formula skor gabungan: 60% Output + 40% Kualitas
        const score = Math.round((Math.min(100, (item.good / 500) * 100) * 0.6) + (qualityScore * 0.4));
        return { ...item, total, defectRate, qualityScore, score };
      }).sort((a, b) => b.score - a.score || b.good - a.good);
    };

    return {
      operators: calcRank(opMap),
      shifts: calcRank(shiftMap),
      machines: calcRank(machineMap)
    };
  }, [data, targetKeys, period]);

  const currentList = useMemo(() => {
    let list = aggregatedData.operators;
    if (activeTab === 'shift') list = aggregatedData.shifts;
    if (activeTab === 'machine') list = aggregatedData.machines;

    if (!search.trim()) return list;
    return list.filter(x => x.name.toLowerCase().includes(search.toLowerCase()));
  }, [activeTab, aggregatedData, search]);

  return (
    <div className="space-y-4 anim-in">
      <div className="card p-5 bg-gradient-to-r from-amber-950 via-slate-900 to-slate-900 text-white flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge bg-amber-500/20 text-amber-300 font-bold">PERFORMANCE INDEX</span>
            <span className="text-xs text-slate-400">· KPI Ranking & Rating</span>
          </div>
          <h2 className="font-display font-extrabold text-2xl mt-1.5 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" /> KPI Leaderboard
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Peringkat performa operator, shift, dan utilisasi mesin berdasarkan output bersih dan efisiensi mutu (Defect Rate).
          </p>
        </div>
        <div className="text-right">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Periode</div>
          <div className="font-bold text-sm text-amber-400 mt-0.5">{fmtPeriodRange(period?.from, period?.to)}</div>
        </div>
      </div>

      <div className="card p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => { setActiveTab('operator'); setSearch(''); }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition ${activeTab === 'operator' ? 'bg-white dark:bg-slate-700 text-amber-600 shadow-sm' : 'text-slate-500'}`}
          >
            <Users className="w-4 h-4" /> Ranking Operator
          </button>
          <button
            onClick={() => { setActiveTab('shift'); setSearch(''); }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition ${activeTab === 'shift' ? 'bg-white dark:bg-slate-700 text-amber-600 shadow-sm' : 'text-slate-500'}`}
          >
            <Clock className="w-4 h-4" /> Ranking Shift
          </button>
          <button
            onClick={() => { setActiveTab('machine'); setSearch(''); }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition ${activeTab === 'machine' ? 'bg-white dark:bg-slate-700 text-amber-600 shadow-sm' : 'text-slate-500'}`}
          >
            <Cpu className="w-4 h-4" /> Ranking Mesin
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedProcess}
            onChange={e => setSelectedProcess(e.target.value)}
            className="inp text-xs font-semibold"
          >
            <option value="ALL">Semua Lini Proses</option>
            {PROD_KEYS.map(k => <option key={k} value={k}>{SHEETS[k].label}</option>)}
          </select>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="inp !pl-8 text-xs w-44"
            />
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Nama / Entitas</th>
                {activeTab !== 'shift' && <th className="py-3 px-4">Lini</th>}
                <th className="py-3 px-4">Output Good</th>
                <th className="py-3 px-4">Defect</th>
                <th className="py-3 px-4">Defect Rate</th>
                <th className="py-3 px-4">Total Score</th>
                <th className="py-3 px-4">Badge</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {currentList.map((item, idx) => (
                <tr 
                  key={item.name} 
                  onClick={() => onOpenList?.(`Detail Leaderboard: ${item.name}`, 'rec_ctcp', item.rows)}
                  className="hover:bg-amber-500/5 transition cursor-pointer"
                >
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs ${idx === 0 ? 'bg-amber-400 text-slate-900 font-extrabold shadow' : idx === 1 ? 'bg-slate-300 text-slate-900' : idx === 2 ? 'bg-amber-700 text-white' : 'text-slate-400'}`}>
                      {idx + 1}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-100">{item.name}</td>
                  {activeTab !== 'shift' && <td className="py-3 px-4 text-slate-400">{item.process || '-'}</td>}
                  <td className="py-3 px-4 font-semibold text-emerald-600">{item.good.toLocaleString('id-ID')}</td>
                  <td className="py-3 px-4 font-semibold text-rose-600">{item.defect.toLocaleString('id-ID')}</td>
                  <td className="py-3 px-4 font-bold">{item.defectRate.toFixed(1)}%</td>
                  <td className="py-3 px-4 font-extrabold text-amber-500">{item.score} / 100</td>
                  <td className="py-3 px-4">
                    {idx === 0 && <span className="badge bg-amber-100 text-amber-800 border border-amber-300">★ Top Performer</span>}
                    {idx > 0 && item.defectRate <= 1.0 && <span className="badge bg-emerald-100 text-emerald-800">Quality Star</span>}
                  </td>
                </tr>
              ))}
              {currentList.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">Tidak ada data untuk filter yang dipilih.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}