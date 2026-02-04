
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

// Helpers de mapeamento
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
    // Garante que MonthConfig tenha um ID único para o upsert se não tiver
    if (!newItem.id && newItem.month_code) {
      newItem.id = `${userId}_${newItem.month_code}`;
    }
    return newItem;
  });
};

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  // Refs para evitar loops de sincronização desnecessários
  const initialLoadRef = useRef(false);

  // Estados
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
    initialLoadRef.current = false;
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
    console.log("Mz Finance: Buscando dados remotos para", currentUser.email);
    
    try {
      const fetchTable = async (table: string) => {
        const { data, error } = await supabase.from(table).select('*').eq('user_id', currentUser.id);
        if (error) {
          console.error(`Erro ao carregar ${table}:`, error.message);
          return [];
        }
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

      if (txs.length > 0) setTransactions(mapToJS(txs));
      if (cats.length > 0) setCategories(mapToJS(cats));
      if (crds.length > 0) setCards(mapToJS(crds));
      if (gls.length > 0) setGoals(mapToJS(gls));
      if (fixed.length > 0) setFixedEntries(mapToJS(fixed));
      if (asts.length > 0) setAssets(mapToJS(asts));
      if (invs.length > 0) setInvestments(mapToJS(invs));
      if (mconfs.length > 0) setMonthConfigs(mapToJS(mconfs));
      
      console.log("Mz Finance: Dados carregados com sucesso. Prontos para sincronia.");
      initialLoadRef.current = true;
      setDataLoaded(true);
    } catch (err) {
      console.error("Erro crítico no carregamento:", err);
      setDataLoaded(true);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchData();
    } else {
      clearLocalStates();
    }
  }, [currentUser, fetchData, clearLocalStates]);

  const syncWithSupabase = async (table: string, data: any[]) => {
    // SÓ SINCRONIZA SE O CARREGAMENTO INICIAL TERMINOU
    if (!currentUser || !initialLoadRef.current || !supabase) return;
    
    setIsSyncing(true);
    try {
      const dataToSync = mapToDB(data, currentUser.id);
      
      if (dataToSync.length === 0) {
        // Se a lista local está vazia (ex: deletou tudo), precisamos refletir isso no banco.
        // O upsert não deleta. Em um sistema real, usaríamos um soft-delete ou sincronização de estado.
        // Para este MVP, vamos apenas registrar que o upsert não será chamado para listas vazias.
        setIsSyncing(false);
        return;
      }

      console.log(`Mz Finance: Sincronizando ${dataToSync.length} itens na tabela ${table}...`);
      
      const { error } = await supabase
        .from(table)
        .upsert(dataToSync, { onConflict: 'id' });

      if (error) {
        console.error(`Falha na sincronização de ${table}:`, error.message);
        // Opcional: Notificar o usuário que a conexão falhou
      } else {
        console.log(`Mz Finance: Tabela ${table} atualizada na nuvem.`);
      }
    } catch (err) {
      console.error(`Erro inesperado ao sincronizar ${table}:`, err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Efeitos de Sincronização Automática (Debounced pela natureza do React useEffect)
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
