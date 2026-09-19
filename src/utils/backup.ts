import { Client, ModelPhoto, Category, AgencyPackage } from '../types';
import {
  getClients,
  getModelPhotos,
  saveClients,
  getCategories,
  saveCategories,
  saveModelPhotos,
  getAgencyPackages,
  saveAgencyPackages,
  saveAllRestoredData,
} from './storage';

export interface ClientBackupItem {
  id: string;
  name: string;
  whatsapp: string;
  email?: string;
  contractedSession: string;
  categoryId: string;
  status: string;
  token: string;
  selectionUrl: string;
  deliveryUrl: string;
  selectionSubmittedAt?: string;
  selectionNotes?: string;
  referencePhotoUrl?: string;
  source?: string;
  chosenPhotoCount: number;
  chosenPhotoIds: string[];
  chosenPhotos: Array<{
    id: string;
    name: string;
    prompt?: string;
    imageUrl?: string;
    categoryId?: string;
  }>;
  watermarkedPhotoCount: number;
  watermarkedPhotos?: Array<{
    id: string;
    name: string;
    imageUrl: string;
    approved?: boolean;
    clientFeedback?: string;
    createdAt: string;
  }>;
  finalPhotoCount: number;
  finalPhotos?: Array<{
    id: string;
    name: string;
    imageUrl: string;
    prompt?: string;
    createdAt: string;
  }>;
  createdAt: string;
  deliveredAt?: string;
}

export interface BackupPayload {
  metadata: {
    exportDate: string;
    system: string;
    version: string;
    type: 'preventive_backup';
    totalClients: number;
    totalCategories?: number;
    totalModelPhotos?: number;
    totalPackages?: number;
    totalChosenPhotos: number;
    totalFinalPhotos: number;
    environment: string;
  };
  summary: {
    byStatus: Record<string, number>;
    clientsWithSelection: number;
    clientsAwaitingSelection: number;
    lastUpdated: string;
  };
  clients: ClientBackupItem[];
  rawClients: Client[];
  categories?: Category[];
  modelPhotos?: ModelPhoto[];
  packages?: AgencyPackage[];
}

export interface BackupSettings {
  autoBackupEnabled: boolean;
  autoDownloadOnSelection: boolean;
  lastBackupTimestamp: string | null;
  lastBackupFileName: string | null;
}

const BACKUP_SETTINGS_KEY = 'photo_management_backup_settings_v1';
const AUTO_BACKUP_CACHE_KEY = 'photo_management_latest_auto_backup_v1';
const BACKUP_EVENT = 'studiophoto_backup_updated';

export const getBackupSettings = (): BackupSettings => {
  try {
    if (typeof window === 'undefined') {
      return {
        autoBackupEnabled: true,
        autoDownloadOnSelection: false,
        lastBackupTimestamp: null,
        lastBackupFileName: null,
      };
    }
    const raw = localStorage.getItem(BACKUP_SETTINGS_KEY);
    if (!raw) {
      const initial: BackupSettings = {
        autoBackupEnabled: true,
        autoDownloadOnSelection: false,
        lastBackupTimestamp: null,
        lastBackupFileName: null,
      };
      localStorage.setItem(BACKUP_SETTINGS_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return {
      autoBackupEnabled: true,
      autoDownloadOnSelection: false,
      lastBackupTimestamp: null,
      lastBackupFileName: null,
    };
  }
};

export const saveBackupSettings = (settings: Partial<BackupSettings>): BackupSettings => {
  const current = getBackupSettings();
  const updated: BackupSettings = { ...current, ...settings };
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(BACKUP_SETTINGS_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event(BACKUP_EVENT));
    }
  } catch (err) {
    console.warn('Failed to save backup settings:', err);
  }
  return updated;
};

// Generate complete structured backup data including clients, categories, model photos gallery, and packages
export const generateBackupData = (
  customClients?: Client[],
  customModelPhotos?: ModelPhoto[],
  customCategories?: Category[],
  customPackages?: AgencyPackage[]
): BackupPayload => {
  const clientsList = customClients || getClients();
  const photosList = customModelPhotos || getModelPhotos();
  const categoriesList = customCategories || getCategories();
  const packagesList = customPackages || getAgencyPackages();

  const baseUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname.replace(/\/$/, '')}`
    : '';

  const photosMap = new Map<string, ModelPhoto>();
  photosList.forEach((photo) => photosMap.set(photo.id, photo));

  const statusCount: Record<string, number> = {};
  let totalChosenPhotos = 0;
  let totalFinalPhotos = 0;
  let clientsWithSelection = 0;
  let clientsAwaitingSelection = 0;

  const enrichedClients: ClientBackupItem[] = clientsList.map((client) => {
    // Update metrics
    statusCount[client.status] = (statusCount[client.status] || 0) + 1;
    
    const chosenCount = (client.chosenPhotoIds || []).length;
    totalChosenPhotos += chosenCount;

    if (chosenCount > 0 || client.status === 'Selecionado' || client.status === 'Em produção') {
      clientsWithSelection++;
    }
    if (client.status === 'Aguardando seleção') {
      clientsAwaitingSelection++;
    }

    const finalCount = (client.finalPhotos || []).length;
    totalFinalPhotos += finalCount;

    // Enriched chosen photos with prompt and details
    const chosenPhotosDetails = (client.chosenPhotoIds || []).map((photoId) => {
      const found = photosMap.get(photoId);
      return {
        id: photoId,
        name: found?.name || `Foto ID: ${photoId}`,
        prompt: found?.prompt || undefined,
        imageUrl: found?.imageUrl || undefined,
        categoryId: found?.categoryId || client.categoryId,
      };
    });

    return {
      id: client.id,
      name: client.name,
      whatsapp: client.whatsapp,
      email: client.email,
      contractedSession: client.contractedSession,
      categoryId: client.categoryId,
      status: client.status,
      token: client.token,
      selectionUrl: `${baseUrl}#/selecao/${client.token}`,
      deliveryUrl: `${baseUrl}#/entrega/${client.token}`,
      selectionSubmittedAt: client.selectionSubmittedAt,
      selectionNotes: client.selectionNotes,
      referencePhotoUrl: client.referencePhotoUrl,
      source: client.source,
      chosenPhotoCount: chosenCount,
      chosenPhotoIds: client.chosenPhotoIds || [],
      chosenPhotos: chosenPhotosDetails,
      watermarkedPhotoCount: (client.watermarkedPhotos || []).length,
      watermarkedPhotos: (client.watermarkedPhotos || []).map((w) => ({
        id: w.id,
        name: w.name,
        imageUrl: w.imageUrl,
        approved: w.approved,
        clientFeedback: w.clientFeedback,
        createdAt: w.createdAt,
      })),
      finalPhotoCount: finalCount,
      finalPhotos: (client.finalPhotos || []).map((f) => ({
        id: f.id,
        name: f.name,
        imageUrl: f.imageUrl,
        prompt: f.prompt,
        createdAt: f.createdAt,
      })),
      createdAt: client.createdAt,
      deliveredAt: client.deliveredAt,
    };
  });

  const now = new Date().toISOString();

  return {
    metadata: {
      exportDate: now,
      system: 'StudioPhoto Gestão & Ensaios IA',
      version: '2.0.0',
      type: 'preventive_backup',
      totalClients: clientsList.length,
      totalCategories: categoriesList.length,
      totalModelPhotos: photosList.length,
      totalPackages: packagesList.length,
      totalChosenPhotos,
      totalFinalPhotos,
      environment: typeof window !== 'undefined' ? window.location.hostname : 'production',
    },
    summary: {
      byStatus: statusCount,
      clientsWithSelection,
      clientsAwaitingSelection,
      lastUpdated: now,
    },
    clients: enrichedClients,
    rawClients: clientsList,
    categories: categoriesList,
    modelPhotos: photosList,
    packages: packagesList,
  };
};

// Trigger immediate local download of the JSON file
export const downloadBackupJson = (
  customPayload?: BackupPayload,
  customFileName?: string
): { success: boolean; fileName: string } => {
  try {
    const payload = customPayload || generateBackupData();
    const jsonString = JSON.stringify(payload, null, 2);

    // Format filename with readable date: backup_studiophoto_completo_2026-09-02_13h05.json
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const timeStr = `${pad(now.getHours())}h${pad(now.getMinutes())}`;
    
    const fileName =
      customFileName ||
      `backup_studiophoto_completo_${dateStr}_${timeStr}.json`;

    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);

    // Update backup settings with timestamp and filename
    saveBackupSettings({
      lastBackupTimestamp: new Date().toISOString(),
      lastBackupFileName: fileName,
    });

    return { success: true, fileName };
  } catch (err) {
    console.error('Failed to download backup JSON:', err);
    return { success: false, fileName: '' };
  }
};

// Automatic backup: runs quietly in background, saves snapshot and syncs with server
export const triggerAutoBackup = async (
  customClients?: Client[],
  customModelPhotos?: ModelPhoto[],
  isNewSelectionReceived: boolean = false
): Promise<BackupPayload | null> => {
  const settings = getBackupSettings();
  if (!settings.autoBackupEnabled) {
    return null;
  }

  try {
    const payload = generateBackupData(customClients, customModelPhotos);
    const jsonString = JSON.stringify(payload);

    // 1. Cache latest auto-backup in localStorage
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(AUTO_BACKUP_CACHE_KEY, jsonString);
      }
    } catch (_) {
      // LocalStorage quota might be constrained if lots of base64 images exist
    }

    // 2. Persist to server backup directory
    try {
      await fetch('/api/backup/auto-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.warn('Auto backup server sync warning:', err);
    }

    // 3. If auto-download on selection is enabled and a new selection was just submitted
    if (isNewSelectionReceived && settings.autoDownloadOnSelection && typeof window !== 'undefined') {
      downloadBackupJson(payload);
    }

    // Update timestamp
    saveBackupSettings({
      lastBackupTimestamp: new Date().toISOString(),
    });

    return payload;
  } catch (err) {
    console.error('Auto backup execution error:', err);
    return null;
  }
};

export interface RestoreInspectionResult {
  valid: boolean;
  clientCount: number;
  categoryCount: number;
  modelPhotoCount: number;
  packageCount: number;
  chosenCount: number;
  exportDate?: string;
  hasCategories: boolean;
  hasModelPhotos: boolean;
  hasPackages: boolean;
  error?: string;
}

// Inspect backup content before restoring
export const inspectBackupJson = (jsonContent: string): RestoreInspectionResult => {
  try {
    const parsed = JSON.parse(jsonContent);
    let clientCount = 0;
    let chosenCount = 0;
    const exportDate = parsed.metadata?.exportDate || parsed.exportDate;

    if (Array.isArray(parsed.rawClients)) {
      clientCount = parsed.rawClients.length;
      chosenCount = parsed.rawClients.reduce(
        (acc: number, c: any) => acc + (c.chosenPhotoIds?.length || 0),
        0
      );
    } else if (Array.isArray(parsed.clients)) {
      clientCount = parsed.clients.length;
      chosenCount = parsed.clients.reduce(
        (acc: number, c: any) => acc + (c.chosenPhotoCount || c.chosenPhotoIds?.length || 0),
        0
      );
    } else {
      return {
        valid: false,
        clientCount: 0,
        categoryCount: 0,
        modelPhotoCount: 0,
        packageCount: 0,
        chosenCount: 0,
        hasCategories: false,
        hasModelPhotos: false,
        hasPackages: false,
        error: 'Estrutura do arquivo não reconhecida como backup válido (lista de clientes não encontrada).',
      };
    }

    const hasCategories = Array.isArray(parsed.categories);
    const categoryCount = hasCategories ? parsed.categories.length : 0;

    const hasModelPhotos = Array.isArray(parsed.modelPhotos);
    const modelPhotoCount = hasModelPhotos ? parsed.modelPhotos.length : 0;

    const hasPackages = Array.isArray(parsed.packages);
    const packageCount = hasPackages ? parsed.packages.length : 0;

    return {
      valid: true,
      clientCount,
      categoryCount,
      modelPhotoCount,
      packageCount,
      chosenCount,
      exportDate,
      hasCategories,
      hasModelPhotos,
      hasPackages,
    };
  } catch (err: any) {
    return {
      valid: false,
      clientCount: 0,
      categoryCount: 0,
      modelPhotoCount: 0,
      packageCount: 0,
      chosenCount: 0,
      hasCategories: false,
      hasModelPhotos: false,
      hasPackages: false,
      error: `Arquivo inválido: o conteúdo não é um JSON válido (${err.message || 'Erro de análise'}).`,
    };
  }
};

export interface RestoreExecutionResult {
  success: boolean;
  message: string;
  restoredClientsCount: number;
  restoredCategoriesCount?: number;
  restoredModelPhotosCount?: number;
  restoredPackagesCount?: number;
  clients?: Client[];
  categories?: Category[];
  modelPhotos?: ModelPhoto[];
  packages?: AgencyPackage[];
}

// Validate and restore data (clients, and optionally categories, model photos, and packages) from a backup JSON file
export const restoreDataFromBackupJson = async (
  jsonContent: string
): Promise<RestoreExecutionResult> => {
  try {
    const parsed = JSON.parse(jsonContent);

    let incomingClients: Client[] = [];

    // Support both rawClients and standard clients format
    if (Array.isArray(parsed.rawClients) && parsed.rawClients.length > 0) {
      incomingClients = parsed.rawClients;
    } else if (Array.isArray(parsed.clients) && parsed.clients.length > 0) {
      incomingClients = parsed.clients.map((c: any) => ({
        id: c.id,
        name: c.name || 'Cliente Sem Nome',
        whatsapp: c.whatsapp || '',
        email: c.email || undefined,
        contractedSession: c.contractedSession || 'Ensaio',
        categoryId: c.categoryId || 'cat-advogado-01',
        modelPhotoIds: c.modelPhotoIds || c.chosenPhotoIds || [],
        chosenPhotoIds: c.chosenPhotoIds || [],
        watermarkedPhotos: c.watermarkedPhotos || [],
        watermarkText: c.watermarkText,
        proofStatus: c.proofStatus,
        proofSubmittedAt: c.proofSubmittedAt,
        finalPhotos: c.finalPhotos || [],
        status: c.status || 'Aguardando seleção',
        token: c.token,
        selectionNotes: c.selectionNotes,
        referencePhotoUrl: c.referencePhotoUrl,
        source: c.source || 'admin',
        createdAt: c.createdAt || new Date().toISOString(),
        selectionSubmittedAt: c.selectionSubmittedAt,
        deliveredAt: c.deliveredAt,
      }));
    } else {
      return {
        success: false,
        message: 'O arquivo JSON fornecido não contém uma lista válida de clientes ou seleções.',
        restoredClientsCount: 0,
      };
    }

    const parts: string[] = [`${incomingClients.length} cliente(s)`];
    let restoredCategoriesCount: number | undefined;
    let restoredModelPhotosCount: number | undefined;
    let restoredPackagesCount: number | undefined;

    const incomingCategories = Array.isArray(parsed.categories) ? parsed.categories : undefined;
    const incomingModelPhotos = Array.isArray(parsed.modelPhotos) ? parsed.modelPhotos : undefined;
    const incomingPackages = Array.isArray(parsed.packages) ? parsed.packages : undefined;

    if (incomingCategories) {
      restoredCategoriesCount = incomingCategories.length;
      parts.push(`${incomingCategories.length} categoria(s)`);
    }

    if (incomingModelPhotos) {
      restoredModelPhotosCount = incomingModelPhotos.length;
      parts.push(`${incomingModelPhotos.length} foto(s) modelo`);
    }

    if (incomingPackages) {
      restoredPackagesCount = incomingPackages.length;
      parts.push(`${incomingPackages.length} pacote(s)`);
    }

    // Salva todas as entidades simultaneamente e aguarda a sincronização completa única com o servidor
    await saveAllRestoredData({
      clients: incomingClients,
      categories: incomingCategories,
      modelPhotos: incomingModelPhotos,
      packages: incomingPackages,
    });

    saveBackupSettings({
      lastBackupTimestamp: new Date().toISOString(),
    });

    return {
      success: true,
      message: `Backup restaurado com sucesso! (${parts.join(', ')})`,
      restoredClientsCount: incomingClients.length,
      restoredCategoriesCount,
      restoredModelPhotosCount,
      restoredPackagesCount,
      clients: incomingClients,
      categories: incomingCategories,
      modelPhotos: incomingModelPhotos,
      packages: incomingPackages,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Erro ao analisar o arquivo JSON: ${err.message || 'Arquivo corrompido ou formato inválido'}`,
      restoredClientsCount: 0,
    };
  }
};

// Backward-compatible alias
export const restoreClientsFromBackupJson = restoreDataFromBackupJson;

