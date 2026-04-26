import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Shield, 
  MoreVertical, 
  Trash2, 
  Edit2, 
  CheckCircle2, 
  XCircle,
  UserCheck,
  UserX,
  Mail,
  ShieldCheck,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { User, UserRole } from '../types';
import { syncCollection, updateDocument, deleteDocument } from '../firestoreUtils';

export const UsersView: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof User; direction: 'asc' | 'desc' } | null>({ key: 'createdAt', direction: 'desc' });
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = syncCollection<User>('users', (data) => {
      setUsers(data);
      setIsLoading(false);
    }, 'email');
    return () => unsubscribe();
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const toggleStatus = async (user: User) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    await updateDocument('users', user.id, { status: newStatus });
    showToast(`Usuário ${user.name} agora está ${newStatus === 'active' ? 'Ativo' : 'Inativo'}`);
  };

  const updateStatus = async (user: User, newStatus: 'active' | 'inactive' | 'pending') => {
    await updateDocument('users', user.id, { status: newStatus });
    showToast(`Status de ${user.name} atualizado para ${newStatus}`);
  };

  const approveUser = async (user: User) => {
    await updateDocument('users', user.id, { status: 'active' });
    showToast(`Usuário ${user.name} aprovado com sucesso!`);
  };

  const changeRole = async (user: User, newRole: UserRole) => {
    await updateDocument('users', user.id, { role: newRole });
    showToast(`Role de ${user.name} atualizada para ${newRole}`);
  };

  const deleteUserRecord = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir o perfil deste usuário? Isso não exclui a conta no Firebase Auth.')) {
      await deleteDocument('users', id);
      showToast('Perfil removido.');
    }
  };

  const filteredUsers = useMemo(() => {
    const rolesMap: Record<UserRole, string> = {
      admin: 'Administrador',
      sales: 'Vendedor',
      engineer: 'Engenheiro',
      installer: 'Instalador',
      finance: 'Financeiro',
      admin_staff: 'Staff Adm'
    };

    let result = users.filter(u => 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rolesMap[u.role] || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortConfig) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key] || '';
        const bValue = b[sortConfig.key] || '';
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [users, searchTerm, sortConfig]);

  const handleSort = (key: keyof User) => {
    setSortConfig(current => ({
      key,
      direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  const saveUserEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    const { id, ...data } = editingUser;
    await updateDocument('users', id, data);
    setIsEditModalOpen(false);
    setEditingUser(null);
    showToast('Usuário atualizado com sucesso!');
  };

  const roles: { value: UserRole, label: string }[] = [
    { value: 'admin', label: 'Administrador' },
    { value: 'sales', label: 'Vendedor' },
    { value: 'engineer', label: 'Engenheiro' },
    { value: 'installer', label: 'Instalador' },
    { value: 'finance', label: 'Financeiro' },
    { value: 'admin_staff', label: 'Staff Adm' },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <Loader2 className="w-12 h-12 text-[#fdb612] animate-spin" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Carregando Usuários...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-white/5 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl backdrop-blur-sm mb-2">
        <div className="flex items-center gap-6">
          <div className="size-16 rounded-[1.5rem] bg-brand-primary text-white flex items-center justify-center shadow-xl shadow-brand-primary/20">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-brand-primary dark:text-white tracking-tight">
              Governança de Acessos
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium tracking-tight">Controle de privilégios e auditoria Vieira's Solar</p>
          </div>
        </div>
        
        <div className="relative w-full md:w-96 group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-slate-400 group-focus-within:text-brand-primary transition-colors" />
          </div>
          <input 
            type="text" 
            placeholder="Pesquisar por nome ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-slate-100 dark:bg-white/5 border border-transparent focus:border-brand-primary rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-brand-primary/10 transition-all shadow-inner"
          />
          <div className="absolute -top-2 left-4 px-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-md text-[9px] font-black uppercase tracking-widest text-slate-400">
            Busca Rápida
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredUsers.length > 0 ? (
          <div className="bg-white dark:bg-[#231d0f]/40 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-white/5">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Usuário</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Permissão (Role)</th>
                  <th 
                    className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:text-[#fdb612] transition-colors"
                    onClick={() => handleSort('createdAt')}
                  >
                    Criado Em
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="size-10 rounded-full bg-[#fdb612]/10 flex items-center justify-center text-[#fdb612] font-black shrink-0">
                          {u.avatar ? (
                            <img src={u.avatar} alt={u.name} className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            u.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-slate-100">{u.name}</p>
                          <p className="text-xs text-slate-500 font-medium">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select 
                        value={u.role}
                        onChange={(e) => changeRole(u, e.target.value as UserRole)}
                        className="bg-slate-100 dark:bg-slate-800 border-none text-xs font-black px-3 py-1.5 rounded-lg focus:ring-2 focus:ring-[#fdb612]/30 transition-all outline-none"
                      >
                        {roles.map(r => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-slate-500">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <select 
                        value={u.status || 'pending'}
                        onChange={(e) => updateStatus(u, e.target.value as any)}
                        className={cn(
                          "bg-slate-100 dark:bg-slate-800 border-none text-[10px] font-black uppercase px-3 py-1.5 rounded-lg focus:ring-2 focus:ring-[#fdb612]/30 transition-all outline-none",
                          u.status === 'active' ? "text-emerald-500" : u.status === 'inactive' ? "text-slate-500" : "text-amber-500"
                        )}
                      >
                        <option value="active">Ativo</option>
                        <option value="inactive">Inativo</option>
                        <option value="pending">Pendente</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleEditUser(u)}
                          className="p-2 text-slate-400 hover:text-[#fdb612] hover:bg-[#fdb612]/10 rounded-xl transition-all"
                          title="Editar Usuário"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        {u.status === 'pending' && (
                          <button 
                            onClick={() => approveUser(u)}
                            className="bg-[#fdb612] text-[#231d0f] px-4 py-2 rounded-xl text-xs font-bold hover:shadow-lg hover:shadow-[#fdb612]/20 transition-all flex items-center gap-2"
                          >
                            <UserCheck className="w-4 h-4" />
                            Aprovar
                          </button>
                        )}
                        <button 
                          onClick={() => toggleStatus(u)}
                          className={cn(
                            "p-2 rounded-xl transition-all",
                            u.status === 'active' 
                              ? "text-rose-500 hover:bg-rose-500/10" 
                              : "text-emerald-500 hover:bg-emerald-500/10"
                          )}
                          title={u.status === 'active' ? 'Desativar Acesso' : 'Ativar Acesso'}
                        >
                          {u.status === 'active' ? <UserX className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                        </button>
                        <button 
                          onClick={() => deleteUserRecord(u.id)}
                          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                          title="Excluir Perfil"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 text-center space-y-4 bg-white dark:bg-[#231d0f]/40 border border-slate-200 dark:border-slate-800 rounded-3xl">
            <Users className="w-16 h-16 text-slate-300 mx-auto" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Nenhum usuário encontrado.</p>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-[#231d0f] w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">Editar Usuário</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Atualize as informações do perfil</p>
              </div>
              <button 
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingUser(null);
                }}
                className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors"
              >
                <XCircle className="w-6 h-6 text-slate-400" />
              </button>
            </div>
            
            <form onSubmit={saveUserEdit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nome Completo</label>
                  <input 
                    type="text" 
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612] transition-all"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">E-mail</label>
                  <input 
                    type="email" 
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612] transition-all"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Telefone</label>
                  <input 
                    type="tel" 
                    value={editingUser.phone || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612] transition-all"
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Status</label>
                  <select 
                    value={editingUser.status || 'pending'}
                    onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as any })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-[#fdb612] transition-all"
                  >
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                    <option value="pending">Pendente</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button 
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingUser(null);
                  }}
                  className="flex-1 py-4 text-slate-500 font-black uppercase tracking-widest text-xs hover:bg-slate-100 dark:hover:bg-white/5 rounded-2xl transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-[2] py-4 bg-[#fdb612] text-[#231d0f] font-black uppercase tracking-widest text-xs rounded-2xl shadow-lg shadow-[#fdb612]/20 hover:shadow-xl hover:-translate-y-0.5 transition-all active:translate-y-0 active:scale-[0.98]"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
