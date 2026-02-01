
import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { PAYMENT_METHODS } from '../constants';
import { Plus, Trash2, ChevronLeft, ChevronRight, ChevronDown, Percent } from 'lucide-react';
import { Transaction, TransactionType } from '../types';

const MONTH_NAMES = [
  { code: 'jan', name: 'Janeiro' }, { code: 'fev', name: 'Fevereiro' },
  { code: 'mar', name: 'Março' }, { code: 'abr', name: 'Abril' },
  { code: 'mai', name: 'Maio' }, { code: 'jun', name: 'Junho' },
  { code: 'jul', name: 'Julho' }, { code: 'ago', name: 'Agosto' },
  { code: 'set', name: 'Setembro' }, { code: 'out', name: 'Outubro' },
  { code: 'nov', name: 'Novembro' }, { code: 'dez', name: 'Dezembro' }
];

const MonthlyControl: React.FC = () => {
  const { 
    transactions, setTransactions, 
    categories, monthConfigs, updateMonthConfig, cards, goals
  } = useFinance();

  const [selMonthIdx, setSelMonthIdx] = useState(new Date().getMonth());
  const [selYear, setSelYear] = useState(new Date().getFullYear().toString());
  const currentMonthCode = `${MONTH_NAMES[selMonthIdx].code}-${selYear.slice(-2)}`;

  const [isAdding, setIsAdding] = useState(false);

  const config = useMemo(() => 
    monthConfigs.find(c => c.monthCode === currentMonthCode) || {
        monthCode: currentMonthCode,
        income: 0,
        needsPercent: 50,
        desiresPercent: 20,
        savingsPercent: 30
    }
  , [monthConfigs, currentMonthCode]);

  const monthTransactions = useMemo(() => 
    transactions.filter(t => t.monthCode === currentMonthCode).sort((a, b) => b.day - a.day)
  , [transactions, currentMonthCode]);

  const stats = useMemo(() => {
    const res = monthTransactions.filter(t => t.type === 'Receita').reduce((a, b) => a + b.value, 0);
    const exp = monthTransactions.filter(t => t.type === 'Despesa').reduce((a, b) => a + b.value, 0);
    return { res, exp, balance: res - exp };
  }, [monthTransactions]);

  const dailySpend = useMemo(() => {
    const days: Record<number, number> = {};
    monthTransactions.filter(t => t.type === 'Despesa').forEach(t => {
      days[t.day] = (days[t.day] || 0) + t.value;
    });
    return Object.entries(days).map(([day, value]) => ({ day: Number(day), value }));
  }, [monthTransactions]);

  const handleUpdateConfig = (field: string, value: number) => {
    // Se for um campo de porcentagem, aplicar a regra de 100%
    if (['needsPercent', 'desiresPercent', 'savingsPercent'].includes(field)) {
      const otherFields = ['needsPercent', 'desiresPercent', 'savingsPercent'].filter(f => f !== field);
      const othersSum = (config[otherFields[0] as keyof typeof config] as number || 0) + 
                        (config[otherFields[1] as keyof typeof config] as number || 0);
      
      const maxValue = Math.max(0, 100 - othersSum);
      const constrainedValue = Math.min(Math.max(0, value), maxValue);
      
      updateMonthConfig({ ...config, [field]: constrainedValue });
    } else {
      updateMonthConfig({ ...config, [field]: value });
    }
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const totalPercent = (config.needsPercent || 0) + (config.desiresPercent || 0) + (config.savingsPercent || 0);

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {/* Header & Month Switcher */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4">
        <div className="relative">
          <select 
            value={selYear}
            onChange={(e) => setSelYear(e.target.value)}
            className="appearance-none bg-white border border-[#EBEBEB] rounded-xl px-8 py-2 font-bold shadow-sm cursor-pointer outline-none focus:ring-0 pr-10"
          >
            {['2025', '2026', '2027', '2028', '2029', '2030'].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
        </div>
        
        <div className="flex items-center gap-6 md:gap-12 font-extrabold text-xl">
          <button onClick={() => setSelMonthIdx(prev => Math.max(0, prev - 1))} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ChevronLeft size={24} />
          </button>
          <span className="min-w-[140px] text-center">{MONTH_NAMES[selMonthIdx].name} {selYear}</span>
          <button onClick={() => setSelMonthIdx(prev => Math.min(11, prev + 1))} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ChevronRight size={24} />
          </button>
        </div>
        <div className="hidden md:block w-20" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-8">
          {/* Planning Section Dinâmico */}
          <div className="airbnb-card p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-black uppercase text-gray-400 tracking-widest">Configuração do Orçamento</h3>
              <div className={`text-[10px] font-black px-3 py-1 rounded-full ${totalPercent === 100 ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                SOMA: {totalPercent}%
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 block mb-2">Renda Mensal (R$)</label>
                <input 
                  type="number" 
                  value={config.income || ''} 
                  placeholder="0,00"
                  onChange={(e) => handleUpdateConfig('income', Number(e.target.value))}
                  className="bg-[#F9F9F9] border-[#EBEBEB] rounded-xl p-3 font-bold w-full text-lg focus:bg-white transition-all"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 block">Necessidades (%)</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    min="0"
                    max="100"
                    value={config.needsPercent} 
                    onChange={(e) => handleUpdateConfig('needsPercent', Number(e.target.value))}
                    className="bg-[#F9F9F9] border-[#EBEBEB] rounded-xl p-3 font-bold w-20 text-center"
                  />
                  <div className="flex-1 bg-white border border-[#EBEBEB] rounded-xl p-3 text-xs font-bold text-gray-400 overflow-hidden whitespace-nowrap">
                    {formatCurrency((config.income || 0) * (config.needsPercent / 100))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 block">Poupança (%)</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    min="0"
                    max="100"
                    value={config.savingsPercent} 
                    onChange={(e) => handleUpdateConfig('savingsPercent', Number(e.target.value))}
                    className="bg-[#F9F9F9] border-[#EBEBEB] rounded-xl p-3 font-bold w-20 text-center"
                  />
                  <div className="flex-1 bg-white border border-[#EBEBEB] rounded-xl p-3 text-xs font-bold text-gray-400 overflow-hidden whitespace-nowrap">
                    {formatCurrency((config.income || 0) * (config.savingsPercent / 100))}
                  </div>
                </div>
              </div>
            </div>
          </div>

           <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 block">Desejos (%)</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    min="0"
                    max="100"
                    value={config.desiresPercent} 
                    onChange={(e) => handleUpdateConfig('desiresPercent', Number(e.target.value))}
                    className="bg-[#F9F9F9] border-[#EBEBEB] rounded-xl p-3 font-bold w-20 text-center"
                  />
                  <div className="flex-1 bg-white border border-[#EBEBEB] rounded-xl p-3 text-xs font-bold text-gray-400 overflow-hidden whitespace-nowrap">
                    {formatCurrency((config.income || 0) * (config.desiresPercent / 100))}
                  </div>
                </div>
              </div>

          {/* Transactions Table */}
          <div className="airbnb-card p-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-extrabold">Transações</h2>
              <button 
                onClick={() => setIsAdding(true)}
                className="primary-btn flex items-center gap-2 shadow-lg shadow-red-100"
              >
                <Plus size={18} /> Nova Transação
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-4">
                    <th className="pb-4">Pago</th>
                    <th className="pb-4">Dia</th>
                    <th className="pb-4">Descrição</th>
                    <th className="pb-4">Categoria</th>
                    <th className="pb-4">Valor</th>
                    <th className="pb-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {monthTransactions.map(tx => (
                    <tr key={tx.id} className="group hover:bg-gray-50 transition-colors">
                      <td className="py-5">
                        <div 
                          className={`w-5 h-5 rounded-full border-2 transition-all cursor-pointer ${tx.paid ? 'bg-[#FF385C] border-[#FF385C]' : 'border-gray-200 hover:border-gray-400'}`} 
                          onClick={() => setTransactions(prev => prev.map(t => t.id === tx.id ? {...t, paid: !t.paid} : t))} 
                        />
                      </td>
                      <td className="py-5 text-sm font-bold text-gray-500">{tx.day.toString().padStart(2, '0')}</td>
                      <td className="py-5">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-800">{tx.description}</span>
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{tx.paymentMethod}</span>
                        </div>
                      </td>
                      <td className="py-5">
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full text-[10px] font-black uppercase tracking-tight border border-gray-100">
                          {categories.find(c => c.id === tx.categoryId)?.name || 'Outros'}
                        </span>
                      </td>
                      <td className={`py-5 font-bold ${tx.type === 'Receita' ? 'text-green-600' : 'text-[#FF385C]'}`}>
                        {tx.type === 'Receita' ? '+' : '-'} {formatCurrency(tx.value)}
                      </td>
                      <td className="py-5 text-right">
                        <button onClick={() => setTransactions(prev => prev.filter(t => t.id !== tx.id))} className="text-gray-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-2">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {monthTransactions.length === 0 && (
                    <tr><td colSpan={6} className="py-20 text-center text-gray-400 font-bold italic">Nenhuma transação lançada neste período.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="airbnb-card p-6 space-y-6">
            <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest">Resumo Financeiro</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-medium">Entradas</span>
                <span className="text-[#10b981] font-bold">{formatCurrency(stats.res)}</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                <span className="text-gray-400 font-medium">Saídas</span>
                <span className="text-[#FF385C] font-bold">-{formatCurrency(stats.exp)}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-lg font-black tracking-tighter">Saldo Líquido</span>
                <span className={`text-xl font-black ${stats.balance >= 0 ? 'text-[#10b981]' : 'text-[#FF385C]'}`}>
                  {formatCurrency(stats.balance)}
                </span>
              </div>
            </div>
          </div>

          <div className="airbnb-card p-6">
            <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest mb-6">Maiores Gastos do Dia</h3>
            <div className="space-y-4">
              {dailySpend.sort((a,b)=>b.value-a.value).slice(0, 5).map(item => (
                <div key={item.day} className="flex justify-between items-center group">
                  <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-[10px] font-black border border-gray-100 group-hover:bg-black group-hover:text-white transition-colors">{item.day}</div>
                  <span className="font-bold text-gray-800">{formatCurrency(item.value)}</span>
                </div>
              ))}
              {dailySpend.length === 0 && <p className="text-xs text-gray-400 italic text-center py-4">Nenhum gasto registrado.</p>}
            </div>
          </div>
        </div>
      </div>
      
      {isAdding && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-lg p-10 animate-in zoom-in duration-300 shadow-2xl">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-black tracking-tight">Nova Transação</h2>
                    <button onClick={() => setIsAdding(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                      <Trash2 size={18} className="text-gray-300 hover:text-red-500" />
                    </button>
                </div>
                <form onSubmit={(e) => {
                   e.preventDefault();
                   const fd = new FormData(e.currentTarget);
                   const nt: Transaction = {
                     id: crypto.randomUUID(),
                     monthCode: currentMonthCode,
                     description: fd.get('description') as string,
                     day: Number(fd.get('day')),
                     type: fd.get('type') as TransactionType,
                     value: Number(fd.get('value')),
                     categoryId: fd.get('categoryId') as string,
                     paymentMethod: fd.get('paymentMethod') as string,
                     cardId: fd.get('cardId') as string || undefined,
                     goalId: fd.get('goalId') as string || undefined,
                     paid: fd.get('paid') === 'on',
                     notes: ''
                   };
                   setTransactions(prev => [...prev, nt]);
                   setIsAdding(false);
                }} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Tipo de Fluxo</label>
                            <select name="type" required className="font-bold"><option value="Despesa">Despesa</option><option value="Receita">Receita</option></select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Dia do Mês</label>
                            <input name="day" type="number" min="1" max="31" defaultValue={new Date().getDate()} required className="font-bold" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Descrição</label>
                        <input name="description" required placeholder="Ex: Aluguel, Supermercado..." className="font-bold" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Valor Final (R$)</label>
                            <input name="value" type="number" step="0.01" required placeholder="0,00" className="font-bold" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Categoria</label>
                            <select name="categoryId" required className="font-bold">
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Método</label>
                          <select name="paymentMethod" required className="font-bold">
                              {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                      </div>
                      <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Vincular Meta</label>
                          <select name="goalId" className="font-bold">
                              <option value="">Nenhuma Meta</option>
                              {goals.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                          </select>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl cursor-pointer">
                      <input type="checkbox" name="paid" id="paid" className="w-5 h-5 accent-[#FF385C]" />
                      <label htmlFor="paid" className="text-sm font-bold text-gray-600 cursor-pointer">Marcar como já pago / recebido</label>
                    </div>
                    <div className="flex gap-3">
                      <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-4 font-bold text-gray-400 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-colors">Cancelar</button>
                      <button type="submit" className="flex-[2] primary-btn shadow-xl shadow-red-100">Lançar Transação</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default MonthlyControl;
