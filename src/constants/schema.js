// 1. Nama Tabel Database Supabase
export const TABLE_NAMES = {
  USERS: 'master_user',
  CTCP: 'rec_ctcp',
  CTP: 'rec_ctp',
  SCREEN: 'rec_screen',
  FLEXO: 'rec_flexo',
  ETCHING: 'rec_etching',
  JOB_ACTIVE: 'jop_active'
};

// 2. Daftar Keys Divisi Produksi
export const PROD_KEYS = [
  'rec_ctcp',
  'rec_ctp',
  'rec_screen',
  'rec_flexo',
  'rec_etching'
];

// 3. Konfigurasi Overview Sets (Dibutuhkan oleh OverviewView.jsx)
export const OVER_SETS = [
  { key: 'rec_ctcp', label: 'CTCP', unit: 'Plat', color: '#3b82f6' },
  { key: 'rec_ctp', label: 'CTP', unit: 'Plat', color: '#6366f1' },
  { key: 'rec_screen', label: 'SCREEN', unit: 'Screen', color: '#10b981' },
  { key: 'rec_flexo', label: 'FLEXO', unit: 'Plat', color: '#f59e0b' },
  { key: 'rec_etching', label: 'ETCHING', unit: 'Plat', color: '#ef4444' }
];

// 4. Metadata Divisi
export const DIVISIONS = [
  { key: 'rec_ctcp', label: 'CTCP', table: TABLE_NAMES.CTCP, unit: 'Plat' },
  { key: 'rec_ctp', label: 'CTP', table: TABLE_NAMES.CTP, unit: 'Plat' },
  { key: 'rec_screen', label: 'SCREEN', table: TABLE_NAMES.SCREEN, unit: 'Screen' },
  { key: 'rec_flexo', label: 'FLEXO', table: TABLE_NAMES.FLEXO, unit: 'Plat/Polymer' },
  { key: 'rec_etching', label: 'ETCHING', table: TABLE_NAMES.ETCHING, unit: 'Plat' }
];

// 5. Konfigurasi Index Kolom & Skema
export const SHEETS = {
  rec_ctcp: {
    name: 'rec_ctcp',
    label: 'CTCP',
    unit: 'Plat',
    i: {
      id: 0,
      job_name: 1,
      job_no: 2,
      plate_no: 3,
      date: 4,
      expose_mach: 5,
      print_mach: 6,
      paper_type: 7,
      plate_size: 8,
      qty_new: 9,
      qty_replace: 10,
      qty_good: 11,
      qty_defect: 12,
      replace_reason: 13,
      special_request: 14,
      defect_reason: 15,
      notes: 16,
      shift: 17,
      operator: 18,
      po_helper: 19
    }
  },
  rec_ctp: {
    name: 'rec_ctp',
    label: 'CTP',
    unit: 'Plat',
    i: {
      id: 0,
      job_name: 1,
      job_no: 2,
      plate_no: 3,
      date: 4,
      expose_mach: 5,
      plate_size: 6,
      print_mach: 7,
      paper_type: 8,
      qty_new: 9,
      qty_replace: 10,
      qty_good: 11,
      qty_defect: 12,
      replace_reason: 13,
      special_request: 14,
      defect_reason: 15,
      notes: 16,
      shift: 17,
      operator: 18
    }
  },
  rec_screen: {
    name: 'rec_screen',
    label: 'SCREEN',
    unit: 'Screen',
    i: {
      id: 0,
      job_name: 1,
      job_no: 2,
      file_no: 3,
      screen_type: 4,
      status: 5,
      start_time: 6,
      finish_time: 7,
      duration: 8,
      date: 9,
      description: 10,
      screen_mesh: 11,
      shift: 12,
      notes: 13,
      qty_good: 14,
      qty_defect: 15,
      qty_replace: 16,
      defect_reason: 17,
      replace_reason: 18,
      operator: 19
    }
  },
  rec_flexo: {
    name: 'rec_flexo',
    label: 'FLEXO',
    unit: 'Plat/Polymer',
    i: {
      id: 0,
      job_name: 1,
      job_no: 2,
      file_no: 3,
      status: 4,
      start_time: 5,
      finish_time: 6,
      duration: 7,
      date: 8,
      description: 9,
      lpi: 10,
      flexo_thickness: 11,
      print_mach: 12,
      rip_pos: 13,
      keterangan: 14,
      notes: 15,
      qty_good: 16,
      qty_defect: 17,
      qty_replace: 18,
      defect_reason: 19,
      replace_reason: 20,
      shift: 21,
      operator: 22,
      po_helper: 23
    }
  },
  rec_etching: {
    name: 'rec_etching',
    label: 'ETCHING',
    unit: 'Plat',
    i: {
      id: 0,
      job_name: 1,
      job_no: 2,
      file_no: 3,
      plate_type: 4,
      status: 5,
      start_time: 6,
      finish_time: 7,
      duration: 8,
      date: 9,
      description: 10,
      plate_thickness: 11,
      keterangan: 12,
      qty_good: 13,
      qty_defect: 14,
      qty_replace: 15,
      defect_reason: 16,
      replace_reason: 17,
      shift: 18,
      operator: 19,
      po_helper: 20
    }
  }
};

// 6. Daftar Kolom Tabel
export const TABLE_COLUMNS = {
  [TABLE_NAMES.USERS]: ['id', 'username', 'role', 'password_hash'],
  [TABLE_NAMES.CTCP]: Object.keys(SHEETS.rec_ctcp.i),
  [TABLE_NAMES.CTP]: Object.keys(SHEETS.rec_ctp.i),
  [TABLE_NAMES.SCREEN]: Object.keys(SHEETS.rec_screen.i),
  [TABLE_NAMES.FLEXO]: Object.keys(SHEETS.rec_flexo.i),
  [TABLE_NAMES.ETCHING]: Object.keys(SHEETS.rec_etching.i),
  [TABLE_NAMES.JOB_ACTIVE]: ['id', 'job_name', 'job_no', 'file_no', 'status', 'start_time', 'date', 'category']
};