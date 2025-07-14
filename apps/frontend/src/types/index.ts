export type LeadStatus = 'COLD' | 'WARM' | 'HOT' | 'CONVERTED' | 'LOST';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type Direction = 'INBOUND' | 'OUTBOUND';
export type MessageType = 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'AUDIO' | 'VIDEO';
export type MessageStatus = 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
export type InteractionType = 'CALL' | 'EMAIL' | 'WHATSAPP' | 'MEETING' | 'STATUS_CHANGE' | 'NOTE';
export type SuggestionType = 'MESSAGE' | 'FOLLOW_UP' | 'STATUS_CHANGE' | 'PRIORITY_UPDATE';

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  status: LeadStatus;
  source?: string;
  priority: Priority;
  assignedTo?: string;
  aiScore?: number;
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
  direction: Direction;
  messageType: MessageType;
  status: MessageStatus;
  whatsappId?: string;
  timestamp: string;
}

export interface Interaction {
  id: string;
  leadId: string;
  type: InteractionType;
  description: string;
  outcome?: string;
  scheduledAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface AISuggestion {
  id: string;
  leadId: string;
  type: SuggestionType;
  content: string;
  context?: string;
  confidence: number;
  approved: boolean;
  executed: boolean;
  createdAt: string;
  approvedAt?: string;
  executedAt?: string;
}

export interface DashboardStats {
  totalLeads: number;
  hotLeads: number;
  conversions: number;
  responseRate: number;
}

export interface AIAnalytics {
  totalSuggestions: number;
  approvedSuggestions: number;
  executedSuggestions: number;
  approvalRate: number;
  executionRate: number;
  averageConfidence: number;
}