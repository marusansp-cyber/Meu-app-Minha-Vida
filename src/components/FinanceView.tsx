import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  Pie,
  Legend
} from 'recharts';
import { cn, fixOklch } from '../lib/utils';
import { Proposal, User as UserType, CompanySettings } from '../types';
import { updateDocument, getDocument } from '../firestoreUtils';
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { ProposalDetailsModal } from './ProposalDetailsModal';
import { SMTPHelpModal } from './SMTPHelpModal';
import { HelpCircle } from 'lucide-react';

interface FinanceViewProps {
  proposals: Proposal[];
  user: UserType | null;
  isDarkMode?: boolean;
}

export const FinanceView: React.FC<FinanceViewProps> = ({ proposals, user, isDarkMode = false }) => {
  const [activeMainTab, setActiveMainTab] = useState<'overview' | 'proposals' | 'consultants' | 'goals'>('overview');
  const [consultantMetric, setConsultantMetric] = useState<'count' | 'value'>('value');
  const [selectedRepForDrilldown, setSelectedRepForDrilldown] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [commissionStatusFilter, setCommissionStatusFilter] = useState<'all' | 'pending' | 'paid'>('all');
  const [proposalStatusFilter, setProposalStatusFilter] = useState<Proposal['status'] | 'all'>('all');
  const [representativeFilter, setRepresentativeFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [monthlyGoals, setMonthlyGoals] = useState<Record<string, number>>({});
  
  const [defaultCommission, setDefaultCommission] = useState(5);
  
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await getDocument('settings', 'company') as CompanySettings;
        if (settings && typeof settings.defaultCommissionPercentage === 'number') {
          setDefaultCommission(settings.defaultCommissionPercentage);
        }
        
        const goalsDoc = await getDocument('settings', 'monthlyGoals') as any;
        if (goalsDoc && goalsDoc.goals) {
          setMonthlyGoals(goalsDoc.goals);
        }
      } catch (err) {
        console.error('Error fetching company settings:', err);
      }
    };
    fetchSettings();
  }, []);
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
      const rate = p.commission || defaultCommission;
      return acc + (val * (rate / 100));
    }, 0);

    const paidCommission = filteredAcceptedProposals.reduce((acc, p) => {
      if (p.commissionStatus !== 'paid') return acc;
      const val = parseFloat((p.value || "0").toString().replace(/[^\d,]/g, '').replace(',', '.')) || 0;
      const rate = p.commission || defaultCommission;
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

    const months: Record<string, { month: string, revenue: number, commission: number, goal: number, date: Date }> = {};
    
    sortedProposals.forEach(p => {
      const date = new Date(p.date.split('/').reverse().join('-'));
      const monthKey = date.toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
      
      if (!months[monthKey]) {
        // Set date to first day of month for sorting recorded months
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        months[monthKey] = { month: monthKey, revenue: 0, commission: 0, goal: 0, date: firstDay };
      }
      
      const val = parseFloat((p.value || "0").toString().replace(/[^\d,]/g, '').replace(',', '.')) || 0;
      const rate = p.commission || defaultCommission;
      months[monthKey].revenue += val;
      months[monthKey].commission += (val * (rate / 100));
    });

    const result = Object.values(months).sort((a, b) => a.date.getTime() - b.date.getTime());

    // Add prevRevenue and goal
    return result.map((item, index) => {
      const monthPrefix = (item.date.getMonth() + 1).toString().padStart(2, '0');
      const year = item.date.getFullYear();
      const goalKey = `${monthPrefix}/${year}`;
      const goal = monthlyGoals[goalKey] || 0;
      return {
        ...item,
        goal,
        prevRevenue: index > 0 ? result[index - 1].revenue : 0
      };
    });
  }, [filteredAcceptedProposals, monthlyGoals]);

  const representativeData = useMemo(() => {
    const reps: Record<string, { name: string, paid: number, pending: number, total: number }> = {};
    
    filteredAcceptedProposals.forEach(p => {
      if (!reps[p.representative]) {
        reps[p.representative] = { name: p.representative, paid: 0, pending: 0, total: 0 };
      }
      const val = parseFloat((p.value || "0").toString().replace(/[^\d,]/g, '').replace(',', '.')) || 0;
      const rate = p.commission || defaultCommission;
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

  const consultantStackedData = useMemo(() => {
    const data: Record<string, {
      name: string;
      pendingCount: number;
      sentCount: number;
      acceptedCount: number;
      expiredCount: number;
      cancelledCount: number;
      pendingValue: number;
      sentValue: number;
      acceptedValue: number;
      expiredValue: number;
      cancelledValue: number;
      totalCount: number;
      totalValue: number;
    }> = {};

    proposals.forEach(p => {
      const rep = p.representative || 'Desconhecido';
      if (!data[rep]) {
        data[rep] = {
          name: rep,
          pendingCount: 0,
          sentCount: 0,
          acceptedCount: 0,
          expiredCount: 0,
          cancelledCount: 0,
          pendingValue: 0,
          sentValue: 0,
          acceptedValue: 0,
          expiredValue: 0,
          cancelledValue: 0,
          totalCount: 0,
          totalValue: 0,
        };
      }

      const val = typeof p.value === 'number' ? p.value : (parseFloat(String(p.value || 0).replace(/[^\d,]/g, '').replace(',', '.')) || 0);
      const status = p.status || 'pending';

      if (status === 'pending') {
        data[rep].pendingCount += 1;
        data[rep].pendingValue += val;
      } else if (status === 'sent') {
        data[rep].sentCount += 1;
        data[rep].sentValue += val;
      } else if (status === 'accepted') {
        data[rep].acceptedCount += 1;
        data[rep].acceptedValue += val;
      } else if (status === 'expired') {
        data[rep].expiredCount += 1;
        data[rep].expiredValue += val;
      } else if (status === 'cancelled') {
        data[rep].cancelledCount += 1;
        data[rep].cancelledValue += val;
      }

      data[rep].totalCount += 1;
      data[rep].totalValue += val;
    });

    return Object.values(data).sort((a, b) => b.totalValue - a.totalValue);
  }, [proposals]);

  const consultantSummaryStats = useMemo(() => {
    if (proposals.length === 0) return {
      topRepName: 'Nenhum',
      topRepValue: 0,
      avgProposalsPerRep: 0,
      totalProposals: 0,
      largestProposal: null
    };

    const countByRep: Record<string, number> = {};
    const valueByRep: Record<string, number> = {};
    let maxProposal: Proposal | null = null;
    let maxValue = 0;

    proposals.forEach(p => {
      const rep = p.representative || 'Desconhecido';
      countByRep[rep] = (countByRep[rep] || 0) + 1;
      const val = typeof p.value === 'number' ? p.value : (parseFloat(String(p.value || 0).replace(/[^\d,]/g, '').replace(',', '.')) || 0);
      valueByRep[rep] = (valueByRep[rep] || 0) + val;

      if (val > maxValue) {
        maxValue = val;
        maxProposal = p;
      }
    });

    let topRepName = 'Nenhum';
    let topRepValue = 0;
    Object.entries(valueByRep).forEach(([name, val]) => {
      if (val > topRepValue) {
         topRepValue = val;
         topRepName = name;
      }
    });

    const repNames = Object.keys(countByRep);
    const avgProposalsPerRep = repNames.length > 0 ? (proposals.length / repNames.length) : 0;

    return {
      topRepName,
      topRepValue,
      avgProposalsPerRep,
      totalProposals: proposals.length,
      largestProposal: maxProposal
    };
  }, [proposals]);

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
          backgroundColor: '#ffffff',
          onclone: (clonedDoc) => {
            fixOklch(clonedDoc);
          }
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

        const projectValue = typeof p.value === 'number' ? p.value : (parseFloat(String(p.value || 0).replace(/[^\d,]/g, '').replace(',', '.')) || 0);
        const commissionRate = p.commission || defaultCommission;
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
        doc.text(`JV Mendes Junior Engenharia - Página ${i} de ${pageCount}`, pageWidth / 2, 285, { align: "center" });
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black font-display tracking-tight">Gestão Financeira</h2>
          <p className="text-slate-500 font-medium">Controle de faturamento e comissões de vendas</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExportReport}
            disabled={isGeneratingReport}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
          >
            {isGeneratingReport ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Gerar Relatório PDF
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
        <button
          onClick={() => setActiveMainTab('overview')}
          className={cn(
            "px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all",
            activeMainTab === 'overview'
              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          )}
        >
          Visão Geral
        </button>
        <button
          onClick={() => setActiveMainTab('proposals')}
          className={cn(
            "px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all",
            activeMainTab === 'proposals'
              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          )}
        >
          Propostas
        </button>
        <button
          onClick={() => setActiveMainTab('consultants')}
          className={cn(
            "px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all",
            activeMainTab === 'consultants'
              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          )}
        >
          Volume por Consultor
        </button>
        <button
          onClick={() => setActiveMainTab('goals')}
          className={cn(
            "px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all",
            activeMainTab === 'goals'
              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          )}
        >
          Metas
        </button>
      </div>

      {activeMainTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
            R$ {stats.totalRevenue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
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
            R$ {stats.totalCommission.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
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
            R$ {stats.paidCommission.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
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
            R$ {stats.pendingCommission.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
          </h3>
        </div>
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
                <Bar dataKey="revenue" name="Faturamento" fill="#fdb612" radius={[6, 6, 0, 0]} barSize={40} />
                <Bar dataKey="commission" name="Comissões" fill="#e2e8f0" radius={[6, 6, 0, 0]} barSize={40} />
                <Line 
                  type="monotone" 
                  dataKey="prevRevenue" 
                  stroke="#6366f1" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  name="Mês Anterior"
                />
                <Line 
                  type="stepAfter" 
                  dataKey="goal" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  strokeDasharray="5 5" 
                  dot={false}
                  name="Meta de Vendas"
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
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={isDarkMode ? '#334155' : '#f1f5f9'} />
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
                  cursor={{ fill: isDarkMode ? '#1e293b' : '#f8fafc' }}
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                    color: isDarkMode ? '#f1f5f9' : '#1e293b',
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
      )}

      {activeMainTab === 'proposals' && (
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
                    const projectValue = typeof prop.value === 'number' ? prop.value : (parseFloat(String(prop.value || 0).replace(/[^\d,]/g, '').replace(',', '.')) || 0);
                    const commissionRate = prop.commission || defaultCommission;
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

      {activeMainTab === 'consultants' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="size-12 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-amber-600" />
                </div>
              </div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total de Propostas</p>
              <h3 className="text-2xl font-black font-display text-slate-900 dark:text-slate-100">
                {consultantSummaryStats.totalProposals} propostas
              </h3>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="size-12 rounded-2xl bg-[#fdb612]/10 flex items-center justify-center">
                  <User className="w-6 h-6 text-[#fdb612]" />
                </div>
                <span className="text-[10px] font-black uppercase text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg">Top Vendedor</span>
              </div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Consultor Líder (Volume)</p>
              <h3 className="text-2xl font-black font-display text-slate-900 dark:text-slate-100 truncate" title={consultantSummaryStats.topRepName}>
                {consultantSummaryStats.topRepName}
              </h3>
              <p className="text-xs text-[#fdb612] font-black mt-1">
                R$ {consultantSummaryStats.topRepValue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="size-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                </div>
                <span className="text-[10px] font-black uppercase text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg">Maior Contrato</span>
              </div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Maior Proposta Gerada</p>
              <h3 className="text-2xl font-black font-display text-slate-900 dark:text-slate-100 truncate">
                {consultantSummaryStats.largestProposal ? consultantSummaryStats.largestProposal.client : 'Nenhum'}
              </h3>
              <p className="text-xs text-emerald-600 font-bold mt-1">
                {consultantSummaryStats.largestProposal ? (typeof consultantSummaryStats.largestProposal.value === 'number' ? consultantSummaryStats.largestProposal.value : parseFloat(String(consultantSummaryStats.largestProposal.value).replace(/[^\d,]/g, '').replace(',', '.'))).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }) : 'R$ 0'}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="size-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Média por Consultor</p>
              <h3 className="text-2xl font-black font-display text-indigo-600">
                {consultantSummaryStats.avgProposalsPerRep.toFixed(1)} propostas
              </h3>
            </div>
          </div>

          {/* Main Chart Section */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
              <div>
                <h3 className="text-xl font-black font-display uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  Volume de Propostas por Consultor
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Visão comparativa do volume e status das propostas (Aguardando, Enviada, Aceita, Expirada, Cancelada) geradas por cada representante comercial.
                </p>
              </div>

              {/* Metric Selector */}
              <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit self-end md:self-auto">
                <button
                  onClick={() => setConsultantMetric('value')}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-widest transition-all",
                    consultantMetric === 'value'
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  Valor (R$)
                </button>
                <button
                  onClick={() => setConsultantMetric('count')}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-widest transition-all",
                    consultantMetric === 'count'
                      ? "bg-[#fdb612] text-[#231d0f] shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  Quantidade
                </button>
              </div>
            </div>

            {/* Custom Legend */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full bg-[#fdb612]" />
                <span>Aguardando {consultantMetric === 'value' ? '(R$)' : '(Qtd)'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full bg-[#3b82f6]" />
                <span>Enviada {consultantMetric === 'value' ? '(R$)' : '(Qtd)'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full bg-[#10b981]" />
                <span>Aceita {consultantMetric === 'value' ? '(R$)' : '(Qtd)'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full bg-[#ef4444]" />
                <span>Expirada {consultantMetric === 'value' ? '(R$)' : '(Qtd)'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full bg-[#94a3b8]" />
                <span>Cancelada {consultantMetric === 'value' ? '(R$)' : '(Qtd)'}</span>
              </div>
            </div>

            {/* Stacked Bar Chart */}
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={consultantStackedData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#f1f5f9'} />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }}
                    tickFormatter={(val) => consultantMetric === 'value' ? `R$ ${val >= 1000000 ? (val / 1000000).toFixed(1) + 'M' : val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}` : String(val)}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '16px',
                      border: 'none',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                      color: isDarkMode ? '#f1f5f9' : '#1e293b',
                      padding: '16px'
                    }}
                    cursor={{ fill: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)' }}
                    formatter={(value: any, name: any) => {
                      if (consultantMetric === 'value') {
                        return [`R$ ${value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`, name];
                      }
                      return [`${value} propostas`, name];
                    }}
                  />
                  {consultantMetric === 'value' ? (
                    <>
                      <Bar dataKey="pendingValue" name="Aguardando" fill="#fdb612" stackId="a" barSize={34} />
                      <Bar dataKey="sentValue" name="Enviada" fill="#3b82f6" stackId="a" />
                      <Bar dataKey="acceptedValue" name="Aceita" fill="#10b981" stackId="a" />
                      <Bar dataKey="expiredValue" name="Expirada" fill="#ef4444" stackId="a" />
                      <Bar dataKey="cancelledValue" name="Cancelada" fill="#94a3b8" stackId="a" radius={[4, 4, 0, 0]} />
                    </>
                  ) : (
                    <>
                      <Bar dataKey="pendingCount" name="Aguardando" fill="#fdb612" stackId="a" barSize={34} />
                      <Bar dataKey="sentCount" name="Enviada" fill="#3b82f6" stackId="a" />
                      <Bar dataKey="acceptedCount" name="Aceita" fill="#10b981" stackId="a" />
                      <Bar dataKey="expiredCount" name="Expirada" fill="#ef4444" stackId="a" />
                      <Bar dataKey="cancelledCount" name="Cancelada" fill="#94a3b8" stackId="a" radius={[4, 4, 0, 0]} />
                    </>
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detailed Table & Drilldown Section */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in duration-300">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
              <h4 className="text-lg font-black font-display text-slate-800 dark:text-slate-100 uppercase tracking-widest">
                Detalhamento Geral por Consultor
              </h4>
              <p className="text-xs text-slate-400 font-bold hidden sm:block">
                Selecione uma linha para expandir as propostas do consultor
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/20">
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Consultor</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Total Propostas</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center text-emerald-600 bg-emerald-500/5">Aceitas</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center text-blue-500">Enviadas</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center text-amber-500">Aguardando</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center text-rose-500">Expiradas / Canceladas</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Taxa Conversão</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Volume Monetário</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {consultantStackedData.map((rep) => {
                    const conversionRate = rep.totalCount > 0 ? (rep.acceptedCount / rep.totalCount) * 100 : 0;
                    const lossCount = rep.expiredCount + rep.cancelledCount;
                    const isSelected = selectedRepForDrilldown === rep.name;

                    return (
                      <tr
                        key={rep.name}
                        onClick={() => setSelectedRepForDrilldown(isSelected ? null : rep.name)}
                        className={cn(
                          "hover:bg-[#fdb612]/5 dark:hover:bg-[#fdb612]/5 transition-colors cursor-pointer group",
                          isSelected && "bg-[#fdb612]/10 dark:bg-[#fdb612]/10 border-l-4 border-l-[#fdb612]"
                        )}
                      >
                        <td className="px-6 py-5 font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-400 group-hover:text-[#fdb612]" />
                          {rep.name}
                        </td>
                        <td className="px-6 py-5 text-center font-black text-slate-950 dark:text-slate-50">{rep.totalCount}</td>
                        <td className="px-6 py-5 text-center font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/5">{rep.acceptedCount}</td>
                        <td className="px-6 py-5 text-center font-bold text-blue-500">{rep.sentCount}</td>
                        <td className="px-6 py-5 text-center font-bold text-amber-500">{rep.pendingCount}</td>
                        <td className="px-6 py-5 text-center text-slate-400">{lossCount}</td>
                        <td className="px-6 py-5 text-center">
                          <span className={cn(
                            "px-2.5 py-1 rounded-xl text-xs font-black",
                            conversionRate >= 50 ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30" : "bg-slate-100 text-slate-500 dark:bg-slate-800 text-slate-400"
                          )}>
                            {conversionRate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right font-black text-slate-900 dark:text-slate-100">
                          R$ {rep.totalValue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Drilldown Section */}
          {selectedRepForDrilldown && (
            <div className="bg-slate-50 dark:bg-slate-900/40 p-8 rounded-3xl border border-[#fdb612]/20 shadow-md space-y-6 animate-in slide-in-from-top-4 duration-300">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <h4 className="text-xl font-black font-display text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <User className="text-[#fdb612] w-5 h-5" />
                    Listagem Detalhada: {selectedRepForDrilldown}
                  </h4>
                  <p className="text-xs text-slate-500 font-bold mt-1">
                    Exibindo todas as propostas elaboradas por {selectedRepForDrilldown}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedRepForDrilldown(null)}
                  className="px-4 py-2 bg-white dark:bg-slate-850 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-widest transition-colors border border-slate-200 dark:border-slate-850"
                >
                  Fechar Detalhes
                </button>
              </div>

              <div className="overflow-x-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-inner">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Cliente</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Potência (kWp)</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Data</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Valor do Projeto</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {proposals
                      .filter(p => p.representative === selectedRepForDrilldown)
                      .map((prop) => {
                        const projectValue = typeof prop.value === 'number' ? prop.value : (parseFloat(String(prop.value || 0).replace(/[^\d,]/g, '').replace(',', '.')) || 0);
                        return (
                          <tr key={prop.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-slate-100">
                              {prop.client}
                            </td>
                            <td className="px-6 py-4 text-xs font-black text-slate-500">
                              {prop.systemSize} kWp
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-400 font-bold">
                              {prop.date}
                            </td>
                            <td className="px-6 py-4">
                              <span className={cn(
                                "text-[10px] font-black uppercase px-2 py-1 rounded-full flex items-center gap-1 w-fit",
                                prop.status === 'accepted' && "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30",
                                prop.status === 'pending' && "bg-amber-100 text-amber-600 dark:bg-amber-900/30",
                                prop.status === 'sent' && "bg-blue-100 text-blue-600 dark:bg-blue-900/30",
                                prop.status === 'expired' && "bg-rose-100 text-rose-600 dark:bg-rose-900/30",
                                prop.status === 'cancelled' && "bg-slate-100 text-slate-600 dark:bg-slate-900/40"
                              )}>
                                {prop.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right font-black text-slate-900 dark:text-slate-100">
                              R$ {projectValue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => setSelectedProposal(prop)}
                                className="p-1.5 text-slate-400 hover:text-[#fdb612] bg-slate-50 dark:bg-slate-800 rounded-lg transition-colors border-none cursor-pointer"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeMainTab === 'goals' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex justify-between items-center bg-white dark:bg-[#1a160d] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 font-display">Metas de Vendas (Mês a Mês)</h3>
              <p className="text-sm text-slate-500 font-bold mt-1">Defina as metas financeiras mensais para acompanhamento</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 12 }, (_, i) => {
              const monthPrefix = (i + 1).toString().padStart(2, '0');
              const year = new Date().getFullYear();
              const goalKey = `${monthPrefix}/${year}`;
              
              const monthName = new Date(year, i, 1).toLocaleString('pt-BR', { month: 'long' });
              return (
                <div key={goalKey} className="bg-white dark:bg-[#1a160d] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-2">
                  <label className="text-xs font-black uppercase tracking-widest text-[#fdb612] flex items-center justify-between">
                    <span>{monthName}</span>
                    <span className="text-[10px] text-slate-400">{year}</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">R$</span>
                    <input 
                      type="number" 
                      value={monthlyGoals[goalKey] || 0}
                      onChange={(e) => setMonthlyGoals(prev => ({ ...prev, [goalKey]: parseFloat(e.target.value) || 0 }))}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612] transition-all font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={async () => {
                try {
                  await getDocument('settings', 'monthlyGoals');
                  await updateDocument('settings', 'monthlyGoals', { goals: monthlyGoals });
                  alert('Metas salvas com sucesso!');
                } catch {
                  // if doc not exists, set it
                  import('../firestoreUtils').then(({ setDocument }) => {
                    setDocument('settings', 'monthlyGoals', { goals: monthlyGoals }).then(() => {
                      alert('Metas salvas com sucesso!');
                    });
                  });
                }
              }}
              className="px-8 py-3 bg-[#fdb612] text-[#231d0f] rounded-xl font-black text-sm uppercase tracking-widest hover:bg-[#e5a000] hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#fdb612]/20 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Salvar Metas
            </button>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedProposal && (
        <ProposalDetailsModal
          isOpen={!!selectedProposal}
          onClose={() => setSelectedProposal(null)}
          proposal={selectedProposal}
          onUpdate={async (updatedProp) => {
            if (!updatedProp.id) return;
            await updateDocument('proposals', updatedProp.id, updatedProp);
            setSelectedProposal(updatedProp);
          }}
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
