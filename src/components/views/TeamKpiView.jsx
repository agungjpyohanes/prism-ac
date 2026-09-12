import React, { useState, useMemo } from 'react';
import { SHEETS, PROD_KEYS } from '../../constants/schema';
import { parseDateVal, num, cell, fmtPeriodRange, getChartTheme, formatYMD, getRowQtyGood, getRowQtyDefect, getRowQtyReplace } from '../../utils/formatters';
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
import {
  Users,
  Search,
  Filter,
  Crown,
  Medal,
  CheckCircle2,
  AlertTriangle,
  Award,
  Calendar,
  Clock,
  X,
  Eye,
  FileSpreadsheet,
  Printer,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from 'lucide-react';
import StatCard from '../ui/StatCard';
import KpiPrintDocument from './KpiPrintDocument';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

// Penalti Poin Absensi per Kode Kehadiran
const ATTENDANCE_PENALTIES = {
  HDOK: 0,   // Hadir Tepat Waktu
  HDTL: 10,  // Hadir Terlambat > 3 mnt (-10)
  JKKR: 15,  // Jam Kerja Kurang / Telat > 1 jam (-15)
  IZSK: 10,  // Izin Sakit dgn Surat Dokter (-10)
  IZRS: 25,  // Izin Resmi / Dispensasi (-25)
  ALPA: 75,  // Alpa / Mangkir (-75)
  CUTI: 0,   // Cuti Tahunan / Resmi (0)
  OFF: 0,    // Libur Shift / Tgl Merah (0)
  LMBR: 0    // Lembur (0)
};

const ATTENDANCE_LABELS = {
  HDOK: { label: 'Hadir Tepat Waktu', color: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300' },
  HDTL: { label: 'Hadir Terlambat (> 3 mnt)', color: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300' },
  JKKR: { label: 'Jam Kerja Kurang / Telat > 1 jam', color: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-500/20 dark:text-orange-300' },
  IZSK: { label: 'Izin Sakit (dgn Surat Dokter)', color: 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-500/20 dark:text-sky-300' },
  IZRS: { label: 'Izin Resmi / Dispensasi', color: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-500/20 dark:text-purple-300' },
  ALPA: { label: 'Alpa / Mangkir', color: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-500/20 dark:text-rose-300' },
  CUTI: { label: 'Cuti Tahunan / Resmi', color: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-500/20 dark:text-blue-300' },
  OFF: { label: 'Libur Shift / Tgl Merah', color: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-500/20 dark:text-slate-300' },
  LMBR: { label: 'Lembur', color: 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-500/20 dark:text-indigo-300' }
};

// Helper Predikat Skor KPI (Standar Resmi PRISM)
// 95 – 100 : Grade A (Istimewa)
// 90 – 94  : Grade B (Baik)
// 85 – 89  : Grade C (Cukup)
// 80 – 84  : Grade D (Kurang)
// < 80     : Grade E (Sangat Kurang)
function getKpiGrade(score) {
  if (score >= 95) return { grade: 'A', label: 'Istimewa', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-400 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-400/40' };
  if (score >= 90) return { grade: 'B', label: 'Baik', badgeClass: 'bg-cyan-100 text-cyan-800 border-cyan-400 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-400/40' };
  if (score >= 85) return { grade: 'C', label: 'Cukup', badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-400 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-400/40' };
  if (score >= 80) return { grade: 'D', label: 'Kurang', badgeClass: 'bg-amber-100 text-amber-800 border-amber-400 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-400/40' };
  return { grade: 'E', label: 'Sangat Kurang', badgeClass: 'bg-rose-100 text-rose-800 border-rose-400 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40' };
}

// Helper Menentukan Level Hierarki Penilaian Personil
// Level 1: ADMIN & OPERATOR WIP (Lini 'PLATE WIP' atau Jabatan 'ADMIN')
// Level 2: OPERATOR (OP) & HELPER (PO) Lini Produksi (CTCP, SCREEN, FLEXO, CTP)
// Level 3: KOORDINATOR (Jabatan 'KOORDINATOR')
// Level 4: SUPERVISOR (Jabatan 'SUPERVISOR')
// Level 5: MANAGER (Jabatan 'MANAGER')
function getPersonilHierarchy(p) {
  const lini = String(p?.lini_mesin || '').trim().toUpperCase();
  const jabatan = String(p?.jabatan || '').trim().toUpperCase();
  const role = String(p?.role_type || p?.role || '').trim().toUpperCase();
  const nick = String(p?.nick_name || p?.nama || '').trim().toUpperCase();

  // Level 5: MANAGER
  if (
    jabatan.includes('MANAGER') ||
    jabatan.includes('KABAG') ||
    jabatan.includes('HEAD OF') ||
    jabatan === 'HEAD' ||
    nick === 'AGUNG'
  ) {
    return {
      level: 5,
      code: 'MANAGER',
      badge: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-500/20 dark:text-purple-300',
      label: 'Manager Divisi',
      qualityTitle: 'Kualitas Divisi Konsolidasian (60%)',
      isDirectProduction: false
    };
  }

  // Level 4: SUPERVISOR
  if (
    jabatan.includes('SUPERVISOR') ||
    jabatan.includes('SPV') ||
    jabatan.includes('KASIE') ||
    nick === 'DWI' ||
    nick.includes('ISWAHYUDI')
  ) {
    return {
      level: 4,
      code: 'SUPERVISOR',
      badge: 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-500/20 dark:text-indigo-300',
      label: 'Supervisor Prepress',
      qualityTitle: 'Kualitas Lini & Supervisi (60%)',
      isDirectProduction: false
    };
  }

  // Level 1: ADMIN & OPERATOR WIP (Support Non-Output Fisik, 100% Presensi)
  // 1a. Khusus Operator WIP
  if (lini === 'PLATE WIP' || lini.includes('WIP') || jabatan.includes('WIP') || nick.includes('FAJAR')) {
    return {
      level: 1,
      code: 'OPERATOR_WIP',
      badge: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-500/20 dark:text-slate-300',
      label: 'Operator WIP',
      qualityTitle: 'Pilar Kedisiplinan & Presensi (100%)',
      isDirectProduction: false
    };
  }

  // 1b. Khusus Admin Prepress / Staff
  const isAdmin =
    jabatan === 'ADMIN' ||
    jabatan.includes('ADMIN') ||
    jabatan === 'STAFF' ||
    jabatan.includes('STAFF') ||
    ['WIWIK', 'YUDHI'].includes(nick);

  if (isAdmin) {
    return {
      level: 1,
      code: 'ADMIN',
      badge: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-500/20 dark:text-slate-300',
      label: 'Admin Prepress',
      qualityTitle: 'Pilar Kedisiplinan & Presensi (100%)',
      isDirectProduction: false
    };
  }

  // Level 3: KOORDINATOR (TRI BOWO, dll - bukan Admin/Support)
  const isKoordinator =
    jabatan.includes('KOORDINATOR') ||
    jabatan.includes('KORD') ||
    jabatan.includes('LEADER') ||
    (nick === 'BOWO' && !jabatan.includes('ADMIN'));

  if (isKoordinator) {
    return {
      level: 3,
      code: 'KOORDINATOR',
      badge: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-500/20 dark:text-blue-300',
      label: 'Koordinator Lini',
      qualityTitle: 'Kualitas Agregat Seluruh Lini (60%)',
      isDirectProduction: false
    };
  }

  // Level 2: OPERATOR & PO HELPER Lini Produksi (CTCP, SCREEN, FLEXO, CTP)
  const isPo = role === 'PO' || jabatan === 'PO' || role.includes('HELPER') || jabatan.includes('HELPER') || jabatan.includes('PO');
  return {
    level: 2,
    code: isPo ? 'PO_HELPER' : 'OPERATOR',
    badge: isPo
      ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300'
      : 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300',
    label: isPo ? 'PO Helper Produksi' : 'Operator Produksi',
    qualityTitle: 'Skor Kualitas Fisik Perorangan (60%)',
    isDirectProduction: true
  };
}

// Standarisasi pengelompokan filter peran: 'ALL' | 'OP' | 'PO' | 'STAFF'
function categorizePersonilRole(p) {
  const jabatanUpper = String(p?.jabatan || '').trim().toUpperCase();
  const roleUpper = String(p?.role || p?.role_type || '').trim().toUpperCase();
  const liniUpper = String(p?.lini_mesin || '').trim().toUpperCase();
  const nickUpper = String(p?.nick_name || p?.nama || '').trim().toUpperCase();

  // 1. KATEGORI STAFF (Murni Manajemen & Administrasi: Manager, Supervisor, Koordinator, Admin)
  const isStaff =
    jabatanUpper.includes('MANAGER') ||
    jabatanUpper.includes('SUPERVISOR') ||
    jabatanUpper.includes('KOORDINATOR') ||
    jabatanUpper.includes('ADMIN') ||
    jabatanUpper === 'STAFF' ||
    jabatanUpper.includes('KABAG') ||
    jabatanUpper.includes('HEAD') ||
    jabatanUpper.includes('SPV') ||
    jabatanUpper.includes('KASIE') ||
    jabatanUpper.includes('KORD') ||
    jabatanUpper.includes('LEADER') ||
    ['AGUNG', 'DWI', 'BOWO', 'YUDHI', 'WIWIK'].includes(nickUpper);

  if (isStaff) return 'STAFF';

  // 2. KATEGORI HELPER (PO / PO Helper Produksi)
  const isHelper =
    roleUpper === 'PO' ||
    jabatanUpper === 'PO' ||
    roleUpper.includes('HELPER') ||
    jabatanUpper.includes('HELPER') ||
    p?.hierarchy?.code === 'PO_HELPER';

  if (isHelper) return 'PO';

  // 3. KATEGORI OPERATOR (OP - Termasuk Operator Lini Fisik & Operator Plate WIP)
  const isOperator =
    roleUpper === 'OP' ||
    jabatanUpper === 'OP' ||
    roleUpper.includes('OPERATOR') ||
    jabatanUpper.includes('OPERATOR') ||
    liniUpper === 'PLATE WIP' ||
    liniUpper.includes('WIP') ||
    jabatanUpper.includes('WIP') ||
    p?.hierarchy?.code === 'OPERATOR' ||
    p?.hierarchy?.code === 'OPERATOR_WIP' ||
    nickUpper.includes('FAJAR') ||
    nickUpper.includes('SUTARWO');

  if (isOperator) return 'OP';

  return 'OP';
}

// Konversi tanggal ke format standar YYYY-MM-DD
function toIsoDateStr(val) {
  if (!val) return '';
  if (typeof val === 'string') {
    const s = val.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  }
  const d = parseDateVal(val);
  if (!d || isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function TeamKpiView({ data = {}, user, period, onOpenList }) {
  // Sub-tabs: 'ranking' | 'all_personnel' | 'podium' | 'shift_analytics'
  const [activeTab, setActiveTab] = useState('ranking');

  // Filters: 'ALL' | 'OP' | 'PO' | 'STAFF'
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [divisionFilter, setDivisionFilter] = useState('ALL');
  const [machineFilter, setMachineFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('final_kpi'); // 'final_kpi' | 'skor_kualitas' | 'skor_absensi' | 'good'

  // Search untuk tab Semua Personil
  const [personnelSearch, setPersonnelSearch] = useState('');
  const [personnelMachineFilter, setPersonnelMachineFilter] = useState('ALL');

  // Modal State untuk Personal Detail & Rekap Absensi
  const [selectedPersonil, setSelectedPersonil] = useState(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Normalisasi filter rentang tanggal dashboard ke format YYYY-MM-DD
  const periodFromStr = useMemo(() => formatYMD(period?.from), [period?.from]);
  const periodToStr = useMemo(() => formatYMD(period?.to), [period?.to]);

  // =========================================================================
  // 1. UNIQUE KEY & INTEGRITAS DATA MASTER (rec_personil)
  // =========================================================================
  const personilMasterList = useMemo(() => {
    const rawPersonil = data.rec_personil || [];
    const list = [];
    const seenIds = new Set();

    rawPersonil.forEach((r, idx) => {
      let id = '', nick_name = '', nama_lengkap = '', jabatan = '', divisi = 'PREPRESS', lini_mesin = '-', nik_lama = '-', nik_baru = '-', status_nik = '-', role_type = 'OP';

      if (r && typeof r === 'object' && !Array.isArray(r)) {
        id = String(r.id || `prs_${idx + 1}`).trim();
        nick_name = String(r.nick_name || r.nama || r.nickname || '').trim();
        nama_lengkap = String(r.nama_lengkap || r.full_name || r.nama || nick_name || `Personil ${idx + 1}`).trim();
        jabatan = String(r.jabatan || r.position || 'Operator Prepress').trim();
        divisi = String(r.divisi || r.division || 'PREPRESS').trim().toUpperCase();
        lini_mesin = String(r.lini_mesin || r.mesin || r.machine || '-').trim();
        nik_lama = String(r.nik_lama || '-').trim();
        nik_baru = String(r.nik_baru || '-').trim();
        status_nik = String(r.status_nik || r.statusnik || '-').trim();
        role_type = String(r.role_type || r.role || 'OP').trim().toUpperCase();
      } else if (Array.isArray(r)) {
        id = cell(r, 0, `prs_${idx + 1}`);
        nick_name = cell(r, 1, '').trim();
        nama_lengkap = cell(r, 2, nick_name || `Personil ${idx + 1}`).trim();
        jabatan = cell(r, 3, 'Operator Prepress').trim();
        divisi = cell(r, 4, 'PREPRESS').trim().toUpperCase();
        lini_mesin = cell(r, 5, '-').trim();
        nik_lama = cell(r, 6, '-').trim();
        nik_baru = cell(r, 7, '-').trim();
        status_nik = cell(r, 8, '-').trim();
        role_type = cell(r, 9, 'OP').trim().toUpperCase();
      }

      if (!id) id = `prs_${idx + 1}`;
      if (seenIds.has(id)) {
        id = `${id}_${idx + 1}`;
      }
      seenIds.add(id);

      list.push({
        id, // UNIQUE KEY untuk state management & React key
        nick_name: nick_name || nama_lengkap,
        nama: nick_name || nama_lengkap,
        nama_lengkap: nama_lengkap || nick_name || `Personil ${idx + 1}`,
        jabatan: jabatan || 'Operator Prepress',
        divisi: divisi || 'PREPRESS',
        lini_mesin: lini_mesin || '-',
        nik_lama: nik_lama || '-',
        nik_baru: nik_baru || '-',
        status_nik: status_nik || '-',
        role_type: role_type.includes('PO') || role_type.includes('HELP') ? 'PO' : 'OP'
      });
    });

    return list;
  }, [data.rec_personil]);

  // =========================================================================
  // 2. PENYESUAIAN SKEMA & RELASI DATA ABSENSI BERBASIS personil.id
  // =========================================================================
  const rekapByPersonilId = useMemo(() => {
    const rawAbsensi = data.rec_absensi || [];
    const rekap = {};

    // Inisialisasi map untuk seluruh personil master berdasarkan personil.id
    personilMasterList.forEach((p) => {
      rekap[p.id] = {
        totalPenalty: 0,
        logs: [],
        counts: { HDOK: 0, HDTL: 0, JKKR: 0, IZSK: 0, IZRS: 0, ALPA: 0, CUTI: 0, OFF: 0, LMBR: 0 }
      };
    });

    // Helper normalisasi kode status yang ketat
    const normalizeStatusCode = (rawCode, ket = '') => {
      const s = String(rawCode || '').trim().toUpperCase();
      const k = String(ket || '').trim().toUpperCase();

      if (!s && !k) return null;

      // 1. Exact matches kode resmi
      if (['HDOK', 'HDTL', 'JKKR', 'IZSK', 'IZRS', 'ALPA', 'CUTI', 'OFF', 'LMBR'].includes(s)) {
        return s;
      }

      // 2. Deteksi Ketidakhadiran / Pelanggaran / Izin
      if (s.includes('ALPA') || s.includes('MANGKIR') || s === 'TK' || s === 'A' || k.includes('ALPA') || k.includes('MANGKIR') || k.includes('TANPA KETERANGAN')) return 'ALPA';
      if (s.includes('IZRS') || s.includes('DISPENSASI') || s.includes('IZIN RESMI') || k.includes('IZIN RESMI') || k.includes('DISPENSASI') || k.includes('TUGAS LUAR')) return 'IZRS';
      if (s.includes('IZSK') || s.includes('SAKIT') || s.includes('DOKTER') || s === 'S' || k.includes('SAKIT') || k.includes('SURAT DOKTER')) return 'IZSK';
      if (s.includes('JKKR') || s.includes('JAM KURANG') || s.includes('PULANG CEPAT') || s.includes('TELAT > 1') || k.includes('JAM KERJA KURANG')) return 'JKKR';
      if (s.includes('HDTL') || s.includes('TERLAMBAT') || s.includes('TELAT') || s === 'T' || k.includes('TERLAMBAT') || k.includes('TELAT')) return 'HDTL';
      if (s.includes('CUTI') || s.includes('TAHUNAN') || s === 'C' || k.includes('CUTI')) return 'CUTI';
      if (s.includes('OFF') || s.includes('LIBUR') || s.includes('MERAH') || k.includes('LIBUR')) return 'OFF';
      if (s.includes('LMBR') || s.includes('LEMBUR') || s.includes('OVERTIME') || s === 'OT' || k.includes('LEMBUR')) return 'LMBR';
      if (s.includes('HDOK') || s.includes('HADIR') || s.includes('MASUK') || s === 'H') return 'HDOK';

      return null;
    };

    // 1. Filter baris data absensi berdasarkan rentang tanggal aktif (range operator)
    const filteredAbsensi = (rawAbsensi || []).filter((r) => {
      if (!r) return false;
      let rawDate = '';
      if (typeof r === 'object' && !Array.isArray(r)) {
        rawDate = r.date || r.tanggal || r.tgl || '';
      } else if (Array.isArray(r)) {
        rawDate = r[1] || '';
      }
      const rowDateStr = (rawDate ? formatYMD(rawDate) : '').substring(0, 10);
      if (periodFromStr && periodToStr && rowDateStr) {
        return rowDateStr >= periodFromStr && rowDateStr <= periodToStr;
      }
      return true;
    });

    // 2. Kumpulkan semua baris absensi ke dalam array (absensiMap) per nick_name
    const absensiMap = {};
    filteredAbsensi.forEach((r) => {
      let rawDate = '', rawNick = '', rawCode = '', ket = '', masuk = '', pulang = '';
      if (typeof r === 'object' && !Array.isArray(r)) {
        rawDate = r.date || r.tanggal || r.tgl || '';
        rawNick = String(r.nick_name || r.nama || r.nickname || '').trim();
        rawCode = String(r.status_presensi || r.kode || r.kode_status || r.status_kehadiran || r.status || r.kode_absensi || '').trim().toUpperCase();
        ket = r.keterangan || r.notes || r.alasan || r.ket || '';
        masuk = r.jam_masuk || r.masuk || '';
        pulang = r.jam_pulang || r.pulang || '';
      } else if (Array.isArray(r)) {
        rawDate = r[1];
        rawNick = cell(r, 2, '').trim();
        rawCode = cell(r, 3, '').trim().toUpperCase();
        ket = cell(r, 4, '');
        masuk = cell(r, 5, '');
        pulang = cell(r, 6, '');
      }

      if (!rawNick) return;
      const key = rawNick.toUpperCase();
      if (!absensiMap[key]) absensiMap[key] = [];
      absensiMap[key].push({
        rawDate,
        rawNick,
        rawCode,
        ket,
        masuk,
        pulang,
        date: (rawDate ? formatYMD(rawDate) : '').substring(0, 10)
      });
    });

    // 3. Iterasi setiap personil dan proses semua list absensinya
    personilMasterList.forEach((p) => {
      const pNick = String(p.nick_name || p.nama || '').trim().toUpperCase();
      const pFull = String(p.nama_lengkap || '').trim().toUpperCase();
      const targetEntry = rekap[p.id];
      if (!targetEntry) return;

      const matchedRecords = [];
      Object.keys(absensiMap).forEach((absKey) => {
        if (
          absKey === pNick ||
          absKey === pFull ||
          absKey.startsWith(pNick) ||
          pFull.startsWith(absKey) ||
          (pNick && pNick.length >= 3 && absKey.includes(pNick)) ||
          (pFull && pFull.length >= 3 && absKey.includes(pFull))
        ) {
          matchedRecords.push(...absensiMap[absKey]);
        }
      });

      // Urutkan catatan kehadiran berdasarkan tanggal
      matchedRecords
        .sort((a, b) => (a.date > b.date ? 1 : -1))
        .forEach((item) => {
          const statusCode = normalizeStatusCode(item.rawCode, item.ket);
          if (!statusCode) return;

          const penaltyVal = ATTENDANCE_PENALTIES[statusCode] !== undefined ? ATTENDANCE_PENALTIES[statusCode] : 0;
          targetEntry.totalPenalty += penaltyVal;
          targetEntry.counts[statusCode] = (targetEntry.counts[statusCode] || 0) + 1;

          targetEntry.logs.push({
            date: item.date || '-',
            status: statusCode,
            penalty: penaltyVal,
            ket: item.ket || ATTENDANCE_LABELS[statusCode]?.label || '-',
            masuk: item.masuk,
            pulang: item.pulang
          });
        });
    });

    return rekap;
  }, [data.rec_absensi, personilMasterList, periodFromStr, periodToStr]);

  // =========================================================================
  // 3. AGREGASI DATA HASIL KERJA / PRODUKSI DENGAN PILAR KUALITAS
  // =========================================================================
  const productionStatsByPersonilId = useMemo(() => {
    const map = {}; // personil.id -> { good, defect, replace, defectPenalty, jobRows, shiftCounts }

    personilMasterList.forEach((p) => {
      map[p.id] = { good: 0, defect: 0, replace: 0, defectPenalty: 0, jobRows: [], shiftCounts: {} };
    });

    PROD_KEYS.forEach((sheetKey) => {
      const cfg = SHEETS[sheetKey];
      const rows = data[sheetKey] || [];
      const poCol = cfg?.i?.po ?? cfg?.i?.po_helper ?? -1;

      (rows || []).forEach((r) => {
        if (!r || typeof r !== 'object') return;
        const idVal = cell(r, cfg?.i?.id, '').trim();
        const jopVal = cell(r, cfg?.i?.jop, '').trim();
        const noJopVal = cell(r, cfg?.i?.nojop, '').trim();
        if (!idVal || idVal === '-' || (!jopVal && !noJopVal) || (jopVal === '-' && noJopVal === '-')) return;

        // Filter rentang tanggal
        const dateVal = cell(r, cfg?.i?.date, '');
        const dStr = formatYMD(dateVal);
        if (periodFromStr && periodToStr && dStr) {
          if (dStr < periodFromStr || dStr > periodToStr) return;
        }

        const g = getRowQtyGood(r, cfg);
        const rj = getRowQtyDefect(r, cfg);
        const rp = getRowQtyReplace(r, cfg);
        const shiftVal = cell(r, cfg?.i?.shift, 'NON-SHIFT').toUpperCase().trim();

        const opRaw = cell(r, cfg?.i?.op || cfg?.i?.operator, '').trim().toLowerCase();
        const poRaw = (poCol !== -1 ? cell(r, poCol, '') : '').trim().toLowerCase();

        const opValid = opRaw && opRaw !== '-' && opRaw !== 'unassigned';
        const poValid = poRaw && poRaw !== '-' && poRaw !== 'tanpa po';

        const recordItem = {
          key: sheetKey,
          process: cfg?.label || sheetKey,
          job: jopVal || noJopVal,
          date: dateVal,
          good: g,
          reject: rj,
          replace: rp,
          shift: shiftVal,
          raw: r
        };

        const matchedOp = opValid ? personilMasterList.find(p => (p.nick_name || '').toLowerCase() === opRaw || (p.nama_lengkap || '').toLowerCase() === opRaw) : null;
        const matchedPo = poValid ? personilMasterList.find(p => (p.nick_name || '').toLowerCase() === poRaw || (p.nama_lengkap || '').toLowerCase() === poRaw) : null;

        if (matchedOp && matchedPo) {
          // OP Shared (3.5 penalti)
          const opStat = map[matchedOp.id];
          if (opStat) {
            opStat.good += g;
            opStat.defect += rj;
            opStat.replace += rp;
            opStat.defectPenalty += rj * 3.5;
            opStat.shiftCounts[shiftVal] = (opStat.shiftCounts[shiftVal] || 0) + 1;
            opStat.jobRows.push(recordItem);
          }
          // PO Shared (1.5 penalti)
          const poStat = map[matchedPo.id];
          if (poStat) {
            poStat.good += g;
            poStat.defect += rj;
            poStat.replace += rp;
            poStat.defectPenalty += rj * 1.5;
            poStat.shiftCounts[shiftVal] = (poStat.shiftCounts[shiftVal] || 0) + 1;
            poStat.jobRows.push(recordItem);
          }
        } else if (matchedOp) {
          // OP Mandiri (5.0 penalti)
          const opStat = map[matchedOp.id];
          if (opStat) {
            opStat.good += g;
            opStat.defect += rj;
            opStat.replace += rp;
            opStat.defectPenalty += rj * 5.0;
            opStat.shiftCounts[shiftVal] = (opStat.shiftCounts[shiftVal] || 0) + 1;
            opStat.jobRows.push(recordItem);
          }
        } else if (matchedPo) {
          const poStat = map[matchedPo.id];
          if (poStat) {
            poStat.good += g;
            poStat.defect += rj;
            poStat.replace += rp;
            poStat.defectPenalty += rj * 1.5;
            poStat.shiftCounts[shiftVal] = (poStat.shiftCounts[shiftVal] || 0) + 1;
            poStat.jobRows.push(recordItem);
          }
        }
      });
    });

    return map;
  }, [data, personilMasterList, periodFromStr, periodToStr]);

  // =========================================================================
  // 4. PENGHITUNGAN LENGKAP KPI & SKOR ABSENSI SETIAP PERSONIL
  // =========================================================================
  const fullKpiCalculatedList = useMemo(() => {
    // PASS 1: Hitung statistik dasar presensi, output fisik, & identifikasi level hierarki
    const baseList = personilMasterList.map((personil) => {
      const prodStat = productionStatsByPersonilId[personil.id] || {
        good: 0,
        defect: 0,
        replace: 0,
        defectPenalty: 0,
        jobRows: [],
        shiftCounts: {}
      };

      const attStat = rekapByPersonilId[personil.id] || {
        totalPenalty: 0,
        logs: [],
        counts: { HDOK: 0, HDTL: 0, JKKR: 0, IZSK: 0, IZRS: 0, ALPA: 0, CUTI: 0, OFF: 0, LMBR: 0 }
      };

      const countHDOK = attStat.counts?.HDOK || 0;
      const countHDTL = attStat.counts?.HDTL || 0;
      const countJKKR = attStat.counts?.JKKR || 0;
      const countIZSK = attStat.counts?.IZSK || 0;
      const countIZRS = attStat.counts?.IZRS || 0;
      const countALPA = attStat.counts?.ALPA || 0;
      const countLMBR = attStat.counts?.LMBR || 0;

      const totalHariKerja = countHDOK + countHDTL + countJKKR + countIZSK + countIZRS + countALPA + countLMBR;
      const poinPengurangan = (countHDTL * 10) + (countJKKR * 15) + (countIZSK * 10) + (countIZRS * 25) + (countALPA * 75);

      let skorKedisiplinan = 0;
      if (totalHariKerja === 0) {
        skorKedisiplinan = 0;
      } else if (poinPengurangan === 0 || countHDOK === totalHariKerja) {
        skorKedisiplinan = 100;
      } else {
        skorKedisiplinan = Math.max(0, 100 - poinPengurangan);
      }

      const totalOutput = prodStat.good + prodStat.defect;
      const rejectRate = totalOutput > 0 ? Number(((prodStat.defect / totalOutput) * 100).toFixed(2)) : 0;
      const isRejectAman = rejectRate <= 0.5;

      const hierarchy = getPersonilHierarchy(personil);

      // Hitung skor kualitas individu untuk Level 2 (Operator & PO)
      let individualQuality = 0;
      let baseYieldRate = 0;
      if (totalOutput > 0) {
        baseYieldRate = (prodStat.good / totalOutput) * 100;
        individualQuality = Math.max(0, Math.min(100, baseYieldRate - prodStat.defectPenalty));
      } else if (totalHariKerja > 0) {
        baseYieldRate = 100;
        individualQuality = 100;
      } else {
        baseYieldRate = 0;
        individualQuality = 0;
      }

      return {
        ...personil,
        hierarchy,
        good: prodStat.good,
        defect: prodStat.defect,
        replace: prodStat.replace,
        totalOutput,
        baseYieldRate,
        rejectRate,
        isRejectAman,
        defectPenalty: prodStat.defectPenalty,
        totalHariKerja,
        skor_absensi: Number(skorKedisiplinan.toFixed(1)),
        attendancePenalties: poinPengurangan,
        attendanceCounts: attStat.counts,
        attendanceLogs: attStat.logs,
        jobRows: prodStat.jobRows,
        individualQuality: Number(individualQuality.toFixed(1))
      };
    });

    // PASS 2: Rata-rata Kualitas Lini (Level 2 Operator & PO yang aktif bekerja / memiliki output)
    const activeLevel2 = baseList.filter((p) => p.hierarchy.level === 2 && (p.totalHariKerja > 0 || p.totalOutput > 0));
    const avgKualitasLini = activeLevel2.length > 0
      ? activeLevel2.reduce((acc, p) => acc + p.individualQuality, 0) / activeLevel2.length
      : 100;

    // PASS 3: Hitung Skor Kualitas & Final KPI untuk Level 1, Level 2, dan Level 3 (Koordinator)
    const pass3List = baseList.map((p) => {
      let skorKualitas = 0;
      let finalKpi = 0;

      if (p.hierarchy.level === 1) {
        // Level 1: ADMIN & OPERATOR WIP -> 100% Skor Kedisiplinan
        skorKualitas = p.skor_absensi;
        finalKpi = p.totalHariKerja > 0 ? p.skor_absensi : 0;
      } else if (p.hierarchy.level === 2) {
        // Level 2: OPERATOR & HELPER -> 60% Kualitas Individu + 40% Kedisiplinan
        skorKualitas = p.individualQuality;
        if (p.totalHariKerja === 0 && p.totalOutput === 0) {
          finalKpi = 0;
        } else {
          finalKpi = (0.60 * skorKualitas) + (0.40 * p.skor_absensi);
        }
      } else if (p.hierarchy.level === 3) {
        // Level 3: KOORDINATOR -> 60% Avg_Kualitas_Lini + 40% Kedisiplinan
        skorKualitas = avgKualitasLini;
        if (p.totalHariKerja === 0) {
          finalKpi = 0;
        } else {
          finalKpi = (0.60 * skorKualitas) + (0.40 * p.skor_absensi);
        }
      }

      return {
        ...p,
        skor_kualitas: Number(skorKualitas.toFixed(1)),
        final_kpi: Number(finalKpi.toFixed(1))
      };
    });

    // PASS 4: Rata-rata KPI Koordinator aktif
    const activeLevel3 = pass3List.filter((p) => p.hierarchy.level === 3 && p.totalHariKerja > 0);
    const avgKpiKoordinator = activeLevel3.length > 0
      ? activeLevel3.reduce((acc, p) => acc + p.final_kpi, 0) / activeLevel3.length
      : avgKualitasLini;

    // Hitung Skor Kualitas & Final KPI untuk Level 4 (Supervisor)
    const kualitasSupervisor = (avgKualitasLini + avgKpiKoordinator) / 2;

    const pass4List = pass3List.map((p) => {
      if (p.hierarchy.level === 4) {
        // Level 4: SUPERVISOR -> 60% (Avg_Kualitas_Lini + Final_KPI_Koordinator)/2 + 40% Kedisiplinan
        const skorKualitas = kualitasSupervisor;
        const finalKpi = p.totalHariKerja > 0 ? (0.60 * skorKualitas) + (0.40 * p.skor_absensi) : 0;
        return {
          ...p,
          skor_kualitas: Number(skorKualitas.toFixed(1)),
          final_kpi: Number(finalKpi.toFixed(1))
        };
      }
      return p;
    });

    // PASS 5: Rata-rata KPI Supervisor aktif
    const activeLevel4 = pass4List.filter((p) => p.hierarchy.level === 4 && p.totalHariKerja > 0);
    const avgKpiSupervisor = activeLevel4.length > 0
      ? activeLevel4.reduce((acc, p) => acc + p.final_kpi, 0) / activeLevel4.length
      : kualitasSupervisor;

    // Hitung Skor Kualitas & Final KPI untuk Level 5 (Manager)
    const kualitasManager = (avgKualitasLini + avgKpiKoordinator + avgKpiSupervisor) / 3;

    return pass4List.map((p) => {
      let skorKualitas = p.skor_kualitas;
      let finalKpi = p.final_kpi;

      if (p.hierarchy.level === 5) {
        // Level 5: MANAGER -> 60% (Avg_Kualitas_Lini + Final_KPI_Koordinator + Final_KPI_Supervisor)/3 + 40% Kedisiplinan
        skorKualitas = kualitasManager;
        finalKpi = p.totalHariKerja > 0 ? (0.60 * skorKualitas) + (0.40 * p.skor_absensi) : 0;
      }

      const roundedKpi = Number(finalKpi.toFixed(1));
      const gradeInfo = getKpiGrade(roundedKpi);

      return {
        ...p,
        skor_kualitas: Number(skorKualitas.toFixed(1)),
        final_kpi: roundedKpi,
        grade: gradeInfo.grade,
        gradeLabel: gradeInfo.label,
        gradeBadgeClass: gradeInfo.badgeClass
      };
    });
  }, [personilMasterList, productionStatsByPersonilId, rekapByPersonilId]);

  // List Unik Divisi & Lini untuk Dropdown Filter
  const availableDivisions = useMemo(() => {
    const set = new Set();
    personilMasterList.forEach((p) => { if (p.divisi) set.add(p.divisi); });
    return Array.from(set).sort();
  }, [personilMasterList]);

  const availableMachines = useMemo(() => {
    const set = new Set(['CTCP', 'SCREEN', 'FLEXO & ETCHING', 'PLATE WIP', 'CTP']);
    personilMasterList.forEach((p) => {
      if (p.lini_mesin && p.lini_mesin !== '-' && p.lini_mesin.toUpperCase() !== 'NULL') {
        set.add(p.lini_mesin);
      }
    });
    return Array.from(set).filter(Boolean).sort();
  }, [personilMasterList]);

  // Hitung jumlah personil untuk masing-masing tab filter peran
  const roleCounts = useMemo(() => {
    const counts = { ALL: fullKpiCalculatedList.length, OP: 0, PO: 0, STAFF: 0 };
    fullKpiCalculatedList.forEach((p) => {
      const cat = categorizePersonilRole(p);
      if (counts[cat] !== undefined) {
        counts[cat]++;
      }
    });
    return counts;
  }, [fullKpiCalculatedList]);

  // =========================================================================
  // 5. FILTERING DATA TABEL
  // =========================================================================
  const filteredAndSortedList = useMemo(() => {
    let result = fullKpiCalculatedList.filter((p) => {
      const cat = categorizePersonilRole(p);
      if (roleFilter !== 'ALL' && cat !== roleFilter) return false;
      if (divisionFilter !== 'ALL' && p.divisi !== divisionFilter) return false;
      if (machineFilter !== 'ALL' && p.lini_mesin !== machineFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.nama.toLowerCase().includes(q) || p.nama_lengkap.toLowerCase().includes(q) || p.nick_name.toLowerCase().includes(q);
        const matchNik = p.nik_baru.toLowerCase().includes(q) || p.nik_lama.toLowerCase().includes(q);
        const matchJabatan = p.jabatan.toLowerCase().includes(q);
        if (!matchName && !matchNik && !matchJabatan) return false;
      }
      return true;
    });

    result.sort((a, b) => {
      if (sortBy === 'final_kpi') return b.final_kpi - a.final_kpi;
      if (sortBy === 'skor_kualitas') return b.skor_kualitas - a.skor_kualitas;
      if (sortBy === 'skor_absensi') return b.skor_absensi - a.skor_absensi;
      if (sortBy === 'good') return b.good - a.good;
      return b.final_kpi - a.final_kpi;
    });

    return result;
  }, [fullKpiCalculatedList, roleFilter, divisionFilter, machineFilter, searchQuery, sortBy]);

  const filteredPersonnelMaster = useMemo(() => {
    return fullKpiCalculatedList.filter((p) => {
      if (personnelMachineFilter !== 'ALL') {
        const itemLini = String(p.lini_mesin || '').trim().toUpperCase();
        const selected = personnelMachineFilter.trim().toUpperCase();
        if (selected === 'CTCP' && !itemLini.includes('CTCP')) return false;
        else if (selected === 'SCREEN' && !itemLini.includes('SCREEN')) return false;
        else if (selected === 'FLEXO & ETCHING' && !itemLini.includes('FLEXO') && !itemLini.includes('ETCH')) return false;
        else if (selected === 'PLATE WIP' && !itemLini.includes('WIP') && !itemLini.includes('PLATE')) return false;
        else if (selected === 'CTP' && !itemLini.includes('CTP')) return false;
        else if (selected !== 'CTCP' && selected !== 'SCREEN' && selected !== 'FLEXO & ETCHING' && selected !== 'PLATE WIP' && selected !== 'CTP') {
          if (!itemLini.includes(selected) && !selected.includes(itemLini)) return false;
        }
      }

      if (personnelSearch.trim()) {
        const q = personnelSearch.toLowerCase();
        const matchName = p.nama.toLowerCase().includes(q) || p.nama_lengkap.toLowerCase().includes(q) || p.nick_name.toLowerCase().includes(q);
        const matchNik = p.nik_baru.toLowerCase().includes(q) || p.nik_lama.toLowerCase().includes(q);
        const matchDiv = p.divisi.toLowerCase().includes(q) || p.lini_mesin.toLowerCase().includes(q);
        const matchJab = p.jabatan.toLowerCase().includes(q);
        if (!matchName && !matchNik && !matchDiv && !matchJab) return false;
      }
      return true;
    });
  }, [fullKpiCalculatedList, personnelMachineFilter, personnelSearch]);

  // Statistik Ringkasan Tim
  const teamMetrics = useMemo(() => {
    const totalPersons = fullKpiCalculatedList.length;
    if (totalPersons === 0) return { avgKpi: 0, avgQuality: 0, avgAttendance: 0, totalGood: 0, totalDefect: 0, totalPersons: 0, rejectRate: 0, isRejectAman: true };

    let sumKpi = 0, sumQ = 0, sumAtt = 0, totalGood = 0, totalDefect = 0;
    fullKpiCalculatedList.forEach((p) => {
      sumKpi += p.final_kpi;
      sumQ += p.skor_kualitas;
      sumAtt += p.skor_absensi;
      totalGood += p.good;
      totalDefect += p.defect;
    });

    const totalProdOutput = totalGood + totalDefect;
    const rejectRate = totalProdOutput > 0 ? Number(((totalDefect / totalProdOutput) * 100).toFixed(2)) : 0;
    const isRejectAman = rejectRate <= 0.5;

    return {
      avgKpi: Number((sumKpi / totalPersons).toFixed(1)),
      avgQuality: Number((sumQ / totalPersons).toFixed(1)),
      avgAttendance: Number((sumAtt / totalPersons).toFixed(1)),
      totalGood,
      totalDefect,
      totalPersons,
      rejectRate,
      isRejectAman
    };
  }, [fullKpiCalculatedList]);

  // Filter Kualifikasi Podium Bintang (Hanya Operator & PO Helper yang menghasilkan direct output produksi)
  const isEligiblePodium = (p) => {
    if (!p) return false;
    // 1. HANYA Level 2: OPERATOR & PO HELPER yang memproduksi direct output fisik
    if (p.hierarchy?.level !== 2 || !p.hierarchy?.isDirectProduction) return false;

    const lini = String(p.lini_mesin || '').trim().toUpperCase();
    const nick = String(p.nick_name || p.nama || '').trim().toUpperCase();

    // 2. Kecualikan lini non-produksi & PLATE WIP
    if (lini === 'PLATE WIP' || lini.includes('WIP') || lini === '-' || !lini) return false;

    // 3. Kecualikan personil non-teknis
    if (['AGUNG', 'DWI', 'BOWO', 'YUDHI', 'WIWIK', 'FAJAR'].some((n) => nick.includes(n))) return false;

    // 4. Harus aktif memiliki hari kerja atau output pada periode berjalan
    if (p.totalHariKerja === 0 && p.totalOutput === 0) return false;

    return true;
  };

  // Top 3 Podium Performers (Khusus Operator & PO Helper teknis produksi)
  const topThreePerformers = useMemo(() => {
    return fullKpiCalculatedList
      .filter(isEligiblePodium)
      .sort((a, b) => b.final_kpi - a.final_kpi)
      .slice(0, 3);
  }, [fullKpiCalculatedList]);

  // Reactive Selected Personil Object for Modal
  const activeSelectedPersonil = useMemo(() => {
    if (!selectedPersonil) return null;
    return fullKpiCalculatedList.find((p) => p.id === selectedPersonil.id) || selectedPersonil;
  }, [selectedPersonil, fullKpiCalculatedList]);

  // Handler Cetak Dokumen Formal KPI dengan Metode Iframe Isolasi & Penamaan File Otomatis
  const handlePrintKpi = () => {
    if (!activeSelectedPersonil) return;

    const fromStr = formatYMD(period?.from);
    const periodeStr = (fromStr || '2026-08').substring(0, 7);
    const cleanNick = String(activeSelectedPersonil.nick_name || activeSelectedPersonil.nama || 'PERSONIL').trim().toUpperCase().replace(/\s+/g, '_');
    const nikBaru = String(activeSelectedPersonil.nik_baru && activeSelectedPersonil.nik_baru !== '-' ? activeSelectedPersonil.nik_baru : (activeSelectedPersonil.nik_lama || 'NIK')).trim();
    const dynamicFileName = `KPI_${cleanNick}_${nikBaru}_${periodeStr}`;

    const printElement = document.getElementById('printable-kpi-sheet');
    if (!printElement) {
      // Fallback standard print
      const orig = window.document.title;
      window.document.title = dynamicFileName;
      window.print();
      setTimeout(() => {
        window.document.title = orig;
      }, 1500);
      return;
    }

    try {
      // 1. Simpan judul window utama saat ini
      const originalDocumentTitle = window.document.title;

      // 2. Set judul window utama agar browser mengambil nama file default ini saat download/cetak
      window.document.title = dynamicFileName;

      // 3. Buat iframe terisolasi di background
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.visibility = 'hidden';
      iframe.setAttribute('aria-hidden', 'true');
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

      // Kumpulkan seluruh stylesheet aplikasi
      let stylesHtml = '';
      document.querySelectorAll('link[rel="stylesheet"], style').forEach((node) => {
        stylesHtml += node.outerHTML;
      });

      const cleanHtml = `
        <!DOCTYPE html>
        <html lang="id" style="background-color: #ffffff !important; background: #ffffff !important; margin: 0; padding: 0;">
          <head>
            <meta charset="utf-8" />
            <title>${dynamicFileName}</title>
            ${stylesHtml}
            <style>
              @page {
                size: A4 portrait;
                margin: 0 !important; /* WAJIB 0 agar browser tidak mencetak date/time, url, dan header file */
              }
              *, *::before, *::after, html, body {
                box-sizing: border-box !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                background-color: #ffffff !important;
                background: #ffffff !important;
                color: #000000 !important;
              }
              html {
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
              }
              body {
                margin: 0 !important;
                /* Pindahkan margin 1.5 cm ke padding fisik body kertas A4 */
                padding: 12mm 15mm 12mm 15mm !important;
                font-family: Arial, Calibri, 'Helvetica Neue', Helvetica, sans-serif !important;
                width: 210mm !important;
                height: 297mm !important;
                max-width: 210mm !important;
                max-height: 297mm !important;
                overflow: hidden !important;
                background-color: #ffffff !important;
                background: #ffffff !important;
              }
              #printable-kpi-sheet {
                background-color: #ffffff !important;
                background: #ffffff !important;
                color: #000000 !important;
                border: none !important;
                outline: none !important;
                box-shadow: none !important;
                margin: 0 !important;
                padding: 0 !important;
                width: 100% !important;
                height: 100% !important;
                max-height: 273mm !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: space-between !important;
                overflow: hidden !important;
              }
            </style>
          </head>
          <body style="background-color: #ffffff !important; background: #ffffff !important; margin: 0; padding: 12mm 15mm;">
            ${printElement.outerHTML}
          </body>
        </html>
      `;

      iframeDoc.open();
      iframeDoc.write(cleanHtml);
      iframeDoc.close();

      const triggerPrint = () => {
        try {
          // Pastikan judul pada iframe dan window utama tetap sinkron
          window.document.title = dynamicFileName;
          if (iframe.contentDocument) {
            iframe.contentDocument.title = dynamicFileName;
          }
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
        } catch (err) {
          console.error('Iframe print focus error, fallback to window.print:', err);
          window.document.title = dynamicFileName;
          window.print();
        } finally {
          setTimeout(() => {
            window.document.title = originalDocumentTitle;
            if (iframe && iframe.parentNode) {
              iframe.parentNode.removeChild(iframe);
            }
          }, 1500);
        }
      };

      if (iframeDoc.readyState === 'complete') {
        setTimeout(triggerPrint, 350);
      } else {
        iframe.onload = () => setTimeout(triggerPrint, 350);
      }
    } catch (e) {
      console.error('Print iframe creation error:', e);
      window.document.title = dynamicFileName;
      window.print();
    }
  };

  return (
    <>
      <div className="space-y-5 anim-in no-print">
        {/* Sub-View Tabs Header */}
      <div className="card p-2 sm:p-3 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5 shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-100 dark:bg-[#090d16] rounded-2xl border border-slate-200 dark:border-slate-800 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('ranking')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'ranking'
                ? 'bg-blue-600 text-white shadow-sm dark:bg-gradient-to-r dark:from-cyan-500 dark:to-blue-600'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Peringkat &amp; Scorecard KPI Tim</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('all_personnel')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'all_personnel'
                ? 'bg-blue-600 text-white shadow-sm dark:bg-gradient-to-r dark:from-cyan-500 dark:to-blue-600'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Daftar Semua Personil</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('podium')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'podium'
                ? 'bg-blue-600 text-white shadow-sm dark:bg-gradient-to-r dark:from-cyan-500 dark:to-blue-600'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Crown className="w-4 h-4" />
            <span>Podium Bintang</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('shift_analytics')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'shift_analytics'
                ? 'bg-blue-600 text-white shadow-sm dark:bg-gradient-to-r dark:from-cyan-500 dark:to-blue-600'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Pengawasan Shift &amp; Kehadiran</span>
          </button>
        </div>

        {/* Info Periode Aktif */}
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
          <Calendar className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
          <span>Periode: <b className="text-slate-900 dark:text-slate-200">{fmtPeriodRange(period?.from, period?.to)}</b></span>
        </div>
      </div>

      {/* 4 Stat Cards KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <StatCard
          label="Rata-rata Skor KPI Tim"
          value={`${teamMetrics.avgKpi} / 100`}
          sub="Skala Grade A (≥95) s/d E (<80)"
          icon={Award}
          color="cyan"
        />
        <StatCard
          label="Pilar Hasil Kerja (60%)"
          value={`${teamMetrics.avgQuality}%`}
          sub={`Reject: ${teamMetrics.rejectRate}% (${teamMetrics.isRejectAman ? '✓ Lolos ≤0.5%' : '⚠ Alert >0.5%'})`}
          icon={CheckCircle2}
          color={teamMetrics.isRejectAman ? 'emerald' : 'amber'}
        />
        <StatCard
          label="Pilar Kedisiplinan (40%)"
          value={`${teamMetrics.avgAttendance} pts`}
          sub="Skor Absensi rec_absensi"
          icon={Clock}
          color="indigo"
        />
        {/* Card Total Personil Aktif dengan Interaksi Tab Semua Personil */}
        <div
          onClick={() => setActiveTab('all_personnel')}
          className="cursor-pointer transition-transform hover:scale-[1.02]"
          title="Klik untuk membuka daftar semua 25 personil & rekap absensi"
        >
          <StatCard
            label="Total Personil Aktif"
            value={`${teamMetrics.totalPersons} Org`}
            sub="Klik untuk lihat data master"
            icon={Users}
            color="purple"
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PERINGKAT & SCORECARD KPI TIM (MAIN VIEW) */}
      {/* ========================================================================= */}
      {activeTab === 'ranking' && (
        <div className="space-y-4 anim-in">
          {/* Filter Bar Lengkap */}
          <div className="card p-4 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Segmentasi Role Tabs (4 Pilihan: Semua, OP, PO, Staff) */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-[#090d16] rounded-xl border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setRoleFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    roleFilter === 'ALL'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Semua Peran ({roleCounts.ALL})
                </button>
                <button
                  type="button"
                  onClick={() => setRoleFilter('OP')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    roleFilter === 'OP'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Operator (OP) ({roleCounts.OP})
                </button>
                <button
                  type="button"
                  onClick={() => setRoleFilter('PO')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    roleFilter === 'PO'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Helper (PO) ({roleCounts.PO})
                </button>
                <button
                  type="button"
                  onClick={() => setRoleFilter('STAFF')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    roleFilter === 'STAFF'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-purple-400" />
                  Staff ({roleCounts.STAFF})
                </button>
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari Nama, NIK, Jabatan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="inp !pl-9 text-xs py-1.5 w-full font-medium"
                />
              </div>
            </div>

            {/* Filter Lanjutan */}
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                <span className="font-semibold text-slate-500 dark:text-slate-400">Divisi:</span>
                <select
                  value={divisionFilter}
                  onChange={(e) => setDivisionFilter(e.target.value)}
                  className="inp text-xs !py-1 font-medium"
                >
                  <option value="ALL">Semua Divisi</option>
                  {availableDivisions.map((div) => (
                    <option key={div} value={div}>{div}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-500 dark:text-slate-400">Lini/Mesin:</span>
                <select
                  value={machineFilter}
                  onChange={(e) => setMachineFilter(e.target.value)}
                  className="inp text-xs !py-1 font-medium"
                >
                  <option value="ALL">Semua Lini</option>
                  {availableMachines.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <span className="font-semibold text-slate-500 dark:text-slate-400">Urutkan:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="inp text-xs !py-1 font-bold text-blue-600 dark:text-cyan-400"
                >
                  <option value="final_kpi">Skor Akhir KPI (Tertinggi)</option>
                  <option value="skor_kualitas">Skor Kualitas 60%</option>
                  <option value="skor_absensi">Skor Absensi 40%</option>
                  <option value="good">Good Output Terbanyak</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tabel Peringkat KPI Utama */}
          <div className="card p-5 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="card-title text-slate-900 dark:text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
                  Scorecard &amp; Ranking Kinerja Personil
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Formula: 60% Hasil Kerja (Yield &amp; Penalti Defect) + 40% Kedisiplinan Absensi (rec_absensi)
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                Menampilkan {filteredAndSortedList.length} Personil
              </span>
            </div>

            <div className="table-responsive">
              <table className="tbl min-w-[950px]">
                <thead>
                  <tr>
                    <th className="w-12 text-center">Rank</th>
                    <th>Nama Personil &amp; NIK</th>
                    <th>Role</th>
                    <th>Divisi &amp; Lini</th>
                    <th>Good</th>
                    <th>Defect</th>
                    <th>Kualitas (60%)</th>
                    <th>Absensi (40%)</th>
                    <th>Skor Akhir KPI</th>
                    <th className="text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedList.map((p, idx) => (
                    <tr
                      key={p.id}
                      onClick={() => setSelectedPersonil(p)}
                      className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <td className="text-center font-mono font-bold text-slate-500 dark:text-slate-400">
                        {idx === 0 && <span className="inline-block p-1 rounded bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">🥇 #1</span>}
                        {idx === 1 && <span className="inline-block p-1 rounded bg-slate-200 text-slate-800 dark:bg-slate-600/30 dark:text-slate-200">🥈 #2</span>}
                        {idx === 2 && <span className="inline-block p-1 rounded bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300">🥉 #3</span>}
                        {idx > 2 && `#${idx + 1}`}
                      </td>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-sm">
                            {(p.nick_name || p.nama || 'P').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{p.nama_lengkap}</span>
                              <span className="text-[10px] font-mono text-slate-400 font-normal">({p.nick_name})</span>
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                              NIK: {p.nik_baru !== '-' ? p.nik_baru : p.nik_lama} &bull; {p.jabatan}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${p.hierarchy?.badge || 'bg-cyan-100 text-cyan-800'} font-bold`}>
                          {p.hierarchy?.label || (p.role_type === 'OP' ? 'Operator (OP)' : 'Helper (PO)')}
                        </span>
                      </td>
                      <td>
                        <div className="font-semibold text-slate-900 dark:text-slate-200">{p.divisi}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{p.lini_mesin}</div>
                      </td>
                      <td className="text-emerald-600 dark:text-emerald-400 font-bold">
                        {p.hierarchy?.isDirectProduction ? p.good.toLocaleString('id-ID') : <span className="text-slate-400 font-normal text-xs">-</span>}
                      </td>
                      <td className="text-rose-600 dark:text-rose-400 font-bold">
                        {p.hierarchy?.isDirectProduction ? p.defect.toLocaleString('id-ID') : <span className="text-slate-400 font-normal text-xs">-</span>}
                      </td>
                      <td>
                        <div className="font-bold text-slate-900 dark:text-white">{p.skor_kualitas}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {p.hierarchy?.level === 1 && 'Presensi 100%'}
                          {p.hierarchy?.level === 2 && `Yield: ${p.baseYieldRate.toFixed(1)}%`}
                          {p.hierarchy?.level === 3 && 'Agregat Lini'}
                          {p.hierarchy?.level === 4 && 'Lini & Kord'}
                          {p.hierarchy?.level === 5 && 'Konsolidasian'}
                        </div>
                      </td>
                      <td>
                        <div className="font-bold text-slate-900 dark:text-white">{p.skor_absensi}</div>
                        <div className="text-[10px] text-slate-400 font-mono">Penalti: -{p.attendancePenalties}</div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="font-display font-black text-base text-blue-600 dark:text-cyan-300">
                            {p.final_kpi}
                          </span>
                          <span className={`badge ${p.gradeBadgeClass} text-[10px] font-bold`}>
                            {p.grade} ({p.gradeLabel})
                          </span>
                        </div>
                      </td>
                      <td className="text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPersonil(p);
                          }}
                          className="p-1.5 rounded-lg bg-blue-50 dark:bg-cyan-500/10 text-blue-600 dark:text-cyan-300 hover:bg-blue-100 dark:hover:bg-cyan-500/20 border border-blue-200 dark:border-cyan-400/30 transition"
                          title="Buka Detail Scorecard KPI"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {filteredAndSortedList.length === 0 && (
                    <tr>
                      <td colSpan={10} className="text-center py-10 text-slate-500 dark:text-slate-400">
                        Tidak ada data personil yang sesuai dengan kriteria filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DAFTAR SEMUA PERSONIL (INTEGRASI CARD TOTAL PERSONIL AKTIF) */}
      {/* ========================================================================= */}
      {activeTab === 'all_personnel' && (
        <div className="space-y-4 anim-in">
          {/* Header Panel Daftar Personil */}
          <div className="card p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-cyan-500/30 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="badge bg-cyan-500/20 text-cyan-300 border-cyan-400/40 font-bold">
                  MASTER DATA PERSONIL
                </span>
                <span className="text-xs text-slate-300">&bull; Tabel rec_personil &amp; rec_absensi</span>
              </div>
              <h2 className="font-display font-black text-xl sm:text-2xl text-white mt-1 tracking-wide">
                Daftar Seluruh Personil Prepress &amp; Rekap Absensi
              </h2>
              <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
                Klik pada baris personil untuk melihat modal detail profil lengkap dan rekap breakdown status absensi.
              </p>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider font-semibold">Total Personil Terdaftar</div>
              <div className="font-bold text-2xl text-cyan-300 mt-0.5">{personilMasterList.length} Orang</div>
              <div className="text-xs text-slate-400">Aktif Terhubung ke Sistem</div>
            </div>
          </div>

          {/* Filter Bar Khusus Daftar Personil */}
          <div className="card p-4 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-blue-600 dark:text-cyan-400 shrink-0" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Filter Lini Mesin:</span>
              <select
                value={personnelMachineFilter}
                onChange={(e) => setPersonnelMachineFilter(e.target.value)}
                className="inp text-xs !py-1.5 font-semibold"
              >
                <option value="ALL">Semua Lini</option>
                <option value="CTCP">CTCP</option>
                <option value="SCREEN">SCREEN</option>
                <option value="FLEXO & ETCHING">FLEXO &amp; ETCHING</option>
                <option value="PLATE WIP">PLATE WIP</option>
                <option value="CTP">CTP</option>
                {availableMachines.filter(m => !['CTCP', 'SCREEN', 'FLEXO & ETCHING', 'PLATE WIP', 'CTP'].includes(m)).map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari Nama, NIK, Divisi, Mesin..."
                value={personnelSearch}
                onChange={(e) => setPersonnelSearch(e.target.value)}
                className="inp !pl-9 text-xs py-1.5 w-full font-medium"
              />
            </div>
          </div>

          {/* Tabel Daftar Semua Personil */}
          <div className="card p-5 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="card-title text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
                  Tabel Data Master Personil (rec_personil)
                </h3>
                <p className="text-xs font-semibold text-slate-600 dark:text-cyan-400/90 flex items-center gap-1.5">
                  <span>💡 Klik baris manapun untuk membuka rekap absensi dan profil personal detail</span>
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-blue-600 dark:text-cyan-300">
                {filteredPersonnelMaster.length} dari {personilMasterList.length} Personil
              </span>
            </div>

            <div className="table-responsive">
              <table className="tbl min-w-[950px]">
                <thead>
                  <tr>
                    <th className="w-12 text-center">NO</th>
                    <th>NAMA LENGKAP</th>
                    <th>DIVISI</th>
                    <th>LINI / MESIN</th>
                    <th>NIK LAMA</th>
                    <th>NIK BARU</th>
                    <th>SKOR KUALITAS</th>
                    <th>SKOR ABSENSI</th>
                    <th>SKOR AKHIR KPI</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPersonnelMaster.map((p, idx) => (
                    <tr
                      key={p.id}
                      onClick={() => setSelectedPersonil(p)}
                      className="cursor-pointer hover:bg-blue-50/60 dark:hover:bg-cyan-500/10 transition-colors group"
                    >
                      <td className="text-center font-mono text-xs text-slate-500 dark:text-slate-400 font-bold">
                        {idx + 1}
                      </td>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-cyan-500/20 text-blue-700 dark:text-cyan-300 font-bold flex items-center justify-center text-xs shrink-0 border border-blue-200 dark:border-cyan-400/30 group-hover:scale-105 transition-transform">
                            {(p.nick_name || p.nama || 'P').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-cyan-300 transition-colors">
                              {p.nama_lengkap}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                              Nickname: <b className="text-slate-700 dark:text-slate-300">{p.nick_name}</b> &bull; {p.jabatan}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 font-bold">
                          {p.divisi}
                        </span>
                      </td>
                      <td>
                        <div className="font-semibold text-slate-900 dark:text-slate-200 text-xs">{p.lini_mesin}</div>
                      </td>
                      <td className="font-mono text-xs text-slate-600 dark:text-slate-400">
                        {p.nik_lama}
                      </td>
                      <td className="font-mono text-xs font-bold text-blue-600 dark:text-cyan-300">
                        {p.nik_baru}
                      </td>
                      <td>
                        {p.hierarchy?.level === 1 ? (
                          <span className="badge bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 text-[10px] font-bold">
                            N/A (Support)
                          </span>
                        ) : (
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">{p.skor_kualitas} pts</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {p.hierarchy?.level === 2 && `Yield: ${p.baseYieldRate.toFixed(1)}%`}
                              {p.hierarchy?.level === 3 && 'Agregat Lini'}
                              {p.hierarchy?.level === 4 && 'Lini & Kord'}
                              {p.hierarchy?.level === 5 && 'Konsolidasian'}
                            </div>
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="font-bold text-slate-900 dark:text-white">{p.skor_absensi} pts</div>
                          {p.totalHariKerja === 0 ? (
                            <span className="badge bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 text-[10px]">
                              Tidak Aktif / 0 Hari
                            </span>
                          ) : (
                            <span className={`badge ${p.attendancePenalties > 0 ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'} text-[10px]`}>
                              {p.attendancePenalties > 0 ? `-${p.attendancePenalties} Potongan` : 'Sempurna'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="font-display font-black text-base text-blue-600 dark:text-cyan-300">
                            {p.final_kpi}
                          </span>
                          <span className={`badge ${p.gradeBadgeClass} text-[10px] font-bold`}>
                            Grade {p.grade} ({p.gradeLabel})
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredPersonnelMaster.length === 0 && (
                    <tr>
                      <td colSpan={9} className="text-center py-10 text-slate-500 dark:text-slate-400">
                        Tidak ada data personil yang cocok dengan kata kunci pencarian.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PODIUM BINTANG (TOP 3 STAR PERFORMERS) */}
      {/* ========================================================================= */}
      {activeTab === 'podium' && (
        <div className="space-y-6 anim-in">
          {/* Header Panel */}
          <div className="card p-5 bg-gradient-to-r from-purple-950/90 via-indigo-950 to-slate-900 text-white border border-purple-500/30 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="badge bg-purple-500/20 text-purple-300 border-purple-400/40 font-bold">
                  STAR PODIUM PREPRESS
                </span>
                <span className="text-xs text-slate-300">&bull; Prestasi Tertinggi Periode</span>
              </div>
              <h2 className="font-display font-black text-xl sm:text-2xl text-white mt-1 tracking-wide">
                Top 3 Performer Evaluasi Kinerja &amp; KPI
              </h2>
              <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
                Apresiasi personil dengan integrasi skor kualitas tertinggi dan tingkat kehadiran paling disiplin.
              </p>
            </div>
          </div>

          {/* Visual 3 Podium Cards */}
          {topThreePerformers.length > 0 && (
            <div className="grid md:grid-cols-3 gap-4 pt-4">
              {topThreePerformers.map((item, idx) => {
                const podiumStyles = [
                  'border-amber-400/60 bg-gradient-to-b from-amber-500/10 via-slate-900 to-slate-900 shadow-[0_0_30px_rgba(245,158,11,0.25)] order-1 md:order-2 md:-translate-y-3',
                  'border-slate-300 dark:border-slate-400/60 bg-gradient-to-b from-slate-500/10 via-slate-900 to-slate-900 shadow-[0_0_25px_rgba(148,163,184,0.2)] order-2 md:order-1',
                  'border-amber-600/40 dark:border-amber-700/60 bg-gradient-to-b from-orange-500/10 via-slate-900 to-slate-900 shadow-[0_0_25px_rgba(180,83,9,0.2)] order-3'
                ];
                const titles = ['Juara #1 (Gold)', 'Runner Up #2 (Silver)', 'Third Place #3 (Bronze)'];

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedPersonil(item)}
                    className={`card p-6 ${podiumStyles[idx]} relative flex flex-col items-center text-center cursor-pointer hover:scale-[1.02] transition-transform`}
                  >
                    <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-2.5 shadow-md">
                      {idx === 0 ? <Crown className="w-8 h-8 text-amber-400" /> : <Medal className="w-8 h-8 text-cyan-400" />}
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">
                      {titles[idx]}
                    </span>
                    <h3 className="font-display font-black text-lg text-white mt-1 truncate max-w-full">
                      {item.nama_lengkap}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">{item.jabatan} &bull; {item.divisi}</p>

                    <div className="text-4xl font-black text-cyan-300 mt-3 tracking-tight">
                      {item.final_kpi} <span className="text-xs text-slate-400 font-normal">/ 100</span>
                    </div>
                    <span className={`badge ${item.gradeBadgeClass} text-xs font-bold mt-1.5`}>
                      Grade {item.grade} &bull; {item.gradeLabel}
                    </span>

                    <div className="grid grid-cols-2 gap-2 w-full mt-5 pt-4 border-t border-slate-800 text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold">Skor Kualitas</span>
                        <p className="font-bold text-emerald-400 mt-0.5">{item.skor_kualitas}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold">Skor Absensi</span>
                        <p className="font-bold text-cyan-400 mt-0.5">{item.skor_absensi}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: PENGAWASAN SHIFT & KEHADIRAN */}
      {/* ========================================================================= */}
      {activeTab === 'shift_analytics' && (
        <div className="space-y-4 anim-in">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Chart Distribusi Predikat KPI */}
            <div className="card p-5">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                <div>
                  <h3 className="card-title text-slate-900 dark:text-white">Distribusi Predikat Grade KPI Personil</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Sebaran nilai KPI seluruh personil yang terdaftar ({fullKpiCalculatedList.length} Personil)</p>
                </div>
                <span className="badge bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 text-[10px] font-bold font-mono">
                  Total: {fullKpiCalculatedList.length} Personil
                </span>
              </div>

              {(() => {
                const ct = getChartTheme();
                const totalPersonnel = fullKpiCalculatedList.length || 1;
                const gradeCounts = { A: 0, B: 0, C: 0, D: 0, E: 0 };
                fullKpiCalculatedList.forEach((p) => {
                  const g = p.grade || 'E';
                  if (gradeCounts[g] !== undefined) {
                    gradeCounts[g]++;
                  } else {
                    gradeCounts.E++;
                  }
                });

                const gradeConfig = [
                  { grade: 'A', label: 'Istimewa', range: '95 - 100', color: '#10b981', count: gradeCounts.A, percent: Math.round((gradeCounts.A / totalPersonnel) * 100) },
                  { grade: 'B', label: 'Baik', range: '90 - 94', color: '#06b6d4', count: gradeCounts.B, percent: Math.round((gradeCounts.B / totalPersonnel) * 100) },
                  { grade: 'C', label: 'Cukup', range: '85 - 89', color: '#6366f1', count: gradeCounts.C, percent: Math.round((gradeCounts.C / totalPersonnel) * 100) },
                  { grade: 'D', label: 'Kurang', range: '80 - 84', color: '#f59e0b', count: gradeCounts.D, percent: Math.round((gradeCounts.D / totalPersonnel) * 100) },
                  { grade: 'E', label: 'Sangat Kurang', range: '< 80', color: '#f43f5e', count: gradeCounts.E, percent: Math.round((gradeCounts.E / totalPersonnel) * 100) },
                ];

                return (
                  <div className="space-y-4">
                    {/* Item Legenda dengan Kuantitas (Jumlah Orang) & Persentase */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
                      {gradeConfig.map((item) => (
                        <div
                          key={item.grade}
                          className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-xs"
                        >
                          <span className="w-3 h-3 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: item.color }} />
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-slate-800 dark:text-slate-200 truncate text-[11px]">
                              Grade {item.grade} ({item.label})
                            </div>
                            <div className="font-mono text-[10px] text-slate-600 dark:text-slate-400 flex items-center justify-between mt-0.5">
                              <span>
                                <b className="text-slate-900 dark:text-white font-black">{item.count}</b> Org
                              </span>
                              <span className="font-bold font-mono text-cyan-600 dark:text-cyan-400">
                                ({item.percent}%)
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Doughnut Chart */}
                    <div className="h-60 flex items-center justify-center pt-2">
                      <Doughnut
                        data={{
                          labels: gradeConfig.map((c) => `Grade ${c.grade} (${c.label})`),
                          datasets: [
                            {
                              data: gradeConfig.map((c) => c.count),
                              backgroundColor: gradeConfig.map((c) => c.color),
                              borderColor: ct.isLight ? '#ffffff' : '#0f172a',
                              borderWidth: 2
                            }
                          ]
                        }}
                        options={{
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              display: false
                            },
                            tooltip: {
                              callbacks: {
                                label: function (context) {
                                  const idx = context.dataIndex;
                                  const item = gradeConfig[idx];
                                  return ` ${item.count} Orang (${item.percent}%) - Rentang: ${item.range}`;
                                }
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Rekap Status Kehadiran Global */}
            <div className="card p-5 space-y-3">
              <h3 className="card-title text-slate-900 dark:text-white">Rekap Status Kehadiran Global (rec_absensi)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Total akumulasi kejadian status absensi personil pada periode ini</p>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
                {Object.keys(ATTENDANCE_PENALTIES).map((code) => {
                  let totalCount = 0;
                  fullKpiCalculatedList.forEach((p) => {
                    totalCount += (p.attendanceCounts && p.attendanceCounts[code]) || 0;
                  });
                  const info = ATTENDANCE_LABELS[code] || { label: code, color: 'bg-slate-100 text-slate-700' };

                  return (
                    <div key={code} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">{code}</span>
                        <span className={`badge ${info.color} text-[10px] font-bold`}>
                          -{ATTENDANCE_PENALTIES[code]} pts
                        </span>
                      </div>
                      <div className="text-lg font-black text-blue-600 dark:text-cyan-300 mt-1">
                        {totalCount} <span className="text-xs font-normal text-slate-400">kali</span>
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{info.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL DETAIL KPI PERSONAL & REKAP ABSENSI LENGKAP */}
      {/* ========================================================================= */}
      {activeSelectedPersonil && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto anim-in">
          <div className="card w-full max-w-3xl bg-white dark:bg-[#0f172a] border border-cyan-500/40 shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-start justify-between gap-4 border-b border-cyan-500/30 shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 border border-cyan-400/40 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-cyan-500/30 shrink-0">
                  {(activeSelectedPersonil.nick_name || activeSelectedPersonil.nama || 'P').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="badge bg-cyan-500/20 text-cyan-300 border-cyan-400/40 font-bold">
                      PROFIL PERSONIL &amp; REKAP ABSENSI
                    </span>
                    <span className={`badge ${activeSelectedPersonil.hierarchy?.badge || 'bg-cyan-100 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-300'} font-bold`}>
                      {activeSelectedPersonil.hierarchy?.label || activeSelectedPersonil.jabatan}
                    </span>
                  </div>
                  <h2 className="font-display font-black text-xl text-white mt-1">
                    {activeSelectedPersonil.nama_lengkap}
                  </h2>
                  <p className="text-xs text-slate-300 font-mono">
                    Nickname: <b className="text-cyan-300">{activeSelectedPersonil.nick_name}</b> &bull; {activeSelectedPersonil.jabatan} &bull; Divisi {activeSelectedPersonil.divisi}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(true)}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white px-3.5 py-2 rounded-xl flex items-center gap-2 text-xs font-bold shadow-md transition"
                  title="Cetak Dokumen KPI (PDF)"
                >
                  <Printer className="w-4 h-4" />
                  <span className="hidden sm:inline">Cetak Dokumen KPI (PDF)</span>
                  <span className="sm:hidden">Cetak</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPersonil(null)}
                  className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body Content */}
            <div className="p-5 space-y-5 overflow-y-auto flex-1 text-slate-900 dark:text-slate-100">
              {/* Header Atribut Personil (rec_personil) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 font-mono text-[10px] uppercase font-semibold">Nama Lengkap</span>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">{activeSelectedPersonil.nama_lengkap}</p>
                  <p className="text-[10px] text-slate-500 font-mono">Nickname: <b className="text-blue-600 dark:text-cyan-300">{activeSelectedPersonil.nick_name}</b></p>
                </div>
                <div>
                  <span className="text-slate-400 font-mono text-[10px] uppercase font-semibold">Jabatan</span>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">{activeSelectedPersonil.jabatan}</p>
                  <span className="badge bg-slate-200 dark:bg-slate-800 text-[10px] mt-0.5 font-bold">{activeSelectedPersonil.role_type === 'OP' ? 'Operator' : 'Helper (PO)'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-mono text-[10px] uppercase font-semibold">Divisi &amp; Lini Mesin</span>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">{activeSelectedPersonil.divisi}</p>
                  <p className="text-[10px] text-slate-400">{activeSelectedPersonil.lini_mesin}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-mono text-[10px] uppercase font-semibold">NIK &amp; Status NIK</span>
                  <p className="font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                    Baru: {activeSelectedPersonil.nik_baru !== '-' ? activeSelectedPersonil.nik_baru : '-'}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Lama: {activeSelectedPersonil.nik_lama} &bull; <span className="font-bold text-cyan-600 dark:text-cyan-400">{activeSelectedPersonil.status_nik}</span>
                  </p>
                </div>
              </div>

              {/* Rekap Total Status Kehadiran (9 Grid Counter Badge) */}
              <div className="card p-4 space-y-3 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-cyan-500" />
                    Rekap Status Kehadiran (rec_absensi &bull; {fmtPeriodRange(period?.from, period?.to)})
                  </h3>
                  <div className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400">
                    Skor Absensi: <b className="text-sm text-slate-900 dark:text-white">{activeSelectedPersonil.skor_absensi}</b> / 100
                  </div>
                </div>

                {/* 9 Status Counter Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-5 gap-2 text-xs">
                  {Object.keys(ATTENDANCE_PENALTIES).map((code) => {
                    const count = (activeSelectedPersonil.attendanceCounts && activeSelectedPersonil.attendanceCounts[code]) || 0;
                    const info = ATTENDANCE_LABELS[code] || { label: code, color: 'bg-slate-100 text-slate-700' };

                    return (
                      <div
                        key={code}
                        className={`p-2.5 rounded-xl border flex flex-col justify-between transition-all ${
                          count > 0
                            ? `${info.color} shadow-sm`
                            : 'bg-slate-50 dark:bg-slate-800/40 text-slate-400 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between font-mono font-bold">
                          <span>{code}</span>
                          <span className="text-sm font-black">{count}x</span>
                        </div>
                        <div className="text-[10px] leading-tight font-medium mt-1 truncate" title={info.label}>
                          {info.label}
                        </div>
                        <div className="text-[9px] font-mono mt-1 opacity-80">
                          {ATTENDANCE_PENALTIES[code] > 0 ? `-${ATTENDANCE_PENALTIES[code]} pts/event` : '0 penalty'}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Ringkasan Perhitungan Absensi */}
                <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="text-slate-300 font-medium flex items-center gap-2">
                      <span>Formula Kedisiplinan:</span>
                      <span className="font-mono text-cyan-300 font-bold">
                        {activeSelectedPersonil.totalHariKerja === 0 ? '0 Hari Kerja (Inactive) -> 0 pts' : 'Math.max(0, 100 - Total_Penalti)'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
                      <span>
                        Total Hari Kerja: <b className="text-slate-200">{activeSelectedPersonil.totalHariKerja} Hari</b>
                      </span>
                      <span>&bull;</span>
                      <span>
                        Total Pemotongan: <b className="text-rose-400">-{activeSelectedPersonil.attendancePenalties} Poin</b>
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase font-mono font-semibold">Skor Kedisiplinan</div>
                    <div className="font-black text-xl text-cyan-300">
                      {activeSelectedPersonil.skor_absensi} <span className="text-xs text-slate-400 font-normal">/ 100</span>
                    </div>
                  </div>
                </div>

                {/* Tabel Log Riwayat Harian Absensi Personil */}
                <div className="pt-2">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                    <span>Log Harian Catatan Kehadiran ({activeSelectedPersonil.attendanceLogs.length} Entri)</span>
                  </div>
                  <div className="table-responsive max-h-48">
                    <table className="tbl min-w-[500px]">
                      <thead>
                        <tr>
                          <th>Tanggal</th>
                          <th>Kode Status</th>
                          <th>Keterangan / Alasan</th>
                          <th>Jam Masuk - Pulang</th>
                          <th>Penalti</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeSelectedPersonil.attendanceLogs.map((log, lIdx) => (
                          <tr key={lIdx}>
                            <td className="font-mono text-xs font-semibold">{log.date}</td>
                            <td>
                              <span className={`badge ${ATTENDANCE_LABELS[log.status]?.color || 'bg-slate-100 text-slate-700'} font-bold`}>
                                {log.status}
                              </span>
                            </td>
                            <td className="text-xs">{log.ket || '-'}</td>
                            <td className="text-xs font-mono">{log.masuk || '-'} s/d {log.pulang || '-'}</td>
                            <td className="font-bold text-rose-600 dark:text-rose-400 font-mono">
                              {log.penalty > 0 ? `-${log.penalty} pts` : '0'}
                            </td>
                          </tr>
                        ))}
                        {activeSelectedPersonil.attendanceLogs.length === 0 && (
                          <tr>
                            <td colSpan={5} className="text-center py-4 text-slate-400 text-xs">
                              {activeSelectedPersonil.totalHariKerja === 0
                                ? 'Tidak ditemukan catatan kehadiran pada rentang periode ini (0 Hari Kerja).'
                                : 'Tidak ada catatan pelanggaran absensi pada rentang periode ini (Kehadiran Sempurna 100 Poin).'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Rincian Integrasi Nilai Kualitas & Total KPI Final */}
              <div className="card p-4 space-y-3 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      {activeSelectedPersonil.hierarchy?.level === 1
                        ? 'Skor Akhir KPI Terpadu (100% Kedisiplinan & Presensi)'
                        : 'Skor Akhir KPI Terpadu (Kualitas 60% + Absensi 40%)'}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-display font-black text-xl text-blue-600 dark:text-cyan-300">
                      {activeSelectedPersonil.final_kpi}
                    </span>
                    <span className={`badge ${activeSelectedPersonil.gradeBadgeClass} text-xs font-bold`}>
                      Grade {activeSelectedPersonil.grade} &bull; {activeSelectedPersonil.gradeLabel}
                    </span>
                  </div>
                </div>

                {/* Level 1: ADMIN & OPERATOR WIP */}
                {activeSelectedPersonil.hierarchy?.level === 1 && (
                  <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-slate-800/80 border border-blue-200 dark:border-slate-700 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        Pilar Kedisiplinan &amp; Presensi: 100%
                      </span>
                      <span className="font-black text-blue-600 dark:text-cyan-300 text-base">
                        {activeSelectedPersonil.skor_absensi} pts
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Sebagai personil <b>{activeSelectedPersonil.hierarchy?.label}</b> (non-cetak plate fisik langsung), evaluasi performa dinilai penuh (100%) dari indeks kehadiran &amp; kedisiplinan kerja harian.
                    </p>
                  </div>
                )}

                {/* Level 3, 4, 5: KOORDINATOR, SUPERVISOR, MANAGER */}
                {activeSelectedPersonil.hierarchy?.level >= 3 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                      <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                        {activeSelectedPersonil.hierarchy?.qualityTitle}
                      </span>
                      <p className="font-bold text-slate-900 dark:text-white text-base">
                        {activeSelectedPersonil.skor_kualitas} pts
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {activeSelectedPersonil.hierarchy?.level === 3 && 'Rata-rata kualitas seluruh Operator & PO lini produksi aktif.'}
                        {activeSelectedPersonil.hierarchy?.level === 4 && 'Rata-rata dari Kualitas Lini dan KPI Koordinator.'}
                        {activeSelectedPersonil.hierarchy?.level === 5 && 'Rata-rata dari Kualitas Lini, KPI Koordinator, dan KPI Supervisor.'}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                      <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                        Kedisiplinan Personal (40%)
                      </span>
                      <p className="font-bold text-cyan-500 dark:text-cyan-300 text-base">
                        {activeSelectedPersonil.skor_absensi} pts
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Total Hari Kerja: {activeSelectedPersonil.totalHariKerja} Hari &bull; Potongan: -{activeSelectedPersonil.attendancePenalties} pts
                      </p>
                    </div>
                  </div>
                )}

                {/* Level 2: OPERATOR & HELPER LINI PRODUKSI */}
                {activeSelectedPersonil.hierarchy?.level === 2 && (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-400 text-[10px] uppercase font-bold">Good Output</span>
                      <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm mt-0.5">{activeSelectedPersonil.good.toLocaleString('id-ID')}</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-400 text-[10px] uppercase font-bold">Defect / Rusak</span>
                      <p className="font-bold text-rose-600 dark:text-rose-400 text-sm mt-0.5">{activeSelectedPersonil.defect.toLocaleString('id-ID')}</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-400 text-[10px] uppercase font-bold">Reject Rate</span>
                      <p className={`font-bold text-sm mt-0.5 ${activeSelectedPersonil.isRejectAman ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {activeSelectedPersonil.rejectRate}%
                      </p>
                      <span className={`text-[9px] font-bold ${activeSelectedPersonil.isRejectAman ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {activeSelectedPersonil.isRejectAman ? '✓ Lolos (≤0.5%)' : '⚠ Alert (>0.5%)'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-400 text-[10px] uppercase font-bold">Kualitas (60%)</span>
                      <p className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">{activeSelectedPersonil.skor_kualitas} pts</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-400 text-[10px] uppercase font-bold">Kedisiplinan (40%)</span>
                      <p className="font-bold text-cyan-500 dark:text-cyan-300 text-sm mt-0.5">{activeSelectedPersonil.skor_absensi} pts</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setSelectedPersonil(null)}
                className="btn-secondary text-xs px-5 py-2 font-bold"
              >
                Tutup Rekap Personil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL PREVIEW CETAK DOKUMEN KPI FORMAL (A4 PDF / PRINT VIEW) */}
      {/* ========================================================================= */}
      {isPrintModalOpen && activeSelectedPersonil && (
        <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden anim-in">
          <div className="card w-full max-w-5xl bg-slate-900 border border-cyan-500/50 shadow-2xl overflow-hidden my-auto h-[95vh] flex flex-col">
            {/* Header Toolbar Print Preview */}
            <div className="p-3.5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 shrink-0 no-print">
              <div className="flex items-center gap-2.5">
                <Printer className="w-5 h-5 text-cyan-400 shrink-0" />
                <div>
                  <h3 className="font-bold text-sm text-white leading-tight">
                    Preview Cetak Dokumen KPI - {activeSelectedPersonil.nama_lengkap}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Format Standar Single-Page A4 &bull; PT Solo Murni (Prepress Department)
                  </p>
                </div>
              </div>

              {/* Toolbar Controls: Zoom & Print */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Zoom Controls */}
                <div className="flex items-center gap-1 bg-slate-800/90 rounded-xl p-1 border border-slate-700">
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.max(0.6, Number((z - 0.1).toFixed(1))))}
                    disabled={zoomLevel <= 0.6}
                    className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white disabled:opacity-40 transition"
                    title="Zoom Out (-)"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-mono font-bold px-2 text-cyan-300 min-w-[50px] text-center">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.min(1.5, Number((z + 0.1).toFixed(1))))}
                    disabled={zoomLevel >= 1.5}
                    className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white disabled:opacity-40 transition"
                    title="Zoom In (+)"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomLevel(1)}
                    className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition ml-1 border-l border-slate-700 pl-2"
                    title="Reset Zoom (Fit / 100%)"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Action Print */}
                <button
                  type="button"
                  onClick={handlePrintKpi}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-cyan-600/30 flex items-center gap-2 transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Sekarang (Print / PDF)</span>
                </button>

                {/* Close */}
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                  title="Tutup Preview"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Paper Container (Screen Preview with Zoom) */}
            <div className="p-4 sm:p-8 overflow-auto flex-1 bg-slate-950 flex justify-center items-start no-print">
              <div
                className="bg-white rounded-sm shadow-2xl overflow-hidden w-full max-w-[210mm] border border-slate-300 transition-transform origin-top"
                style={{
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: 'top center',
                  marginBottom: `${Math.max(0, (zoomLevel - 1) * 700)}px`
                }}
              >
                <KpiPrintDocument
                  personil={activeSelectedPersonil}
                  period={period}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Top-Level Clean Print Container (Targeted by @media print) */}
    {activeSelectedPersonil && (
      <div className="print-only">
        <KpiPrintDocument
          personil={activeSelectedPersonil}
          period={period}
        />
      </div>
    )}
  </>
);
}
