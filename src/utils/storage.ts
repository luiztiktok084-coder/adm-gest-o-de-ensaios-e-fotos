import { Category, ModelPhoto, Client, ApiSettings, AgencyPackage, WatermarkedPhoto } from '../types';

const STORAGE_KEYS = {
  CATEGORIES: 'photo_management_categories',
  MODEL_PHOTOS: 'photo_management_model_photos',
  CLIENTS: 'photo_management_clients',
  API_SETTINGS: 'photo_management_api_settings',
  PACKAGES: 'photo_management_packages',
};

export const INITIAL_PACKAGES: AgencyPackage[] = [];

// Initial Seed Data - Advogado Ensaio 01
const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'cat-advogado-01',
    name: 'Advogado Ensaio 01',
    description: 'Ensaio fotográfico profissional para advogados, escritórios jurídicos e autoridades do direito.',
    coverUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
    createdAt: new Date().toISOString(),
  },
];

const INITIAL_MODEL_PHOTOS: ModelPhoto[] = [];
const INITIAL_CLIENTS: Client[] = [];

const INITIAL_API_SETTINGS: ApiSettings = {
  geminiApiKey: '',
  keyTier: 'Gratuito',
};

// In-memory runtime cache
let memoryCategories: Category[] | null = null;
let memoryModelPhotos: ModelPhoto[] | null = null;
let memoryClients: Client[] | null = null;
let memoryApiSettings: ApiSettings | null = null;
let memoryPackages: AgencyPackage[] | null = null;

// Legacy Mock IDs to purge permanently
const LEGACY_MOCK_CLIENT_IDS = ['cli-adv-1', 'cli-1', 'cli-2', 'cli-3'];
const LEGACY_MOCK_PHOTO_IDS = [
  'photo-adv-1', 'photo-adv-2', 'photo-adv-3', 'photo-adv-4', 'photo-adv-5', 'photo-adv-6', 'photo-adv-7',
  'photo-101', 'photo-102', 'photo-103', 'photo-104', 'photo-105', 'photo-106', 'photo-107', 'photo-108'
];
const LEGACY_MOCK_PACKAGE_IDS = ['pkg-1', 'pkg-2', 'pkg-3', 'pkg-4'];

// Clean migration to purge all fake mock data from browser localStorage
const MIGRATION_VERSION_KEY = 'photo_management_pure_user_data_v4';
const runInitialDataCleanup = () => {
  try {
    if (typeof window === 'undefined') return;
    const migrated = localStorage.getItem(MIGRATION_VERSION_KEY);
    if (!migrated) {
      // Clean clients in localStorage
      const rawClients = localStorage.getItem(STORAGE_KEYS.CLIENTS);
      if (rawClients) {
        try {
          const parsed = JSON.parse(rawClients);
          if (Array.isArray(parsed)) {
            const clean = parsed.filter((c: Client) => !LEGACY_MOCK_CLIENT_IDS.includes(c.id));
            localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clean));
            memoryClients = clean;
          }
        } catch (_) {}
      }

      // Clean model photos in localStorage
      const rawPhotos = localStorage.getItem(STORAGE_KEYS.MODEL_PHOTOS);
      if (rawPhotos) {
        try {
          const parsed = JSON.parse(rawPhotos);
          if (Array.isArray(parsed)) {
            const clean = parsed.filter((p: ModelPhoto) => !LEGACY_MOCK_PHOTO_IDS.includes(p.id));
            localStorage.setItem(STORAGE_KEYS.MODEL_PHOTOS, JSON.stringify(clean));
            memoryModelPhotos = clean;
          }
        } catch (_) {}
      }

      // Clean packages in localStorage (purge unedited legacy mock packages)
      const rawPackages = localStorage.getItem(STORAGE_KEYS.PACKAGES);
      if (rawPackages) {
        try {
          const parsed = JSON.parse(rawPackages);
          if (Array.isArray(parsed)) {
            const clean = parsed.filter((p: AgencyPackage) => !LEGACY_MOCK_PACKAGE_IDS.includes(p.id));
            localStorage.setItem(STORAGE_KEYS.PACKAGES, JSON.stringify(clean));
            memoryPackages = clean;
          }
        } catch (_) {}
      } else {
        localStorage.setItem(STORAGE_KEYS.PACKAGES, JSON.stringify([]));
        memoryPackages = [];
      }

      localStorage.setItem(MIGRATION_VERSION_KEY, 'true');
    }
  } catch (e) {
    console.warn('Migration cleanup error:', e);
  }
};
runInitialDataCleanup();

// Event Dispatcher for reactive multi-view/tab updates
const notifyStorageUpdate = () => {
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('app_storage_updated'));
    }
  } catch (e) {
    console.error('Failed to dispatch app_storage_updated event', e);
  }
};

// Async background sync with the server
const pushFullSyncToServer = async () => {
  try {
    const payload = {
      categories: getCategories(),
      modelPhotos: getModelPhotos(),
      clients: getClients(),
      apiSettings: getApiSettings(),
      packages: getAgencyPackages(),
    };

    await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    // Network or offline fallback
    console.warn('Sync to server warning:', err);
  }
};

// Pull latest data from server when available and merge safely
export const syncDataFromServer = async (): Promise<boolean> => {
  try {
    const res = await fetch('/api/data');
    if (!res.ok) return false;
    const data = await res.json();
    
    // 1. Categories - directly sync from server if valid array
    if (data.categories && Array.isArray(data.categories)) {
      memoryCategories = data.categories;
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(data.categories));
    }

    // 2. Model Photos - directly sync from server if valid array (filtering legacy mocks)
    if (data.modelPhotos && Array.isArray(data.modelPhotos)) {
      const cleanPhotos = data.modelPhotos.filter((p: ModelPhoto) => !LEGACY_MOCK_PHOTO_IDS.includes(p.id));
      memoryModelPhotos = cleanPhotos;
      localStorage.setItem(STORAGE_KEYS.MODEL_PHOTOS, JSON.stringify(cleanPhotos));
    }

    // 3. Clients - directly sync from server if valid array (filtering legacy mocks)
    if (data.clients && Array.isArray(data.clients)) {
      const cleanClients = data.clients.filter((c: Client) => !LEGACY_MOCK_CLIENT_IDS.includes(c.id));
      memoryClients = cleanClients;
      localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(cleanClients));
    }

    // 4. Packages (sync from server, filtering out unedited legacy mock packages)
    if (data.packages && Array.isArray(data.packages)) {
      const cleanPackages = data.packages.filter((p: AgencyPackage) => !LEGACY_MOCK_PACKAGE_IDS.includes(p.id));
      memoryPackages = cleanPackages;
      localStorage.setItem(STORAGE_KEYS.PACKAGES, JSON.stringify(cleanPackages));
    }

    if (data.apiSettings && !memoryApiSettings?.geminiApiKey) {
      memoryApiSettings = data.apiSettings;
      localStorage.setItem(STORAGE_KEYS.API_SETTINGS, JSON.stringify(data.apiSettings));
    }

    notifyStorageUpdate();
    return true;
  } catch (err) {
    console.warn('Could not sync data from server:', err);
    return false;
  }
};

export const getAgencyPackages = (): AgencyPackage[] => {
  if (memoryPackages !== null) return memoryPackages;
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PACKAGES);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.PACKAGES, JSON.stringify([]));
      memoryPackages = [];
      return [];
    }
    const parsed: AgencyPackage[] = JSON.parse(data);
    if (Array.isArray(parsed)) {
      const clean = parsed.filter((p: AgencyPackage) => !LEGACY_MOCK_PACKAGE_IDS.includes(p.id));
      memoryPackages = clean;
      return clean;
    }
    memoryPackages = [];
    return [];
  } catch {
    return memoryPackages || [];
  }
};

export const saveAgencyPackages = (packages: AgencyPackage[]): void => {
  memoryPackages = packages;
  try {
    localStorage.setItem(STORAGE_KEYS.PACKAGES, JSON.stringify(packages));
  } catch (err) {
    console.warn('Could not save packages to localStorage:', err);
  }
  notifyStorageUpdate();
  pushFullSyncToServer();
  try {
    fetch('/api/packages', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ packages }),
    }).catch(() => {});
  } catch (_) {}
};

export const getCategories = (): Category[] => {
  if (memoryCategories) return memoryCategories;
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
      memoryCategories = INITIAL_CATEGORIES;
      return INITIAL_CATEGORIES;
    }
    const parsed: Category[] = JSON.parse(data);
    memoryCategories = parsed;
    return parsed;
  } catch {
    return memoryCategories || INITIAL_CATEGORIES;
  }
};

export const saveCategories = (categories: Category[]): void => {
  memoryCategories = categories;
  try {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  } catch (err) {
    console.warn('Could not save categories to localStorage:', err);
  }
  notifyStorageUpdate();
  pushFullSyncToServer();
};

export const getModelPhotos = (): ModelPhoto[] => {
  if (memoryModelPhotos) return memoryModelPhotos;
  try {
    const data = localStorage.getItem(STORAGE_KEYS.MODEL_PHOTOS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.MODEL_PHOTOS, JSON.stringify(INITIAL_MODEL_PHOTOS));
      memoryModelPhotos = INITIAL_MODEL_PHOTOS;
      return INITIAL_MODEL_PHOTOS;
    }
    const parsed: ModelPhoto[] = JSON.parse(data);
    memoryModelPhotos = parsed;
    return parsed;
  } catch {
    return memoryModelPhotos || INITIAL_MODEL_PHOTOS;
  }
};

export const saveModelPhotos = (photos: ModelPhoto[]): void => {
  memoryModelPhotos = photos;
  try {
    localStorage.setItem(STORAGE_KEYS.MODEL_PHOTOS, JSON.stringify(photos));
  } catch (err) {
    console.warn('Could not save model photos to localStorage:', err);
  }
  notifyStorageUpdate();
  pushFullSyncToServer();
};

export const deleteModelPhoto = (id: string): void => {
  const current = getModelPhotos();
  const updated = current.filter((p) => p.id !== id);
  saveModelPhotos(updated);
  try {
    fetch(`/api/model-photos/${id}`, { method: 'DELETE' }).catch(() => {});
  } catch (_) {}
};

export const getClients = (): Client[] => {
  if (memoryClients) return memoryClients;
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CLIENTS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(INITIAL_CLIENTS));
      memoryClients = INITIAL_CLIENTS;
      return INITIAL_CLIENTS;
    }
    const parsed: Client[] = JSON.parse(data);
    memoryClients = parsed;
    return parsed;
  } catch {
    return memoryClients || INITIAL_CLIENTS;
  }
};

// Automated backup runner with debounce
let autoBackupTimer: any = null;
export const scheduleAutoBackup = (isNewSelection = false) => {
  if (typeof window === 'undefined') return;
  if (autoBackupTimer) clearTimeout(autoBackupTimer);
  autoBackupTimer = setTimeout(async () => {
    try {
      const { triggerAutoBackup } = await import('./backup');
      await triggerAutoBackup(undefined, undefined, isNewSelection);
    } catch (e) {
      console.warn('Auto backup background task warning:', e);
    }
  }, 1200);
};

export const saveClients = (clients: Client[]): void => {
  memoryClients = clients;
  try {
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
  } catch (err) {
    console.warn('Could not save clients to localStorage:', err);
  }
  notifyStorageUpdate();
  pushFullSyncToServer();
  scheduleAutoBackup(false);
};

export const deleteClient = (id: string): void => {
  const current = getClients();
  const updated = current.filter((c) => c.id !== id);
  saveClients(updated);
  try {
    fetch(`/api/clients/${id}`, { method: 'DELETE' }).catch(() => {});
  } catch (_) {}
};

export const getClientByToken = (token: string): Client | undefined => {
  const clients = getClients();
  return clients.find((c) => c.token === token);
};

export const updateClientByToken = (token: string, updater: (client: Client) => Client): Client | undefined => {
  const clients = getClients();
  const index = clients.findIndex((c) => c.token === token);
  if (index === -1) return undefined;
  
  const updatedClient = updater(clients[index]);
  clients[index] = updatedClient;
  saveClients(clients);
  return updatedClient;
};

// Asynchronous public fetchers that query the backend server directly
export const fetchPublicSelectionData = async (
  token: string
): Promise<{ client: Client; modelPhotos: ModelPhoto[]; packages?: AgencyPackage[] } | null> => {
  try {
    // 1. Try server API first
    const res = await fetch(`/api/public/selection/${token}`);
    if (res.ok) {
      const data = await res.json();
      if (data.client) {
        // Also update local cache so it persists locally
        const clients = getClients();
        const existingIdx = clients.findIndex((c) => c.id === data.client.id);
        if (existingIdx >= 0) {
          clients[existingIdx] = data.client;
        } else {
          clients.unshift(data.client);
        }
        memoryClients = clients;
        try {
          localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
        } catch (_) {}

        if (data.packages && Array.isArray(data.packages)) {
          memoryPackages = data.packages;
          try {
            localStorage.setItem(STORAGE_KEYS.PACKAGES, JSON.stringify(data.packages));
          } catch (_) {}
        }

        return {
          ...data,
          packages: data.packages || getAgencyPackages(),
        };
      }
    }
  } catch (err) {
    console.warn('Server selection fetch failed, checking local storage:', err);
  }

  // 2. Fallback to local memory / storage
  const localClient = getClientByToken(token);
  if (localClient) {
    const allPhotos = getModelPhotos();
    const clientPhotos = allPhotos.filter((p) => localClient.modelPhotoIds.includes(p.id));
    return { client: localClient, modelPhotos: clientPhotos, packages: getAgencyPackages() };
  }

  return null;
};

export const submitPublicSelectionData = async (
  token: string,
  chosenPhotoIds: string[]
): Promise<Client | null> => {
  try {
    // 1. Send to server
    const res = await fetch(`/api/public/selection/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chosenPhotoIds }),
    });

    if (res.ok) {
      const result = await res.json();
      if (result.client) {
        updateClientByToken(token, () => result.client);
        scheduleAutoBackup(true);
        return result.client;
      }
    }
  } catch (err) {
    console.warn('Failed to submit selection to server API, updating local storage:', err);
  }

  // Fallback local update
  const updated = updateClientByToken(token, (c) => ({
    ...c,
    chosenPhotoIds,
    status: 'Selecionado',
    selectionSubmittedAt: new Date().toISOString(),
  }));

  scheduleAutoBackup(true);
  return updated || null;
};

export const fetchPublicDeliveryData = async (token: string): Promise<Client | null> => {
  try {
    const res = await fetch(`/api/public/delivery/${token}`);
    if (res.ok) {
      const data = await res.json();
      if (data.client) {
        return data.client;
      }
    }
  } catch (err) {
    console.warn('Delivery fetch failed on server, trying local:', err);
  }

  return getClientByToken(token) || null;
};

// Asynchronous public fetchers for Watermarked Photos / Proofing
export const fetchPublicProofData = async (
  token: string
): Promise<{ client: Client; packages?: AgencyPackage[] } | null> => {
  try {
    const res = await fetch(`/api/public/proof/${token}`);
    if (res.ok) {
      const data = await res.json();
      if (data.client) {
        const clients = getClients();
        const existingIdx = clients.findIndex((c) => c.id === data.client.id);
        if (existingIdx >= 0) {
          clients[existingIdx] = data.client;
        } else {
          clients.unshift(data.client);
        }
        memoryClients = clients;
        try {
          localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
        } catch (_) {}

        if (data.packages && Array.isArray(data.packages)) {
          memoryPackages = data.packages;
          try {
            localStorage.setItem(STORAGE_KEYS.PACKAGES, JSON.stringify(data.packages));
          } catch (_) {}
        }

        return {
          client: data.client,
          packages: data.packages || getAgencyPackages(),
        };
      }
    }
  } catch (err) {
    console.warn('Server proof fetch failed, checking local storage:', err);
  }

  const localClient = getClientByToken(token);
  if (localClient) {
    return { client: localClient, packages: getAgencyPackages() };
  }

  return null;
};

export const submitPublicProofData = async (
  token: string,
  watermarkedPhotos: WatermarkedPhoto[]
): Promise<Client | null> => {
  try {
    const res = await fetch(`/api/public/proof/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ watermarkedPhotos }),
    });

    if (res.ok) {
      const result = await res.json();
      if (result.client) {
        updateClientByToken(token, () => result.client);
        return result.client;
      }
    }
  } catch (err) {
    console.warn('Failed to submit proof to server API, updating local storage:', err);
  }

  const hasAdjustments = watermarkedPhotos.some((p) => (p.clientFeedback || '').trim().length > 0 && !p.approved);
  const proofStatus = hasAdjustments ? 'Ajustes solicitados' : 'Aprovado';

  const updated = updateClientByToken(token, (c) => ({
    ...c,
    watermarkedPhotos,
    proofStatus,
    proofSubmittedAt: new Date().toISOString(),
  }));

  return updated || null;
};

export interface PublicModelosData {
  categories: Category[];
  modelPhotos: ModelPhoto[];
  packages: AgencyPackage[];
}

export const fetchPublicModelosData = async (): Promise<PublicModelosData> => {
  try {
    const res = await fetch('/api/public/modelos');
    if (res.ok) {
      const data = await res.json();
      if (data.categories && data.modelPhotos) {
        return {
          categories: data.categories,
          modelPhotos: data.modelPhotos,
          packages: data.packages || getAgencyPackages(),
        };
      }
    }
  } catch (err) {
    console.warn('Fetch public modelos from server failed, using local cache:', err);
  }

  return {
    categories: getCategories(),
    modelPhotos: getModelPhotos(),
    packages: getAgencyPackages(),
  };
};

export interface ModelosLeadSubmission {
  name: string;
  whatsapp: string;
  email?: string;
  referencePhotoUrl?: string;
  selectedPhotoIds: string[];
  notes?: string;
}

export const submitModelosSelection = async (
  payload: ModelosLeadSubmission
): Promise<Client | null> => {
  try {
    const res = await fetch('/api/public/submit-modelos-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.client) {
        // Update local clients
        const clients = getClients();
        clients.unshift(data.client);
        memoryClients = clients;
        try {
          localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
        } catch (_) {}
        notifyStorageUpdate();
        return data.client;
      }
    }
  } catch (err) {
    console.warn('Server lead submission failed, generating local client:', err);
  }

  // Local fallback
  const firstPhoto = getModelPhotos().find((p) => payload.selectedPhotoIds.includes(p.id));
  const categoryId = firstPhoto?.categoryId || getCategories()[0]?.id || 'cat-outro';
  const token = `tok-outro-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const newClient: Client = {
    id: `cli-outro-${Date.now()}`,
    name: payload.name.trim(),
    whatsapp: payload.whatsapp.trim(),
    email: payload.email?.trim() || undefined,
    contractedSession: 'Outro',
    categoryId,
    modelPhotoIds: payload.selectedPhotoIds,
    chosenPhotoIds: payload.selectedPhotoIds,
    finalPhotos: [],
    referencePhotoUrl: payload.referencePhotoUrl || undefined,
    selectionNotes: payload.notes || 'Enviado através da página de Modelos de Ensaio Fotográfico',
    source: 'public_models_showcase',
    status: 'Selecionado',
    token,
    createdAt: new Date().toISOString(),
    selectionSubmittedAt: new Date().toISOString(),
  };

  const clients = getClients();
  clients.unshift(newClient);
  saveClients(clients);
  return newClient;
};

export const getApiSettings = (): ApiSettings => {
  if (memoryApiSettings) return memoryApiSettings;
  try {
    const data = localStorage.getItem(STORAGE_KEYS.API_SETTINGS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.API_SETTINGS, JSON.stringify(INITIAL_API_SETTINGS));
      memoryApiSettings = INITIAL_API_SETTINGS;
      return INITIAL_API_SETTINGS;
    }
    const parsed = JSON.parse(data);
    memoryApiSettings = parsed;
    return parsed;
  } catch {
    return memoryApiSettings || INITIAL_API_SETTINGS;
  }
};

export const saveApiSettings = (settings: ApiSettings): void => {
  memoryApiSettings = settings;
  try {
    localStorage.setItem(STORAGE_KEYS.API_SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.warn('Could not save api settings to localStorage:', err);
  }
  notifyStorageUpdate();
  pushFullSyncToServer();
};

export const generateUniqueToken = (prefix = 'tok'): string => {
  const randomStr = Math.random().toString(36).substring(2, 10);
  const timeStr = Date.now().toString(36).substring(4);
  return `${prefix}-${randomStr}-${timeStr}`;
};

/**
 * Faz upload de uma única imagem para o Vercel Blob através da rota /api/upload-image.
 * Aceita um arquivo File, Blob ou uma string em formato base64 / Data URL.
 * Retorna a URL pública permanente gerada no Vercel Blob (ou fallback local).
 */
export async function uploadImageToBlob(
  fileOrDataUrl: File | Blob | string,
  customFilename?: string
): Promise<string> {
  // Se já for uma URL externa ou blob http/https, não precisa reenviar
  if (typeof fileOrDataUrl === 'string') {
    if (fileOrDataUrl.startsWith('http://') || fileOrDataUrl.startsWith('https://')) {
      return fileOrDataUrl;
    }
  }

  try {
    let base64Data = '';
    let filename = customFilename || `foto-${Date.now()}.jpg`;

    if (typeof fileOrDataUrl === 'string') {
      base64Data = fileOrDataUrl;
    } else {
      if (fileOrDataUrl instanceof File) {
        filename = customFilename || fileOrDataUrl.name;
      }
      base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(fileOrDataUrl);
      });
    }

    const response = await fetch('/api/upload-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64Data,
        filename,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.url) {
        return data.url;
      }
    } else {
      const err = await response.json().catch(() => ({}));
      console.warn('Upload para Vercel Blob falhou, mantendo dados originais:', err);
    }
  } catch (err) {
    console.warn('Erro ao conectar na rota /api/upload-image:', err);
  }

  // Fallback seguro: se falhar o upload ou em modo offline, retorna o próprio DataURL
  if (typeof fileOrDataUrl === 'string') {
    return fileOrDataUrl;
  }
  return new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => resolve('');
    reader.readAsDataURL(fileOrDataUrl);
  });
}


