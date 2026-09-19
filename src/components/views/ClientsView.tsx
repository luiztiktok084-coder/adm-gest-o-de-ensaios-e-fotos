import React, { useState } from 'react';
import {
  UserPlus,
  Users,
  Search,
  MessageCircle,
  Copy,
  ExternalLink,
  Trash2,
  Pencil,
  Check,
  Sparkles,
  ChevronRight,
  Filter,
  CheckSquare,
  Square,
  Package,
  X,
  Link2,
  Eye,
  Download,
  Image as ImageIcon,
  Layers,
  Star,
  Globe,
  Mail,
  Phone,
  Tag,
  Camera,
  ShieldCheck,
} from 'lucide-react';
import { Client, ClientStatus, Category, ModelPhoto } from '../../types';
import { saveClients, deleteClient, generateUniqueToken, syncDataFromServer } from '../../utils/storage';
import { useToast } from '../Toast';
import { NavView } from '../Sidebar';
import { ConfirmModal } from '../ConfirmModal';

interface ClientsViewProps {
  clients: Client[];
  categories: Category[];
  modelPhotos: ModelPhoto[];
  onNavigate: (view: NavView) => void;
  initialOpenCreateModal?: boolean;
  onOpenBackupModal?: () => void;
}

const STATUS_BADGE_STYLES: Record<ClientStatus, { bg: string; text: string; border: string }> = {
  Novo: {
    bg: 'bg-zinc-100 dark:bg-zinc-800',
    text: 'text-zinc-700 dark:text-zinc-300',
    border: 'border-zinc-300 dark:border-zinc-700',
  },
  'Aguardando seleção': {
    bg: 'bg-amber-50 dark:bg-amber-950/60',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
  },
  Selecionado: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/60',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  'Em produção': {
    bg: 'bg-purple-50 dark:bg-purple-950/60',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800',
  },
  Entregue: {
    bg: 'bg-sky-50 dark:bg-sky-950/60',
    text: 'text-sky-700 dark:text-sky-300',
    border: 'border-sky-200 dark:border-sky-800',
  },
};

const ALL_STATUSES: ClientStatus[] = [
  'Novo',
  'Aguardando seleção',
  'Selecionado',
  'Em produção',
  'Entregue',
];

export const ClientsView: React.FC<ClientsViewProps> = ({
  clients,
  categories,
  modelPhotos,
  onNavigate,
  initialOpenCreateModal = false,
  onOpenBackupModal,
}) => {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [categoryFilterTab, setCategoryFilterTab] = useState<string>('todos');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(initialOpenCreateModal);

  // Form state: Create Client
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [contractedSession, setContractedSession] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(categories[0]?.id || '');
  const [selectedModelPhotoIds, setSelectedModelPhotoIds] = useState<string[]>([]);
  const [status, setStatus] = useState<ClientStatus>('Aguardando seleção');

  // Form state: Edit Client
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editName, setEditName] = useState('');
  const [editWhatsapp, setEditWhatsapp] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editContractedSession, setEditContractedSession] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editModelPhotoIds, setEditModelPhotoIds] = useState<string[]>([]);
  const [editStatus, setEditStatus] = useState<ClientStatus>('Aguardando seleção');
  const [editToken, setEditToken] = useState('');

  // Details Modal for viewing reference photo & submission data
  const [clientToViewDetails, setClientToViewDetails] = useState<Client | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Delete modal state
  const [clientToDelete, setClientToDelete] = useState<{ id: string; name: string } | null>(null);

  const isOutroClient = (client: Client) =>
    client.contractedSession.toLowerCase().includes('outro') ||
    client.name.toLowerCase().includes('outro') ||
    client.source === 'public_models_showcase' ||
    !!client.referencePhotoUrl;

  const outroClientsCount = clients.filter(isOutroClient).length;

  // Filtered clients
  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.whatsapp.includes(searchTerm) ||
      client.contractedSession.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'todos' || client.status === statusFilter;

    let matchesCategoryTab = true;
    if (categoryFilterTab === 'outro') {
      matchesCategoryTab = isOutroClient(client);
    } else if (categoryFilterTab !== 'todos') {
      matchesCategoryTab = client.categoryId === categoryFilterTab;
    }

    return matchesSearch && matchesStatus && matchesCategoryTab;
  });

  const getSelectionUrl = (token: string) => {
    const baseUrl = window.location.origin + window.location.pathname.replace(/\/$/, '');
    return `${baseUrl}#/selecao/${token}`;
  };

  const getDeliveryUrl = (token: string) => {
    const baseUrl = window.location.origin + window.location.pathname.replace(/\/$/, '');
    return `${baseUrl}#/entrega/${token}`;
  };

  const handleCopyLink = (token: string, clientName: string) => {
    const url = getSelectionUrl(token);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        showToast(`Link de seleção de ${clientName} copiado!`, 'success');
      }).catch(() => {
        fallbackCopyText(url, clientName);
      });
    } else {
      fallbackCopyText(url, clientName);
    }
  };

  const fallbackCopyText = (text: string, clientName: string) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      showToast(`Link de seleção de ${clientName} copiado!`, 'success');
    } catch {
      showToast('Não foi possível copiar automaticamente. Copie o link manualmente.', 'error');
    }
    document.body.removeChild(textArea);
  };

  const handleOpenSelection = (token: string) => {
    const url = getSelectionUrl(token);
    window.open(url, '_blank');
  };

  const handleWhatsApp = (client: Client) => {
    const url = getSelectionUrl(client.token);
    const message = encodeURIComponent(
      `Olá ${client.name}! Tudo bem?\nAqui está o seu link exclusivo para escolher suas fotos favoritas do ${client.contractedSession}:\n\n${url}\n\nÉ só clicar, selecionar as fotos que mais gostar e confirmar!`
    );
    const cleanPhone = client.whatsapp.replace(/\D/g, '');
    const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${message}` : `https://wa.me/?text=${message}`;
    window.open(waUrl, '_blank');
  };

  const handleStatusChange = (client: Client, newStatus: ClientStatus) => {
    const updated = clients.map((c) => (c.id === client.id ? { ...c, status: newStatus } : c));
    saveClients(updated);
    showToast(`Status de ${client.name} atualizado para "${newStatus}".`, 'success');
  };

  const confirmDeleteClient = () => {
    if (!clientToDelete) return;
    deleteClient(clientToDelete.id);
    showToast(`Cliente ${clientToDelete.name} excluído com sucesso.`, 'info');
    setClientToDelete(null);
  };

  // Photo selection helpers for create
  const togglePhotoSelection = (photoId: string) => {
    setSelectedModelPhotoIds((prev) =>
      prev.includes(photoId) ? prev.filter((id) => id !== photoId) : [...prev, photoId]
    );
  };

  const selectAllPhotosInCategory = (catId: string) => {
    const photosInCat = modelPhotos.filter((p) => p.categoryId === catId).map((p) => p.id);
    setSelectedModelPhotoIds((prev) => Array.from(new Set([...prev, ...photosInCat])));
  };

  // Photo selection helpers for edit
  const toggleEditPhotoSelection = (photoId: string) => {
    setEditModelPhotoIds((prev) =>
      prev.includes(photoId) ? prev.filter((id) => id !== photoId) : [...prev, photoId]
    );
  };

  const selectAllEditPhotosInCategory = (catId: string) => {
    const photosInCat = modelPhotos.filter((p) => p.categoryId === catId).map((p) => p.id);
    setEditModelPhotoIds((prev) => Array.from(new Set([...prev, ...photosInCat])));
  };

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Por favor, informe o nome do cliente.', 'error');
      return;
    }
    if (!contractedSession.trim()) {
      showToast('Por favor, informe o ensaio contratado.', 'error');
      return;
    }
    if (selectedModelPhotoIds.length === 0) {
      showToast('Selecione ao menos 1 foto modelo da galeria para o cliente escolher.', 'error');
      return;
    }

    const token = generateUniqueToken(`tok-${name.toLowerCase().replace(/[^a-z0-9]/g, '')}`);
    const newClient: Client = {
      id: generateUniqueToken('cli'),
      name: name.trim(),
      whatsapp: whatsapp.trim(),
      email: email.trim() || undefined,
      contractedSession: contractedSession.trim(),
      categoryId: selectedCategoryId,
      modelPhotoIds: selectedModelPhotoIds,
      chosenPhotoIds: [],
      finalPhotos: [],
      status: status,
      token: token,
      createdAt: new Date().toISOString(),
    };

    const updated = [newClient, ...clients];
    saveClients(updated);

    showToast(`Cliente "${newClient.name}" cadastrado e link de seleção gerado!`, 'success');

    // Reset form
    setName('');
    setWhatsapp('');
    setEmail('');
    setContractedSession('');
    setSelectedModelPhotoIds([]);
    setStatus('Aguardando seleção');
    setIsCreateModalOpen(false);
  };

  // Open Edit Modal
  const openEditClientModal = (client: Client) => {
    setEditingClient(client);
    setEditName(client.name);
    setEditWhatsapp(client.whatsapp || '');
    setEditEmail(client.email || '');
    setEditContractedSession(client.contractedSession);
    setEditCategoryId(client.categoryId || categories[0]?.id || '');
    setEditModelPhotoIds(client.modelPhotoIds || []);
    setEditStatus(client.status);
    setEditToken(client.token);
  };

  const handleSaveEditedClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;

    if (!editName.trim()) {
      showToast('O nome do cliente é obrigatório.', 'error');
      return;
    }
    if (!editContractedSession.trim()) {
      showToast('O nome do ensaio contratado é obrigatório.', 'error');
      return;
    }
    if (editModelPhotoIds.length === 0) {
      showToast('Selecione ao menos 1 foto modelo para o ensaio.', 'error');
      return;
    }

    const updatedClient: Client = {
      ...editingClient,
      name: editName.trim(),
      whatsapp: editWhatsapp.trim(),
      email: editEmail.trim() || undefined,
      contractedSession: editContractedSession.trim(),
      categoryId: editCategoryId,
      modelPhotoIds: editModelPhotoIds,
      status: editStatus,
      token: editToken.trim() || editingClient.token,
    };

    const updatedList = clients.map((c) => (c.id === editingClient.id ? updatedClient : c));
    saveClients(updatedList);

    showToast(`Dados de "${updatedClient.name}" e ensaio atualizados com sucesso!`, 'success');
    setEditingClient(null);
  };

  const handleRemoveChosenPhotoFromClient = (clientId: string, photoId: string) => {
    const updatedList = clients.map((c) => {
      if (c.id === clientId) {
        const nextChosen = (c.chosenPhotoIds || []).filter((id) => id !== photoId);
        const nextStatus =
          nextChosen.length === 0 && c.status === 'Selecionado'
            ? ('Aguardando seleção' as ClientStatus)
            : c.status;
        return {
          ...c,
          chosenPhotoIds: nextChosen,
          status: nextStatus,
        };
      }
      return c;
    });

    saveClients(updatedList);
    syncDataFromServer();

    if (clientToViewDetails && clientToViewDetails.id === clientId) {
      const refreshed = updatedList.find((c) => c.id === clientId);
      if (refreshed) setClientToViewDetails(refreshed);
    }

    showToast('Foto removida da seleção do cliente com sucesso!', 'success');
  };

  const handleClearAllChosenPhotos = (clientId: string) => {
    const updatedList = clients.map((c) => {
      if (c.id === clientId) {
        return {
          ...c,
          chosenPhotoIds: [],
          status: c.status === 'Selecionado' ? ('Aguardando seleção' as ClientStatus) : c.status,
        };
      }
      return c;
    });

    saveClients(updatedList);
    syncDataFromServer();

    if (clientToViewDetails && clientToViewDetails.id === clientId) {
      const refreshed = updatedList.find((c) => c.id === clientId);
      if (refreshed) setClientToViewDetails(refreshed);
    }

    showToast('Todas as escolhas de fotos foram desvinculadas!', 'success');
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Gestão de Clientes & Ensaios
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Cadastre e edite clientes, configure ensaios fotográficos e envie links de seleção.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onOpenBackupModal && (
            <button
              type="button"
              onClick={onOpenBackupModal}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl transition-all shadow-2xs cursor-pointer"
              title="Exportar dados de clientes e fotos selecionadas para arquivo JSON"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Backup / Exportar JSON</span>
            </button>
          )}

          <button
            onClick={() => {
              if (categories[0]) {
                setSelectedCategoryId(categories[0].id);
                const photosInCat = modelPhotos.filter((p) => p.categoryId === categories[0].id).map((p) => p.id);
                setSelectedModelPhotoIds(photosInCat);
              }
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-xl transition-all shadow-xs w-fit cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Cadastrar Novo Cliente</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xs">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, WhatsApp, e-mail ou ensaio..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-zinc-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-800 dark:text-zinc-200 focus:outline-hidden font-medium"
            >
              <option value="todos">Todos os Status ({clients.length})</option>
              {ALL_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st} ({clients.filter((c) => c.status === st).length})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category & "Outro" Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setCategoryFilterTab('todos')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              categoryFilterTab === 'todos'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                : 'bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Todos os Clientes ({clients.length})</span>
          </button>

          {/* Highlighted "Outro / Modelos Solicitados" Tab */}
          <button
            type="button"
            onClick={() => setCategoryFilterTab('outro')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              categoryFilterTab === 'outro'
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20 ring-2 ring-amber-400/40'
                : 'bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60'
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
            <span>Outro / Modelos Solicitados</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                categoryFilterTab === 'outro'
                  ? 'bg-zinc-950 text-amber-400'
                  : 'bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100'
              }`}
            >
              {outroClientsCount}
            </span>
          </button>

          {/* Category Tabs */}
          {categories.map((cat) => {
            const count = clients.filter((c) => c.categoryId === cat.id && !isOutroClient(c)).length;
            const isSelected = categoryFilterTab === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilterTab(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                    : 'bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800'
                }`}
              >
                <span>{cat.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected
                      ? 'bg-zinc-700 text-white dark:bg-zinc-300 dark:text-zinc-900'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Clients Table / List */}
      {filteredClients.length === 0 ? (
        <div className="text-center py-14 px-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-200">
            Nenhum cliente encontrado
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            {searchTerm || statusFilter !== 'todos' || categoryFilterTab !== 'todos'
              ? 'Tente ajustar os filtros ou termos da sua busca.'
              : 'Cadastre seu primeiro cliente para gerar links de seleção e acompanhar o ensaio.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredClients.map((client) => {
            const badge = STATUS_BADGE_STYLES[client.status];
            const category = categories.find((c) => c.id === client.categoryId);
            const isOutro = isOutroClient(client);

            return (
              <div
                key={client.id}
                className={`p-5 sm:p-6 bg-white dark:bg-zinc-900 border rounded-2xl shadow-2xs transition-all flex flex-col gap-4.5 ${
                  isOutro
                    ? 'border-amber-300 dark:border-amber-800/80 bg-gradient-to-r from-amber-50/20 via-transparent to-transparent'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-amber-500/40'
                }`}
              >
                {/* 1. Linha Superior: Identificação do Cliente, Status e Seletor Rápido */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-zinc-100 dark:border-zinc-800/80">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold text-sm shrink-0">
                      {client.name.substring(0, 2).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setClientToViewDetails(client)}
                          className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 hover:text-amber-600 dark:hover:text-amber-400 transition-colors text-left cursor-pointer truncate"
                          title="Clique para ver ficha completa e detalhes"
                        >
                          {client.name}
                        </button>
                        <span
                          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          {client.status}
                        </span>
                        {isOutro && (
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                            <span>Ensaio: Outro</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Código do link: <span className="font-mono text-[11px] text-zinc-600 dark:text-zinc-300">{client.token.substring(0, 18)}...</span>
                      </p>
                    </div>
                  </div>

                  {/* Seletor rápido de status */}
                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 bg-zinc-50 dark:bg-zinc-800/60 p-1.5 rounded-xl border border-zinc-200/80 dark:border-zinc-700/80">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium pl-1.5">Status:</span>
                    <select
                      value={client.status}
                      onChange={(e) => handleStatusChange(client, e.target.value as ClientStatus)}
                      className="px-2.5 py-1 text-xs font-semibold bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200 focus:outline-hidden cursor-pointer"
                    >
                      {ALL_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 2. Linhas de Informações Estruturadas em Blocos Claros */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
                  {/* Linha 1: Ensaio e Categoria */}
                  <div className="p-3.5 rounded-xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-200/70 dark:border-zinc-800/80 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 font-medium">
                      <Camera className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="text-[11px] uppercase tracking-wider font-semibold">Sessão Contratada</span>
                    </div>
                    <p className="font-bold text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm leading-snug">
                      {client.contractedSession}
                    </p>
                    <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400 text-xs pt-0.5">
                      <Tag className="w-3 h-3 text-zinc-400 shrink-0" />
                      <span>Categoria: <strong className="text-zinc-800 dark:text-zinc-200">{category?.name || 'Geral / Outro'}</strong></span>
                    </div>
                  </div>

                  {/* Linha 2: Contatos do Cliente */}
                  <div className="p-3.5 rounded-xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-200/70 dark:border-zinc-800/80 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 font-medium">
                      <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="text-[11px] uppercase tracking-wider font-semibold">Canais de Contato</span>
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm">
                        {client.whatsapp ? (
                          <span>WhatsApp: {client.whatsapp}</span>
                        ) : (
                          <span className="text-zinc-400 font-normal">WhatsApp não informado</span>
                        )}
                      </p>
                      <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400 text-xs truncate">
                        <Mail className="w-3 h-3 text-zinc-400 shrink-0" />
                        <span className="truncate">{client.email || 'E-mail não cadastrado'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Linha 3: Métricas de Fotos & Progresso */}
                  <div className="p-3.5 rounded-xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-200/70 dark:border-zinc-800/80 space-y-2">
                    <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 font-medium">
                      <ImageIcon className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                      <span className="text-[11px] uppercase tracking-wider font-semibold">Progresso das Fotos</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                        📸 {client.modelPhotoIds.length} fotos para seleção
                      </span>
                      <span className="bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-md font-semibold text-[11px] border border-amber-200 dark:border-amber-800">
                        ✓ {client.chosenPhotoIds.length} escolhidas
                      </span>
                      {client.finalPhotos && client.finalPhotos.length > 0 && (
                        <span className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 font-semibold text-[11px]">
                          📦 {client.finalPhotos.length} prontas
                        </span>
                      )}
                      {client.referencePhotoUrl && (
                        <button
                          type="button"
                          onClick={() => setClientToViewDetails(client)}
                          className="flex items-center gap-1 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-800 font-semibold text-[11px] hover:bg-purple-100 transition-colors cursor-pointer"
                          title="Ver foto de referência anexada"
                        >
                          <img src={client.referencePhotoUrl} alt="Ref" className="w-3.5 h-3.5 rounded-full object-cover" />
                          <span>Foto Ref.</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Barra de Ações Inferior Organizada e Alinhada */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3.5 border-t border-zinc-100 dark:border-zinc-800/80">
                  {/* Grupo 1: Compartilhamento com o Cliente */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleWhatsApp(client)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl transition-all shadow-2xs cursor-pointer"
                      title="Enviar link de seleção para o WhatsApp do cliente"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Enviar WhatsApp</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyLink(client.token, client.name)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 rounded-xl transition-all shadow-2xs cursor-pointer"
                      title="Copiar link da página de seleção do cliente"
                    >
                      <Copy className="w-3.5 h-3.5 text-amber-500" />
                      <span>Copiar Link</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenSelection(client.token)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-xl transition-all cursor-pointer"
                      title="Abrir página de seleção em nova aba"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                      <span>Abrir Link</span>
                    </button>
                  </div>

                  {/* Grupo 2: Gestão Interna, Visualização e Exclusão */}
                  <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
                    {((client.chosenPhotoIds && client.chosenPhotoIds.length > 0) || client.status === 'Selecionado') && (
                      <button
                        type="button"
                        onClick={() => onNavigate('chosen_photos')}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-200 bg-emerald-100 dark:bg-emerald-950/80 hover:bg-emerald-200 dark:hover:bg-emerald-900 border border-emerald-300 dark:border-emerald-700 rounded-xl transition-all shadow-2xs cursor-pointer"
                        title="Ver fotos selecionadas e copiar prompts de IA"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Ver Escolhas ({client.chosenPhotoIds?.length || 0})</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setClientToViewDetails(client)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 rounded-xl transition-colors shadow-2xs cursor-pointer"
                      title="Ver dados cadastrais completos e detalhes do cliente"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-500" />
                      <span>Ver Dados</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openEditClientModal(client)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800/80 rounded-xl transition-colors shadow-2xs cursor-pointer"
                      title="Editar dados cadastrais e fotos vinculadas"
                    >
                      <Pencil className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>Editar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setClientToDelete({ id: client.id, name: client.name })}
                      className="p-1.5 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                      title="Excluir cliente permanentemente"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Cadastro de Novo Cliente */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-8 animate-in fade-in duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-600" />
                Cadastrar Novo Cliente & Gerar Link de Seleção
              </h2>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                    Nome Completo do Cliente *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Beatriz Lima"
                    className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                    WhatsApp (com DDD)
                  </label>
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="Ex: 5511999998888"
                    className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ex: cliente@email.com"
                  className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                    Ensaio Contratado / Pacote *
                  </label>
                  <input
                    type="text"
                    required
                    value={contractedSession}
                    onChange={(e) => setContractedSession(e.target.value)}
                    placeholder="Ex: Ensaio Gestante Luxo (15 fotos)"
                    className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                    Categoria Principal
                  </label>
                  <select
                    value={selectedCategoryId}
                    onChange={(e) => {
                      setSelectedCategoryId(e.target.value);
                      const photosInCat = modelPhotos
                        .filter((p) => p.categoryId === e.target.value)
                        .map((p) => p.id);
                      setSelectedModelPhotoIds(photosInCat);
                    }}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Photos from gallery selector */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                    Fotos Modelo da Galeria para o Cliente ({selectedModelPhotoIds.length} selecionadas)
                  </label>
                  {selectedCategoryId && (
                    <button
                      type="button"
                      onClick={() => selectAllPhotosInCategory(selectedCategoryId)}
                      className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-medium cursor-pointer"
                    >
                      Selecionar todas da categoria
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-56 overflow-y-auto p-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950/50">
                  {modelPhotos.map((photo) => {
                    const isChecked = selectedModelPhotoIds.includes(photo.id);
                    return (
                      <div
                        key={photo.id}
                        onClick={() => togglePhotoSelection(photo.id)}
                        className={`relative cursor-pointer rounded-lg overflow-hidden border transition-all ${
                          isChecked
                            ? 'border-amber-500 ring-2 ring-amber-500/40'
                            : 'border-zinc-200 dark:border-zinc-800 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={photo.imageUrl}
                          alt={photo.name}
                          className="w-full h-24 object-cover"
                        />
                        <div className="absolute top-1.5 left-1.5">
                          {isChecked ? (
                            <CheckSquare className="w-5 h-5 text-amber-500 bg-white rounded-xs shadow-xs" />
                          ) : (
                            <Square className="w-5 h-5 text-white/80 bg-black/40 rounded-xs" />
                          )}
                        </div>
                        <div className="p-1.5 bg-white dark:bg-zinc-900 text-[10px] font-medium text-zinc-800 dark:text-zinc-200 truncate">
                          {photo.name}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Criar Cliente & Gerar Link</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Cliente & Ensaio (Pencil Edit Modal) */}
      {editingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Pencil className="w-4 h-4 text-amber-600" />
                Editar Dados do Cliente & Ensaio ({editingClient.name})
              </h2>
              <button
                type="button"
                onClick={() => setEditingClient(null)}
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedClient} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                    Nome do Cliente *
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Nome do cliente"
                    className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                    WhatsApp (com DDD)
                  </label>
                  <input
                    type="text"
                    value={editWhatsapp}
                    onChange={(e) => setEditWhatsapp(e.target.value)}
                    placeholder="Ex: 5511999998888"
                    className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="Ex: cliente@email.com"
                  className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                    Ensaio Contratado / Pacote *
                  </label>
                  <input
                    type="text"
                    required
                    value={editContractedSession}
                    onChange={(e) => setEditContractedSession(e.target.value)}
                    placeholder="Ex: Ensaio Gestante Luxo (15 fotos)"
                    className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                    Status do Ensaio
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as ClientStatus)}
                    className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
                  >
                    {ALL_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                    Categoria do Ensaio
                  </label>
                  <select
                    value={editCategoryId}
                    onChange={(e) => setEditCategoryId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                    Código / Token do Link
                  </label>
                  <input
                    type="text"
                    required
                    value={editToken}
                    onChange={(e) => setEditToken(e.target.value)}
                    placeholder="token-do-cliente"
                    className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 font-mono"
                  />
                </div>
              </div>

              {/* Photos from gallery selector for edit */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                    Fotos Modelo Disponibilizadas para o Cliente ({editModelPhotoIds.length} selecionadas)
                  </label>
                  {editCategoryId && (
                    <button
                      type="button"
                      onClick={() => selectAllEditPhotosInCategory(editCategoryId)}
                      className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-medium cursor-pointer"
                    >
                      Selecionar todas da categoria
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-56 overflow-y-auto p-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950/50">
                  {modelPhotos.map((photo) => {
                    const isChecked = editModelPhotoIds.includes(photo.id);
                    return (
                      <div
                        key={photo.id}
                        onClick={() => toggleEditPhotoSelection(photo.id)}
                        className={`relative cursor-pointer rounded-lg overflow-hidden border transition-all ${
                          isChecked
                            ? 'border-amber-500 ring-2 ring-amber-500/40'
                            : 'border-zinc-200 dark:border-zinc-800 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={photo.imageUrl}
                          alt={photo.name}
                          className="w-full h-24 object-cover"
                        />
                        <div className="absolute top-1.5 left-1.5">
                          {isChecked ? (
                            <CheckSquare className="w-5 h-5 text-amber-500 bg-white rounded-xs shadow-xs" />
                          ) : (
                            <Square className="w-5 h-5 text-white/80 bg-black/40 rounded-xs" />
                          )}
                        </div>
                        <div className="p-1.5 bg-white dark:bg-zinc-900 text-[10px] font-medium text-zinc-800 dark:text-zinc-200 truncate">
                          {photo.name}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingClient(null)}
                  className="px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Ver Detalhes do Cliente, Foto de Referência & Prompts */}
      {clientToViewDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-gradient-to-r from-amber-500/10 via-zinc-50 dark:via-zinc-800/40 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black text-lg">
                  {clientToViewDetails.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
                      {clientToViewDetails.name}
                    </h2>
                    {isOutroClient(clientToViewDetails) && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-400/40">
                        🌟 Ensaio Outro
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Cadastrado em {new Date(clientToViewDetails.createdAt).toLocaleDateString('pt-BR')} • {clientToViewDetails.contractedSession}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setClientToViewDetails(null)}
                className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/60">
                {/* WhatsApp */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">WhatsApp</span>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                      {clientToViewDetails.whatsapp || 'Não informado'}
                    </span>
                  </div>
                  {clientToViewDetails.whatsapp && (
                    <button
                      type="button"
                      onClick={() => handleWhatsApp(clientToViewDetails)}
                      className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 mt-1 cursor-pointer"
                    >
                      <MessageCircle className="w-3 h-3" />
                      <span>Abrir conversa no WhatsApp</span>
                    </button>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">E-mail</span>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                      {clientToViewDetails.email || 'Não informado'}
                    </span>
                  </div>
                </div>

                {/* Status Selector */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Status Atual</span>
                  <select
                    value={clientToViewDetails.status}
                    onChange={(e) => {
                      const newSt = e.target.value as ClientStatus;
                      handleStatusChange(clientToViewDetails, newSt);
                      setClientToViewDetails({ ...clientToViewDetails, status: newSt });
                    }}
                    className="w-full px-2.5 py-1 text-xs font-bold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-800 dark:text-zinc-200 focus:outline-hidden"
                  >
                    {ALL_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Foto de Referência enviada pelo cliente */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-purple-500" />
                    <span>Foto de Referência enviada pelo Cliente</span>
                  </h3>
                  {clientToViewDetails.referencePhotoUrl && (
                    <span className="text-[11px] font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-800">
                      Rosto / Base para IA
                    </span>
                  )}
                </div>

                {clientToViewDetails.referencePhotoUrl ? (
                  <div className="p-4 bg-purple-50/40 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/60 rounded-2xl flex flex-col sm:flex-row items-center gap-4">
                    <div
                      onClick={() => setLightboxImage(clientToViewDetails.referencePhotoUrl || null)}
                      className="relative group w-28 sm:w-32 aspect-[3/4] shrink-0 rounded-2xl overflow-hidden border-2 border-purple-300 dark:border-purple-700 shadow-md cursor-pointer bg-zinc-950"
                    >
                      <img
                        src={clientToViewDetails.referencePhotoUrl}
                        alt={`Referência de ${clientToViewDetails.name}`}
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                        <Eye className="w-4 h-4" />
                        <span>Ampliar</span>
                      </div>
                    </div>

                    <div className="space-y-2 flex-1 text-left">
                      <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                        Foto enviada pelo cliente no momento da solicitação.
                      </p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                        Use esta imagem de referência no seu gerador de imagem (Nano Banana, Midjourney, Stable Diffusion ou Face Swap) para manter a fidelidade e traços do cliente nos modelos fotográficos escolhidos.
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <a
                          href={clientToViewDetails.referencePhotoUrl}
                          download={`referencia_${clientToViewDetails.name.toLowerCase().replace(/\s+/g, '_')}.jpg`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-all shadow-xs"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Baixar Imagem de Referência</span>
                        </a>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-center text-xs text-zinc-500">
                    Nenhuma foto de referência anexada para este cliente.
                  </div>
                )}
              </div>

              {/* Fotos Modelo Escolhidas & Prompts */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Fotos Modelo Escolhidas ({clientToViewDetails.chosenPhotoIds.length})</span>
                  </h3>
                  {clientToViewDetails.chosenPhotoIds.length > 0 && (
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleClearAllChosenPhotos(clientToViewDetails.id)}
                        className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                        title="Desvincular todas as fotos selecionadas deste cliente"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Desvincular Todas</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setClientToViewDetails(null);
                          onNavigate('chosen_photos');
                        }}
                        className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>Ir para aba Fotos Escolhidas</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {clientToViewDetails.chosenPhotoIds.length === 0 ? (
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-center text-xs text-zinc-500">
                    O cliente ainda não confirmou a escolha das fotos ou não há fotos selecionadas.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {clientToViewDetails.chosenPhotoIds.map((photoId) => {
                      const photo = modelPhotos.find((p) => p.id === photoId);
                      if (!photo) return null;
                      const cat = categories.find((c) => c.id === photo.categoryId);

                      return (
                        <div
                          key={photo.id}
                          className="p-3 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-2xl flex gap-3 items-start"
                        >
                          <div
                            className="w-16 aspect-[3/4] rounded-xl bg-zinc-950 shrink-0 border border-zinc-200 dark:border-zinc-700 shadow-2xs cursor-pointer overflow-hidden group"
                            onClick={() => setLightboxImage(photo.imageUrl)}
                          >
                            <img
                              src={photo.imageUrl}
                              alt={photo.name}
                              className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center justify-between gap-1">
                              <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                                {photo.name}
                              </p>
                              <button
                                type="button"
                                onClick={() => handleRemoveChosenPhotoFromClient(clientToViewDetails.id, photo.id)}
                                className="p-1 rounded-md text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors shrink-0 cursor-pointer"
                                title="Desvincular / Remover esta foto da seleção deste cliente"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            {cat && (
                              <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.2 rounded">
                                {cat.name}
                              </span>
                            )}
                            {photo.prompt && (
                              <div className="pt-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(photo.prompt);
                                    showToast('Prompt de IA copiado!', 'success');
                                  }}
                                  className="w-full text-left px-2 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-[10px] text-zinc-700 dark:text-zinc-300 hover:border-amber-500 transition-colors flex items-center justify-between gap-1 group cursor-pointer"
                                  title="Clique para copiar o prompt"
                                >
                                  <span className="truncate font-mono">{photo.prompt}</span>
                                  <Copy className="w-3 h-3 text-amber-500 shrink-0 group-hover:scale-110" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Mensagem / Observações */}
              {clientToViewDetails.selectionNotes && (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                    Observações do Cliente:
                  </span>
                  <p className="text-xs text-amber-950 dark:text-amber-200 italic">
                    "{clientToViewDetails.selectionNotes}"
                  </p>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const c = clientToViewDetails;
                    setClientToViewDetails(null);
                    openEditClientModal(c);
                  }}
                  className="px-3.5 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Pencil className="w-3.5 h-3.5 text-amber-500" />
                  <span>Editar Cliente</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setClientToViewDetails(null)}
                className="px-5 py-2 text-xs font-bold text-white bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 rounded-xl transition-all cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox / Zoom da Imagem */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in"
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center">
            <img
              src={lightboxImage}
              alt="Ampliada"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/10"
              referrerPolicy="no-referrer"
            />
            <button
              onClick={() => setLightboxImage(null)}
              className="mt-3 px-4 py-1.5 rounded-full bg-white/20 text-white text-xs font-semibold hover:bg-white/30 backdrop-blur-xs transition-colors"
            >
              Fechar Visualização
            </button>
          </div>
        </div>
      )}

      {/* Modal de confirmação de exclusão */}
      <ConfirmModal
        isOpen={!!clientToDelete}
        title="Excluir Cliente"
        message={`Deseja realmente remover o cadastro de "${clientToDelete?.name}"? Todas as fotos e seleções serão desvinculadas.`}
        confirmLabel="Sim, Excluir Cliente"
        cancelLabel="Cancelar"
        isDestructive={true}
        onConfirm={confirmDeleteClient}
        onCancel={() => setClientToDelete(null)}
      />
    </div>
  );
};

