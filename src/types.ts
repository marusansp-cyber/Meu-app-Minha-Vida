export type UserRole = 'admin' | 'sales' | 'engineer' | 'installer' | 'finance' | 'admin_staff';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export type View = 'dashboard' | 'leads' | 'installations' | 'config' | 'team' | 'sales' | 'proposals' | 'settings' | 'partners' | 'collaborators' | 'kits';

export interface Stat {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
}

export interface Activity {
  id: string;
  type: 'installation' | 'proposal' | 'payment' | 'alert';
  title: string;
  description: string;
  time: string;
}

export interface Project {
  id: string;
  name: string;
  location: string;
  capacity: string;
  status: 'on-track' | 'planning' | 'delayed';
  completion: number;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  systemSize: string;
  value: string;
  status: 'new' | 'survey' | 'proposal' | 'negotiation' | 'closed';
  urgent?: boolean;
  time?: string;
  scheduledDate?: string;
  createdAt?: string;
  representative?: string;
  history?: {
    date: string;
    action: string;
    user: string;
  }[];
  files?: {
    name: string;
    size: string;
    date: string;
    url?: string;
  }[];
}

export interface InstallationStage {
  name: string;
  status: 'completed' | 'in-progress' | 'pending';
}

export interface Installation {
  id: string;
  name: string;
  projectId: string;
  stage: string;
  technician: {
    name: string;
    avatar: string;
  };
  progress: number;
  lastUpdated: string;
  type: 'residence' | 'industrial' | 'home' | 'apartment';
  startDate?: string;
  estimatedDeadline?: string;
  stages?: InstallationStage[];
}

export interface Proposal {
  id: string;
  client: string;
  value: string;
  date: string;
  status: 'pending' | 'sent' | 'accepted' | 'expired' | 'cancelled';
  systemSize: string;
  representative: string;
  expiryDate?: string | null;
  roi?: string | null;
  payback?: string | null;
  feasibilityStudy?: string | null;
  commission?: number | null;
  ucNumber?: string | null;
  energyConsumption?: string | null;
  kitId?: string | null;
  discount?: number | null;
  financingBank?: string | null;
  financingInstallments?: number | null;
  email?: string | null;
}

export interface Partner {
  id: string;
  name: string;
  cnpj: string;
  contactName: string;
  email: string;
  phone: string;
  type: 'integrator' | 'referral' | 'maintenance' | 'other';
  status: 'active' | 'inactive' | 'pending';
  cnpjStatus?: string;
  createdAt: string;
  commissionRate: number;
  address?: string;
  notes?: string;
}

export interface Collaborator {
  id: string;
  name: string;
  role: 'Vendedor' | 'Projetista' | 'Instalador' | 'Financeiro' | 'Administrativo';
  email?: string;
  phone?: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface Kit {
  id: string;
  name: string;
  description: string;
  power: number; // kWp
  price: number;
  overload?: number;
  panelBrand?: string;
  inverterBrand?: string;
  panelLogo?: string;
  inverterLogo?: string;
  panelImage?: string;
  inverterImage?: string;
  components: {
    name: string;
    quantity: number;
    brand?: string;
    model?: string;
  }[];
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt?: string;
}
