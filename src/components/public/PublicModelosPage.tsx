import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  CheckCircle2,
  Check,
  Send,
  Sparkles,
  Loader2,
  Tag,
  Star,
  Search,
  Upload,
  User,
  Phone,
  Mail,
  Image as ImageIcon,
  X,
  MessageCircle,
  Layers,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  HelpCircle,
  Filter,
  CheckSquare,
  Square,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { Category, ModelPhoto, AgencyPackage, Client } from '../../types';
import { fetchPublicModelosData, submitModelosSelection, ModelosLeadSubmission, uploadImageToBlob } from '../../utils/storage';

export const PublicModelosPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [modelPhotos, setModelPhotos] = useState<ModelPhoto[]>([]);
  const [packages, setPackages] = useState<AgencyPackage[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State for "Enviar para fotógrafo"
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSelectedPhotos, setModalSelectedPhotos] = useState<ModelPhoto[]>([]);

  // Form Fields
  const [clientName, setClientName] = useState('');
  const [clientWhatsapp, setClientWhatsapp] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [referencePhotoBase64, setReferencePhotoBase64] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedClient, setSubmittedClient] = useState<Client | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // Lightbox for previewing photo full size
  const [previewPhoto, setPreviewPhoto] = useState<ModelPhoto | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setIsLoading(true);
      const data = await fetchPublicModelosData();
      if (isMounted) {
        setCategories(data.categories || []);
        setModelPhotos(data.modelPhotos || []);
        setPackages(data.packages || []);
        setIsLoading(false);
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filtered photos
  const filteredPhotos = modelPhotos.filter((photo) => {
    const matchesCategory =
      selectedCategoryId === 'todos' || photo.categoryId === selectedCategoryId;
    const matchesSearch =
      photo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (photo.prompt && photo.prompt.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const toggleSelectPhoto = (photoId: string) => {
    setSelectedPhotoIds((prev) =>
      prev.includes(photoId) ? prev.filter((id) => id !== photoId) : [...prev, photoId]
    );
  };

  // Open modal for a specific photo or multiple selected photos
  const handleOpenSendModal = (singlePhoto?: ModelPhoto) => {
    if (singlePhoto) {
      if (!selectedPhotoIds.includes(singlePhoto.id)) {
        setSelectedPhotoIds((prev) => [...prev, singlePhoto.id]);
      }
      setModalSelectedPhotos([singlePhoto]);
    } else {
      if (selectedPhotoIds.length === 0) {
        alert('Por favor, selecione ao menos 1 foto modelo antes de enviar.');
        return;
      }
      const selected = modelPhotos.filter((p) => selectedPhotoIds.includes(p.id));
      setModalSelectedPhotos(selected);
    }
    setIsModalOpen(true);
  };

  // Handle Reference Image Upload (file to base64)
  const handleReferenceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem válido (PNG, JPG, JPEG ou WEBP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setReferencePhotoBase64(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Format WhatsApp input nicely as user types
  const handleWhatsappChange = (val: string) => {
    const numbers = val.replace(/\D/g, '');
    let formatted = numbers;
    if (numbers.length > 0) {
      if (numbers.length <= 2) {
        formatted = `(${numbers}`;
      } else if (numbers.length <= 7) {
        formatted = `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
      } else if (numbers.length <= 11) {
        formatted = `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
      } else {
        formatted = `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
      }
    }
    setClientWhatsapp(formatted);
  };

  // Submit Lead to Photographer ("Enviar para fotógrafo" -> Salva como Cliente "Outro")
  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientName.trim()) {
      alert('Por favor, informe seu nome completo.');
      return;
    }

    const cleanWhatsapp = clientWhatsapp.replace(/\D/g, '');
    if (cleanWhatsapp.length < 10) {
      alert('Por favor, informe um número de WhatsApp válido com DDD.');
      return;
    }

    if (!referencePhotoBase64) {
      alert('Por favor, suba uma foto sua de referência para que o fotógrafo possa gerar seus ensaios com o seu rosto.');
      return;
    }

    const targetPhotoIds = modalSelectedPhotos.map((p) => p.id);
    if (targetPhotoIds.length === 0) {
      alert('Selecione ao menos 1 foto modelo.');
      return;
    }

    try {
      setIsSubmitting(true);

      let finalReferencePhotoUrl = referencePhotoBase64;
      if (referencePhotoBase64) {
        finalReferencePhotoUrl = await uploadImageToBlob(
          referencePhotoBase64,
          `ref-${clientName.trim().replace(/\s+/g, '_')}-${Date.now()}.jpg`
        );
      }

      const payload: ModelosLeadSubmission = {
        name: clientName.trim(),
        whatsapp: clientWhatsapp.trim(),
        email: clientEmail.trim() || undefined,
        referencePhotoUrl: finalReferencePhotoUrl,
        selectedPhotoIds: targetPhotoIds,
        notes: notes.trim() || undefined,
      };

      const resultClient = await submitModelosSelection(payload);
      if (resultClient) {
        setSubmittedClient(resultClient);
        setIsModalOpen(false);
        setIsSuccessModalOpen(true);
        // Clean selection
        setSelectedPhotoIds([]);
      }
    } catch (err) {
      alert('Ocorreu um erro ao enviar. Por favor, tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getWhatsAppContactUrl = () => {
    if (!submittedClient) return 'https://wa.me/5571992955846';
    const message = encodeURIComponent(
      `Olá! Acabei de escolher meus modelos favoritos na página de Modelos de Ensaio Fotográfico e enviei minha foto de referência (${submittedClient.name} - WhatsApp: ${submittedClient.whatsapp}). Gostaria de confirmar e dar início ao ensaio!`
    );
    return `https://wa.me/5571992955846?text=${message}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-zinc-400">Carregando catálogo de modelos de ensaio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-amber-500 selection:text-black pb-20">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => {
              window.location.hash = '';
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-medium transition-colors border border-zinc-700/60 cursor-pointer shrink-0"
            title="Voltar ao Painel do Fotógrafo"
          >
            <ArrowLeft className="w-4 h-4 text-zinc-400" />
            <span className="hidden xs:inline">Painel</span>
          </button>

          <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-xl bg-amber-600 flex items-center justify-center text-white shadow-xs shrink-0">
            <Camera className="w-4 sm:w-5 h-4 sm:h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-bold tracking-tight text-white truncate">
              StudioPhoto • Catálogo de Modelos
            </h2>
            <p className="text-[10px] sm:text-[11px] text-zinc-400 truncate">
              Galeria Oficial de Estilos & Poses
            </p>
          </div>
        </div>

        {/* Floating action button for multiple selection */}
        <div className="flex items-center gap-2 shrink-0">
          {selectedPhotoIds.length > 0 && (
            <button
              onClick={() => handleOpenSendModal()}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition-all shadow-md cursor-pointer animate-in fade-in"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Enviar {selectedPhotoIds.length} Selecionadas</span>
            </button>
          )}

          <a
            href="https://wa.me/5571992955846"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">WhatsApp</span>
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800/80 p-6 sm:p-10 text-center space-y-4 shadow-xl">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            Catálogo Exclusivo
          </span>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
            Modelos de Ensaio Fotográfico
          </h1>

          <p className="text-xs sm:text-base text-zinc-400 max-w-3xl mx-auto leading-relaxed">
            Explore abaixo todas as nossas categorias de ensaios e fotos modelo. Escolha os estilos, poses e ambientações que você mais gostar e clique em <strong className="text-amber-400 font-semibold">"Enviar para fotógrafo"</strong> para cadastrar sua foto de referência e iniciar a criação do seu ensaio personalizado!
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-xs text-zinc-400">
            <span className="flex items-center gap-1.5 bg-zinc-800/80 px-3 py-1 rounded-full border border-zinc-700/60">
              <Check className="w-3.5 h-3.5 text-amber-400" />
              {categories.length} Categorias Criadas
            </span>
            <span className="flex items-center gap-1.5 bg-zinc-800/80 px-3 py-1 rounded-full border border-zinc-700/60">
              <Check className="w-3.5 h-3.5 text-amber-400" />
              {modelPhotos.length} Fotos Modelo em Alta Definição
            </span>
            <span className="flex items-center gap-1.5 bg-zinc-800/80 px-3 py-1 rounded-full border border-zinc-700/60">
              <Check className="w-3.5 h-3.5 text-amber-400" />
              Envio com Foto de Referência
            </span>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* PACOTES E VALORES DOS ENSAIOS (OPCIONAL/TOPO)                 */}
        {/* ------------------------------------------------------------- */}
        {packages.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Tag className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Tabela de Pacotes & Valores dos Ensaios
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`p-4.5 rounded-2xl border transition-all flex flex-col justify-between ${
                    pkg.isPopular
                      ? 'bg-gradient-to-b from-amber-500/10 via-zinc-900 to-zinc-900 border-amber-500/60 shadow-lg ring-1 ring-amber-500/20'
                      : 'bg-zinc-900/60 border-zinc-800'
                  }`}
                >
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-zinc-200 truncate">
                        {pkg.name}
                      </span>
                      {pkg.badge && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-zinc-950 uppercase tracking-wider shrink-0">
                          {pkg.badge}
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl font-extrabold text-amber-400">
                        {pkg.price}
                      </span>
                      <span className="text-[11px] font-semibold text-zinc-400">
                        ({pkg.photoCount} fotos)
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-2">
                      {pkg.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* FILTROS DE CATEGORIA & BUSCA                                  */}
        {/* ------------------------------------------------------------- */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl">
            {/* Search input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por estilo, pose, enquadramento ou categoria..."
                className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
              />
            </div>

            {/* Photo counter and selection summary */}
            <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-zinc-400">
              <span>
                Exibindo <strong className="text-zinc-200">{filteredPhotos.length}</strong> modelos
              </span>
              {selectedPhotoIds.length > 0 && (
                <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">
                  {selectedPhotoIds.length} selecionadas
                </span>
              )}
            </div>
          </div>

          {/* Category Filter Chips / Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setSelectedCategoryId('todos')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedCategoryId === 'todos'
                  ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Todas as Categorias ({modelPhotos.length})</span>
            </button>

            {categories.map((cat) => {
              const count = modelPhotos.filter((p) => p.categoryId === cat.id).length;
              const isSelected = selectedCategoryId === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                      : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      isSelected
                        ? 'bg-zinc-950 text-amber-400 font-extrabold'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* GRADE DE FOTOS MODELO COM BOTÃO "ENVIAR PARA FOTÓGRAFO"       */}
        {/* ------------------------------------------------------------- */}
        <div className="space-y-6">
          {filteredPhotos.length === 0 ? (
            <div className="text-center py-16 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto">
                <Camera className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-zinc-200">
                Nenhum modelo encontrado
              </h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Tente selecionar outra categoria ou limpar os termos da sua busca.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
              {filteredPhotos.map((photo, index) => {
                const category = categories.find((c) => c.id === photo.categoryId);
                const isSelected = selectedPhotoIds.includes(photo.id);

                return (
                  <div
                    key={photo.id}
                    className={`group relative flex flex-col justify-between bg-zinc-900/90 border rounded-2xl overflow-hidden transition-all duration-200 shadow-md select-none touch-manipulation ${
                      isSelected
                        ? 'border-amber-500 ring-2 sm:ring-4 ring-amber-500/30 shadow-lg shadow-amber-500/10'
                        : 'border-zinc-800 hover:border-zinc-700 hover:shadow-xl'
                    }`}
                  >
                    {/* Top Image Container 3:4 Vertical Portrait */}
                    <div
                      onClick={() => toggleSelectPhoto(photo.id)}
                      className="relative aspect-[3/4] bg-zinc-950 overflow-hidden cursor-pointer"
                    >
                      <img
                        src={photo.imageUrl}
                        alt={photo.name}
                        className={`w-full h-full object-cover object-top transition-transform duration-300 ${
                          isSelected ? 'scale-105' : 'group-hover:scale-105'
                        }`}
                        loading="lazy"
                      />

                      {/* Selection Checkbox Toggle */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelectPhoto(photo.id);
                        }}
                        className={`absolute top-2 sm:top-3 right-2 sm:right-3 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all cursor-pointer z-10 ${
                          isSelected
                            ? 'bg-amber-500 text-zinc-950 shadow-md ring-2 ring-white/30 scale-100'
                            : 'bg-black/60 text-white/70 border border-white/20 hover:bg-black/80'
                        }`}
                        title={isSelected ? 'Desmarcar foto' : 'Marcar foto'}
                      >
                        <Check className="w-3.5 sm:w-4 h-3.5 sm:h-4 stroke-[3]" />
                      </button>

                      {/* Category Badge on top-left */}
                      {category && (
                        <div className="absolute top-2 sm:top-3 left-2 sm:left-3 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg bg-black/75 backdrop-blur-xs text-[9px] sm:text-[10px] font-bold text-amber-300 border border-white/10 max-w-[70%] truncate">
                          {category.name}
                        </div>
                      )}

                      {/* Fullscreen Preview button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewPhoto(photo);
                        }}
                        className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 p-1.5 sm:p-2 rounded-xl bg-black/70 text-white hover:bg-amber-500 hover:text-zinc-950 backdrop-blur-xs opacity-90 sm:opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-md z-10"
                        title="Ampliar foto em alta resolução"
                      >
                        <Eye className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                      </button>
                    </div>

                    {/* Card Content & Action Button */}
                    <div className="p-2.5 sm:p-4 space-y-2 sm:space-y-3 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="text-xs sm:text-sm font-bold text-zinc-100 line-clamp-1 sm:line-clamp-2 leading-snug">
                          {photo.name}
                        </h3>
                      </div>

                      {/* Prominent "Enviar para fotógrafo" Button */}
                      <div className="pt-1.5 sm:pt-2 border-t border-zinc-800/80">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenSendModal(photo);
                          }}
                          className="w-full flex items-center justify-center gap-1 sm:gap-2 py-2 sm:py-2.5 px-2 sm:px-3 rounded-xl text-[11px] sm:text-xs font-bold text-zinc-950 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 transition-all shadow-xs cursor-pointer"
                        >
                          <Send className="w-3 sm:w-3.5 h-3 sm:h-3.5 shrink-0" />
                          <span className="truncate">Enviar p/ fotógrafo</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Floating Multiple Send Bar when items are checked */}
        {selectedPhotoIds.length > 0 && (
          <div className="fixed bottom-4 inset-x-3 sm:inset-x-auto sm:right-8 z-40 max-w-md mx-auto sm:mx-0 p-3.5 sm:p-4 bg-zinc-900/95 backdrop-blur-md border border-amber-500/60 rounded-2xl shadow-2xl space-y-2 animate-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between text-xs px-1">
              <span className="text-zinc-300 font-medium">Fotos Marcadas:</span>
              <span className="font-extrabold text-amber-400 text-sm">
                {selectedPhotoIds.length} selecionada(s)
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleOpenSendModal()}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-zinc-950 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 transition-all shadow-md cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Enviar {selectedPhotoIds.length} Foto(s) para o Fotógrafo</span>
            </button>
          </div>
        )}
      </main>

      {/* ============================================================= */}
      {/* MODAL DE CADASTRO E ENVIO COM FOTO DE REFERÊNCIA               */}
      {/* ============================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div
            className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden max-h-[94vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-zinc-800">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
                  <Send className="w-4 sm:w-5 h-4 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm sm:text-lg font-bold text-white truncate">
                    Enviar Escolha para o Fotógrafo
                  </h2>
                  <p className="text-[10px] sm:text-xs text-zinc-400 truncate">
                    Cadastre seus dados e anexe sua foto de referência
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmitLead} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5">
              {/* Selected Photos Preview Thumbnails */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-zinc-300">
                  Modelos Selecionados ({modalSelectedPhotos.length})
                </label>
                <div className="flex items-center gap-2.5 overflow-x-auto p-2 bg-zinc-950/70 border border-zinc-800/80 rounded-2xl">
                  {modalSelectedPhotos.map((photo) => (
                    <div
                      key={photo.id}
                      className="relative w-14 sm:w-16 h-14 sm:h-16 rounded-xl overflow-hidden shrink-0 border border-amber-500/40"
                    >
                      <img
                        src={photo.imageUrl}
                        alt={photo.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Input Nome */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Seu Nome Completo <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Ex: Ana Clara Silva"
                    className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Input WhatsApp & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    WhatsApp com DDD <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={clientWhatsapp}
                      onChange={(e) => handleWhatsappChange(e.target.value)}
                      placeholder="(71) 99999-9999"
                      className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    E-mail <span className="text-zinc-500 font-normal">(Opcional)</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="seuemail@exemplo.com"
                      className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Upload de Imagem de Referência */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-zinc-300">
                    Sua Foto de Referência <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] sm:text-[11px] text-amber-400 font-medium">
                    Base facial/corporal para IA
                  </span>
                </div>

                {referencePhotoBase64 ? (
                  <div className="relative p-3 bg-zinc-950 border border-amber-500/40 rounded-2xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl overflow-hidden border border-zinc-700 shrink-0">
                        <img
                          src={referencePhotoBase64}
                          alt="Referência"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-zinc-200">Foto carregada com sucesso!</p>
                        <p className="text-[11px] text-zinc-400">
                          Pronta para ser enviada junto com seus modelos escolhidos.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setReferencePhotoBase64(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                      title="Remover foto"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor="modelos-ref-photo-input"
                    className="block p-5 sm:p-6 border-2 border-dashed border-zinc-700 hover:border-amber-500/80 bg-zinc-950/50 hover:bg-zinc-950 active:bg-zinc-900 rounded-2xl text-center space-y-2 cursor-pointer transition-colors"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-zinc-800 text-amber-400 flex items-center justify-center mx-auto">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-200">
                        Toque aqui para escolher sua foto de referência
                      </p>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Envie uma foto do seu rosto ou corpo (PNG, JPG até 10MB)
                      </p>
                    </div>
                    <input
                      id="modelos-ref-photo-input"
                      type="file"
                      ref={fileInputRef}
                      onChange={handleReferenceFileChange}
                      accept="image/*"
                      className="sr-only"
                    />
                  </label>
                )}
              </div>

              {/* Observações Opcionais */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Observações ou Detalhes Especiais <span className="text-zinc-500 font-normal">(Opcional)</span>
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Gostaria de focar em trajes corporativos escuros, cenário externo..."
                  className="w-full px-3.5 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                />
              </div>

              {/* Submit Action */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-sm font-bold text-zinc-950 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-50 transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Enviando para o fotógrafo...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Confirmar e Enviar para o Fotógrafo</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL DE SUCESSO APÓS ENVIO                                   */}
      {/* ============================================================= */}
      {isSuccessModalOpen && submittedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div
            className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-2xl bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center mx-auto shadow-lg">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Solicitação Enviada com Sucesso!
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400">
                Obrigado, <strong className="text-zinc-200">{submittedClient.name}</strong>! Seus modelos escolhidos e foto de referência já estão salvos e encaminhados ao fotógrafo.
              </p>
            </div>

            {/* Client Recap Box */}
            <div className="p-4 bg-zinc-950/80 border border-zinc-800 rounded-2xl text-left space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Ensaio:</span>
                <span className="font-bold text-amber-400">Outro (Personalizado)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">WhatsApp:</span>
                <span className="font-medium text-zinc-200">{submittedClient.whatsapp}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Fotos Modelo Escolhidas:</span>
                <span className="font-bold text-zinc-200">{submittedClient.chosenPhotoIds?.length || 0} fotos</span>
              </div>
              {submittedClient.referencePhotoUrl && (
                <div className="pt-2 border-t border-zinc-800 flex items-center gap-3">
                  <img
                    src={submittedClient.referencePhotoUrl}
                    alt="Referência"
                    className="w-10 h-10 rounded-lg object-cover border border-zinc-700 shrink-0"
                  />
                  <span className="text-[11px] text-zinc-400">
                    Foto de referência anexada com sucesso.
                  </span>
                </div>
              )}
            </div>

            {/* Direct WhatsApp Call To Action */}
            <div className="space-y-3 pt-2">
              <a
                href={getWhatsAppContactUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2.5 py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all shadow-lg shadow-emerald-950 cursor-pointer"
              >
                <MessageCircle className="w-5 h-5 fill-white" />
                <span>Confirmar no WhatsApp do Fotógrafo</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  setIsSuccessModalOpen(false);
                  setSubmittedClient(null);
                  setClientName('');
                  setClientWhatsapp('');
                  setClientEmail('');
                  setReferencePhotoBase64(null);
                  setNotes('');
                }}
                className="w-full py-2.5 px-4 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              >
                Voltar e Explorar Mais Modelos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Size Image Preview Lightbox */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
          onClick={() => setPreviewPhoto(null)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[90vh] bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 flex items-center justify-between border-b border-zinc-800">
              <span className="text-sm font-bold text-white">{previewPhoto.name}</span>
              <button
                onClick={() => setPreviewPhoto(null)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 bg-black overflow-auto flex items-center justify-center p-2">
              <img
                src={previewPhoto.imageUrl}
                alt={previewPhoto.name}
                className="max-h-[70vh] w-auto object-contain rounded-xl"
              />
            </div>
            <div className="p-4 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between gap-3">
              <button
                onClick={() => {
                  setPreviewPhoto(null);
                  handleOpenSendModal(previewPhoto);
                }}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-zinc-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-all shrink-0 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Enviar para fotógrafo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
