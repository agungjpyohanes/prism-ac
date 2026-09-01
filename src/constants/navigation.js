import {
  LayoutDashboard,
  Factory,
  GitCompare,
  Database,
  TrendingUp,
  Users,
  Trophy,
  Briefcase,
  User
} from 'lucide-react';

export const MENUS = [
  { 
    id: 'overview', 
    label: 'Dashboard Overview', 
    icon: LayoutDashboard, 
    roles: ['admin', 'manager', 'manajemen', 'supervisor', 'operator', 'guest'] 
  },
  { 
    id: 'production', 
    label: 'Dashboard Produksi', 
    icon: Factory, 
    roles: ['admin', 'manager', 'manajemen', 'supervisor', 'operator'] 
  },
  { 
    id: 'comparison', 
    label: 'Dashboard Komparasi', 
    icon: GitCompare, 
    roles: ['admin', 'manager', 'manajemen', 'supervisor'] 
  },
  { 
    id: 'data', 
    label: 'Data Produksi', 
    icon: Database, 
    roles: ['admin', 'manager', 'manajemen', 'supervisor', 'operator'] 
  },
  { 
    id: 'analytics', 
    label: 'Analitik Prepress', 
    icon: TrendingUp, 
    roles: ['admin', 'manager', 'manajemen', 'supervisor'] 
  },
  { 
    id: 'team', 
    label: 'Pengawasan Tim', 
    icon: Users, 
    roles: ['admin', 'manager', 'manajemen', 'supervisor'] 
  },
  { 
    id: 'leaderboard', 
    label: 'KPI Leaderboard', 
    icon: Trophy, 
    roles: ['admin', 'manager', 'manajemen', 'supervisor', 'operator'] 
  },
  { 
    id: 'executive', 
    label: 'Management Executive', 
    icon: Briefcase, 
    roles: ['admin', 'manager', 'manajemen'] 
  },
  { 
    id: 'personal', 
    label: 'KPI Personal', 
    icon: User, 
    roles: ['admin', 'manager', 'manajemen', 'supervisor', 'operator'] 
  }
];