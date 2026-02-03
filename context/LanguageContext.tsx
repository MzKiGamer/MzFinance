
import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'pt' | 'en';

interface Translations {
  [key: string]: {
    [key in Language]: string | string[];
  };
}

const translations: Translations = {
  // Navigation
  dashboard: { pt: 'Início', en: 'Home' },
  monthly: { pt: 'Mensal', en: 'Monthly' },
  patrimony: { pt: 'Patrimônio', en: 'Patrimony' },
  goals: { pt: 'Metas', en: 'Goals' },
  reports: { pt: 'Relatórios', en: 'Reports' },
  settings: { pt: 'Configurações', en: 'Settings' },
  logout: { pt: 'Sair do Sistema', en: 'Log Out' },
  manageTeam: { pt: 'Gerenciar Equipe', en: 'Manage Team' },
  
  // Dashboard & General
  hello: { pt: 'Olá', en: 'Hello' },
  summaryOf: { pt: 'Aqui está o resumo de', en: 'Here is the summary of' },
  monthlyBalance: { pt: 'Saldo Mensal', en: 'Monthly Balance' },
  revenues: { pt: 'Receitas', en: 'Revenues' },
  expenses: { pt: 'Despesas', en: 'Expenses' },
  netBalance: { pt: 'Saldo Líquido', en: 'Net Balance' },
  thermometer: { pt: 'Termômetro', en: 'Health Check' },
  status: { pt: 'Status', en: 'Status' },
  inBlue: { pt: 'No Azul', en: 'In the Green' },
  onLimit: { pt: 'No Limite', en: 'At the Limit' },
  inRed: { pt: 'No Vermelho', en: 'In the Red' },
  noRevenue: { pt: 'Sem Receita', en: 'No Income' },
  spendingRatio: { pt: 'Gasto', en: 'Spent' },
  ofRevenue: { pt: 'da receita', en: 'of revenue' },
  cards: { pt: 'Cartões', en: 'Cards' },
  noGoals: { pt: 'Nenhuma meta cadastrada', en: 'No goals registered' },
  noCards: { pt: 'Nenhum cartão cadastrado', en: 'No cards registered' },
  annualVision: { pt: 'Visão Anual Consolidada', en: 'Consolidated Annual View' },
  day: { pt: 'Dia', en: 'Day' },
  cancel: { pt: 'Cancelar', en: 'Cancel' },
  save: { pt: 'Salvar', en: 'Save' },
  edit: { pt: 'Editar', en: 'Edit' },
  delete: { pt: 'Excluir', en: 'Delete' },
  description: { pt: 'Descrição', en: 'Description' },
  value: { pt: 'Valor', en: 'Amount' },
  bank: { pt: 'Banco', en: 'Bank' },
  new: { pt: 'Novo', en: 'New' },
  type: { pt: 'Tipo', en: 'Type' },
  editTransaction: { pt: 'Editar Transação', en: 'Edit Transaction' },
  card: { pt: 'Cartão', en: 'Card' },

  // Months Array
  monthNames: {
    pt: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  },

  // Payment Methods
  "Dinheiro": { pt: 'Dinheiro', en: 'Cash' },
  "PIX": { pt: 'PIX', en: 'Instant Pay (PIX)' },
  "Débito": { pt: 'Débito', en: 'Debit Card' },
  "Crédito": { pt: 'Crédito', en: 'Credit Card' },
  "Boleto": { pt: 'Boleto', en: 'Invoice' },
  "Transferência": { pt: 'Transferência', en: 'Transfer' },

  // Monthly Control
  planner: { pt: 'Planejador', en: 'Planner' },
  budgetConfig: { pt: 'Planejamento', en: 'Planning' },
  incomeAuto: { pt: 'Renda (Auto)', en: 'Income (Auto)' },
  incomeSum: { pt: 'Soma das entradas', en: 'Sum of entries' },
  needs: { pt: 'Necessidades', en: 'Needs' },
  wants: { pt: 'Desejos', en: 'Wants' },
  savings: { pt: 'Poupança', en: 'Savings' },
  transactions: { pt: 'Transações', en: 'Transactions' },
  newTransaction: { pt: 'Nova Transação', en: 'New Transaction' },
  category: { pt: 'Categoria', en: 'Category' },
  paymentMethod: { pt: 'Forma de Pagamento', en: 'Payment Method' },
  alreadyPaid: { pt: 'Já pago / recebido', en: 'Already paid / received' },
  emptyTransactions: { pt: 'Nenhuma transação lançada para este mês.', en: 'No transactions for this month.' },
  
  // Patrimony
  consolidatedPatrimony: { pt: 'Patrimônio Consolidado', en: 'Consolidated Net Worth' },
  reserves: { pt: 'Reservas', en: 'Reserves' },
  investments: { pt: 'Investimentos', en: 'Investments' },
  newAsset: { pt: 'Novo Ativo', en: 'New Asset' },
  newInvestment: { pt: 'Novo Investimento', en: 'New Investment' },
  liquidity: { pt: 'Liquidez', en: 'Liquidity' },
  restricted: { pt: 'Restrito', en: 'Restricted' },
  liquid: { pt: 'Líquido', en: 'Liquid' },
  allocation: { pt: 'Alocação de Ativos', en: 'Asset Allocation' },
  broker: { pt: 'Corretora', en: 'Broker' },
  assetName: { pt: 'Nome / Código', en: 'Name / Symbol' },

  // Goals
  myGoals: { pt: 'Minhas Metas', en: 'My Goals' },
  trackProgress: { pt: 'Acompanhe seu progresso e realize sonhos.', en: 'Track your progress and achieve dreams.' },
  newGoal: { pt: 'Nova Meta', en: 'New Goal' },
  goalName: { pt: 'Nome da Meta', en: 'Goal Name' },
  targetValue: { pt: 'Valor Alvo', en: 'Target Value' },
  progress: { pt: 'Progresso', en: 'Progress' },
  saved: { pt: 'Guardado', en: 'Saved' },
  target: { pt: 'Meta', en: 'Target' },

  // Reports
  annualReports: { pt: 'Relatórios Anuais', en: 'Annual Reports' },
  consolidatedBalance: { pt: 'Balanço consolidado por período.', en: 'Consolidated balance per period.' },
  exportAll: { pt: 'Exportar Tudo', en: 'Export All' },
  fullPDF: { pt: 'Relatório Completo (PDF)', en: 'Full Report (PDF)' },
  fullExcel: { pt: 'Planilha Completa (Excel)', en: 'Full Spreadsheet (Excel)' },
  annualEvolution: { pt: 'Evolução Mensal', en: 'Monthly Evolution' },
  balanceByMonth: { pt: 'Saldo por Mês', en: 'Balance by Month' },
  consolidatedTable: { pt: 'Tabela Consolidada', en: 'Consolidated Table' },

  // Settings
  personalizeStructure: { pt: 'Personalize a estrutura do seu sistema financeiro.', en: 'Personalize your financial system structure.' },
  categories: { pt: 'Categorias', en: 'Categories' },
  fixedEntries: { pt: 'Gastos Fixos', en: 'Fixed Entries' },
  fixed: { pt: 'Gastos Fixos', en: 'Fixed Entries' },
  fixedEntriesTitle: { pt: 'Gastos Fixos', en: 'Fixed Entries' },
  closingDay: { pt: 'Fechamento (Dia)', en: 'Closing (Day)' },
  cardColor: { pt: 'Cor do Cartão', en: 'Card Color' },
  noManagePerm: { pt: 'Você não tem permissão para alterar as configurações.', en: 'You do not have permission to change settings.' }
};

interface LanguageContextType {
  language: Language;
  t: (key: string) => any;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('mzfinance_lang');
    return (saved as Language) || (navigator.language.split('-')[0] === 'en' ? 'en' : 'pt');
  });

  useEffect(() => {
    localStorage.setItem('mzfinance_lang', language);
  }, [language]);

  const t = (key: string) => {
    if (!translations[key]) return key;
    return translations[key][language];
  };

  return (
    <LanguageContext.Provider value={{ language, t, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
