
import React, { useMemo, useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useLanguage } from '../context/LanguageContext';
import { Plus, Trophy, Trash2, Pencil, X } from 'lucide-react';
import { Goal } from '../types';

const SYMBOLS = ['🎯', '✈️', '🚗', '🏠', '💍', '💻', '🎓', '🏥', '🏄', '🚀', '💰', '👶', '🚴', '🎸', '🕹️', '🎨', '🌴', '🛳️', '🏔️', '⛺', '🍔', '🥂', '🎁', '🎈'];

const Goals: React.FC = () => {
  const { goals, setGoals, deleteGoal, transactions } = useFinance();
  const { t, language } = useLanguage();
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState('🎯');

  const goalsCalculated = useMemo(() => {
    return goals.map(g => {
      const transactionsTotal = transactions
        .filter(t => t.goalId === g.id && t.paid)
        .reduce((sum, t) => sum + t.value, 0);
      
      const currentBalance = (g.savedValue || 0) + transactionsTotal;
      
      return { ...g, actual: Math.max(0, currentBalance) };
    });
  }, [goals, transactions]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat(language === 'pt' ? 'pt-BR' : 'en-US', { 
        style: 'currency', 
        currency: language === 'pt' ? 'BRL' : 'USD' 
    }).format(val);

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setSelectedIcon(goal.icon || '🎯');
    setIsAdding(true);
  };

  const handleSaveGoal = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const ng: Goal = {
      id: editingGoal ? editingGoal.id : crypto.randomUUID(),
      name: fd.get('name') as string,
      icon: selectedIcon,
      targetValue: Number(fd.get('targetValue')),
      savedValue: Number(fd.get('savedValue'))
    };
    if (editingGoal) {
      setGoals(prev => prev.map(g => g.id === ng.id ? ng : g));
    } else {
      setGoals(prev => [...prev, ng]);
    }
    setIsAdding(false);
    setEditingGoal(null);
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700 max-w-[1200px] mx-auto px-1">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#FFF2F5] rounded-full flex items-center justify-center text-[#FF385C] shadow-sm shrink-0">
            <Trophy size={20} />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight">{t('myGoals')}</h1>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">{t('trackProgress')}</p>
          </div>
        </div>
        <button 
          onClick={() => { setEditingGoal(null); setSelectedIcon('🎯'); setIsAdding(true); }}
          className="bg-[#FF385C] text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-tight flex items-center gap-2 hover:opacity-90 transition-all shadow-sm active:scale-95 w-full sm:w-auto justify-center"
        >
          <Plus size={16} /> {t('newGoal')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {goalsCalculated.map(goal => {
          const percent = goal.targetValue > 0 ? Math.min((goal.actual / goal.targetValue) * 100, 100) : 0;
          return (
            <div key={goal.id} className="airbnb-card p-5 group relative overflow-hidden transition-all hover:scale-[1.01]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{goal.icon || '🎯'}</span>
                  <h3 className="text-sm font-black text-gray-800 truncate pr-2 max-w-[120px]">{goal.name}</h3>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleEdit(goal)} className="p-1.5 text-gray-200 hover:text-black transition-colors"><Pencil size={14} /></button>
                  <button onClick={() => deleteGoal(goal.id)} className="p-1.5 text-gray-200 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                  <span className="text-gray-400">{t('progress')}</span>
                  <span className="text-gray-800">{percent.toFixed(1)}%</span>
                </div>
                
                <div className="w-full h-1.5 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                  <div className="h-full bg-[#FF385C] rounded-full transition-all duration-1000" style={{ width: `${percent}%` }} />
                </div>

                <div className="flex justify-between items-end pt-2 border-t border-gray-50">
                  <div>
                    <span className="text-[8px] font-black uppercase text-gray-400 tracking-widest block mb-0.5">{t('saved')}</span>
                    <span className="text-sm font-black text-[#10b981]">{formatCurrency(goal.actual)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] font-black uppercase text-gray-400 tracking-widest block mb-0.5">{t('target')}</span>
                    <span className="text-[10px] font-bold text-gray-400">{formatCurrency(goal.targetValue)}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {goalsCalculated.length === 0 && (
          <div className="md:col-span-2 lg:col-span-3 py-16 text-center flex flex-col items-center gap-2 bg-gray-50/50 rounded-[24px] border-2 border-dashed border-gray-100">
             <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-gray-100 shadow-sm"><Trophy size={24} /></div>
             <p className="text-gray-300 font-bold italic text-[10px] uppercase tracking-widest">{t('noGoals')}</p>
          </div>
        )}
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-[24px] w-full max-w-sm p-6 md:p-8 animate-in zoom-in duration-300 shadow-2xl relative my-auto">
            <button onClick={() => { setIsAdding(false); setEditingGoal(null); }} className="absolute right-5 top-5 p-1.5 hover:bg-gray-100 rounded-full text-gray-400"><X size={18} /></button>
            <h2 className="text-lg font-black mb-6 tracking-tight">{editingGoal ? t('edit') : t('newGoal')}</h2>
            <form onSubmit={handleSaveGoal} className="space-y-4">
              <div className="space-y-0.5">
                <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('goalName')}</label>
                <input name="name" defaultValue={editingGoal?.name || ""} required className="font-bold text-xs py-1.5 px-3" />
              </div>
              
              <div className="space-y-1">
                <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Ícone</label>
                <div className="flex flex-wrap gap-1 max-h-[100px] overflow-y-auto p-2 bg-gray-50 rounded-xl">
                  {SYMBOLS.map(icon => (
                    <button 
                      key={icon} 
                      type="button" 
                      onClick={() => setSelectedIcon(icon)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-all ${selectedIcon === icon ? 'bg-black text-white shadow-md' : 'bg-white hover:bg-gray-200 shadow-xs'}`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-0.5">
                  <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('saved')}</label>
                  <input name="savedValue" type="number" step="0.01" defaultValue={editingGoal?.savedValue || 0} required className="font-black text-xs py-1.5 px-3" />
                </div>
                <div className="space-y-0.5">
                  <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('targetValue')}</label>
                  <input name="targetValue" type="number" step="0.01" defaultValue={editingGoal?.targetValue || ""} required className="font-black text-xs py-1.5 px-3" />
                </div>
              </div>
              
              <button type="submit" className="primary-btn w-full py-3 text-xs shadow-sm mt-3">{t('save')}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Goals;
