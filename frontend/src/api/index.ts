import axios from 'axios';

interface RefreshTokenResponse {
  access: string;
}

// Export handleError as a standalone utility function
export function handleError(error: any) {
  if (error.response) {
    console.error('Server Error:', error.response.data);
  } else if (error.request) {
    console.error('Network Error:', error.request);
  } else {
    console.error('Error:', error.message);
  }
  return Promise.reject(error);
}

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  } else {
  }
  
  // Remove Content-Type header for FormData requests
  if (config.headers && config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  
  // Do NOT remove trailing slashes
  return config;
});

// Add response interceptor for token refresh
let isRefreshing = false;
let failedQueue: Array<((error?: any) => void)> = [];

const processQueue = (error?: any) => {
  failedQueue.forEach(cb => cb(error));
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401) {
      if (!originalRequest._retry) {
        originalRequest._retry = true;
        
        try {
          if (!isRefreshing) {
            isRefreshing = true;
            const refreshToken = localStorage.getItem('refresh_token');
            
            if (!refreshToken) {
              throw new Error('No refresh token available');
            }
            
            const refreshResponse = await axios.post<RefreshTokenResponse>(
              `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/token/refresh/`,
              { refresh: refreshToken },
              { headers: { 'Content-Type': 'application/json' } }
            );
            
            const { access } = refreshResponse.data;
            localStorage.setItem('access_token', access);
            
            originalRequest.headers.Authorization = `Bearer ${access}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          console.error('Refresh token error:', refreshError);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
          processQueue(error);
        }
      } else {
        return new Promise((resolve, reject) => {
          failedQueue.push((error) => {
            resolve(error);
            reject(error);
          });
        });
      }
    }
    return Promise.reject(error);
  }
);

export default api;