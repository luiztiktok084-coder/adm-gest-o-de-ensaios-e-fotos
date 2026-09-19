import React, { useState } from 'react';
import {
  ShieldAlert,
  UploadCloud,
  Copy,
  ExternalLink,
  MessageCircle,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Sparkles,
  Image as ImageIcon,
  Loader2,
  Clock,
  Eye,
  Type,
  Send,
  Check,
  Edit3,
  PackageCheck,
  RefreshCw,
  X,
  FileCheck,
} from 'lucide-react';
import { Client, WatermarkedPhoto } from '../../types';
import { saveClients, generateUniqueToken, syncDataFromServer, uploadImageToBlob } from '../../utils/storage';
import { compressImageFile } from '../../utils/imageCompressor';
import { useToast } from '../Toast';
import { ConfirmModal } from '../ConfirmModal';
import { NavView } from '../Sidebar';

interface WatermarkedPhotosViewProps {
  clients: Client[];
  onNavigate: (view: NavView) => void;
}

export const WatermarkedPhotosView: React.FC<WatermarkedPhotosViewProps> = ({
  clients,
  onNavigate,
}) => {
  const { showToast } = useToast();
  const [selectedClientId, setSelectedClientId] = useState<string>(
    clients.find((c) => (c.watermarkedPhotos && c.watermarkedPhotos.length > 0) || c.status === 'Em produção' || c.status === 'Selecionado')?.id ||
      clients[0]?.id ||
      ''
  );

  const currentClient = clients.find((c) => c.id === selectedClientId);

  // Watermark text configuration
  const [watermarkText, setWatermarkText] = useState(
    currentClient?.watermarkText || 'PRÉVIA • NÃO COPIAR'
  );

  // Upload states
  const [photoName, setPhotoName] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Preview Lightbox
  const [previewPhoto, setPreviewPhoto] = useState<WatermarkedPhoto | null>(null);

  // Delete modal state
  const [photoToRemove, setPhotoToRemove] = useState<{ id: string; name: string } | null>(null);

  // When client changes, sync watermark text
  React.useEffect(() => {
    if (currentClient) {
      setWatermarkText(currentClient.watermarkText || 'PRÉVIA • NÃO COPIAR');
    }
  }, [currentClient?.id]);

  const handleMultipleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setUploadedFiles((prev) => [...prev, ...files]);
    }
  };

  const handleSaveWatermarkText = () => {
    if (!currentClient) return;
    const updatedClients = clients.map((c) =>
      c.id === currentClient.id
        ? { ...c, watermarkText: watermarkText.trim() || 'PRÉVIA • NÃO COPIAR' }
        : c
    );
    saveClients(updatedClients);
    showToast('Texto da marca d\'água atualizado com sucesso!', 'success');
  };

  const handleUploadWatermarkedImages = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentClient) return;

    if (uploadedFiles.length === 0 && !photoUrl.trim()) {
      showToast('Selecione arquivos de imagem ou informe a URL de uma foto.', 'error');
      return;
    }

    try {
      setIsProcessingUpload(true);
      const newWatermarkedPhotos: WatermarkedPhoto[] = [];

      // Process files with compression and upload to Vercel Blob one by one
      for (const file of uploadedFiles) {
        const dataUrl = await compressImageFile(file, 1600, 1600, 0.85);
        const blobUrl = await uploadImageToBlob(dataUrl, file.name);

        newWatermarkedPhotos.push({
          id: generateUniqueToken('wm'),
          name: file.name,
          imageUrl: blobUrl,
          approved: false,
          clientFeedback: '',
          createdAt: new Date().toISOString(),
        });
      }

      // Process single URL if provided
      if (photoUrl.trim()) {
        newWatermarkedPhotos.push({
          id: generateUniqueToken('wm'),
          name: photoName.trim() || `Foto_Previa_${(currentClient.watermarkedPhotos?.length || 0) + 1}.jpg`,
          imageUrl: photoUrl.trim(),
          approved: false,
          clientFeedback: '',
          createdAt: new Date().toISOString(),
        });
      }

      const updatedPhotos = [...(currentClient.watermarkedPhotos || []), ...newWatermarkedPhotos];

      const updatedClients = clients.map((c) =>
        c.id === currentClient.id
          ? {
              ...c,
              watermarkedPhotos: updatedPhotos,
              watermarkText: watermarkText.trim() || c.watermarkText || 'PRÉVIA • NÃO COPIAR',
              proofStatus: c.proofStatus || 'Pendente',
            }
          : c
      );

      saveClients(updatedClients);
      showToast(
        `${newWatermarkedPhotos.length} fotos prontas com marca d'água vinculadas a ${currentClient.name}!`,
        'success'
      );

      // Reset inputs
      setUploadedFiles([]);
      setPhotoName('');
      setPhotoUrl('');
    } catch (err) {
      showToast('Erro ao processar as fotos para upload.', 'error');
    } finally {
      setIsProcessingUpload(false);
    }
  };

  const confirmRemovePhoto = () => {
    if (!currentClient || !photoToRemove) return;
    const updatedPhotos = (currentClient.watermarkedPhotos || []).filter((p) => p.id !== photoToRemove.id);
    const updatedClients = clients.map((c) =>
      c.id === currentClient.id ? { ...c, watermarkedPhotos: updatedPhotos } : c
    );
    saveClients(updatedClients);
    showToast(`Foto "${photoToRemove.name}" removida.`, 'info');
    setPhotoToRemove(null);
  };

  const handleCopyProofLink = (token: string, clientName: string) => {
    const url = `${window.location.origin}${window.location.pathname}#/aprovacao/${token}`;
    navigator.clipboard.writeText(url);
    showToast(`Link de aprovação de ${clientName} copiado!`, 'success');
  };

  const handleWhatsAppProof = (client: Client) => {
    const url = `${window.location.origin}${window.location.pathname}#/aprovacao/${client.token}`;
    const message = encodeURIComponent(
      `Olá ${client.name}! Suas fotos geradas por Inteligência Artificial do ${client.contractedSession} já estão disponíveis para sua prévia e aprovação!\n\nAcesse o link abaixo para visualizar as fotos protegidas com marca d'água, aprovar as que mais gostar ou solicitar qualquer ajuste:\n\n${url}\n\nAguardamos seu feedback!`
    );
    const cleanPhone = client.whatsapp.replace(/\D/g, '');
    const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${message}` : `https://wa.me/?text=${message}`;
    window.open(waUrl, '_blank');
  };

  const handleManualSync = async () => {
    try {
      setIsSyncing(true);
      await syncDataFromServer();
      showToast('Dados sincronizados com sucesso!', 'success');
    } catch {
      showToast('Erro ao sincronizar dados.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const watermarkedList = currentClient?.watermarkedPhotos || [];
  const approvedCount = watermarkedList.filter((p) => p.approved).length;
  const feedbackCount = watermarkedList.filter((p) => (p.clientFeedback || '').trim().length > 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            5.1 Fotos com Marca D'água (Aprovação de Prévias)
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Faça o upload das fotos prontas da IA protegidas por marca d'água, envie o link para o cliente aprovar e receba pedidos de ajustes em cada foto.
          </p>
        </div>

        {/* Sync & Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors shadow-2xs cursor-pointer"
            title="Atualizar respostas de aprovação do cliente"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-amber-500' : ''}`} />
            <span>{isSyncing ? 'Sincronizando...' : 'Atualizar Respostas'}</span>
          </button>
        </div>
      </div>

      {/* Select Client Card */}
      <div className="p-4 sm:p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-3 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
            Selecione o Cliente para Envio da Prévia com Marca D'água:
          </label>
          {currentClient && (
            <span className="text-xs text-zinc-500">
              Ensaio: <strong className="text-zinc-800 dark:text-zinc-200">{currentClient.contractedSession}</strong>
            </span>
          )}
        </div>

        <select
          value={selectedClientId}
          onChange={(e) => setSelectedClientId(e.target.value)}
          className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium"
        >
          {clients.map((c) => {
            const wmCount = c.watermarkedPhotos?.length || 0;
            const appCount = c.watermarkedPhotos?.filter((p) => p.approved).length || 0;
            return (
              <option key={c.id} value={c.id}>
                {c.name} — {c.contractedSession} [{c.status}] ({wmCount} fotos na prévia, {appCount} aprovadas) {c.proofStatus ? `• [${c.proofStatus}]` : ''}
              </option>
            );
          })}
        </select>
      </div>

      {currentClient ? (
        <div className="space-y-6">
          {/* Quick Metrics & Links Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Watermark Config Card */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                <Type className="w-4 h-4" />
                <span>Texto da Marca D'água</span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Digite o texto que aparecerá estampado em todas as fotos da prévia deste cliente:
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  placeholder="Ex: PRÉVIA • NÃO COPIAR"
                  className="flex-1 px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 font-medium"
                />
                <button
                  type="button"
                  onClick={handleSaveWatermarkText}
                  className="px-3.5 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  Salvar
                </button>
              </div>
            </div>

            {/* Client Status & Approval Metrics */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <FileCheck className="w-4 h-4" />
                <span>Status da Aprovação</span>
              </span>
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-zinc-500">Status da Prévia:</span>
                <span className={`font-bold px-2 py-0.5 rounded-md text-[11px] ${
                  currentClient.proofStatus === 'Aprovado'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : currentClient.proofStatus === 'Ajustes solicitados'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                }`}>
                  {currentClient.proofStatus || 'Aguardando envio'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500">Aprovadas pelo cliente:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {approvedCount} de {watermarkedList.length} fotos
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500">Com pedidos de ajuste:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {feedbackCount} fotos
                </span>
              </div>
            </div>

            {/* Quick Share Buttons Card */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-2">
                <Send className="w-4 h-4" />
                <span>Link da Página de Aprovação</span>
              </span>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleCopyProofLink(currentClient.token, currentClient.name)}
                  className="flex items-center justify-center gap-1.5 py-2 px-2.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-all shadow-2xs cursor-pointer"
                  title="Copiar link para a área de transferência"
                >
                  <Copy className="w-3.5 h-3.5 text-amber-500" />
                  <span>Copiar Link</span>
                </button>

                <a
                  href={`#/aprovacao/${currentClient.token}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 py-2 px-2.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-all shadow-2xs cursor-pointer"
                  title="Abrir página de aprovação em nova aba"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-amber-500" />
                  <span>Abrir Link</span>
                </a>
              </div>

              <button
                onClick={() => handleWhatsAppProof(currentClient)}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-2xs cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Enviar p/ WhatsApp do Cliente</span>
              </button>
            </div>
          </div>

          {/* Upload Section */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xs overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-amber-600" />
                Upload das Fotos Prontas com IA para Aprovação ({currentClient.name})
              </h3>
              <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
                Recebe marca d'água automática
              </span>
            </div>

            <form onSubmit={handleUploadWatermarkedImages} className="p-4 sm:p-6 space-y-5">
              {/* File Drop Area */}
              <div className="relative border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-amber-500 dark:hover:border-amber-500 rounded-2xl p-6 text-center bg-zinc-50/50 dark:bg-zinc-800/30 transition-all flex flex-col items-center justify-center min-h-[140px]">
                {isProcessingUpload ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-4">
                    <Loader2 className="w-6 h-6 text-amber-600 animate-spin" />
                    <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      Processando e otimizando fotos...
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                      Selecione ou arraste as fotos geradas prontas da IA
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Você pode selecionar múltiplos arquivos para upload simultâneo
                    </p>

                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleMultipleFilesChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </>
                )}
              </div>

              {/* Uploaded Files Staged */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2 p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700">
                  <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    <span>{uploadedFiles.length} arquivos prontos para vincular:</span>
                    <button
                      type="button"
                      onClick={() => setUploadedFiles([])}
                      className="text-rose-500 hover:underline text-[11px]"
                    >
                      Limpar todos
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {uploadedFiles.map((file, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 px-2.5 py-1 rounded-lg text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5"
                      >
                        ✓ {file.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Direct URL input fallback */}
              <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 block">
                  Ou adicione por URL de imagem:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={photoName}
                    onChange={(e) => setPhotoName(e.target.value)}
                    placeholder="Nome do arquivo (ex: Previa_01.jpg)"
                    className="px-3.5 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100"
                  />
                  <input
                    type="url"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="https://exemplo.com/foto-ia.jpg"
                    className="px-3.5 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isProcessingUpload}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 disabled:opacity-50 rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Vincular Fotos à Prévia do Cliente</span>
                </button>
              </div>
            </form>
          </div>

          {/* Gallery of Uploaded Watermarked Photos & Client Approvals */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <span>Fotos na Prévia com Marca D'água ({watermarkedList.length})</span>
                </h3>
                <p className="text-xs text-zinc-500">
                  Veja quais fotos foram marcadas como aprovadas e os pedidos de ajuste deixados pelo cliente.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate('final_delivery')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  <PackageCheck className="w-3.5 h-3.5" />
                  <span>Ir para Entrega Final</span>
                </button>
              </div>
            </div>

            {watermarkedList.length === 0 ? (
              <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-2">
                <ShieldAlert className="w-8 h-8 text-zinc-400 mx-auto" />
                <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Nenhuma foto carregada para aprovação ainda
                </h4>
                <p className="text-xs text-zinc-500 max-w-md mx-auto">
                  Faça o upload das imagens prontas acima para gerar o link protegido de prévia para {currentClient.name}.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 pt-2">
                {watermarkedList.map((photo, index) => {
                  const hasFeedback = (photo.clientFeedback || '').trim().length > 0;
                  const isApproved = photo.approved;

                  return (
                    <div
                      key={photo.id || index}
                      className={`bg-zinc-50 dark:bg-zinc-800/50 border rounded-2xl overflow-hidden flex flex-col justify-between shadow-xs transition-all hover:shadow-md ${
                        isApproved
                          ? 'border-amber-500 ring-2 ring-amber-500/20'
                          : 'border-zinc-200 dark:border-zinc-800'
                      }`}
                    >
                      <div>
                        {/* Image with Visual Watermark Simulation */}
                        <div className="relative aspect-[3/4] bg-zinc-950 overflow-hidden select-none">
                          <img
                            src={photo.imageUrl}
                            alt={photo.name}
                            className="w-full h-full object-cover object-top pointer-events-none"
                            loading="lazy"
                          />

                          {/* Social Clean Watermark Overlay */}
                          <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center select-none">
                            <div className="rotate-[-25deg] select-none opacity-30 text-white font-extrabold text-[11px] sm:text-xs tracking-widest uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] whitespace-nowrap">
                              {watermarkText}
                            </div>
                            <div className="absolute px-2.5 py-0.5 rounded-md bg-black/40 backdrop-blur-xs border border-white/15 text-white/90 text-[10px] font-bold tracking-wider uppercase text-center shadow-lg">
                              {watermarkText}
                            </div>
                          </div>

                          {/* Top Badges */}
                          <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/80 text-white backdrop-blur-xs border border-white/10 shadow-xs">
                              #{index + 1}
                            </span>
                            {isApproved && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500 text-zinc-950 shadow-xs flex items-center gap-1">
                                <Check className="w-3 h-3 stroke-[3]" />
                                Aprovada
                              </span>
                            )}
                          </div>

                          {/* Action Buttons Overlay */}
                          <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
                            <button
                              type="button"
                              onClick={() => setPreviewPhoto(photo)}
                              className="p-1.5 bg-black/70 hover:bg-amber-500 text-white hover:text-zinc-950 rounded-lg backdrop-blur-xs transition-colors cursor-pointer shadow-md"
                              title="Ampliar foto com marca d'água"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setPhotoToRemove({ id: photo.id, name: photo.name })}
                              className="p-1.5 bg-black/70 hover:bg-rose-600 text-white rounded-lg backdrop-blur-xs transition-colors cursor-pointer shadow-md"
                              title="Remover foto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Bottom filename */}
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-2.5">
                            <p className="text-[11px] font-medium text-white truncate">
                              {photo.name}
                            </p>
                          </div>
                        </div>

                        {/* Details & Feedback Notes Box */}
                        <div className="p-3.5 space-y-2.5">
                          {/* Approval status indicator */}
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                              Status do Cliente:
                            </span>
                            {isApproved ? (
                              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Aprovada
                              </span>
                            ) : hasFeedback ? (
                              <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Ajuste Solicitado
                              </span>
                            ) : (
                              <span className="text-[11px] text-zinc-400">
                                Pendente de avaliação
                              </span>
                            )}
                          </div>

                          {/* Client Feedback text */}
                          {hasFeedback ? (
                            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/60 rounded-xl space-y-1">
                              <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1 uppercase tracking-wider">
                                <Edit3 className="w-3 h-3" />
                                Pedido de Correção do Cliente:
                              </span>
                              <p className="text-xs text-zinc-800 dark:text-zinc-200 italic leading-relaxed select-text">
                                "{photo.clientFeedback}"
                              </p>
                            </div>
                          ) : (
                            <p className="text-[11px] text-zinc-400 italic">
                              Nenhum pedido de correção registrado pelo cliente nesta foto.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
          <p className="text-xs text-zinc-500">Nenhum cliente cadastrado no sistema.</p>
        </div>
      )}

      {/* Lightbox Modal */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-150"
          onClick={() => setPreviewPhoto(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-zinc-800 bg-zinc-900/70">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white truncate">
                  {previewPhoto.name}
                </h3>
                <span className="text-[11px] text-amber-400 font-medium block">
                  Visualização com Marca D'água Ativa
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Photo with Watermark */}
            <div className="p-4 sm:p-6 flex-1 overflow-auto flex items-center justify-center bg-black/80 relative select-none">
              <div className="relative max-h-[65vh] inline-block">
                <img
                  src={previewPhoto.imageUrl}
                  alt={previewPhoto.name}
                  className="max-h-[65vh] w-auto max-w-full object-contain rounded-2xl shadow-2xl pointer-events-none"
                />
                {/* Diagonal watermark */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden select-none">
                  <div className="rotate-[-25deg] select-none opacity-30 text-white font-extrabold text-xs sm:text-base tracking-widest uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] whitespace-nowrap">
                    {watermarkText}
                  </div>
                  <div className="absolute px-3 py-1 rounded-lg bg-black/45 backdrop-blur-xs border border-white/20 text-white/90 text-xs sm:text-sm font-bold tracking-wider uppercase text-center shadow-2xl">
                    {watermarkText}
                  </div>
                </div>
              </div>
            </div>

            {/* Client Notes footer */}
            {previewPhoto.clientFeedback && (
              <div className="p-4 bg-zinc-900 border-t border-zinc-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-1">
                  Correção solicitada pelo cliente:
                </span>
                <p className="text-xs text-zinc-200">
                  {previewPhoto.clientFeedback}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!photoToRemove}
        title="Remover Foto da Prévia"
        message={`Deseja remover a foto "${photoToRemove?.name}" da lista de prévia deste cliente?`}
        confirmLabel="Remover Foto"
        cancelLabel="Cancelar"
        isDestructive={true}
        onConfirm={confirmRemovePhoto}
        onCancel={() => setPhotoToRemove(null)}
      />
    </div>
  );
};
