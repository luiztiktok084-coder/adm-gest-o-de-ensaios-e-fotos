import React, { useState, useEffect } from 'react';
import {
  X,
  Key,
  ShieldCheck,
  Sparkles,
  Check,
  ExternalLink,
  SunMedium,
  Palette,
  Sun,
  Eye,
  Sliders,
} from 'lucide-react';
import { getApiSettings, saveApiSettings } from '../utils/storage';
import { KeyTier } from '../types';
import { useToast } from './Toast';

export type ThemeMode = 'default' | 'high_contrast';

const HIGH_CONTRAST_STYLE_ID = 'studio-high-contrast-theme';
const THEME_STORAGE_KEY = 'studio_theme_contrast_mode';

export const getSavedThemeMode = (): ThemeMode => {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return saved === 'high_contrast' ? 'high_contrast' : 'default';
  } catch {
    return 'default';
  }
};

export const applyThemeMode = (mode: ThemeMode) => {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const existingStyle = document.getElementById(HIGH_CONTRAST_STYLE_ID);

  if (mode === 'high_contrast') {
    root.classList.add('high-contrast-mode');

    if (!existingStyle) {
      const style = document.createElement('style');
      style.id = HIGH_CONTRAST_STYLE_ID;
      style.innerHTML = `
        /* === MODO ALTO CONTRASTE (LUZ SOLAR EXTERNA INTENSA) === */
        html.high-contrast-mode {
          color-scheme: light !important;
        }

        html.high-contrast-mode body {
          background-color: #ffffff !important;
          color: #000000 !important;
        }

        /* Superfícies e Cards com fundo branco puro antirreflexo */
        html.high-contrast-mode .bg-white,
        html.high-contrast-mode .bg-zinc-50,
        html.high-contrast-mode .bg-zinc-100,
        html.high-contrast-mode .bg-zinc-200,
        html.high-contrast-mode [class*="dark:bg-zinc-"] {
          background-color: #ffffff !important;
        }

        /* Bordas sólidas e de alto contraste em toda a interface */
        html.high-contrast-mode .border,
        html.high-contrast-mode [class*="border-zinc-"],
        html.high-contrast-mode [class*="dark:border-zinc-"] {
          border-color: #000000 !important;
          border-width: 1.5px !important;
        }

        /* Tipografia de alto contraste em preto absoluto */
        html.high-contrast-mode h1,
        html.high-contrast-mode h2,
        html.high-contrast-mode h3,
        html.high-contrast-mode h4,
        html.high-contrast-mode h5,
        html.high-contrast-mode h6,
        html.high-contrast-mode p,
        html.high-contrast-mode span:not([class*="bg-"]):not([class*="text-white"]),
        html.high-contrast-mode label,
        html.high-contrast-mode strong,
        html.high-contrast-mode td,
        html.high-contrast-mode th {
          color: #000000 !important;
          -webkit-text-stroke: 0.2px #000000;
        }

        /* Textos atenuados ou secundários ganham contraste profundo */
        html.high-contrast-mode .text-zinc-400,
        html.high-contrast-mode .text-zinc-500,
        html.high-contrast-mode .text-zinc-600,
        html.high-contrast-mode [class*="dark:text-zinc-"] {
          color: #111827 !important;
          font-weight: 600 !important;
        }

        /* Formulários e campos de busca sob luz solar direta */
        html.high-contrast-mode input,
        html.high-contrast-mode select,
        html.high-contrast-mode textarea {
          border: 2px solid #000000 !important;
          background-color: #ffffff !important;
          color: #000000 !important;
          font-weight: 700 !important;
        }

        html.high-contrast-mode input::placeholder,
        html.high-contrast-mode textarea::placeholder {
          color: #4b5563 !important;
          font-weight: 600 !important;
        }

        /* Botões com maior nitidez e contraste */
        html.high-contrast-mode button {
          font-weight: 700 !important;
        }

        /* Badges e Tags com contorno preto nítido */
        html.high-contrast-mode .rounded-full,
        html.high-contrast-mode .rounded-xl,
        html.high-contrast-mode .rounded-2xl {
          border-color: #000000 !important;
        }

        /* Cabeçalho principal com borda escura firme */
        html.high-contrast-mode header {
          background-color: #ffffff !important;
          border-bottom: 2px solid #000000 !important;
        }
      `;
      document.head.appendChild(style);
    }
  } else {
    root.classList.remove('high-contrast-mode');
    if (existingStyle) {
      existingStyle.remove();
    }
  }
};

// Execução imediata ao carregar o módulo
if (typeof window !== 'undefined') {
  try {
    applyThemeMode(getSavedThemeMode());
  } catch {
    // Modo seguro
  }
}

interface ApiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiSettingsModal: React.FC<ApiSettingsModalProps> = ({ isOpen, onClose }) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'theme' | 'api'>('theme');
  const [apiKey, setApiKey] = useState('');
  const [keyTier, setKeyTier] = useState<KeyTier>('Gratuito');
  const [showKey, setShowKey] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>(getSavedThemeMode());

  // Sempre garantir a aplicação na montagem e abertura
  useEffect(() => {
    const saved = getSavedThemeMode();
    setThemeMode(saved);
    applyThemeMode(saved);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const current = getApiSettings();
      setApiKey(current.geminiApiKey || '');
      setKeyTier(current.keyTier || 'Gratuito');
      const savedTheme = getSavedThemeMode();
      setThemeMode(savedTheme);
      applyThemeMode(savedTheme);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectTheme = (newMode: ThemeMode) => {
    setThemeMode(newMode);
    // Aplicação imediata para pré-visualização instantânea na tela
    applyThemeMode(newMode);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Salvar modo de alto contraste / tema
    try {
      localStorage.setItem(THEME_STORAGE_KEY, themeMode);
      applyThemeMode(themeMode);
      window.dispatchEvent(new Event('app_storage_updated'));
    } catch {
      // Ignorar erros de armazenamento
    }

    // 2. Salvar configurações de API Gemini
    saveApiSettings({
      geminiApiKey: apiKey.trim(),
      keyTier: keyTier,
    });

    const msg =
      themeMode === 'high_contrast'
        ? 'Configurações salvas! Modo Alto Contraste ativado para luz solar intensa.'
        : 'Configurações salvas com sucesso!';

    showToast(msg, 'success');
    onClose();
  };

  const handleCloseModal = () => {
    // Reverter para o tema persistido se o usuário fechar sem salvar
    const saved = getSavedThemeMode();
    applyThemeMode(saved);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/50">
              <SunMedium className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Configurações do Sistema
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Acessibilidade, temas sob luz solar e inteligência artificial
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCloseModal}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-zinc-200 dark:border-zinc-800 px-5 sm:px-6 pt-2 bg-zinc-50/70 dark:bg-zinc-900/60 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('theme')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'theme'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Sun className="w-4 h-4" />
            <span>Aparência & Alto Contraste</span>
            {themeMode === 'high_contrast' && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('api')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'api'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>API Gemini (IA)</span>
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1">
          {/* TAB 1: TEMA E ALTO CONTRASTE (LUZ SOLAR INTENSA) */}
          {activeTab === 'theme' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                  Modo de Contraste & Iluminação
                </label>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Alterne entre o visual padrão e o modo de Alto Contraste projetado para uso externo em praias, parques e ensaios sob forte iluminação solar.
                </p>
              </div>

              {/* Theme Options Cards */}
              <div className="grid grid-cols-1 gap-3">
                {/* Option 1: Tema Padrão */}
                <label
                  onClick={() => handleSelectTheme('default')}
                  className={`relative flex items-start gap-3.5 p-4 border rounded-xl cursor-pointer transition-all ${
                    themeMode === 'default'
                      ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 ring-2 ring-amber-500/20'
                      : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="themeMode"
                    value="default"
                    checked={themeMode === 'default'}
                    onChange={() => handleSelectTheme('default')}
                    className="sr-only"
                  />
                  <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-700 dark:text-zinc-300 shrink-0 mt-0.5">
                    <Palette className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        Tema Padrão do Sistema
                      </span>
                      {themeMode === 'default' && (
                        <Check className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                      Visual balanceado com tons sutis de cinza e acabamento contemporâneo. Recomendado para uso em escritório e ambientes internos.
                    </p>
                  </div>
                </label>

                {/* Option 2: Alto Contraste (Luz Solar Intensa) */}
                <label
                  onClick={() => handleSelectTheme('high_contrast')}
                  className={`relative flex items-start gap-3.5 p-4 border rounded-xl cursor-pointer transition-all ${
                    themeMode === 'high_contrast'
                      ? 'border-black dark:border-white bg-amber-500/10 ring-2 ring-amber-500/30 shadow-md'
                      : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="themeMode"
                    value="high_contrast"
                    checked={themeMode === 'high_contrast'}
                    onChange={() => handleSelectTheme('high_contrast')}
                    className="sr-only"
                  />
                  <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <SunMedium className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                          Alto Contraste (Luz Solar Intensa)
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                          Outdoor / Sol Forte
                        </span>
                      </div>
                      {themeMode === 'high_contrast' && (
                        <Check className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      )}
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1 leading-relaxed font-medium">
                      Elimina cinzas atenuados e sombras translúcidas. Aplica fundo branco cristalino, bordas pretas nítidas de 2px e textos em preto puro para máxima leitura contra reflexos e ofuscamento solar em celulares e tablets.
                    </p>
                  </div>
                </label>
              </div>

              {/* Informative Outdoor Accessibility Card */}
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                <Sun className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">Acessibilidade para Ensaios Externos</p>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                    A pré-visualização acima é aplicada imediatamente ao selecionar a opção. Ao clicar em <strong>Salvar Configurações</strong>, sua preferência fica gravada para todas as sessões no seu navegador.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONFIGURAÇÕES DA API GEMINI */}
          {activeTab === 'api' && (
            <div className="space-y-4">
              {/* Key Input */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  Chave de API do Gemini (Google AI Studio)
                </label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-300 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 px-1.5 py-0.5 rounded cursor-pointer"
                  >
                    {showKey ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mt-1">
                  <span>Obtenha sua chave gratuitamente em</span>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-0.5 font-medium"
                  >
                    aistudio.google.com <ExternalLink className="w-3 h-3 inline" />
                  </a>
                </p>
              </div>

              {/* Key Tier Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  Nível da Chave de API
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`relative flex flex-col p-3.5 border rounded-xl cursor-pointer transition-all ${
                      keyTier === 'Gratuito'
                        ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 ring-1 ring-amber-500'
                        : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="keyTier"
                      value="Gratuito"
                      checked={keyTier === 'Gratuito'}
                      onChange={() => setKeyTier('Gratuito')}
                      className="sr-only"
                    />
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        Gratuito
                      </span>
                      {keyTier === 'Gratuito' && (
                        <Check className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      )}
                    </div>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      Usa Gemini 3.7 Flash (Sem custos, ideal para rotina)
                    </span>
                  </label>

                  <label
                    className={`relative flex flex-col p-3.5 border rounded-xl cursor-pointer transition-all ${
                      keyTier === 'Pago'
                        ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 ring-1 ring-amber-500'
                        : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="keyTier"
                      value="Pago"
                      checked={keyTier === 'Pago'}
                      onChange={() => setKeyTier('Pago')}
                      className="sr-only"
                    />
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          Pago / Pay-as-you-go
                        </span>
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      </div>
                      {keyTier === 'Pago' && (
                        <Check className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      )}
                    </div>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      Usa Gemini 3.1 Pro (Maior raciocínio e limites)
                    </span>
                  </label>
                </div>
              </div>

              <div className="p-3 bg-zinc-100 dark:bg-zinc-800/60 rounded-xl flex items-start gap-2.5 text-xs text-zinc-600 dark:text-zinc-400">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  Sua chave é armazenada de forma segura e local no seu navegador para uso nas integrações e otimização de prompts de ensaio.
                </span>
              </div>
            </div>
          )}

          {/* Footer actions */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 hidden sm:inline">
              Tema ativo:{' '}
              <strong className="font-semibold text-zinc-800 dark:text-zinc-200">
                {themeMode === 'high_contrast' ? 'Alto Contraste' : 'Padrão'}
              </strong>
            </span>
            <div className="flex items-center gap-2.5 ml-auto">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-xl transition-colors shadow-xs cursor-pointer"
              >
                Salvar Configurações
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

