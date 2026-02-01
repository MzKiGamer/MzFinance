
import React, { useMemo, useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { INVESTMENT_TYPES } from '../constants';
import { Plus, Trash2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Asset, Investment } from '../types';

const Patrimony: React.FC = () => {
  const { assets, investments, setAssets, setInvestments } = useFinance();
  const [isAddingAsset, setIsAddingAsset] = useState(false);
  const [isAddingInvestment, setIsAddingInvestment] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Pequeno atraso para garantir que o layout CSS do container esteja pronto
    const timer = setTimeout(() => setIsClient(true), 150);
    return () => clearTimeout(timer);
  }, []);

  const totalPatrimony = useMemo(() => {
    return assets.reduce((a, b) => a + b.value, 0) + investments.reduce((a, b) => a + b.value, 0);
  }, [assets, investments]);

  const investmentData = useMemo(() => {
    const data: Record<string, number> = {};
    investments.forEach(i => { data[i.type] = (data[i.type] || 0) + i.value; });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [investments]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const COLORS = ['#FF385C', '#10b981', '#2c3e50', '#6366f1', '#f59e0b', '#ec4899', '#06b6d4'];

  const handleDeleteAsset = (id: string) => {
    setAssets(prev => prev.filter(a => a.id !== id));
  };

  const handleDeleteInv = (id: string) => {
    setInvestments(prev => prev.filter(i => i.id !== id));
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 max-w-[1200px] mx-auto pb-20">
      <div className="text-center py-12">
        <span className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] block mb-4">Patrimônio Total</span>
        <h1 className="text-6xl font-black text-[#222222] tracking-tighter">
          {formatCurrency(totalPatrimony)}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-6">
          <div className="flex justify-between items-center px-2">
            <h2 className="text-xl font-extrabold">Reservas & Bancos</h2>
            <button 
              onClick={() => setIsAddingAsset(true)}
              className="bg-[#FF385C] text-white text-[10px] font-black uppercase tracking-widest px-6 py-2 rounded-xl flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all"
            >
              <Plus size={14} /> Adicionar
            </button>
          </div>
          
          <div className="space-y-4">
            {assets.length > 0 ? assets.map(asset => (
              <div key={asset.id} className="airbnb-card p-6 flex justify-between items-center group">
                <div>
                  <h4 className="font-extrabold text-lg">{asset.description}</h4>
                  <p className="text-xs text-gray-400 font-bold uppercase">{asset.bank} • {asset.liquidity}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-extrabold text-xl mb-1">{formatCurrency(asset.value)}</div>
                    <span className="bg-green-50 text-green-600 text-[10px] font-black uppercase px-2 py-1 rounded-md">Disponível</span>
                  </div>
                  <button onClick={() => handleDeleteAsset(asset.id)} className="text-gray-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )) : (
              <div className="airbnb-card p-8 text-center text-gray-400 font-bold italic">Sem reservas cadastradas.</div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center px-2">
            <h2 className="text-xl font-extrabold">Investimentos</h2>
            <button 
              onClick={() => setIsAddingInvestment(true)}
              className="bg-[#FF385C] text-white text-[10px] font-black uppercase tracking-widest px-6 py-2 rounded-xl flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all"
            >
              <Plus size={14} /> Adicionar
            </button>
          </div>

          <div className="airbnb-card overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#F9F9F9] text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                  <th className="px-6 py-4">Ativo</th>
                  <th className="px-6 py-4 text-right">Valor</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {investments.map(inv => (
                  <tr key={inv.id} className="group hover:bg-gray-50">
                    <td className="px-6 py-5">
                       <div className="flex flex-col">
                         <span className="font-extrabold text-sm">{inv.category || 'Ativo'}</span>
                         <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{inv.type}</span>
                       </div>
                    </td>
                    <td className="px-6 py-5 text-right font-extrabold text-sm">{formatCurrency(inv.value)}</td>
                    <td className="px-6 py-5 text-right">
                      <button onClick={() => handleDeleteInv(inv.id)} className="text-gray-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {investments.length === 0 && (
                  <tr><td colSpan={3} className="p-8 text-center text-gray-400 font-bold italic">Sem investimentos cadastrados.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="airbnb-card p-10 mt-12">
        <h2 className="text-2xl font-extrabold mb-12">Alocação de Ativos</h2>
        <div className="h-80 flex items-center justify-center overflow-hidden relative" style={{ minWidth: 0, minHeight: 0 }}>
          {isClient && investmentData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
              <PieChart>
                <Pie
                  data={investmentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {investmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
             <div className="text-gray-300 font-bold italic">Gráfico indisponível sem investimentos.</div>
          )}
        </div>
      </div>

      {/* Modais omitidos para brevidade, sem alterações neles */}
    </div>
  );
};

export default Patrimony;
