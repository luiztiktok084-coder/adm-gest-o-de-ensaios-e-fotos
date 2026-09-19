import { Client, ModelPhoto } from '../types';
import { getClients, getModelPhotos, saveClients } from './storage';

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

// Generate complete structured backup data
export const generateBackupData = (
  customClients?: Client[],
  customModelPhotos?: ModelPhoto[]
): BackupPayload => {
  const clientsList = customClients || getClients();
  const photosList = customModelPhotos || getModelPhotos();

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
      version: '1.0.0',
      type: 'preventive_backup',
      totalClients: clientsList.length,
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

    // Format filename with readable date: backup_studiophoto_clientes_selecoes_2026-09-02_13h05.json
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const timeStr = `${pad(now.getHours())}h${pad(now.getMinutes())}`;
    
    const fileName =
      customFileName ||
      `backup_studiophoto_clientes_e_fotos_${dateStr}_${timeStr}.json`;

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

// Validate and restore data from a backup JSON file
export const restoreClientsFromBackupJson = (
  jsonContent: string
): { success: boolean; message: string; restoredCount: number; clients?: Client[] } => {
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
        restoredCount: 0,
      };
    }

    // Merge or replace: save clients
    saveClients(incomingClients);

    saveBackupSettings({
      lastBackupTimestamp: new Date().toISOString(),
    });

    return {
      success: true,
      message: `${incomingClients.length} cliente(s) e suas seleções foram restaurados com sucesso!`,
      restoredCount: incomingClients.length,
      clients: incomingClients,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Erro ao analisar o arquivo JSON: ${err.message || 'Arquivo corrompido ou formato inválido'}`,
      restoredCount: 0,
    };
  }
};
