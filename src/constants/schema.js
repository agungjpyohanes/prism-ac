// Mapping tabel dan skema database Supabase
export const TABLE_NAMES = {
  USERS: 'master_user',
  CTCP: 'rec_ctcp',
  CTP: 'rec_ctp',
  SCREEN: 'rec_screen',
  FLEXO: 'rec_flexo',
  ETCHING: 'rec_etching',
  JOB_ACTIVE: 'jop_active'
};

export const DIVISIONS = [
  { key: 'ctcp', label: 'CTCP', table: TABLE_NAMES.CTCP },
  { key: 'ctp', label: 'CTP', table: TABLE_NAMES.CTP },
  { key: 'screen', label: 'SCREEN', table: TABLE_NAMES.SCREEN },
  { key: 'flexo', label: 'FLEXO', table: TABLE_NAMES.FLEXO },
  { key: 'etching', label: 'ETCHING', table: TABLE_NAMES.ETCHING }
];

export const TABLE_COLUMNS = {
  [TABLE_NAMES.USERS]: [
    'id', 'username', 'role', 'password_hash'
  ],
  [TABLE_NAMES.CTCP]: [
    'id', 'job_name', 'job_no', 'plate_no', 'date', 'expose_mach', 
    'print_mach', 'paper_type', 'plate_size', 'qty_new', 'qty_replace', 
    'qty_good', 'qty_defect', 'replace_reason', 'special_request', 
    'defect_reason', 'notes', 'shift', 'operator', 'po_helper'
  ],
  [TABLE_NAMES.CTP]: [
    'id', 'job_name', 'job_no', 'plate_no', 'date', 'expose_mach', 
    'plate_size', 'print_mach', 'paper_type', 'qty_new', 'qty_replace', 
    'qty_good', 'qty_defect', 'replace_reason', 'special_request', 
    'defect_reason', 'notes', 'shift', 'operator'
  ],
  [TABLE_NAMES.SCREEN]: [
    'id', 'job_name', 'job_no', 'file_no', 'screen_type', 'status', 
    'start_time', 'finish_time', 'duration', 'date', 'description', 
    'screen_mesh', 'shift', 'notes', 'qty_good', 'qty_defect', 
    'qty_replace', 'defect_reason', 'replace_reason', 'operator'
  ],
  [TABLE_NAMES.FLEXO]: [
    'id', 'job_name', 'job_no', 'file_no', 'status', 'start_time', 
    'finish_time', 'duration', 'date', 'description', 'lpi', 
    'flexo_thickness', 'print_mach', 'rip_pos', 'keterangan', 'notes', 
    'qty_good', 'qty_defect', 'qty_replace', 'defect_reason', 
    'replace_reason', 'shift', 'operator', 'po_helper'
  ],
  [TABLE_NAMES.ETCHING]: [
    'id', 'job_name', 'job_no', 'file_no', 'plate_type', 'status', 
    'start_time', 'finish_time', 'duration', 'date', 'description', 
    'plate_thickness', 'keterangan', 'qty_good', 'qty_defect', 
    'qty_replace', 'defect_reason', 'replace_reason', 'shift', 
    'operator', 'po_helper'
  ],
  [TABLE_NAMES.JOB_ACTIVE]: [
    'id', 'job_name', 'job_no', 'file_no', 'status', 'start_time', 
    'date', 'category'
  ]
};