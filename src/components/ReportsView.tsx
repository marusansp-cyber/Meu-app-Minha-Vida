import React, { useState, useMemo, useRef } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line,
  AreaChart,
  Area
} from 'recharts';
import { 
  Download, 
  Filter, 
  Calendar, 
  TrendingUp, 
  Users, 
  Zap, 
  FileText, 
  ChevronDown, 
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowUpRight,
  Printer
} from 'lucide-react';
import { cn, formatDate, fixOklch } from '../lib/utils';
import { Proposal, Installation, Lead, Client } from '../types';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import Papa from 'papaparse';

import { getDocument } from '../firestoreUtils';

interface ReportsViewProps {
  proposals: Proposal[];
  installations: Installation[];
  leads: Lead[];
  clients: Client[];
  isDarkMode?: boolean;
}

import { PageTransition } from './PageTransition';

export const ReportsView: React.FC<ReportsViewProps> = ({ proposals, installations, leads, clients, isDarkMode = false }) => {
  const [dateRange, setDateRange] = useState('30days');
  const [consultantFilter, setConsultantFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [salesGoal, setSalesGoal] = useState({ targetValue: 100000, targetCount: 10 });
  const [loadingGoal, setLoadingGoal] = useState(true);

  React.useEffect(() => {
    const fetchGoal = async () => {
      try {
        const goal = await getDocument<any>('settings', 'salesGoal');
        if (goal) {
          setSalesGoal({
            targetValue: parseFloat(goal.targetValue || 100000),
            targetCount: parseInt(goal.targetCount || 10)
          });
        }
      } catch (err) {
        console.error("Erro ao carregar meta de vendas:", err);
      } finally {
        setLoadingGoal(false);
      }
    };
    fetchGoal();
  }, []);
  const reportRef = useRef<HTMLDivElement>(null);

  const consultants = useMemo(() => {
    const list = new Set((proposals || []).map(p => p.representative).filter(Boolean));
    return Array.from(list);
  }, [proposals]);

  const filteredData = useMemo(() => {
    let prps = [...(proposals || [])];
    let inst = [...(installations || [])];

    const now = new Date();
    if (dateRange === '30days') {
      const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
      prps = prps.filter(p => new Date(p.date) >= thirtyDaysAgo);
    } else if (dateRange === '90days') {
      const ninetyDaysAgo = new Date(now.setDate(now.getDate() - 90));
      prps = prps.filter(p => new Date(p.date) >= ninetyDaysAgo);
    }

    if (consultantFilter !== 'all') {
      prps = prps.filter(p => p.representative === consultantFilter);
    }

    if (statusFilter !== 'all') {
      prps = prps.filter(p => p.status === statusFilter);
    }

    return { proposals: prps, installations: inst };
  }, [proposals, installations, dateRange, consultantFilter, statusFilter]);

  const consultantCommissionData = useMemo(() => {
    const data: Record<string, { name: string, paid: number, pending: number }> = {};
    
    filteredData.proposals.forEach(p => {
      if (p.status === 'accepted' && p.representative) {
        if (!data[p.representative]) {
          data[p.representative] = { name: p.representative, paid: 0, pending: 0 };
        }
        
        const value = typeof p.value === 'number' ? p.value : (parseFloat(String(p.value || 0).replace(/[^\d,]/g, '').replace(',', '.')) || 0);
        const commissionRate = p.commission || 5;
        const commissionVolume = value * (commissionRate / 100);
        
        if (p.commissionStatus === 'paid') {
          data[p.representative].paid += commissionVolume;
        } else {
          data[p.representative].pending += commissionVolume;
        }
      }
    });

    return Object.values(data).sort((a, b) => (b.paid + b.pending) - (a.paid + a.pending));
  }, [filteredData]);

  const stats = useMemo(() => {
    const totalSales = (filteredData.proposals || [])
      .filter(p => p.status === 'accepted')
      .reduce((acc, p) => acc + (parseFloat((p.value || "0").toString().replace(/[^\d,]/g, '').replace(',', '.')) || 0), 0);

    const conversionRate = (filteredData.proposals || []).length > 0 
      ? ((filteredData.proposals || []).filter(p => p.status === 'accepted').length / (filteredData.proposals || []).length) * 100 
      : 0;

    const avgProposalValue = (filteredData.proposals || []).length > 0
      ? totalSales / (filteredData.proposals || []).filter(p => p.status === 'accepted').length
      : 0;

    const installationDistribution = [
      { name: 'Em Andamento', value: (installations || []).filter(i => i.progress < 100).length, color: '#3b82f6' },
      { name: 'Finalizadas', value: (installations || []).filter(i => i.progress === 100).length, color: '#10b981' },
      { name: 'Pendentes', value: (installations || []).filter(i => i.progress === 0).length, color: '#f59e0b' }
    ];

    const totalCommission = (filteredData.proposals || [])
      .filter(p => p.status === 'accepted')
      .reduce((acc, p) => acc + (p.commission || 0), 0);

    const totalSystemSize = (filteredData.proposals || [])
      .filter(p => p.status === 'accepted')
      .reduce((acc, p) => {
        const size = parseFloat((p.systemSize || "0").toString().replace(/[^\d.]/g, '')) || 0;
        return acc + size;
      }, 0);

    const avgSystemSize = (filteredData.proposals || []).filter(p => p.status === 'accepted').length > 0
      ? totalSystemSize / (filteredData.proposals || []).filter(p => p.status === 'accepted').length
      : 0;

    return {
      totalSales,
      totalCommission,
      avgSystemSize,
      conversionRate,
      avgProposalValue,
      installationDistribution,
      totalProposals: (filteredData.proposals || []).length,
      acceptedProposals: (filteredData.proposals || []).filter(p => p.status === 'accepted').length
    };
  }, [filteredData, installations]);

  const monthlyData = useMemo(() => {
    const months: Record<string, { name: string, sales: number, count: number }> = {};
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = d.toLocaleString('pt-BR', { month: 'short' });
      months[key] = { name: key, sales: 0, count: 0 };
    }

    filteredData.proposals.forEach(p => {
      const d = new Date(p.date || Date.now());
      const key = d.toLocaleString('pt-BR', { month: 'short' });
      if (months[key]) {
        if (p.status === 'accepted') {
          months[key].sales += parseFloat((p.value || "0").toString().replace(/[^\d,]/g, '').replace(',', '.')) || 0;
        }
        months[key].count += 1;
      }
    });

    return Object.values(months);
  }, [filteredData]);

  const goalComparison = useMemo(() => {
    const today = new Date();
    const currentMonthKey = today.toLocaleString('pt-BR', { month: 'short' });
    const currentMonthData = monthlyData.find(m => m.name.toLowerCase() === currentMonthKey.toLowerCase()) || { sales: 0, count: 0 };
    
    const valueAchievement = salesGoal.targetValue > 0 
      ? (currentMonthData.sales / salesGoal.targetValue) * 100 
      : 0;
      
    const countAchievement = salesGoal.targetCount > 0 
      ? (currentMonthData.count / salesGoal.targetCount) * 100 
      : 0;

    return {
      currentSales: currentMonthData.sales,
      currentCount: currentMonthData.count,
      targetValue: salesGoal.targetValue,
      targetCount: salesGoal.targetCount,
      valueAchievement,
      countAchievement
    };
  }, [monthlyData, salesGoal]);

  const salesVsGoalChartData = useMemo(() => {
    return monthlyData.map(m => ({
      name: m.name,
      sales: m.sales,
      goal: salesGoal.targetValue,
      count: m.count,
      goalCount: salesGoal.targetCount
    }));
  }, [monthlyData, salesGoal]);

  const exportPDF = async () => {
    if (!reportRef.current) return;
    
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          fixOklch(clonedDoc);
        }
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Relatorio_Performance_${formatDate(new Date()).replace(/\//g, '-')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const exportCSV = () => {
    const todayStr = new Date().toISOString().split('T')[0];

    // Export Proposals
    const proposalsCSVData = filteredData.proposals.map(p => ({
      ID: p.proposalNumber || p.id,
      Cliente: p.client,
      Consultor: p.representative,
      Valor: p.value,
      Status: p.status,
      Data: p.date,
      "Tamanho Sistema": p.systemSize,
      "Comissão": p.commission
    }));

    const proposalsCSV = Papa.unparse(proposalsCSVData);
    const proposalsBlob = new Blob([proposalsCSV], { type: 'text/csv;charset=utf-8;' });
    const proposalsLink = document.createElement("a");
    proposalsLink.href = URL.createObjectURL(proposalsBlob);
    proposalsLink.setAttribute("download", `propostas_${todayStr}.csv`);
    document.body.appendChild(proposalsLink);
    proposalsLink.click();
    document.body.removeChild(proposalsLink);

    // Export Installations
    const installationsCSVData = filteredData.installations.map(i => ({
      ID: i.projectId || i.id,
      Cliente: i.name,
      Progresso: `${i.progress}%`,
      Etapa: i.stage,
      Instalador: i.technician?.name || 'N/A',
      Data_Criacao: i.startDate || i.lastUpdated || 'N/A'
    }));

    const installationsCSV = Papa.unparse(installationsCSVData);
    const installationsBlob = new Blob([installationsCSV], { type: 'text/csv;charset=utf-8;' });
    const installationsLink = document.createElement("a");
    installationsLink.href = URL.createObjectURL(installationsBlob);
    installationsLink.setAttribute("download", `projetos_${todayStr}.csv`);
    document.body.appendChild(installationsLink);
    installationsLink.click();
    document.body.removeChild(installationsLink);
  };

  return (
    <PageTransition>
    <div className="space-y-8 pb-20">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black font-display tracking-tight text-slate-900 dark:text-slate-100">
            Relatórios <span className="text-[#fdb612]">Executivos</span>
          </h1>
          <p className="text-slate-500 font-bold mt-2">Análise profunda de performance e operações.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <Calendar className="w-4 h-4 text-[#fdb612] ml-2" />
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-transparent text-xs font-black uppercase outline-none pr-4 cursor-pointer"
            >
              <option value="30days">Últimos 30 Dias</option>
              <option value="90days">Últimos 90 Dias</option>
              <option value="all">Todo o Período</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <Users className="w-4 h-4 text-[#fdb612] ml-2" />
            <select 
              value={consultantFilter}
              onChange={(e) => setConsultantFilter(e.target.value)}
              className="bg-transparent text-xs font-black uppercase outline-none pr-4 cursor-pointer"
            >
              <option value="all">Todos Consultores</option>
              {consultants.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={exportCSV}
              className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 border border-[#fdb612]/30 text-[#fdb612] rounded-2xl font-black text-sm hover:scale-105 transition-transform shadow-sm"
            >
              <Download className="w-4 h-4" />
              EXPORTAR CSV
            </button>
            <button 
              onClick={exportPDF}
              className="flex items-center gap-2 px-6 py-3 bg-[#fdb612] text-[#231d0f] rounded-2xl font-black text-sm hover:scale-105 transition-transform shadow-lg shadow-[#fdb612]/20"
            >
              <Printer className="w-4 h-4" />
              EXPORTAR PDF
            </button>
          </div>
        </div>
      </div>

      <div ref={reportRef} className="space-y-8 p-4 bg-slate-50 dark:bg-transparent rounded-3xl">
        {/* Sales Report Summary */}
        <div className="bg-[#231d0f] text-white p-8 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-center gap-8 border border-[#fdb612]/20">
          <div>
            <h2 className="text-2xl font-black mb-2 flex items-center gap-2">
              <CheckCircle2 className="text-[#fdb612]" />
              Relatório de Performance de Vendas
            </h2>
            <p className="text-slate-400 text-sm font-medium">Período: {dateRange === '30days' ? 'Últimos 30 Dias' : dateRange === '90days' ? 'Últimos 90 Dias' : 'Todo o Período'}</p>
          </div>
          <div className="flex gap-8">
            <div className="text-center">
              <p className="text-[#fdb612] text-[10px] font-black uppercase tracking-widest mb-1">Total Vendas</p>
              <p className="text-2xl font-black">R$ {stats.totalSales.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
            </div>
            <div className="text-center border-x border-white/10 px-8">
              <p className="text-[#fdb612] text-[10px] font-black uppercase tracking-widest mb-1">Conversão</p>
              <p className="text-2xl font-black">{stats.conversionRate.toFixed(1)}%</p>
            </div>
            <div className="text-center">
              <p className="text-[#fdb612] text-[10px] font-black uppercase tracking-widest mb-1">Ticket Médio</p>
              <p className="text-2xl font-black">R$ {stats.avgProposalValue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
            </div>
          </div>
        </div>

        {/* Executive Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
                <TrendingUp className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black uppercase text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg">Performance</span>
            </div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Volume de Vendas</p>
            <h3 className="text-2xl font-black mt-1">R$ {stats.totalSales.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</h3>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black uppercase text-blue-500 bg-blue-50 px-2 py-1 rounded-lg">Conversão</span>
            </div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Taxa de Fechamento</p>
            <h3 className="text-2xl font-black mt-1">{stats.conversionRate.toFixed(1)}%</h3>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl">
                <FileText className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black uppercase text-amber-500 bg-amber-50 px-2 py-1 rounded-lg">Ticket</span>
            </div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Commissionamento</p>
            <h3 className="text-2xl font-black mt-1">R$ {stats.totalCommission.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</h3>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 text-purple-600 rounded-2xl">
                <ArrowUpRight className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black uppercase text-purple-500 bg-purple-50 px-2 py-1 rounded-lg">Escala</span>
            </div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Potência Média</p>
            <h3 className="text-2xl font-black mt-1">{stats.avgSystemSize.toFixed(2)} kWp</h3>
          </div>
        </div>

        {/* Sales Performance vs Goals Section */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
            <div>
              <h3 className="text-xl font-black font-display uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <TrendingUp className="text-[#fdb612]" />
                Desempenho vs Metas de Venda
              </h3>
              <p className="text-xs text-slate-400 mt-1">Comparativo de faturamento real e quantidade de contratos fechados contra as metas estipuladas do mês.</p>
            </div>
            
            <div className="flex gap-4">
              <div className="px-5 py-3 bg-[#fdb612]/5 rounded-2xl border border-[#fdb612]/10">
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Meta de Receita</span>
                <span className="text-sm font-black text-[#fdb612]">R$ {goalComparison.targetValue.toLocaleString('pt-BR')}</span>
              </div>
              <div className="px-5 py-3 bg-[#fdb612]/5 rounded-2xl border border-[#fdb612]/10">
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Meta de Contratos</span>
                <span className="text-sm font-black text-[#fdb612]">{goalComparison.targetCount} un</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Revenue Achievement Indicator */}
            <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Atingimento de Receita (Mês Atual)</span>
                <h4 className="text-3xl font-black mt-2 text-slate-900 dark:text-slate-100">
                  R$ {goalComparison.currentSales.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                </h4>
                <p className="text-xs text-slate-400 mt-1 font-medium">Meta: R$ {salesGoal.targetValue.toLocaleString('pt-BR')}</p>
              </div>
              <div className="text-right">
                <span className={cn(
                  "text-2xl font-black px-3 py-1.5 rounded-2xl",
                  goalComparison.valueAchievement >= 100 ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400" : "bg-[#fdb612]/15 text-[#fdb612]"
                )}>
                  {goalComparison.valueAchievement.toFixed(1)}%
                </span>
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{goalComparison.valueAchievement >= 100 ? 'Meta Superada! 🎉' : 'Em Progresso'}</span>
              </div>
            </div>

            {/* Contract Volume Achievement Indicator */}
            <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Atingimento de Contratos (Mês Atual)</span>
                <h4 className="text-3xl font-black mt-2 text-slate-900 dark:text-slate-100">{goalComparison.currentCount} contratos</h4>
                <p className="text-xs text-slate-400 mt-1 font-medium">Meta: {salesGoal.targetCount} contratos</p>
              </div>
              <div className="text-right">
                <span className={cn(
                  "text-2xl font-black px-3 py-1.5 rounded-2xl",
                  goalComparison.countAchievement >= 100 ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400" : "bg-blue-100 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400"
                )}>
                  {goalComparison.countAchievement.toFixed(1)}%
                </span>
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{goalComparison.countAchievement >= 100 ? 'Meta Atingida! ⚡' : 'Em Progresso'}</span>
              </div>
            </div>
          </div>

          {/* Historical comparison chart */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Comparativo Mensal de Faturamento Real vs Meta de Receita</h4>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesVsGoalChartData} margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#f1f5f9'} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} tickFormatter={(val) => `R$ ${val/1000}k`} />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '16px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                      color: isDarkMode ? '#f1f5f9' : '#1e293b'
                    }}
                    formatter={(value: number, name: string) => [
                      `R$ ${value.toLocaleString('pt-BR')}`,
                      name === 'sales' ? 'Faturamento Real' : 'Meta de Vendas'
                    ]}
                  />
                  <Bar dataKey="sales" name="Faturamento Real" fill="#fdb612" radius={[4, 4, 0, 0]} barSize={24} />
                  <Bar dataKey="goal" name="Meta de Vendas" fill="#94a3b8" radius={[4, 4, 0, 0]} opacity={0.3} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 text-[10px] font-black uppercase tracking-widest">
              <div className="flex items-center gap-1.5">
                <div className="size-3 bg-[#fdb612] rounded" />
                <span>Receita Realizada (Mês)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="size-3 bg-slate-400/40 rounded" />
                <span>Meta Estipulada</span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sales History */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h4 className="text-lg font-black font-display uppercase tracking-widest">Histórico de Faturamento</h4>
              <div className="size-3 rounded-full bg-[#fdb612] animate-pulse" />
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#fdb612" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#fdb612" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#f1f5f9'} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#94a3b8' }} tickFormatter={(val) => `R$ ${val/1000}k`} />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '16px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                      color: isDarkMode ? '#f1f5f9' : '#1e293b'
                    }}
                    formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`, 'Faturamento']}
                  />
                  <Area type="monotone" dataKey="sales" stroke="#fdb612" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Installation Status */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <h4 className="text-lg font-black font-display mb-8 uppercase tracking-widest">Distribuição de Instalações</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.installationDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {stats.installationDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-4">
                {stats.installationDistribution.map(item => (
                  <div key={item.name} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-white/5">
                    <div className="flex items-center gap-3">
                      <div className="size-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{item.name}</span>
                    </div>
                    <span className="text-sm font-black">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Table */}
        <div className="grid grid-cols-1 gap-8">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <h4 className="text-lg font-black font-display mb-8 uppercase tracking-widest">Desempenho de Comissão por Consultor</h4>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={consultantCommissionData} margin={{ top: 20, right: 30, left: 40, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#f1f5f9'} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }}
                    angle={-45}
                    textAnchor="end"
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fontWeight: 700, fill: '#94a3b8' }}
                    tickFormatter={(val) => `R$ ${val/1000}k`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '16px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                      color: isDarkMode ? '#f1f5f9' : '#1e293b'
                    }}
                    formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`, 'Comissão']}
                  />
                  <Bar dataKey="paid" name="Paga" fill="#10b981" radius={[4, 4, 0, 0]} stackId="a" />
                  <Bar dataKey="pending" name="Pendente" fill="#f59e0b" radius={[4, 4, 0, 0]} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-8 mt-4">
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full bg-[#10b981]" />
                <span className="text-xs font-bold text-slate-500 uppercase">Comissão Paga</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full bg-[#f59e0b]" />
                <span className="text-xs font-bold text-slate-500 uppercase">Comissão Pendente</span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Table */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100 dark:border-slate-800">
            <h4 className="text-lg font-black font-display uppercase tracking-widest">Detalhamento de Propostas Recentes</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 dark:bg-white/5">
                  <th className="px-8 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Cliente</th>
                  <th className="px-8 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Consultor</th>
                  <th className="px-8 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Valor</th>
                  <th className="px-8 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                  <th className="px-8 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredData.proposals.slice(0, 5).map(proposal => (
                  <tr key={proposal.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-8 py-4">
                      <p className="text-sm font-bold">{proposal.client}</p>
                    </td>
                    <td className="px-8 py-4">
                      <p className="text-xs font-medium text-slate-500">{proposal.representative}</p>
                    </td>
                    <td className="px-8 py-4 font-black text-sm">
                      {proposal.value}
                    </td>
                    <td className="px-8 py-4">
                      <span className={cn(
                        "text-[10px] font-black px-2 py-1 rounded-lg uppercase",
                        proposal.status === 'accepted' ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-600"
                      )}>
                        {proposal.status}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-xs text-slate-400 font-bold">
                      {formatDate(proposal.date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    </PageTransition>
  );
};
