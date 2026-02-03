
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserPermissions } from '../types';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  login: (email: string, passwordHash: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  register: (user: Omit<User, 'id' | 'username'>) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateDependentPermissions: (userId: string, permissions: UserPermissions) => void;
  deleteUser: (userId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const session = sessionStorage.getItem('mzfinance_session');
    return session ? JSON.parse(session) : null;
  });

  const fetchUserProfile = useCallback(async (userId: string) => {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data as User;
    } catch (err) {
      console.error("Erro ao buscar perfil:", err);
      return null;
    }
  }, []);

  useEffect(() => {
    if (!supabase) return;

    const auth = (supabase.auth as any);
    const { data: { subscription } } = auth.onAuthStateChange(async (event: any, session: any) => {
      if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        sessionStorage.removeItem('mzfinance_session');
      } else if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        if (profile) {
          setCurrentUser(profile);
          sessionStorage.setItem('mzfinance_session', JSON.stringify(profile));
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUserProfile]);

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
    if (!supabase) return { success: false, error: "Erro de conexão." };

    try {
      const auth = (supabase.auth as any);
      const { data, error } = await auth.signInWithPassword({
        email,
        password: passwordHash,
      });

      if (error) {
        if (error.message.includes("Email not confirmed")) {
          return { success: false, error: "E-mail não confirmado. Verifique sua caixa de entrada." };
        }
        return { success: false, error: "E-mail ou senha incorretos." };
      }

      if (data.user) {
        const fullProfile = await fetchUserProfile(data.user.id);
        if (fullProfile) {
          setCurrentUser(fullProfile);
          return { success: true };
        }
      }
      return { success: false, error: "Falha ao carregar perfil." };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const logout = async () => {
    if (supabase) await (supabase.auth as any).signOut();
    setCurrentUser(null);
    sessionStorage.removeItem('mzfinance_session');
    window.location.href = '#/login';
  };

  const register = async (userData: Omit<User, 'id' | 'username'>) => {
    if (!supabase) throw new Error("Banco de dados não configurado.");

    try {
      // Gera username a partir do email (antes do @)
      const autoUsername = userData.email?.split('@')[0] || `user_${Math.random().toString(36).substring(7)}`;

      const auth = (supabase.auth as any);
      const { data, error } = await auth.signUp({
        email: userData.email,
        password: userData.passwordHash,
        options: {
          data: { name: userData.name, username: autoUsername }
        }
      });

      if (error) throw error;
      if (!data.user) throw new Error("Não foi possível criar a conta.");

      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: data.user.id,
          name: userData.name,
          username: autoUsername,
          email: userData.email,
          role: userData.role,
          permissions: userData.permissions,
          responsible_id: userData.responsibleId || null
        }]);

      if (profileError) throw profileError;
    } catch (err: any) {
      throw err;
    }
  };

  const updateDependentPermissions = async (userId: string, permissions: UserPermissions) => {
    if (!supabase) return;
    try {
      await supabase
        .from('profiles')
        .update({ permissions })
        .eq('id', userId);
      
      if (currentUser?.id === userId) {
        setCurrentUser(prev => prev ? { ...prev, permissions } : null);
      }
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
      currentUser, users, login, logout, register, requestPasswordReset,
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
