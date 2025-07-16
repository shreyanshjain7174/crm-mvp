import { User, AuthResponse, LoginRequest, RegisterRequest } from './api';

// Demo mode configuration - only enable when explicitly set or on GitHub Pages
const isExplicitlyEnabled = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
const isGitHubPages = typeof window !== 'undefined' && window.location.hostname.includes('github.io');

export const DEMO_MODE = isExplicitlyEnabled || isGitHubPages;

// Debug logging
console.log('Demo Mode Detection:', {
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_DEMO_MODE: process.env.NEXT_PUBLIC_DEMO_MODE,
  isExplicitlyEnabled,
  isGitHubPages,
  hostname: typeof window !== 'undefined' ? window.location.hostname : 'undefined',
  DEMO_MODE
});

// Demo user data
const DEMO_USER: User = {
  id: 'demo-user-1',
  email: 'demo@example.com',
  name: 'Demo User',
  company: 'Demo Company',
  createdAt: new Date().toISOString(),
  lastLoginAt: new Date().toISOString()
};

// Demo authentication service
export const demoAuthService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    console.log('Demo login called with:', credentials);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Accept any credentials in demo mode
    const token = `demo-token-${Date.now()}`;
    
    // Store token in localStorage
    localStorage.setItem('auth_token', token);
    localStorage.setItem('demo-user', JSON.stringify(DEMO_USER));
    
    console.log('Demo login success:', { token, user: DEMO_USER });
    
    return {
      user: DEMO_USER,
      token,
      message: 'Successfully logged in (Demo Mode)'
    };
  },

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const token = `demo-token-${Date.now()}`;
    const user: User = {
      id: `demo-user-${Date.now()}`,
      email: userData.email,
      name: userData.name,
      company: userData.company,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };
    
    // Store token in localStorage
    localStorage.setItem('auth_token', token);
    localStorage.setItem('demo-user', JSON.stringify(user));
    
    return {
      user,
      token,
      message: 'Successfully registered (Demo Mode)'
    };
  },

  async getCurrentUser(): Promise<{ user: User }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const token = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('demo-user');
    
    if (!token || !storedUser) {
      throw new Error('Not authenticated');
    }
    
    return {
      user: JSON.parse(storedUser)
    };
  },

  async logout(): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    localStorage.removeItem('auth_token');
    localStorage.removeItem('demo-user');
  },

  async updateProfile(updates: Partial<User>): Promise<{ user: User }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const storedUser = localStorage.getItem('demo-user');
    if (!storedUser) {
      throw new Error('Not authenticated');
    }
    
    const user = { ...JSON.parse(storedUser), ...updates };
    localStorage.setItem('demo-user', JSON.stringify(user));
    
    return { user };
  },

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  },

  setToken(token: string | null): void {
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }
};

// Demo notification system
export const showDemoNotification = (message: string, type: 'info' | 'success' | 'warning' = 'info') => {
  if (DEMO_MODE) {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-white font-medium ${
      type === 'success' ? 'bg-green-500' : 
      type === 'warning' ? 'bg-yellow-500' : 
      'bg-blue-500'
    }`;
    notification.textContent = `[DEMO] ${message}`;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }
};