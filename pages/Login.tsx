
import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { KeyRound, Mail, User as UserIcon, ShieldCheck, AlertCircle, Check, Eye, EyeOff, ArrowLeft, Send, Loader2 } from 'lucide-react';

type AuthMode = 'login' | 'register' | 'forgot' | 'mfa';

const Login: React.FC = () => {
  const { login, register, requestPasswordReset, setCurrentUser } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [tempProfile, setTempProfile] = useState<any>(null);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isValidEmail = useMemo(() => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
  }, [form.email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const result = await login(form.email, form.password);
        if (result.success) {
          setTempProfile(result.data);
          setMode('mfa');
        } else {
          setError(result.error || 'Erro ao realizar login.');
        }
      } else if (mode === 'mfa') {
        if (mfaCode === '123456') {
          setCurrentUser(tempProfile);
          sessionStorage.setItem('mzfinance_session', JSON.stringify(tempProfile));
          window.location.href = '#/'; 
        } else {
          setError('Código MFA inválido. Use 123456 para testar.');
        }
      } else if (mode === 'register') {
        if (!isValidEmail) {
          setError('E-mail inválido!');
          setIsLoading(false);
          return;
        }
        await register({
          name: form.name,
          email: form.email,
          passwordHash: form.password,
          role: 'responsible',
          permissions: {
            canEditTransactions: true, canViewPatrimony: true, canEditPatrimony: true,
            canEditGoals: true, canAccessReports: true, canManageSettings: true,
          }
        });
        setSuccessMsg('Conta criada! Verifique seu e-mail.');
        setTimeout(() => setMode('login'), 3000);
      } else if (mode === 'forgot') {
        const result = await requestPasswordReset(form.email);
        if (result.success) setSuccessMsg('Instruções enviadas para seu e-mail.');
        else setError(result.error || 'Erro ao enviar e-mail.');
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro inesperado.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F7] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-[480px] space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-[#FF385C] rounded-2xl mx-auto flex items-center justify-center text-white text-3xl font-black shadow-lg">M</div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            {mode === 'login' ? 'Acessar Conta' : mode === 'register' ? 'Criar Conta' : mode === 'mfa' ? 'Verificação' : 'Recuperação'}
          </h1>
          <p className="text-gray-500 font-medium">Mz Finance Cloud Sync</p>
        </div>

        <div className="airbnb-card p-10 shadow-2xl border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-[11px] font-bold rounded-2xl flex items-center gap-3">
                <AlertCircle size={18} /> {error}
              </div>
            )}
            {successMsg && (
              <div className="p-4 bg-green-50 border border-green-100 text-green-700 text-[11px] font-bold rounded-2xl flex items-center gap-3">
                <Check size={18} /> {successMsg}
              </div>
            )}

            {mode === 'mfa' ? (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3 text-blue-700 text-xs font-medium">
                  <ShieldCheck className="shrink-0" />
                  <span>Código de segurança: 123456</span>
                </div>
                <input 
                  className="text-center text-2xl tracking-[0.5em] font-black py-4 bg-gray-50"
                  placeholder="000000"
                  maxLength={6}
                  value={mfaCode}
                  onChange={e => setMfaCode(e.target.value)}
                  autoFocus
                />
              </div>
            ) : mode === 'forgot' ? (
              <div className="space-y-6">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input type="email" className="pl-12 bg-gray-50" placeholder="e-mail@exemplo.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
                </div>
                <button type="submit" disabled={isLoading} className="primary-btn w-full py-4 flex items-center justify-center gap-2">
                  {isLoading ? <Loader2 className="animate-spin" /> : 'Enviar Recuperação'}
                </button>
                <button type="button" onClick={() => setMode('login')} className="w-full text-center text-xs font-bold text-gray-500 flex items-center justify-center gap-2">
                   Voltar ao Login
                </button>
              </div>
            ) : (
              <>
                {mode === 'register' && (
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input className="pl-12 bg-gray-50" placeholder="Nome Completo" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                  </div>
                )}
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input type="email" className="pl-12 bg-gray-50 font-bold" placeholder="E-mail" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
                </div>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input type={showPassword ? "text" : "password"} className="pl-12 bg-gray-50" placeholder="Senha" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </>
            )}

            {mode !== 'forgot' && (
              <button type="submit" disabled={isLoading} className="primary-btn w-full py-4 flex items-center justify-center gap-2">
                {isLoading ? <Loader2 className="animate-spin" /> : (mode === 'login' ? 'Entrar' : mode === 'register' ? 'Criar Conta' : 'Verificar')}
              </button>
            )}
          </form>

          {mode === 'login' && (
            <div className="mt-8 pt-8 border-t border-gray-100 flex flex-col items-center gap-4">
              <button onClick={() => setMode('register')} className="text-xs font-bold text-gray-500">
                Novo por aqui? <span className="text-[#FF385C]">Criar conta grátis</span>
              </button>
              <button onClick={() => setMode('forgot')} className="text-[10px] font-black uppercase text-gray-300 tracking-widest">
                Esqueci minha senha
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
