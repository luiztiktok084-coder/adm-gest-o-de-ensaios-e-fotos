import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Check,
  Tag,
  DollarSign,
  Layers,
  Star,
} from 'lucide-react';
import { AgencyPackage } from '../../types';
import { getAgencyPackages, saveAgencyPackages } from '../../utils/storage';
import { useToast } from '../Toast';

interface PackageManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PackageManagementModal: React.FC<PackageManagementModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { showToast } = useToast();
  const [packages, setPackages] = useState<AgencyPackage[]>([]);

  useEffect(() => {
    if (isOpen) {
      setPackages(getAgencyPackages());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUpdatePackage = (index: number, field: keyof AgencyPackage, value: any) => {
    const updated = [...packages];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setPackages(updated);
  };

  const handleAddPackage = () => {
    const newPkg: AgencyPackage = {
      id: `pkg-${Date.now()}`,
      name: `Pacote ${packages.length + 1}`,
      photoCount: 5,
      price: '',
      description: '',
      badge: '',
      isPopular: false,
    };
    setPackages([...packages, newPkg]);
  };

  const handleDeletePackage = (index: number) => {
    const updated = packages.filter((_, i) => i !== index);
    setPackages(updated);
  };

  const handleSetPopular = (index: number) => {
    const updated = packages.map((pkg, i) => ({
      ...pkg,
      isPopular: i === index ? !pkg.isPopular : false,
    }));
    setPackages(updated);
  };

  const handleSave = () => {
    // Validate
    for (const pkg of packages) {
      if (!pkg.name.trim()) {
        showToast('Preencha o nome de todos os pacotes.', 'error');
        return;
      }
      if (!pkg.price.trim()) {
        showToast('Preencha o valor de todos os pacotes.', 'error');
        return;
      }
    }

    saveAgencyPackages(packages);
    showToast('Pacotes e valores atualizados com sucesso!', 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Gerenciar Pacotes & Valores dos Ensaios
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Personalize os nomes, valores, quantidade de fotos e destaques exibidos na página do cliente.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content: List of editable packages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 custom-scrollbar">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              Lista de Pacotes Cadastrados ({packages.length})
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleAddPackage}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Pacote</span>
              </button>
            </div>
          </div>

          {packages.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                <Tag className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                Nenhum pacote cadastrado
              </p>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Clique no botão "+ Adicionar Pacote" acima para definir os preços e a quantidade de fotos desejada para seus clientes.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {packages.map((pkg, index) => (
              <div
                key={pkg.id}
                className={`relative p-5 rounded-2xl border transition-all ${
                  pkg.isPopular
                    ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-400 dark:border-amber-700/60 shadow-md ring-1 ring-amber-400/20'
                    : 'bg-zinc-50/70 dark:bg-zinc-950/60 border-zinc-200 dark:border-zinc-800'
                }`}
              >
                {/* Top Badge and Controls */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                      #{index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSetPopular(index)}
                      className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
                        pkg.isPopular
                          ? 'bg-amber-500 text-zinc-950 font-bold'
                          : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-amber-500'
                      }`}
                      title="Marcar como pacote mais vendido / destaque"
                    >
                      <Star className={`w-3 h-3 ${pkg.isPopular ? 'fill-zinc-950' : ''}`} />
                      <span>{pkg.isPopular ? 'Mais Vendido (Destaque)' : 'Tornar Destaque'}</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeletePackage(index)}
                    className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                    title="Excluir pacote"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Form Fields */}
                <div className="space-y-3">
                  {/* Nome do Pacote */}
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Nome do Pacote
                    </label>
                    <input
                      type="text"
                      value={pkg.name}
                      onChange={(e) => handleUpdatePackage(index, 'name', e.target.value)}
                      placeholder="Ex: Pacote Profissional"
                      className="w-full px-3 py-2 text-xs font-semibold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Qtd Fotos e Preço */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        Qtd. de Fotos
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={pkg.photoCount}
                          onChange={(e) =>
                            handleUpdatePackage(index, 'photoCount', parseInt(e.target.value) || 1)
                          }
                          className="w-full pl-8 pr-3 py-2 text-xs font-semibold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                        <Layers className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        Valor (R$)
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={pkg.price}
                          onChange={(e) => handleUpdatePackage(index, 'price', e.target.value)}
                          placeholder="Ex: R$ 347,00"
                          className="w-full pl-8 pr-3 py-2 text-xs font-bold text-amber-600 dark:text-amber-400 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                        <DollarSign className="w-3.5 h-3.5 text-amber-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>
                  </div>

                  {/* Selo Promocional / Badge */}
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Selo / Tag Visual (Opcional)
                    </label>
                    <input
                      type="text"
                      value={pkg.badge || ''}
                      onChange={(e) => handleUpdatePackage(index, 'badge', e.target.value)}
                      placeholder="Ex: Mais Escolhido, Popular, Recomendado"
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Descrição */}
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Descrição & Vantagens
                    </label>
                    <textarea
                      rows={2}
                      value={pkg.description}
                      onChange={(e) => handleUpdatePackage(index, 'description', e.target.value)}
                      placeholder="O que está incluso neste pacote..."
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                    />
                  </div>
                </div>
              </div>
            ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40">
          <p className="text-xs text-zinc-500 text-center sm:text-left">
            As alterações são salvas e refletidas instantaneamente na página de seleção de todos os clientes.
          </p>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer text-center"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-xl transition-all shadow-md cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Salvar Alterações</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
