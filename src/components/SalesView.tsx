import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, DollarSign, Target, Users, ArrowUpRight, ArrowDownRight, Edit2, Save, X, Trophy, Calendar } from 'lucide-react';
import { cn } from '../lib/utils';
import { Proposal, SalesGoal } from '../types';
import { syncCollection, updateDocument, createDocument } from '../firestoreUtils';
import { motion, AnimatePresence } from 'motion/react';

interface SalesViewProps {
  proposals: Proposal[];
}

export const SalesView: React.FC<SalesViewProps> = ({ proposals }) => {
  const [toast, setToast] = useState<string | null>(null);
  const [goals, setGoals] = useState<SalesGoal[]>([]);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const [monthFilter, setMonthFilter] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  
  const currentGoal = useMemo(() => {
    return goals.find(g => g.month === monthFilter) || {
      id: '',
      month: monthFilter,
      targetValue: 200000,
      targetCount: 10,
      createdAt: new Date().toISOString()
    };
  }, [goals, monthFilter]);

  const [editGoal, setEditGoal] = useState({
    targetValue: currentGoal.targetValue,
    targetCount: currentGoal.targetCount
  });

  useEffect(() => {
    const unsubscribe = syncCollection<SalesGoal>('salesGoals', setGoals, 'createdAt');
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setEditGoal({
      targetValue: currentGoal.targetValue,
      targetCount: currentGoal.targetCount
    });
  }, [currentGoal]);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveGoal = async () => {
    try {
      if (currentGoal.id) {
        await updateDocument('salesGoals', currentGoal.id, editGoal);
      } else {
        await createDocument('salesGoals', {
          ...editGoal,
          month: monthFilter,
          createdAt: new Date().toISOString()
        });
      }
      setIsEditingGoal(false);
      showToast('Metas atualizadas com sucesso!');
    } catch (error) {
      showToast('Erro ao salvar metas.');
    }
  };

  const currentMonthSales = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return proposals.filter(p => {
      const [day, month, year] = p.date.split('/').map(Number);
      const propDate = new Date(year, month - 1, day);
      return p.status === 'accepted' && propDate >= startOfMonth;
    });
  }, [proposals]);

  const stats = useMemo(() => {
    const totalValue = currentMonthSales.reduce((acc, p) => acc + (parseFloat(p.value.replace(/[^\d,]/g, '').replace(',', '.')) || 0), 0);
    const count = currentMonthSales.length;
    const avgValue = count > 0 ? totalValue / count : 0;
    
    // Comparison with last month (simplified)
    return [
      { 
        label: 'Vendas no Mês', 
        value: `R$ ${totalValue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`, 
        change: '+12.5%', 
        trend: 'up', 
        icon: DollarSign,
        progress: (totalValue / currentGoal.targetValue) * 100
      },
      { 
        label: 'Contratos Fechados', 
        value: count.toString(), 
        trend: 'neutral', 
        icon: Users,
        progress: (count / currentGoal.targetCount) * 100
      },
      { 
        label: 'Ticket Médio', 
        value: `R$ ${avgValue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`, 
        trend: 'up', 
        icon: Target 
      },
      { 
        label: 'Conversão', 
        value: '18.4%', 
        trend: 'down', 
        icon: TrendingUp 
      },
    ];
  }, [currentMonthSales, currentGoal]);

  const salesToDisplay = useMemo(() => {
    const sorted = [...proposals].sort((a, b) => {
      const [ad, am, ay] = a.date.split('/').map(Number);
      const [bd, bm, by] = b.date.split('/').map(Number);
      return new Date(by, bm - 1, bd).getTime() - new Date(ay, am - 1, ad).getTime();
    });
    return showAll ? sorted : sorted.slice(0, 5);
  }, [proposals, showAll]);

  return (
    <div className="space-y-8 relative">
      {toast && (
        <div className="fixed bottom-8 right-8 z-[200] bg-[#231d0f] text-white px-6 py-3 rounded-xl shadow-2xl border border-[#fdb612]/30 animate-in slide-in-from-right duration-300 flex items-center gap-3">
          <div className="size-2 bg-[#fdb612] rounded-full animate-pulse" />
          <span className="font-bold text-sm">{toast}</span>
        </div>
      )}
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-[#fdb612]" />
            Gestão de Vendas
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Acompanhe o desempenho comercial e alcance suas metas.</p>
        </div>
        
        <div className="bg-white dark:bg-[#231d0f] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Meta Mensal</p>
              <div className="flex items-baseline gap-2">
                <span className="font-black text-slate-900 dark:text-slate-100">
                  R$ {currentGoal.targetValue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                </span>
                <span className="text-xs text-slate-400 font-bold">({currentGoal.targetCount} vendas)</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setIsEditingGoal(!isEditingGoal)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg text-slate-400 hover:text-[#fdb612] transition-colors"
          >
            {isEditingGoal ? <X className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isEditingGoal && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 mb-8 grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500">Mês de Referência</label>
                <input 
                  type="month"
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612] font-black"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500">Valor Alvo (R$)</label>
                <input 
                  type="number"
                  value={editGoal.targetValue}
                  onChange={(e) => setEditGoal({ ...editGoal, targetValue: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612] font-black"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500">Qtd. de Vendas</label>
                <input 
                  type="number"
                  value={editGoal.targetCount}
                  onChange={(e) => setEditGoal({ ...editGoal, targetCount: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612] font-black"
                />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleSaveGoal}
                  className="flex-1 bg-[#fdb612] text-[#231d0f] px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-[#fdb612]/20 active:scale-95 transition-all"
                >
                  <Save className="w-4 h-4" />
                  Salvar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white dark:bg-[#231d0f]/40 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-[#fdb612]/10 rounded-2xl group-hover:bg-[#fdb612] group-hover:text-[#231d0f] transition-all">
                  <Icon className="w-5 h-5 text-[#fdb612] group-hover:text-inherit" />
                </div>
                {stat.change && (
                  <div className={`flex items-center gap-1 text-xs font-black ${stat.trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {stat.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {stat.change}
                  </div>
                )}
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
              <div className="flex items-baseline justify-between mt-1 mb-2">
                <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{stat.value}</p>
                {stat.progress !== undefined && (
                  <span className="text-xs font-black text-[#fdb612]">{stat.progress.toFixed(0)}%</span>
                )}
              </div>
              {stat.progress !== undefined && (
                <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#fdb612] transition-all duration-1000 shadow-[0_0_8px_rgba(253,182,18,0.5)]"
                    style={{ width: `${Math.min(stat.progress, 100)}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-white dark:bg-[#231d0f]/40 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm backdrop-blur-sm">
        <div className="p-8 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-[#231d0f]/20">
          <div>
            <h3 className="font-black text-xl text-slate-900 dark:text-slate-100 uppercase tracking-tight flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#fdb612]" />
              {showAll ? 'Histórico de Vendas' : 'Vendas Recentes'}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
              {showAll ? 'Todos os contratos registrados' : 'Últimos 5 contratos fechados'}
            </p>
          </div>
          <button 
            onClick={() => setShowAll(!showAll)}
            className="px-6 py-3 text-xs font-black uppercase tracking-widest text-[#fdb612] hover:bg-[#fdb612] hover:text-[#231d0f] rounded-xl transition-all border border-[#fdb612]/30 active:scale-95"
          >
            {showAll ? 'Ver Recentes' : 'Ver Todas'}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-white/5 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                <th className="px-8 py-5">Cliente</th>
                <th className="px-8 py-5">Valor / Sistema</th>
                <th className="px-8 py-5">Consultor</th>
                <th className="px-8 py-5">Data</th>
                <th className="px-8 py-5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {salesToDisplay.map((proposal) => (
                <tr key={proposal.id} className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-all group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="size-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm font-black text-slate-500 group-hover:bg-[#fdb612]/10 group-hover:text-[#fdb612] transition-all">
                        {proposal.client.charAt(0)}
                      </div>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{proposal.client}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <p className="font-black text-slate-900 dark:text-slate-100">
                      {typeof proposal.value === 'number' 
                        ? proposal.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
                        : proposal.value}
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{proposal.systemSize}</p>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                      <div className="size-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[8px] font-black uppercase">
                        {proposal.representative.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{proposal.representative}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-slate-500 dark:text-slate-500 text-xs font-black uppercase tracking-widest">{proposal.date}</td>
                  <td className="px-8 py-5">
                    <span className={cn(
                      "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest",
                      proposal.status === 'accepted' 
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                        : proposal.status === 'sent'
                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                        : 'bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400'
                    )}>
                      {proposal.status === 'accepted' ? 'Fechado' : proposal.status === 'sent' ? 'Enviado' : 'Em Aberto'}
                    </span>
                  </td>
                </tr>
              ))}
              {salesToDisplay.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-slate-400 italic font-medium">
                    Nenhuma venda registrada para este período.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
