import axios from 'axios';
import { getCookie } from '../utils/cookies';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Attach CSRF token on every mutating request (Double-Submit Cookie pattern).
const SAFE_METHODS = new Set(['get', 'head', 'options']);
apiClient.interceptors.request.use((config) => {
  if (!SAFE_METHODS.has((config.method ?? 'get').toLowerCase())) {
    const csrf = getCookie('csrf_token');
    if (csrf) config.headers['X-CSRF-Token'] = csrf;
  }
  return config;
});

// Silent token refresh on 401 with parallel-request queuing.
let isRefreshing = false;
let failedQueue: Array<{ resolve: () => void; reject: (err: unknown) => void }> = [];

function processQueue(error: unknown): void {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve()));
  failedQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) return Promise.reject(error);

    const originalRequest = error.config as typeof error.config & { _retry?: boolean };
    // Skip refresh for session-probe calls — AuthContext handles the 401 itself.
    if ((originalRequest as { _noRefresh?: boolean })?._noRefresh) {
      return Promise.reject(error);
    }

    if (error.response?.status !== 401 || originalRequest?._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<void>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() => apiClient(originalRequest!));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL ?? '/api'}/auth/refresh`,
        {},
        { withCredentials: true },
      );
      processQueue(null);
      return apiClient(originalRequest!);
    } catch (refreshError) {
      processQueue(refreshError);
      const publicPaths = ['/login', '/register'];
      if (!publicPaths.includes(window.location.pathname)) {
        window.location.href = '/login';
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default apiClient;
