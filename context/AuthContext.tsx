
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserPermissions } from '../types';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  login: (username: string, passwordHash: string) => boolean;
  logout: () => void;
  register: (user: Omit<User, 'id'>) => void;
  updateDependentPermissions: (userId: string, permissions: UserPermissions) => void;
  deleteUser: (userId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_PERMISSIONS: UserPermissions = {
  canEditTransactions: true,
  canViewPatrimony: true,
  canEditPatrimony: false,
  canEditGoals: false,
  canAccessReports: true,
  canManageSettings: false,
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('easyfinance_users');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = sessionStorage.getItem('easyfinance_session');
    return saved ? JSON.parse(saved) : null;
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

  const login = (username: string, passwordHash: string) => {
    const user = users.find(u => u.username === username && u.passwordHash === passwordHash);
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const logout = () => setCurrentUser(null);

  const register = (userData: Omit<User, 'id'>) => {
    const newUser: User = { ...userData, id: crypto.randomUUID() };
    setUsers(prev => [...prev, newUser]);
    // Se for o primeiro usuário, loga automaticamente
    if (!currentUser) setCurrentUser(newUser);
  };

  const updateDependentPermissions = (userId: string, permissions: UserPermissions) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, permissions } : u));
    // Se o usuário atual for o editado, atualiza a sessão
    if (currentUser?.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, permissions } : null);
    }
  };

  const deleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
  };

  return (
    <AuthContext.Provider value={{ 
      currentUser, users, login, logout, register, 
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
