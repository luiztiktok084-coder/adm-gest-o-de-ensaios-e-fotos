import React, { useState } from 'react';
import {
  Users,
  Clock,
  CheckCircle2,
  Image as ImageIcon,
  Send,
  UserPlus,
  FolderPlus,
  Upload,
  ArrowRight,
  Share2,
  ExternalLink,
  Copy,
  MessageCircle,
  Tag,
  Sparkles,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import { Client, Category, ModelPhoto } from '../../types';
import { NavView } from '../Sidebar';
import { useToast } from '../Toast';
import { PackageManagementModal } from '../modals/PackageManagementModal';
import { getAgencyPackages } from '../../utils/storage';

interface DashboardViewProps {
  clients: Client[];
  categories: Category[];
  modelPhotos: ModelPhoto[];
  onNavigate: (view: NavView, actionPayload?: string) => void;
  onOpenBackupModal?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  clients,
  categories,
  modelPhotos,
  onNavigate,
  onOpenBackupModal,
}) => {
  const { showToast } = useToast();
  const [selectedClientForLink, setSelectedClientForLink] = useState<Client | null>(null);
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const currentPackages = getAgencyPackages();

  // Metrics
  const totalClients = clients.length;
  const inProgressClients = clients.filter(
    (c) => c.status === 'Novo' || c.status === 'Aguardando seleção' || c.status === 'Selecionado' || c.status === 'Em produção'
  ).length;
  const finishedClients = clients.filter((c) => c.status === 'Entregue').length;
  const totalModelPhotos = modelPhotos.length;
  const awaitingSelectionClients = clients.filter((c) => c.status === 'Aguardando seleção');
  const awaitingSelectionCount = awaitingSelectionClients.length;

  const handleCopyLink = (token: string, clientName: string) => {
    const url = `${window.location.origin}${window.location.pathname}#/selecao/${token}`;
    navigator.clipboard.writeText(url);
    showToast(`Link de seleção de ${clientName} copiado!`, 'success');
  };

  const handleWhatsAppShare = (client: Client) => {
    const url = `${window.location.origin}${window.location.pathname}#/selecao/${client.token}`;
    const message = encodeURIComponent(
      `Olá ${client.name}! Tudo bem?\nAqui está o seu link exclusivo para escolher suas fotos favoritas do ${client.contractedSession}:\n\n${url}\n\nÉ só clicar, marcar suas escolhas e confirmar!`
    );
    const cleanPhone = client.whatsapp.replace(/\D/g, '');
    const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${message}` : `https://wa.me/?text=${message}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200 dark:border-amber-900/40 rounded-2xl">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Painel Geral de Ensaios Fotográficos
          </h1>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-0.5">
            Acompanhe o funil de seleção, geração de prompts e entrega final aos clientes.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onOpenBackupModal && (
            <button
              type="button"
              onClick={onOpenBackupModal}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl transition-all shadow-2xs cursor-pointer"
              title="Backup Preventivo & Exportação JSON (Clientes e Fotos Selecionadas)"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Backup JSON</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsPackageModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl transition-all shadow-2xs cursor-pointer"
            title="Editar nomes, valores e pacotes de fotos exibidos ao cliente"
          >
            <Tag className="w-4 h-4 text-amber-500" />
            <span>Editar Pacotes & Valores</span>
          </button>

          <button
            onClick={() => onNavigate('clients', 'new_client')}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Novo Cliente</span>
          </button>
        </div>
      </div>

      {/* 1. Métricas Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Metric 1: Total de Clientes */}
        <div className="p-3.5 sm:p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-1.5 sm:mb-2">
            <span className="text-xs font-medium truncate">Total Clientes</span>
            <Users className="w-4 h-4 text-zinc-400 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {totalClients}
          </div>
          <p className="text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 truncate">
            Cadastrados
          </p>
        </div>

        {/* Metric 2: Ensaios em Andamento */}
        <div className="p-3.5 sm:p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-1.5 sm:mb-2">
            <span className="text-xs font-medium truncate">Em Andamento</span>
            <Clock className="w-4 h-4 text-amber-500 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400">
            {inProgressClients}
          </div>
          <p className="text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 truncate">
            Em produção / novo
          </p>
        </div>

        {/* Metric 3: Ensaios Finalizados */}
        <div className="p-3.5 sm:p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-1.5 sm:mb-2">
            <span className="text-xs font-medium truncate">Finalizados</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {finishedClients}
          </div>
          <p className="text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 truncate">
            Entregues (.ZIP)
          </p>
        </div>

        {/* Metric 4: Fotos na Galeria */}
        <div className="p-3.5 sm:p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-1.5 sm:mb-2">
            <span className="text-xs font-medium truncate">Fotos Galeria</span>
            <ImageIcon className="w-4 h-4 text-sky-500 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-sky-600 dark:text-sky-400">
            {totalModelPhotos}
          </div>
          <p className="text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 truncate">
            Modelos & prompts
          </p>
        </div>

        {/* Metric 5: Links Aguardando Resposta */}
        <div className="col-span-2 sm:col-span-1 p-3.5 sm:p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-1.5 sm:mb-2">
            <span className="text-xs font-medium truncate">Aguardando Seleção</span>
            <Send className="w-4 h-4 text-purple-500 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
            {awaitingSelectionCount}
          </div>
          <p className="text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 truncate">
            Links ativos enviados
          </p>
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
          Ações Rápidas
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => onNavigate('clients', 'new_client')}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-amber-400 dark:hover:border-amber-600 bg-zinc-50/70 dark:bg-zinc-800/40 hover:bg-amber-50/30 dark:hover:bg-amber-950/20 text-center transition-all group"
          >
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <UserPlus className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              Novo Cliente
            </span>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
              Cadastrar e montar ensaio
            </span>
          </button>

          <button
            onClick={() => onNavigate('categories', 'new_category')}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-amber-400 dark:hover:border-amber-600 bg-zinc-50/70 dark:bg-zinc-800/40 hover:bg-amber-50/30 dark:hover:bg-amber-950/20 text-center transition-all group"
          >
            <div className="w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <FolderPlus className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              Nova Categoria
            </span>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
              Criar estilo de ensaio
            </span>
          </button>

          <button
            onClick={() => onNavigate('upload_models')}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-amber-400 dark:hover:border-amber-600 bg-zinc-50/70 dark:bg-zinc-800/40 hover:bg-amber-50/30 dark:hover:bg-amber-950/20 text-center transition-all group"
          >
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Upload className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              Upload de Fotos
            </span>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
              Adicionar modelos & prompts
            </span>
          </button>

          <button
            onClick={() => {
              if (awaitingSelectionClients.length > 0) {
                setSelectedClientForLink(awaitingSelectionClients[0]);
              } else if (clients.length > 0) {
                setSelectedClientForLink(clients[0]);
              } else {
                showToast('Cadastre um cliente primeiro para enviar link.', 'info');
              }
            }}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-amber-400 dark:hover:border-amber-600 bg-zinc-50/70 dark:bg-zinc-800/40 hover:bg-amber-50/30 dark:hover:bg-amber-950/20 text-center transition-all group"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Share2 className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              Enviar Link ao Cliente
            </span>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
              Compartilhar via WhatsApp
            </span>
          </button>
        </div>
      </div>

      {/* Clientes Aguardando Resposta ou Selecionados Recentemente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Box 1: Aguardando seleção */}
        <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Links Aguardando Resposta ({awaitingSelectionCount})
              </h3>
            </div>
            <button
              onClick={() => onNavigate('clients')}
              className="text-xs text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-medium"
            >
              Ver todos <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {awaitingSelectionClients.length === 0 ? (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 py-6 text-center">
              Nenhum cliente com seleção pendente no momento.
            </p>
          ) : (
            <div className="space-y-2">
              {awaitingSelectionClients.slice(0, 4).map((client) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-800"
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                      {client.name}
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                      {client.contractedSession} • {client.modelPhotoIds.length} fotos enviadas
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleCopyLink(client.token, client.name)}
                      className="p-1.5 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs"
                      title="Copiar Link Público"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleWhatsAppShare(client)}
                      className="p-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 rounded-lg text-xs hover:bg-emerald-100 transition-colors"
                      title="Enviar via WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Box 2: Seleções Feitas / Prontas para Produção */}
        <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Seleções Feitas pelos Clientes
              </h3>
            </div>
            <button
              onClick={() => onNavigate('chosen_photos')}
              className="text-xs text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-medium"
            >
              Ver fotos escolhidas <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {clients.filter((c) => c.status === 'Selecionado' || c.status === 'Em produção').length === 0 ? (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 py-6 text-center">
              Nenhuma nova seleção recebida recentemente.
            </p>
          ) : (
            <div className="space-y-2">
              {clients
                .filter((c) => c.status === 'Selecionado' || c.status === 'Em produção')
                .slice(0, 4)
                .map((client) => (
                  <div
                    key={client.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-800"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {client.name}
                      </p>
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium truncate">
                        ✓ {client.chosenPhotoIds.length} fotos marcadas para gerar
                      </p>
                    </div>
                    <button
                      onClick={() => onNavigate('chosen_photos')}
                      className="px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-lg hover:bg-amber-100 transition-colors"
                    >
                      Copiar Prompts
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* 4. Pacotes e Valores dos Ensaios (Visão Rápida) */}
      <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Pacotes & Valores Configurados para Clientes
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Exibidos no topo da página de seleção do cliente
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsPackageModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-850 rounded-xl transition-colors cursor-pointer w-fit"
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Editar Nomes e Valores</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {currentPackages.map((pkg) => (
            <div
              key={pkg.id}
              className={`p-4 rounded-xl border transition-all ${
                pkg.isPopular
                  ? 'bg-amber-500/5 border-amber-400/60 dark:border-amber-600/50 shadow-2xs'
                  : 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-800'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                  {pkg.name}
                </span>
                {pkg.badge && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 shrink-0">
                    {pkg.badge}
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-extrabold text-amber-600 dark:text-amber-400">
                  {pkg.price}
                </span>
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  ({pkg.photoCount} fotos)
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1">
                {pkg.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Package Management Modal */}
      <PackageManagementModal
        isOpen={isPackageModalOpen}
        onClose={() => setIsPackageModalOpen(false)}
      />

      {/* Quick Link Share Modal */}
      {selectedClientForLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Enviar Link de Seleção
              </h3>
              <button
                onClick={() => setSelectedClientForLink(null)}
                className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1"
              >
                Fechar
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Cliente selecionado:
              </label>
              <select
                value={selectedClientForLink.id}
                onChange={(e) => {
                  const c = clients.find((cli) => cli.id === e.target.value);
                  if (c) setSelectedClientForLink(c);
                }}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.contractedSession})
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl space-y-2">
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block font-mono break-all">
                {`${window.location.origin}${window.location.pathname}#/selecao/${selectedClientForLink.token}`}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleCopyLink(selectedClientForLink.token, selectedClientForLink.name);
                    setSelectedClientForLink(null);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded-lg hover:bg-zinc-50"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copiar Link
                </button>
                <button
                  onClick={() => {
                    handleWhatsAppShare(selectedClientForLink);
                    setSelectedClientForLink(null);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Abrir WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
