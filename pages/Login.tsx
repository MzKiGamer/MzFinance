
import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { KeyRound, Mail, User as UserIcon, ShieldCheck, AlertCircle, Check, X, Eye, EyeOff, ArrowLeft, Send, Loader2 } from 'lucide-react';

type AuthMode = 'login' | 'register' | 'forgot' | 'mfa';

const Login: React.FC = () => {
  const { login, register, requestPasswordReset } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [touchedEmail, setTouchedEmail] = useState(false);
  const [touchedConfirm, setTouchedConfirm] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordCriteria = useMemo(() => {
    const p = form.password;
    return {
      length: p.length >= 8,
      uppercase: /[A-Z]/.test(p),
      lowercase: /[a-z]/.test(p),
      number: /[0-9]/.test(p),
      special: /[@#$%^&+=!]/.test(p),
    };
  }, [form.password]);

  const passwordStrengthScore = useMemo(() => {
    return Object.values(passwordCriteria).filter(Boolean).length;
  }, [passwordCriteria]);

  const isValidEmail = useMemo(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(form.email);
  }, [form.email]);

  const passwordsMatch = useMemo(() => {
    return form.password === form.confirmPassword && form.password !== '';
  }, [form.password, form.confirmPassword]);

  const getStrengthLabel = () => {
    if (passwordStrengthScore === 0) return { label: 'Vazio', color: 'text-gray-300' };
    if (passwordStrengthScore <= 2) return { label: 'Fraca', color: 'text-red-500' };
    if (passwordStrengthScore <= 4) return { label: 'Média', color: 'text-yellow-500' };
    return { label: 'Forte', color: 'text-green-500' };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const success = await login(form.username, form.password);
        if (success) {
          // No sistema de teste, pulamos MFA ou simulamos
          setMode('mfa');
        } else {
          setError('Usuário ou senha incorretos.');
        }
      } else if (mode === 'mfa') {
        if (mfaCode === '123456') {
          window.location.href = '/'; 
        } else {
          setError('Código MFA inválido. Use 123456 para testar.');
        }
      } else if (mode === 'register') {
        if (!form.email || !isValidEmail) {
          setError('E-mail é obrigatório e deve ser válido!');
          setTouchedEmail(true);
          setIsLoading(false);
          return;
        }

        if (!passwordsMatch) {
          setError('As senhas não coincidem.');
          setIsLoading(false);
          return;
        }

        if (passwordStrengthScore < 5) {
          setError('Sua senha ainda não é forte o suficiente.');
          setIsLoading(false);
          return;
        }

        await register({
          name: form.name,
          username: form.username,
          email: form.email,
          passwordHash: form.password,
          role: 'responsible',
          permissions: {
            canEditTransactions: true,
            canViewPatrimony: true,
            canEditPatrimony: true,
            canEditGoals: true,
            canAccessReports: true,
            canManageSettings: true,
          }
        });
        
        setSuccessMsg('Conta criada com sucesso! Verifique seu e-mail (se necessário).');
        setTimeout(() => setMode('login'), 2000);
      } else if (mode === 'forgot') {
        if (!isValidEmail) {
          setError('Insira um e-mail válido.');
          setIsLoading(false);
          return;
        }
        
        const result = await requestPasswordReset(form.email);
        if (result.success) {
          setSuccessMsg('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
          setForm({ ...form, email: '' });
        } else {
          setError(result.error || 'Erro ao enviar e-mail.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro inesperado.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setMode('login');
    setError('');
    setSuccessMsg('');
  };

  return (
    <div className="min-h-screen bg-[#F7F7F7] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-[480px] space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-[#FF385C] rounded-2xl mx-auto flex items-center justify-center text-white text-3xl font-black shadow-lg">M</div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            {mode === 'login' ? 'Bem Vindo' : mode === 'register' ? 'Criar Conta' : mode === 'mfa' ? 'Verificação' : 'Recuperação'}
          </h1>
          <p className="text-gray-500 font-medium">Mz Finance Cloud Sync</p>
        </div>

        <div className="airbnb-card p-10 shadow-2xl border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-2xl flex items-center gap-3 animate-in shake duration-300">
                <AlertCircle size={18} /> {error}
              </div>
            )}

            {successMsg && (
              <div className="p-4 bg-green-50 border border-green-100 text-green-700 text-xs font-bold rounded-2xl flex items-center gap-3 animate-in fade-in duration-300">
                <Check size={18} /> {successMsg}
              </div>
            )}

            {mode === 'mfa' ? (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3 text-blue-700 text-sm font-medium">
                  <ShieldCheck className="shrink-0" />
                  <span>Use o código 123456 para acessar o sistema de teste.</span>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Código de Verificação</label>
                  <input 
                    className="text-center text-2xl tracking-[0.5em] font-black py-4"
                    placeholder="000000"
                    maxLength={6}
                    value={mfaCode}
                    onChange={e => setMfaCode(e.target.value)}
                    required
                  />
                </div>
              </div>
            ) : mode === 'forgot' ? (
              <div className="space-y-6 animate-in slide-in-from-bottom-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">E-mail de Cadastro</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="email"
                      className="pl-12 bg-gray-50 border-gray-100"
                      placeholder="e-mail@exemplo.com"
                      value={form.email}
                      onChange={e => setForm({...form, email: e.target.value})}
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="primary-btn w-full py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={18} />}
                  Enviar Instruções
                </button>
                <button 
                  type="button" 
                  disabled={isLoading}
                  onClick={handleBackToLogin}
                  className="w-full text-center text-sm font-bold text-gray-500 hover:text-black transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={16} /> Voltar ao Login
                </button>
              </div>
            ) : (
              <>
                {mode === 'register' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Nome Completo</label>
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        className="pl-12 bg-gray-50 border-gray-100"
                        placeholder="Nome para exibição"
                        value={form.name}
                        onChange={e => setForm({...form, name: e.target.value})}
                        disabled={isLoading}
                        required
                      />
                    </div>
                  </div>
                )}

                {mode === 'register' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">E-mail de Cadastro</label>
                    <div className="relative">
                      <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 ${(touchedEmail || form.email) && !isValidEmail ? 'text-red-500' : 'text-gray-400'}`} size={18} />
                      <input 
                        type="email"
                        onBlur={() => setTouchedEmail(true)}
                        className={`pl-12 bg-gray-50 border-gray-100 ${(touchedEmail || form.email) && !isValidEmail ? 'border-red-300 ring-2 ring-red-50' : ''}`}
                        placeholder="exemplo@email.com"
                        value={form.email}
                        onChange={e => setForm({...form, email: e.target.value})}
                        disabled={isLoading}
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Usuário de Acesso</label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      className="pl-12 bg-gray-50 border-gray-100 font-bold"
                      placeholder="Identificador"
                      value={form.username}
                      onChange={e => setForm({...form, username: e.target.value})}
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Senha</label>
                  <div className="relative">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type={showPassword ? "text" : "password"}
                      className="pl-12 pr-12 bg-gray-50 border-gray-100"
                      placeholder="••••••••"
                      value={form.password}
                      onChange={e => setForm({...form, password: e.target.value})}
                      disabled={isLoading}
                      required
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {mode === 'register' && form.password && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-500">Nível:</span>
                        <span className={`text-xs font-black uppercase ${getStrengthLabel().color}`}>
                          {getStrengthLabel().label}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 h-1 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${passwordStrengthScore <= 2 ? 'bg-red-500' : passwordStrengthScore <= 4 ? 'bg-yellow-500' : 'bg-green-500'}`}
                          style={{ width: `${(passwordStrengthScore / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {mode === 'register' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Confirmar Senha</label>
                    <div className="relative">
                      <KeyRound className={`absolute left-4 top-1/2 -translate-y-1/2 ${(touchedConfirm || form.confirmPassword) && !passwordsMatch ? 'text-red-500' : 'text-gray-400'}`} size={18} />
                      <input 
                        type={showConfirmPassword ? "text" : "password"}
                        onBlur={() => setTouchedConfirm(true)}
                        className={`pl-12 pr-12 bg-gray-50 border-gray-100 ${(touchedConfirm || form.confirmPassword) && !passwordsMatch ? 'border-red-300 ring-2 ring-red-50' : ''}`}
                        placeholder="Repita a senha"
                        value={form.confirmPassword}
                        onChange={e => setForm({...form, confirmPassword: e.target.value})}
                        disabled={isLoading}
                        required
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {mode !== 'forgot' && (
              <button 
                type="submit" 
                disabled={isLoading}
                className="primary-btn w-full py-4 text-lg mt-4 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : (mode === 'login' ? 'Entrar' : mode === 'register' ? 'Criar Conta' : 'Verificar')}
              </button>
            )}
          </form>

          <div className="mt-8 pt-8 border-t border-gray-100 flex flex-col items-center gap-4">
            {mode === 'login' ? (
              <>
                <button onClick={() => setMode('register')} className="text-sm font-bold text-gray-500 hover:text-black">
                  Novo por aqui? <span className="text-[#FF385C]">Criar conta grátis</span>
                </button>
                <button 
                  onClick={() => setMode('forgot')}
                  className="text-[11px] font-black uppercase text-gray-300 tracking-widest hover:text-gray-500"
                >
                  Esqueci minha senha
                </button>
              </>
            ) : mode === 'forgot' ? null : (
              <button onClick={handleBackToLogin} className="text-sm font-bold text-gray-500 hover:text-black">
                Já tem uma conta? <span className="text-[#FF385C]">Ir para o Login</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
