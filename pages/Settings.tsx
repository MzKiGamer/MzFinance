
import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { PAYMENT_METHODS } from '../constants';
import { Trash2, Plus, Pencil, CreditCard, Tag, Repeat, Lock, X, Check, CreditCard as CardIcon } from 'lucide-react';
import { Category, FixedEntry, Card, TransactionType } from '../types';

const CARD_COLORS = ['#222222', '#FF385C', '#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
const EMOJIS = ['🛒', '⚠️', '📱', '🐶', '👚', '💅', '🎁', '💊', '🤷', '🧠', '🚗', '🍽️', '🏖️', '🏠', '🧾', '📈', '🎓', '🤝', '💼', '💸', '🔁', '🚖', '🍕', '🍷', '🎮', '✈️', '🏋️', '📽️'];

const Settings: React.FC = () => {
  const { categories, setCategories, cards, setCards, fixedEntries, setFixedEntries } = useFinance();
  const { currentUser } = useAuth();
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'categories' | 'fixed' | 'cards'>('categories');
  const [isAdding, setIsAdding] = useState(false);
  
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [editingFixed, setEditingFixed] = useState<FixedEntry | null>(null);

  // Estados para controle dinâmico do formulário
  const [fixedType, setFixedType] = useState<TransactionType>('Despesa');
  const [fixedCategoryId, setFixedCategoryId] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('🤷');
  const [selectedCardColor, setSelectedCardColor] = useState('#222222');

  const canManage = currentUser?.permissions.canManageSettings;

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat(language === 'pt' ? 'pt-BR' : 'en-US', { 
      style: 'currency', 
      currency: language === 'pt' ? 'BRL' : 'USD' 
    }).format(val);

  const handleSaveCategory = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const newItem: Category = {
      id: editingCategory ? editingCategory.id : crypto.randomUUID(),
      name: fd.get('name') as string,
      icon: selectedIcon,
      subcategories: fd.get('subcategories') as string,
      isSystem: editingCategory?.isSystem
    };
    if (editingCategory) {
      setCategories(prev => prev.map(c => c.id === newItem.id ? newItem : c));
    } else {
      setCategories(prev => [...prev, newItem]);
    }
    setIsAdding(false);
    setEditingCategory(null);
  };

  const handleSaveCard = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const newItem: Card = {
      id: editingCard ? editingCard.id : crypto.randomUUID(),
      name: fd.get('name') as string,
      bank: fd.get('bank') as string,
      limit: Number(fd.get('limit')),
      closingDay: Number(fd.get('closingDay')),
      color: selectedCardColor
    };
    if (editingCard) {
      setCards(prev => prev.map(c => c.id === newItem.id ? newItem : c));
    } else {
      setCards(prev => [...prev, newItem]);
    }
    setIsAdding(false);
    setEditingCard(null);
  };

  const handleSaveFixed = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const newItem: FixedEntry = {
      id: editingFixed ? editingFixed.id : crypto.randomUUID(),
      description: fd.get('description') as string,
      day: Number(fd.get('day')),
      type: fixedType,
      value: Number(fd.get('value')),
      categoryId: fixedCategoryId,
      paymentMethod: fd.get('paymentMethod') as string,
      notes: '',
      active: true
    };
    if (editingFixed) {
      setFixedEntries(prev => prev.map(f => f.id === newItem.id ? newItem : f));
    } else {
      setFixedEntries(prev => [...prev, newItem]);
    }
    setIsAdding(false);
    setEditingFixed(null);
  };

  const handleFixedTypeChange = (type: TransactionType) => {
    setFixedType(type);
    if (type === 'Receita') {
      const revenueCat = categories.find(c => c.isSystem && (c.name === 'Receita' || c.name === 'Revenue')) || 
                         categories.find(c => c.name.toLowerCase().includes('receita')) ||
                         categories.find(c => c.name.toLowerCase().includes('revenue'));
      if (revenueCat) {
        setFixedCategoryId(revenueCat.id);
      }
    }
  };

  const openFixedModal = (fixed?: FixedEntry) => {
    if (fixed) {
      setEditingFixed(fixed);
      setFixedType(fixed.type);
      setFixedCategoryId(fixed.categoryId);
    } else {
      setEditingFixed(null);
      setFixedType('Despesa');
      setFixedCategoryId(categories[0]?.id || '');
    }
    setIsAdding(true);
  };

  const openCardModal = (card?: Card) => {
    if (card) {
      setEditingCard(card);
      setSelectedCardColor(card.color || '#222222');
    } else {
      setEditingCard(null);
      setSelectedCardColor('#222222');
    }
    setIsAdding(true);
  };

  const openCategoryModal = (cat?: Category) => {
    if (cat) {
      setEditingCategory(cat);
      setSelectedIcon(cat.icon);
    } else {
      setEditingCategory(null);
      setSelectedIcon('🤷');
    }
    setIsAdding(true);
  };

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500 pb-24 md:pb-20 max-w-[1000px] mx-auto px-1 md:px-0">
      <header>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight">{t('settings')}</h1>
        <p className="text-gray-500 font-medium text-base md:text-lg">{t('personalizeStructure')}</p>
      </header>

      {!canManage && (
        <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl flex items-center gap-4 text-amber-700 font-bold text-sm">
          <Lock size={20} className="shrink-0" /> {t('noManagePerm')}
        </div>
      )}

      <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
        <button 
          onClick={() => setActiveTab('categories')} 
          className={`whitespace-nowrap flex items-center gap-3 px-8 py-4 rounded-full text-sm font-bold border transition-all ${activeTab === 'categories' ? 'bg-black text-white' : 'bg-white text-gray-400'}`}
        >
          <Tag size={16} /> {t('categories')}
        </button>
        <button 
          onClick={() => setActiveTab('fixed')} 
          className={`whitespace-nowrap flex items-center gap-3 px-8 py-4 rounded-full text-sm font-bold border transition-all ${activeTab === 'fixed' ? 'bg-black text-white' : 'bg-white text-gray-400'}`}
        >
          <Repeat size={16} /> {t('fixed')}
        </button>
        <button 
          onClick={() => setActiveTab('cards')} 
          className={`whitespace-nowrap flex items-center gap-3 px-8 py-4 rounded-full text-sm font-bold border transition-all ${activeTab === 'cards' ? 'bg-black text-white' : 'bg-white text-gray-400'}`}
        >
          <CreditCard size={16} /> {t('cards')}
        </button>
      </div>

      <div className="airbnb-card p-6 md:p-10 min-h-[500px] relative">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
          <h2 className="text-xl md:text-2xl font-extrabold">{t(activeTab === 'fixed' ? 'fixedEntriesTitle' : activeTab)}</h2>
          {canManage && (
            <button 
              onClick={() => {
                if (activeTab === 'fixed') openFixedModal();
                else if (activeTab === 'cards') openCardModal();
                else openCategoryModal();
              }} 
              className="primary-btn flex items-center gap-2 text-sm py-3 px-6"
            >
              <Plus size={16} /> {t('new')}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6">
          {activeTab === 'categories' && categories.map(cat => (
            <div key={cat.id} className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl group hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-sm">{cat.icon}</div>
                <div>
                  <h4 className="font-bold text-gray-800">{cat.name}</h4>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{cat.subcategories}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => openCategoryModal(cat)} className="text-gray-200 hover:text-black transition-colors p-2.5"><Pencil size={20} /></button>
                <button onClick={() => setCategories(prev => prev.filter(c => c.id !== cat.id))} className="text-gray-200 hover:text-red-500 transition-colors p-2.5"><Trash2 size={20} /></button>
              </div>
            </div>
          ))}

          {activeTab === 'cards' && cards.map(card => (
            <div key={card.id} 
              className="relative overflow-hidden p-6 rounded-[28px] group transition-all hover:scale-[1.01] shadow-lg border border-transparent min-h-[130px] flex flex-col justify-between"
              style={{ backgroundColor: card.color }}
            >
              {/* Elementos decorativos suavizados */}
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -left-8 -bottom-8 w-24 h-24 bg-black/5 rounded-full blur-xl pointer-events-none" />

              <div className="relative z-10 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/20 backdrop-blur-md border border-white/20 text-white shrink-0">
                      <CardIcon size={20} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-black text-xl leading-tight text-white truncate">{card.name}</h4>
                      <p className="text-[9px] text-white/60 font-black uppercase tracking-[0.2em] truncate">{card.bank}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md p-1 rounded-xl border border-white/10">
                  <button onClick={() => openCardModal(card)} className="text-white hover:text-black transition-all p-2 rounded-lg hover:bg-white"><Pencil size={16} /></button>
                  <button onClick={() => setCards(prev => prev.filter(c => c.id !== card.id))} className="text-white hover:text-red-500 transition-all p-2 rounded-lg hover:bg-white"><Trash2 size={16} /></button>
                </div>
              </div>

              <div className="relative z-10 flex flex-row items-end justify-between gap-4 mt-6 pt-4 border-t border-white/10">
                <div>
                   <span className="text-[9px] font-black uppercase text-white/50 tracking-widest block mb-0.5">Limite</span>
                   <span className="text-lg font-black text-white">{formatCurrency(card.limit)}</span>
                </div>
                <div className="text-right">
                   <span className="text-[9px] font-black uppercase text-white/50 tracking-widest block mb-0.5">Fechamento</span>
                   <span className="text-sm font-black text-white">Dia {card.closingDay}</span>
                </div>
              </div>
            </div>
          ))}
          
          {activeTab === 'fixed' && fixedEntries.map(fixed => (
             <div key={fixed.id} className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl group hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-lg shadow-sm font-bold">
                  {fixed.day}
                </div>
                <div>
                  <h4 className="font-bold text-gray-800">{fixed.description}</h4>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{t(fixed.paymentMethod)} • {t(fixed.type === 'Receita' ? 'revenues' : 'expenses')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => openFixedModal(fixed)} className="text-gray-200 hover:text-black transition-colors p-2.5"><Pencil size={20} /></button>
                <button onClick={() => setFixedEntries(prev => prev.filter(f => f.id !== fixed.id))} className="text-gray-200 hover:text-red-500 transition-colors p-2.5"><Trash2 size={20} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-[40px] w-full max-w-xl p-12 shadow-2xl animate-in zoom-in duration-300 relative my-auto">
            <button onClick={() => { setIsAdding(false); setEditingCategory(null); setEditingCard(null); setEditingFixed(null); }} className="absolute right-8 top-8 p-2 hover:bg-gray-100 rounded-full text-gray-400"><X size={24} /></button>
            <h2 className="text-2xl font-black mb-8">{t('save')}</h2>

            {activeTab === 'categories' && (
              <form onSubmit={handleSaveCategory} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('category')}</label>
                  <input name="name" required defaultValue={editingCategory?.name || ""} className="font-bold text-base" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('description')}</label>
                  <input name="subcategories" required defaultValue={editingCategory?.subcategories || ""} className="font-bold text-base" />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Icone</label>
                  <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto p-4 bg-gray-50 rounded-2xl">
                    {EMOJIS.map(e => (
                      <button 
                        key={e} 
                        type="button" 
                        onClick={() => setSelectedIcon(e)}
                        className={`w-10 h-10 flex items-center justify-center rounded-lg text-lg ${selectedIcon === e ? 'bg-black text-white' : 'bg-white hover:bg-gray-200'}`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>

                <button type="submit" className="primary-btn w-full py-5 text-xl mt-6">{t('save')}</button>
              </form>
            )}

            {activeTab === 'cards' && (
              <form onSubmit={handleSaveCard} className="space-y-6">
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('description')}</label>
                    <input name="name" required defaultValue={editingCard?.name || ""} className="font-bold text-base" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('bank')}</label>
                    <input name="bank" required defaultValue={editingCard?.bank || ""} className="font-bold text-base" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Limite</label>
                    <input name="limit" type="number" step="0.01" required defaultValue={editingCard?.limit || ""} className="font-bold text-base" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('closingDay')}</label>
                    <input name="closingDay" type="number" min="1" max="31" required defaultValue={editingCard?.closingDay || "10"} className="font-bold text-base" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('cardColor')}</label>
                  <div className="flex flex-wrap gap-3 p-4 bg-gray-50 rounded-2xl">
                    {CARD_COLORS.map(color => (
                      <button 
                        key={color} 
                        type="button" 
                        onClick={() => setSelectedCardColor(color)}
                        className={`w-10 h-10 rounded-full border-4 transition-all ${selectedCardColor === color ? 'border-black scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <button type="submit" className="primary-btn w-full py-5 text-xl mt-6">{t('save')}</button>
              </form>
            )}

            {activeTab === 'fixed' && (
              <form onSubmit={handleSaveFixed} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('description')}</label>
                  <input name="description" required defaultValue={editingFixed?.description || ""} className="font-bold text-base" />
                </div>
                
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('type')}</label>
                    <select 
                      name="type" 
                      required 
                      value={fixedType} 
                      onChange={(e) => handleFixedTypeChange(e.target.value as TransactionType)} 
                      className="font-bold text-base"
                    >
                      <option value="Despesa">{t('expenses')}</option>
                      <option value="Receita">{t('revenues')}</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('day')}</label>
                    <input name="day" type="number" min="1" max="31" required defaultValue={editingFixed?.day || "1"} className="font-bold text-base" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('value')}</label>
                    <input name="value" type="number" step="0.01" required defaultValue={editingFixed?.value || ""} className="font-bold text-base" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('category')}</label>
                    <select 
                      name="categoryId" 
                      required 
                      value={fixedCategoryId} 
                      onChange={(e) => setFixedCategoryId(e.target.value)} 
                      className="font-bold text-base"
                    >
                      {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('paymentMethod')}</label>
                  <select name="paymentMethod" required defaultValue={editingFixed?.paymentMethod || "Dinheiro"} className="font-bold text-base">
                    {PAYMENT_METHODS.map(m => <option key={m} value={m}>{t(m)}</option>)}
                  </select>
                </div>

                <button type="submit" className="primary-btn w-full py-5 text-xl mt-6">{t('save')}</button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
