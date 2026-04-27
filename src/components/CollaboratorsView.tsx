import React, { useState } from 'react';
import { 
  UserPlus, 
  Search, 
  Users, 
  Mail, 
  Phone, 
  Shield, 
  MoreVertical, 
  Trash2, 
  Edit2, 
  CheckCircle2, 
  XCircle,
  ChevronDown
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Collaborator } from '../types';
import { createDocument, updateDocument, deleteDocument } from '../firestoreUtils';

interface CollaboratorsViewProps {
  collaborators: Collaborator[];
}

export const CollaboratorsView: React.FC<CollaboratorsViewProps> = ({ collaborators }) => {
  const [activeMode, setActiveMode] = useState<'register' | 'search'>('register');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    role: 'Vendedor' as Collaborator['role'],
    email: '',
    phone: ''
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (editingId) {
        await updateDocument('collaborators', editingId, {
          ...formData,
          updatedAt: new Date().toISOString()
        });
        showToast('Colaborador atualizado com sucesso!');
      } else {
        await createDocument('collaborators', {
          ...formData,
          status: 'active',
          createdAt: new Date().toISOString()
        });
        showToast('Colaborador cadastrado com sucesso!');
      }
      setFormData({ name: '', role: 'Vendedor', email: '', phone: '' });
      setEditingId(null);
      setActiveMode('search');
    } catch (error) {
      console.error(error);
      showToast(editingId ? 'Erro ao atualizar colaborador.' : 'Erro ao cadastrar colaborador.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (collab: Collaborator) => {
    setFormData({
      name: collab.name,
      role: collab.role,
      email: collab.email || '',
      phone: collab.phone || ''
    });
    setEditingId(collab.id);
    setActiveMode('register');
  };

  const cancelEdit = () => {
    setFormData({ name: '', role: 'Vendedor', email: '', phone: '' });
    setEditingId(null);
    setActiveMode('search');
  };

  const filteredCollaborators = collaborators.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleStatus = async (collab: Collaborator) => {
    const newStatus = collab.status === 'active' ? 'inactive' : 'active';
    await updateDocument('collaborators', collab.id, { status: newStatus });
    showToast(`Status atualizado para ${newStatus === 'active' ? 'Ativo' : 'Inativo'}`);
  };

  const deleteCollab = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este colaborador?')) {
      await deleteDocument('collaborators', id);
      showToast('Colaborador removido.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {toast && (
        <div className="fixed bottom-8 right-8 z-[200] bg-[#231d0f] text-white px-6 py-3 rounded-xl shadow-2xl border border-[#fdb612]/30 animate-in slide-in-from-right duration-300 flex items-center gap-3">
          <div className="size-2 bg-[#fdb612] rounded-full animate-pulse" />
          <span className="font-bold text-sm">{toast}</span>
        </div>
      )}

      <div className="text-center">
        <h2 className="text-2xl font-black text-[#004a61] dark:text-slate-100 uppercase tracking-tight">
          Collaborator Registration and Editing
        </h2>
      </div>

      {/* Action Buttons - Styled like the image */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button 
          onClick={() => {
            setActiveMode('register');
            setEditingId(null);
            setFormData({ name: '', role: 'Vendedor', email: '', phone: '' });
          }}
          className={cn(
            "flex flex-col items-center justify-center gap-4 p-8 rounded-lg transition-all shadow-md group",
            (activeMode === 'register' && !editingId)
              ? "bg-[#1a9fb4] text-white scale-[1.02] shadow-xl" 
              : "bg-white dark:bg-[#231d0f]/40 text-[#1a9fb4] border border-slate-200 dark:border-slate-800"
          )}
        >
          <span className="text-sm font-black uppercase tracking-widest">Register Collaborator</span>
          <div className="relative">
            <UserPlus className="w-16 h-16" strokeWidth={1.5} />
          </div>
        </button>

        <button 
          onClick={() => {
            setActiveMode('search');
            setEditingId(null);
          }}
          className={cn(
            "flex flex-col items-center justify-center gap-4 p-8 rounded-lg transition-all shadow-md group",
            activeMode === 'search' || editingId
              ? (activeMode === 'search' ? "bg-[#1a9fb4] text-white scale-[1.02] shadow-xl" : "bg-white dark:bg-[#231d0f]/40 text-[#1a9fb4] border border-slate-200 dark:border-slate-800")
              : "bg-white dark:bg-[#231d0f]/40 text-[#1a9fb4] border border-slate-200 dark:border-slate-800"
          )}
        >
          <span className="text-sm font-black uppercase tracking-widest">Search Collaborator</span>
          <Search className="w-16 h-16" strokeWidth={1.5} />
        </button>
      </div>

      {editingId && (
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Edit2 className="w-5 h-5 text-amber-600" />
            <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
              Você está editando o colaborador: <span className="uppercase">{formData.name}</span>
            </p>
          </div>
          <button 
            onClick={cancelEdit}
            className="text-xs font-black uppercase tracking-widest text-amber-600 hover:underline"
          >
            Cancelar Edição
          </button>
        </div>
      )}

      {/* Content Area */}
      <div className="bg-white dark:bg-[#231d0f]/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm">
        {activeMode === 'register' ? (
          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
            <div className="space-y-1">
              <input 
                required
                type="text" 
                placeholder="Name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-4 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md outline-none focus:ring-2 focus:ring-[#1a9fb4] transition-all text-slate-700 dark:text-slate-200"
              />
            </div>

            <div className="relative">
              <label className="absolute -top-2.5 left-3 bg-white dark:bg-[#231d0f] px-2 text-[10px] font-bold text-[#1a9fb4] uppercase tracking-widest z-10">
                Collaborator Role
              </label>
              <div className="relative">
                <select 
                  required
                  value={formData.role || 'Vendedor'}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full px-4 py-4 bg-white dark:bg-slate-900 border border-[#1a9fb4] rounded-md outline-none appearance-none cursor-pointer text-slate-700 dark:text-slate-200 font-medium"
                >
                  <option value="Vendedor">Salesperson</option>
                  <option value="Projetista">Designer</option>
                  <option value="Instalador">Installer</option>
                  <option value="Financeiro">Financial</option>
                  <option value="Administrativo">Administrative</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1a9fb4] pointer-events-none" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input 
                type="email" 
                placeholder="E-mail (Optional)"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-4 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md outline-none focus:ring-2 focus:ring-[#1a9fb4] transition-all"
              />
              <input 
                type="text" 
                placeholder="Phone (Optional)"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-4 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md outline-none focus:ring-2 focus:ring-[#1a9fb4] transition-all"
              />
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#1a9fb4] text-white py-4 rounded-md font-bold text-lg hover:bg-[#158a9d] transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-[#1a9fb4]/20"
            >
              {isLoading ? (editingId ? 'Atualizando...' : 'Cadastrando...') : (editingId ? 'Alterar Colaborador' : 'Save Collaborator')}
            </button>
            {editingId && (
              <button 
                type="button"
                onClick={cancelEdit}
                className="w-full bg-slate-100 dark:bg-slate-800 text-slate-500 py-3 rounded-md font-bold text-sm hover:bg-slate-200 transition-all active:scale-[0.98]"
              >
                Cancelar Alteração
              </button>
            )}
          </form>
        ) : (
          <div className="space-y-6">
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search by name or role..."
                value={searchTerm || ''}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#1a9fb4] transition-all"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredCollaborators.map((collab) => (
                <div 
                  key={collab.id}
                  className="p-5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between group hover:border-[#1a9fb4]/50 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-[#1a9fb4] shadow-sm">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-slate-100">{collab.name}</h4>
                      <p className="text-xs font-black text-[#1a9fb4] uppercase tracking-widest">{collab.role}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleEdit(collab)}
                      className="p-2 text-slate-400 hover:text-[#1a9fb4] hover:bg-[#1a9fb4]/10 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => toggleStatus(collab)}
                      className={cn(
                        "p-2 rounded-lg transition-colors",
                        collab.status === 'active' ? "text-emerald-500 hover:bg-emerald-50" : "text-slate-400 hover:bg-slate-100"
                      )}
                      title={collab.status === 'active' ? 'Deactivate' : 'Activate'}
                    >
                      {collab.status === 'active' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    </button>
                    <button 
                      onClick={() => deleteCollab(collab.id)}
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {filteredCollaborators.length === 0 && (
                <div className="col-span-full py-12 text-center space-y-2">
                  <Users className="w-12 h-12 text-slate-300 mx-auto" />
                  <p className="text-slate-500 font-medium">No collaborators found.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
