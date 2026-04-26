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
import { motion } from 'motion/react';

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
    { id: 'sales', label: 'Vendas', icon: TrendingUp, roles: ['admin', 'sales'] },
    { id: 'proposals', label: 'Propostas', icon: FileText, roles: ['admin', 'sales'] },
    { id: 'finance', label: 'Financeiro', icon: Wallet, roles: ['admin', 'finance'] },
    { id: 'reports', label: 'Relatórios', icon: TrendingUp, roles: ['admin', 'finance', 'sales'] },
    { id: 'kits', label: 'Kits', icon: LayoutGrid, roles: ['admin', 'sales', 'engineer'] },
    { id: 'collaborators', label: 'Colaboradores', icon: UserPlus, roles: ['admin'] },
    { id: 'users', label: 'Gestão de Acessos', icon: ShieldCheck, roles: ['admin'] },
    { id: 'partners', label: 'Parceiros', icon: Building2, roles: ['admin'] },
    { id: 'settings', label: 'Configurações', icon: Settings, roles: ['admin'] },
  ];

  const filteredNavItems = navItems.filter(item => 
    !user || user.role === 'admin' || item.roles.includes(user.role)
  );

  return (
    <aside className="w-64 border-r border-[#fdb612]/20 bg-slate-50 dark:bg-[#0c0c0c] flex flex-col h-screen sticky top-0">
      <div className="p-8">
        <Logo className="scale-100" variant="dark" src={companyLogo} />
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
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
                "w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-sm group relative",
                isActive 
                  ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20" 
                  : "text-slate-500 dark:text-slate-400 hover:bg-brand-primary/5 hover:text-brand-primary dark:hover:text-slate-100"
              )}
            >
              <Icon className={cn(
                "w-5 h-5 transition-transform group-hover:scale-110",
                isActive ? "text-brand-secondary" : "group-hover:text-brand-primary"
              )} />
              <span>{item.label}</span>
              {isActive && (
                <motion.div 
                  layoutId="sidebar-active"
                  className="absolute left-0 w-1 h-6 bg-brand-secondary rounded-full"
                />
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 mt-auto">
        <div className="p-4 rounded-3xl bg-white dark:bg-white/5 border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="size-10 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
              <User className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black truncate text-slate-900 dark:text-slate-100">{user?.name}</p>
              <span className="inline-block text-[8px] px-1.5 py-0.5 bg-brand-secondary/20 text-brand-secondary rounded-full uppercase font-black tracking-tighter">
                {user?.role}
              </span>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all font-black text-[10px] uppercase tracking-widest border border-dashed border-slate-200 dark:border-slate-800"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sair do Sistema
          </button>
        </div>
      </div>
    </aside>
  );
};
