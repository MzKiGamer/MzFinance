
export type TransactionType = 'Receita' | 'Despesa';

export type UserRole = 'responsible' | 'dependent';

export interface UserPermissions {
  canEditTransactions: boolean;
  canViewPatrimony: boolean;
  canEditPatrimony: boolean;
  canEditGoals: boolean;
  canAccessReports: boolean;
  canManageSettings: boolean;
}

export interface User {
  id: string;
  username: string;
  email?: string; // Somente para responsável
  passwordHash: string;
  role: UserRole;
  responsibleId?: string; // ID do responsável se for dependente
  permissions: UserPermissions;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  subcategories: string;
  isSystem?: boolean;
}

export interface Card {
  id: string;
  name: string;
  bank: string;
  limit: number;
  closingDay: number;
  color: string;
}

export interface Goal {
  id: string;
  name: string;
  icon: string;
  targetValue: number;
  savedValue: number;
}

export interface FixedEntry {
  id: string;
  description: string;
  day: number;
  type: TransactionType;
  value: number;
  categoryId: string;
  paymentMethod: string;
  notes: string;
  active: boolean;
}

export interface Transaction {
  id: string;
  monthCode: string;
  description: string;
  day: number;
  type: TransactionType;
  value: number;
  categoryId: string;
  paymentMethod: string;
  cardId?: string;
  paid: boolean;
  paymentDate?: string;
  goalId?: string;
  investmentId?: string;
  notes: string;
  isFixed?: boolean;
}

export interface Asset {
  id: string;
  description: string;
  objective?: string;
  bank: string;
  value: number;
  updatedAt: string;
  liquidity: 'Imediata' | 'Curto Prazo' | 'Médio Prazo' | 'Longo Prazo';
  canTouch: 'Sim' | 'Não';
}

export interface Investment {
  id: string;
  type: 'Renda Fixa' | 'Renda Variável' | 'Fundo Imobiliário' | 'Criptomoedas' | 'Previdência Privada' | 'Tesouro Direto' | 'CDB' | 'LCI/LCA' | 'Ações' | 'Outros';
  value: number;
  broker?: string;
  updatedAt: string;
  category?: string;
}

export interface MonthConfig {
  monthCode: string;
  income: number;
  needsPercent: number;
  desiresPercent: number;
  savingsPercent: number;
}
