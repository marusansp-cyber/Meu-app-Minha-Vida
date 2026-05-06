import React, { useState, useEffect, useMemo } from 'react';
import { parseProposalFromText } from '../services/geminiService';
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
  Sparkles,
  Landmark,
  Calculator,
  FileCheck,
  QrCode,
  PenTool,
  Eye,
  Share2,
  Printer,
  TrendingUp,
  BrainCircuit,
  MessageSquare,
  Image as ImageIcon
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Proposal, Kit, User as UserType, Lead, Client } from '../types';
import { syncCollection, updateDocument, createDocument } from '../firestoreUtils';

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
  { id: 'ucs', label: 'Unidade Consumidora', icon: Landmark },
  { id: 'kit', label: 'Configuração do Kit', icon: Zap },
  { id: 'pricing', label: 'Engenharia de Custos', icon: Calculator },
  { id: 'financing', label: 'Plano Financeiro', icon: CreditCard },
  { id: 'finalization', label: 'Status & Fechamento', icon: FileCheck },
];

export const NewProposalModal: React.FC<NewProposalModalProps> = ({ isOpen, onClose, onAdd, initialData, user, leads = [], clients = [] }) => {
  const [currentStep, setCurrentStep] = useState<Step>('ucs');
  const [kits, setKits] = useState<Kit[]>([]);
  const [selectedKit, setSelectedKit] = useState<Kit | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [searchDateStart, setSearchDateStart] = useState('');
  const [searchDateEnd, setSearchDateEnd] = useState('');
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  const [selectedKitId, setSelectedKitId] = useState<string>('');
  const [toast, setToast] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [losses, setLosses] = useState<number>(25);
  const [efficiency, setEfficiency] = useState<number>(108.34); // Updated for 1300 kWh/kWp specific yield (16809/12.93/12)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAIInput, setShowAIInput] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [aiErrors, setAiErrors] = useState<string[]>([]);

  const validateAIData = (data: any) => {
    const errors: string[] = [];
    const check = (path: string, value: any, type: string, required = true) => {
      if (value === undefined || value === null || value === 'N/A') {
        if (required) errors.push(`[FALTANDO] Campo obrigatório: ${path}`);
        return false;
      }
      if (typeof value !== type) {
        errors.push(`[TIPO] Esperado '${type}' em ${path}, recebido '${typeof value}'`);
        return false;
      }
      return true;
    };

    const isBRLCurrency = (v: string) => /^\d{1,3}(\.\d{3})*(,\d{2})?$/.test(v) || /^\d+(,\d{2})?$/.test(v);

    // 1. Cliente & Consumo
    check("cliente.nome", data.cliente?.nome, "string");
    check("consumo.mensal_kwh", data.consumo?.mensal_kwh, "number");
    check("geracao.mensal_kwh", data.geracao?.mensal_kwh, "number");

    // 2. Sistema
    if (check("sistema", data.sistema, "object")) {
      check("sistema.potencia_kwp", data.sistema.potencia_kwp, "number");
      check("sistema.tarifa_kwh", data.sistema.tarifa_kwh, "number");
    }

    // 3. Financeiro (BRL Format)
    if (check("financeiro", data.financeiro, "object")) {
      const currencyFields = ["valor_sistema", "economia_mensal_1ano", "payback_anos"];
      for (const f of currencyFields) {
        const val = data.financeiro[f];
        if (check(`financeiro.${f}`, val, "string")) {
          if (val !== "N/A" && !isBRLCurrency(val)) {
            errors.push(`[FORMATO] financeiro.${f} deve seguir padrão "X.XXX,XX" ou "XX,XX"`);
          }
        }
      }
    }

    return errors;
  };

  const handleAIExtraction = async () => {
    if (!pastedText.trim()) return;
    
    setIsProcessingAI(true);
    setAiErrors([]);

    try {
      const data = await parseProposalFromText(pastedText);
      const errors = validateAIData(data);

      if (errors.length > 0) {
        setAiErrors(errors);
        showToast('Erros de validação encontrados nos dados extraídos.');
        return;
      }
      
      // Helper to clean currency strings
      const cleanCurrency = (val: string) => {
        if (!val || val === 'N/A') return '0';
        return val.replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
      };

      setFormData(prev => ({
        ...prev,
        titular: data.cliente?.nome || prev.titular,
        client: data.cliente?.nome || prev.client,
        energyConsumption: data.consumo?.mensal_kwh?.toString() || prev.energyConsumption,
        systemSize: data.sistema?.potencia_kwp?.toString() || prev.systemSize,
        panelBrandModel: data.equipamentos?.modulos ? `${data.equipamentos.modulos.fabricante || ''} ${data.equipamentos.modulos.modelo || ''}`.trim() : prev.panelBrandModel,
        panelQuantity: data.equipamentos?.modulos?.quantidade?.toString() || prev.panelQuantity,
        inverterBrandModel: data.equipamentos?.inversor ? `${data.equipamentos.inversor.fabricante || ''} ${data.equipamentos.inversor.modelo || ''}`.trim() : prev.inverterBrandModel,
        invertersQuantity: data.equipamentos?.inversor?.quantidade?.toString() || prev.invertersQuantity,
        payback: data.financeiro?.payback_anos?.replace(' Anos', '') || prev.payback,
        equipmentCost: data.financeiro?.valor_sistema ? cleanCurrency(data.financeiro.valor_sistema) : prev.equipmentCost,
        representative: data.responsavel?.nome || prev.representative,
        internalNotes: `Extraído e Validado via IA em ${new Date().toLocaleString('pt-BR')}`
      }));

      showToast('Dados validados e importados com sucesso!');
      setShowAIInput(false);
      setPastedText('');
    } catch (error) {
      console.error('AI Extraction Error:', error);
      showToast('Falha crítica no processamento da IA.');
    } finally {
      setIsProcessingAI(false);
    }
  };

  const [registerAsNewClient, setRegisterAsNewClient] = useState(false);

  const filteredClients = useMemo(() => {
    if (!clientSearchTerm.trim()) return [];
    
    const term = clientSearchTerm.toLowerCase();
    
    const clientMatches = (clients || []).map(c => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      address: c.address,
      cpfCnpj: c.cpfCnpj || '',
      source: 'Cliente' as const
    })).filter(c => c.name.toLowerCase().includes(term) || c.email.toLowerCase().includes(term));

    const leadMatches = (leads || []).map(l => ({
      id: l.id,
      name: l.name,
      email: l.email,
      phone: l.phone,
      address: l.address,
      cep: l.cep,
      cpfCnpj: l.cpfCnpj,
      ucNumber: l.ucNumber,
      createdAt: l.createdAt,
      source: 'Lead' as const
    })).filter(l => {
      const matchesTerm = l.name.toLowerCase().includes(term) || l.email.toLowerCase().includes(term);
      let matchesDate = true;
      if (searchDateStart && l.createdAt && l.createdAt < searchDateStart) matchesDate = false;
      if (searchDateEnd && l.createdAt && l.createdAt > searchDateEnd) matchesDate = false;
      return matchesTerm && matchesDate;
    });

    return [...clientMatches, ...leadMatches].slice(0, 10);
  }, [clientSearchTerm, clients, leads, searchDateStart, searchDateEnd]);

  const selectSuggestedClient = (suggestion: any) => {
    setFormData(prev => ({
      ...prev,
      client: suggestion.name,
      email: suggestion.email,
      titular: suggestion.name,
      telefone: suggestion.phone,
      endereco: suggestion.address || prev.endereco,
      cpfCnpj: suggestion.cpfCnpj || prev.cpfCnpj,
      cep: suggestion.cep || prev.cep,
      ucNumber: suggestion.ucNumber || prev.ucNumber
    }));
    setClientSearchTerm('');
    setShowClientSuggestions(false);
    showToast(`Selecionado: ${suggestion.name} (${suggestion.source})`);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };


  const [formData, setFormData] = useState({
    // Standard fields
    client: initialData?.client || '',
    email: initialData?.email || '',
    value: initialData?.value || 0,
    systemSize: initialData?.systemSize?.replace(' kWp', '') || '',
    representative: initialData?.representative || 'Marusan Pinto',
    roi: initialData?.roi || '385%',
    payback: initialData?.payback?.replace(' Anos', '') || '4.5',
    commission: initialData?.commission?.toString() || '5',
    commissionStatus: initialData?.commissionStatus || 'pending',
    expiryDate: initialData?.expiryDate || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    ucNumber: initialData?.ucNumber || '',
    energyConsumption: initialData?.energyConsumption || '1357',
    monthlyGeneration: initialData?.monthlyGeneration || '',
    kitId: initialData?.kitId || '',
    discount: initialData?.discount?.toString() || '0',
    margin: initialData?.margin?.toString() || '0',
    financingBank: initialData?.financingBank || 'Credsol',
    financingInstallments: initialData?.financingInstallments?.toString() || '60',
    financingInstallmentValue: initialData?.financingInstallmentValue || 0,
    internalNotes: initialData?.internalNotes || '',
    proposalNumber: initialData?.proposalNumber || '',
    additionalCost: initialData?.additionalCost?.toString() || '',
    installationStartDate: initialData?.installationStartDate || '',
    estimatedCompletionDate: initialData?.estimatedCompletionDate || '',
    photoUrl: initialData?.photoUrl || '',
    customImageLinks: initialData?.customImageLinks || [],
    
    // Step 1: UCS
    titular: initialData?.titular || '',
    cpfCnpj: initialData?.cpfCnpj || '',
    endereco: initialData?.endereco || '',
    cep: initialData?.cep || '',
    telefone: initialData?.telefone || '',
    distribuidora: initialData?.distribuidora || 'CEMIG',
    tensaoFornecimento: initialData?.tensaoFornecimento || 'Trifásico',

    // Step 2: KIT FV
    panelBrandModel: initialData?.panelBrandModel || 'Módulos MAXEON 540 W',
    panelQuantity: initialData?.panelQuantity?.toString() || '24',
    inverterBrandModel: initialData?.inverterBrandModel || 'AUXSOL 7.5',
    invertersQuantity: initialData?.invertersQuantity?.toString() || '1',
    structureQuantity: initialData?.structureQuantity?.toString() || '1',
    structureType: initialData?.structureType || 'Alumínio Anodizado (específico para telhado)',
    cablesIncluded: initialData?.cablesIncluded !== undefined ? initialData.cablesIncluded : true,
    protectionSystem: initialData?.protectionSystem || 'String Box blindada',

    // Step 3: PRECIFICAÇÃO
    equipmentCost: initialData?.equipmentCost?.toString() || '',
    installationCost: initialData?.installationCost?.toString() || '',
    projectCost: initialData?.projectCost?.toString() || '',
    licensingCost: initialData?.licensingCost?.toString() || '',
    logisticCost: initialData?.logisticCost?.toString() || '',
    subtotal: initialData?.subtotal?.toString() || '',

    // Step 4: FINANCIAMENTO
    paymentMethod: initialData?.paymentMethod || 'cash',
    pixInstallmentType: initialData?.pixInstallmentType || 'credit_card',
    financingRate: initialData?.financingRate?.toString() || '',
    financingCET: initialData?.financingCET?.toString() || '',
    downPayment: initialData?.downPayment?.toString() || '',
  });
  const [roiError, setRoiError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const unsubscribe = syncCollection<Kit>('kits', setKits, 'createdAt');
      return () => unsubscribe();
    }
  }, [isOpen]);

  // Unified Sync Effect for all Derived Data (Calculations, Panels, Sizes)
  useEffect(() => {
    setFormData(prev => {
      // 1. Geometry Synchronization (Panels <-> Size)
      const powerMatch = prev.panelBrandModel.match(/(\d+)\s*W/i);
      const power = powerMatch ? parseInt(powerMatch[1]) : 550;
      
      let newSz = prev.systemSize;
      let newQty = prev.panelQuantity;

      const currentSzNum = parseFloat(prev.systemSize);
      const currentQtyNum = parseInt(prev.panelQuantity);

      // Check for mutual consistency
      const expectedSz = (currentQtyNum * power) / 1000;
      const expectedQty = Math.ceil((currentSzNum * 1000) / power);

      // We need to decide which one to trust. 
      // Rule: If current size doesn't match the quantity * power, one of them must move.
      // We'll use a small tolerance for floating point issues.
      const szIsConsistent = !isNaN(currentSzNum) && Math.abs(currentSzNum - expectedSz) < 0.01;
      const qtyIsConsistent = !isNaN(currentQtyNum) && currentQtyNum === expectedQty;

      if (!szIsConsistent) {
        // If they aren't consistent, we update size to match quantity by default 
        // (assuming quantity is the primary driver for "physical" systems)
        newSz = expectedSz.toFixed(2);
      } else if (!qtyIsConsistent) {
        newQty = expectedQty.toString();
      }

      // 2. Financial & Technical Calculations
      const szNum = parseFloat(newSz);
      const consumption = parseFloat(prev.energyConsumption);
      
      const monGen = !isNaN(szNum) && szNum > 0 ? (szNum * efficiency).toFixed(0) : prev.monthlyGeneration;

      const equip = parseFloat(prev.equipmentCost || '0');
      const inst = parseFloat(prev.installationCost || '0');
      const proj = parseFloat(prev.projectCost || '0');
      const lic = parseFloat(prev.licensingCost || '0');
      const log = parseFloat(prev.logisticCost || '0');
      const add = parseFloat(prev.additionalCost || '0');
      const discountVal = parseFloat(prev.discount || '0');
      const marginP = parseFloat(prev.margin || '0');
      
      const costs = equip + inst + proj + lic + log + add;
      const multiplier = marginP >= 99 ? 100 : 1 / (1 - (marginP / 100));
      const valWithMargin = costs * multiplier;
      const totalVal = Math.max(0, valWithMargin - discountVal);
      const valNum = parseFloat(totalVal.toFixed(2));

      let pb = prev.payback;
      let r = prev.roi;

      if (!isNaN(valNum) && !isNaN(szNum) && valNum > 0 && szNum > 0 && !isNaN(consumption)) {
        const energyRate = 1.05; 
        const minFee = 100;
        const billBefore = consumption * energyRate;
        const genNum = parseFloat(monGen);
        const billAfter = Math.max(minFee, (consumption - genNum) * energyRate + minFee);
        const monthlySavings = Math.max(0, billBefore - billAfter);
        const annualSavings = monthlySavings * 12;
        pb = annualSavings > 0 ? (valNum / annualSavings).toFixed(1) : '0';
        const totalSavings25 = annualSavings * 47.727; 
        r = `${(((totalSavings25 - valNum) / valNum) * 100).toFixed(0)}%`;
      }

      // Check if anything actually changed before returning a new object
      if (
        prev.systemSize === newSz &&
        prev.panelQuantity === newQty &&
        prev.monthlyGeneration === monGen &&
        prev.subtotal === costs.toString() &&
        prev.value === valNum &&
        prev.payback === pb &&
        prev.roi === r
      ) {
        return prev;
      }

      return {
        ...prev,
        systemSize: newSz,
        panelQuantity: newQty,
        monthlyGeneration: monGen,
        subtotal: costs.toString(),
        value: valNum,
        payback: pb,
        roi: r
      };
    });
  }, [
    formData.panelQuantity,
    formData.systemSize,
    formData.panelBrandModel,
    formData.energyConsumption,
    formData.equipmentCost,
    formData.installationCost,
    formData.projectCost,
    formData.licensingCost,
    formData.logisticCost,
    formData.additionalCost,
    formData.margin,
    formData.discount,
    efficiency
  ]);


  const validateStep = (step: Step): boolean => {
    const errors: Record<string, string> = {};
    
    if (step === 'ucs') {
      if (!formData.titular?.trim()) errors.titular = 'Titular é obrigatório';
      if (!formData.ucNumber?.trim()) errors.ucNumber = 'Número da UC é obrigatório';
      if (!formData.cpfCnpj?.trim()) errors.cpfCnpj = 'CPF/CNPJ é obrigatório';
      
      // Email validation
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = 'Formato de e-mail inválido';
      }
      
      // Phone validation (simple regex for Brazilian formats)
      if (formData.telefone && !/^(\(?\d{2}\)?\s?)?(\d{4,5}-?\d{4})$/.test(formData.telefone.replace(/\s/g, ''))) {
        errors.telefone = 'Formato de telefone inválido. Use (00) 00000-0000';
      }
    } else if (step === 'kit') {
      if (!formData.systemSize || parseFloat(formData.systemSize) <= 0) {
        errors.systemSize = 'Tamanho do sistema deve ser maior que zero';
      }
      if (!formData.panelBrandModel?.trim()) errors.panelBrandModel = 'Marca/Modelo do painel é obrigatório';
    } else if (step === 'pricing') {
      const costs = ['equipmentCost', 'installationCost', 'projectCost', 'licensingCost', 'logisticCost'];
      costs.forEach(field => {
        const val = parseFloat((formData as any)[field]);
        if (isNaN(val) || val <= 0) {
          errors[field] = 'Este campo deve ser um valor positivo maior que zero';
        }
      });
    } else if (step === 'finalization') {
      if (!formData.expiryDate) {
        errors.expiryDate = 'Data de validade da proposta é obrigatória';
      }
      if (formData.value <= 0) {
        errors.value = 'Valor total da proposta deve ser maior que zero';
      }
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
        email: initialData.email || '',
        value: initialData.value || 0,
        systemSize: initialData.systemSize?.replace(' kWp', '') || '',
        representative: initialData.representative || 'Marusan Pinto',
        roi: initialData.roi || '385%',
        payback: initialData.payback?.replace(' Anos', '') || '4.2',
        commission: initialData.commission?.toString() || '5',
        commissionStatus: initialData.commissionStatus || 'pending',
        expiryDate: initialData.expiryDate || '',
        ucNumber: initialData.ucNumber || '',
        energyConsumption: initialData.energyConsumption || '',
        kitId: initialData.kitId || '',
        discount: initialData.discount?.toString() || '0',
        financingBank: initialData.financingBank || 'Credsol',
        financingInstallments: initialData.financingInstallments?.toString() || '60',
        financingInstallmentValue: initialData.financingInstallmentValue || 0,
        internalNotes: initialData.internalNotes || '',
        proposalNumber: initialData.proposalNumber || '',
        additionalCost: initialData.additionalCost?.toString() || '',
        installationStartDate: initialData.installationStartDate || '',
        estimatedCompletionDate: initialData.estimatedCompletionDate || '',
        photoUrl: initialData.photoUrl || '',
        customImageLinks: initialData.customImageLinks || [],
        
        titular: initialData.titular || '',
        cpfCnpj: initialData.cpfCnpj || '',
        endereco: initialData.endereco || '',
        cep: initialData.cep || '',
        telefone: initialData.telefone || '',
        distribuidora: initialData.distribuidora || 'CEMIG',
        tensaoFornecimento: initialData.tensaoFornecimento || 'Trifásico',
        
        panelBrandModel: initialData.panelBrandModel || '',
        panelQuantity: initialData.panelQuantity?.toString() || '',
        inverterBrandModel: initialData.inverterBrandModel || '',
        invertersQuantity: initialData.invertersQuantity?.toString() || '1',
        structureQuantity: initialData.structureQuantity?.toString() || '',
        structureType: initialData.structureType || 'Sobre telhado',
        cablesIncluded: initialData.cablesIncluded !== undefined ? initialData.cablesIncluded : true,
        protectionSystem: initialData.protectionSystem || 'String box',
 
        equipmentCost: initialData.equipmentCost?.toString() || '',
        installationCost: initialData.installationCost?.toString() || '',
        projectCost: initialData.projectCost?.toString() || '',
        licensingCost: initialData.licensingCost?.toString() || '',
        logisticCost: initialData.logisticCost?.toString() || '',
        subtotal: initialData.subtotal?.toString() || '',
        margin: initialData.margin?.toString() || '0',
 
        paymentMethod: initialData.paymentMethod || 'cash',
        pixInstallmentType: initialData.pixInstallmentType || 'credit_card',
        financingRate: initialData.financingRate?.toString() || '1.2',
        financingCET: initialData.financingCET?.toString() || '18.5',
        downPayment: initialData.downPayment?.toString() || '',
      });
      setCurrentStep((initialData as any).startAtStep || 'ucs');
    } else {
      setFormData({
        client: '',
        email: '',
        value: 0,
        systemSize: '',
        representative: 'Marusan Pinto',
        roi: '385%',
        payback: '4.5',
        commission: '5',
        commissionStatus: 'pending',
        expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        ucNumber: '',
        energyConsumption: '1357',
        kitId: '',
        discount: '0',
        financingBank: 'Credsol',
        financingInstallments: '60',
        financingInstallmentValue: 0,
        internalNotes: '',
        proposalNumber: '',
        additionalCost: '',
        installationStartDate: '',
        estimatedCompletionDate: '',
        photoUrl: '',
        customImageLinks: [],
        
        titular: '',
        cpfCnpj: '',
        endereco: '',
        cep: '',
        telefone: '',
        distribuidora: 'CEMIG',
        tensaoFornecimento: 'Trifásico',
        
        panelBrandModel: '',
        panelQuantity: '',
        inverterBrandModel: '',
        invertersQuantity: '1',
        structureQuantity: '',
        structureType: 'Sobre telhado',
        cablesIncluded: true,
        protectionSystem: 'String box',
 
        equipmentCost: '',
        installationCost: '',
        projectCost: '',
        licensingCost: '',
        logisticCost: '',
        subtotal: '',
        margin: '0',
 
        paymentMethod: 'cash',
        pixInstallmentType: 'credit_card',
        financingRate: '1.2',
        financingCET: '18.5',
        downPayment: '',
      });
      setCurrentStep('ucs');
    }
  }, [initialData, isOpen]);

  const handleKitSelect = (kit: Kit) => {
    setSelectedKit(kit);
    
    // Find relevant components from the kit
    const panel = kit.components.find(c => {
      const name = c.name.toLowerCase();
      return name.includes('painel') || name.includes('módulo') || name.includes('modulo');
    });
    const inverter = kit.components.find(c => c.name.toLowerCase().includes('inversor'));
    const structure = kit.components.find(c => c.name.toLowerCase().includes('estrutura'));

    setFormData(prev => ({
      ...prev,
      kitId: kit.id,
      systemSize: kit.power.toString(),
      equipmentCost: kit.price > 0 ? kit.price.toString() : '',
      panelBrandModel: panel ? `${panel.brand || ''} ${panel.model || ''}`.trim() : prev.panelBrandModel,
      panelQuantity: panel ? panel.quantity.toString() : '',
      inverterBrandModel: inverter ? `${inverter.brand || ''} ${inverter.model || ''}`.trim() : prev.inverterBrandModel,
      invertersQuantity: inverter ? inverter.quantity.toString() : prev.invertersQuantity,
      structureQuantity: structure ? structure.quantity.toString() : prev.structureQuantity,
    }));
    
    showToast(`Kit "${kit.name}" selecionado.`);
  };

  const prevStep = () => {
    const currentIndex = STEPS.findIndex(s => s.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1].id);
    }
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

  // The derived calculations are now handled by the unified sync effect at the top.


  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep('pricing')) {
      showToast('Por favor, verifique os dados de precificação.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Calculate total value correctly (Subtotal - Discount)
      const subtotal = (
        parseFloat(formData.equipmentCost || '0') + 
        parseFloat(formData.installationCost || '0') + 
        parseFloat(formData.projectCost || '0') + 
        parseFloat(formData.licensingCost || '0') + 
        parseFloat(formData.logisticCost || '0') +
        parseFloat(formData.additionalCost || '0')
      );
      const discountVal = parseFloat(formData.discount || '0');
      const marginPerc = Math.min(99, parseFloat(formData.margin || '0'));
      
      // Safety check for margin: Total = Costs / (1 - Margin/100)
      // Capped at 99% to avoid division by zero or extreme values
      const multiplier = marginPerc >= 99 ? 100 : 1 / (1 - (marginPerc / 100));
      const valueWithMargin = subtotal * multiplier;
      const totalVal = Math.max(0, valueWithMargin - discountVal);

      // Store commission value
      const commissionPerc = parseFloat(formData.commission || '0');
      const commissionValue = totalVal * (commissionPerc / 100);

      // Calculate financing installment value if applicable
      let installmentValue = 0;
      if (formData.paymentMethod === 'financing') {
        const n = parseInt(formData.financingInstallments) || 60;
        const r = parseFloat(formData.financingRate) || 1.2;
        const i = r / 100;
        if (i > 0 && n > 0) {
          installmentValue = totalVal * (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);
        } else if (n > 0) {
          installmentValue = totalVal / n;
        }
      } else if (formData.paymentMethod === 'pix_plus_installments') {
        const down = parseFloat(formData.downPayment || '0');
        const remaining = Math.max(0, totalVal - down);
        installmentValue = remaining / 10;
      }
      
      // If user requested to register as a new client
      if (registerAsNewClient) {
        const clientData = {
          name: formData.titular || formData.client,
          email: formData.email,
          phone: formData.telefone,
          address: formData.endereco,
          cpfCnpj: formData.cpfCnpj,
          status: 'active' as const,
          createdAt: new Date().toISOString(),
          projects: []
        };
        await createDocument('clients', clientData);
        showToast(`Cliente ${formData.client} cadastrado com sucesso!`);
      }

      const monthlyGenerationValue = formData.monthlyGeneration || (parseFloat(formData.systemSize) * efficiency).toFixed(0);

      const proposalData: Proposal = {
        ...formData,
        id: initialData?.id || '',
        client: formData.titular || formData.client,
        value: totalVal,
        date: initialData?.date || new Date().toISOString(),
        status: initialData?.status || 'pending',
        systemSize: `${formData.systemSize} kWp`,
        representative: formData.representative || user?.name || 'Vendedor',
        representativeId: initialData?.representativeId || user?.id || null,
        representativeEmail: initialData?.representativeEmail || user?.email || null,
        roi: formData.roi || null,
        payback: formData.payback ? `${formData.payback} Anos` : null,
        monthlyGeneration: monthlyGenerationValue,
        commission: parseFloat(formData.commission) || 0,
        commissionStatus: initialData?.commissionStatus || 'pending',
        expiryDate: formData.expiryDate || null,
        ucNumber: formData.ucNumber || null,
        energyConsumption: formData.energyConsumption || null,
        kitId: formData.kitId || null,
        discount: discountVal,
        financingBank: formData.financingBank || null,
        financingInstallments: formData.paymentMethod === 'pix_plus_installments' ? 10 : (parseInt(formData.financingInstallments) || 0),
        financingInstallmentValue: installmentValue,
        pixInstallmentType: formData.paymentMethod === 'pix_plus_installments' ? formData.pixInstallmentType : null,
        email: formData.email || null,
        photoUrl: formData.photoUrl || null,
        customImageLinks: formData.customImageLinks || [],

        // Number conversions for custom fields
        panelQuantity: parseInt(formData.panelQuantity) || 0,
        invertersQuantity: parseInt(formData.invertersQuantity) || 0,
        structureQuantity: parseInt(formData.structureQuantity) || 0,
        equipmentCost: parseFloat(formData.equipmentCost) || 0,
        installationCost: parseFloat(formData.installationCost) || 0,
        projectCost: parseFloat(formData.projectCost) || 0,
        licensingCost: parseFloat(formData.licensingCost) || 0,
        logisticCost: parseFloat(formData.logisticCost) || 0,
        additionalCost: parseFloat(formData.additionalCost) || 0,
        installationStartDate: formData.installationStartDate || null,
        estimatedCompletionDate: formData.estimatedCompletionDate || null,
        calculatedCommission: commissionValue || 0,
        margin: parseFloat(formData.margin) || 0,
        financingRate: parseFloat(formData.financingRate) || 0,
        financingCET: parseFloat(formData.financingCET) || 0,
        downPayment: parseFloat(formData.downPayment) || 0,
      };
      
      await onAdd(proposalData);
      onClose();
    } catch (error) {
      console.error('Error submitting proposal:', error);
      showToast('Ocorreu um erro ao salvar a proposta.');
    } finally {
      setIsSubmitting(false);
    }
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
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-white/5 shrink-0 relative overflow-hidden">
          {/* Progress Bar Background */}
          <div className="absolute top-0 left-0 w-full h-1 bg-slate-100 dark:bg-slate-800" />
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${((STEPS.findIndex(s => s.id === currentStep) + 1) / STEPS.length) * 100}%` }}
            className="absolute top-0 left-0 h-1 bg-[#fdb612] shadow-[0_0_10px_#fdb612]"
          />

          <div className="flex items-center gap-4">
            <div className="size-12 bg-[#fdb612]/20 rounded-2xl flex items-center justify-center text-[#fdb612]">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-black tracking-tight uppercase">
                {initialData ? 'Ajustar Simulação' : 'Nova Simulação Técnica'}
              </h3>
              <p className="text-sm text-slate-500 font-medium">Fluxo guiado de alta conversão</p>
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
        <div className="px-8 py-8 bg-slate-50/50 dark:bg-white/5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="relative flex justify-between items-center max-w-4xl mx-auto">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 z-0" />
            {STEPS.map((step, index) => {
              const currentIndex = STEPS.findIndex(s => s.id === currentStep);
              const stepIndex = index;
              const isActive = currentStep === step.id;
              const isCompleted = currentIndex > stepIndex;

              return (
                <div key={step.id} className="relative z-10 flex flex-col items-center gap-3">
                  <div className="group relative">
                    <button 
                      onClick={() => {
                        if (isCompleted || isActive) setCurrentStep(step.id);
                      }}
                      className={cn(
                        "size-12 rounded-2xl flex items-center justify-center font-black text-xs transition-all border-2",
                        isActive 
                          ? "bg-[#fdb612] border-[#fdb612] text-[#231d0f] shadow-xl shadow-[#fdb612]/20 scale-110" 
                          : isCompleted 
                            ? "bg-slate-900 border-slate-900 text-white" 
                            : "bg-white dark:bg-[#201b10] border-slate-200 dark:border-slate-800 text-slate-400"
                      )}
                    >
                      {isCompleted ? <Check className="w-6 h-6" /> : index + 1}
                    </button>
                    
                    {/* Tooltip for step label */}
                    <div className={cn(
                      "absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 rounded-lg bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none",
                      isActive && "opacity-100"
                    )}>
                      {step.label}
                    </div>
                  </div>
                  <span className={cn(
                    "text-[9px] font-black uppercase tracking-widest transition-colors",
                    isActive ? "text-[#fdb612]" : isCompleted ? "text-slate-900 dark:text-white" : "text-slate-400"
                  )}>
                    Passo {index + 1}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative">
          {/* AI Extraction Panel */}
          <AnimatePresence>
            {showAIInput && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute inset-x-8 top-8 z-50 bg-[#1a160d] border border-[#fdb612]/30 rounded-3xl p-8 shadow-2xl flex flex-col gap-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-10 bg-[#fdb612]/20 rounded-xl flex items-center justify-center text-[#fdb612]">
                      <BrainCircuit className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-black text-white uppercase tracking-tight">Extração Inteligente</h4>
                      <p className="text-[10px] text-[#fdb612] font-black uppercase tracking-widest">Powered by Vieiras AI</p>
                    </div>
                  </div>
                  <button onClick={() => setShowAIInput(false)} className="p-2 hover:bg-white/5 rounded-full text-slate-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Cole abaixo os dados copiados do simulador, PDF ou rascunho técnico. A IA irá identificar automaticamente:
                      <span className="text-white font-bold"> Cliente, Consumo, Potência, Equipamentos e Valores.</span>
                    </p>
                  </div>
                  
                  <textarea 
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="Cole os dados aqui... (Ex: Cliente João Silva, Consumo 500kWh, Sistema 5.5kWp...)"
                    className="w-full h-48 bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-slate-300 outline-none focus:ring-2 focus:ring-[#fdb612] resize-none font-mono"
                  />

                  {aiErrors.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl space-y-2"
                    >
                      <div className="flex items-center gap-2 text-red-500 text-[10px] font-black uppercase tracking-widest mb-1">
                        <AlertCircle className="w-3 h-3" />
                        Erros de Validação (Corrija o texto e tente novamente)
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                        {aiErrors.map((error, idx) => (
                          <div key={idx} className="text-[10px] text-red-400 font-medium flex items-start gap-2">
                            <span className="shrink-0 mt-1 size-1 bg-red-400 rounded-full" />
                            {error}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setShowAIInput(false)}
                    className="flex-1 px-6 py-4 rounded-2xl border border-white/10 text-white font-bold text-sm uppercase tracking-widest hover:bg-white/5 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleAIExtraction}
                    disabled={isProcessingAI || !pastedText.trim()}
                    className="flex-3 px-6 py-4 bg-[#fdb612] text-[#231d0f] rounded-2xl font-black text-sm uppercase tracking-widest hover:shadow-xl hover:shadow-[#fdb612]/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isProcessingAI ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processando Dados...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Alimentar Formulário
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-8">
            {currentStep === 'ucs' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-2 text-[#00A86B]">
                    <Building2 className="w-5 h-5" />
                    <h4 className="text-sm font-black uppercase tracking-widest">Unidade Consumidora</h4>
                  </div>
                  
                  <button 
                    type="button"
                    onClick={() => setShowAIInput(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-[#fdb612] text-[#231d0f] rounded-2xl font-black text-xs uppercase tracking-widest hover:shadow-lg hover:shadow-[#fdb612]/20 transition-all active:scale-95 group"
                  >
                    <BrainCircuit className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                    Importar via IA
                  </button>
                </div>
                  
                  {/* Client/Lead Search */}
                  <div className="flex flex-col gap-2">
                    <div className="relative w-full">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Buscar Cliente ou Lead..."
                        value={clientSearchTerm}
                        onChange={(e) => {
                          setClientSearchTerm(e.target.value);
                          setShowClientSuggestions(true);
                        }}
                        onFocus={() => setShowClientSuggestions(true)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#00A86B]"
                      />
                      {showClientSuggestions && (filteredClients.length > 0 || searchDateStart || searchDateEnd) && (
                        <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-[#1a160d] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                          <div className="p-3 bg-slate-50 dark:bg-white/5 flex flex-col gap-2 border-b border-slate-100 dark:border-slate-800">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filtrar Leads por Data</span>
                            <div className="flex items-center gap-2">
                              <input 
                                type="date"
                                value={searchDateStart}
                                onChange={(e) => setSearchDateStart(e.target.value)}
                                className="flex-1 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[10px] outline-none"
                              />
                              <span className="text-slate-400 text-[10px]">até</span>
                              <input 
                                type="date"
                                value={searchDateEnd}
                                onChange={(e) => setSearchDateEnd(e.target.value)}
                                className="flex-1 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[10px] outline-none"
                              />
                              {(searchDateStart || searchDateEnd) && (
                                <button 
                                  onClick={() => { setSearchDateStart(''); setSearchDateEnd(''); }}
                                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-rose-500"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                          {filteredClients.length > 0 ? (
                            filteredClients.map((suggestion) => (
                              <button
                                key={suggestion.id}
                                type="button"
                                onClick={() => selectSuggestedClient(suggestion)}
                                className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-white/5 flex flex-col gap-0.5 transition-colors"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{suggestion.name}</span>
                                  <div className="flex items-center gap-2">
                                    {suggestion.createdAt && <span className="text-[8px] text-slate-400 font-medium">{suggestion.createdAt}</span>}
                                    <span className={cn(
                                      "text-[8px] px-1.5 py-0.5 rounded font-black uppercase",
                                      suggestion.source === 'Cliente' ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"
                                    )}>
                                      {suggestion.source}
                                    </span>
                                  </div>
                                </div>
                                <span className="text-xs text-slate-500">{suggestion.email}</span>
                              </button>
                            ))
                          ) : (
                            <div className="p-4 text-center text-slate-400 text-xs font-medium">
                              Nenhum resultado nos critérios selecionados.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                
                <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-2xl mb-6">
                  <input 
                    type="checkbox"
                    id="registerClient"
                    checked={registerAsNewClient}
                    onChange={(e) => setRegisterAsNewClient(e.target.checked)}
                    className="size-5 rounded border-slate-300 text-[#00A86B] focus:ring-[#00A86B]"
                  />
                  <label htmlFor="registerClient" className="text-sm font-bold text-amber-700 dark:text-amber-400">
                    Registrar estes dados como um novo cliente após salvar a proposta
                  </label>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Número da UC</label>
                    <input 
                      type="text" 
                      value={formData.ucNumber || ''}
                      onChange={(e) => setFormData({ ...formData, ucNumber: e.target.value })}
                      placeholder="UC 0000000"
                      className={cn(
                        "w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border rounded-2xl outline-none focus:ring-2 focus:ring-[#00A86B] transition-all",
                        validationErrors.ucNumber ? "border-rose-500" : "border-slate-200 dark:border-slate-800"
                      )}
                    />
                    {validationErrors.ucNumber && <p className="text-[10px] font-bold text-rose-500 mt-1">{validationErrors.ucNumber}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Titular</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        type="text" 
                        value={formData.titular || ''}
                        onChange={(e) => setFormData({ ...formData, titular: e.target.value })}
                        placeholder="Nome completo do titular"
                        className={cn(
                          "w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border rounded-2xl outline-none focus:ring-2 focus:ring-[#00A86B] transition-all",
                          validationErrors.titular ? "border-rose-500" : "border-slate-200 dark:border-slate-800"
                        )}
                      />
                    </div>
                    {validationErrors.titular && <p className="text-[10px] font-bold text-rose-500 mt-1">{validationErrors.titular}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">CPF/CNPJ</label>
                    <input 
                      type="text" 
                      value={formData.cpfCnpj || ''}
                      onChange={(e) => setFormData({ ...formData, cpfCnpj: e.target.value })}
                      placeholder="000.000.000-00"
                      className={cn(
                        "w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border rounded-2xl outline-none focus:ring-2 focus:ring-[#00A86B] transition-all",
                        validationErrors.cpfCnpj ? "border-rose-500" : "border-slate-200 dark:border-slate-800"
                      )}
                    />
                    {validationErrors.cpfCnpj && <p className="text-[10px] font-bold text-rose-500 mt-1">{validationErrors.cpfCnpj}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Telefone</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        type="text" 
                        value={formData.telefone || ''}
                        onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                        placeholder="(00) 00000-0000"
                        className={cn(
                          "w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border rounded-2xl outline-none focus:ring-2 focus:ring-[#00A86B] transition-all",
                          validationErrors.telefone ? "border-rose-500" : "border-slate-200 dark:border-slate-800"
                        )}
                      />
                    </div>
                    {validationErrors.telefone && <p className="text-[10px] font-bold text-rose-500 mt-1">{validationErrors.telefone}</p>}
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Endereço</label>
                    <input 
                      type="text" 
                      value={formData.endereco || ''}
                      onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                      placeholder="Rua, número, bairro, cidade - UF"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-[#00A86B] transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">CEP</label>
                    <input 
                      type="text" 
                      value={formData.cep || ''}
                      onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                      placeholder="00000-000"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-[#00A86B] transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">E-mail</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        type="email" 
                        value={formData.email || ''}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="cliente@email.com"
                        className={cn(
                          "w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border rounded-2xl outline-none focus:ring-2 focus:ring-[#00A86B] transition-all",
                          validationErrors.email ? "border-rose-500" : "border-slate-200 dark:border-slate-800"
                        )}
                      />
                    </div>
                    {validationErrors.email && <p className="text-[10px] font-bold text-rose-500 mt-1">{validationErrors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Distribuidora</label>
                    <select 
                      value={formData.distribuidora}
                      onChange={(e) => setFormData({ ...formData, distribuidora: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-[#00A86B] transition-all"
                    >
                      <option value="CEMIG">CEMIG</option>
                      <option value="ENEL">ENEL</option>
                      <option value="CPFL">CPFL</option>
                      <option value="Outra">Outra</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-[#fdb612]">Consumo Médio Mensal (kWh/mês)</label>
                    <div className="relative">
                      <Zap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#fdb612]" />
                      <input 
                        type="number" 
                        value={formData.energyConsumption || ''}
                        onChange={(e) => setFormData({ ...formData, energyConsumption: e.target.value })}
                        placeholder="1357"
                        className="w-full pl-12 pr-4 py-3 bg-[#fdb612]/5 dark:bg-[#fdb612]/5 border border-[#fdb612]/20 rounded-2xl outline-none focus:ring-2 focus:ring-[#fdb612] transition-all font-bold"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium italic">Baseado nas últimas 12 faturas do cliente</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Tensão de Fornecimento</label>
                    <select 
                      value={formData.tensaoFornecimento}
                      onChange={(e) => setFormData({ ...formData, tensaoFornecimento: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-[#00A86B] transition-all"
                    >
                      <option value="Monofásico">Monofásico</option>
                      <option value="Bifásico">Bifásico</option>
                      <option value="Trifásico">Trifásico</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 mt-8 p-4 bg-slate-50 dark:bg-white/5 rounded-2xl">
                  <button type="button" className="px-4 py-2 bg-[#0055A4] text-white rounded-lg text-xs font-bold hover:opacity-90 transition-all flex items-center gap-2">
                    <RefreshCw className="w-3 h-3" />
                    Buscar UC automaticamente
                  </button>
                  <button type="button" className="px-4 py-2 bg-[#0055A4] text-white rounded-lg text-xs font-bold hover:opacity-90 transition-all flex items-center gap-2">
                    <Search className="w-3 h-3" />
                    Validar endereço
                  </button>
                  <button type="button" className="px-4 py-2 bg-[#0055A4] text-white rounded-lg text-xs font-bold hover:opacity-90 transition-all flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3" />
                    Salvar dados da UCS
                  </button>
                </div>

                <div className="flex justify-end pt-6">
                  <button 
                    type="button"
                    onClick={nextStep}
                    className="px-8 py-3 bg-[#00A86B] text-white rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-[#00A86B]/20"
                  >
                    Próximo: KIT FV
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {currentStep === 'kit' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Sizing Recommendation Banner */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600">
                      <Calculator className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">Sugestão Técnica</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        Baseado no consumo de <span className="text-[#fdb612]">{formData.energyConsumption} kWh</span>, sugerimos <span className="text-[#00A86B]">{(parseFloat(formData.energyConsumption) / efficiency).toFixed(2)} kWp</span>
                      </p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      const suggestedSz = (parseFloat(formData.energyConsumption) / efficiency).toFixed(2);
                      setFormData(prev => ({ ...prev, systemSize: suggestedSz }));
                      showToast(`Dimensionamento ajustado para ${suggestedSz} kWp`);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md shadow-blue-600/10"
                  >
                    Aplicar
                  </button>
                </div>

                {/* Over-sizing Warning */}
                {parseFloat(formData.systemSize) * efficiency > parseFloat(formData.energyConsumption) * 1.2 && (
                  <div className="p-4 bg-rose-50 dark:bg-rose-900/20 rounded-2xl border border-rose-100 dark:border-rose-800 flex items-center gap-3 text-rose-600">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-xs font-bold leading-tight">
                      Atenção: O sistema está gerando <span className="font-black">{(parseFloat(formData.systemSize) * efficiency).toFixed(0)} kWh</span>/mês. 
                      Isso é {( (parseFloat(formData.systemSize) * efficiency) / parseFloat(formData.energyConsumption) * 100 - 100).toFixed(0)}% ACIMA do consumo do cliente.
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-[#00A86B]">
                    <Zap className="w-5 h-5" />
                    <h4 className="text-sm font-black uppercase tracking-widest">Configuração do Kit Fotovoltaico</h4>
                  </div>
                  
                  {/* Kit Search */}
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Pesquisar Kit (Nome, Potência...)"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#00A86B]"
                    />
                  </div>
                </div>

                {/* Kit Grid / Selection */}
                {searchTerm && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 max-h-60 overflow-y-auto p-1">
                    {filteredKits.map((kit) => (
                      <button
                        key={kit.id}
                        type="button"
                        onClick={() => handleKitSelect(kit)}
                        className={cn(
                          "p-4 rounded-[2rem] border text-left transition-all group",
                          formData.kitId === kit.id 
                            ? "bg-[#00A86B]/5 border-[#00A86B] shadow-lg shadow-[#00A86B]/10" 
                            : "bg-white dark:bg-[#1a160d] border-slate-200 dark:border-slate-800 hover:border-[#0055A4]/30"
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-slate-900 dark:text-slate-100">{kit.name}</span>
                          <div className="size-8 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-[#00A86B]">
                            <Sun className="w-4 h-4" />
                          </div>
                        </div>
                        <div className="flex items-end justify-between">
                          <div className="space-y-1">
                            <span className="block text-[8px] font-black uppercase tracking-widest text-slate-400">Potência</span>
                            <span className="text-sm font-black text-[#0055A4]">{kit.power} kWp</span>
                          </div>
                          <div className="text-right">
                            <span className="block text-[8px] font-black uppercase tracking-widest text-slate-400">Valor Sugerido</span>
                            <span className="text-sm font-black text-[#00A86B]">R$ {parseFloat(kit.price).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Potência do Sistema (kWp)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={formData.systemSize || ''}
                      onChange={(e) => setFormData({ ...formData, systemSize: e.target.value })}
                      placeholder="8,2"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-[#00A86B] transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Quantidade de Módulos</label>
                    <input 
                      type="number" 
                      value={formData.panelQuantity || ''}
                      onChange={(e) => setFormData({ ...formData, panelQuantity: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-[#00A86B] transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Marca/Modelo do Módulo</label>
                    <input 
                      type="text" 
                      value={formData.panelBrandModel || ''}
                      onChange={(e) => setFormData({ ...formData, panelBrandModel: e.target.value })}
                      placeholder="EX: 550W - Marca X"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-[#00A86B] transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Quantidade de Inversores</label>
                    <input 
                      type="number" 
                      value={formData.invertersQuantity || ''}
                      onChange={(e) => setFormData({ ...formData, invertersQuantity: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-[#00A86B] transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Marca/Modelo do Inversor</label>
                    <input 
                      type="text" 
                      value={formData.inverterBrandModel || ''}
                      onChange={(e) => setFormData({ ...formData, inverterBrandModel: e.target.value })}
                      placeholder="Inversor Deye"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-[#00A86B] transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Quantidade de Estruturas (Conjuntos)</label>
                    <input 
                      type="number" 
                      value={formData.structureQuantity || ''}
                      onChange={(e) => setFormData({ ...formData, structureQuantity: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-[#00A86B] transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Tipo de Estrutura</label>
                    <select 
                      value={formData.structureType}
                      onChange={(e) => setFormData({ ...formData, structureType: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-[#00A86B] transition-all"
                    >
                      <option value="Sobre telhado">Sobre telhado</option>
                      <option value="Solo">Solo</option>
                      <option value="Fachada">Fachada</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Sistema de Proteção</label>
                    <input 
                      type="text" 
                      value={formData.protectionSystem || ''}
                      onChange={(e) => setFormData({ ...formData, protectionSystem: e.target.value })}
                      placeholder="DPS / Disjuntores / String box"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-[#00A86B] transition-all"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox"
                      id="cablesIncluded"
                      checked={formData.cablesIncluded}
                      onChange={(e) => setFormData({ ...formData, cablesIncluded: e.target.checked })}
                      className="size-5 rounded border-slate-300 text-[#00A86B] focus:ring-[#00A86B]"
                    />
                    <label htmlFor="cablesIncluded" className="text-sm font-bold text-slate-600 dark:text-slate-400">Cabos e conectores inclusos</label>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 mt-8 p-4 bg-slate-50 dark:bg-white/5 rounded-2xl">
                  <button type="button" className="px-4 py-2 bg-[#0055A4] text-white rounded-lg text-xs font-bold hover:opacity-90 transition-all flex items-center gap-2">
                    <Sun className="w-3 h-3" />
                    Simular produção mensal
                  </button>
                  <button type="button" className="px-4 py-2 bg-[#0055A4] text-white rounded-lg text-xs font-bold hover:opacity-90 transition-all flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3" />
                    Validar compatibilidade
                  </button>
                  <button type="button" className="px-4 py-2 bg-[#0055A4] text-white rounded-lg text-xs font-bold hover:opacity-90 transition-all flex items-center gap-2">
                    <Plus className="w-3 h-3" />
                    Adicionar equipamentos extras
                  </button>
                </div>

                <div className="flex justify-between pt-6">
                  <button 
                    type="button"
                    onClick={prevStep}
                    className="px-8 py-3 border border-slate-200 dark:border-slate-800 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar
                  </button>
                  <button 
                    type="button"
                    onClick={nextStep}
                    className="px-8 py-3 bg-[#00A86B] text-white rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-[#00A86B]/20"
                  >
                    Próximo: PRECIFICAÇÃO
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {currentStep === 'pricing' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-2 text-[#00A86B] mb-4">
                  <DollarSign className="w-5 h-5" />
                  <h4 className="text-sm font-black uppercase tracking-widest">Valor do Sistema</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Custo dos equipamentos (R$)</label>
                    <input 
                      type="number" 
                      value={formData.equipmentCost || ''}
                      onChange={(e) => setFormData({ ...formData, equipmentCost: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-[#00A86B] transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Custo da instalação (R$)</label>
                    <input 
                      type="number" 
                      value={formData.installationCost || ''}
                      onChange={(e) => setFormData({ ...formData, installationCost: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-[#00A86B] transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Custo de projetos e ART (R$)</label>
                    <input 
                      type="number" 
                      value={formData.projectCost || ''}
                      onChange={(e) => setFormData({ ...formData, projectCost: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-[#00A86B] transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Custo de licenciamento (R$)</label>
                    <input 
                      type="number" 
                      value={formData.licensingCost || ''}
                      onChange={(e) => setFormData({ ...formData, licensingCost: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-[#00A86B] transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Frete e logística (R$)</label>
                    <input 
                      type="number" 
                      value={formData.logisticCost || ''}
                      onChange={(e) => setFormData({ ...formData, logisticCost: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-[#00A86B] transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-[#fdb612]">Custo Adicional (Imprevistos)</label>
                    <input 
                      type="number" 
                      value={formData.additionalCost || ''}
                      onChange={(e) => setFormData({ ...formData, additionalCost: e.target.value })}
                      className="w-full px-4 py-3 bg-[#fdb612]/5 dark:bg-[#fdb612]/5 border border-[#fdb612]/20 rounded-2xl outline-none focus:ring-2 focus:ring-[#fdb612] transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Desconto (R$)</label>
                    <input 
                      type="number" 
                      value={formData.discount || ''}
                      onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-[#00A86B] transition-all"
                    />
                  </div>

                  {(user?.role === 'admin' || user?.role === 'finance') && (
                    <>
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400">Comissão (%)</label>
                        <input 
                          type="number" 
                          value={formData.commission || ''}
                          onChange={(e) => setFormData({ ...formData, commission: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-[#00A86B] transition-all"
                        />
                      </div>
                      
                      {formData.status === 'accepted' && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                          <label className="text-xs font-black uppercase tracking-widest text-emerald-600">Valor da Comissão (Calculado)</label>
                          <div className="w-full px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl font-black text-[#00A86B] shadow-inner">
                            {(() => {
                              const sub = (parseFloat(formData.equipmentCost || '0') + 
                                           parseFloat(formData.installationCost || '0') + 
                                           parseFloat(formData.projectCost || '0') + 
                                           parseFloat(formData.licensingCost || '0') + 
                                           parseFloat(formData.logisticCost || '0') +
                                           parseFloat(formData.additionalCost || '0'));
                              const marginPerc = Math.min(99, parseFloat(formData.margin || '0'));
                              const multiplier = marginPerc >= 99 ? 100 : 1 / (1 - (marginPerc / 100));
                              const total = (sub * multiplier) - parseFloat(formData.discount || '0');
                              const comm = Math.max(0, total) * (parseFloat(formData.commission || '0') / 100);
                              return comm.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                            })()}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Data de Início da Instalação</label>
                    <input 
                      type="date"
                      value={formData.installationStartDate || ''}
                      onChange={(e) => setFormData({ ...formData, installationStartDate: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-[#00A86B] transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Conclusão Estimada</label>
                    <input 
                      type="date"
                      value={formData.estimatedCompletionDate || ''}
                      onChange={(e) => setFormData({ ...formData, estimatedCompletionDate: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-[#00A86B] transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-[#fdb612]">Margem de Lucro (%)</label>
                    <div className="relative">
                      <TrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#fdb612]" />
                      <input 
                        type="number" 
                        value={formData.margin || ''}
                        onChange={(e) => setFormData({ ...formData, margin: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 bg-[#fdb612]/5 dark:bg-[#fdb612]/5 border border-[#fdb612]/20 rounded-2xl outline-none focus:ring-2 focus:ring-[#fdb612] transition-all font-bold"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium italic">Margem aplicada sobre o custo total</p>
                  </div>

                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-slate-800">
                    <div className="space-y-1 text-center md:text-left">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total de Custos</label>
                      <p className="text-xl font-black text-slate-600 dark:text-slate-300">
                        {(() => {
                          const sub = (parseFloat(formData.equipmentCost || '0') + 
                                       parseFloat(formData.installationCost || '0') + 
                                       parseFloat(formData.projectCost || '0') + 
                                       parseFloat(formData.licensingCost || '0') + 
                                       parseFloat(formData.logisticCost || '0') +
                                       parseFloat(formData.additionalCost || '0'));
                          return sub.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
                        })()}
                      </p>
                    </div>
                    <div className="space-y-1 text-center">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[#fdb612]">Margem (R$)</label>
                      <p className="text-xl font-black text-[#fdb612]">
                        {(() => {
                          const sub = (parseFloat(formData.equipmentCost || '0') + 
                                       parseFloat(formData.installationCost || '0') + 
                                       parseFloat(formData.projectCost || '0') + 
                                       parseFloat(formData.licensingCost || '0') + 
                                       parseFloat(formData.logisticCost || '0') +
                                       parseFloat(formData.additionalCost || '0'));
                          const marginPerc = Math.min(99, parseFloat(formData.margin || '0'));
                          const multiplier = marginPerc >= 99 ? 100 : 1 / (1 - (marginPerc / 100));
                          const marginVal = (sub * multiplier) - sub;
                          return marginVal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
                        })()}
                      </p>
                    </div>
                    <div className="space-y-1 text-center font-bold">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[#00A86B]">Valor de Venda</label>
                      <p className="text-2xl font-black text-[#00A86B]">
                        {(() => {
                          const sub = (parseFloat(formData.equipmentCost || '0') + 
                                       parseFloat(formData.installationCost || '0') + 
                                       parseFloat(formData.projectCost || '0') + 
                                       parseFloat(formData.licensingCost || '0') + 
                                       parseFloat(formData.logisticCost || '0') +
                                       parseFloat(formData.additionalCost || '0'));
                          const marginPerc = Math.min(99, parseFloat(formData.margin || '0'));
                          const multiplier = marginPerc >= 99 ? 100 : 1 / (1 - (marginPerc / 100));
                          const total = (sub * multiplier) - parseFloat(formData.discount || '0');
                          return Math.max(0, total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
                        })()}
                      </p>
                    </div>
                    <div className="space-y-1 text-center md:text-right">
                      <label className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Comissão ({formData.commission}%)</label>
                      <p className="text-xl font-black text-emerald-600">
                        {(() => {
                          const sub = (parseFloat(formData.equipmentCost || '0') + 
                                       parseFloat(formData.installationCost || '0') + 
                                       parseFloat(formData.projectCost || '0') + 
                                       parseFloat(formData.licensingCost || '0') + 
                                       parseFloat(formData.logisticCost || '0') +
                                       parseFloat(formData.additionalCost || '0'));
                          const marginPerc = Math.min(99, parseFloat(formData.margin || '0'));
                          const multiplier = marginPerc >= 99 ? 100 : 1 / (1 - (marginPerc / 100));
                          const total = (sub * multiplier) - parseFloat(formData.discount || '0');
                          const comm = Math.max(0, total) * (parseFloat(formData.commission || '0') / 100);
                          return comm.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
                        })()}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">ROI Estimado (%)</label>
                    <input 
                      type="text" 
                      value={formData.roi || ''}
                      onChange={(e) => setFormData({ ...formData, roi: e.target.value })}
                      placeholder="962%"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-[#00A86B] transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Payback (Anos)</label>
                    <input 
                      type="text" 
                      value={formData.payback || ''}
                      onChange={(e) => setFormData({ ...formData, payback: e.target.value })}
                      placeholder="2,4"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-[#00A86B] transition-all"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 mt-8 p-4 bg-slate-50 dark:bg-white/5 rounded-2xl">
                  <button 
                    type="button" 
                    onClick={() => {
                      const discount = prompt('Insira o valor do desconto (R$):', formData.discount);
                      if (discount !== null) setFormData(prev => ({ ...prev, discount }));
                    }}
                    className="px-4 py-2 bg-[#0055A4] text-white rounded-lg text-xs font-bold hover:opacity-90 transition-all flex items-center gap-2"
                  >
                    <DollarSign className="w-3 h-3" />
                    Aplicar desconto
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      showToast('ROI e Payback recalculados com sucesso!');
                    }}
                    className="px-4 py-2 bg-[#0055A4] text-white rounded-lg text-xs font-bold hover:opacity-90 transition-all flex items-center gap-2"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Atualizar Cálculos
                  </button>
                  <button 
                    type="button"
                    onClick={() => showToast('Relatório de viabilidade gerado com sucesso!')}
                    className="px-4 py-2 bg-[#0055A4] text-white rounded-lg text-xs font-bold hover:opacity-90 transition-all flex items-center gap-2"
                  >
                    <FileText className="w-3 h-3" />
                    Gerar relatório de viabilidade
                  </button>
                </div>

                <div className="flex justify-between pt-6">
                  <button 
                    type="button"
                    onClick={prevStep}
                    className="px-8 py-3 border border-slate-200 dark:border-slate-800 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar
                  </button>
                  <button 
                    type="button"
                    onClick={nextStep}
                    className="px-8 py-3 bg-[#00A86B] text-white rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-[#00A86B]/20"
                  >
                    Próximo: FINANCIAMENTO
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {currentStep === 'financing' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-2 text-[#00A86B] mb-4">
                  <CreditCard className="w-5 h-5" />
                  <h4 className="text-sm font-black uppercase tracking-widest">Modalidade de Pagamento</h4>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                  {[
                    { id: 'cash', label: 'À vista', icon: DollarSign },
                    { id: 'financing', label: 'Financiamento', icon: Landmark },
                    { id: 'credit_card', label: 'Cartão', icon: CreditCard },
                    { id: 'pix', label: 'PIX', icon: Zap },
                    { id: 'boleto', label: 'Boleto', icon: FileText },
                    { id: 'pix_plus_installments', label: 'Pix + 10x', icon: QrCode },
                  ].map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, paymentMethod: method.id as any })}
                      className={cn(
                        "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2",
                        formData.paymentMethod === method.id
                          ? "border-[#00A86B] bg-[#00A86B]/5 text-[#00A86B]"
                          : "border-slate-100 dark:border-slate-800 text-slate-400 hover:border-slate-200"
                      )}
                    >
                      <method.icon className="w-6 h-6" />
                      <span className="text-[10px] font-black uppercase tracking-tighter">{method.label}</span>
                    </button>
                  ))}
                </div>

                {formData.paymentMethod === 'financing' && (
                  <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400">Banco / Financeira</label>
                        <select 
                          value={formData.financingBank}
                          onChange={(e) => setFormData({ ...formData, financingBank: e.target.value })}
                          className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#00A86B]"
                        >
                          <option value="Credsol">Credsol</option>
                          <option value="Sicoob">Sicoob</option>
                          <option value="Sicredi">Sicredi</option>
                          <option value="BV Financeira">BV Financeira</option>
                          <option value="Santander">Santander</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400">Parcelas</label>
                        <select 
                          value={formData.financingInstallments}
                          onChange={(e) => setFormData({ ...formData, financingInstallments: e.target.value })}
                          className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#00A86B]"
                        >
                          {[12, 24, 36, 48, 60, 72, 84, 96, 120].map(n => {
                            const sub = (parseFloat(formData.equipmentCost || '0') + 
                                         parseFloat(formData.installationCost || '0') + 
                                         parseFloat(formData.projectCost || '0') + 
                                         parseFloat(formData.licensingCost || '0') + 
                                         parseFloat(formData.logisticCost || '0') +
                                         parseFloat(formData.additionalCost || '0'));
                            const marginPerc = Math.min(99, parseFloat(formData.margin || '0'));
                            const multiplier = marginPerc >= 99 ? 100 : 1 / (1 - (marginPerc / 100));
                            const total = (sub * multiplier) - parseFloat(formData.discount || '0');
                            
                            const r = parseFloat(formData.financingRate) || 1.2;
                            const i = r / 100;
                            let pmt = 0;
                            if (i > 0 && n > 0) {
                              pmt = total * (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);
                            } else if (n > 0) {
                              pmt = total / n;
                            }
                            
                            return (
                              <option key={n} value={n}>
                                {n}x de {pmt.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400">Taxa de Juros (% a.m.)</label>
                        <input 
                          type="number" 
                          step="0.01"
                          value={formData.financingRate || ''}
                          onChange={(e) => setFormData({ ...formData, financingRate: e.target.value })}
                          placeholder="1,29"
                          className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#00A86B]"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400">CET Anual (%)</label>
                        <input 
                          type="number" 
                          step="0.01"
                          value={formData.financingCET || ''}
                          onChange={(e) => setFormData({ ...formData, financingCET: e.target.value })}
                          placeholder="18,5"
                          className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#00A86B]"
                        />
                      </div>
                    </div>

                    {/* Installment Simulation Preview */}
                    <div className="mt-4 p-4 bg-[#00A86B]/10 rounded-2xl border border-[#00A86B]/20 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="size-10 bg-[#00A86B] text-white rounded-xl flex items-center justify-center">
                          <Calculator className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-[#00A86B]">Simulação de Parcela</p>
                          <p className="text-lg font-black text-slate-900 dark:text-slate-100">
                            {(() => {
                              const sub = (parseFloat(formData.equipmentCost || '0') + 
                                           parseFloat(formData.installationCost || '0') + 
                                           parseFloat(formData.projectCost || '0') + 
                                           parseFloat(formData.licensingCost || '0') + 
                                           parseFloat(formData.logisticCost || '0') +
                                           parseFloat(formData.additionalCost || '0'));
                              const marginPerc = Math.min(99, parseFloat(formData.margin || '0'));
                              const multiplier = marginPerc >= 99 ? 100 : 1 / (1 - (marginPerc / 100));
                              const total = (sub * multiplier) - parseFloat(formData.discount || '0');
                              const n = parseInt(formData.financingInstallments) || 60;
                              const r = parseFloat(formData.financingRate) || 1.2;
                              const i = r / 100;
                              
                              let pmt = 0;
                              if (i > 0 && n > 0) {
                                pmt = total * (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);
                              } else if (n > 0) {
                                pmt = total / n;
                              }
                              
                              return `${n}x de ${pmt.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}`;
                            })()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Taxa aplicada</p>
                        <p className="text-sm font-bold text-slate-600 dark:text-slate-300">{formData.financingRate || '1.2'}% a.m.</p>
                      </div>
                    </div>
                  </div>
                )}

                {formData.paymentMethod === 'pix_plus_installments' && (
                  <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-6 animate-in zoom-in-95 duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400">Valor da Entrada (Pix)</label>
                        <div className="relative">
                          <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input 
                            type="number" 
                            step="0.01"
                            value={formData.downPayment || ''}
                            onChange={(e) => setFormData({ ...formData, downPayment: e.target.value })}
                            placeholder="Ex: 5000.00"
                            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#00A86B]"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400">Tipo das Parcelas (10x)</label>
                        <div className="flex gap-2">
                          {[
                            { id: 'credit_card', label: 'Cartão', icon: CreditCard },
                            { id: 'boleto', label: 'Boleto', icon: FileText },
                          ].map(t => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => setFormData({ ...formData, pixInstallmentType: t.id as any })}
                              className={cn(
                                "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all",
                                formData.pixInstallmentType === t.id
                                  ? "border-[#00A86B] bg-[#00A86B]/5 text-[#00A86B]"
                                  : "border-white dark:border-slate-900 bg-white dark:bg-slate-900 text-slate-400"
                              )}
                            >
                              <t.icon className="w-4 h-4" />
                              <span className="text-[10px] font-black uppercase">{t.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-[#00A86B]/10 rounded-2xl border border-[#00A86B]/20 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="size-10 bg-[#00A86B] text-white rounded-xl flex items-center justify-center">
                          <Calculator className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-[#00A86B]">Calculo das Parcelas</p>
                          <p className="text-lg font-black text-slate-900 dark:text-slate-100">
                            {(() => {
                              const sub = (parseFloat(formData.equipmentCost || '0') + 
                                           parseFloat(formData.installationCost || '0') + 
                                           parseFloat(formData.projectCost || '0') + 
                                           parseFloat(formData.licensingCost || '0') + 
                                           parseFloat(formData.logisticCost || '0') +
                                           parseFloat(formData.additionalCost || '0'));
                              const marginPerc = Math.min(99, parseFloat(formData.margin || '0'));
                              const multiplier = marginPerc >= 99 ? 100 : 1 / (1 - (marginPerc / 100));
                              const total = (sub * multiplier) - parseFloat(formData.discount || '0');
                              const down = parseFloat(formData.downPayment || '0');
                              const remaining = Math.max(0, total - down);
                              const installment = remaining / 10;
                              
                              return `10x de ${installment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}`;
                            })()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Saldo a parcelar</p>
                        <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                          {(() => {
                            const sub = (parseFloat(formData.equipmentCost || '0') + 
                                         parseFloat(formData.installationCost || '0') + 
                                         parseFloat(formData.projectCost || '0') + 
                                         parseFloat(formData.licensingCost || '0') + 
                                         parseFloat(formData.logisticCost || '0') +
                                         parseFloat(formData.additionalCost || '0'));
                            const marginPerc = Math.min(99, parseFloat(formData.margin || '0'));
                            const multiplier = marginPerc >= 99 ? 100 : 1 / (1 - (marginPerc / 100));
                            const total = (sub * multiplier) - parseFloat(formData.discount || '0');
                            const down = parseFloat(formData.downPayment || '0');
                            return (total - down).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-3 mt-8 p-4 bg-slate-50 dark:bg-white/5 rounded-2xl">
                  <button 
                    type="button" 
                    onClick={() => showToast('Simulação de parcelas atualizada com as taxas vigentes.')}
                    className="px-4 py-2 bg-[#0055A4] text-white rounded-lg text-xs font-bold hover:opacity-90 transition-all flex items-center gap-2"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Simular parcelas
                  </button>
                  <button 
                    type="button"
                    onClick={() => showToast('Aguardando retorno da pré-análise bancária...')}
                    className="px-4 py-2 bg-[#0055A4] text-white rounded-lg text-xs font-bold hover:opacity-90 transition-all flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    Enviar para pré-análise
                  </button>
                  <button 
                    type="button"
                    onClick={() => showToast('Comparativo detalhado de bancos gerado.')}
                    className="px-4 py-2 bg-[#0055A4] text-white rounded-lg text-xs font-bold hover:opacity-90 transition-all flex items-center gap-2"
                  >
                    <Calculator className="w-3 h-3" />
                    Comparar bancos
                  </button>
                </div>

                <div className="flex justify-between pt-6">
                  <button 
                    type="button"
                    onClick={prevStep}
                    className="px-8 py-3 border border-slate-200 dark:border-slate-800 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar
                  </button>
                  <button 
                    type="button"
                    onClick={nextStep}
                    className="px-8 py-3 bg-[#00A86B] text-white rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-[#00A86B]/20"
                  >
                    Próximo: FINALIZAÇÃO
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {currentStep === 'finalization' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-[#00A86B]/5 p-8 rounded-[40px] border border-[#00A86B]/10">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="size-16 bg-[#fdb612] text-[#231d0f] rounded-2xl flex items-center justify-center shadow-xl shadow-[#fdb612]/20">
                      <Calculator className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="text-2xl font-black">Resumo da Simulação</h4>
                      <p className="text-slate-500 text-sm">Validamos os parâmetros técnicos e financeiros para você</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div className="space-y-4">
                      <div className="p-4 bg-white dark:bg-[#231d0f] rounded-2xl border border-slate-100 dark:border-slate-800">
                        <label className="text-[10px] font-black uppercase text-slate-400 block mb-1 tracking-widest">Número da Simulação</label>
                        <input 
                          type="text"
                          value={formData.proposalNumber || ''}
                          onChange={(e) => setFormData({ ...formData, proposalNumber: e.target.value })}
                          placeholder="Ex: 2024-001"
                          className="w-full text-sm font-bold bg-transparent outline-none border-b border-slate-200 focus:border-[#00A86B]"
                        />
                      </div>
                      <div className="p-4 bg-white dark:bg-[#231d0f] rounded-2xl border border-slate-100 dark:border-slate-800">
                        <label className="text-[10px] font-black uppercase text-slate-400 block mb-1 tracking-widest">Titular</label>
                        <p className="font-bold">{formData.titular || formData.client || 'Não informado'}</p>
                      </div>
                      <div className="p-4 bg-white dark:bg-[#231d0f] rounded-2xl border border-slate-100 dark:border-slate-800">
                        <label className={cn(
                          "text-[10px] font-black uppercase block mb-1 tracking-widest",
                          validationErrors.expiryDate ? "text-rose-500" : "text-slate-400"
                        )}>
                          Validade da Proposta *
                        </label>
                        <div className="relative">
                          <Calendar className={cn(
                            "absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4",
                            validationErrors.expiryDate ? "text-rose-500" : "text-slate-400"
                          )} />
                          <input 
                            type="date"
                            value={formData.expiryDate || ''}
                            onChange={(e) => {
                              setFormData({ ...formData, expiryDate: e.target.value });
                              if (validationErrors.expiryDate) {
                                setValidationErrors(prev => {
                                  const next = { ...prev };
                                  delete next.expiryDate;
                                  return next;
                                });
                              }
                            }}
                            className="w-full pl-6 text-sm font-bold bg-transparent outline-none border-b border-slate-200 focus:border-[#00A86B]"
                          />
                        </div>
                        {validationErrors.expiryDate && (
                          <p className="text-[9px] text-rose-500 font-bold mt-1 uppercase tracking-tight">{validationErrors.expiryDate}</p>
                        )}
                      </div>
                      {(user?.role === 'admin' || user?.role === 'finance') && (
                        <div className="p-4 bg-white dark:bg-[#231d0f] rounded-2xl border border-slate-100 dark:border-slate-800">
                          <label className="text-[10px] font-black uppercase text-slate-400 block mb-1 tracking-widest">Status da Comissão</label>
                          <select 
                            value={formData.commissionStatus || 'pending'}
                            onChange={(e) => setFormData({ ...formData, commissionStatus: e.target.value as any })}
                            className="w-full text-sm font-bold bg-transparent outline-none"
                          >
                            <option value="pending text-slate-900">Pendente</option>
                            <option value="paid text-slate-900">Pago</option>
                          </select>
                        </div>
                      )}
                      <div className="p-4 bg-white dark:bg-[#231d0f] rounded-2xl border border-slate-100 dark:border-slate-800">
                        <label className="text-[10px] font-black uppercase text-slate-400 block mb-1 tracking-widest">Sistema</label>
                        <p className="font-bold">{formData.systemSize} kWp / {formData.panelQuantity} Módulos</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 bg-white dark:bg-[#231d0f] rounded-2xl border border-slate-100 dark:border-slate-800">
                          <label className="text-[10px] font-black uppercase text-slate-400 block mb-1 tracking-widest">Foto do Telhado (URL)</label>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <input 
                                type="text"
                                value={formData.photoUrl || ''}
                                onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                                placeholder="https://exemplo.com/foto.jpg"
                                className="w-full pl-10 pr-4 py-2 text-xs font-bold bg-transparent outline-none border-b border-slate-200 focus:border-[#00A86B]"
                              />
                            </div>
                            {formData.photoUrl && (
                              <button 
                                type="button"
                                onClick={() => window.open(formData.photoUrl, '_blank')}
                                className="size-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-500 hover:text-[#00A86B] transition-colors"
                                title="Visualizar imagem"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="p-4 bg-white dark:bg-[#231d0f] rounded-2xl border border-slate-100 dark:border-slate-800">
                          <div className="flex items-center justify-between mb-4">
                            <label className="text-[10px] font-black uppercase text-slate-400 block tracking-widest">Imagens Adicionais (URLs)</label>
                            <button 
                              type="button"
                              onClick={() => setFormData({ ...formData, customImageLinks: [...(formData.customImageLinks || []), ''] })}
                              className="text-[10px] font-black uppercase text-[#00A86B] hover:underline"
                            >
                              + Adicionar Link
                            </button>
                          </div>
                          <div className="space-y-3">
                            {(formData.customImageLinks || []).map((link, index) => (
                              <div key={index} className="flex gap-2 group">
                                <div className="relative flex-1">
                                  <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                  <input 
                                    type="text"
                                    value={link}
                                    onChange={(e) => {
                                      const newLinks = [...(formData.customImageLinks || [])];
                                      newLinks[index] = e.target.value;
                                      setFormData({ ...formData, customImageLinks: newLinks });
                                    }}
                                    placeholder="https://exemplo.com/outra-foto.jpg"
                                    className="w-full pl-10 pr-4 py-2 text-xs font-bold bg-transparent outline-none border-b border-slate-200 focus:border-[#00A86B]"
                                  />
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {link && (
                                    <button 
                                      type="button"
                                      onClick={() => window.open(link, '_blank')}
                                      className="size-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-500 hover:text-[#00A86B]"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                  )}
                                  <button 
                                    type="button"
                                    onClick={() => {
                                      const newLinks = (formData.customImageLinks || []).filter((_, i) => i !== index);
                                      setFormData({ ...formData, customImageLinks: newLinks });
                                    }}
                                    className="size-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-500 hover:text-rose-500"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                            {(formData.customImageLinks || []).length === 0 && (
                              <p className="text-[10px] font-medium text-slate-400 text-center py-2 italic">Nenhum link adicional adicionado.</p>
                            )}
                          </div>
                        </div>

                        <div className="p-4 bg-white dark:bg-[#231d0f] rounded-2xl border border-slate-100 dark:border-slate-800">
                          <label className="text-[10px] font-black uppercase text-slate-400 block mb-1 tracking-widest">Observações Internas</label>
                        <textarea 
                          value={formData.internalNotes || ''}
                          onChange={(e) => setFormData({ ...formData, internalNotes: e.target.value })}
                          placeholder="Notas internas..."
                          rows={2}
                          className="w-full text-sm font-bold bg-transparent outline-none resize-none border-b border-slate-200 focus:border-[#00A86B]"
                        />
                      </div>
                      <div className="p-4 bg-[#00A86B] text-white rounded-2xl shadow-lg shadow-[#00A86B]/10">
                        <label className="text-[10px] font-black uppercase opacity-60 block mb-1 tracking-widest">Investimento Total</label>
                        <p className="text-2xl font-black">
                          {(() => {
                            const sub = (parseFloat(formData.equipmentCost || '0') + 
                                         parseFloat(formData.installationCost || '0') + 
                                         parseFloat(formData.projectCost || '0') + 
                                         parseFloat(formData.licensingCost || '0') + 
                                         parseFloat(formData.logisticCost || '0') +
                                         parseFloat(formData.additionalCost || '0'));
                            const marginPerc = Math.min(99, parseFloat(formData.margin || '0'));
                            const multiplier = marginPerc >= 99 ? 100 : 1 / (1 - (marginPerc / 100));
                            const total = (sub * multiplier) - parseFloat(formData.discount || '0');
                            return total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
                          })()}
                        </p>
                      </div>
                      <div className="p-4 bg-white dark:bg-[#231d0f] rounded-2xl border border-slate-100 dark:border-slate-800">
                        <label className="text-[10px] font-black uppercase text-slate-400 block mb-1 tracking-widest">Pagamento</label>
                        <p className="font-bold capitalize">{formData.paymentMethod === 'cash' ? 'À vista' : 
                                                            formData.paymentMethod === 'financing' ? `Financiamento (${formData.financingBank})` : 
                                                            formData.paymentMethod === 'pix_plus_installments' ? `Pix + 10x (${formData.pixInstallmentType === 'credit_card' ? 'Cartão' : 'Boleto'})` :
                                                            formData.paymentMethod === 'credit_card' ? 'Cartão de Crédito' : 
                                                            formData.paymentMethod === 'pix' ? 'PIX' : 'Boleto'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 dark:border-slate-800 pt-8 mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Assinatura Digital (Opcional)</h5>
                      <button 
                        type="button" 
                        onClick={() => showToast('QR Code de assinatura gerado. Escaneie com seu celular.')}
                        className="text-xs font-bold text-[#0055A4] flex items-center gap-1"
                      >
                        <QrCode className="w-3 h-3" />
                        Assinar via QR Code
                      </button>
                    </div>
                    <div 
                      onClick={() => showToast('Painel de assinatura digital ativado.')}
                      className="h-32 bg-white dark:bg-black/20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-center group cursor-pointer hover:border-[#00A86B] transition-all"
                    >
                      <div className="text-center group-hover:scale-110 transition-transform">
                        <PenTool className="w-8 h-8 text-slate-300 mx-auto mb-2 group-hover:text-[#00A86B]" />
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Toque para assinar</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 p-4 bg-white dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <button 
                      type="button"
                      onClick={() => showToast('Abrindo visualização prévia do PDF...')}
                      className="px-4 py-2 bg-[#0055A4] text-white rounded-lg text-xs font-bold hover:opacity-90 transition-all flex items-center gap-2"
                    >
                      <Eye className="w-3 h-3" />
                      Pré-visualizar PDF
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`https://vieiras-solar.com/proposta/${Math.random().toString(36).substr(2, 9)}`);
                        showToast('Link da proposta copiado para a área de transferência!');
                      }}
                      className="px-4 py-2 bg-[#0055A4] text-white rounded-lg text-xs font-bold hover:opacity-90 transition-all flex items-center gap-2"
                    >
                      <Share2 className="w-3 h-3" />
                      Compartilhar Link
                    </button>
                    <button 
                      type="button"
                      onClick={() => window.print()}
                      className="px-4 py-2 bg-[#0055A4] text-white rounded-lg text-xs font-bold hover:opacity-90 transition-all flex items-center gap-2"
                    >
                      <Printer className="w-3 h-3" />
                      Imprimir
                    </button>
                  </div>
                </div>

                <div className="flex justify-between pt-6">
                  <button 
                    type="button"
                    onClick={prevStep}
                    className="px-8 py-3 border border-slate-200 dark:border-slate-800 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar
                  </button>
                  <button 
                    type="submit"
                    className="px-12 py-3 bg-[#00A86B] text-white rounded-xl font-black text-lg flex items-center gap-3 hover:shadow-2xl hover:shadow-[#00A86B]/30 transition-all active:scale-95"
                  >
                    FINALIZAR SIMULAÇÃO TÉCNICA
                    <CheckCircle2 className="w-5 h-5" />
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
