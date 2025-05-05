import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../../api';
import { useNavigate } from 'react-router-dom';

// Add all public and auth-related paths here
const publicPaths = [
  '/api/files/',
  '/api/files',
  '/api/token/',
  '/api/token/refresh/',
  '/api/register/',
];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // Skip refresh for public/auth endpoints or if already retried
    if (
      publicPaths.some(path => originalRequest.url?.endsWith(path)) ||
      originalRequest._retry
    ) {
      return Promise.reject(error);
    }

    if (error.response.status === 401) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) throw new Error('No refresh token available');
        const response = await api.post<TokenRefreshResponse>('/api/token/refresh/', { refresh: refreshToken });
        const { data } = response;
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        throw refreshError;
      }
    }
    return Promise.reject(error);
  }
);

interface User {
  id: number;
  email: string;
  name: string;
}

interface TokenResponse {
  access: string;
  refresh: string;
}

interface TokenRefreshResponse {
  access: string;
  refresh: string;
}

interface UserResponse {
  id: number;
  email: string;
  name: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  setUser: (user: User | null) => void;
  refreshUser: () => Promise<void>;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string, name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const login = async (email: string, password: string) => {
    const response = await api.post<TokenResponse>('/api/token/', {
      email,
      password,
    });

    if (response.data.access && response.data.refresh) {
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      
      const userData = await api.get<UserResponse>('/api/me/');
      setUser(userData.data);
      navigate('/dashboard');
    }
  };

  const logout = () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      api.post('/api/logout/', { refresh_token: refreshToken })
        .catch((error) => {
          console.error('Failed to blacklist refresh token:', error);
        });
    }

    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    navigate('/login');
  };

  const register = async (email: string, password: string, name: string) => {
    const response = await api.post<TokenResponse>('/api/register/', {
      email,
      password,
      name,
    });

    if (response.data.access && response.data.refresh) {
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      
      const userData = await api.get<UserResponse>('/api/me/');
      setUser(userData.data);
      navigate('/dashboard');
    }
  };

  const refreshUser = async () => {
    try {
      const userData = await api.get<UserResponse>('/api/me/');
      setUser(userData.data);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  // Check for tokens on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (token) {
          const userData = await api.get<UserResponse>('/api/me/');
          setUser(userData.data);
        }
        setLoading(false);
      } catch (error) {
        setLoading(false);
        // Only redirect to login if not already on login or register page
        if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          setUser(null);
          window.location.href = '/login';
        }
      }
    };

    checkAuth();
  }, []);

  const value = {
    isAuthenticated: !!user,
    user,
    setUser,
    refreshUser,
    loading,
    login,
    logout,
    register,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};