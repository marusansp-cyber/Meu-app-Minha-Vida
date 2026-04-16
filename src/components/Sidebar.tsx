import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Construction, 
  Settings, 
  TrendingUp, 
  FileText, 
  Sun,
  User,
  LogOut,
  ShieldCheck,
  Building2,
  UserPlus,
  LayoutGrid,
  Wallet
} from 'lucide-react';
import { cn } from '../lib/utils';
import { View, User as UserType } from '../types';
import { Logo } from './Logo';

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
  onLogout: () => void;
  user: UserType | null;
  companyLogo?: string | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, onLogout, user, companyLogo }) => {
  const navItems = [
    { id: 'dashboard', label: 'Painel', icon: LayoutDashboard, roles: ['admin', 'sales', 'engineer', 'installer'] },
    { id: 'leads', label: 'Leads', icon: Users, roles: ['admin', 'sales'] },
    { id: 'clients', label: 'Clientes', icon: Users, roles: ['admin', 'sales', 'engineer', 'finance'] },
    { id: 'installations', label: 'Instalações', icon: Construction, roles: ['admin', 'engineer', 'installer'] },
    { id: 'team', label: 'Corpo Técnico', icon: ShieldCheck, roles: ['admin'] },
    { id: 'config', label: 'Simulador', icon: Sun, roles: ['admin', 'engineer'] },
    { id: 'sales', label: 'Vendas', icon: TrendingUp, roles: ['admin', 'sales'] },
    { id: 'proposals', label: 'Propostas', icon: FileText, roles: ['admin', 'sales'] },
    { id: 'finance', label: 'Financeiro', icon: Wallet, roles: ['admin', 'finance'] },
    { id: 'kits', label: 'Kits', icon: LayoutGrid, roles: ['admin', 'sales', 'engineer'] },
    { id: 'collaborators', label: 'Colaboradores', icon: UserPlus, roles: ['admin'] },
    { id: 'partners', label: 'Parceiros', icon: Building2, roles: ['admin'] },
    { id: 'settings', label: 'Configurações', icon: Settings, roles: ['admin'] },
  ];

  const filteredNavItems = navItems.filter(item => 
    !user || user.role === 'admin' || item.roles.includes(user.role)
  );

  return (
    <aside className="w-64 border-r border-[#fdb612]/20 bg-white dark:bg-[#231d0f] flex flex-col h-screen">
      <div className="p-6">
        <Logo className="scale-90 -ml-2" variant="dark" src={companyLogo} />
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => {
                onViewChange(item.id as View);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium",
                isActive 
                  ? "bg-[#fdb612] text-[#231d0f]" 
                  : "text-slate-600 dark:text-slate-400 hover:bg-[#fdb612]/10"
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[#fdb612]/10">
        <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-100 dark:bg-white/5">
          <div className="h-8 w-8 rounded-full bg-[#fdb612]/20 flex items-center justify-center">
            <User className="text-[#fdb612] w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <div className="flex items-center gap-1">
              <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
              <span className="text-[8px] px-1 bg-[#fdb612]/20 text-[#fdb612] rounded uppercase font-black">
                {user?.role}
              </span>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 text-slate-400 hover:text-rose-500 transition-colors group"
            title="Sair"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Sair</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
