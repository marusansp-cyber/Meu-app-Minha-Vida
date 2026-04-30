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
  LineChart,
  Line,
  Legend,
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
  Percent,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { RECENT_ACTIVITIES } from '../constants';
import { cn, parseDate, formatDate } from '../lib/utils';
import { motion } from 'motion/react';

import { Lead, Proposal, Installation, User as UserType } from '../types';

interface DashboardViewProps {
  installations: Installation[];
  leads: Lead[];
  proposals: Proposal[];
  user: UserType | null;
  isDarkMode?: boolean;
  onOpenNewProject: () => void;
  onManageProjects: () => void;
  onAddCollaborator?: () => void;
  onGoToLeads?: () => void;
}

type SortField = 'name' | 'projectId' | 'stage' | 'progress';
type SortOrder = 'asc' | 'desc';

export const DashboardView: React.FC<DashboardViewProps> = ({ 
  installations, 
  leads, 
  proposals, 
  user, 
  isDarkMode = false,
  onOpenNewProject, 
  onManageProjects,
  onAddCollaborator,
  onGoToLeads
}) => {
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [timeRange, setTimeRange] = useState('30');
  const [activeYears, setActiveYears] = useState({ current: true, previous: true });
  const [toast, setToast] = useState<string | null>(null);

  const dynamicChartData = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const currentYear = new Date().getFullYear();
    
    const hasData = (proposals || []).some(p => p.status === 'accepted');
    
    return months.map((month, index) => {
      const monthProposals = (proposals || []).filter(p => {
        const pDate = parseDate(p.date);
        return pDate.getMonth() === index && pDate.getFullYear() === currentYear && p.status === 'accepted';
      });
      
      const previousYearProposals = (proposals || []).filter(p => {
        const pDate = parseDate(p.date);
        return pDate.getMonth() === index && pDate.getFullYear() === currentYear - 1 && p.status === 'accepted';
      });

      // Fallback to slight variation for visual if no data exists, but prioritize real data
      return {
        name: month,
        current: activeYears.current ? (hasData ? monthProposals.length : [45, 52, 38, 65, 48, 72, 55, 60, 42, 58, 63, 70][index]) : 0,
        previous: activeYears.previous ? (hasData ? previousYearProposals.length : [40, 45, 30, 55, 42, 60, 50, 52, 38, 50, 55, 62][index]) : 0
      };
    });
  }, [proposals, activeYears]);

  const pieData = useMemo(() => {
    const residence = (installations || []).filter(i => i.type === 'residence' || i.type === 'home').length;
    const industrial = (installations || []).filter(i => i.type === 'industrial').length;
    const commercial = (installations || []).filter(i => i.type === 'apartment').length;

    const hasData = (installations || []).length > 0;

    return [
      { name: 'Residencial', value: hasData ? residence : 45, fill: '#fdb612' },
      { name: 'Industrial', value: hasData ? industrial : 30, fill: '#fdb612cc' },
      { name: 'Comercial', value: hasData ? commercial : 25, fill: '#fdb61299' },
    ];
  }, [installations]);

  const projectStatusData = useMemo(() => {
    const onTime = (installations || []).filter(i => i.status === 'on-time' || i.status === 'concluded' || !i.status).length;
    const planning = (installations || []).filter(i => (i.stage || '').toLowerCase().includes('engenharia') || (i.stage || '').toLowerCase().includes('projeto')).length;
    const delayed = (installations || []).filter(i => i.status === 'delayed').length;
    
    const hasData = (installations || []).length > 0;
    
    return [
      { name: 'No Prazo', value: hasData ? onTime : 65, fill: '#10b981' },
      { name: 'Em Planejamento', value: hasData ? planning : 25, fill: '#fdb612' },
      { name: 'Atrasado', value: hasData ? delayed : 10, fill: '#ef4444' },
    ];
  }, [installations]);

  const funnelData = useMemo(() => {
    const totalLeads = (leads || []).length;
    const sentProposals = (proposals || []).filter(p => p.status === 'sent' || p.status === 'accepted').length;
    const acceptedProposals = (proposals || []).filter(p => p.status === 'accepted').length;
    const negotiation = (proposals || []).filter(p => p.status === 'pending').length;
    
    return [
      { name: 'Leads', value: totalLeads || 120, fill: '#fdb612' },
      { name: 'Vistorias', value: Math.round(totalLeads * 0.6) || 80, fill: '#fdb612cc' },
      { name: 'Simulações', value: sentProposals || 45, fill: '#fdb61299' },
      { name: 'Negociação', value: negotiation || 25, fill: '#fdb61266' },
      { name: 'Fechados', value: acceptedProposals || 12, fill: '#fdb61233' },
    ];
  }, [leads, proposals]);

  const consultantData = useMemo(() => {
    const reps: Record<string, { name: string, totalValue: number, wonCount: number }> = {};
    
    proposals.filter(p => p.status === 'accepted').forEach(p => {
      const repName = p.representative || 'Vendedor';
      if (!reps[repName]) {
        reps[repName] = { name: repName, totalValue: 0, wonCount: 0 };
      }
      const val = typeof p.value === 'number' ? p.value : (parseFloat(String(p.value || 0).replace(/[^\d,]/g, '').replace(',', '.')) || 0);
      reps[repName].totalValue += val;
      reps[repName].wonCount += 1;
    });

    return Object.values(reps)
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 5);
  }, [proposals]);

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // Current Month Totals
    const currentMonthAcceptedProposals = (proposals || []).filter(p => {
      const pDate = parseDate(p.date);
      return pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear && p.status === 'accepted';
    });

    const currentMonthRevenue = currentMonthAcceptedProposals.reduce((acc, p) => {
      const val = typeof p.value === 'number' ? p.value : (parseFloat(String(p.value || 0).replace(/[^\d,]/g, '').replace(',', '.')) || 0);
      return acc + val;
    }, 0);

    const currentMonthLeads = (leads || []).filter(l => {
      const lDate = parseDate(l.history?.[0]?.date);
      return lDate.getMonth() === currentMonth && lDate.getFullYear() === currentYear;
    }).length;

    // Last Month Totals for Variation
    const lastMonthAcceptedProposals = (proposals || []).filter(p => {
      const pDate = parseDate(p.date);
      return pDate.getMonth() === lastMonth && pDate.getFullYear() === lastMonthYear && p.status === 'accepted';
    });

    const lastMonthRevenue = lastMonthAcceptedProposals.reduce((acc, p) => {
      const val = typeof p.value === 'number' ? p.value : (parseFloat(String(p.value || 0).replace(/[^\d,]/g, '').replace(',', '.')) || 0);
      return acc + val;
    }, 0);

    const lastMonthLeads = (leads || []).filter(l => {
      const lDate = parseDate(l.history?.[0]?.date);
      return lDate.getMonth() === lastMonth && lDate.getFullYear() === lastMonthYear;
    }).length;

    const calculateVariation = (current: number, last: number) => {
      if (last === 0) return current > 0 ? '+100%' : '0%';
      const variation = ((current - last) / last) * 100;
      return `${variation > 0 ? '+' : ''}${variation.toFixed(1)}%`;
    };

    const revenueVariation = calculateVariation(currentMonthRevenue, lastMonthRevenue);
    const leadsVariation = calculateVariation(currentMonthLeads, lastMonthLeads);

    const conversionRate = (leads || []).length > 0 
      ? (((proposals || []).filter(p => p.status === 'accepted').length / (leads || []).length) * 100)
      : 0;

    const baseStats = [
      { 
        label: 'Vendas do Mês', 
        value: `R$ ${currentMonthRevenue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`, 
        change: revenueVariation, 
        trend: currentMonthRevenue >= lastMonthRevenue ? 'up' : 'down' 
      },
      { 
        label: 'Leads no Mês', 
        value: currentMonthLeads.toString(), 
        change: leadsVariation, 
        trend: currentMonthLeads >= lastMonthLeads ? 'up' : 'down' 
      },
      { 
        label: 'Projetos Ativos', 
        value: (installations || []).length.toString(), 
        change: '+5%', 
        trend: 'up' 
      },
      { 
        label: 'Taxa de Conversão', 
        value: `${conversionRate.toFixed(1)}%`, 
        change: '+2.4%', 
        trend: 'up' 
      },
    ];

    if (user?.role === 'admin' || user?.role === 'finance') {
      const pendingCommissions = (proposals || [])
        .filter(p => p.status === 'accepted' && p.commissionStatus !== 'paid')
        .reduce((acc, p) => {
          const val = typeof p.value === 'number' ? p.value : (parseFloat(String(p.value || 0).replace(/[^\d,]/g, '').replace(',', '.')) || 0);
          const rate = p.commission || 5;
          return acc + (val * (rate / 100));
        }, 0);
      
      baseStats[3] = { label: 'Comissões Pendentes', value: `R$ ${pendingCommissions.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`, change: '-3%', trend: 'down' };
    }

    return baseStats;
  }, [leads, proposals, installations, user]);

  const barChartData = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Get last 6 months
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      let m = currentMonth - i;
      let y = currentYear;
      if (m < 0) {
        m += 12;
        y -= 1;
      }
      last6Months.push({ m, y, name: months[m] });
    }

    return last6Months.map(({ m, y, name }) => {
      const currentYearRevenue = (proposals || [])
        .filter(p => {
          const pDate = parseDate(p.date);
          return pDate.getMonth() === m && pDate.getFullYear() === y && p.status === 'accepted';
        })
        .reduce((acc, p) => acc + (typeof p.value === 'number' ? p.value : (parseFloat(String(p.value || 0).replace(/[^\d,]/g, '').replace(',', '.')) || 0)), 0);

      const previousYearRevenue = (proposals || [])
        .filter(p => {
          const pDate = parseDate(p.date);
          return pDate.getMonth() === m && pDate.getFullYear() === y - 1 && p.status === 'accepted';
        })
        .reduce((acc, p) => acc + (typeof p.value === 'number' ? p.value : (parseFloat(String(p.value || 0).replace(/[^\d,]/g, '').replace(',', '.')) || 0)), 0);

      return {
        name,
        atual: currentYearRevenue / 1000, // in kR$
        anterior: previousYearRevenue / 1000
      };
    });
  }, [proposals]);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const recentActivities = useMemo(() => {
    const activities: any[] = [];
    
    leads.forEach(lead => {
      (lead.history || []).slice(0, 2).forEach(h => {
        const activityDate = parseDate(h.date);
        activities.push({
          id: `lead-${lead.id}-${h.date}`,
          type: 'proposal', 
          title: lead.name,
          description: h.action, // Changed from h.note which doesn't exist to h.action
          time: h.date,
          timestamp: activityDate.getTime() || 0
        });
      });
    });
    
    installations.forEach(inst => {
      activities.push({
        id: `inst-${inst.id}`,
        type: 'installation',
        title: inst.name,
        description: `Projeto em fase de ${inst.stage}`,
        time: inst.lastUpdated ? formatDate(inst.lastUpdated) : 'Recente',
        timestamp: inst.lastUpdated ? parseDate(inst.lastUpdated).getTime() : Date.now()
      });
    });

    if (activities.length === 0) return RECENT_ACTIVITIES;

    return activities
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5);
  }, [leads, installations]);

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
            onClick={() => {
              showToast('Filtro de período: Últimos 30 Dias aplicado');
            }}
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <button 
          onClick={onManageProjects}
          className="p-4 bg-white dark:bg-[#231d0f] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all group flex flex-col items-center text-center gap-2"
        >
          <div className="size-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Zap className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Instalações</span>
        </button>
        <button 
          onClick={onAddCollaborator}
          className="p-4 bg-white dark:bg-[#231d0f] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all group flex flex-col items-center text-center gap-2"
        >
          <div className="size-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Users className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Novo Colaborador</span>
        </button>
        <motion.button 
          whileHover={{ scale: 1.02, translateY: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={onGoToLeads}
          className="p-4 bg-white dark:bg-[#231d0f] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all group flex flex-col items-center text-center gap-2"
        >
          <div className="size-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <FileText className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nova Simulação</span>
        </motion.button>
        <button 
          onClick={() => showToast('Histórico de interações atualizado')}
          className="p-4 bg-white dark:bg-[#231d0f] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all group flex flex-col items-center text-center gap-2"
        >
          <div className="size-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Clock className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Histórico Leads</span>
        </button>
      </div>

      <div className="bg-white dark:bg-[#231d0f] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden p-1 inline-grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <div key={i} className={cn(
            "p-6 transition-all group hover:bg-slate-50 dark:hover:bg-white/5",
            i < 3 && "lg:border-r border-slate-100 dark:border-slate-800",
            i % 2 === 0 && "sm:border-r sm:border-slate-100 dark:sm:border-slate-800",
            i < 2 && "border-b sm:border-b-0 border-slate-100 dark:border-slate-800",
            i >= 2 && "border-t sm:border-t-0 lg:border-t-0 border-slate-100 dark:border-slate-800"
          )}>
            <div className="flex items-center justify-between mb-4">
              <div className="size-10 rounded-xl bg-[#fdb612]/10 flex items-center justify-center text-[#fdb612] group-hover:scale-110 transition-transform">
                {stat.label.includes('Vendas') && <TrendingUp className="w-5 h-5" />}
                {stat.label.includes('Leads') && <Users className="w-5 h-5" />}
                {stat.label.includes('Projetos') && <Zap className="w-5 h-5" />}
                {stat.label.includes('Margem') && <Percent className="w-5 h-5" />}
                {stat.label.includes('Comissão') && <DollarSign className="w-5 h-5" />}
                {stat.label.includes('Conversão') && <ArrowUpRight className="w-5 h-5" />}
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
          <div className="bg-white dark:bg-[#231d0f] border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm mb-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h4 className="text-lg font-black text-slate-900 dark:text-slate-100">Ranking de Consultores</h4>
                <p className="text-xs text-slate-400">Total em vendas e volume de contratos fechados por representante</p>
              </div>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={consultantData} layout="vertical" margin={{ left: 40, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={isDarkMode ? '#334155' : '#f1f5f9'} />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 800 }}
                    width={100}
                  />
                  <Tooltip 
                    cursor={{ fill: isDarkMode ? '# white/5' : '#f8fafc' }}
                    contentStyle={{ 
                      borderRadius: '16px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      backgroundColor: isDarkMode ? '#1e293b' : '#231d0f',
                      color: '#fff'
                    }}
                    formatter={(value: any, name: string) => [
                      name === 'totalValue' ? `R$ ${value.toLocaleString('pt-BR')}` : value,
                      name === 'totalValue' ? 'Valor Total' : 'Contratos Ganhos'
                    ]}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase' }} />
                  <Bar dataKey="totalValue" name="Valor das Vendas" fill="#fdb612" radius={[0, 4, 4, 0]} barSize={12} />
                  <Bar dataKey="wonCount" name="Contratos Ganhos" fill="#10b981" radius={[0, 4, 4, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-[#231d0f] border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm mb-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h4 className="text-lg font-black text-slate-900 dark:text-slate-100">Vendas Históricas (6 Meses)</h4>
                <p className="text-xs text-slate-400">Comparativo mensal de propostas aceitas com o ano anterior</p>
              </div>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#f1f5f9'} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 800 }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 800 }}
                    tickFormatter={(val) => `R$ ${val}k`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '16px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      backgroundColor: isDarkMode ? '#1e293b' : '#231d0f',
                      color: '#fff'
                    }}
                    formatter={(val: any) => [`R$ ${val}k`, 'Receita']}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase' }} />
                  <Line type="monotone" dataKey="atual" name="Ano Atual" stroke="#fdb612" strokeWidth={4} dot={{ r: 6, fill: '#fdb612', strokeWidth: 3, stroke: '#fff' }} activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="anterior" name="Ano Anterior" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4, fill: '#94a3b8', strokeWidth: 2, stroke: '#fff' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-[#231d0f] border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h4 className="text-lg font-black text-slate-900 dark:text-slate-100">Simulações Recentes</h4>
                <p className="text-xs text-slate-400">Distribuição de propostas aceitas ao longo do ano</p>
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
                <AreaChart data={dynamicChartData}>
                  <defs>
                    <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#fdb612" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#fdb612" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#f1f5f9'} />
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
                      backgroundColor: isDarkMode ? '#1e293b' : '#231d0f',
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
                      data={projectStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {projectStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-2">
                {projectStatusData.map((item, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className="size-2 rounded-full" style={{ backgroundColor: item.fill }} />
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#231d0f] border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm flex flex-col">
          <h4 className="text-lg font-black text-slate-900 dark:text-slate-100 mb-6">Atividades Recentes</h4>
          <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar pr-2">
            {recentActivities.map((activity) => (
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
