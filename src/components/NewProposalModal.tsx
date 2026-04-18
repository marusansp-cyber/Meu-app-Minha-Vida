import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  FileText, 
  User, 
  Zap, 
  DollarSign, 
  Calendar, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Search, 
  Info, 
  CreditCard, 
  CheckCircle2,
  RefreshCw,
  Mail,
  Phone,
  Building2,
  Plus,
  LayoutGrid,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Sun,
  Lock,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Proposal, Kit, User as UserType, Lead, Client } from '../types';
import { syncCollection, updateDocument } from '../firestoreUtils';

interface NewProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (proposal: Proposal) => void;
  initialData?: Proposal | null;
  user: UserType | null;
  leads?: Lead[];
  clients?: Client[];
}

type Step = 'ucs' | 'kit' | 'pricing' | 'financing' | 'finalization';

const STEPS: { id: Step; label: string; icon: any }[] = [
  { id: 'ucs', label: 'Cadastro UCs', icon: User },
  { id: 'kit', label: 'Kit FV', icon: Zap },
  { id: 'pricing', label: 'Precificação', icon: DollarSign },
  { id: 'financing', label: 'Financiamento', icon: CreditCard },
  { id: 'finalization', label: 'Finalização', icon: CheckCircle2 },
];

export const NewProposalModal: React.FC<NewProposalModalProps> = ({ isOpen, onClose, onAdd, initialData, user, leads = [], clients = [] }) => {
  const [currentStep, setCurrentStep] = useState<Step>('ucs');
  const [kits, setKits] = useState<Kit[]>([]);
  const [selectedKit, setSelectedKit] = useState<Kit | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  const [selectedKitId, setSelectedKitId] = useState<string>('');
  const [toast, setToast] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [losses, setLosses] = useState<number>(25);
  const [efficiency, setEfficiency] = useState<number>(109.54);

  const filteredClients = useMemo(() => {
    if (!clientSearchTerm.trim()) return [];
    
    const term = clientSearchTerm.toLowerCase();
    
    const clientMatches = clients.map(c => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      source: 'Cliente' as const
    })).filter(c => c.name.toLowerCase().includes(term) || c.email.toLowerCase().includes(term));

    const leadMatches = leads.map(l => ({
      id: l.id,
      name: l.name,
      email: l.email,
      phone: l.phone,
      ucNumber: l.id, // Some leads might use ID as UC or something else, but ucNumber isn't in Lead type usually
      source: 'Lead' as const
    })).filter(l => l.name.toLowerCase().includes(term) || l.email.toLowerCase().includes(term));

    return [...clientMatches, ...leadMatches].slice(0, 5);
  }, [clientSearchTerm, clients, leads]);

  const selectSuggestedClient = (suggestion: any) => {
    setFormData(prev => ({
      ...prev,
      client: suggestion.name,
      email: suggestion.email,
      ucNumber: suggestion.ucNumber || prev.ucNumber
    }));
    setClientSearchTerm('');
    setShowClientSuggestions(false);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };


  const [formData, setFormData] = useState({
    client: initialData?.client || '',
    value: initialData?.value.replace('R$ ', '').replace(/\./g, '').replace(',', '.') || '',
    systemSize: initialData?.systemSize.replace(' kWp', '') || '',
    representative: initialData?.representative || 'Marusan Pinto',
    roi: initialData?.roi || '385%',
    payback: initialData?.payback?.replace(' Anos', '') || '4.2',
    feasibilityStudy: initialData?.feasibilityStudy || '',
    commission: initialData?.commission?.toString() || '5',
    expiryDate: initialData?.expiryDate || '',
    ucNumber: initialData?.ucNumber || '',
    energyConsumption: initialData?.energyConsumption || '',
    kitId: initialData?.kitId || '',
    discount: initialData?.discount?.toString() || '0',
    financingBank: initialData?.financingBank || 'Nenhum',
    financingInstallments: initialData?.financingInstallments?.toString() || '0',
    email: initialData?.email || '',
  });
  const [roiError, setRoiError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const unsubscribe = syncCollection<Kit>('kits', setKits, 'createdAt');
      return () => unsubscribe();
    }
  }, [isOpen]);

  const calculateAutomaticValues = (value: string, size: string) => {
    const val = parseFloat(value);
    const sz = parseFloat(size);
    if (!isNaN(val) && !isNaN(sz) && val > 0 && sz > 0) {
      // Mock calculation for solar
      const annualSavings = sz * 1200 * 0.95; // ~1200kWh per kWp per year
      const pb = (val / annualSavings).toFixed(1);
      const totalSavings = annualSavings * 25;
      const r = (((totalSavings - val) / val) * 100).toFixed(0);
      
      setFormData(prev => ({
        ...prev,
        payback: pb,
        roi: `${r}%`
      }));
    }
  };

  const set15DaysExpiry = () => {
    const date = new Date();
    date.setDate(date.getDate() + 15);
    setFormData(prev => ({ ...prev, expiryDate: date.toISOString().split('T')[0] }));
  };

  const handleAutoCalculateSystemSize = () => {
    const consumption = parseFloat(formData.energyConsumption);
    if (!isNaN(consumption) && consumption > 0) {
      const panelPower = 0.61;
      const numPanels = Math.ceil(consumption / (efficiency * panelPower));
      const calculatedSize = numPanels * panelPower;
      setFormData(prev => ({ ...prev, systemSize: calculatedSize.toFixed(2) }));
      showToast(`Potência calculada: ${calculatedSize.toFixed(2)} kWp (${numPanels} painéis de 610Wp)`);
    } else {
      showToast('Por favor, insira o consumo mensal primeiro.');
    }
  };

  const estimatedGeneration = parseFloat(formData.systemSize) * efficiency;

  const validateStep = (step: Step): boolean => {
    const errors: Record<string, string> = {};
    
    if (step === 'ucs') {
      if (!formData.client?.trim()) errors.client = 'Nome do cliente é obrigatório';
      if (!formData.email?.trim()) {
        errors.email = 'E-mail do cliente é obrigatório';
      } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email)) {
        errors.email = 'E-mail inválido';
      }
      if (!formData.ucNumber?.trim()) errors.ucNumber = 'Número da UC é obrigatório';
      if (!formData.energyConsumption || parseFloat(formData.energyConsumption) <= 0) {
        errors.energyConsumption = 'Consumo mensal deve ser maior que zero';
      }
      if (!formData.value || parseFloat(formData.value) <= 0) {
        errors.value = 'Valor da conta deve ser maior que zero';
      }
    } else if (step === 'kit') {
      if (!formData.kitId) errors.kit = 'Por favor, selecione um kit para continuar';
      if (!formData.systemSize || parseFloat(formData.systemSize) <= 0) {
        errors.systemSize = 'Tamanho do sistema deve ser maior que zero';
      }
    } else if (step === 'pricing') {
      if (!formData.value || parseFloat(formData.value) <= 0) {
        errors.value = 'Valor total deve ser maior que zero';
      }
      if (parseFloat(formData.discount) < 0) errors.discount = 'Desconto não pode ser negativo';
      if (!formData.roi?.trim()) errors.roi = 'ROI é obrigatório';
      if (!formData.payback?.trim()) errors.payback = 'Payback é obrigatório';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };


  const validateROI = (value: string) => {
    const roiRegex = /^\d+(\.\d+)?%$/;
    if (value && !roiRegex.test(value)) {
      setRoiError('Formato inválido. Use apenas números e o símbolo % (ex: 14.5%).');
    } else {
      setRoiError(null);
    }
  };

  const filteredKits = useMemo(() => {
    let filtered = kits;
    if (!searchTerm) return filtered;
    const term = searchTerm.toLowerCase();
    return filtered.filter(kit => 
      kit.name.toLowerCase().includes(term) ||
      kit.description.toLowerCase().includes(term) ||
      kit.power.toString().includes(term)
    );
  }, [kits, searchTerm]);

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        client: initialData.client || '',
        value: initialData.value.replace('R$ ', '').replace(/\./g, '').replace(',', '.') || '',
        systemSize: initialData.systemSize.replace(' kWp', '') || '',
        representative: initialData.representative || 'Marusan Pinto',
        roi: initialData.roi || '385%',
        payback: initialData.payback?.replace(' Anos', '') || '4.2',
        feasibilityStudy: initialData.feasibilityStudy || '',
        commission: initialData.commission?.toString() || '5',
        expiryDate: initialData.expiryDate || '',
        ucNumber: initialData.ucNumber || '',
        energyConsumption: initialData.energyConsumption || '',
        kitId: initialData.kitId || '',
        discount: initialData.discount?.toString() || '0',
        financingBank: initialData.financingBank || 'Nenhum',
        financingInstallments: initialData.financingInstallments?.toString() || '0',
        email: initialData.email || '',
      });
      setCurrentStep('ucs');
    } else {
      setFormData({
        client: '',
        value: '',
        systemSize: '',
        representative: 'Marusan Pinto',
        roi: '385%',
        payback: '4.2',
        feasibilityStudy: '',
        commission: '5',
        expiryDate: '',
        ucNumber: '',
        energyConsumption: '',
        kitId: '',
        discount: '0',
        financingBank: 'Nenhum',
        financingInstallments: '0',
      });
      setCurrentStep('ucs');
    }
  }, [initialData, isOpen]);

  const handleKitSelect = (kit: Kit) => {
    setSelectedKit(kit);
    setFormData(prev => ({
      ...prev,
      kitId: kit.id,
      systemSize: kit.power.toString(),
      value: kit.price.toString()
    }));
    calculateAutomaticValues(kit.price.toString(), kit.power.toString());
  };

  const nextStep = () => {
    if (!validateStep(currentStep)) {
      showToast('Por favor, corrija os erros antes de prosseguir.');
      return;
    }
    const currentIndex = STEPS.findIndex(s => s.id === currentStep);
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1].id);
    }
  };

  const prevStep = () => {
    const currentIndex = STEPS.findIndex(s => s.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1].id);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep('pricing')) {
      showToast('Por favor, verifique os dados de precificação.');
      return;
    }

    const totalVal = parseFloat(formData.value) - parseFloat(formData.discount);
    
    const proposalData: Proposal = {
      id: initialData?.id || '',
      client: formData.client,
      value: `R$ ${totalVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      date: initialData?.date || new Date().toLocaleDateString('pt-BR'),
      status: initialData?.status || 'pending',
      systemSize: `${formData.systemSize} kWp`,
      representative: formData.representative,
      roi: formData.roi || null,
      payback: formData.payback ? `${formData.payback} Anos` : null,
      feasibilityStudy: formData.feasibilityStudy || null,
      commission: parseFloat(formData.commission) || 0,
      commissionStatus: initialData?.commissionStatus || 'pending',
      expiryDate: formData.expiryDate || null,
      ucNumber: formData.ucNumber || null,
      energyConsumption: formData.energyConsumption || null,
      kitId: formData.kitId || null,
      discount: parseFloat(formData.discount) || 0,
      financingBank: formData.financingBank || null,
      financingInstallments: parseInt(formData.financingInstallments) || 0,
      email: formData.email || null
    };

    onAdd(proposalData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      {toast && (
        <div className="fixed bottom-8 right-8 z-[200] bg-[#231d0f] text-white px-6 py-3 rounded-xl shadow-2xl border border-[#fdb612]/30 animate-in slide-in-from-right duration-300 flex items-center gap-3">
          <div className="size-2 bg-[#fdb612] rounded-full animate-pulse" />
          <span className="font-bold text-sm">{toast}</span>
        </div>
      )}

      <div className="bg-white dark:bg-[#231d0f] w-full max-w-4xl rounded-[40px] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-white/5 shrink-0">
          <div className="flex items-center gap-4">
            <div className="size-12 bg-[#fdb612]/20 rounded-2xl flex items-center justify-center text-[#fdb612]">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-black tracking-tight">{initialData ? 'Editar Proposta' : 'Nova Proposta Solar'}</h3>
              <p className="text-sm text-slate-500 font-medium">Configuração avançada de proposta</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="px-8 py-6 bg-slate-50/50 dark:bg-white/5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="relative flex justify-between items-center max-w-3xl mx-auto">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 z-0" />
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const currentIndex = STEPS.findIndex(s => s.id === currentStep);
              const stepIndex = index;
              const isActive = currentStep === step.id;
              const isCompleted = currentIndex > stepIndex;

              return (
                <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
                  <button 
                    onClick={() => setCurrentStep(step.id)}
                    className={cn(
                      "size-10 rounded-full flex items-center justify-center font-bold text-sm transition-all border-2",
                      isActive 
                        ? "bg-[#fdb612] border-[#fdb612] text-[#231d0f] shadow-lg shadow-[#fdb612]/20" 
                        : isCompleted 
                          ? "bg-emerald-500 border-emerald-500 text-white" 
                          : "bg-white dark:bg-[#231d0f] border-slate-200 dark:border-slate-800 text-slate-400"
                    )}
                  >
                    {isCompleted ? <Check className="w-5 h-5" /> : index + 1}
                  </button>
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest",
                    isActive ? "text-[#fdb612]" : "text-slate-400"
                  )}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-8">
            {currentStep === 'ucs' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Cliente</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        type="text" 
                        required
                        value={formData.client || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFormData({ ...formData, client: value });
                          setClientSearchTerm(value);
                          setShowClientSuggestions(true);
                          if (validationErrors.client) {
                            setValidationErrors(prev => {
                              const next = { ...prev };
                              delete next.client;
                              return next;
                            });
                          }
                        }}
                        onBlur={() => setTimeout(() => setShowClientSuggestions(false), 200)}
                        placeholder="Nome do cliente ou empresa"
                        className={cn(
                          "w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border rounded-2xl outline-none focus:ring-2 focus:ring-[#fdb612] transition-all",
                          validationErrors.client ? "border-rose-500 ring-rose-500/20" : "border-slate-200 dark:border-slate-800"
                        )}
                      />
                      
                      {showClientSuggestions && filteredClients.length > 0 && (
                        <div className="absolute z-[100] top-full left-0 w-full mt-2 bg-white dark:bg-[#231d0f] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                          {filteredClients.map((suggestion, idx) => (
                            <button
                              key={`${suggestion.id}-${idx}`}
                              type="button"
                              onClick={() => selectSuggestedClient(suggestion)}
                              className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/5 transition-colors border-b last:border-none border-slate-100 dark:border-slate-800"
                            >
                              <div className="text-left">
                                <p className="text-sm font-bold">{suggestion.name}</p>
                                <p className="text-[10px] text-slate-400">{suggestion.email}</p>
                              </div>
                              <span className={cn(
                                "text-[10px] font-black px-2 py-0.5 rounded-full uppercase",
                                suggestion.source === 'Cliente' 
                                  ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                                  : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                              )}>
                                {suggestion.source}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}

                      {validationErrors.client && (
                        <p className="text-[10px] font-bold text-rose-500 mt-1 ml-4">{validationErrors.client}</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">E-mail do Cliente</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        type="email" 
                        value={formData.email || ''}
                        onChange={(e) => {
                          setFormData({ ...formData, email: e.target.value });
                          if (validationErrors.email) {
                            setValidationErrors(prev => {
                              const next = { ...prev };
                              delete next.email;
                              return next;
                            });
                          }
                        }}
                        placeholder="exemplo@email.com"
                        className={cn(
                          "w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border rounded-2xl outline-none focus:ring-2 focus:ring-[#fdb612] transition-all",
                          validationErrors.email ? "border-rose-500 ring-rose-500/20" : "border-slate-200 dark:border-slate-800"
                        )}
                      />
                      {validationErrors.email && (
                        <p className="text-[10px] font-bold text-rose-500 mt-1 ml-4">{validationErrors.email}</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Número da UC</label>
                    <input 
                      type="text" 
                      value={formData.ucNumber || ''}
                      onChange={(e) => {
                        setFormData({ ...formData, ucNumber: e.target.value });
                        if (validationErrors.ucNumber) {
                          setValidationErrors(prev => {
                            const next = { ...prev };
                            delete next.ucNumber;
                            return next;
                          });
                        }
                      }}
                      placeholder="0000000000"
                      className={cn(
                        "w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border rounded-2xl outline-none focus:ring-2 focus:ring-[#fdb612] transition-all",
                        validationErrors.ucNumber ? "border-rose-500 ring-rose-500/20" : "border-slate-200 dark:border-slate-800"
                      )}
                    />
                    {validationErrors.ucNumber && (
                      <p className="text-[10px] font-bold text-rose-500 mt-1 ml-4">{validationErrors.ucNumber}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black uppercase tracking-widest text-slate-400">Consumo Mensal (kWh)</label>
                      <button 
                        type="button"
                        onClick={handleAutoCalculateSystemSize}
                        className="text-[10px] font-black uppercase tracking-widest text-[#fdb612] hover:underline flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Automático
                      </button>
                    </div>
                    <input 
                      type="number" 
                      value={formData.energyConsumption || ''}
                      onChange={(e) => {
                        setFormData({ ...formData, energyConsumption: e.target.value });
                        if (validationErrors.energyConsumption) {
                          setValidationErrors(prev => {
                            const next = { ...prev };
                            delete next.energyConsumption;
                            return next;
                          });
                        }
                      }}
                      placeholder="Ex: 1300"
                      className={cn(
                        "w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border rounded-2xl outline-none focus:ring-2 focus:ring-[#fdb612] transition-all",
                        validationErrors.energyConsumption ? "border-rose-500 ring-rose-500/20" : "border-slate-200 dark:border-slate-800"
                      )}
                    />
                    {validationErrors.energyConsumption && (
                      <p className="text-[10px] font-bold text-rose-500 mt-1 ml-4">{validationErrors.energyConsumption}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Valor da Conta (R$)</label>
                    <input 
                      type="number" 
                      value={formData.value || ''}
                      onChange={(e) => {
                        setFormData({ ...formData, value: e.target.value });
                        if (validationErrors.value) {
                          setValidationErrors(prev => {
                            const next = { ...prev };
                            delete next.value;
                            return next;
                          });
                        }
                      }}
                      placeholder="Ex: 350"
                      className={cn(
                        "w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border rounded-2xl outline-none focus:ring-2 focus:ring-[#fdb612] transition-all",
                        validationErrors.value ? "border-rose-500 ring-rose-500/20" : "border-slate-200 dark:border-slate-800"
                      )}
                    />
                    {validationErrors.value && (
                      <p className="text-[10px] font-bold text-rose-500 mt-1 ml-4">{validationErrors.value}</p>
                    )}
                  </div>
                </div>

                <div className="p-6 bg-[#0a3d54] rounded-3xl text-white border border-white/10">
                  <div className="flex items-center gap-2 text-[#fdb612] mb-4">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Prévia de Geração</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Potência Calculada</label>
                      <p className="text-2xl font-black">{formData.systemSize || '0.00'} <span className="text-sm font-normal text-slate-400">kWp</span></p>
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Perdas Estimadas</label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          value={losses || 0}
                          onChange={(e) => setLosses(Number(e.target.value))}
                          className="w-16 bg-white/10 border-none rounded p-1 text-sm focus:ring-1 focus:ring-[#fdb612]"
                        />
                        <span className="text-sm font-bold">%</span>
                      </div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                      <label className="text-[10px] font-black uppercase text-[#fdb612] block mb-1">Geração Mensal</label>
                      <p className="text-2xl font-black text-emerald-400">
                        {(!isNaN(estimatedGeneration) ? estimatedGeneration : 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        <span className="text-sm font-normal text-slate-400 ml-1">kWh/mês</span>
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">({efficiency} kWh/kWp.mês)</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button 
                    type="button"
                    onClick={nextStep}
                    className="px-8 py-3 bg-[#fdb612] text-[#231d0f] rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-all"
                  >
                    Próximo Passo
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {currentStep === 'kit' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-slate-400">Tamanho do Sistema (kWp)</label>
                      <input 
                        type="number" 
                        step="0.1"
                        value={formData.systemSize || ''}
                        onChange={(e) => setFormData({ ...formData, systemSize: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-[#fdb612] transition-all"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        type="button"
                        className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl hover:border-[#fdb612] hover:bg-[#fdb612]/5 transition-all group"
                      >
                        <Plus className="w-6 h-6 text-slate-400 group-hover:text-[#fdb612] mb-2" />
                        <span className="text-[10px] font-black uppercase text-slate-400 group-hover:text-[#fdb612]">Editar Kit</span>
                      </button>
                      <button 
                        type="button"
                        className="flex flex-col items-center justify-center p-6 bg-[#0a3d54] text-white rounded-2xl hover:opacity-90 transition-all cursor-default"
                      >
                        <LayoutGrid className="w-6 h-6 mb-2" />
                        <span className="text-[10px] font-black uppercase">Kits Registrados</span>
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-900 rounded-3xl p-6 text-white leading-relaxed">
                    <h4 className="text-xs font-black uppercase tracking-widest text-[#fdb612] mb-4 flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Kits Disponíveis
                    </h4>
                    
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input 
                        type="text"
                        placeholder="Buscar por nome ou potência..."
                        value={searchTerm || ''}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:ring-1 focus:ring-[#fdb612] outline-none"
                      />
                    </div>

                    {filteredKits.length > 0 ? (
                      <div className="grid grid-cols-1 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {filteredKits.map(kit => (
                          <div 
                            key={kit.id}
                            onClick={() => {
                              setSelectedKitId(kit.id);
                              handleKitSelect(kit);
                            }}
                            className={cn(
                              "p-4 rounded-2xl border transition-all cursor-pointer group",
                              selectedKitId === kit.id 
                                ? "bg-[#fdb612]/10 border-[#fdb612]" 
                                : "border-white/10 hover:border-white/20 bg-white/5"
                            )}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h5 className="font-bold text-slate-100">{kit.name}</h5>
                                <p className="text-xs text-slate-500">{kit.power} kWp</p>
                              </div>
                              <span className="text-sm font-black text-[#fdb612]">
                                R$ {kit.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 line-clamp-2 mb-4">{kit.description}</p>
                            <div className="flex justify-end">
                              <div className={cn(
                                "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                                selectedKitId === kit.id 
                                  ? "bg-[#fdb612] text-slate-900" 
                                  : "bg-white/10 text-white group-hover:bg-white/20"
                              )}>
                                {selectedKitId === kit.id ? (
                                  <>Selecionado <Check className="w-3 h-3" /></>
                                ) : (
                                  <>Selecionar <ChevronRight className="w-3 h-3" /></>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-20 text-center text-slate-500">
                        <Zap className="w-10 h-10 mb-4 opacity-20" />
                        <p className="text-sm font-medium">Nenhum kit encontrado.</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-between">
                  <button 
                    type="button"
                    onClick={prevStep}
                    className="px-8 py-3 border border-slate-200 dark:border-slate-800 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                  >
                    <ArrowRight className="w-4 h-4 rotate-180" />
                    Voltar
                  </button>
                  <button 
                    type="button"
                    onClick={nextStep}
                    className="px-8 py-3 bg-[#fdb612] text-[#231d0f] rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-all"
                  >
                    Próximo Passo
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {currentStep === 'pricing' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Valor do Kit (R$)</label>
                    <input 
                      type="number" 
                      value={formData.value || ''}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-[#fdb612] transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Desconto (R$)</label>
                    <input 
                      type="number" 
                      value={formData.discount || ''}
                      onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-[#fdb612] transition-all"
                    />
                  </div>
                  {(user?.role === 'admin' || user?.role === 'finance') && (
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-slate-400">Comissão (%)</label>
                      <input 
                        type="number" 
                        value={formData.commission || ''}
                        onChange={(e) => setFormData({ ...formData, commission: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-[#fdb612] transition-all"
                      />
                    </div>
                  )}
                  
                  {/* Calculated Values */}
                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-slate-800">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Valor Total da Proposta</label>
                      <p className="text-2xl font-black text-[#fdb612]">
                        R$ {(parseFloat(formData.value || '0') - parseFloat(formData.discount || '0')).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-[10px] text-slate-500 italic">Valor final para o cliente (Kit - Desconto)</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Comissão do Consultor</label>
                      <p className="text-2xl font-black text-emerald-500">
                        R$ {((parseFloat(formData.value || '0') - parseFloat(formData.discount || '0')) * (parseFloat(formData.commission || '0') / 100)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-[10px] text-slate-500 italic">Baseado em {formData.commission}% do valor total</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">ROI Estimado</label>
                    <input 
                      type="text" 
                      value={formData.roi || ''}
                      onChange={(e) => setFormData({ ...formData, roi: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-[#fdb612] transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Payback (Anos)</label>
                    <input 
                      type="text" 
                      value={formData.payback || ''}
                      onChange={(e) => setFormData({ ...formData, payback: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-[#fdb612] transition-all"
                    />
                  </div>
                </div>
                <div className="flex justify-between">
                  <button 
                    type="button"
                    onClick={prevStep}
                    className="px-8 py-3 border border-slate-200 dark:border-slate-800 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                  >
                    <ArrowRight className="w-4 h-4 rotate-180" />
                    Voltar
                  </button>
                  <button 
                    type="button"
                    onClick={nextStep}
                    className="px-8 py-3 bg-[#fdb612] text-[#231d0f] rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-all"
                  >
                    Próximo Passo
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {currentStep === 'financing' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { bank: 'Banco Marusan', rate: 0.99, term: 96, highlight: true },
                    { bank: 'Santander', rate: 1.29, term: 72 },
                    { bank: 'BV Financeira', rate: 1.35, term: 84 },
                  ].map((option) => (
                    <div 
                      key={option.bank}
                      onClick={() => {
                        setFormData({ 
                          ...formData, 
                          financingBank: option.bank,
                          financingInstallments: option.term.toString()
                        });
                      }}
                      className={cn(
                        "p-6 rounded-3xl border transition-all cursor-pointer text-center relative overflow-hidden",
                        formData.financingBank === option.bank 
                          ? "border-[#fdb612] bg-[#fdb612]/5 shadow-lg shadow-[#fdb612]/10" 
                          : "border-slate-100 dark:border-slate-800 hover:border-slate-200 bg-white dark:bg-[#231d0f]/20"
                      )}
                    >
                      {option.highlight && (
                        <div className="absolute top-0 right-0 bg-[#fdb612] text-[#231d0f] text-[8px] font-black px-2 py-1 rounded-bl-lg uppercase">Exclusivo</div>
                      )}
                      <p className={cn("text-xs font-bold mb-4", option.highlight ? "text-[#fdb612]" : "text-slate-400")}>{option.bank}</p>
                      <p className="text-2xl font-black">{option.rate}%</p>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Taxa a.m.</p>
                      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <p className="font-bold text-blue-500">{option.term}x</p>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Prazo Máximo</p>
                      </div>
                    </div>
                  ))}
                </div>

                {formData.financingBank !== 'Nenhum' && (
                  <div className="p-8 bg-slate-50 dark:bg-white/5 rounded-[32px] border border-slate-100 dark:border-slate-800 space-y-6">
                    <div className="flex items-center gap-2 text-[#fdb612]">
                      <CreditCard className="w-5 h-5" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Simulador de Parcelas</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest text-slate-400">Número de Parcelas</label>
                          <select 
                            value={formData.financingInstallments || ''}
                            onChange={(e) => setFormData({ ...formData, financingInstallments: e.target.value })}
                            className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612]"
                          >
                            {[12, 24, 36, 48, 60, 72, 84, 96].map(n => (
                              <option key={n} value={n}>{n}x</option>
                            ))}
                          </select>
                        </div>
                        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                          <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Valor Financiado</p>
                          <p className="text-xl font-black">R$ {(parseFloat(formData.value || '0') - parseFloat(formData.discount || '0')).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                      </div>

                      <div className="bg-[#fdb612] p-6 rounded-2xl text-[#231d0f] flex flex-col justify-center">
                        <p className="text-[10px] font-black uppercase opacity-60 mb-1">Parcela Estimada</p>
                        <p className="text-4xl font-black">
                          {(() => {
                            const principal = parseFloat(formData.value || '0') - parseFloat(formData.discount || '0');
                            const installments = parseInt(formData.financingInstallments || '1');
                            const bank = [
                              { bank: 'Banco Marusan', rate: 0.99 },
                              { bank: 'Santander', rate: 1.29 },
                              { bank: 'BV Financeira', rate: 1.35 },
                            ].find(b => b.bank === formData.financingBank);
                            
                            const rate = (bank?.rate || 1.29) / 100;
                            // PMT = P * [r(1+r)^n] / [(1+r)^n - 1]
                            const pmt = principal * (rate * Math.pow(1 + rate, installments)) / (Math.pow(1 + rate, installments) - 1);
                            
                            return `R$ ${pmt.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                          })()}
                        </p>
                        <p className="text-[10px] font-bold mt-2 opacity-60">* Sujeito a análise de crédito e variação de taxas.</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between">
                  <button 
                    type="button"
                    onClick={prevStep}
                    className="px-8 py-3 border border-slate-200 dark:border-slate-800 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                  >
                    <ArrowRight className="w-4 h-4 rotate-180" />
                    Voltar
                  </button>
                  <button 
                    type="button"
                    onClick={nextStep}
                    className="px-8 py-3 bg-[#fdb612] text-[#231d0f] rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-all"
                  >
                    Próximo Passo
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {currentStep === 'finalization' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-emerald-50 dark:bg-emerald-900/10 p-12 rounded-[40px] border border-emerald-100 dark:border-emerald-800 text-center">
                  <div className="size-20 bg-emerald-500 text-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-500/20">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h4 className="text-3xl font-black mb-4">Proposta Pronta!</h4>
                  <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-12">
                    Todos os dados foram configurados e validados. Clique abaixo para salvar a proposta e gerar o documento final.
                  </p>
                  <button 
                    type="submit"
                    className="w-full py-5 bg-[#fdb612] text-[#231d0f] rounded-2xl font-black text-lg hover:shadow-2xl hover:shadow-[#fdb612]/30 transition-all active:scale-95"
                  >
                    CRIAR PROPOSTA FINAL
                  </button>
                </div>
                <div className="flex justify-start">
                  <button 
                    type="button"
                    onClick={prevStep}
                    className="px-8 py-3 border border-slate-200 dark:border-slate-800 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                  >
                    <ArrowRight className="w-4 h-4 rotate-180" />
                    Voltar
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
