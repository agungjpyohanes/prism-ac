import React, { useState, useMemo, useCallback } from 'react';
import {
  Gauge,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Search,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Download,
  Filter,
  X,
  Layers,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Cpu,
  Printer,
  Sparkles,
  Info,
  Calendar,
  User,
  SlidersHorizontal,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { SHEETS, PROD_KEYS } from '../../constants/schema';
import {
  cell,
  num,
  parseDateVal,
  fmtDate,
  formatYMD,
  fmtPeriodRange,
  getRowQtyGood,
  getRowQtyDefect,
  getRowQtyReplace
} from '../../utils/formatters';
import {
  addProductionJob,
  updateProductionJob,
  deleteProductionJob,
  DIVISION_TO_TABLE,
  TABLE_TO_DIVISION
} from '../../services/productionService';

// Konfigurasi 5 Divisi Utama
const DIVISIONS = [
  {
    key: 'rec_ctp',
    code: 'CTP',
    name: 'CTP Line',
    badge: 'CTP Thermal',
    color: '#10b981', // emerald
    bgLight: 'bg-emerald-50 dark:bg-emerald-500/10',
    border: 'border-emerald-200 dark:border-emerald-500/30',
    text: 'text-emerald-700 dark:text-emerald-400',
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
    defaultMach: 'CTP Thermal Machine'
  },
  {
    key: 'rec_ctcp',
    code: 'CTCP',
    name: 'CTCP Line',
    badge: 'CTCP Offset',
    color: '#8b5cf6', // violet
    bgLight: 'bg-violet-50 dark:bg-violet-500/10',
    border: 'border-violet-200 dark:border-violet-500/30',
    text: 'text-violet-700 dark:text-violet-400',
    badgeClass: 'bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-300 border-violet-300 dark:border-violet-800',
    defaultMach: 'UV-CTCP Offset'
  },
  {
    key: 'rec_flexo',
    code: 'FLEXO',
    name: 'Flexo Line',
    badge: 'Flexography',
    color: '#6366f1', // indigo
    bgLight: 'bg-indigo-50 dark:bg-indigo-500/10',
    border: 'border-indigo-200 dark:border-indigo-500/30',
    text: 'text-indigo-700 dark:text-indigo-400',
    badgeClass: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800',
    defaultMach: 'Flexo Line'
  },
  {
    key: 'rec_etching',
    code: 'ETCHING',
    name: 'Etching Line',
    badge: 'Etching Plate',
    color: '#f59e0b', // amber
    bgLight: 'bg-amber-50 dark:bg-amber-500/10',
    border: 'border-amber-200 dark:border-amber-500/30',
    text: 'text-amber-700 dark:text-amber-400',
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800',
    defaultMach: 'Etching Machine'
  },
  {
    key: 'rec_screen',
    code: 'SCREEN',
    name: 'Screen Line',
    badge: 'Screen Printing',
    color: '#06b6d4', // cyan
    bgLight: 'bg-cyan-50 dark:bg-cyan-500/10',
    border: 'border-cyan-200 dark:border-cyan-400/30',
    text: 'text-cyan-700 dark:text-cyan-400',
    badgeClass: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800',
    defaultMach: 'Screen Printing'
  }
];

// Target Kapasitas Standar Output per Shift per Lini Prepress (Unit / Plate per Shift)
// Dapat disesuaikan sesuai target operasional pabrik / divisi prepress
export const DEFAULT_SHIFT_CAPACITY_TARGETS = {
  CTP: 80,      // CTP Thermal (~80 plate/shift)
  CTCP: 100,    // CTCP Offset UV (~100 plate/shift)
  FLEXO: 15,    // Flexography (~15 plate/shift)
  ETCHING: 20,  // Etching Plate (~20 plate/shift)
  SCREEN: 25    // Screen Printing (~25 screen/shift)
};

// Helper status absensi PRISM (rec_absensi)
export const checkAbsensiStatus = (rawCode, jamMasuk) => {
  const code = String(rawCode || '').trim().toUpperCase();
  const masuk = String(jamMasuk || '').trim();

  // OFF / Libur / Hari Libur Nasional (bukan hari kerja terjadwal)
  const isOff = code === 'OFF' || code.includes('LIBUR') || code.includes('MERAH');

  // Hadir (HDOK = Hadir Tepat Waktu, HDTL = Hadir Terlambat, JKKR = Jam Kurang, LMBR = Lembur)
  const isHadir = !isOff && (
    ['HDOK', 'HDTL', 'JKKR', 'LMBR'].includes(code) ||
    code.includes('HADIR') ||
    code.includes('MASUK') ||
    code === 'H' ||
    code === 'OT' ||
    (masuk && masuk !== '-' && !['ALPA', 'IZSK', 'IZRS', 'CUTI'].includes(code))
  );

  // Terjadwal (Hari kerja terjadwal: Hadir, Sakit, Izin, Cuti, Alpa)
  const isScheduled = !isOff && (
    isHadir ||
    ['ALPA', 'IZSK', 'IZRS', 'CUTI'].includes(code) ||
    code.includes('ALPA') ||
    code.includes('MANGKIR') ||
    code.includes('SAKIT') ||
    code.includes('IZIN') ||
    code.includes('CUTI') ||
    (masuk && masuk !== '-')
  );

  return { isHadir, isScheduled, isOff };
};

export default function ExecutiveOeeDashboard({
  data = {},
  period,
  reload,
  user,
  onSelectRow,
  onToast
}) {
  // ==========================================
  // STATE FILTER MULTI-DIMENSI
  // ==========================================
  const [selectedDivision, setSelectedDivision] = useState('ALL'); // ALL | CTP | CTCP | FLEXO | ETCHING | SCREEN
  const [selectedShift, setSelectedShift] = useState('ALL');       // ALL | SHIFT A | SHIFT B | SHIFT C
  
  // Single Source of Truth: Rentang tanggal global langsung dari Header PRISM (tanpa filter tanggal lokal)
  const fromStr = useMemo(() => (period?.from ? formatYMD(period.from) : ''), [period?.from]);
  const toStr = useMemo(() => (period?.to ? formatYMD(period.to) : ''), [period?.to]);

  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [sortField, setSortField] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modal State Form CRUD
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Detail Drawer / Quick View State
  const [detailItem, setDetailItem] = useState(null);

  // Local optimistic data records untuk UI yang instan saat CRUD
  const [localOverrides, setLocalOverrides] = useState({
    added: [],
    updated: {}, // id -> record
    deleted: new Set()
  });

  // ==========================================
  // NORMALISASI & REAL DATA BINDING DARI 5 DIVISI PRISM
  // ==========================================
  const allNormalizedRecords = useMemo(() => {
    const list = [];

    DIVISIONS.forEach((div) => {
      const rawRows = data[div.key] || [];
      const cfg = SHEETS[div.key] || SHEETS.rec_ctcp;

      rawRows.forEach((r, idx) => {
        if (!r) return;

        const idVal = cell(r, cfg?.i?.id, '').trim();
        const jopVal = cell(r, cfg?.i?.jop || cfg?.i?.job_name, '').trim();
        const noJopVal = cell(r, cfg?.i?.nojop || cfg?.i?.job_no, '').trim();

        // Validasi row nyata: skip jika ID kosong/- dan job kosong/-
        if (!idVal || idVal === '-' || (!jopVal && !noJopVal) || (jopVal === '-' && noJopVal === '-')) {
          return;
        }

        const dateRaw = cell(r, cfg?.i?.date, '');
        const dateObj = parseDateVal(dateRaw);
        const dateStr = dateObj ? formatYMD(dateObj) : (dateRaw || '');

        // Ekstraksi Mesin Cetak / Expose
        let machineVal = '';
        if (cfg?.i?.print_mach != null) machineVal = cell(r, cfg.i.print_mach, '').trim();
        if (!machineVal && cfg?.i?.expose_mach != null) machineVal = cell(r, cfg.i.expose_mach, '').trim();
        if (!machineVal && cfg?.i?.screen_type != null) machineVal = cell(r, cfg.i.screen_type, '').trim();
        if (!machineVal && cfg?.i?.plate_type != null) machineVal = cell(r, cfg.i.plate_type, '').trim();
        if (!machineVal || machineVal === '-') machineVal = div.defaultMach;

        // Ekstraksi Shift
        let rawShift = cell(r, cfg?.i?.shift, '').trim().toUpperCase();
        let shiftVal = 'SHIFT A';
        if (rawShift.includes('B') || rawShift === '2') shiftVal = 'SHIFT B';
        else if (rawShift.includes('C') || rawShift === '3') shiftVal = 'SHIFT C';
        else if (rawShift.includes('A') || rawShift === '1') shiftVal = 'SHIFT A';
        else if (rawShift) shiftVal = rawShift.startsWith('SHIFT') ? rawShift : `SHIFT ${rawShift}`;

        // Ekstraksi Good, Defect, Replace
        const qtyGood = getRowQtyGood(r, cfg);
        const qtyDefect = getRowQtyDefect(r, cfg);
        const qtyReplace = getRowQtyReplace(r, cfg);

        // Alasan Kerusakan / Penggantian
        const defectReason = cell(r, cfg?.i?.defect_reason ?? cfg?.i?.penyRusak, '').trim();
        const replaceReason = cell(r, cfg?.i?.replace_reason ?? cfg?.i?.penyGanti, '').trim();

        // Operator & Helper
        let operatorVal = cell(r, cfg?.i?.operator ?? cfg?.i?.op, '').trim();
        const helperVal = cell(r, cfg?.i?.po_helper ?? cfg?.i?.po, '').trim();
        if (helperVal && helperVal !== '-' && helperVal !== operatorVal) {
          operatorVal = operatorVal ? `${operatorVal} & ${helperVal}` : helperVal;
        }
        if (!operatorVal || operatorVal === '-') operatorVal = 'Operator Prepress';

        const recordId = idVal || `${div.code}-${dateStr}-${idx}`;

        // Periksa apakah record ini dihapus secara lokal
        if (localOverrides.deleted.has(recordId)) return;

        // Periksa apakah record ini memiliki update lokal
        if (localOverrides.updated[recordId]) {
          list.push(localOverrides.updated[recordId]);
          return;
        }

        list.push({
          id: recordId,
          division: div.code,
          divisionKey: div.key,
          divisionName: div.name,
          date: dateStr,
          job_name: jopVal || noJopVal || 'Job Produksi',
          job_no: noJopVal,
          shift: shiftVal,
          print_mach: machineVal,
          qty_good: qtyGood,
          qty_defect: qtyDefect,
          qty_replace: qtyReplace,
          defect_reason: defectReason && defectReason !== '-' ? defectReason : '',
          replace_reason: replaceReason && replaceReason !== '-' ? replaceReason : '',
          operator: operatorVal,
          rawRow: r,
          rawKey: div.key
        });
      });
    });

    // Tambahkan record yang baru dibuat secara lokal (optimistic)
    localOverrides.added.forEach((rec) => {
      if (!localOverrides.deleted.has(rec.id)) {
        list.push(rec);
      }
    });

    return list;
  }, [data, localOverrides]);

  // Daftar Nama Operator dari Master / Personil untuk Autocomplete Form
  const availableOperators = useMemo(() => {
    const set = new Set();
    const personilList = data.rec_personil || [];
    personilList.forEach((p) => {
      const name = p.nick_name || p.nama_lengkap;
      if (name && name !== '-') set.add(name);
    });
    // Tambahkan juga dari record yang ada jika personil kosong
    allNormalizedRecords.forEach((r) => {
      if (r.operator && r.operator !== '-') {
        set.add(r.operator.split('&')[0].trim());
      }
    });
    return Array.from(set).sort();
  }, [data.rec_personil, allNormalizedRecords]);

  // ==========================================
  // DATA ABSENSI & OPERATOR PRESENSI (rec_absensi & rec_personil)
  // Digunakan untuk kalkulasi dinamis Availability (%) aktual per divisi
  // ==========================================
  const filteredAbsensi = useMemo(() => {
    const rawList = data.rec_absensi || [];
    return rawList.filter((r) => {
      if (!r) return false;
      let dRaw = '';
      if (typeof r === 'object' && !Array.isArray(r)) {
        dRaw = r.date || r.tanggal || r.tgl || '';
      } else if (Array.isArray(r)) {
        dRaw = r[1] || '';
      }
      const dObj = parseDateVal(dRaw);
      const dStr = dObj ? formatYMD(dObj) : String(dRaw || '').substring(0, 10);
      if (fromStr && toStr && dStr) {
        if (dStr < fromStr || dStr > toStr) return false;
      }
      return true;
    });
  }, [data.rec_absensi, fromStr, toStr]);

  // Pemetaan nama personil/operator untuk masing-masing divisi prepress
  const divisionPersonnelMap = useMemo(() => {
    const map = {};
    DIVISIONS.forEach((d) => {
      map[d.code] = new Set();
    });

    // 1. Dari master personil (rec_personil)
    const personilList = data.rec_personil || [];
    personilList.forEach((p) => {
      const nick = String(p.nick_name || p.nama || p.nama_lengkap || '').trim().toUpperCase();
      const full = String(p.nama_lengkap || '').trim().toUpperCase();
      let lini = '';
      let div = '';
      let jab = '';

      if (typeof p === 'object' && !Array.isArray(p)) {
        lini = String(p.lini_mesin || '').toUpperCase();
        div = String(p.divisi || '').toUpperCase();
        jab = String(p.jabatan || '').toUpperCase();
      } else if (Array.isArray(p)) {
        div = cell(p, 4, '').toUpperCase();
        lini = cell(p, 5, '').toUpperCase();
        jab = cell(p, 3, '').toUpperCase();
      }

      DIVISIONS.forEach((d) => {
        const code = d.code.toUpperCase();
        let match = lini.includes(code) || div.includes(code) || jab.includes(code);
        if (!match && code === 'CTCP') match = lini.includes('UV') || lini.includes('OFFSET') || div.includes('OFFSET');
        if (!match && code === 'CTP') match = lini.includes('THERMAL') || div.includes('THERMAL');
        if (match) {
          if (nick) map[d.code].add(nick);
          if (full) map[d.code].add(full);
        }
      });
    });

    // 2. Dari catatan produksi aktual (operator yang pernah mengeksekusi job di lini tsb)
    allNormalizedRecords.forEach((r) => {
      if (r.division && r.operator && r.operator !== '-') {
        const divCode = r.division.toUpperCase();
        if (map[divCode]) {
          const parts = r.operator.split('&');
          parts.forEach((part) => {
            const clean = part.trim().toUpperCase();
            if (clean && clean !== 'OPERATOR PREPRESS' && clean !== '-') {
              map[divCode].add(clean);
            }
          });
        }
      }
    });

    return map;
  }, [data.rec_personil, allNormalizedRecords]);

  // Fungsi kalkulasi Availability aktual divisi dari data rec_absensi PRISM
  const getDivisionAvailabilityStats = useCallback((divCode) => {
    const validNames = divisionPersonnelMap[divCode] || new Set();
    let shiftHadir = 0;
    let shiftTerjadwal = 0;

    filteredAbsensi.forEach((r) => {
      let rawNick = '';
      let rawCode = '';
      let jamMasuk = '';

      if (typeof r === 'object' && !Array.isArray(r)) {
        rawNick = String(r.nick_name || r.nama || '').trim().toUpperCase();
        rawCode = r.status_presensi || r.kode || '';
        jamMasuk = r.jam_masuk || '';
      } else if (Array.isArray(r)) {
        rawNick = cell(r, 2, '').trim().toUpperCase();
        rawCode = cell(r, 3, '');
        jamMasuk = cell(r, 5, '');
      }

      if (!rawNick) return;

      const isMatch = validNames.has(rawNick) || Array.from(validNames).some((n) => n.includes(rawNick) || rawNick.includes(n));
      if (!isMatch) return;

      const { isHadir, isScheduled } = checkAbsensiStatus(rawCode, jamMasuk);
      if (isScheduled) {
        shiftTerjadwal++;
        if (isHadir) shiftHadir++;
      }
    });

    // Rasio kehadiran = (Shift Hadir / Shift Terjadwal) * 100%, fallback 100% jika jadwal kosong
    const rate = shiftTerjadwal > 0 
      ? Math.min(100.0, Math.max(0.0, (shiftHadir / shiftTerjadwal) * 100))
      : 100.0;

    return {
      shiftHadir,
      shiftTerjadwal,
      rate
    };
  }, [divisionPersonnelMap, filteredAbsensi]);

  // ==========================================
  // FILTERING MULTI-DIMENSI
  // ==========================================
  const filteredRecords = useMemo(() => {
    return allNormalizedRecords.filter((rec) => {
      // 1. Filter Divisi
      if (selectedDivision !== 'ALL' && rec.division.toUpperCase() !== selectedDivision.toUpperCase()) {
        return false;
      }

      // 2. Filter Shift
      if (selectedShift !== 'ALL' && rec.shift.toUpperCase() !== selectedShift.toUpperCase()) {
        return false;
      }

      // 3. Filter Rentang Tanggal Global (Single Source of Truth dari Header PRISM)
      if (fromStr && toStr && rec.date) {
        if (rec.date < fromStr || rec.date > toStr) return false;
      }

      // 4. Pencarian Cepat
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = rec.id.toLowerCase().includes(q);
        const matchJob = rec.job_name.toLowerCase().includes(q);
        const matchOp = rec.operator.toLowerCase().includes(q);
        const matchMach = rec.print_mach.toLowerCase().includes(q);
        const matchReason = (rec.defect_reason + ' ' + rec.replace_reason).toLowerCase().includes(q);

        if (!matchId && !matchJob && !matchOp && !matchMach && !matchReason) {
          return false;
        }
      }

      return true;
    });
  }, [allNormalizedRecords, selectedDivision, selectedShift, fromStr, toStr, searchQuery]);

  // Sorting
  const sortedRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => {
      let va = a[sortField];
      let vb = b[sortField];

      if (sortField === 'qty_good' || sortField === 'qty_defect' || sortField === 'qty_replace') {
        va = Number(va) || 0;
        vb = Number(vb) || 0;
        return sortOrder === 'asc' ? va - vb : vb - va;
      }

      va = String(va || '').toLowerCase();
      vb = String(vb || '').toLowerCase();
      if (va < vb) return sortOrder === 'asc' ? -1 : 1;
      if (va > vb) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredRecords, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(sortedRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedRecords.slice(start, start + pageSize);
  }, [sortedRecords, page, pageSize]);

  // ==========================================
  // KALKULASI 4 TOP SUMMARY KPI CARDS
  // ==========================================
  const kpiSummary = useMemo(() => {
    const totalJobs = filteredRecords.length;
    let totalGood = 0;
    let totalDefect = 0;
    let totalReplace = 0;

    filteredRecords.forEach((r) => {
      totalGood += r.qty_good;
      totalDefect += r.qty_defect;
      totalReplace += r.qty_replace;
    });

    const totalValidOutput = totalGood + totalReplace;
    const totalProduced = totalGood + totalReplace + totalDefect;
    const totalDefectRework = totalDefect; // Internal defect (loss)

    // Quality Rate (%) = totalProduced > 0 ? ((qty_good + qty_replace) / totalProduced) * 100 : 100.0
    // qty_defect = internal quality loss
    // qty_replace = penggantian plate permintaan user / pressroom (faktor eksternal - BUKAN defect/loss)
    const firstPassQuality = totalProduced > 0
      ? (totalValidOutput / totalProduced) * 100
      : (totalJobs > 0 ? 100.0 : 100.0);

    // Availability Dinamis Global PRISM:
    // Rasio kehadiran operator (Total Shift Hadir / Total Shift Terjadwal) * 100% dari rec_absensi
    const activeDivCodes = selectedDivision !== 'ALL' 
      ? [selectedDivision] 
      : DIVISIONS.map((d) => d.code);

    let globalHadir = 0;
    let globalTerjadwal = 0;
    activeDivCodes.forEach((code) => {
      const stats = getDivisionAvailabilityStats(code);
      globalHadir += stats.shiftHadir;
      globalTerjadwal += stats.shiftTerjadwal;
    });

    const availability = globalTerjadwal > 0
      ? Math.min(100.0, Math.max(0.0, (globalHadir / globalTerjadwal) * 100))
      : (totalJobs > 0 ? 100.0 : 0);

    // Performance Dinamis Global PRISM:
    // Total Output Aktual dibagi (Jumlah Shift Aktif * Target Kapasitas per Shift) maksimal 100%
    let totalGlobalTarget = 0;
    activeDivCodes.forEach((code) => {
      const targetPerShift = DEFAULT_SHIFT_CAPACITY_TARGETS[code] || 80;
      const shiftsSet = new Set();
      filteredRecords
        .filter((r) => r.division.toUpperCase() === code.toUpperCase())
        .forEach((r) => {
          shiftsSet.add(`${r.date || 'NODATE'}__${r.shift || 'SHIFT A'}`);
        });
      totalGlobalTarget += shiftsSet.size * targetPerShift;
    });

    const rawPerformance = totalGlobalTarget > 0
      ? (totalValidOutput / totalGlobalTarget) * 100
      : (totalJobs > 0 ? 100.0 : 0);
    const performance = totalJobs > 0 ? Math.min(100.0, Math.max(0.0, rawPerformance)) : 0;

    // Overall OEE (%) = (Availability/100) * (Performance/100) * (Quality/100) * 100
    const overallOee = totalJobs > 0
      ? (availability / 100) * (performance / 100) * (firstPassQuality / 100) * 100
      : 0;

    return {
      totalJobs,
      totalGood,
      totalDefect,
      totalReplace,
      totalValidOutput,
      totalProduced,
      totalDefectRework,
      firstPassQuality,
      availability,
      performance,
      overallOee
    };
  }, [filteredRecords, selectedDivision, getDivisionAvailabilityStats]);

  // ==========================================
  // KALKULASI 5 LINI PERFORMANCE MATRIX CARDS
  // Dihitung dinamis per divisi berdasarkan filter aktif (shift, tanggal, search)
  // ==========================================
  const divisionMetrics = useMemo(() => {
    return DIVISIONS.map((div) => {
      // Ambil records untuk divisi ini yang juga mematuhi filter shift, tanggal global, & search
      const lineRecords = allNormalizedRecords.filter((rec) => {
        if (rec.division.toUpperCase() !== div.code.toUpperCase()) return false;
        if (selectedShift !== 'ALL' && rec.shift.toUpperCase() !== selectedShift.toUpperCase()) return false;
        if (fromStr && toStr && rec.date) {
          if (rec.date < fromStr || rec.date > toStr) return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const match = rec.id.toLowerCase().includes(q) ||
            rec.job_name.toLowerCase().includes(q) ||
            rec.operator.toLowerCase().includes(q);
          if (!match) return false;
        }
        return true;
      });

      const jobCount = lineRecords.length;
      let good = 0;
      let defect = 0;
      let replace = 0;

      // Kumpulkan shift aktif unik (date + shift)
      const activeShiftsSet = new Set();
      lineRecords.forEach((r) => {
        good += r.qty_good;
        defect += r.qty_defect;
        replace += r.qty_replace;
        activeShiftsSet.add(`${r.date || 'NODATE'}__${r.shift || 'SHIFT A'}`);
      });

      const totalValidOutput = good + replace;
      const totalProc = good + defect + replace;

      // 1. Quality Rate (%) = totalProc > 0 ? ((good + replace) / totalProc) * 100 : 100.0
      // qty_defect = internal quality loss; qty_replace = permintaan user (output valid)
      const qual = totalProc > 0 ? (totalValidOutput / totalProc) * 100 : (jobCount > 0 ? 100.0 : 100.0);

      // 2. Availability (%) dinamis dari data absensi PRISM
      const availStats = getDivisionAvailabilityStats(div.code);
      const avail = jobCount > 0 ? availStats.rate : (availStats.shiftTerjadwal > 0 ? availStats.rate : 100.0);

      // 3. Performance (%) dinamis dari Total Output Aktual / (Jumlah Shift Aktif * Target Kapasitas per Shift)
      const activeShiftCount = activeShiftsSet.size;
      const targetPerShift = DEFAULT_SHIFT_CAPACITY_TARGETS[div.code] || 80;
      const totalTargetCapacity = activeShiftCount * targetPerShift;
      const rawPerf = totalTargetCapacity > 0 
        ? (totalValidOutput / totalTargetCapacity) * 100 
        : (jobCount > 0 ? 100.0 : 0);
      const perf = jobCount > 0 ? Math.min(100.0, Math.max(0.0, rawPerf)) : 0; // dibatasi maksimal 100%

      // 4. Overall OEE (%) = (Availability/100) * (Performance/100) * (Quality/100) * 100
      const oee = jobCount > 0 ? (avail / 100) * (perf / 100) * (qual / 100) * 100 : 0;

      const isSelected = selectedDivision === div.code;

      return {
        ...div,
        jobCount,
        good,
        defect,
        replace,
        totalProc,
        totalValidOutput,
        activeShiftCount,
        targetPerShift,
        totalTargetCapacity,
        shiftHadir: availStats.shiftHadir,
        shiftTerjadwal: availStats.shiftTerjadwal,
        avail,
        perf,
        qual,
        oee,
        isSelected
      };
    });
  }, [allNormalizedRecords, selectedDivision, selectedShift, fromStr, toStr, searchQuery, getDivisionAvailabilityStats]);

  // ==========================================
  // HANDLERS CRUD & AKSI
  // ==========================================
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleResetFilters = () => {
    setSelectedDivision('ALL');
    setSelectedShift('ALL');
    setSearchQuery('');
    setPage(1);
  };

  const handleExportCSV = () => {
    if (sortedRecords.length === 0) {
      alert('Tidak ada data untuk diekspor pada filter ini.');
      return;
    }

    const headers = [
      'Job ID',
      'Division',
      'Date',
      'Job Name',
      'Shift',
      'Machine',
      'Qty Good',
      'Qty Defect',
      'Qty Replace',
      'Defect Reason',
      'Replace Reason',
      'Operator'
    ];

    const rows = sortedRecords.map((r) => [
      `"${r.id}"`,
      `"${r.division}"`,
      `"${r.date}"`,
      `"${(r.job_name || '').replace(/"/g, '""')}"`,
      `"${r.shift}"`,
      `"${(r.print_mach || '').replace(/"/g, '""')}"`,
      r.qty_good,
      r.qty_defect,
      r.qty_replace,
      `"${(r.defect_reason || '').replace(/"/g, '""')}"`,
      `"${(r.replace_reason || '').replace(/"/g, '""')}"`,
      `"${(r.operator || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `PRISM_OEE_Production_${fromStr || 'ALL'}_sd_${toStr || 'ALL'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Submit Tambah / Edit Job
  const handleSaveJob = async (formData, isEdit) => {
    setIsSubmitting(true);
    const divCode = formData.division || 'CTCP';

    try {
      if (isEdit) {
        const res = await updateProductionJob(divCode, formData.id, formData);
        if (!res.ok) {
          console.warn('Supabase update returned error:', res.error);
        }
        // Update local optimistic state
        setLocalOverrides((prev) => ({
          ...prev,
          updated: {
            ...prev.updated,
            [formData.id]: {
              ...formData,
              division: divCode,
              divisionName: `${divCode} Line`,
              divisionKey: DIVISION_TO_TABLE[divCode]
            }
          }
        }));
        setEditTarget(null);
        if (onToast) onToast(`Job ${formData.id} berhasil diperbarui!`, 'ok');
      } else {
        const newId = formData.id || `JOB-${Date.now().toString().slice(-6)}`;
        const fullNewData = {
          ...formData,
          id: newId,
          division: divCode,
          divisionName: `${divCode} Line`,
          divisionKey: DIVISION_TO_TABLE[divCode]
        };

        const res = await addProductionJob(divCode, fullNewData);
        if (!res.ok) {
          console.warn('Supabase insert returned error:', res.error);
        }
        // Insert local optimistic state
        setLocalOverrides((prev) => ({
          ...prev,
          added: [fullNewData, ...prev.added]
        }));
        setIsAddModalOpen(false);
        if (onToast) onToast(`Job baru ${newId} berhasil ditambahkan ke lini ${divCode}!`, 'ok');
      }

      // Trigger re-fetch background jika ada reload handler
      if (reload) reload();
    } catch (err) {
      console.error('Save job failed:', err);
      alert('Terjadi kesalahan saat menyimpan data: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Hapus Job
  const handleDeleteJob = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);

    try {
      const res = await deleteProductionJob(deleteTarget.division, deleteTarget.id);
      if (!res.ok) {
        console.warn('Supabase delete returned error:', res.error);
      }

      setLocalOverrides((prev) => {
        const nextDeleted = new Set(prev.deleted);
        nextDeleted.add(deleteTarget.id);
        const nextUpdated = { ...prev.updated };
        delete nextUpdated[deleteTarget.id];
        const nextAdded = prev.added.filter((a) => a.id !== deleteTarget.id);

        return {
          added: nextAdded,
          updated: nextUpdated,
          deleted: nextDeleted
        };
      });

      if (onToast) onToast(`Job ${deleteTarget.id} berhasil dihapus.`, 'ok');
      setDeleteTarget(null);
      if (reload) reload();
    } catch (err) {
      console.error('Delete job failed:', err);
      alert('Gagal menghapus data: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 anim-in">
      {/* ==========================================
          HEADER TITLE & EXECUTIVE CONTROLS
          ========================================== */}
      <div className="card p-5 sm:p-6 bg-gradient-to-r from-white via-slate-50 to-indigo-50/30 dark:from-[#0d1527] dark:via-[#0f172a] dark:to-[#172033] border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge font-mono text-[10px] font-extrabold bg-blue-100 text-blue-900 border border-blue-300 dark:bg-cyan-950/80 dark:text-cyan-300 dark:border-cyan-800 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-sm">
                <Gauge className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                PRODUCTION PERFORMANCE &amp; OEE CONTROL
              </span>
              <span className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 px-2 py-0.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Real-Time Database Sync
              </span>
              <span className="flex items-center gap-1.5 text-[11px] font-mono text-blue-700 dark:text-cyan-300 font-bold bg-blue-50 dark:bg-cyan-950/40 border border-blue-200 dark:border-cyan-800/50 px-2.5 py-0.5 rounded-full">
                <Calendar className="w-3 h-3 text-blue-500 dark:text-cyan-400" />
                Periode: {fmtPeriodRange(period?.from, period?.to)}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white font-display">
              Production Performance &amp; Overall Equipment Effectiveness (OEE)
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
              Monitoring efisiensi lini produksi terpadu 5 divisi (CTP, CTCP, Flexo, Etching, Screen) dengan kalkulasi OEE otomatis berbasis output real-time.
            </p>
          </div>

          {/* Action Buttons Top */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleExportCSV}
              className="btn-secondary !py-2 !px-3.5 text-xs flex items-center gap-2 rounded-xl shadow-sm hover:border-slate-300 dark:hover:border-slate-600 transition"
              title="Download Data CSV"
            >
              <Download className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span>Export CSV</span>
            </button>

            {reload && (
              <button
                type="button"
                onClick={reload}
                className="btn-secondary !py-2 !px-3.5 text-xs flex items-center gap-2 rounded-xl shadow-sm hover:border-slate-300 dark:hover:border-slate-600 transition"
                title="Refresh Live Data"
              >
                <RefreshCw className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                <span>Sync Data</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="btn-primary !py-2 !px-4 text-xs font-bold flex items-center gap-2 rounded-xl shadow-md bg-blue-600 hover:bg-blue-700 text-white dark:bg-gradient-to-r dark:from-cyan-500 dark:to-blue-600 transition"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Production Job</span>
            </button>
          </div>
        </div>
      </div>

      {/* ==========================================
          INTERACTIVE MULTI-DIMENSIONAL FILTER BAR
          ========================================== */}
      <div className="card p-4 sm:p-5 space-y-4 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Top Filter Controls: Division Pills */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-blue-600 dark:text-cyan-400 shrink-0" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
              Filter Divisi Prepress:
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 max-w-full" style={{ WebkitOverflowScrolling: 'touch' }}>
            <button
              type="button"
              onClick={() => {
                setSelectedDivision('ALL');
                setPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                selectedDivision === 'ALL'
                  ? 'bg-blue-600 text-white shadow-sm dark:bg-gradient-to-r dark:from-cyan-500 dark:to-blue-600'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700/60'
              }`}
            >
              <span>ALL DIVISIONS</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${selectedDivision === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                {allNormalizedRecords.length}
              </span>
            </button>

            {DIVISIONS.map((div) => {
              const isActive = selectedDivision === div.code;
              const count = allNormalizedRecords.filter((r) => r.division === div.code).length;
              return (
                <button
                  key={div.code}
                  type="button"
                  onClick={() => {
                    setSelectedDivision(div.code);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    isActive
                      ? 'text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700/60'
                  }`}
                  style={isActive ? { background: div.color } : {}}
                >
                  <span>{div.code}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isActive ? 'bg-white/25 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Secondary Filter: Shift Dropdown, Quick Search & Reset (Single Source of Truth: Periode Tanggal Terpusat di Top Header Bar) */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-3 border-t border-slate-200 dark:border-slate-800/80 items-end">
          {/* Shift Filter Dropdown */}
          <div className="sm:col-span-4 lg:col-span-3">
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" /> Shift Kerja
            </label>
            <select
              value={selectedShift}
              onChange={(e) => {
                setSelectedShift(e.target.value);
                setPage(1);
              }}
              className="inp w-full !py-2 text-xs font-bold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl"
            >
              <option value="ALL">All Shifts (Semua Regu)</option>
              <option value="SHIFT A">Shift A (Pagi)</option>
              <option value="SHIFT B">Shift B (Siang)</option>
              <option value="SHIFT C">Shift C (Malam)</option>
            </select>
          </div>

          {/* Quick Search */}
          <div className="sm:col-span-8 lg:col-span-6">
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider flex items-center gap-1">
              <Search className="w-3 h-3 text-slate-400" /> Pencarian Cepat
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search job ID, nama order, operator, atau mesin..."
                className="inp !pl-9 !pr-8 w-full !py-2 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Active Global Period Display */}
          <div className="hidden lg:block lg:col-span-2">
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3 h-3 text-blue-500 dark:text-cyan-400" /> Periode Aktif
            </label>
            <div
              className="h-[38px] px-3 flex items-center bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold text-blue-600 dark:text-cyan-300 truncate"
              title="Rentang tanggal dikendalikan langsung secara terpusat dari Top Header Bar PRISM"
            >
              {fmtPeriodRange(period?.from, period?.to)}
            </div>
          </div>

          {/* Reset Button */}
          <div className="sm:col-span-12 lg:col-span-1">
            <button
              type="button"
              onClick={handleResetFilters}
              className="btn-secondary w-full !h-[38px] !py-2 text-xs rounded-xl flex items-center justify-center gap-1.5 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-300 transition"
              title="Reset Filter Divisi, Shift & Pencarian"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="text-xs">Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* ==========================================
          4 TOP SUMMARY KPI CARDS
          ========================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Overall OEE (%) */}
        <div className="card p-5 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-blue-400/50 dark:hover:border-cyan-500/50 transition">
          <div className="flex items-center justify-between gap-3 mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Overall OEE Performance
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-cyan-500/10 border border-blue-200 dark:border-cyan-400/30 text-blue-600 dark:text-cyan-300 flex items-center justify-center shrink-0">
              <Gauge className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-black font-display text-slate-900 dark:text-white">
              {kpiSummary.overallOee.toFixed(2)}%
            </span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md font-mono ${
              kpiSummary.overallOee >= 85
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                : kpiSummary.overallOee >= 75
                ? 'bg-blue-100 text-blue-800 dark:bg-cyan-950/60 dark:text-cyan-300'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
            }`}>
              {kpiSummary.overallOee >= 85 ? 'World Class' : kpiSummary.overallOee >= 75 ? 'Good' : 'Needs Review'}
            </span>
          </div>

          {/* Progress Bar Indikator */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mb-2.5">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                kpiSummary.overallOee >= 85
                  ? 'bg-emerald-500'
                  : kpiSummary.overallOee >= 75
                  ? 'bg-blue-500 dark:bg-cyan-400'
                  : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, kpiSummary.overallOee))}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            <span>Target Benchmark: <b>85.0%</b></span>
            <span>Avail &times; Perf &times; Qual</span>
          </div>
        </div>

        {/* Card 2: Good Output */}
        <div className="card p-5 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-emerald-400/50 dark:hover:border-emerald-500/50 transition">
          <div className="flex items-center justify-between gap-3 mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Good Output
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-400/30 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-black font-display text-emerald-600 dark:text-emerald-400">
              {kpiSummary.totalGood.toLocaleString('id-ID')}
            </span>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Unit / Plate</span>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mb-2.5">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-700"
              style={{
                width: `${
                  kpiSummary.totalProduced > 0
                    ? (kpiSummary.totalGood / kpiSummary.totalProduced) * 100
                    : 100
                }%`
              }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Total Record: <b className="text-slate-900 dark:text-white font-mono">{kpiSummary.totalJobs}</b> Jobs</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">Produk Jadi Baik</span>
          </div>
        </div>

        {/* Card 3: First-Pass Quality (%) */}
        <div className="card p-5 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-cyan-400/50 dark:hover:border-cyan-500/50 transition">
          <div className="flex items-center justify-between gap-3 mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              First-Pass Quality
            </span>
            <div className="w-9 h-9 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-400/30 text-cyan-600 dark:text-cyan-300 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-black font-display text-slate-900 dark:text-white">
              {kpiSummary.firstPassQuality.toFixed(2)}%
            </span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md font-mono ${
              kpiSummary.firstPassQuality >= 98
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
            }`}>
              {kpiSummary.firstPassQuality >= 98 ? 'Optimal' : 'Toleransi'}
            </span>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mb-2.5">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                kpiSummary.firstPassQuality >= 98
                  ? 'bg-emerald-500'
                  : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, kpiSummary.firstPassQuality))}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            <span>Standar Mutu: <b>&ge; 98.0%</b></span>
            <span>Rasio Output Sah</span>
          </div>
        </div>

        {/* Card 4: Internal Defect (Loss) */}
        <div className="card p-5 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-rose-400/50 dark:hover:border-rose-500/50 transition">
          <div className="flex items-center justify-between gap-3 mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Internal Defect (Loss)
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-400/30 text-rose-600 dark:text-rose-300 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-black font-display text-rose-600 dark:text-rose-400">
              {kpiSummary.totalDefect.toLocaleString('id-ID')}
            </span>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Unit Loss</span>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mb-2.5">
            <div
              className="h-full rounded-full bg-rose-500 transition-all duration-700"
              style={{
                width: `${
                  kpiSummary.totalProduced > 0
                    ? Math.min(100, (kpiSummary.totalDefect / kpiSummary.totalProduced) * 100 * 5)
                    : 0
                }%`
              }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-rose-600 dark:text-rose-400 font-bold">
              Defect (Loss): {kpiSummary.totalDefect.toLocaleString('id-ID')} pcs
            </span>
            <span className="text-slate-500 dark:text-slate-400 font-medium" title="Penggantian plate akibat permintaan user / pressroom (bukan defect)">
              Replace (User Req): <b className="text-amber-600 dark:text-amber-400 font-mono">{kpiSummary.totalReplace.toLocaleString('id-ID')}</b> pcs
            </span>
          </div>
        </div>
      </div>

      {/* ==========================================
          DIVISION PERFORMANCE BREAKDOWN (5 LINI MATRIX CARDS)
          ========================================== */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Matrix Performa 5 Lini Produksi Prepress
            </h2>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            Kalkulasi Aktual PRISM: <b>Avail (Presensi Operator)</b> &bull; <b>Perf (Target Shift)</b> &bull; <b>Qual (Loss Internal)</b>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {divisionMetrics.map((div) => {
            const hasJobs = div.jobCount > 0;
            return (
              <div
                key={div.code}
                onClick={() => {
                  setSelectedDivision(selectedDivision === div.code ? 'ALL' : div.code);
                  setPage(1);
                }}
                className={`card p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 cursor-pointer border relative overflow-hidden group hover:scale-[1.01] hover:shadow-md ${
                  div.isSelected
                    ? 'ring-2 ring-blue-500 dark:ring-cyan-400 shadow-md bg-white dark:bg-[#131d38]'
                    : 'bg-white dark:bg-[#0f172a] border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* Accent Top Bar */}
                <div
                  className="absolute top-0 inset-x-0 h-1.5 transition-all group-hover:h-2"
                  style={{ background: div.color }}
                />

                {/* Header Card */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`text-[10px] font-mono font-extrabold uppercase px-2 py-0.5 rounded-full border ${div.badgeClass}`}>
                      {div.badge}
                    </span>
                    <span className={`text-[10px] font-mono font-bold ${hasJobs ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                      {hasJobs ? '● ACTIVE' : '○ IDLE'}
                    </span>
                  </div>

                  <h3 className="font-display font-black text-sm text-slate-900 dark:text-white truncate">
                    {div.name}
                  </h3>

                  {/* Main OEE Score */}
                  <div className="my-3 flex items-baseline justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        OEE Score
                      </div>
                      <div className="text-2xl font-black font-display text-slate-900 dark:text-white" style={{ color: hasJobs ? div.color : undefined }}>
                        {div.oee.toFixed(2)}%
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Loss</span>
                      <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
                        {div.defect} unit
                      </span>
                    </div>
                  </div>

                  {/* 3 Pillars Breakdown: Avail, Perf, Qual */}
                  <div className="space-y-2 py-2 border-t border-b border-slate-100 dark:border-slate-800/80 my-2 text-[11px] font-mono">
                    {/* Avail */}
                    <div title={`Availability: ${div.shiftHadir} hadir dari ${div.shiftTerjadwal} shift terjadwal operator`}>
                      <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-0.5">
                        <span>Avail</span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">{div.avail.toFixed(2)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, Math.max(0, div.avail))}%` }} />
                      </div>
                    </div>

                    {/* Perf */}
                    <div title={`Performance: ${div.totalValidOutput} unit output / target ${div.totalTargetCapacity} unit (${div.targetPerShift}/shift x ${div.activeShiftCount} shift)`}>
                      <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-0.5">
                        <span>Perf</span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">{div.perf.toFixed(2)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, Math.max(0, div.perf))}%` }} />
                      </div>
                    </div>

                    {/* Qual */}
                    <div title={`Quality Rate: ${div.totalValidOutput} valid dari ${div.totalProc} total produksi`}>
                      <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-0.5">
                        <span>Qual</span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">{div.qual.toFixed(2)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, Math.max(0, div.qual))}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Card */}
                <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  <div className="truncate">
                    Good: <b className="text-slate-900 dark:text-white">{div.good.toLocaleString('id-ID')}</b>
                    {div.replace > 0 && (
                      <span className="text-amber-600 dark:text-amber-400 text-[10px] ml-1 font-semibold" title="Penggantian permintaan user (bukan defect)">
                        (+{div.replace.toLocaleString('id-ID')} Rep)
                      </span>
                    )}
                  </div>
                  <div className="shrink-0">
                    Jobs: <b className="text-slate-900 dark:text-white">{div.jobCount}</b>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ==========================================
          TABEL PRODUCTION JOB RECORDS & AKSI INPUT
          ========================================== */}
      <div className="card p-5 space-y-4 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Table Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl grid place-items-center bg-blue-50 dark:bg-cyan-500/10 border border-blue-200 dark:border-cyan-400/30 text-blue-600 dark:text-cyan-300">
              <Printer className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                Production Job Records
                <span className="badge text-[10px] font-mono font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                  {filteredRecords.length.toLocaleString('id-ID')} Data
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Data historis produksi dan OEE terfilter &bull; Klik baris untuk detail cepat
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="inp !py-1.5 !px-2.5 text-xs font-mono font-bold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl"
            >
              <option value={10}>10 Baris</option>
              <option value={15}>15 Baris</option>
              <option value={25}>25 Baris</option>
              <option value={50}>50 Baris</option>
            </select>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="table-responsive">
          <table className="tbl min-w-[1000px]">
            <thead>
              <tr>
                <th onClick={() => handleSort('id')} className="cursor-pointer select-none">
                  JOB ID {sortField === 'id' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th onClick={() => handleSort('division')} className="cursor-pointer select-none">
                  DIVISI {sortField === 'division' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th onClick={() => handleSort('date')} className="cursor-pointer select-none">
                  TANGGAL {sortField === 'date' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th onClick={() => handleSort('job_name')} className="cursor-pointer select-none">
                  JOB NAME / ORDER {sortField === 'job_name' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th>SHIFT</th>
                <th>MACHINE / LINI</th>
                <th onClick={() => handleSort('qty_good')} className="cursor-pointer select-none text-right text-emerald-600 dark:text-emerald-400">
                  GOOD {sortField === 'qty_good' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th onClick={() => handleSort('qty_defect')} className="cursor-pointer select-none text-right text-rose-600 dark:text-rose-400">
                  DEFECT {sortField === 'qty_defect' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th onClick={() => handleSort('qty_replace')} className="cursor-pointer select-none text-right text-amber-600 dark:text-amber-400">
                  REPLACE {sortField === 'qty_replace' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th>DEFECT / REPLACE REASON</th>
                <th>OPERATOR</th>
                <th className="text-center no-print">AKSI</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center py-14 text-slate-500 dark:text-slate-400 text-xs">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Info className="w-8 h-8 text-slate-400" />
                      <p className="font-semibold">Tidak ada catatan produksi yang cocok dengan filter aktif.</p>
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="btn-secondary !py-1 !px-3 text-xs rounded-xl"
                      >
                        Reset Filter
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((r, idx) => {
                  const divCfg = DIVISIONS.find((d) => d.code === r.division) || DIVISIONS[0];
                  return (
                    <tr
                      key={r.id || idx}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer"
                      onClick={() => setDetailItem(r)}
                    >
                      {/* Job ID */}
                      <td className="font-mono font-black text-xs text-slate-900 dark:text-white whitespace-nowrap">
                        {r.id}
                      </td>

                      {/* Division Badge */}
                      <td className="whitespace-nowrap">
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${divCfg.badgeClass}`}>
                          {r.division}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="whitespace-nowrap font-mono text-xs text-blue-600 dark:text-cyan-400 font-semibold">
                        {fmtDate(parseDateVal(r.date)) || r.date}
                      </td>

                      {/* Job Name */}
                      <td className="font-semibold text-slate-900 dark:text-slate-100 max-w-[220px] truncate" title={r.job_name}>
                        {r.job_name}
                      </td>

                      {/* Shift */}
                      <td className="whitespace-nowrap text-center">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {r.shift}
                        </span>
                      </td>

                      {/* Machine */}
                      <td className="whitespace-nowrap text-xs text-slate-600 dark:text-slate-400">
                        {r.print_mach || '—'}
                      </td>

                      {/* Good (Green) */}
                      <td className="whitespace-nowrap font-mono font-black text-xs text-right text-emerald-600 dark:text-emerald-400">
                        {r.qty_good.toLocaleString('id-ID')}
                      </td>

                      {/* Defect (Red) */}
                      <td className={`whitespace-nowrap font-mono font-bold text-xs text-right ${r.qty_defect > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}>
                        {r.qty_defect > 0 ? r.qty_defect.toLocaleString('id-ID') : '0'}
                      </td>

                      {/* Replace (Amber) */}
                      <td className={`whitespace-nowrap font-mono font-bold text-xs text-right ${r.qty_replace > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`}>
                        {r.qty_replace > 0 ? r.qty_replace.toLocaleString('id-ID') : '0'}
                      </td>

                      {/* Defect / Replace Reason */}
                      <td className="text-xs text-slate-700 dark:text-slate-300 max-w-[200px] truncate">
                        {r.defect_reason || r.replace_reason ? (
                          <div className="space-y-0.5">
                            {r.defect_reason && (
                              <span className="text-rose-600 dark:text-rose-400 font-medium block truncate" title={`Defect: ${r.defect_reason}`}>
                                D: {r.defect_reason}
                              </span>
                            )}
                            {r.replace_reason && (
                              <span className="text-amber-600 dark:text-amber-400 font-medium block truncate" title={`Replace: ${r.replace_reason}`}>
                                R: {r.replace_reason}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600">—</span>
                        )}
                      </td>

                      {/* Operator */}
                      <td className="whitespace-nowrap text-xs text-slate-800 dark:text-slate-200">
                        {r.operator}
                      </td>

                      {/* Actions */}
                      <td className="whitespace-nowrap text-center no-print" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditTarget(r)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            title="Edit Job"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(r)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                            title="Hapus Job"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Summary Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
          <div>
            Menampilkan <b className="text-slate-900 dark:text-white">{paginatedRecords.length}</b> dari <b className="text-slate-900 dark:text-white">{sortedRecords.length.toLocaleString('id-ID')}</b> catatan terfilter
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono">
              Hal <b className="text-slate-900 dark:text-white">{page}</b> / <b className="text-slate-900 dark:text-white">{totalPages}</b>
            </span>

            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="btn-secondary !py-1 !px-2.5 text-xs disabled:opacity-40 rounded-xl"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="btn-secondary !py-1 !px-2.5 text-xs disabled:opacity-40 rounded-xl"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ==========================================
          MODAL FORM INPUT (+ ADD / EDIT PRODUCTION JOB)
          ========================================== */}
      {(isAddModalOpen || editTarget) && (
        <ProductionJobFormModal
          isOpen={isAddModalOpen || !!editTarget}
          editData={editTarget}
          availableOperators={availableOperators}
          isSubmitting={isSubmitting}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditTarget(null);
          }}
          onSave={handleSaveJob}
        />
      )}

      {/* ==========================================
          MODAL KONFIRMASI HAPUS JOB
          ========================================== */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => !isSubmitting && setDeleteTarget(null)}
          />
          <div className="relative w-full max-w-md bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                  Konfirmasi Hapus Job
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Aksi ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Apakah Anda yakin ingin menghapus catatan produksi Job ID{' '}
              <b className="text-slate-900 dark:text-white font-mono">{deleteTarget.id}</b> ({deleteTarget.job_name}) dari lini{' '}
              <b className="text-blue-600 dark:text-cyan-400">{deleteTarget.division}</b>?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setDeleteTarget(null)}
                className="btn-secondary !py-2 !px-4 text-xs rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleDeleteJob}
                className="btn-danger !py-2 !px-4 text-xs font-bold rounded-xl flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white"
              >
                {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Ya, Hapus Data</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          DETAIL PREVIEW MODAL / DRAWER
          ========================================== */}
      {detailItem && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-5">
          <div
            className="absolute inset-0 bg-[#030712]/80 backdrop-blur-md"
            onClick={() => setDetailItem(null)}
          />
          <div className="relative w-full max-w-2xl bg-white dark:bg-[#0c1430] rounded-3xl border border-slate-200 dark:border-cyan-500/30 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3.5">
              <div className="flex items-center gap-2.5">
                <span className="badge font-mono font-bold text-xs bg-blue-100 text-blue-900 dark:bg-cyan-950/60 dark:text-cyan-300 border-blue-300 dark:border-cyan-800">
                  {detailItem.division} LINE
                </span>
                <h3 className="font-display font-black text-base text-slate-900 dark:text-white font-mono">
                  {detailItem.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailItem(null)}
                className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Job Name / Order</span>
                <span className="font-bold text-slate-900 dark:text-white mt-1 block truncate" title={detailItem.job_name}>
                  {detailItem.job_name}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Tanggal Produksi</span>
                <span className="font-bold text-blue-600 dark:text-cyan-400 mt-1 block font-mono">
                  {detailItem.date}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Shift Kerja</span>
                <span className="font-bold text-slate-900 dark:text-white mt-1 block font-mono">
                  {detailItem.shift}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Mesin / Lini</span>
                <span className="font-bold text-slate-900 dark:text-white mt-1 block truncate">
                  {detailItem.print_mach || '—'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Operator</span>
                <span className="font-bold text-slate-900 dark:text-white mt-1 block truncate">
                  {detailItem.operator}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Total Plate Output</span>
                <span className="font-bold text-slate-900 dark:text-white mt-1 block font-mono">
                  {(detailItem.qty_good + detailItem.qty_defect + detailItem.qty_replace).toLocaleString('id-ID')} Unit
                </span>
              </div>
            </div>

            {/* Output Metric Boxes */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase block">Good Output</span>
                <span className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-300">
                  {detailItem.qty_good.toLocaleString('id-ID')}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60">
                <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase block">Defect</span>
                <span className="text-xl font-black font-mono text-rose-600 dark:text-rose-300">
                  {detailItem.qty_defect.toLocaleString('id-ID')}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60">
                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase block">Replace</span>
                <span className="text-xl font-black font-mono text-amber-600 dark:text-amber-300">
                  {detailItem.qty_replace.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Reason details if any */}
            {(detailItem.defect_reason || detailItem.replace_reason) && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                {detailItem.defect_reason && (
                  <div>
                    <span className="font-bold text-rose-600 dark:text-rose-400">Penyebab Kerusakan (Defect): </span>
                    <span className="text-slate-800 dark:text-slate-200">{detailItem.defect_reason}</span>
                  </div>
                )}
                {detailItem.replace_reason && (
                  <div>
                    <span className="font-bold text-amber-600 dark:text-amber-400">Alasan Penggantian (Replace): </span>
                    <span className="text-slate-800 dark:text-slate-200">{detailItem.replace_reason}</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  const target = detailItem;
                  setDetailItem(null);
                  setEditTarget(target);
                }}
                className="btn-secondary !py-2 !px-4 text-xs rounded-xl flex items-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Record Ini</span>
              </button>
              <button
                type="button"
                onClick={() => setDetailItem(null)}
                className="btn-primary !py-2 !px-4 text-xs rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// SUBKOMPONEN FORM MODAL (+ ADD / EDIT JOB)
// ==========================================
function ProductionJobFormModal({
  isOpen,
  editData,
  availableOperators,
  isSubmitting,
  onClose,
  onSave
}) {
  const isEdit = !!editData;

  const [formData, setFormData] = useState(() => {
    if (editData) {
      return {
        id: editData.id || '',
        division: editData.division || 'CTCP',
        date: editData.date || formatYMD(new Date()),
        job_name: editData.job_name || '',
        job_no: editData.job_no || editData.id || '',
        shift: editData.shift || 'SHIFT A',
        print_mach: editData.print_mach || '',
        qty_good: editData.qty_good ?? 0,
        qty_defect: editData.qty_defect ?? 0,
        qty_replace: editData.qty_replace ?? 0,
        defect_reason: editData.defect_reason || '',
        replace_reason: editData.replace_reason || '',
        operator: editData.operator || '',
        notes: editData.notes || ''
      };
    }
    return {
      id: `JOB-${Date.now().toString().slice(-6)}`,
      division: 'CTCP',
      date: formatYMD(new Date()),
      job_name: '',
      job_no: '',
      shift: 'SHIFT A',
      print_mach: '',
      qty_good: 0,
      qty_defect: 0,
      qty_replace: 0,
      defect_reason: '',
      replace_reason: '',
      operator: availableOperators[0] || 'Operator Prepress',
      notes: ''
    };
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.job_name.trim()) {
      alert('Nama Job / Order tidak boleh kosong.');
      return;
    }
    onSave(formData, isEdit);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-5">
      <div
        className="absolute inset-0 bg-[#030712]/85 backdrop-blur-md"
        onClick={() => !isSubmitting && onClose()}
      />
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#0c1430] rounded-3xl border border-slate-200 dark:border-cyan-500/30 p-6 sm:p-7 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h3 className="font-display font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
              {isEdit ? <Edit2 className="w-5 h-5 text-blue-600 dark:text-cyan-400" /> : <Plus className="w-5 h-5 text-blue-600 dark:text-cyan-400" />}
              {isEdit ? `Edit Production Job (${formData.id})` : 'Tambah Catatan Produksi Baru'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Input data aktual output dan defect untuk kalkulasi OEE lini prepress.
            </p>
          </div>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Division Selection */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1 uppercase tracking-wider">
                Divisi Prepress <span className="text-rose-500">*</span>
              </label>
              <select
                disabled={isEdit}
                value={formData.division}
                onChange={(e) => handleChange('division', e.target.value)}
                className="inp w-full !py-2 font-bold bg-white dark:bg-slate-900 rounded-xl"
              >
                <option value="CTP">CTP (Thermal)</option>
                <option value="CTCP">CTCP (Offset UV)</option>
                <option value="FLEXO">Flexo (Flexography)</option>
                <option value="ETCHING">Etching Plate</option>
                <option value="SCREEN">Screen Printing</option>
              </select>
            </div>

            {/* Job ID */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1 uppercase tracking-wider">
                Job ID / SPK <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                disabled={isEdit}
                value={formData.id}
                onChange={(e) => handleChange('id', e.target.value)}
                placeholder="Misal: CTCP-2026-001"
                className="inp w-full !py-2 font-mono font-bold bg-white dark:bg-slate-900 rounded-xl"
                required
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1 uppercase tracking-wider">
                Tanggal Produksi <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                className="inp w-full !py-2 font-mono font-bold bg-white dark:bg-slate-900 rounded-xl"
                required
              />
            </div>

            {/* Shift */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1 uppercase tracking-wider">
                Shift Kerja <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.shift}
                onChange={(e) => handleChange('shift', e.target.value)}
                className="inp w-full !py-2 font-bold bg-white dark:bg-slate-900 rounded-xl"
              >
                <option value="SHIFT A">SHIFT A (Pagi)</option>
                <option value="SHIFT B">SHIFT B (Siang)</option>
                <option value="SHIFT C">SHIFT C (Malam)</option>
              </select>
            </div>
          </div>

          {/* Job Name / Order */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1 uppercase tracking-wider">
              Nama Order / Job Description <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.job_name}
              onChange={(e) => handleChange('job_name', e.target.value)}
              placeholder="Misal: Box Kemasan Indofood 250gr"
              className="inp w-full !py-2 bg-white dark:bg-slate-900 rounded-xl font-medium"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Machine */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1 uppercase tracking-wider">
                Mesin Cetak / Expose
              </label>
              <input
                type="text"
                value={formData.print_mach}
                onChange={(e) => handleChange('print_mach', e.target.value)}
                placeholder="Misal: Heidelberg SM-102 / Cron UV"
                className="inp w-full !py-2 bg-white dark:bg-slate-900 rounded-xl"
              />
            </div>

            {/* Operator */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1 uppercase tracking-wider">
                Operator Prepress <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                list="operator-suggestions"
                value={formData.operator}
                onChange={(e) => handleChange('operator', e.target.value)}
                placeholder="Pilih atau ketik nama operator..."
                className="inp w-full !py-2 bg-white dark:bg-slate-900 rounded-xl font-medium"
                required
              />
              <datalist id="operator-suggestions">
                {availableOperators.map((op) => (
                  <option key={op} value={op} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Quantities Section */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
            <span className="text-xs font-bold text-slate-900 dark:text-white block uppercase tracking-wider">
              Kuantitas Output &amp; Defect (Unit / Plate)
            </span>

            <div className="grid grid-cols-3 gap-3">
              {/* Qty Good */}
              <div>
                <label className="block text-[10px] font-bold text-emerald-700 dark:text-emerald-400 mb-1 uppercase">
                  Good (Baik)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.qty_good}
                  onChange={(e) => handleChange('qty_good', Number(e.target.value) || 0)}
                  className="inp w-full !py-2 font-mono font-black text-center text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900 rounded-xl"
                />
              </div>

              {/* Qty Defect */}
              <div>
                <label className="block text-[10px] font-bold text-rose-700 dark:text-rose-400 mb-1 uppercase">
                  Defect (Rusak)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.qty_defect}
                  onChange={(e) => handleChange('qty_defect', Number(e.target.value) || 0)}
                  className="inp w-full !py-2 font-mono font-black text-center text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-900 rounded-xl"
                />
              </div>

              {/* Qty Replace */}
              <div>
                <label className="block text-[10px] font-bold text-amber-700 dark:text-amber-400 mb-1 uppercase">
                  Replace (Ganti)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.qty_replace}
                  onChange={(e) => handleChange('qty_replace', Number(e.target.value) || 0)}
                  className="inp w-full !py-2 font-mono font-black text-center text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-900 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Reasons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1 uppercase tracking-wider">
                Penyebab Kerusakan (Defect Reason)
              </label>
              <input
                type="text"
                value={formData.defect_reason}
                onChange={(e) => handleChange('defect_reason', e.target.value)}
                placeholder="Misal: Bintik kotor, Goresan laser, Bayang"
                className="inp w-full !py-2 bg-white dark:bg-slate-900 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1 uppercase tracking-wider">
                Alasan Penggantian (Replace Reason)
              </label>
              <input
                type="text"
                value={formData.replace_reason}
                onChange={(e) => handleChange('replace_reason', e.target.value)}
                placeholder="Misal: Revisi desain, Koreksi register cetak"
                className="inp w-full !py-2 bg-white dark:bg-slate-900 rounded-xl"
              />
            </div>
          </div>

          {/* Action Buttons Form */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="btn-secondary !py-2 !px-4 rounded-xl text-xs"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary !py-2 !px-5 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white dark:bg-gradient-to-r dark:from-cyan-500 dark:to-blue-600"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isEdit ? 'Simpan Perubahan' : 'Tambahkan Job'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
