import React, { useState } from 'react';
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
  Circle,
  X,
  Camera,
  FileText,
  Image as ImageIcon,
  Trash2,
  Download,
  User as UserIcon,
  ArrowUpDown
} from 'lucide-react';
import { INSTALLATIONS } from '../constants';
import { cn } from '../lib/utils';
import { Installation, InstallationStage } from '../types';
import { MapView } from './MapView';
import { generateInstallationReportPDF } from '../services/pdfService';

interface StageReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  stage: InstallationStage;
  onSave: (notes: string, photos: string[]) => void;
}

const StageReportModal: React.FC<StageReportModalProps> = ({ isOpen, onClose, stage, onSave }) => {
  const [notes, setNotes] = useState(stage.notes || (stage.name === 'Instalação' ? 'Verificar conexão dos painéis.' : ''));
  const [photos, setPhotos] = useState<string[]>(stage.photos || []);

  React.useEffect(() => {
    setNotes(stage.notes || (stage.name === 'Instalação' ? 'Verificar conexão dos painéis.' : ''));
    setPhotos(stage.photos || []);
  }, [stage]);

  if (!isOpen) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            setPhotos(prev => [...prev, reader.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#1a160d] w-full max-w-2xl rounded-2xl shadow-2xl border border-[#fdb612]/20 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-[#fdb612]/10 flex items-center justify-center">
              <Camera className="w-5 h-5 text-[#fdb612]" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-display">Relatório da Etapa</h3>
              <p className="text-xs text-slate-500">{stage.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          <div className="space-y-2">
            <label className="text-sm font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <FileText className="w-4 h-4 text-[#fdb612]" />
              Notas Técnicas / Observações
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Descreva o que foi realizado nesta etapa, dificuldades encontradas ou observações importantes..."
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 min-h-[150px] focus:ring-2 focus:ring-[#fdb612] outline-none transition-all resize-none"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <ImageIcon className="w-4 h-4 text-[#fdb612]" />
                Evidências Fotográficas
              </label>
              <label className="cursor-pointer px-4 py-2 bg-[#fdb612]/10 text-[#fdb612] rounded-lg text-xs font-bold hover:bg-[#fdb612]/20 transition-colors flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Adicionar Fotos
                <input type="file" multiple accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </label>
            </div>

            {photos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {photos.map((photo, idx) => (
                  <div key={idx} className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                    <img 
                      src={photo} 
                      alt={`Evidência ${idx + 1}`} 
                      className="w-full h-full object-cover" 
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      onClick={() => removePhoto(idx)}
                      className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400">
                <ImageIcon className="w-12 h-12 mb-2 opacity-20" />
                <p className="text-sm">Nenhuma foto adicionada ainda</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-800 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSave(notes, photos)}
            className="flex-1 py-3 rounded-xl bg-[#fdb612] text-[#231d0f] font-bold hover:shadow-lg hover:shadow-[#fdb612]/20 transition-all"
          >
            Salvar Relatório
          </button>
        </div>
      </div>
    </div>
  );
};

interface InstallationsViewProps {
  installations: Installation[];
  onOpenNewProject: () => void;
  onEditProject: (installation: Installation) => void;
  onUpdateInstallation: (id: string, data: any) => Promise<void>;
  onDeleteInstallation: (id: string) => Promise<void>;
}

export const InstallationsView: React.FC<InstallationsViewProps> = ({ 
  installations, 
  onOpenNewProject,
  onEditProject,
  onUpdateInstallation,
  onDeleteInstallation
}) => {
  const [activeTab, setActiveTab] = React.useState('all');
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [toast, setToast] = React.useState<string | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [projectDeadlineFilter, setProjectDeadlineFilter] = React.useState<string | null>(null);
  const [technicianFilter, setTechnicianFilter] = React.useState<string>('all');
  const [stageFilter, setStageFilter] = React.useState<string>('all');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc');
  const [reportModal, setReportModal] = useState<{ isOpen: boolean; stageIndex: number | null; installationId: string | null }>({
    isOpen: false,
    stageIndex: null,
    installationId: null
  });
  const itemsPerPage = 5;

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleUpdateStage = async (id: string, direction: 'next' | 'prev') => {
    const item = installations.find(i => i.id === id);
    if (!item || !item.stages) return;

    const stages = [...item.stages];
    const currentIdx = stages.findIndex(s => s.status === 'in-progress');
    
    if (direction === 'next') {
      if (currentIdx !== -1) {
        // Validation: Ensure notes and photos are present before completing
        const currentStage = stages[currentIdx];
        if (!currentStage.notes || !currentStage.photos || currentStage.photos.length === 0) {
          showToast(`⚠️ Por favor, adicione notas e fotos ao relatório da etapa "${currentStage.name}" antes de prosseguir.`);
          setReportModal({ isOpen: true, stageIndex: currentIdx, installationId: id });
          return;
        }

        stages[currentIdx].status = 'completed';
        stages[currentIdx].progress = 100;
        if (currentIdx < stages.length - 1) {
          stages[currentIdx + 1].status = 'in-progress';
          stages[currentIdx + 1].progress = 10; // Start with 10% when starting a new stage
        }
      } else {
        const firstPending = stages.findIndex(s => s.status === 'pending');
        if (firstPending !== -1) {
          stages[firstPending].status = 'in-progress';
          stages[firstPending].progress = 10;
        }
      }
    } else {
      if (currentIdx !== -1) {
        stages[currentIdx].status = 'pending';
        stages[currentIdx].progress = 0;
        if (currentIdx > 0) {
          stages[currentIdx - 1].status = 'in-progress';
          stages[currentIdx - 1].progress = 50;
        }
      } else {
        const lastCompleted = stages.map(s => s.status).lastIndexOf('completed');
        if (lastCompleted !== -1) {
          stages[lastCompleted].status = 'in-progress';
          stages[lastCompleted].progress = 50;
        }
      }
    }

    const totalProgress = stages.reduce((acc, s) => acc + (s.progress || 0), 0) / stages.length;
    const progress = Math.round(totalProgress);
    const completedCount = stages.filter(s => s.status === 'completed').length;

    let stageName = item.stage;
    const activeStage = stages.find(s => s.status === 'in-progress');
    if (activeStage) {
      stageName = activeStage.name;
    } else if (completedCount === stages.length) {
      stageName = 'Concluído';
    }

    try {
      await onUpdateInstallation(id, {
        stages,
        progress,
        stage: stageName,
        lastUpdated: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
      });
      showToast('Status do projeto atualizado com sucesso!');
    } catch (error) {
      showToast('Erro ao atualizar status do projeto.');
    }
  };

  const handleSaveStageReport = async (notes: string, photos: string[]) => {
    if (reportModal.installationId === null || reportModal.stageIndex === null) return;

    const item = installations.find(i => i.id === reportModal.installationId);
    if (!item || !item.stages) return;

    const stages = [...item.stages];
    stages[reportModal.stageIndex] = {
      ...stages[reportModal.stageIndex],
      notes,
      photos
    };

    try {
      await onUpdateInstallation(reportModal.installationId, {
        stages,
        lastUpdated: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
      });
      showToast('Relatório da etapa salvo com sucesso!');
      setReportModal({ isOpen: false, stageIndex: null, installationId: null });
    } catch (error) {
      showToast('Erro ao salvar relatório da etapa.');
    }
  };

  const generateFullReport = async (installation: Installation) => {
    try {
      showToast('Gerando relatório técnico completo...');
      const pdfDataUri = await generateInstallationReportPDF(installation);
      const link = document.createElement('a');
      link.href = pdfDataUri;
      link.download = `Relatorio_Instalacao_${installation.name.replace(/\s+/g, '_')}.pdf`;
      link.click();
      showToast('Relatório gerado com sucesso!');
    } catch (error) {
      console.error('Error generating report:', error);
      showToast('Erro ao gerar relatório técnico.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta instalação?')) {
      try {
        await onDeleteInstallation(id);
        showToast('Instalação excluída com sucesso.');
      } catch (error) {
        showToast('Erro ao excluir instalação.');
      }
    }
  };

  const tabs = [
    { id: 'all', label: 'Todos os Projetos' },
    { id: 'engineering', label: 'Engenharia' },
    { id: 'construction', label: 'Construção' },
    { id: 'inspection', label: 'Inspeção' },
  ];

  const filteredInstallations = React.useMemo(() => {
    let result = installations.filter(item => {
      // Stage Filter (Dropdown + Tab)
      const matchesStage = stageFilter === 'all' || item.stage === stageFilter;
      const matchesTab = activeTab === 'all' || 
        (activeTab === 'engineering' && (item.stage.includes('Engineering') || item.stage.includes('Engenharia'))) ||
        (activeTab === 'construction' && (item.stage.includes('Installation') || item.stage.includes('Instalação') || item.stage.includes('Materials') || item.stage.includes('Materiais'))) ||
        (activeTab === 'inspection' && (item.stage.includes('Inspection') || item.stage.includes('Inspeção')));

      // Deadline Filter
      const matchesDeadline = !projectDeadlineFilter || item.projectDeadline === projectDeadlineFilter;

      // Technician Filter
      const matchesTechnician = technicianFilter === 'all' || item.technician.name === technicianFilter;

      return matchesStage && matchesTab && matchesDeadline && matchesTechnician;
    });

    // Sorting by lastUpdated
    result.sort((a, b) => {
      const parseDate = (dateStr: string) => {
        const months: Record<string, number> = {
          'jan': 0, 'fev': 1, 'mar': 2, 'abr': 3, 'mai': 4, 'jun': 5,
          'jul': 6, 'ago': 7, 'set': 8, 'out': 9, 'nov': 10, 'dez': 11
        };
        const parts = dateStr.replace('.', '').split(' de ');
        if (parts.length === 3) {
          return new Date(parseInt(parts[2]), months[parts[1].toLowerCase()] || 0, parseInt(parts[0]));
        }
        return new Date(0);
      };

      const dateA = parseDate(a.lastUpdated).getTime();
      const dateB = parseDate(b.lastUpdated).getTime();

      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    return result;
  }, [activeTab, installations, projectDeadlineFilter, technicianFilter, sortOrder]);

  const technicians = React.useMemo(() => {
    const names = new Set(installations.map(i => i.technician.name));
    return Array.from(names);
  }, [installations]);

  const allStages = React.useMemo(() => {
    const stages = new Set(installations.map(i => i.stage));
    return Array.from(stages);
  }, [installations]);

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
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative group w-full sm:w-auto">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Calendar className="w-5 h-5 text-slate-400 group-focus-within:text-[#fdb612] transition-colors" />
            </div>
            <input 
              type="date" 
              value={projectDeadlineFilter || ''}
              onChange={(e) => setProjectDeadlineFilter(e.target.value || null)}
              className="w-full sm:w-48 pl-12 pr-4 py-3 bg-white dark:bg-[#1a160d] border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold outline-none focus:border-[#fdb612] focus:ring-2 focus:ring-[#fdb612]/10 transition-all shadow-sm"
            />
            <div className="absolute -top-2 left-4 px-2 bg-white dark:bg-[#1a160d] text-[10px] font-black uppercase tracking-widest text-slate-400">
              Filtrar Prazo
            </div>
          </div>
          <button 
            onClick={onOpenNewProject}
            className="flex items-center justify-center gap-2 bg-[#fdb612] text-[#231d0f] px-6 py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-[#fdb612]/20 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span>Criar Novo Projeto</span>
          </button>
        </div>
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
        <div className="flex flex-wrap gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-2 bg-white dark:bg-[#231d0f] border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl">
            <Filter className="w-4 h-4 text-[#fdb612]" />
            <select 
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="bg-transparent border-none text-sm font-bold focus:ring-0 outline-none cursor-pointer"
            >
              <option value="all">Todas as Etapas</option>
              {allStages.map(stage => (
                <option key={stage} value={stage}>{stage}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-[#231d0f] border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl">
            <UserIcon className="w-4 h-4 text-[#fdb612]" />
            <select 
              value={technicianFilter}
              onChange={(e) => setTechnicianFilter(e.target.value)}
              className="bg-transparent border-none text-sm font-bold focus:ring-0 outline-none cursor-pointer"
            >
              <option value="all">Todos Técnicos</option>
              {technicians.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="flex items-center gap-2 bg-white dark:bg-[#231d0f] border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
            title="Ordenar por data de atualização"
          >
            <ArrowUpDown className="w-4 h-4 text-[#fdb612]" />
            {sortOrder === 'asc' ? 'Antigos' : 'Recentes'}
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
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-900 dark:text-slate-100">{item.name}</p>
                          {expandedId === item.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#fdb612]">
                          Prazo: {item.projectDeadline ? new Date(item.projectDeadline).toLocaleDateString('pt-BR') : 'Sem prazo'}
                        </p>
                        <p className="text-xs text-slate-500">Project #{item.projectId}</p>
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
                            loading="lazy"
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
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditProject(item);
                          }}
                          className="p-2 text-slate-400 hover:text-[#fdb612] transition-all rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Editar Projeto"
                        >
                          <FileText className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(item.id);
                          }}
                          className="p-2 text-slate-400 hover:text-rose-500 transition-all rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/10"
                          title="Excluir Instalação"
                        >
                          <X className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            showToast('Opções do projeto...');
                          }}
                          className="p-2 text-slate-400 hover:text-[#fdb612] transition-all rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </div>
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
                                    handleUpdateStage(item.id, 'prev');
                                  }}
                                  className="flex items-center gap-1 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-bold hover:bg-slate-200 transition-colors"
                                >
                                  <ChevronLeft className="w-3 h-3" />
                                  Anterior
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateStage(item.id, 'next');
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
                                <div key={idx} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between gap-3">
                                  <div>
                                    <div className="flex items-center gap-2 mb-2">
                                      {stage.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                                      {stage.status === 'in-progress' && <Clock className="w-4 h-4 text-amber-500 animate-pulse" />}
                                      {stage.status === 'pending' && <Circle className="w-4 h-4 text-slate-300" />}
                                      <span className="text-xs font-bold">{stage.name}</span>
                                    </div>
                                    <div className="mb-2">
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase">Progresso</span>
                                        <span className="text-[10px] font-bold text-[#fdb612]">{stage.progress || 0}%</span>
                                      </div>
                                      <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div 
                                          className="h-full bg-[#fdb612] transition-all duration-500" 
                                          style={{ width: `${stage.progress || 0}%` }}
                                        />
                                      </div>
                                    </div>
                                    <div className="mb-3 flex items-center gap-2" title={stage.assignedTechnician ? `Técnico: ${stage.assignedTechnician}` : 'Não atribuído'}>
                                      <div className="size-5 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                                        {stage.assignedTechnician ? (
                                          <img 
                                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(stage.assignedTechnician)}&background=fdb612&color=231d0f`} 
                                            alt={stage.assignedTechnician}
                                            className="w-full h-full object-cover"
                                            referrerPolicy="no-referrer"
                                            loading="lazy"
                                          />
                                        ) : (
                                          <UserIcon className="w-3 h-3 text-slate-400" />
                                        )}
                                      </div>
                                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 truncate">
                                        {stage.assignedTechnician || 'Não atribuído'}
                                      </span>
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
                                  
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setReportModal({ isOpen: true, stageIndex: idx, installationId: item.id });
                                    }}
                                    className={cn(
                                      "w-full py-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-2 transition-colors",
                                      (stage.notes || (stage.photos && stage.photos.length > 0)) 
                                        ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20" 
                                        : "bg-slate-50 text-slate-400 dark:bg-slate-900 hover:bg-slate-100"
                                    )}
                                  >
                                    <Camera className="w-3 h-3" />
                                    { (stage.notes || (stage.photos && stage.photos.length > 0)) ? 'Ver Relatório' : 'Add Relatório' }
                                  </button>
                                </div>
                              ))}
                            </div>
                            <div className="pt-4 flex justify-end">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  generateFullReport(item);
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity"
                              >
                                <Download className="w-4 h-4" />
                                Gerar Relatório Técnico Completo (PDF)
                              </button>
                            </div>
                          </div>
                        </div>

                        {item.address && (
                          <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800">
                            <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">Localização da Instalação</h4>
                            <div className="h-[300px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner">
                              <MapView address={item.address} />
                            </div>
                          </div>
                        )}

                        {/* Project Tasks Section */}
                        <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-black uppercase tracking-widest text-slate-400">Tarefas do Projeto</h4>
                            <span className="text-[10px] font-bold text-slate-500">
                              {item.tasks?.filter(t => t.completed).length || 0} de {item.tasks?.length || 0} concluídas
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="space-y-3">
                              <div className="flex gap-2">
                                <input 
                                  type="text"
                                  placeholder="Nova tarefa..."
                                  className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm outline-none focus:border-[#fdb612] transition-all"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      const input = e.currentTarget;
                                      if (input.value?.trim()) {
                                        const newTask = {
                                          id: Math.random().toString(36).substr(2, 9),
                                          title: input.value.trim(),
                                          completed: false,
                                          createdAt: new Date().toISOString()
                                        };
                                        onUpdateInstallation(item.id, {
                                          tasks: [...(item.tasks || []), newTask]
                                        });
                                        input.value = '';
                                        showToast('Tarefa adicionada!');
                                      }
                                    }
                                  }}
                                />
                                <button 
                                  onClick={(e) => {
                                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                    if (input?.value?.trim()) {
                                      const newTask = {
                                        id: Math.random().toString(36).substr(2, 9),
                                        title: input.value.trim(),
                                        completed: false,
                                        createdAt: new Date().toISOString()
                                      };
                                      onUpdateInstallation(item.id, {
                                        tasks: [...(item.tasks || []), newTask]
                                      });
                                      input.value = '';
                                      showToast('Tarefa adicionada!');
                                    }
                                  }}
                                  className="bg-[#fdb612] text-[#231d0f] p-2 rounded-xl hover:opacity-90 transition-opacity"
                                >
                                  <Plus className="w-5 h-5" />
                                </button>
                              </div>

                              <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                                {item.tasks && item.tasks.length > 0 ? (
                                  item.tasks.map((task) => (
                                    <div 
                                      key={task.id}
                                      className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 group"
                                    >
                                      <div className="flex items-center gap-3">
                                        <button 
                                          onClick={() => {
                                            const newTasks = item.tasks?.map(t => 
                                              t.id === task.id ? { ...t, completed: !t.completed } : t
                                            );
                                            onUpdateInstallation(item.id, { tasks: newTasks });
                                          }}
                                          className={cn(
                                            "size-5 rounded-md border flex items-center justify-center transition-all",
                                            task.completed 
                                              ? "bg-emerald-500 border-emerald-500 text-white" 
                                              : "border-slate-300 dark:border-slate-600 hover:border-[#fdb612]"
                                          )}
                                        >
                                          {task.completed && <CheckCircle2 className="w-3.5 h-3.5" />}
                                        </button>
                                        <span className={cn(
                                          "text-sm font-medium transition-all",
                                          task.completed ? "text-slate-400 line-through" : "text-slate-700 dark:text-slate-200"
                                        )}>
                                          {task.title}
                                        </span>
                                      </div>
                                      <button 
                                        onClick={() => {
                                          const newTasks = item.tasks?.filter(t => t.id !== task.id);
                                          onUpdateInstallation(item.id, { tasks: newTasks });
                                          showToast('Tarefa removida');
                                        }}
                                        className="p-1.5 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ))
                                ) : (
                                  <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                                    <p className="text-xs">Nenhuma tarefa adicionada</p>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="bg-slate-50 dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                              <h5 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Resumo da Obra</h5>
                              <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-slate-500">Etapas Concluídas</span>
                                  <span className="text-sm font-bold">{item.stages?.filter(s => s.status === 'completed').length || 0} / {item.stages?.length || 0}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-slate-500">Tarefas Pendentes</span>
                                  <span className="text-sm font-bold">{item.tasks?.filter(t => !t.completed).length || 0}</span>
                                </div>
                                <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-bold">Saúde do Projeto</span>
                                    <span className="text-sm font-bold text-emerald-500">Excelente</span>
                                  </div>
                                  <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 w-[92%]"></div>
                                  </div>
                                </div>
                              </div>
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

        {reportModal.isOpen && reportModal.installationId && reportModal.stageIndex !== null && (
          <StageReportModal
            isOpen={reportModal.isOpen}
            onClose={() => setReportModal({ isOpen: false, stageIndex: null, installationId: null })}
            stage={installations.find(i => i.id === reportModal.installationId)?.stages?.[reportModal.stageIndex]!}
            onSave={handleSaveStageReport}
          />
        )}
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
