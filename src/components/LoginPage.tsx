import React, { useState } from 'react';
import {
  Camera,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Layers,
  Image as ImageIcon,
  HeartHandshake,
} from 'lucide-react';
import { loginUser } from '../utils/auth';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage('Por favor, informe seu e-mail de acesso.');
      return;
    }

    if (!password) {
      setErrorMessage('Por favor, digite sua senha de acesso.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await loginUser(email, password, rememberMe);
      setIsLoading(false);

      if (result.success) {
        onLoginSuccess();
      } else {
        setErrorMessage(result.error || 'Credenciais inválidas.');
      }
    } catch {
      setIsLoading(false);
      setErrorMessage('Erro ao tentar autenticar. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen w-full bg-zinc-950 text-zinc-100 flex items-center justify-center p-3 sm:p-6 lg:p-10 relative overflow-hidden font-sans select-none">
      {/* Background Decorative Blur & Lighting */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-amber-700/5 rounded-full blur-3xl pointer-events-none" />

      {/* Background Studio Grid Lines */}
      <div 
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px)`,
          backgroundSize: '32px 32px'
        }}
      />

      {/* Main Container Card */}
      <div className="w-full max-w-5xl bg-zinc-900/90 border border-zinc-800/90 rounded-2xl sm:rounded-3xl shadow-2xl backdrop-blur-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10">
        
        {/* Left Side: Brand Showcase & Studio Visuals (Desktop) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-zinc-900 via-zinc-900 to-amber-950/40 p-6 sm:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-zinc-800/80 relative overflow-hidden">
          {/* Subtle Accent Glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Studio Brand Header */}
          <div className="space-y-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-600/20 ring-1 ring-amber-400/30">
                <Camera className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                  <span>StudioPhoto</span>
                  <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    IA
                  </span>
                </h1>
                <p className="text-xs text-zinc-400 font-medium">
                  Gestão & Venda de Ensaios Fotográficos
                </p>
              </div>
            </div>

            {/* Headline */}
            <div className="space-y-2 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-800/90 text-amber-300 border border-amber-500/20 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Painel Profissional do Fotógrafo
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-snug">
                Eleve o padrão das suas sessões e vendas fotográficas.
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Acesse o ambiente exclusivo para organizar categorias, gerenciar clientes, coletar escolhas e entregar pacotes com segurança.
              </p>
            </div>

            {/* Feature Highlights Pills */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-950/50 border border-zinc-800/60">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-zinc-200 truncate">Fotos Modelo & Prompts IA</p>
                  <p className="text-[11px] text-zinc-400 truncate">Catálogo estruturado com tags e categorias</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-950/50 border border-zinc-800/60">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                  <HeartHandshake className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-zinc-200 truncate">Link de Seleção & Aprovação</p>
                  <p className="text-[11px] text-zinc-400 truncate">Experiência interativa com marca d'água para o cliente</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-950/50 border border-zinc-800/60">
                <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-zinc-200 truncate">Entrega Final Automatizada</p>
                  <p className="text-[11px] text-zinc-400 truncate">Download do ensaio em alta resolução (.ZIP)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Security Badge */}
          <div className="pt-6 mt-6 border-t border-zinc-800/60 flex items-center gap-2 text-xs text-zinc-400">
            <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Ambiente restrito e autenticação protegida</span>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-center bg-zinc-900/60">
          <div className="max-w-md w-full mx-auto space-y-6">
            
            {/* Form Title */}
            <div className="space-y-1.5 text-center lg:text-left">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Boas-vindas de volta
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400">
                Digite suas credenciais de administrador para acessar o painel.
              </p>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {/* Form Inputs */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* E-mail Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-300">
                  E-mail de Acesso
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu.email@exemplo.com"
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-950/80 border border-zinc-800 text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-zinc-300">
                    Senha
                  </label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    className="w-full pl-10 pr-11 py-3 rounded-xl bg-zinc-950/80 border border-zinc-800 text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                    title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded bg-zinc-950 border-zinc-700 text-amber-600 focus:ring-amber-500 focus:ring-offset-zinc-900 cursor-pointer"
                  />
                  <span className="text-xs text-zinc-300 font-medium">
                    Lembrar meu acesso
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 active:from-amber-700 active:to-amber-600 text-white font-bold text-sm tracking-wide shadow-lg shadow-amber-600/25 hover:shadow-amber-600/35 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer mt-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Autenticando...</span>
                  </>
                ) : (
                  <>
                    <span>Entrar no Painel</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Public Links quick access */}
            <div className="pt-2 text-center">
              <a
                href="#/modelos"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-amber-300 transition-colors"
              >
                <span>ACESSAR GALERIA DE FOTOS</span>
                <ArrowRight className="w-3 h-3" />
              </a>
            </div>

          </div>
        </div>

      </div>

      {/* Footer copyright */}
      <div className="absolute bottom-3 text-center w-full text-[11px] text-zinc-500">
        StudioPhoto © {new Date().getFullYear()} • Sistema de Gestão & Ensaios Fotográficos IA
      </div>
    </div>
  );
};
