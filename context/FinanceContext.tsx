
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { 
  Transaction, Category, Card, Goal, FixedEntry, 
  Asset, Investment, MonthConfig 
} from '../types';
import { DEFAULT_CATEGORIES } from '../constants';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface FinanceContextType {
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  deleteCategory: (id: string) => Promise<void>;
  cards: Card[];
  setCards: React.Dispatch<React.SetStateAction<Card[]>>;
  deleteCard: (id: string) => Promise<void>;
  goals: Goal[];
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
  deleteGoal: (id: string) => Promise<void>;
  fixedEntries: FixedEntry[];
  setFixedEntries: React.Dispatch<React.SetStateAction<FixedEntry[]>>;
  deleteFixedEntry: (id: string) => Promise<void>;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  deleteTransaction: (id: string) => Promise<void>;
  assets: Asset[];
  setAssets: React.Dispatch<React.SetStateAction<Asset[]>>;
  deleteAsset: (id: string) => Promise<void>;
  investments: Investment[];
  setInvestments: React.Dispatch<React.SetStateAction<Investment[]>>;
  deleteInvestment: (id: string) => Promise<void>;
  monthConfigs: MonthConfig[];
  updateMonthConfig: (config: MonthConfig) => void;
  isLoading: boolean;
  isSyncing: boolean;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const snakeToCamel = (str: string) => str.replace(/(_\w)/g, m => m[1].toUpperCase());
const camelToSnake = (str: string) => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

const mapToJS = (data: any[] | null) => {
  if (!data) return [];
  return data.map(item => {
    const newItem: any = {};
    for (let key in item) {
      newItem[snakeToCamel(key)] = item[key];
    }
    return newItem;
  });
};

const mapToDB = (data: any[], userId: string) => {
  return data.map(item => {
    const newItem: any = {};
    for (let key in item) {
      newItem[camelToSnake(key)] = item[key];
    }
    newItem.user_id = userId;
    if (!newItem.id && newItem.month_code) {
      newItem.id = `mconf_${userId}_${newItem.month_code}`;
    }
    return newItem;
  });
};

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const isInitialLoadDone = useRef(false);

  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [cards, setCards] = useState<Card[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [fixedEntries, setFixedEntries] = useState<FixedEntry[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [monthConfigs, setMonthConfigs] = useState<MonthConfig[]>([]);

  const clearLocalStates = useCallback(() => {
    setDataLoaded(false);
    isInitialLoadDone.current = false;
    setTransactions([]);
    setCategories(DEFAULT_CATEGORIES);
    setCards([]);
    setGoals([]);
    setFixedEntries([]);
    setAssets([]);
    setInvestments([]);
    setMonthConfigs([]);
  }, []);

  const fetchData = useCallback(async () => {
    if (!currentUser || !supabase) {
      setDataLoaded(true);
      return;
    }
    setIsLoading(true);
    try {
      const fetchTable = async (table: string) => {
        const { data, error } = await supabase.from(table).select('*').eq('user_id', currentUser.id);
        if (error) throw error;
        return data || [];
      };
      const [txs, cats, crds, gls, fixed, asts, invs, mconfs] = await Promise.all([
        fetchTable('transactions'),
        fetchTable('categories'),
        fetchTable('cards'),
        fetchTable('goals'),
        fetchTable('fixed_entries'),
        fetchTable('assets'),
        fetchTable('investments'),
        fetchTable('month_configs'),
      ]);
      setTransactions(mapToJS(txs));
      setCategories(cats.length ? mapToJS(cats) : DEFAULT_CATEGORIES);
      setCards(mapToJS(crds));
      setGoals(mapToJS(gls));
      setFixedEntries(mapToJS(fixed));
      setAssets(mapToJS(asts));
      setInvestments(mapToJS(invs));
      setMonthConfigs(mapToJS(mconfs));
      isInitialLoadDone.current = true;
      setDataLoaded(true);
    } catch (err) {
      console.error("Mz Finance: Erro ao carregar dados:", err);
      isInitialLoadDone.current = true;
      setDataLoaded(true);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) fetchData();
    else clearLocalStates();
  }, [currentUser, fetchData, clearLocalStates]);

  const syncWithSupabase = async (table: string, data: any[]) => {
    if (!currentUser || !isInitialLoadDone.current || !supabase) return;
    setIsSyncing(true);
    try {
      const dataToSync = mapToDB(data, currentUser.id);
      if (dataToSync.length > 0) {
        const { error } = await supabase.from(table).upsert(dataToSync, { onConflict: 'id' });
        if (error) throw error;
      }
    } catch (err) {
      console.error(`Mz Finance: Erro ao sincronizar ${table}:`, err);
    } finally {
      setIsSyncing(false);
    }
  };

  const deleteItem = async (table: string, id: string, setter: React.Dispatch<React.SetStateAction<any[]>>) => {
    setter(prev => prev.filter(item => item.id !== id));
    if (currentUser && supabase) {
      try {
        const { error } = await supabase.from(table).delete().eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.error(`Erro ao deletar de ${table}:`, err);
      }
    }
  };

  const deleteTransaction = (id: string) => deleteItem('transactions', id, setTransactions);
  const deleteGoal = (id: string) => deleteItem('goals', id, setGoals);
  const deleteCategory = (id: string) => deleteItem('categories', id, setCategories);
  const deleteCard = (id: string) => deleteItem('cards', id, setCards);
  const deleteFixedEntry = (id: string) => deleteItem('fixed_entries', id, setFixedEntries);
  const deleteAsset = (id: string) => deleteItem('assets', id, setAssets);
  const deleteInvestment = (id: string) => deleteItem('investments', id, setInvestments);

  useEffect(() => { syncWithSupabase('transactions', transactions); }, [transactions]);
  useEffect(() => { syncWithSupabase('categories', categories); }, [categories]);
  useEffect(() => { syncWithSupabase('cards', cards); }, [cards]);
  useEffect(() => { syncWithSupabase('goals', goals); }, [goals]);
  useEffect(() => { syncWithSupabase('fixed_entries', fixedEntries); }, [fixedEntries]);
  useEffect(() => { syncWithSupabase('assets', assets); }, [assets]);
  useEffect(() => { syncWithSupabase('investments', investments); }, [investments]);
  useEffect(() => { syncWithSupabase('month_configs', monthConfigs); }, [monthConfigs]);

  const updateMonthConfig = (config: MonthConfig) => {
    setMonthConfigs(prev => {
      const idx = prev.findIndex(c => c.monthCode === config.monthCode);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...prev[idx], ...config };
        return copy;
      }
      return [...prev, config];
    });
  };

  return (
    <FinanceContext.Provider value={{
      categories, setCategories, deleteCategory,
      cards, setCards, deleteCard,
      goals, setGoals, deleteGoal,
      fixedEntries, setFixedEntries, deleteFixedEntry,
      transactions, setTransactions, deleteTransaction,
      assets, setAssets, deleteAsset,
      investments, setInvestments, deleteInvestment,
      monthConfigs, updateMonthConfig,
      isLoading, isSyncing
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
