'use client';

import { useState, useEffect, createContext, useContext } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  company: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  devLogin: () => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

class AuthAPI {
  private baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';

  async login(email: string, password: string) {
    const response = await fetch(`${this.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    return response.json();
  }

  async devLogin() {
    const response = await fetch(`${this.baseUrl}/api/auth/dev-login`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Dev login failed');
    }

    return response.json();
  }

  async getProfile(token: string) {
    const response = await fetch(`${this.baseUrl}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get profile');
    }

    return response.json();
  }
}

const authAPI = new AuthAPI();

export function useAuthProvider() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing token on mount
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authAPI.login(email, password);
      
      setUser(response.user);
      setToken(response.token);
      
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const devLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authAPI.devLogin();
      
      setUser(response.user);
      setToken(response.token);
      
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Dev login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return {
    user,
    token,
    login,
    devLogin,
    logout,
    loading,
    error,
  };
}

// Auto-login helper for development
export async function autoDevLogin() {
  try {
    const response = await authAPI.devLogin();
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    return response;
  } catch (error) {
    console.error('Auto dev login failed:', error);
    throw error;
  }
}