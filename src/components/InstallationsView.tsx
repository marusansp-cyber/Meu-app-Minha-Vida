import React from 'react';
import { 
  Rocket, 
  Plus, 
  Search, 
  Bell, 
  Settings, 
  Filter, 
  FileDown, 
  MoreVertical,
  Home,
  Factory,
  MapPin,
  Building2,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  CheckCircle2,
  Circle
} from 'lucide-react';
import { INSTALLATIONS } from '../constants';
import { cn } from '../lib/utils';

interface InstallationsViewProps {
  projects: any[];
  installations: any[];
  onOpenNewProject: () => void;
}

export const InstallationsView: React.FC<InstallationsViewProps> = ({ projects, installations: initialInstallations, onOpenNewProject }) => {
  const [activeTab, setActiveTab] = React.useState('all');
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [toast, setToast] = React.useState<string | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 2;

  const installations = initialInstallations.length > 0 ? initialInstallations : INSTALLATIONS;

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const tabs = [
    { id: 'all', label: 'Todos os Projetos' },
    { id: 'engineering', label: 'Engenharia' },
    { id: 'construction', label: 'Construção' },
    { id: 'inspection', label: 'Inspeção' },
  ];

  const filteredInstallations = React.useMemo(() => {
    return installations.filter(item => {
      if (activeTab === 'all') return true;
      if (activeTab === 'engineering') return item.stage.includes('Engineering') || item.stage.includes('Engenharia');
      if (activeTab === 'construction') return item.stage.includes('Installation') || item.stage.includes('Instalação') || item.stage.includes('Materials') || item.stage.includes('Materiais');
      if (activeTab === 'inspection') return item.stage.includes('Inspection') || item.stage.includes('Inspeção');
      return true;
    });
  }, [activeTab, installations]);

  const totalPages = Math.ceil(filteredInstallations.length / itemsPerPage);
  const paginatedInstallations = filteredInstallations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, filteredInstallations.length);

  return (
    <div className="space-y-8 relative">
      {toast && (
        <div className="fixed bottom-8 right-8 z-[200] bg-[#231d0f] text-white px-6 py-3 rounded-xl shadow-2xl border border-[#fdb612]/30 animate-in slide-in-from-right duration-300 flex items-center gap-3">
          <div className="size-2 bg-[#fdb612] rounded-full animate-pulse" />
          <span className="font-bold text-sm">{toast}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-[#fdb612] mb-2">
            <Rocket className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Gestão Pós-Venda</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-slate-100 mb-3 tracking-tight">Instalações Ativas</h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed">
            Monitore as etapas de instalação, atribuições de técnicos e progresso de implantação em tempo real.
          </p>
        </div>
        <button 
          onClick={onOpenNewProject}
          className="flex items-center justify-center gap-2 bg-[#fdb612] text-[#231d0f] px-6 py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-[#fdb612]/20 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>Criar Novo Projeto</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Ativo', value: '124', change: '+12%', color: 'green' },
          { label: 'Em Engenharia', value: '18', tag: 'Ocupado', color: 'yellow' },
          { label: 'Instalando Hoje', value: '42', tag: 'Normal', color: 'slate' },
          { label: 'Aguardando Inspeção', value: '7', tag: 'Prioridade', color: 'red' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-[#231d0f]/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{stat.label}</p>
            <div className="flex items-end justify-between">
              <h3 className="text-2xl font-bold">{stat.value}</h3>
              {stat.change ? (
                <span className="text-green-500 text-xs font-bold bg-green-500/10 px-2 py-1 rounded-full">{stat.change}</span>
              ) : (
                <span className={cn(
                  "text-xs font-bold px-2 py-1 rounded-full",
                  stat.color === 'yellow' && "text-[#fdb612] bg-[#fdb612]/10",
                  stat.color === 'slate' && "text-slate-500 bg-slate-500/10",
                  stat.color === 'red' && "text-red-500 bg-red-500/10"
                )}>{stat.tag}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex bg-slate-200/50 dark:bg-[#231d0f] p-1 rounded-xl w-full lg:w-auto">
          {tabs.map((tab) => (
            <button 
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setCurrentPage(1);
              }}
              className={cn(
                "flex-1 lg:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all",
                activeTab === tab.id 
                  ? "bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-slate-100" 
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex gap-3 w-full lg:w-auto">
          <button 
            onClick={() => showToast('Abrindo painel de filtros avançados...')}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-white dark:bg-[#231d0f] border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filtrar
          </button>
          <button 
            onClick={() => showToast('Exportando lista de projetos (CSV/PDF)...')}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-white dark:bg-[#231d0f] border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
          >
            <FileDown className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#231d0f]/40 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Detalhes do Projeto</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Etapa Atual</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Técnico</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 w-64">Progresso</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Última Atualização</th>
                <th className="px-6 py-4 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {paginatedInstallations.map((item) => (
                <React.Fragment key={item.id}>
                  <tr 
                    onClick={() => toggleExpand(item.id)}
                    className={cn(
                      "hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors group cursor-pointer",
                      expandedId === item.id && "bg-slate-50 dark:bg-slate-900/30"
                    )}
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="size-10 bg-[#fdb612]/10 rounded-lg flex items-center justify-center text-[#fdb612]">
                          {item.type === 'residence' && <Home className="w-5 h-5" />}
                          {item.type === 'industrial' && <Factory className="w-5 h-5" />}
                          {item.type === 'home' && <MapPin className="w-5 h-5" />}
                          {item.type === 'apartment' && <Building2 className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-900 dark:text-slate-100">{item.name}</p>
                            {expandedId === item.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                          </div>
                          <p className="text-xs text-slate-500">Project #{item.projectId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={cn(
                        "inline-flex items-center px-3 py-1 rounded-full text-xs font-bold",
                        item.stage.includes('Engineering') && "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
                        item.stage.includes('Materials') && "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
                        item.stage.includes('Installation') && "bg-[#fdb612]/20 text-slate-900 dark:text-slate-100",
                        item.stage.includes('Inspection') && "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                      )}>
                        {item.stage}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-slate-200 overflow-hidden">
                          <img 
                            src={item.technician.avatar} 
                            alt={item.technician.name} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <p className="text-sm font-medium">{item.technician.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-[#fdb612]" style={{ width: `${item.progress}%` }}></div>
                        </div>
                        <span className="text-sm font-bold w-10">{item.progress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-500">{item.lastUpdated}</td>
                    <td className="px-6 py-5 text-right">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          showToast('Opções do projeto...');
                        }}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-[#fdb612] transition-all"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                  {expandedId === item.id && (
                    <tr className="bg-slate-50/50 dark:bg-slate-900/20">
                      <td colSpan={6} className="px-6 py-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                          <div className="space-y-4">
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Cronograma</h4>
                            <div className="space-y-3">
                              <div className="flex items-center gap-3">
                                <Calendar className="w-4 h-4 text-indigo-500" />
                                <div>
                                  <p className="text-[10px] text-slate-500 uppercase font-bold">Data de Início</p>
                                  <p className="text-sm font-bold">{item.startDate || 'Não definida'}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <Clock className="w-4 h-4 text-amber-500" />
                                <div>
                                  <p className="text-[10px] text-slate-500 uppercase font-bold">Prazo Estimado</p>
                                  <p className="text-sm font-bold">{item.estimatedDeadline || 'Não definido'}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="md:col-span-2 space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Status das Etapas</h4>
                              <div className="flex gap-2">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    showToast('Retrocedendo etapa do projeto...');
                                  }}
                                  className="flex items-center gap-1 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-bold hover:bg-slate-200 transition-colors"
                                >
                                  <ChevronLeft className="w-3 h-3" />
                                  Anterior
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    showToast('Avançando projeto para próxima etapa...');
                                  }}
                                  className="flex items-center gap-1 px-3 py-1 bg-[#fdb612]/10 text-[#fdb612] rounded-lg text-[10px] font-bold hover:bg-[#fdb612]/20 transition-colors"
                                >
                                  Próximo
                                  <ChevronRight className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                              {(item.stages || []).map((stage, idx) => (
                                <div key={idx} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800">
                                  <div className="flex items-center gap-2 mb-2">
                                    {stage.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                                    {stage.status === 'in-progress' && <Clock className="w-4 h-4 text-amber-500 animate-pulse" />}
                                    {stage.status === 'pending' && <Circle className="w-4 h-4 text-slate-300" />}
                                    <span className="text-xs font-bold">{stage.name}</span>
                                  </div>
                                  <span className={cn(
                                    "text-[10px] font-black uppercase px-2 py-0.5 rounded-full",
                                    stage.status === 'completed' && "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30",
                                    stage.status === 'in-progress' && "bg-amber-100 text-amber-600 dark:bg-amber-900/30",
                                    stage.status === 'pending' && "bg-slate-100 text-slate-500 dark:bg-slate-800"
                                  )}>
                                    {stage.status === 'completed' ? 'Concluído' : stage.status === 'in-progress' ? 'Em Curso' : 'Pendente'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 gap-4">
          <p className="text-sm text-slate-500">Mostrando <span className="font-bold text-slate-900 dark:text-slate-100">{startItem} a {endItem}</span> de <span className="font-bold text-slate-900 dark:text-slate-100">{filteredInstallations.length}</span> projetos</p>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-bold disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Anterior
            </button>
            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-[#fdb612] text-[#231d0f] rounded-lg text-sm font-bold disabled:opacity-50 hover:bg-[#fdb612]/90 transition-colors shadow-sm"
            >
              Próximo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
