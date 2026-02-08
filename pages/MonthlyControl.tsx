
import React, { useState, useMemo, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { PAYMENT_METHODS } from '../constants';
import { useLanguage } from '../context/LanguageContext';
import { 
  Plus, Trash2, Pencil, ChevronLeft, ChevronRight, ChevronDown, 
  CheckCircle2, X, Calendar as CalendarIcon, Info, Target, 
  Wallet, ArrowUpCircle, ArrowDownCircle, Banknote, Landmark,
  Tag as TagIcon, Repeat, CreditCard
} from 'lucide-react';
import { Transaction, TransactionType, Category, Card, Goal, MonthConfig } from '../types';

const MONTH_CODES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const EMOJIS = ['🛒', '⚠️', '📱', '🐶', '👚', '💅', '🎁', '💊', '🤷', '🧠', '🚗', '🍽️', '🏖️', '🏠', '🧾', '📈', '🎓', '🤝', '💼', '💸', '🔁', '🚖', '🍕', '🍷', '🎮', '✈️', '🏋️', '📽️'];
const CARD_COLORS = ['#222222', '#FF385C', '#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

const MonthlyControl: React.FC = () => {
  const { 
    transactions, saveTransaction, 
    deleteTransaction,
    categories, saveCategory,
    cards, saveCard,
    goals, saveGoal,
    monthConfigs, updateMonthConfig,
    applyFixedEntries,
    isLoading,
    isSyncing
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
  const [modalGoalId, setModalGoalId] = useState('');
  const [modalCardId, setModalCardId] = useState('');
  
  const [quickAddType, setQuickAddType] = useState<'category' | 'card' | 'goal' | null>(null);

  useEffect(() => {
    if (!isLoading && !isSyncing) {
       applyFixedEntries(currentMonthCode);
    }
  }, [currentMonthCode, applyFixedEntries, isLoading, isSyncing]);

  const monthTransactions = useMemo(() => 
    transactions.filter(t => t.monthCode === currentMonthCode).sort((a, b) => b.day - a.day)
  , [transactions, currentMonthCode]);

  const stats = useMemo(() => {
    const res = monthTransactions.filter(t => t.type === 'Receita').reduce((acc, t) => acc + t.value, 0);
    const exp = monthTransactions.filter(t => t.type === 'Despesa').reduce((acc, t) => acc + t.value, 0);
    return { res, exp, balance: res - exp };
  }, [monthTransactions]);

  const counters = useMemo(() => {
    const revs = monthTransactions.filter(t => t.type === 'Receita');
    const exps = monthTransactions.filter(t => t.type === 'Despesa');
    return {
      revTotal: revs.length,
      revPending: revs.filter(t => !t.paid).length,
      expTotal: exps.length,
      expPending: exps.filter(t => !t.paid).length
    };
  }, [monthTransactions]);

  const config = useMemo(() => {
    const found = monthConfigs.find(c => c.monthCode === currentMonthCode);
    if (found) return found;
    return {
      monthCode: currentMonthCode, 
      income: stats.res, 
      needsPercent: 50, 
      desiresPercent: 20,
      savingsPercent: 30
    };
  }, [monthConfigs, currentMonthCode, stats.res]);

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
    updateMonthConfig({ ...config, [key]: newVal, income: stats.res });
  };

  const handleTogglePaid = (tx: Transaction) => {
    const newPaidStatus = !tx.paid;
    const today = new Date().toISOString().split('T')[0];
    saveTransaction({ 
      ...tx, 
      paid: newPaidStatus, 
      paymentDate: newPaidStatus ? today : undefined 
    });
  };

  const handleModalTypeChange = (type: TransactionType) => {
    setModalType(type);
    if (type === 'Receita') {
      const revenueCat = categories.find(c => c.isSystem && (c.name === 'Receita' || c.name === 'Revenue')) || 
                         categories.find(c => c.name.toLowerCase().includes('receita')) ||
                         categories.find(c => c.name.toLowerCase().includes('revenue'));
      if (revenueCat) setModalCategoryId(revenueCat.id);
    } else {
      const currentCat = categories.find(c => c.id === modalCategoryId);
      if (currentCat?.isSystem) setModalCategoryId(categories.find(c => !c.isSystem)?.id || categories[0]?.id || '');
    }
  };

  const handleOpenNewTransaction = () => {
    setEditingTransaction(null);
    setPaymentMethod('Dinheiro');
    setModalType('Despesa');
    setModalCategoryId(categories.find(c => !c.isSystem)?.id || categories[0]?.id || '');
    setModalGoalId('');
    setModalCardId('');
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
      cardId: paymentMethod === 'Crédito' ? modalCardId : undefined,
      goalId: modalGoalId || undefined,
      paid: isPaid,
      paymentDate: isPaid ? (editingTransaction?.paymentDate || new Date().toISOString().split('T')[0]) : undefined,
      notes: fd.get('notes') as string || '',
    };
    saveTransaction(nt);
    setIsModalOpen(false);
  };

  // Funções para Quick Add
  const handleQuickAddCategory = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const id = crypto.randomUUID();
    saveCategory({
      id,
      name: fd.get('name') as string,
      icon: fd.get('icon') as string,
      subcategories: ''
    });
    setModalCategoryId(id);
    setQuickAddType(null);
  };

  const handleQuickAddCard = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const id = crypto.randomUUID();
    saveCard({
      id,
      name: fd.get('name') as string,
      bank: fd.get('bank') as string,
      limit: Number(fd.get('limit')),
      closingDay: Number(fd.get('closingDay')),
      color: fd.get('color') as string
    });
    setModalCardId(id);
    setQuickAddType(null);
  };

  const handleQuickAddGoal = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const id = crypto.randomUUID();
    saveGoal({
      id,
      name: fd.get('name') as string,
      icon: fd.get('icon') as string,
      targetValue: Number(fd.get('targetValue')),
      savedValue: 0
    });
    setModalGoalId(id);
    setQuickAddType(null);
  };

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
                  < Landmark size={14} className="text-green-600" />
                  <span className="text-xl font-black text-gray-800 tracking-tighter">{formatCurrency(stats.res)}</span>
                </div>
                <div className={`mt-0.5 inline-block w-fit px-1.5 py-0.5 rounded-full border text-[6px] font-black uppercase tracking-widest ${config.needsPercent + config.desiresPercent + config.savingsPercent === 100 ? 'bg-green-100 border-green-200 text-green-700' : 'bg-amber-100 border-amber-200 text-amber-700'}`}>
                  {config.needsPercent + config.desiresPercent + config.savingsPercent}% ALOCADO
                </div>
              </div>
              <div className="hidden lg:block w-[1px] h-10 bg-gray-100" />
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                <div className="space-y-1">
                  <label className="text-[7px] font-black uppercase text-gray-400 block tracking-widest">{t('needs').toUpperCase()} (%)</label>
                  <div className="flex items-center gap-1">
                    <input type="number" value={config.needsPercent} onChange={(e) => handleUpdateConfig('needsPercent', Number(e.target.value))} className="bg-[#F9F9F9] border border-[#F0F0F0] rounded-lg px-2 py-1 text-[10px] font-black w-[60px] text-center" />
                    <div className="bg-white border border-[#F0F0F0] rounded-lg px-2.5 py-1 font-black text-green-600 text-[15px] flex-1">{formatCurrency(stats.res * (config.needsPercent / 100))}</div>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[7px] font-black uppercase text-gray-400 block tracking-widest">{t('savings').toUpperCase()} (%)</label>
                  <div className="flex items-center gap-1">
                    <input type="number" value={config.savingsPercent} onChange={(e) => handleUpdateConfig('savingsPercent', Number(e.target.value))} className="bg-[#F9F9F9] border border-[#F0F0F0] rounded-lg px-2 py-1 text-[10px] font-black w-[60px] text-center" />
                    <div className="bg-white border border-[#F0F0F0] rounded-lg px-2.5 py-1 font-black text-green-600 text-[15px] flex-1">{formatCurrency(stats.res * (config.savingsPercent / 100))}</div>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[7px] font-black uppercase text-gray-400 block tracking-widest">{t('wants').toUpperCase()} (%)</label>
                  <div className="flex items-center gap-1">
                    <input type="number" value={config.desiresPercent} onChange={(e) => handleUpdateConfig('desiresPercent', Number(e.target.value))} className="bg-[#F9F9F9] border border-[#F0F0F0] rounded-lg px-2 py-1 text-[10px] font-black w-[60px] text-center" />
                    <div className="bg-white border border-[#F0F0F0] rounded-lg px-2.5 py-1 font-black text-green-600 text-[15px] flex-1">{formatCurrency(stats.res * (config.desiresPercent / 100))}</div>
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
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-black uppercase tracking-tight">{t('transactions')}</h2>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 border border-green-100 rounded-full">
                <span className="text-[8px] font-black text-green-600">{t('revenues')} {counters.revTotal}/{counters.revPending}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-red-50 border border-red-100 rounded-full">
                <span className="text-[8px] font-black text-red-600">{t('expenses')} {counters.expTotal}/{counters.expPending}</span>
              </div>
            </div>
          </div>
          <button onClick={handleOpenNewTransaction} className="primary-btn flex items-center gap-2 shadow-sm py-2 px-4">
            <Plus size={16} /> <span className="text-[10px] uppercase">{t('newTransaction')}</span>
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {monthTransactions.map(tx => (
            <div key={tx.id} className={`airbnb-card px-4 py-4 border-l-[3px] grid grid-cols-1 md:grid-cols-12 items-center gap-3 ${tx.type === 'Receita' ? 'border-l-green-500' : 'border-l-red-500'}`}>
              <div className="md:col-span-4 flex items-center gap-4">
                <button onClick={() => handleTogglePaid(tx)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${tx.paid ? 'bg-green-100 text-green-600 border-2 border-green-200' : 'bg-gray-50 text-gray-200 border-2 border-dashed border-gray-100'}`}><CheckCircle2 size={20} /></button>
                <h4 className="font-extrabold text-[17px] text-gray-800 truncate flex items-center gap-2">{tx.description} {tx.isFixed && <Repeat size={12} className="text-gray-300" />}</h4>
              </div>
              <div className="md:col-span-5 flex flex-wrap items-center gap-3 justify-center">
                <div className="flex items-center gap-2 text-[13px] font-black text-gray-500 bg-gray-50 px-3 py-1 rounded-full"><CalendarIcon size={14} /> {tx.paymentDate || `Dia ${tx.day}`}</div>
                {categories.find(c => c.id === tx.categoryId) && (
                  <div className="flex items-center gap-2 text-[13px] font-black uppercase text-gray-500 bg-gray-50 px-3 py-1 rounded-full"><TagIcon size={14} /> {categories.find(c => c.id === tx.categoryId)?.name}</div>
                )}
                {goals.find(g => g.id === tx.goalId) && (
                  <div className="flex items-center gap-2 text-[13px] font-black uppercase text-blue-500 bg-blue-50 px-3 py-1 rounded-full"><Target size={14} /> {goals.find(g => g.id === tx.goalId)?.name}</div>
                )}
              </div>
              <div className="md:col-span-3 flex items-center justify-end gap-2 md:gap-4">
                <span className={`text-[15px] font-black tracking-tight ${tx.type === 'Receita' ? 'text-green-600' : 'text-red-600'}`}>{tx.type === 'Receita' ? '+' : '-'} {formatCurrency(tx.value)}</span>
                <div className="flex items-center gap-0 md:gap-1">
                  <button 
                    onClick={() => { 
                      setEditingTransaction(tx); 
                      setModalType(tx.type); 
                      setPaymentMethod(tx.paymentMethod); 
                      setModalCategoryId(tx.categoryId); 
                      setModalGoalId(tx.goalId || ''); 
                      setModalCardId(tx.cardId || ''); 
                      setIsModalOpen(true); 
                    }} 
                    className="p-3 text-gray-400 hover:text-black transition-all"
                    title={t('edit')}
                  >
                    <Pencil size={20} />
                  </button>
                  <button 
                    onClick={() => deleteTransaction(tx.id)} 
                    className="p-3 text-gray-400 hover:text-red-500 transition-all"
                    title={t('delete')}
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-[32px] w-full max-w-xl p-8 md:p-10 shadow-2xl animate-in zoom-in duration-300 relative my-auto">
            <button onClick={() => setIsModalOpen(false)} className="absolute right-6 top-6 p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"><X size={24} /></button>
            <h2 className="text-[19px] font-black mb-6 tracking-tight">{editingTransaction ? t('editTransaction') : t('newTransaction')}</h2>
            
            <form onSubmit={handleSaveTransaction} className="space-y-6">
              <div className="flex bg-gray-100 p-1 rounded-xl">
                <button type="button" onClick={() => handleModalTypeChange('Despesa')} className={`flex-1 py-3 text-[11px] font-black rounded-lg transition-all ${modalType === 'Despesa' ? 'bg-white shadow-sm text-red-500' : 'text-gray-400 hover:text-gray-600'}`}>{t('expenses')}</button>
                <button type="button" onClick={() => handleModalTypeChange('Receita')} className={`flex-1 py-3 text-[11px] font-black rounded-lg transition-all ${modalType === 'Receita' ? 'bg-white shadow-sm text-green-600' : 'text-gray-400 hover:text-gray-600'}`}>{t('revenues')}</button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('description')}</label>
                  <input name="description" required defaultValue={editingTransaction?.description || ""} className="font-bold py-3 px-5 text-[13px]" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('day')}</label>
                  <input name="day" type="number" min="1" max="31" required defaultValue={editingTransaction?.day || now.getDate()} className="font-bold py-3 px-5 text-[13px] text-center" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('value')}</label>
                  <input name="value" type="number" step="0.01" required defaultValue={editingTransaction?.value || ""} className="font-black text-[13px] py-3 px-5" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{t('category')}</label>
                    <button type="button" onClick={() => setQuickAddType('category')} className="text-[#FF385C] hover:opacity-70"><Plus size={14}/></button>
                  </div>
                  <select required value={modalCategoryId} onChange={(e) => setModalCategoryId(e.target.value)} className="font-bold py-3 px-5 text-[13px] appearance-none">
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('paymentMethod')}</label>
                  <select required value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="font-bold py-3 px-5 text-[13px] appearance-none">
                    {PAYMENT_METHODS.map(m => <option key={m} value={m}>{t(m)}</option>)}
                  </select>
                </div>
                {paymentMethod === 'Crédito' && (
                  <div className="space-y-1.5 animate-in slide-in-from-top-1 duration-200">
                    <div className="flex justify-between items-center ml-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{t('card')}</label>
                      <button type="button" onClick={() => setQuickAddType('card')} className="text-[#FF385C] hover:opacity-70"><Plus size={14}/></button>
                    </div>
                    <select required value={modalCardId} onChange={(e) => setModalCardId(e.target.value)} className="font-bold py-3 px-5 text-[13px] appearance-none">
                      <option value="">{t('select')}</option>
                      {cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                )}
                {paymentMethod !== 'Crédito' && (
                   <div className="space-y-1.5">
                    <div className="flex justify-between items-center ml-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{t('goals')}</label>
                      <button type="button" onClick={() => setQuickAddType('goal')} className="text-[#FF385C] hover:opacity-70"><Plus size={14}/></button>
                    </div>
                    <select value={modalGoalId} onChange={(e) => setModalGoalId(e.target.value)} className="font-bold py-3 px-5 text-[13px] appearance-none">
                      <option value="">{t('select')}</option>
                      {goals.map(g => <option key={g.id} value={g.id}>{g.icon} {g.name}</option>)}
                    </select>
                  </div>
                )}
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

      {/* Quick Add Modals */}
      {quickAddType === 'category' && (
        <div className="fixed inset-0 bg-black/40 z-[110] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[24px] w-full max-w-sm p-6 shadow-2xl animate-in zoom-in duration-200 relative">
            <button onClick={() => setQuickAddType(null)} className="absolute right-4 top-4 p-1 text-gray-400 hover:text-black"><X size={20}/></button>
            <h3 className="font-black mb-4 uppercase text-xs tracking-tight">Nova Categoria</h3>
            <form onSubmit={handleQuickAddCategory} className="space-y-4">
              <input name="name" required placeholder="Nome da Categoria" />
              <div className="space-y-1">
                <label className="text-[8px] font-black text-gray-400 uppercase ml-1">Ícone</label>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-2 bg-gray-50 rounded-xl">
                  {EMOJIS.map(e => <button key={e} type="button" onClick={(ev) => (ev.currentTarget.parentElement?.parentElement?.nextElementSibling as HTMLInputElement).value = e} className="w-8 h-8 hover:bg-gray-200 rounded-lg">{e}</button>)}
                </div>
                <input name="icon" defaultValue="🤷" required className="hidden" />
              </div>
              <button type="submit" className="primary-btn w-full">Criar</button>
            </form>
          </div>
        </div>
      )}

      {quickAddType === 'card' && (
        <div className="fixed inset-0 bg-black/40 z-[110] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[24px] w-full max-w-sm p-6 shadow-2xl animate-in zoom-in duration-200 relative">
            <button onClick={() => setQuickAddType(null)} className="absolute right-4 top-4 p-1 text-gray-400 hover:text-black"><X size={20}/></button>
            <h3 className="font-black mb-4 uppercase text-xs tracking-tight">Novo Cartão</h3>
            <form onSubmit={handleQuickAddCard} className="space-y-3">
              <input name="name" required placeholder="Nome do Cartão" />
              <input name="bank" required placeholder="Banco" />
              <div className="grid grid-cols-2 gap-2">
                <input name="limit" type="number" required placeholder="Limite" />
                <input name="closingDay" type="number" required placeholder="Dia Vencimento" />
              </div>
              <div className="flex gap-2 p-2 bg-gray-50 rounded-xl">
                {CARD_COLORS.map(c => <button key={c} type="button" onClick={(ev) => (ev.currentTarget.parentElement?.nextElementSibling as HTMLInputElement).value = c} className="w-6 h-6 rounded-full border border-white" style={{backgroundColor: c}} />)}
              </div>
              <input name="color" defaultValue="#222222" className="hidden" />
              <button type="submit" className="primary-btn w-full">Criar</button>
            </form>
          </div>
        </div>
      )}

      {quickAddType === 'goal' && (
        <div className="fixed inset-0 bg-black/40 z-[110] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[24px] w-full max-w-sm p-6 shadow-2xl animate-in zoom-in duration-200 relative">
            <button onClick={() => setQuickAddType(null)} className="absolute right-4 top-4 p-1 text-gray-400 hover:text-black"><X size={20}/></button>
            <h3 className="font-black mb-4 uppercase text-xs tracking-tight">Nova Meta</h3>
            <form onSubmit={handleQuickAddGoal} className="space-y-4">
              <input name="name" required placeholder="Ex: Viagem Disney" />
              <input name="targetValue" type="number" required placeholder="Valor da Meta" />
              <div className="space-y-1">
                <label className="text-[8px] font-black text-gray-400 uppercase ml-1">Símbolo</label>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-2 bg-gray-50 rounded-xl">
                   {['🎯', '✈️', '🚗', '🏠', '💍', '💻', '💰'].map(e => <button key={e} type="button" onClick={(ev) => (ev.currentTarget.parentElement?.parentElement?.nextElementSibling as HTMLInputElement).value = e} className="w-8 h-8 hover:bg-gray-200 rounded-lg">{e}</button>)}
                </div>
                <input name="icon" defaultValue="🎯" className="hidden" />
              </div>
              <button type="submit" className="primary-btn w-full">Criar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthlyControl;
