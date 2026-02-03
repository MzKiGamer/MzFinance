
import React, { useMemo, useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useLanguage } from '../context/LanguageContext';
import { INVESTMENT_TYPES } from '../constants';
import { Plus, Trash2, Pencil, X, Building2, TrendingUp } from 'lucide-react';
import { Asset, Investment } from '../types';

const Patrimony: React.FC = () => {
  const { assets, investments, setAssets, setInvestments } = useFinance();
  const { t, language } = useLanguage();
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [isAddingAsset, setIsAddingAsset] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [isAddingInvestment, setIsAddingInvestment] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsClient(true), 150);
    return () => clearTimeout(timer);
  }, []);

  const totalPatrimony = useMemo(() => {
    return assets.reduce((a, b) => a + b.value, 0) + investments.reduce((a, b) => a + b.value, 0);
  }, [assets, investments]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat(language === 'pt' ? 'pt-BR' : 'en-US', { 
        style: 'currency', 
        currency: language === 'pt' ? 'BRL' : 'USD' 
    }).format(val);

  const handleSaveAsset = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const newAsset: Asset = {
      id: editingAsset ? editingAsset.id : crypto.randomUUID(),
      description: fd.get('description') as string,
      bank: fd.get('bank') as string,
      value: Number(fd.get('value')),
      updatedAt: new Date().toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US'),
      liquidity: fd.get('liquidity') as any,
      canTouch: fd.get('canTouch') === 'on' ? 'Sim' : 'Não'
    };
    if (editingAsset) {
      setAssets(prev => prev.map(a => a.id === newAsset.id ? newAsset : a));
    } else {
      setAssets(prev => [...prev, newAsset]);
    }
    setIsAddingAsset(false);
    setEditingAsset(null);
  };

  const handleSaveInvestment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const newInv: Investment = {
      id: editingInvestment ? editingInvestment.id : crypto.randomUUID(),
      type: fd.get('type') as any,
      category: fd.get('category') as string,
      broker: fd.get('broker') as string,
      value: Number(fd.get('value')),
      updatedAt: new Date().toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US')
    };
    if (editingInvestment) {
      setInvestments(prev => prev.map(i => i.id === newInv.id ? newInv : i));
    } else {
      setInvestments(prev => [...prev, newInv]);
    }
    setIsAddingInvestment(false);
    setEditingInvestment(null);
  };

  return (
    <div className="space-y-8 md:space-y-12 animate-in fade-in duration-700 max-w-[1200px] mx-auto pb-24 md:pb-20">
      <div className="text-center py-6 md:py-12 px-4">
        <span className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] block mb-2 md:mb-4">{t('consolidatedPatrimony')}</span>
        <h1 className={`text-3xl sm:text-4xl md:text-6xl font-black tracking-tighter break-words ${totalPatrimony >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {formatCurrency(totalPatrimony)}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
        <div className="space-y-6">
          <div className="flex justify-between items-center px-2">
            <h2 className="text-lg md:text-xl font-extrabold flex items-center gap-2"><Building2 size={20} className="text-gray-400" /> {t('reserves')}</h2>
            <button onClick={() => { setEditingAsset(null); setIsAddingAsset(true); }} className="bg-black text-white text-[10px] font-black uppercase px-4 py-2 rounded-xl flex items-center gap-2"><Plus size={14} /> {t('newAsset')}</button>
          </div>
          <div className="space-y-4">
            {assets.map(asset => (
              <div key={asset.id} className="airbnb-card p-5 md:p-6 flex justify-between items-center group">
                <div className="min-w-0 pr-4">
                  <h4 className="font-extrabold text-base md:text-lg truncate">{asset.description}</h4>
                  <p className="text-[9px] md:text-[10px] text-gray-400 font-black uppercase tracking-wider truncate">
                    {asset.bank} • {t('liquidity')}: {asset.liquidity}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right mr-2"><div className={`font-extrabold text-base ${asset.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(asset.value)}</div></div>
                  <button onClick={() => { setEditingAsset(asset); setIsAddingAsset(true); }} className="text-gray-200 hover:text-black p-2"><Pencil size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center px-2">
            <h2 className="text-lg md:text-xl font-extrabold flex items-center gap-2"><TrendingUp size={20} className="text-gray-400" /> {t('investments')}</h2>
            <button onClick={() => { setEditingInvestment(null); setIsAddingInvestment(true); }} className="bg-black text-white text-[10px] font-black uppercase px-4 py-2 rounded-xl flex items-center gap-2"><Plus size={14} /> {t('newInvestment')}</button>
          </div>
          <div className="airbnb-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[350px]">
                <thead>
                  <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase border-b"><th className="px-5 py-4">{t('description')}</th><th className="px-5 py-4 text-right">{t('value')}</th><th className="px-5 py-4"></th></tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {investments.map(inv => (
                    <tr key={inv.id} className="group hover:bg-gray-50">
                      <td className="px-5 py-5">
                        <div className="flex flex-col min-w-0"><span className="font-extrabold text-sm truncate">{inv.category || 'Ativo'}</span><span className="text-[10px] text-gray-400 font-bold uppercase">{inv.type} • {inv.broker}</span></div>
                      </td>
                      <td className="px-5 py-5 text-right font-extrabold text-sm text-green-600">{formatCurrency(inv.value)}</td>
                      <td className="px-5 py-5 text-right whitespace-nowrap">
                        <button onClick={() => { setEditingInvestment(inv); setIsAddingInvestment(true); }} className="text-gray-200 hover:text-black p-2"><Pencil size={16} /></button>
                        <button onClick={() => setInvestments(prev => prev.filter(i => i.id !== inv.id))} className="text-gray-200 hover:text-red-500 p-2"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {isAddingAsset && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-lg p-10 animate-in zoom-in duration-300 shadow-2xl relative">
            <button onClick={() => { setIsAddingAsset(false); setEditingAsset(null); }} className="absolute right-6 top-6 p-2 hover:bg-gray-100 rounded-full text-gray-400"><X size={20} /></button>
            <h2 className="text-2xl font-black mb-8 tracking-tight">{editingAsset ? t('edit') : t('newAsset')}</h2>
            <form onSubmit={handleSaveAsset} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('description')}</label>
                <input name="description" required defaultValue={editingAsset?.description || ""} className="font-bold text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('bank')}</label>
                  <input name="bank" required defaultValue={editingAsset?.bank || ""} className="font-bold text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('value')}</label>
                  <input name="value" type="number" step="0.01" required defaultValue={editingAsset?.value || ""} className="font-bold text-sm" />
                </div>
              </div>
              <button type="submit" className="primary-btn w-full py-4 text-lg mt-4">{t('save')}</button>
            </form>
          </div>
        </div>
      )}

      {isAddingInvestment && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-lg p-10 animate-in zoom-in duration-300 shadow-2xl relative">
            <button onClick={() => { setIsAddingInvestment(false); setEditingInvestment(null); }} className="absolute right-6 top-6 p-2 hover:bg-gray-100 rounded-full text-gray-400"><X size={20} /></button>
            <h2 className="text-2xl font-black mb-8 tracking-tight">{editingInvestment ? t('edit') : t('newInvestment')}</h2>
            <form onSubmit={handleSaveInvestment} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('broker')}</label>
                  <input name="broker" required defaultValue={editingInvestment?.broker || ""} className="font-bold text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('value')}</label>
                  <input name="value" type="number" step="0.01" required defaultValue={editingInvestment?.value || ""} className="font-bold text-sm" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('assetName')}</label>
                <input name="category" required defaultValue={editingInvestment?.category || ""} className="font-bold text-sm" />
              </div>
              <button type="submit" className="primary-btn w-full py-4 text-lg mt-4">{t('save')}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Patrimony;
