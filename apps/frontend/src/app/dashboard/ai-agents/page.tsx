'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AIAgentsPage() {
  const router = useRouter();
  
  // Redirect to marketplace by default
  useEffect(() => {
    router.replace('/dashboard/ai-agents/marketplace');
  }, [router]);

  return null;
}