
import React, { useMemo, useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Plus, Trophy, Trash2 } from 'lucide-react';
import { Goal } from '../types';

const SYMBOLS = ['🎯', '✈️', '🚗', '🏠', '💍', '💻', '🎓', '🏥', '🏄', '🚀', '💰', '👶', '🚴', '🎸', '🕹️', '🎨'];

const Goals: React.FC = () => {
  const { goals, setGoals, transactions } = useFinance();
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
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-[#FFF2F5] rounded-full flex items-center justify-center text-[#FF385C] shadow-sm">
            <Trophy size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Minhas Metas</h1>
            <p className="text-gray-500 font-medium">Acompanhe seu progresso e realize sonhos.</p>
          </div>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-[#FF385C] text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-md active:scale-95"
        >
          <Plus size={20} /> Nova Meta
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {goalsCalculated.map(goal => {
          const percent = goal.targetValue > 0 ? Math.min((goal.actual / goal.targetValue) * 100, 100) : 0;
          return (
            <div key={goal.id} className="airbnb-card p-8 group relative overflow-hidden">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl">{goal.icon || '🎯'}</span>
                <h3 className="text-xl font-extrabold text-gray-800">{goal.name}</h3>
                <button 
                  onClick={() => setGoals(prev => prev.filter(g => g.id !== goal.id))}
                  className="absolute top-4 right-4 text-gray-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400 font-bold">Progresso</span>
                  <span className="font-extrabold text-gray-800">{percent.toFixed(1)}%</span>
                </div>
                
                <div className="w-full h-2 bg-[#F7F7F7] rounded-full overflow-hidden">
                  <div className="h-full bg-[#FF385C] rounded-full transition-all duration-1000" style={{ width: `${percent}%` }} />
                </div>

                <div className="flex justify-between items-end pt-4">
                  <div>
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-1">Guardado</span>
                    <span className="text-2xl font-black text-[#10b981]">{formatCurrency(goal.actual)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-1">Meta</span>
                    <span className="text-sm font-bold text-gray-800">{formatCurrency(goal.targetValue)}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {goals.length === 0 && (
          <div className="col-span-full py-20 text-center airbnb-card border-dashed">
            <p className="text-gray-400 font-bold italic">Você ainda não tem metas. Clique em "Nova Meta" para começar!</p>
          </div>
        )}
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-10 animate-in zoom-in duration-300 shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">🎯 Definir Nova Meta</h2>
              <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-black font-bold">FECHAR</button>
            </div>
            <form onSubmit={(e) => {
               e.preventDefault();
               const fd = new FormData(e.currentTarget);
               const ng: Goal = {
                 id: crypto.randomUUID(),
                 name: fd.get('name') as string,
                 icon: selectedIcon,
                 targetValue: Number(fd.get('targetValue')),
                 savedValue: 0
               };
               setGoals(prev => [...prev, ng]);
               setIsAdding(false);
            }} className="space-y-6">
              <div>
                <label className="text-sm font-bold mb-3 block">Escolha um Ícone</label>
                <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                  {SYMBOLS.map(sym => (
                    <button 
                      key={sym} 
                      type="button" 
                      onClick={() => setSelectedIcon(sym)}
                      className={`w-10 h-10 flex items-center justify-center rounded-xl text-xl transition-all ${selectedIcon === sym ? 'bg-[#FF385C] text-white shadow-md' : 'hover:bg-gray-200'}`}
                    >
                      {sym}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-bold mb-2 block">Nome da Meta</label>
                <input name="name" placeholder="Ex: Viagem Europa" required className="bg-gray-50 text-lg py-4" />
              </div>
              <div>
                <label className="text-sm font-bold mb-2 block">Valor Total Alvo (R$)</label>
                <input name="targetValue" type="number" step="0.01" required className="bg-gray-50 text-lg py-4" />
              </div>
              <button type="submit" className="primary-btn w-full py-4 text-lg">Criar Meta</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Goals;
