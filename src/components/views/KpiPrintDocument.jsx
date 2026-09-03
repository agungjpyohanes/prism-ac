import React from 'react';
import { formatYMD } from '../../utils/formatters';

// Helper susunan tanda tangan formal dinamis berdasarkan jabatan / hierarki
function renderSignatures(personil) {
  const jabatan = String(personil?.jabatan || '').trim().toUpperCase();
  const nama = personil?.nama_lengkap || personil?.nick_name || 'KARYAWAN';

  // KONDISI 1: MANAGER (3 KOLOM)
  if (jabatan.includes('MANAGER')) {
    return (
      <tr>
        <td className="w-1/3 p-1.5 text-center align-top border border-slate-400 bg-white">
          <div className="font-bold text-[8.5px] uppercase text-slate-800 leading-tight">KARYAWAN</div>
          <div className="text-[7.5px] uppercase text-slate-600 mb-0.5 leading-tight">MANAGER PREPRESS</div>
          <div className="h-14"></div>
          <div className="font-bold text-[8.5px] underline uppercase text-slate-950 leading-tight">{nama}</div>
          <div className="text-[7.5px] text-slate-500 mt-0.5 font-mono">Tgl: ....................</div>
        </td>
        <td className="w-1/3 p-1.5 text-center align-top border border-slate-400 bg-white">
          <div className="font-bold text-[8.5px] uppercase text-slate-800 leading-tight">DISETUJUI OLEH (1)</div>
          <div className="text-[7.5px] uppercase text-slate-600 mb-0.5 leading-tight">PLANT MANAGER</div>
          <div className="h-14"></div>
          <div className="font-bold text-[8.5px] underline uppercase text-slate-950 leading-tight">YOH. SRIYANA</div>
          <div className="text-[7.5px] text-slate-500 mt-0.5 font-mono">Tgl: ....................</div>
        </td>
        <td className="w-1/3 p-1.5 text-center align-top border border-slate-400 bg-white">
          <div className="font-bold text-[8.5px] uppercase text-slate-800 leading-tight">DISETUJUI OLEH (2)</div>
          <div className="text-[7.5px] uppercase text-slate-600 mb-0.5 leading-tight">HRBP PRODUCTION &amp; WAREHOUSE</div>
          <div className="h-14"></div>
          <div className="font-bold text-[8.5px] underline uppercase text-slate-950 leading-tight">SUGENG KURNIAWAN DJATI</div>
          <div className="text-[7.5px] text-slate-500 mt-0.5 font-mono">Tgl: ....................</div>
        </td>
      </tr>
    );
  }

  // KONDISI 2: SUPERVISOR (4 KOLOM - TANPA KOLOM DIBUAT OLEH)
  if (jabatan.includes('SUPERVISOR') || String(nama).toUpperCase().includes('DWI ISWAHYUDI')) {
    return (
      <tr>
        <td className="w-1/4 p-1.5 text-center align-top border border-slate-400 bg-white">
          <div className="font-bold text-[8.5px] uppercase text-slate-800 leading-tight">KARYAWAN</div>
          <div className="text-[7.5px] uppercase text-slate-600 mb-0.5 leading-tight">SUPERVISOR PREPRESS</div>
          <div className="h-14"></div>
          <div className="font-bold text-[8.5px] underline uppercase text-slate-950 leading-tight">{nama}</div>
          <div className="text-[7.5px] text-slate-500 mt-0.5 font-mono">Tgl: ....................</div>
        </td>
        <td className="w-1/4 p-1.5 text-center align-top border border-slate-400 bg-white">
          <div className="font-bold text-[8.5px] uppercase text-slate-800 leading-tight">DIPERIKSA OLEH</div>
          <div className="text-[7.5px] uppercase text-slate-600 mb-0.5 leading-tight">MANAGER PREPRESS</div>
          <div className="h-14"></div>
          <div className="font-bold text-[8.5px] underline uppercase text-slate-950 leading-tight">YOHANES AGUNG JAKA P</div>
          <div className="text-[7.5px] text-slate-500 mt-0.5 font-mono">Tgl: ....................</div>
        </td>
        <td className="w-1/4 p-1.5 text-center align-top border border-slate-400 bg-white">
          <div className="font-bold text-[8.5px] uppercase text-slate-800 leading-tight">DISETUJUI OLEH (1)</div>
          <div className="text-[7.5px] uppercase text-slate-600 mb-0.5 leading-tight">PLANT MANAGER</div>
          <div className="h-14"></div>
          <div className="font-bold text-[8.5px] underline uppercase text-slate-950 leading-tight">YOH. SRIYANA</div>
          <div className="text-[7.5px] text-slate-500 mt-0.5 font-mono">Tgl: ....................</div>
        </td>
        <td className="w-1/4 p-1.5 text-center align-top border border-slate-400 bg-white">
          <div className="font-bold text-[8.5px] uppercase text-slate-800 leading-tight">DISETUJUI OLEH (2)</div>
          <div className="text-[7.5px] uppercase text-slate-600 mb-0.5 leading-tight">HRBP PRODUCTION &amp; WAREHOUSE</div>
          <div className="h-14"></div>
          <div className="font-bold text-[8.5px] underline uppercase text-slate-950 leading-tight">SUGENG KURNIAWAN DJATI</div>
          <div className="text-[7.5px] text-slate-500 mt-0.5 font-mono">Tgl: ....................</div>
        </td>
      </tr>
    );
  }

  // KONDISI 3: OPERATOR, PO, ADMIN, WIP, KOORDINATOR (5 KOLOM STANDAR)
  return (
    <tr>
      <td className="w-1/5 p-1.5 text-center align-top border border-slate-400 bg-white">
        <div className="font-bold text-[8.5px] uppercase text-slate-800 leading-tight">KARYAWAN</div>
        <div className="text-[7.5px] uppercase text-slate-600 mb-0.5 leading-tight">{jabatan || 'OPERATOR'}</div>
        <div className="h-14"></div>
        <div className="font-bold text-[8.5px] underline uppercase text-slate-950 leading-tight">{nama}</div>
        <div className="text-[7.5px] text-slate-500 mt-0.5 font-mono">Tgl: ....................</div>
      </td>
      <td className="w-1/5 p-1.5 text-center align-top border border-slate-400 bg-white">
        <div className="font-bold text-[8.5px] uppercase text-slate-800 leading-tight">DIBUAT OLEH</div>
        <div className="text-[7.5px] uppercase text-slate-600 mb-0.5 leading-tight">SUPERVISOR / KOOR</div>
        <div className="h-14"></div>
        <div className="font-bold text-[8.5px] underline uppercase text-slate-950 leading-tight">DWI ISWAHYUDI</div>
        <div className="text-[7.5px] text-slate-500 mt-0.5 font-mono">Tgl: ....................</div>
      </td>
      <td className="w-1/5 p-1.5 text-center align-top border border-slate-400 bg-white">
        <div className="font-bold text-[8.5px] uppercase text-slate-800 leading-tight">DIPERIKSA OLEH</div>
        <div className="text-[7.5px] uppercase text-slate-600 mb-0.5 leading-tight">MANAGER PREPRESS</div>
        <div className="h-14"></div>
        <div className="font-bold text-[8.5px] underline uppercase text-slate-950 leading-tight">YOHANES AGUNG JAKA P</div>
        <div className="text-[7.5px] text-slate-500 mt-0.5 font-mono">Tgl: ....................</div>
      </td>
      <td className="w-1/5 p-1.5 text-center align-top border border-slate-400 bg-white">
        <div className="font-bold text-[8.5px] uppercase text-slate-800 leading-tight">DISETUJUI OLEH (1)</div>
        <div className="text-[7.5px] uppercase text-slate-600 mb-0.5 leading-tight">PLANT MANAGER</div>
        <div className="h-14"></div>
        <div className="font-bold text-[8.5px] underline uppercase text-slate-950 leading-tight">YOH. SRIYANA</div>
        <div className="text-[7.5px] text-slate-500 mt-0.5 font-mono">Tgl: ....................</div>
      </td>
      <td className="w-1/5 p-1.5 text-center align-top border border-slate-400 bg-white">
        <div className="font-bold text-[8.5px] uppercase text-slate-800 leading-tight">DISETUJUI OLEH (2)</div>
        <div className="text-[7.5px] uppercase text-slate-600 mb-0.5 leading-tight">HRBP PRODUCTION &amp; WAREHOUSE</div>
        <div className="h-14"></div>
        <div className="font-bold text-[8.5px] underline uppercase text-slate-950 leading-tight">SUGENG KURNIAWAN DJATI</div>
        <div className="text-[7.5px] text-slate-500 mt-0.5 font-mono">Tgl: ....................</div>
      </td>
    </tr>
  );
}

export default function KpiPrintDocument({ personil, period }) {
  if (!personil) return null;

  const periodFromStr = formatYMD(period?.from);
  const periodToStr = formatYMD(period?.to);

  const counts = personil.attendanceCounts || {
    HDOK: 0,
    HDTL: 0,
    JKKR: 0,
    IZSK: 0,
    IZRS: 0,
    ALPA: 0,
    LMBR: 0,
    CUTI: 0,
    OFF: 0
  };

  const isDirectProd = personil.hierarchy?.level === 2 && personil.hierarchy?.isDirectProduction;
  const isLevel1 = personil.hierarchy?.level === 1;

  return (
    <div
      id="printable-kpi-sheet"
      className="a4-sheet bg-white text-black p-4 w-full max-w-[210mm] mx-auto flex flex-col justify-between print:p-0 print:m-0 print:max-w-none print:w-full print:h-[265mm] border-0 print:border-none print:shadow-none"
      style={{
        minHeight: '265mm',
        height: '265mm',
        fontFamily: "Arial, Calibri, 'Helvetica Neue', Helvetica, sans-serif",
        fontSize: '10px',
        lineHeight: '1.25',
        color: '#000000',
        backgroundColor: '#ffffff',
        boxSizing: 'border-box'
      }}
    >
      <div>
        {/* ========================================================================= */}
        {/* 1. KOP SURAT / HEADER DOKUMEN (LEGA & PROPORSI LOGO KIKY 2X LEBIH BESAR) */}
        {/* ========================================================================= */}
        <div className="border-b-2 border-black pb-2 mb-3 flex items-center justify-between gap-4">
          {/* Header Kiri: Logo Prepress */}
          <div className="flex items-center gap-2.5 w-1/3">
            <img
              src="/prepress-Logo.png"
              alt="Prepress Logo"
              style={{ height: '40px', maxHeight: '40px' }}
              className="h-10 max-h-10 max-w-[120px] object-contain shrink-0"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <div className="leading-tight">
              <h4 className="font-extrabold text-[10px] uppercase tracking-wider text-slate-900">
                PREPRESS DEPARTMENT
              </h4>
              <p className="text-[9px] text-slate-700 font-semibold">PT SOLO MURNI</p>
            </div>
          </div>

          {/* Header Tengah: Judul & Periode */}
          <div className="text-center w-1/3">
            <h2 className="font-black text-[13.5px] uppercase tracking-wider text-slate-950 leading-tight">
              KEY PERFORMANCE INDICATOR (KPI)
            </h2>
            <p className="text-[10px] font-mono font-bold text-slate-800 mt-0.5">
              START DATE: {periodFromStr || 'START'} s/d END DATE: {periodToStr || 'END'}
            </p>
          </div>

          {/* Header Kanan: Logo KIKY (2x Lebih Besar & Rata Kanan) */}
          <div className="flex justify-end items-center min-w-[120px] w-1/3">
            <img
              src="/logo-kiky.png"
              alt="KIKY Logo"
              style={{ height: '68px', maxHeight: '72px', width: 'auto' }}
              className="h-[68px] max-h-[72px] w-auto object-contain shrink-0"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. IDENTITAS PERSONIL */}
        {/* ========================================================================= */}
        <div className="border border-slate-300 rounded p-1.5 bg-slate-50/70 mb-2.5">
          <div className="grid grid-cols-2 gap-x-6 gap-y-0.5 text-[9.5px]">
            <div className="flex">
              <span className="w-32 font-semibold text-slate-700">NAMA LENGKAP</span>
              <span className="font-bold text-slate-950">: {personil.nama_lengkap}</span>
            </div>
            <div className="flex">
              <span className="w-32 font-semibold text-slate-700">JABATAN / DIVISI</span>
              <span className="font-bold text-slate-950">: {personil.jabatan} / {personil.divisi}</span>
            </div>
            <div className="flex">
              <span className="w-32 font-semibold text-slate-700">NICKNAME</span>
              <span className="font-bold font-mono text-slate-950">: {personil.nick_name}</span>
            </div>
            <div className="flex">
              <span className="w-32 font-semibold text-slate-700">LINI / MESIN</span>
              <span className="font-bold text-slate-950">: {personil.lini_mesin || '-'}</span>
            </div>
            <div className="flex">
              <span className="w-32 font-semibold text-slate-700">NIK LAMA / BARU</span>
              <span className="font-mono font-bold text-slate-950">: {personil.nik_lama} / {personil.nik_baru}</span>
            </div>
            <div className="flex">
              <span className="w-32 font-semibold text-slate-700">PERAN / HIERARKI</span>
              <span className="font-bold text-slate-950">: {personil.hierarchy?.label || personil.jabatan}</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. DUA BLOK REKAPITULASI BERSEBELAHAN (GRID 2 KOLOM) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 gap-2 mb-2.5">
          {/* Kolom Kiri: Rekapitulasi Kehadiran & Kedisiplinan */}
          <div className="border border-slate-300 rounded p-1.5 flex flex-col justify-between bg-white">
            <div>
              <div className="bg-slate-100 text-slate-900 border border-slate-300 px-2 py-0.5 rounded text-[8.5px] font-bold uppercase tracking-wider mb-1 flex justify-between items-center">
                <span>A. REKAPITULASI KEHADIRAN &amp; KEDISIPLINAN</span>
                <span className="font-mono text-[8px] text-slate-600 font-semibold">BOBOT 40%</span>
              </div>

              <table className="w-full text-[9px] border-collapse">
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="py-0.5 font-semibold text-slate-700">Total Hari Kerja Terjadwal</td>
                    <td className="py-0.5 text-right font-mono font-bold text-slate-950">{personil.totalHariKerja} Hari</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="py-0.5 text-slate-600">Hadir Tepat Waktu (HDOK)</td>
                    <td className="py-0.5 text-right font-mono font-semibold text-emerald-700">{counts.HDOK || 0}x</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="py-0.5 text-slate-600">Hari Libur / Off (OFF) &bull; Cuti (CUTI)</td>
                    <td className="py-0.5 text-right font-mono text-slate-700">{counts.OFF || 0}x &bull; {counts.CUTI || 0}x</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="py-0.5 text-slate-600">Terlambat &gt; 3 mnt (HDTL: -10 pts)</td>
                    <td className="py-0.5 text-right font-mono text-rose-700 font-semibold">{counts.HDTL || 0}x</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="py-0.5 text-slate-600">Jam Kurang / Telat &gt; 1 jam (JKKR: -15 pts)</td>
                    <td className="py-0.5 text-right font-mono text-rose-700 font-semibold">{counts.JKKR || 0}x</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="py-0.5 text-slate-600">Izin Sakit Dokter (IZSK: -10 pts)</td>
                    <td className="py-0.5 text-right font-mono text-rose-700 font-semibold">{counts.IZSK || 0}x</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="py-0.5 text-slate-600">Izin Resmi / Dispensasi (IZRS: -25 pts)</td>
                    <td className="py-0.5 text-right font-mono text-rose-700 font-semibold">{counts.IZRS || 0}x</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="py-0.5 text-slate-600">Mangkir / Alpa (ALPA: -75 pts)</td>
                    <td className="py-0.5 text-right font-mono text-rose-700 font-semibold">{counts.ALPA || 0}x</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="py-0.5 font-bold text-rose-700">Total Pemotongan Poin</td>
                    <td className="py-0.5 text-right font-mono font-bold text-rose-700">-{personil.attendancePenalties} Poin</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-1 pt-0.5 border-t border-slate-400 flex justify-between items-center">
              <span className="font-extrabold text-[9px] text-slate-900">SKOR KEDISIPLINAN:</span>
              <span className="font-black text-xs font-mono text-slate-950">{personil.skor_absensi} / 100 pts</span>
            </div>
          </div>

          {/* Kolom Kanan: Rekapitulasi Produktivitas & Mutu */}
          <div className="border border-slate-300 rounded p-1.5 flex flex-col justify-between bg-white">
            <div>
              <div className="bg-slate-100 text-slate-900 border border-slate-300 px-2 py-0.5 rounded text-[8.5px] font-bold uppercase tracking-wider mb-1 flex justify-between items-center">
                <span>B. REKAPITULASI PRODUKTIVITAS &amp; MUTU</span>
                <span className="font-mono text-[8px] text-slate-600 font-semibold">{isLevel1 ? 'SUPPORT (100% ABS)' : 'BOBOT 60%'}</span>
              </div>

              {isDirectProd ? (
                <table className="w-full text-[9px] border-collapse">
                  <tbody>
                    <tr className="border-b border-slate-200">
                      <td className="py-0.5 font-semibold text-slate-700">Total Output Baik (Good Output)</td>
                      <td className="py-0.5 text-right font-mono font-bold text-emerald-700">{personil.good.toLocaleString('id-ID')} Pcs</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="py-0.5 font-semibold text-slate-700">Total Defect / Plate Rusak</td>
                      <td className="py-0.5 text-right font-mono font-bold text-rose-700">{personil.defect.toLocaleString('id-ID')} Pcs</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="py-0.5 font-semibold text-slate-700">Total Keseluruhan Produksi</td>
                      <td className="py-0.5 text-right font-mono font-bold text-slate-950">{personil.totalOutput.toLocaleString('id-ID')} Pcs</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="py-0.5 font-semibold text-slate-700">Reject Rate Fisik</td>
                      <td className="py-0.5 text-right font-mono font-bold text-slate-950">{personil.rejectRate}%</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="py-0.5 font-semibold text-slate-700">Ambang Batas Toleransi Target</td>
                      <td className="py-0.5 text-right font-mono font-semibold text-slate-600">Maks. 0,5% (0.005)</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="py-0.5 font-semibold text-slate-700">Status Audit Reject Rate</td>
                      <td className={`py-0.5 text-right font-bold text-[8px] ${personil.isRejectAman ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {personil.isRejectAman ? '✓ Lolos Toleransi (≤0.5%)' : '⚠ Alert Melebihi Toleransi'}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="py-0.5 font-semibold text-slate-700">Tingkat Hasil Baik (Base Yield)</td>
                      <td className="py-0.5 text-right font-mono font-bold text-slate-950">{personil.baseYieldRate?.toFixed(1)}%</td>
                    </tr>
                  </tbody>
                </table>
              ) : isLevel1 ? (
                <div className="space-y-0.5 py-0.5 text-[8.5px] text-slate-800">
                  <div className="p-1 rounded bg-slate-50 border border-slate-200">
                    <span className="font-bold text-slate-950 block">Peran Non-Output Fisik (Admin / WIP)</span>
                    <p className="text-[8px] text-slate-600 mt-0.5 leading-snug">
                      Personil pada divisi ini tidak mencetak plate langsung. Penilaian mutu dinilai <b>N/A</b> dan evaluasi performa dinilai penuh (100%) dari indikator kehadiran &amp; kepatuhan kerja.
                    </p>
                  </div>
                  <div className="flex justify-between items-center py-0.5 border-b border-slate-200">
                    <span className="text-slate-600">Skor Mutu Teknis:</span>
                    <span className="font-bold font-mono text-slate-600">N/A (Non-Fisik)</span>
                  </div>
                  <div className="flex justify-between items-center py-0.5 border-b border-slate-200">
                    <span className="text-slate-600">Komponen Penilaian:</span>
                    <span className="font-bold text-slate-900">100% Kedisiplinan Kerja</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-0.5 py-0.5 text-[8.5px] text-slate-800">
                  <div className="p-1 rounded bg-slate-50 border border-slate-200">
                    <span className="font-bold text-slate-950 block">{personil.hierarchy?.qualityTitle}</span>
                    <p className="text-[8px] text-slate-600 mt-0.5 leading-snug">
                      {personil.hierarchy?.level === 3 && 'Kualitas dihitung dari rata-rata mutu seluruh Operator & PO lini produksi aktif.'}
                      {personil.hierarchy?.level === 4 && 'Kualitas dihitung dari agregat mutu lini produksi dan kinerja Koordinator.'}
                      {personil.hierarchy?.level === 5 && 'Kualitas dihitung dari konsolidasi mutu lini, Koordinator, dan Supervisor.'}
                    </p>
                  </div>
                  <div className="flex justify-between items-center py-0.5 border-b border-slate-200">
                    <span className="text-slate-600">Cakupan Evaluasi:</span>
                    <span className="font-bold text-slate-900">Struktural / Manajerial Lini</span>
                  </div>
                  <div className="flex justify-between items-center py-0.5 border-b border-slate-200">
                    <span className="text-slate-600">Skor Kualitas Agregat:</span>
                    <span className="font-bold font-mono text-slate-950">{personil.skor_kualitas} pts</span>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-1 pt-0.5 border-t border-slate-400 flex justify-between items-center">
              <span className="font-extrabold text-[9px] text-slate-900">SKOR KUALITAS:</span>
              <span className="font-black text-xs font-mono text-slate-950">
                {isLevel1 ? 'N/A' : `${personil.skor_kualitas} pts`}
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* LEGENDA KETERANGAN STATUS PRESENSI */}
        {/* ========================================================================= */}
        <div className="border border-slate-300 rounded px-2 py-0.5 bg-slate-50/80 text-[8px] leading-tight text-slate-700 my-1.5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-0.5 mb-0.5">
            <span className="font-bold text-slate-900 uppercase tracking-wider text-[7.5px]">LEGENDA KODE PRESENSI &amp; MUTU</span>
            <span className="text-[7.5px] text-slate-500 font-mono font-medium">Toleransi Reject: &le; 0.5%</span>
          </div>
          <div className="grid grid-cols-5 gap-x-2 gap-y-0.5 font-mono text-[7.5px]">
            <span><b>HDOK</b>: Tepat (0)</span>
            <span><b>HDTL</b>: Telat (-10)</span>
            <span><b>JKKR</b>: Kurang (-15)</span>
            <span><b>IZSK</b>: Sakit (-10)</span>
            <span><b>IZRS</b>: Izin (-25)</span>
            <span><b>ALPA</b>: Alpa (-75)</span>
            <span><b>OFF</b>: Libur (0)</span>
            <span><b>CUTI</b>: Cuti (0)</span>
            <span><b>LMBR</b>: Lembur (0)</span>
            <span><b>TARGET</b>: &le;0.5%</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. BLOK SKOR AKHIR KPI TERPADU */}
        {/* ========================================================================= */}
        <div className="border border-slate-400 rounded p-1.5 bg-slate-50 flex items-center justify-between mb-2.5">
          <div>
            <span className="text-[8px] font-bold text-slate-700 uppercase tracking-wider block">
              FORMULA BOBOT: {isLevel1 ? '100% Skor Kedisiplinan' : '(60% Skor Kualitas) + (40% Skor Kedisiplinan)'}
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-black text-xs text-slate-900">TOTAL SKOR AKHIR KPI:</span>
              <span className="font-black text-base text-slate-950 font-mono tracking-tight">{personil.final_kpi} / 100</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[7.5px] font-bold text-slate-700 uppercase tracking-wider block">KLASIFIKASI PERFORMA</span>
            <div className="mt-0.5 inline-block px-2.5 py-0.5 bg-white text-slate-950 border border-slate-900 font-extrabold text-[10px] rounded tracking-wide font-mono shadow-sm">
              GRADE {personil.grade} &bull; {personil.gradeLabel?.toUpperCase()}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 5. KOLOM KOSONG CATATAN EVALUASI (NOTES - 7 BARIS LEGA UNTUK TULIS TANGAN) */}
        {/* ========================================================================= */}
        <div className="border border-slate-300 rounded p-2.5 mb-3 bg-white">
          <div className="flex justify-between items-center mb-1.5 text-[9.5px] font-bold text-gray-800">
            <span className="uppercase tracking-wide">CATATAN &amp; SARAN PERBAIKAN EVALUATOR</span>
            <span className="italic font-normal text-[8.5px] text-gray-600">(TULISAN TANGAN / CATATAN TERTULIS MANAJEMEN - 7 BARIS)</span>
          </div>
          <div className="flex flex-col space-y-[22px] pt-2 pb-1">
            <div className="border-b border-dashed border-gray-400 h-0"></div>
            <div className="border-b border-dashed border-gray-400 h-0"></div>
            <div className="border-b border-dashed border-gray-400 h-0"></div>
            <div className="border-b border-dashed border-gray-400 h-0"></div>
            <div className="border-b border-dashed border-gray-400 h-0"></div>
            <div className="border-b border-dashed border-gray-400 h-0"></div>
            <div className="border-b border-dashed border-gray-400 h-0"></div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. LEMBAR PENGESAHAN (MEPET MARGIN BAWAH KERTAS A4 - DINAMIS SESUAI JABATAN) */}
      {/* ========================================================================= */}
      <div className="mt-auto pt-1">
        <table className="w-full border-collapse border border-slate-400 text-center bg-white">
          <thead>
            <tr className="bg-slate-100 text-slate-950 font-extrabold text-[8.5px] uppercase tracking-wider border-b border-slate-400">
              <th colSpan={5} className="py-0.5 border border-slate-400">
                LEMBAR PENGESAHAN &amp; PERSETUJUAN
              </th>
            </tr>
          </thead>
          <tbody>
            {renderSignatures(personil)}
          </tbody>
        </table>

        {/* Footer Dokumen */}
        <div className="text-[7px] text-slate-500 flex justify-between items-center border-t border-slate-200 pt-0.5 mt-0.5">
          <span>Dokumen Resmi PRISM V2.5 - PT Solo Murni (Prepress Department)</span>
          <span>Dicetak secara otomatis pada: {new Date().toLocaleString('id-ID')}</span>
        </div>
      </div>
    </div>
  );
}
