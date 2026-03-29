import React, { useState, useMemo } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  Wallet, 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownRight,
  Calendar,
  User,
  MoreVertical,
  Download,
  FileText
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { cn } from '../lib/utils';
import { Proposal, User as UserType } from '../types';
import { updateDocument } from '../firestoreUtils';

interface FinanceViewProps {
  proposals: Proposal[];
  user: UserType | null;
}

export const FinanceView: React.FC<FinanceViewProps> = ({ proposals, user }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid'>('all');
  const [representativeFilter, setRepresentativeFilter] = useState('all');

  const acceptedProposals = useMemo(() => {
    return proposals.filter(p => p.status === 'accepted');
  }, [proposals]);

  const stats = useMemo(() => {
    const totalRevenue = acceptedProposals.reduce((acc, p) => {
      const val = parseFloat(p.value.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
      return acc + val;
    }, 0);

    const totalCommission = acceptedProposals.reduce((acc, p) => {
      const val = parseFloat(p.value.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
      const rate = p.commission || 5;
      return acc + (val * (rate / 100));
    }, 0);

    const paidCommission = acceptedProposals.reduce((acc, p) => {
      if (p.commissionStatus !== 'paid') return acc;
      const val = parseFloat(p.value.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
      const rate = p.commission || 5;
      return acc + (val * (rate / 100));
    }, 0);

    const pendingCommission = totalCommission - paidCommission;

    return {
      totalRevenue,
      totalCommission,
      paidCommission,
      pendingCommission
    };
  }, [acceptedProposals]);

  const chartData = useMemo(() => {
    // Group by month
    const months: Record<string, { month: string, revenue: number, commission: number }> = {};
    
    acceptedProposals.forEach(p => {
      const date = new Date(p.date.split('/').reverse().join('-'));
      const monthKey = date.toLocaleString('pt-BR', { month: 'short' });
      
      if (!months[monthKey]) {
        months[monthKey] = { month: monthKey, revenue: 0, commission: 0 };
      }
      
      const val = parseFloat(p.value.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
      const rate = p.commission || 5;
      months[monthKey].revenue += val;
      months[monthKey].commission += (val * (rate / 100));
    });

    return Object.values(months);
  }, [acceptedProposals]);

  const representativeData = useMemo(() => {
    const reps: Record<string, { name: string, value: number }> = {};
    
    acceptedProposals.forEach(p => {
      if (!reps[p.representative]) {
        reps[p.representative] = { name: p.representative, value: 0 };
      }
      const val = parseFloat(p.value.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
      const rate = p.commission || 5;
      reps[p.representative].value += (val * (rate / 100));
    });

    return Object.values(reps);
  }, [acceptedProposals]);

  const filteredProposals = useMemo(() => {
    return acceptedProposals.filter(p => {
      const matchesSearch = p.client.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           p.representative.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || p.commissionStatus === statusFilter;
      const matchesRep = representativeFilter === 'all' || p.representative === representativeFilter;
      
      return matchesSearch && matchesStatus && matchesRep;
    });
  }, [acceptedProposals, searchTerm, statusFilter, representativeFilter]);

  const handleTogglePaid = async (proposal: Proposal) => {
    const newStatus = proposal.commissionStatus === 'paid' ? 'pending' : 'paid';
    await updateDocument('proposals', proposal.id, { commissionStatus: newStatus });
  };

  const COLORS = ['#fdb612', '#231d0f', '#6366f1', '#10b981', '#f43f5e'];

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black font-display tracking-tight">Gestão Financeira</h2>
          <p className="text-slate-500 font-medium">Controle de faturamento e comissões de vendas</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors shadow-sm">
            <Download className="w-4 h-4" />
            Exportar Relatório
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="size-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-indigo-600" />
            </div>
            <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full">
              <ArrowUpRight className="w-3 h-3" />
              12%
            </span>
          </div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Faturamento Total</p>
          <h3 className="text-2xl font-black font-display">
            R$ {stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="size-12 rounded-2xl bg-[#fdb612]/10 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-[#fdb612]" />
            </div>
          </div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total em Comissões</p>
          <h3 className="text-2xl font-black font-display">
            R$ {stats.totalCommission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="size-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Comissões Pagas</p>
          <h3 className="text-2xl font-black font-display text-emerald-600">
            R$ {stats.paidCommission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="size-12 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Comissões Pendentes</p>
          <h3 className="text-2xl font-black font-display text-amber-600">
            R$ {stats.pendingCommission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h4 className="text-lg font-black font-display">Faturamento vs Comissões</h4>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full bg-[#fdb612]" />
                <span className="text-xs font-bold text-slate-500">Faturamento</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full bg-slate-200 dark:bg-slate-700" />
                <span className="text-xs font-bold text-slate-500">Comissões</span>
              </div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fontWeight: 600, fill: '#64748b' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fontWeight: 600, fill: '#64748b' }}
                  tickFormatter={(value) => `R$ ${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    padding: '12px'
                  }}
                />
                <Bar dataKey="revenue" fill="#fdb612" radius={[6, 6, 0, 0]} barSize={40} />
                <Bar dataKey="commission" fill="#e2e8f0" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <h4 className="text-lg font-black font-display mb-8">Comissões por Consultor</h4>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={representativeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {representativeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
                  }}
                  formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {representativeData.map((rep, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{rep.name}</span>
                </div>
                <span className="text-xs font-black">R$ {rep.value.toLocaleString('pt-BR')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h4 className="text-lg font-black font-display">Detalhamento de Comissões</h4>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Buscar cliente ou consultor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-[#fdb612] outline-none w-64"
              />
            </div>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#fdb612] outline-none"
            >
              <option value="all">Todos Status</option>
              <option value="pending">Pendentes</option>
              <option value="paid">Pagos</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Cliente</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Consultor</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Valor Projeto</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Comissão (%)</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Valor Comissão</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredProposals.map((prop) => {
                const projectValue = parseFloat(prop.value.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
                const commissionRate = prop.commission || 5;
                const commissionValue = projectValue * (commissionRate / 100);
                const isPaid = prop.commissionStatus === 'paid';

                return (
                  <tr key={prop.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                          <User className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-sm font-bold">{prop.client}</p>
                          <p className="text-[10px] text-slate-500">{prop.date}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium">{prop.representative}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold">R$ {projectValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-black px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        {commissionRate}%
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-black text-[#fdb612]">
                        R$ {commissionValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "text-[10px] font-black uppercase px-2 py-1 rounded-full flex items-center gap-1.5 w-fit",
                        isPaid 
                          ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30" 
                          : "bg-amber-100 text-amber-600 dark:bg-amber-900/30"
                      )}>
                        {isPaid ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {isPaid ? 'Pago' : 'Pendente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {(user?.role === 'admin' || user?.role === 'finance') && (
                          <button 
                            onClick={() => handleTogglePaid(prop)}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all",
                              isPaid
                                ? "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                            )}
                          >
                            {isPaid ? 'Estornar' : 'Marcar como Pago'}
                          </button>
                        )}
                        <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
