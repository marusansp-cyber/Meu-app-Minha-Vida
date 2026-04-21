import React, { useState, useEffect } from 'react';
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

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      {toast && (
        <div className="fixed bottom-8 right-8 z-[200] bg-[#231d0f] text-white px-6 py-3 rounded-xl shadow-2xl border border-[#fdb612]/30 animate-in slide-in-from-right duration-300 flex items-center gap-3">
          <div className="size-2 bg-[#fdb612] rounded-full animate-pulse" />
          <span className="font-bold text-sm">{toast}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">
            Gestão de Acessos
          </h2>
          <p className="text-slate-500 font-medium">Controle quem pode acessar o sistema e quais suas permissões.</p>
        </div>
        
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por nome, email ou role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-[#fdb612] transition-all"
          />
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
                        className="bg-slate-100 dark:bg-slate-800 border-none text-xs font-bold px-3 py-1.5 rounded-lg focus:ring-2 focus:ring-[#fdb612]/30 transition-all outline-none"
                      >
                        {roles.map(r => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      {u.status === 'pending' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-500/10 text-amber-600 font-bold text-[10px] uppercase tracking-wider">
                          <ShieldAlert className="w-3 h-3" />
                          Pendente
                        </span>
                      ) : u.status === 'active' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 font-bold text-[10px] uppercase tracking-wider">
                          <CheckCircle2 className="w-3 h-3" />
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-500/10 text-slate-600 font-bold text-[10px] uppercase tracking-wider">
                          <XCircle className="w-3 h-3" />
                          Inativo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
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
    </div>
  );
};
