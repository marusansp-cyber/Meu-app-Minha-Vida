import React, { useState } from 'react';
import { X, HardHat, MapPin, Zap, Activity, User as UserIcon } from 'lucide-react';
import { Installation, InstallationStage } from '../types';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (installation: any) => void;
  installation?: Installation | null;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({ isOpen, onClose, onAdd, installation }) => {
  const [formData, setFormData] = React.useState({
    name: installation?.name || '',
    projectId: installation?.projectId || `SOL-${Math.floor(1000 + Math.random() * 9000)}`,
    type: (installation?.type || 'residence') as Installation['type'],
    technicianName: installation?.technician.name || '',
    address: installation?.address || '',
    startDate: installation?.startDate || '',
    estimatedDeadline: installation?.estimatedDeadline || '',
    projectDeadline: (installation?.projectDeadline || '') as string | null,
    stages: installation?.stages || [
      { name: 'Engenharia', status: 'in-progress' as const, progress: 0, assignedTechnician: '' },
      { name: 'Materiais', status: 'pending' as const, progress: 0, assignedTechnician: '' },
      { name: 'Instalação', status: 'pending' as const, progress: 0, assignedTechnician: '' },
      { name: 'Inspeção', status: 'pending' as const, progress: 0, assignedTechnician: '' },
    ]
  });

  React.useEffect(() => {
    if (installation) {
      setFormData({
        name: installation.name || '',
        projectId: installation.projectId || '',
        type: installation.type || 'residence',
        technicianName: installation.technician?.name || '',
        address: installation.address || '',
        startDate: installation.startDate || '',
        estimatedDeadline: installation.estimatedDeadline || '',
        projectDeadline: installation.projectDeadline || '',
        stages: installation.stages || []
      });
    }
  }, [installation]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const totalProgress = formData.stages.reduce((acc, stage) => acc + (stage.progress || 0), 0) / formData.stages.length;

    const newInstallation = {
      ...(installation || {}),
      name: formData.name,
      projectId: formData.projectId,
      stage: formData.stages.find(s => s.status === 'in-progress')?.name || (formData.stages.every(s => s.status === 'completed') ? 'Concluído' : 'Aprovação de Engenharia'),
      technician: {
        name: formData.technicianName || 'Técnico não atribuído',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.technicianName || 'T')}&background=fdb612&color=231d0f`,
      },
      progress: Math.round(totalProgress),
      lastUpdated: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
      type: formData.type,
      startDate: formData.startDate,
      estimatedDeadline: formData.estimatedDeadline,
      projectDeadline: formData.projectDeadline,
      address: formData.address,
      stages: formData.stages,
    };

    onAdd(newInstallation);
    onClose();
    setFormData({ 
      name: '', 
      projectId: `SOL-${Math.floor(1000 + Math.random() * 9000)}`, 
      type: 'residence',
      technicianName: '',
      address: '',
      startDate: '',
      estimatedDeadline: '',
      projectDeadline: '',
      stages: [
        { name: 'Engenharia', status: 'in-progress', progress: 0, assignedTechnician: '' },
        { name: 'Materiais', status: 'pending', progress: 0, assignedTechnician: '' },
        { name: 'Instalação', status: 'pending', progress: 0, assignedTechnician: '' },
        { name: 'Inspeção', status: 'pending', progress: 0, assignedTechnician: '' },
      ]
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#1a160d] w-full max-w-md rounded-2xl shadow-2xl border border-[#fdb612]/20 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-[#fdb612]/10 flex items-center justify-center">
              <HardHat className="w-5 h-5 text-[#fdb612]" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-display">Novo Projeto de Instalação</h3>
              <p className="text-xs text-slate-500">Inicie o acompanhamento pós-venda</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="space-y-2">
            <label className="text-sm font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Activity className="w-4 h-4 text-[#fdb612]" />
              Nome do Cliente / Projeto
            </label>
            <input
              required
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Residência - João Silva"
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 focus:ring-2 focus:ring-[#fdb612] outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Tipo</label>
              <select
                value={formData.type || 'residence'}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as Installation['type'] })}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 focus:ring-2 focus:ring-[#fdb612] outline-none transition-all"
              >
                <option value="residence">Residencial</option>
                <option value="industrial">Industrial</option>
                <option value="home">Casa</option>
                <option value="apartment">Apartamento</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">ID do Projeto</label>
              <input
                required
                type="text"
                value={formData.projectId || ''}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 focus:ring-2 focus:ring-[#fdb612] outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <UserIcon className="w-4 h-4 text-[#fdb612]" />
              Técnico Responsável
            </label>
            <input
              type="text"
              value={formData.technicianName || ''}
              onChange={(e) => setFormData({ ...formData, technicianName: e.target.value })}
              placeholder="Nome do técnico"
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 focus:ring-2 focus:ring-[#fdb612] outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <MapPin className="w-4 h-4 text-[#fdb612]" />
              Endereço da Instalação
            </label>
            <input
              type="text"
              value={formData.address || ''}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Rua, Número, Bairro, Cidade - UF"
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 focus:ring-2 focus:ring-[#fdb612] outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Data de Início</label>
              <input
                type="date"
                value={formData.startDate || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  startDate: e.target.value,
                  projectDeadline: e.target.value // Update projectDeadline accordingly
                })}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 focus:ring-2 focus:ring-[#fdb612] outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Prazo Estimado</label>
              <input
                type="date"
                value={formData.estimatedDeadline || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  estimatedDeadline: e.target.value,
                  projectDeadline: e.target.value // Update projectDeadline accordingly
                })}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 focus:ring-2 focus:ring-[#fdb612] outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Prazo Final do Projeto</label>
            <input
              type="date"
              value={formData.projectDeadline || ''}
              onChange={(e) => setFormData({ ...formData, projectDeadline: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 focus:ring-2 focus:ring-[#fdb612] outline-none transition-all"
            />
          </div>

          <div className="space-y-4 pt-4">
            <h4 className="text-sm font-black uppercase tracking-widest text-slate-400">Configuração de Etapas</h4>
            {formData.stages.map((stage, idx) => (
              <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">{stage.name}</span>
                  <select
                    value={stage.status || 'pending'}
                    onChange={(e) => {
                      const newStages = [...formData.stages];
                      newStages[idx].status = e.target.value as any;
                      setFormData({ ...formData, stages: newStages });
                    }}
                    className="text-[10px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1"
                  >
                    <option value="pending">Pendente</option>
                    <option value="in-progress">Em Curso</option>
                    <option value="completed">Concluído</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Técnico</label>
                    <input
                      type="text"
                      value={stage.assignedTechnician || ''}
                      onChange={(e) => {
                        const newStages = [...formData.stages];
                        newStages[idx].assignedTechnician = e.target.value;
                        setFormData({ ...formData, stages: newStages });
                      }}
                      placeholder="Nome do técnico"
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-2 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Progresso (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={stage.progress || 0}
                      onChange={(e) => {
                        const newStages = [...formData.stages];
                        newStages[idx].progress = parseInt(e.target.value) || 0;
                        setFormData({ ...formData, stages: newStages });
                      }}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-2 text-xs"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-800 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-[#fdb612] text-[#231d0f] font-bold hover:shadow-lg hover:shadow-[#fdb612]/20 transition-all"
            >
              Iniciar Instalação
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
