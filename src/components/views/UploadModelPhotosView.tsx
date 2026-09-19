import React, { useState } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  Copy,
  Sparkles,
  Trash2,
  Plus,
  Check,
  Search,
  Filter,
  Loader2,
  FileImage,
  Pencil,
  X,
  Eye,
} from 'lucide-react';
import { Category, ModelPhoto } from '../../types';
import { saveModelPhotos, deleteModelPhoto, generateUniqueToken, uploadImageToBlob } from '../../utils/storage';
import { compressImageFile } from '../../utils/imageCompressor';
import { generatePhotographyPromptWithAI } from '../../utils/gemini';
import { useToast } from '../Toast';
import { ConfirmModal } from '../ConfirmModal';

interface UploadModelPhotosViewProps {
  categories: Category[];
  modelPhotos: ModelPhoto[];
}

export const UploadModelPhotosView: React.FC<UploadModelPhotosViewProps> = ({
  categories,
  modelPhotos,
}) => {
  const { showToast } = useToast();
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<string>(categories[0]?.id || '');
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isCompressing, setIsCompressing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Gemini AI generation state
  const [conceptIdea, setConceptIdea] = useState('');
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);

  // Edit Modal State
  const [editingPhoto, setEditingPhoto] = useState<ModelPhoto | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editPrompt, setEditPrompt] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editImagePreview, setEditImagePreview] = useState('');
  const [isCompressingEdit, setIsCompressingEdit] = useState(false);
  const [editConceptIdea, setEditConceptIdea] = useState('');
  const [isGeneratingEditPrompt, setIsGeneratingEditPrompt] = useState(false);

  // Delete modal state
  const [photoToDelete, setPhotoToDelete] = useState<{ id: string; name: string } | null>(null);
  // Lightbox zoom modal state
  const [lightboxPhoto, setLightboxPhoto] = useState<ModelPhoto | null>(null);

  // Synchronize default category if empty
  React.useEffect(() => {
    if (!categoryId && categories.length > 0) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

  const handleProcessFile = async (file: File) => {
    try {
      setIsCompressing(true);
      const compressedDataUrl = await compressImageFile(file);
      setImagePreview(compressedDataUrl);
      setImageUrl(compressedDataUrl);

      // If name is empty, auto-fill with a clean version of file name
      if (!name) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        setName(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
    } catch (err) {
      showToast('Não foi possível processar a imagem. Tente outro arquivo.', 'error');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleProcessFile(file);
    }
    e.target.value = '';
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        await handleProcessFile(file);
      } else {
        showToast('Por favor, selecione um arquivo de imagem válido.', 'error');
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleCopyPrompt = (promptText: string, photoName: string) => {
    navigator.clipboard.writeText(promptText);
    showToast(`Prompt de "${photoName}" copiado para colar em outra IA!`, 'success');
  };

  const handleGeneratePromptWithAI = async () => {
    if (!conceptIdea.trim()) {
      showToast('Digite uma breve ideia ou tema para o Gemini gerar o prompt.', 'info');
      return;
    }

    const catObj = categories.find((c) => c.id === categoryId);
    const catName = catObj ? catObj.name : 'Ensaio Fotográfico';

    try {
      setIsGeneratingPrompt(true);
      const generated = await generatePhotographyPromptWithAI(catName, conceptIdea);
      setPrompt(generated);
      showToast('Prompt profissional gerado com sucesso pelo Gemini!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Erro ao gerar prompt com a IA do Gemini.', 'error');
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const handleSubmitPhoto = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalImage = imagePreview || imageUrl.trim();
    if (!name.trim()) {
      showToast('Por favor, dê um nome à foto modelo.', 'error');
      return;
    }
    const targetCategoryId = categoryId || categories[0]?.id;
    if (!targetCategoryId) {
      showToast('Cadastre ao menos uma categoria antes de adicionar fotos.', 'error');
      return;
    }
    if (!prompt.trim()) {
      showToast('Informe o prompt usado para gerar a foto.', 'error');
      return;
    }
    if (!finalImage) {
      showToast('Faça o upload de uma imagem ou informe a URL da foto.', 'error');
      return;
    }

    try {
      setIsUploading(true);
      // Upload image to Vercel Blob individually (one at a time)
      const uploadedUrl = await uploadImageToBlob(finalImage, `${name.trim()}.jpg`);

      const newPhoto: ModelPhoto = {
        id: generateUniqueToken('photo'),
        name: name.trim(),
        categoryId: targetCategoryId,
        prompt: prompt.trim(),
        imageUrl: uploadedUrl,
        createdAt: new Date().toISOString(),
      };

      const updated = [newPhoto, ...modelPhotos];
      saveModelPhotos(updated);

      showToast(`Foto modelo "${newPhoto.name}" cadastrada e salva com sucesso!`, 'success');

      // Reset Form
      setName('');
      setPrompt('');
      setImageUrl('');
      setImagePreview('');
      setConceptIdea('');
    } catch (err: any) {
      showToast('Erro ao realizar upload da foto para o servidor.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (photo: ModelPhoto) => {
    setEditingPhoto(photo);
    setEditName(photo.name);
    setEditCategoryId(photo.categoryId);
    setEditPrompt(photo.prompt);
    setEditImageUrl(photo.imageUrl);
    setEditImagePreview(photo.imageUrl);
    setEditConceptIdea('');
  };

  const handleEditFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsCompressingEdit(true);
        const compressed = await compressImageFile(file);
        setEditImagePreview(compressed);
        setEditImageUrl(compressed);
      } catch {
        showToast('Erro ao processar nova imagem.', 'error');
      } finally {
        setIsCompressingEdit(false);
      }
    }
    e.target.value = '';
  };

  const handleGenerateEditPrompt = async () => {
    if (!editConceptIdea.trim()) {
      showToast('Digite uma breve ideia para a IA gerar o prompt.', 'info');
      return;
    }

    const catObj = categories.find((c) => c.id === editCategoryId);
    const catName = catObj ? catObj.name : 'Ensaio Fotográfico';

    try {
      setIsGeneratingEditPrompt(true);
      const generated = await generatePhotographyPromptWithAI(catName, editConceptIdea);
      setEditPrompt(generated);
      showToast('Prompt gerado com sucesso pelo Gemini!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Erro ao gerar prompt.', 'error');
    } finally {
      setIsGeneratingEditPrompt(false);
    }
  };

  const handleSaveEditedPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPhoto) return;

    const finalImage = editImagePreview || editImageUrl.trim();
    if (!editName.trim()) {
      showToast('Por favor, informe o nome da foto.', 'error');
      return;
    }
    if (!editPrompt.trim()) {
      showToast('Por favor, informe o prompt.', 'error');
      return;
    }
    if (!finalImage) {
      showToast('A foto precisa ter uma imagem válida.', 'error');
      return;
    }

    try {
      setIsCompressingEdit(true);
      const uploadedUrl = await uploadImageToBlob(finalImage, `${editName.trim()}.jpg`);

      const updatedPhoto: ModelPhoto = {
        ...editingPhoto,
        name: editName.trim(),
        categoryId: editCategoryId || editingPhoto.categoryId,
        prompt: editPrompt.trim(),
        imageUrl: uploadedUrl,
      };

      const updated = modelPhotos.map((p) => (p.id === editingPhoto.id ? updatedPhoto : p));
      saveModelPhotos(updated);

      showToast(`Foto modelo "${updatedPhoto.name}" editada e salva com sucesso!`, 'success');
      setEditingPhoto(null);
    } catch (err: any) {
      showToast('Erro ao salvar alterações da foto.', 'error');
    } finally {
      setIsCompressingEdit(false);
    }
  };

  const confirmDeletePhoto = () => {
    if (!photoToDelete) return;
    deleteModelPhoto(photoToDelete.id);
    showToast(`Foto modelo "${photoToDelete.name}" removida com sucesso!`, 'info');
    setPhotoToDelete(null);
  };

  // Filter photos
  const filteredPhotos = modelPhotos.filter((photo) => {
    const matchesCategory =
      selectedCategoryFilter === 'todos' || photo.categoryId === selectedCategoryFilter;
    const matchesSearch =
      photo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      photo.prompt.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-8">
      {/* Page Title Header */}
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Upload & Cadastro de Fotos Modelo
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
          Suba imagens modelo vinculando a categoria, o nome e o prompt usado para gerar na IA.
        </p>
      </div>

      {/* Upload Form Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <UploadCloud className="w-4 h-4 text-amber-600" />
            Cadastrar Nova Foto Modelo
          </h2>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            Armazena imagem otimizada e prompt para cópia rápida
          </span>
        </div>

        <form onSubmit={handleSubmitPhoto} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Image Upload / Preview */}
            <div className="space-y-4">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Imagem da Foto Modelo *
              </label>

              {/* Upload Drop Area */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="relative border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-amber-500 dark:hover:border-amber-500 rounded-2xl p-6 text-center bg-zinc-50/50 dark:bg-zinc-800/30 transition-all flex flex-col items-center justify-center min-h-[220px]"
              >
                {isCompressing ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-8">
                    <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
                    <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      Otimizando e preparando imagem...
                    </p>
                  </div>
                ) : imagePreview ? (
                  <div className="space-y-3 w-full flex flex-col items-center">
                    <div className="w-40 sm:w-48 aspect-[3/4] rounded-2xl bg-zinc-950 border border-zinc-200 dark:border-zinc-700 overflow-hidden shadow-md">
                      <img
                        src={imagePreview}
                        alt="Prévia da foto"
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                    <div className="flex items-center justify-center gap-3">
                      <label className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-semibold cursor-pointer">
                        Trocar imagem
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageFileChange}
                          className="hidden"
                        />
                      </label>
                      <span className="text-zinc-300 dark:text-zinc-700">•</span>
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview('');
                          setImageUrl('');
                        }}
                        className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-medium cursor-pointer"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                      Arraste ou clique para selecionar uma foto
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                      PNG, JPG, JPEG, WEBP de qualquer resolução
                    </p>

                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </>
                )}
              </div>

              {/* Fallback URL input */}
              <div className="space-y-1">
                <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block">
                  Ou cole o link direto da imagem:
                </span>
                <input
                  type="url"
                  value={imageUrl.startsWith('data:') ? '' : imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setImagePreview(e.target.value);
                  }}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </div>

            {/* Right Column: Name, Category, Prompt */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                  Nome / Título da Foto Modelo *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Silhueta Golden Hour Gestante"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                  Categoria do Ensaio *
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                >
                  {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                  ))}
                </select>
              </div>

              {/* Prompt with AI helper */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    Prompt Usado na IA *
                  </label>
                </div>

                <textarea
                  rows={4}
                  required
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Cole aqui o prompt completo (ex: Editorial portrait, pregnant woman in silk dress, 85mm f/1.4, cinematic golden light, 8k resolution --ar 3:4)..."
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-mono bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />

                {/* Gemini AI Prompt Helper */}
                <div className="p-3 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/50 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Assistente de Prompt Gemini AI (Opcional)</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={conceptIdea}
                      onChange={(e) => setConceptIdea(e.target.value)}
                      placeholder="Ex: Gestante de vestido branco no pôr do sol na praia..."
                      className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-zinc-800 border border-amber-200 dark:border-amber-800 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-hidden"
                    />
                    <button
                      type="button"
                      disabled={isGeneratingPrompt}
                      onClick={handleGeneratePromptWithAI}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-lg transition-all shadow-2xs shrink-0 flex items-center gap-1.5 cursor-pointer"
                    >
                      {isGeneratingPrompt ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Gerando...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3" />
                          <span>Gerar Prompt</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="submit"
              disabled={isCompressing || isUploading}
              className="px-6 py-2.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 disabled:opacity-50 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enviando para nuvem...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Cadastrar Foto Modelo & Salvar</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* List of Existing Model Photos with Edit / Copy Prompt button */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Fotos Modelo Cadastradas ({filteredPhotos.length})
          </h2>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filtrar por nome ou prompt..."
                className="pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-hidden"
              />
            </div>

            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-800 dark:text-zinc-200 focus:outline-hidden"
            >
              <option value="todos">Todas as Categorias</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredPhotos.length === 0 ? (
          <div className="text-center py-10 px-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
            <p className="text-xs text-zinc-500">Nenhuma foto modelo encontrada para os filtros selecionados.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-5">
            {filteredPhotos.map((photo) => {
              const category = categories.find((c) => c.id === photo.categoryId);

              return (
                <div
                  key={photo.id}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Preview 3:4 Padrão Profissional Vertical */}
                    <div
                      onClick={() => setLightboxPhoto(photo)}
                      className="relative aspect-[3/4] bg-zinc-950 overflow-hidden cursor-pointer group"
                    >
                      <img
                        src={photo.imageUrl}
                        alt={photo.name}
                        className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute top-2 left-2">
                        <span className="text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-md bg-black/75 text-amber-300 backdrop-blur-xs border border-white/10">
                          {category?.name || 'Sem Categoria'}
                        </span>
                      </div>
                      <div className="absolute top-2 right-2 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(photo);
                          }}
                          className="p-1.5 bg-black/70 hover:bg-amber-600 text-white rounded-lg backdrop-blur-xs transition-colors cursor-pointer"
                          title="Editar dados da foto"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPhotoToDelete({ id: photo.id, name: photo.name });
                          }}
                          className="p-1.5 bg-black/70 hover:bg-rose-600 text-white rounded-lg backdrop-blur-xs transition-colors cursor-pointer"
                          title="Excluir foto modelo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Hover Zoom hint */}
                      <div className="absolute bottom-2 right-2 p-1.5 bg-black/70 text-white rounded-lg backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                        <Eye className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                      <div className="flex items-start justify-between gap-1.5">
                        <h4 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-1" title={photo.name}>
                          {photo.name}
                        </h4>
                        <button
                          type="button"
                          onClick={() => openEditModal(photo)}
                          className="text-[11px] sm:text-xs text-amber-600 dark:text-amber-400 hover:underline font-semibold shrink-0 cursor-pointer hidden sm:flex items-center gap-1"
                        >
                          <Pencil className="w-3 h-3" />
                          Editar
                        </button>
                      </div>

                      <div className="p-2 sm:p-2.5 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200/60 dark:border-zinc-800">
                        <span className="text-[9px] sm:text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
                          Prompt IA:
                        </span>
                        <p className="text-[11px] sm:text-xs text-zinc-600 dark:text-zinc-400 font-mono line-clamp-2 sm:line-clamp-3 leading-snug">
                          {photo.prompt}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 sm:p-4 pt-0 grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyPrompt(photo.prompt, photo.name)}
                      className="w-full flex items-center justify-center gap-1 sm:gap-1.5 py-1.5 sm:py-2 px-2 text-[11px] sm:text-xs font-semibold text-zinc-700 dark:text-zinc-200 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-xl transition-all cursor-pointer"
                    >
                      <Copy className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                      <span>Copiar Prompt</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditModal(photo)}
                      className="w-full flex items-center justify-center gap-1 sm:gap-1.5 py-1.5 sm:py-2 px-2 text-[11px] sm:text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 rounded-xl transition-all cursor-pointer"
                    >
                      <Pencil className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                      <span>Editar</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Photo Modal */}
      {editingPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150 overflow-y-auto"
          onClick={() => setEditingPhoto(null)}
        >
          <div
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Pencil className="w-4 h-4 text-amber-600" />
                Editar Foto Modelo: {editingPhoto.name}
              </h2>
              <button
                type="button"
                onClick={() => setEditingPhoto(null)}
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedPhoto} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                    Nome da Foto *
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Ex: Silhueta Gestante Golden Hour"
                    className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                    Categoria *
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
              </div>

              {/* Image Section */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  Imagem da Foto Modelo
                </label>
                {editImagePreview && (
                  <div className="relative mb-3 w-40 sm:w-48 aspect-[3/4] mx-auto rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-200 dark:border-zinc-700 shadow-md">
                    <img src={editImagePreview} alt="Preview" className="w-full h-full object-cover object-top" />
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-3 py-2 text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-xl cursor-pointer transition-colors">
                    {isCompressingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4 text-amber-600" />}
                    <span>Trocar imagem por arquivo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEditFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Prompt Section */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                  Prompt Usado na IA *
                </label>
                <textarea
                  rows={4}
                  required
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  placeholder="Prompt de geração..."
                  className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs sm:text-sm font-mono text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
                />

                {/* Gemini Helper in Edit */}
                <div className="p-3 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/50 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Refinar prompt com Gemini AI</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editConceptIdea}
                      onChange={(e) => setEditConceptIdea(e.target.value)}
                      placeholder="Ex: Adicionar iluminação suave de estúdio e fundo escuro..."
                      className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-zinc-800 border border-amber-200 dark:border-amber-800 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-hidden"
                    />
                    <button
                      type="button"
                      disabled={isGeneratingEditPrompt}
                      onClick={handleGenerateEditPrompt}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-lg transition-all shadow-2xs shrink-0 flex items-center gap-1 cursor-pointer"
                    >
                      {isGeneratingEditPrompt ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Gerando...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3" />
                          <span>Gerar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingPhoto(null)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl cursor-pointer"
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

      {/* Lightbox Modal para Visualização em Tamanho Real */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150"
          onClick={() => setLightboxPhoto(null)}
        >
          <div
            className="relative max-w-3xl w-full bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/60">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  {lightboxPhoto.name}
                </h3>
                <span className="text-xs text-amber-400">
                  {categories.find((c) => c.id === lightboxPhoto.categoryId)?.name || 'Foto Modelo'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setLightboxPhoto(null)}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-black/40">
              <img
                src={lightboxPhoto.imageUrl}
                alt={lightboxPhoto.name}
                className="max-h-[65vh] w-auto max-w-full object-contain rounded-xl shadow-lg"
              />
            </div>

            <div className="p-4 border-t border-zinc-800 bg-zinc-900/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <p className="text-xs text-zinc-400 font-mono line-clamp-2 max-w-lg">
                {lightboxPhoto.prompt}
              </p>
              <button
                type="button"
                onClick={() => handleCopyPrompt(lightboxPhoto.prompt, lightboxPhoto.name)}
                className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-zinc-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-colors shrink-0 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar Prompt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal for Deleting Photos */}
      <ConfirmModal
        isOpen={!!photoToDelete}
        title="Excluir Foto Modelo"
        message={`Deseja realmente remover a foto modelo "${photoToDelete?.name}"? Esta ação removerá a imagem do catálogo do estúdio.`}
        confirmLabel="Sim, Excluir Foto"
        cancelLabel="Cancelar"
        isDestructive={true}
        onConfirm={confirmDeletePhoto}
        onCancel={() => setPhotoToDelete(null)}
      />
    </div>
  );
};
