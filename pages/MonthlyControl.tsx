
import React, { useState, useMemo, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { PAYMENT_METHODS, INVESTMENT_TYPES } from '../constants';
import { useLanguage } from '../context/LanguageContext';
import { 
  Plus, Trash2, Pencil, ChevronLeft, ChevronRight, ChevronDown, 
  CheckCircle2, X, Calendar as CalendarIcon, Info, Target, 
  Wallet, ArrowUpCircle, ArrowDownCircle, Banknote, Landmark,
  TrendingUp, Tag as TagIcon
} from 'lucide-react';
import { Transaction, TransactionType, Category, Card, Goal, MonthConfig, Investment } from '../types';

const MONTH_CODES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const EMOJIS = ['🛒', '⚠️', '📱', '🐶', '👚', '💅', '🎁', '💊', '🤷', '🧠', '🚗', '🍽️', '🏖️', '🏠', '🧾', '📈', '🎓', '🤝', '💼', '💸', '🔁', '🚖', '🍕', '🍷', '🎮', '✈️', '🏋️', '📽️'];
const CARD_COLORS = ['#222222', '#FF385C', '#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

const MonthlyControl: React.FC = () => {
  const { 
    transactions, setTransactions, 
    categories, setCategories,
    cards, setCards,
    goals, setGoals,
    investments, setInvestments,
    monthConfigs, updateMonthConfig 
  } = useFinance();
  
  const { t, language } = useLanguage();
  const MONTH_NAMES = useMemo(() => t('monthNames') as string[], [language, t]);
  
  const now = new Date();
  const [selMonthIdx, setSelMonthIdx] = useState(now.getMonth());
  const [selYear, setSelYear] = useState(now.getFullYear().toString());
  const currentMonthCode = `${MONTH_CODES[selMonthIdx]}-${selYear.slice(-2)}`;
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('Dinheiro');
  const [modalType, setModalType] = useState<TransactionType>('Despesa');
  const [modalCategoryId, setModalCategoryId] = useState('');
  
  const [quickAddType, setQuickAddType] = useState<'category' | 'card' | 'goal' | 'investment' | null>(null);

  const monthTransactions = useMemo(() => 
    transactions.filter(t => t.monthCode === currentMonthCode).sort((a, b) => b.day - a.day)
  , [transactions, currentMonthCode]);

  const stats = useMemo(() => {
    const res = monthTransactions.filter(t => t.type === 'Receita').reduce((acc, t) => acc + t.value, 0);
    const exp = monthTransactions.filter(t => t.type === 'Despesa').reduce((acc, t) => acc + t.value, 0);
    return { res, exp, balance: res - exp };
  }, [monthTransactions]);

  const config = useMemo(() => 
    monthConfigs.find(c => c.monthCode === currentMonthCode) || {
        monthCode: currentMonthCode, 
        income: stats.res, 
        needsPercent: 50, 
        desiresPercent: 30, 
        savingsPercent: 20
    }
  , [monthConfigs, currentMonthCode, stats.res]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat(language === 'pt' ? 'pt-BR' : 'en-US', { 
        style: 'currency', 
        currency: language === 'pt' ? 'BRL' : 'USD' 
    }).format(val);

  const handleUpdateConfig = (key: keyof MonthConfig, val: number) => {
    const others = (key === 'needsPercent' ? 0 : config.needsPercent) +
                   (key === 'desiresPercent' ? 0 : config.desiresPercent) +
                   (key === 'savingsPercent' ? 0 : config.savingsPercent);
    let newVal = Math.max(0, val);
    if (others + newVal > 100) newVal = 100 - others;
    updateMonthConfig({ ...config, [key]: newVal });
  };

  const handleTogglePaid = (tx: Transaction) => {
    const newPaidStatus = !tx.paid;
    // Format must be YYYY-MM-DD for database
    const today = new Date().toISOString().split('T')[0];
    setTransactions(prev => prev.map(t => t.id === tx.id ? { 
      ...t, paid: newPaidStatus, paymentDate: newPaidStatus ? today : undefined 
    } : t));
  };

  const handleModalTypeChange = (type: TransactionType) => {
    setModalType(type);
    if (type === 'Receita') {
      const revenueCat = categories.find(c => c.isSystem && (c.name === 'Receita' || c.name === 'Revenue')) || 
                         categories.find(c => c.name.toLowerCase().includes('receita')) ||
                         categories.find(c => c.name.toLowerCase().includes('revenue'));
      if (revenueCat) {
        setModalCategoryId(revenueCat.id);
      }
    } else {
      const currentCat = categories.find(c => c.id === modalCategoryId);
      if (currentCat?.isSystem) {
        setModalCategoryId(categories.find(c => !c.isSystem)?.id || categories[0]?.id || '');
      }
    }
  };

  const handleOpenNewTransaction = () => {
    setEditingTransaction(null);
    setPaymentMethod('Dinheiro');
    setModalType('Despesa');
    setModalCategoryId(categories.find(c => !c.isSystem)?.id || categories[0]?.id || '');
    setIsModalOpen(true);
  };

  const handleSaveTransaction = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const isPaid = fd.get('paid') === 'on';
    const nt: Transaction = {
      id: editingTransaction ? editingTransaction.id : crypto.randomUUID(),
      monthCode: currentMonthCode,
      description: fd.get('description') as string,
      day: Number(fd.get('day')),
      type: modalType,
      value: Number(fd.get('value')),
      categoryId: modalCategoryId,
      paymentMethod: paymentMethod,
      cardId: fd.get('cardId') as string || undefined,
      goalId: fd.get('goalId') as string || undefined,
      investmentId: fd.get('investmentId') as string || undefined,
      paid: isPaid,
      paymentDate: isPaid ? (editingTransaction?.paymentDate || new Date().toISOString().split('T')[0]) : undefined,
      notes: fd.get('notes') as string || '',
    };
    if (editingTransaction) setTransactions(prev => prev.map(t => t.id === nt.id ? nt : t));
    else setTransactions(prev => [...prev, nt]);
    setIsModalOpen(false);
  };

  const handleQuickAddCategory = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const newCat: Category = {
      id: crypto.randomUUID(),
      name: fd.get('name') as string,
      icon: fd.get('icon') as string,
      subcategories: ''
    };
    setCategories(prev => [...prev, newCat]);
    setModalCategoryId(newCat.id);
    setQuickAddType(null);
  };

  const handleQuickAddCard = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const newCard: Card = {
      id: crypto.randomUUID(),
      name: fd.get('name') as string,
      bank: fd.get('bank') as string,
      limit: Number(fd.get('limit')),
      closingDay: Number(fd.get('closingDay')),
      color: fd.get('color') as string
    };
    setCards(prev => [...prev, newCard]);
    setQuickAddType(null);
  };

  const handleQuickAddGoal = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const newGoal: Goal = {
      id: crypto.randomUUID(),
      name: fd.get('name') as string,
      icon: fd.get('icon') as string,
      targetValue: Number(fd.get('targetValue')),
      savedValue: 0
    };
    setGoals(prev => [...prev, newGoal]);
    setQuickAddType(null);
  };

  const handleQuickAddInvestment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const newInv: Investment = {
      id: crypto.randomUUID(),
      type: fd.get('type') as any,
      broker: fd.get('broker') as string,
      value: Number(fd.get('value')),
      updatedAt: new Date().toISOString().split('T')[0],
      category: fd.get('category') as string
    };
    setInvestments(prev => [...prev, newInv]);
    setQuickAddType(null);
  };

  const totalAllocated = config.needsPercent + config.desiresPercent + config.savingsPercent;

  return (
    <div className="max-w-[1400px] mx-auto space-y-4 md:space-y-6 pb-24 lg:pb-12 px-1">
      {/* Selector and Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-fit group">
          <select 
            value={selYear} 
            onChange={(e) => setSelYear(e.target.value)} 
            className="appearance-none bg-white border border-gray-200 pl-4 pr-10 py-1.5 rounded-xl text-xs font-bold cursor-pointer outline-none w-full md:w-fit hover:border-black transition-colors shadow-sm"
          >
            {['2025', '2026', '2027', '2028'].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-black transition-colors" />
        </div>

        <div className="flex items-center justify-between w-full md:w-auto md:gap-8 font-black text-base md:text-lg">
          <button onClick={() => setSelMonthIdx(prev => Math.max(0, prev - 1))} className="p-1.5 hover:text-[#FF385C] transition-colors"><ChevronLeft size={20} /></button>
          <span className="min-w-[120px] text-center tracking-tight uppercase">{MONTH_NAMES[selMonthIdx]}</span>
          <button onClick={() => setSelMonthIdx(prev => Math.min(11, prev + 1))} className="p-1.5 hover:text-[#FF385C] transition-colors"><ChevronRight size={20} /></button>
        </div>
        
        <div className="hidden md:block w-32" />
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="airbnb-card p-4 border-l-4 border-l-green-500">
           <div className="flex justify-between items-start mb-0.5">
             <span className="text-[8px] font-black uppercase text-gray-400 tracking-[0.1em]">{t('revenues')}</span>
             <ArrowUpCircle className="text-green-500" size={14} />
           </div>
           <span className="text-base font-black text-green-600 block">{formatCurrency(stats.res)}</span>
        </div>
        <div className="airbnb-card p-4 border-l-4 border-l-red-500">
           <div className="flex justify-between items-start mb-0.5">
             <span className="text-[8px] font-black uppercase text-gray-400 tracking-[0.1em]">{t('expenses')}</span>
             <ArrowDownCircle className="text-red-500" size={14} />
           </div>
           <span className="text-base font-black text-red-600 block">{formatCurrency(stats.exp)}</span>
        </div>
        <div className="airbnb-card p-4 border-l-4 border-l-indigo-500">
           <div className="flex justify-between items-start mb-0.5">
             <span className="text-[8px] font-black uppercase text-gray-400 tracking-[0.1em]">{t('monthlyBalance')}</span>
             <Banknote className="text-indigo-500" size={14} />
           </div>
           <span className={`text-base font-black block ${stats.balance >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
             {formatCurrency(stats.balance)}
           </span>
        </div>
      </div>

      {/* Planning Section */}
      <div className="space-y-1.5">
        <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">{t('planner')}</h2>
        <div className="airbnb-card overflow-hidden">
          <div className="p-3">
            <div className="flex flex-col lg:flex-row items-center gap-6">
              <div className="flex flex-col gap-0.5 min-w-[140px]">
                <span className="text-[7px] font-black uppercase text-gray-400 tracking-[0.1em]">RENDA TOTAL</span>
                <div className="flex items-center gap-1.5">
                  <Landmark size={14} className="text-green-600" />
                  <span className="text-xl font-black text-gray-800 tracking-tighter">{formatCurrency(stats.res)}</span>
                </div>
                <div className={`mt-0.5 inline-block w-fit px-1.5 py-0.5 rounded-full border text-[6px] font-black uppercase tracking-widest ${totalAllocated === 100 ? 'bg-green-100 border-green-200 text-green-700' : 'bg-amber-100 border-amber-200 text-amber-700'}`}>
                  {totalAllocated}% ALOCADO
                </div>
              </div>
              <div className="hidden lg:block w-[1px] h-10 bg-gray-100" />
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                <div className="space-y-1">
                  <label className="text-[7px] font-black uppercase text-gray-400 block tracking-widest">{t('needs').toUpperCase()} (%)</label>
                  <div className="flex items-center gap-1">
                    <div className="bg-[#F9F9F9] border border-[#F0F0F0] rounded-lg px-2 py-1 flex items-center justify-between shadow-sm focus-within:ring-1 focus-within:ring-[#FF385C]/10 transition-all w-[60px] shrink-0 min-h-[38px]">
                      <input 
                        type="number" 
                        min="0" max="100"
                        value={config.needsPercent} 
                        onChange={(e) => handleUpdateConfig('needsPercent', Number(e.target.value))}
                        className="bg-transparent border-none p-0 text-[10px] font-black w-full text-center focus:ring-0"
                      />
                      <span className="text-gray-300 font-black text-[10px] ml-0.5">%</span>
                    </div>
                    <div className="bg-white border border-[#F0F0F0] rounded-lg px-2.5 py-1 font-black text-green-600 text-[15px] shadow-sm truncate flex items-center flex-1 min-h-[38px] tracking-tighter">
                      {formatCurrency(stats.res * (config.needsPercent / 100))}
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[7px] font-black uppercase text-gray-400 block tracking-widest">{t('savings').toUpperCase()} (%)</label>
                  <div className="flex items-center gap-1">
                    <div className="bg-[#F9F9F9] border border-[#F0F0F0] rounded-lg px-2 py-1 flex items-center justify-between shadow-sm focus-within:ring-1 focus-within:ring-[#FF385C]/10 transition-all w-[60px] shrink-0 min-h-[38px]">
                      <input 
                        type="number" 
                        min="0" max="100"
                        value={config.savingsPercent} 
                        onChange={(e) => handleUpdateConfig('savingsPercent', Number(e.target.value))}
                        className="bg-transparent border-none p-0 text-[10px] font-black w-full text-center focus:ring-0"
                      />
                      <span className="text-gray-300 font-black text-[10px] ml-0.5">%</span>
                    </div>
                    <div className="bg-white border border-[#F0F0F0] rounded-lg px-2.5 py-1 font-black text-green-600 text-[15px] shadow-sm truncate flex items-center flex-1 min-h-[38px] tracking-tighter">
                      {formatCurrency(stats.res * (config.savingsPercent / 100))}
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[7px] font-black uppercase text-gray-400 block tracking-widest">{t('wants').toUpperCase()} (%)</label>
                  <div className="flex items-center gap-1">
                    <div className="bg-[#F9F9F9] border border-[#F0F0F0] rounded-lg px-2 py-1 flex items-center justify-between shadow-sm focus-within:ring-1 focus-within:ring-[#FF385C]/10 transition-all w-[60px] shrink-0 min-h-[38px]">
                      <input 
                        type="number" 
                        min="0" max="100"
                        value={config.desiresPercent} 
                        onChange={(e) => handleUpdateConfig('desiresPercent', Number(e.target.value))}
                        className="bg-transparent border-none p-0 text-[10px] font-black w-full text-center focus:ring-0"
                      />
                      <span className="text-gray-300 font-black text-[10px] ml-0.5">%</span>
                    </div>
                    <div className="bg-white border border-[#F0F0F0] rounded-lg px-2.5 py-1 font-black text-green-600 text-[15px] shadow-sm truncate flex items-center flex-1 min-h-[38px] tracking-tighter">
                      {formatCurrency(stats.res * (config.desiresPercent / 100))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between ml-1">
          <div className="flex items-center gap-2">
             <Wallet size={16} className="text-gray-400" />
             <h2 className="text-sm font-black uppercase tracking-tight">{t('transactions')}</h2>
          </div>
          <button 
            onClick={handleOpenNewTransaction}
            className="primary-btn flex items-center gap-2 shadow-sm py-2 px-4"
          >
            <Plus size={16} /> <span className="text-[10px] uppercase tracking-tight">{t('newTransaction')}</span>
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {monthTransactions.map(tx => {
            const category = categories.find(c => c.id === tx.categoryId);
            const goal = goals.find(g => g.id === tx.goalId);
            const investment = investments.find(i => i.id === tx.investmentId);

            return (
              <div key={tx.id} className={`airbnb-card px-4 py-4 border-l-[3px] transition-all grid grid-cols-1 md:grid-cols-12 items-center gap-3 ${tx.paid ? 'bg-white opacity-95 shadow-sm' : 'bg-white shadow-md'} ${tx.type === 'Receita' ? 'border-l-green-500' : 'border-l-red-500'}`}>
                
                <div className="md:col-span-4 flex items-center gap-4 min-w-0">
                  <button 
                    onClick={() => handleTogglePaid(tx)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 ${tx.paid ? 'bg-green-100 text-green-600 border-2 border-green-200' : 'bg-gray-50 text-gray-200 border-2 border-dashed border-gray-100'}`}
                  >
                    <CheckCircle2 size={20} />
                  </button>
                  <h4 className="font-extrabold text-[17px] text-gray-800 truncate leading-tight tracking-tight">{tx.description}</h4>
                </div>

                <div className="md:col-span-5 flex flex-wrap items-center justify-center gap-3">
                  <div className="flex items-center gap-2 text-[15px] font-black text-green-600 bg-green-50/60 px-4 py-1.5 rounded-full border border-green-100">
                    <CalendarIcon size={16} className="shrink-0" />
                    <span>{tx.paymentDate || `Dia ${tx.day}`}</span>
                  </div>

                  {category && (
                    <div className="flex items-center gap-2 text-[15px] font-black uppercase text-gray-500 bg-gray-50 px-4 py-1.5 rounded-full border border-gray-100">
                      <TagIcon size={16} className="text-gray-400 shrink-0" />
                      <span className="flex items-center gap-2">{category.icon} {category.name}</span>
                    </div>
                  )}

                  {goal && (
                    <div className="flex items-center gap-2 text-[15px] font-black uppercase text-blue-500 bg-blue-50 px-4 py-1.5 rounded-full border border-blue-100">
                      <span>{goal.icon} {goal.name}</span>
                    </div>
                  )}
                </div>

                <div className="md:col-span-3 flex items-center justify-end gap-6">
                  <span className={`text-[15px] font-black whitespace-nowrap tracking-tight ${tx.type === 'Receita' ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.type === 'Receita' ? '+' : '-'} {formatCurrency(tx.value)}
                  </span>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 md:opacity-100 transition-opacity">
                    <button 
                      onClick={() => { setEditingTransaction(tx); setIsModalOpen(true); }} 
                      className="p-2 text-gray-300 hover:text-black transition-all rounded-lg hover:bg-gray-50"
                    >
                      <Pencil size={20} />
                    </button>
                    <button 
                      onClick={() => setTransactions(prev => prev.filter(t => t.id !== tx.id))} 
                      className="p-2 text-gray-300 hover:text-red-500 transition-all rounded-lg hover:bg-gray-50"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {monthTransactions.length === 0 && (
            <div className="py-12 text-center flex flex-col items-center gap-1.5 bg-gray-50/50 rounded-[20px] border-2 border-dashed border-gray-100">
              <Info size={24} className="text-gray-100" />
              <p className="text-gray-300 font-bold italic text-[10px]">{t('emptyTransactions')}</p>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-[32px] w-full max-w-xl p-8 md:p-10 shadow-2xl animate-in zoom-in duration-300 relative my-auto">
            <button onClick={() => setIsModalOpen(false)} className="absolute right-6 top-6 p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"><X size={24} /></button>
            <h2 className="text-[19px] font-black mb-6 tracking-tight">{editingTransaction ? t('editTransaction') : t('newTransaction')}</h2>
            
            <form onSubmit={handleSaveTransaction} className="space-y-6">
              <div className="flex bg-gray-100 p-1 rounded-xl mb-4">
                <button type="button" onClick={() => handleModalTypeChange('Despesa')} className={`flex-1 py-3 text-[11px] font-black rounded-lg transition-all ${modalType === 'Despesa' ? 'bg-white shadow-sm text-red-500' : 'text-gray-400 hover:text-gray-600'}`}>{t('expenses')}</button>
                <button type="button" onClick={() => handleModalTypeChange('Receita')} className={`flex-1 py-3 text-[11px] font-black rounded-lg transition-all ${modalType === 'Receita' ? 'bg-white shadow-sm text-green-600' : 'text-gray-400 hover:text-gray-600'}`}>{t('revenues')}</button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('description')}</label>
                  <input name="description" required defaultValue={editingTransaction?.description || ""} className="font-bold py-3 px-5 text-[13px] min-h-[50px]" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('day')}</label>
                  <input name="day" type="number" min="1" max="31" required defaultValue={editingTransaction?.day || now.getDate()} className="font-bold py-3 px-5 text-[13px] text-center min-h-[50px]" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('value')}</label>
                  <input name="value" type="number" step="0.01" required defaultValue={editingTransaction?.value || ""} className="font-black text-[13px] py-3 px-5 min-h-[50px]" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('category')}</label>
                  <div className="flex gap-2">
                    <select name="categoryId" required value={modalCategoryId} onChange={(e) => setModalCategoryId(e.target.value)} className="font-bold py-3 px-5 text-[13px] flex-1 min-h-[50px] appearance-none">
                      {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>)}
                    </select>
                    <button type="button" onClick={() => setQuickAddType('category')} className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-gray-400 hover:text-black shrink-0 transition-colors">
                      <Plus size={20} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('paymentMethod')}</label>
                  <select name="paymentMethod" required value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="font-bold py-3 px-5 text-[13px] min-h-[50px] appearance-none">
                    {PAYMENT_METHODS.map(m => <option key={m} value={m}>{t(m)}</option>)}
                  </select>
                </div>
                {paymentMethod === 'Crédito' && (
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('card')}</label>
                    <div className="flex gap-2">
                      <select name="cardId" defaultValue={editingTransaction?.cardId || ""} className="flex-1 py-3 px-5 text-[13px] min-h-[50px] appearance-none">
                        <option value="">{t('select')}</option>
                        {cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <button type="button" onClick={() => setQuickAddType('card')} className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-gray-400 hover:text-black shrink-0 transition-colors">
                        <Plus size={20} />
                      </button>
                    </div>
                  </div>
                )}
                {modalType === 'Receita' && (
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('goals')}</label>
                    <div className="flex gap-2">
                      <select name="goalId" defaultValue={editingTransaction?.goalId || ""} className="flex-1 py-3 px-5 text-[13px] min-h-[50px] appearance-none">
                        <option value="">{t('none')}</option>
                        {goals.map(g => <option key={g.id} value={g.id}>{g.icon} {g.name}</option>)}
                      </select>
                      <button type="button" onClick={() => setQuickAddType('goal')} className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-gray-400 hover:text-black shrink-0 transition-colors">
                        <Plus size={20} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('investments')}</label>
                <div className="flex gap-2">
                  <select name="investmentId" defaultValue={editingTransaction?.investmentId || ""} className="flex-1 font-bold py-3 px-5 text-[13px] min-h-[50px] appearance-none">
                    <option value="">{t('none')}</option>
                    {investments.map(inv => <option key={inv.id} value={inv.id}>{inv.type} - {inv.broker} ({formatCurrency(inv.value)})</option>)}
                  </select>
                  <button type="button" onClick={() => setQuickAddType('investment')} className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-gray-400 hover:text-black shrink-0 transition-colors">
                    <Plus size={20} />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors">
                <input type="checkbox" name="paid" id="paidCheck" defaultChecked={editingTransaction?.paid || false} className="w-6 h-6 rounded accent-[#FF385C]" />
                <label htmlFor="paidCheck" className="text-[11px] font-black text-gray-600 flex-1 cursor-pointer">{t('alreadyPaid')}</label>
              </div>

              <button type="submit" className="primary-btn w-full py-4 text-[13px] mt-2 shadow-xl active:scale-95 transition-all">{t('save')}</button>
            </form>
          </div>
        </div>
      )}

      {/* Quick Add Sub-Modals */}
      {quickAddType && (
        <div className="fixed inset-0 bg-black/70 z-[110] flex items-center justify-center p-4 backdrop-blur-md overflow-y-auto">
          <div className="bg-white rounded-[20px] w-full max-w-xs p-6 shadow-2xl animate-in zoom-in duration-300 relative my-auto">
            <button onClick={() => setQuickAddType(null)} className="absolute right-4 top-4 p-1 hover:bg-gray-100 rounded-full text-gray-400"><X size={16} /></button>
            <h3 className="text-sm font-black mb-3">Novo {quickAddType}</h3>

            {quickAddType === 'category' && (
              <form onSubmit={handleQuickAddCategory} className="space-y-2">
                <div className="space-y-0.5"><label className="text-[7px] font-black text-gray-400 uppercase">Nome</label><input name="name" required className="font-bold py-1.5 px-3 text-xs" /></div>
                <div className="space-y-0.5">
                  <label className="text-[7px] font-black text-gray-400 uppercase">Ícone</label>
                  <div className="flex flex-wrap gap-1 p-1.5 bg-gray-50 rounded-lg max-h-[60px] overflow-y-auto">
                    {EMOJIS.map(e => (
                      <label key={e} className="cursor-pointer">
                        <input type="radio" name="icon" value={e} required className="hidden peer" />
                        <span className="w-6 h-6 flex items-center justify-center rounded-md bg-white peer-checked:bg-black peer-checked:text-white shadow-sm text-xs">{e}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <button type="submit" className="primary-btn w-full py-2 text-xs mt-1">Salvar</button>
              </form>
            )}

            {quickAddType === 'card' && (
              <form onSubmit={handleQuickAddCard} className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-0.5"><label className="text-[7px] font-black text-gray-400 uppercase">Nome</label><input name="name" required className="font-bold py-1.5 px-3 text-xs" /></div>
                  <div className="space-y-0.5"><label className="text-[7px] font-black text-gray-400 uppercase">Banco</label><input name="bank" required className="font-bold py-1.5 px-3 text-xs" /></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-0.5"><label className="text-[7px] font-black text-gray-400 uppercase">Limite</label><input name="limit" type="number" step="0.01" required className="font-bold py-1.5 px-3 text-xs" /></div>
                  <div className="space-y-0.5"><label className="text-[7px] font-black text-gray-400 uppercase">Fechamento</label><input name="closingDay" type="number" min="1" max="31" defaultValue="10" required className="font-bold py-1.5 px-3 text-xs text-center" /></div>
                </div>
                <div className="space-y-0.5">
                  <label className="text-[7px] font-black text-gray-400 uppercase">Cor</label>
                  <div className="flex flex-wrap gap-1 p-1.5 bg-gray-50 rounded-lg">
                    {CARD_COLORS.map(c => (
                      <label key={c} className="cursor-pointer">
                        <input type="radio" name="color" value={c} required className="hidden peer" />
                        <span className="w-5 h-5 rounded-full block border-2 border-transparent peer-checked:border-black peer-checked:scale-110 shadow-sm" style={{ backgroundColor: c }}></span>
                      </label>
                    ))}
                  </div>
                </div>
                <button type="submit" className="primary-btn w-full py-2 text-xs mt-1">Salvar</button>
              </form>
            )}

            {quickAddType === 'goal' && (
              <form onSubmit={handleQuickAddGoal} className="space-y-2">
                <div className="space-y-0.5"><label className="text-[7px] font-black text-gray-400 uppercase">Nome da Meta</label><input name="name" required className="font-bold py-1.5 px-3 text-xs" /></div>
                <div className="space-y-0.5">
                  <label className="text-[7px] font-black text-gray-400 uppercase">Ícone</label>
                  <div className="flex flex-wrap gap-1 p-1.5 bg-gray-50 rounded-lg max-h-[60px] overflow-y-auto">
                    {EMOJIS.map(e => (
                      <label key={e} className="cursor-pointer">
                        <input type="radio" name="icon" value={e} required className="hidden peer" />
                        <span className="w-6 h-6 flex items-center justify-center rounded-md bg-white peer-checked:bg-black peer-checked:text-white shadow-sm text-xs">{e}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-0.5"><label className="text-[7px] font-black text-gray-400 uppercase">Valor Alvo</label><input name="targetValue" type="number" step="0.01" required className="font-bold py-1.5 px-3 text-xs" /></div>
                <button type="submit" className="primary-btn w-full py-2 text-xs mt-1">Salvar</button>
              </form>
            )}

            {quickAddType === 'investment' && (
              <form onSubmit={handleQuickAddInvestment} className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-0.5"><label className="text-[7px] font-black text-gray-400 uppercase">Tipo</label><select name="type" required className="font-bold py-1.5 px-3 text-[10px]">{INVESTMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                  <div className="space-y-0.5"><label className="text-[7px] font-black text-gray-400 uppercase">Corretora</label><input name="broker" required className="font-bold py-1.5 px-3 text-xs" /></div>
                </div>
                <div className="space-y-0.5"><label className="text-[7px] font-black text-gray-400 uppercase">Ativo / Código</label><input name="category" required placeholder="Ex: PETR4" className="font-bold py-1.5 px-3 text-xs" /></div>
                <div className="space-y-0.5"><label className="text-[7px] font-black text-gray-400 uppercase">Valor do Aporte</label><input name="value" type="number" step="0.01" required className="font-bold py-1.5 px-3 text-xs" /></div>
                <button type="submit" className="primary-btn w-full py-2 text-xs mt-1">Salvar</button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthlyControl;
