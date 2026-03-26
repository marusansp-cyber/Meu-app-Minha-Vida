import React, { useState } from 'react';
import { X, HardHat, MapPin, Zap, Activity } from 'lucide-react';
import { Project } from '../types';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (project: Project) => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    capacity: '',
    status: 'planning' as Project['status'],
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newProject: Project = {
      id: Math.random().toString(36).substr(2, 9),
      ...formData,
      completion: 0,
    };
    onAdd(newProject);
    onClose();
    setFormData({ name: '', location: '', capacity: '', status: 'planning' });
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
              <h3 className="text-xl font-bold font-display">Novo Projeto</h3>
              <p className="text-xs text-slate-500">Adicione um novo canteiro de obras</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#fdb612]" />
              Nome do Projeto
            </label>
            <input
              required
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Edifício Solar"
              className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl p-3 focus:ring-2 focus:ring-[#fdb612] outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#fdb612]" />
              Localização
            </label>
            <input
              required
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Ex: Centro, São Paulo"
              className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl p-3 focus:ring-2 focus:ring-[#fdb612] outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#fdb612]" />
              Capacidade (kW)
            </label>
            <input
              required
              type="text"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              placeholder="Ex: 120 kW"
              className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl p-3 focus:ring-2 focus:ring-[#fdb612] outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold">Status Inicial</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as Project['status'] })}
              className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl p-3 focus:ring-2 focus:ring-[#fdb612] outline-none transition-all"
            >
              <option value="planning">Planejamento</option>
              <option value="on-track">No Prazo</option>
              <option value="delayed">Atrasado</option>
            </select>
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
              Adicionar Projeto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
