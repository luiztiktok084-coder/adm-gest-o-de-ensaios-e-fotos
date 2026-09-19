import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Download,
  Upload,
  RefreshCw,
  FileJson,
  CheckCircle2,
  Copy,
  Clock,
  HardDrive,
  Users,
  HeartHandshake,
  Settings,
  AlertTriangle,
  X,
  Eye,
  Check,
  Sparkles,
  FolderTree,
  Image as ImageIcon,
  Package,
} from 'lucide-react';
import { Client, ModelPhoto, Category, AgencyPackage } from '../../types';
import {
  generateBackupData,
  downloadBackupJson,
  getBackupSettings,
  saveBackupSettings,
  restoreDataFromBackupJson,
  inspectBackupJson,
  RestoreInspectionResult,
  BackupSettings,
  BackupPayload,
} from '../../utils/backup';
import { useToast } from '../Toast';

interface BackupManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  modelPhotos: ModelPhoto[];
  categories?: Category[];
  packages?: AgencyPackage[];
  onDataRestored?: () => void;
}

export const BackupManagementModal: React.FC<BackupManagementModalProps> = ({
  isOpen,
  onClose,
  clients,
  modelPhotos,
  categories = [],
  packages = [],
  onDataRestored,
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'export' | 'preview' | 'restore'>('export');
  const [settings, setSettings] = useState<BackupSettings>(getBackupSettings());
  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [backupPayload, setBackupPayload] = useState<BackupPayload | null>(null);

  // Restore state
  const [restoreFileText, setRestoreFileText] = useState<string>('');
  const [restoreFileName, setRestoreFileName] = useState<string>('');
  const [restoreSummary, setRestoreSummary] = useState<RestoreInspectionResult | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const currentSettings = getBackupSettings();
      setSettings(currentSettings);
      const payload = generateBackupData(clients, modelPhotos, categories, packages);
      setBackupPayload(payload);
    }
  }, [isOpen, clients, modelPhotos, categories, packages]);

  if (!isOpen) return null;

  // Metrics
  const totalClients = clients.length;
  const totalCategories = categories.length;
  const totalModelPhotos = modelPhotos.length;
  const totalPackages = packages.length;

  const totalChosenPhotos = clients.reduce(
    (acc, c) => acc + (c.chosenPhotoIds?.length || 0),
    0
  );
  const clientsWithSelections = clients.filter(
    (c) => (c.chosenPhotoIds && c.chosenPhotoIds.length > 0) || c.status === 'Selecionado' || c.status === 'Em produção'
  ).length;

  const handleDownload = () => {
    setIsDownloading(true);
    try {
      const payload = generateBackupData(clients, modelPhotos, categories, packages);
      const result = downloadBackupJson(payload);
      if (result.success) {
        showToast(`Backup completo salvo com sucesso: ${result.fileName}`, 'success');
        setSettings(getBackupSettings());
      } else {
        showToast('Não foi possível gerar o arquivo de backup.', 'error');
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyJson = () => {
    try {
      const payload = backupPayload || generateBackupData(clients, modelPhotos, categories, packages);
      navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setCopied(true);
      showToast('JSON completo do backup copiado!', 'success');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      showToast('Erro ao copiar JSON.', 'error');
    }
  };

  const handleToggleAutoBackup = (enabled: boolean) => {
    const updated = saveBackupSettings({ autoBackupEnabled: enabled });
    setSettings(updated);
    showToast(
      enabled
        ? 'Backup automático preventivo ativado.'
        : 'Backup automático em segundo plano desativado.',
      'info'
    );
  };

  const handleToggleAutoDownload = (enabled: boolean) => {
    const updated = saveBackupSettings({ autoDownloadOnSelection: enabled });
    setSettings(updated);
    showToast(
      enabled
        ? 'Download automático ao receber seleções ativado.'
        : 'Download automático ao receber seleções desativado.',
      'info'
    );
  };

  // Restore file handling
  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setRestoreFileText(content);
      const inspection = inspectBackupJson(content);
      setRestoreSummary(inspection);
    };
    reader.readAsText(file);
  };

  const handleConfirmRestore = () => {
    if (!restoreFileText || !restoreSummary?.valid) return;

    setIsRestoring(true);
    try {
      const res = restoreDataFromBackupJson(restoreFileText);
      if (res.success) {
        showToast(res.message, 'success');
        if (onDataRestored) {
          onDataRestored();
        }
        setRestoreFileText('');
        setRestoreFileName('');
        setRestoreSummary(null);
        setActiveTab('export');
      } else {
        showToast(res.message, 'error');
      }
    } finally {
      setIsRestoring(false);
    }
  };

  const formatTimestamp = (isoString?: string | null) => {
    if (!isoString) return 'Nenhum download registrado';
    try {
      const d = new Date(isoString);
      return d.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-start justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span>Backup Completo & Exportação JSON</span>
                <span className="text-[10px] uppercase tracking-wider font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                  Migração Total
                </span>
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Exporte ou migre clientes, categorias, catálogo de fotos modelo e pacotes de valores em um único arquivo.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/30">
          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'export'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download & Exportação</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'preview'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Visualizar JSON</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('restore')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'restore'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Restaurar / Migrar</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1">
          {/* TAB 1: EXPORT & DOWNLOAD */}
          {activeTab === 'export' && (
            <div className="space-y-5">
              {/* Quick Status Cards - 4 items in grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80">
                  <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 text-xs">
                    <Users className="w-3.5 h-3.5 text-amber-500" />
                    <span>Clientes</span>
                  </div>
                  <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                    {totalClients}
                  </p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Cadastrados no app</p>
                </div>

                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80">
                  <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 text-xs">
                    <FolderTree className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Categorias</span>
                  </div>
                  <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                    {totalCategories}
                  </p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Com capas e descrições</p>
                </div>

                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80">
                  <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 text-xs">
                    <ImageIcon className="w-3.5 h-3.5 text-sky-500" />
                    <span>Fotos Catálogo</span>
                  </div>
                  <p className="text-lg font-bold text-sky-600 dark:text-sky-400 mt-1">
                    {totalModelPhotos}
                  </p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Modelos e prompts</p>
                </div>

                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80">
                  <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 text-xs">
                    <Package className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Pacotes</span>
                  </div>
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    {totalPackages}
                  </p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Preços e benefícios</p>
                </div>
              </div>

              {/* Informational Sub-Metric Bar */}
              <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/70 text-xs">
                <div className="flex items-center gap-2">
                  <HeartHandshake className="w-4 h-4 text-emerald-500" />
                  <span className="text-zinc-600 dark:text-zinc-400">
                    Fotos Escolhidas pelos Clientes: <strong className="text-zinc-900 dark:text-zinc-100">{totalChosenPhotos}</strong> (em {clientsWithSelections} cliente(s))
                  </span>
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <Clock className="w-4 h-4 text-sky-500" />
                  <span className="text-zinc-600 dark:text-zinc-400">
                    Último Backup: <strong className="text-zinc-900 dark:text-zinc-100">{formatTimestamp(settings.lastBackupTimestamp)}</strong>
                  </span>
                </div>
              </div>

              {/* Primary Action Button */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300 dark:border-amber-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Download Local do Arquivo JSON de Backup</span>
                  </h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-md">
                    Gera um arquivo <code className="px-1 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 font-mono text-[11px]">.json</code> completo contendo todos os clientes, categorias cadastradas, catálogo de fotos modelo com seus respectivos prompts e pacotes da agência.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-all cursor-pointer shrink-0 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar Backup Completo JSON</span>
                </button>
              </div>

              {/* Automation Toggles */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                  <Settings className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Configurações de Automação Preventiva</span>
                </h4>

                {/* Toggle 1: Auto Background Backup */}
                <div className="flex items-start justify-between gap-4 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/70">
                  <div>
                    <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      Backup Automático em Segundo Plano
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Atualiza e salva automaticamente os snapshots de backup a cada novo cliente cadastrado ou foto escolhida.
                    </p>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                    <input
                      type="checkbox"
                      checked={settings.autoBackupEnabled}
                      onChange={(e) => handleToggleAutoBackup(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-zinc-300 dark:bg-zinc-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>

                {/* Toggle 2: Auto Download on Selection */}
                <div className="flex items-start justify-between gap-4 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/70">
                  <div>
                    <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      Download Automático ao Receber Seleção
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Baixa o arquivo JSON automaticamente para a sua pasta de Downloads no momento em que um cliente envia suas fotos escolhidas.
                    </p>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                    <input
                      type="checkbox"
                      checked={settings.autoDownloadOnSelection}
                      onChange={(e) => handleToggleAutoDownload(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-zinc-300 dark:bg-zinc-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>
              </div>

              {/* Informational tip */}
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 text-blue-800 dark:text-blue-300 text-[11px] flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Migração entre contas:</span> Este arquivo exporta toda a base de dados (clientes, categorias, galeria de modelos e pacotes), permitindo migrar tudo de uma instalação para outra facilmente.
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PREVIEW JSON */}
          {activeTab === 'preview' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Estrutura gerada em tempo real com {totalClients} cliente(s), {totalCategories} categoria(s), {totalModelPhotos} foto(s) modelo e {totalPackages} pacote(s):
                </p>
                <button
                  type="button"
                  onClick={handleCopyJson}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copiado!' : 'Copiar JSON'}</span>
                </button>
              </div>

              <div className="relative rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-950 text-zinc-300 font-mono text-[11px] p-3.5 max-h-[340px] overflow-y-auto">
                <pre className="whitespace-pre-wrap break-all">
                  {JSON.stringify(backupPayload, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: RESTORE BACKUP */}
          {activeTab === 'restore' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Aviso de Restauração:</span> A restauração vai substituir os clientes, categorias, catálogo de fotos modelo e pacotes de valores atuais pelos dados presentes no arquivo de backup selecionado.
                </div>
              </div>

              {/* Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-amber-500 dark:hover:border-amber-500 rounded-xl p-6 text-center cursor-pointer transition-colors bg-zinc-50/50 dark:bg-zinc-800/30"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelected}
                  accept=".json,application/json"
                  className="hidden"
                />
                <FileJson className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  {restoreFileName ? restoreFileName : 'Clique para selecionar o arquivo de backup .JSON'}
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                  Compatível com backups completos e backups anteriores do sistema
                </p>
              </div>

              {/* Validation Summary */}
              {restoreSummary && (
                <div
                  className={`p-3.5 rounded-xl border text-xs ${
                    restoreSummary.valid
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                      : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                  }`}
                >
                  {restoreSummary.valid ? (
                    <div className="space-y-2">
                      <p className="font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>Arquivo de backup analisado com sucesso! Itens encontrados:</span>
                      </p>
                      
                      {/* Grid displaying counts of all items found in the file */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                        <div className="p-2 rounded-lg bg-white/70 dark:bg-zinc-800/70 border border-emerald-200 dark:border-emerald-800/60">
                          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block">Clientes:</span>
                          <strong className="text-sm text-zinc-900 dark:text-zinc-100">{restoreSummary.clientCount}</strong>
                          <span className="text-[10px] text-zinc-500 block">({restoreSummary.chosenCount} fotos esc.)</span>
                        </div>

                        <div className="p-2 rounded-lg bg-white/70 dark:bg-zinc-800/70 border border-emerald-200 dark:border-emerald-800/60">
                          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block">Categorias:</span>
                          <strong className="text-sm text-zinc-900 dark:text-zinc-100">{restoreSummary.categoryCount}</strong>
                          <span className="text-[10px] text-zinc-500 block">
                            {restoreSummary.hasCategories ? 'inclusas no arquivo' : 'não presentes (mantém atuais)'}
                          </span>
                        </div>

                        <div className="p-2 rounded-lg bg-white/70 dark:bg-zinc-800/70 border border-emerald-200 dark:border-emerald-800/60">
                          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block">Fotos do Catálogo:</span>
                          <strong className="text-sm text-zinc-900 dark:text-zinc-100">{restoreSummary.modelPhotoCount}</strong>
                          <span className="text-[10px] text-zinc-500 block">
                            {restoreSummary.hasModelPhotos ? 'inclusas no arquivo' : 'não presentes (mantém atuais)'}
                          </span>
                        </div>

                        <div className="p-2 rounded-lg bg-white/70 dark:bg-zinc-800/70 border border-emerald-200 dark:border-emerald-800/60">
                          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block">Pacotes da Agência:</span>
                          <strong className="text-sm text-zinc-900 dark:text-zinc-100">{restoreSummary.packageCount}</strong>
                          <span className="text-[10px] text-zinc-500 block">
                            {restoreSummary.hasPackages ? 'inclusos no arquivo' : 'não presentes (mantém atuais)'}
                          </span>
                        </div>
                      </div>

                      {restoreSummary.exportDate && (
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 pt-1">
                          <strong>Data da exportação original:</strong> {formatTimestamp(restoreSummary.exportDate)}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-500" />
                      <span>{restoreSummary.error}</span>
                    </p>
                  )}
                </div>
              )}

              {restoreSummary?.valid && (
                <button
                  type="button"
                  onClick={handleConfirmRestore}
                  disabled={isRestoring}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-xs rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isRestoring ? 'animate-spin' : ''}`} />
                  <span>
                    Restaurar Dados ({restoreSummary.clientCount} Clientes
                    {restoreSummary.hasCategories ? `, ${restoreSummary.categoryCount} Categorias` : ''}
                    {restoreSummary.hasModelPhotos ? `, ${restoreSummary.modelPhotoCount} Fotos Catálogo` : ''}
                    {restoreSummary.hasPackages ? `, ${restoreSummary.packageCount} Pacotes` : ''})
                  </span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-between">
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                settings.autoBackupEnabled ? 'bg-emerald-500' : 'bg-zinc-400'
              }`}
            />
            <span>
              {settings.autoBackupEnabled
                ? 'Exportação automática ativa'
                : 'Exportação automática pausada'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
            >
              Fechar
            </button>

            {activeTab === 'export' && (
              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Baixar JSON</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

