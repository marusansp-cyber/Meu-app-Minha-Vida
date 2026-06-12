import React, { useState, useRef } from 'react';
import { 
  User, 
  Bell, 
  Shield, 
  Globe, 
  Moon, 
  Sun, 
  Save,
  Building,
  Calendar,
  CreditCard,
  Mail,
  ShieldCheck,
  Phone,
  MapPin,
  Camera,
  Trash2,
  HelpCircle,
  LogOut,
  ChevronRight,
  Download,
  MessageSquare,
  LifeBuoy,
  FileText,
  X,
  ExternalLink,
  Rocket
} from 'lucide-react';
import { cn } from '../lib/utils';

import { User as UserType, CompanySettings, SMTPSettings, EmailTemplateSettings } from '../types';
import { updateDocument, getDocument, setDocument } from '../firestoreUtils';
import { SMTPHelpModal } from './SMTPHelpModal';
import { Eye, EyeOff, CheckCircle, AlertCircle, Lock, AlertTriangle, Sparkles, Check, RefreshCw } from 'lucide-react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

interface SettingsViewProps {
  user: UserType | null;
  onUpdateUser: (user: UserType) => void;
  onLogout?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ user, onUpdateUser, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'company' | 'financial' | 'system' | 'integrations' | 'support'>('profile');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showSMTPHelp, setShowSMTPHelp] = useState(false);
  const [showSMTPPassword, setShowSMTPPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [salesGoal, setSalesGoal] = useState({
    targetValue: 150000,
    targetCount: 10
  });
  
  const [smtpData, setSmtpData] = useState<SMTPSettings>({
    host: 'smtp.gmail.com',
    port: 587,
    user: '',
    pass: '',
    from: ''
  });

  const [emailTemplates, setEmailTemplates] = useState<EmailTemplateSettings>({
    proposalSubject: 'Proposta Comercial - Mendes Engenharia',
    proposalBody: 'Olá [NOME],\n\nSegue em anexo a proposta comercial para o seu projeto de energia solar.\n\nAtenciosamente,\nEquipe Mendes Engenharia',
    installationSubject: 'Agendamento de Vistoria Técnica - Mendes Engenharia',
    installationBody: 'Olá [NOME],\n\nSeu projeto está na fase de Vistoria Técnica. Acesse o sistema para agendar a melhor data.\n\nAtenciosamente,\nEquipe Mendes Engenharia',
    welcomeSubject: 'Obrigado pelo seu contato! - Mendes Engenharia',
    welcomeBody: 'Olá [NOME],\n\nRecebemos suas informações e agradecemos o contato. Em breve um de nossos consultores entrará em contato com você para entender melhor sua necessidade e apresentar a solução ideal em energia solar.\n\nAtenciosamente,\nEquipe Mendes Engenharia'
  });

  const [smtpStatus, setSmtpStatus] = useState<{
    configured: boolean;
    user: string | null;
    host: string;
    passLength: number;
  } | null>(null);

  // Automated Assistant States for Real-Time SMTP feedback
  const [smtpDiagnosticStep, setSmtpDiagnosticStep] = useState<'idle' | 'host_check' | 'credentials_format' | 'testing_server' | 'success' | 'failed'>('idle');
  const [smtpDiagnosticsMessage, setSmtpDiagnosticsMessage] = useState<string>('');
  const [smtpDiagnosticsErrorType, setSmtpDiagnosticsErrorType] = useState<'none' | 'gmail_password_format' | 'gmail_wrong_pass' | 'auth_failed' | 'network' | 'missing_fields'>('none');

  const rtSmtpAnalysis = React.useMemo(() => {
    const host = (smtpData.host || '').trim().toLowerCase();
    const user = (smtpData.user || '').trim();
    const rawPass = smtpData.pass || '';
    const pass = rawPass.replace(/\s+/g, ''); // strip spaces
    
    const isGmail = host.includes('gmail.com') || host.includes('googlemail.com') || user.endsWith('@gmail.com');
    const hasSpacesInPass = rawPass.includes(' ') && rawPass.trim().length > 0;
    
    const isHostValid = host.length > 3 && host.includes('.');
    const isUserValid = user.length > 3 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user);
    
    let passCheck: 'empty' | 'valid_gmail_app' | 'invalid_gmail_app' | 'generic' = 'empty';
    let message = '';
    
    if (!rawPass) {
      passCheck = 'empty';
      message = 'Por favor, insira sua senha.';
    } else if (isGmail) {
      if (pass.length === 16) {
        passCheck = 'valid_gmail_app';
        message = 'Formato correto! Tem 16 caracteres (padrão de Senha de App do Google).';
      } else {
        passCheck = 'invalid_gmail_app';
        message = `Senha com ${pass.length} caracteres. No Gmail, você DEVE usar uma Senha de App de exatamente 16 caracteres.`;
      }
    } else {
      passCheck = 'generic';
      message = rawPass.length < 5 ? 'A senha parece curta demais.' : 'Senha inserida.';
    }
    
    return {
      isGmail,
      hasSpacesInPass,
      isHostValid,
      isUserValid,
      passCheck,
      passMessage: message,
      cleanPass: pass,
      allPassed: isHostValid && isUserValid && (isGmail ? pass.length === 16 : rawPass.length > 0)
    };
  }, [smtpData]);

  const handleRemovePassSpaces = () => {
    setSmtpData(prev => ({
      ...prev,
      pass: prev.pass.replace(/\s+/g, '')
    }));
    showToast('✨ Espaços removidos da senha!');
  };

  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    whatsapp: true
  });

  const [companySettings, setCompanySettings] = useState<Partial<CompanySettings>>({
    companyName: "JV Mendes Junior Engenharia",
    cnpj: "61.950.902/0001-83", 
    address: "São João do Oriente/MG",
    email: "marusanspc@gmail.com",
    contactEmail: "marusanspc@gmail.com",
    phone: "(33) 99903-2281",
    monthlyInvoice: 0,
    defaultCommissionPercentage: 5
  });

  const [profile, setProfile] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "(11) 99999-9999",
    address: user?.address || "",
    role: user?.role || "sales",
    occupation: user?.role || "", // Representing cargo/function
    photo: user?.avatar || null as string | null
  });

  const [securityData, setSecurityData] = useState({
    plan: "Enterprise",
    status: "Ativo",
    nextBilling: "14/04/2026",
    paymentMethod: "Cartão de Crédito (**** 4242)",
    newPassword: "",
    confirmPassword: "",
    twoFactorEnabled: user?.twoFactorEnabled || false,
    invoices: [
      { id: '1', date: '14/03/2026', amount: 'R$ 499,00', status: 'Pago' },
      { id: '2', date: '14/02/2026', amount: 'R$ 499,00', status: 'Pago' },
      { id: '3', date: '14/01/2026', amount: 'R$ 499,00', status: 'Pago' },
    ]
  });

  const [invoiceFilters, setInvoiceFilters] = useState({
    startDate: '',
    endDate: ''
  });

  // --- AUTOMATED BACKUP MANAGEMENT STATES ---
  const [serverBackups, setServerBackups] = useState<any[]>([]);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const fetchBackups = async () => {
    setIsLoadingBackups(true);
    try {
      const response = await fetch('/api/backups');
      const result = await response.json();
      if (result.success) {
        setServerBackups(result.backups || []);
      }
    } catch (error) {
      console.error('Erro ao buscar backups:', error);
    } finally {
      setIsLoadingBackups(false);
    }
  };

  React.useEffect(() => {
    if (activeTab === 'system') {
      fetchBackups();
    }
  }, [activeTab]);

  const handleForceServerBackup = async () => {
    setIsExporting(true);
    try {
      showToast('Iniciando backup redundante no servidor...');
      const collectionsToBackup = ['proposals', 'leads', 'installations', 'clients', 'companySettings', 'kits'];
      const backupData: Record<string, any[]> = {};
      
      for (const collName of collectionsToBackup) {
        const querySnapshot = await getDocs(collection(db, collName));
        backupData[collName] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }
      
      const date = new Date().toISOString().split('T')[0];
      const filename = `backup_auto_${date}_${Date.now()}.json`;

      const response = await fetch('/api/backups/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, data: backupData })
      });

      const result = await response.json();
      if (result.success) {
        showToast('✨ Backup redundante gerado com sucesso no servidor!');
        await fetchBackups();
      } else {
        showToast(`Erro ao salvar: ${result.message}`);
      }
    } catch (error: any) {
      console.error('Erro ao gerar backup no servidor:', error);
      showToast(`Erro no backup: ${error.message || 'Falha ao processar.'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteServerBackup = async (filename: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o backup ${filename}?`)) return;
    try {
      showToast('Excluindo backup...');
      const response = await fetch(`/api/backups/${filename}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      if (result.success) {
        showToast('Backup excluído do servidor.');
        await fetchBackups();
      } else {
        showToast(`Erro ao excluir: ${result.message}`);
      }
    } catch (error: any) {
      console.error('Erro ao excluir backup:', error);
      showToast('Erro ao excluir backup.');
    }
  };

  const handleDownloadServerBackup = (filename: string) => {
    const link = document.createElement('a');
    link.href = `/api/backups/download/${filename}`;
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    if (!user) return;

    // Password validation if attempting to change
    if (securityData.newPassword) {
      const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/;
      if (!passwordRegex.test(securityData.newPassword)) {
        showToast('A senha deve ter pelo menos 8 caracteres, incluindo números e caracteres especiais (!@#$%^&*)');
        return;
      }
      if (securityData.newPassword !== securityData.confirmPassword) {
        showToast('As senhas não coincidem');
        return;
      }
    }

    try {
      const updatedUser: UserType = {
        ...user,
        name: profile.name,
        email: profile.email,
        role: profile.role as any,
        avatar: profile.photo || undefined,
        phone: profile.phone,
        address: profile.address,
        twoFactorEnabled: securityData.twoFactorEnabled
      };

      await updateDocument('users', user.id, updatedUser);
      onUpdateUser(updatedUser);

      // Save Company Settings
      await setDocument('settings', 'company', {
        ...companySettings,
        updatedAt: new Date().toISOString()
      });

      // Save Sales Goal
      await setDocument('settings', 'salesGoal', {
        ...salesGoal,
        updatedAt: new Date().toISOString()
      });

      showToast('Configurações salvas com sucesso!');
      setSecurityData(prev => ({ ...prev, newPassword: '', confirmPassword: '' }));
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast('Erro ao salvar configurações.');
    }
  };

  const handleFirestoreBackup = async () => {
    try {
      showToast('Iniciando backup...');
      const collectionsToBackup = ['proposals', 'leads', 'installations', 'clients', 'companySettings', 'kits'];
      const backupData: Record<string, any[]> = {};
      
      for (const collName of collectionsToBackup) {
        const querySnapshot = await getDocs(collection(db, collName));
        backupData[collName] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }
      
      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      const date = new Date().toISOString().split('T')[0];
      
      link.setAttribute('href', url);
      link.setAttribute('download', `backup_jv_mendes_${date}.json`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showToast('Backup concluído com sucesso!');
    } catch (err: any) {
      console.error('Backup fail:', err);
      showToast(`Erro no backup: ${err.message || 'Falha ao exportar os dados.'}`);
    }
  };

  const handleExportData = () => {
    if (!user) return;
    
    const headers = ['ID', 'Nome', 'Email', 'Role', 'Telefone', 'Endereço'];
    const data = [
      user.id,
      user.name,
      user.email,
      user.role,
      user.phone || '',
      user.address || ''
    ];
    
    const csvContent = [
      headers.join(','),
      data.map(val => `"${val}"`).join(',')
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `meus_dados_${user.name.replace(/\s+/g, '_').toLowerCase()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Dados exportados com sucesso!');
  };

  const handleSaveSMTP = async () => {
    // 1. Initial checks
    if (!smtpData.host || !smtpData.user || !smtpData.pass) {
      setSmtpDiagnosticStep('failed');
      setSmtpDiagnosticsMessage('Dados SMTP incompletos. Preencha todos os campos obrigatórios na coluna ao lado.');
      setSmtpDiagnosticsErrorType('missing_fields');
      showToast('⚠️ Preencha os campos SMTP.');
      return;
    }

    setSmtpDiagnosticStep('host_check');
    setSmtpDiagnosticsMessage(`Analisando configurações de rede para ${smtpData.host}...`);
    setSmtpDiagnosticsErrorType('none');

    // Artificial delay for smooth visual transition
    await new Promise(resolve => setTimeout(resolve, 600));

    // 2. Validate formats locally
    const host = smtpData.host.trim().toLowerCase();
    const isGmail = host.includes('gmail.com') || host.includes('googlemail.com') || smtpData.user.endsWith('@gmail.com');
    const cleanedPass = smtpData.pass.replace(/\s+/g, '');

    if (isGmail && cleanedPass.length !== 16) {
      console.warn("Aviso: Senha do Gmail não tem 16 caracteres, pode falhar na autenticação.");
    }

    setSmtpDiagnosticStep('credentials_format');
    setSmtpDiagnosticsMessage('Formatos estruturais de credenciais aprovados. Sanitizando dados...');
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Auto sanitize spaces if they had them
    const sanitizedSmtpData = {
      ...smtpData,
      pass: cleanedPass
    };
    if (smtpData.pass !== cleanedPass) {
      setSmtpData(sanitizedSmtpData);
    }

    setSmtpDiagnosticStep('testing_server');
    setSmtpDiagnosticsMessage(`Testando conexão SMTP para ${smtpData.user} antes de salvar...`);

    try {
      showToast('Validando conexão SMTP com o servidor...');
      const res = await fetch('/api/smtp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ smtpConfig: sanitizedSmtpData })
      });
      
      const data = await res.json();
      if (data.success) {
        setSmtpDiagnosticStep('success');
        setSmtpDiagnosticsMessage('A conexão SMTP foi estabelecida com absoluto sucesso! Salvando configurações de forma segura...');
        
        try {
          // Save to Firestore ONLY if successful
          await setDocument('settings', 'smtp', {
            ...sanitizedSmtpData,
            updatedAt: new Date().toISOString()
          });
          
          await setDocument('settings', 'emailTemplates', {
            ...emailTemplates,
            updatedAt: new Date().toISOString()
          });
          
          setSmtpStatus({
            configured: true,
            user: sanitizedSmtpData.user,
            host: sanitizedSmtpData.host,
            passLength: sanitizedSmtpData.pass.length
          });
          
          showToast('✅ Configurações SMTP validadas e salvas com sucesso!');
        } catch (error) {
          console.error('Error saving SMTP settings:', error);
          showToast('Erro ao salvar no Firestore.');
        }
      } else {
        setSmtpDiagnosticStep('failed');
        const errMessage = data.message || '';
        const errCode = data.error || '';
        
        if (isGmail) {
          if (errCode === 'INVALID_GMAIL_PASS_LENGTH' || cleanedPass.length !== 16) {
            setSmtpDiagnosticsErrorType('gmail_password_format');
            setSmtpDiagnosticsMessage('O servidor do Gmail rejeitou a senha de app porque o tamanho é diferente de 16 caracteres.');
          } else {
            setSmtpDiagnosticsErrorType('gmail_wrong_pass');
            setSmtpDiagnosticsMessage('O e-mail ou a Senha de App foi rejeitada pelo Gmail (Erro 535). Verifique se você ativou a Verificação em Duas Etapas e digitou a senha de app de 16 letras corretamente sem espaços adicionais.');
          }
        } else {
          setSmtpDiagnosticsErrorType('auth_failed');
          setSmtpDiagnosticsMessage(errMessage || 'Falha de Autenticação (Erro 535): Verifique o usuário e senha do seu provedor.');
        }
        showToast('❌ Erro na validação SMTP.');
      }
    } catch (e) {
      console.error(e);
      setSmtpDiagnosticStep('failed');
      setSmtpDiagnosticsErrorType('network');
      setSmtpDiagnosticsMessage('Ocorreu um erro de rede ou timeout ao conectar com o servidor SMTP. Verifique o host do seu e-mail ou tente utilizar as portas corretas ( SSL: 465, TLS: 587 ).');
      showToast('❌ Falha na conexão de rede.');
    }
  };

  const handleSendTestEmail = async () => {
    await handleSaveSMTP();
  };

  const handleRoleChange = (newRole: string) => {
    const roleLabels: Record<string, string> = {
      admin: 'Administrador',
      sales: 'Vendedor',
      engineer: 'Engenheiro',
      installer: 'Instalador',
      finance: 'Financeiro',
      admin_staff: 'Staff Administrativo'
    };
    
    setProfile(prev => ({ 
      ...prev, 
      role: newRole as any,
      occupation: roleLabels[newRole] || prev.occupation 
    }));
  };

  const handleCancel = () => {
    showToast('Alterações descartadas.');
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  React.useEffect(() => {
    const fetchCompanySettings = async () => {
      const settings = await getDocument<CompanySettings>('settings', 'company');
      if (settings) {
        setCompanySettings(settings);
      }
    };
    
    const fetchSMTPSettings = async () => {
      const settings = await getDocument<SMTPSettings>('settings', 'smtp');
      if (settings) {
        setSmtpData(settings);
        setSmtpStatus({
          configured: true,
          user: settings.user,
          host: settings.host,
          passLength: settings.pass.length
        });
      }
      const templates = await getDocument<EmailTemplateSettings>('settings', 'emailTemplates');
      if (templates) {
        setEmailTemplates(prev => ({ ...prev, ...templates }));
      }
    };

    const fetchSalesGoal = async () => {
      const goal = await getDocument<any>('settings', 'salesGoal');
      if (goal) {
        setSalesGoal({
          targetValue: goal.targetValue || 150000,
          targetCount: goal.targetCount || 10
        });
      }
    };

    fetchCompanySettings();
    fetchSMTPSettings();
    fetchSalesGoal();
  }, []);

  React.useEffect(() => {
    const fetchSMTPStatus = async () => {
      try {
        const res = await fetch('/api/smtp/status');
        const data = await res.json();
        if (data.success) {
          setSmtpStatus(data);
        }
      } catch (e) {
        console.error('Error fetching SMTP status:', e);
      }
    };
    if (activeTab === 'integrations') {
      fetchSMTPStatus();
    }
  }, [activeTab]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile(prev => ({ ...prev, photo: reader.result as string }));
        showToast('Foto de perfil atualizada!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setProfile(prev => ({ ...prev, photo: null }));
    showToast('Foto de perfil removida.');
  };

  const tabs = [
    { id: 'profile', label: 'Meu Perfil', icon: User },
    { id: 'company', label: 'Dados da Empresa', icon: Building },
    { id: 'financial', label: 'Financeiro', icon: CreditCard },
    { id: 'system', label: 'Sistema', icon: Shield },
    { id: 'integrations', label: 'E-mail (SMTP)', icon: Mail },
    { id: 'support', label: 'Suporte', icon: LifeBuoy },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      {toast && (
        <div className="fixed bottom-8 right-8 z-[200] bg-[#231d0f] text-white px-6 py-3 rounded-xl shadow-2xl border border-[#fdb612]/30 animate-in slide-in-from-right duration-300 flex items-center gap-3">
          <div className="size-2 bg-[#fdb612] rounded-full animate-pulse" />
          <span className="font-bold text-sm">{toast}</span>
        </div>
      )}
      
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*"
        onChange={handleFileChange}
      />

      <header>
        <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100">Configurações</h2>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Gerencie sua conta e as preferências do sistema</p>
      </header>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Tabs */}
        <aside className="lg:w-72 space-y-6">
          <div className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all font-bold text-sm",
                    activeTab === tab.id 
                      ? "bg-[#fdb612] text-[#231d0f] shadow-lg shadow-[#fdb612]/20" 
                      : "text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </div>
                  {activeTab === tab.id && <ChevronRight className="w-4 h-4" />}
                </button>
              );
            })}
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all font-bold text-sm"
            >
              <LogOut className="w-5 h-5" />
              <span>Sair da Conta</span>
            </button>
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1 bg-white dark:bg-[#231d0f]/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl backdrop-blur-sm">
          {activeTab === 'profile' && (
            <div className="space-y-8">
              <div className="flex items-center gap-6">
                <div className="size-24 rounded-3xl bg-[#fdb612]/10 flex items-center justify-center text-[#fdb612] text-4xl font-black border-2 border-dashed border-[#fdb612]/30 overflow-hidden">
                  {profile.photo ? (
                    <img 
                      src={profile.photo} 
                      alt="Profile" 
                      className="w-full h-full object-cover" 
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    profile.name.charAt(0)
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">Foto de Perfil</h3>
                  <p className="text-sm text-slate-500 mb-4">JPG, GIF ou PNG. Máximo de 2MB.</p>
                  <div className="flex gap-3">
                    <button 
                      onClick={handleUploadClick}
                      className="px-4 py-2 bg-[#fdb612] text-[#231d0f] rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-[#fdb612]/80 transition-all"
                    >
                      <Camera className="w-3 h-3" />
                      Upload
                    </button>
                    <button 
                      onClick={handleRemovePhoto}
                      className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200 transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                      Remover
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 group">
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nome Completo</label>
                    <HelpCircle className="w-3 h-3 text-slate-400 cursor-help" />
                  </div>
                  <input 
                    type="text" 
                    value={profile.name || ''}
                    onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612] transition-all font-bold"
                  />
                </div>
                <div className="space-y-2 group">
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">E-mail</label>
                    <HelpCircle className="w-3 h-3 text-slate-400 cursor-help" />
                  </div>
                  <input 
                    type="email" 
                    value={profile.email || ''}
                    onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612] transition-all font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Telefone</label>
                  <input 
                    type="text" 
                    value={profile.phone || ''}
                    onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612] transition-all font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Endereço Físico</label>
                  <input 
                    type="text" 
                    value={profile.address || ''}
                    onChange={(e) => setProfile(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Rua, Número, Bairro, Cidade - UF"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612] transition-all font-bold"
                  />
                </div>
                <div className="space-y-2 group">
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cargo</label>
                    <HelpCircle className="w-3 h-3 text-slate-400 cursor-help" />
                  </div>
                  <input 
                    type="text" 
                    value={profile.occupation || ''}
                    onChange={(e) => setProfile(prev => ({ ...prev, occupation: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612] transition-all font-bold"
                  />
                </div>
                <div className="space-y-2 group">
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nova Senha</label>
                    <Shield className="w-3 h-3 text-[#fdb612]" />
                  </div>
                  <input 
                    type="password" 
                    placeholder="Min. 8 chars + num + especial"
                    value={securityData.newPassword}
                    onChange={(e) => setSecurityData(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612] transition-all font-bold"
                  />
                </div>
                <div className="space-y-2 group">
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Confirmar Senha</label>
                  </div>
                  <input 
                    type="password" 
                    placeholder="Repita a nova senha"
                    value={securityData.confirmPassword}
                    onChange={(e) => setSecurityData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612] transition-all font-bold"
                  />
                </div>
                <div className="md:col-span-2 pt-4">
                  <button 
                    onClick={handleExportData}
                    className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-[#fdb612] transition-all"
                  >
                    <Download className="w-4 h-4" />
                    Exportar meus dados em CSV
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">Segurança Avançada</h3>
                <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-xl bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center text-orange-600">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">Autenticação em Duas Etapas (2FA)</h4>
                      <p className="text-xs text-slate-500">Exigir código de verificação ao fazer login</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      const newState = !securityData.twoFactorEnabled;
                      setSecurityData(prev => ({ ...prev, twoFactorEnabled: newState }));
                      showToast(`2FA ${newState ? 'habilitado' : 'desabilitado'}! Clique em Salvar para confirmar.`);
                    }}
                    className={cn(
                      "w-12 h-6 rounded-full transition-colors relative",
                      securityData.twoFactorEnabled ? "bg-orange-500" : "bg-slate-300 dark:bg-slate-700"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 size-4 bg-white rounded-full transition-all",
                      securityData.twoFactorEnabled ? "left-7" : "left-1"
                    )} />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">Controle de Acesso</h3>
                <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600">
                      <Shield className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">Gestão de Usuários</h4>
                      <p className="text-xs text-slate-500">Configure permissões e níveis de acesso por usuário</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => showToast('Abrindo painel de controle de acesso...')}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                  >
                    Acesso por Usuário
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">Backup do Sistema</h3>
                
                {/* Backup Manual */}
                <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-600">
                      <Download className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">Backup Manual de Dados</h4>
                      <p className="text-xs text-slate-500">Baixe um arquivo JSON local imediato com todas as propostas, leads, instalações e configurações</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleFirestoreBackup}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                  >
                    Gerar Backup
                  </button>
                </div>

                {/* Backup Redundante Semanal Automático */}
                <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <div className="size-12 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600">
                        <Calendar className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">Backup Semanal Automático</h4>
                          <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-full">
                            Ativo
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">Garante a redundância extra salvando cópias JSON do banco diretamente no servidor toda semana</p>
                      </div>
                    </div>
                    <button 
                      onClick={handleForceServerBackup}
                      disabled={isExporting}
                      className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 active:scale-95 disabled:opacity-50 flex items-center gap-2"
                    >
                      {isExporting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Processando...
                        </>
                      ) : 'Executar Agora'}
                    </button>
                  </div>

                  {/* Status do Backup */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="p-4 bg-white dark:bg-slate-800/40 rounded-xl border border-slate-150 dark:border-slate-800/80">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Próxima Execução</span>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-1 flex items-center gap-2">
                        <span className="size-2 bg-indigo-500 rounded-full animate-pulse"></span>
                        Semanal (Todo Domingo, 00:00)
                      </p>
                    </div>
                    <div className="p-4 bg-white dark:bg-slate-800/40 rounded-xl border border-slate-150 dark:border-slate-800/80">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status de Redundância</span>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-1 flex items-center gap-2">
                        <span className="size-2 bg-emerald-500 rounded-full animate-ping"></span>
                        Seguro ({serverBackups.length} Backups no Servidor)
                      </p>
                    </div>
                  </div>

                  {/* Lista de Backups Armazenados */}
                  <div className="space-y-2 pt-2">
                    <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest">Histórico de Backups Disponíveis</h5>
                    
                    {isLoadingBackups ? (
                      <div className="flex items-center justify-center p-8 bg-white dark:bg-slate-800/20 rounded-xl">
                        <RefreshCw className="w-6 h-6 text-slate-400 animate-spin" />
                        <span className="text-xs text-slate-500 ml-2">Carregando histórico do servidor...</span>
                      </div>
                    ) : serverBackups.length === 0 ? (
                      <div className="p-6 text-center bg-white dark:bg-slate-800/20 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                        <p className="text-xs text-slate-500">Nenhum backup automático gerado ainda.</p>
                        <p className="text-[11px] text-slate-400 mt-1">Os backups são agendados semanalmente ou podem ser forçados clicando em "Executar Agora".</p>
                      </div>
                    ) : (
                      <div className="bg-white dark:bg-slate-800/20 rounded-xl border border-slate-150 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 max-h-[250px] overflow-y-auto">
                        {serverBackups.map((bak) => {
                          const sizeKB = (bak.size / 1024).toFixed(1);
                          const dateObj = new Date(bak.createdAt);
                          const day = String(dateObj.getDate()).padStart(2, '0');
                          const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                          const year = dateObj.getFullYear();
                          const hours = String(dateObj.getHours()).padStart(2, '0');
                          const minutes = String(dateObj.getMinutes()).padStart(2, '0');
                          const formattedDate = `${day}/${month}/${year} às ${hours}:${minutes}`;

                          return (
                            <div key={bak.filename} className="p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 rounded-lg">
                                  <FileText className="w-5 h-5" />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-slate-850 dark:text-slate-200 max-w-[150px] sm:max-w-xs md:max-w-md truncate" title={bak.filename}>
                                    {bak.filename}
                                  </p>
                                  <p className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                                    <span>{formattedDate}</span>
                                    <span>•</span>
                                    <span>{sizeKB} KB</span>
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleDownloadServerBackup(bak.filename)}
                                  className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-all hover:scale-105 active:scale-95"
                                  title="Baixar Backup"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteServerBackup(bak.filename)}
                                  className="p-2 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 hover:dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg transition-all hover:scale-105 active:scale-95"
                                  title="Excluir Backup"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">Aparência</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setIsDarkMode(false)}
                    className={cn(
                      "p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3",
                      !isDarkMode ? "border-[#fdb612] bg-[#fdb612]/5" : "border-slate-200 dark:border-slate-800"
                    )}
                  >
                    <Sun className={cn("w-8 h-8", !isDarkMode ? "text-[#fdb612]" : "text-slate-400")} />
                    <span className="text-xs font-black uppercase tracking-widest">Modo Claro</span>
                  </button>
                  <button 
                    onClick={() => setIsDarkMode(true)}
                    className={cn(
                      "p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3",
                      isDarkMode ? "border-[#fdb612] bg-[#fdb612]/5" : "border-slate-200 dark:border-slate-800"
                    )}
                  >
                    <Moon className={cn("w-8 h-8", isDarkMode ? "text-[#fdb612]" : "text-slate-400")} />
                    <span className="text-xs font-black uppercase tracking-widest">Modo Escuro</span>
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">Notificações</h3>
                <div className="space-y-3">
                  {Object.entries(notifications).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center">
                          {key === 'email' && <Mail className="w-4 h-4 text-blue-500" />}
                          {key === 'push' && <Bell className="w-4 h-4 text-[#fdb612]" />}
                          {key === 'sms' && <Phone className="w-4 h-4 text-emerald-500" />}
                          {key === 'whatsapp' && (
                            <svg className="w-4 h-4 text-emerald-600" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                            </svg>
                          )}
                        </div>
                        <span className="text-sm font-bold capitalize">
                          {key === 'push' ? 'Notificações Push' : key === 'whatsapp' ? 'WhatsApp' : key}
                        </span>
                      </div>
                      <button 
                        onClick={() => setNotifications(prev => ({ ...prev, [key]: !value }))}
                        className={cn(
                          "w-12 h-6 rounded-full transition-colors relative",
                          value ? "bg-[#fdb612]" : "bg-slate-300 dark:bg-slate-700"
                        )}
                      >
                        <div className={cn(
                          "absolute top-1 size-4 bg-white rounded-full transition-all",
                          value ? "left-7" : "left-1"
                        )} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'company' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Razão Social</label>
                  <input 
                    type="text" 
                    value={companySettings.companyName || ''}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, companyName: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612] transition-all font-bold"
                  />
                </div>
                <div className="space-y-2 group">
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">CNPJ</label>
                    <HelpCircle className="w-3 h-3 text-slate-400 cursor-help" />
                  </div>
                  <input 
                    type="text" 
                    value={companySettings.cnpj || ''}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, cnpj: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612] transition-all font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">E-mail Comercial</label>
                  <input 
                    type="email" 
                    value={companySettings.email || ''}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612] transition-all font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Telefone Comercial</label>
                  <input 
                    type="text" 
                    value={companySettings.phone || ''}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612] transition-all font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-display">Fatura Mensal do Cliente (Média)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                    <input 
                      type="number" 
                      value={companySettings.monthlyInvoice || 0}
                      onChange={(e) => setCompanySettings(prev => ({ ...prev, monthlyInvoice: parseFloat(e.target.value) }))}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-bold"
                      placeholder="500.00"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Este valor será sugerido como faturamento padrão para novos orçamentos.</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-display">Comissão Padrão de Vendas (%)</label>
                  <div className="relative">
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                    <input 
                      type="number" 
                      value={companySettings.defaultCommissionPercentage || 5}
                      onChange={(e) => setCompanySettings(prev => ({ ...prev, defaultCommissionPercentage: parseFloat(e.target.value) }))}
                      className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612] transition-all font-bold"
                      placeholder="5"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Será usada para calcular as comissões no relatório financeiro.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">E-mail de Contato (Suporte)</label>
                  <div className="flex gap-2">
                    <input 
                      type="email" 
                      value={companySettings.contactEmail || ''}
                      onChange={(e) => setCompanySettings(prev => ({ ...prev, contactEmail: e.target.value }))}
                      className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612] transition-all font-bold text-sm"
                      placeholder="email@exemplo.com"
                    />
                    <button 
                      onClick={handleSendTestEmail}
                      className="px-4 py-3 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#fdb612]/10 transition-all flex items-center gap-2 shrink-0"
                    >
                      <Mail className="w-4 h-4 text-[#fdb612]" />
                      E-mail de Teste
                    </button>
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Endereço</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      type="text" 
                      value={companySettings.address || ''}
                      onChange={(e) => setCompanySettings(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612] transition-all font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'financial' && (
            <div className="space-y-8">
              <div className="space-y-6">
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">Metas de Vendas Mensais</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Meta de Faturamento (R$)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                      <input 
                        type="number" 
                        value={salesGoal.targetValue}
                        onChange={(e) => setSalesGoal(prev => ({ ...prev, targetValue: parseFloat(e.target.value) || 0 }))}
                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612] transition-all font-bold"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Meta de Contratos (Qtd)</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="number" 
                        value={salesGoal.targetCount}
                        onChange={(e) => setSalesGoal(prev => ({ ...prev, targetCount: parseInt(e.target.value) || 0 }))}
                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612] transition-all font-bold"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Plano Atual</p>
                  <h4 className="text-xl font-black text-slate-900 dark:text-slate-100">{securityData.plan}</h4>
                  <div className="mt-4 inline-flex items-center px-2 py-1 rounded-md bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 text-[10px] font-black uppercase tracking-widest">
                    {securityData.status}
                  </div>
                </div>
                <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Próxima Fatura</p>
                  <h4 className="text-xl font-black text-slate-900 dark:text-slate-100">{securityData.nextBilling}</h4>
                  <p className="text-xs text-slate-500 mt-2">Valor: R$ 499,00</p>
                </div>
                <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Método de Pagamento</p>
                  <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">{securityData.paymentMethod}</h4>
                  <button className="text-xs font-bold text-[#fdb612] mt-4 hover:underline">Alterar Cartão</button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">Histórico de Faturas</h3>
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <input 
                      type="date" 
                      value={invoiceFilters.startDate || ''}
                      onChange={(e) => setInvoiceFilters(prev => ({ ...prev, startDate: e.target.value }))}
                      className="bg-transparent border-none text-[10px] font-bold outline-none w-24"
                    />
                    <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">até</span>
                    <input 
                      type="date" 
                      value={invoiceFilters.endDate || ''}
                      onChange={(e) => setInvoiceFilters(prev => ({ ...prev, endDate: e.target.value }))}
                      className="bg-transparent border-none text-[10px] font-bold outline-none w-24"
                    />
                  </div>
                </div>
                <div className="overflow-hidden border border-slate-100 dark:border-slate-800 rounded-2xl">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-900/50">
                      <tr>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Data</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Valor</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {securityData.invoices
                        .filter(invoice => {
                          if (!invoiceFilters.startDate && !invoiceFilters.endDate) return true;
                          const [day, month, year] = invoice.date.split('/').map(Number);
                          const invoiceDate = new Date(year, month - 1, day);
                          
                          if (invoiceFilters.startDate) {
                            const start = new Date(invoiceFilters.startDate);
                            if (invoiceDate < start) return false;
                          }
                          if (invoiceFilters.endDate) {
                            const end = new Date(invoiceFilters.endDate);
                            if (invoiceDate > end) return false;
                          }
                          return true;
                        })
                        .map((invoice) => (
                          <tr key={invoice.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4 text-sm font-bold text-slate-700 dark:text-slate-300">{invoice.date}</td>
                            <td className="px-6 py-4 text-sm font-bold text-slate-700 dark:text-slate-300">{invoice.amount}</td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-1 rounded-md bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 text-[10px] font-black uppercase tracking-widest">
                                {invoice.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button className="p-2 text-slate-400 hover:text-[#fdb612] transition-colors">
                                <Download className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right duration-500">
              <div className={cn(
                "p-6 rounded-3xl border flex items-center justify-between transition-all duration-500",
                smtpStatus?.configured 
                  ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-800" 
                  : "bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-800"
              )}>
                <div className="flex gap-5">
                  <div className={cn(
                    "size-14 rounded-2xl flex items-center justify-center shrink-0 shadow-xl transition-all",
                    smtpStatus?.configured ? "bg-emerald-500 text-white shadow-emerald-500/30" : "bg-rose-500 text-white shadow-rose-500/30"
                  )}>
                    <Mail className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-900 dark:text-slate-100 uppercase tracking-tighter">
                      Servidor de E-mail: {smtpStatus?.configured ? 'INTEGRADO' : 'PENDENTE'}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-md">
                      {smtpStatus?.configured 
                        ? `O sistema está utilizando o servidor ${smtpStatus.host} com o usuário ${smtpStatus.user}.` 
                        : 'Configure os dados SMTP abaixo para habilitar o envio de propostas via E-mail.'}
                    </p>
                  </div>
                </div>
                {smtpStatus?.configured && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">
                    <CheckCircle className="w-3 h-3" />
                    Ativo agora
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h5 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#fdb612]">
                      <Globe className="w-3 h-3" />
                      Configuração de Rede
                    </h5>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2 space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">SMTP Host</label>
                        <input 
                          type="text" 
                          value={smtpData.host}
                          onChange={(e) => setSmtpData({ ...smtpData, host: e.target.value })}
                          placeholder="smtp.gmail.com"
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612] transition-all font-bold text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Porta</label>
                        <input 
                          type="number" 
                          value={smtpData.port}
                          onChange={(e) => setSmtpData({ ...smtpData, port: parseInt(e.target.value) || 587 })}
                          placeholder="587"
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612] transition-all font-bold text-sm text-center"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h5 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#fdb612]">
                      <Lock className="w-3 h-3" />
                      Credenciais de Acesso
                    </h5>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Usuário / E-mail</label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input 
                            type="email" 
                            value={smtpData.user}
                            onChange={(e) => setSmtpData({ ...smtpData, user: e.target.value })}
                            placeholder="seuemail@provedor.com"
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612] transition-all font-bold text-sm"
                          />
                        </div>
                        {smtpData.user && !rtSmtpAnalysis.isUserValid && (
                          <p className="text-[10px] text-amber-500 font-bold flex items-center gap-1 mt-1">
                            <AlertTriangle className="w-3 h-3" />
                            Insira um e-mail válido para autenticar.
                          </p>
                        )}
                        {smtpData.user && rtSmtpAnalysis.isUserValid && (
                          <p className="text-[10px] text-emerald-500 font-medium flex items-center gap-1 mt-1">
                            <Check className="w-3 h-3 text-emerald-500" />
                            E-mail formatado corretamente.
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Senha ou Senha de App</label>
                        <div className="relative">
                          <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input 
                            type={showSMTPPassword ? "text" : "password"}
                            value={smtpData.pass}
                            onChange={(e) => setSmtpData({ ...smtpData, pass: e.target.value })}
                            placeholder="••••••••••••••••"
                            className="w-full pl-11 pr-12 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612] font-mono text-sm"
                          />
                          <button 
                            type="button"
                            onClick={() => setShowSMTPPassword(!showSMTPPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            {showSMTPPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        
                        <div className="space-y-1 mt-1">
                          {rtSmtpAnalysis.isGmail && rtSmtpAnalysis.hasSpacesInPass && (
                            <div className="flex items-center justify-between p-2 bg-amber-500/10 rounded-lg border border-amber-500/20 mt-1">
                              <p className="text-[10px] text-amber-500 font-bold flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 animate-pulse shrink-0" />
                                Senha contém espaços!
                              </p>
                              <button
                                type="button"
                                onClick={handleRemovePassSpaces}
                                className="text-[9px] bg-amber-500 text-[#231d0f] font-black uppercase px-2 py-0.5 rounded-md hover:bg-amber-400 transition-colors cursor-pointer"
                              >
                                Limpar Espaços
                              </button>
                            </div>
                          )}
                          
                          {smtpData.pass && (
                            <p className={cn(
                              "text-[10px] font-bold flex items-center gap-1",
                              rtSmtpAnalysis.passCheck === 'valid_gmail_app' ? "text-emerald-500" :
                              rtSmtpAnalysis.passCheck === 'invalid_gmail_app' ? "text-amber-500" : "text-slate-400"
                            )}>
                              {rtSmtpAnalysis.passCheck === 'valid_gmail_app' ? <Check className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                              {rtSmtpAnalysis.passMessage}
                            </p>
                          )}
                          
                          {rtSmtpAnalysis.isGmail && rtSmtpAnalysis.passCheck === 'invalid_gmail_app' && (
                            <button
                              type="button"
                              onClick={() => setShowSMTPHelp(true)}
                              className="text-[10px] text-[#fdb612] font-black hover:underline flex items-center gap-1 border-none bg-transparent p-0 cursor-pointer"
                            >
                              <HelpCircle className="w-3 h-3" /> Passos para obter Senha de App Gmail
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">E-mail de Remetente (Opcional)</label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input 
                            type="email" 
                            value={smtpData.from || ''}
                            onChange={(e) => setSmtpData({ ...smtpData, from: e.target.value })}
                            placeholder="noreply@empresa.com"
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612] transition-all font-bold text-sm"
                          />
                        </div>
                        <p className="text-[9px] text-slate-400 font-medium italic">Se vazio, o e-mail cadastrado em "Usuário" será usado como remetente.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Assistente de Conexão Inteligente */}
                  <div className="p-6 bg-[#231d0f] rounded-3xl border border-[#fdb612]/20 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#fdb612] opacity-5 rounded-full -mr-16 -mt-16 transition-all group-hover:scale-150" />
                    
                    <div className="flex items-center justify-between mb-4 relative z-10">
                      <h5 className="text-[10px] font-black uppercase tracking-widest text-[#fdb612] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#fdb612] animate-pulse" />
                        Assistente Virtual SMTP
                      </h5>
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 uppercase">
                        Real-Time
                      </span>
                    </div>

                    <div className="space-y-4 relative z-10">
                      {/* Real-time checklist */}
                      <div className="bg-white/5 p-4 rounded-2xl space-y-3 border border-white/10">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-sans">Análise Automática das Credenciais</p>
                        
                        <div className="space-y-2 font-mono text-xs">
                          {/* Host */}
                          <div className="flex items-center justify-between">
                            <span className="text-slate-300">1. Servidor Host:</span>
                            {rtSmtpAnalysis.isHostValid ? (
                              <span className="text-emerald-400 font-bold flex items-center gap-1">
                                <Check className="w-3 h-3" /> Correto
                              </span>
                            ) : (
                              <span className="text-amber-400 font-semibold flex items-center gap-1">
                                Digitando host...
                              </span>
                            )}
                          </div>

                          {/* Email */}
                          <div className="flex items-center justify-between">
                            <span className="text-slate-300">2. E-mail de Login:</span>
                            {rtSmtpAnalysis.isUserValid ? (
                              <span className="text-emerald-400 font-bold flex items-center gap-1">
                                <Check className="w-3 h-3" /> Válido
                              </span>
                            ) : (
                              <span className="text-amber-400 font-semibold flex items-center gap-1">
                                Pendente
                              </span>
                            )}
                          </div>

                          {/* Password */}
                          <div className="flex items-center justify-between">
                            <span className="text-slate-300">3. Formato da Senha:</span>
                            {smtpData.pass ? (
                              rtSmtpAnalysis.isGmail ? (
                                rtSmtpAnalysis.passCheck === 'valid_gmail_app' ? (
                                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                                    <Check className="w-3 h-3" /> Gmail Ok (16 d)
                                  </span>
                                ) : (
                                  <span className="text-amber-400 font-bold flex items-center gap-1">
                                    Requer 16g
                                  </span>
                                )
                              ) : (
                                <span className="text-emerald-400 font-bold flex items-center gap-1">
                                  <Check className="w-3 h-3" /> Preenchida
                                </span>
                              )
                            ) : (
                              <span className="text-amber-400 font-semibold">Vazia</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Diagnostic Active State UI */}
                      {smtpDiagnosticStep !== 'idle' && (
                        <div className={cn(
                          "p-4 rounded-xl text-xs space-y-2 border transition-all duration-300",
                          smtpDiagnosticStep === 'success' && "bg-emerald-500/10 border-emerald-500/30 text-emerald-200",
                          smtpDiagnosticStep === 'failed' && "bg-rose-500/10 border-rose-500/30 text-rose-200",
                          (smtpDiagnosticStep === 'host_check' || smtpDiagnosticStep === 'credentials_format' || smtpDiagnosticStep === 'testing_server') && "bg-blue-500/10 border-blue-500/30 text-blue-200 animate-pulse"
                        )}>
                          <div className="flex items-center gap-2 font-black uppercase tracking-widest text-[10px]">
                            {smtpDiagnosticStep === 'success' && <Check className="w-4 h-4 text-emerald-400" />}
                            {smtpDiagnosticStep === 'failed' && <AlertTriangle className="w-4 h-4 text-rose-400" />}
                            {(smtpDiagnosticStep === 'host_check' || smtpDiagnosticStep === 'credentials_format' || smtpDiagnosticStep === 'testing_server') && (
                              <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
                            )}
                            <span>status dos testes</span>
                          </div>
                          
                          <p className="leading-relaxed text-slate-300 text-[11px] font-medium">
                            {smtpDiagnosticsMessage}
                          </p>

                          {smtpDiagnosticStep === 'failed' && smtpDiagnosticsErrorType === 'gmail_password_format' && (
                            <div className="pt-2">
                              <p className="text-[10px] text-amber-300 font-semibold leading-relaxed">💡 O Gmail rejeitou o formato da senha de aplicativo. Ela deve ter de forma absoluta 16 letras, sem espaços.</p>
                              <button
                                type="button"
                                onClick={() => setShowSMTPHelp(true)}
                                className="mt-2 w-full py-2 bg-[#fdb612] text-[#231d0f] rounded-lg font-black uppercase tracking-wider text-[10px] hover:bg-amber-400 transition-colors cursor-pointer border-none"
                              >
                                Ver Guia Completo Gmail
                              </button>
                            </div>
                          )}

                          {smtpDiagnosticStep === 'failed' && smtpDiagnosticsErrorType === 'gmail_wrong_pass' && (
                            <div className="pt-2">
                              <p className="text-[10px] text-amber-300 font-semibold leading-relaxed">💡 Falha de Autenticação (Gmail 535). Lembre-se que você DEVE ativar a segurança de Verificação de Duas Etapas na conta Google de antemão e obter a Senha de App. A sua senha comum de login não funcionará jamais.</p>
                              <button
                                type="button"
                                onClick={() => setShowSMTPHelp(true)}
                                className="mt-2 w-full py-2 bg-[#fdb612] text-[#231d0f] rounded-lg font-black uppercase tracking-wider text-[10px] hover:bg-amber-400 transition-colors cursor-pointer border-none"
                              >
                                Como Resolver no Gmail
                              </button>
                            </div>
                          )}

                          {smtpDiagnosticStep === 'failed' && smtpDiagnosticsErrorType === 'network' && (
                            <p className="text-[10px] text-slate-400 italic">Dica: Verifique se digitou o Host SMTP sem erros de digitação e se a porta correspondente está correta (587 ou 465).</p>
                          )}
                        </div>
                      )}

                      {/* Help Alert for Gmail natively */}
                      {rtSmtpAnalysis.isGmail && smtpDiagnosticStep === 'idle' && (
                        <div className="flex gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                          <div className="size-8 rounded-lg bg-[#fdb612]/10 flex items-center justify-center text-[#fdb612] shrink-0">
                            <AlertCircle className="w-4 h-4" />
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed font-medium">
                            <strong>Aviso Gmail:</strong> O Google proíbe autenticação direta por senha comum. Você precisa de uma <strong>Senha de App</strong> de 16 dígitos exclusiva da conta Google.
                          </p>
                        </div>
                      )}

                      <div className="pt-2 border-t border-white/10 space-y-3">
                        <button 
                          onClick={handleSaveSMTP}
                          className="w-full py-4 bg-[#fdb612] text-[#231d0f] rounded-2xl text-xs font-black uppercase tracking-widest hover:shadow-xl hover:shadow-[#fdb612]/30 transition-all active:scale-[0.98] cursor-pointer border-none"
                        >
                          Salvar Configurações
                        </button>
                        <button 
                          onClick={handleSaveSMTP}
                          disabled={smtpDiagnosticStep === 'host_check' || smtpDiagnosticStep === 'credentials_format' || smtpDiagnosticStep === 'testing_server'}
                          className="w-full py-3 bg-white/5 border border-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {(smtpDiagnosticStep === 'host_check' || smtpDiagnosticStep === 'credentials_format' || smtpDiagnosticStep === 'testing_server') ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#fdb612]" />
                              Diagnosticando...
                            </>
                          ) : (
                            'Validar e Diagnosticar'
                          )}
                        </button>
                        
                        {smtpDiagnosticStep !== 'idle' && (
                          <button
                            onClick={() => {
                              setSmtpDiagnosticStep('idle');
                              setSmtpDiagnosticsMessage('');
                              setSmtpDiagnosticsErrorType('none');
                            }}
                            className="w-full py-1 text-[9px] font-bold text-slate-400 hover:text-slate-200 transition-colors uppercase tracking-widest border-none bg-transparent cursor-pointer"
                          >
                            Limpar Diagnósticos
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-5 bg-blue-50 dark:bg-blue-500/5 rounded-2xl border border-blue-100 dark:border-blue-900/30 flex gap-4">
                    <LifeBuoy className="w-5 h-5 text-blue-500 shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">Servidores Comuns</p>
                      <p className="text-[9px] text-slate-500 leading-relaxed">
                        <strong>Outlook:</strong> smtp-mail.outlook.com (Porta 587)<br/>
                        <strong>Yahoo:</strong> smtp.mail.yahoo.com (Porta 465)<br/>
                        <strong>Locaweb:</strong> smtp.email-ssl.com.br (Porta 465)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Email Templates UI */}
              <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-800">
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">Modelos de E-mail (Transacional)</h3>
                <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-6">
                  
                  {/* Proposal Email Template */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-500" />
                      Envio de Proposta
                    </h4>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Assunto do E-mail</label>
                      <input 
                        type="text" 
                        value={emailTemplates.proposalSubject}
                        onChange={(e) => setEmailTemplates(prev => ({ ...prev, proposalSubject: e.target.value }))}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612] transition-all font-bold text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Corpo do E-mail</label>
                      <textarea 
                        rows={4}
                        value={emailTemplates.proposalBody}
                        onChange={(e) => setEmailTemplates(prev => ({ ...prev, proposalBody: e.target.value }))}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612] transition-all font-medium text-sm resize-none"
                      />
                      <p className="text-[9px] text-slate-400 italic">Dica: Use [NOME] para injetar o nome do cliente automaticamente.</p>
                    </div>
                  </div>

                  {/* Welcome Alert Template */}
                  <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      Novo Lead / Boas-vindas
                    </h4>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Assunto do E-mail</label>
                      <input 
                        type="text" 
                        value={emailTemplates.welcomeSubject}
                        onChange={(e) => setEmailTemplates(prev => ({ ...prev, welcomeSubject: e.target.value }))}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612] transition-all font-bold text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Corpo do E-mail</label>
                      <textarea 
                        rows={4}
                        value={emailTemplates.welcomeBody}
                        onChange={(e) => setEmailTemplates(prev => ({ ...prev, welcomeBody: e.target.value }))}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612] transition-all font-medium text-sm resize-none"
                      />
                      <p className="text-[9px] text-slate-400 italic">Dica: Use [NOME] para injetar o nome do lead.</p>
                    </div>
                  </div>

                  {/* Installation Alert Template */}
                  <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Rocket className="w-4 h-4 text-blue-500" />
                      Agendamento de Vistoria
                    </h4>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Assunto do E-mail</label>
                      <input 
                        type="text" 
                        value={emailTemplates.installationSubject}
                        onChange={(e) => setEmailTemplates(prev => ({ ...prev, installationSubject: e.target.value }))}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612] transition-all font-bold text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Corpo do E-mail</label>
                      <textarea 
                        rows={4}
                        value={emailTemplates.installationBody}
                        onChange={(e) => setEmailTemplates(prev => ({ ...prev, installationBody: e.target.value }))}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612] transition-all font-medium text-sm resize-none"
                      />
                      <p className="text-[9px] text-slate-400 italic">Dica: Use [NOME] para o cliente. Use [DATA] e [HORA] para os momentos sugeridos.</p>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button 
                      onClick={handleSaveSMTP}
                      className="px-6 py-3 bg-[#fdb612] text-[#231d0f] rounded-xl text-xs font-black uppercase tracking-widest hover:shadow-xl hover:shadow-[#fdb612]/30 transition-all active:scale-[0.98] border-none"
                    >
                      Salvar Modelos
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'support' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center gap-4">
                  <div className="size-16 rounded-2xl bg-[#fdb612]/10 flex items-center justify-center text-[#fdb612]">
                    <MessageSquare className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">Chat em Tempo Real</h4>
                    <p className="text-sm text-slate-500 mt-2">Fale agora mesmo com um de nossos especialistas.</p>
                  </div>
                  <button className="mt-4 w-full py-3 bg-[#fdb612] text-[#231d0f] rounded-xl text-xs font-black uppercase tracking-widest hover:shadow-lg hover:shadow-[#fdb612]/20 transition-all">
                    Iniciar Chat
                  </button>
                </div>

                <div className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center gap-4">
                  <div className="size-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">Abrir Ticket</h4>
                    <p className="text-sm text-slate-500 mt-2">Envie sua dúvida ou problema e responderemos por e-mail.</p>
                  </div>
                  <button className="mt-4 w-full py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:shadow-lg hover:shadow-blue-600/20 transition-all">
                    Novo Ticket
                  </button>
                </div>
              </div>

              <div className="p-6 bg-[#231d0f] text-white rounded-3xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-xl bg-white/10 flex items-center justify-center text-[#fdb612]">
                    <HelpCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-widest">Central de Ajuda</h4>
                    <p className="text-xs text-slate-400">Consulte nossos tutoriais e documentação completa.</p>
                  </div>
                </div>
                <a 
                  href="https://vieiras-solar.help" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-6 py-2 border border-white/20 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-white/5 transition-all inline-block"
                >
                  Acessar
                </a>
              </div>
            </div>
          )}

          <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-4">
            <button 
              onClick={handleCancel}
              className="px-6 py-3 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-colors flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancelar
            </button>
            <button 
              onClick={handleSave}
              className="px-8 py-3 bg-[#fdb612] text-[#231d0f] rounded-xl text-sm font-black uppercase tracking-widest flex items-center gap-2 hover:shadow-lg hover:shadow-[#fdb612]/20 transition-all active:scale-[0.98]"
            >
              <Save className="w-4 h-4" />
              Salvar Alterações
            </button>
          </div>
        </div>
      </div>
      <SMTPHelpModal isOpen={showSMTPHelp} onClose={() => setShowSMTPHelp(false)} />
    </div>
  );
};
