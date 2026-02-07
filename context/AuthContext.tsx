
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserPermissions } from '../types';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  users: User[];
  login: (email: string, passwordHash: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  logout: () => void;
  register: (user: Omit<User, 'id' | 'username'>) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateDependentPermissions: (userId: string, permissions: UserPermissions) => void;
  deleteUser: (userId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mapProfile = (p: any): User => ({
  id: p.id,
  name: p.name || 'Usuário',
  username: p.username || 'user',
  email: p.email,
  role: p.role || 'responsible',
  passwordHash: '',
  responsibleId: p.responsible_id,
  permissions: p.permissions || {
    canEditTransactions: true,
    canViewPatrimony: true,
    canEditPatrimony: true,
    canEditGoals: true,
    canAccessReports: true,
    canManageSettings: true,
  }
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const session = sessionStorage.getItem('mzfinance_session');
    return session ? JSON.parse(session) : null;
  });

  const fetchUserProfile = useCallback(async (userId: string, metadata?: any) => {
    if (!supabase) return null;
    try {
      // Tenta buscar o perfil na tabela 'profiles'
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.warn("Perfil não encontrado na tabela 'profiles', usando metadados do Auth.");
        // Se a tabela não existir ou o perfil não estiver lá, cria um objeto básico
        return mapProfile({
          id: userId,
          name: metadata?.name || metadata?.full_name || 'Usuário Mz',
          email: metadata?.email,
          role: 'responsible'
        });
      }
      return mapProfile(data);
    } catch (err) {
      console.error("Erro ao buscar perfil:", err);
      return mapProfile({ id: userId, name: 'Usuário Mz', role: 'responsible' });
    }
  }, []);

  useEffect(() => {
    if (!supabase) return;

    const auth = (supabase.auth as any);
    const { data: { subscription } } = auth.onAuthStateChange(async (event: any, session: any) => {
      if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        sessionStorage.removeItem('mzfinance_session');
      } else if (session?.user && !currentUser) {
        const profile = await fetchUserProfile(session.user.id, session.user.user_metadata);
        if (profile) {
          setCurrentUser(profile);
          sessionStorage.setItem('mzfinance_session', JSON.stringify(profile));
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUserProfile, currentUser]);

  const requestPasswordReset = async (email: string) => {
    if (!supabase) return { success: false, error: 'Banco de dados não configurado.' };
    try {
      const auth = (supabase.auth as any);
      const { error } = await auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/#/login?reset=true',
      });
      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const login = async (email: string, passwordHash: string) => {
    if (!supabase) return { success: false, error: "Erro de conexão com o banco." };

    try {
      const auth = (supabase.auth as any);
      const { data, error } = await auth.signInWithPassword({
        email,
        password: passwordHash,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        const profile = await fetchUserProfile(data.user.id, data.user.user_metadata);
        return { success: true, data: profile };
      }
      return { success: false, error: "Usuário não retornado pelo servidor." };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const logout = async () => {
    if (supabase) await (supabase.auth as any).signOut();
    setCurrentUser(null);
    sessionStorage.removeItem('mzfinance_session');
  };

  const register = async (userData: Omit<User, 'id' | 'username'>) => {
    if (!supabase) throw new Error("Banco de dados não configurado.");
    const autoUsername = userData.email?.split('@')[0] || `user_${Math.random().toString(36).substring(7)}`;
    const auth = (supabase.auth as any);
    const { data, error } = await auth.signUp({
      email: userData.email,
      password: userData.passwordHash,
      options: { data: { name: userData.name, username: autoUsername } }
    });
    if (error) throw error;
    if (data.user) {
      await supabase.from('profiles').insert([{
        id: data.user.id,
        name: userData.name,
        username: autoUsername,
        email: userData.email,
        role: userData.role,
        permissions: userData.permissions,
        responsible_id: userData.responsibleId || null
      }]);
    }
  };

  const updateDependentPermissions = async (userId: string, permissions: UserPermissions) => {
    if (!supabase) return;
    try {
      await supabase.from('profiles').update({ permissions }).eq('id', userId);
      if (currentUser?.id === userId) setCurrentUser(prev => prev ? { ...prev, permissions } : null);
    } catch (err) {
      console.error("Erro ao atualizar permissões:", err);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!supabase) return;
    try {
      await supabase.from('profiles').delete().eq('id', userId);
    } catch (err) {
      console.error("Erro ao deletar usuário:", err);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      currentUser, setCurrentUser, users, login, logout, register, requestPasswordReset,
      updateDependentPermissions, deleteUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
