import React from 'react';
import { motion } from 'motion/react';
import { Sun, Shield, Zap, TrendingUp, CheckCircle, ArrowRight, MessageCircle, Phone, Mail, FileText, ChevronDown } from 'lucide-react';

interface SolarLandingPageProps {
  onBack?: () => void;
}

const SolarLandingPage: React.FC<SolarLandingPageProps> = ({ onBack }) => {
  // Example client data
  const clientData = {
    name: 'Cliente',
    location: 'São João do Oriente - MG',
    consumption: 500,
    systemSize: '7.5 kWp',
    panels: 20,
    monthlyGeneration: 542,
    monthlySavings: 445, // 500 kWh * 0.89
    payback: '4.2',
    totalInvestment: 14800,
    roi: '1622%', // (254,862 - 14,800) / 14,800
    totalSavings25Years: 254862, // 445 * 12 * 47.727 (Sum of GP 5% 25years)
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-white font-sans text-slate-900 min-h-screen selection:bg-yellow-200">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={onBack}>
            <div className="w-8 h-8 rounded-lg bg-yellow-500 flex items-center justify-center">
              <Sun className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight uppercase">JV Mendes <span className="text-yellow-500">Engenharia</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <button onClick={() => scrollToSection('sistema')} className="hover:text-yellow-600 transition-colors">Sistema</button>
            <button onClick={() => scrollToSection('financeiro')} className="hover:text-yellow-600 transition-colors">Economia</button>
            <button onClick={() => scrollToSection('investimento')} className="hover:text-yellow-600 transition-colors">Investimento</button>
            <button onClick={() => scrollToSection('contato')} className="bg-yellow-500 text-white px-5 py-2.5 rounded-full hover:bg-yellow-600 transition-all shadow-sm shadow-yellow-200">
              Falar com Consultor
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="relative z-10"
          >
            <div className="inline-flex items-center gap-2 bg-yellow-50 px-3 py-1 rounded-full text-yellow-700 text-xs font-bold uppercase tracking-wider mb-6">
              <Zap className="w-3 h-3" />
              Proposta Exclusiva: {clientData.name}
            </div>
            <h1 className="text-5xl md:text-7xl font-bold leading-[0.9] tracking-tight mb-8">
              ZERE SUA CONTA DE LUZ EM <span className="text-yellow-500 underline decoration-yellow-200 decoration-8 underline-offset-4">SÃO JOÃO DO ORIENTE.</span>
            </h1>
            <p className="text-lg text-slate-600 max-w-lg mb-10 leading-relaxed">
              Sistema de alta performance projetado sob medida para seu consumo de 500 kWh/mês. Economize mais de <strong>R$ 254.000</strong> nos próximos 25 anos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => scrollToSection('financeiro')}
                className="group inline-flex items-center justify-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all hover:translate-y-[-2px] active:translate-y-0"
              >
                Ver Estudo Financeiro
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => window.open(`https://wa.me/33999032281?text=Olá Marusan! Vi minha proposta de ${clientData.systemSize} e quero tirar algumas dúvidas.`, '_blank')}
                className="inline-flex items-center justify-center gap-2 bg-white border-2 border-slate-200 px-8 py-4 rounded-2xl font-bold hover:border-yellow-500 hover:text-yellow-600 transition-all"
              >
                <MessageCircle className="w-5 h-5 text-green-500" />
                WhatsApp do Consultor
              </button>
            </div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative h-[500px] rounded-[40px] overflow-hidden shadow-2xl shadow-slate-200"
          >
            <img 
              src="https://images.unsplash.com/photo-1509391366360-fe5bb6583e2f?auto=format&fit=crop&q=80&w=1200" 
              alt="Energia Solar em Minas Gerais"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
            <div className="absolute bottom-8 left-8 right-8">
              <div className="bg-white/90 backdrop-blur-md p-6 rounded-3xl border border-white/20 flex flex-wrap gap-8">
                <div>
                  <p className="text-slate-500 text-xs uppercase font-bold tracking-widest mb-1">Localização</p>
                  <p className="text-slate-900 font-bold">{clientData.location}</p>
                </div>
                <div className="w-px h-10 bg-slate-200 hidden sm:block" />
                <div>
                  <p className="text-slate-500 text-xs uppercase font-bold tracking-widest mb-1">Potência</p>
                  <p className="text-slate-900 font-bold">{clientData.systemSize}</p>
                </div>
                <div className="w-px h-10 bg-slate-200 hidden sm:block" />
                <div>
                  <p className="text-slate-500 text-xs uppercase font-bold tracking-widest mb-1">Geração</p>
                  <p className="text-slate-900 font-bold">{clientData.monthlyGeneration} kWh/mês</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 mb-4 animate-bounce opacity-20">
          <ChevronDown className="w-8 h-8" />
        </div>
      </section>

      {/* Resumo do Sistema */}
      <section id="sistema" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Engenharia de Alta Performance</h2>
          <p className="text-slate-600 max-w-2xl mx-auto italic">
            Equipamentos selecionados para máxima durabilidade e eficiência nas condições climáticas de Minas Gerais.
          </p>
        </div>
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-3 gap-8">
          {[
            {
              title: "Módulos Tier-1",
              desc: "20 unidades de alta eficiência. 25 anos de garantia de performance linear.",
              icon: <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 mb-6 text-yellow-600"><Shield className="w-6 h-6" /></div>
            },
            {
              title: "Inversor Inteligente",
              desc: "Inversor de 5kW com oversizing estratégico (33%) para maximizar a geração em dias nublados.",
              icon: <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 mb-6 text-yellow-600"><TrendingUp className="w-6 h-6" /></div>
            },
            {
              title: "Instalação Premium",
              desc: "Mão de obra especializada e estrutura de alumínio com garantia vitalícia contra corrosão.",
              icon: <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 mb-6 text-yellow-600"><Zap className="w-6 h-6" /></div>
            }
          ].map((item, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -5 }}
              className="bg-white p-10 rounded-[32px] border border-slate-100 shadow-sm"
            >
              {item.icon}
              <h3 className="text-xl font-bold mb-4">{item.title}</h3>
              <p className="text-slate-600 leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Indicadores Financeiros */}
      <section id="financeiro" className="py-24">
        <div className="max-w-7xl mx-auto px-4 grid lg:grid-cols-2 gap-20 items-center">
          <div>
            <div className="w-12 h-12 bg-yellow-100 rounded-2xl flex items-center justify-center text-yellow-600 mb-6">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h2 className="text-4xl font-bold mb-8">Um Investimento que se Paga em Tempo Recorde.</h2>
            <div className="space-y-6">
              {[
                { label: "Economia Mensal Média", value: `R$ ${clientData.monthlySavings.toLocaleString('pt-BR')}`, color: "text-green-600" },
                { label: "Payback Estimado", value: `${clientData.payback} Anos`, color: "text-slate-900" },
                { label: "Retorno (ROI) 25 Anos", value: clientData.roi, color: "text-yellow-600" },
                { label: "Saldo Acumulado (25 anos)", value: `R$ ${clientData.totalSavings25Years.toLocaleString('pt-BR')}`, color: "text-slate-900" },
              ].map((stat, i) => (
                <div key={i} className="flex items-center justify-between py-4 border-b border-slate-100">
                  <span className="text-slate-600 font-medium">{stat.label}</span>
                  <span className={`text-2xl font-bold ${stat.color}`}>{stat.value}</span>
                </div>
              ))}
            </div>
            <p className="mt-8 text-xs text-slate-400 italic">
              * Considera tarifa de R$ 0,89/kWh (Fonte: CEMIG 2024) e reajuste anual estimado de 5%.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-slate-900 p-8 rounded-[40px] text-white flex flex-col justify-between aspect-square">
              <TrendingUp className="w-8 h-8 text-yellow-500 opacity-50" />
              <div>
                <p className="text-5xl font-bold mb-2">95%</p>
                <p className="text-slate-400 text-sm uppercase tracking-widest font-bold">Redução de Custos</p>
              </div>
            </div>
            <div className="bg-yellow-500 p-8 rounded-[40px] text-white flex flex-col justify-between aspect-square rotate-3">
              <Sun className="w-8 h-8 text-white opacity-50" />
              <div>
                <p className="text-5xl font-bold mb-2">4.2</p>
                <p className="text-white/80 text-sm uppercase tracking-widest font-bold">Anos de Payback</p>
              </div>
            </div>
            <div className="bg-white p-8 rounded-[40px] border-2 border-slate-100 flex flex-col justify-between aspect-square -rotate-2">
              <Shield className="w-8 h-8 text-yellow-500 opacity-50" />
              <div>
                <p className="text-5xl font-bold mb-2 text-slate-900">25</p>
                <p className="text-slate-500 text-sm uppercase tracking-widest font-bold">Anos de Garantia</p>
              </div>
            </div>
            <div className="bg-slate-50 p-8 rounded-[40px] border border-slate-200 flex flex-col justify-between aspect-square">
              <Zap className="w-8 h-8 text-yellow-600 opacity-50" />
              <div>
                <p className="text-4xl font-bold mb-2 text-slate-900">Tier-1</p>
                <p className="text-slate-500 text-sm uppercase tracking-widest font-bold">Tecnologia Global</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Investimento e Pagamento */}
      <section id="investimento" className="py-24 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Investimento Transparente</h2>
            <p className="text-slate-400">Sem taxas ocultas. Projeto chave na mão.</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-[40px] overflow-hidden">
            <div className="p-10 border-b border-white/10">
              <div className="flex justify-between items-center mb-8">
                <span className="text-xl font-bold">O que está incluso?</span>
                <span className="bg-yellow-500 text-white text-xs px-3 py-1 rounded-full font-bold uppercase">All-Inclusive</span>
              </div>
              <ul className="space-y-4">
                {[
                  "Equipamentos Tier-1 (R$ 12.950,00)",
                  "Projetos e Aprovação CEMIG (R$ 1.850,00)",
                  "Frete e Instalação Certificada",
                  "Monitoramento via App",
                  "Seguro Instalação (12 meses)"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-300">
                    <CheckCircle className="w-5 h-5 text-yellow-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-10 bg-white/10 flex flex-col items-center">
              <p className="text-slate-400 mb-2 uppercase tracking-widest text-xs font-bold">Total do Investimento</p>
              <p className="text-6xl font-bold mb-10">R$ 14.800</p>
              <div className="grid sm:grid-cols-2 gap-4 w-full">
                <button className="bg-yellow-500 text-white py-4 rounded-2xl font-bold hover:bg-yellow-600 transition-all">
                  Pagar à Vista (PIX)
                </button>
                <button className="bg-white text-slate-900 py-4 rounded-2xl font-bold hover:bg-slate-100 transition-all">
                  Simular Financiamento
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Garantias */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-4 gap-12 text-center">
          {[
            { label: "Painéis", value: "25 Anos", sub: "Garantia Performance" },
            { label: "Inversor", value: "10 Anos", sub: "Troca Fábrica" },
            { label: "Estrutura", value: "Vitalícia", sub: "Alumínio Anodizado" },
            { label: "Serviço", value: "12 Meses", sub: "Mão de Obra" },
          ].map((item, i) => (
            <div key={i}>
              <p className="text-slate-500 text-xs uppercase font-bold tracking-widest mb-2">{item.label}</p>
              <p className="text-3xl font-bold text-slate-900 mb-1">{item.value}</p>
              <p className="text-slate-400 text-sm">{item.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Processo em 6 Passos */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16">Seu Sistema Ativo em 6 Passos</h2>
          <div className="grid md:grid-cols-6 gap-8">
            {[
              { n: "01", t: "Contrato", d: "Assinatura digital rápida." },
              { n: "02", t: "Vistoria", d: "Técnico analisa o telhado." },
              { n: "03", t: "Projeto", d: "Engenharia cria o desenho." },
              { n: "04", t: "Concess", d: "Aprovação na CEMIG." },
              { n: "05", t: "Instala", d: "Montagem em 2 dias." },
              { n: "06", t: "Ativação", d: "Relógio trocado e gerando." },
            ].map((step, i) => (
              <div key={i} className="relative group">
                <p className="text-4xl font-bold text-slate-200 mb-4 group-hover:text-yellow-500 transition-colors">{step.n}</p>
                <h4 className="font-bold text-slate-900 mb-2">{step.t}</h4>
                <p className="text-slate-500 text-sm leading-relaxed">{step.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16">Dúvidas Frequentes</h2>
          <div className="space-y-4">
            {[
              { q: "O inversor de 5kW aguenta 7,5kWp de painéis?", a: "Sim! Isso se chama 'oversizing'. É uma técnica de engenharia para que seu sistema produza mais energia logo no início da manhã e no fim da tarde, além de compensar dias de baixa radiação." },
              { q: "A energia solar funciona em dias nublados?", a: "Sim, os painéis captam a radiação difusa. Embora a produção seja menor, o sistema continua gerando créditos para sua residência." },
              { q: "O que acontece se eu mudar de casa?", a: "O sistema valoriza o imóvel em até 15%, mas também pode ser transferido para o novo endereço se desejar." },
            ].map((item, i) => (
              <details key={i} className="group border border-slate-100 rounded-2xl">
                <summary className="list-none p-6 font-bold cursor-pointer flex items-center justify-between">
                  {item.q}
                  <ChevronDown className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="px-6 pb-6 text-slate-600 leading-relaxed">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section id="contato" className="py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-yellow-500 rounded-[40px] p-12 md:p-20 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 leading-[0.9]">
                COMECE A ECONOMIZAR <br />A PARTIR DE HOJE.
              </h2>
              <p className="text-white/80 text-xl mb-12 max-w-xl mx-auto">
                Consultoria técnica gratuita e personalizada. Fale diretamente com quem entende.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <button 
                  onClick={() => window.open(`https://wa.me/33999032281?text=Olá Marusan! Vi a landing page da JV Mendes Engenharia e quero prosseguir com meu sistema de ${clientData.systemSize}.`, '_blank')}
                  className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-3"
                >
                  <MessageCircle className="w-6 h-6" />
                  Agendar pelo WhatsApp
                </button>
                <div className="flex items-center justify-center gap-8">
                  <div className="text-white text-left">
                    <p className="text-white/60 text-xs uppercase font-bold tracking-widest mb-1">Telefone</p>
                    <p className="font-bold">(33) 99903-2281</p>
                  </div>
                  <div className="w-px h-10 bg-white/20" />
                  <div className="text-white text-left">
                    <p className="text-white/60 text-xs uppercase font-bold tracking-widest mb-1">Empresa</p>
                    <p className="font-bold">JV Mendes</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-100 italic">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8 text-slate-400 text-sm">
          <div className="flex items-center gap-2">
            <Sun className="w-4 h-4" />
            <span>JV Mendes Junior Engenharia © 2026</span>
          </div>
          <div className="flex gap-8">
            <a href="#" className="hover:text-slate-600 transition-colors">Termos</a>
            <a href="#" className="hover:text-slate-600 transition-colors">Privacidade</a>
            <a href="#" className="hover:text-slate-600 transition-colors">LGPD</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SolarLandingPage;
