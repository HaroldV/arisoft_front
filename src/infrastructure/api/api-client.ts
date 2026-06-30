import axios from 'axios';

// Create a configured axios instance for the API calls
const apiClient = axios.create({
  baseURL: 'http://localhost:4000',
  withCredentials: true, // Send cookies cross-origin
});

// Request interceptor to attach access token
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('ari_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
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
      // Avoid looping if the failed request itself was the refresh call
      if (originalRequest.url?.includes('/auth/refresh')) {
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
        // Use a clean axios instance to refresh to avoid triggering interceptors
        const refreshResponse = await axios.post(
          'http://localhost:4000/auth/refresh',
          {},
          { withCredentials: true }
        );

        const { access_token } = refreshResponse.data;

        if (typeof window !== 'undefined') {
          localStorage.setItem('ari_token', access_token);
        }

        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        
        processQueue(null, access_token);
        isRefreshing = false;

        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;

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
