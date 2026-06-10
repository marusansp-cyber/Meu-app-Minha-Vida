export type UserRole = 'admin' | 'sales' | 'engineer' | 'installer' | 'finance' | 'admin_staff';

export interface User {
  id: string;
  uid?: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  address?: string;
  status?: 'active' | 'inactive' | 'pending';
  createdAt?: string;
  twoFactorEnabled?: boolean;
}

export type View = 'dashboard' | 'leads' | 'installations' | 'team' | 'users' | 'sales' | 'proposals' | 'settings' | 'partners' | 'collaborators' | 'kits' | 'finance' | 'clients' | 'reports' | 'gallery' | 'landing';

export interface GalleryItem {
  id: string;
  url: string;
  thumbnailUrl?: string;
  name: string;
  description?: string;
  category?: 'installation' | 'product' | 'blueprint' | 'other';
  uploadedAt: string;
  uploadedBy: string;
}

export interface Interaction {
  id: string;
  date: string;
  type: string;
  title?: string;
  description: string;
  userName?: string;
  status?: string;
  timestamp?: number;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  userId?: string; // Optional: If empty, it's for everyone
  createdAt: string;
  readBy: string[]; // List of user IDs who have read this notification
}

export interface ClientAuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  timestamp: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  cpfCnpj?: string;
  cpf?: string;
  cnpj?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  createdAt: string;
  projects: string[]; // IDs of installations/proposals
  status: 'active' | 'inactive';
  interactions?: Interaction[];
  latitude?: number;
  longitude?: number;
  type?: 'residential' | 'rural' | 'industrial' | 'commercial' | 'public';
  ucNumber?: string;
  cep?: string;
  addressNumber?: string;
  addressComplement?: string;
  notes?: string;
  lastModifiedBy?: string;
  lastModifiedAt?: string;
  auditLogs?: ClientAuditLog[];
}

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
  cpfCnpj?: string;
  address?: string;
  cep?: string;
  ucNumber?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  energyConsumption?: string;
  calculatedKwp?: number;
  calculatedMonthlyGen?: number;
  calculatedPayback?: number;
  
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
  flagged?: boolean;
  flagReason?: string;
  notes?: {
    id: string;
    text: string;
    author: string;
    date: string;
  }[];
}

export interface InstallationStage {
  name: string;
  status: 'completed' | 'in-progress' | 'pending';
  notes?: string;
  photos?: string[];
  assignedTechnician?: string;
  progress?: number;
  deadline?: string;
}

export interface History {
  id: string;
  type?: 'create' | 'update' | 'delete';
  action?: string;
  collection: string;
  docId: string;
  data?: any;
  user: {
    uid?: string;
    email?: string | null;
    displayName?: string | null;
  };
  timestamp: any;
}

export interface InstallationAuditLog {
  id: string;
  user: string;
  action: string;
  timestamp: string;
  details?: string;
}

export interface Installation {
  id: string;
  name: string;
  projectId: string; // Used to link to Proposal
  stage: string;
  technician: {
    name: string;
    avatar: string;
  };
  progress: number;
  lastUpdated: string;
  checklist?: {
    id: string;
    step: string;
    completed: boolean;
    note: string;
  }[];
  type: 'residence' | 'industrial' | 'home' | 'apartment';
  startDate?: string;
  estimatedDeadline?: string;
  projectDeadline?: string | null;
  address?: string;
  representativeId?: string;
  stages?: InstallationStage[];
  systemPower?: string;
  inverterInfo?: string;
  panelInfo?: string;
  panelQuantity?: number;
  panelPowerW?: number;
  inverterPowerCA_kW?: number;
  status?: string;
  tasks?: {
    id: string;
    title: string;
    completed: boolean;
    createdAt: string;
  }[];
  latitude?: number;
  longitude?: number;
  auditLogs?: InstallationAuditLog[];
}

export interface Proposal {
  id: string;
  client: string;
  value: number;
  date: string;
  createdAt?: string;
  status: 'pending' | 'sent' | 'accepted' | 'expired' | 'cancelled';
  systemSize: string;
  representative: string;
  representativeId?: string;
  representativeEmail?: string;
  auditLogs?: { timestamp: string; action: string; user: string; details: string; }[];
  proposalNumber?: string;
  expiryDate?: string | null;
  roi?: string | null;
  payback?: string | null;
  feasibilityStudy?: string | null;
  commission?: number | null;
  commissionStatus?: 'pending' | 'paid';
  ucNumber?: string | null;
  energyConsumption?: string | null;
  monthlyGeneration?: string | null;
  kitId?: string | null;
  panelInfo?: string | null;
  inverterInfo?: string | null;
  panelPowerW?: number | null;
  inverterModel?: string | null;
  inverterPowerCA_kW?: number | null;
  inverterPowerCCMax_kW?: number | null;
  inverterInmetro?: string | null;
  discount?: number | null;
  financingBank?: string | null;
  financingInstallments?: number | null;
  financingInstallmentValue?: number | null;
  email?: string | null;
  phone?: string | null;
  paymentTerms?: string | null;
  annualSavings?: number | null;
  totalSavings25Years?: number;
  monthlySavings?: number;
  downPayment?: number;
  financingRate?: number;
  systemOversizing?: number;
  internalNotes?: string | null;
  
  // Advanced Wizard Fields
  additionalCost?: number;
  installationStartDate?: string;
  estimatedCompletionDate?: string;
  calculatedCommission?: number | null;
  latitude?: number;
  longitude?: number;
  assignedTechnician?: string;
  installationNotes?: string;
  
  // Step 1: UCS
  titular?: string;
  cpfCnpj?: string;
  endereco?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
  telefone?: string;
  distribuidora?: string;
  tensaoFornecimento?: string;
  
  // Step 2: KIT FV
  panelBrandModel?: string;
  panelQuantity?: number;
  inverterBrandModel?: string;
  invertersQuantity?: number;
  hsp?: number;
  pr?: number;
  tariff?: number;
  kitPrice?: number;
  laborCost?: number;
  totalCost?: number;
  margin?: number;
  structureQuantity?: number;
  structureType?: string;
  cablesIncluded?: boolean;
  protectionSystem?: string;
  
  // Step 3: PRECIFICAÇÃO
  equipmentCost?: number;
  installationCost?: number;
  projectCost?: number;
  licensingCost?: number;
  logisticCost?: number;
  subtotal?: number;
  
  // Step 4: FINANCIAMENTO
  paymentMethod?: 'cash' | 'financing' | 'credit_card' | 'pix' | 'boleto' | 'pix_plus_installments' | 'custom';
  pixInstallmentType?: 'credit_card' | 'boleto';
  customInstallments?: { value: number; date?: string; label?: string }[];
  financingCET?: number;
  
  // Step 5: FINALIZAÇÃO
  signatureUrl?: string;
  photoUrl?: string;
  customImageLinks?: string[];
  clientType?: string;
  leadId?: string;
  disclaimerTaxaMinima?: string;
  validityDays?: number;
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
  contractStartDate?: string;
  contractEndDate?: string;
  paymentTerms?: string;
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
  panelBrandModel?: string;
  inverterBrandModel?: string;
  components: {
    name: string;
    quantity: number;
    brand?: string;
    model?: string;
    notes?: string;
    verified?: boolean;
  }[];
  inverterType?: 'inverter' | 'microinverter';
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt?: string;
}

export interface SalesGoal {
  id: string;
  month: string;
  targetValue: number;
  targetCount: number;
  createdAt: string;
}

export interface CompanySettings {
  id: string;
  monthlyInvoice?: number;
  companyName?: string;
  logo?: string;
  address?: string;
  phone?: string;
  email?: string;
  cnpj?: string;
  contactEmail?: string;
  updatedAt?: string;
}

export interface SMTPSettings {
  host: string;
  port: number;
  user: string;
  pass: string;
  secure?: boolean;
  fromName?: string;
  from?: string;
  fromEmail?: string;
}
