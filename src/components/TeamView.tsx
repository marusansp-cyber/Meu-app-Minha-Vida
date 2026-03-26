import React from 'react';
import { ShieldCheck, UserCheck, Briefcase, Award, Building2, FileCheck } from 'lucide-react';

export const TeamView: React.FC = () => {
  const team = [
    {
      name: "Eng. José Vieira Mendes Junior",
      role: "Engenheiro Eletricista (CREA: 256019D MG)",
      description: "Responsável pelo projeto técnico, licenciamento na CEMIG e emissão de ART.",
      icon: Award
    },
    {
      name: "Marusan de Sousa Pinto",
      role: "Gerente de Projetos / Consultor de Negócios (CRECI 055252 MG)",
      description: "Responsável pela coordenação geral do cronograma, estruturação da viabilidade econômica e arquitetura dos contratos de locação.",
      avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=150"
    },
    {
      name: "João Rodrigo Tavares",
      role: "Gerente de Produção",
      description: "Especialista responsável pela execução e validação da montagem mecânica e elétrica.",
      icon: UserCheck
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-12 py-8">
      <section className="text-center space-y-4">
        <h2 className="text-4xl font-black tracking-tight text-slate-900 dark:text-slate-100">
          O Corpo Técnico e Consultivo
        </h2>
        <p className="text-lg text-slate-500 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
          A solidez deste investimento é assegurada por um corpo técnico qualificado e legalmente habilitado, 
          garantindo excelência desde o licenciamento até a rentabilidade comercial.
        </p>
      </section>

      <div className="grid gap-6">
        {team.map((member, index) => {
          const Icon = member.icon;
          return (
            <div 
              key={index}
              className="bg-white dark:bg-[#231d0f]/40 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row gap-6 items-start md:items-center"
            >
              <div className="size-16 rounded-2xl bg-[#fdb612]/10 flex items-center justify-center text-[#fdb612] shrink-0 overflow-hidden">
                {member.avatar ? (
                  <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  Icon && <Icon className="w-8 h-8" />
                )}
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{member.name}</h3>
                <p className="text-[#fdb612] font-bold text-sm uppercase tracking-wider">{member.role}</p>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{member.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      <section className="bg-slate-900 text-white p-10 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#fdb612]/10 blur-[100px] rounded-full -mr-32 -mt-32"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-[#fdb612]">
              <Building2 className="w-6 h-6" />
              <span className="font-bold uppercase tracking-widest text-sm">Informações Institucionais</span>
            </div>
            <h3 className="text-3xl font-black">MV ENGENHARIA</h3>
            <div className="space-y-1 text-slate-400">
              <p className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span className="font-medium text-slate-200">Nome Fantasia:</span> Vieira's Solar & Engenharia
              </p>
              <p className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-500" />
                <span className="font-medium text-slate-200">CNPJ:</span> 61.950.902/0018-33
              </p>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 text-center md:text-left">
            <p className="text-sm text-slate-400 mb-2">Certificação Técnica</p>
            <p className="text-xl font-bold text-[#fdb612]">Habilitado para Emissão de ART</p>
            <p className="text-xs text-slate-500 mt-2 italic">Conforme normas do CONFEA/CREA</p>
          </div>
        </div>
      </section>
    </div>
  );
};
