import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  Check,
  Send,
  AlertCircle,
  Sparkles,
  Loader2,
  Tag,
  Layers,
  Globe,
  TrendingUp,
  Zap,
  Settings,
  Video,
  Share2,
  MapPin,
  BookOpen,
  MessageCircle,
  Eye,
  X,
  Edit3,
  ShieldCheck,
  ThumbsUp,
  Info,
} from 'lucide-react';
import { Client, WatermarkedPhoto, AgencyPackage } from '../../types';
import { fetchPublicProofData, submitPublicProofData, getAgencyPackages } from '../../utils/storage';

interface PublicWatermarkedPageProps {
  token: string;
}

export const PublicWatermarkedPage: React.FC<PublicWatermarkedPageProps> = ({ token }) => {
  const [client, setClient] = useState<Client | null>(null);
  const [photos, setPhotos] = useState<WatermarkedPhoto[]>([]);
  const [packages, setPackages] = useState<AgencyPackage[]>([]);
  const [previewPhoto, setPreviewPhoto] = useState<WatermarkedPhoto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setIsLoading(true);
      const data = await fetchPublicProofData(token);
      if (isMounted) {
        if (data && data.client) {
          setClient(data.client);
          setPhotos(data.client.watermarkedPhotos || []);
          setPackages(data.packages && data.packages.length > 0 ? data.packages : getAgencyPackages());
          if (data.client.proofSubmittedAt) {
            setIsSubmitted(true);
          }
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
          <p className="text-sm font-medium text-zinc-400">Carregando sua prévia com marca d'água...</p>
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
          <h1 className="text-xl font-bold">Link de Aprovação Não Encontrado</h1>
          <p className="text-xs text-zinc-400 leading-relaxed">
            O link de aprovação informado é inválido ou expirou. Por favor, entre em contato com seu fotógrafo para obter um novo link de acesso.
          </p>
        </div>
      </div>
    );
  }

  const watermarkText = client.watermarkText?.trim() || 'PRÉVIA • NÃO COPIAR';

  const toggleApproval = (photoId: string) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === photoId ? { ...p, approved: !p.approved } : p))
    );
  };

  const handleFeedbackChange = (photoId: string, feedback: string) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === photoId ? { ...p, clientFeedback: feedback } : p))
    );
  };

  const handleConfirmProof = async () => {
    try {
      setIsSubmitting(true);
      const updated = await submitPublicProofData(token, photos);
      if (updated) {
        setClient(updated);
        setIsSubmitted(true);
      }
    } catch (err) {
      alert('Erro ao enviar suas respostas. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const approvedCount = photos.filter((p) => p.approved).length;
  const feedbackCount = photos.filter((p) => (p.clientFeedback || '').trim().length > 0).length;

  const agencyServices = [
    {
      title: 'Criação de sites',
      description: 'Websites modernos, velozes e 100% responsivos para converter visitantes em clientes.',
      icon: Globe,
    },
    {
      title: 'Criação de anúncios no Facebook e Instagram',
      description: 'Campanhas de tráfego pago focadas em retorno financeiro, geração de leads e vendas diárias.',
      icon: TrendingUp,
    },
    {
      title: 'Criação de anúncios no TikTok',
      description: 'Estratégias de vídeos dinâmicos e formatos de alta retenção para a plataforma de maior alcance.',
      icon: Zap,
    },
    {
      title: 'Configuração completa de contas de anúncios Facebook e Instagram',
      description: 'Instalação de Pixel, API de conversões, verificação de domínio e segurança da BM.',
      icon: Settings,
    },
    {
      title: 'Criação de vídeos para anúncios',
      description: 'Roteirização e edição profissional com ganchos fortes para maximizar as conversões.',
      icon: Video,
    },
    {
      title: 'Gerenciamento de redes sociais (Social media)',
      description: 'Planejamento editorial, posts com visual de autoridade, legendas e rotina estratégica.',
      icon: Share2,
    },
    {
      title: 'Gerenciamento de Google Negócio',
      description: 'Posicionamento nas primeiras posições das buscas locais e mapa da sua região.',
      icon: MapPin,
    },
    {
      title: 'Gerenciamento de Blog',
      description: 'Artigos otimizados com SEO para atrair clientes no Google de forma orgânica e contínua.',
      icon: BookOpen,
    },
  ];

  const whatsappMessage = encodeURIComponent(
    `Olá! Estava na página de aprovação de fotos (${client.name} - ${client.contractedSession}) e gostaria de saber mais sobre os serviços de marketing e os pacotes mensais da Agência!`
  );
  const whatsappUrl = `https://wa.me/5571992955846?text=${whatsappMessage}`;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-amber-500 selection:text-black pb-24">
      {/* Public Header */}
      <header className="sticky top-0 z-30 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-600 flex items-center justify-center text-white shadow-xs">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-white">
              StudioPhoto • Aprovação de Fotos
            </h2>
            <p className="text-[11px] text-zinc-400">
              Ensaio: <span className="text-amber-400 font-medium">{client.contractedSession}</span>
            </p>
          </div>
        </div>

        {/* Counter floating badge */}
        <div className="flex items-center gap-2 bg-zinc-800/90 border border-zinc-700/70 px-3.5 py-1.5 rounded-full text-xs font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>{approvedCount} de {photos.length} aprovadas</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-10">
        {/* Hero Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800/80 p-6 sm:p-10 text-center space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            Galeria de Aprovação & Prévia com Marca D'água
          </span>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            Olá, {client.name}!
          </h1>

          <p className="text-xs sm:text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Suas fotos geradas por Inteligência Artificial estão prontas para sua avaliação!
            Clique em <strong className="text-emerald-400 font-semibold">"Aprovar Foto"</strong> nas que você mais gostar. Se desejar algum ajuste em qualquer detalhe, utilize a <strong className="text-amber-300 font-semibold">área de texto abaixo de cada foto</strong> para descrever o que deseja corrigir.
          </p>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-zinc-800/80 border border-zinc-700 text-zinc-300 text-xs font-medium mt-1">
            <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>As fotos exibidas contêm a marca d'água de proteção <strong>"{watermarkText}"</strong>. As fotos finais serão entregues limpas e em alta resolução.</span>
          </div>

          {isSubmitted && (
            <div className="p-4 bg-emerald-950/60 border border-emerald-800 rounded-2xl max-w-lg mx-auto flex items-center gap-3 text-left mt-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs sm:text-sm font-bold text-emerald-200">
                  Avaliação enviada com sucesso!
                </p>
                <p className="text-[11px] text-emerald-400/90">
                  {approvedCount} fotos aprovadas e {feedbackCount} pedidos de ajustes registrados. O fotógrafo já foi notificado.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* PARTE DE CIMA: PACOTES E VALORES DOS ENSAIOS (SE CADASTRADOS) */}
        {/* ------------------------------------------------------------- */}
        {packages && packages.length > 0 && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <Tag className="w-4 h-4" />
                </div>
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Pacotes & Valores dos Ensaios Fotográficos
                </h2>
              </div>
              <span className="text-xs text-zinc-400">
                Quantidade ideal de fotos para a sua autoridade
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {packages.map((pkg) => {
                const isMatch = approvedCount === pkg.photoCount;
                return (
                  <div
                    key={pkg.id}
                    className={`relative flex flex-col justify-between p-5 rounded-2xl border transition-all duration-200 ${
                      pkg.isPopular
                        ? 'bg-gradient-to-b from-amber-500/10 via-zinc-900 to-zinc-900 border-amber-500/60 shadow-lg ring-1 ring-amber-500/30'
                        : isMatch
                        ? 'bg-zinc-900 border-amber-400 shadow-md'
                        : 'bg-zinc-900/70 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-xs font-bold text-zinc-200">
                        {pkg.name}
                      </span>
                      {pkg.badge && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-zinc-950 uppercase tracking-wider shadow-xs">
                          {pkg.badge}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 mb-3">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-amber-400 tracking-tight">
                          {pkg.price}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-semibold">
                        <Layers className="w-3.5 h-3.5 text-amber-500" />
                        <span>{pkg.photoCount} Fotos em Alta Resolução</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      {pkg.description}
                    </p>

                    {approvedCount > 0 && isMatch && (
                      <div className="mt-4 pt-3 border-t border-amber-500/30 flex items-center gap-1.5 text-[11px] font-bold text-amber-400">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Seu número de fotos aprovadas ({approvedCount} fotos)</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* MEIO: GALERIA DE FOTOS COM MARCA D'ÁGUA E CAMPOS DE CORREÇÃO   */}
        {/* ------------------------------------------------------------- */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <span>Fotos disponíveis para sua aprovação ({photos.length})</span>
            </h3>
            <span className="text-xs text-zinc-500">
              Clique na foto para marcar ou desmarcar
            </span>
          </div>

          {photos.length === 0 ? (
            <div className="text-center py-16 bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
              <p className="text-xs text-zinc-400">
                Nenhuma foto cadastrada para esta prévia ainda.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
              {photos.map((photo, index) => {
                const isApproved = !!photo.approved;

                return (
                  <div
                    key={photo.id || index}
                    className={`group relative rounded-2xl overflow-hidden border-2 transition-all duration-200 shadow-md select-none touch-manipulation flex flex-col justify-between ${
                      isApproved
                        ? 'border-amber-500 ring-2 sm:ring-4 ring-amber-500/25 shadow-amber-500/10 shadow-xl scale-[1.01]'
                        : 'border-zinc-800/90 hover:border-zinc-600 bg-zinc-900 hover:shadow-xl'
                    }`}
                  >
                    <div>
                      {/* Photo Container 3:4 Vertical with Watermark */}
                      <div
                        onClick={() => toggleApproval(photo.id)}
                        className="relative aspect-[3/4] bg-zinc-950 overflow-hidden cursor-pointer"
                      >
                        <img
                          src={photo.imageUrl}
                          alt={photo.name}
                          className={`w-full h-full object-cover object-top transition-transform duration-300 pointer-events-none ${
                            isApproved ? 'scale-105' : 'group-hover:scale-105'
                          }`}
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

                        {/* Top-Right Selection Checkmark Circle */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleApproval(photo.id);
                          }}
                          className={`absolute top-2 sm:top-3 right-2 sm:right-3 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all cursor-pointer z-10 ${
                            isApproved
                              ? 'bg-amber-500 text-zinc-950 shadow-lg scale-100 ring-2 ring-white/20'
                              : 'bg-black/60 text-white/70 border border-white/20 scale-90 group-hover:scale-100 hover:bg-black/90'
                          }`}
                          title={isApproved ? 'Desmarcar aprovação' : 'Aprovar foto'}
                        >
                          <Check className="w-3.5 sm:w-4 h-3.5 sm:h-4 stroke-[3]" />
                        </button>

                        {/* Top-Left Number Badge */}
                        <div className="absolute top-2 sm:top-3 left-2 sm:left-3 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg bg-black/75 text-white text-[10px] sm:text-[11px] font-bold backdrop-blur-xs border border-white/10">
                          #{index + 1}
                        </div>

                        {/* Zoom / Lightbox Eye Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewPhoto(photo);
                          }}
                          className="absolute bottom-10 sm:bottom-12 right-2 sm:right-3 p-1.5 sm:p-2 rounded-xl bg-black/70 hover:bg-amber-500 text-white hover:text-zinc-950 backdrop-blur-xs opacity-90 sm:opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-md z-10"
                          title="Ampliar foto em alta resolução"
                        >
                          <Eye className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                        </button>

                        {/* Bottom Title Bar */}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-2 sm:p-3 pt-4 sm:pt-6">
                          <p className="text-[11px] sm:text-xs font-semibold text-white truncate">
                            {photo.name}
                          </p>
                        </div>
                      </div>

                      {/* Correction Text Area Below Photo */}
                      <div className="p-2.5 sm:p-3 bg-zinc-900/90 border-t border-zinc-800 space-y-1.5">
                        <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <Edit3 className="w-3 h-3 text-amber-500" />
                            <span>Ajustes (opcional):</span>
                          </span>
                          {isApproved && (
                            <span className="text-[10px] font-bold text-amber-400">
                              Aprovada ✓
                            </span>
                          )}
                        </label>
                        <textarea
                          value={photo.clientFeedback || ''}
                          onChange={(e) => handleFeedbackChange(photo.id, e.target.value)}
                          placeholder="Descreva ajustes nesta foto caso deseje..."
                          rows={2}
                          className="w-full p-2 text-xs bg-zinc-950/80 border border-zinc-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 rounded-xl text-zinc-200 placeholder-zinc-600 resize-none transition-all leading-snug"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

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
              <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-zinc-800/80 bg-zinc-900/70">
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-base font-bold text-white truncate">
                    {previewPhoto.name}
                  </h3>
                  <span className="text-[10px] sm:text-xs text-amber-400 font-medium truncate block">
                    Visualização da Prévia • Marca D'água de Proteção
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewPhoto(null)}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Photo Display with Watermark */}
              <div className="p-3 sm:p-6 flex-1 overflow-auto flex items-center justify-center bg-black/80 relative select-none">
                <div className="relative max-h-[65vh] inline-block">
                  <img
                    src={previewPhoto.imageUrl}
                    alt={previewPhoto.name}
                    className="max-h-[65vh] w-auto max-w-full object-contain rounded-2xl shadow-2xl pointer-events-none"
                  />
                  {/* Watermark overlay */}
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

              {/* Footer Actions */}
              <div className="p-3 sm:p-5 border-t border-zinc-800/80 bg-zinc-900/90 flex items-center justify-between gap-3">
                <p className="text-xs text-zinc-400 hidden sm:block">
                  Clique no botão para aprovar ou desmarcar esta foto.
                </p>
                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      toggleApproval(previewPhoto.id);
                    }}
                    className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                      photos.find((p) => p.id === previewPhoto.id)?.approved
                        ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-md'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700'
                    }`}
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>
                      {photos.find((p) => p.id === previewPhoto.id)?.approved
                        ? 'Foto Aprovada ✓'
                        : 'Aprovar esta Foto'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Floating / Fixed Action Bar */}
        {photos.length > 0 && (
          <div className="fixed bottom-4 inset-x-3 sm:sticky sm:bottom-6 z-40 max-w-lg mx-auto p-3.5 sm:p-4 bg-zinc-900/95 backdrop-blur-md border border-zinc-700/80 rounded-2xl shadow-2xl space-y-2.5 sm:space-y-3 text-center">
            <div className="flex items-center justify-between text-xs px-1">
              <span className="text-zinc-400">Resumo da Avaliação:</span>
              <span className="font-bold text-amber-400 text-xs sm:text-sm">
                {approvedCount} fotos aprovadas • {feedbackCount} correções
              </span>
            </div>

            <button
              onClick={handleConfirmProof}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 text-xs sm:text-sm font-bold text-zinc-950 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enviando aprovações e correções...</span>
                </>
              ) : isSubmitted ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Atualizar Minhas Respostas ({approvedCount} aprovadas)</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Confirmar Aprovações e Enviar Correções</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* PARTE DE BAIXO: OUTROS SERVIÇOS DA AGÊNCIA                    */}
        {/* ------------------------------------------------------------- */}
        <section className="pt-8 border-t border-zinc-800/80 space-y-6">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              Soluções Completas de Marketing Digital
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Outros Serviços da Nossa Agência
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Transforme a autoridade visual das suas fotos em resultados reais de faturamento com nossos serviços especializados de marketing e tecnologia.
            </p>
          </div>

          {/* Grid de Serviços Solicitados */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {agencyServices.map((service, index) => {
              const IconComponent = service.icon;
              return (
                <div
                  key={index}
                  className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/90 hover:border-zinc-700 hover:bg-zinc-900 transition-all flex flex-col justify-between space-y-3 group"
                >
                  <div className="space-y-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center group-hover:scale-105 group-hover:bg-amber-500 group-hover:text-zinc-950 transition-all">
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-zinc-100 group-hover:text-amber-400 transition-colors">
                      {service.title}
                    </h3>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    {service.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Banner Especial de Pacotes Mensais com Todos os Serviços Juntos */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-600 via-amber-700 to-amber-900 p-6 sm:p-8 text-white shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-white/20 backdrop-blur-xs text-white border border-white/20">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Gestão 360° para sua Empresa</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight">
                Temos Pacotes com todos os Serviços Juntos mensal.
              </h3>
              <p className="text-xs sm:text-sm text-amber-100 leading-relaxed">
                Tenha um time completo cuidando do seu site, redes sociais, anúncios, Google e vídeos com acompanhamento contínuo e planos sob medida para seu negócio.
              </p>
            </div>

            <div className="shrink-0">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-white text-zinc-950 hover:bg-zinc-100 font-bold text-sm transition-all shadow-xl hover:scale-105 active:scale-95 cursor-pointer"
              >
                <MessageCircle className="w-5 h-5 text-emerald-600 fill-emerald-600" />
                <span>Falar no WhatsApp 71 - 9 9295 - 5846</span>
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
