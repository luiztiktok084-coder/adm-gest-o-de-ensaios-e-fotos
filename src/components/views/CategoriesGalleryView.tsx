import React, { useState } from 'react';
import {
  FolderPlus,
  FolderHeart,
  Image as ImageIcon,
  Copy,
  Plus,
  Trash2,
  ChevronLeft,
  Sparkles,
  ExternalLink,
  UploadCloud,
  Loader2,
  Pencil,
  X,
  Check,
} from 'lucide-react';
import { Category, ModelPhoto } from '../../types';
import { saveCategories, saveModelPhotos, generateUniqueToken, uploadImageToBlob } from '../../utils/storage';
import { compressImageFile } from '../../utils/imageCompressor';
import { generatePhotographyPromptWithAI } from '../../utils/gemini';
import { useToast } from '../Toast';
import { NavView } from '../Sidebar';
import { ConfirmModal } from '../ConfirmModal';

interface CategoriesGalleryViewProps {
  categories: Category[];
  modelPhotos: ModelPhoto[];
  onNavigate: (view: NavView) => void;
  initialOpenCreateModal?: boolean;
}

export const CategoriesGalleryView: React.FC<CategoriesGalleryViewProps> = ({
  categories,
  modelPhotos,
  onNavigate,
  initialOpenCreateModal = false,
}) => {
  const { showToast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(initialOpenCreateModal);

  // New Category Form state
  const [newCatName, setNewCatName] = useState('');
  const [newCatDescription, setNewCatDescription] = useState('');
  const [newCatCoverUrl, setNewCatCoverUrl] = useState('');
  const [isProcessingCover, setIsProcessingCover] = useState(false);

  // Edit Category Form state
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatDescription, setEditCatDescription] = useState('');
  const [editCatCoverUrl, setEditCatCoverUrl] = useState('');
  const [isProcessingEditCover, setIsProcessingEditCover] = useState(false);

  // Edit Photo Form state
  const [editingPhoto, setEditingPhoto] = useState<ModelPhoto | null>(null);
  const [editPhotoName, setEditPhotoName] = useState('');
  const [editPhotoCategoryId, setEditPhotoCategoryId] = useState('');
  const [editPhotoPrompt, setEditPhotoPrompt] = useState('');
  const [editPhotoImageUrl, setEditPhotoImageUrl] = useState('');
  const [editPhotoPreview, setEditPhotoPreview] = useState('');
  const [isProcessingEditPhoto, setIsProcessingEditPhoto] = useState(false);
  const [editPhotoConcept, setEditPhotoConcept] = useState('');
  const [isGeneratingEditPrompt, setIsGeneratingEditPrompt] = useState(false);

  // Confirm delete modals
  const [catToDelete, setCatToDelete] = useState<{ id: string; name: string } | null>(null);
  const [photoToDelete, setPhotoToDelete] = useState<{ id: string; name: string } | null>(null);

  const handleCopyPrompt = (prompt: string, photoName: string) => {
    navigator.clipboard.writeText(prompt);
    showToast(`Prompt de "${photoName}" copiado para a área de transferência!`, 'success');
  };

  const handleCoverFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsProcessingCover(true);
        const dataUrl = await compressImageFile(file, 1200, 800, 0.8);
        const blobUrl = await uploadImageToBlob(dataUrl, file.name);
        setNewCatCoverUrl(blobUrl);
      } catch {
        showToast('Erro ao processar imagem de capa.', 'error');
      } finally {
        setIsProcessingCover(false);
      }
    }
  };

  const handleEditCoverFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsProcessingEditCover(true);
        const dataUrl = await compressImageFile(file, 1200, 800, 0.8);
        const blobUrl = await uploadImageToBlob(dataUrl, file.name);
        setEditCatCoverUrl(blobUrl);
      } catch {
        showToast('Erro ao processar nova imagem de capa.', 'error');
      } finally {
        setIsProcessingEditCover(false);
      }
    }
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      showToast('Por favor, informe o nome da categoria.', 'error');
      return;
    }

    const newCategory: Category = {
      id: generateUniqueToken('cat'),
      name: newCatName.trim(),
      description: newCatDescription.trim(),
      coverUrl:
        newCatCoverUrl.trim() ||
        'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=800&q=80',
      createdAt: new Date().toISOString(),
    };

    const updated = [newCategory, ...categories];
    saveCategories(updated);
    showToast(`Categoria "${newCategory.name}" criada com sucesso!`, 'success');

    setNewCatName('');
    setNewCatDescription('');
    setNewCatCoverUrl('');
    setIsCreateModalOpen(false);
  };

  const openEditCategoryModal = (cat: Category, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingCategory(cat);
    setEditCatName(cat.name);
    setEditCatDescription(cat.description || '');
    setEditCatCoverUrl(cat.coverUrl);
  };

  const handleSaveEditedCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    if (!editCatName.trim()) {
      showToast('O nome da categoria não pode ficar vazio.', 'error');
      return;
    }

    const updatedCat: Category = {
      ...editingCategory,
      name: editCatName.trim(),
      description: editCatDescription.trim(),
      coverUrl: editCatCoverUrl.trim() || editingCategory.coverUrl,
    };

    const updatedList = categories.map((c) => (c.id === editingCategory.id ? updatedCat : c));
    saveCategories(updatedList);

    // If currently viewing this category, update view reference
    if (selectedCategory?.id === editingCategory.id) {
      setSelectedCategory(updatedCat);
    }

    showToast(`Categoria "${updatedCat.name}" atualizada com sucesso!`, 'success');
    setEditingCategory(null);
  };

  const openEditPhotoModal = (photo: ModelPhoto, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingPhoto(photo);
    setEditPhotoName(photo.name);
    setEditPhotoCategoryId(photo.categoryId);
    setEditPhotoPrompt(photo.prompt);
    setEditPhotoImageUrl(photo.imageUrl);
    setEditPhotoPreview(photo.imageUrl);
    setEditPhotoConcept('');
  };

  const handleEditPhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsProcessingEditPhoto(true);
        const dataUrl = await compressImageFile(file, 1400, 1400, 0.82);
        setEditPhotoPreview(dataUrl);
        const blobUrl = await uploadImageToBlob(dataUrl, file.name);
        setEditPhotoImageUrl(blobUrl);
      } catch {
        showToast('Erro ao processar imagem da foto modelo.', 'error');
      } finally {
        setIsProcessingEditPhoto(false);
      }
    }
  };

  const handleGeneratePromptForEdit = async () => {
    if (!editPhotoConcept.trim()) {
      showToast('Digite uma breve ideia para a IA gerar o prompt.', 'info');
      return;
    }

    const catObj = categories.find((c) => c.id === editPhotoCategoryId);
    const catName = catObj ? catObj.name : 'Ensaio Fotográfico';

    try {
      setIsGeneratingEditPrompt(true);
      const generated = await generatePhotographyPromptWithAI(catName, editPhotoConcept);
      setEditPhotoPrompt(generated);
      showToast('Novo prompt gerado com sucesso pelo Gemini!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Erro ao gerar prompt com a IA.', 'error');
    } finally {
      setIsGeneratingEditPrompt(false);
    }
  };

  const handleSaveEditedPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPhoto) return;

    const finalImage = editPhotoPreview || editPhotoImageUrl.trim();
    if (!editPhotoName.trim()) {
      showToast('O nome da foto não pode ficar vazio.', 'error');
      return;
    }
    if (!editPhotoPrompt.trim()) {
      showToast('O prompt da foto não pode ficar vazio.', 'error');
      return;
    }
    if (!finalImage) {
      showToast('A foto precisa ter uma imagem válida.', 'error');
      return;
    }

    const updatedPhoto: ModelPhoto = {
      ...editingPhoto,
      name: editPhotoName.trim(),
      categoryId: editPhotoCategoryId || editingPhoto.categoryId,
      prompt: editPhotoPrompt.trim(),
      imageUrl: finalImage,
    };

    const updatedList = modelPhotos.map((p) => (p.id === editingPhoto.id ? updatedPhoto : p));
    saveModelPhotos(updatedList);
    showToast(`Foto modelo "${updatedPhoto.name}" editada e salva com sucesso!`, 'success');
    setEditingPhoto(null);
  };

  const confirmDeleteCategory = () => {
    if (!catToDelete) return;
    const updatedCats = categories.filter((c) => c.id !== catToDelete.id);
    const updatedPhotos = modelPhotos.filter((p) => p.categoryId !== catToDelete.id);
    saveCategories(updatedCats);
    saveModelPhotos(updatedPhotos);
    if (selectedCategory?.id === catToDelete.id) {
      setSelectedCategory(null);
    }
    showToast(`Categoria "${catToDelete.name}" removida com sucesso.`, 'info');
    setCatToDelete(null);
  };

  const confirmDeletePhoto = () => {
    if (!photoToDelete) return;
    const updatedPhotos = modelPhotos.filter((p) => p.id !== photoToDelete.id);
    saveModelPhotos(updatedPhotos);
    showToast(`Foto modelo "${photoToDelete.name}" removida.`, 'info');
    setPhotoToDelete(null);
  };

  // If a category is selected, render the photo gallery for that category
  if (selectedCategory) {
    const categoryPhotos = modelPhotos.filter((p) => p.categoryId === selectedCategory.id);

    return (
      <div className="space-y-6">
        {/* Back button & category banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <button
            onClick={() => setSelectedCategory(null)}
            className="flex items-center gap-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors w-fit cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar para Todas as Categorias
          </button>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => openEditCategoryModal(selectedCategory)}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 rounded-xl transition-all shadow-2xs cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              Editar Categoria
            </button>

            <button
              onClick={() => onNavigate('upload_models')}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-xl transition-all shadow-xs w-fit cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Adicionar Fotos Modelo
            </button>
          </div>
        </div>

        {/* Category Header Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-zinc-900 text-white border border-zinc-800 shadow-sm">
          <img
            src={selectedCategory.coverUrl}
            alt={selectedCategory.name}
            className="absolute inset-0 w-full h-full object-cover opacity-25"
          />
          <div className="relative p-6 sm:p-8 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-transparent flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400 bg-amber-950/70 px-2.5 py-1 rounded-md border border-amber-800/80">
                Galeria da Categoria
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold mt-2 tracking-tight">
                {selectedCategory.name}
              </h1>
              <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl mt-1 leading-relaxed">
                {selectedCategory.description || 'Sem descrição cadastrada.'}
              </p>
              <div className="flex items-center gap-4 mt-4 text-xs text-zinc-400">
                <span>{categoryPhotos.length} fotos modelo cadastradas</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => openEditCategoryModal(selectedCategory)}
              className="self-start sm:self-auto flex items-center gap-2 px-3 py-1.5 bg-black/60 hover:bg-amber-600 border border-white/20 rounded-xl text-xs font-semibold text-white backdrop-blur-xs transition-colors cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Editar Dados da Categoria</span>
            </button>
          </div>
        </div>

        {/* Photos Grid */}
        {categoryPhotos.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-3">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <ImageIcon className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-200">
              Nenhuma foto cadastrada nesta categoria ainda
            </h3>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              Cadastre imagens modelo com seus prompts de IA para que você possa utilizá-las na seleção dos clientes.
            </p>
            <button
              onClick={() => onNavigate('upload_models')}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-all shadow-xs mt-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Cadastrar Primeira Foto Modelo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5">
            {categoryPhotos.map((photo) => (
              <div
                key={photo.id}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                {/* Photo Preview 3:4 Vertical */}
                <div className="relative aspect-[3/4] bg-zinc-950 overflow-hidden group">
                  <img
                    src={photo.imageUrl}
                    alt={photo.name}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute top-2 right-2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => openEditPhotoModal(photo, e)}
                      className="p-1.5 bg-black/70 hover:bg-amber-600 text-white rounded-lg backdrop-blur-xs transition-colors cursor-pointer"
                      title="Editar foto modelo"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoToDelete({ id: photo.id, name: photo.name })}
                      className="p-1.5 bg-black/70 hover:bg-rose-600 text-white rounded-lg backdrop-blur-xs transition-colors cursor-pointer"
                      title="Excluir foto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Details & Prompt info */}
                <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between space-y-2.5 sm:space-y-3">
                  <div className="flex items-start justify-between gap-1.5">
                    <h4 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                      {photo.name}
                    </h4>
                    <button
                      type="button"
                      onClick={(e) => openEditPhotoModal(photo, e)}
                      className="text-[11px] sm:text-xs text-amber-600 dark:text-amber-400 hover:underline font-semibold shrink-0 cursor-pointer hidden sm:flex items-center gap-1"
                    >
                      <Pencil className="w-3 h-3" />
                      Editar
                    </button>
                  </div>

                  <div className="bg-zinc-50 dark:bg-zinc-800/60 p-2 sm:p-3 rounded-xl border border-zinc-200/70 dark:border-zinc-800">
                    <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">
                      <span className="font-semibold uppercase tracking-wider">Prompt IA</span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-zinc-700 dark:text-zinc-300 line-clamp-2 sm:line-clamp-3 font-mono leading-snug">
                      {photo.prompt}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleCopyPrompt(photo.prompt, photo.name)}
                      className="flex items-center justify-center gap-1 sm:gap-1.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold text-zinc-700 dark:text-zinc-200 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-xl transition-colors cursor-pointer"
                    >
                      <Copy className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                      <span>Copiar Prompt</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => openEditPhotoModal(photo, e)}
                      className="flex items-center justify-center gap-1 sm:gap-1.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800/80 rounded-xl transition-colors cursor-pointer"
                    >
                      <Pencil className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                      <span>Editar</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Category Modal */}
        {editingCategory && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
            onClick={() => setEditingCategory(null)}
          >
            <div
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40">
                <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-amber-600" />
                  Editar Categoria: {editingCategory.name}
                </h2>
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEditedCategory} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                    Nome da Categoria *
                  </label>
                  <input
                    type="text"
                    required
                    value={editCatName}
                    onChange={(e) => setEditCatName(e.target.value)}
                    placeholder="Ex: Ensaio Gestante, Corporativo..."
                    className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                    Descrição do Estilo
                  </label>
                  <textarea
                    rows={3}
                    value={editCatDescription}
                    onChange={(e) => setEditCatDescription(e.target.value)}
                    placeholder="Descreva o conceito visual, estilo e proposta da categoria..."
                    className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                    Imagem de Capa (Upload ou URL)
                  </label>
                  {editCatCoverUrl && (
                    <div className="relative mb-2 rounded-xl overflow-hidden max-h-36 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                      <img src={editCatCoverUrl} alt="Capa da categoria" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setEditCatCoverUrl('')}
                        className="absolute top-2 right-2 px-2 py-1 bg-black/70 hover:bg-rose-600 text-white rounded-lg text-xs transition-colors"
                      >
                        Trocar
                      </button>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <label className="flex items-center gap-2 px-3 py-2 text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-xl cursor-pointer transition-colors">
                      {isProcessingEditCover ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4 text-amber-600" />}
                      <span>Fazer upload de nova capa</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleEditCoverFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <input
                    type="url"
                    value={editCatCoverUrl.startsWith('data:') ? '' : editCatCoverUrl}
                    onChange={(e) => setEditCatCoverUrl(e.target.value)}
                    placeholder="Ou cole a URL direta: https://images.unsplash.com/..."
                    className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setEditingCategory(null)}
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
                  Editar Foto Modelo
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
                      value={editPhotoName}
                      onChange={(e) => setEditPhotoName(e.target.value)}
                      placeholder="Ex: Silhueta Gestante Golden Hour"
                      className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                      Categoria *
                    </label>
                    <select
                      value={editPhotoCategoryId}
                      onChange={(e) => setEditPhotoCategoryId(e.target.value)}
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
                  {editPhotoPreview && (
                    <div className="relative mb-3 w-40 sm:w-48 aspect-[3/4] mx-auto rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-200 dark:border-zinc-700 shadow-md">
                      <img src={editPhotoPreview} alt="Preview" className="w-full h-full object-cover object-top" />
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 px-3 py-2 text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-xl cursor-pointer transition-colors">
                      {isProcessingEditPhoto ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4 text-amber-600" />}
                      <span>Trocar imagem por arquivo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleEditPhotoFileChange}
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
                    value={editPhotoPrompt}
                    onChange={(e) => setEditPhotoPrompt(e.target.value)}
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
                        value={editPhotoConcept}
                        onChange={(e) => setEditPhotoConcept(e.target.value)}
                        placeholder="Ex: Adicionar iluminação suave de estúdio e fundo escuro..."
                        className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-zinc-800 border border-amber-200 dark:border-amber-800 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-hidden"
                      />
                      <button
                        type="button"
                        disabled={isGeneratingEditPrompt}
                        onClick={handleGeneratePromptForEdit}
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
                    <span>Salvar Foto Modelo</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Photo Confirmation Modal */}
        <ConfirmModal
          isOpen={!!photoToDelete}
          title="Excluir Foto Modelo"
          message={`Tem certeza de que deseja remover a foto "${photoToDelete?.name}"?`}
          confirmLabel="Excluir"
          cancelLabel="Cancelar"
          isDestructive={true}
          onConfirm={confirmDeletePhoto}
          onCancel={() => setPhotoToDelete(null)}
        />
      </div>
    );
  }

  // Categories Overview
  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Categorias & Galeria de Fotos Modelo
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Organize os estilos de ensaio (Gestante, Corporativo, Pré-Wedding, etc.), edite os dados das categorias e fotos modelo.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-xl transition-all shadow-xs w-fit cursor-pointer"
        >
          <FolderPlus className="w-4 h-4" />
          <span>Cadastrar Nova Categoria</span>
        </button>
      </div>

      {/* Categories Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => {
          const photoCount = modelPhotos.filter((p) => p.categoryId === cat.id).length;

          return (
            <div
              key={cat.id}
              onClick={() => setSelectedCategory(cat)}
              className="group cursor-pointer bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-amber-500/80 rounded-2xl overflow-hidden shadow-2xs hover:shadow-lg transition-all flex flex-col justify-between"
            >
              {/* Cover Image */}
              <div>
                <div className="relative aspect-16/10 bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <img
                    src={cat.coverUrl}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/85 via-zinc-950/20 to-transparent" />
                  
                  {/* Action buttons on top of card */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => openEditCategoryModal(cat, e)}
                      className="p-1.5 text-white bg-black/60 hover:bg-amber-600 rounded-lg backdrop-blur-xs transition-colors cursor-pointer"
                      title="Editar categoria"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCatToDelete({ id: cat.id, name: cat.name });
                      }}
                      className="p-1.5 text-white bg-black/60 hover:bg-rose-600 rounded-lg backdrop-blur-xs transition-colors cursor-pointer"
                      title="Excluir categoria"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                    <span className="text-xs font-semibold bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-white/10">
                      {photoCount} fotos modelo
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      {cat.name}
                    </h3>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 line-clamp-2 leading-relaxed">
                    {cat.description || 'Clique para visualizar a galeria e fotos desta categoria.'}
                  </p>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-5 pt-0">
                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={(e) => openEditCategoryModal(cat, e)}
                    className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <Pencil className="w-3 h-3" />
                    <span>Editar</span>
                  </button>

                  <div className="flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400 group-hover:translate-x-1 transition-transform">
                    <span>Abrir Galeria</span>
                    <span>→</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Nova Categoria */}
      {isCreateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={() => setIsCreateModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-amber-600" />
                Cadastrar Categoria de Ensaio
              </h2>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  Nome da Categoria *
                </label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Ex: Ensaio Gestante, Corporativo, Pré-Wedding..."
                  className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  Descrição do Estilo
                </label>
                <textarea
                  rows={3}
                  value={newCatDescription}
                  onChange={(e) => setNewCatDescription(e.target.value)}
                  placeholder="Descreva a estética, iluminação, paleta de cores ou conceito deste tipo de ensaio..."
                  className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  Imagem de Capa (Upload ou URL)
                </label>
                {newCatCoverUrl ? (
                  <div className="relative mb-2 rounded-xl overflow-hidden max-h-36 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                    <img src={newCatCoverUrl} alt="Capa" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setNewCatCoverUrl('')}
                      className="absolute top-2 right-2 px-2 py-1 bg-black/70 hover:bg-rose-600 text-white rounded-lg text-xs"
                    >
                      Remover
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mb-2">
                    <label className="flex items-center gap-2 px-3 py-2 text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-xl cursor-pointer transition-colors">
                      {isProcessingCover ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4 text-amber-600" />}
                      <span>Fazer upload de foto</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCoverFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
                <input
                  type="url"
                  value={newCatCoverUrl.startsWith('data:') ? '' : newCatCoverUrl}
                  onChange={(e) => setNewCatCoverUrl(e.target.value)}
                  placeholder="Ou cole a URL: https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Salvar Categoria</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Categoria */}
      {editingCategory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={() => setEditingCategory(null)}
        >
          <div
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Pencil className="w-4 h-4 text-amber-600" />
                Editar Categoria: {editingCategory.name}
              </h2>
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedCategory} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  Nome da Categoria *
                </label>
                <input
                  type="text"
                  required
                  value={editCatName}
                  onChange={(e) => setEditCatName(e.target.value)}
                  placeholder="Ex: Ensaio Gestante, Corporativo..."
                  className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  Descrição do Estilo
                </label>
                <textarea
                  rows={3}
                  value={editCatDescription}
                  onChange={(e) => setEditCatDescription(e.target.value)}
                  placeholder="Descreva a estética, iluminação, paleta de cores ou conceito..."
                  className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  Imagem de Capa (Upload ou URL)
                </label>
                {editCatCoverUrl && (
                  <div className="relative mb-2 rounded-xl overflow-hidden max-h-36 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                    <img src={editCatCoverUrl} alt="Capa da categoria" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setEditCatCoverUrl('')}
                      className="absolute top-2 right-2 px-2 py-1 bg-black/70 hover:bg-rose-600 text-white rounded-lg text-xs transition-colors"
                    >
                      Trocar
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <label className="flex items-center gap-2 px-3 py-2 text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-xl cursor-pointer transition-colors">
                    {isProcessingEditCover ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4 text-amber-600" />}
                    <span>Fazer upload de nova capa</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEditCoverFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <input
                  type="url"
                  value={editCatCoverUrl.startsWith('data:') ? '' : editCatCoverUrl}
                  onChange={(e) => setEditCatCoverUrl(e.target.value)}
                  placeholder="Ou cole a URL direta: https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
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

      {/* Modal de Exclusão de Categoria */}
      <ConfirmModal
        isOpen={!!catToDelete}
        title="Excluir Categoria"
        message={`Deseja realmente excluir a categoria "${catToDelete?.name}"?`}
        confirmLabel="Sim, Excluir Categoria"
        cancelLabel="Cancelar"
        isDestructive={true}
        onConfirm={confirmDeleteCategory}
        onCancel={() => setCatToDelete(null)}
      />
    </div>
  );
};
