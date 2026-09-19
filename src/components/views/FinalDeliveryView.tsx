import React, { useState } from 'react';
import {
  PackageCheck,
  UploadCloud,
  Download,
  Share2,
  Copy,
  ExternalLink,
  MessageCircle,
  CheckCircle2,
  Trash2,
  Sparkles,
  Image as ImageIcon,
  Check,
  Loader2,
  Clock,
} from 'lucide-react';
import { Client, FinalPhoto } from '../../types';
import { saveClients, generateUniqueToken, uploadImageToBlob } from '../../utils/storage';
import { compressImageFile } from '../../utils/imageCompressor';
import { downloadImagesAsZip } from '../../utils/zip';
import { useToast } from '../Toast';
import { ConfirmModal } from '../ConfirmModal';

interface FinalDeliveryViewProps {
  clients: Client[];
}

export const FinalDeliveryView: React.FC<FinalDeliveryViewProps> = ({ clients }) => {
  const { showToast } = useToast();
  const [selectedClientId, setSelectedClientId] = useState<string>(
    clients.find((c) => c.status === 'Em produção' || c.status === 'Selecionado')?.id ||
      clients[0]?.id ||
      ''
  );

  // Upload states for new final photos
  const [photoName, setPhotoName] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState('');

  // Delete modal state
  const [photoToRemove, setPhotoToRemove] = useState<{ id: string; name: string } | null>(null);

  const currentClient = clients.find((c) => c.id === selectedClientId);

  const handleMultipleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setUploadedFiles((prev) => [...prev, ...files]);
    }
  };

  const handleUploadFinalImages = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentClient) return;

    if (uploadedFiles.length === 0 && !photoUrl.trim()) {
      showToast('Selecione arquivos de imagem ou informe a URL de uma foto.', 'error');
      return;
    }

    try {
      setIsProcessingUpload(true);
      const newFinalPhotos: FinalPhoto[] = [];

      // Process files with compression and upload to Vercel Blob one by one
      for (const file of uploadedFiles) {
        const dataUrl = await compressImageFile(file, 1600, 1600, 0.85);
        const blobUrl = await uploadImageToBlob(dataUrl, file.name);

        newFinalPhotos.push({
          id: generateUniqueToken('fin'),
          name: file.name,
          imageUrl: blobUrl,
          createdAt: new Date().toISOString(),
        });
      }

      // Process single URL if provided
      if (photoUrl.trim()) {
        newFinalPhotos.push({
          id: generateUniqueToken('fin'),
          name: photoName.trim() || `Foto_Final_${(currentClient.finalPhotos?.length || 0) + 1}.jpg`,
          imageUrl: photoUrl.trim(),
          createdAt: new Date().toISOString(),
        });
      }

      const updatedFinalPhotos = [...(currentClient.finalPhotos || []), ...newFinalPhotos];

      // Automatically update status to "Entregue"
      const updatedClients = clients.map((c) =>
        c.id === currentClient.id
          ? {
              ...c,
              finalPhotos: updatedFinalPhotos,
              status: 'Entregue' as const,
              deliveredAt: new Date().toISOString(),
            }
          : c
      );

      saveClients(updatedClients);
      showToast(
        `${newFinalPhotos.length} fotos finais vinculadas a ${currentClient.name}! Status atualizado para "Entregue".`,
        'success'
      );

      // Reset inputs
      setUploadedFiles([]);
      setPhotoName('');
      setPhotoUrl('');
    } catch (err) {
      showToast('Erro ao processar as fotos finais para upload.', 'error');
    } finally {
      setIsProcessingUpload(false);
    }
  };

  const confirmRemoveFinalPhoto = () => {
    if (!currentClient || !photoToRemove) return;
    const updatedPhotos = currentClient.finalPhotos.filter((p) => p.id !== photoToRemove.id);
    const updatedClients = clients.map((c) =>
      c.id === currentClient.id ? { ...c, finalPhotos: updatedPhotos } : c
    );
    saveClients(updatedClients);
    showToast(`Foto "${photoToRemove.name}" removida.`, 'info');
    setPhotoToRemove(null);
  };

  const handleCopyDeliveryLink = (token: string, clientName: string) => {
    const url = `${window.location.origin}${window.location.pathname}#/entrega/${token}`;
    navigator.clipboard.writeText(url);
    showToast(`Link de entrega final de ${clientName} copiado!`, 'success');
  };

  const handleWhatsAppDelivery = (client: Client) => {
    const url = `${window.location.origin}${window.location.pathname}#/entrega/${client.token}`;
    const message = encodeURIComponent(
      `Olá ${client.name}! Suas fotos finais do ${client.contractedSession} estão prontas com alta resolução!\n\nAcesse o link abaixo para visualizar e baixar todas as fotos em .zip:\n\n${url}\n\nObrigado pela confiança!`
    );
    const cleanPhone = client.whatsapp.replace(/\D/g, '');
    const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${message}` : `https://wa.me/?text=${message}`;
    window.open(waUrl, '_blank');
  };

  const handleDownloadZipNow = async (client: Client) => {
    if (!client.finalPhotos || client.finalPhotos.length === 0) {
      showToast('Nenhuma foto final cadastrada para download.', 'error');
      return;
    }

    try {
      setIsZipping(true);
      const items = client.finalPhotos.map((p, idx) => ({
        name: p.name || `Foto_${idx + 1}.jpg`,
        url: p.imageUrl,
      }));

      const zipFilename = `Ensaio_${client.name.replace(/\s+/g, '_')}_Final.zip`;
      await downloadImagesAsZip(items, zipFilename, (text) => setZipProgress(text));
      showToast(`Download de ${zipFilename} concluído com sucesso!`, 'success');
    } catch (err) {
      showToast('Erro ao criar arquivo ZIP.', 'error');
    } finally {
      setIsZipping(false);
      setZipProgress('');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Entrega Final de Ensaios
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
          Faça o upload das imagens finais geradas pela IA, gere o link de entrega para o cliente baixar em .zip e conclua o ensaio.
        </p>
      </div>

      {/* Select Client Card */}
      <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-3">
        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
          Selecione o Cliente para Entrega:
        </label>
        <select
          value={selectedClientId}
          onChange={(e) => setSelectedClientId(e.target.value)}
          className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium"
        >
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} — {c.contractedSession} [{c.status}] ({c.finalPhotos?.length || 0} fotos finais prontas)
            </option>
          ))}
        </select>

        {/* Stage Status Guidance */}
        {currentClient && (
          <div
            className={`p-3.5 rounded-xl border text-xs leading-relaxed flex items-start gap-2.5 ${
              currentClient.status === 'Aguardando seleção'
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300'
                : currentClient.status === 'Selecionado'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300'
                : currentClient.status === 'Em produção'
                ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900/60 text-purple-800 dark:text-purple-300'
                : 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-900/60 text-sky-800 dark:text-sky-300'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {currentClient.status === 'Aguardando seleção' && <Clock className="w-4 h-4 text-amber-600" />}
              {currentClient.status === 'Selecionado' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              {currentClient.status === 'Em produção' && <Sparkles className="w-4 h-4 text-purple-600" />}
              {currentClient.status === 'Entregue' && <PackageCheck className="w-4 h-4 text-sky-600" />}
            </div>
            <div>
              <p className="font-semibold">
                Status Atual: <span className="underline">{currentClient.status}</span>
              </p>
              <p className="mt-0.5 opacity-90">
                {currentClient.status === 'Aguardando seleção' &&
                  'O cliente ainda não confirmou as fotos favoritas no link de seleção. O fluxo correto é aguardar o cliente escolher para que as fotos apareçam na aba "Fotos Escolhidas".'}
                {currentClient.status === 'Selecionado' &&
                  'O cliente já escolheu as fotos! Vá até a aba "Fotos Escolhidas" para copiar os prompts de IA. Quando terminar de gerar as fotos na IA, faça o upload delas aqui para disponibilizar o pacote .ZIP.'}
                {currentClient.status === 'Em produção' &&
                  'Ensaio em fase de produção. Quando as fotos finais estiverem geradas, faça o upload abaixo para concluir a entrega ao cliente.'}
                {currentClient.status === 'Entregue' &&
                  'Ensaio já entregue com fotos finais disponíveis! O cliente pode acessar o link público e baixar o arquivo .ZIP a qualquer momento.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {currentClient ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left / Top 2 Cols: Upload Final Images */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upload Box */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xs overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-amber-600" />
                  Upload das Fotos Finais Geradas ({currentClient.name})
                </h3>
                <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
                  Muda status para "Entregue"
                </span>
              </div>

              <form onSubmit={handleUploadFinalImages} className="p-6 space-y-5">
                {/* File Drop / Multi upload */}
                <div className="relative border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-amber-500 dark:hover:border-amber-500 rounded-2xl p-6 text-center bg-zinc-50/50 dark:bg-zinc-800/30 transition-all flex flex-col items-center justify-center min-h-[160px]">
                  {isProcessingUpload ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-4">
                      <Loader2 className="w-6 h-6 text-amber-600 animate-spin" />
                      <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        Otimizando fotos finais...
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                      <p className="text-xs sm:text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                        Selecione ou arraste as fotos finais geradas na IA
                      </p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Você pode selecionar múltiplos arquivos simultaneamente
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

                {/* List of staged files */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-2 p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700">
                    <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      <span>{uploadedFiles.length} arquivos selecionados para upload:</span>
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

                {/* Alternative Direct URL */}
                <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 block">
                    Ou adicione por URL de imagem:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={photoName}
                      onChange={(e) => setPhotoName(e.target.value)}
                      placeholder="Nome do arquivo (ex: Foto_01.jpg)"
                      className="px-3.5 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100"
                    />
                    <input
                      type="url"
                      value={photoUrl}
                      onChange={(e) => setPhotoUrl(e.target.value)}
                      placeholder="https://exemplo.com/foto-final.jpg"
                      className="px-3.5 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isProcessingUpload}
                    className="px-5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 disabled:opacity-50 rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>Vincular Fotos & Marcar como "Entregue"</span>
                  </button>
                </div>
              </form>
            </div>

            {/* List of currently delivered photos for this client */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Fotos Finais Prontas ({currentClient.finalPhotos?.length || 0})
                </h3>
                {currentClient.finalPhotos && currentClient.finalPhotos.length > 0 && (
                  <button
                    onClick={() => handleDownloadZipNow(currentClient)}
                    disabled={isZipping}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isZipping ? zipProgress || 'Compactando...' : 'Baixar Todas (.zip)'}</span>
                  </button>
                )}
              </div>

              {(!currentClient.finalPhotos || currentClient.finalPhotos.length === 0) ? (
                <p className="text-xs text-zinc-500 py-6 text-center">
                  Nenhuma foto final carregada para este cliente ainda.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {currentClient.finalPhotos.map((photo, idx) => (
                    <div
                      key={photo.id || idx}
                      className="group relative rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-950 aspect-[3/4] shadow-xs"
                    >
                      <img
                        src={photo.imageUrl}
                        alt={photo.name}
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => setPhotoToRemove({ id: photo.id, name: photo.name })}
                            className="p-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 cursor-pointer shadow-md"
                            title="Remover foto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-[11px] text-white font-medium truncate">
                          {photo.name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Col: Client Summary & Delivery Links Card */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-2xs space-y-5">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Resumo da Entrega
                </span>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  {currentClient.name}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {currentClient.contractedSession}
                </p>
              </div>

              {/* Status indicator */}
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between text-xs">
                <span className="text-zinc-600 dark:text-zinc-400 font-medium">Status Atual:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {currentClient.status}
                </span>
              </div>

              {/* Delivery Public Link Section */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  Link de Entrega do Cliente (.ZIP)
                </label>
                <div className="p-3 bg-zinc-100 dark:bg-zinc-800/90 rounded-xl space-y-2.5">
                  <span className="text-[11px] font-mono text-zinc-600 dark:text-zinc-300 break-all block">
                    {`${window.location.origin}${window.location.pathname}#/entrega/${currentClient.token}`}
                  </span>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleCopyDeliveryLink(currentClient.token, currentClient.name)}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-600 rounded-xl transition-all shadow-2xs"
                    >
                      <Copy className="w-3.5 h-3.5 text-amber-500" />
                      <span>Copiar Link de Entrega</span>
                    </button>

                    <button
                      onClick={() => handleWhatsAppDelivery(currentClient)}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-2xs"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Enviar Link via WhatsApp</span>
                    </button>

                    <a
                      href={`#/entrega/${currentClient.token}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 rounded-xl transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Testar Página de Entrega</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Delivery Download Direct Test */}
              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  onClick={() => handleDownloadZipNow(currentClient)}
                  disabled={isZipping || !currentClient.finalPhotos || currentClient.finalPhotos.length === 0}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>
                    {isZipping ? zipProgress || 'Gerando ZIP...' : 'Baixar Pacote .ZIP Agora'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
          <p className="text-xs text-zinc-500">Nenhum cliente cadastrado no sistema.</p>
        </div>
      )}

      {/* Modal de remoção de foto final */}
      <ConfirmModal
        isOpen={!!photoToRemove}
        title="Remover Foto Final"
        message={`Deseja remover a foto final "${photoToRemove?.name}" deste cliente?`}
        confirmLabel="Remover Foto"
        cancelLabel="Cancelar"
        isDestructive={true}
        onConfirm={confirmRemoveFinalPhoto}
        onCancel={() => setPhotoToRemove(null)}
      />
    </div>
  );
};
