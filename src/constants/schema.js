export const SHEETS = {
  job_active: { label: 'Job Aktif', unit: 'Job', color: '#0284c7' },
  rec_ctcp: { label: 'CTCP Offset', unit: 'Plate', color: '#8b5cf6' },
  rec_ctp: { label: 'CTP Thermal', unit: 'Plate', color: '#10b981' },
  rec_screen: { label: 'Screen Printing', unit: 'Screen', color: '#06b6d4' },
  rec_flexo: { label: 'Flexography', unit: 'Plate', color: '#6366f1' },
  rec_etching: { label: 'Etching Plate', unit: 'Plate', color: '#f59e0b' }
};

export const PROD_KEYS = ['rec_ctcp', 'rec_ctp', 'rec_screen', 'rec_flexo', 'rec_etching'];
export const ALL_KEYS = ['job_active', ...PROD_KEYS, 'master_user'];

export const FORMS = {
  rec_ctcp: { title: 'Input CTCP Offset' },
  rec_ctp: { title: 'Input CTP Thermal' },
  rec_screen: { title: 'Input Screen' },
  rec_flexo: { title: 'Input Flexo' },
  rec_etching: { title: 'Input Etching' }
};