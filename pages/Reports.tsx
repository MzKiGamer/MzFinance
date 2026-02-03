
import React, { useMemo, useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useLanguage } from '../context/LanguageContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { ChevronDown, Download, FileText, Table as TableIcon, TrendingUp, TrendingDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const MONTH_CODES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

const Reports: React.FC = () => {
  const { transactions } = useFinance();
  const { t, language } = useLanguage();
  const [isClient, setIsClient] = useState(false);
  const [selectedYear, setSelectedYear] = useState('2026');
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsClient(true), 150);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const MONTH_NAMES = useMemo(() => t('monthNames') as string[], [language, t]);

  const MONTH_DATA = useMemo(() => 
    MONTH_CODES.map((code, idx) => ({ code, name: MONTH_NAMES[idx] }))
  , [MONTH_NAMES]);

  const isMobile = windowWidth < 640;

  const annualData = useMemo(() => {
    const yearShort = selectedYear.slice(-2);
    let cumulative = 0;
    return MONTH_DATA.map(m => {
      const monthCode = `${m.code}-${yearShort}`;
      const monthTx = transactions.filter(t => t.monthCode === monthCode);
      const res = monthTx.filter(t => t.type === 'Receita').reduce((acc, t) => acc + t.value, 0);
      const exp = monthTx.filter(t => t.type === 'Despesa').reduce((acc, t) => acc + t.value, 0);
      const saldo = res - exp;
      cumulative += saldo;
      return {
        name: m.name, 
        shortName: m.name.substring(0, 3).toUpperCase(), 
        receitas: res, 
        despesas: exp, 
        saldo,
        acumulado: cumulative
      };
    });
  }, [transactions, selectedYear, MONTH_DATA]);

  const totals = useMemo(() => {
    const res = annualData.reduce((a, b) => a + b.receitas, 0);
    const exp = annualData.reduce((a, b) => a + b.despesas, 0);
    
    const sortedByBalance = [...annualData].sort((a, b) => b.saldo - a.saldo);
    
    return { 
      res, 
      exp, 
      balance: res - exp, 
      ratio: res > 0 ? (exp / res) * 100 : 0,
      bestMonth: sortedByBalance[0],
      worstMonth: sortedByBalance[annualData.length - 1]
    };
  }, [annualData]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat(language === 'pt' ? 'pt-BR' : 'en-US', { 
        style: 'currency', 
        currency: language === 'pt' ? 'BRL' : 'USD' 
    }).format(val);

  const getValueColor = (val: number) => {
    if (val > 0) return 'text-green-600';
    if (val < 0) return 'text-red-600';
    return 'text-gray-400';
  };

  const handleExportPDF = () => {
    setIsExportMenuOpen(false);
    
    const doc = new jsPDF();
    
    doc.setFontSize(22);
    doc.setTextColor(34, 34, 34);
    doc.text(`Mz Finance - ${t('annualReports')} ${selectedYear}`, 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text(`${language === 'pt' ? 'Gerado em' : 'Generated on'}: ${new Date().toLocaleString(language === 'pt' ? 'pt-BR' : 'en-US')}`, 14, 28);

    doc.setFontSize(12);
    doc.setTextColor(34, 34, 34);
    doc.text(`${t('thermometer')}: ${totals.ratio.toFixed(1)}%`, 14, 42);
    
    const barWidth = 180;
    const barHeight = 6;
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(14, 46, barWidth, barHeight, 3, 3, 'F');
    
    let thermometerColor: [number, number, number] = [16, 185, 129];
    if (totals.ratio > 80 && totals.ratio <= 100) thermometerColor = [245, 158, 11];
    if (totals.ratio > 100) thermometerColor = [255, 56, 92];
    
    doc.setFillColor(...thermometerColor);
    const progressWidth = Math.min((totals.ratio / 100) * barWidth, barWidth);
    doc.roundedRect(14, 46, progressWidth, barHeight, 3, 3, 'F');

    const summaryY = 80;
    doc.setFontSize(10); doc.setTextColor(100, 100, 100); doc.text(t('revenues') + ':', 14, summaryY);
    doc.setFontSize(14); doc.setTextColor(16, 185, 129); doc.text(formatCurrency(totals.res), 14, summaryY + 8);

    doc.setFontSize(10); doc.setTextColor(100, 100, 100); doc.text(t('expenses') + ':', 80, summaryY);
    doc.setFontSize(14); doc.setTextColor(255, 56, 92); doc.text(formatCurrency(totals.exp), 80, summaryY + 8);

    const tableData = annualData.map(row => [
      row.name,
      formatCurrency(row.receitas),
      formatCurrency(row.despesas),
      formatCurrency(row.saldo)
    ]);

    autoTable(doc, {
      startY: summaryY + 30,
      head: [[t('monthly'), t('revenues'), t('expenses'), t('netBalance')]],
      body: tableData,
      headStyles: { fillColor: [34, 34, 34] }
    });

    doc.save(`MzFinance_Report_${selectedYear}.pdf`);
  };

  const handleExportExcel = () => {
    setIsExportMenuOpen(false);
    const wb = XLSX.utils.book_new();
    const rawHeader = [t('monthly'), t('revenues'), t('expenses'), t('netBalance')];
    const rawRows = annualData.map(row => [row.name, row.receitas, row.despesas, row.saldo]);
    const ws = XLSX.utils.aoa_to_sheet([rawHeader, ...rawRows]);
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, `MzFinance_${selectedYear}.xlsx`);
  };

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-500 pb-20 px-1">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-black tracking-tight">{t('annualReports')}</h1>
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">{t('consolidatedBalance')}</p>
        </div>
        <div className="flex items-center gap-2 no-print">
          <div className="relative group min-w-[100px]">
            <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="bg-white border rounded-xl pl-4 pr-10 py-2 text-xs font-black shadow-sm outline-none w-full appearance-none hover:border-black transition-colors">
              {['2025', '2026', '2027', '2028'].map(year => <option key={year} value={year}>{year}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-black" size={14} />
          </div>

          <div className="relative">
            <button 
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tight shadow-sm hover:bg-gray-800 transition-all active:scale-95 whitespace-nowrap"
            >
              <Download size={14} />
              <span>{t('exportAll')}</span>
            </button>

            {isExportMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsExportMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-100 py-1.5 z-20">
                  <button onClick={handleExportPDF} className="w-full flex items-center gap-2 px-4 py-2.5 text-[10px] font-black uppercase text-gray-700 hover:bg-gray-50 transition-colors">
                    <FileText size={14} className="text-red-500" /> {t('fullPDF')}
                  </button>
                  <button onClick={handleExportExcel} className="w-full flex items-center gap-2 px-4 py-2.5 text-[10px] font-black uppercase text-gray-700 hover:bg-gray-50 transition-colors">
                    <TableIcon size={14} className="text-green-600" /> {t('fullExcel')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="airbnb-card p-5 md:p-6">
        <h3 className="font-black mb-4 text-gray-400 text-[10px] uppercase tracking-widest">{t('thermometer')} {selectedYear}</h3>
        <div className="w-full bg-gray-50 h-4 rounded-full overflow-hidden mb-6 shadow-inner border border-gray-100">
            <div className={`h-full transition-all duration-1000 ${totals.ratio <= 80 ? 'bg-green-500' : totals.ratio <= 100 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${Math.min(totals.ratio, 100)}%` }} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-green-50/20 rounded-xl border border-green-50">
              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-0.5">{t('revenues')}</span>
              <span className="block font-black text-base text-green-600">{formatCurrency(totals.res)}</span>
            </div>
            <div className="p-3 bg-red-50/20 rounded-xl border border-red-50">
              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-0.5">{t('expenses')}</span>
              <span className="block font-black text-base text-red-600">{formatCurrency(totals.exp)}</span>
            </div>
            <div className="p-3 bg-gray-50/50 rounded-xl border border-gray-100">
              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-0.5">{t('netBalance')}</span>
              <span className={`block font-black text-base ${getValueColor(totals.balance)}`}>{formatCurrency(totals.balance)}</span>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="airbnb-card p-4 md:p-5">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-black text-xs uppercase tracking-tight">{t('annualEvolution')}</h3>
                <TrendingUp size={16} className="text-gray-300" />
            </div>
            <div className="h-64 w-full">
                {isClient && (
                  <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={annualData} key={language}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                          <XAxis dataKey="shortName" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700 }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9 }} />
                          <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 20px rgba(0,0,0,0.05)', fontSize: '10px' }} />
                          <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                          <Line name={t('revenues')} type="monotone" dataKey="receitas" stroke="#10b981" strokeWidth={3} dot={false} />
                          <Line name={t('expenses')} type="monotone" dataKey="despesas" stroke="#FF385C" strokeWidth={3} dot={false} />
                      </LineChart>
                  </ResponsiveContainer>
                )}
            </div>
        </div>
        <div className="airbnb-card p-4 md:p-5">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-black text-xs uppercase tracking-tight">{t('balanceByMonth')}</h3>
                <TrendingDown size={16} className="text-gray-300 rotate-180" />
            </div>
            <div className="h-64 w-full">
                {isClient && (
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={annualData} key={language}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                          <XAxis dataKey="shortName" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700 }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9 }} />
                          <Tooltip cursor={{fill: '#F9F9F9'}} contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '10px' }} />
                          <Bar name={t('netBalance')} dataKey="saldo" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                  </ResponsiveContainer>
                )}
            </div>
        </div>
      </div>

      <div className="airbnb-card overflow-hidden">
        <div className="p-4 md:p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-black text-sm uppercase tracking-tight">{t('consolidatedTable')} {selectedYear}</h3>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-gray-50 text-[8px] font-black text-gray-400 uppercase tracking-widest">
                    <tr><th className="px-6 py-4">{t('monthly')}</th><th className="px-6 py-4 text-right">{t('revenues')}</th><th className="px-6 py-4 text-right">{t('expenses')}</th><th className="px-6 py-4 text-right">{t('netBalance')}</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs">
                    {annualData.map(row => (
                        <tr key={row.name} className="hover:bg-gray-50/30 transition-colors">
                            <td className="px-6 py-4 font-black text-gray-700">{row.name}</td>
                            <td className="px-6 py-4 text-right text-green-600 font-black">{formatCurrency(row.receitas)}</td>
                            <td className="px-6 py-4 text-right text-red-600 font-black">{formatCurrency(row.despesas)}</td>
                            <td className={`px-6 py-4 text-right font-black ${getValueColor(row.saldo)}`}>{formatCurrency(row.saldo)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
