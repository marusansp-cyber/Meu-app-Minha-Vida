import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Circle, Save } from 'lucide-react';
import { Installation } from '../types';
import { updateDocument } from '../firestoreUtils';

interface InstallationsChecklistModalProps {
  installation: Installation;
  onClose: () => void;
  onUpdate: (updatedInstallation: Installation) => void;
}

const DEFAULT_STEPS = [
  'Vistoria técnica',
  'Homologação CEMIG',
  'Instalação estrutura',
  'Instalação módulos',
  'Comissionamento'
];

export const InstallationsChecklistModal: React.FC<InstallationsChecklistModalProps> = ({ 
  installation, 
  onClose,
  onUpdate
}) => {
  const [checklist, setChecklist] = useState<{id: string, step: string, completed: boolean, note: string}[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (installation.checklist && installation.checklist.length > 0) {
      setChecklist(installation.checklist);
    } else {
      setChecklist(DEFAULT_STEPS.map((step, idx) => ({
        id: `step-${idx}`,
        step,
        completed: false,
        note: ''
      })));
    }
  }, [installation]);

  const toggleCompleted = (id: string) => {
    setChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const updateNote = (id: string, note: string) => {
    setChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, note } : item
    ));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateDocument('installations', installation.id, { checklist });
      onUpdate({ ...installation, checklist });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">
              Checklist de Instalação
            </h2>
            <p className="text-sm font-bold text-slate-400 mt-1">Projeto: {installation.client}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {checklist.map(item => (
            <div 
              key={item.id} 
              className={`p-4 rounded-xl border transition-colors ${
                item.completed 
                  ? 'bg-emerald-50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-800' 
                  : 'bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
              }`}
            >
              <div className="flex items-start gap-4">
                <button 
                  onClick={() => toggleCompleted(item.id)}
                  className="mt-1 flex-shrink-0 focus:outline-none"
                >
                  {item.completed ? (
                    <CheckCircle className="w-6 h-6 text-emerald-500" />
                  ) : (
                    <Circle className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                  )}
                </button>
                <div className="flex-1">
                  <h3 className={`font-bold ${item.completed ? 'text-emerald-700 dark:text-emerald-400 line-through opacity-70' : 'text-slate-900 dark:text-slate-100'}`}>
                    {item.step}
                  </h3>
                  <textarea
                    placeholder="Adicionar nota de campo..."
                    value={item.note}
                    onChange={(e) => updateNote(item.id, e.target.value)}
                    className="mt-2 w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm appearance-none outline-none focus:ring-2 focus:ring-[#fdb612]"
                    rows={2}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancelar
          </button>
          <button 
            disabled={isSaving}
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#fdb612] text-[#231d0f] rounded-xl font-bold text-sm hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Salvando...' : 'Salvar Checklist'}
          </button>
        </div>
      </div>
    </div>
  );
};
