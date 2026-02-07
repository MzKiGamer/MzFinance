
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { 
  Transaction, Category, Card, Goal, FixedEntry, 
  Asset, Investment, MonthConfig 
} from '../types';
import { DEFAULT_CATEGORIES } from '../constants';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const MONTH_CODES_LIST = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

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
  applyFixedEntries: (monthCode: string) => Promise<void>;
  assets: Asset[];
  saveAsset: (asset: Asset) => Promise<void>;
  deleteAsset: (id: string) => Promise<void>;
  investments: Investment[];
  saveInvestment: (investment: Investment) => Promise<void>;
  deleteInvestment: (id: string) => Promise<void>;
  monthConfigs: MonthConfig[];
  updateMonthConfig: (config: MonthConfig) => Promise<void>;
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

const mapToDBItem = (item: any, userId: string, table: string) => {
  const newItem: any = {};
  for (let key in item) {
    const snakeKey = camelToSnake(key);
    if (table === 'fixed_entries' && snakeKey === 'notes') continue;
    newItem[snakeKey] = item[key];
  }
  newItem.user_id = userId;
  return newItem;
};

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const appliedMonthsRef = useRef<Set<string>>(new Set());
  
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
      
      const fetchedCats = mapToJS(cats);
      const combinedCats = [...DEFAULT_CATEGORIES];
      fetchedCats.forEach(fc => {
        if (!combinedCats.find(c => c.id === fc.id)) combinedCats.push(fc);
      });
      setCategories(combinedCats);

      setCards(mapToJS(crds));
      setGoals(mapToJS(gls));
      setFixedEntries(mapToJS(fixed));
      setAssets(mapToJS(asts));
      setInvestments(mapToJS(invs));
      setMonthConfigs(mapToJS(mconfs));
    } catch (err) {
      console.error("Mz Finance Load Error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchData();
      appliedMonthsRef.current.clear();
    }
  }, [currentUser, fetchData]);

  const saveItem = async (table: string, item: any, setter: React.Dispatch<React.SetStateAction<any[]>>) => {
    if (!currentUser || !supabase) return;
    setIsSyncing(true);
    try {
      const dbItem = mapToDBItem(item, currentUser.id, table);
      const { error } = await supabase.from(table).upsert(dbItem, { onConflict: 'id' });
      if (error) throw error;
      
      setter(prev => {
        const exists = prev.find(i => i.id === item.id);
        if (exists) return prev.map(i => i.id === item.id ? item : i);
        return [...prev, item];
      });
    } catch (err: any) {
      console.error(`Error saving to ${table}:`, err);
      alert(`Falha ao salvar: ${err.message || "Erro desconhecido"}`);
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

  const applyFixedEntries = async (monthCode: string) => {
    // Verificações de bloqueio iniciais
    if (!currentUser || !supabase || isLoading || fixedEntries.length === 0) return;
    if (appliedMonthsRef.current.has(monthCode)) return;

    // 1. Verificar se é um mês passado
    const [mStr, yStr] = monthCode.split('-');
    const monthYear = 2000 + parseInt(yStr);
    const monthIndex = MONTH_CODES_LIST.indexOf(mStr);
    const targetDate = new Date(monthYear, monthIndex, 1);
    const now = new Date();
    const currentFirstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    if (targetDate < currentFirstOfMonth) {
      appliedMonthsRef.current.add(monthCode);
      return;
    }

    // 2. Verificar se já existe registro no MonthConfig ou se já existem transações fixas no estado local
    const config = monthConfigs.find(c => c.monthCode === monthCode);
    const hasFixedAlready = transactions.some(tx => tx.monthCode === monthCode && tx.isFixed);
    
    if (config?.fixedApplied || hasFixedAlready) {
      appliedMonthsRef.current.add(monthCode);
      return;
    }

    // Inicia processo de aplicação
    appliedMonthsRef.current.add(monthCode); // Bloqueio imediato para evitar race condition
    setIsSyncing(true);

    const newTxs: Transaction[] = fixedEntries
      .filter(f => f.active)
      .map(fixed => ({
        id: crypto.randomUUID(),
        monthCode: monthCode,
        description: fixed.description,
        day: fixed.day,
        type: fixed.type,
        value: fixed.value,
        categoryId: fixed.categoryId,
        paymentMethod: fixed.paymentMethod,
        paid: false,
        isFixed: true,
        notes: ''
      }));

    if (newTxs.length > 0) {
      try {
        const dbItems = newTxs.map(tx => mapToDBItem(tx, currentUser.id, 'transactions'));
        const { error } = await supabase.from('transactions').insert(dbItems);
        if (error) throw error;
        
        setTransactions(prev => [...prev, ...newTxs]);
        
        // Registrar aplicação no MonthConfig
        const updatedConfig: MonthConfig = config 
          ? { ...config, fixedApplied: true }
          : { monthCode, income: 0, needsPercent: 50, desiresPercent: 30, savingsPercent: 20, fixedApplied: true };
          
        await updateMonthConfig(updatedConfig);
      } catch (err) {
        console.error("Erro ao aplicar gastos fixos:", err);
        appliedMonthsRef.current.delete(monthCode); // Libera o bloqueio se falhar
      } finally {
        setIsSyncing(false);
      }
    } else {
      // Se não houver itens fixos para aplicar, marcamos como feito
      if (config && !config.fixedApplied) {
         await updateMonthConfig({ ...config, fixedApplied: true });
      }
      setIsSyncing(false);
    }
  };

  const updateMonthConfig = async (config: MonthConfig) => {
    if (!currentUser || !supabase) return;
    const configId = config.id || `mconf_${currentUser.id}_${config.monthCode}`;
    const configToSave = { ...config, id: configId };
    
    const dbItem = mapToDBItem(configToSave, currentUser.id, 'month_configs');
    await supabase.from('month_configs').upsert(dbItem, { onConflict: 'id' });
    
    setMonthConfigs(prev => {
      const idx = prev.findIndex(c => c.monthCode === config.monthCode);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = configToSave;
        return copy;
      }
      return [...prev, configToSave];
    });
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

  return (
    <FinanceContext.Provider value={{
      categories, saveCategory, deleteCategory,
      cards, saveCard, deleteCard,
      goals, saveGoal, deleteGoal,
      fixedEntries, saveFixedEntry, deleteFixedEntry,
      transactions, saveTransaction, setTransactions, deleteTransaction,
      applyFixedEntries,
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
