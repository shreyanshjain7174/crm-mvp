'use client';

import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '@/lib/config';

export interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  source?: string;
  notes?: string;
  tags: string[];
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  createdAt: string;
  updatedAt: string;
}

export interface ContactStats {
  total: number;
  recentlyAdded: number;
  byStatus: {
    active: number;
    inactive: number;
    blocked: number;
  };
  topSources: Array<{
    source: string;
    count: number;
  }>;
}

interface UseContactsOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  source?: string;
  sortBy?: string;
  sortOrder?: string;
}

interface ContactResponse {
  contacts: Contact[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class ContactsAPI {
  private baseUrl = API_BASE_URL;

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    let token = localStorage.getItem('token');
    
    // Auto-login for development if no token
    if (!token && process.env.NODE_ENV !== 'production') {
      try {
        const loginResponse = await fetch(`${this.baseUrl}/api/auth/dev-login`, {
          method: 'POST',
        });
        
        if (loginResponse.ok) {
          const loginData = await loginResponse.json();
          localStorage.setItem('token', loginData.token);
          localStorage.setItem('user', JSON.stringify(loginData.user));
          token = loginData.token;
        }
      } catch (error) {
        console.warn('Auto-login failed:', error);
      }
    }
    
    const response = await fetch(`${this.baseUrl}/api/contacts${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Clear invalid token
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getContacts(options: UseContactsOptions = {}): Promise<ContactResponse> {
    const params = new URLSearchParams();
    
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.search) params.append('search', options.search);
    if (options.status && options.status !== 'all') params.append('status', options.status);
    if (options.source && options.source !== 'all') params.append('source', options.source);
    if (options.sortBy) params.append('sortBy', options.sortBy);
    if (options.sortOrder) params.append('sortOrder', options.sortOrder);

    const query = params.toString();
    return this.request<ContactResponse>(query ? `?${query}` : '');
  }

  async getContactStats(): Promise<ContactStats> {
    return this.request<ContactStats>('/stats');
  }

  async getContact(id: string): Promise<Contact> {
    return this.request<Contact>(`/${id}`);
  }

  async createContact(contactData: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>): Promise<Contact> {
    return this.request<Contact>('', {
      method: 'POST',
      body: JSON.stringify(contactData),
    });
  }

  async updateContact(id: string, contactData: Partial<Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Contact> {
    return this.request<Contact>(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(contactData),
    });
  }

  async deleteContact(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/${id}`, {
      method: 'DELETE',
    });
  }

  async bulkOperation(action: 'delete' | 'update', contactIds: string[], updateData?: any): Promise<{
    success: boolean;
    deletedCount?: number;
    updatedCount?: number;
  }> {
    return this.request('/bulk', {
      method: 'POST',
      body: JSON.stringify({ action, contactIds, updateData }),
    });
  }
}

const contactsAPI = new ContactsAPI();

export function useContacts(options: UseContactsOptions = {}) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await contactsAPI.getContacts(options);
      setContacts(response.contacts);
      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch contacts');
      console.error('Error fetching contacts:', err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    options.page,
    options.limit,
    options.search,
    options.status,
    options.source,
    options.sortBy,
    options.sortOrder
  ]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const createContact = useCallback(async (contactData: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newContact = await contactsAPI.createContact(contactData);
      setContacts(prev => [newContact, ...prev]);
      return newContact;
    } catch (err) {
      console.error('Error creating contact:', err);
      throw err;
    }
  }, []);

  const updateContact = useCallback(async (id: string, contactData: Partial<Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>>) => {
    try {
      const updatedContact = await contactsAPI.updateContact(id, contactData);
      setContacts(prev => prev.map(contact => 
        contact.id === id ? updatedContact : contact
      ));
      return updatedContact;
    } catch (err) {
      console.error('Error updating contact:', err);
      throw err;
    }
  }, []);

  const deleteContact = useCallback(async (id: string) => {
    try {
      await contactsAPI.deleteContact(id);
      setContacts(prev => prev.filter(contact => contact.id !== id));
    } catch (err) {
      console.error('Error deleting contact:', err);
      throw err;
    }
  }, []);

  const bulkOperation = useCallback(async (action: 'delete' | 'update', contactIds: string[], updateData?: any) => {
    try {
      const result = await contactsAPI.bulkOperation(action, contactIds, updateData);
      
      if (action === 'delete') {
        setContacts(prev => prev.filter(contact => !contactIds.includes(contact.id)));
      } else if (action === 'update' && updateData) {
        setContacts(prev => prev.map(contact => 
          contactIds.includes(contact.id) ? { ...contact, ...updateData } : contact
        ));
      }
      
      return result;
    } catch (err) {
      console.error('Error in bulk operation:', err);
      throw err;
    }
  }, []);

  return {
    contacts,
    loading,
    error,
    pagination,
    createContact,
    updateContact,
    deleteContact,
    bulkOperation,
    refetch: fetchContacts,
  };
}

export function useContactStats() {
  const [stats, setStats] = useState<ContactStats>({
    total: 0,
    recentlyAdded: 0,
    byStatus: {
      active: 0,
      inactive: 0,
      blocked: 0,
    },
    topSources: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await contactsAPI.getContactStats();
      setStats(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch contact stats');
      console.error('Error fetching contact stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
}

export function useContact(id: string) {
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContact = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await contactsAPI.getContact(id);
      setContact(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch contact');
      console.error('Error fetching contact:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchContact();
  }, [fetchContact]);

  return {
    contact,
    loading,
    error,
    refetch: fetchContact,
  };
}