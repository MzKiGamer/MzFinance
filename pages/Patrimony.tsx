
import React, { useMemo, useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useLanguage } from '../context/LanguageContext';
import { INVESTMENT_TYPES } from '../constants';
import { Plus, Trash2, Pencil, X, Building2, TrendingUp } from 'lucide-react';
import { Asset, Investment } from '../types';

const Patrimony: React.FC = () => {
  // Fix: replace missing setters with save methods from FinanceContext to resolve type errors and ensure persistence
  const { assets, investments, saveAsset, deleteAsset, saveInvestment, deleteInvestment } = useFinance();
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

  // Fix: Use saveAsset instead of setAssets to ensure data is updated in Supabase
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
    saveAsset(newAsset);
    setIsAddingAsset(false);
    setEditingAsset(null);
  };

  // Fix: Use saveInvestment instead of setInvestments to ensure data is updated in Supabase
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
    saveInvestment(newInv);
    setIsAddingInvestment(false);
    setEditingInvestment(null);
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700 max-w-[1200px] mx-auto pb-24 md:pb-20 px-1">
      <div className="text-center py-4 md:py-8">
        <span className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] block mb-1">{t('consolidatedPatrimony')}</span>
        <h1 className={`text-4xl md:text-5xl font-black tracking-tighter ${totalPatrimony >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {formatCurrency(totalPatrimony)}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-[22px] font-black uppercase tracking-tight flex items-center gap-2">
              <Building2 size={24} className="text-gray-400" /> {t('reserves')}
            </h2>
            <button onClick={() => { setEditingAsset(null); setIsAddingAsset(true); }} className="bg-black text-white text-[10px] font-black uppercase px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition-all">
              <Plus size={14} /> {t('newAsset')}
            </button>
          </div>
          <div className="space-y-3">
            {assets.map(asset => (
              <div key={asset.id} className="airbnb-card p-4 md:p-6 flex justify-between items-center group">
                <div className="min-w-0 pr-4">
                  <h4 className="font-black text-[22px] text-gray-800 truncate leading-tight tracking-tighter">{asset.description}</h4>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider truncate mt-1">
                    {asset.bank} • {t('liquidity')}: {asset.liquidity}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right mr-1">
                    <div className={`font-black text-[22px] tracking-tighter ${asset.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(asset.value)}
                    </div>
                  </div>
                  <button onClick={() => { setEditingAsset(asset); setIsAddingAsset(true); }} className="text-gray-200 hover:text-black p-2 transition-colors">
                    <Pencil size={18} />
                  </button>
                  <button onClick={() => deleteAsset(asset.id)} className="text-gray-200 hover:text-red-500 p-2 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-[22px] font-black uppercase tracking-tight flex items-center gap-2">
              <TrendingUp size={24} className="text-gray-400" /> {t('investments')}
            </h2>
            <button onClick={() => { setEditingInvestment(null); setIsAddingInvestment(true); }} className="bg-black text-white text-[10px] font-black uppercase px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition-all">
              <Plus size={14} /> {t('newInvestment')}
            </button>
          </div>
          <div className="airbnb-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[300px]">
                <thead>
                  <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase border-b tracking-widest">
                    <th className="px-6 py-4">{t('description')}</th>
                    <th className="px-6 py-4 text-right">{t('value')}</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {investments.map(inv => (
                    <tr key={inv.id} className="group hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex flex-col min-w-0">
                          <span className="font-black text-[18px] text-gray-800 truncate tracking-tight">{inv.category || 'Ativo'}</span>
                          <span className="text-[10px] text-gray-400 font-black uppercase tracking-tight mt-0.5">{inv.type} • {inv.broker}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right font-black text-[22px] text-green-600 tracking-tighter">
                        {formatCurrency(inv.value)}
                      </td>
                      <td className="px-6 py-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => { setEditingInvestment(inv); setIsAddingInvestment(true); }} className="text-gray-200 hover:text-black p-2 transition-colors">
                            <Pencil size={18} />
                          </button>
                          <button onClick={() => deleteInvestment(inv.id)} className="text-gray-200 hover:text-red-500 p-2 transition-colors">
                            <Trash2 size={18} />
                          </button>
                        </div>
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
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-[24px] w-full max-w-sm p-6 md:p-8 animate-in zoom-in duration-300 shadow-2xl relative my-auto">
            <button onClick={() => { setIsAddingAsset(false); setEditingAsset(null); }} className="absolute right-5 top-5 p-1.5 hover:bg-gray-100 rounded-full text-gray-400"><X size={18} /></button>
            <h2 className="text-lg font-black mb-6 tracking-tight">{editingAsset ? t('edit') : t('newAsset')}</h2>
            <form onSubmit={handleSaveAsset} className="space-y-3">
              <div className="space-y-0.5">
                <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('description')}</label>
                <input name="description" required defaultValue={editingAsset?.description || ""} className="font-bold text-xs py-1.5 px-3" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-0.5">
                  <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('bank')}</label>
                  <input name="bank" required defaultValue={editingAsset?.bank || ""} className="font-bold text-xs py-1.5 px-3" />
                </div>
                <div className="space-y-0.5">
                  <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('value')}</label>
                  <input name="value" type="number" step="0.01" required defaultValue={editingAsset?.value || ""} className="font-black text-xs py-1.5 px-3" />
                </div>
              </div>
              <button type="submit" className="primary-btn w-full py-3 text-xs mt-3 shadow-sm">{t('save')}</button>
            </form>
          </div>
        </div>
      )}

      {isAddingInvestment && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-[24px] w-full max-w-sm p-6 md:p-8 animate-in zoom-in duration-300 shadow-2xl relative my-auto">
            <button onClick={() => { setIsAddingInvestment(false); setEditingInvestment(null); }} className="absolute right-5 top-5 p-1.5 hover:bg-gray-100 rounded-full text-gray-400"><X size={18} /></button>
            <h2 className="text-lg font-black mb-6 tracking-tight">{editingInvestment ? t('edit') : t('newInvestment')}</h2>
            <form onSubmit={handleSaveInvestment} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-0.5">
                  <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('broker')}</label>
                  <input name="broker" required defaultValue={editingInvestment?.broker || ""} className="font-bold text-xs py-1.5 px-3" />
                </div>
                <div className="space-y-0.5">
                  <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('value')}</label>
                  <input name="value" type="number" step="0.01" required defaultValue={editingInvestment?.value || ""} className="font-black text-xs py-1.5 px-3" />
                </div>
              </div>
              <div className="space-y-0.5">
                <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('assetName')}</label>
                <input name="category" required defaultValue={editingInvestment?.category || ""} className="font-bold text-xs py-1.5 px-3" />
              </div>
              <button type="submit" className="primary-btn w-full py-3 text-xs mt-3 shadow-sm">{t('save')}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Patrimony;
