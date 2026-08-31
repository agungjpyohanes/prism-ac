export const SHEETS = {
  job_active: {
    label: 'Job Aktif (WIP)',
    unit: 'Job',
    color: '#0284c7',
    headers: ['id', 'job_name', 'job_no', 'file_no', 'status', 'start_time', 'date', 'category'],
    i: { 
      id: 0, 
      job_name: 1, 
      jop: 1, 
      job_no: 2, 
      nojop: 2, 
      file_no: 3, 
      status: 4, 
      start_time: 5, 
      date: 6, 
      category: 7 
    }
  },
  rec_ctcp: {
    label: 'CTCP Offset',
    unit: 'Plate',
    color: '#8b5cf6',
    headers: ['id', 'job_name', 'job_no', 'plate_no', 'date', 'expose_mach', 'print_mach', 'paper_type', 'plate_size', 'qty_new', 'qty_replace', 'qty_good', 'qty_defect', 'replace_reason', 'special_request', 'defect_reason', 'notes', 'shift', 'operator', 'po_helper'],
    i: { id: 0, job_name: 1, jop: 1, job_no: 2, nojop: 2, plate_no: 3, date: 4, expose_mach: 5, print_mach: 6, paper_type: 7, plate_size: 8, qty_new: 9, qty_replace: 10, qty_good: 11, qty_defect: 12, replace_reason: 13, special_request: 14, defect_reason: 15, notes: 16, shift: 17, operator: 18, po_helper: 19 },
    calcType: 'offset'
  },
  rec_ctp: {
    label: 'CTP Thermal',
    unit: 'Plate',
    color: '#10b981',
    headers: ['id', 'job_name', 'job_no', 'plate_no', 'date', 'expose_mach', 'plate_size', 'print_mach', 'paper_type', 'qty_new', 'qty_replace', 'qty_good', 'qty_defect', 'replace_reason', 'special_request', 'defect_reason', 'notes', 'shift', 'operator'],
    i: { id: 0, job_name: 1, jop: 1, job_no: 2, nojop: 2, plate_no: 3, date: 4, expose_mach: 5, plate_size: 6, print_mach: 7, paper_type: 8, qty_new: 9, qty_replace: 10, qty_good: 11, qty_defect: 12, replace_reason: 13, special_request: 14, defect_reason: 15, notes: 16, shift: 17, operator: 18, po_helper: -1 },
    calcType: 'offset'
  },
  rec_screen: {
    label: 'Screen Printing',
    unit: 'Screen',
    color: '#06b6d4',
    headers: ['id', 'job_name', 'job_no', 'file_no', 'screen_type', 'status', 'start_time', 'finish_time', 'duration', 'date', 'description', 'screen_mesh', 'shift', 'notes', 'qty_good', 'qty_defect', 'qty_replace', 'defect_reason', 'replace_reason', 'operator'],
    i: { id: 0, job_name: 1, jop: 1, job_no: 2, nojop: 2, file_no: 3, screen_type: 4, status: 5, start_time: 6, finish_time: 7, duration: 8, date: 9, description: 10, screen_mesh: 11, shift: 12, notes: 13, qty_good: 14, qty_defect: 15, qty_replace: 16, defect_reason: 17, replace_reason: 18, operator: 19, po_helper: -1 },
    calcType: 'specialty'
  },
  rec_flexo: {
    label: 'Flexography',
    unit: 'Plate',
    color: '#6366f1',
    headers: ['id', 'job_name', 'job_no', 'file_no', 'status', 'start_time', 'finish_time', 'duration', 'date', 'description', 'lpi', 'flexo_thickness', 'print_mach', 'rip_pos', 'keterangan', 'notes', 'qty_good', 'qty_defect', 'qty_replace', 'defect_reason', 'replace_reason', 'shift', 'operator', 'po_helper'],
    i: { id: 0, job_name: 1, jop: 1, job_no: 2, nojop: 2, file_no: 3, status: 4, start_time: 5, finish_time: 6, duration: 7, date: 8, description: 9, lpi: 10, flexo_thickness: 11, print_mach: 12, rip_pos: 13, keterangan: 14, notes: 15, qty_good: 16, qty_defect: 17, qty_replace: 18, defect_reason: 19, replace_reason: 20, shift: 21, operator: 22, po_helper: 23 },
    calcType: 'specialty'
  },
  rec_etching: {
    label: 'Etching Plate',
    unit: 'Plate',
    color: '#f59e0b',
    headers: ['id', 'job_name', 'job_no', 'file_no', 'plate_type', 'status', 'start_time', 'finish_time', 'duration', 'date', 'description', 'plate_thickness', 'keterangan', 'qty_good', 'qty_defect', 'qty_replace', 'defect_reason', 'replace_reason', 'shift', 'operator', 'po_helper'],
    i: { id: 0, job_name: 1, jop: 1, job_no: 2, nojop: 2, file_no: 3, plate_type: 4, status: 5, start_time: 6, finish_time: 7, duration: 8, date: 9, description: 10, plate_thickness: 11, keterangan: 12, qty_good: 13, qty_defect: 14, qty_replace: 15, defect_reason: 16, replace_reason: 17, shift: 18, operator: 19, po_helper: 20 },
    calcType: 'specialty'
  }
};

export const JOP_CATS = [
  ['O', 'Offset'],
  ['FLEXO', 'Flexo'],
  ['SCREEN', 'Screen'],
  ['ETCHING', 'Etching'],
  ['SAMPLE', 'Sample'],
  ['REPRINT', 'Reprint']
];

export const CAT_COLORS = {
  O: '#8b5cf6',
  FLEXO: '#6366f1',
  SCREEN: '#06b6d4',
  ETCHING: '#f59e0b',
  SAMPLE: '#10b981',
  REPRINT: '#ec4899'
};

export const PROD_KEYS = ['rec_ctcp', 'rec_ctp', 'rec_screen', 'rec_flexo', 'rec_etching'];
export const ALL_KEYS = ['job_active', ...PROD_KEYS, 'master_user'];
export const TABLE_NAMES = ALL_KEYS;