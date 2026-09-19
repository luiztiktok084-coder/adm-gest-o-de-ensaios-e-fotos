import React, { useState, useEffect } from 'react';
import { Camera, Settings, Sparkles, Key, Menu, LogOut, User, ShieldCheck } from 'lucide-react';
import { getApiSettings } from '../utils/storage';
import { ApiSettingsModal } from './ApiSettingsModal';
import { getAuthState, logoutUser } from '../utils/auth';

interface HeaderProps {
  onToggleSidebar?: () => void;
  activeViewTitle: string;
  onOpenApiSettings?: () => void;
  onOpenBackupModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  activeViewTitle,
  onOpenApiSettings,
  onOpenBackupModal,
}) => {
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [apiSettings, setApiSettings] = useState(getApiSettings());

  const handleOpenModal = () => {
    if (onOpenApiSettings) {
      onOpenApiSettings();
    } else {
      setIsApiModalOpen(true);
    }
  };

  useEffect(() => {
    const handleUpdate = () => {
      setApiSettings(getApiSettings());
    };
    window.addEventListener('app_storage_updated', handleUpdate);
    return () => window.removeEventListener('app_storage_updated', handleUpdate);
  }, []);

  const hasKey = Boolean(apiSettings.geminiApiKey?.trim());

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-8 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 transition-colors">
        {/* Left Side: Mobile Menu toggle + App Branding / Breadcrumb */}
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer shrink-0"
            aria-label="Abrir menu lateral"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-xl bg-amber-600 flex items-center justify-center text-white shadow-xs shrink-0">
              <Camera className="w-4 sm:w-5 h-4 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-semibold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 tracking-tight truncate">
                  StudioPhoto
                </span>
                <span className="text-zinc-300 dark:text-zinc-700 text-xs hidden xs:inline">•</span>
                <span className="text-[11px] sm:text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 sm:px-2 py-0.5 rounded-full border border-amber-200/60 dark:border-amber-900/60 truncate">
                  Gestão & Vendas
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 hidden sm:block truncate">
                {activeViewTitle}
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: API Key status indicator + Settings Button */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Key Tier & Status Badge */}
          <button
            type="button"
            onClick={handleOpenModal}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors bg-zinc-50 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700 hover:border-amber-400 dark:hover:border-amber-600 cursor-pointer shadow-2xs"
            title="Clique para alterar configurações da API Gemini"
          >
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  hasKey ? 'bg-emerald-500' : 'bg-amber-400'
                }`}
              />
              <span className="text-zinc-700 dark:text-zinc-300 hidden sm:inline">
                Gemini API:
              </span>
            </div>
            <span
              className={`px-1.5 py-0.5 rounded-md font-semibold text-[11px] sm:text-xs ${
                apiSettings.keyTier === 'Pago'
                  ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                  : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200'
              }`}
            >
              {apiSettings.keyTier || 'Gratuito'}
            </span>
          </button>

          {/* Backup Preventivo Button */}
          {onOpenBackupModal && (
            <button
              type="button"
              onClick={onOpenBackupModal}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 rounded-xl transition-all cursor-pointer shadow-2xs"
              title="Backup Preventivo & Exportação JSON (Clientes e Seleções)"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="hidden sm:inline">Backup JSON</span>
            </button>
          )}

          {/* Settings Trigger Button */}
          <button
            type="button"
            onClick={handleOpenModal}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-750 hover:border-zinc-300 dark:hover:border-zinc-600 rounded-xl shadow-2xs transition-all active:scale-98 cursor-pointer"
            title="Configurações da API Gemini"
          >
            <Settings className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
            <span className="hidden md:inline">Configurações</span>
          </button>

          {/* Logout button */}
          <button
            type="button"
            onClick={() => logoutUser()}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-xl transition-all cursor-pointer"
            title="Sair do painel de administração"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Sair</span>
          </button>
        </div>
      </header>

      {/* Modal if not controlled externally */}
      {!onOpenApiSettings && (
        <ApiSettingsModal
          isOpen={isApiModalOpen}
          onClose={() => setIsApiModalOpen(false)}
        />
      )}
    </>
  );
};
