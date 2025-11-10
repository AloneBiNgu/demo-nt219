import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { apiBaseUrl } from './baseUrl';
import { getAccessToken, refreshSession, signOut } from '../features/auth/session';

type PendingRequest = {
  resolve: (value: string) => void;
  reject: (reason?: unknown) => void;
};

let isRefreshing = false;
let pendingRequests: PendingRequest[] = [];

const processQueue = (error: unknown, token: string | null) => {
  pendingRequests.forEach((request) => {
    if (error) {
      request.reject(error);
      return;
    }
    if (token) {
      request.resolve(token);
    }
  });
  pendingRequests = [];
};

const setAuthHeader = (config: InternalAxiosRequestConfig, token: string) => {
  config.headers = config.headers ?? {};
  (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
};

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    setAuthHeader(config, token);
  }
  return config;
});

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (!originalRequest || error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<AxiosResponse>((resolve, reject) => {
        pendingRequests.push({
          resolve: (token: string) => {
            setAuthHeader(originalRequest, token);
            resolve(apiClient(originalRequest));
          },
          reject
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const newToken = await refreshSession();
      processQueue(null, newToken);
      setAuthHeader(originalRequest, newToken);
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      await signOut();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
