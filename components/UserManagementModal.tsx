
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2, Edit3, Shield, CheckCircle2, X, Mail } from 'lucide-react';
import { User, UserPermissions } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const UserManagementModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { currentUser, users, register, updateDependentPermissions, deleteUser } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  if (!isOpen) return null;

  const dependents = users.filter(u => u.responsibleId === currentUser?.id);

  const permissionGroups = [
    {
      title: "💰 Finanças",
      perms: [
        { id: 'canEditTransactions', label: 'Editar Transações', desc: 'Permite lançar e excluir gastos mensais.' },
        { id: 'canViewPatrimony', label: 'Visualizar Patrimônio', desc: 'Permite ver o valor total investido e guardado.' },
        { id: 'canEditPatrimony', label: 'Gerenciar Ativos', desc: 'Permite adicionar ou remover investimentos.' },
      ]
    },
    {
      title: "🎯 Planejamento",
      perms: [
        { id: 'canEditGoals', label: 'Gerenciar Metas', desc: 'Permite criar e excluir objetivos financeiros.' },
        { id: 'canAccessReports', label: 'Relatórios Anuais', desc: 'Acesso completo ao balanço e evolução anual.' },
      ]
    },
    {
      title: "🛠️ Sistema",
      perms: [
        { id: 'canManageSettings', label: 'Configurações Avançadas', desc: 'Acesso total a categorias e cartões.' },
      ]
    }
  ];

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    
    const perms: UserPermissions = {
      canEditTransactions: fd.get('canEditTransactions') === 'on',
      canViewPatrimony: fd.get('canViewPatrimony') === 'on',
      canEditPatrimony: fd.get('canEditPatrimony') === 'on',
      canEditGoals: fd.get('canEditGoals') === 'on',
      canAccessReports: fd.get('canAccessReports') === 'on',
      canManageSettings: fd.get('canManageSettings') === 'on',
    };

    if (editingUser) {
      updateDependentPermissions(editingUser.id, perms);
    } else {
      register({
        name: fd.get('name') as string,
        email: fd.get('email') as string,
        passwordHash: fd.get('password') as string,
        role: 'dependent',
        responsibleId: currentUser?.id,
        permissions: perms
      });
    }
    setIsAdding(false);
    setEditingUser(null);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-[32px] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in duration-300">
        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-2xl font-black tracking-tight">Gestão de Dependentes</h2>
            <p className="text-sm text-gray-500 font-medium">Controle o acesso da sua família ao sistema</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-gray-200">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          {!isAdding && !editingUser ? (
            <div className="space-y-6">
              <button 
                onClick={() => setIsAdding(true)}
                className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center gap-2 text-gray-400 font-bold hover:border-[#FF385C] hover:text-[#FF385C] transition-all"
              >
                <Plus size={20} /> Adicionar Novo Usuário
              </button>

              <div className="grid grid-cols-1 gap-4">
                {dependents.map(dep => (
                  <div key={dep.id} className="airbnb-card p-6 flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 font-black text-xl">
                        {dep.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-gray-800">{dep.name}</h4>
                        <span className="text-xs font-black text-gray-400 uppercase tracking-tighter">{dep.email}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setEditingUser(dep)}
                        className="p-3 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-black transition-all"
                      >
                        <Edit3 size={18} />
                      </button>
                      <button 
                        onClick={() => deleteUser(dep.id)}
                        className="p-3 hover:bg-red-50 rounded-xl text-gray-400 hover:text-red-500 transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
                {dependents.length === 0 && (
                  <div className="text-center py-10 opacity-40 italic font-bold">Nenhum dependente cadastrado ainda.</div>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-8 animate-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!editingUser && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Nome Completo</label>
                      <input name="name" required placeholder="Ex: João Silva" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">E-mail de Acesso</label>
                      <input name="email" type="email" required placeholder="joao@familia.com" />
                    </div>
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Senha Inicial</label>
                      <input name="password" type="password" required placeholder="••••••••" />
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                  <Shield size={18} className="text-[#FF385C]" />
                  <h3 className="font-black text-sm uppercase tracking-tight">Níveis de Permissão</h3>
                </div>

                {permissionGroups.map(group => (
                  <div key={group.title} className="space-y-3">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{group.title}</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {group.perms.map(p => (
                        <label key={p.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl cursor-pointer hover:bg-gray-100 transition-all border border-transparent hover:border-gray-200 group">
                          <div className="pt-0.5">
                            <input 
                              type="checkbox" 
                              name={p.id} 
                              className="w-5 h-5 accent-[#FF385C] rounded-md"
                              defaultChecked={editingUser?.permissions[p.id as keyof UserPermissions] ?? true}
                            />
                          </div>
                          <div>
                            <span className="block font-bold text-sm text-gray-800">{p.label}</span>
                            <span className="block text-xs text-gray-500">{p.desc}</span>
                          </div>
                          <CheckCircle2 className="ml-auto opacity-0 group-has-[:checked]:opacity-100 text-[#FF385C] transition-opacity" size={20} />
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => { setIsAdding(false); setEditingUser(null); }}
                  className="flex-1 py-4 font-bold text-gray-500 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-all"
                >
                  Cancelar
                </button>
                <button type="submit" className="flex-[2] primary-btn py-4 shadow-xl">
                  {editingUser ? 'Atualizar Permissões' : 'Criar Dependente'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagementModal;
