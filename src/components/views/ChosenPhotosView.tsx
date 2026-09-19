import React, { useState } from 'react';
import {
  HeartHandshake,
  Copy,
  Users,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  PackageCheck,
  ShieldAlert,
  ExternalLink,
  MessageCircle,
  RefreshCw,
  Clock,
  Send,
  Trash2,
  ShieldCheck,
} from 'lucide-react';
import { Client, ModelPhoto } from '../../types';
import { saveClients, syncDataFromServer, getModelPhotos } from '../../utils/storage';
import { useToast } from '../Toast';
import { NavView } from '../Sidebar';

interface ChosenPhotosViewProps {
  clients: Client[];
  modelPhotos: ModelPhoto[];
  onNavigate: (view: NavView) => void;
  onOpenBackupModal?: () => void;
}

export const ChosenPhotosView: React.FC<ChosenPhotosViewProps> = ({
  clients,
  modelPhotos,
  onNavigate,
  onOpenBackupModal,
}) => {
  const { showToast } = useToast();
  const [selectedClientId, setSelectedClientId] = useState<string>('todos');
  const [isSyncing, setIsSyncing] = useState(false);

  // Filter only clients who have selected photos and are NOT yet delivered (Entregue)
  const clientsWithSelections = clients.filter(
    (c) =>
      c.status !== 'Entregue' &&
      ((c.chosenPhotoIds && c.chosenPhotoIds.length > 0) ||
        c.status === 'Selecionado' ||
        c.status === 'Em produção')
  );

  const displayedClients =
    selectedClientId === 'todos'
      ? clientsWithSelections
      : clientsWithSelections.filter((c) => c.id === selectedClientId);

  const handleManualSync = async () => {
    try {
      setIsSyncing(true);
      await syncDataFromServer();
      showToast('Seleções sincronizadas com sucesso!', 'success');
    } catch {
      showToast('Erro ao sincronizar dados.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopyPrompt = (promptText: string, photoName: string, clientName: string) => {
    navigator.clipboard.writeText(promptText);
    showToast(`Prompt de "${photoName}" (Cliente: ${clientName}) copiado!`, 'success');
  };

  const handleCopyAllClientPrompts = (client: Client) => {
    const allPhotos = modelPhotos.length > 0 ? modelPhotos : getModelPhotos();
    const chosenPhotos = allPhotos.filter((p) => client.chosenPhotoIds?.includes(p.id));
    
    if (chosenPhotos.length === 0) {
      showToast('Nenhum prompt disponível para copiar.', 'error');
      return;
    }

    const allPrompts = chosenPhotos
      .map((p, idx) => `[Foto ${idx + 1}: ${p.name}]\n${p.prompt}`)
      .join('\n\n---\n\n');

    navigator.clipboard.writeText(allPrompts);
    showToast(`Todos os ${chosenPhotos.length} prompts de ${client.name} copiados!`, 'success');
  };

  const handleRemoveChosenPhoto = (client: Client, photoId: string, photoName: string) => {
    const nextChosen = (client.chosenPhotoIds || []).filter((id) => id !== photoId);
    const nextStatus = nextChosen.length === 0 && client.status === 'Selecionado' ? 'Aguardando seleção' as const : client.status;
    const updated = clients.map((c) =>
      c.id === client.id
        ? {
            ...c,
            chosenPhotoIds: nextChosen,
            status: nextStatus,
          }
        : c
    );
    saveClients(updated);
    syncDataFromServer();
    showToast(`Foto "${photoName}" removida da seleção de ${client.name}!`, 'success');
  };

  const handleMarkInProduction = (client: Client) => {
    const updated = clients.map((c) =>
      c.id === client.id ? { ...c, status: 'Em produção' as const } : c
    );
    saveClients(updated);
    showToast(`${client.name} movido para status "Em produção"!`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-emerald-600" />
            Fotos Escolhidas pelos Clientes
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Acompanhe as escolhas confirmadas pelos clientes, copie os prompts para geração na IA e avance para produção.
          </p>
        </div>

        {/* Filter, Backup and Sync Button */}
        <div className="flex flex-wrap items-center gap-2">
          {onOpenBackupModal && (
            <button
              type="button"
              onClick={onOpenBackupModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 rounded-xl transition-colors shadow-2xs cursor-pointer"
              title="Exportar dados e fotos selecionadas para arquivo JSON"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Backup Seleções (JSON)</span>
            </button>
          )}

          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors shadow-2xs cursor-pointer"
            title="Verificar novas seleções recebidas dos clientes"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-amber-500' : ''}`} />
            <span>{isSyncing ? 'Sincronizando...' : 'Atualizar Seleções'}</span>
          </button>

          {clientsWithSelections.length > 0 && (
            <div className="flex items-center gap-2">
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="px-3 py-1.5 text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-800 dark:text-zinc-200 focus:outline-hidden font-medium"
              >
                <option value="todos">Todos com Escolhas ({clientsWithSelections.length})</option>
                {clientsWithSelections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.chosenPhotoIds?.length || 0} fotos) - [{c.status}]
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Empty State */}
      {displayedClients.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto shadow-xs">
            <HeartHandshake className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200">
              Nenhuma seleção confirmada pendente
            </h3>
            <p className="text-xs text-zinc-500 max-w-md mx-auto leading-relaxed">
              Quando seus clientes abrirem o link enviado e confirmarem as fotos favoritas, as escolhas e os prompts correspondentes aparecerão aqui instantaneamente.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('clients')}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-all shadow-xs"
            >
              <Users className="w-4 h-4" />
              Ver Clientes & Enviar Links
            </button>
            <button
              onClick={handleManualSync}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Verificar Agora
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {displayedClients.map((client) => {
            const allPhotos = modelPhotos.length > 0 ? modelPhotos : getModelPhotos();
            const chosenPhotos = allPhotos.filter((p) => client.chosenPhotoIds?.includes(p.id));

            return (
              <div
                key={client.id}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-2xs space-y-4 sm:space-y-5 p-3.5 sm:p-6"
              >
                {/* Client Header Info */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 pb-3.5 sm:pb-4 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
                        {client.name}
                      </h3>
                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                          client.status === 'Selecionado'
                            ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            : client.status === 'Em produção'
                            ? 'bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                            : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                        }`}
                      >
                        {client.status}
                      </span>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        {client.chosenPhotoIds?.length || 0} Fotos
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {client.contractedSession}
                      {client.selectionSubmittedAt && (
                        <span>
                          {' '}• Enviada em:{' '}
                          {new Date(client.selectionSubmittedAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Actions for this client */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleCopyAllClientPrompts(client)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Todos os Prompts</span>
                    </button>

                    {client.status === 'Selecionado' && (
                      <button
                        onClick={() => handleMarkInProduction(client)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 rounded-xl hover:bg-purple-100 transition-colors cursor-pointer shadow-2xs"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                        <span>Mover p/ Produção</span>
                      </button>
                    )}

                    <button
                      onClick={() => onNavigate('watermarked_photos')}
                      className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-xl transition-all shadow-xs cursor-pointer"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>5.1 Fotos com Marca D'água</span>
                    </button>

                    <button
                      onClick={() => onNavigate('final_delivery')}
                      className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-all shadow-xs cursor-pointer"
                    >
                      <PackageCheck className="w-3.5 h-3.5" />
                      <span>6. Entrega Final</span>
                    </button>
                  </div>
                </div>

                {/* Grid of chosen photos for this client */}
                {chosenPhotos.length === 0 ? (
                  <div className="p-6 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl text-center text-xs text-zinc-500">
                    Nenhuma foto correspondente encontrada para os IDs selecionados ({client.chosenPhotoIds?.join(', ')}).
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5 pt-2">
                    {chosenPhotos.map((photo, index) => (
                      <div
                        key={photo.id}
                        className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden flex flex-col justify-between shadow-2xs"
                      >
                        <div>
                          {/* Photo Image 3:4 Padrão Vertical */}
                          <div className="relative aspect-[3/4] bg-zinc-950 overflow-hidden">
                            <img
                              src={photo.imageUrl}
                              alt={photo.name}
                              className="w-full h-full object-cover object-top"
                              loading="lazy"
                            />
                            <div className="absolute top-2 left-2">
                              <span className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-600 text-white shadow-xs">
                                #{index + 1}
                              </span>
                            </div>
                          </div>

                          {/* Details */}
                          <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                            <div className="flex items-center justify-between gap-1">
                              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                                {photo.name}
                              </h4>
                              <button
                                type="button"
                                onClick={() => handleRemoveChosenPhoto(client, photo.id, photo.name)}
                                className="p-1 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors shrink-0 cursor-pointer"
                                title="Desvincular / Remover esta foto da seleção deste cliente"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="p-2 sm:p-2.5 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block mb-1">
                                Prompt IA
                              </span>
                              <p className="text-[11px] sm:text-xs text-zinc-700 dark:text-zinc-300 font-mono line-clamp-3 sm:line-clamp-4 leading-snug select-all">
                                {photo.prompt}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Bottom Buttons */}
                        <div className="p-3 sm:p-4 pt-0 space-y-2">
                          <button
                            onClick={() => handleCopyPrompt(photo.prompt, photo.name, client.name)}
                            className="w-full flex items-center justify-center gap-1.5 py-2 px-2.5 text-[11px] sm:text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-xl transition-all shadow-xs cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar Prompt</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

