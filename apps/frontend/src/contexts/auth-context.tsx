'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, apiClient, LoginRequest, RegisterRequest } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { DEMO_MODE, demoAuthService } from '@/lib/demo-mode';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated on mount
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentToken = apiClient.getToken();
      if (currentToken) {
        const response = await apiClient.getCurrentUser();
        setUser(response.user);
        setToken(currentToken);
      }
    } catch (error) {
      // Token invalid or expired
      apiClient.setToken(null);
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: LoginRequest) => {
    try {
      setLoading(true);
      const response = await apiClient.login(credentials);
      setUser(response.user);
      setToken(response.token);
      
      // Sync user progress with backend after successful login
      try {
        const { useUserProgressStore } = await import('@/stores/userProgress');
        await useUserProgressStore.getState().syncWithBackend();
      } catch (syncError) {
        console.warn('Failed to sync user progress after login:', syncError);
      }
      
      router.push('/dashboard');
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterRequest) => {
    try {
      setLoading(true);
      const response = await apiClient.register(userData);
      setUser(response.user);
      setToken(response.token);
      
      // Clear any existing user progress for truly new users
      localStorage.removeItem('user-progress');
      
      router.push('/dashboard');
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      // Even if logout fails on server, clear local state
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setToken(null);
      router.push('/login');
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    try {
      const response = await apiClient.updateProfile(updates);
      setUser(response.user);
    } catch (error) {
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (typeof window === 'undefined') {
    // Return default values during SSR
    return {
      user: null,
      token: null,
      loading: true,
      login: async () => {},
      register: async () => {},
      logout: async () => {},
      updateProfile: async () => {},
      isAuthenticated: false,
    } as AuthContextType;
  }
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Protected route component
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}