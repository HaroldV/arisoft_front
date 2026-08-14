import axios from 'axios';
import { APP_CONFIG } from '@/constants/domain-constants';

// Create a configured axios instance for the API calls
const apiClient = axios.create({
  baseURL: APP_CONFIG.API_URL,
  withCredentials: true, // Send cookies cross-origin
});

let cachedToken: string | null = null;
let cachedTenantId: string | null = null;

// Request interceptor to attach access token and tenant ID dynamically
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('ari_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      const userStr = localStorage.getItem('ari_user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          const tenantId = user?.tenant_id || user?.tenantId || user?.tenant?.id;
          if (tenantId) {
            config.headers['x-tenant-id'] = tenantId;
          }
        } catch (e) {
          console.error('Error parsing user from localStorage for tenant header:', e);
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh automatically on 401
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 (Unauthorized) and has not been retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Avoid looping or attempting refresh for auth endpoints (login, register, refresh)
      if (
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/register') ||
        originalRequest.url?.includes('/auth/refresh')
      ) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const storedRefreshToken = typeof window !== 'undefined' ? localStorage.getItem('ari_refresh_token') : null;
        // Use a clean axios instance to refresh to avoid triggering interceptors
        const refreshResponse = await axios.post(
          `${APP_CONFIG.API_URL}/auth/refresh`,
          { refresh_token: storedRefreshToken },
          { withCredentials: true }
        );

        const { access_token, refresh_token: newRefreshToken } = refreshResponse.data;

        cachedToken = access_token;
        if (typeof window !== 'undefined') {
          localStorage.setItem('ari_token', access_token);
          if (newRefreshToken) {
            localStorage.setItem('ari_refresh_token', newRefreshToken);
          }
        }

        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        
        processQueue(null, access_token);
        isRefreshing = false;

        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        cachedToken = null;
        cachedTenantId = null;

        // Session is completely dead, clean up local storage and redirect
        if (typeof window !== 'undefined') {
          localStorage.removeItem('ari_user');
          localStorage.removeItem('ari_token');
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
