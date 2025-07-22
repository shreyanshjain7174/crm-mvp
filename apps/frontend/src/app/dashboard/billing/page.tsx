/**
 * Billing Page
 * 
 * Main billing page that displays the comprehensive billing dashboard
 * with usage analytics, cost breakdowns, and billing notifications.
 */

'use client'

import React from 'react'
import { BillingDashboard } from '@/components/billing/BillingDashboard'

export default function BillingPage() {
  // In a real app, this would come from authentication context
  const businessId = 'demo-business'

  return <BillingDashboard businessId={businessId} />
}