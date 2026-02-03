
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserPermissions } from '../types';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  login: (username: string, passwordHash: string) => Promise<boolean>;
  logout: () => void;
  register: (user: Omit<User, 'id'>) => Promise<void>;
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

    // Use 'any' cast to bypass type errors for standard Supabase Auth methods
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
      // Use 'any' cast to bypass type errors for standard Supabase Auth methods
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

  const login = async (username: string, passwordHash: string) => {
    if (!supabase) return false;

    try {
      const { data: profile, error: pError } = await supabase
        .from('profiles')
        .select('email')
        .eq('username', username)
        .single();

      if (pError || !profile?.email) throw new Error("Usuário não encontrado.");

      // Use 'any' cast to bypass type errors for standard Supabase Auth methods
      const auth = (supabase.auth as any);
      const { data, error } = await auth.signInWithPassword({
        email: profile.email,
        password: passwordHash,
      });

      if (error) throw error;

      if (data.user) {
        const fullProfile = await fetchUserProfile(data.user.id);
        setCurrentUser(fullProfile);
        return true;
      }
      return false;
    } catch (err: any) {
      console.error("Erro no login:", err.message);
      return false;
    }
  };

  const logout = async () => {
    // Use 'any' cast to bypass type errors for standard Supabase Auth methods
    if (supabase) await (supabase.auth as any).signOut();
    setCurrentUser(null);
    sessionStorage.removeItem('mzfinance_session');
    window.location.href = '#/login';
  };

  const register = async (userData: Omit<User, 'id'>) => {
    if (!supabase) {
      throw new Error(
        "A conexão com o banco de dados (Supabase) não foi detectada. " +
        "Certifique-se de cadastrar suas chaves REAIS (URL e ANON KEY) na aba 'Secrets' ou 'Environment Variables' do seu editor. " +
        "O arquivo .env.local sozinho pode não ser lido em alguns ambientes de visualização."
      );
    }

    try {
      // Use 'any' cast to bypass type errors for standard Supabase Auth methods
      const auth = (supabase.auth as any);
      const { data, error } = await auth.signUp({
        email: userData.email,
        password: userData.passwordHash,
        options: {
          data: { name: userData.name, username: userData.username }
        }
      });

      if (error) throw error;
      if (!data.user) throw new Error("Não foi possível criar a conta no serviço de autenticação.");

      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: data.user.id,
          name: userData.name,
          username: userData.username,
          email: userData.email,
          role: userData.role,
          permissions: userData.permissions,
          responsible_id: userData.responsibleId || null
        }]);

      if (profileError) throw profileError;
    } catch (err: any) {
      console.error("Erro no registro:", err.message);
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
