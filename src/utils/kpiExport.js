import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { fmtPeriodRange, formatYMD } from './formatters.js';

/**
 * Helper untuk menyusun slug / bagian nama file periode yang bersih & aman
 * Contoh: 2026-08 atau 2026-08-01_sd_2026-08-31
 */
export function getKpiPeriodSlug(period) {
  let periodPart = 'All_Period';
  if (period?.from && period?.to) {
    const fromStr = formatYMD(period.from);
    const toStr = formatYMD(period.to);
    if (fromStr === toStr) {
      periodPart = fromStr;
    } else if (fromStr.substring(0, 7) === toStr.substring(0, 7)) {
      periodPart = fromStr.substring(0, 7);
    } else {
      periodPart = `${fromStr}_sd_${toStr}`;
    }
  }
  return periodPart;
}

/**
 * Helper untuk menyusun nama file otomatis yang informatif
 * Format: [Prefix]_[Periode].[ext]
 */
export function getKpiExportFilename(period, ext = 'xlsx', prefix = 'Rekap_KPI_Active_PRISM') {
  const periodPart = getKpiPeriodSlug(period);
  return `${prefix}_${periodPart}.${ext}`;
}

/**
 * Filter ketat hanya personil berstatus "ACTIVE"
 */
function getActivePersonnelOnly(personnelList) {
  if (!personnelList || !Array.isArray(personnelList)) return [];
  return personnelList.filter((p) => {
    const s = String(p.status_nik || p.status || 'ACTIVE').trim().toUpperCase();
    return s === 'ACTIVE' || s === '-' || s === '';
  });
}

/**
 * ============================================================================
 * HELPER DYNAMIC RESOLVER PEJABAT STRUKTURAL (TANPA HARDCODE MANUAL)
 * ============================================================================
 */

/**
 * Mencari personil aktif dengan jabatan/role Manager Prepress
 * @param {Array} allPersonnel - List seluruh personil aktif
 * @returns {Object|null} Personil Manager Prepress
 */
export function resolveManagerPersonil(allPersonnel = []) {
  if (!allPersonnel || !Array.isArray(allPersonnel)) return null;

  return allPersonnel.find((p) => {
    const status = String(p.status_nik || p.status || 'ACTIVE').trim().toUpperCase();
    if (status !== 'ACTIVE' && status !== '-' && status !== '') return false;

    const jabatan = String(p.jabatan || '').trim().toUpperCase();
    const role = String(p.role_type || p.role || '').trim().toUpperCase();
    const nick = String(p.nick_name || p.nama || '').trim().toUpperCase();
    const level = p.hierarchy?.level;

    return (
      level === 5 ||
      jabatan.includes('MANAGER') ||
      jabatan.includes('KABAG') ||
      jabatan.includes('HEAD OF') ||
      jabatan === 'HEAD' ||
      role.includes('MANAGER') ||
      nick === 'AGUNG' ||
      nick.includes('YOHANES AGUNG')
    );
  }) || null;
}

/**
 * Mencari personil aktif dengan jabatan/role Supervisor atau Koordinator
 * yang membawahi lini / divisi karyawan yang bersangkutan
 * @param {Object} personil - Personil karyawan yang sedang dievaluasi
 * @param {Array} allPersonnel - List seluruh personil aktif
 * @returns {Object|null} Personil Supervisor atau Koordinator terkait
 */
export function resolveSupervisorKoordinator(personil, allPersonnel = []) {
  if (!allPersonnel || !Array.isArray(allPersonnel)) return null;

  const targetId = String(personil?.id || '');
  const targetLini = String(personil?.lini_mesin || '').trim().toUpperCase();

  const activePersons = allPersonnel.filter((p) => {
    const s = String(p.status_nik || p.status || 'ACTIVE').trim().toUpperCase();
    return s === 'ACTIVE' || s === '-' || s === '';
  });

  // 1. Cek apakah ada Koordinator lini spesifik yang membawahi lini mesin karyawan
  if (targetLini && targetLini !== '-') {
    const lineKoor = activePersons.find((p) => {
      if (String(p.id) === targetId) return false;
      const j = String(p.jabatan || '').toUpperCase();
      const l = String(p.lini_mesin || '').toUpperCase();
      const level = p.hierarchy?.level;
      const isKoor = level === 3 || j.includes('KOORDINATOR') || j.includes('KOOR') || j.includes('LEADER');
      return isKoor && (l.includes(targetLini) || targetLini.includes(l));
    });
    if (lineKoor) return lineKoor;
  }

  // 2. Jika tidak ada koordinator lini spesifik, cari Supervisor Prepress langsung
  const spv = activePersons.find((p) => {
    if (String(p.id) === targetId) return false;
    const j = String(p.jabatan || '').toUpperCase();
    const n = String(p.nick_name || p.nama || '').toUpperCase();
    const level = p.hierarchy?.level;
    return (
      level === 4 ||
      j.includes('SUPERVISOR') ||
      j.includes('SPV') ||
      j.includes('KASIE') ||
      n === 'DWI' ||
      n.includes('ISWAHYUDI')
    );
  });
  if (spv) return spv;

  // 3. Fallback: Koordinator umum aktif manapun
  const generalKoor = activePersons.find((p) => {
    if (String(p.id) === targetId) return false;
    const j = String(p.jabatan || '').toUpperCase();
    const n = String(p.nick_name || p.nama || '').toUpperCase();
    const level = p.hierarchy?.level;
    return level === 3 || j.includes('KOORDINATOR') || j.includes('KOOR') || j.includes('LEADER') || n === 'BOWO';
  });

  return generalKoor || null;
}

/**
 * Helper pemuat aset gambar asynchronous untuk jsPDF (dengan fallback aman)
 */
function loadPdfImage(url, timeoutMs = 1500) {
  if (typeof window === 'undefined' || typeof Image === 'undefined') {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    let timer = null;
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      if (timer) clearTimeout(timer);
      resolve(img);
    };
    img.onerror = () => {
      if (timer) clearTimeout(timer);
      resolve(null);
    };
    timer = setTimeout(() => {
      resolve(null);
    }, timeoutMs);
    img.src = url;
  });
}

/**
 * ============================================================================
 * FORMAT 1: NATIVE EXCEL WORKBOOK (.xlsx) — Menggunakan SheetJS (xlsx)
 * ============================================================================
 * Menghasilkan file Excel asli berekstensi .xlsx dengan:
 * - Baris judul kop laporan resmi
 * - Keterangan periode evaluasi & tanggal cetak
 * - Kolom KPI terstruktur lengkap
 * - Penyesuaian lebar kolom otomatis (!cols) agar tidak ada teks/angka terpotong (###)
 */
export function exportActivePersonnelKpiToExcel(personnelList, period, options = {}) {
  const activeList = getActivePersonnelOnly(personnelList);

  if (!activeList.length) {
    throw new Error('Tidak ada data personil aktif yang dapat diekspor.');
  }

  const periodSlug = getKpiPeriodSlug(period);
  const periodLabel = fmtPeriodRange(period?.from, period?.to) || 'Semua Periode';
  const now = new Date();
  const printDateStr = now.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }) + ' ' + now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';

  const filterLabel = options.filterLabel || 'Semua Divisi & Lini';

  // Susunan Header & Konten Worksheet
  const sheetData = [
    // Baris 1: Judul Laporan Utama
    ['LAPORAN REKAPITULASI KINERJA & KPI TIM PREPRESS - PT SOLO MURNI'],
    // Baris 2: Sub-info Periode & Tanggal Unduh
    ['Periode Penilaian:', periodLabel, '', 'Tanggal Cetak / Ekspor:', printDateStr],
    // Baris 3: Filter & Total Data
    ['Filter Divisi / Lini:', filterLabel, '', 'Total Personil Aktif:', `${activeList.length} Orang`],
    // Baris 4: Baris kosong pemisah
    [],
    // Baris 5: Header Kolom Tabel Terstruktur
    [
      'No',
      'NIK',
      'Nama Karyawan',
      'Nama Panggilan',
      'Divisi / Bagian',
      'Lini Mesin',
      'Jabatan / Role',
      'Level Hierarki',
      'Periode Evaluasi',
      'Total Hari Kerja',
      'Kehadiran / Disiplin (40%)',
      'Poin Penalti Absensi',
      'Output Plate Baik (Pcs)',
      'Output Plate Rusak / Defect (Pcs)',
      'Plate Ganti / Reprint (Pcs)',
      'Total Output Fisik (Pcs)',
      'Defect Rate (%)',
      'Status Toleransi Reject',
      'Poin Penalti Defect',
      'Kualitas / Zero Defect (60%)',
      'Total Skor KPI',
      'Predikat / Grade',
      'Status Karyawan'
    ]
  ];

  // Baris Data Personil Aktif
  activeList.forEach((p, idx) => {
    const nik = p.nik_baru && p.nik_baru !== '-' ? String(p.nik_baru).trim() : String(p.nik_lama || '-').trim();
    const goodOutput = p.good ?? 0;
    const defectOutput = p.defect ?? 0;
    const replaceOutput = p.replace ?? 0;
    const totalOutput = p.totalOutput ?? (goodOutput + defectOutput);
    const rejectRate = p.rejectRate !== undefined ? Number(p.rejectRate.toFixed(2)) : 0;
    const isRejectAman = p.isRejectAman ?? (rejectRate <= 0.5);

    sheetData.push([
      idx + 1,
      nik,
      p.nama_lengkap || p.nick_name || '-',
      p.nick_name || '-',
      p.divisi || 'PREPRESS',
      p.lini_mesin || '-',
      p.jabatan || 'Operator Prepress',
      p.hierarchy?.label || p.jabatan || '-',
      periodLabel,
      p.totalHariKerja ?? 0,
      p.skor_absensi ?? 0,
      p.attendancePenalties ?? 0,
      goodOutput,
      defectOutput,
      replaceOutput,
      totalOutput,
      rejectRate,
      isRejectAman ? 'Lolos (<=0.5%)' : 'Alert (>0.5%)',
      p.defectPenalty ?? 0,
      p.skor_kualitas ?? 0,
      p.final_kpi ?? 0,
      `Grade ${p.grade} (${p.gradeLabel || '-'})`,
      'ACTIVE'
    ]);
  });

  // Buat Workbook & Worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Atur lebar kolom otomatis (!cols) agar tidak terpotong (###) di Microsoft Excel
  const headerRowIdx = 4;
  const colWidths = sheetData[headerRowIdx].map((h, colIdx) => {
    let maxLen = String(h).length;
    for (let r = headerRowIdx + 1; r < sheetData.length; r++) {
      const val = sheetData[r][colIdx];
      const len = val !== null && val !== undefined ? String(val).length : 0;
      if (len > maxLen) maxLen = len;
    }
    return { wch: Math.max(maxLen + 4, 11) };
  });
  ws['!cols'] = colWidths;

  // Merge judul laporan pada baris pertama (Kolom A s/d I)
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Rekap KPI Aktif');

  // Nama file otomatis: Rekap_KPI_Active_PRISM_[Periode].xlsx
  const filename = `Rekap_KPI_Active_PRISM_${periodSlug}.xlsx`;
  XLSX.writeFile(wb, filename);

  return { filename, count: activeList.length };
}

/**
 * ============================================================================
 * FORMAT 2: LAPORAN RESMI PDF (.pdf) — Menggunakan jsPDF + jspdf-autotable
 * ============================================================================
 * Menghasilkan dokumen PDF vektor beresolusi tajam:
 * - Orientasi Landscape A4
 * - Kop resmi dengan Logo Prepress (kiri) dan Logo KIKY (kanan)
 * - Sub-judul divisi resmi: Divisi Prepress (CTCP, CTP, Flexo, Etching, Screen)
 * - Distribusi tabel proporsional 2 halaman (sekitar 14-16 baris Hal 1 & 8-10 baris Hal 2)
 * - Blok Pengesahan 3 Kolom Sejajar: Dibuat Oleh (Manager Prepress otomatis dinamis),
 *   Disetujui Oleh (1) (Plant Manager: YOH. SRIYANA), Disetujui Oleh (2) (HRBP: SUGENG KURNIAWAN DJATI)
 */
export async function exportActivePersonnelKpiToPdf(personnelList, period, options = {}) {
  const activeList = getActivePersonnelOnly(personnelList);

  if (!activeList.length) {
    throw new Error('Tidak ada data personil aktif yang dapat diekspor.');
  }

  const periodSlug = getKpiPeriodSlug(period);
  const periodLabel = fmtPeriodRange(period?.from, period?.to) || 'Semua Periode';
  const filterLabel = options.filterLabel || 'Semua Divisi & Lini';

  const now = new Date();
  const printDateIndo = now.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const printDateTimeStr = now.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }) + ', ' + now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';

  // Ringkasan metrik tim
  const teamMetrics = options.teamMetrics || {
    avgKpi: (activeList.reduce((acc, p) => acc + (p.final_kpi || 0), 0) / activeList.length).toFixed(1),
    avgQuality: (activeList.reduce((acc, p) => acc + (p.skor_kualitas || 0), 0) / activeList.length).toFixed(1),
    avgAttendance: (activeList.reduce((acc, p) => acc + (p.skor_absensi || 0), 0) / activeList.length).toFixed(1)
  };

  // Muat aset logo secara asinkron
  const [prepressLogo, kikyLogo] = await Promise.all([
    loadPdfImage('/prepress-Logo.png'),
    loadPdfImage('/logo-kiky.png')
  ]);

  // Resolusi nama dinamis Manager Prepress dari list personil aktif
  const managerPersonil = resolveManagerPersonil(options.allPersonnel || personnelList);
  const managerName = managerPersonil
    ? (managerPersonil.nama_lengkap || managerPersonil.nick_name || '').toUpperCase().trim()
    : '( .................................................. )';

  // Inisialisasi dokumen jsPDF (Landscape A4: 297mm x 210mm)
  const doc = new jsPDF({
    orientation: 'landscape',
    format: 'a4',
    unit: 'mm'
  });

  // =========================================================================
  // 1. KOP / HEADER LAPORAN RESMI (LOGO PREPRESS KIRI, LOGO KIKY KANAN)
  // =========================================================================
  // Header Kiri: Logo Prepress
  if (prepressLogo) {
    try {
      doc.addImage(prepressLogo, 'PNG', 10, 7, 36, 8.8);
    } catch (err) {
      console.warn('Gagal render prepress logo pada PDF:', err);
    }
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('PREPRESS DEPARTMENT', 10, 19.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('PT SOLO MURNI', 10, 23.5);

  // Header Tengah: Judul & Sub-judul Divisi Resmi
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(2, 132, 199);
  doc.text('LAPORAN KINERJA TIM & KPI DIVISI PREPRESS', 148.5, 12, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Divisi Prepress (CTCP, CTP, Flexo, Etching, Screen)', 148.5, 17, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Periode: ${periodLabel}    |    Filter: ${filterLabel}`, 148.5, 22, { align: 'center' });

  // Header Kanan: Kotak Ringkasan Statistik Tim & Logo KIKY
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(194, 6.5, 70, 18, 1.5, 1.5, 'FD');

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('RINGKASAN TIM AKTIF', 197, 10.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`Personil: ${activeList.length} Org   |   Skor: ${teamMetrics.avgKpi} / 100`, 197, 15);
  doc.text(`Mutu: ${teamMetrics.avgQuality}%   •   Disiplin: ${teamMetrics.avgAttendance} pts`, 197, 19.5);
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text(`Cetak: ${printDateTimeStr}`, 197, 23);

  if (kikyLogo) {
    try {
      doc.addImage(kikyLogo, 'PNG', 267, 6.5, 19, 15.8);
    } catch (err) {
      console.warn('Gagal render kiky logo pada PDF:', err);
    }
  }

  // Garis Pembatas Kop
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.4);
  doc.line(10, 27, 287, 27);

  // =========================================================================
  // 2. TABEL UTAMA LAPORAN KPI (PROPORSI SEIMBANG 2 HALAMAN)
  // =========================================================================
  const tableHead = [[
    'No',
    'NIK',
    'Nama Karyawan',
    'Divisi & Lini',
    'Jabatan / Role',
    'Hari',
    'Disiplin (40%)',
    'Output (Pcs)',
    'Kualitas (60%)',
    'Penalti',
    'Total KPI',
    'Predikat / Grade'
  ]];

  const tableBody = activeList.map((p, idx) => {
    const nik = p.nik_baru && p.nik_baru !== '-' ? String(p.nik_baru).trim() : String(p.nik_lama || '-').trim();
    const goodStr = p.hierarchy?.isDirectProduction ? (p.good || 0).toLocaleString('id-ID') : '-';
    const penaltiTotal = (p.attendancePenalties || 0) + (p.defectPenalty || 0);
    const penaltiStr = penaltiTotal > 0 ? `-${penaltiTotal}` : '0';

    return [
      idx + 1,
      nik,
      p.nama_lengkap || p.nick_name || '-',
      `${p.divisi || 'PREPRESS'}${p.lini_mesin && p.lini_mesin !== '-' ? ` (${p.lini_mesin})` : ''}`,
      p.jabatan || p.hierarchy?.label || 'Operator',
      `${p.totalHariKerja ?? 0}`,
      `${p.skor_absensi ?? 0}`,
      goodStr,
      `${p.skor_kualitas ?? 0}`,
      penaltiStr,
      `${p.final_kpi ?? 0}`,
      `Grade ${p.grade} (${p.gradeLabel || '-'})`
    ];
  });

  autoTable(doc, {
    startY: 30,
    margin: { top: 12, bottom: 12, left: 10, right: 10 },
    rowPageBreak: 'avoid',
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: { top: 2.5, bottom: 2.5, left: 1.5, right: 1.5 },
      valign: 'middle',
      lineColor: [226, 232, 240],
      lineWidth: 0.1
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: { top: 2.8, bottom: 2.8, left: 1.5, right: 1.5 },
      halign: 'center'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'center', cellWidth: 18 },
      2: { halign: 'left', cellWidth: 42, fontStyle: 'bold' },
      3: { halign: 'left', cellWidth: 47 },
      4: { halign: 'left', cellWidth: 28 },
      5: { halign: 'center', cellWidth: 11 },
      6: { halign: 'right', cellWidth: 18 },
      7: { halign: 'right', cellWidth: 17 },
      8: { halign: 'right', cellWidth: 18 },
      9: { halign: 'right', cellWidth: 13 },
      10: { halign: 'right', cellWidth: 16, fontStyle: 'bold', textColor: [2, 132, 199] },
      11: { halign: 'center', cellWidth: 41, fontStyle: 'bold' }
    },
    didDrawPage: (data) => {
      // Header halaman lanjutan (halaman 2 ke atas)
      if (data.pageNumber > 1) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text(`LAPORAN KINERJA TIM & KPI DIVISI PREPRESS - PT SOLO MURNI (Lanjutan) • Periode: ${periodLabel}`, 10, 8);
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.2);
        doc.line(10, 9.5, 287, 9.5);
      }
    }
  });

  // =========================================================================
  // 3. BLOK PENGESAHAN (FOOTER TANDA TANGAN 3 KOLOM SEJAJAR) DI HALAMAN TERAKHIR
  // =========================================================================
  const finalY = doc.lastAutoTable.finalY;
  // Jarak vertikal rapat & proporsional (8-12 mm) dari tabel, disesuaikan agar pas di halaman 2 tanpa memicu halaman 3
  let signY = Math.max(finalY + 8, 122);
  if (signY + 28 > 196) {
    signY = Math.max(finalY + 6, 196 - 28);
  }

  // Titik tengah 3 kolom tanda tangan sejajar (Landscape A4: 297mm)
  const colCenters = [55, 148.5, 242];

  // Tanggal Pengesahan di atas kolom kanan
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  doc.text(`Surakarta, ${printDateIndo}`, colCenters[2], signY, { align: 'center' });

  // Baris Header Pengesahan
  const headerSignY = signY + 4.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('DIBUAT OLEH:', colCenters[0], headerSignY, { align: 'center' });
  doc.text('DISETUJUI OLEH (1):', colCenters[1], headerSignY, { align: 'center' });
  doc.text('DISETUJUI OLEH (2):', colCenters[2], headerSignY, { align: 'center' });

  // Baris Jabatan Pengesahan
  const roleSignY = headerSignY + 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Manager Prepress', colCenters[0], roleSignY, { align: 'center' });
  doc.text('Plant Manager', colCenters[1], roleSignY, { align: 'center' });
  doc.text('HRBP Production & Warehouse', colCenters[2], roleSignY, { align: 'center' });

  // Baris Nama Pejabat (ruang tanda tangan fisik 16-17 mm)
  const nameSignY = roleSignY + 16.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(managerName, colCenters[0], nameSignY, { align: 'center' });
  doc.text('YOH. SRIYANA', colCenters[1], nameSignY, { align: 'center' });
  doc.text('SUGENG KURNIAWAN DJATI', colCenters[2], nameSignY, { align: 'center' });

  // Garis bawah tanda tangan untuk nama yang terisi
  [
    { name: managerName, x: colCenters[0] },
    { name: 'YOH. SRIYANA', x: colCenters[1] },
    { name: 'SUGENG KURNIAWAN DJATI', x: colCenters[2] }
  ].forEach((item) => {
    if (item.name && !item.name.includes('......')) {
      const w = doc.getTextWidth(item.name);
      doc.setDrawColor(30, 41, 59);
      doc.setLineWidth(0.2);
      doc.line(item.x - w / 2, nameSignY + 1, item.x + w / 2, nameSignY + 1);
    }
  });

  // Baris Catatan Tanggal
  const dateSignY = nameSignY + 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Tgl: .......................................', colCenters[0], dateSignY, { align: 'center' });
  doc.text('Tgl: .......................................', colCenters[1], dateSignY, { align: 'center' });
  doc.text('Tgl: .......................................', colCenters[2], dateSignY, { align: 'center' });
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Tgl: .......................................', colCenters[0], dateSignY, { align: 'center' });
  doc.text('Tgl: .......................................', colCenters[1], dateSignY, { align: 'center' });
  doc.text('Tgl: .......................................', colCenters[2], dateSignY, { align: 'center' });

  // =========================================================================
  // 4. PENOMORAN HALAMAN RESMI DI FOOTER SETIAP LEMBAR
  // =========================================================================
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(`Dokumen Resmi PRISM Prepress • PT Solo Murni • Dicetak: ${printDateTimeStr}`, 10, 203);
    doc.text(`Halaman ${p} dari ${totalPages}`, 287, 203, { align: 'right' });
  }

  // Nama file otomatis: Laporan_KPI_Active_PRISM_[Periode].pdf
  const filename = `Laporan_KPI_Active_PRISM_${periodSlug}.pdf`;
  doc.save(filename);

  return { filename, count: activeList.length };
}

/**
 * ============================================================================
 * LEGACY / BACKWARD-COMPATIBLE EXPORT FUNCTIONS
 * ============================================================================
 */
export function exportActivePersonnelKpiToCsv(personnelList, period) {
  return exportActivePersonnelKpiToExcel(personnelList, period);
}

export function exportActivePersonnelKpiToExcelXml(personnelList, period) {
  return exportActivePersonnelKpiToExcel(personnelList, period);
}
