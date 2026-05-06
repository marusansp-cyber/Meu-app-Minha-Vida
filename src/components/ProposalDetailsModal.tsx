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
  History as HistoryIcon,
  Edit2, 
  Save,
  Building2,
  CreditCard,
  CheckCircle2,
  RefreshCw,
  LayoutGrid,
  Sun,
  ArrowRight,
  Rocket,
  Image as ImageIcon,
  Eye
} from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { Proposal, User as UserType } from '../types';

import { generateProposalPDF } from '../services/pdfService';

interface ProposalDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: Proposal | null;
  onUpdate?: (proposal: Proposal) => void;
  onConvertToInstallation?: (proposal: Proposal) => void;
  user: UserType | null;
}

export const ProposalDetailsModal: React.FC<ProposalDetailsModalProps> = ({ 
  isOpen, 
  onClose, 
  proposal,
  onUpdate,
  onConvertToInstallation,
  user
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Proposal>>({});
  const [isSending, setIsSending] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);

  useEffect(() => {
    if (proposal) {
      const formattedExpiry = proposal.expiryDate ? proposal.expiryDate.split('T')[0] : '';
      setEditForm({ ...proposal, expiryDate: formattedExpiry });
    }
    setIsEditing(false);
  }, [proposal, isOpen]);

  if (!isOpen || !proposal) return null;

  const handleSave = () => {
    if (onUpdate && editForm) {
      onUpdate({ ...proposal, ...editForm } as Proposal);
      setIsEditing(true); // Keep editing or close? Let's stay in edit mode for confirmation or close
      setIsEditing(false);
    }
  };

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      const pdfDataUri = await generateProposalPDF(proposal);
      const link = document.createElement('a');
      link.href = pdfDataUri;
      link.download = `Proposta_${proposal.proposalNumber || proposal.id}.pdf`;
      link.click();
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Erro ao gerar PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePreview = async () => {
    try {
      setIsPreviewing(true);
      const pdfBase64 = await generateProposalPDF(proposal);
      
      const byteCharacters = atob(pdfBase64.split(',')[1]);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Erro ao gerar visualização');
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleSendEmail = async () => {
    if (!proposal.email) {
      alert('E-mail do cliente não cadastrado.');
      return;
    }

    try {
      setIsSending(true);
      const pdfBase64 = await generateProposalPDF(proposal);
      
      const response = await fetch('/api/proposals/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: proposal.email,
          subject: `Proposta Solar - ${proposal.client}`,
          body: `Olá ${proposal.client},\n\nSegue em anexo a sua proposta personalizada para instalação de energia solar.\n\nQualquer dúvida, estamos à disposição.\n\nAtenciosamente,\nVieira's Solar & Engenharia`,
          pdfBase64,
          fileName: `Proposta_${proposal.proposalNumber || proposal.id}.pdf`
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('E-mail enviado com sucesso!');
        if (onUpdate) {
            onUpdate({ ...proposal, status: 'sent' });
        }
      } else {
        alert(`Erro ao enviar: ${data.message}`);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Erro ao enviar e-mail. Verifique a conexão.');
    } finally {
      setIsSending(false);
    }
  };

  const handleStatusChange = (newStatus: Proposal['status']) => {
    if (onUpdate) {
      onUpdate({ ...proposal, status: newStatus });
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
                    {editForm.status === 'accepted' && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Valor da Comissão (Calculado)</label>
                        <div className="w-full px-4 py-2.5 bg-emerald-50 dark:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 rounded-xl font-bold text-emerald-600">
                          {(() => {
                            const val = editForm.value || 0;
                            const comm = val * ((editForm.commission || 5) / 100);
                            return comm.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                          })()}
                        </div>
                      </div>
                    )}
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
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Foto do Telhado (URL)</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        value={editForm.photoUrl || ''}
                        onChange={(e) => setEditForm({ ...editForm, photoUrl: e.target.value })}
                        placeholder="https://exemplo.com/foto.jpg"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612]"
                      />
                    </div>
                    {editForm.photoUrl && (
                      <button 
                        type="button"
                        onClick={() => window.open(editForm.photoUrl, '_blank')}
                        className="size-11 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 hover:text-[#fdb612] transition-colors"
                        title="Visualizar imagem"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Imagens Adicionais (URLs)</label>
                    <button 
                      type="button"
                      onClick={() => setEditForm({ ...editForm, customImageLinks: [...(editForm.customImageLinks || []), ''] })}
                      className="text-[10px] font-black uppercase text-emerald-600 hover:underline"
                    >
                      + Adicionar
                    </button>
                  </div>
                  <div className="space-y-2">
                    {(editForm.customImageLinks || []).map((link, index) => (
                      <div key={index} className="flex gap-2 group">
                        <div className="relative flex-1">
                          <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input 
                            type="text" 
                            value={link}
                            onChange={(e) => {
                              const newLinks = [...(editForm.customImageLinks || [])];
                              newLinks[index] = e.target.value;
                              setEditForm({ ...editForm, customImageLinks: newLinks });
                            }}
                            placeholder="https://exemplo.com/outra-foto.jpg"
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612]"
                          />
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {link && (
                            <button 
                              type="button"
                              onClick={() => window.open(link, '_blank')}
                              className="size-11 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 hover:text-[#fdb612]"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                          )}
                          <button 
                            type="button"
                            onClick={() => {
                              const newLinks = (editForm.customImageLinks || []).filter((_, i) => i !== index);
                              setEditForm({ ...editForm, customImageLinks: newLinks });
                            }}
                            className="size-11 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 hover:text-rose-500"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
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
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Custo Adicional (R$)</label>
                  <input 
                    type="number" 
                    value={editForm.additionalCost || 0}
                    onChange={(e) => setEditForm({ ...editForm, additionalCost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Início Instalação</label>
                  <input 
                    type="date" 
                    value={editForm.installationStartDate || ''}
                    onChange={(e) => setEditForm({ ...editForm, installationStartDate: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Conclusão Estimada</label>
                  <input 
                    type="date" 
                    value={editForm.estimatedCompletionDate || ''}
                    onChange={(e) => setEditForm({ ...editForm, estimatedCompletionDate: e.target.value })}
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
              {/* Quick Status Update */}
              <div className="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Alterar Status da Proposta</label>
                  <div className="flex flex-wrap gap-2">
                    {(['pending', 'sent', 'accepted', 'expired', 'cancelled'] as Proposal['status'][]).map((s) => (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(s)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                          proposal.status === s 
                            ? "bg-[#fdb612] text-[#231d0f] shadow-lg shadow-[#fdb612]/20" 
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
                        )}
                      >
                        {s === 'pending' ? 'Pendente' : s === 'sent' ? 'Enviada' : s === 'accepted' ? 'Aceita' : s === 'expired' ? 'Expirada' : 'Cancelada'}
                      </button>
                    ))}
                  </div>
                </div>
                {proposal.status === 'accepted' && onConvertToInstallation && (
                  <button 
                    onClick={() => onConvertToInstallation(proposal)}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:shadow-lg hover:shadow-emerald-500/20 transition-all active:scale-95 animate-pulse"
                  >
                    <Rocket className="w-4 h-4" />
                    Gerar Projeto
                  </button>
                )}
              </div>

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
                        {proposal.value?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                      </p>
                      {proposal.discount > 0 && (
                        <p className="text-[10px] text-rose-500 font-bold">Desconto aplicado: R$ {proposal.discount.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
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
                        R$ {((proposal.value || 0) * ((proposal.commission || 5) / 100)).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                  </div>

                  {proposal.photoUrl && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Foto do Local</label>
                      <div className="relative group cursor-pointer overflow-hidden rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 aspect-video bg-slate-100 dark:bg-slate-900 flex items-center justify-center" onClick={() => window.open(proposal.photoUrl, '_blank')}>
                        <img 
                          src={proposal.photoUrl} 
                          alt="Local da Instalação" 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <Eye className="w-8 h-8" />
                        </div>
                      </div>
                    </div>
                  )}

                  {proposal.customImageLinks && proposal.customImageLinks.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Galeria do Projeto</label>
                      <div className="grid grid-cols-2 gap-4">
                        {proposal.customImageLinks.map((link, idx) => link && (
                          <div 
                            key={idx} 
                            className="relative group cursor-pointer overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800 aspect-square bg-slate-100 dark:bg-slate-900 flex items-center justify-center" 
                            onClick={() => window.open(link, '_blank')}
                          >
                            <img 
                              src={link} 
                              alt={`Anexo ${idx + 1}`} 
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <Eye className="w-5 h-5" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

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
                    <div className="size-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <LayoutGrid className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Consumo Mensal</label>
                      <p className="font-bold text-xl">{proposal.energyConsumption || '0'} kWh</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-slate-500" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Data de Criação</label>
                      <p className="font-bold text-xl">{formatDate(proposal.date || proposal.createdAt)}</p>
                    </div>
                  </div>

                  {proposal.expiryDate && (
                    <div className="flex items-center gap-4">
                      <div className="size-12 rounded-2xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                        <Clock className="w-6 h-6 text-rose-600" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Validade da Proposta</label>
                        <p className="font-bold text-xl">{formatDate(proposal.expiryDate)}</p>
                      </div>
                    </div>
                  )}

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
                            {proposal.financingInstallmentValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })} /mês
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
                        <p className="font-bold text-xl">Entrada: R$ {proposal.downPayment?.toLocaleString('pt-BR', { maximumFractionDigits: 0 }) || '0'}</p>
                        <p className="text-xs font-bold text-rose-500">
                          {proposal.pixInstallmentType === 'credit_card' ? 'Cartão' : 'Boleto'}: 10x de {(() => {
                            const remaining = (proposal.value || 0) - (proposal.downPayment || 0);
                            return (remaining / 10).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
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
                    {(() => {
                      if (proposal.feasibilityStudy) return proposal.feasibilityStudy;
                      const gen = parseFloat(proposal.monthlyGeneration || (parseFloat(proposal.systemSize || "0") * 108.34).toString()) || 550;
                      const consumption = parseFloat(proposal.energyConsumption || '1357');
                      const rate = 1.05;
                      const minFee = 100;
                      const currentBill = consumption * rate;
                      const projectedBill = Math.max(minFee, (consumption - gen) * rate + minFee);
                      const annualSavings = Math.max(0, currentBill - projectedBill) * 12;
                      return `O sistema dimensionado para ${proposal.client} apresenta viabilidade técnica e financeira excelente. Com uma geração estimada de ${gen.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} kWh/mês, a economia anual será de aproximadamente R$ ${annualSavings.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}.`;
                    })()}
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                      <p className="text-[10px] uppercase font-black text-slate-400 mb-1">Economia 25 anos</p>
                      <p className="text-xl font-black text-emerald-600">
                        {(() => {
                          const gen = parseFloat(proposal.monthlyGeneration || (parseFloat(proposal.systemSize || "0") * 108.34).toString()) || 550;
                          const consumption = parseFloat(proposal.energyConsumption || '1357');
                          const rate = 1.05;
                          const minFee = 100;
                          const currentBill = consumption * rate;
                          const projectedBill = Math.max(minFee, (consumption - gen) * rate + minFee);
                          const annualSavings = Math.max(0, currentBill - projectedBill) * 12;
                          const savings25 = annualSavings * 47.727; // Including 5% annual inflation
                          return `R$ ${savings25.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;
                        })()}
                      </p>
                    </div>
                    <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                      <p className="text-[10px] uppercase font-black text-slate-400 mb-1">Redução de CO2</p>
                      <p className="text-xl font-black text-blue-600">
                        {(() => {
                          const sysSizeNum = parseFloat((proposal.systemSize || "0").replace(/[^0-9.]/g, '')) || 0;
                          const annualGenKwh = sysSizeNum * 1300;
                          const co2SavedKg = annualGenKwh * 0.062;
                          return co2SavedKg >= 1000 
                            ? `${(co2SavedKg / 1000).toFixed(2)} Ton/ano`
                            : `${co2SavedKg.toFixed(0)} kg/ano`;
                        })()}
                      </p>
                    </div>
                    <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                      <p className="text-[10px] uppercase font-black text-slate-400 mb-1">Árvores Equivalentes</p>
                      <p className="text-xl font-black text-[#fdb612]">
                        {(() => {
                          const sysSizeNum = parseFloat((proposal.systemSize || "0").replace(/[^0-9.]/g, '')) || 0;
                          const annualGenKwh = sysSizeNum * 1300;
                          const co2SavedKg = annualGenKwh * 0.062;
                          return Math.round(co2SavedKg / 22);
                        })()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                <div className="bg-slate-50 dark:bg-white/5 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-[#fdb612] mb-4">
                    <ShieldCheck className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Garantia Técnica</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed text-left">
                    Esta proposta inclui 25 anos de performance linear para os módulos MAXEON, 10-15 anos para inversores AUXSOL e GARANTIA VITALÍCIA para a estrutura de alumínio anodizado, assegurada pela Vieira's Solar & Engenharia.
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

              {/* How it Works Section */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-6">
                  <span className="text-xl">⚡</span>
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Como Funciona sua Usina Solar</h3>
                </div>
                
                <div className="relative">
                  <div className="grid grid-cols-5 gap-2 items-center">
                    {[
                      { icon: "☀️", label: "SOL" },
                      { icon: "🔌", label: "PAINÉIS" },
                      { icon: "⚡", label: "INVERSOR" },
                      { icon: "🏠", label: "CONSUMO" },
                      { icon: "🌐", label: "REDE" }
                    ].map((step, i) => (
                      <div key={i} className="flex flex-col items-center gap-3 relative">
                        <div className="w-12 h-12 rounded-2xl bg-white dark:bg-white/5 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-xl shadow-sm">
                          {step.icon}
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{step.label}</span>
                        {i < 4 && (
                          <div className="absolute top-6 -right-4 text-slate-300 dark:text-slate-700">
                            →
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed text-center font-medium">
                      Sua usina gera energia limpa que é consumida instantaneamente. O excedente é injetado na rede e vira <span className="text-[#fdb612] font-black">créditos</span> para abater seu consumo em outros horários ou meses.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Premises & Technical Data */}
                <div className="bg-slate-50 dark:bg-white/5 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-[#fdb612] mb-6">
                    <LayoutGrid className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#fdb612]">📐 Premissas & Dados Técnicos</span>
                  </div>
                  <div className="space-y-3">
                    {(() => {
                      const sysSizeNum = parseFloat((proposal.systemSize || "0").replace(/[^0-9.]/g, '')) || 0;
                      const monthlyGenNum = parseFloat(proposal.monthlyGeneration || (sysSizeNum * 108.34).toString()) || 550;
                      const annualGen = monthlyGenNum * 12;
                      return [
                        { label: "Tarifa de referência", value: "R$ 1,05/kWh (CEMIG – Zona Rural)" },
                        { label: "Consumo médio", value: `${proposal.energyConsumption || '1.357'} kWh/mês` },
                        { label: "Taxa mínima estimada", value: "R$ 100,00/mês" },
                        { label: "Dimensionamento", value: "100% do consumo histórico" },
                        { label: "Validade dos créditos", value: "60 meses (Lei 14.300/2022)" },
                        { label: "Potência instalada", value: `${sysSizeNum.toFixed(2)} kWp` },
                        { label: "Geração anual estimada", value: `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(annualGen)} kWh/ano` }
                      ].map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-800 last:border-0">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</span>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{item.value}</span>
                        </div>
                      ));
                    })()}
                  </div>
                  <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/20 flex gap-3">
                    <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
                    <p className="text-[10px] text-amber-800 dark:text-amber-200 italic leading-relaxed">
                      ⚠️ Nota regulatória: Novos sistemas enquadrados na GD III terão compensação gradualmente impactada pelo “custo do fio B”, com transição até 2029.
                    </p>
                  </div>
                </div>
              </div>

              {/* Monthly Savings Comparison */}
                <div className="flex items-center gap-2 text-emerald-600 mb-8">
                  <Zap className="w-5 h-5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Simulação de Fluxo Mensal</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {(() => {
                    const rate = 1.05;
                    const minFee = 100;
                    const consumption = parseFloat(proposal.energyConsumption || '1357');
                    const gen = parseFloat(proposal.monthlyGeneration || (parseFloat(proposal.systemSize || "0") * 108.34).toString()) || 550;
                    const currentBill = consumption * rate;
                    const billAfter = Math.max(minFee, (consumption - gen) * rate + minFee);
                    const grossSavings = Math.max(0, currentBill - billAfter);
                    const installment = proposal.financingInstallmentValue || 0;
                    const netGain = currentBill - (billAfter + installment);
                    
                    return [
                      { label: "Conta Atual", val: `R$ ${currentBill.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`, color: "text-slate-500" },
                      { label: "Taxa Mínima", val: "R$ 100,00", color: "text-amber-500" },
                      { label: "Economia Mensal", val: `R$ ${grossSavings.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`, color: "text-emerald-500" },
                      { label: "Financiamento", val: `R$ ${installment.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`, color: "text-rose-500" },
                      { label: "Ganho Líquido", val: `R$ ${netGain.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`, color: "text-emerald-600 font-black" }
                    ].map((item, i) => (
                      <div key={i} className="flex flex-col gap-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                        <span className={cn("text-lg font-bold", item.color)}>{item.val}</span>
                        {i < 4 && <div className="h-px bg-emerald-200 dark:bg-emerald-800 mt-2 md:hidden" />}
                      </div>
                    ));
                  })()}
                </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Investment Breakdown */}
                <div className="p-8 bg-slate-50 dark:bg-white/5 rounded-[32px] border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-[#fdb112] mb-6">
                    <ShieldCheck className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#fdb112]">📋 Composição do Investimento</span>
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: "Equipamentos (Tier-1)", value: (proposal.equipmentCost || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) },
                      { label: "Instalação e Montagem", value: (proposal.installationCost || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) },
                      { label: "Projeto Técnico (ART)", value: (proposal.projectCost || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) },
                      { label: "Licenciamento e Logística", value: (proposal.licensingCost || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) },
                      { label: "Custos Adicionais", value: (proposal.additionalCost || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) },
                      { label: "TOTAL INVESTIMENTO", value: (proposal.value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }), highlight: true }
                    ].map((item, idx) => (
                      <div key={idx} className={cn(
                        "flex justify-between items-center py-2",
                        item.highlight ? "mt-4 pt-4 border-t border-slate-200 dark:border-slate-800" : ""
                      )}>
                        <span className={cn("text-[10px] font-black uppercase", item.highlight ? "text-[#fdb612]" : "text-slate-400")}>{item.label}</span>
                        <span className={cn("font-bold text-xs", item.highlight ? "text-lg text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400")}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Technical Specification */}
                <div className="p-8 bg-slate-50 dark:bg-white/5 rounded-[32px] border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-slate-400 mb-6">
                    <HistoryIcon className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">📝 Especificação Técnica</span>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 bg-white dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Módulos Fotovoltaicos</p>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{proposal.panelQuantity || 0}x {proposal.panelBrandModel || "Módulos de Alta Eficiência"}</p>
                    </div>
                    <div className="p-4 bg-white dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Inversor String</p>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{proposal.invertersQuantity || 1}x {proposal.inverterBrandModel || "Inversor String"} (Wifi Monitoramento)</p>
                    </div>
                      <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-800/20">
                        <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase mb-1">📅 Cronograma de Instalação</p>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                          Início: {formatDate(proposal.installationStartDate)}
                          {proposal.estimatedCompletionDate && ` | Fim: ${formatDate(proposal.estimatedCompletionDate)}`}
                        </p>
                      </div>
                    <div className="p-4 bg-white dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Estrutura & Proteção</p>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Alumínio Anodizado VITALÍCIO</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Conversion Closure */}
              <div className="mt-8 p-8 bg-slate-900 border border-slate-800 rounded-[32px] text-white">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                  <div>
                    <h4 className="text-xl font-bold mb-2 flex items-center gap-2 text-emerald-400">
                       ✅ PRÓXIMOS PASSOS
                    </h4>
                    <p className="text-slate-400 text-xs font-medium">Sua jornada para a independência energética começa aqui:</p>
                  </div>
                  <div className="bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20">
                    <span className="text-amber-500 text-[10px] font-bold uppercase tracking-widest">⏰ OFERTA VÁLIDA POR 15 DIAS</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                   {[
                     { step: "1", title: "ASSINATURA", desc: "Assine digitalmente sua proposta agora" },
                     { step: "2", title: "VISTORIA", desc: "Agendamos em até 48h no local" },
                     { step: "3", title: "OPERAÇÃO", desc: "Energia injetada em até 30 dias" }
                   ].map((s, i) => (
                     <div key={i} className="flex gap-4 group">
                       <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-black text-lg shrink-0 border border-emerald-500/30 group-hover:bg-emerald-500 group-hover:text-slate-900 transition-all duration-300">
                         {s.step}
                       </div>
                       <div>
                         <p className="font-black text-[10px] tracking-widest text-emerald-400 uppercase mb-1">{s.title}</p>
                         <p className="text-xs text-slate-300 font-medium leading-relaxed">{s.desc}</p>
                       </div>
                     </div>
                   ))}
                </div>

                {(() => {
                  const rate = 1.05;
                  const minFee = 100;
                  const consumption = parseFloat(proposal.energyConsumption || '1357');
                  const gen = parseFloat(proposal.monthlyGeneration || (parseFloat(proposal.systemSize || "0") * 108.34).toString()) || 550;
                  const currentBill = consumption * rate;
                  const billAfter = Math.max(minFee, (consumption - gen) * rate + minFee);
                  const monthlySavings = Math.max(0, currentBill - billAfter);

                  return (
                    <button 
                      onClick={handleSendEmail}
                      className="w-full py-6 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-2xl font-black text-lg md:text-xl flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-95 shadow-xl shadow-emerald-500/20"
                    >
                      🚀 QUERO ECONOMIZAR R$ {monthlySavings.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}/MÊS
                    </button>
                  );
                })()}
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
                {proposal.status === 'accepted' && onConvertToInstallation && (
                  <button 
                    onClick={() => onConvertToInstallation(proposal)}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 text-white rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-emerald-500/20 transition-all active:scale-95 shadow-md md:col-span-1"
                  >
                    <Package className="w-4 h-4" />
                    <span>Instalar</span>
                  </button>
                )}
                <button 
                  onClick={() => window.print()}
                  className="flex items-center justify-center gap-2 px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-sm hover:bg-white transition-all group"
                >
                  <Printer className="w-4 h-4 text-slate-400 group-hover:text-[#fdb612]" />
                  <span>Imprimir</span>
                </button>
                <button 
                  onClick={handlePreview}
                  disabled={isPreviewing}
                  className={cn(
                    "flex items-center justify-center gap-2 px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-sm hover:bg-white transition-all group",
                    isPreviewing && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isPreviewing ? (
                    <RefreshCw className="w-4 h-4 text-emerald-500 animate-spin" />
                  ) : (
                    <LayoutGrid className="w-4 h-4 text-slate-400 group-hover:text-emerald-500" />
                  )}
                  <span>{isPreviewing ? 'Gerando...' : 'Visualizar'}</span>
                </button>
                <button 
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className={cn(
                    "flex items-center justify-center gap-2 px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-sm hover:bg-white transition-all group",
                    isDownloading && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isDownloading ? (
                    <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 text-slate-400 group-hover:text-blue-500" />
                  )}
                  <span>{isDownloading ? 'Gerando...' : 'Baixar PDF'}</span>
                </button>
                <button 
                  onClick={handleSendEmail}
                  disabled={isSending}
                  className={cn(
                    "flex items-center justify-center gap-2 px-4 py-3 bg-[#fdb612] text-[#231d0f] rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-[#fdb612]/20 transition-all active:scale-95 shadow-md",
                    isSending && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isSending ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>{isSending ? 'Enviando...' : 'Enviar E-mail'}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
