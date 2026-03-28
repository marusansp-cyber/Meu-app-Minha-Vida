import React, { useState } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Mail, 
  Phone, 
  MapPin, 
  User, 
  ShieldCheck, 
  AlertCircle,
  Trash2,
  Edit2,
  ExternalLink,
  Briefcase,
  Loader2,
  Eye,
  LayoutGrid,
  List
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Partner } from '../types';
import { createDocument, updateDocument, deleteDocument } from '../firestoreUtils';
import { useToast } from '../hooks/useToast';

interface PartnersViewProps {
  partners: Partner[];
}

export const PartnersView: React.FC<PartnersViewProps> = ({ partners }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [partnerToDelete, setPartnerToDelete] = useState<Partner | null>(null);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [viewType, setViewType] = useState<'grid' | 'table'>('grid');

  const filteredPartners = partners.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.cnpj.includes(searchTerm) ||
    p.contactName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async () => {
    if (partnerToDelete) {
      await deleteDocument('partners', partnerToDelete.id);
      setIsDeleteModalOpen(false);
      setPartnerToDelete(null);
    }
  };

  const getStatusBadge = (status: Partner['status']) => {
    switch (status) {
      case 'active':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
            <ShieldCheck className="w-3 h-3" />
            Ativo
          </span>
        );
      case 'pending':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
            <AlertCircle className="w-3 h-3" />
            Pendente
          </span>
        );
      case 'inactive':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            Inativo
          </span>
        );
    }
  };

  const getTypeLabel = (type: Partner['type']) => {
    switch (type) {
      case 'integrator': return 'Integrador';
      case 'referral': return 'Indicação / Afiliado';
      case 'maintenance': return 'Manutenção';
      case 'other': return 'Outros';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">Empresas Parceiras</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Gerencie sua rede de parceiros, integradores e afiliados.</p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-white dark:bg-[#231d0f]/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-1">
            <button 
              onClick={() => setViewType('grid')}
              className={cn(
                "p-2 rounded-xl transition-all",
                viewType === 'grid' ? "bg-[#fdb612] text-[#231d0f]" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setViewType('table')}
              className={cn(
                "p-2 rounded-xl transition-all",
                viewType === 'table' ? "bg-[#fdb612] text-[#231d0f]" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
          <button 
            onClick={() => {
              setSelectedPartner(null);
              setIsViewOnly(false);
              setIsModalOpen(true);
            }}
            className="bg-[#fdb612] hover:bg-[#fdb612]/90 text-[#231d0f] px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-[#fdb612]/20"
          >
            <Plus className="w-4 h-4" />
            Novo Parceiro
          </button>
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por nome, CNPJ ou contato..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-[#231d0f]/40 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-[#fdb612] transition-all"
          />
        </div>
        <button className="px-6 py-3 bg-white dark:bg-[#231d0f]/40 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-sm flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
          <Filter className="w-4 h-4" />
          Filtros
        </button>
      </div>

      {viewType === 'grid' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredPartners.map((partner) => (
            <div 
              key={partner.id}
              className="bg-white dark:bg-[#231d0f]/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setSelectedPartner(partner);
                      setIsViewOnly(true);
                      setIsModalOpen(true);
                    }}
                    className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-blue-500 hover:text-white transition-colors"
                    title="Visualizar"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedPartner(partner);
                      setIsViewOnly(false);
                      setIsModalOpen(true);
                    }}
                    className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-[#fdb612] hover:text-[#231d0f] transition-colors"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => {
                      setPartnerToDelete(partner);
                      setIsDeleteModalOpen(true);
                    }}
                    className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-rose-500 hover:text-white transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-5">
                <div className="size-16 rounded-2xl bg-[#fdb612]/10 flex items-center justify-center text-[#fdb612] shrink-0">
                  <Building2 className="w-8 h-8" />
                </div>
                <div className="space-y-4 flex-1">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">{partner.name}</h3>
                      {getStatusBadge(partner.status)}
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-xs font-black uppercase tracking-widest text-[#fdb612]">{getTypeLabel(partner.type)}</p>
                      {partner.cnpjStatus && (
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[9px] font-bold uppercase",
                          partner.cnpjStatus.toLowerCase().includes('ativa') 
                            ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"
                        )}>
                          CNPJ: {partner.cnpjStatus}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <User className="w-4 h-4" />
                        <span className="font-bold text-slate-700 dark:text-slate-300">{partner.contactName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Mail className="w-4 h-4" />
                        <span>{partner.email}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Phone className="w-4 h-4" />
                        <span>{partner.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Briefcase className="w-4 h-4" />
                        <span className="font-bold text-emerald-600">Comissão: {partner.commissionRate}%</span>
                      </div>
                    </div>
                  </div>

                  {partner.address && (
                    <div className="flex items-start gap-2 text-xs text-slate-400">
                      <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                      <p>{partner.address}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-[#231d0f]/40 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Parceiro</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Contato</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Tipo</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredPartners.map((partner) => (
                  <tr key={partner.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-[#fdb612]/10 flex items-center justify-center text-[#fdb612]">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-slate-100">{partner.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{partner.cnpj}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{partner.contactName}</p>
                      <p className="text-xs text-slate-400">{partner.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#fdb612]">{getTypeLabel(partner.type)}</span>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(partner.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => {
                            setSelectedPartner(partner);
                            setIsViewOnly(true);
                            setIsModalOpen(true);
                          }}
                          className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-400 hover:text-blue-500 rounded-lg transition-colors"
                          title="Visualizar"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedPartner(partner);
                            setIsViewOnly(false);
                            setIsModalOpen(true);
                          }}
                          className="p-2 hover:bg-amber-50 dark:hover:bg-amber-900/30 text-slate-400 hover:text-[#fdb612] rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            setPartnerToDelete(partner);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-2 hover:bg-rose-50 dark:hover:bg-rose-900/30 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Cadastro/Edição */}
      {isModalOpen && (
        <PartnerModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          partner={selectedPartner}
          isViewOnly={isViewOnly}
        />
      )}

      {/* Modal de Confirmação de Exclusão */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#231d0f] w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center">
              <div className="size-16 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center text-rose-600 mx-auto mb-4">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black mb-2">Excluir Parceiro?</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">Esta ação não pode ser desfeita. O parceiro <strong>{partnerToDelete?.name}</strong> será removido permanentemente.</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleDelete}
                  className="flex-1 px-4 py-3 bg-rose-500 text-white rounded-xl font-bold text-sm hover:bg-rose-600 transition-all active:scale-95"
                >
                  Confirmar Exclusão
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface PartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  partner: Partner | null;
  isViewOnly?: boolean;
}

const PartnerModal: React.FC<PartnerModalProps> = ({ isOpen, onClose, partner, isViewOnly = false }) => {
  const { showToast } = useToast();
  const [cnpjError, setCnpjError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [commissionError, setCommissionError] = useState<string | null>(null);
  const [isCnpjValidating, setIsCnpjValidating] = useState(false);
  const [formData, setFormData] = useState<Partial<Partner>>(
    partner || {
      name: '',
      cnpj: '',
      contactName: '',
      email: '',
      phone: '',
      type: 'integrator',
      status: 'active',
      commissionRate: 5,
      address: '',
      notes: ''
    }
  );

  const validateCNPJ = (cnpj: string) => {
    const cleaned = cnpj.replace(/\D/g, '');
    if (cleaned.length === 0) return true;
    if (cleaned.length !== 14) return false;
    
    if (/^(\d)\1+$/.test(cleaned)) return false;
    
    let size = cleaned.length - 2;
    let numbers = cleaned.substring(0, size);
    const digits = cleaned.substring(size);
    let sum = 0;
    let pos = size - 7;
    for (let i = size; i >= 1; i--) {
      sum += parseInt(numbers.charAt(size - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0))) return false;
    
    size = size + 1;
    numbers = cleaned.substring(0, size);
    sum = 0;
    pos = size - 7;
    for (let i = size; i >= 1; i--) {
      sum += parseInt(numbers.charAt(size - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(1))) return false;
    
    return true;
  };

  const formatCNPJ = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length === 0) return '';
    
    let formatted = cleaned;
    if (cleaned.length > 2) formatted = cleaned.substring(0, 2) + '.' + cleaned.substring(2);
    if (cleaned.length > 5) formatted = formatted.substring(0, 6) + '.' + formatted.substring(6);
    if (cleaned.length > 8) formatted = formatted.substring(0, 10) + '/' + formatted.substring(10);
    if (cleaned.length > 12) formatted = formatted.substring(0, 15) + '-' + formatted.substring(15);
    
    return formatted.substring(0, 18);
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      setEmailError('E-mail inválido');
      return false;
    }
    setEmailError(null);
    return true;
  };

  const validateCommission = (value: number) => {
    if (value < 0) {
      setCommissionError('A taxa deve ser positiva');
      return false;
    }
    setCommissionError(null);
    return true;
  };

  const handleCnpjChange = async (value: string) => {
    const formatted = formatCNPJ(value);
    setFormData({ ...formData, cnpj: formatted });
    
    const cleaned = formatted.replace(/\D/g, '');
    if (cleaned.length === 14) {
      setIsCnpjValidating(true);
      setCnpjError(null);
      
      try {
        const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleaned}`);
        if (response.ok) {
          const data = await response.json();
          setFormData(prev => ({
            ...prev,
            name: data.razao_social || prev.name,
            address: `${data.logradouro}, ${data.numero}${data.complemento ? ' - ' + data.complemento : ''}, ${data.bairro}, ${data.municipio} - ${data.uf}` || prev.address,
            cnpjStatus: data.descricao_situacao_cadastral,
            notes: `Situação Cadastral: ${data.descricao_situacao_cadastral}\nData Situação: ${data.data_situacao_cadastral}\nCapital Social: R$ ${data.capital_social?.toLocaleString('pt-BR')}`
          }));
          showToast(`CNPJ validado: ${data.descricao_situacao_cadastral}`);
        } else {
          setCnpjError('CNPJ não encontrado ou erro na consulta.');
        }
      } catch (error) {
        setCnpjError('Erro ao consultar CNPJ.');
      } finally {
        setIsCnpjValidating(false);
      }
    } else if (cleaned.length > 0 && cleaned.length < 14) {
      setCnpjError('CNPJ deve conter 14 dígitos');
    } else {
      setCnpjError(null);
    }
  };

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length === 0) return '';
    
    let formatted = cleaned;
    if (cleaned.length <= 2) {
      formatted = `(${cleaned}`;
    } else if (cleaned.length <= 6) {
      formatted = `(${cleaned.substring(0, 2)}) ${cleaned.substring(2)}`;
    } else if (cleaned.length <= 10) {
      formatted = `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 6)}-${cleaned.substring(6)}`;
    } else {
      formatted = `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}-${cleaned.substring(7, 11)}`;
    }
    return formatted;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.cnpj && !validateCNPJ(formData.cnpj)) {
      setCnpjError('CNPJ inválido. O CNPJ deve conter 14 números.');
      return;
    }

    try {
      if (partner) {
        await updateDocument('partners', partner.id, formData);
      } else {
        await createDocument('partners', {
          ...formData,
          createdAt: new Date().toISOString()
        });
      }
      onClose();
    } catch (error) {
      console.error('Error saving partner:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#231d0f] w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-white/5">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-[#fdb612]/20 rounded-xl flex items-center justify-center text-[#fdb612]">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-black tracking-tight">
              {isViewOnly ? 'Visualizar Parceiro' : partner ? 'Editar Parceiro' : 'Novo Parceiro'}
            </h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
            <Plus className="w-5 h-5 rotate-45" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto max-h-[75vh] custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Razão Social / Nome</label>
              <input 
                required
                disabled={isViewOnly}
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612] transition-all disabled:opacity-70"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">CNPJ</label>
                {isCnpjValidating && (
                  <span className="flex items-center gap-1 text-[9px] font-bold text-blue-500">
                    <Loader2 className="w-3 h-3 animate-spin" /> VALIDANDO...
                  </span>
                )}
              </div>
              <input 
                required
                disabled={isViewOnly}
                type="text" 
                value={formData.cnpj}
                onChange={(e) => handleCnpjChange(e.target.value)}
                placeholder="00.000.000/0000-00"
                className={cn(
                  "w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612] transition-all disabled:opacity-70",
                  cnpjError ? "border-red-500" : "border-slate-200 dark:border-slate-800"
                )}
              />
              {cnpjError && <p className="text-[10px] text-red-500 font-bold">{cnpjError}</p>}
              {formData.cnpjStatus && !cnpjError && (
                <p className={cn(
                  "text-[10px] font-bold uppercase mt-1",
                  formData.cnpjStatus.toLowerCase().includes('ativa') ? "text-emerald-500" : "text-rose-500"
                )}>
                  Status CNPJ: {formData.cnpjStatus}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pessoa de Contato</label>
              <input 
                required
                disabled={isViewOnly}
                type="text" 
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612] transition-all disabled:opacity-70"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Telefone / WhatsApp</label>
              <input 
                required
                disabled={isViewOnly}
                type="text" 
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612] transition-all disabled:opacity-70"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">E-mail</label>
              <input 
                required
                disabled={isViewOnly}
                type="email" 
                value={formData.email}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({ ...formData, email: val });
                  validateEmail(val);
                }}
                className={cn(
                  "w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612] transition-all disabled:opacity-70",
                  emailError ? "border-red-500" : "border-slate-200 dark:border-slate-800"
                )}
              />
              {emailError && <p className="text-[10px] text-red-500 font-bold">{emailError}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tipo de Parceria</label>
              <select 
                disabled={isViewOnly}
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612] transition-all disabled:opacity-70"
              >
                <option value="integrator">Integrador</option>
                <option value="referral">Indicação / Afiliado</option>
                <option value="maintenance">Manutenção</option>
                <option value="other">Outros</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Taxa de Comissão (%)</label>
              <input 
                disabled={isViewOnly}
                type="number" 
                value={formData.commissionRate}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setFormData({ ...formData, commissionRate: val });
                  validateCommission(val);
                }}
                className={cn(
                  "w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612] transition-all disabled:opacity-70",
                  commissionError ? "border-red-500" : "border-slate-200 dark:border-slate-800"
                )}
              />
              {commissionError && <p className="text-[10px] text-red-500 font-bold">{commissionError}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</label>
              <select 
                disabled={isViewOnly}
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612] transition-all disabled:opacity-70"
              >
                <option value="active">Ativo</option>
                <option value="pending">Pendente</option>
                <option value="inactive">Inativo</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Endereço Completo</label>
            <input 
              disabled={isViewOnly}
              type="text" 
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612] transition-all disabled:opacity-70"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Observações Internas</label>
            <textarea 
              disabled={isViewOnly}
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612] transition-all resize-none disabled:opacity-70"
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-4 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all"
            >
              {isViewOnly ? 'Fechar' : 'Cancelar'}
            </button>
            {!isViewOnly && (
              <button 
                type="submit"
                className="flex-[2] px-4 py-4 bg-[#fdb612] text-[#231d0f] rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-[#fdb612]/20 transition-all active:scale-95"
              >
                {partner ? 'Salvar Alterações' : 'Cadastrar Parceiro'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
