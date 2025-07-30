/**
 * User API Service
 * 
 * Handles all API calls related to user management, profile updates,
 * authentication, and user settings.
 */

import { API_BASE_URL } from '../config';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  bio?: string;
  avatar?: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileRequest {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  bio?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface WhatsAppSettings {
  businessPhone: string;
  displayName: string;
  welcomeMessage: string;
  businessAccountId: string;
  phoneNumberId: string;
  autoReply: boolean;
  webhookStatus: boolean;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class UserAPI {
  private baseURL: string;

  constructor() {
    this.baseURL = `${API_BASE_URL}/users`;
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        headers: {
          ...headers,
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || `HTTP ${response.status}`,
        };
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(): Promise<APIResponse<UserProfile>> {
    return this.request<UserProfile>('/profile');
  }

  /**
   * Update user profile
   */
  async updateProfile(data: UpdateProfileRequest): Promise<APIResponse<UserProfile>> {
    return this.request<UserProfile>('/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Change user password
   */
  async changePassword(data: ChangePasswordRequest): Promise<APIResponse<void>> {
    return this.request<void>('/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get WhatsApp settings
   */
  async getWhatsAppSettings(): Promise<APIResponse<WhatsAppSettings>> {
    return this.request<WhatsAppSettings>('/whatsapp-settings');
  }

  /**
   * Update WhatsApp settings
   */
  async updateWhatsAppSettings(data: WhatsAppSettings): Promise<APIResponse<WhatsAppSettings>> {
    return this.request<WhatsAppSettings>('/whatsapp-settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Upload user avatar
   */
  async uploadAvatar(file: File): Promise<APIResponse<{ avatarUrl: string }>> {
    try {
      const headers = await this.getAuthHeaders();
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch(`${this.baseURL}/avatar`, {
        method: 'POST',
        headers: {
          // Don't set Content-Type for FormData - browser will set it with boundary
          Authorization: headers.Authorization || '',
        },
        body: formData,
      });

      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || `HTTP ${response.status}`,
        };
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  /**
   * Delete user account
   */
  async deleteAccount(password: string): Promise<APIResponse<void>> {
    return this.request<void>('/delete-account', {
      method: 'DELETE',
      body: JSON.stringify({ password }),
    });
  }

  /**
   * Get user notification preferences
   */
  async getNotificationPreferences(): Promise<APIResponse<Record<string, boolean>>> {
    return this.request<Record<string, boolean>>('/notification-preferences');
  }

  /**
   * Update user notification preferences
   */
  async updateNotificationPreferences(preferences: Record<string, boolean>): Promise<APIResponse<void>> {
    return this.request<void>('/notification-preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
  }

  /**
   * Get user activity log
   */
  async getActivityLog(limit = 50): Promise<APIResponse<Array<{
    id: string;
    action: string;
    description: string;
    timestamp: string;
    ipAddress?: string;
    userAgent?: string;
  }>>> {
    return this.request(`/activity-log?limit=${limit}`);
  }

  /**
   * Get user sessions
   */
  async getSessions(): Promise<APIResponse<Array<{
    id: string;
    device: string;
    location?: string;
    ipAddress: string;
    lastActive: string;
    current: boolean;
  }>>> {
    return this.request('/sessions');
  }

  /**
   * Revoke user session
   */
  async revokeSession(sessionId: string): Promise<APIResponse<void>> {
    return this.request(`/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Enable two-factor authentication
   */
  async enableTwoFactor(): Promise<APIResponse<{
    qrCode: string;
    secret: string;
    backupCodes: string[];
  }>> {
    return this.request('/two-factor/enable', {
      method: 'POST',
    });
  }

  /**
   * Verify two-factor authentication setup
   */
  async verifyTwoFactor(token: string): Promise<APIResponse<{
    backupCodes: string[];
  }>> {
    return this.request('/two-factor/verify', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  /**
   * Disable two-factor authentication
   */
  async disableTwoFactor(password: string): Promise<APIResponse<void>> {
    return this.request('/two-factor/disable', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  }
}

// Create and export singleton instance
export const userAPI = new UserAPI();

// Export individual methods for convenience
export const {
  getProfile,
  updateProfile,
  changePassword,
  getWhatsAppSettings,
  updateWhatsAppSettings,
  uploadAvatar,
  deleteAccount,
  getNotificationPreferences,
  updateNotificationPreferences,
  getActivityLog,
  getSessions,
  revokeSession,
  enableTwoFactor,
  verifyTwoFactor,
  disableTwoFactor,
} = userAPI;