
import React, { useMemo, useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Wallet, ArrowUpCircle, ArrowDownCircle, ChevronDown, Lock, TrendingUp, Landmark } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { transactions, assets, investments, goals, cards, monthConfigs } = useFinance();
  const { currentUser } = useAuth();
  const [selectedYear, setSelectedYear] = useState('2026');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Pequeno atraso para garantir que o layout CSS do container esteja pronto
    const timer = setTimeout(() => setIsClient(true), 150);
    return () => clearTimeout(timer);
  }, []);

  const currentMonthCode = `jan-${selectedYear.slice(-2)}`;

  const stats = useMemo(() => {
    const monthTransactions = transactions.filter(t => t.monthCode === currentMonthCode);
    const actualRevenues = monthTransactions.filter(t => t.type === 'Receita').reduce((acc, t) => acc + t.value, 0);
    const actualExpenses = monthTransactions.filter(t => t.type === 'Despesa').reduce((acc, t) => acc + t.value, 0);
    
    const config = monthConfigs.find(c => c.monthCode === currentMonthCode);
    const incomeBase = Math.max(actualRevenues, config?.income || 0);

    const ratio = incomeBase > 0 ? (actualExpenses / incomeBase) * 100 : 0;
    
    const totalAssets = assets.reduce((acc, a) => acc + a.value, 0);
    const totalInvestments = investments.reduce((acc, i) => acc + i.value, 0);
    const patrimonyTotal = totalAssets + totalInvestments;
    
    return { 
      revenues: actualRevenues, 
      expenses: actualExpenses, 
      balance: actualRevenues - actualExpenses, 
      patrimonyTotal, 
      totalAssets,
      totalInvestments,
      ratio, 
      incomeBase 
    };
  }, [transactions, assets, investments, monthConfigs, currentMonthCode]);

  const chartData = useMemo(() => {
    const months = [
      { code: 'jan', name: 'Jan' }, { code: 'fev', name: 'Fev' }, { code: 'mar', name: 'Mar' },
      { code: 'abr', name: 'Abr' }, { code: 'mai', name: 'Mai' }, { code: 'jun', name: 'Jun' },
      { code: 'jul', name: 'Jul' }, { code: 'ago', name: 'Ago' }, { code: 'set', name: 'Set' },
      { code: 'out', name: 'Out' }, { code: 'nov', name: 'Nov' }, { code: 'dez', name: 'Dez' }
    ];

    return months.map(m => {
      const code = `${m.code}-${selectedYear.slice(-2)}`;
      const exp = transactions.filter(t => t.monthCode === code && t.type === 'Despesa').reduce((acc, t) => acc + t.value, 0);
      return { name: m.name, valor: exp };
    });
  }, [transactions, selectedYear]);

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const getHealthStatus = () => {
    if (stats.ratio <= 80) return { label: 'No Azul', color: '#10b981', emoji: '🟢' };
    if (stats.ratio <= 100) return { label: 'No Limite', color: '#f59e0b', emoji: '🟡' };
    return { label: 'No Vermelho', color: '#FF385C', emoji: '🔴' };
  };

  const health = getHealthStatus();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      {/* Top Header Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="airbnb-card p-6 border-l-4 border-l-[#FF385C] flex flex-col justify-center">
          <span className="text-xs font-black uppercase text-gray-400 tracking-widest mb-1">Saldo Mensal ({currentMonthCode})</span>
          <span className={`text-3xl font-black ${stats.balance < 0 ? 'text-red-600' : 'text-black'}`}>{formatCurrency(stats.balance)}</span>
        </div>
        <div className="airbnb-card p-6 border-l-4 border-l-[#10b981] flex flex-col justify-center">
          <span className="text-xs font-black uppercase text-gray-400 tracking-widest mb-1">Receitas Acumuladas</span>
          <span className="text-3xl font-black">{formatCurrency(stats.revenues)}</span>
        </div>
        <div className="airbnb-card p-6 border-l-4 border-l-[#FF385C] flex flex-col justify-center">
          <span className="text-xs font-black uppercase text-gray-400 tracking-widest mb-1">Despesas Acumuladas</span>
          <span className="text-3xl font-black text-red-600">{formatCurrency(stats.expenses)}</span>
        </div>
      </div>

      {/* Info Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        
        {/* Termômetro Financeiro */}
        <div className="airbnb-card p-7 flex flex-col min-h-[220px]">
          <h3 className="text-xl font-extrabold mb-6">Termômetro Financeiro</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-gray-400">Saúde Financeira</span>
              <span className="flex items-center gap-1.5 text-sm font-bold" style={{ color: health.color }}>
                {health.label} <span className="text-xs">{health.emoji}</span>
              </span>
            </div>
            
            <div className="relative pt-1">
              <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                <div 
                  className="h-full transition-all duration-1000 rounded-full" 
                  style={{ width: `${Math.min(stats.ratio, 100)}%`, backgroundColor: health.color }} 
                />
              </div>
              <div className="flex justify-between mt-2 text-[10px] font-bold text-gray-300">
                <span>0%</span>
                <span className="ml-8">80%</span>
                <span>100%</span>
              </div>
            </div>

            <p className="text-xs text-gray-400 font-medium">
              Você gastou <span className="font-bold text-gray-800">{stats.ratio.toFixed(1)}%</span> da sua renda mensal.
            </p>
          </div>
        </div>

        {/* Metas Ativas */}
        <div className="airbnb-card p-7 flex flex-col min-h-[220px]">
          <h3 className="text-xl font-extrabold mb-6">Metas Ativas</h3>
          <div className="flex-1 flex flex-col justify-start">
            {goals.length > 0 ? (
              <div className="space-y-4">
                {goals.slice(0, 3).map(goal => {
                  const saved = transactions.filter(t => t.goalId === goal.id && t.paid).reduce((acc, t) => acc + (t.type === 'Receita' ? t.value : -t.value), 0);
                  const percent = goal.targetValue > 0 ? Math.min(Math.round((saved / goal.targetValue) * 100), 100) : 0;
                  return (
                    <div key={goal.id} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-gray-700">{goal.icon} {goal.name}</span>
                        <span className="text-gray-400 font-black">{percent}%</span>
                      </div>
                      <div className="w-full bg-gray-50 h-1.5 rounded-full overflow-hidden">
                        <div className="h-full bg-[#FF385C] rounded-full" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-400 font-medium mt-1">Nenhuma meta ativa.</p>
            )}
          </div>
        </div>

        {/* Cartões de Crédito */}
        <div className="airbnb-card p-7 flex flex-col min-h-[220px]">
          <h3 className="text-xl font-extrabold mb-6">Cartões de Crédito</h3>
          <div className="flex-1 flex flex-col justify-start">
            {cards.length > 0 ? (
              <div className="space-y-5">
                {cards.map(card => {
                  const spent = transactions.filter(t => t.monthCode === currentMonthCode && t.cardId === card.id).reduce((acc, t) => acc + t.value, 0);
                  const percent = card.limit > 0 ? Math.floor((spent / card.limit) * 100) : 0;
                  return (
                    <div key={card.id} className="flex justify-between items-center">
                      <div>
                        <span className="font-bold text-sm block text-gray-800">{card.name}</span>
                        <span className="text-[10px] text-gray-400 font-black uppercase">Limite: {formatCurrency(card.limit)}</span>
                      </div>
                      <div className={`text-xs font-black ${percent > 80 ? 'text-red-500' : 'text-green-500'}`}>
                        {percent}%
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-400 font-medium mt-1">Nenhum cartão cadastrado.</p>
            )}
          </div>
        </div>

        {/* Patrimônio */}
        <div className="airbnb-card p-7 flex flex-col min-h-[220px]">
          <h3 className="text-xl font-extrabold mb-6">Patrimônio</h3>
          {currentUser?.permissions.canViewPatrimony ? (
            <div className="space-y-4">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Valor Total</span>
                <span className="text-2xl font-black text-black">{formatCurrency(stats.patrimonyTotal)}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-gray-50 rounded-2xl flex flex-col">
                  <span className="text-[8px] font-black uppercase text-gray-400">Reservas</span>
                  <span className="text-xs font-bold text-gray-800">{formatCurrency(stats.totalAssets)}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-2xl flex flex-col">
                  <span className="text-[8px] font-black uppercase text-gray-400">Investidos</span>
                  <span className="text-xs font-bold text-gray-800">{formatCurrency(stats.totalInvestments)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center gap-2 text-gray-300 font-bold text-sm italic">
              <Lock size={16}/> Acesso Bloqueado
            </div>
          )}
        </div>
      </div>

      {/* Fluxo de Caixa Mensal Chart */}
      <div className="airbnb-card p-8">
        <div className="flex justify-between items-center mb-10">
          <h3 className="text-2xl font-extrabold tracking-tight">Fluxo de Caixa Mensal</h3>
          <div className="relative">
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(e.target.value)} 
              className="appearance-none bg-white border border-gray-200 px-8 py-2 rounded-xl text-sm font-bold cursor-pointer outline-none pr-10 focus:ring-0 shadow-sm"
            >
              {['2026', '2027', '2028', '2029', '2030'].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
          </div>
        </div>
        
        <div className="h-[400px] w-full min-h-[400px] overflow-hidden relative" style={{ minWidth: 0, minHeight: 0 }}>
          {isClient && (
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#666', fontSize: 12, fontWeight: 700 }} 
                  interval={0}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#AAA', fontSize: 11, fontWeight: 600 }} 
                  tickFormatter={(val) => `R$${(val/1000).toFixed(0)}k`} 
                />
                <Tooltip 
                  cursor={{ fill: '#F7F7F7' }} 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '12px' }} 
                />
                <Bar dataKey="valor" fill="#FF385C" radius={[6, 6, 6, 6]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
