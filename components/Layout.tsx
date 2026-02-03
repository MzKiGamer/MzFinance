
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import { useLanguage } from '../context/LanguageContext';
import UserManagementModal from './UserManagementModal';
import { 
  LayoutDashboard, 
  CalendarRange, 
  Settings, 
  BarChart3, 
  Wallet, 
  Trophy,
  User as UserIcon,
  LogOut,
  Users,
  ChevronDown,
  CloudCheck,
  CloudLightning,
  Languages
} from 'lucide-react';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { currentUser, logout } = useAuth();
  const { isSyncing, isLoading } = useFinance();
  const { t, language, setLanguage } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  const navItems = [
    { name: t('dashboard'), icon: <LayoutDashboard size={18} />, path: '/' },
    { name: t('monthly'), icon: <CalendarRange size={18} />, path: '/mensal' },
    { name: t('patrimony'), icon: <Wallet size={18} />, path: '/patrimonio' },
    { name: t('goals'), icon: <Trophy size={18} />, path: '/metas' },
    { name: t('reports'), icon: <BarChart3 size={18} />, path: '/relatorios' },
  ];

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F7F7]">
      <header className="sticky top-0 z-50 bg-white border-b border-[#EBEBEB] px-6 h-20 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FF385C] rounded-xl flex items-center justify-center text-white font-extrabold text-xl shadow-md">M</div>
            <span className="font-extrabold text-xl tracking-tight hidden sm:block">Mz Finance</span>
          </Link>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-100">
            {isSyncing || isLoading ? (
              <CloudLightning size={14} className="text-amber-500 animate-pulse" />
            ) : (
              <CloudCheck size={14} className="text-green-500" />
            )}
            <span className="text-[9px] font-black uppercase text-gray-400 tracking-tighter">
              {isLoading ? '...' : 'Cloud OK'}
            </span>
          </div>
        </div>

        <nav className="hidden lg:flex items-center gap-1 bg-white border border-[#EBEBEB] rounded-full p-1 shadow-sm">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition-all ${
                  isActive ? 'bg-black text-white shadow-md' : 'text-gray-500 hover:text-black hover:bg-gray-50'
                }`}
              >
                {item.icon} {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-4 relative">
          <button 
            onClick={() => setLanguage(language === 'pt' ? 'en' : 'pt')}
            className="p-2.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-all flex items-center gap-2"
            title="Switch Language"
          >
            <Languages size={20} />
            <span className="text-[10px] font-black uppercase">{language}</span>
          </button>

          <Link to="/configuracoes" className="p-2.5 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
            <Settings size={20} />
          </Link>
          
          <div className="relative">
            <button 
              onClick={toggleMenu}
              className="flex items-center gap-2 p-1.5 pr-3 rounded-full bg-white border border-[#EBEBEB] shadow-sm hover:shadow-md transition-all active:scale-95"
            >
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                <UserIcon size={18} />
              </div>
              <ChevronDown size={14} className={`text-gray-400 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />
                <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-20 animate-in fade-in slide-in-from-top-2">
                  <div className="px-5 py-3 border-b border-gray-50">
                    <span className="block font-black text-sm text-gray-800">{currentUser?.name}</span>
                    <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">{currentUser?.role}</span>
                  </div>
                  
                  <div className="py-2">
                    {currentUser?.role === 'responsible' && (
                      <button 
                        onClick={() => { setIsUserModalOpen(true); setIsMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-5 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        <Users size={18} /> Manage Team
                      </button>
                    )}
                    <button 
                      onClick={logout}
                      className="w-full flex items-center gap-3 px-5 py-3 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={18} /> {t('logout')}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 md:p-10 max-w-[1400px] mx-auto w-full">
        {children}
      </main>

      <UserManagementModal 
        isOpen={isUserModalOpen} 
        onClose={() => setIsUserModalOpen(false)} 
      />

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#EBEBEB] flex justify-around p-3 z-50 shadow-lg">
         {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} className={`flex flex-col items-center p-2 rounded-xl ${isActive ? 'text-[#FF385C]' : 'text-gray-400'}`}>
                {item.icon}
                <span className="text-[10px] font-bold mt-1 uppercase tracking-tighter">{item.name}</span>
              </Link>
            );
          })}
      </nav>
    </div>
  );
};

export default Layout;
