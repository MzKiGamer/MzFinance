
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
  saveCategory: (category: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  cards: Card[];
  saveCard: (card: Card) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  goals: Goal[];
  saveGoal: (goal: Goal) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  fixedEntries: FixedEntry[];
  saveFixedEntry: (fixed: FixedEntry) => Promise<void>;
  deleteFixedEntry: (id: string) => Promise<void>;
  transactions: Transaction[];
  saveTransaction: (tx: Transaction) => Promise<void>;
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  deleteTransaction: (id: string) => Promise<void>;
  assets: Asset[];
  saveAsset: (asset: Asset) => Promise<void>;
  deleteAsset: (id: string) => Promise<void>;
  investments: Investment[];
  saveInvestment: (investment: Investment) => Promise<void>;
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

const mapToDBItem = (item: any, userId: string) => {
  const newItem: any = {};
  for (let key in item) {
    newItem[camelToSnake(key)] = item[key];
  }
  newItem.user_id = userId;
  if (!newItem.id && newItem.month_code) {
    newItem.id = `mconf_${userId}_${newItem.month_code}`;
  }
  return newItem;
};

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const isInitialLoadDone = useRef(false);

  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [cards, setCards] = useState<Card[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [fixedEntries, setFixedEntries] = useState<FixedEntry[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [monthConfigs, setMonthConfigs] = useState<MonthConfig[]>([]);

  const fetchData = useCallback(async () => {
    if (!currentUser || !supabase) return;
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
      
      // Lógica de Mesclagem de Categorias: Garante que as categorias do sistema (DEFAULT_CATEGORIES)
      // sempre existam, mesmo que não estejam no banco de dados.
      const fetchedCats = mapToJS(cats);
      const combinedCats = [...DEFAULT_CATEGORIES];
      fetchedCats.forEach(fc => {
        if (!combinedCats.find(c => c.id === fc.id)) {
          combinedCats.push(fc);
        }
      });
      setCategories(combinedCats);

      setCards(mapToJS(crds));
      setGoals(mapToJS(gls));
      setFixedEntries(mapToJS(fixed));
      setAssets(mapToJS(asts));
      setInvestments(mapToJS(invs));
      setMonthConfigs(mapToJS(mconfs));
      isInitialLoadDone.current = true;
    } catch (err) {
      console.error("Mz Finance Load Error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) fetchData();
  }, [currentUser, fetchData]);

  const saveItem = async (table: string, item: any, setter: React.Dispatch<React.SetStateAction<any[]>>) => {
    if (!currentUser || !supabase) return;
    setIsSyncing(true);
    try {
      const dbItem = mapToDBItem(item, currentUser.id);
      const { error } = await supabase.from(table).upsert(dbItem, { onConflict: 'id' });
      if (error) throw error;
      
      setter(prev => {
        const exists = prev.find(i => i.id === item.id);
        if (exists) return prev.map(i => i.id === item.id ? item : i);
        return [...prev, item];
      });
    } catch (err) {
      console.error(`Error saving to ${table}:`, err);
      alert("Erro ao salvar dados. Verifique sua conexão.");
    } finally {
      setIsSyncing(false);
    }
  };

  const deleteItem = async (table: string, id: string, setter: React.Dispatch<React.SetStateAction<any[]>>) => {
    if (!currentUser || !supabase) return;
    setter(prev => prev.filter(i => i.id !== id));
    try {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error(`Error deleting from ${table}:`, err);
    }
  };

  const saveTransaction = (tx: Transaction) => saveItem('transactions', tx, setTransactions);
  const saveCategory = (cat: Category) => saveItem('categories', cat, setCategories);
  const saveCard = (card: Card) => saveItem('cards', card, setCards);
  const saveGoal = (goal: Goal) => saveItem('goals', goal, setGoals);
  const saveFixedEntry = (fixed: FixedEntry) => saveItem('fixed_entries', fixed, setFixedEntries);
  const saveAsset = (asset: Asset) => saveItem('assets', asset, setAssets);
  const saveInvestment = (inv: Investment) => saveItem('investments', inv, setInvestments);

  const deleteTransaction = (id: string) => deleteItem('transactions', id, setTransactions);
  const deleteCategory = (id: string) => deleteItem('categories', id, setCategories);
  const deleteCard = (id: string) => deleteItem('cards', id, setCards);
  const deleteGoal = (id: string) => deleteItem('goals', id, setGoals);
  const deleteFixedEntry = (id: string) => deleteItem('fixed_entries', id, setFixedEntries);
  const deleteAsset = (id: string) => deleteItem('assets', id, setAssets);
  const deleteInvestment = (id: string) => deleteItem('investments', id, setInvestments);

  const updateMonthConfig = async (config: MonthConfig) => {
    if (!currentUser || !supabase) return;
    const dbItem = mapToDBItem(config, currentUser.id);
    await supabase.from('month_configs').upsert(dbItem, { onConflict: 'id' });
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
      categories, saveCategory, deleteCategory,
      cards, saveCard, deleteCard,
      goals, saveGoal, deleteGoal,
      fixedEntries, saveFixedEntry, deleteFixedEntry,
      transactions, saveTransaction, setTransactions, deleteTransaction,
      assets, saveAsset, deleteAsset,
      investments, saveInvestment, deleteInvestment,
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
