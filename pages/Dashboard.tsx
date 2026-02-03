
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
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black">{t('hello')}, {currentUser?.name.split(' ')[0]}!</h1>
          <p className="text-gray-500 text-sm font-medium">{t('summaryOf')} <span className="text-black font-bold">{MONTH_NAMES[selectedMonthIdx]} {selectedYear}</span></p>
        </div>
        <div className="flex flex-wrap gap-3">
           <div className="relative group flex-1 md:flex-none min-w-[170px]">
             <select 
              value={selectedMonthIdx} 
              onChange={(e) => setSelectedMonthIdx(Number(e.target.value))}
              className="bg-white border border-gray-200 pl-6 pr-12 py-3.5 rounded-xl text-sm font-black shadow-sm outline-none hover:border-black transition-colors cursor-pointer w-full appearance-none"
             >
               {MONTH_NAMES.map((name, i) => <option key={name} value={i}>{name}</option>)}
             </select>
             <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-black" size={18} />
           </div>

           <div className="relative group flex-1 md:flex-none min-w-[120px]">
             <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-white border border-gray-200 pl-6 pr-12 py-3.5 rounded-xl text-sm font-black shadow-sm outline-none hover:border-black transition-colors cursor-pointer w-full appearance-none"
             >
               {['2025', '2026', '2027', '2028'].map(year => <option key={year} value={year}>{year}</option>)}
             </select>
             <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-black" size={18} />
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <div className={`airbnb-card p-5 md:p-6 border-l-4 flex flex-col justify-center ${getBorderColor(stats.balance)}`}>
          <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">{t('monthlyBalance')}</span>
          <span className={`text-2xl md:text-3xl font-black ${getValueColor(stats.balance)}`}>{formatCurrency(stats.balance)}</span>
        </div>
        <div className="airbnb-card p-5 md:p-6 border-l-4 border-l-green-600 flex flex-col justify-center">
          <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">{t('revenues')}</span>
          <span className={`text-2xl md:text-3xl font-black ${getValueColor(stats.revenues)}`}>{formatCurrency(stats.revenues)}</span>
        </div>
        <div className="airbnb-card p-5 md:p-6 border-l-4 border-l-red-600 flex flex-col justify-center sm:col-span-2 md:col-span-1">
          <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">{t('expenses')}</span>
          <span className={`text-2xl md:text-3xl font-black ${stats.expenses > 0 ? 'text-red-600' : 'text-gray-400'}`}>
            {stats.expenses > 0 ? '-' : ''}{formatCurrency(stats.expenses)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
        <div className="airbnb-card p-6 flex flex-col min-h-[220px]">
          <h3 className="text-lg font-extrabold mb-4">{t('thermometer')}</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-400">{t('status')}</span>
              <span className="flex items-center gap-1.5 text-xs font-bold" style={{ color: health.color }}>
                {health.label} <span className="text-xs">{health.emoji}</span>
              </span>
            </div>
            <div className="relative pt-1">
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                <div className="h-full transition-all duration-1000 rounded-full" style={{ width: `${Math.min(stats.ratio, 100)}%`, backgroundColor: health.color }} />
              </div>
            </div>
            <p className="text-[10px] text-gray-400 font-medium">
              {t('spendingRatio')}: <span className="font-bold text-gray-800">{stats.ratio.toFixed(1)}%</span> {t('ofRevenue')}.
            </p>
          </div>
        </div>

        <div className="airbnb-card p-6 flex flex-col min-h-[220px]">
          <h3 className="text-lg font-extrabold mb-4">{t('goals')}</h3>
          <div className="flex-1 space-y-4">
            {goals.slice(0, 3).map(goal => {
              const savedValue = transactions.filter(t => t.goalId === goal.id && t.paid).reduce((acc, t) => acc + (t.type === 'Receita' ? t.value : -t.value), 0);
              const percent = goal.targetValue > 0 ? Math.min(Math.round((savedValue / goal.targetValue) * 100), 100) : 0;
              return (
                <div key={goal.id} className="space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className="truncate max-w-[120px]">{goal.icon} {goal.name}</span>
                    <span className={getValueColor(savedValue)}>{formatCurrency(savedValue)}</span>
                  </div>
                  <div className="w-full bg-gray-50 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full bg-[#FF385C] rounded-full" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
            {goals.length === 0 && <p className="text-[10px] italic text-gray-300">{t('noGoals')}.</p>}
          </div>
        </div>

        <div className="airbnb-card p-6 flex flex-col min-h-[220px]">
          <h3 className="text-lg font-extrabold mb-4">{t('cards')}</h3>
          <div className="flex-1 space-y-3">
            {cards.slice(0, 4).map(card => {
              const spent = transactions.filter(t => t.monthCode === currentMonthCode && t.cardId === card.id).reduce((acc, t) => acc + t.value, 0);
              return (
                <div key={card.id} className="flex justify-between items-center">
                  <span className="font-bold text-xs text-gray-800 truncate pr-2">{card.name}</span>
                  <span className="text-xs font-black text-red-600 whitespace-nowrap">{formatCurrency(spent)}</span>
                </div>
              );
            })}
            {cards.length === 0 && <p className="text-[10px] italic text-gray-300">{t('noCards')}.</p>}
          </div>
        </div>

        <div className="airbnb-card p-6 flex flex-col min-h-[220px]">
          <h3 className="text-lg font-extrabold mb-4">{t('patrimony')}</h3>
          {currentUser?.permissions.canViewPatrimony ? (
            <div className="space-y-4">
              <span className={`text-xl md:text-2xl font-black ${getValueColor(stats.patrimonyTotal)}`}>{formatCurrency(stats.patrimonyTotal)}</span>
              <div className="grid grid-cols-1 gap-2">
                <div className="flex justify-between text-[10px] font-black uppercase text-gray-400">
                  <span>{language === 'pt' ? 'Reservas' : 'Reserves'}:</span>
                  <span className="text-gray-800">{formatCurrency(stats.totalAssets)}</span>
                </div>
                <div className="flex justify-between text-[10px] font-black uppercase text-gray-400">
                  <span>{language === 'pt' ? 'Investido' : 'Invested'}:</span>
                  <span className="text-gray-800">{formatCurrency(stats.totalInvestments)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-300 font-bold italic text-sm"><Lock size={16} className="mr-2"/> Blocked</div>
          )}
        </div>
      </div>

      <div className="airbnb-card p-5 md:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 md:mb-10">
          <h3 className="text-xl md:text-2xl font-extrabold">{t('expenses')} {selectedYear}</h3>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400">
            <Calendar size={14} /> {t('annualVision')}
          </div>
        </div>
        <div className="h-[250px] md:h-[350px] w-full">
          {isClient && (
            <ResponsiveContainer width="100%" height="100%">
              {/* Force re-render of chart when language changes by using key={language} */}
              <BarChart data={chartData} key={language}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#666', fontSize: isMobile ? 8 : 10, fontWeight: 700 }}
                  interval={0}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#AAA', fontSize: 9 }} />
                <Tooltip cursor={{ fill: '#F7F7F7' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontSize: '12px' }} />
                <Bar 
                  dataKey="valor" 
                  fill="#FF385C" 
                  radius={[4, 4, 4, 4]} 
                  barSize={isMobile ? 12 : 20} 
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
