'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, Lead, Message, Conversation, AISuggestion, AIAnalytics } from '@/lib/api';

// Leads hooks
export function useLeads() {
  return useQuery({
    queryKey: ['leads'],
    queryFn: () => apiClient.getLeads(),
  });
}

export function useLead(id: string) {
  return useQuery({
    queryKey: ['leads', id],
    queryFn: () => apiClient.getLead(id),
    enabled: !!id,
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<Lead>) => apiClient.createLead(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Lead> }) => 
      apiClient.updateLead(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['leads', id] });
    },
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteLead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

// Messages hooks
export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: () => apiClient.getConversations(),
  });
}

export function useMessages(leadId: string) {
  return useQuery({
    queryKey: ['messages', leadId],
    queryFn: () => apiClient.getMessages(leadId),
    enabled: !!leadId,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { leadId: string; content: string; messageType?: string }) => 
      apiClient.sendMessage(data),
    onSuccess: (_, { leadId }) => {
      queryClient.invalidateQueries({ queryKey: ['messages', leadId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['leads', leadId] });
    },
  });
}

export function useMarkMessageAsRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (messageId: string) => apiClient.markMessageAsRead(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

// AI hooks
export function useAISuggestions(leadId: string) {
  return useQuery({
    queryKey: ['ai-suggestions', leadId],
    queryFn: () => apiClient.getAISuggestions(leadId),
    enabled: !!leadId,
  });
}

export function usePendingAISuggestions() {
  return useQuery({
    queryKey: ['ai-suggestions', 'pending'],
    queryFn: () => apiClient.getPendingAISuggestions(),
  });
}

export function useGenerateAISuggestions() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { leadId: string; type?: string; context?: string }) => 
      apiClient.generateAISuggestions(data),
    onSuccess: (_, { leadId }) => {
      queryClient.invalidateQueries({ queryKey: ['ai-suggestions', leadId] });
      queryClient.invalidateQueries({ queryKey: ['ai-suggestions', 'pending'] });
    },
  });
}

export function useApproveAISuggestion() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      suggestionId, 
      data 
    }: { 
      suggestionId: string; 
      data: { approved: boolean; modifiedContent?: string } 
    }) => apiClient.approveAISuggestion(suggestionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-suggestions'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}

export function useAIAnalytics() {
  return useQuery({
    queryKey: ['ai-analytics'],
    queryFn: () => apiClient.getAIAnalytics(),
  });
}

// WhatsApp hooks
export function useSendWhatsAppMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { phone: string; message: string }) => 
      apiClient.sendWhatsAppMessage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}