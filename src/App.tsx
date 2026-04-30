import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { LeadsView } from './components/LeadsView';
import { InstallationsView } from './components/InstallationsView';
import { TeamView } from './components/TeamView';
import { SalesView } from './components/SalesView';
import { NewProjectModal } from './components/NewProjectModal';
import { NewLeadModal } from './components/NewLeadModal';
import { ProposalsView } from './components/ProposalsView';
import { SettingsView } from './components/SettingsView';
import { PartnersView } from './components/PartnersView';
import { CollaboratorsView } from './components/CollaboratorsView';
import { KitsView } from './components/KitsView';
import { FinanceView } from './components/FinanceView';
import { ClientsView } from './components/ClientsView';
import { ReportsView } from './components/ReportsView';
import { UsersView } from './components/UsersView';
import { GalleryView } from './components/GalleryView';
import { LoginView } from './components/LoginView';
import { View, Project, Lead, User, Proposal, Partner, Collaborator, Kit, Installation, Client } from './types';
import { Sun, Moon, Menu, X, Bell, ShieldAlert, LogOut, Loader2, Search } from 'lucide-react';
import { cn, parseDate } from './lib/utils';
import { NotificationCenter } from './components/NotificationCenter';
import { GlobalSearch } from './components/GlobalSearch';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { syncCollection, createDocument, updateDocument, deleteDocument, setDocument, getDocument } from './firestoreUtils';

import { ToastProvider } from './context/ToastContext';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Installation | null>(null);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [proposalPreFill, setProposalPreFill] = useState<Partial<Proposal> | null>(null);
  const [installationPreFill, setInstallationPreFill] = useState<any | null>(null);

  useEffect(() => {
    const fetchLogo = async () => {
      const settings = await getDocument<any>('settings', 'company');
      if (settings?.logo) {
        setCompanyLogo(settings.logo);
      }
    };
    fetchLogo();
  }, []);
  const [installations, setInstallations] = useState<any[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [kits, setKits] = useState<Kit[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // ...
        let userProfile = await getDocument<User>('users', firebaseUser.uid);
        const isOwner = firebaseUser.email === 'marusansp@gmail.com';
        
        if (!userProfile) {
          // Create initial profile
          const newUser: User = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuário',
            email: firebaseUser.email || '',
            role: (firebaseUser.email?.includes('admin') || isOwner) ? 'admin' : 'sales',
            avatar: firebaseUser.photoURL || undefined,
            status: isOwner ? 'active' : 'pending',
            createdAt: new Date().toISOString()
          };
          await setDocument('users', firebaseUser.uid, newUser);
          userProfile = newUser;
        } else if (isOwner && userProfile.status !== 'active') {
          // Ensure owner is always active
          const updatedProfile = { ...userProfile, status: 'active' as const, role: 'admin' as const };
          await updateDocument('users', firebaseUser.uid, { status: 'active', role: 'admin' });
          userProfile = updatedProfile;
        }
        
        setUser(userProfile);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      setIsAuthReady(true);
    });

    // Timeout safety fallback
    const timer = setTimeout(() => {
      setIsAuthReady(true);
    }, 5000);

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const isSales = user.role === 'sales';
    // Use stable values for sync dependencies
    const userEmail = user.email;
    
    const unsubscribeLeads = syncCollection<Lead>('leads', setLeads, 'createdAt');
    const unsubscribeProposals = syncCollection<Proposal>(
      'proposals', 
      setProposals, 
      'date',
      isSales ? [{ field: 'representativeEmail', operator: '==', value: userEmail }] : undefined
    );
    const unsubscribeInstallations = syncCollection<any>('installations', setInstallations, 'lastUpdated');
    const unsubscribePartners = syncCollection<Partner>('partners', setPartners, 'createdAt');
    const unsubscribeCollaborators = syncCollection<Collaborator>('collaborators', setCollaborators, 'createdAt');
    const unsubscribeKits = syncCollection<Kit>('kits', setKits, 'createdAt');
    const unsubscribeClients = syncCollection<Client>('clients', setClients, 'createdAt');
    
    return () => {
      unsubscribeLeads();
      unsubscribeProposals();
      unsubscribeInstallations();
      unsubscribePartners();
      unsubscribeCollaborators();
      unsubscribeKits();
      unsubscribeClients();
    };
  }, [isAuthenticated, user?.id, user?.role, user?.email]);

  const handleLogin = async (email: string) => {
    if (email === 'convidado@exemplo.com') {
      const guestUser: User = {
        id: 'guest-id',
        name: 'Convidado (Teste)',
        email: 'convidado@exemplo.com',
        role: 'admin'
      };
      setUser(guestUser);
      setIsAuthenticated(true);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setCurrentView('dashboard');
  };

  const handleInstallationAdd = async (installation: any) => {
    await createDocument('installations', installation);
  };

  const addLead = async (lead: Lead) => {
    await createDocument('leads', {
      ...lead,
      representative: user?.name || 'Sistema'
    });
  };

  const handleConvertToClient = async (lead: Lead) => {
    // 1. Create client data from lead
    const clientData: Partial<Client> = {
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      address: lead.address || (lead as any).endereco,
      cnpj: lead.cpfCnpj?.length > 14 ? lead.cpfCnpj : undefined,
      cpf: lead.cpfCnpj?.length <= 14 ? lead.cpfCnpj : undefined,
      status: 'active',
      type: 'residential', // Default or guess
      ucNumber: lead.ucNumber,
      cep: lead.cep,
      createdAt: new Date().toISOString(),
      interactions: [
        {
          id: Math.random().toString(36).substr(2, 9),
          type: 'proposal',
          title: 'Lead Convertido em Cliente',
          description: 'Este cliente foi criado a partir da conversão de um lead.',
          date: new Date().toISOString(),
          timestamp: Date.now(),
          status: 'Convertido'
        },
        ...(lead.history || []).map(h => ({
          id: Math.random().toString(36).substr(2, 9),
          type: 'proposal' as const,
          title: `Histórico do Lead: ${h.action}`,
          description: h.action,
          date: h.date ? parseDate(h.date).toISOString() : new Date().toISOString(),
          timestamp: Date.now(),
          status: 'Histórico'
        }))
      ],
      auditLogs: [
        {
          id: Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toISOString(),
          action: 'Conversão de Lead para Cliente',
          userId: user?.id || 'system',
          userName: user?.name || 'Sistema',
          changes: [
            { field: 'origin', oldValue: null, newValue: `Lead ID: ${lead.id}` }
          ]
        }
      ]
    };

    // 2. Add to clients
    await addClient(clientData);

    // 3. Update lead status to closed
    await updateLead({
      ...lead,
      status: 'closed',
      history: [
        {
          date: new Date().toLocaleString('pt-BR'),
          action: 'Lead convertido em cliente',
          user: user?.name || 'Sistema'
        },
        ...(lead.history || [])
      ]
    });

    setCurrentView('clients');
  };

  const deleteLead = async (id: string) => {
    await deleteDocument('leads', id);
  };

  const updateLead = async (updatedLead: Lead) => {
    const { id, ...data } = updatedLead;
    await updateDocument('leads', id, data);
  };

  const updateInstallation = async (id: string, data: any) => {
    await updateDocument('installations', id, data);
  };

  const deleteInstallation = async (id: string) => {
    await deleteDocument('installations', id);
  };

  const addClient = async (clientData: Partial<Client>) => {
    const newClient = {
      ...clientData,
      createdAt: new Date().toISOString(),
      projects: [],
      status: clientData.status || 'active'
    };
    await createDocument('clients', newClient);
  };

  const updateClient = async (id: string, clientData: Partial<Client>) => {
    await updateDocument('clients', id, clientData);
  };

  const deleteClient = async (id: string) => {
    await deleteDocument('clients', id);
  };

  const canAccess = (view: View) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    
    const permissions: Record<string, string[]> = {
      sales: ['dashboard', 'leads', 'sales', 'proposals', 'clients', 'reports'],
      engineer: ['dashboard', 'installations', 'clients'],
      installer: ['dashboard', 'installations'],
      finance: ['dashboard', 'finance', 'proposals', 'clients', 'reports'],
      admin_staff: ['dashboard', 'leads', 'installations', 'team', 'users', 'sales', 'proposals', 'settings', 'partners', 'collaborators', 'kits', 'finance', 'clients', 'reports']
    };

    return permissions[user.role]?.includes(view) || false;
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-[#f8f7f5] dark:bg-[#231d0f] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-[#fdb612] animate-spin mx-auto" />
          <p className="text-slate-500 font-bold animate-pulse">Carregando Vieira's Solar...</p>
        </div>
      </div>
    );
  }

  const handleOpenProposalsWithPreFill = (data: Partial<Proposal>) => {
    setProposalPreFill(data);
    setCurrentView('proposals');
  };

  const handleConvertToInstallation = (proposal: Proposal) => {
    // Determine type from systemSize or notes if possible, fallback to residence
    const type = proposal.systemSize.toLowerCase().includes('ind') ? 'industrial' : 'residence';
    
    const preFilledProject = {
      name: `Instalação - ${proposal.client}`,
      projectId: proposal.proposalNumber || proposal.id,
      stage: 'Projeto / Engenharia',
      type: type,
      progress: 0,
      address: proposal.endereco || '',
      lastUpdated: new Date().toISOString(),
      stages: [
        { name: 'Projeto / Engenharia', status: 'in-progress' },
        { name: 'Vistoria Técnica', status: 'pending' },
        { name: 'Homologação', status: 'pending' },
        { name: 'Instalação', status: 'pending' },
        { name: 'Conectorização', status: 'pending' },
        { name: 'Entrega / Finalização', status: 'pending' }
      ]
    };
    
    setEditingProject(preFilledProject as any);
    setIsProjectModalOpen(true);
    // Optionally stay on current view or move to installations
    // setCurrentView('installations');
  };

  if (!isAuthenticated) {
    return <LoginView onLogin={handleLogin} />;
  }

  if (user?.status !== 'active') {
    return (
      <div className="min-h-screen bg-[#f8f7f5] dark:bg-[#231d0f] flex flex-col items-center justify-center p-8">
        <div className="max-w-md w-full bg-white dark:bg-[#231d0f]/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 shadow-2xl text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-[#fdb612] animate-pulse" />
          
          <div className="size-20 bg-[#fdb612]/10 rounded-full flex items-center justify-center mx-auto text-[#fdb612]">
            <ShieldAlert className="w-10 h-10" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">
              Acesso em Análise
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              Sua conta foi criada, mas para garantir a segurança dos dados da <strong>Vieira's Solar</strong>, 
              um administrador precisa autorizar seu perfil.
            </p>
          </div>

          <div className="p-5 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-slate-800 text-left space-y-3">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Identificação</p>
              <p className="font-bold text-sm text-slate-700 dark:text-slate-200">{user?.email}</p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Status Atual</p>
                <p className="text-xs font-bold text-amber-500 uppercase tracking-widest">
                  {user?.status === 'pending' ? 'Aguardando Aprovação' : 'Inativo'}
                </p>
              </div>
              <div className="size-2 bg-amber-500 rounded-full animate-ping" />
            </div>
          </div>

          <div className="space-y-4">
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-[#fdb612] text-[#231d0f] rounded-xl font-bold hover:shadow-lg hover:shadow-[#fdb612]/20 transition-all flex items-center justify-center gap-2"
            >
              <Loader2 className="w-5 h-5 animate-spin" />
              Verificar Novamente
            </button>
            <button 
              onClick={handleLogout}
              className="w-full py-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sair e entrar com outra conta
            </button>
          </div>

          <p className="text-[10px] text-slate-400 font-medium">
            Se você é o administrador, verifique a aba de Gestão de Acessos para liberar este e-mail.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-[#f8f7f5] dark:bg-[#231d0f] text-slate-900 dark:text-slate-100">
        {/* Mobile Search Modal */}
        {isMobileSearchOpen && (
          <div className="fixed inset-0 z-[200] bg-white dark:bg-[#231d0f] p-4 flex flex-col items-center animate-in fade-in slide-in-from-top duration-300">
            <div className="w-full flex items-center justify-between mb-6">
              <span className="font-black text-lg uppercase tracking-widest text-[#fdb612]">Sua Busca</span>
              <button 
                onClick={() => setIsMobileSearchOpen(false)} 
                className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors"
                aria-label="Fechar busca"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="w-full">
              <GlobalSearch 
                clients={clients}
                proposals={proposals}
                installations={installations}
                onResultClick={(view, id) => {
                  setCurrentView(view);
                  setIsMobileSearchOpen(false);
                }}
              />
            </div>
          </div>
        )}
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <div className={cn(
          "fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 lg:relative lg:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <Sidebar 
            currentView={currentView} 
            onViewChange={(view) => {
              setCurrentView(view);
              setIsSidebarOpen(false);
            }} 
            onLogout={handleLogout}
            user={user}
            companyLogo={companyLogo}
            isDarkMode={isDarkMode}
            toggleTheme={() => setIsDarkMode(!isDarkMode)}
          />
        </div>
        
        <main className="flex-1 min-w-0 overflow-y-auto">
          {/* Mobile Header */}
          <header className="lg:hidden flex items-center justify-between p-4 border-b border-[#fdb612]/10 bg-white dark:bg-[#231d0f] sticky top-0 z-30">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                aria-label="Menu"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="h-8 w-8 bg-[#fdb612] rounded flex items-center justify-center ml-1">
                <Sun className="text-[#231d0f] w-5 h-5" />
              </div>
              <span className="font-bold text-sm">Vieira's Solar</span>
            </div>
            <div className="flex items-center gap-2">
              <NotificationCenter proposals={proposals} />
              <button 
                onClick={() => setIsMobileSearchOpen(true)}
                className="p-2 text-slate-400 hover:text-[#fdb612] transition-colors"
                aria-label="Abrir busca"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
          </header>

          {/* Desktop Header */}
          <header className="hidden lg:flex items-center justify-between px-8 py-4 bg-white/50 dark:bg-[#231d0f]/50 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
            <div className="flex-1 max-w-xl">
              <GlobalSearch 
                clients={clients}
                proposals={proposals}
                installations={installations}
                onResultClick={(view, id) => {
                  setCurrentView(view);
                  // Optional: handle scrolling or opening details modal
                }}
              />
            </div>

            <div className="flex items-center gap-6">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 text-slate-400 hover:text-[#fdb612] transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-white/5"
                title={isDarkMode ? "Modo Claro" : "Modo Escuro"}
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <NotificationCenter proposals={proposals} />
              <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-black text-slate-900 dark:text-slate-100 capitalize">{user?.role}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user?.email}</p>
                </div>
                <div className="size-10 rounded-full bg-[#fdb612] flex items-center justify-center text-[#231d0f] font-black mr-2">
                  {user?.email.charAt(0).toUpperCase()}
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-rose-500 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 flex items-center gap-2"
                  title="Sair"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-widest hidden xl:inline">Sair</span>
                </button>
              </div>
            </div>
          </header>

          <div className="max-w-7xl mx-auto p-4 md:p-8 w-full">
            {!canAccess(currentView) ? (
              <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
                <ShieldAlert className="w-16 h-16 mb-4 text-red-500/50" />
                <p className="text-xl font-bold">Acesso Restrito</p>
                <p className="text-sm">Você não tem permissão para acessar esta área.</p>
                <button 
                  onClick={() => setCurrentView('dashboard')}
                  className="mt-6 px-6 py-2 bg-[#fdb612] text-[#231d0f] rounded-xl font-bold"
                >
                  Voltar ao Painel
                </button>
              </div>
            ) : (
              <>
                {currentView === 'dashboard' && (
                  <DashboardView 
                    installations={installations} 
                    leads={leads}
                    proposals={proposals}
                    user={user}
                    isDarkMode={isDarkMode}
                    onOpenNewProject={() => setIsProjectModalOpen(true)} 
                    onManageProjects={() => setCurrentView('installations')}
                    onAddCollaborator={() => setCurrentView('collaborators')}
                    onGoToLeads={() => setCurrentView('leads')}
                  />
                )}
                {currentView === 'leads' && (
                  <LeadsView 
                    leads={leads} 
                    onOpenNewLead={() => setIsLeadModalOpen(true)} 
                    onDeleteLead={deleteLead}
                    onUpdateLead={updateLead}
                    onAddLead={addLead}
                    onLogout={handleLogout}
                    onConvertToClient={handleConvertToClient}
                    onCreateProposal={(lead) => {
                      handleOpenProposalsWithPreFill({
                        client: lead.name,
                        email: lead.email,
                        value: typeof lead.value === 'string' ? parseFloat(lead.value.replace(/[^\d,]/g, '').replace(',', '.')) : lead.value,
                        systemSize: lead.systemSize,
                        titular: lead.name,
                        cpfCnpj: lead.cpfCnpj,
                        endereco: lead.address,
                        cep: lead.cep,
                        ucNumber: lead.ucNumber,
                        telefone: lead.phone
                      });
                    }}
                  />
                )}
                {currentView === 'installations' && (
                  <InstallationsView 
                    installations={installations}
                    onOpenNewProject={() => {
                      setEditingProject(null);
                      setIsProjectModalOpen(true);
                    }} 
                    onEditProject={(project) => {
                      setEditingProject(project);
                      setIsProjectModalOpen(true);
                    }}
                    onUpdateInstallation={updateInstallation}
                    onDeleteInstallation={deleteInstallation}
                  />
                )}
                {currentView === 'team' && <TeamView />}
                {currentView === 'users' && <UsersView />}
                {currentView === 'sales' && <SalesView proposals={proposals} />}
                {currentView === 'proposals' && (
                  <ProposalsView 
                    proposals={proposals} 
                    user={user} 
                    kits={kits} 
                    leads={leads} 
                    clients={clients} 
                    preFill={proposalPreFill}
                    isDarkMode={isDarkMode}
                    onPreFillComplete={() => setProposalPreFill(null)}
                    onConvertToInstallation={handleConvertToInstallation}
                  />
                )}
                {currentView === 'settings' && <SettingsView user={user} onUpdateUser={setUser} onLogout={handleLogout} />}
                {currentView === 'partners' && <PartnersView partners={partners} />}
                {currentView === 'collaborators' && <CollaboratorsView collaborators={collaborators} />}
                {currentView === 'kits' && <KitsView kits={kits} />}
                {currentView === 'finance' && <FinanceView proposals={proposals} user={user} isDarkMode={isDarkMode} />}
                {currentView === 'reports' && (
                  <ReportsView 
                    proposals={proposals} 
                    installations={installations}
                    leads={leads}
                    clients={clients}
                    isDarkMode={isDarkMode}
                  />
                )}
                {currentView === 'clients' && (
                  <ClientsView 
                    clients={clients} 
                    proposals={proposals} 
                    installations={installations}
                    leads={leads}
                    user={user}
                    onAddClient={addClient}
                    onUpdateClient={updateClient}
                    onDeleteClient={deleteClient}
                    onCreateProposal={(client) => {
                      handleOpenProposalsWithPreFill({
                        client: client.name,
                        email: client.email,
                        value: (client as any).value || 0,
                        systemSize: (client as any).systemSize || '',
                        titular: client.name,
                        cpfCnpj: client.cnpj || client.cpf || '',
                        endereco: client.address,
                        cep: client.cep,
                        ucNumber: client.ucNumber,
                        telefone: client.phone
                      });
                    }}
                  />
                )}
                {currentView === 'gallery' && (
                  <GalleryView user={user} />
                )}
              </>
            )}

            {/* Application Footer */}
            <footer className="mt-20 py-12 border-t border-slate-200 dark:border-slate-800">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-xl bg-[#fdb612]/10 flex items-center justify-center overflow-hidden">
                    {companyLogo ? (
                      <img 
                        src={companyLogo} 
                        alt="Logo" 
                        className="w-full h-full object-contain" 
                        referrerPolicy="no-referrer" 
                        loading="lazy"
                      />
                    ) : (
                      <Sun className="w-6 h-6 text-[#fdb612]" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Vieira's Solar & Engenharia</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Energia Limpa para o seu Futuro</p>
                  </div>
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                  © {new Date().getFullYear()} Vieira's Solar. Todos os direitos reservados.
                </div>
              </div>
            </footer>
          </div>
        </main>

        <NewProjectModal 
          isOpen={isProjectModalOpen} 
          onClose={() => {
            setIsProjectModalOpen(false);
            setEditingProject(null);
          }} 
          onAdd={handleInstallationAdd} 
          installation={editingProject}
        />

        <NewLeadModal 
          isOpen={isLeadModalOpen} 
          onClose={() => setIsLeadModalOpen(false)} 
          onAdd={addLead} 
        />

        <footer className="fixed bottom-0 right-0 p-4 pointer-events-none">
          <div className="flex flex-col items-end gap-1 text-slate-400 text-[10px] bg-white/80 dark:bg-[#231d0f]/80 backdrop-blur-sm px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2">
              <Sun className="w-3 h-3 text-[#fdb612]" />
              <span className="font-bold text-slate-600 dark:text-slate-300">MV ENGENHARIA | CNPJ: 61.950.902/0018-33</span>
            </div>
            <span>VIEIRA'S SOLAR & ENGENHARIA © 2024</span>
          </div>
        </footer>
      </div>
    </ToastProvider>
  );
}
