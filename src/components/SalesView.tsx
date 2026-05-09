import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, DollarSign, Target, Users, ArrowUpRight, ArrowDownRight, Edit2, Save, X, Trophy, Calendar, Plus, Trash2, Send, Eye, Download, Database, Search, Filter } from 'lucide-react';
import { cn } from '../lib/utils';
import { Proposal, SalesGoal, User as UserType, Kit, Lead, Client } from '../types';
import { syncCollection, updateDocument, createDocument, deleteDocument } from '../firestoreUtils';
import { motion, AnimatePresence } from 'motion/react';
import { NewProposalModal } from './NewProposalModal';
import { ProposalDetailsModal } from './ProposalDetailsModal';
import { generateProposalPDF } from '../services/pdfService';
import { sendProposalEmail } from '../services/emailService';

interface SalesViewProps {
  proposals: Proposal[];
  user: UserType | null;
  kits?: Kit[];
  leads?: Lead[];
  clients?: Client[];
  preFill?: Partial<Proposal> | null;
  onPreFillComplete?: () => void;
}

export const SalesView: React.FC<SalesViewProps> = ({ 
  proposals, 
  user, 
  kits = [], 
  leads = [], 
  clients = [],
  preFill,
  onPreFillComplete
}) => {
  const [toast, setToast] = useState<string | null>(null);
  const [goals, setGoals] = useState<SalesGoal[]>([]);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    cpfCnpj: '',
    hasProject: 'all',
    clientType: 'all',
    status: 'pending' // Default to pending as requested in another part of the prompt, or just make sure it's an option
  });

  const [isSendingEmail, setIsSendingEmail] = useState<string | null>(null);

  const handleToggleCommission = async (proposal: Proposal) => {
    try {
      const newStatus = proposal.commissionStatus === 'paid' ? 'pending' : 'paid';
      await updateDocument('proposals', proposal.id, { commissionStatus: newStatus });
      showToast(`Comissão marcada como ${newStatus === 'paid' ? 'paga' : 'pendente'}.`);
    } catch (error) {
      showToast('Erro ao atualizar comissão.');
    }
  };

  const handleSendEmail = async (proposal: Proposal) => {
    setIsSendingEmail(proposal.id);
    try {
      const kit = kits.find(k => k.id === proposal.kitId);
      
      const pdfBase64 = await generateProposalPDF(proposal, kit);
      const result = await sendProposalEmail({
        to: proposal.email || proposal.cpfCnpj || '', // Fallback or prompt for email
        subject: `Proposta Solar - ${proposal.client}`,
        body: `Olá ${proposal.client},\n\nSegue em anexo a proposta detalhada para seu sistema fotovoltaico.\n\nPor favor, confirme o recebimento deste e-mail.\n\nAtenciosamente,\nEquipe Vieira's Solar`,
        pdfBase64,
        fileName: `proposta_${proposal.client.replace(/\s+/g, '_')}.pdf`
      });

      if (result.success) {
        showToast('E-mail enviado com sucesso!');
        await updateDocument('proposals', proposal.id, { status: 'sent' });
      } else {
        showToast(result.message);
      }
    } catch (error) {
      showToast('Erro ao enviar e-mail.');
    } finally {
      setIsSendingEmail(null);
    }
  };

  const handleDownloadPDF = async (proposal: Proposal) => {
    try {
      const kit = kits.find(k => k.id === proposal.kitId);
      const pdfDataUri = await generateProposalPDF(proposal, kit);
      const link = document.createElement('a');
      link.href = pdfDataUri;
      link.download = `proposta_${proposal.client.replace(/\s+/g, '_')}.pdf`;
      link.click();
    } catch (error) {
      showToast('Erro ao gerar PDF.');
    }
  };

  useEffect(() => {
    if (preFill) {
      setSelectedProposal(preFill as Proposal);
      setIsModalOpen(true);
      if (onPreFillComplete) onPreFillComplete();
    }
  }, [preFill, onPreFillComplete]);

  const [monthFilter, setMonthFilter] = useState(() => {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return nextMonth.toISOString().slice(0, 7);
  }); // YYYY-MM
  
  const currentGoal = useMemo(() => {
    return goals.find(g => g.month === monthFilter) || {
      id: '',
      month: monthFilter,
      targetValue: monthFilter === '2025-05' ? 250000 : 200000,
      targetCount: monthFilter === '2025-05' ? 15 : 10,
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

  const handleAddProposal = async (proposalData: Proposal) => {
    try {
      if (proposalData.id) {
        const { id, ...data } = proposalData;
        await updateDocument('proposals', id, data);
        showToast('Proposta atualizada com sucesso!');
      } else {
        await createDocument('proposals', {
          ...proposalData,
          date: new Date().toLocaleDateString('pt-BR'),
          createdAt: new Date().toISOString()
        });
        showToast('Nova proposta criada!');
      }
      setIsModalOpen(false);
      setSelectedProposal(null);
    } catch (error) {
      showToast('Erro ao salvar proposta.');
    }
  };

  const handleDeleteProposal = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta proposta?')) {
      try {
        await deleteDocument('proposals', id);
        showToast('Proposta excluída.');
      } catch (error) {
        showToast('Erro ao excluir.');
      }
    }
  };

  const handleBackupActiveProposals = () => {
    const activeProposals = proposals.filter(p => p.status === 'accepted');
    if (activeProposals.length === 0) {
      showToast('Nenhuma proposta ativa encontrada para backup.');
      return;
    }

    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      count: activeProposals.length,
      data: activeProposals
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_propostas_ativas_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Backup das propostas ativas concluído!');
  };

  const stats = useMemo(() => {
    const totalValue = currentMonthSales.reduce((acc, p) => acc + (typeof p.value === 'number' ? p.value : (parseFloat(String(p.value || 0).replace(/[^\d,]/g, '').replace(',', '.')) || 0)), 0);
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

  const filteredProposals = useMemo(() => {
    return proposals.filter(p => {
      // Search term
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        p.client.toLowerCase().includes(searchLower) ||
        (p.proposalNumber && p.proposalNumber.toLowerCase().includes(searchLower)) ||
        p.id.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      // Status
      if (filters.status !== 'all' && p.status !== filters.status) return false;

      // Date Range
      if (filters.startDate || filters.endDate) {
        const [day, month, year] = p.date.split('/').map(Number);
        const propDate = new Date(year, month - 1, day);
        
        if (filters.startDate) {
          const start = new Date(filters.startDate);
          if (propDate < start) return false;
        }
        if (filters.endDate) {
          const end = new Date(filters.endDate);
          end.setHours(23, 59, 59, 999);
          if (propDate > end) return false;
        }
      }

      // CPF/CNPJ
      if (filters.cpfCnpj) {
        const client = clients.find(c => c.name === p.client);
        if (!client?.document?.includes(filters.cpfCnpj)) return false;
      }

      // Has Project (Installation)
      if (filters.hasProject !== 'all') {
        const hasProject = p.status === 'accepted'; // Simplified: if accepted, usually has project
        if (filters.hasProject === 'yes' && !hasProject) return false;
        if (filters.hasProject === 'no' && hasProject) return false;
      }

      // Client Type
      if (filters.clientType !== 'all') {
        const client = clients.find(c => c.name === p.client);
        if (client?.type !== filters.clientType) return false;
      }

      return true;
    });
  }, [proposals, searchTerm, filters, clients]);

  const salesToDisplay = useMemo(() => {
    const sorted = [...filteredProposals].sort((a, b) => {
      const [ad, am, ay] = a.date.split('/').map(Number);
      const [bd, bm, by] = b.date.split('/').map(Number);
      return new Date(by, bm - 1, bd).getTime() - new Date(ay, am - 1, ad).getTime();
    });
    return showAll ? sorted : sorted.slice(0, 5);
  }, [filteredProposals, showAll]);

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
        
          <div className="flex items-center gap-3">
            <button 
              onClick={handleBackupActiveProposals}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl hover:bg-emerald-500 hover:text-white transition-all border border-emerald-500/20 font-bold text-xs uppercase tracking-widest"
              title="Backup de Propostas Ativas"
            >
              <Database className="w-4 h-4" />
              Backup Ativas
            </button>
            <button 
              onClick={() => {
                setSelectedProposal(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-[#fdb612] text-[#231d0f] rounded-xl hover:shadow-lg hover:shadow-[#fdb612]/20 transition-all border border-transparent font-black text-xs uppercase tracking-widest"
            >
              <Plus className="w-4 h-4" />
              Novo Orçamento
            </button>
            <div className="flex items-center gap-3 bg-white dark:bg-[#231d0f] border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 shadow-sm">
              <div className="size-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                <Trophy className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-0.5">Meta</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-black text-xs text-slate-900 dark:text-slate-100">
                    R$ {currentGoal.targetValue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                  </span>
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
        <div className="p-8 border-b border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex justify-between items-center bg-white dark:bg-[#231d0f]/20">
            <div>
              <h3 className="font-black text-xl text-slate-900 dark:text-slate-100 uppercase tracking-tight flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#fdb612]" />
                {showAll ? 'Histórico de Vendas' : 'Vendas Recentes'}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
                {showAll ? 'Todos os contratos registrados' : 'Últimos 5 contratos fechados'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Buscar cliente ou proposta..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612] text-sm w-64 transition-all"
                />
              </div>
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "p-2.5 rounded-xl border transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest",
                  showFilters 
                    ? "bg-[#fdb612] border-[#fdb612] text-[#231d0f]" 
                    : "bg-white dark:bg-white/5 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-[#fdb612] hover:text-[#fdb612]"
                )}
              >
                <Filter className="w-4 h-4" />
                Filtros
              </button>
              <button 
                onClick={() => setShowAll(!showAll)}
                className="px-6 py-3 text-xs font-black uppercase tracking-widest text-[#fdb612] hover:bg-[#fdb612] hover:text-[#231d0f] rounded-xl transition-all border border-[#fdb612]/30 active:scale-95"
              >
                {showAll ? 'Ver Recentes' : 'Ver Todas'}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden bg-slate-50/50 dark:bg-white/5 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6"
              >
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Início</label>
                  <input 
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs outline-none focus:ring-2 focus:ring-[#fdb612]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Fim</label>
                  <input 
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs outline-none focus:ring-2 focus:ring-[#fdb612]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">CPF / CNPJ</label>
                  <input 
                    type="text"
                    placeholder="Filtrar por documento"
                    value={filters.cpfCnpj}
                    onChange={(e) => setFilters(prev => ({ ...prev, cpfCnpj: e.target.value }))}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs outline-none focus:ring-2 focus:ring-[#fdb612]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Tipo de Cliente</label>
                  <select 
                    value={filters.clientType}
                    onChange={(e) => setFilters(prev => ({ ...prev, clientType: e.target.value }))}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs outline-none focus:ring-2 focus:ring-[#fdb612]"
                  >
                    <option value="all">Todos</option>
                    <option value="residential">Residencial</option>
                    <option value="commercial">Comercial</option>
                    <option value="industrial">Industrial</option>
                    <option value="rural">Rural</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Status da Proposta</label>
                  <select 
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs outline-none focus:ring-2 focus:ring-[#fdb612]"
                  >
                    <option value="all">Todos</option>
                    <option value="pending">Pendente (Em Aberto)</option>
                    <option value="sent">Enviado</option>
                    <option value="accepted">Aceito (Fechado)</option>
                  </select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
                <th className="px-8 py-5">Comissão</th>
                <th className="px-8 py-5 text-right">Ações</th>
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
                      <div>
                        <span className="font-bold text-slate-900 dark:text-slate-100 block">{proposal.client}</span>
                        <span className="text-[10px] text-slate-400 font-medium">#{proposal.proposalNumber || proposal.id.slice(0, 8)}</span>
                      </div>
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
                  <td className="px-8 py-5">
                    <button 
                      onClick={() => handleToggleCommission(proposal)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                        proposal.commissionStatus === 'paid'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                      )}
                    >
                      {proposal.commissionStatus === 'paid' ? 'Paga' : 'Pendente'}
                    </button>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        onClick={() => handleSendEmail(proposal)}
                        disabled={isSendingEmail === proposal.id}
                        className={cn(
                          "p-2 rounded-lg transition-all",
                          isSendingEmail === proposal.id
                            ? "bg-slate-100 text-slate-300 animate-pulse"
                            : "text-slate-400 hover:text-blue-500 hover:bg-blue-500/10"
                        )}
                        title="Enviar por E-mail"
                      >
                        <Send className={cn("w-4 h-4", isSendingEmail === proposal.id && "animate-bounce")} />
                      </button>
                      <button 
                        onClick={() => handleDownloadPDF(proposal)}
                        className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-all"
                        title="Gerar PDF detalhado"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedProposal(proposal);
                          setIsDetailsModalOpen(true);
                        }}
                        className="p-2 text-slate-400 hover:text-[#fdb612] hover:bg-[#fdb612]/10 rounded-lg transition-all"
                        title="Visualizar"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedProposal(proposal);
                          setIsModalOpen(true);
                        }}
                        className="p-2 text-slate-400 hover:text-zinc-500 hover:bg-zinc-500/10 rounded-lg transition-all"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteProposal(proposal.id)}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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

      <NewProposalModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProposal(null);
        }}
        onAdd={handleAddProposal}
        initialData={selectedProposal || undefined}
        user={user}
        kits={kits}
      />

      <ProposalDetailsModal 
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedProposal(null);
        }}
        proposal={selectedProposal || undefined}
        kits={kits}
      />
    </div>
  );
};
