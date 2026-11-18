import {
  LayoutDashboard,
  TrendingUp,
  Database,
  Users,
  Briefcase,
  Gauge
} from 'lucide-react';

// Matriks Hak Akses Menu:
// - developer, prepress, manager : Akses menu 1, 2, 3, 4, 5, 6
// - tamu, user, staff           : Akses terbatas hanya menu 1 dan 3
export const ROLE_PERMISSIONS = {
  developer: ['overview', 'analytics', 'data', 'team_kpi', 'oee_performance', 'executive'],
  prepress: ['overview', 'analytics', 'data', 'team_kpi', 'oee_performance', 'executive'],
  manager: ['overview', 'analytics', 'data', 'team_kpi', 'oee_performance', 'executive'],
  tamu: ['overview', 'data'],
  user: ['overview', 'data'],
  staff: ['overview', 'data'],

  // Legacy / Aliases support
  admin: ['overview', 'analytics', 'data', 'team_kpi', 'oee_performance', 'executive'],
  manajemen: ['overview', 'analytics', 'data', 'team_kpi', 'oee_performance', 'executive'],
  operator: ['overview', 'analytics', 'data', 'team_kpi', 'oee_performance', 'executive'],
  guest: ['overview', 'data']
};

export const hasMenuAccess = (role, menuId) => {
  const r = String(role || 'tamu').toLowerCase().trim();
  const allowed = ROLE_PERMISSIONS[r] || ROLE_PERMISSIONS.tamu;
  return allowed.includes(menuId);
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
    id: 'team_kpi', 
    label: 'Kinerja Tim & KPI', 
    icon: Users,
    order: 4
  },
  { 
    id: 'oee_performance', 
    label: 'Performa & OEE', 
    icon: Gauge,
    order: 5
  },
  { 
    id: 'executive', 
    label: 'Management Executive', 
    icon: Briefcase,
    order: 6
  }
];