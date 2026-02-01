
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Transaction, Category, Card, Goal, FixedEntry, 
  Asset, Investment, MonthConfig 
} from '../types';
import { DEFAULT_CATEGORIES } from '../constants';

// Fix: Updated setter types from simple function to React.Dispatch<React.SetStateAction<T>> 
// to support functional updates like setTransactions(prev => ...), which prevents stale state issues.
interface FinanceContextType {
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  cards: Card[];
  setCards: React.Dispatch<React.SetStateAction<Card[]>>;
  goals: Goal[];
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
  fixedEntries: FixedEntry[];
  setFixedEntries: React.Dispatch<React.SetStateAction<FixedEntry[]>>;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  assets: Asset[];
  setAssets: React.Dispatch<React.SetStateAction<Asset[]>>;
  investments: Investment[];
  setInvestments: React.Dispatch<React.SetStateAction<Investment[]>>;
  monthConfigs: MonthConfig[];
  updateMonthConfig: (config: MonthConfig) => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('easyfinance_categories');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  const [cards, setCards] = useState<Card[]>(() => {
    const saved = localStorage.getItem('easyfinance_cards');
    return saved ? JSON.parse(saved) : [];
  });

  const [goals, setGoals] = useState<Goal[]>(() => {
    const saved = localStorage.getItem('easyfinance_goals');
    return saved ? JSON.parse(saved) : [];
  });

  const [fixedEntries, setFixedEntries] = useState<FixedEntry[]>(() => {
    const saved = localStorage.getItem('easyfinance_fixed');
    return saved ? JSON.parse(saved) : [];
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('easyfinance_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [assets, setAssets] = useState<Asset[]>(() => {
    const saved = localStorage.getItem('easyfinance_assets');
    return saved ? JSON.parse(saved) : [];
  });

  const [investments, setInvestments] = useState<Investment[]>(() => {
    const saved = localStorage.getItem('easyfinance_investments');
    return saved ? JSON.parse(saved) : [];
  });

  const [monthConfigs, setMonthConfigs] = useState<MonthConfig[]>(() => {
    const saved = localStorage.getItem('easyfinance_monthconfigs');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => localStorage.setItem('easyfinance_categories', JSON.stringify(categories)), [categories]);
  useEffect(() => localStorage.setItem('easyfinance_cards', JSON.stringify(cards)), [cards]);
  useEffect(() => localStorage.setItem('easyfinance_goals', JSON.stringify(goals)), [goals]);
  useEffect(() => localStorage.setItem('easyfinance_fixed', JSON.stringify(fixedEntries)), [fixedEntries]);
  useEffect(() => localStorage.setItem('easyfinance_transactions', JSON.stringify(transactions)), [transactions]);
  useEffect(() => localStorage.setItem('easyfinance_assets', JSON.stringify(assets)), [assets]);
  useEffect(() => localStorage.setItem('easyfinance_investments', JSON.stringify(investments)), [investments]);
  useEffect(() => localStorage.setItem('easyfinance_monthconfigs', JSON.stringify(monthConfigs)), [monthConfigs]);

  const updateMonthConfig = (config: MonthConfig) => {
    setMonthConfigs(prev => {
      const idx = prev.findIndex(c => c.monthCode === config.monthCode);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = config;
        return copy;
      }
      return [...prev, config];
    });
  };

  return (
    <FinanceContext.Provider value={{
      categories, setCategories,
      cards, setCards,
      goals, setGoals,
      fixedEntries, setFixedEntries,
      transactions, setTransactions,
      assets, setAssets,
      investments, setInvestments,
      monthConfigs, updateMonthConfig
    }}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) throw new Error("useFinance must be used within FinanceProvider");
  return context;
};
