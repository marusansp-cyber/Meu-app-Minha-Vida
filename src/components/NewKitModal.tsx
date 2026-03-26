import React, { useState, useEffect } from 'react';
import { Plus, X, Package, DollarSign, Zap, Trash2, Info, Loader2, CheckCircle2 } from 'lucide-react';
import { Kit } from '../types';
import { createDocument, updateDocument } from '../firestoreUtils';

interface NewKitModalProps {
  isOpen: boolean;
  onClose: () => void;
  kit: Kit | null;
  showToast: (msg: string) => void;
}

export const NewKitModal: React.FC<NewKitModalProps> = ({ isOpen, onClose, kit, showToast }) => {
  const [formData, setFormData] = useState<Partial<Kit>>({
    name: '',
    description: '',
    power: 0,
    price: 0,
    components: [],
    status: 'active'
  });

  const [newComponent, setNewComponent] = useState({
    name: '',
    brand: '',
    model: '',
    quantity: 1
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (kit) {
      setFormData({
        ...kit,
        components: kit.components || []
      });
    } else {
      setFormData({
        name: '',
        description: '',
        power: 0,
        price: 0,
        components: [],
        status: 'active'
      });
    }
  }, [kit, isOpen]);

  const addComponent = () => {
    if (!newComponent.name.trim()) {
      showToast('Nome do componente é obrigatório');
      return;
    }
    if (newComponent.quantity <= 0) {
      showToast('Quantidade deve ser maior que zero');
      return;
    }

    setFormData(prev => ({
      ...prev,
      components: [...(prev.components || []), { ...newComponent }]
    }));
    setNewComponent({ name: '', brand: '', model: '', quantity: 1 });
  };

  const removeComponent = (index: number) => {
    setFormData(prev => {
      const newComponents = [...(prev.components || [])];
      newComponents.splice(index, 1);
      return { ...prev, components: newComponents };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name?.trim()) {
      showToast('Nome do kit é obrigatório');
      return;
    }
    if (formData.power === undefined || formData.power <= 0) {
      showToast('A potência do kit deve ser um número positivo maior que zero.');
      return;
    }
    if (formData.price === undefined || formData.price <= 0) {
      showToast('O preço do kit deve ser um valor maior que zero.');
      return;
    }
    if (!formData.components || formData.components.length === 0) {
      showToast('Adicione pelo menos um componente ao kit');
      return;
    }

    setIsSubmitting(true);
    try {
      if (kit?.id) {
        await updateDocument('kits', kit.id, {
          ...formData,
          updatedAt: new Date().toISOString()
        });
        showToast('Kit atualizado com sucesso!');
      } else {
        await createDocument('kits', {
          ...formData,
          status: 'active',
          createdAt: new Date().toISOString()
        });
        showToast('Novo kit cadastrado com sucesso!');
      }
      onClose();
    } catch (error) {
      console.error('Error saving kit:', error);
      showToast('Erro ao salvar kit. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#1a160d] w-full max-w-3xl rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-white/5">
          <div className="flex items-center gap-4">
            <div className="size-12 bg-[#fdb612]/20 rounded-2xl flex items-center justify-center text-[#fdb612]">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 uppercase">
                {kit ? 'Editar Kit Solar' : 'Novo Kit Solar'}
              </h3>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Configuração de Equipamentos</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-all hover:rotate-90">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8 overflow-y-auto max-h-[75vh] custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nome do Kit</label>
              <input 
                required
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Kit Residencial 5kWp Premium"
                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-[#fdb612] transition-all font-medium"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Status</label>
              <select 
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-[#fdb612] transition-all font-bold text-[#004a61]"
              >
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Potência (kWp)</label>
                <div className="group relative">
                  <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl font-bold uppercase tracking-tighter">
                    A potência nominal do sistema deve ser informada em quilowatt-pico (kWp).
                  </div>
                </div>
              </div>
              <div className="relative">
                <Zap className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  required
                  type="number" 
                  step="0.01"
                  value={formData.power || ''}
                  onChange={(e) => setFormData({ ...formData, power: Number(e.target.value) })}
                  placeholder="0.00"
                  className="w-full pl-14 pr-5 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-[#fdb612] transition-all font-black text-[#004a61]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Preço Sugerido (R$)</label>
              <div className="relative">
                <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  required
                  type="number" 
                  value={formData.price || ''}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  placeholder="0,00"
                  className="w-full pl-14 pr-5 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-[#fdb612] transition-all font-black text-emerald-600"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Descrição do Kit</label>
            <textarea 
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva as principais características e benefícios deste kit..."
              className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-[#fdb612] transition-all resize-none font-medium"
            />
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Componentes do Kit</label>
                <div className="px-2 py-0.5 bg-[#fdb612]/10 text-[#fdb612] rounded-full text-[9px] font-black">
                  {formData.components?.length || 0} ITENS
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-[2rem] border border-slate-100 dark:border-slate-800 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Nome do Item</span>
                  <input 
                    type="text" 
                    placeholder="Ex: Painel Solar Monocristalino"
                    value={newComponent.name}
                    onChange={(e) => setNewComponent({ ...newComponent, name: e.target.value })}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#fdb612]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Marca</span>
                    <input 
                      type="text" 
                      placeholder="Ex: Jinko"
                      value={newComponent.brand}
                      onChange={(e) => setNewComponent({ ...newComponent, brand: e.target.value })}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#fdb612]"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Modelo</span>
                    <input 
                      type="text" 
                      placeholder="Ex: Tiger Neo"
                      value={newComponent.model}
                      onChange={(e) => setNewComponent({ ...newComponent, model: e.target.value })}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#fdb612]"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-end gap-4">
                <div className="flex-1 space-y-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Quantidade</span>
                  <input 
                    type="number" 
                    value={newComponent.quantity}
                    onChange={(e) => setNewComponent({ ...newComponent, quantity: Number(e.target.value) })}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#fdb612]"
                  />
                </div>
                <button 
                  type="button"
                  onClick={addComponent}
                  className="px-8 py-3 bg-[#fdb612] text-[#231d0f] rounded-xl font-black text-xs hover:shadow-lg hover:shadow-[#fdb612]/20 transition-all flex items-center gap-2 h-[46px]"
                >
                  <Plus className="w-4 h-4" />
                  ADICIONAR
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {formData.components?.map((comp, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl group hover:border-[#fdb612]/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="size-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-[#004a61] font-black text-sm">
                      {comp.quantity}x
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 dark:text-slate-100">{comp.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{comp.brand}</span>
                        <div className="size-1 bg-slate-300 rounded-full" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{comp.model}</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => removeComponent(idx)}
                    className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
              {(!formData.components || formData.components.length === 0) && (
                <div className="text-center py-12 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[2rem] bg-slate-50/30">
                  <div className="size-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-300 mx-auto mb-4">
                    <Info className="w-6 h-6" />
                  </div>
                  <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Nenhum componente adicionado</p>
                  <p className="text-xs text-slate-400 mt-1">Adicione os itens acima para compor o kit solar.</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-6 flex gap-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-5 border border-slate-200 dark:border-slate-800 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="flex-[2] px-6 py-5 bg-[#fdb612] text-[#231d0f] rounded-2xl font-black text-xs uppercase tracking-widest hover:shadow-2xl hover:shadow-[#fdb612]/30 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              {kit ? 'Salvar Alterações' : 'Finalizar Cadastro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

