import React, { useState, useEffect } from 'react';
import { 
  ChevronRight, 
  Sun, 
  Zap, 
  DollarSign, 
  ArrowRight, 
  CheckCircle2, 
  Headset,
  HelpCircle,
  Sparkles,
  RefreshCw,
  Loader2,
  X,
  TrendingUp,
  Info,
  Mail,
  Phone,
  Building2,
  ShieldCheck,
  Plus,
  LayoutGrid,
  Search,
  Trash2,
  Save,
  AlertTriangle,
  CreditCard,
  FileText,
  Send
} from 'lucide-react';
import { cn } from '../lib/utils';
import { GoogleGenAI } from "@google/genai";
import { Partner, Kit } from '../types';
import { updateDocument } from '../firestoreUtils';
import { db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { NewKitModal } from './NewKitModal';
import { useToast } from '../hooks/useToast';

interface ConfigViewProps {
  onClose?: () => void;
  partners?: Partner[];
}

export const ConfigView: React.FC<ConfigViewProps> = ({ onClose, partners = [] }) => {
  const { showToast, removeToast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [dimensioningType, setDimensioningType] = useState<'kWp' | 'kWh'>('kWp');
  const [desiredPower, setDesiredPower] = useState<string>('12.20');
  const [phases, setPhases] = useState<string>('BIFÁSICO 220V');
  const [deliveryCity, setDeliveryCity] = useState<string>('Inhapim - MG');
  const [structure, setStructure] = useState<string>('Telhado Fibrocimento - Estrutura Metálica (250mm)');
  const [panelType, setPanelType] = useState<'610-bifacial' | '610-mono'>('610-bifacial');
  const [inverterType, setInverterType] = useState<'micro' | 'string'>('micro');
  const [annualUsage, setAnnualUsage] = useState<string>('12000');
  const [monthlyBill, setMonthlyBill] = useState<string>('250');
  const [systemSize, setSystemSize] = useState<string>('8.6');
  const [orientation, setOrientation] = useState<string>('Sul (180°)');
  const [roofMaterial, setRoofMaterial] = useState<string>('Telha Asfáltica');
  const [roofPitch, setRoofPitch] = useState<number>(25);
  const [shading, setShading] = useState<string>('Nenhum (Sol Direto)');
  const [ucNumber, setUcNumber] = useState<string>('');
  const [monthlyConsumption, setMonthlyConsumption] = useState<string>('');
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');
  const [partnerEmail, setPartnerEmail] = useState<string>('');
  const [partnerPhone, setPartnerPhone] = useState<string>('');
  const [partnerCnpj, setPartnerCnpj] = useState<string>('');
  const [partnerType, setPartnerType] = useState<string>('integrator');
  const [cnpjError, setCnpjError] = useState<string | null>(null);
  const [cnpjStatus, setCnpjStatus] = useState<string | null>(null);
  const [isConsultingCnpj, setIsConsultingCnpj] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [annualUsageError, setAnnualUsageError] = useState<string | null>(null);
  const [monthlyBillError, setMonthlyBillError] = useState<string | null>(null);
  const [systemSizeError, setSystemSizeError] = useState<string | null>(null);
  const [lossesError, setLossesError] = useState<string | null>(null);
  const [monthlyConsumptionError, setMonthlyConsumptionError] = useState<string | null>(null);
  const [installationPriceError, setInstallationPriceError] = useState<string | null>(null);
  const [engineeringPriceError, setEngineeringPriceError] = useState<string | null>(null);
  const [additionalCostsError, setAdditionalCostsError] = useState<string | null>(null);
  const [marginPercentageError, setMarginPercentageError] = useState<string | null>(null);
  const [energyInflationError, setEnergyInflationError] = useState<string | null>(null);
  const [panelDepreciationError, setPanelDepreciationError] = useState<string | null>(null);
  const [maintenanceRateError, setMaintenanceRateError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCalculatingROI, setIsCalculatingROI] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isValidatingFortlev, setIsValidatingFortlev] = useState(false);
  const [paybackTime, setPaybackTime] = useState<string>('6.2 Anos');
  const [roiPercentage, setRoiPercentage] = useState<string>('14.5%');
  const [energyInflation, setEnergyInflation] = useState<string>('5');
  const [panelDepreciation, setPanelDepreciation] = useState<string>('0.5');
  const [maintenanceRate, setMaintenanceRate] = useState<string>('1');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [roiError, setRoiError] = useState<string | null>(null);
  const [showCheckmark, setShowCheckmark] = useState(false);
  const [showFortlevLogin, setShowFortlevLogin] = useState(false);
  const [fortlevEmail, setFortlevEmail] = useState('');
  const [fortlevPassword, setFortlevPassword] = useState('');
  const [rememberFortlev, setRememberFortlev] = useState(false);
  const [isFortlevConnected, setIsFortlevConnected] = useState(false);
  const [kits, setKits] = useState<Kit[]>([]);
  const [isConsultingKits, setIsConsultingKits] = useState(false);
  const [selectedKitId, setSelectedKitId] = useState<number | string | null>(null);
  const [inverterBrandFilter, setInverterBrandFilter] = useState<string[]>([]);
  const [moduleBrandFilter, setModuleBrandFilter] = useState<string[]>([]);
  const [filterByPower, setFilterByPower] = useState(true);
  const [selectedKitComponents, setSelectedKitComponents] = useState<any[]>([]);
  const [losses, setLosses] = useState<number>(25);
  const [efficiency, setEfficiency] = useState<number>(116);
  const [tasks, setTasks] = useState<{ id: string; text: string; completed: boolean }[]>([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [kitSearchTerm, setKitSearchTerm] = useState('');
  const [showNewKitModal, setShowNewKitModal] = useState(false);
  const [installationPrice, setInstallationPrice] = useState<string>('0');
  const [engineeringPrice, setEngineeringPrice] = useState<string>('0');
  const [marginPercentage, setMarginPercentage] = useState<string>('20');
  const [additionalCosts, setAdditionalCosts] = useState<string>('0');
  const [fortlevErrors, setFortlevErrors] = useState<{ email?: string; password?: string }>({});
  const [fortlevLoginError, setFortlevLoginError] = useState<string | null>(null);

  useEffect(() => {
    const annual = parseFloat(annualUsage);
    if (!isNaN(annual) && annual > 0) {
      const monthly = (annual / 12).toFixed(0);
      if (monthly !== monthlyConsumption) {
        setMonthlyConsumption(monthly);
      }
    }
  }, [annualUsage]);

  useEffect(() => {
    const monthly = parseFloat(monthlyConsumption);
    if (!isNaN(monthly) && monthly > 0) {
      const calculatedSize = (monthly / 116).toFixed(2);
      if (calculatedSize !== systemSize) {
        setSystemSize(calculatedSize);
      }
    }
  }, [monthlyConsumption]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'kits'), (snapshot) => {
      const kitsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Kit));
      if (kitsData.length === 0) {
        // Add mock kits if none exist
        setKits([
          {
            id: '1',
            name: 'Gerador FV 12.30 kWp',
            description: 'Kit Solar Completo',
            power: 12.30,
            price: 16545.84,
            overload: 64.00,
            panelBrand: 'TCL',
            inverterBrand: 'SUNGROW',
            panelImage: 'https://fortlevsolar.com.br/wp-content/uploads/2021/06/modulo-fotovoltaico.png',
            inverterImage: 'https://fortlevsolar.com.br/wp-content/uploads/2021/06/inversor.png',
            components: [],
            status: 'active',
            createdAt: new Date().toISOString()
          },
          {
            id: '2',
            name: 'Gerador FV 12.30 kWp',
            description: 'Kit Solar Completo',
            power: 12.30,
            price: 16739.44,
            overload: 53.75,
            panelBrand: 'GROWATT',
            inverterBrand: 'GROWATT',
            panelImage: 'https://fortlevsolar.com.br/wp-content/uploads/2021/06/modulo-fotovoltaico.png',
            inverterImage: 'https://fortlevsolar.com.br/wp-content/uploads/2021/06/inversor.png',
            components: [],
            status: 'active',
            createdAt: new Date().toISOString()
          },
          {
            id: '3',
            name: 'Gerador FV 12.30 kWp',
            description: 'Kit Solar Completo',
            power: 12.30,
            price: 17019.48,
            overload: 53.75,
            panelBrand: 'SUNGROW',
            inverterBrand: 'SUNGROW',
            panelImage: 'https://fortlevsolar.com.br/wp-content/uploads/2021/06/modulo-fotovoltaico.png',
            inverterImage: 'https://fortlevsolar.com.br/wp-content/uploads/2021/06/inversor.png',
            components: [],
            status: 'active',
            createdAt: new Date().toISOString()
          }
        ]);
      } else {
        setKits(kitsData);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (currentStep === 2 && kits.length === 0 && !isConsultingKits) {
      handleConsultKits();
    }
  }, [currentStep, kits.length, isConsultingKits]);

  const steps = [
    { id: 1, label: 'Parâmetros' },
    { id: 2, label: 'Catálogo' },
    { id: 3, label: 'Precificação' },
    { id: 4, label: 'Validação' },
    { id: 5, label: 'Financiamento' },
    { id: 6, label: 'Finalização' },
  ];

  const validateROI = (value: string) => {
    const roiRegex = /^\d+(\.\d+)?%$/;
    if (value && !roiRegex.test(value)) {
      setRoiError('Formato inválido. Use apenas números e o símbolo % (ex: 14.5%).');
    } else {
      setRoiError(null);
    }
  };

  const validatePositiveNumber = (value: string, fieldName: string, setError: (err: string | null) => void) => {
    const num = parseFloat(value);
    if (value && (isNaN(num) || num <= 0)) {
      setError(`${fieldName} deve ser um número positivo maior que zero`);
      return false;
    }
    setError(null);
    return true;
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

  const consultCnpj = async (cnpj: string) => {
    const cleaned = cnpj.replace(/\D/g, '');
    if (cleaned.length !== 14) return;

    setIsConsultingCnpj(true);
    setCnpjError(null);
    setCnpjStatus(null);

    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleaned}`);
      if (response.ok) {
        const data = await response.json();
        if (data.descricao_situacao_cadastral) {
          setCnpjStatus(data.descricao_situacao_cadastral);
          if (data.descricao_situacao_cadastral !== 'ATIVA') {
            setCnpjError(`CNPJ INVÁLIDO OU INATIVO (Status: ${data.descricao_situacao_cadastral})`);
            showToast(`CNPJ ${cleaned} não está ativo.`, 'error');
          } else {
            showToast('CNPJ validado com sucesso!', 'success');
          }
        }
      } else {
        setCnpjError('CNPJ não encontrado ou inválido');
        showToast('CNPJ não encontrado na base de dados.', 'error');
      }
    } catch (error) {
      console.error('Error in CNPJ consultation:', error);
      setCnpjError('Serviço de consulta indisponível');
      showToast('Erro ao consultar CNPJ. Tente novamente.', 'error');
    } finally {
      setIsConsultingCnpj(false);
    }
  };

  const handleGenerateROI = () => {
    const size = parseFloat(systemSize);
    if (isNaN(size) || size <= 0) {
      showToast('Por favor, insira um tamanho de sistema válido (número positivo).', 'warning');
      return;
    }

    setIsCalculatingROI(true);
    showToast('Calculando ROI e Payback com projeção de 25 anos...');
    
    // Simulate calculation based on inputs
    setTimeout(() => {
      const usage = parseInt(annualUsage) || 12000;
      const bill = parseInt(monthlyBill) || 250;
      const kwp = parseFloat(systemSize) || 8.6;
      
      // Financial Parameters (Dynamic)
      const inflation = (parseFloat(energyInflation) || 5) / 100;
      const depreciation = (parseFloat(panelDepreciation) || 0.5) / 100;
      const maintRate = (parseFloat(maintenanceRate) || 1) / 100;
      const energyRate = (bill * 12) / usage; // Estimated R$ per kWh
      
      const systemCost = kwp * 4500; // Estimated R$ 4.50 per Wp
      const annualGeneration = kwp * 1400; // Estimated 1400 kWh/kWp per year
      const annualMaintenance = systemCost * maintRate;
      
      let cumulativeSavings = 0;
      let paybackYear = 0;
      const years = 25;
      
      for (let year = 1; year <= years; year++) {
        const generation = annualGeneration * Math.pow(1 - depreciation, year - 1);
        const rate = energyRate * Math.pow(1 + inflation, year - 1);
        const annualSavings = (generation * rate) - annualMaintenance;
        
        cumulativeSavings += annualSavings;
        
        if (paybackYear === 0 && cumulativeSavings >= systemCost) {
          paybackYear = year + (systemCost - (cumulativeSavings - annualSavings)) / annualSavings;
        }
      }
      
      const avgAnnualROI = ((cumulativeSavings / years) / systemCost) * 100;

      setPaybackTime(`${paybackYear.toFixed(1)} Anos`);
      const newRoi = `${avgAnnualROI.toFixed(1)}%`;
      setRoiPercentage(newRoi);
      validateROI(newRoi);
      
      setIsCalculatingROI(false);
      setShowCheckmark(true);
      setTimeout(() => setShowCheckmark(false), 3000);
    }, 1500);
  };

  const handleGenerateNew = async () => {
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "Gere valores realistas para um sistema de energia solar residencial no Brasil. Retorne apenas um JSON com os campos: annualUsage (número entre 5000 e 20000), monthlyBill (número entre 150 e 800), systemSize (número entre 3 e 15), orientation (um de: 'Sul (180°)', 'Oeste (270°)', 'Leste (90°)', 'Sudoeste (225°)'), roofMaterial (um de: 'Telha Asfáltica', 'Metal com Costura Alzada', 'Telha de Concreto', 'Plano / TPO'), roofPitch (número entre 10 e 45), shading (um de: 'Nenhum (Sol Direto)', 'Leve (Poucas árvores)', 'Moderado', 'Pesado'), panelType ('610-bifacial' ou '610-mono'), inverterType ('micro' ou 'string').",
        config: {
          responseMimeType: "application/json"
        }
      });

      const data = JSON.parse(response.text || '{}');
      if (data.annualUsage) setAnnualUsage(data.annualUsage.toString());
      if (data.monthlyBill) setMonthlyBill(data.monthlyBill.toString());
      if (data.systemSize) setSystemSize(data.systemSize.toString());
      if (data.orientation) {
        const orientationMap: Record<string, string> = {
          'South (180°)': 'Sul (180°)',
          'West (270°)': 'Oeste (270°)',
          'East (90°)': 'Leste (90°)',
          'Southwest (225°)': 'Sudoeste (225°)'
        };
        setOrientation(orientationMap[data.orientation] || data.orientation);
      }
      if (data.roofMaterial) {
        const materialMap: Record<string, string> = {
          'Asphalt Shingle': 'Telha Asfáltica',
          'Standing Seam Metal': 'Metal com Costura Alzada',
          'Concrete Tile': 'Telha de Concreto',
          'Flat / TPO': 'Plano / TPO'
        };
        setRoofMaterial(materialMap[data.roofMaterial] || data.roofMaterial);
      }
      if (data.roofPitch) setRoofPitch(data.roofPitch);
      if (data.shading) {
        const shadingMap: Record<string, string> = {
          'None (Direct Sun)': 'Nenhum (Sol Direto)',
          'Light (Few trees)': 'Leve (Poucas árvores)',
          'Moderate': 'Moderado',
          'Heavy': 'Pesado'
        };
        setShading(shadingMap[data.shading] || data.shading);
      }
      if (data.panelType) setPanelType(data.panelType);
      if (data.inverterType) setInverterType(data.inverterType);
    } catch (error) {
      console.error("Error generating simulator:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRedo = () => {
    // Reset to defaults or just trigger a re-calculation (which is automatic in this UI)
    setAnnualUsage('12000');
    setMonthlyBill('250');
    setOrientation('Sul (180°)');
    setRoofMaterial('Telha Asfáltica');
    setRoofPitch(25);
    setShading('Nenhum (Sol Direto)');
    setPanelType('610-bifacial');
    setInverterType('micro');
    setUcNumber('');
    setMonthlyConsumption('');
    setSelectedPartnerId('');
    setPartnerEmail('');
    setPartnerPhone('');
    setPartnerType('integrator');
    setSystemSize('8.6');
  };

  const handleAutoCalculateSystemSize = () => {
    const consumption = parseFloat(monthlyConsumption);
    if (!isNaN(consumption) && consumption > 0) {
      const calculatedSize = consumption / 116;
      setSystemSize(calculatedSize.toFixed(2));
      showToast(`Potência calculada: ${calculatedSize.toFixed(2)} kWp`);
    } else {
      showToast('Por favor, insira o consumo mensal primeiro.');
    }
  };

  const estimatedGeneration = parseFloat(systemSize) * efficiency;

  const handleConsultKits = async () => {
    setIsConsultingKits(true);
    showToast('Consultando kits Fortlev Solar...');
    try {
      const response = await fetch('/api/fortlev/kits');
      const data = await response.json();
      
      const extractPower = (name: string) => {
        const match = name.match(/(\d+[.,]\d+)/) || name.match(/(\d+)/);
        return match ? parseFloat(match[1].replace(',', '.')) : null;
      };

      setKits(data.map((k: any) => ({
        id: k.id,
        name: k.name,
        panels: k.panels,
        inverter: k.inverter,
        price: k.price,
        description: k.description,
        power: k.power || extractPower(k.name),
        components: k.components || [
          { name: 'Painéis', quantity: k.panels, brand: 'Fortlev', model: 'Standard' },
          { name: 'Inversor', quantity: 1, brand: k.inverter, model: 'Standard' }
        ]
      })));
      setIsConsultingKits(false);
      showToast('Kits atualizados via API Fortlev');
    } catch (error) {
      setIsConsultingKits(false);
      showToast('Erro ao consultar kits');
    }
  };

  const handleRemoveKit = (id: any) => {
    setKits(kits.filter(k => k.id !== id));
    if (selectedKitId === id) {
      setSelectedKitId(null);
      setSelectedKitComponents([]);
    }
    showToast('Kit removido da lista');
  };

  const handleSelectKit = (id: any) => {
    setSelectedKitId(id);
    const kit = kits.find(k => k.id === id);
    if (kit) {
      setSelectedKitComponents(kit.components || [
        { name: 'Painéis', quantity: kit.panels || 0, brand: '', model: '' },
        { name: 'Inversor', quantity: 1, brand: kit.inverter || '', model: '' }
      ]);
    }
  };

  const handleUpdateComponent = (idx: number, field: string, value: any) => {
    const newComps = [...selectedKitComponents];
    newComps[idx] = { ...newComps[idx], [field]: value };
    setSelectedKitComponents(newComps);
    
    // Also update the kit in the main list so the changes persist in the current session
    if (selectedKitId) {
      setKits(kits.map(k => k.id === selectedKitId ? { ...k, components: newComps } : k));
    }
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

  const handlePartnerChange = (id: string) => {
    setSelectedPartnerId(id);
    const partner = partners.find(p => p.id === id);
    if (partner) {
      setPartnerEmail(partner.email);
      setPartnerPhone(formatPhone(partner.phone));
      setPartnerCnpj(formatCNPJ(partner.cnpj || ''));
      setPartnerType(partner.type);
    } else {
      setPartnerEmail('');
      setPartnerPhone('');
      setPartnerCnpj('');
      setPartnerType('integrator');
    }
    setCnpjError(null);
    setCnpjStatus(null);
    setEmailError(null);
    setPhoneError(null);
    setAnnualUsageError(null);
    setMonthlyBillError(null);
    setSystemSizeError(null);
    setLossesError(null);
    setMonthlyConsumptionError(null);
  };

  const handleNumericalChange = (value: string, fieldName: string, setter: (val: string) => void, setError: (err: string | null) => void) => {
    setter(value);
    validatePositiveNumber(value, fieldName, setError);
  };

  const addTask = () => {
    if (newTaskText.trim()) {
      setTasks([...tasks, { id: Date.now().toString(), text: newTaskText, completed: false }]);
      setNewTaskText('');
      showToast('Tarefa adicionada');
    }
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const removeTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
    showToast('Tarefa removida');
  };

  const availableInverterBrands = Array.from(new Set(kits.map(k => k.inverterBrand || k.components?.find((c: any) => c.name?.toLowerCase().includes('inversor'))?.brand).filter(Boolean)));
  const availableModuleBrands = Array.from(new Set(kits.map(k => k.panelBrand || k.components?.find((c: any) => c.name?.toLowerCase().includes('painel') || c.name?.toLowerCase().includes('módulo'))?.brand).filter(Boolean)));

  const filteredKits = kits.filter(kit => {
    const searchLower = kitSearchTerm.toLowerCase();
    const nameMatch = kit.name.toLowerCase().includes(searchLower);
    const descMatch = kit.description.toLowerCase().includes(searchLower);
    const powerSearchMatch = kit.power && kit.power.toString().includes(kitSearchTerm);
    
    // Brand filtering
    const kitInverterBrand = kit.inverterBrand || kit.components?.find((c: any) => c.name?.toLowerCase().includes('inversor'))?.brand;
    const kitModuleBrand = kit.panelBrand || kit.components?.find((c: any) => c.name?.toLowerCase().includes('painel') || c.name?.toLowerCase().includes('módulo'))?.brand;

    const inverterMatch = inverterBrandFilter.length === 0 || (kitInverterBrand && inverterBrandFilter.includes(kitInverterBrand));
    const moduleMatch = moduleBrandFilter.length === 0 || (kitModuleBrand && moduleBrandFilter.includes(kitModuleBrand));

    if (!inverterMatch || !moduleMatch) return false;

    // Enhanced search: check component brands and models
    const componentsMatch = kit.components?.some((comp: any) => 
      comp.brand?.toLowerCase().includes(searchLower) || 
      comp.model?.toLowerCase().includes(searchLower) ||
      comp.name?.toLowerCase().includes(searchLower)
    );
    
    // Legacy fields check (if components array is missing)
    const panelSearchMatch = kit.panels && kit.panels.toLowerCase().includes(searchLower);
    const inverterSearchMatch = kit.inverter && kit.inverter.toLowerCase().includes(searchLower);
    
    // Date filtering
    let dateMatch = true;
    if (startDate || endDate) {
      const kitDate = kit.createdAt ? new Date(kit.createdAt) : null;
      if (kitDate) {
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (kitDate < start) dateMatch = false;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (kitDate > end) dateMatch = false;
        }
      } else {
        dateMatch = false; // If kit has no date but filter is active
      }
    }

    const size = parseFloat(systemSize.replace(',', '.'));
    if (filterByPower && !isNaN(size) && size > 0) {
      const kitPower = parseFloat(kit.power);
      if (!isNaN(kitPower)) {
        const rangeMatch = kitPower >= size * 0.7 && kitPower <= size * 1.5;
        if (kitSearchTerm) {
          return (nameMatch || descMatch || powerSearchMatch || panelSearchMatch || inverterSearchMatch || componentsMatch) && rangeMatch && dateMatch;
        }
        return rangeMatch && dateMatch;
      }
    }
    
    return (nameMatch || descMatch || powerSearchMatch || panelSearchMatch || inverterSearchMatch || componentsMatch) && dateMatch;
  });

  const handleSaveDraft = () => {
    if (cnpjError) {
      showToast('Não é possível salvar com um CNPJ inválido ou inativo.', 'error');
      return;
    }

    setIsSavingDraft(true);
    showToast('Salvando rascunho...');

    setTimeout(() => {
      const draft = {
        currentStep,
        panelType,
        inverterType,
        annualUsage,
        monthlyBill,
        systemSize,
        orientation,
        roofMaterial,
        roofPitch,
        shading,
        ucNumber,
        monthlyConsumption,
        energyInflation,
        panelDepreciation,
        maintenanceRate,
        losses,
        efficiency
      };
      localStorage.setItem('solar_simulator_draft', JSON.stringify(draft));
      setIsSavingDraft(false);
      showToast('Rascunho salvo localmente!', 'success');
    }, 1000);
  };

  useEffect(() => {
    const savedFortlev = localStorage.getItem('fortlev_credentials');
    if (savedFortlev) {
      try {
        const { email, password } = JSON.parse(savedFortlev);
        setFortlevEmail(email);
        setFortlevPassword(password);
        setRememberFortlev(true);
      } catch (e) {
        console.error('Error loading saved Fortlev credentials');
      }
    }
  }, []);

  const handleFortlevLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: any = {};
    if (!fortlevEmail) errors.email = 'E-mail é obrigatório';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fortlevEmail)) errors.email = 'E-mail inválido';
    if (!fortlevPassword) errors.password = 'Senha é obrigatória';

    if (Object.keys(errors).length > 0) {
      setFortlevErrors(errors);
      return;
    }

    try {
      const response = await fetch('/api/fortlev/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fortlevEmail, password: fortlevPassword })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsFortlevConnected(true);
        setShowFortlevLogin(false);
        setFortlevLoginError(null);
        
        if (rememberFortlev) {
          localStorage.setItem('fortlev_credentials', JSON.stringify({
            email: fortlevEmail,
            password: fortlevPassword
          }));
        } else {
          localStorage.removeItem('fortlev_credentials');
        }

        showToast(`Conectado como ${data.user.name}`);
        // Automatically fetch kits after connection
        handleConsultKits();
      } else {
        setFortlevLoginError(data.message || 'Credenciais incorretas. Tente novamente.');
      }
    } catch (error) {
      setFortlevLoginError('Erro ao conectar ao servidor.');
    }
  };

  const maskCurrency = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const number = parseInt(cleaned) / 100;
    if (isNaN(number)) return '';
    return number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
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

  const suppliers = [
    { name: 'Fortlev Solar', logo: 'https://fortlevsolar.com.br/wp-content/uploads/2021/06/logo-fortlev-solar.png', highlight: true },
  ];

  return (
    <div className="space-y-6 relative animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Modern Header & Breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <nav className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          <span className="hover:text-[#fdb612] cursor-pointer transition-colors">Projeto Alpha</span>
          <ChevronRight className="w-3 h-3 opacity-50" />
          <span className="text-slate-900 dark:text-slate-100">Simulador Solar</span>
        </nav>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 transition-all hover:border-[#fdb612]/30">
            <div className={cn(
              "size-2 rounded-full",
              isFortlevConnected ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)] animate-pulse" : "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]"
            )} />
            <span className={cn(
              "text-[9px] font-black uppercase tracking-[0.2em]",
              isFortlevConnected ? "text-emerald-500" : "text-red-500"
            )}>
              API Fortlev: {isFortlevConnected ? 'Ativa' : 'Inativa'}
            </span>
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-2.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-all text-slate-400 active:scale-90"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Modern Step Indicator */}
      <div className="bg-white dark:bg-[#231d0f]/40 p-1.5 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl">
        <div className="flex items-center justify-between gap-1">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => setCurrentStep(step.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-3 py-4 px-3 rounded-[1.5rem] transition-all relative group overflow-hidden",
                currentStep === step.id 
                  ? "bg-[#fdb612] text-[#231d0f] shadow-lg shadow-[#fdb612]/20" 
                  : currentStep > step.id
                    ? "text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/10"
                    : "text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              )}
            >
              <div className={cn(
                "size-7 rounded-xl flex items-center justify-center text-[11px] font-black border-2 transition-all",
                currentStep === step.id 
                  ? "bg-white/20 border-white/40 rotate-12" 
                  : currentStep > step.id
                    ? "bg-emerald-500/10 border-emerald-500/20"
                    : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              )}>
                {currentStep > step.id ? <CheckCircle2 className="w-4 h-4" /> : step.id}
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.15em] hidden lg:inline">
                {step.label}
              </span>
              {index < steps.length - 1 && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-6 bg-slate-200 dark:bg-slate-800 hidden lg:block opacity-50" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Title & Actions Section */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8 pt-6 mb-10">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            <span>PROJETO ALPHA</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-[#fdb612]">SIMULADOR SOLAR</span>
          </div>
          <h1 className="text-7xl font-black tracking-tighter text-slate-900 dark:text-white uppercase leading-[0.8]">
            SIMULADOR <span className="text-[#fdb612]">SOLAR</span>
          </h1>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest max-w-md">
            Configure os detalhes do local e equipamentos para gerar sua proposta comercial personalizada.
          </p>
        </div>
        
        <div className="flex flex-col gap-4 items-end">
          <div className="flex flex-wrap items-center gap-3">
            {isFortlevConnected ? (
              <div className="px-5 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-emerald-500/5">
                <ShieldCheck className="w-4 h-4" />
                Fortlev Pronto
              </div>
            ) : (
              <button 
                onClick={() => setShowFortlevLogin(true)}
                className={cn(
                  "px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 shadow-xl active:scale-95",
                  rememberFortlev 
                    ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20" 
                    : "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20"
                )}
              >
                {rememberFortlev ? <ShieldCheck className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
                {rememberFortlev ? 'Fortlev Pronto' : 'Conectar Fortlev'}
              </button>
            )}
            <button 
              onClick={() => {
                handleRedo();
                showToast('Simulador redefinido para o padrão');
              }}
              className="px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2 active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              Refazer
            </button>
            <button 
              onClick={handleGenerateNew}
              disabled={isGenerating}
              className="px-5 py-3 rounded-2xl border-2 border-[#fdb612] text-[#fdb612] font-black text-[10px] uppercase tracking-widest hover:bg-[#fdb612] hover:text-[#231d0f] transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Gerar Novo
            </button>
            <button 
              onClick={handleSaveDraft}
              disabled={isSavingDraft}
              className="px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95"
            >
              {isSavingDraft ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Salvar Rascunho
            </button>
          </div>
          <div className="w-full flex justify-start">
            <button 
              onClick={handleGenerateROI}
              disabled={isCalculatingROI}
              className="px-8 py-3 rounded-2xl bg-[#fdb612] text-[#231d0f] font-black text-[10px] uppercase tracking-widest hover:shadow-2xl hover:shadow-[#fdb612]/30 transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95"
            >
              {isCalculatingROI ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : showCheckmark ? (
                <CheckCircle2 className="w-4 h-4 animate-in zoom-in duration-300" />
              ) : (
                <TrendingUp className="w-4 h-4" />
              )}
              {showCheckmark ? 'Calculado!' : 'Gerar ROI'}
            </button>
          </div>
        </div>
      </div>

      {/* Modern Generation Preview Header */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-12">
        <div className="md:col-span-2 bg-white p-10 rounded-[3.5rem] border-2 border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center gap-6 shadow-2xl relative overflow-hidden group transition-all hover:border-[#fdb612]/30">
          <div className="absolute -top-10 -right-10 p-12 opacity-5 group-hover:scale-150 group-hover:rotate-12 transition-all duration-700">
            <Zap className="w-48 h-48 text-blue-500" />
          </div>
          <div className="size-20 rounded-3xl bg-blue-500/10 flex items-center justify-center mb-2">
            <Zap className="w-10 h-10 text-blue-500" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Potência Calculada</span>
          <div className="flex items-baseline gap-3">
            <span className="text-8xl font-black text-slate-900 tracking-tighter">{parseFloat(systemSize).toFixed(2)}</span>
            <span className="text-lg font-black text-[#fdb612] uppercase">kWp</span>
          </div>
          <div className="px-6 py-2 bg-emerald-500/10 rounded-full">
            <span className="text-[11px] font-black text-emerald-500 uppercase tracking-widest">Ideal para o Consumo</span>
          </div>
        </div>

        <div className="md:col-span-3 bg-white dark:bg-[#231d0f]/40 p-12 rounded-[3.5rem] border-2 border-slate-100 dark:border-slate-800 shadow-2xl relative overflow-hidden group transition-all hover:border-[#fdb612]/30">
          <div className="absolute -top-10 -right-10 p-12 opacity-5 group-hover:scale-150 group-hover:-rotate-12 transition-all duration-700">
            <Sun className="w-48 h-48 text-[#fdb612]" />
          </div>
          <div className="flex flex-col h-full justify-between gap-12">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="size-16 rounded-3xl bg-[#fdb612] flex items-center justify-center shadow-xl shadow-[#fdb612]/20">
                  <TrendingUp className="w-8 h-8 text-[#231d0f]" />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white">Prévia de Geração</h3>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Estimativa Mensal Baseada em {efficiency} kWh/kWp</p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center justify-between gap-10">
              <div className="space-y-4">
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 block">Potência</span>
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white">{parseFloat(systemSize).toFixed(2)}</span>
                  <span className="text-sm font-black text-slate-400 uppercase">kWp</span>
                </div>
              </div>
              
              <div className="size-16 rounded-3xl bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center text-lg font-black text-slate-300 border border-slate-100 dark:border-slate-800">×</div>
              
              <div className="space-y-4">
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 block">Eficiência</span>
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white">{efficiency}</span>
                  <span className="text-sm font-black text-slate-400 uppercase">kWh/kWp</span>
                </div>
              </div>

              <div className="size-16 rounded-3xl bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center text-lg font-black text-slate-300 border border-slate-100 dark:border-slate-800">=</div>
              
              <div className="space-y-4 bg-[#fdb612]/5 p-8 rounded-[2.5rem] border border-[#fdb612]/10 min-w-[240px]">
                <span className="text-[11px] font-black uppercase tracking-widest text-[#fdb612] block">Geração Estimada</span>
                <div className="flex flex-col">
                  <span className="text-5xl font-black text-[#fdb612] tracking-tighter">
                    {estimatedGeneration.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-2">
                    kWh / Mês
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          {currentStep === 1 && (
            <div className="bg-white dark:bg-[#231d0f]/40 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-500">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-2xl bg-[#fdb612]/10 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-[#fdb612]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">Parâmetros do Gerador</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Configuração Técnica</p>
                  </div>
                </div>
                {onClose && (
                  <button onClick={onClose} className="hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-xl transition-colors text-slate-400">
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              
              <div className="p-8 space-y-8">
                {/* Partner Data */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="size-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-blue-500" />
                    </div>
                    <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-slate-100">Dados do Parceiro</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Selecionar Parceiro</label>
                      <div className="relative group">
                        <select 
                          value={selectedPartnerId}
                          onChange={(e) => handlePartnerChange(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 font-black appearance-none focus:ring-2 focus:ring-[#fdb612] outline-none transition-all text-sm"
                        >
                          <option value="">Selecione um parceiro...</option>
                          {partners.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">CNPJ do Parceiro</label>
                      <div className="relative group">
                        <input 
                          type="text"
                          value={partnerCnpj}
                          onChange={(e) => {
                            const val = formatCNPJ(e.target.value);
                            setPartnerCnpj(val);
                            if (val.length === 18) {
                              if (validateCNPJ(val)) {
                                setCnpjError(null);
                                consultCnpj(val);
                              } else {
                                setCnpjError('CNPJ Inválido');
                              }
                            } else {
                              setCnpjError(null);
                            }
                          }}
                          placeholder="00.000.000/0000-00"
                          className={cn(
                            "w-full bg-slate-50 dark:bg-slate-900/50 border rounded-xl p-4 font-black focus:ring-2 transition-all outline-none text-sm",
                            cnpjError ? "border-red-500 focus:ring-red-500" : "border-slate-200 dark:border-slate-700 focus:ring-[#fdb612]"
                          )}
                        />
                        {isConsultingCnpj && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-[#fdb612]" />}
                      </div>
                      {cnpjError && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mt-1">{cnpjError}</p>}
                      {cnpjStatus && !cnpjError && <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-1">Status: {cnpjStatus}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">E-mail do Parceiro</label>
                      <div className="relative group">
                        <input 
                          type="email"
                          value={partnerEmail}
                          onChange={(e) => {
                            setPartnerEmail(e.target.value);
                            validateEmail(e.target.value);
                          }}
                          placeholder="parceiro@email.com"
                          className={cn(
                            "w-full bg-slate-50 dark:bg-slate-900/50 border rounded-xl p-4 font-black focus:ring-2 transition-all outline-none text-sm",
                            emailError ? "border-red-500 focus:ring-red-500" : "border-slate-200 dark:border-slate-700 focus:ring-[#fdb612]"
                          )}
                        />
                        <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      </div>
                      {emailError && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mt-1">{emailError}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Telefone do Parceiro</label>
                      <div className="relative group">
                        <input 
                          type="text"
                          value={partnerPhone}
                          onChange={(e) => {
                            const val = formatPhone(e.target.value);
                            setPartnerPhone(val);
                            if (val && val.length < 14) {
                              setPhoneError('Telefone incompleto');
                            } else {
                              setPhoneError(null);
                            }
                          }}
                          placeholder="(00) 00000-0000"
                          className={cn(
                            "w-full bg-slate-50 dark:bg-slate-900/50 border rounded-xl p-4 font-black focus:ring-2 transition-all outline-none text-sm",
                            phoneError ? "border-red-500 focus:ring-red-500" : "border-slate-200 dark:border-slate-700 focus:ring-[#fdb612]"
                          )}
                        />
                        <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      </div>
                      {phoneError && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mt-1">{phoneError}</p>}
                    </div>
                  </div>
                </div>

                {/* Consumption Data */}
                <div className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="size-8 rounded-xl bg-[#fdb612]/10 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-[#fdb612]" />
                    </div>
                    <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-slate-100">Dados de Consumo</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Consumo Anual (kWh)</label>
                      <div className="relative group">
                        <input 
                          type="number"
                          value={annualUsage}
                          onChange={(e) => handleNumericalChange(e.target.value, 'Consumo Anual', setAnnualUsage, setAnnualUsageError)}
                          className={cn(
                            "w-full bg-slate-50 dark:bg-slate-900/50 border rounded-xl p-4 font-black focus:ring-2 transition-all outline-none text-sm",
                            annualUsageError ? "border-red-500 focus:ring-red-500" : "border-slate-200 dark:border-slate-700 focus:ring-[#fdb612]"
                          )}
                        />
                      </div>
                      {annualUsageError && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mt-1">{annualUsageError}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Fatura Mensal (R$)</label>
                      <div className="relative group">
                        <input 
                          type="number"
                          value={monthlyBill}
                          onChange={(e) => handleNumericalChange(e.target.value, 'Fatura Mensal', setMonthlyBill, setMonthlyBillError)}
                          className={cn(
                            "w-full bg-slate-50 dark:bg-slate-900/50 border rounded-xl p-4 font-black focus:ring-2 transition-all outline-none text-sm",
                            monthlyBillError ? "border-red-500 focus:ring-red-500" : "border-slate-200 dark:border-slate-700 focus:ring-[#fdb612]"
                          )}
                        />
                      </div>
                      {monthlyBillError && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mt-1">{monthlyBillError}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Tamanho do Sistema (kWp)</label>
                      <div className="relative group">
                        <input 
                          type="number"
                          step="0.1"
                          value={systemSize}
                          onChange={(e) => handleNumericalChange(e.target.value, 'Tamanho do Sistema', setSystemSize, setSystemSizeError)}
                          className={cn(
                            "w-full bg-slate-50 dark:bg-slate-900/50 border rounded-xl p-4 font-black focus:ring-2 transition-all outline-none text-sm",
                            systemSizeError ? "border-red-500 focus:ring-red-500" : "border-slate-200 dark:border-slate-700 focus:ring-[#fdb612]"
                          )}
                        />
                      </div>
                      {systemSizeError && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mt-1">{systemSizeError}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Perdas (%)</label>
                      <div className="relative group">
                        <input 
                          type="number"
                          value={losses}
                          onChange={(e) => {
                            const val = e.target.value;
                            setLosses(parseFloat(val) || 0);
                            validatePositiveNumber(val, 'Perdas', setLossesError);
                          }}
                          className={cn(
                            "w-full bg-slate-50 dark:bg-slate-900/50 border rounded-xl p-4 font-black focus:ring-2 transition-all outline-none text-sm",
                            lossesError ? "border-red-500 focus:ring-red-500" : "border-slate-200 dark:border-slate-700 focus:ring-[#fdb612]"
                          )}
                        />
                      </div>
                      {lossesError && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mt-1">{lossesError}</p>}
                    </div>
                  </div>
                </div>

                {/* Dimensioning type */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Tipo de Dimensionamento</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setDimensioningType('kWp')}
                      className={cn(
                        "flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all gap-2 group",
                        dimensioningType === 'kWp' 
                          ? "bg-[#fdb612]/5 text-[#231d0f] dark:text-[#fdb612] border-[#fdb612] shadow-lg shadow-[#fdb612]/10 scale-[1.02]" 
                          : "bg-transparent text-slate-400 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700"
                      )}
                    >
                      <Zap className={cn("w-8 h-8 transition-transform group-hover:scale-110", dimensioningType === 'kWp' ? "text-[#fdb612]" : "text-slate-300")} />
                      <span className="font-black uppercase tracking-widest text-xs">Potência (kWp)</span>
                    </button>
                    <button 
                      onClick={() => setDimensioningType('kWh')}
                      className={cn(
                        "flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all gap-2 group",
                        dimensioningType === 'kWh' 
                          ? "bg-[#fdb612]/5 text-[#231d0f] dark:text-[#fdb612] border-[#fdb612] shadow-lg shadow-[#fdb612]/10 scale-[1.02]" 
                          : "bg-transparent text-slate-400 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700"
                      )}
                    >
                      <LayoutGrid className={cn("w-8 h-8 transition-transform group-hover:scale-110", dimensioningType === 'kWh' ? "text-[#fdb612]" : "text-slate-300")} />
                      <span className="font-black uppercase tracking-widest text-xs">Consumo (kWh)</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Desired power */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Consumo Mensal (kWh)</label>
                    <div className="relative group">
                      <input 
                        type="number"
                        value={monthlyConsumption}
                        onChange={(e) => handleNumericalChange(e.target.value, 'Consumo Mensal', setMonthlyConsumption, setMonthlyConsumptionError)}
                        className={cn(
                          "w-full bg-slate-50 dark:bg-slate-900/50 border rounded-xl p-4 text-xl font-black focus:ring-2 transition-all outline-none",
                          monthlyConsumptionError ? "border-red-500 focus:ring-red-500" : "border-slate-200 dark:border-slate-700 focus:ring-[#fdb612]"
                        )}
                      />
                      <button 
                        onClick={handleAutoCalculateSystemSize}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-[#fdb612] text-[#231d0f] p-2 rounded-lg hover:scale-110 transition-transform"
                        title="Calcular kWp"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                    {monthlyConsumptionError && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mt-1">{monthlyConsumptionError}</p>}
                  </div>

                  {/* Phases */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Fases</label>
                    <div className="relative group">
                      <select 
                        value={phases}
                        onChange={(e) => setPhases(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 font-black appearance-none focus:ring-2 focus:ring-[#fdb612] outline-none transition-all text-sm"
                      >
                        <option>BIFÁSICO 220V</option>
                        <option>MONOFÁSICO 127V</option>
                        <option>TRIFÁSICO 220V</option>
                        <option>TRIFÁSICO 380V</option>
                      </select>
                      <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Delivery city */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Cidade de Entrega</label>
                    <div className="relative group">
                      <select 
                        value={deliveryCity}
                        onChange={(e) => setDeliveryCity(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 font-black appearance-none focus:ring-2 focus:ring-[#fdb612] outline-none transition-all text-sm"
                      >
                        <option>Inhapim - MG</option>
                        <option>Belo Horizonte - MG</option>
                        <option>São Paulo - SP</option>
                        <option>Rio de Janeiro - RJ</option>
                      </select>
                      <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
                    </div>
                  </div>

                  {/* Structure */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Estrutura</label>
                    <div className="relative group">
                      <select 
                        value={structure}
                        onChange={(e) => setStructure(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 font-black appearance-none focus:ring-2 focus:ring-[#fdb612] outline-none transition-all text-sm"
                      >
                        <option>Telhado Fibrocimento - Estrutura Metálica (250mm)</option>
                        <option>Telhado Cerâmico</option>
                        <option>Laje</option>
                        <option>Solo</option>
                      </select>
                      <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setCurrentStep(2)}
                  className="w-full py-5 bg-[#fdb612] text-[#231d0f] rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:shadow-xl hover:shadow-[#fdb612]/20 transition-all active:scale-[0.98] mt-4"
                >
                  Gerar Geradores
                </button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-8 animate-in fade-in duration-500">
              {/* Breadcrumbs for Step 2 */}
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
                <span className="cursor-pointer hover:text-[#fdb612]" onClick={() => setCurrentStep(1)}>PARÂMETROS</span>
                <ChevronRight className="w-3 h-3" />
                <span className="text-[#fdb612]">CATÁLOGO</span>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                  <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100 uppercase">Geradores FV</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Selecione o kit ideal para seu projeto</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <input 
                      type="checkbox" 
                      id="filterByPower"
                      checked={filterByPower}
                      onChange={(e) => setFilterByPower(e.target.checked)}
                      className="size-4 rounded border-slate-300 text-[#fdb612] focus:ring-[#fdb612]"
                    />
                    <label htmlFor="filterByPower" className="text-[10px] font-black uppercase tracking-widest text-slate-500 cursor-pointer">Filtrar por Potência</label>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Inversores</label>
                    <div className="relative group">
                      <select 
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'all') setInverterBrandFilter([]);
                          else setInverterBrandFilter([val]);
                        }}
                        className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-5 py-3 text-xs font-black uppercase tracking-widest min-w-[180px] appearance-none focus:ring-2 focus:ring-[#fdb612] outline-none transition-all"
                      >
                        <option value="all">Todas as Marcas ({availableInverterBrands.length})</option>
                        {availableInverterBrands.map(brand => (
                          <option key={brand} value={brand}>{brand}</option>
                        ))}
                      </select>
                      <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 rotate-90 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Módulos</label>
                    <div className="relative group">
                      <select 
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'all') setModuleBrandFilter([]);
                          else setModuleBrandFilter([val]);
                        }}
                        className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-5 py-3 text-xs font-black uppercase tracking-widest min-w-[180px] appearance-none focus:ring-2 focus:ring-[#fdb612] outline-none transition-all"
                      >
                        <option value="all">Todas as Marcas ({availableModuleBrands.length})</option>
                        {availableModuleBrands.map(brand => (
                          <option key={brand} value={brand}>{brand}</option>
                        ))}
                      </select>
                      <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 rotate-90 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Kits Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {filteredKits.map((kit) => (
                  <div 
                    key={kit.id}
                    className={cn(
                      "bg-white dark:bg-[#231d0f]/40 rounded-[2rem] border-2 transition-all overflow-hidden group cursor-pointer active:scale-[0.98]",
                      selectedKitId === kit.id 
                        ? "border-[#fdb612] shadow-2xl shadow-[#fdb612]/10 scale-[1.02]" 
                        : "border-slate-100 dark:border-slate-800 hover:border-[#fdb612]/30 shadow-sm"
                    )}
                    onClick={() => setSelectedKitId(kit.id)}
                  >
                    <div className="p-8 space-y-8">
                      {/* Brand Logos */}
                      <div className="flex justify-between items-center">
                        <div className="flex gap-2">
                          <div className="h-8 px-4 bg-slate-50 dark:bg-slate-900/50 rounded-full flex items-center justify-center border border-slate-100 dark:border-slate-800">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{kit.panelBrand || 'TCL'}</span>
                          </div>
                        </div>
                        <div className="h-8 px-4 bg-slate-50 dark:bg-slate-900/50 rounded-full flex items-center justify-center border border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{kit.inverterBrand || 'SUNGROW'}</span>
                        </div>
                      </div>

                      {/* Product Images */}
                      <div className="relative aspect-video bg-slate-50 dark:bg-slate-900/50 rounded-[1.5rem] overflow-hidden flex items-center justify-center p-8 group-hover:bg-[#fdb612]/5 transition-colors">
                        <div className="flex items-center gap-8">
                          <img 
                            src={kit.panelImage || "https://fortlevsolar.com.br/wp-content/uploads/2021/06/modulo-fotovoltaico.png"} 
                            alt="Painel" 
                            className="h-36 object-contain drop-shadow-2xl transition-transform group-hover:scale-110 duration-500"
                            referrerPolicy="no-referrer"
                          />
                          <img 
                            src={kit.inverterImage || "https://fortlevsolar.com.br/wp-content/uploads/2021/06/inversor.png"} 
                            alt="Inversor" 
                            className="h-28 object-contain drop-shadow-2xl transition-transform group-hover:scale-110 delay-75 duration-500"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      </div>

                      {/* Info */}
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-xl font-black text-slate-900 dark:text-slate-100 leading-tight uppercase tracking-tight">Gerador FV {kit.power.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} kWp</h4>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">Kit Solar Completo • Fortlev Solar</p>
                        </div>
                        
                        <div className="flex items-end justify-between">
                          <div className="space-y-1">
                            <p className="text-3xl font-black text-[#fdb612] tracking-tighter">
                              <span className="text-sm font-medium mr-1 opacity-60">R$</span>
                              {kit.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">R$ {(kit.price / (kit.power * 1000)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / Wp</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sobrecarga</p>
                            <p className="text-lg font-black text-slate-900 dark:text-slate-100">{kit.overload || '64,00'}%</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <Search className="w-4 h-4 text-[#fdb612]" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 truncate">{deliveryCity.split(' - ')[0]}</span>
                          </div>
                          <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <Building2 className="w-4 h-4 text-[#fdb612]" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 truncate">{structure.split(' - ')[0]}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-6 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                        <span className="text-xs font-black uppercase tracking-widest text-[#fdb612]">Selecionar Kit</span>
                        <div className={cn(
                          "size-10 rounded-2xl flex items-center justify-center transition-all shadow-lg",
                          selectedKitId === kit.id ? "bg-[#fdb612] text-[#231d0f] shadow-[#fdb612]/20" : "bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-[#fdb612] group-hover:text-[#231d0f] group-hover:shadow-[#fdb612]/20"
                        )}>
                          <ArrowRight className="w-5 h-5" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between mt-8">
                <button 
                  onClick={() => setCurrentStep(1)}
                  className="px-8 py-3 border border-slate-200 dark:border-slate-800 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" />
                  Voltar
                </button>
                <button 
                  onClick={() => setCurrentStep(3)}
                  className="px-12 py-5 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] flex items-center gap-4 transition-all active:scale-95 shadow-2xl bg-[#fdb612] text-[#231d0f] hover:shadow-[#fdb612]/30 hover:scale-[1.05] cursor-pointer"
                >
                  Próximo Passo: Precificação
                  <div className="size-8 rounded-xl bg-[#231d0f]/10 flex items-center justify-center">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </button>
              </div>
            </div>
          )}



          {currentStep === 3 && (
            <div className="space-y-8 animate-in fade-in duration-500">
              {/* Breadcrumbs for Step 3 */}
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
                <span className="cursor-pointer hover:text-[#fdb612]" onClick={() => setCurrentStep(1)}>PARÂMETROS</span>
                <ChevronRight className="w-3 h-3" />
                <span className="cursor-pointer hover:text-[#fdb612]" onClick={() => setCurrentStep(2)}>CATÁLOGO</span>
                <ChevronRight className="w-3 h-3" />
                <span className="text-[#fdb612]">PRECIFICAÇÃO</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  {/* Kit Summary */}
                  <section className="bg-white dark:bg-[#231d0f]/40 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#fdb612]" />
                    <div className="flex items-center gap-3 mb-8">
                      <div className="size-10 bg-[#fdb612]/10 text-[#fdb612] rounded-2xl flex items-center justify-center">
                        <Zap className="w-5 h-5" />
                      </div>
                      <h3 className="text-2xl font-black tracking-tight uppercase">Resumo do Kit Selecionado</h3>
                    </div>
                    
                    {selectedKitId ? (
                      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-[1.5rem] border border-slate-100 dark:border-slate-800">
                        <div className="size-32 bg-white rounded-2xl p-4 flex items-center justify-center border border-slate-100 shadow-sm shrink-0">
                          <img 
                            src={kits.find(k => k.id === selectedKitId)?.panelImage || "https://fortlevsolar.com.br/wp-content/uploads/2021/06/modulo-fotovoltaico.png"} 
                            alt="Kit" 
                            className="max-w-full max-h-full object-contain"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="flex-1 space-y-4 text-center md:text-left">
                          <div>
                            <h4 className="font-black text-2xl text-slate-900 dark:text-slate-100 uppercase tracking-tight">{kits.find(k => k.id === selectedKitId)?.name}</h4>
                            <p className="text-sm font-medium text-slate-500 line-clamp-2">{kits.find(k => k.id === selectedKitId)?.description}</p>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-4 border-t border-slate-200 dark:border-slate-800">
                            <div>
                              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Potência</span>
                              <span className="font-black text-slate-900 dark:text-slate-100">{kits.find(k => k.id === selectedKitId)?.power} kWp</span>
                            </div>
                            <div>
                              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Preço Base</span>
                              <span className="font-black text-[#fdb612]">R$ {kits.find(k => k.id === selectedKitId)?.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div>
                              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Inversor</span>
                              <span className="font-black text-slate-900 dark:text-slate-100">{kits.find(k => k.id === selectedKitId)?.inverterBrand}</span>
                            </div>
                            <div>
                              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Módulos</span>
                              <span className="font-black text-slate-900 dark:text-slate-100">{kits.find(k => k.id === selectedKitId)?.panelBrand}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[1.5rem]">
                        <p className="text-slate-400 font-bold italic">Nenhum kit selecionado. Volte ao catálogo para escolher um.</p>
                      </div>
                    )}
                  </section>

                  {/* Services & Costs */}
                  <section className="bg-white dark:bg-[#231d0f]/40 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="size-10 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <h3 className="text-2xl font-black tracking-tight uppercase">Serviços e Custos Adicionais</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Instalação (R$)</label>
                        <div className="relative group">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm group-focus-within:text-[#fdb612] transition-colors">R$</span>
                          <input 
                            type="number" 
                            value={installationPrice}
                            onChange={(e) => handleNumericalChange(e.target.value, 'Instalação', setInstallationPrice, setInstallationPriceError)}
                            className={cn(
                              "w-full bg-slate-50 dark:bg-slate-900/50 border rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-2 outline-none font-black transition-all",
                              installationPriceError ? "border-red-500 focus:ring-red-500" : "border-slate-200 dark:border-slate-700 focus:ring-[#fdb612]"
                            )}
                          />
                        </div>
                        {installationPriceError && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mt-1">{installationPriceError}</p>}
                      </div>
                      <div className="space-y-3">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Engenharia / Projeto (R$)</label>
                        <div className="relative group">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm group-focus-within:text-[#fdb612] transition-colors">R$</span>
                          <input 
                            type="number" 
                            value={engineeringPrice}
                            onChange={(e) => handleNumericalChange(e.target.value, 'Engenharia', setEngineeringPrice, setEngineeringPriceError)}
                            className={cn(
                              "w-full bg-slate-50 dark:bg-slate-900/50 border rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-2 outline-none font-black transition-all",
                              engineeringPriceError ? "border-red-500 focus:ring-red-500" : "border-slate-200 dark:border-slate-700 focus:ring-[#fdb612]"
                            )}
                          />
                        </div>
                        {engineeringPriceError && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mt-1">{engineeringPriceError}</p>}
                      </div>
                      <div className="space-y-3">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Outros Custos (R$)</label>
                        <div className="relative group">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm group-focus-within:text-[#fdb612] transition-colors">R$</span>
                          <input 
                            type="number" 
                            value={additionalCosts}
                            onChange={(e) => handleNumericalChange(e.target.value, 'Outros Custos', setAdditionalCosts, setAdditionalCostsError)}
                            className={cn(
                              "w-full bg-slate-50 dark:bg-slate-900/50 border rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-2 outline-none font-black transition-all",
                              additionalCostsError ? "border-red-500 focus:ring-red-500" : "border-slate-200 dark:border-slate-700 focus:ring-[#fdb612]"
                            )}
                          />
                        </div>
                        {additionalCostsError && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mt-1">{additionalCostsError}</p>}
                      </div>
                      <div className="space-y-3">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Margem de Lucro (%)</label>
                        <div className="relative group">
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm group-focus-within:text-[#fdb612] transition-colors">%</span>
                          <input 
                            type="number" 
                            value={marginPercentage}
                            onChange={(e) => handleNumericalChange(e.target.value, 'Margem', setMarginPercentage, setMarginPercentageError)}
                            className={cn(
                              "w-full bg-slate-50 dark:bg-slate-900/50 border rounded-2xl py-4 px-6 text-sm focus:ring-2 outline-none font-black transition-all",
                              marginPercentageError ? "border-red-500 focus:ring-red-500" : "border-slate-200 dark:border-slate-700 focus:ring-[#fdb612]"
                            )}
                          />
                        </div>
                        {marginPercentageError && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mt-1">{marginPercentageError}</p>}
                      </div>
                    </div>
                  </section>

                  {/* Financial Parameters */}
                  <section className="bg-white dark:bg-[#231d0f]/40 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="size-10 bg-[#fdb612]/10 text-[#fdb612] rounded-2xl flex items-center justify-center">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <h3 className="text-2xl font-black tracking-tight uppercase">Parâmetros de ROI</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-3">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Inflação Energética (%)</label>
                        <input 
                          type="number" 
                          value={energyInflation}
                          onChange={(e) => handleNumericalChange(e.target.value, 'Inflação', setEnergyInflation, setEnergyInflationError)}
                          className={cn(
                            "w-full bg-slate-50 dark:bg-slate-900/50 border rounded-2xl p-4 text-sm focus:ring-2 outline-none font-black transition-all",
                            energyInflationError ? "border-red-500 focus:ring-red-500" : "border-slate-200 dark:border-slate-700 focus:ring-[#fdb612]"
                          )}
                        />
                        {energyInflationError && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mt-1">{energyInflationError}</p>}
                      </div>
                      <div className="space-y-3">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Depreciação (%)</label>
                        <input 
                          type="number" 
                          step="0.1"
                          value={panelDepreciation}
                          onChange={(e) => handleNumericalChange(e.target.value, 'Depreciação', setPanelDepreciation, setPanelDepreciationError)}
                          className={cn(
                            "w-full bg-slate-50 dark:bg-slate-900/50 border rounded-2xl p-4 text-sm focus:ring-2 outline-none font-black transition-all",
                            panelDepreciationError ? "border-red-500 focus:ring-red-500" : "border-slate-200 dark:border-slate-700 focus:ring-[#fdb612]"
                          )}
                        />
                        {panelDepreciationError && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mt-1">{panelDepreciationError}</p>}
                      </div>
                      <div className="space-y-3">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Manutenção (%)</label>
                        <input 
                          type="number" 
                          step="0.1"
                          value={maintenanceRate}
                          onChange={(e) => handleNumericalChange(e.target.value, 'Manutenção', setMaintenanceRate, setMaintenanceRateError)}
                          className={cn(
                            "w-full bg-slate-50 dark:bg-slate-900/50 border rounded-2xl p-4 text-sm focus:ring-2 outline-none font-black transition-all",
                            maintenanceRateError ? "border-red-500 focus:ring-red-500" : "border-slate-200 dark:border-slate-700 focus:ring-[#fdb612]"
                          )}
                        />
                        {maintenanceRateError && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mt-1">{maintenanceRateError}</p>}
                      </div>
                    </div>
                  </section>
                </div>

                {/* Pricing Summary Sidebar */}
                <div className="space-y-6">
                  <div className="bg-[#231d0f] text-white p-10 rounded-[2.5rem] shadow-2xl sticky top-8 border border-white/5 overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#fdb612]/10 blur-[60px] rounded-full -mr-16 -mt-16" />
                    
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] mb-10 opacity-40">Resumo do Investimento</h4>
                    
                    <div className="space-y-8">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-black uppercase tracking-widest opacity-60">Kit FV</span>
                        <span className="font-black text-sm">R$ {(kits.find(k => k.id === selectedKitId)?.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-black uppercase tracking-widest opacity-60">Serviços / Adic.</span>
                        <span className="font-black text-sm">R$ {(parseFloat(installationPrice) + parseFloat(engineeringPrice) + parseFloat(additionalCosts)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="pt-8 border-t border-white/10 flex justify-between items-center">
                        <span className="text-xs font-black uppercase tracking-widest opacity-60">Custo Total</span>
                        <span className="font-black text-sm">R$ {((kits.find(k => k.id === selectedKitId)?.price || 0) + parseFloat(installationPrice) + parseFloat(engineeringPrice) + parseFloat(additionalCosts)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-black uppercase tracking-widest opacity-60">Margem ({marginPercentage}%)</span>
                        <span className="font-black text-sm text-[#fdb612]">R$ {
                          ((((kits.find(k => k.id === selectedKitId)?.price || 0) + parseFloat(installationPrice) + parseFloat(engineeringPrice) + parseFloat(additionalCosts)) / (1 - (parseFloat(marginPercentage) / 100))) - 
                          ((kits.find(k => k.id === selectedKitId)?.price || 0) + parseFloat(installationPrice) + parseFloat(engineeringPrice) + parseFloat(additionalCosts))).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                        }</span>
                      </div>
                      
                      <div className="pt-10 mt-10 border-t border-white/20 relative">
                        <span className="block text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-[#fdb612]">Preço Final Sugerido</span>
                        <div className="text-5xl font-black tracking-tighter">
                          <span className="text-lg font-medium mr-1 opacity-60">R$</span>
                          {
                            (((kits.find(k => k.id === selectedKitId)?.price || 0) + parseFloat(installationPrice) + parseFloat(engineeringPrice) + parseFloat(additionalCosts)) / (1 - (parseFloat(marginPercentage) / 100))).toLocaleString('pt-BR', { minimumFractionDigits: 0 })
                          }
                        </div>
                        <div className="mt-4 text-[10px] opacity-40 font-black uppercase tracking-[0.2em] flex items-center gap-2">
                          <div className="h-px flex-1 bg-white/20" />
                          R$ {((((kits.find(k => k.id === selectedKitId)?.price || 0) + parseFloat(installationPrice) + parseFloat(engineeringPrice) + parseFloat(additionalCosts)) / (1 - (parseFloat(marginPercentage) / 100))) / (kits.find(k => k.id === selectedKitId)?.power || 1)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / Wp
                          <div className="h-px flex-1 bg-white/20" />
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => setCurrentStep(4)}
                      className="w-full mt-12 bg-[#fdb612] text-[#231d0f] py-5 rounded-[1.25rem] font-black uppercase tracking-[0.2em] text-xs hover:scale-[1.02] transition-all shadow-2xl shadow-[#fdb612]/20 active:scale-95"
                    >
                      PROSSEGUIR PARA VALIDAÇÃO
                    </button>
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-white dark:bg-[#231d0f]/40 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl">
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Ações Rápidas</h5>
                    <div className="space-y-3">
                      <button className="w-full text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all flex items-center gap-3 active:scale-95">
                        <Save className="w-4 h-4" />
                        Salvar como Modelo
                      </button>
                      <button className="w-full text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all flex items-center gap-3 active:scale-95">
                        <RefreshCw className="w-4 h-4" />
                        Recalcular ROI
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-start mt-8">
                <button 
                  onClick={() => setCurrentStep(2)}
                  className="px-8 py-3 border border-slate-200 dark:border-slate-800 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" />
                  Voltar
                </button>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-8 animate-in fade-in duration-500">
              {/* Breadcrumbs for Step 4 */}
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
                <span className="cursor-pointer hover:text-[#fdb612]" onClick={() => setCurrentStep(1)}>PARAMETERS</span>
                <ChevronRight className="w-3 h-3" />
                <span className="cursor-pointer hover:text-[#fdb612]" onClick={() => setCurrentStep(2)}>CATALOG</span>
                <ChevronRight className="w-3 h-3" />
                <span className="cursor-pointer hover:text-[#fdb612]" onClick={() => setCurrentStep(3)}>PRICING</span>
                <ChevronRight className="w-3 h-3" />
                <span className="text-[#fdb612]">VALIDATION</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Technical Validation Summary */}
                <section className="bg-white dark:bg-[#231d0f]/40 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                  <div className="flex items-center gap-3 mb-8">
                    <div className="size-10 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <h3 className="text-2xl font-black tracking-tight uppercase">Technical Validation</h3>
                  </div>

                  <div className="space-y-8">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Target Power</span>
                        <span className="text-xl font-black text-slate-900 dark:text-slate-100">{desiredPower} kWp</span>
                      </div>
                      <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Kit Power</span>
                        <span className="text-xl font-black text-[#fdb612]">{kits.find(k => k.id === selectedKitId)?.power} kWp</span>
                      </div>
                    </div>

                    <div className="p-6 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-2xl border border-emerald-500/20 flex items-center gap-5">
                      <div className="size-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
                        <CheckCircle2 className="w-7 h-7" />
                      </div>
                      <div>
                        <h4 className="font-black text-emerald-600 dark:text-emerald-400 uppercase text-xs tracking-widest mb-1">Proper Sizing</h4>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">The selected kit meets the desired power with a safety margin of {((kits.find(k => k.id === selectedKitId)?.power || 0) / parseFloat(desiredPower) * 100 - 100).toFixed(2)}%.</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Engineering Checklist</h5>
                      <div className="space-y-3">
                        {[
                          { label: 'Voltage Compatibility (220V)', status: true },
                          { label: 'Mounting Structure (' + structure + ')', status: true },
                          { label: 'Available Roof Area', status: true },
                          { label: 'Service Entrance Capacity', status: true },
                        ].map((item, i) => (
                          <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-800/50 group hover:border-[#fdb612]/30 transition-all">
                            <span className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight">{item.label}</span>
                            <div className="size-6 bg-emerald-500/10 text-emerald-500 rounded-lg flex items-center justify-center">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Financial Validation Summary */}
                <section className="bg-white dark:bg-[#231d0f]/40 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                  <div className="flex items-center gap-3 mb-8">
                    <div className="size-10 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <h3 className="text-2xl font-black tracking-tight uppercase">Financial Analysis</h3>
                  </div>

                  <div className="space-y-8">
                    <div className="p-8 bg-[#231d0f] text-white rounded-[2rem] border border-white/5 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[60px] rounded-full -mr-16 -mt-16" />
                      <span className="block text-[10px] font-black uppercase tracking-[0.3em] mb-4 opacity-40">Total Investment</span>
                      <div className="text-4xl font-black tracking-tighter">
                        <span className="text-lg font-medium mr-1 opacity-40">R$</span>
                        {
                          (((kits.find(k => k.id === selectedKitId)?.price || 0) + parseFloat(installationPrice) + parseFloat(engineeringPrice) + parseFloat(additionalCosts)) / (1 - (parseFloat(marginPercentage) / 100))).toLocaleString('en-US', { minimumFractionDigits: 2 })
                        }
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Estimated Payback</span>
                        <span className="text-xl font-black text-emerald-500">{paybackTime}</span>
                      </div>
                      <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Monthly ROI</span>
                        <span className="text-xl font-black text-blue-500">{roiPercentage}</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Margin Summary</h5>
                      <div className="space-y-4 bg-slate-50 dark:bg-slate-900/30 p-6 rounded-[1.5rem] border border-slate-100 dark:border-slate-800/50">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-black uppercase tracking-widest text-slate-500">Equipment</span>
                          <span className="font-black text-slate-900 dark:text-slate-100">R$ {(kits.find(k => k.id === selectedKitId)?.price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-black uppercase tracking-widest text-slate-500">Services</span>
                          <span className="font-black text-slate-900 dark:text-slate-100">R$ {(parseFloat(installationPrice) + parseFloat(engineeringPrice) + parseFloat(additionalCosts)).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                          <span className="text-xs font-black uppercase tracking-widest text-slate-500">Margin ({marginPercentage}%)</span>
                          <span className="font-black text-emerald-500">R$ {
                            ((((kits.find(k => k.id === selectedKitId)?.price || 0) + parseFloat(installationPrice) + parseFloat(engineeringPrice) + parseFloat(additionalCosts)) / (1 - (parseFloat(marginPercentage) / 100))) - 
                            ((kits.find(k => k.id === selectedKitId)?.price || 0) + parseFloat(installationPrice) + parseFloat(engineeringPrice) + parseFloat(additionalCosts))).toLocaleString('en-US', { minimumFractionDigits: 2 })
                          }</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              <div className="flex justify-between mt-8">
                <button 
                  onClick={() => setCurrentStep(3)}
                  className="px-8 py-3 border border-slate-200 dark:border-slate-800 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" />
                  Back
                </button>
                <button 
                  onClick={() => setCurrentStep(5)}
                  className="px-8 py-3 bg-[#fdb612] text-[#231d0f] rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:shadow-2xl hover:shadow-[#fdb612]/20 transition-all active:scale-95"
                >
                  Next Step: Financing
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-8 animate-in fade-in duration-500">
              {/* Breadcrumbs for Step 5 */}
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
                <span className="cursor-pointer hover:text-[#fdb612]" onClick={() => setCurrentStep(1)}>PARAMETERS</span>
                <ChevronRight className="w-3 h-3" />
                <span className="cursor-pointer hover:text-[#fdb612]" onClick={() => setCurrentStep(2)}>CATALOG</span>
                <ChevronRight className="w-3 h-3" />
                <span className="cursor-pointer hover:text-[#fdb612]" onClick={() => setCurrentStep(3)}>PRICING</span>
                <ChevronRight className="w-3 h-3" />
                <span className="cursor-pointer hover:text-[#fdb612]" onClick={() => setCurrentStep(4)}>VALIDATION</span>
                <ChevronRight className="w-3 h-3" />
                <span className="text-[#fdb612]">FINANCING</span>
              </div>

              <section className="bg-white dark:bg-[#231d0f]/40 p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl">
                <div className="flex items-center gap-3 mb-10">
                  <div className="size-10 bg-[#fdb612]/10 text-[#fdb612] rounded-2xl flex items-center justify-center">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <h3 className="text-2xl font-black tracking-tight uppercase">Financing Options</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                  {[
                    { bank: 'Banco Fortlev', rate: '0.99%', term: '96x', highlight: true, logo: 'https://fortlevsolar.app/assets/images/logo-fortlev.png' },
                    { bank: 'Santander', rate: '1.29%', term: '72x', logo: 'https://picsum.photos/seed/santander/100/40' },
                    { bank: 'Solfacil', rate: '1.15%', term: '120x', logo: 'https://picsum.photos/seed/solfacil/100/40' },
                  ].map((option) => (
                    <div 
                      key={option.bank} 
                      className={cn(
                        "p-8 rounded-[2rem] border-2 transition-all cursor-pointer relative overflow-hidden group active:scale-[0.98]",
                        option.highlight 
                          ? "border-[#fdb612] bg-[#fdb612]/5 shadow-2xl shadow-[#fdb612]/10" 
                          : "border-slate-100 dark:border-slate-800 hover:border-[#fdb612]/30 bg-white dark:bg-[#231d0f]/20"
                      )}
                    >
                      {option.highlight && (
                        <div className="absolute top-0 right-0 bg-[#fdb612] text-[#231d0f] text-[9px] font-black px-4 py-1.5 rounded-bl-2xl uppercase tracking-[0.2em] shadow-sm">
                          Recommended
                        </div>
                      )}
                      <div className="h-16 mb-8 flex items-center justify-center grayscale group-hover:grayscale-0 transition-all">
                        {option.bank === 'Banco Fortlev' ? (
                          <span className="text-2xl font-black text-[#231d0f] dark:text-white tracking-tighter">FORTLEV</span>
                        ) : (
                          <img src={option.logo} alt={option.bank} className="h-10 object-contain opacity-40 group-hover:opacity-100 transition-all" referrerPolicy="no-referrer" />
                        )}
                      </div>
                      <div className="text-center space-y-2">
                        <p className="text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tighter">{option.rate}</p>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Monthly Interest Rate</p>
                      </div>
                      <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 text-center">
                        <p className="text-xl font-black text-[#fdb612]">{option.term}</p>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Maximum Term</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-[#231d0f] text-white p-10 rounded-[2.5rem] mb-10 relative overflow-hidden border border-white/5 shadow-2xl">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-[#fdb612]/10 rounded-full blur-[80px] -mr-40 -mt-40" />
                  <div className="flex flex-col lg:flex-row justify-between items-center gap-10 relative z-10">
                    <div className="space-y-4 text-center lg:text-left">
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#fdb612] text-[#231d0f] rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-[#fdb612]/20">
                        Fortlev Bank Simulation
                      </div>
                      <h4 className="text-3xl font-black tracking-tight uppercase">Installments that fit your budget</h4>
                      <p className="text-slate-400 text-sm max-w-sm font-medium">Up to 120 days grace period to start paying. Energy savings pay the installment.</p>
                    </div>
                    <div className="text-center lg:text-right bg-white/5 p-6 rounded-3xl border border-white/5 backdrop-blur-sm">
                      <p className="text-5xl font-black text-[#fdb612] tracking-tighter">
                        <span className="text-lg font-medium mr-1 opacity-60">R$</span>
                        458,20
                      </p>
                      <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-black mt-2">Estimated Installment</p>
                    </div>
                    <button 
                      onClick={() => showToast('Requesting credit analysis...')}
                      className="px-12 py-6 bg-[#fdb612] text-[#231d0f] rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-[#fdb612]/20 shrink-0"
                    >
                      REQUEST CREDIT
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-blue-500/5 dark:bg-blue-500/10 p-8 rounded-[2rem] border border-blue-500/20 flex gap-6 group hover:border-blue-500/40 transition-all">
                    <div className="size-14 bg-blue-500 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20 group-hover:rotate-6 transition-all">
                      <ShieldCheck className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="font-black text-blue-600 dark:text-blue-400 uppercase text-xs tracking-widest mb-2">Performance Insurance</h4>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                        Projects financed via Fortlev Solar include installation insurance and extended warranty.
                      </p>
                    </div>
                  </div>
                  <div className="bg-emerald-500/5 dark:bg-emerald-500/10 p-8 rounded-[2rem] border border-emerald-500/20 flex gap-6 group hover:border-emerald-500/40 transition-all">
                    <div className="size-14 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20 group-hover:-rotate-6 transition-all">
                      <Zap className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="font-black text-emerald-600 dark:text-emerald-400 uppercase text-xs tracking-widest mb-2">24h Approval</h4>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                        Fast and hassle-free credit analysis for Fortlev partners.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <div className="flex justify-between mt-8">
                <button 
                  onClick={() => setCurrentStep(4)}
                  className="px-8 py-3 border border-slate-200 dark:border-slate-800 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" />
                  Back
                </button>
                <button 
                  onClick={() => setCurrentStep(6)}
                  className="px-8 py-3 bg-[#fdb612] text-[#231d0f] rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:shadow-2xl hover:shadow-[#fdb612]/20 transition-all active:scale-95"
                >
                  Next Step: Finalization
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {currentStep === 6 && (
            <div className="space-y-8 animate-in fade-in duration-500">
              {/* Breadcrumbs for Step 6 */}
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
                <span className="cursor-pointer hover:text-[#fdb612]" onClick={() => setCurrentStep(1)}>PARAMETERS</span>
                <ChevronRight className="w-3 h-3" />
                <span className="cursor-pointer hover:text-[#fdb612]" onClick={() => setCurrentStep(2)}>CATALOG</span>
                <ChevronRight className="w-3 h-3" />
                <span className="cursor-pointer hover:text-[#fdb612]" onClick={() => setCurrentStep(3)}>PRICING</span>
                <ChevronRight className="w-3 h-3" />
                <span className="cursor-pointer hover:text-[#fdb612]" onClick={() => setCurrentStep(4)}>VALIDATION</span>
                <ChevronRight className="w-3 h-3" />
                <span className="cursor-pointer hover:text-[#fdb612]" onClick={() => setCurrentStep(5)}>FINANCING</span>
                <ChevronRight className="w-3 h-3" />
                <span className="text-[#fdb612]">FINALIZATION</span>
              </div>

              <section className="bg-white dark:bg-[#231d0f]/40 p-16 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl text-center relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-2 bg-gradient-to-r from-transparent via-[#fdb612] to-transparent" />
                
                <div className="relative size-32 mx-auto mb-10 group">
                  <div className="absolute inset-0 bg-emerald-500/20 rounded-[2rem] blur-2xl group-hover:bg-emerald-500/30 transition-all duration-500 animate-pulse" />
                  <div className="relative size-full bg-emerald-500 text-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-emerald-500/20 rotate-12 group-hover:rotate-0 transition-transform duration-500">
                    <CheckCircle2 className="w-16 h-16" />
                  </div>
                </div>
                
                <div className="space-y-4 mb-12">
                  <h3 className="text-6xl font-black text-slate-900 dark:text-slate-100 tracking-tighter uppercase">
                    Simulation <span className="text-[#fdb612]">Completed!</span>
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto text-lg font-medium leading-relaxed">
                    Your solar project has been successfully configured, priced, and validated. The future of clean energy starts now.
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] p-10 mb-16 max-w-4xl mx-auto border border-slate-100 dark:border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-10 shadow-inner">
                  <div className="space-y-2">
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em]">Total Power</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{kits.find(k => k.id === selectedKitId)?.power} kWp</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em]">Investment</p>
                    <p className="text-2xl font-black text-[#fdb612] tracking-tight">R$ {
                      (((kits.find(k => k.id === selectedKitId)?.price || 0) + parseFloat(installationPrice) + parseFloat(engineeringPrice) + parseFloat(additionalCosts)) / (1 - (parseFloat(marginPercentage) / 100))).toLocaleString('en-US', { minimumFractionDigits: 0 })
                    }</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em]">Payback</p>
                    <p className="text-2xl font-black text-emerald-500 tracking-tight">{paybackTime}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em]">Status</p>
                    <div className="flex items-center justify-center gap-2 text-emerald-500 font-black text-sm tracking-[0.2em]">
                      <ShieldCheck className="w-5 h-5" />
                      VALIDATED
                    </div>
                  </div>
                </div>

                {/* Task Management Section */}
                <div className="mt-16 space-y-8 max-w-4xl mx-auto text-left">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-10 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center">
                        <LayoutGrid className="w-5 h-5" />
                      </div>
                      <h3 className="text-2xl font-black tracking-tight uppercase">Gerenciamento de Tarefas</h3>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                      {tasks.filter(t => t.completed).length}/{tasks.length} Concluídas
                    </span>
                  </div>

                  <div className="flex gap-4">
                    <input 
                      type="text"
                      value={newTaskText}
                      onChange={(e) => setNewTaskText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addTask()}
                      placeholder="Nova tarefa para o projeto..."
                      className="flex-1 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 font-bold focus:ring-2 focus:ring-[#fdb612] outline-none transition-all"
                    />
                    <button 
                      onClick={addTask}
                      className="px-8 bg-[#fdb612] text-[#231d0f] rounded-2xl font-black uppercase tracking-widest text-xs hover:shadow-lg hover:shadow-[#fdb612]/20 transition-all active:scale-95 flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Adicionar Tarefa
                    </button>
                  </div>

                  <div className="space-y-3">
                    {tasks.length === 0 ? (
                      <div className="p-12 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[2rem]">
                        <p className="text-slate-400 font-bold italic">Nenhuma tarefa adicionada ainda.</p>
                      </div>
                    ) : (
                      tasks.map((task) => (
                        <div 
                          key={task.id}
                          className={cn(
                            "group flex items-center gap-4 p-5 rounded-2xl border transition-all",
                            task.completed 
                              ? "bg-slate-50 dark:bg-slate-900/30 border-slate-100 dark:border-slate-800 opacity-60" 
                              : "bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-[#fdb612]/30"
                          )}
                        >
                          <button 
                            onClick={() => toggleTask(task.id)}
                            className={cn(
                              "size-6 rounded-lg border-2 transition-all flex items-center justify-center",
                              task.completed 
                                ? "bg-emerald-500 border-emerald-500 text-white" 
                                : "border-slate-200 dark:border-slate-700 hover:border-[#fdb612]"
                            )}
                          >
                            {task.completed && <CheckCircle2 className="w-4 h-4" />}
                          </button>
                          <span className={cn(
                            "flex-1 font-bold text-sm transition-all",
                            task.completed ? "line-through text-slate-400" : "text-slate-700 dark:text-slate-200"
                          )}>
                            {task.text}
                          </span>
                          <button 
                            onClick={() => removeTask(task.id)}
                            className="size-10 rounded-xl bg-red-500/10 text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white flex items-center justify-center"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                  <button 
                    onClick={() => showToast('Generating proposal PDF...')}
                    className="group p-10 bg-white dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 rounded-[2.5rem] font-black hover:border-[#fdb612] hover:shadow-2xl hover:shadow-[#fdb612]/10 transition-all flex flex-col items-center gap-6 active:scale-95"
                  >
                    <div className="size-20 bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:bg-[#fdb612]/10 group-hover:text-[#fdb612] rounded-3xl flex items-center justify-center transition-all group-hover:scale-110 group-hover:rotate-6 shadow-sm">
                      <FileText className="w-10 h-10" />
                    </div>
                    <div className="space-y-2">
                      <span className="block text-xl uppercase tracking-tight">Generate Proposal</span>
                      <span className="block text-[10px] uppercase tracking-widest text-slate-400 font-black">Full PDF Download</span>
                    </div>
                  </button>

                  <button 
                    onClick={() => {
                      showToast('Sending to Fortlev Solar...');
                      setTimeout(() => showToast('Project sent successfully!', 'success'), 2000);
                    }}
                    className="group p-10 bg-[#fdb612] text-[#231d0f] rounded-[2.5rem] font-black hover:scale-105 hover:shadow-2xl hover:shadow-[#fdb612]/30 transition-all flex flex-col items-center gap-6 active:scale-95"
                  >
                    <div className="size-20 bg-[#231d0f] text-[#fdb612] rounded-3xl flex items-center justify-center transition-all group-hover:scale-110 group-hover:-rotate-6 shadow-2xl shadow-[#231d0f]/20">
                      <Send className="w-10 h-10" />
                    </div>
                    <div className="space-y-2">
                      <span className="block text-xl uppercase tracking-tight">Send Project</span>
                      <span className="block text-[10px] uppercase tracking-widest opacity-60 font-black">Fortlev Platform</span>
                    </div>
                  </button>

                  <button 
                    onClick={() => {
                      setCurrentStep(1);
                      setSelectedKitId('');
                    }}
                    className="group p-10 bg-white dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 rounded-[2.5rem] font-black hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-500/10 transition-all flex flex-col items-center gap-6 active:scale-95"
                  >
                    <div className="size-20 bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:bg-blue-500/10 group-hover:text-blue-500 rounded-3xl flex items-center justify-center transition-all group-hover:scale-110 group-hover:rotate-12 shadow-sm">
                      <RefreshCw className="w-10 h-10" />
                    </div>
                    <div className="space-y-2">
                      <span className="block text-xl uppercase tracking-tight">New Simulation</span>
                      <span className="block text-[10px] uppercase tracking-widest text-slate-400 font-black">Restart Flow</span>
                    </div>
                  </button>
                </div>

                <div className="mt-16 pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col items-center gap-4">
                  <p className="text-[10px] text-slate-400 uppercase tracking-[0.3em] font-black">Track your projects on the official Fortlev Solar platform</p>
                  <a 
                    href="https://fortlevsolar.app/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-8 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full font-black hover:bg-[#fdb612] hover:text-[#231d0f] transition-all flex items-center gap-2 text-xs uppercase tracking-widest"
                  >
                    ACCESS FORTLEVSOLAR.APP
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </section>

              <div className="flex justify-start">
                <button 
                  onClick={() => setCurrentStep(5)}
                  className="px-8 py-3 border border-slate-200 dark:border-slate-800 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" />
                  Back
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modern Fortlev Login Modal */}
      {showFortlevLogin && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-[#231d0f] w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800">
            <div className="p-10 space-y-8">
              <div className="flex flex-col items-center gap-6">
                <div className="relative">
                  <div className="size-24 rounded-full border-[6px] border-[#fdb612]/20 border-t-[#fdb612] animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-[#231d0f] rounded-full m-2">
                    <img 
                      src="https://fortlevsolar.com.br/wp-content/uploads/2021/06/logo-fortlev-solar.png" 
                      alt="Fortlev" 
                      className="w-12 h-12 object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight uppercase">Platform Access</h3>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Log in with your Fortlev Solar credentials</p>
                </div>
              </div>
              
              <div className="h-px bg-slate-100 dark:bg-slate-800" />

              {fortlevLoginError && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-3">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {fortlevLoginError}
                </div>
              )}

              <form onSubmit={handleFortlevLogin} className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Corporate Email</label>
                    {fortlevErrors.email && <span className="text-[10px] text-red-500 font-black uppercase tracking-widest">{fortlevErrors.email}</span>}
                  </div>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#fdb612] transition-colors" />
                    <input 
                      type="email"
                      value={fortlevEmail}
                      onChange={(e) => {
                        setFortlevEmail(e.target.value);
                        if (fortlevErrors.email) setFortlevErrors({ ...fortlevErrors, email: undefined });
                      }}
                      className={cn(
                        "w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 pl-12 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-[#fdb612] outline-none transition-all font-bold",
                        fortlevErrors.email && "ring-2 ring-red-500 border-transparent"
                      )}
                      placeholder="example@fortlev.com"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Access Password</label>
                    {fortlevErrors.password && <span className="text-[10px] text-red-500 font-black uppercase tracking-widest">{fortlevErrors.password}</span>}
                  </div>
                  <div className="relative group">
                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#fdb612] transition-colors" />
                    <input 
                      type="password"
                      value={fortlevPassword}
                      onChange={(e) => {
                        setFortlevPassword(e.target.value);
                        if (fortlevErrors.password) setFortlevErrors({ ...fortlevErrors, password: undefined });
                      }}
                      className={cn(
                        "w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 pl-12 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-[#fdb612] outline-none transition-all font-bold",
                        fortlevErrors.password && "ring-2 ring-red-500 border-transparent"
                      )}
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 px-1">
                  <button
                    type="button"
                    onClick={() => setRememberFortlev(!rememberFortlev)}
                    className={cn(
                      "size-6 rounded-lg border-2 transition-all flex items-center justify-center",
                      rememberFortlev 
                        ? "bg-[#fdb612] border-[#fdb612] text-[#231d0f]" 
                        : "border-slate-200 dark:border-slate-700 hover:border-[#fdb612]/50"
                    )}
                  >
                    {rememberFortlev && <CheckCircle2 className="w-4 h-4" />}
                  </button>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Remember my data</span>
                </div>

                <div className="pt-2 flex flex-col gap-3">
                  <button 
                    type="submit"
                    className="w-full py-5 bg-[#fdb612] text-[#231d0f] rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:shadow-xl hover:shadow-[#fdb612]/20 transition-all active:scale-[0.98]"
                  >
                    Connect Now
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowFortlevLogin(false)}
                    className="w-full py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    Cancel Access
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* New Kit Modal */}
      <NewKitModal 
        isOpen={showNewKitModal} 
        onClose={() => setShowNewKitModal(false)} 
        kit={null} 
      />
    </div>
  );
};
