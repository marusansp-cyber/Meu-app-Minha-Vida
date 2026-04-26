import React from 'react';
import { ShieldCheck, UserCheck, Briefcase, Award, Building2, FileCheck, Mail, MessageCircle } from 'lucide-react';

export const TeamView: React.FC = () => {
  const team = [
    {
      name: "Eng. José Vieira Mendes Junior",
      role: "Engenheiro Eletricista (CREA: 256019D MG)",
      description: "Responsável pelo projeto técnico, licenciamento na CEMIG e emissão de ART.",
      email: "marusanspc@gmail.com",
      whatsapp: "5533998167100",
      icon: Award
    },
    {
      name: "Marusan de Sousa Pinto",
      role: "Gerente de Projetos / Consultor de Negócios (CRECI 055252 MG)",
      description: "Responsável pela coordenação geral do cronograma, estruturação da viabilidade econômica e arquitetura dos contratos de locação.",
      email: "marusansp@gmail.com",
      whatsapp: "5533999032281",
      icon: Briefcase
    },
    {
      name: "João Rodrigo Tavares",
      role: "Gerente de Produção",
      description: "Especialista responsável pela execução e validação da montagem mecânica e elétrica.",
      email: "marusanspc@gmail.com",
      whatsapp: "5533999329497",
      icon: UserCheck
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-16 py-12 px-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <section className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-primary/5 text-brand-primary rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4 border border-brand-primary/10">
          <ShieldCheck className="w-3.5 h-3.5 mt-[-1px]" />
          Board Consultivo
        </div>
        <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-brand-primary dark:text-slate-100 uppercase">
          Excelência Técnica <span className="text-brand-secondary">&</span> Operacional
        </h2>
        <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium tracking-tight">
          A solidez de Vieira's Solar é assegurada por um corpo técnico qualificado e legalmente habilitado para grandes infraestruturas.
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {team.map((member, index) => {
          const Icon = member.icon;
          return (
            <div 
              key={index}
              className="group relative bg-white dark:bg-white/5 border border-slate-100 dark:border-slate-800 p-8 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:shadow-brand-primary/10 transition-all duration-500 flex flex-col justify-between overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-brand-primary/10 transition-colors" />
              
              <div className="space-y-6 relative z-10">
                <div className="size-16 rounded-3xl bg-brand-primary text-white flex items-center justify-center shadow-xl shadow-brand-primary/20 group-hover:bg-brand-secondary group-hover:text-brand-primary group-hover:scale-110 transition-all">
                  {Icon && <Icon className="w-8 h-8" />}
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-xl font-black text-brand-primary dark:text-slate-100 leading-tight uppercase tracking-tight">{member.name}</h3>
                  <div className="inline-block px-3 py-1 bg-brand-secondary/10 text-brand-primary rounded-lg text-[10px] font-black uppercase tracking-wider">
                    {member.role}
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium pt-2 tracking-tight">
                    {member.description}
                  </p>
                </div>
              </div>

              {(member.email || member.whatsapp) && (
                <div className="flex flex-col gap-2 pt-8 mt-auto relative z-10">
                  {member.email && (
                    <a 
                      href={`mailto:${member.email}`}
                      className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span>E-mail Corporativo</span>
                      </div>
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                    </a>
                  )}
                  {member.whatsapp && (
                    <a 
                      href={`https://wa.me/${member.whatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between px-4 py-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4" />
                        <span>WhatsApp Direto</span>
                      </div>
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <section className="bg-brand-primary text-white p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-secondary/10 blur-[100px] rounded-full -mr-48 -mt-48 animate-pulse"></div>
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-12">
          <div className="space-y-6 flex-1">
            <div className="flex items-center gap-3 text-brand-secondary">
              <div className="size-10 bg-white/10 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="font-black uppercase tracking-[0.2em] text-xs">Informações Institucionais</span>
            </div>
            <div className="space-y-2">
              <h3 className="text-4xl font-black uppercase tracking-tight">Vieira's Solar</h3>
              <p className="text-lg text-white/60 font-medium tracking-tight">MV ENGENHARIA E CONSTRUCOES LTDA</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <div className="bg-white/5 border border-white/10 p-5 rounded-3xl">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">CNPJ Matriz</p>
                <p className="text-sm font-bold text-slate-200">61.950.902/0018-33</p>
              </div>
              <div className="bg-white/5 border border-white/10 p-5 rounded-3xl">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Certificação Técnica</p>
                <p className="text-sm font-bold text-emerald-400">Emissor de ART / CREA-MG</p>
              </div>
            </div>
          </div>
          <div className="lg:w-80 w-full bg-brand-secondary text-brand-primary p-10 rounded-[3rem] flex flex-col items-center text-center gap-6 shadow-xl shadow-brand-secondary/20 group-hover:scale-105 transition-all duration-500">
            <div className="size-20 bg-brand-primary/10 rounded-3xl flex items-center justify-center">
              <ShieldCheck className="w-12 h-12" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Garantia Técnica</p>
              <p className="text-2xl font-black uppercase leading-tight tracking-tighter">Projetos 100% Homologados</p>
            </div>
            <p className="text-xs font-bold opacity-70 leading-relaxed italic px-4">
              "Segurança jurídica e técnica em todas as etapas da sua usina solar."
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
