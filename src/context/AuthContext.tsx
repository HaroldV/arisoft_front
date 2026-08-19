'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/infrastructure/api/api-client';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  tenant_id: string;
  tenant_status?: string;
  plan_is_active?: boolean;
  enabled_modules: string[];
  permissions?: string[];
  trial_days_left: number;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  login: (user: User, accessToken: string, refreshToken?: string) => void;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Restore session from localStorage on mount - SOLO en el navegador
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('ari_user');
      const storedToken = localStorage.getItem('ari_token');

      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
        setAccessToken(storedToken);
      }
    }
    setIsLoading(false);
  }, []);

  const login = (userData: User, token: string, refreshToken?: string) => {
    setUser(userData);
    setAccessToken(token);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ari_user', JSON.stringify(userData));
      localStorage.setItem('ari_token', token);
      if (refreshToken) {
        localStorage.setItem('ari_refresh_token', refreshToken);
      }
    }
    if (userData.role === 'SUPER_ADMIN') {
      router.push('/admin');
    } else {
      router.push('/');
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setAccessToken(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('ari_user');
        localStorage.removeItem('ari_token');
        localStorage.removeItem('ari_refresh_token');
      }
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
