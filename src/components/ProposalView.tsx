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
  Download,
  Star
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
  photoUrl?: string;
  customImageLinks?: string[];
  totalSavings25Years?: number;
  systemOversizing?: number;
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
  photoUrl,
  customImageLinks,
  totalSavings25Years,
  systemOversizing,
  onBack
}) => {
  // Generate 25-year projection data if 25y savings specifically provided, otherwise default to 10y
  const yearsToShow = 10;
  const projectionData = Array.from({ length: yearsToShow }, (_, i) => {
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

  // Calculate 25y savings if not provided
  const r = 0.05;
  const n = 25;
  const annualSavingBase = monthlySavings * 12;
  const calculatedSavings25y = totalSavings25Years || (annualSavingBase * ((Math.pow(1 + r, n) - 1) / r));

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
      <header className="bg-white dark:bg-[#1a160d] rounded-[4rem] p-12 border border-slate-200 dark:border-white/5 shadow-2xl relative overflow-hidden print:rounded-none print:shadow-none print:border-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-[#fdb612]/10 to-transparent rounded-full -mr-48 -mt-48 blur-[100px] print:hidden" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10 relative z-10">
          <div className="space-y-6 flex-1">
            <div className="flex items-center justify-between w-full md:w-auto">
              <div className="flex items-center gap-5">
                <div className="size-20 bg-gradient-to-br from-[#fdb612] to-[#ff9f00] rounded-3xl flex items-center justify-center text-[#231d0f] font-black text-3xl shadow-[0_20px_50px_rgba(253,182,18,0.3)] transform -rotate-3">
                  VS
                </div>
                <div>
                  <h1 className="text-3xl font-black text-slate-900 dark:text-slate-50 uppercase tracking-tighter">Vieira's Solar</h1>
                  <p className="text-[10px] font-black text-[#fdb612] uppercase tracking-[0.4em] leading-none">Engineering Excellence</p>
                </div>
              </div>
              <div className="flex gap-3 print:hidden ml-6 lg:fixed lg:top-8 lg:right-32 lg:z-50 bg-white/80 dark:bg-[#1a160d]/80 backdrop-blur-xl p-2 rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl">
                <button 
                  onClick={async () => {
                    const { generateProposalPDF } = await import('../services/pdfService');
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
                  className="px-6 py-3 bg-[#fdb612] text-[#231d0f] rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center gap-2 font-black text-xs uppercase tracking-widest"
                >
                  <Download className="w-4 h-4" />
                  Dossiê PDF
                </button>
                <button 
                  onClick={() => window.print()}
                  className="p-3 bg-slate-900 dark:bg-white/10 text-white dark:text-slate-100 rounded-xl hover:bg-slate-800 dark:hover:bg-white/20 transition-all border border-transparent dark:border-white/5"
                >
                  <FileText className="w-5 h-5" />
                </button>
                <button 
                  onClick={onBack}
                  className="p-3 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
                >
                  <ArrowRight className="w-5 h-5 rotate-180" />
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-black uppercase tracking-widest">
                <CheckCircle2 className="w-3 h-3" />
                Estudo de Viabilidade Técnica Concluído
              </span>
              <h2 className="text-5xl lg:text-7xl font-black text-slate-900 dark:text-slate-50 tracking-tighter uppercase leading-[0.9]">Proposta <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#fdb612] to-[#ff9f00]">Premium</span></h2>
              <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">Arquitetura solar personalizada para <span className="text-slate-900 dark:text-white font-black underline decoration-[#fdb612] underline-offset-8">{clientName}</span></p>
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-white/5 p-8 rounded-[3rem] border border-slate-100 dark:border-white/5 text-right space-y-3 min-w-[240px] shadow-inner">
            <div className="flex flex-col gap-1 items-end">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Referência do Projeto</span>
              <span className="text-xl font-black text-slate-900 dark:text-slate-100">{proposalNumber}</span>
            </div>
            <div className="flex flex-col gap-1 items-end">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Condição Válida Até</span>
              <span className="text-xl font-black text-emerald-500">{validUntil}</span>
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

      {/* Technical Analysis Section (Oversizing) */}
      {systemOversizing && (
        <section className="bg-amber-500/5 dark:bg-amber-500/10 rounded-[3rem] p-10 border border-amber-500/20 space-y-6">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
              <BadgeCheck className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-black text-amber-900 dark:text-amber-100 uppercase tracking-tight">Análise de Performance Premium</h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-end gap-2">
                <span className="text-5xl font-black text-amber-600">{(systemOversizing * 100 - 100).toFixed(0)}%</span>
                <span className="text-sm font-bold text-amber-700/60 uppercase mb-2">Extra de Produção (Oversizing)</span>
              </div>
              <p className="text-amber-800/80 dark:text-amber-200/80 font-medium leading-relaxed">
                Seu sistema foi projetado com um ratio técnico de <span className="font-bold">{systemOversizing.toFixed(2)}x</span> (conhecido como oversizing). 
                Esta é uma prática de engenharia <span className="font-bold text-amber-600">altamente recomendada</span> no mercado solar atual.
              </p>
              <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
                <p className="text-[10px] font-black uppercase text-amber-700 mb-2">Por que fazemos isso?</p>
                <p className="text-[11px] text-amber-800/80 leading-relaxed">
                  O benefício principal é a <span className="font-bold italic">otimização de baixo brilho</span>. Inversores precisam de uma tensão mínima para "acordar". Com mais painéis, seu sistema começa a gerar 30-40 minutos antes e termina 30-40 minutos depois. O "risco" de clipping (perda de pico ao meio-dia) é irrelevante frente ao ganho total de energia acumulada no mês.
                </p>
              </div>
            </div>
            <div className="bg-white/40 dark:bg-black/20 p-6 rounded-2xl border border-amber-500/10">
              <h4 className="text-xs font-black uppercase tracking-widest text-amber-700 mb-3">Vantagens Desta Configuração</h4>
              <ul className="space-y-2">
                {[
                  'Início de geração mais antecipado',
                  'Performance superior em dias chuvosos',
                  'Inversor trabalhando em sua curva de máxima eficiência',
                  'Proteção contra degradação natural dos painéis'
                ].map((item, i) => (
                  <li key={i} className="text-xs font-bold text-amber-800/70 dark:text-amber-200/70 flex items-center gap-2">
                    <div className="size-1.5 bg-amber-500 rounded-full" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

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
          <div className="bg-white dark:bg-[#1a160d] p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-xl space-y-8">
            <div className="flex items-center gap-3">
              <div className="size-10 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">Indicadores Financeiros (Realistas)</h4>
            </div>

            <div className="space-y-4">
              {[
                { label: "Economia média mensal", value: `~R$ ${((totalSavings25Years || (monthlySavings * 12 * 47.727)) / (25 * 12)).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` },
                { label: "Economia anual (1º ano)", value: `~R$ ${(monthlySavings * 12).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` },
                { label: "Payback simples", value: `~${(paybackMonths / 12).toFixed(1)} anos` },
                { label: "ROI (25 anos)", value: `${(roiMonthly * 12 * 25).toFixed(0)}%` },
                { label: "Economia acumulada (25 anos)*", value: `~R$ ${(totalSavings25Years || (monthlySavings * 12 * 47.727)).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, highlight: true }
              ].map((item, i) => (
                <div key={i} className={cn(
                  "flex items-center justify-between p-4 rounded-2xl border transition-all",
                  item.highlight ? "bg-emerald-500/10 border-emerald-500/20" : "bg-white dark:bg-white/5 border-slate-100 dark:border-white/5 shadow-sm"
                )}>
                  <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{item.label}</span>
                  <span className={cn(
                    "text-sm font-black",
                    item.highlight ? "text-emerald-500" : "text-slate-900 dark:text-slate-100"
                  )}>{item.value}</span>
                </div>
              ))}
            </div>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter leading-relaxed">
              *Considerando reajustes anuais de 5% (Premissa Técnica Vieira's). Tarifa base de R$ 0,89/kWh (Ref: CEMIG MG 2024).
            </p>
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

      {/* Project Gallery & Social Proof */}
      <section className="space-y-12">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="size-14 bg-[#fdb612]/20 text-[#fdb612] rounded-3xl flex items-center justify-center shadow-lg">
            <Award className="w-8 h-8" />
          </div>
          <h3 className="text-3xl font-black text-slate-900 dark:text-slate-50 uppercase tracking-tight">Experiência Vieira's no Campo</h3>
          <p className="text-slate-500 font-medium max-w-2xl">Mais de 1.500 projetos homologados em Minas Gerais com índice de satisfação superior a 98%.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {(photoUrl || (customImageLinks && customImageLinks.length > 0)) ? (
            <>
              {photoUrl && (
                <div className="group relative aspect-video rounded-[3rem] overflow-hidden bg-slate-100 dark:bg-[#231d0f] border border-slate-200 dark:border-slate-800 shadow-xl">
                  <img src={photoUrl} alt="Locat" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" referrerPolicy="no-referrer" />
                  <div className="absolute inset-x-8 bottom-8 p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                    <span className="text-white font-black uppercase text-[10px] tracking-widest">Local da Instalação</span>
                  </div>
                </div>
              )}
              {customImageLinks?.map((link, idx) => (
                <div key={idx} className="group relative aspect-video rounded-[3rem] overflow-hidden bg-slate-100 dark:bg-[#231d0f] border border-slate-200 dark:border-slate-800 shadow-xl">
                  <img src={link} alt={`Anexo ${idx + 1}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" referrerPolicy="no-referrer" />
                  <div className="absolute inset-x-8 bottom-8 p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                    <span className="text-white font-black uppercase text-[10px] tracking-widest">Projetos Executados {idx + 1}</span>
                  </div>
                </div>
              ))}
            </>
          ) : (
            [1, 2, 3].map((i) => (
              <div key={i} className="p-8 bg-white dark:bg-[#231d0f] rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-lg space-y-6">
                <div className="flex gap-1 text-[#fdb612]">
                  {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-4 h-4 fill-current" />)}
                </div>
                <p className="text-slate-600 dark:text-slate-300 font-medium italic leading-relaxed">
                  "O atendimento da Vieira's Solar foi impecável. A economia na conta de luz veio exatamente como o engenheiro Marusan previu no projeto."
                </p>
                <div className="flex items-center gap-3">
                  <div className="size-10 bg-slate-200 dark:bg-slate-700 rounded-full" />
                  <div>
                    <p className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase">Cliente Satisfeito {i}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">São João do Oriente - MG</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-slate-50 dark:bg-white/5 rounded-[4rem] p-12 space-y-10 border border-slate-100 dark:border-white/5">
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">Perguntas Frequentes</h3>
          <p className="text-slate-500 font-medium">Tire suas dúvidas técnicas sobre o investimento.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            { q: "O inversor de 5kW suporta 7,5kWp de painéis?", a: "Sim! Essa prática (oversizing) é recomendada para maximizar a geração em dias nublados ou horários de sol fraco, garantindo que o inversor trabalhe sempre próximo da sua capacidade nominal." },
            { q: "O que acontece se acabar a luz na rua?", a: "Por segurança (anti-ilhamento), o sistema se desliga automaticamente para proteger os técnicos da concessionária. Ao retornar a energia, ele religa em instantes." },
            { q: "Quanto tempo dura o sistema?", a: "Os painéis têm garantia de performance de 25 anos, mas podem durar mais de 40 anos operando com eficiência." },
            { q: "Como funciona a manutenção?", a: "A manutenção é mínima, consistindo basicamente na limpeza periódica dos módulos (1 ou 2 vezes ao ano) para remover poeira." }
          ].map((item, i) => (
            <div key={i} className="space-y-3">
              <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase flex items-center gap-2">
                <div className="size-2 bg-[#fdb612] rounded-full" />
                {item.q}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium pl-4">{item.a}</p>
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
