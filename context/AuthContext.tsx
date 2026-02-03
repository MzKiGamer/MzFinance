
import React, { createContext, useContext, useState, useEffect } from 'react';
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
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('easyfinance_users');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const session = sessionStorage.getItem('easyfinance_session');
    return session ? JSON.parse(session) : null;
  });

  useEffect(() => {
    localStorage.setItem('easyfinance_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      sessionStorage.setItem('easyfinance_session', JSON.stringify(currentUser));
    } else {
      sessionStorage.removeItem('easyfinance_session');
    }
  }, [currentUser]);

  // Função para recuperar senha real via Supabase
  const requestPasswordReset = async (email: string) => {
    if (!supabase) return { success: false, error: 'Supabase não configurado' };
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/#/login?reset=true',
      });
      
      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      console.error("Erro ao solicitar recuperação:", err.message);
      return { success: false, error: err.message };
    }
  };

  const login = async (username: string, passwordHash: string) => {
    // Nota: Para produção, o ideal é usar supabase.auth.signInWithPassword
    // Aqui mantemos a lógica de busca na tabela de usuários para compatibilidade com dependentes
    const user = users.find(u => u.username === username && u.passwordHash === passwordHash);
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const logout = () => {
    if (supabase) supabase.auth.signOut();
    setCurrentUser(null);
    sessionStorage.removeItem('easyfinance_session');
    window.location.href = '#/login';
    window.location.reload();
  };

  const register = async (userData: Omit<User, 'id'>) => {
    const newUser: User = { ...userData, id: crypto.randomUUID() };
    
    // Se o Supabase estiver ativo, podemos criar o usuário lá também
    if (supabase && userData.role === 'responsible' && userData.email) {
      try {
        await supabase.auth.signUp({
          email: userData.email,
          password: userData.passwordHash, // Usando a senha como hash para simplicidade neste exemplo
          options: { data: { name: userData.name, username: userData.username } }
        });
      } catch (e) {
        console.warn("Falha ao registrar no Supabase Auth, mas salvando localmente:", e);
      }
    }

    setUsers(prev => [...prev, newUser]);
    if (userData.role === 'responsible') {
      setCurrentUser(newUser);
    }
  };

  const updateDependentPermissions = (userId: string, permissions: UserPermissions) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, permissions } : u));
    if (currentUser?.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, permissions } : null);
    }
  };

  const deleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
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
