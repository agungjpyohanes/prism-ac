<div className="card p-5 bg-white dark:bg-slate-900 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="card-title">Porsi Job Berdasarkan Kategori</h3>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                Total {filtered.length} Job
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">Klik diagram atau badge untuk membuka detail data per divisi</p>

            {/* Pill Badges Jumlah & Persentase per Kategori */}
            <div className="flex flex-wrap gap-2 mb-3">
              {Object.entries(stats.categoryCount).map(([cat, count], idx) => {
                const colors = ['#0284c7', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#64748b'];
                const color = colors[idx % colors.length];
                const pct = filtered.length > 0 ? ((count / filtered.length) * 100).toFixed(1) : 0;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => onOpenList?.(`Job Aktif Kategori: ${cat}`, 'job_active', stats.categoryRows[cat] || [])}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border transition hover:scale-105 cursor-pointer"
                    style={{
                      backgroundColor: `${color}15`,
                      borderColor: `${color}40`,
                      color: color
                    }}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    <span>{cat}:</span>
                    <span className="font-extrabold">{count} Job</span>
                    <span className="text-[10px] opacity-80">({pct}%)</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-60 relative flex items-center justify-center">
            {Object.keys(stats.categoryCount).length === 0 ? (
              <span className="text-xs text-slate-400">Tidak ada data kategori</span>
            ) : (
              <>
                <Doughnut
                  data={{
                    labels: Object.keys(stats.categoryCount).map(
                      (cat) => `${cat} (${stats.categoryCount[cat]} Job)`
                    ),
                    datasets: [
                      {
                        data: Object.values(stats.categoryCount),
                        backgroundColor: ['#0284c7', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#64748b'],
                        borderWidth: 2,
                        borderColor: '#0f172a'
                      }
                    ]
                  }}
                  options={{
                    maintainAspectRatio: false,
                    cutout: '68%',
                    plugins: {
                      legend: {
                        display: false // Menggunakan Pill Badges kustom di atas agar lebih rapi
                      },
                      tooltip: {
                        callbacks: {
                          label: (context) => {
                            const val = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
                            return ` ${val} Job (${pct}%)`;
                          }
                        }
                      }
                    },
                    onClick: handleDoughnutClick
                  }}
                />
                {/* Total Ringkasan di Tengah Lubang Donat */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-slate-800 dark:text-white leading-none">
                    {filtered.length}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                    Total Job
                  </span>
                </div>
              </>
            )}
          </div>
        </div>