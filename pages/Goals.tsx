
import React, { useMemo, useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useLanguage } from '../context/LanguageContext';
import { Plus, Trophy, Trash2, Pencil, X } from 'lucide-react';
import { Goal } from '../types';

const SYMBOLS = ['🎯', '✈️', '🚗', '🏠', '💍', '💻', '🎓', '🏥', '🏄', '🚀', '💰', '👶', '🚴', '🎸', '🕹️', '🎨', '🌴', '🛳️', '🏔️', '⛺', '🍔', '🥂', '🎁', '🎈'];

const Goals: React.FC = () => {
  const { goals, setGoals, transactions } = useFinance();
  const { t, language } = useLanguage();
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState('🎯');

  const goalsCalculated = useMemo(() => {
    return goals.map(g => {
      const current = transactions
        .filter(t => t.goalId === g.id && t.paid)
        .reduce((sum, t) => sum + (t.type === 'Receita' ? t.value : -t.value), 0);
      return { ...g, actual: Math.max(0, current) };
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
      savedValue: editingGoal ? editingGoal.savedValue : 0
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
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-[#FFF2F5] rounded-full flex items-center justify-center text-[#FF385C] shadow-sm">
            <Trophy size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">{t('myGoals')}</h1>
            <p className="text-gray-500 font-medium">{t('trackProgress')}</p>
          </div>
        </div>
        <button 
          onClick={() => { setEditingGoal(null); setSelectedIcon('🎯'); setIsAdding(true); }}
          className="bg-[#FF385C] text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-md active:scale-95 w-full sm:w-auto justify-center"
        >
          <Plus size={20} /> {t('newGoal')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {goalsCalculated.map(goal => {
          const percent = goal.targetValue > 0 ? Math.min((goal.actual / goal.targetValue) * 100, 100) : 0;
          return (
            <div key={goal.id} className="airbnb-card p-8 group relative overflow-hidden transition-all hover:-translate-y-1">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{goal.icon || '🎯'}</span>
                  <h3 className="text-xl font-extrabold text-gray-800 truncate pr-2 max-w-[150px]">{goal.name}</h3>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleEdit(goal)} className="p-2 text-gray-300 hover:text-black transition-colors"><Pencil size={18} /></button>
                  <button onClick={() => setGoals(prev => prev.filter(g => g.id !== goal.id))} className="p-2 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">{t('progress')}</span>
                  <span className="font-extrabold text-gray-800">{percent.toFixed(1)}%</span>
                </div>
                
                <div className="w-full h-2.5 bg-[#F7F7F7] rounded-full overflow-hidden">
                  <div className="h-full bg-[#FF385C] rounded-full transition-all duration-1000" style={{ width: `${percent}%` }} />
                </div>

                <div className="flex justify-between items-end pt-4">
                  <div>
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-1">{t('saved')}</span>
                    <span className="text-2xl font-black text-[#10b981]">{formatCurrency(goal.actual)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-1">{t('target')}</span>
                    <span className="text-sm font-bold text-gray-800">{formatCurrency(goal.targetValue)}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {goalsCalculated.length === 0 && (
          <div className="md:col-span-2 lg:col-span-3 py-20 text-center flex flex-col items-center gap-4 bg-gray-50/50 rounded-[40px] border-2 border-dashed border-gray-100">
             <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-gray-200 shadow-sm"><Trophy size={32} /></div>
             <p className="text-gray-300 font-bold italic">{t('noGoals')}</p>
          </div>
        )}
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-[32px] w-full max-w-lg p-10 animate-in zoom-in duration-300 shadow-2xl relative my-auto">
            <button onClick={() => { setIsAdding(false); setEditingGoal(null); }} className="absolute right-6 top-6 p-2 hover:bg-gray-100 rounded-full text-gray-400"><X size={20} /></button>
            <h2 className="text-2xl font-black mb-8 tracking-tight">{editingGoal ? t('edit') : t('newGoal')}</h2>
            <form onSubmit={handleSaveGoal} className="space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('goalName')}</label>
                <input name="name" defaultValue={editingGoal?.name || ""} required className="font-bold text-lg" />
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Ícone</label>
                <div className="flex flex-wrap gap-2 max-h-[140px] overflow-y-auto p-4 bg-gray-50 rounded-2xl">
                  {SYMBOLS.map(icon => (
                    <button 
                      key={icon} 
                      type="button" 
                      onClick={() => setSelectedIcon(icon)}
                      className={`w-11 h-11 flex items-center justify-center rounded-xl text-xl transition-all ${selectedIcon === icon ? 'bg-black text-white shadow-lg scale-110' : 'bg-white hover:bg-gray-200 shadow-sm'}`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('targetValue')}</label>
                <input name="targetValue" type="number" step="0.01" defaultValue={editingGoal?.targetValue || ""} required className="font-bold text-lg" />
              </div>
              
              <button type="submit" className="primary-btn w-full py-4 text-lg shadow-xl shadow-red-100 mt-4">{t('save')}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Goals;
