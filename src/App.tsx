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
import { LoginView } from './components/LoginView';
import { View, Project, Lead, User, Proposal, Partner, Collaborator, Kit, Installation, Client } from './types';
import { Sun, Moon, Menu, X, Bell, ShieldAlert, LogOut, Loader2 } from 'lucide-react';
import { cn } from './lib/utils';
import { NotificationCenter } from './components/NotificationCenter';
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
        // Check if user profile exists in Firestore
        let userProfile = await getDocument<User>('users', firebaseUser.uid);
        
        if (!userProfile) {
          // Create initial profile
          const newUser: User = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuário',
            email: firebaseUser.email || '',
            role: (firebaseUser.email?.includes('admin') || firebaseUser.email === 'marusansp@gmail.com') ? 'admin' : 'sales',
            avatar: firebaseUser.photoURL || undefined
          };
          await setDocument('users', firebaseUser.uid, newUser);
          userProfile = newUser;
        }
        
        setUser(userProfile);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      const unsubscribeLeads = syncCollection<Lead>('leads', setLeads, 'createdAt');
      const unsubscribeProposals = syncCollection<Proposal>('proposals', setProposals, 'date');
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
    }
  }, [isAuthenticated, user]);

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
      sales: ['dashboard', 'leads', 'sales', 'proposals', 'clients'],
      engineer: ['dashboard', 'installations', 'clients'],
      installer: ['dashboard', 'installations'],
      finance: ['dashboard', 'finance', 'proposals', 'clients'],
      admin_staff: ['dashboard', 'leads', 'installations', 'team', 'sales', 'proposals', 'settings', 'partners', 'collaborators', 'kits', 'finance', 'clients']
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

  if (!isAuthenticated) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-[#f8f7f5] dark:bg-[#231d0f] text-slate-900 dark:text-slate-100">
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
          />
        </div>
        
        <main className="flex-1 min-w-0 overflow-y-auto">
          {/* Mobile Header */}
          <header className="lg:hidden flex items-center justify-between p-4 border-b border-[#fdb612]/10 bg-white dark:bg-[#231d0f] sticky top-0 z-30">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-[#fdb612] rounded flex items-center justify-center">
                <Sun className="text-[#231d0f] w-5 h-5" />
              </div>
              <span className="font-bold text-sm">Vieira's Solar</span>
            </div>
            <div className="flex items-center gap-2">
              <NotificationCenter proposals={proposals} />
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </header>

          {/* Desktop Header */}
          <header className="hidden lg:flex items-center justify-end px-8 py-4 bg-white/50 dark:bg-[#231d0f]/50 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
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
                    onOpenNewProject={() => setIsProjectModalOpen(true)} 
                    onManageProjects={() => setCurrentView('installations')}
                  />
                )}
                {currentView === 'leads' && (
                  <LeadsView 
                    leads={leads} 
                    onOpenNewLead={() => setIsLeadModalOpen(true)} 
                    onDeleteLead={deleteLead}
                    onUpdateLead={updateLead}
                    onLogout={handleLogout}
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
                {currentView === 'sales' && <SalesView />}
                {currentView === 'proposals' && <ProposalsView proposals={proposals} user={user} kits={kits} />}
                {currentView === 'settings' && <SettingsView user={user} onUpdateUser={setUser} onLogout={handleLogout} />}
                {currentView === 'partners' && <PartnersView partners={partners} />}
                {currentView === 'collaborators' && <CollaboratorsView collaborators={collaborators} />}
                {currentView === 'kits' && <KitsView kits={kits} />}
                {currentView === 'finance' && <FinanceView proposals={proposals} user={user} />}
                {currentView === 'clients' && (
                  <ClientsView 
                    clients={clients} 
                    proposals={proposals} 
                    installations={installations}
                    onAddClient={addClient}
                    onUpdateClient={updateClient}
                    onDeleteClient={deleteClient}
                  />
                )}
              </>
            )}

            {/* Application Footer */}
            <footer className="mt-20 py-12 border-t border-slate-200 dark:border-slate-800">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-xl bg-[#fdb612]/10 flex items-center justify-center overflow-hidden">
                    {companyLogo ? (
                      <img src={companyLogo} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
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
