import React, { useMemo } from 'react';
import { SHEETS, CAT_COLORS, JOP_CATS } from '../../constants/schema';
import { parseDateVal, num, hexA, cell, jopCat, countBy, startOfDay, fmtPeriodRange } from '../../utils/formatters';
import CountUp from '../common/CountUp';
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
import { Check, AlertTriangle, RotateCcw, Layers, Percent } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function ProductionView({ tabKey, data, period, onSelectRow, onOpenList, onOpenMetric, onOpenDayModal, onGoToData }) {
  const cfg = SHEETS[tabKey];
  const rawRows = data[tabKey] || [];

  const rows = useMemo(() => {
    return rawRows.filter(r => {
      const idVal = cell(r, cfg.i.id).trim();
      const jopVal = cell(r, cfg.i.jop).trim();
      const noJopVal = cell(r, cfg.i.nojop).trim();
      if (!idVal || (!jopVal && !noJopVal)) return false;

      const d = parseDateVal(r[cfg.i.date]);
      if (!d) return true;
      const from = period.from ? startOfDay(period.from).getTime() : null;
      const to = period.to ? new Date(period.to).setHours(23, 59, 59, 999) : null;
      if (from && d.getTime() < from) return false;
      if (to && d.getTime() > to) return false;
      return true;
    });
  }, [rawRows, cfg, period]);

  const m = useMemo(() => {
    let baik = 0, rusak = 0, ganti = 0;
    rows.forEach(r => {
      baik += num(r[cfg.i.baik]);
      rusak += num(r[cfg.i.rusak]);
      ganti += num(r[cfg.i.ganti]);
    });
    const pakai = baik + rusak;
    const pct = pakai > 0 ? (rusak / pakai * 100) : 0;
    return { baik, rusak, ganti, pakai, pct };
  }, [rows, cfg]);

  const pctCls = (p) => {
    if (p < 2) return 'text-emerald-600 bg-emerald-50';
    if (p < 5) return 'text-amber-600 bg-amber-50';
    return 'text-rose-600 bg-rose-50';
  };

  const cards = [
    { metric: 'baik', label: cfg.cards.baik, val: m.baik, icon: Check, cls: 'text-emerald-600 bg-emerald-50' },
    { metric: 'rusak', label: cfg.cards.rusak, val: m.rusak, icon: AlertTriangle, cls: 'text-rose-600 bg-rose-50' },
    { metric: 'ganti', label: cfg.cards.ganti, val: m.ganti, icon: RotateCcw, cls: 'text-amber-600 bg-amber-50' },
    { metric: 'pakai', label: cfg.cards.pakai, val: m.pakai, icon: Layers, cls: 'text-blue-600 bg-blue-50' },
    { metric: 'pct', label: 'Total ' + cfg.unit + ' Rusak', val: m.pct, icon: Percent, cls: pctCls(m.pct), pct: true }
  ];

  // Daily Data
  const daily = useMemo(() => {
    const map = new Map();
    rows.forEach(r => {
      const d = parseDateVal(r[cfg.i.date]);
      if (!d) return;
      const k = startOfDay(d).getTime();
      const e = map.get(k) || { baik: 0, rusak: 0 };
      e.baik += num(r[cfg.i.baik]);
      e.rusak += num(r[cfg.i.rusak]);
      map.set(k, e);
    });
    const keys = [...map.keys()].sort((a, b) => a - b);
    return {
      keys,
      labels: keys.map(k => {
        const d = new Date(k);
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
      }),
      baik: keys.map(k => map.get(k).baik),
      rusak: keys.map(k => map.get(k).rusak)
    };
  }, [rows, cfg]);

  // JOP Data
  const jop = useMemo(() => {
    const order = JOP_CATS.map(x => x[1]).concat(['Lainnya']);
    const map = new Map(order.map(o => [o, 0]));
    rows.forEach(r => {
      const c = jopCat(cell(r, cfg.i.nojop));
      map.set(c, (map.get(c) || 0) + 1);
    });
    const labels = [], counts = [], idx = [];
    order.forEach((o, i) => {
      if (map.get(o) > 0) {
        labels.push(o); counts.push(map.get(o)); idx.push(i);
      }
    });
    return { labels, counts, idx };
  }, [rows, cfg]);

  // Sebab Rusak & Ganti
  const pr = useMemo(() => {
    if (cfg.i.penyRusak === undefined || cfg.i.penyRusak === -1) return { labels: [], counts: [] };
    const mp = countBy(rows.filter(r => cell(r, cfg.i.penyRusak).trim() !== ''), r => cell(r, cfg.i.penyRusak));
    const arr = [...mp.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
    return { labels: arr.map(a => a[0]), counts: arr.map(a => a[1]) };
  }, [rows, cfg]);

  const pg = useMemo(() => {
    if (cfg.i.penyGanti === undefined || cfg.i.penyGanti === -1) return { labels: [], counts: [] };
    const mp = countBy(rows.filter(r => cell(r, cfg.i.penyGanti).trim() !== ''), r => cell(r, cfg.i.penyGanti));
    const arr = [...mp.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
    return { labels: arr.map(a => a[0]), counts: arr.map(a => a[1]) };
  }, [rows, cfg]);

  // Extra Chart Data
  const exData = useMemo(() => {
    const ex = cfg.charts.extra;
    if (!ex || ex.col === undefined) return null;
    const mp = countBy(rows.filter(r => cell(r, ex.col).trim() !== ''), r => cell(r, ex.col));
    return { labels: [...mp.keys()], counts: [...mp.values()], ex };
  }, [rows, cfg]);

  return (
    <div className="space-y-4 anim-in">
      <div className="card p-4 flex flex-wrap items-center gap-3">
        <span className="w-11 h-11 rounded-xl grid place-items-center text-white font-display font-extrabold" style={{ background: cfg.color }}>
          {cfg.label.charAt(0)}
        </span>
        <div>
          <h3 className="card-title">Dashboard Produksi {cfg.label}</h3>
          <p className="text-xs text-slate-500">{cfg.desc} · Periode {fmtPeriodRange(period.from, period.to)} · {rows.length} baris</p>
        </div>
        <button onClick={() => onGoToData(tabKey)} className="btn btn-ghost ml-auto text-xs">
          Lihat Data {cfg.label} →
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 stagger">
        {cards.map(c => {
          const Icon = c.icon;
          return (
            <button
              key={c.metric}
              onClick={() => onOpenMetric(tabKey, c.metric, rows)}
              className="card card-h p-4 text-left bg-white"
            >
              <span className={`w-8 h-8 rounded-lg grid place-items-center ${c.cls}`}>
                <Icon className="w-4 h-4" />
              </span>
              <div className="mt-3 font-display font-extrabold text-2xl text-slate-800">
                <CountUp target={c.val} isPct={c.pct} />
              </div>
              <div className="text-[11px] font-semibold text-slate-500 mt-0.5">{c.label} {c.pct ? '' : '(pcs)'}</div>
            </button>
          );
        })}
      </div>

      {rows.length > 0 ? (
        <>
          <div className="grid gap-4 xl:grid-cols-3">
            <div className="card p-4 xl:col-span-2">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <h3 className="card-title">{cfg.charts.daily}</h3>
                <span className="text-[11px] text-slate-400">klik batang = detail harian</span>
              </div>
              <div className="h-72">
                <Bar
                  data={{
                    labels: daily.labels,
                    datasets: [
                      { label: cfg.unit + ' Baik', data: daily.baik, backgroundColor: hexA(cfg.color, 0.85), stack: 's', borderRadius: 4 },
                      { label: cfg.unit + ' Rusak', data: daily.rusak, backgroundColor: '#f43f5e', stack: 's', borderRadius: 4 }
                    ]
                  }}
                  options={{
                    maintainAspectRatio: false,
                    scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } },
                    onClick: (e, els) => {
                      if (!els.length) return;
                      onOpenDayModal(tabKey, daily.keys[els[0].index]);
                    }
                  }}
                />
              </div>
            </div>

            <div className="card p-4">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <h3 className="card-title">Kategori JOP</h3>
                <span className="text-[11px] text-slate-400">huruf pertama No JOP</span>
              </div>
              <div className="h-72">
                <Bar
                  data={{
                    labels: jop.labels,
                    datasets: [{ label: 'Jumlah Pekerjaan', data: jop.counts, backgroundColor: jop.labels.map((_, i) => CAT_COLORS[jop.idx[i]] || '#64748b'), borderRadius: 5 }]
                  }}
                  options={{
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    onClick: (e, els) => {
                      if (!els.length) return;
                      const cat = jop.labels[els[0].index];
                      onOpenList(`Kategori JOP: ${cat}`, tabKey, rows.filter(r => jopCat(cell(r, cfg.i.nojop)) === cat));
                    }
                  }}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="card p-4">
              <h3 className="card-title">Sebab {cfg.unit} Rusak</h3>
              <div className="h-64">
                <Bar
                  data={{ labels: pr.labels, datasets: [{ data: pr.counts, backgroundColor: '#f43f5e', borderRadius: 5 }] }}
                  options={{
                    indexAxis: 'y',
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    onClick: (e, els) => {
                      if (!els.length) return;
                      const c = pr.labels[els[0].index];
                      onOpenList(`Sebab Rusak: ${c}`, tabKey, rows.filter(r => cell(r, cfg.i.penyRusak) === c));
                    }
                  }}
                />
              </div>
            </div>

            <div className="card p-4">
              <h3 className="card-title">Sebab {cfg.unit} Ganti</h3>
              <div className="h-64">
                <Bar
                  data={{ labels: pg.labels, datasets: [{ data: pg.counts, backgroundColor: '#f59e0b', borderRadius: 5 }] }}
                  options={{
                    indexAxis: 'y',
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    onClick: (e, els) => {
                      if (!els.length) return;
                      const c = pg.labels[els[0].index];
                      onOpenList(`Sebab Ganti: ${c}`, tabKey, rows.filter(r => cell(r, cfg.i.penyGanti) === c));
                    }
                  }}
                />
              </div>
            </div>

            {exData && (
              <div className="card p-4 md:col-span-2 xl:col-span-1">
                <h3 className="card-title">{exData.ex.title}</h3>
                <div className="h-64 relative flex items-center justify-center">
                  {exData.ex.kind === 'bar' ? (
                    <Bar
                      data={{ labels: exData.labels, datasets: [{ label: 'Jumlah', data: exData.counts, backgroundColor: hexA(cfg.color, 0.8), borderRadius: 5 }] }}
                      options={{
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        onClick: (e, els) => {
                          if (!els.length) return;
                          const c = exData.labels[els[0].index];
                          onOpenList(`${exData.ex.title}: ${c}`, tabKey, rows.filter(r => cell(r, exData.ex.col) === c));
                        }
                      }}
                    />
                  ) : (
                    <Doughnut
                      data={{
                        labels: exData.labels,
                        datasets: [{ data: exData.counts, backgroundColor: exData.labels.map((_, i) => CAT_COLORS[i % CAT_COLORS.length]), borderWidth: 2, borderColor: '#fff' }]
                      }}
                      options={{
                        maintainAspectRatio: false,
                        cutout: '50%',
                        plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, pointStyle: 'circle', font: { size: 10 } } } },
                        onClick: (e, els) => {
                          if (!els.length) return;
                          const c = exData.labels[els[0].index];
                          onOpenList(`${exData.ex.title}: ${c}`, tabKey, rows.filter(r => cell(r, exData.ex.col) === c));
                        }
                      }}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="card text-center py-12 text-slate-400 text-sm">
          Tidak ada data pada periode ini — sesuaikan filter tanggal di atas.
        </div>
      )}
    </div>
  );
}