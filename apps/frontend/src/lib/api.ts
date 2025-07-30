import { DEMO_MODE, demoAuthService } from './demo-mode';
import { API_BASE_URL } from './config';

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

export interface TeamMember {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'owner' | 'admin' | 'manager' | 'member' | 'viewer';
  department?: string;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  permissions: Record<string, boolean>;
  avatar_url?: string;
  hired_date?: string;
  last_active_at?: string;
  invited_at: string;
  joined_at?: string;
  created_at: string;
  updated_at: string;
  is_registered: boolean;
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    // Try to get token from localStorage
    if (typeof window !== 'undefined') {
      if (DEMO_MODE) {
        this.token = demoAuthService.getToken();
      } else {
        this.token = localStorage.getItem('auth_token');
      }
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (DEMO_MODE) {
        demoAuthService.setToken(token);
      } else {
        if (token) {
          localStorage.setItem('auth_token', token);
        } else {
          localStorage.removeItem('auth_token');
        }
      }
    }
  }

  getToken(): string | null {
    if (DEMO_MODE) {
      return demoAuthService.getToken();
    }
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    // Add auth token if available
    const currentToken = this.getToken();
    if (currentToken) {
      headers.Authorization = `Bearer ${currentToken}`;
    }

    const config: RequestInit = {
      headers,
      ...options,
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      let errorMessage = `API request failed: ${response.status} ${response.statusText}`;
      
      // Try to get error details from response body
      try {
        const errorData = await response.json();
        if (errorData.error) {
          errorMessage = errorData.error;
        }
        if (errorData.details) {
          console.error('API Error details:', errorData.details);
        }
      } catch (parseError) {
        console.error('Failed to parse error response:', parseError);
      }
      
      if (response.status === 401) {
        // Token expired or invalid
        this.setToken(null);
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
      
      throw new Error(errorMessage);
    }

    return response.json();
  }

  // Auth methods
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    // Use demo mode if enabled
    if (DEMO_MODE) {
      return demoAuthService.login(credentials);
    }
    
    const response = await this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    // Store token after successful login
    this.setToken(response.token);
    return response;
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    // Use demo mode if enabled
    if (DEMO_MODE) {
      return demoAuthService.register(userData);
    }
    
    const response = await this.request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    // Store token after successful registration
    this.setToken(response.token);
    return response;
  }

  async getCurrentUser(): Promise<{ user: User }> {
    // Use demo mode if enabled
    if (DEMO_MODE) {
      return demoAuthService.getCurrentUser();
    }
    
    return this.request<{ user: User }>('/api/auth/me');
  }

  async logout(): Promise<{ message: string }> {
    // Use demo mode if enabled
    if (DEMO_MODE) {
      await demoAuthService.logout();
      return { message: 'Successfully logged out (Demo Mode)' };
    }
    
    const response = await this.request<{ message: string }>('/api/auth/logout', {
      method: 'POST',
    });
    
    // Clear token
    this.setToken(null);
    return response;
  }

  async updateProfile(updates: Partial<User>): Promise<{ user: User; message: string }> {
    // Use demo mode if enabled
    if (DEMO_MODE) {
      const result = await demoAuthService.updateProfile(updates);
      return { ...result, message: 'Profile updated successfully (Demo Mode)' };
    }
    
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

  async deleteAccount(): Promise<{ message: string; deletedEmail: string }> {
    // Use demo mode if enabled
    if (DEMO_MODE) {
      await demoAuthService.logout();
      return { 
        message: 'Account deleted successfully (Demo Mode)', 
        deletedEmail: 'demo@example.com' 
      };
    }
    
    const response = await this.request<{ message: string; deletedEmail: string }>('/api/auth/account', {
      method: 'DELETE',
    });
    
    // Clear token after successful deletion
    this.setToken(null);
    return response;
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

  // Integrations API
  async getIntegrations(): Promise<{
    integrations: any[];
    summary: {
      total: number;
      connected: number;
      available: number;
      premium: number;
    };
  }> {
    return this.request('/api/integrations');
  }

  async connectIntegration(data: {
    integrationId: string;
    authCode?: string;
    config?: Record<string, any>;
    redirectUri?: string;
  }): Promise<any> {
    return this.request('/api/integrations/connect', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async disconnectIntegration(integrationId: string): Promise<{ message: string }> {
    return this.request(`/api/integrations/${integrationId}`, {
      method: 'DELETE',
    });
  }

  async updateIntegration(integrationId: string, data: {
    enabled?: boolean;
    config?: Record<string, any>;
    settings?: Record<string, any>;
  }): Promise<any> {
    return this.request(`/api/integrations/${integrationId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async importData(data: {
    integrationId: string;
    fileData: string;
    fileName: string;
    mapping?: Record<string, string>;
  }): Promise<any> {
    return this.request('/api/integrations/import', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Stats API
  async getUserProgress(): Promise<{
    stage: string;
    stats: {
      contactsAdded: number;
      messagesSent: number;
      aiInteractions: number;
      templatesUsed: number;
      pipelineActions: number;
    };
    progressPercentage: number;
    nextStageRequirements: string[];
  }> {
    return this.request('/api/stats/user/progress');
  }

  async getDashboardStats(): Promise<{
    totalLeads: number;
    activeConversations: number;
    conversionRate: number;
    hotLeads: number;
    growth: {
      leads: number;
      conversations: number;
      hotLeads: number;
      conversionRate: number;
    };
  }> {
    return this.request('/api/stats/dashboard');
  }

  // Settings API
  async getAllSettings(): Promise<{
    whatsapp: any;
    ai: any;
    notifications: any;
    backup: any;
    appearance: any;
    updatedAt: string;
  }> {
    return this.request('/api/settings/all');
  }

  async updateWhatsAppSettings(settings: {
    businessPhone: string;
    displayName: string;
    welcomeMessage: string;
    businessAccountId?: string;
    phoneNumberId?: string;
    autoReply: boolean;
    webhookStatus: boolean;
  }): Promise<{ settings: any; message: string }> {
    return this.request('/api/settings/whatsapp', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async updateAISettings(settings: {
    confidenceThreshold: number;
    responseTone: 'professional' | 'friendly' | 'casual' | 'formal';
    businessContext?: string;
    autoScoring: boolean;
    autoSuggestions: boolean;
    autoFollowup: boolean;
  }): Promise<{ settings: any; message: string }> {
    return this.request('/api/settings/ai', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async updateNotificationSettings(settings: {
    email: {
      newLeads: boolean;
      whatsappMessages: boolean;
      aiSuggestions: boolean;
    };
    push: {
      urgentLeads: boolean;
      followupReminders: boolean;
    };
  }): Promise<{ settings: any; message: string }> {
    return this.request('/api/settings/notifications', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async updateBackupSettings(settings: {
    autoBackup: boolean;
    includeMessages: boolean;
    includeAIData: boolean;
    frequency: 'hourly' | 'every6hours' | 'daily' | 'weekly';
  }): Promise<{ settings: any; message: string }> {
    return this.request('/api/settings/backup', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async updateAppearanceSettings(settings: {
    theme: 'light' | 'dark' | 'system';
    primaryColor?: string;
    compactMode: boolean;
    showAnimations: boolean;
    highContrast: boolean;
  }): Promise<{ settings: any; message: string }> {
    return this.request('/api/settings/appearance', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async getBackupStatus(): Promise<{
    lastBackup: string;
    nextBackup: string;
    status: string;
    size: string;
  }> {
    return this.request('/api/settings/backup-status');
  }

  async exportData(type: 'contacts' | 'messages' | 'analytics'): Promise<Blob> {
    const response = await fetch(`${this.baseURL}/api/settings/export/${type}`, {
      headers: {
        Authorization: `Bearer ${this.getToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.status}`);
    }

    return response.blob();
  }

  // Reports API
  async getReports(params?: {
    period?: '7d' | '30d' | '90d' | '1y';
    reportType?: 'overview' | 'leads' | 'revenue' | 'activity';
  }): Promise<{
    success: boolean;
    data: {
      period: string;
      reportType: string;
      metrics: {
        totalLeads: number;
        convertedLeads: number;
        conversionRate: number;
        totalRevenue: number;
        avgDealSize: number;
        activePipelineValue: number;
        responseTime: number;
        messagesSent: number;
        callsMade: number;
        emailsSent: number;
      };
      trends: {
        leads: number;
        conversion: number;
        revenue: number;
        activity: number;
      };
      topPerformers: Array<{
        name: string;
        email: string;
        performance: number;
        change: number;
        trend: 'up' | 'down';
      }>;
      recentActivities: Array<{
        type: string;
        description: string;
        timestamp: string;
        user: string;
        status: string;
      }>;
      generatedAt: string;
    };
  }> {
    const searchParams = new URLSearchParams();
    if (params?.period) searchParams.set('period', params.period);
    if (params?.reportType) searchParams.set('reportType', params.reportType);
    
    return this.request(`/api/reports?${searchParams.toString()}`);
  }

  async getAnalytics(metric: 'conversion-funnel' | 'performance-trends', params?: {
    period?: '7d' | '30d' | '90d';
  }): Promise<{
    success: boolean;
    data: any;
    metric: string;
    period: string;
    generatedAt: string;
  }> {
    const searchParams = new URLSearchParams();
    if (params?.period) searchParams.set('period', params.period);
    
    return this.request(`/api/reports/analytics/${metric}?${searchParams.toString()}`);
  }

  // Team API
  async getTeamMembers(): Promise<TeamMember[]> {
    return this.request('/api/team');
  }

  async getTeamMember(id: string): Promise<TeamMember> {
    return this.request(`/api/team/${id}`);
  }

  async inviteTeamMember(data: {
    email: string;
    name: string;
    phone?: string;
    role?: 'owner' | 'admin' | 'manager' | 'member' | 'viewer';
    department?: string;
    permissions?: Record<string, boolean>;
  }): Promise<{
    success: boolean;
    member: TeamMember;
    message: string;
  }> {
    return this.request('/api/team/invite', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTeamMember(id: string, data: {
    name?: string;
    phone?: string;
    role?: 'owner' | 'admin' | 'manager' | 'member' | 'viewer';
    department?: string;
    status?: 'active' | 'inactive' | 'pending' | 'suspended';
    permissions?: Record<string, boolean>;
  }): Promise<{
    success: boolean;
    member: TeamMember;
    message: string;
  }> {
    return this.request(`/api/team/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async removeTeamMember(id: string): Promise<{
    success: boolean;
    message: string;
  }> {
    return this.request(`/api/team/${id}`, {
      method: 'DELETE',
    });
  }

  async getTeamStats(): Promise<{
    total_members: number;
    active_members: number;
    pending_invites: number;
    owners: number;
    admins: number;
    managers: number;
    members: number;
    viewers: number;
    active_last_week: number;
  }> {
    return this.request('/api/team/stats');
  }

  // Workflow API
  async getWorkflows(params?: {
    type?: 'n8n' | 'langgraph' | 'hybrid';
    status?: 'active' | 'inactive' | 'draft';
    tags?: string[];
  }): Promise<{
    success: boolean;
    workflows: any[];
    total: number;
  }> {
    const searchParams = new URLSearchParams();
    if (params?.type) searchParams.set('type', params.type);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.tags) searchParams.set('tags', params.tags.join(','));
    
    return this.request(`/api/workflows?${searchParams.toString()}`);
  }

  async getWorkflow(id: string): Promise<{
    success: boolean;
    workflow: any;
  }> {
    return this.request(`/api/workflows/${id}`);
  }

  async createWorkflow(data: {
    name: string;
    description: string;
    type: 'n8n' | 'langgraph' | 'hybrid';
    triggers: any[];
    nodes: any[];
    edges: any[];
    settings?: any;
  }): Promise<{
    success: boolean;
    workflow: any;
  }> {
    return this.request('/api/workflows', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async executeWorkflow(id: string, data?: {
    input?: Record<string, any>;
    triggeredBy?: string;
    config?: {
      streaming?: boolean;
      maxIterations?: number;
    };
  }): Promise<{
    success: boolean;
    execution: any;
  }> {
    return this.request(`/api/workflows/${id}/execute`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  }

  async getWorkflowExecutions(id: string, limit?: number): Promise<{
    success: boolean;
    executions: any[];
    total: number;
  }> {
    const searchParams = new URLSearchParams();
    if (limit) searchParams.set('limit', limit.toString());
    
    return this.request(`/api/workflows/${id}/executions?${searchParams.toString()}`);
  }

  async getWorkflowStats(): Promise<{
    success: boolean;
    stats: {
      totalWorkflows: number;
      activeWorkflows: number;
      totalExecutions: number;
      successRate: number;
      avgExecutionTime: number;
      categoryCounts: Record<string, number>;
    };
  }> {
    return this.request('/api/workflows/stats');
  }

  async getWorkflowTemplates(): Promise<{
    success: boolean;
    templates: Array<{
      id: string;
      name: string;
      description: string;
      type: 'n8n' | 'langgraph' | 'hybrid';
      category: string;
      difficulty: 'beginner' | 'intermediate' | 'advanced';
      estimatedTime: string;
      nodes: any[];
      benefits: string[];
    }>;
  }> {
    return this.request('/api/workflows/templates');
  }

  async updateWorkflowStatus(id: string, status: 'active' | 'inactive' | 'draft'): Promise<{
    success: boolean;
    workflow: any;
  }> {
    return this.request(`/api/workflows/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Performance/Monitoring API
  async getPerformanceMetrics(): Promise<{
    success: boolean;
    metrics: {
      averageResponseTime: number;
      errorRate: number;
      cacheHitRate: number;
      requestCount: number;
      memoryUsage: {
        rss: number;
        heapTotal: number;
        heapUsed: number;
        external: number;
      };
      activeConnections: number;
      uptime: number;
    };
  }> {
    return this.request('/api/performance/metrics');
  }

  async getPerformanceReport(): Promise<{
    success: boolean;
    report: any;
  }> {
    return this.request('/api/performance/report');
  }

  async getRouteMetrics(): Promise<{
    success: boolean;
    routes: Array<{
      path: string;
      method: string;
      count: number;
      averageTime: number;
      errors: number;
      successRate: number;
    }>;
  }> {
    return this.request('/api/performance/routes');
  }

  async getCacheStats(): Promise<{
    success: boolean;
    cache: {
      connected: boolean;
      keys: number;
      memory: string;
      hitRate?: number;
    };
  }> {
    return this.request('/api/performance/cache');
  }

  async getPerformanceAlerts(): Promise<{
    success: boolean;
    alerts: Array<{
      id: string;
      type: 'warning' | 'error' | 'info';
      message: string;
      timestamp: string;
      severity: 'low' | 'medium' | 'high';
      metric?: string;
      threshold?: number;
      currentValue?: number;
    }>;
  }> {
    return this.request('/api/performance/alerts');
  }

  async getSystemHealth(): Promise<{
    healthy: boolean;
    timestamp: string;
    metrics: {
      averageResponseTime: string;
      errorRate: string;
      cacheHitRate: string;
      memoryUsage: string;
      activeConnections: number;
    };
    cache?: {
      connected: boolean;
      keys: number;
      memory: string;
    };
    alerts: any[];
  }> {
    return this.request('/api/performance/health');
  }

  async warmupCache(): Promise<{
    success: boolean;
    message: string;
    results: Array<{
      route: string;
      status?: number;
      error?: string;
    }>;
  }> {
    return this.request('/api/performance/warmup', {
      method: 'POST',
    });
  }
}

export const apiClient = new ApiClient();
export default apiClient;