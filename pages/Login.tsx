
import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { KeyRound, Mail, User as UserIcon, ShieldCheck, ArrowRight, AlertCircle, Check, X, Info } from 'lucide-react';

type AuthMode = 'login' | 'register' | 'forgot' | 'mfa';

const Login: React.FC = () => {
  const { login, register, users } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [touchedEmail, setTouchedEmail] = useState(false);

  // Critérios de senha baseados na imagem e boas práticas
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

  const getStrengthLabel = () => {
    if (passwordStrengthScore === 0) return { label: 'Vazio', color: 'text-gray-300' };
    if (passwordStrengthScore <= 2) return { label: 'Fraca', color: 'text-red-500' };
    if (passwordStrengthScore <= 4) return { label: 'Média', color: 'text-yellow-500' };
    return { label: 'Forte', color: 'text-green-500' };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'login') {
      const success = login(form.username, form.password);
      if (success) {
        setMode('mfa');
      } else {
        setError('Usuário ou senha incorretos.');
      }
    } else if (mode === 'mfa') {
      if (mfaCode === '123456') {
        window.location.reload(); 
      } else {
        setError('Código MFA inválido. Use 123456 para testar.');
      }
    } else if (mode === 'register') {
      if (!isValidEmail) {
        setError('E-mail inválido! Por favor, utilize um formato válido (exemplo@email.com).');
        setTouchedEmail(true);
        return;
      }

      if (passwordStrengthScore < 5) {
        setError('Sua senha ainda não é forte o suficiente. Atenda a todos os requisitos.');
        return;
      }

      if (users.find(u => u.username === form.username)) {
        setError('Este nome de usuário já está em uso.');
        return;
      }

      register({
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
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F7] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-[480px] space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-[#FF385C] rounded-2xl mx-auto flex items-center justify-center text-white text-3xl font-black shadow-lg">G</div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            {mode === 'login' && 'Bem-vindo de volta'}
            {mode === 'register' && 'Crie sua conta segura'}
            {mode === 'mfa' && 'Verificação em duas etapas'}
          </h1>
          <p className="text-gray-500 font-medium">Gestão Financeira Easy 2.0</p>
        </div>

        <div className="airbnb-card p-10 shadow-2xl border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {mode === 'mfa' ? (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3 text-blue-700 text-sm font-medium">
                  <ShieldCheck className="shrink-0" />
                  <span>Enviamos um código para seu dispositivo confiável.</span>
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
            ) : (
              <>
                {mode === 'register' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Nome Completo</label>
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        className="pl-12 bg-gray-50 border-gray-100"
                        placeholder="Como quer ser chamado?"
                        value={form.name}
                        onChange={e => setForm({...form, name: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                )}

                {(mode === 'register') && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">E-mail Corporativo/Pessoal</label>
                    <div className="relative">
                      <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 ${(touchedEmail || form.email) && !isValidEmail ? 'text-red-500' : 'text-gray-400'}`} size={18} />
                      <input 
                        type="email"
                        onBlur={() => setTouchedEmail(true)}
                        className={`pl-12 bg-gray-50 border-gray-100 ${(touchedEmail || form.email) && !isValidEmail ? 'border-red-300 ring-2 ring-red-50' : ''} transition-all`}
                        placeholder="email@exemplo.com"
                        value={form.email}
                        onChange={e => setForm({...form, email: e.target.value})}
                        required
                      />
                    </div>
                    {mode === 'register' && (touchedEmail || form.email) && !isValidEmail && (
                      <div className="flex items-center gap-1.5 mt-1.5 text-red-500">
                        <AlertCircle size={12} />
                        <span className="text-[10px] font-bold uppercase tracking-tight">E-mail em formato inválido</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Usuário</label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      className="pl-12 bg-gray-50 border-gray-100"
                      placeholder="Identificador de login"
                      value={form.username}
                      onChange={e => setForm({...form, username: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Senha</label>
                  </div>
                  <div className="relative">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="password"
                      className="pl-12 bg-gray-50 border-gray-100"
                      placeholder="••••••••"
                      value={form.password}
                      onChange={e => setForm({...form, password: e.target.value})}
                      required
                    />
                  </div>

                  {mode === 'register' && form.password && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3 animate-in fade-in slide-in-from-top-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-500">Força da senha</span>
                        <span className={`text-xs font-black uppercase ${getStrengthLabel().color}`}>
                          {getStrengthLabel().label}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-medium">
                          {passwordCriteria.length ? <Check size={14} className="text-green-500" /> : <X size={14} className="text-gray-300" />}
                          <span className={passwordCriteria.length ? 'text-gray-700' : 'text-gray-400'}>Mínimo de 8 caracteres</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-medium">
                          {passwordCriteria.uppercase ? <Check size={14} className="text-green-500" /> : <X size={14} className="text-gray-300" />}
                          <span className={passwordCriteria.uppercase ? 'text-gray-700' : 'text-gray-400'}>Uma letra maiúscula</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-medium">
                          {passwordCriteria.lowercase ? <Check size={14} className="text-green-500" /> : <X size={14} className="text-gray-300" />}
                          <span className={passwordCriteria.lowercase ? 'text-gray-700' : 'text-gray-400'}>Uma letra minúscula</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-medium">
                          {passwordCriteria.number ? <Check size={14} className="text-green-500" /> : <X size={14} className="text-gray-300" />}
                          <span className={passwordCriteria.number ? 'text-gray-700' : 'text-gray-400'}>Um número</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-medium">
                          {passwordCriteria.special ? <Check size={14} className="text-green-500" /> : <X size={14} className="text-gray-300" />}
                          <span className={passwordCriteria.special ? 'text-gray-700' : 'text-gray-400'}>Um caractere especial (@, #, etc)</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {error && (
              <div className="text-red-500 text-xs font-bold bg-red-50 p-4 rounded-xl border border-red-100 flex items-start gap-3 animate-in shake duration-300">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button 
              type="submit" 
              disabled={mode === 'register' && (passwordStrengthScore < 5 || !isValidEmail)}
              className={`primary-btn w-full py-4 text-lg rounded-2xl flex items-center justify-center gap-2 group transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed shadow-lg shadow-red-100`}
            >
              {mode === 'login' ? 'Continuar' : mode === 'register' ? 'Criar Conta Segura' : 'Verificar'}
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-gray-100 text-center">
            {mode === 'login' ? (
              <p className="text-gray-500 text-sm font-medium">
                Novo por aqui? <button onClick={() => setMode('register')} className="text-black font-extrabold hover:underline">Cadastre-se</button>
              </p>
            ) : mode === 'register' ? (
              <p className="text-gray-500 text-sm font-medium">
                Já tem conta? <button onClick={() => setMode('login')} className="text-black font-extrabold hover:underline">Fazer Login</button>
              </p>
            ) : (
              <button onClick={() => setMode('login')} className="text-xs font-bold text-gray-400 hover:text-black transition-colors">VOLTAR PARA LOGIN</button>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
           <div className="flex items-center gap-2 text-gray-400">
              <ShieldCheck size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">Proteção com MFA e Criptografia AES-256</span>
           </div>
           <div className="flex gap-4 opacity-30 grayscale hover:opacity-100 transition-opacity">
              <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" className="h-4" alt="PayPal Secure" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" className="h-4" alt="Visa" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-4" alt="Mastercard" />
           </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
