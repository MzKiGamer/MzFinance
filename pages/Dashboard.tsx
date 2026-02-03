
import React, { useMemo, useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ChevronDown, Lock, TrendingUp, Calendar } from 'lucide-react';

const MONTH_CODES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

const Dashboard: React.FC = () => {
  const { transactions, assets, investments, goals, cards } = useFinance();
  const { currentUser } = useAuth();
  const { t, language } = useLanguage();
  
  const MONTH_NAMES = useMemo(() => t('monthNames') as string[], [language, t]);

  const now = new Date();
  const [selectedMonthIdx, setSelectedMonthIdx] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear().toString());
  
  const [isClient, setIsClient] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    const timer = setTimeout(() => setIsClient(true), 150);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const isMobile = windowWidth < 640;
  const currentMonthCode = `${MONTH_CODES[selectedMonthIdx]}-${selectedYear.slice(-2)}`;

  const stats = useMemo(() => {
    const monthTransactions = transactions.filter(t => t.monthCode === currentMonthCode);
    const actualRevenues = monthTransactions.filter(t => t.type === 'Receita').reduce((acc, t) => acc + t.value, 0);
    const actualExpenses = monthTransactions.filter(t => t.type === 'Despesa').reduce((acc, t) => acc + t.value, 0);
    
    const totalAssets = assets.reduce((acc, a) => acc + a.value, 0);
    const totalInvestments = investments.reduce((acc, i) => acc + i.value, 0);
    const patrimonyTotal = totalAssets + totalInvestments;
    
    const ratio = actualRevenues > 0 ? (actualExpenses / actualRevenues) * 100 : 0;
    
    return { 
      revenues: actualRevenues, 
      expenses: actualExpenses, 
      balance: actualRevenues - actualExpenses, 
      patrimonyTotal, 
      totalAssets,
      totalInvestments,
      ratio, 
      incomeBase: actualRevenues 
    };
  }, [transactions, assets, investments, currentMonthCode]);

  const chartData = useMemo(() => {
    return MONTH_CODES.map((code, idx) => {
      const mCode = `${code}-${selectedYear.slice(-2)}`;
      const exp = transactions.filter(t => t.monthCode === mCode && t.type === 'Despesa').reduce((acc, t) => acc + t.value, 0);
      const displayName = MONTH_NAMES[idx].substring(0, 3).toUpperCase();
      return { name: displayName, valor: exp };
    });
  }, [transactions, selectedYear, MONTH_NAMES]);

  const formatCurrency = (val: number) => new Intl.NumberFormat(language === 'pt' ? 'pt-BR' : 'en-US', { 
    style: 'currency', 
    currency: language === 'pt' ? 'BRL' : 'USD' 
  }).format(val);

  const getValueColor = (val: number) => {
    if (val > 0) return 'text-green-600';
    if (val < 0) return 'text-red-600';
    return 'text-gray-400';
  };

  const getBorderColor = (val: number) => {
    if (val > 0) return 'border-l-green-600';
    if (val < 0) return 'border-l-red-600';
    return 'border-l-gray-300';
  };

  const health = useMemo(() => {
    if (stats.incomeBase === 0) return { label: t('noRevenue'), color: '#9ca3af', emoji: '⚪' };
    if (stats.ratio <= 80) return { label: t('inBlue'), color: '#10b981', emoji: '🟢' };
    if (stats.ratio <= 100) return { label: t('onLimit'), color: '#f59e0b', emoji: '🟡' };
    return { label: t('inRed'), color: '#FF385C', emoji: '🔴' };
  }, [stats.ratio, stats.incomeBase, t]);

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-black">{t('hello')}, {currentUser?.name.split(' ')[0]}!</h1>
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">{t('summaryOf')} <span className="text-black font-black">{MONTH_NAMES[selectedMonthIdx]} {selectedYear}</span></p>
        </div>
        <div className="flex flex-wrap gap-2">
           <div className="relative group flex-1 md:flex-none min-w-[150px]">
             <select 
              value={selectedMonthIdx} 
              onChange={(e) => setSelectedMonthIdx(Number(e.target.value))}
              className="bg-white border border-gray-200 pl-4 pr-10 py-2 rounded-xl text-xs font-black shadow-sm outline-none hover:border-black transition-colors cursor-pointer w-full appearance-none"
             >
               {MONTH_NAMES.map((name, i) => <option key={name} value={i}>{name}</option>)}
             </select>
             <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-black" size={14} />
           </div>

           <div className="relative group flex-1 md:flex-none min-w-[100px]">
             <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-white border border-gray-200 pl-4 pr-10 py-2 rounded-xl text-xs font-black shadow-sm outline-none hover:border-black transition-colors cursor-pointer w-full appearance-none"
             >
               {['2025', '2026', '2027', '2028'].map(year => <option key={year} value={year}>{year}</option>)}
             </select>
             <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-black" size={14} />
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className={`airbnb-card p-4 border-l-4 flex flex-col justify-center ${getBorderColor(stats.balance)}`}>
          <span className="text-[8px] font-black uppercase text-gray-400 tracking-widest mb-0.5">{t('monthlyBalance')}</span>
          <span className={`text-base font-black ${getValueColor(stats.balance)}`}>{formatCurrency(stats.balance)}</span>
        </div>
        <div className="airbnb-card p-4 border-l-4 border-l-green-600 flex flex-col justify-center">
          <span className="text-[8px] font-black uppercase text-gray-400 tracking-widest mb-0.5">{t('revenues')}</span>
          <span className={`text-base font-black ${getValueColor(stats.revenues)}`}>{formatCurrency(stats.revenues)}</span>
        </div>
        <div className="airbnb-card p-4 border-l-4 border-l-red-600 flex flex-col justify-center">
          <span className="text-[8px] font-black uppercase text-gray-400 tracking-widest mb-0.5">{t('expenses')}</span>
          <span className={`text-base font-black ${stats.expenses > 0 ? 'text-red-600' : 'text-gray-400'}`}>
            {stats.expenses > 0 ? '-' : ''}{formatCurrency(stats.expenses)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <div className="airbnb-card p-4 flex flex-col min-h-[160px]">
          <h3 className="text-sm font-black mb-3">{t('thermometer')}</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-gray-400">{t('status')}</span>
              <span className="flex items-center gap-1 text-[10px] font-black uppercase" style={{ color: health.color }}>
                {health.label} <span className="text-xs">{health.emoji}</span>
              </span>
            </div>
            <div className="relative pt-1">
              <div className="w-full bg-gray-50 h-2 rounded-full overflow-hidden border border-gray-100">
                <div className="h-full transition-all duration-1000 rounded-full" style={{ width: `${Math.min(stats.ratio, 100)}%`, backgroundColor: health.color }} />
              </div>
            </div>
            <p className="text-[8px] text-gray-400 font-bold uppercase tracking-tight">
              {t('spendingRatio')}: <span className="text-gray-800">{stats.ratio.toFixed(1)}%</span> {t('ofRevenue')}.
            </p>
          </div>
        </div>

        <div className="airbnb-card p-4 flex flex-col min-h-[160px]">
          <h3 className="text-sm font-black mb-3">{t('goals')}</h3>
          <div className="flex-1 space-y-3">
            {goals.slice(0, 3).map(goal => {
              const savedValue = transactions.filter(t => t.goalId === goal.id && t.paid).reduce((acc, t) => acc + (t.type === 'Receita' ? t.value : -t.value), 0);
              const percent = goal.targetValue > 0 ? Math.min(Math.round((savedValue / goal.targetValue) * 100), 100) : 0;
              return (
                <div key={goal.id} className="space-y-1">
                  <div className="flex justify-between items-center text-[9px] font-bold">
                    <span className="truncate max-w-[100px] text-gray-600">{goal.icon} {goal.name}</span>
                    <span className={`font-black ${getValueColor(savedValue)}`}>{formatCurrency(savedValue)}</span>
                  </div>
                  <div className="w-full bg-gray-50 h-1 rounded-full overflow-hidden border border-gray-100">
                    <div className="h-full bg-[#FF385C] rounded-full" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
            {goals.length === 0 && <p className="text-[9px] italic text-gray-300 font-bold">{t('noGoals')}.</p>}
          </div>
        </div>

        <div className="airbnb-card p-4 flex flex-col min-h-[160px]">
          <h3 className="text-sm font-black mb-3">{t('cards')}</h3>
          <div className="flex-1 space-y-2">
            {cards.slice(0, 4).map(card => {
              const spent = transactions.filter(t => t.monthCode === currentMonthCode && t.cardId === card.id).reduce((acc, t) => acc + t.value, 0);
              return (
                <div key={card.id} className="flex justify-between items-center py-0.5">
                  <span className="font-bold text-[10px] text-gray-500 truncate pr-2">{card.name}</span>
                  <span className="text-[10px] font-black text-red-600 whitespace-nowrap">{formatCurrency(spent)}</span>
                </div>
              );
            })}
            {cards.length === 0 && <p className="text-[9px] italic text-gray-300 font-bold">{t('noCards')}.</p>}
          </div>
        </div>

        <div className="airbnb-card p-4 flex flex-col min-h-[160px]">
          <h3 className="text-sm font-black mb-3">{t('patrimony')}</h3>
          {currentUser?.permissions.canViewPatrimony ? (
            <div className="space-y-3">
              <span className={`text-base font-black ${getValueColor(stats.patrimonyTotal)}`}>{formatCurrency(stats.patrimonyTotal)}</span>
              <div className="grid grid-cols-1 gap-1.5">
                <div className="flex justify-between text-[8px] font-black uppercase text-gray-400 tracking-widest">
                  <span>{language === 'pt' ? 'Reservas' : 'Reserves'}:</span>
                  <span className="text-gray-800">{formatCurrency(stats.totalAssets)}</span>
                </div>
                <div className="flex justify-between text-[8px] font-black uppercase text-gray-400 tracking-widest">
                  <span>{language === 'pt' ? 'Investido' : 'Invested'}:</span>
                  <span className="text-gray-800">{formatCurrency(stats.totalInvestments)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-200 font-bold italic text-xs"><Lock size={14} className="mr-2"/> Blocked</div>
          )}
        </div>
      </div>

      <div className="airbnb-card p-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
          <h3 className="text-base font-black uppercase tracking-tight">{t('expenses')} {selectedYear}</h3>
          <div className="flex items-center gap-2 text-[8px] font-black uppercase text-gray-400 tracking-widest">
            <Calendar size={12} /> {t('annualVision')}
          </div>
        </div>
        <div className="h-[250px] md:h-[300px] w-full">
          {isClient && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} key={language}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#AAA', fontSize: 8, fontWeight: 800 }}
                  interval={0}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#DDD', fontSize: 8 }} />
                <Tooltip cursor={{ fill: '#F9F9F9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 20px rgba(0,0,0,0.05)', fontSize: '10px', fontWeight: 'bold' }} />
                <Bar 
                  dataKey="valor" 
                  fill="#FF385C" 
                  radius={[3, 3, 3, 3]} 
                  barSize={isMobile ? 12 : 24} 
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
