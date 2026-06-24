import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/auth.store';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // HttpOnly cookies are sent automatically
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// ─── Request Interceptor ─────────────────────────────────────────────────────
// Attach a correlation ID to every outgoing request
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    config.headers['x-request-id'] = crypto.randomUUID();
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response Interceptor ────────────────────────────────────────────────────
let isRefreshing = false;
let refreshSubscribers: Array<() => void> = [];

const subscribeTokenRefresh = (cb: () => void) => refreshSubscribers.push(cb);
const onTokenRefreshed = () => {
  refreshSubscribers.forEach((cb) => cb());
  refreshSubscribers = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // On 401, attempt a single token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue the request until refresh completes
        return new Promise((resolve) => {
          subscribeTokenRefresh(() => resolve(axiosInstance(originalRequest)));
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await axiosInstance.post('/auth/refresh');
        isRefreshing = false;
        onTokenRefreshed();
        return axiosInstance(originalRequest);
      } catch (_refreshError) {
        isRefreshing = false;
        refreshSubscribers = [];
        // Refresh failed → logout
        useAuthStore.getState().clearAuth();
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
