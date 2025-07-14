const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

// Auth interfaces
export interface User {
  id: string;
  email: string;
  name: string;
  company?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  message: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  company?: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  status: 'COLD' | 'WARM' | 'HOT' | 'CONVERTED' | 'LOST';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  source?: string;
  aiScore?: number;
  assignedTo?: string;
  businessProfile?: string;
  createdAt: string;
  updatedAt: string;
  messages?: Message[];
  interactions?: Interaction[];
  aiSuggestions?: AISuggestion[];
}

export interface Message {
  id: string;
  leadId: string;
  content: string;
  direction: 'INBOUND' | 'OUTBOUND';
  messageType: 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'AUDIO' | 'VIDEO';
  status: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  whatsappId?: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  name: string;
  phone: string;
  status: 'COLD' | 'WARM' | 'HOT' | 'CONVERTED' | 'LOST';
  messages: Message[];
}

export interface Interaction {
  id: string;
  leadId: string;
  type: 'CALL' | 'EMAIL' | 'WHATSAPP' | 'MEETING' | 'STATUS_CHANGE' | 'NOTE';
  description: string;
  outcome?: string;
  scheduledAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface AISuggestion {
  id: string;
  leadId: string;
  type: 'MESSAGE' | 'FOLLOW_UP' | 'STATUS_CHANGE' | 'PRIORITY_UPDATE';
  content: string;
  context?: string;
  confidence: number;
  approved: boolean;
  executed: boolean;
  createdAt: string;
  approvedAt?: string;
  executedAt?: string;
  lead?: {
    name: string;
    phone: string;
    status: string;
    priority: string;
  };
}

export interface AIAnalytics {
  totalSuggestions: number;
  approvedSuggestions: number;
  executedSuggestions: number;
  approvalRate: number;
  executionRate: number;
  averageConfidence: number;
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    // Try to get token from localStorage
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token);
      } else {
        localStorage.removeItem('auth_token');
      }
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    // Add auth token if available
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      headers,
      ...options,
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired or invalid
        this.setToken(null);
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Auth methods
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    // Store token after successful login
    this.setToken(response.token);
    return response;
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    // Store token after successful registration
    this.setToken(response.token);
    return response;
  }

  async getCurrentUser(): Promise<{ user: User }> {
    return this.request<{ user: User }>('/api/auth/me');
  }

  async logout(): Promise<{ message: string }> {
    const response = await this.request<{ message: string }>('/api/auth/logout', {
      method: 'POST',
    });
    
    // Clear token
    this.setToken(null);
    return response;
  }

  async updateProfile(updates: Partial<User>): Promise<{ user: User; message: string }> {
    return this.request<{ user: User; message: string }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async changePassword(passwords: { currentPassword: string; newPassword: string }): Promise<{ message: string }> {
    return this.request<{ message: string }>('/api/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify(passwords),
    });
  }

  // Leads API
  async getLeads(): Promise<Lead[]> {
    return this.request<Lead[]>('/api/leads');
  }

  async getLead(id: string): Promise<Lead> {
    return this.request<Lead>(`/api/leads/${id}`);
  }

  async createLead(data: Partial<Lead>): Promise<Lead> {
    return this.request<Lead>('/api/leads', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateLead(id: string, data: Partial<Lead>): Promise<Lead> {
    return this.request<Lead>(`/api/leads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteLead(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/leads/${id}`, {
      method: 'DELETE',
    });
  }

  // Messages API
  async getConversations(): Promise<Conversation[]> {
    return this.request<Conversation[]>('/api/messages/conversations');
  }

  async getMessages(leadId: string): Promise<Message[]> {
    return this.request<Message[]>(`/api/messages/lead/${leadId}`);
  }

  async sendMessage(data: { leadId: string; content: string; messageType?: string }): Promise<Message> {
    return this.request<Message>('/api/messages/send', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async markMessageAsRead(messageId: string): Promise<Message> {
    return this.request<Message>(`/api/messages/${messageId}/read`, {
      method: 'PUT',
    });
  }

  // AI API
  async getAISuggestions(leadId: string): Promise<AISuggestion[]> {
    return this.request<AISuggestion[]>(`/api/ai/suggestions/${leadId}`);
  }

  async getPendingAISuggestions(): Promise<AISuggestion[]> {
    return this.request<AISuggestion[]>('/api/ai/suggestions/pending');
  }

  async generateAISuggestions(data: { 
    leadId: string; 
    type?: string; 
    context?: string; 
  }): Promise<AISuggestion[]> {
    return this.request<AISuggestion[]>('/api/ai/suggest', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async approveAISuggestion(
    suggestionId: string, 
    data: { approved: boolean; modifiedContent?: string }
  ): Promise<AISuggestion> {
    return this.request<AISuggestion>(`/api/ai/suggestions/${suggestionId}/approve`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getAIAnalytics(): Promise<AIAnalytics> {
    return this.request<AIAnalytics>('/api/ai/analytics');
  }

  // WhatsApp API
  async sendWhatsAppMessage(data: { phone: string; message: string }): Promise<{ success: boolean; messageId: string }> {
    return this.request<{ success: boolean; messageId: string }>('/api/whatsapp/send', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const apiClient = new ApiClient();
export default apiClient;