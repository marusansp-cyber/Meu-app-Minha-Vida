import React from 'react';
import { 
  ShieldCheck, 
  Zap, 
  TrendingUp, 
  DollarSign, 
  Sun, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Calendar, 
  MapPin, 
  CreditCard, 
  Smartphone,
  ChevronRight,
  ArrowRight,
  BadgeCheck,
  Award,
  Lock,
  LayoutGrid,
  Download
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface ProposalViewProps {
  clientName: string;
  systemSize: string;
  monthlyGeneration: number;
  monthlySavings: number;
  totalInvestment: number;
  paybackMonths: number;
  roiMonthly: number;
  validUntil: string;
  proposalNumber: string;
  onBack: () => void;
}

export const ProposalView: React.FC<ProposalViewProps> = ({
  clientName,
  systemSize,
  monthlyGeneration,
  monthlySavings,
  totalInvestment,
  paybackMonths,
  roiMonthly,
  validUntil,
  proposalNumber,
  onBack
}) => {
  // Generate 10-year projection data
  const projectionData = Array.from({ length: 10 }, (_, i) => {
    const year = i + 1;
    const annualGen = monthlyGeneration * 12 * (1 - (i * 0.005)); // 0.5% degradation
    const annualSavings = monthlySavings * 12 * Math.pow(1.05, i); // 5% energy inflation
    return {
      year,
      generation: annualGen,
      savings: annualSavings,
      accumulated: (annualSavings * year) - totalInvestment
    };
  });

  const journeySteps = [
    { id: 1, title: 'Onboard', desc: 'Início da sua jornada para independência energética.', icon: <Smartphone className="w-6 h-6" /> },
    { id: 2, title: 'Análise Prévia', desc: 'Estudo detalhado do seu telhado e padrões de consumo.', icon: <LayoutGrid className="w-6 h-6" /> },
    { id: 3, title: 'Visita Técnica', desc: 'Vistoria presencial para validação de infraestrutura.', icon: <MapPin className="w-6 h-6" /> },
    { id: 4, title: 'Homologação', desc: 'Gestão burocrática junto à concessionária de energia.', icon: <ShieldCheck className="w-6 h-6" /> },
    { id: 5, title: 'Instalação', desc: 'Montagem rápida e segura com equipe especializada.', icon: <Zap className="w-6 h-6" /> },
    { id: 6, title: 'Monitoramento', desc: 'Acompanhamento em tempo real via aplicativo.', icon: <TrendingUp className="w-6 h-6" /> },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20 animate-in fade-in duration-700 print:p-0 print:m-0 print:max-w-none">
      {/* Header / Hero */}
      <header className="bg-white dark:bg-[#231d0f] rounded-[3rem] p-10 border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden print:rounded-none print:shadow-none print:border-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#fdb612]/5 rounded-full -mr-48 -mt-48 blur-3xl print:hidden" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10">
          <div className="space-y-4">
            <div className="flex items-center justify-between w-full md:w-auto">
              <div className="flex items-center gap-4">
                <div className="size-16 bg-[#fdb612] rounded-2xl flex items-center justify-center text-[#231d0f] font-black text-2xl shadow-lg shadow-[#fdb612]/20">
                  VS
                </div>
                <div>
                  <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">Vieira's Solar</h1>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Engenharia & Energia</p>
                </div>
              </div>
              <div className="flex gap-2 print:hidden ml-4">
                <button 
                  onClick={async () => {
                    const { generateProposalPDF } = await import('../services/pdfService');
                    // We need a dummy proposal object or better, we should pass the full proposal data to ProposalView
                    // For now, let's trigger a toast or handle it if we have the data
                    // Since ProposalView is a presentation component, I will add a loading state
                    const link = document.createElement('a');
                    link.href = await generateProposalPDF({
                      client: clientName,
                      value: totalInvestment,
                      systemSize: systemSize,
                      date: new Date().toISOString(),
                      status: 'pending',
                      representative: "Consultor Vieira's",
                      payback: (paybackMonths / 12).toFixed(1)
                    } as any);
                    link.download = `Proposta_${clientName.replace(/\s+/g, '_')}.pdf`;
                    link.click();
                  }}
                  className="p-3 bg-emerald-500 text-white rounded-xl hover:scale-110 transition-all shadow-lg flex items-center gap-2"
                  title="Baixar Dossiê PDF"
                >
                  <Download className="w-5 h-5" />
                  <span className="hidden lg:inline text-xs font-black uppercase">Dossiê Completo</span>
                </button>
                <button 
                  onClick={() => window.print()}
                  className="p-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl hover:scale-110 transition-all shadow-lg"
                  title="Versão para Impressão"
                >
                  <FileText className="w-5 h-5" />
                </button>
                <button 
                  onClick={onBack}
                  className="p-3 bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white rounded-xl hover:scale-110 transition-all border border-slate-200 dark:border-white/10"
                  title="Voltar"
                >
                  <ArrowRight className="w-5 h-5 rotate-180" />
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <h2 className="text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tighter uppercase">Proposta Técnica</h2>
              <p className="text-slate-500 font-medium">Preparada exclusivamente para <span className="text-[#fdb612] font-black">{clientName}</span></p>
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-white/5 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 text-right space-y-2 min-w-[200px]">
            <div className="flex justify-between items-center gap-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Proposta Nº</span>
              <span className="font-black text-slate-900 dark:text-slate-100">{proposalNumber}</span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Validade</span>
              <span className="font-black text-emerald-500">{validUntil}</span>
            </div>
          </div>
        </div>
      </header>

      {/* The Journey Section */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">Sua Jornada Solar</h3>
          <p className="text-slate-500 font-medium">Transparência e profissionalismo em cada etapa do processo.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {journeySteps.map((step) => (
            <div key={step.id} className="bg-white dark:bg-[#231d0f]/40 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:border-[#fdb612]/50 transition-all group">
              <div className="flex items-start justify-between mb-6">
                <div className="size-14 bg-slate-50 dark:bg-white/5 text-[#fdb612] rounded-2xl flex items-center justify-center group-hover:bg-[#fdb612] group-hover:text-[#231d0f] transition-all shadow-inner">
                  {step.icon}
                </div>
                <span className="text-4xl font-black text-slate-100 dark:text-white/5 group-hover:text-[#fdb612]/10 transition-all">{step.id}</span>
              </div>
              <h4 className="text-lg font-black text-slate-900 dark:text-slate-100 uppercase mb-2">{step.title}</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Financial Projection Section */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-[#231d0f] rounded-[3rem] p-10 border border-slate-200 dark:border-slate-800 shadow-xl space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-emerald-500" />
              Projeção de 10 Anos
            </h3>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-white/5 px-4 py-2 rounded-full">Estimativa Baseada em Histórico</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ano</th>
                  <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Geração (kWh)</th>
                  <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Economia (R$)</th>
                  <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo (R$)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                {projectionData.map((row) => (
                  <tr key={row.year} className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <td className="py-4 font-black text-slate-900 dark:text-slate-100">{row.year}</td>
                    <td className="py-4 text-sm font-bold text-slate-500">{row.generation.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} kWh</td>
                    <td className="py-4 text-sm font-bold text-emerald-500">R$ {row.savings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className={cn(
                      "py-4 text-sm font-black",
                      row.accumulated >= 0 ? "text-emerald-500" : "text-rose-500"
                    )}>
                      R$ {row.accumulated.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-emerald-500 text-white rounded-[2.5rem] p-10 shadow-xl shadow-emerald-500/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700" />
            <span className="block text-[10px] font-black uppercase tracking-[0.3em] mb-6 opacity-60">Economia em 5 Anos</span>
            <div className="text-5xl font-black tracking-tighter mb-2">
              <span className="text-xl font-medium mr-1 opacity-60">R$</span>
              {projectionData.slice(0, 5).reduce((acc, curr) => acc + curr.savings, 0).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
            <p className="text-sm font-bold text-emerald-100">Retorno garantido sobre o seu investimento inicial.</p>
          </div>

          <div className="bg-[#231d0f] text-white rounded-[2.5rem] p-10 shadow-xl border border-white/5 space-y-8">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <span className="block text-[10px] font-black uppercase tracking-widest opacity-40">Payback</span>
                <p className="text-2xl font-black text-[#fdb612]">{paybackMonths} Meses</p>
              </div>
              <div className="size-12 bg-white/5 rounded-2xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-[#fdb612]" />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <span className="block text-[10px] font-black uppercase tracking-widest opacity-40">Taxa de Retorno</span>
                <p className="text-2xl font-black text-emerald-500">{roiMonthly}% a.m.</p>
              </div>
              <div className="size-12 bg-white/5 rounded-2xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-500" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Specs Section */}
      <section className="space-y-8">
        <div className="flex items-center gap-3">
          <div className="size-10 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">Especificações Técnicas</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Potência do Projeto', value: `${systemSize} kWp`, icon: <Sun className="w-5 h-5" />, color: 'text-amber-500' },
            { label: 'Geração Estimada', value: `${monthlyGeneration.toLocaleString('pt-BR')} kWh/mês`, icon: <TrendingUp className="w-5 h-5" />, color: 'text-emerald-500' },
            { label: 'Área Útil Necessária', value: `${(parseFloat(systemSize) * 6).toFixed(0)} m²`, icon: <LayoutGrid className="w-5 h-5" />, color: 'text-blue-500' },
            { label: 'Economia Mensal', value: `R$ ${monthlySavings.toLocaleString('pt-BR')}`, icon: <DollarSign className="w-5 h-5" />, color: 'text-emerald-500' },
          ].map((spec, i) => (
            <div key={i} className="bg-white dark:bg-[#231d0f]/40 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center space-y-4">
              <div className={cn("size-12 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center", spec.color)}>
                {spec.icon}
              </div>
              <div>
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{spec.label}</span>
                <span className="text-xl font-black text-slate-900 dark:text-slate-100">{spec.value}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Investment & Payment Section */}
      <section className="bg-[#231d0f] rounded-[4rem] p-12 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-[#fdb612]/10 to-transparent pointer-events-none" />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 relative z-10">
          <div className="space-y-10">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#fdb612] text-[#231d0f] rounded-full text-[10px] font-black uppercase tracking-[0.2em]">Investimento Proposto</span>
              <h3 className="text-5xl font-black tracking-tighter uppercase">Sua Independência <br /> Energética</h3>
              <p className="text-slate-400 text-lg font-medium max-w-md">Transforme seu gasto mensal em um ativo financeiro de alta rentabilidade.</p>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="size-12 bg-white/5 rounded-2xl flex items-center justify-center text-[#fdb612]">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-black uppercase text-sm tracking-widest">Formas de Pagamento</h4>
                  <p className="text-xs text-slate-500">Opções flexíveis que cabem no seu orçamento.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-6 bg-white/5 rounded-3xl border border-white/5 hover:border-[#fdb612]/30 transition-all">
                  <span className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">Cartão de Crédito</span>
                  <p className="text-lg font-black">Até 21x</p>
                  <p className="text-[10px] text-emerald-500 font-bold uppercase mt-1">10x Sem Juros</p>
                </div>
                <div className="p-6 bg-white/5 rounded-3xl border border-white/5 hover:border-[#fdb612]/30 transition-all">
                  <span className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">Financiamento</span>
                  <p className="text-lg font-black">Até 120x</p>
                  <p className="text-[10px] text-blue-400 font-bold uppercase mt-1">Carência de 120 dias</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center items-center lg:items-end space-y-8">
            <div className="bg-white/5 backdrop-blur-md p-12 rounded-[3.5rem] border border-white/10 text-center lg:text-right space-y-4 w-full max-w-md shadow-2xl">
              <span className="block text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Valor Total do Projeto</span>
              <div className="text-6xl font-black text-[#fdb612] tracking-tighter">
                <span className="text-2xl font-medium mr-1 opacity-40">R$</span>
                {totalInvestment.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
              <div className="pt-6 border-t border-white/10">
                <p className="text-sm font-bold text-emerald-500 uppercase tracking-widest">Desconto de 5% à vista no PIX</p>
              </div>
            </div>
            <button className="w-full max-w-md py-8 bg-[#fdb612] text-[#231d0f] rounded-[2.5rem] font-black text-xl uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-[#fdb612]/20">
              Aceitar Proposta
            </button>
          </div>
        </div>
      </section>

      {/* Warranties & Trust Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Performance', value: '25 Anos', desc: 'Garantia de geração linear.', icon: <Award className="w-6 h-6" /> },
          { label: 'Instalação', value: '12 Meses', desc: 'Garantia total de montagem.', icon: <BadgeCheck className="w-6 h-6" /> },
          { label: 'Seguro Próprio', value: '3 Anos', desc: 'Proteção contra desastres.', icon: <Lock className="w-6 h-6" /> },
          { label: 'Equipamentos', value: '15 Anos', desc: 'Garantia de fábrica premium.', icon: <ShieldCheck className="w-6 h-6" /> },
        ].map((item, i) => (
          <div key={i} className="bg-white dark:bg-[#231d0f]/40 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center space-y-4 group hover:bg-[#fdb612]/5 transition-all">
            <div className="size-14 bg-slate-50 dark:bg-white/5 text-[#fdb612] rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              {item.icon}
            </div>
            <div>
              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</span>
              <span className="text-xl font-black text-slate-900 dark:text-slate-100">{item.value}</span>
              <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-tight">{item.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Footer Actions */}
      <footer className="flex flex-col sm:flex-row justify-center items-center gap-6 pt-10">
        <button 
          onClick={onBack}
          className="px-10 py-5 border-2 border-slate-200 dark:border-slate-800 rounded-[2rem] font-black text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
        >
          Voltar às Propostas
        </button>
        <button 
          onClick={() => window.open(`https://wa.me/5533999032281?text=Olá! Acabei de ver a proposta técnica para o sistema de ${systemSize} e gostaria de tirar algumas dúvidas.`, '_blank')}
          className="px-12 py-6 bg-[#25D366] text-white rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:scale-105 transition-all shadow-xl shadow-[#25D366]/20"
        >
          <Smartphone className="w-5 h-5" />
          Falar com Especialista
        </button>
      </footer>
    </div>
  );
};
