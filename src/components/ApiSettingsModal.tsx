import React, { useState, useEffect } from 'react';
import { X, Key, ShieldCheck, Sparkles, Check, ExternalLink } from 'lucide-react';
import { getApiSettings, saveApiSettings } from '../utils/storage';
import { KeyTier } from '../types';
import { useToast } from './Toast';

interface ApiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiSettingsModal: React.FC<ApiSettingsModalProps> = ({ isOpen, onClose }) => {
  const { showToast } = useToast();
  const [apiKey, setApiKey] = useState('');
  const [keyTier, setKeyTier] = useState<KeyTier>('Gratuito');
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const current = getApiSettings();
      setApiKey(current.geminiApiKey || '');
      setKeyTier(current.keyTier || 'Gratuito');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveApiSettings({
      geminiApiKey: apiKey.trim(),
      keyTier: keyTier,
    });
    showToast('Configurações da API Gemini salvas com sucesso!', 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/50">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Configurações da API Gemini
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Gerencie sua chave de inteligência artificial
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
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

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-xl transition-colors shadow-xs cursor-pointer"
            >
              Salvar Configurações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
