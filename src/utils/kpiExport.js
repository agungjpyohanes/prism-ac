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
 * - Orientasi A4 Portrait (210mm x 297mm)
 * - Margin Halaman: 10mm 10mm 12mm 10mm (atas, kanan, bawah, kiri)
 * - Kop resmi dengan Logo Prepress (kiri) dan Logo KIKY (kanan)
 * - Sub-judul divisi resmi: Divisi Prepress (CTCP, CTP, Flexo, Etching, Screen)
 * - Distribusi tabel presisi tepat 2 halaman (18 baris pertama Hal 1 & sisa baris + pengesahan Hal 2)
 * - 12 Kolom proporsional dengan font 7.5pt, compact vertical padding (3.5px 4px)
 * - Blok Pengesahan 3 Kolom Sejajar di Halaman 2: Dibuat Oleh (Manager Prepress otomatis dinamis),
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

  // Inisialisasi dokumen jsPDF (Portrait A4: 210mm x 297mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    format: 'a4',
    unit: 'mm'
  });

  // =========================================================================
  // 1. KOP / HEADER LAPORAN RESMI (LOGO PREPRESS KIRI, LOGO KIKY KANAN)
  // =========================================================================
  // Header Kiri: Logo Prepress
  if (prepressLogo) {
    try {
      doc.addImage(prepressLogo, 'PNG', 9, 7.5, 30, 7.3);
    } catch (err) {
      console.warn('Gagal render prepress logo pada PDF:', err);
    }
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('PREPRESS DEPARTMENT', 9, 18.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text('PT SOLO MURNI', 9, 22);

  // Header Tengah: Judul & Sub-judul Divisi Resmi (Center: 105mm)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(2, 132, 199);
  doc.text('LAPORAN KINERJA TIM & KPI DIVISI PREPRESS', 105, 12, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Divisi Prepress (CTCP, CTP, Flexo, Etching, Screen)', 105, 16.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(`Periode: ${periodLabel}    |    Filter: ${filterLabel}`, 105, 21, { align: 'center' });

  // Header Kanan: Logo KIKY
  if (kikyLogo) {
    try {
      doc.addImage(kikyLogo, 'PNG', 183, 7.5, 18, 14.5);
    } catch (err) {
      console.warn('Gagal render kiky logo pada PDF:', err);
    }
  }

  // Garis Pembatas Kop (Lebar 192mm dari X:9 s/d X:201)
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.35);
  doc.line(9, 24, 201, 24);

  // Kotak Ringkasan Statistik Tim (Lebar 192mm sejajar tabel)
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(9, 25.5, 192, 9, 1.2, 1.2, 'FD');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('RINGKASAN TIM AKTIF', 12, 29);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(51, 65, 85);
  doc.text(`Personil: ${activeList.length} Orang   •   Rata-rata Skor KPI: ${teamMetrics.avgKpi} / 100`, 52, 29);

  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Dicetak: ${printDateTimeStr}`, 198, 29, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(`Standar Mutu (60%): ${teamMetrics.avgQuality}%   •   Disiplin & Presensi (40%): ${teamMetrics.avgAttendance} pts   •   Target Toleransi Defect: ≤ 0.5%`, 12, 32.8);

  // =========================================================================
  // 2. TABEL UTAMA LAPORAN KPI (ALIRAN ALAMI & PROPORSI TEPAT 2 HALAMAN)
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

  // Kalibrasi ulang lebar 12 kolom proporsional A4 Portrait (Lebar Total: 192mm)
  // No: 3.5% (6.72mm), NIK: 8.5% (16.32mm, nowrap), Nama: 17.5% (33.60mm),
  // Divisi & Lini: 13.5% (25.92mm), Jabatan / Role: 11.5% (22.08mm, nowrap agar kata KOORDINATOR tidak terbelah),
  // Hari: 4.5% (8.64mm), Disiplin: 6.5% (12.48mm), Output: 7% (13.44mm),
  // Kualitas: 6.5% (12.48mm), Penalti: 6% (11.52mm), Total KPI: 6.5% (12.48mm), Predikat/Grade: 8.5% (16.32mm)
  const columnStyles = {
    0: { halign: 'center', cellWidth: 6.72 },
    1: { halign: 'center', cellWidth: 16.32, overflow: 'visible' },
    2: { halign: 'left', cellWidth: 33.6, fontStyle: 'bold' },
    3: { halign: 'left', cellWidth: 25.92 },
    4: { halign: 'left', cellWidth: 22.08, overflow: 'visible' },
    5: { halign: 'center', cellWidth: 8.64 },
    6: { halign: 'right', cellWidth: 12.48 },
    7: { halign: 'right', cellWidth: 13.44 },
    8: { halign: 'right', cellWidth: 12.48 },
    9: { halign: 'right', cellWidth: 11.52 },
    10: { halign: 'right', cellWidth: 12.48, fontStyle: 'bold', textColor: [2, 132, 199] },
    11: { halign: 'center', cellWidth: 16.32, fontStyle: 'bold' }
  };

  // Kalibrasi padding sel dan tinggi baris minimal agar Halaman 1 terisi penuh (sekitar baris 1-20),
  // dan Halaman 2 memuat sisa baris + blok tanda tangan pengesahan
  const tableStyles = {
    fontSize: 7.5,
    cellPadding: { top: 2.2, bottom: 2.2, left: 0.8, right: 0.8 },
    minCellHeight: 11.5,
    valign: 'middle',
    overflow: 'linebreak',
    lineColor: [226, 232, 240],
    lineWidth: 0.1
  };

  const headStyles = {
    fillColor: [15, 23, 42],
    textColor: [255, 255, 255],
    fontStyle: 'bold',
    fontSize: 7.5,
    cellPadding: { top: 1.8, bottom: 1.8, left: 0.8, right: 0.8 },
    halign: 'center',
    valign: 'middle',
    overflow: 'linebreak'
  };

  // Mengalirkan satu tabel secara alami (tanpa pemotongan statis/hardcoded .slice(0, 18))
  autoTable(doc, {
    startY: 36,
    margin: { top: 8, bottom: 10, left: 9, right: 9 },
    rowPageBreak: 'avoid',
    showHead: 'everyPage',
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    styles: tableStyles,
    headStyles: headStyles,
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: columnStyles,
    didDrawPage: (data) => {
      // Header halaman lanjutan (halaman 2 ke atas)
      if (data.pageNumber > 1) {
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text(`LAPORAN KINERJA TIM & KPI DIVISI PREPRESS - PT SOLO MURNI (Lanjutan) • Periode: ${periodLabel}`, 9, 6.5);
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.2);
        doc.line(9, 7.5, 201, 7.5);
      }
    }
  });

  // =========================================================================
  // 3. BLOK PENGESAHAN (FOOTER TANDA TANGAN 3 KOLOM SEJAJAR) DI HALAMAN 2
  // =========================================================================
  const finalY = doc.lastAutoTable.finalY;
  // Menempel rapi tepat di bawah baris tabel terakhir di Halaman 2 (margin-top: 16px / ~5.5mm, tanpa page-break-before)
  const signY = finalY + 5.5;

  // Titik tengah 3 kolom tanda tangan sejajar (A4 Portrait 210mm, margin kiri/kanan 9mm -> lebar 192mm)
  // Lebar per kolom: 64mm. Kolom 1: 41mm | Kolom 2: 105mm | Kolom 3: 169mm
  const colCenters = [41, 105, 169];

  // Tanggal Pengesahan di atas kolom kanan
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  doc.text(`Surakarta, ${printDateIndo}`, colCenters[2], signY, { align: 'center' });

  // Baris Header Pengesahan
  const headerSignY = signY + 4.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('DIBUAT OLEH:', colCenters[0], headerSignY, { align: 'center' });
  doc.text('DISETUJUI OLEH (1):', colCenters[1], headerSignY, { align: 'center' });
  doc.text('DISETUJUI OLEH (2):', colCenters[2], headerSignY, { align: 'center' });

  // Baris Jabatan Pengesahan
  const roleSignY = headerSignY + 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Manager Prepress', colCenters[0], roleSignY, { align: 'center' });
  doc.text('Plant Manager', colCenters[1], roleSignY, { align: 'center' });
  doc.text('HRBP Production & Warehouse', colCenters[2], roleSignY, { align: 'center' });

  // Baris Nama Pejabat (ruang tanda tangan fisik 15.5 mm)
  const nameSignY = roleSignY + 15.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
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
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Tgl: .......................................', colCenters[0], dateSignY, { align: 'center' });
  doc.text('Tgl: .......................................', colCenters[1], dateSignY, { align: 'center' });
  doc.text('Tgl: .......................................', colCenters[2], dateSignY, { align: 'center' });

  // =========================================================================
  // 4. PENOMORAN HALAMAN RESMI DI FOOTER SETIAP LEMBAR (A4 PORTRAIT)
  // =========================================================================
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(`Dokumen Resmi PRISM Prepress • PT Solo Murni • Dicetak: ${printDateTimeStr}`, 9, 290);
    doc.text(`Halaman ${p} dari ${totalPages}`, 201, 290, { align: 'right' });
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
