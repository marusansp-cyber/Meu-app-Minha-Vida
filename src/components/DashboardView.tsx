import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area,
  PieChart,
  Pie
} from 'recharts';
import { 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  DollarSign,
  Plus,
  Calendar,
  FileText,
  ChevronUp,
  ChevronDown,
  TrendingUp,
  Users,
  Zap,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { RECENT_ACTIVITIES, ACTIVE_PROJECTS } from '../constants';
import { cn } from '../lib/utils';

const chartData = [
  { name: 'Jan', current: 60, previous: 40 },
  { name: 'Feb', current: 70, previous: 50 },
  { name: 'Mar', current: 45, previous: 30 },
  { name: 'Apr', current: 90, previous: 70 },
  { name: 'May', current: 80, previous: 60 },
  { name: 'Jun', current: 100, previous: 85 },
];

import { Lead, Proposal, Installation, User as UserType } from '../types';

interface DashboardViewProps {
  installations: Installation[];
  leads: Lead[];
  proposals: Proposal[];
  user: UserType | null;
  onOpenNewProject: () => void;
  onManageProjects: () => void;
}

type SortField = 'name' | 'projectId' | 'stage' | 'progress';
type SortOrder = 'asc' | 'desc';

export const DashboardView: React.FC<DashboardViewProps> = ({ installations, leads, proposals, user, onOpenNewProject, onManageProjects }) => {
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [timeRange, setTimeRange] = useState('30');
  const [activeYears, setActiveYears] = useState({ current: true, previous: true });
  const [toast, setToast] = useState<string | null>(null);

  const funnelData = useMemo(() => {
    const totalLeads = leads.length;
    const sentProposals = proposals.filter(p => p.status === 'sent' || p.status === 'accepted').length;
    const acceptedProposals = proposals.filter(p => p.status === 'accepted').length;
    const negotiation = proposals.filter(p => p.status === 'pending').length;
    
    return [
      { name: 'Leads', value: totalLeads || 120, fill: '#fdb612' },
      { name: 'Vistorias', value: Math.round(totalLeads * 0.6) || 80, fill: '#fdb612cc' },
      { name: 'Propostas', value: sentProposals || 45, fill: '#fdb61299' },
      { name: 'Negociação', value: negotiation || 25, fill: '#fdb61266' },
      { name: 'Fechados', value: acceptedProposals || 12, fill: '#fdb61233' },
    ];
  }, [leads, proposals]);

  const stats = useMemo(() => {
    const totalAcceptedRevenue = proposals
      .filter(p => p.status === 'accepted')
      .reduce((acc, p) => acc + (parseFloat((p.value || "0").toString().replace(/[^\d,]/g, '').replace(',', '.')) || 0), 0);

    const pendingCommissions = proposals
      .filter(p => p.status === 'accepted' && p.commissionStatus !== 'paid')
      .reduce((acc, p) => {
        const val = parseFloat((p.value || "0").toString().replace(/[^\d,]/g, '').replace(',', '.')) || 0;
        const rate = p.commission || 5;
        return acc + (val * (rate / 100));
      }, 0);

    const baseStats = [
      { label: 'Vendas Totais', value: `R$ ${totalAcceptedRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, change: '+12.5%', trend: 'up' },
      { label: 'Novos Leads', value: leads.length.toString(), change: '+18%', trend: 'up' },
      { label: 'Projetos Ativos', value: installations.length.toString(), change: '+5%', trend: 'up' },
      { label: 'Taxa de Conversão', value: `${leads.length > 0 ? ((proposals.filter(p => p.status === 'accepted').length / leads.length) * 100).toFixed(1) : 0}%`, change: '+2.4%', trend: 'up' },
    ];

    if (user?.role === 'admin' || user?.role === 'finance') {
      baseStats.push({ label: 'Comissões Pendentes', value: `R$ ${pendingCommissions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, change: '-3%', trend: 'down' });
    }

    return baseStats;
  }, [leads, proposals, installations, user]);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const sortedInstallations = useMemo(() => {
    return [...installations].sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [installations, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const SortIndicator = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
  };

  return (
    <div className="space-y-8 relative">
      {toast && (
        <div className="fixed bottom-8 right-8 z-50 bg-[#231d0f] text-white px-6 py-3 rounded-xl shadow-2xl border border-[#fdb612]/30 animate-in slide-in-from-right duration-300 flex items-center gap-3">
          <div className="size-2 bg-[#fdb612] rounded-full animate-pulse" />
          <span className="font-bold text-sm">{toast}</span>
        </div>
      )}

      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-display font-bold">Painel Operacional</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Monitoramento em tempo real de projetos solares e vendas</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          <button 
            onClick={() => showToast('Filtro de período: Últimos 30 Dias aplicado')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 dark:border-white/10 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-sm"
          >
            <Calendar className="w-4 h-4" />
            <span>Últimos 30 Dias</span>
          </button>
          <button 
            onClick={onOpenNewProject}
            className="flex-1 sm:flex-none bg-[#fdb612] hover:bg-[#fdb612]/90 text-[#231d0f] font-semibold px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Projeto</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white dark:bg-[#231d0f] border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="size-10 rounded-xl bg-[#fdb612]/10 flex items-center justify-center text-[#fdb612] group-hover:scale-110 transition-transform">
                {i === 0 && <TrendingUp className="w-5 h-5" />}
                {i === 1 && <Users className="w-5 h-5" />}
                {i === 2 && <Zap className="w-5 h-5" />}
                {i === 3 && <DollarSign className="w-5 h-5" />}
              </div>
              <span className={cn(
                "text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest flex items-center gap-1",
                stat.trend === 'up' ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
              )}>
                {stat.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {stat.change}
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest">{stat.label}</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-[#231d0f] border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h4 className="text-lg font-black text-slate-900 dark:text-slate-100">Crescimento Mensal</h4>
                <p className="text-xs text-slate-400">Comparativo de vendas realizadas por mês</p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setActiveYears(prev => ({ ...prev, current: !prev.current }))}
                  className={cn(
                    "flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-opacity",
                    activeYears.current ? "text-slate-900 dark:text-slate-100" : "text-slate-400 opacity-50"
                  )}
                >
                  <span className="size-2 bg-[#fdb612] rounded-full"></span> Este Ano
                </button>
                <button 
                  onClick={() => setActiveYears(prev => ({ ...prev, previous: !prev.previous }))}
                  className={cn(
                    "flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-opacity",
                    activeYears.previous ? "text-slate-900 dark:text-slate-100" : "text-slate-400 opacity-50"
                  )}
                >
                  <span className="size-2 bg-[#fdb612]/30 rounded-full"></span> Ano Passado
                </button>
              </div>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#fdb612" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#fdb612" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      backgroundColor: '#231d0f',
                      color: '#fff'
                    }}
                  />
                  {activeYears.previous && (
                    <Area 
                      type="monotone" 
                      dataKey="previous" 
                      stroke="#fdb612" 
                      strokeWidth={2} 
                      strokeDasharray="5 5"
                      fill="transparent" 
                    />
                  )}
                  {activeYears.current && (
                    <Area 
                      type="monotone" 
                      dataKey="current" 
                      stroke="#fdb612" 
                      strokeWidth={4} 
                      fillOpacity={1} 
                      fill="url(#colorCurrent)" 
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-[#231d0f] border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
              <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-slate-100 mb-6">Funil de Vendas</h4>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={funnelData} margin={{ left: 40 }}>
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }}
                    />
                    <Tooltip cursor={{ fill: 'transparent' }} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                      {funnelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white dark:bg-[#231d0f] border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
              <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-slate-100 mb-6">Status dos Projetos</h4>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'No Prazo', value: 65, fill: '#10b981' },
                        { name: 'Em Planejamento', value: 25, fill: '#fdb612' },
                        { name: 'Atrasado', value: 10, fill: '#ef4444' },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#fdb612" />
                      <Cell fill="#ef4444" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-2">
                <div className="flex items-center gap-1.5">
                  <div className="size-2 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase">No Prazo</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="size-2 rounded-full bg-[#fdb612]" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Planejamento</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="size-2 rounded-full bg-red-500" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Atrasado</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#231d0f] border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm flex flex-col">
          <h4 className="text-lg font-black text-slate-900 dark:text-slate-100 mb-6">Atividades Recentes</h4>
          <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar pr-2">
            {RECENT_ACTIVITIES.map((activity) => (
              <div key={activity.id} className="flex gap-4 group cursor-pointer">
                <div className={cn(
                  "mt-1 flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                  activity.type === 'installation' && "bg-emerald-100 text-emerald-600",
                  activity.type === 'proposal' && "bg-[#fdb612]/20 text-[#fdb612]",
                  activity.type === 'payment' && "bg-blue-100 text-blue-600",
                  activity.type === 'alert' && "bg-rose-100 text-rose-600"
                )}>
                  {activity.type === 'installation' && <CheckCircle className="w-5 h-5" />}
                  {activity.type === 'proposal' && <FileText className="w-5 h-5" />}
                  {activity.type === 'payment' && <DollarSign className="w-5 h-5" />}
                  {activity.type === 'alert' && <AlertCircle className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{activity.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{activity.description}</p>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-black flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <button 
            onClick={() => showToast('Carregando histórico completo de atividades...')}
            className="w-full mt-8 py-3 text-xs font-black uppercase tracking-widest text-[#fdb612] hover:bg-[#fdb612]/10 rounded-xl transition-colors border border-dashed border-[#fdb612]/30"
          >
            Ver Todas as Atividades
          </button>
        </div>
      </div>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-bold font-display">Canteiros de Obras Ativos</h4>
          <button 
            onClick={onManageProjects}
            className="text-sm text-[#fdb612] hover:underline font-medium"
          >
            Gerenciar Projetos
          </button>
        </div>
        <div className="bg-white dark:bg-white/5 border border-[#fdb612]/10 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-white/5 border-b border-[#fdb612]/10">
                <tr>
                  <th 
                    className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-2">
                      Nome do Projeto
                      <SortIndicator field="name" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                    onClick={() => handleSort('projectId')}
                  >
                    <div className="flex items-center gap-2">
                      ID
                      <SortIndicator field="projectId" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                    onClick={() => handleSort('stage')}
                  >
                    <div className="flex items-center gap-2">
                      Fase
                      <SortIndicator field="stage" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                    onClick={() => handleSort('progress')}
                  >
                    <div className="flex items-center gap-2">
                      Progresso
                      <SortIndicator field="progress" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#fdb612]/10">
                {sortedInstallations.slice(0, 5).map((project) => (
                  <tr key={project.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-medium">{project.name}</td>
                    <td className="px-6 py-4 text-slate-500 font-mono text-xs">{project.projectId}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 text-[10px] font-bold rounded-full uppercase bg-[#fdb612]/20 text-[#fdb612]">
                        {project.stage}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-slate-200 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[#fdb612] transition-all duration-500" 
                            style={{ width: `${project.progress}%` }} 
                          />
                        </div>
                        <span className="text-xs font-bold">{project.progress}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};

const ArrowUpward = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
);

const ArrowDownward = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
);
