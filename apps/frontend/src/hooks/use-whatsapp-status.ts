'use client';

import { useState, useEffect } from 'react';

interface WhatsAppStatus {
  connected: boolean;
  configured: boolean;
  businessProfile?: {
    display_phone_number: string;
    verified_name: string;
    quality_rating?: string;
  };
  message: string;
  error?: string;
}

export function useWhatsAppStatus() {
  const [status, setStatus] = useState<WhatsAppStatus>({
    connected: false,
    configured: false,
    message: 'Checking connection...'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/whatsapp/status');
      
      if (!response.ok) {
        throw new Error('Failed to check WhatsApp status');
      }
      
      const data = await response.json();
      setStatus(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setStatus({
        connected: false,
        configured: false,
        message: 'Failed to check connection status'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  return {
    status,
    loading,
    error,
    refresh: checkStatus
  };
}