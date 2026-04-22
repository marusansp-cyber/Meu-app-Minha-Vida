import React, { useState, useEffect } from 'react';
import { 
  X, 
  FileText, 
  User, 
  Zap, 
  DollarSign, 
  Calendar, 
  ShieldCheck, 
  Download, 
  Send, 
  Printer, 
  TrendingUp, 
  Clock, 
  BarChart3, 
  Package,
  Edit2, 
  Save,
  Building2,
  CreditCard,
  CheckCircle2,
  RefreshCw,
  LayoutGrid,
  Sun,
  ArrowRight
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Proposal, User as UserType } from '../types';

interface ProposalDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: Proposal | null;
  onSend: (id: string) => void;
  onDownload: (id: string) => void;
  onPrint: (id: string) => void;
  onUpdate?: (proposal: Proposal) => void;
  user: UserType | null;
}

export const ProposalDetailsModal: React.FC<ProposalDetailsModalProps> = ({ 
  isOpen, 
  onClose, 
  proposal,
  onSend,
  onDownload,
  onPrint,
  onUpdate,
  user
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Proposal>>({});

  useEffect(() => {
    if (proposal) {
      // Format expiryDate for input type="date" if it exists
      const formattedExpiry = proposal.expiryDate ? proposal.expiryDate.split('T')[0] : '';
      setEditForm({ ...proposal, expiryDate: formattedExpiry });
    }
    setIsEditing(false);
  }, [proposal, isOpen]);

  if (!isOpen || !proposal) return null;

  const handleSave = () => {
    if (onUpdate && editForm) {
      const sanitized = { ...editForm };
      (Object.keys(sanitized) as (keyof Proposal)[]).forEach(key => {
        if (sanitized[key] === undefined) {
          delete sanitized[key];
        }
      });
      onUpdate({ ...proposal, ...sanitized } as Proposal);
      setIsEditing(false);
    }
  };

  return (
    <div className={cn(
      "fixed inset-0 z-[100] transition-opacity duration-300",
      isOpen ? "bg-black/40 backdrop-blur-sm opacity-100" : "bg-transparent opacity-0 pointer-events-none"
    )} onClick={onClose}>
      <div 
        className={cn(
          "absolute right-0 top-0 bottom-0 w-full max-w-2xl bg-white dark:bg-[#231d0f] shadow-2xl transition-transform duration-500 ease-out flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-white/5">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-[#fdb612]/20 rounded-xl flex items-center justify-center text-[#fdb612]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight">{proposal.proposalNumber || proposal.id}</h3>
              <p className="text-xs text-slate-500 font-medium">Proposta para {proposal.client}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cliente</label>
                  <input 
                    type="text" 
                    value={editForm.client || ''}
                    onChange={(e) => setEditForm({ ...editForm, client: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">E-mail do Cliente</label>
                  <input 
                    type="email" 
                    value={editForm.email || ''}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612]"
                    placeholder="exemplo@email.com"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Representante</label>
                  <input 
                    type="text" 
                    value={editForm.representative || ''}
                    onChange={(e) => setEditForm({ ...editForm, representative: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Potência (kWp)</label>
                  <input 
                    type="text" 
                    value={editForm.systemSize || ''}
                    onChange={(e) => setEditForm({ ...editForm, systemSize: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Número da UC</label>
                  <input 
                    type="text" 
                    value={editForm.ucNumber || ''}
                    onChange={(e) => setEditForm({ ...editForm, ucNumber: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Consumo Mensal (kWh)</label>
                  <input 
                    type="text" 
                    value={editForm.energyConsumption || ''}
                    onChange={(e) => setEditForm({ ...editForm, energyConsumption: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612]"
                  />
                </div>
                {(user?.role === 'admin' || user?.role === 'finance') && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Comissão (%)</label>
                      <input 
                        type="number" 
                        value={editForm.commission || 5}
                        onChange={(e) => setEditForm({ ...editForm, commission: parseFloat(e.target.value) })}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status da Comissão</label>
                      <select 
                        value={editForm.commissionStatus || 'pending'}
                        onChange={(e) => setEditForm({ ...editForm, commissionStatus: e.target.value as 'pending' | 'paid' })}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612]"
                      >
                        <option value="pending">Pendente</option>
                        <option value="paid">Pago</option>
                      </select>
                    </div>
                  </>
                )}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Valor do Investimento (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={editForm.value || 0}
                    onChange={(e) => setEditForm({ ...editForm, value: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Observações Internas</label>
                  <textarea 
                    value={editForm.internalNotes || ''}
                    onChange={(e) => setEditForm({ ...editForm, internalNotes: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612] resize-none text-sm"
                    placeholder="Notas internas visíveis apenas para a equipe..."
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</label>
                  <select 
                    value={editForm.status || 'pending'}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as Proposal['status'] })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612]"
                  >
                    <option value="pending">Pendente</option>
                    <option value="sent">Enviada</option>
                    <option value="accepted">Aceita</option>
                    <option value="expired">Expirada</option>
                    <option value="cancelled">Cancelada</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Método de Pagamento</label>
                  <select 
                    value={editForm.paymentMethod || 'cash'}
                    onChange={(e) => setEditForm({ ...editForm, paymentMethod: e.target.value as Proposal['paymentMethod'] })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612]"
                  >
                    <option value="cash">À vista</option>
                    <option value="financing">Financiamento</option>
                    <option value="credit_card">Cartão</option>
                    <option value="pix">PIX</option>
                    <option value="boleto">Boleto</option>
                    <option value="pix_plus_installments">Pix + 10x</option>
                  </select>
                </div>
                {editForm.paymentMethod === 'pix_plus_installments' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tipo da Parcela (Pix + 10x)</label>
                    <select 
                      value={editForm.pixInstallmentType || 'credit_card'}
                      onChange={(e) => setEditForm({ ...editForm, pixInstallmentType: e.target.value as any })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612]"
                    >
                      <option value="credit_card">Cartão</option>
                      <option value="boleto">Boleto</option>
                    </select>
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Valor da Entrada / Down Payment (R$)</label>
                  <input 
                    type="number" 
                    value={editForm.downPayment || 0}
                    onChange={(e) => setEditForm({ ...editForm, downPayment: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Banco de Financiamento</label>
                  <input 
                    type="text" 
                    value={editForm.financingBank || ''}
                    onChange={(e) => setEditForm({ ...editForm, financingBank: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Parcelas</label>
                  <input 
                    type="number" 
                    value={editForm.financingInstallments || 0}
                    onChange={(e) => setEditForm({ ...editForm, financingInstallments: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Data de Validade</label>
                  <input 
                    type="date" 
                    value={editForm.expiryDate || ''}
                    onChange={(e) => setEditForm({ ...editForm, expiryDate: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Comissão (%)</label>
                  <input 
                    type="number" 
                    value={editForm.commission || 5}
                    onChange={(e) => setEditForm({ ...editForm, commission: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Desconto (R$)</label>
                  <input 
                    type="number" 
                    value={editForm.discount || 0}
                    onChange={(e) => setEditForm({ ...editForm, discount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612]"
                  />
                </div>
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Estudo de Viabilidade</label>
                <textarea 
                  value={editForm.feasibilityStudy || ''}
                  onChange={(e) => setEditForm({ ...editForm, feasibilityStudy: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612] resize-none text-sm"
                  placeholder="Descreva o estudo de viabilidade..."
                />
              </div>
            </div>
          ) : (
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <User className="w-6 h-6 text-slate-500" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Cliente</label>
                      <p className="font-bold text-xl">{proposal.client}</p>
                      {proposal.email && <p className="text-xs text-slate-500">{proposal.email}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      <Zap className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Potência do Sistema</label>
                      <p className="font-bold text-xl">{proposal.systemSize}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Valor do Investimento</label>
                      <p className="font-black text-3xl text-[#fdb612]">
                        {proposal.value?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                      {proposal.discount > 0 && (
                        <p className="text-[10px] text-rose-500 font-bold">Desconto aplicado: R$ {proposal.discount.toLocaleString('pt-BR')}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <ShieldCheck className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Comissão Estimada</label>
                      <p className="font-bold text-xl text-emerald-600">
                        R$ {((proposal.value || 0) * ((proposal.commission || 5) / 100)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>

                  {proposal.ucNumber && (
                    <div className="flex items-center gap-4">
                      <div className="size-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <LayoutGrid className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Unidade Consumidora (UC)</label>
                        <p className="font-bold text-xl">{proposal.ucNumber}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">ROI Estimado</label>
                      <p className="font-bold text-xl text-indigo-600">{proposal.roi || '385% em 25 anos'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Tempo de Retorno (Payback)</label>
                      <p className="font-bold text-xl text-purple-600">{proposal.payback || '4.2 Anos'}</p>
                    </div>
                  </div>

                  {proposal.financingBank && proposal.paymentMethod === 'financing' && (
                    <div className="flex items-center gap-4">
                      <div className="size-12 rounded-2xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-rose-600" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Financiamento</label>
                        <p className="font-bold text-xl">{proposal.financingBank} - {proposal.financingInstallments}x</p>
                        {proposal.financingInstallmentValue && proposal.financingInstallmentValue > 0 && (
                          <p className="text-xs font-bold text-rose-500">
                            {proposal.financingInstallmentValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} /mês
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {proposal.paymentMethod === 'pix_plus_installments' && (
                    <div className="flex items-center gap-4">
                      <div className="size-12 rounded-2xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-rose-600" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Pagamento (Pix + 10x)</label>
                        <p className="font-bold text-xl">Entrada: R$ {proposal.downPayment?.toLocaleString('pt-BR') || '0,00'}</p>
                        <p className="text-xs font-bold text-rose-500">
                          {proposal.pixInstallmentType === 'credit_card' ? 'Cartão' : 'Boleto'}: 10x de {(() => {
                            const remaining = (proposal.value || 0) - (proposal.downPayment || 0);
                            return (remaining / 10).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                          })()}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold">
                      {proposal.representative.charAt(0)}
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Representante</label>
                      <p className="font-bold text-xl">{proposal.representative}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50 dark:bg-white/5 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-[#fdb612] mb-4">
                    <BarChart3 className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Estudo de Viabilidade</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                    {proposal.feasibilityStudy || `O sistema dimensionado para ${proposal.client} apresenta viabilidade técnica e financeira excelente. Com uma geração estimada de 1.250 kWh/mês, a economia anual será de aproximadamente R$ 14.400,00.`}
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                      <p className="text-[10px] uppercase font-black text-slate-400 mb-1">Economia 25 anos</p>
                      <p className="text-xl font-black text-emerald-600">R$ 482.000</p>
                    </div>
                    <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                      <p className="text-[10px] uppercase font-black text-slate-400 mb-1">Redução de CO2</p>
                      <p className="text-xl font-black text-blue-600">12.5 Ton/ano</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-slate-50 dark:bg-white/5 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-[#fdb612] mb-4">
                      <ShieldCheck className="w-5 h-5" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Garantia Técnica</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      Esta proposta inclui 10 anos de garantia de fabricação para os inversores e 25 anos de performance para os módulos fotovoltaicos, assegurada pela Vieira's Solar & Engenharia.
                    </p>
                  </div>

                  {proposal.kitId && (
                    <div className="bg-slate-900 p-8 rounded-[32px] text-white">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2 text-[#fdb612]">
                          <Zap className="w-5 h-5" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Equipamentos Selecionados</span>
                        </div>
                        <div className="px-3 py-1 bg-emerald-500 text-white text-[8px] font-black uppercase rounded-full">Garantido</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="size-12 rounded-2xl bg-white/10 flex items-center justify-center">
                          <Package className="w-6 h-6 text-[#fdb612]" />
                        </div>
                        <div>
                          <p className="text-xs font-bold">Kit Fotovoltaico</p>
                          <p className="text-[10px] text-slate-400">Dimencionamento Realizado</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {proposal.internalNotes && (
                    <div className="bg-amber-50 dark:bg-amber-900/10 p-8 rounded-[32px] border border-amber-100 dark:border-amber-900/20">
                      <div className="flex items-center gap-2 text-amber-600 mb-4">
                        <FileText className="w-5 h-5" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Observações Internas</span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
                        {proposal.internalNotes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-white/5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {isEditing ? (
              <>
                <button 
                  onClick={() => setIsEditing(false)}
                  className="flex items-center justify-center gap-2 px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-sm hover:bg-white transition-all ml-auto md:col-start-3"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSave}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 text-white rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-emerald-500/20 transition-all active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  Salvar
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => setIsEditing(true)}
                  className="flex items-center justify-center gap-2 px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-sm hover:bg-white transition-all group"
                >
                  <Edit2 className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                  <span>Editar</span>
                </button>
                <button 
                  onClick={() => onPrint(proposal.id)}
                  className="flex items-center justify-center gap-2 px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-sm hover:bg-white transition-all group"
                >
                  <Printer className="w-4 h-4 text-slate-400 group-hover:text-[#fdb612]" />
                  <span>Imprimir</span>
                </button>
                <button 
                  onClick={() => onDownload(proposal.id)}
                  className="flex items-center justify-center gap-2 px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-sm hover:bg-white transition-all group"
                >
                  <Download className="w-4 h-4 text-slate-400 group-hover:text-blue-500" />
                  <span>Baixar PDF</span>
                </button>
                <button 
                  onClick={() => onSend(proposal.id)}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-[#fdb612] text-[#231d0f] rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-[#fdb612]/20 transition-all active:scale-95 shadow-md"
                >
                  <Send className="w-4 h-4" />
                  <span>Enviar E-mail</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
