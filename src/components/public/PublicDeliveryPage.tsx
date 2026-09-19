import React, { useState, useEffect } from 'react';
import {
  Camera,
  Download,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ExternalLink,
  Package,
  Eye,
  X,
} from 'lucide-react';
import { Client, FinalPhoto } from '../../types';
import { fetchPublicDeliveryData } from '../../utils/storage';
import { downloadImagesAsZip } from '../../utils/zip';

interface PublicDeliveryPageProps {
  token: string;
}

export const PublicDeliveryPage: React.FC<PublicDeliveryPageProps> = ({ token }) => {
  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState('');
  const [previewPhoto, setPreviewPhoto] = useState<FinalPhoto | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setIsLoading(true);
      const data = await fetchPublicDeliveryData(token);
      if (isMounted) {
        if (data) {
          setClient(data);
        }
        setIsLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [token]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-zinc-400">Carregando sua galeria de entrega...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-rose-950/80 text-rose-400 border border-rose-800 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold">Galeria Não Encontrada</h1>
          <p className="text-xs text-zinc-400 leading-relaxed">
            O link de entrega informado é inválido ou ainda não foi liberado. Verifique com seu fotógrafo.
          </p>
        </div>
      </div>
    );
  }

  const finalPhotos = client.finalPhotos || [];

  const handleDownloadAllZip = async () => {
    if (finalPhotos.length === 0) {
      alert('Nenhuma foto final disponível para download.');
      return;
    }

    try {
      setIsZipping(true);
      const items = finalPhotos.map((p, idx) => ({
        name: p.name || `Foto_${idx + 1}.jpg`,
        url: p.imageUrl,
      }));

      const zipFilename = `Ensaio_${client.name.replace(/\s+/g, '_')}_Final.zip`;
      await downloadImagesAsZip(items, zipFilename, (text) => setZipProgress(text));
    } catch (err) {
      alert('Ocorreu um erro ao gerar o arquivo ZIP.');
    } finally {
      setIsZipping(false);
      setZipProgress('');
    }
  };

  const handleDownloadSingleImage = (imageUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-amber-500 selection:text-black">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-600 flex items-center justify-center text-white shadow-xs">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-white">
              StudioPhoto • Entrega Final do Ensaio
            </h2>
            <p className="text-[11px] text-zinc-400">
              Cliente: <span className="text-amber-400 font-medium">{client.name}</span>
            </p>
          </div>
        </div>

        <button
          onClick={handleDownloadAllZip}
          disabled={isZipping || finalPhotos.length === 0}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-zinc-950 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 rounded-xl transition-all shadow-md cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">
            {isZipping ? zipProgress || 'Baixando...' : 'Baixar Todas (.ZIP)'}
          </span>
          <span className="sm:hidden">.ZIP</span>
        </button>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800/80 p-6 sm:p-10 text-center space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Ensaio Finalizado & Pronto para Download
          </span>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            Suas fotos estão prontas, {client.name}!
          </h1>

          <p className="text-xs sm:text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Aqui está a coleção final de imagens em alta definição do seu{' '}
            <strong className="text-zinc-200">{client.contractedSession}</strong>.
            Você pode baixar individualmente cada foto ou clicar no botão abaixo para baixar o pacote completo compactado em <strong className="text-amber-400">.ZIP</strong>.
          </p>

          <div className="pt-2">
            <button
              onClick={handleDownloadAllZip}
              disabled={isZipping || finalPhotos.length === 0}
              className="inline-flex items-center gap-2.5 px-6 py-3.5 text-sm font-bold text-zinc-950 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 rounded-2xl shadow-xl shadow-amber-500/10 transition-all hover:scale-102 cursor-pointer"
            >
              <Download className="w-5 h-5" />
              <span>{isZipping ? zipProgress || 'Compactando...' : 'Baixar Todas as Fotos (.ZIP)'}</span>
            </button>
          </div>
        </div>

        {/* Gallery */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">
              Galeria de Fotos Finais ({finalPhotos.length})
            </h3>
            <span className="text-xs text-zinc-500">
              Passe o mouse ou toque para baixar
            </span>
          </div>

          {finalPhotos.length === 0 ? (
            <div className="text-center py-16 bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
              <Package className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <h4 className="text-base font-semibold text-zinc-300">
                Nenhuma foto final disponibilizada ainda
              </h4>
              <p className="text-xs text-zinc-500 mt-1">
                Seu fotógrafo está finalizando a geração e edição das fotos.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {finalPhotos.map((photo, idx) => (
                <div
                  key={photo.id || idx}
                  className="group bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl overflow-hidden shadow-md flex flex-col justify-between transition-all"
                >
                  <div
                    onClick={() => setPreviewPhoto(photo)}
                    className="relative aspect-[3/4] bg-zinc-950 overflow-hidden cursor-pointer"
                  >
                    <img
                      src={photo.imageUrl}
                      alt={photo.name}
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute top-2 sm:top-3 left-2 sm:left-3 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg bg-black/75 text-white text-[10px] sm:text-[11px] font-bold backdrop-blur-xs border border-white/10">
                      #{idx + 1}
                    </div>

                    <div className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 p-1.5 sm:p-2 rounded-xl bg-black/70 text-white hover:bg-amber-500 hover:text-zinc-950 backdrop-blur-xs opacity-90 sm:opacity-0 group-hover:opacity-100 transition-all shadow-md">
                      <Eye className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                    </div>
                  </div>

                  <div className="p-2.5 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3 border-t border-zinc-800/80 bg-zinc-900/60">
                    <p className="text-[11px] sm:text-xs font-semibold text-zinc-200 truncate">
                      {photo.name || `Foto_${idx + 1}.jpg`}
                    </p>

                    <button
                      onClick={() => handleDownloadSingleImage(photo.imageUrl, photo.name || `Foto_${idx + 1}.jpg`)}
                      className="flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold text-zinc-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-colors shadow-2xs shrink-0 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Baixar</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lightbox Preview Modal */}
        {previewPhoto && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-150"
            onClick={() => setPreviewPhoto(null)}
          >
            <div
              className="relative max-w-4xl w-full bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/70">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    {previewPhoto.name || 'Foto Final'}
                  </h3>
                  <span className="text-xs text-amber-400 font-medium">
                    Alta Resolução • Proporção 3:4
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

              <div className="p-4 sm:p-6 flex-1 overflow-auto flex items-center justify-center bg-black/60">
                <img
                  src={previewPhoto.imageUrl}
                  alt={previewPhoto.name}
                  className="max-h-[68vh] w-auto max-w-full object-contain rounded-2xl shadow-2xl"
                />
              </div>

              <div className="p-4 sm:p-5 border-t border-zinc-800/80 bg-zinc-900/90 flex items-center justify-between gap-4">
                <p className="text-xs text-zinc-400 hidden sm:block">
                  Pronta para download individual em formato original de alta resolução.
                </p>
                <button
                  type="button"
                  onClick={() => handleDownloadSingleImage(previewPhoto.imageUrl, previewPhoto.name || 'Foto_Final.jpg')}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-zinc-950 bg-amber-500 hover:bg-amber-400 shadow-md transition-all cursor-pointer w-full sm:w-auto"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar Esta Foto Agora</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

