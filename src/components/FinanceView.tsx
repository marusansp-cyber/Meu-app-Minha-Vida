import React, { useState, useMemo, useRef } from 'react';
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
  FileText,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye
} from 'lucide-react';
import { 
  ComposedChart,
  BarChart,
  Bar, 
  Line,
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
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { ProposalDetailsModal } from './ProposalDetailsModal';
import { SMTPHelpModal } from './SMTPHelpModal';
import { HelpCircle } from 'lucide-react';

interface FinanceViewProps {
  proposals: Proposal[];
  user: UserType | null;
}

export const FinanceView: React.FC<FinanceViewProps> = ({ proposals, user }) => {
  const [activeMainTab, setActiveMainTab] = useState<'overview' | 'proposals'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [commissionStatusFilter, setCommissionStatusFilter] = useState<'all' | 'pending' | 'paid'>('all');
  const [proposalStatusFilter, setProposalStatusFilter] = useState<Proposal['status'] | 'all'>('all');
  const [representativeFilter, setRepresentativeFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const itemsPerPage = 5;
  const chartRef = useRef<HTMLDivElement>(null);

  const acceptedProposals = useMemo(() => {
    return proposals.filter(p => p.status === 'accepted');
  }, [proposals]);

  const filteredAcceptedProposals = useMemo(() => {
    return acceptedProposals.filter(p => {
      const matchesSearch = p.client.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           p.representative.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = commissionStatusFilter === 'all' || p.commissionStatus === commissionStatusFilter;
      const matchesRep = representativeFilter === 'all' || p.representative === representativeFilter;
      
      let matchesDate = true;
      if (startDate || endDate) {
        const proposalDate = new Date(p.date.split('/').reverse().join('-'));
        if (startDate) {
          const start = new Date(startDate);
          if (proposalDate < start) matchesDate = false;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (proposalDate > end) matchesDate = false;
        }
      }
      
      return matchesSearch && matchesStatus && matchesRep && matchesDate;
    });
  }, [acceptedProposals, searchTerm, commissionStatusFilter, representativeFilter, startDate, endDate]);

  const allFilteredProposals = useMemo(() => {
    return proposals.filter(p => {
      const matchesSearch = p.client.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           p.representative.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = proposalStatusFilter === 'all' || p.status === proposalStatusFilter;
      const matchesRep = representativeFilter === 'all' || p.representative === representativeFilter;
      const matchesCommissionStatus = commissionStatusFilter === 'all' || p.commissionStatus === commissionStatusFilter;
      
      let matchesDate = true;
      if (startDate || endDate) {
        const proposalDate = new Date(p.date.split('/').reverse().join('-'));
        if (startDate) {
          const start = new Date(startDate);
          if (proposalDate < start) matchesDate = false;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (proposalDate > end) matchesDate = false;
        }
      }
      
      return matchesSearch && matchesStatus && matchesRep && matchesDate && matchesCommissionStatus;
    });
  }, [proposals, searchTerm, proposalStatusFilter, representativeFilter, startDate, endDate, commissionStatusFilter]);

  const stats = useMemo(() => {
    const totalRevenue = filteredAcceptedProposals.reduce((acc, p) => {
      const val = parseFloat((p.value || "0").toString().replace(/[^\d,]/g, '').replace(',', '.')) || 0;
      return acc + val;
    }, 0);

    const totalCommission = filteredAcceptedProposals.reduce((acc, p) => {
      const val = parseFloat((p.value || "0").toString().replace(/[^\d,]/g, '').replace(',', '.')) || 0;
      const rate = p.commission || 5;
      return acc + (val * (rate / 100));
    }, 0);

    const paidCommission = filteredAcceptedProposals.reduce((acc, p) => {
      if (p.commissionStatus !== 'paid') return acc;
      const val = parseFloat((p.value || "0").toString().replace(/[^\d,]/g, '').replace(',', '.')) || 0;
      const rate = p.commission || 5;
      return acc + (val * (rate / 100));
    }, 0);

    const pendingCommission = totalCommission - paidCommission;

    const commissionPieData = [
      { name: 'Pagas', value: paidCommission, color: '#10b981' },
      { name: 'Pendentes', value: pendingCommission, color: '#f59e0b' }
    ];

    return {
      totalRevenue,
      totalCommission,
      paidCommission,
      pendingCommission,
      commissionPieData
    };
  }, [filteredAcceptedProposals]);

  const chartData = useMemo(() => {
    // Group by month
    const monthsData: { month: string; revenue: number; commission: number; date: Date }[] = [];
    
    // Sort all proposals by date to ensure proper sequence
    const sortedProposals = [...filteredAcceptedProposals].sort((a, b) => {
      const dateA = new Date(a.date.split('/').reverse().join('-'));
      const dateB = new Date(b.date.split('/').reverse().join('-'));
      return dateA.getTime() - dateB.getTime();
    });

    const months: Record<string, { month: string, revenue: number, commission: number, date: Date }> = {};
    
    sortedProposals.forEach(p => {
      const date = new Date(p.date.split('/').reverse().join('-'));
      const monthKey = date.toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
      
      if (!months[monthKey]) {
        // Set date to first day of month for sorting recorded months
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        months[monthKey] = { month: monthKey, revenue: 0, commission: 0, date: firstDay };
      }
      
      const val = parseFloat((p.value || "0").toString().replace(/[^\d,]/g, '').replace(',', '.')) || 0;
      const rate = p.commission || 5;
      months[monthKey].revenue += val;
      months[monthKey].commission += (val * (rate / 100));
    });

    const result = Object.values(months).sort((a, b) => a.date.getTime() - b.date.getTime());

    // Add prevRevenue for each month
    return result.map((item, index) => ({
      ...item,
      prevRevenue: index > 0 ? result[index - 1].revenue : 0
    }));
  }, [filteredAcceptedProposals]);

  const representativeData = useMemo(() => {
    const reps: Record<string, { name: string, paid: number, pending: number, total: number }> = {};
    
    filteredAcceptedProposals.forEach(p => {
      if (!reps[p.representative]) {
        reps[p.representative] = { name: p.representative, paid: 0, pending: 0, total: 0 };
      }
      const val = parseFloat((p.value || "0").toString().replace(/[^\d,]/g, '').replace(',', '.')) || 0;
      const rate = p.commission || 5;
      const commission = val * (rate / 100);
      
      if (p.commissionStatus === 'paid') {
        reps[p.representative].paid += commission;
      } else {
        reps[p.representative].pending += commission;
      }
      reps[p.representative].total += commission;
    });

    return Object.values(reps).sort((a, b) => b.total - a.total);
  }, [filteredAcceptedProposals]);

  const tableProposals = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return allFilteredProposals.slice(start, start + itemsPerPage);
  }, [allFilteredProposals, currentPage]);

  const totalPages = Math.ceil(allFilteredProposals.length / itemsPerPage);

  const handleTogglePaid = async (proposal: Proposal) => {
    const newStatus = proposal.commissionStatus === 'paid' ? 'pending' : 'paid';
    await updateDocument('proposals', proposal.id, { commissionStatus: newStatus });
  };

  const handleExportReport = async () => {
    setIsGeneratingReport(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Header
      doc.setFillColor(35, 29, 15); // #231d0f
      doc.rect(0, 0, pageWidth, 40, 'F');
      doc.setTextColor(253, 182, 18); // #fdb612
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("RELATÓRIO FINANCEIRO", pageWidth / 2, 25, { align: "center" });
      
      // Date and Info
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 20, 50);
      doc.text(`Período: ${startDate || 'Início'} até ${endDate || 'Hoje'}`, 20, 57);
      
      // Summary Section
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("RESUMO EXECUTIVO", 20, 75);
      doc.line(20, 77, pageWidth - 20, 77);
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`Faturamento Total: R$ ${stats.totalRevenue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`, 25, 87);
      doc.text(`Total em Comissões: R$ ${stats.totalCommission.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`, 25, 95);
      doc.setTextColor(16, 185, 129); // emerald-600
      doc.text(`Comissões Pagas: R$ ${stats.paidCommission.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`, 25, 103);
      doc.setTextColor(217, 119, 6); // amber-600
      doc.text(`Comissões Pendentes: R$ ${stats.pendingCommission.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`, 25, 111);
      doc.setTextColor(0, 0, 0);

      // Chart Section
      if (chartRef.current) {
        const canvas = await html2canvas(chartRef.current, {
          scale: 2,
          backgroundColor: '#ffffff'
        });
        const imgData = canvas.toDataURL('image/png');
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("DESEMPENHO MENSAL", 20, 130);
        doc.line(20, 132, pageWidth - 20, 132);
        doc.addImage(imgData, 'PNG', 20, 135, pageWidth - 40, 60);
      }

      // Detailed Table
      doc.addPage();
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("DETALHAMENTO DE PROPOSTAS", 20, 20);
      doc.line(20, 22, pageWidth - 20, 22);

      let y = 35;
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("CLIENTE", 20, y);
      doc.text("CONSULTOR", 70, y);
      doc.text("VALOR", 110, y);
      doc.text("COMISSÃO", 140, y);
      doc.text("STATUS", 175, y);
      
      y += 5;
      doc.line(20, y, pageWidth - 20, y);
      y += 10;

      doc.setFont("helvetica", "normal");
      allFilteredProposals.forEach((p, index) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
          doc.setFont("helvetica", "bold");
          doc.text("CLIENTE", 20, y);
          doc.text("CONSULTOR", 70, y);
          doc.text("VALOR", 110, y);
          doc.text("COMISSÃO", 140, y);
          doc.text("STATUS", 175, y);
          y += 5;
          doc.line(20, y, pageWidth - 20, y);
          y += 10;
          doc.setFont("helvetica", "normal");
        }

        const projectValue = parseFloat(p.value.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
        const commissionRate = p.commission || 5;
        const commissionValue = projectValue * (commissionRate / 100);

        doc.text(p.client.substring(0, 25), 20, y);
        doc.text(p.representative.substring(0, 20), 70, y);
        doc.text(`R$ ${projectValue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`, 110, y);
        doc.text(`R$ ${commissionValue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`, 140, y);
        doc.text(p.commissionStatus === 'paid' ? 'PAGO' : 'PENDENTE', 175, y);
        
        y += 8;
      });

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Vieira's Solar & Engenharia - Página ${i} de ${pageCount}`, pageWidth / 2, 285, { align: "center" });
      }

      doc.save(`relatorio_financeiro_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error("Error generating report:", error);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const COLORS = ['#fdb612', '#231d0f', '#6366f1', '#10b981', '#f43f5e'];

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-white/5 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl backdrop-blur-sm">
        <div className="flex items-center gap-6">
          <div className="size-16 rounded-[1.5rem] bg-brand-primary text-white flex items-center justify-center shadow-xl shadow-brand-primary/20">
            <DollarSign className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-brand-primary dark:text-white tracking-tight">
              Controladoria & Finanças
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium tracking-tight">Gestão de faturamento e comissões Vieira's Solar</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExportReport}
            disabled={isGeneratingReport}
            className="flex items-center gap-3 px-10 py-4 bg-brand-secondary text-brand-primary rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-brand-secondary/20 disabled:opacity-50"
          >
            {isGeneratingReport ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <FileText className="w-5 h-5" />
            )}
            Gerar Relatório [PDF]
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-slate-800 rounded-2xl w-fit shadow-sm">
        <button
          onClick={() => setActiveMainTab('overview')}
          className={cn(
            "px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
            activeMainTab === 'overview'
              ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20"
              : "text-slate-500 hover:text-slate-700"
          )}
        >
          Visão Geral
        </button>
        <button
          onClick={() => setActiveMainTab('proposals')}
          className={cn(
            "px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
            activeMainTab === 'proposals'
              ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20"
              : "text-slate-500 hover:text-slate-700"
          )}
        >
          Conciliação
        </button>
      </div>

      {activeMainTab === 'overview' ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-white/5 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm group hover:border-brand-primary transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="size-12 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center transform group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-full uppercase tracking-wider">
              <ArrowUpRight className="w-3 h-3" />
              12%
            </span>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Faturamento Bruto</p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            R$ {stats.totalRevenue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
          </h3>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-white/5 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm group hover:border-brand-primary transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="size-12 rounded-2xl bg-brand-secondary/10 text-brand-secondary flex items-center justify-center transform group-hover:scale-110 transition-transform">
              <Wallet className="w-6 h-6" />
            </div>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Provisão Comissões</p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            R$ {stats.totalCommission.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
          </h3>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-white/5 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm group hover:border-emerald-500 transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="size-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center transform group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Liquidado</p>
          <h3 className="text-2xl font-black text-emerald-600 tracking-tight">
            R$ {stats.paidCommission.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
          </h3>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-white/5 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm group hover:border-amber-500 transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="size-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center transform group-hover:scale-110 transition-transform">
              <Clock className="w-6 h-6" />
            </div>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">A Pagar</p>
          <h3 className="text-2xl font-black text-amber-600 tracking-tight">
            R$ {stats.pendingCommission.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
          </h3>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
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
          <div className="h-[300px] w-full" ref={chartRef}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
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
                <Line 
                  type="monotone" 
                  dataKey="prevRevenue" 
                  stroke="#6366f1" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  name="Mês Anterior"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <h4 className="text-lg font-black font-display mb-8 uppercase tracking-widest text-center">Status Global</h4>
          <div className="h-[200px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.commissionPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.commissionPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`, 'Total']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Pagas</span>
              <span className="text-lg font-black text-emerald-600">
                {stats.totalCommission > 0 ? ((stats.paidCommission / stats.totalCommission) * 100).toFixed(0) : 0}%
              </span>
            </div>
          </div>
          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/20">
              <div className="flex items-center gap-3">
                <div className="size-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Pagas</span>
              </div>
              <span className="text-sm font-black text-emerald-600">
                R$ {stats.paidCommission.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/20">
              <div className="flex items-center gap-3">
                <div className="size-2 rounded-full bg-amber-500" />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Pendentes</span>
              </div>
              <span className="text-sm font-black text-amber-600">
                R$ {stats.pendingCommission.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h4 className="text-lg font-black font-display uppercase tracking-widest">Comissões por Consultor</h4>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="size-2.5 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pagas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="size-2.5 rounded-full bg-amber-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pendentes</span>
              </div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={representativeData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  type="number"
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                  tickFormatter={(value) => `R$ ${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
                />
                <YAxis 
                  dataKey="name" 
                  type="category"
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                  width={100}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    padding: '12px'
                  }}
                  formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`]}
                />
                <Bar dataKey="paid" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} barSize={20} />
                <Bar dataKey="pending" stackId="a" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 space-y-3">
            {representativeData.map((rep, idx) => (
              <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-slate-100">{rep.name}</span>
                  <span className="text-xs font-black text-[#fdb612]">R$ {rep.total.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500" 
                        style={{ width: `${(rep.paid / rep.total) * 100}%` }} 
                      />
                    </div>
                    <p className="text-[9px] font-bold text-emerald-600 mt-1 uppercase tracking-tighter">Pago: R$ {rep.paid.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
                  </div>
                  <div className="flex-1">
                    <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-amber-500" 
                        style={{ width: `${(rep.pending / rep.total) * 100}%` }} 
                      />
                    </div>
                    <p className="text-[9px] font-bold text-amber-600 mt-1 uppercase tracking-tighter">Pendente: R$ {rep.pending.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
          {/* Table Section */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <h4 className="text-lg font-black font-display text-[#fdb612]">Listagem de Propostas</h4>
                <button 
                  onClick={() => setIsHelpModalOpen(true)}
                  className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                  title="Ajuda com envio de e-mail"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Buscar cliente ou consultor..."
                    value={searchTerm || ''}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-[#fdb612] outline-none w-64"
                  />
                </div>
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <input 
                    type="date"
                    value={startDate || ''}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="bg-transparent border-none text-xs font-bold focus:ring-0 outline-none w-28"
                  />
                  <span className="text-slate-300">|</span>
                  <input 
                    type="date"
                    value={endDate || ''}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="bg-transparent border-none text-xs font-bold focus:ring-0 outline-none w-28"
                  />
                </div>
                <select 
                  value={proposalStatusFilter || 'all'}
                  onChange={(e) => {
                    setProposalStatusFilter(e.target.value as any);
                    setCurrentPage(1);
                  }}
                  className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#fdb612] outline-none"
                >
                  <option value="all">Ver Todos Status</option>
                  <option value="pending">Pendente</option>
                  <option value="sent">Enviada</option>
                  <option value="accepted">Aceita</option>
                  <option value="expired">Expirada</option>
                  <option value="cancelled">Cancelada</option>
                </select>
                <select 
                  value={commissionStatusFilter || 'all'}
                  onChange={(e) => {
                    setCommissionStatusFilter(e.target.value as any);
                    setCurrentPage(1);
                  }}
                  className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#fdb612] outline-none"
                >
                  <option value="all">Todas Comissões</option>
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
                  {tableProposals.map((prop) => {
                    const projectValue = parseFloat(prop.value.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
                    const commissionRate = prop.commission || 5;
                    const commissionValue = projectValue * (commissionRate / 100);
                    const isPaid = prop.commissionStatus === 'paid';

                    return (
                      <tr 
                        key={prop.id} 
                        onClick={() => setSelectedProposal(prop)}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group cursor-pointer"
                      >
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
                          <p className="text-sm font-bold">R$ {projectValue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-black px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                            {commissionRate}%
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-black text-[#fdb612]">
                            R$ {commissionValue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1.5">
                            <span className={cn(
                              "text-[10px] font-black uppercase px-2 py-1 rounded-full flex items-center gap-1.5 w-fit",
                              prop.status === 'accepted' && "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30",
                              prop.status === 'pending' && "bg-amber-100 text-amber-600 dark:bg-amber-900/30",
                              prop.status === 'sent' && "bg-blue-100 text-blue-600 dark:bg-blue-900/30",
                              prop.status === 'expired' && "bg-rose-100 text-rose-600 dark:bg-rose-900/30",
                              prop.status === 'cancelled' && "bg-slate-100 text-slate-600 dark:bg-slate-900/40"
                            )}>
                              {prop.status}
                            </span>
                            <span className={cn(
                              "text-[10px] font-black uppercase px-2 py-1 rounded-full flex items-center gap-1.5 w-fit",
                              isPaid 
                                ? "bg-emerald-50 text-emerald-500 dark:bg-emerald-900/20" 
                                : "bg-amber-50 text-amber-500 dark:bg-amber-900/20"
                            )}>
                              {isPaid ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                              Comissão: {isPaid ? 'Pago' : 'Pendente'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedProposal(prop);
                              }}
                              className="p-2 text-slate-400 hover:text-[#fdb612] bg-slate-50 dark:bg-slate-800 rounded-lg transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {(user?.role === 'admin' || user?.role === 'finance') && prop.status === 'accepted' && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTogglePaid(prop);
                                }}
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
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                Mostrando {Math.min(allFilteredProposals.length, itemsPerPage)} de {allFilteredProposals.length} propostas
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-50 transition-all hover:bg-slate-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={cn(
                        "size-8 rounded-xl text-xs font-black transition-all",
                        currentPage === i + 1
                          ? "bg-[#fdb612] text-[#231d0f]"
                          : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50"
                      )}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-50 transition-all hover:bg-slate-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedProposal && (
        <ProposalDetailsModal
          isOpen={!!selectedProposal}
          onClose={() => setSelectedProposal(null)}
          proposal={selectedProposal}
          onSend={() => {}}
          onDownload={() => {}}
          onPrint={() => {}}
          user={user}
        />
      )}

      <SMTPHelpModal 
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />
    </div>
  );
};
