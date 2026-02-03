
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  isLoading: boolean;
  isSyncing: boolean;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // States
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
      // Se não houver supabase, marcamos como carregado para permitir uso local
      setDataLoaded(true);
      return;
    }
    
    setIsLoading(true);
    try {
      const [
        { data: txs }, 
        { data: cats }, 
        { data: crds }, 
        { data: gls }, 
        { data: fixed }, 
        { data: asts }, 
        { data: invs }, 
        { data: mconfs }
      ] = await Promise.all([
        supabase.from('transactions').select('*').eq('user_id', currentUser.id),
        supabase.from('categories').select('*').eq('user_id', currentUser.id),
        supabase.from('cards').select('*').eq('user_id', currentUser.id),
        supabase.from('goals').select('*').eq('user_id', currentUser.id),
        supabase.from('fixed_entries').select('*').eq('user_id', currentUser.id),
        supabase.from('assets').select('*').eq('user_id', currentUser.id),
        supabase.from('investments').select('*').eq('user_id', currentUser.id),
        supabase.from('month_configs').select('*').eq('user_id', currentUser.id),
      ]);

      if (txs) setTransactions(txs);
      if (cats && cats.length > 0) setCategories(cats);
      if (crds) setCards(crds);
      if (gls) setGoals(gls);
      if (fixed) setFixedEntries(fixed);
      if (asts) setAssets(asts);
      if (invs) setInvestments(invs);
      if (mconfs) setMonthConfigs(mconfs);
      
      setDataLoaded(true);
    } catch (err) {
      console.error("Erro ao buscar dados do Supabase:", err);
      setDataLoaded(true); // Permite uso local mesmo com erro
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      clearLocalStates();
      fetchData();
    } else {
      clearLocalStates();
    }
  }, [currentUser, fetchData, clearLocalStates]);

  const syncWithSupabase = async (table: string, data: any[]) => {
    if (!currentUser || !dataLoaded || !supabase) return;
    
    setIsSyncing(true);
    try {
      await supabase.from(table).delete().eq('user_id', currentUser.id);
      
      if (data.length > 0) {
        const dataToInsert = data.map(item => ({ 
          ...item, 
          user_id: currentUser.id 
        }));
        await supabase.from(table).insert(dataToInsert);
      }
    } catch (err) {
      console.error(`Erro ao sincronizar tabela ${table}:`, err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => { if (dataLoaded) syncWithSupabase('transactions', transactions); }, [transactions, dataLoaded]);
  useEffect(() => { if (dataLoaded) syncWithSupabase('categories', categories); }, [categories, dataLoaded]);
  useEffect(() => { if (dataLoaded) syncWithSupabase('cards', cards); }, [cards, dataLoaded]);
  useEffect(() => { if (dataLoaded) syncWithSupabase('goals', goals); }, [goals, dataLoaded]);
  useEffect(() => { if (dataLoaded) syncWithSupabase('fixed_entries', fixedEntries); }, [fixedEntries, dataLoaded]);
  useEffect(() => { if (dataLoaded) syncWithSupabase('assets', assets); }, [assets, dataLoaded]);
  useEffect(() => { if (dataLoaded) syncWithSupabase('investments', investments); }, [investments, dataLoaded]);
  useEffect(() => { if (dataLoaded) syncWithSupabase('month_configs', monthConfigs); }, [monthConfigs, dataLoaded]);

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
      monthConfigs, updateMonthConfig,
      isLoading,
      isSyncing
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
