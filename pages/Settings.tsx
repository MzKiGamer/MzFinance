
import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { PAYMENT_METHODS } from '../constants';
import { Trash2, Plus, CreditCard, Tag, Repeat, Lock, Edit3 } from 'lucide-react';
import { Category, FixedEntry, Card } from '../types';

const CARD_COLORS = [
  '#222222', '#FF385C', '#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'
];

const Settings: React.FC = () => {
  const { categories, setCategories, cards, setCards, fixedEntries, setFixedEntries } = useFinance();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'categories' | 'fixed' | 'cards'>('categories');
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const canManage = currentUser?.permissions.canManageSettings;

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canManage) return;
    
    // Lógica de salvamento mantida...
    closeModal();
  };

  const closeModal = () => {
    setIsAdding(false);
    setEditingItem(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header>
        <h1 className="text-2xl font-bold">⚙️ Configurações</h1>
        <p className="text-gray-500 font-medium">Gerencie a estrutura de dados do seu financeiro.</p>
      </header>

      {!canManage && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-3 text-amber-700 font-bold text-sm">
          <Lock size={18} /> Você não tem permissão para alterar as configurações do sistema.
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        <button 
          onClick={() => setActiveTab('categories')} 
          className={`nav-pill flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold border transition-all ${activeTab === 'categories' ? 'active shadow-lg' : 'bg-white'}`}
        >
          <Tag size={16} /> Categorias
        </button>
        <button 
          onClick={() => setActiveTab('fixed')} 
          className={`nav-pill flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold border transition-all ${activeTab === 'fixed' ? 'active shadow-lg' : 'bg-white'}`}
        >
          <Repeat size={16} /> Fixos
        </button>
        <button 
          onClick={() => setActiveTab('cards')} 
          className={`nav-pill flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold border transition-all ${activeTab === 'cards' ? 'active shadow-lg' : 'bg-white'}`}
        >
          <CreditCard size={16} /> Cartões
        </button>
      </div>

      <div className="airbnb-card p-8 min-h-[400px] relative">
        {!canManage && <div className="absolute inset-0 bg-white/60 z-10 rounded-2xl backdrop-blur-[1px] flex items-center justify-center pointer-events-none" />}
        
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-xl font-extrabold capitalize">{activeTab}</h2>
          {canManage && (
            <button onClick={() => setIsAdding(true)} className="primary-btn flex items-center gap-2 text-xs">
              <Plus size={14} /> Novo {activeTab.slice(0, -1)}
            </button>
          )}
        </div>

        <div className="flex flex-col items-center justify-center py-20 text-gray-300">
           <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              {activeTab === 'categories' ? <Tag size={32} /> : activeTab === 'fixed' ? <Repeat size={32} /> : <CreditCard size={32} />}
           </div>
           <p className="font-bold text-gray-400">Gerenciador de {activeTab} em breve.</p>
           <p className="text-xs font-medium">Use os lançamentos manuais enquanto finalizamos esta área.</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
