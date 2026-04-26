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
  X
} from 'lucide-react';
import { cn } from '../lib/utils';

import { User as UserType, CompanySettings } from '../types';
import { updateDocument, getDocument, setDocument } from '../firestoreUtils';

interface SettingsViewProps {
  user: UserType | null;
  onUpdateUser: (user: UserType) => void;
  onLogout?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ user, onUpdateUser, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'company' | 'financial' | 'system' | 'integrations' | 'support'>('profile');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    whatsapp: true
  });

  const [companySettings, setCompanySettings] = useState<Partial<CompanySettings>>({
    companyName: "Vieira's Solar & Engenharia",
    cnpj: "54.123.456/0001-99", // Placeholder cnpj for solar company
    address: "Rua das Paineiras, 123 - Centro, Montes Claros - MG",
    email: "contato@vieirassolar.com.br",
    contactEmail: "suporte@vieirassolar.com.br",
    phone: "(38) 3221-0000",
    monthlyInvoice: 0
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
        address: profile.address
      };

      await updateDocument('users', user.id, updatedUser);
      onUpdateUser(updatedUser);

      // Save Company Settings
      await setDocument('settings', 'company', {
        ...companySettings,
        updatedAt: new Date().toISOString()
      });

      showToast('Configurações salvas com sucesso!');
      setSecurityData({ newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast('Erro ao salvar configurações.');
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

  const handleSendTestEmail = async () => {
    try {
      const res = await fetch('/api/smtp/test');
      const data = await res.json();
      if (data.success) {
        showToast(`Conexão SMTP verificada com sucesso! Suas credenciais estão corretas.`);
      } else {
        showToast(`Erro SMTP: ${data.message || 'Verifique as variáveis'}`);
      }
    } catch (e) {
      showToast('Erro ao conectar com o servidor para testar SMTP.');
    }
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
      role: newRole,
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
    fetchCompanySettings();
  }, []);

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
                    <HelpCircle className="w-3 h-3 text-slate-400 cursor-help" title="Seu nome completo para exibição em documentos" />
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
                    <HelpCircle className="w-3 h-3 text-slate-400 cursor-help" title="E-mail principal para login e notificações" />
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
                    <HelpCircle className="w-3 h-3 text-slate-400 cursor-help" title="Sua função na empresa (ex: Vendedor, Adm)" />
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
                    <HelpCircle className="w-3 h-3 text-slate-400 cursor-help" title="CNPJ da empresa para emissão de notas" />
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
              <div className="p-6 bg-blue-50 dark:bg-blue-500/10 rounded-2xl border border-blue-100 dark:border-blue-800">
                <div className="flex gap-4">
                  <div className="size-10 rounded-xl bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">Configuração de E-mail (Gmail)</h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Para enviar propostas diretamente do sistema, você deve configurar as variáveis de ambiente no painel do AI Studio. 
                      Como você está usando Gmail, é <strong>obrigatório</strong> o uso de uma Senha de App.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Passo a Passo</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-black text-[#fdb612]">01</span>
                      <p className="text-xs font-bold mt-1">Gere a Senha de App no Google (16 dígitos)</p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-black text-[#fdb612]">02</span>
                      <p className="text-xs font-bold mt-1">No AI Studio, clique na Engrenagem no TOPO DIREITO (ao lado do botão 'Publish')</p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-black text-[#fdb612]">03</span>
                      <p className="text-xs font-bold mt-1">Vá na aba "Environment Variables" ou "Secrets"</p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-black text-[#fdb612]">04</span>
                      <p className="text-xs font-bold mt-1">Adicione EXATAMENTE as nomes SMTP_USER e SMTP_PASS (Maiúsculas)</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Variáveis Necessárias</h5>
                  <div className="space-y-2">
                    {[
                      { key: 'SMTP_USER', value: 'marusansp@gmail.com', desc: 'Seu e-mail do Gmail' },
                      { key: 'SMTP_PASS', value: 'nbphuvclyuynrqvr', desc: 'Sua Senha de App (sem espaços)' },
                      { key: 'SMTP_HOST', value: 'smtp.gmail.com', desc: 'Host do servidor' },
                      { key: 'SMTP_PORT', value: '587', desc: 'Porta padrão' },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-xl group hover:border-[#fdb612]/30 transition-all">
                        <div>
                          <code className="text-[10px] font-black text-[#0055A4] dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded uppercase">{item.key}</code>
                          <p className="text-xs font-medium text-slate-500 mt-1">{item.desc}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <code className="text-xs font-bold text-slate-900 dark:text-slate-100">{item.value}</code>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(item.value);
                              showToast(`${item.key} copiado!`);
                            }}
                            className="p-2 text-slate-400 hover:text-[#fdb612] transition-colors"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
                <button 
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/smtp/test');
                      const data = await res.json();
                      if (data.success) {
                        showToast('✅ CONEXÃO SMTP OK! Suas credenciais funcionam.');
                      } else {
                        showToast(`❌ ERRO: ${data.message}`);
                        console.error('SMTP Error:', data.error);
                      }
                    } catch (e) {
                      showToast('❌ Erro de Rede ao testar.');
                    }
                  }}
                  className="w-full py-4 bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
                >
                  Testar Conexão Agora
                </button>
                <p className="text-[10px] text-center text-slate-500">
                  Certifique-se de salvar as variáveis no ícone de <strong>Engrenagem no Topo Direito</strong> do editor.
                </p>
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
    </div>
  );
};
