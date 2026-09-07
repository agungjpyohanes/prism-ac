import {
  LayoutDashboard,
  TrendingUp,
  Database,
  Users,
  Briefcase,
  FileText
} from 'lucide-react';

// Matriks Hak Akses Menu:
// - developer, prepress, manager : Akses semua menu (overview, analytics, data, work_request, team_kpi, executive)
// - tamu, user, staff           : Akses terbatas (overview, data, work_request)
export const ROLE_PERMISSIONS = {
  developer: ['overview', 'analytics', 'data', 'work_request', 'team_kpi', 'executive'],
  prepress: ['overview', 'analytics', 'data', 'work_request', 'team_kpi', 'executive'],
  manager: ['overview', 'analytics', 'data', 'work_request', 'team_kpi', 'executive'],
  tamu: ['overview', 'data', 'work_request'],
  user: ['overview', 'data', 'work_request'],
  staff: ['overview', 'data', 'work_request'],

  // Legacy / Aliases support
  admin: ['overview', 'analytics', 'data', 'work_request', 'team_kpi', 'executive'],
  manajemen: ['overview', 'analytics', 'data', 'work_request', 'team_kpi', 'executive'],
  operator: ['overview', 'analytics', 'data', 'work_request', 'team_kpi', 'executive'],
  guest: ['overview', 'data', 'work_request']
};

export const hasMenuAccess = (role, menuId) => {
  const r = String(role || 'tamu').toLowerCase().trim();
  const allowed = ROLE_PERMISSIONS[r] || ROLE_PERMISSIONS.tamu;
  return allowed.includes(menuId);
};

// Role yang memiliki hak akses mutasi data (Tambah & Edit): prepress, manager, developer
export const MUTATION_ROLES = ['prepress', 'manager', 'developer'];

export const canMutateData = (role) => {
  const r = String(role || '').toLowerCase().trim();
  return MUTATION_ROLES.includes(r);
};

// Menu Utama PRISM
export const MENUS = [
  { 
    id: 'overview', 
    label: 'Dashboard Overview', 
    icon: LayoutDashboard,
    order: 1
  },
  { 
    id: 'analytics', 
    label: 'Analitik Prepress', 
    icon: TrendingUp,
    order: 2
  },
  { 
    id: 'data', 
    label: 'Data Produksi', 
    icon: Database,
    order: 3
  },
  { 
    id: 'work_request', 
    label: 'Permintaan Pekerjaan', 
    icon: FileText,
    order: 4
  },
  { 
    id: 'team_kpi', 
    label: 'Kinerja Tim & KPI', 
    icon: Users,
    order: 5
  },
  { 
    id: 'executive', 
    label: 'Management Executive', 
    icon: Briefcase,
    order: 6
  }
];