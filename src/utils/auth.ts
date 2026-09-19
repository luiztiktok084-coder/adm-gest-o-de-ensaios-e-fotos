// Authentication Utility for StudioPhoto Admin Access

export interface AuthUser {
  email: string;
  name: string;
  role: string;
  lastLogin: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
}

const AUTH_STORAGE_KEY = 'studiophoto_auth_session_v1';
const AUTH_EVENT = 'studiophoto_auth_changed';

// Check if user is currently authenticated
export const getAuthState = (): AuthState => {
  try {
    if (typeof window === 'undefined') {
      return { isAuthenticated: false, user: null };
    }
    const sessionData = localStorage.getItem(AUTH_STORAGE_KEY) || sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (!sessionData) {
      return { isAuthenticated: false, user: null };
    }
    const parsed = JSON.parse(sessionData);
    if (parsed && parsed.isAuthenticated && parsed.user) {
      return {
        isAuthenticated: true,
        user: parsed.user,
      };
    }
    return { isAuthenticated: false, user: null };
  } catch {
    return { isAuthenticated: false, user: null };
  }
};

const saveUserSession = (user: AuthUser, rememberMe: boolean) => {
  const sessionPayload = JSON.stringify({
    isAuthenticated: true,
    user,
  });

  try {
    if (rememberMe) {
      localStorage.setItem(AUTH_STORAGE_KEY, sessionPayload);
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    } else {
      sessionStorage.setItem(AUTH_STORAGE_KEY, sessionPayload);
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch (e) {
    console.warn('Could not store auth session:', e);
  }

  notifyAuthChanged();
};

// Perform login verification via backend API with offline fallback
export const loginUser = async (
  emailInput: string,
  passwordInput: string,
  rememberMe: boolean = true
): Promise<{ success: boolean; error?: string; user?: AuthUser }> => {
  const cleanEmail = emailInput.trim().toLowerCase();
  const cleanPassword = passwordInput.trim();

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.user) {
        saveUserSession(data.user, rememberMe);
        return { success: true, user: data.user };
      }
    } else {
      const errData = await res.json().catch(() => ({}));
      return {
        success: false,
        error: errData.error || 'E-mail ou senha incorretos. Verifique suas credenciais e tente novamente.',
      };
    }
  } catch {
    // Local fallback in case server route is unavailable
    if (
      cleanEmail === 'alunodosenai3@gmail.com' &&
      cleanPassword === 'Tudodebom2026@#'
    ) {
      const fallbackUser: AuthUser = {
        email: 'alunodosenai3@gmail.com',
        name: 'Administrador do Estúdio',
        role: 'Fotógrafo / Diretor Criativo',
        lastLogin: new Date().toISOString(),
      };
      saveUserSession(fallbackUser, rememberMe);
      return { success: true, user: fallbackUser };
    }
  }

  return {
    success: false,
    error: 'E-mail ou senha incorretos. Verifique suas credenciais e tente novamente.',
  };
};

// Perform logout
export const logoutUser = (): void => {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
  } catch (e) {
    console.warn('Could not clear auth session:', e);
  }
  notifyAuthChanged();
};

const notifyAuthChanged = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(AUTH_EVENT));
  }
};

export const subscribeToAuth = (callback: () => void): (() => void) => {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(AUTH_EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(AUTH_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
};
