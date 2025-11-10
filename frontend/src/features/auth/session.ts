import { apiBaseUrl } from '../../api/baseUrl';

const ACCESS_TOKEN_STORAGE_KEY = 'secure-commerce.accessToken';

let accessToken: string | null = null;
let hasHydratedFromStorage = false;

const isBrowser = typeof window !== 'undefined';

const readTokenFromStorage = () => {
  if (!isBrowser) return null;
  return window.sessionStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
};

const writeTokenToStorage = (token: string | null) => {
  if (!isBrowser) return;
  if (token) {
    window.sessionStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
  } else {
    window.sessionStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  }
};

export const getAccessToken = () => {
  if (!accessToken && !hasHydratedFromStorage) {
    accessToken = readTokenFromStorage();
    hasHydratedFromStorage = true;
  }
  return accessToken;
};

export const setAccessToken = (token: string | null) => {
  accessToken = token;
  writeTokenToStorage(token);
};

export const clearAccessToken = () => {
  accessToken = null;
  writeTokenToStorage(null);
};

export const ensureAccessToken = async (): Promise<string> => {
  const token = getAccessToken();
  if (token) {
    return token;
  }
  try {
    return await refreshSession();
  } catch (error) {
    clearAccessToken();
    throw error;
  }
};

export const refreshSession = async (): Promise<string> => {
  const response = await fetch(`${apiBaseUrl}/auth/refresh`, {
    method: 'POST',
    credentials: 'include', // Important: send cookies (refreshToken)
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({}) // Empty body - token comes from cookie
  });

  if (!response.ok) {
    throw new Error('Failed to refresh session');
  }

  const data = await response.json();
  const token = data?.data?.tokens?.accessToken as string;
  if (!token) {
    throw new Error('Refresh token response missing access token');
  }
  setAccessToken(token);
  return token;
};

export const signOut = async (): Promise<void> => {
  clearAccessToken();
};
