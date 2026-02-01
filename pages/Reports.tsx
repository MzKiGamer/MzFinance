
import React, { useMemo, useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
// Fix: Removed ChevronDown from recharts imports as it is an icon and should come from lucide-react.
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { ChevronDown as ChevronDownIcon } from 'lucide-react';

const MONTH_DATA = [
  { code: 'jan', name: 'Janeiro' },
  { code: 'fev', name: 'Fevereiro' },
  { code: 'mar', name: 'Março' },
  { code: 'abr', name: 'Abril' },
  { code: 'mai', name: 'Maio' },
  { code: 'jun', name: 'Junho' },
  { code: 'jul', name: 'Julho' },
  { code: 'ago', name: 'Agosto' },
  { code: 'set', name: 'Setembro' },
  { code: 'out', name: 'Outubro' },
  { code: 'nov', name: 'Novembro' },
  { code: 'dez', name: 'Dezembro' }
];

const Reports: React.FC = () => {
  const { transactions } = useFinance();
  const [isClient, setIsClient] = useState(false);
  const [selectedYear, setSelectedYear] = useState('2026');

  useEffect(() => {
    // Pequeno atraso para garantir que o layout CSS do container esteja pronto
    const timer = setTimeout(() => setIsClient(true), 150);
    return () => clearTimeout(timer);
  }, []);

  const annualData = useMemo(() => {
    const yearShort = selectedYear.slice(-2);
    return MONTH_DATA.map(m => {
      const monthCode = `${m.code}-${yearShort}`;
      const monthTx = transactions.filter(t => t.monthCode === monthCode);
      const res = monthTx.filter(t => t.type === 'Receita').reduce((acc, t) => acc + t.value, 0);
      const exp = monthTx.filter(t => t.type === 'Despesa').reduce((acc, t) => acc + t.value, 0);
      return {
        name: m.name,
        shortName: m.name.substring(0, 3),
        receitas: res,
        despesas: exp,
        saldo: res - exp
      };
    });
  }, [transactions, selectedYear]);

  const totals = useMemo(() => {
    const res = annualData.reduce((a, b) => a + b.receitas, 0);
    const exp = annualData.reduce((a, b) => a + b.despesas, 0);
    return { res, exp, balance: res - exp, ratio: res > 0 ? (exp / res) * 100 : 0 };
  }, [annualData]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Relatórios Anuais</h1>
          <p className="text-gray-500 font-medium">Análise consolidada do desempenho financeiro.</p>
        </div>
        
        <div className="relative">
          <select 
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="appearance-none bg-white border border-[#EBEBEB] rounded-2xl px-8 py-3 font-bold shadow-sm cursor-pointer outline-none focus:ring-0 pr-12 text-lg"
          >
            {['2025', '2026', '2027', '2028', '2029', '2030'].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <ChevronDownIcon size={18} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
        </div>
      </header>

      {/* Thermometer */}
      <div className="airbnb-card p-8">
        <h3 className="font-bold mb-4 text-gray-800">Termômetro Financeiro de {selectedYear}</h3>
        <div className="w-full bg-gray-100 h-6 rounded-full overflow-hidden mb-2">
            <div 
                className={`h-full transition-all duration-1000 ${
                    totals.ratio <= 80 ? 'bg-green-500' : totals.ratio <= 100 ? 'bg-yellow-500' : 'bg-red-500'
                }`} 
                style={{ width: `${Math.min(totals.ratio, 100)}%` }}
            />
        </div>
        <div className="flex flex-col md:flex-row justify-between items-center mt-6 gap-6">
            <div className="flex flex-wrap gap-8">
                <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Receitas Ano</span>
                    <span className="block font-black text-xl text-green-600">{formatCurrency(totals.res)}</span>
                </div>
                <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Despesas Ano</span>
                    <span className="block font-black text-xl text-red-600">{formatCurrency(totals.exp)}</span>
                </div>
                <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Saldo Final</span>
                    <span className={`block font-black text-xl ${totals.balance >= 0 ? 'text-indigo-600' : 'text-red-700'}`}>{formatCurrency(totals.balance)}</span>
                </div>
            </div>
            <div className={`text-sm font-black px-6 py-2 rounded-full shadow-sm border ${
                totals.ratio <= 80 ? 'bg-green-50 text-green-700 border-green-100' : totals.ratio <= 100 ? 'bg-yellow-50 text-yellow-700 border-yellow-100' : 'bg-red-50 text-red-700 border-red-100'
            }`}>
                {totals.ratio <= 80 ? 'No Azul 🟢' : totals.ratio <= 100 ? 'No Limite 🟡' : 'No Vermelho 🔴'}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="airbnb-card p-6">
            <h3 className="font-extrabold text-lg mb-6 text-gray-800">Evolução Mensal</h3>
            <div className="h-80 overflow-hidden relative" style={{ minWidth: 0, minHeight: 0 }}>
                {isClient && (
                  <ResponsiveContainer width="100%" height="100%" debounce={50}>
                      <LineChart data={annualData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                          <XAxis dataKey="shortName" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#666' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: '#AAA' }} tickFormatter={(val) => `R$${(val/1000).toFixed(0)}k`} />
                          <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '12px' }} />
                          <Legend verticalAlign="top" height={40} iconType="circle" wrapperStyle={{ fontWeight: 700, fontSize: '12px' }} />
                          <Line name="Receitas" type="monotone" dataKey="receitas" stroke="#10b981" strokeWidth={4} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                          <Line name="Despesas" type="monotone" dataKey="despesas" stroke="#ef4444" strokeWidth={4} dot={{ r: 4, fill: '#ef4444', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                          <Line name="Saldo" type="monotone" dataKey="saldo" stroke="#6366f1" strokeWidth={3} strokeDasharray="5 5" dot={false} />
                      </LineChart>
                  </ResponsiveContainer>
                )}
            </div>
        </div>

        <div className="airbnb-card p-6">
            <h3 className="font-extrabold text-lg mb-6 text-gray-800">Saldo por Mês</h3>
            <div className="h-80 overflow-hidden relative" style={{ minWidth: 0, minHeight: 0 }}>
                {isClient && (
                  <ResponsiveContainer width="100%" height="100%" debounce={50}>
                      <BarChart data={annualData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                          <XAxis dataKey="shortName" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#666' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: '#AAA' }} tickFormatter={(val) => `R$${(val/1000).toFixed(0)}k`} />
                          <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '12px' }} />
                          <Bar name="Saldo" dataKey="saldo" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={24} />
                      </BarChart>
                  </ResponsiveContainer>
                )}
            </div>
        </div>
      </div>

      <div className="airbnb-card overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-extrabold text-lg text-gray-800">Tabela Consolidada {selectedYear}</h3>
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">12 Meses</span>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <tr>
                        <th className="px-6 py-5">Mês</th>
                        <th className="px-6 py-5 text-right">Receitas</th>
                        <th className="px-6 py-5 text-right">Despesas</th>
                        <th className="px-6 py-5 text-right">Saldo</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                    {annualData.map(row => (
                        <tr key={row.name} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-5 font-bold text-gray-800">{row.name}</td>
                            <td className="px-6 py-5 text-right text-green-600 font-bold">{formatCurrency(row.receitas)}</td>
                            <td className="px-6 py-5 text-right text-red-600 font-bold">{formatCurrency(row.despesas)}</td>
                            <td className={`px-6 py-5 text-right font-black ${row.saldo >= 0 ? 'text-indigo-600' : 'text-red-700'}`}>{formatCurrency(row.saldo)}</td>
                        </tr>
                    ))}
                </tbody>
                <tfoot className="bg-gray-50/50">
                    <tr className="font-black text-gray-900 border-t-2 border-gray-100">
                        <td className="px-6 py-6">TOTAL ANUAL</td>
                        <td className="px-6 py-6 text-right text-green-600">{formatCurrency(totals.res)}</td>
                        <td className="px-6 py-6 text-right text-red-600">{formatCurrency(totals.exp)}</td>
                        <td className={`px-6 py-6 text-right text-lg ${totals.balance >= 0 ? 'text-indigo-600' : 'text-red-700'}`}>{formatCurrency(totals.balance)}</td>
                    </tr>
                </tfoot>
            </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
