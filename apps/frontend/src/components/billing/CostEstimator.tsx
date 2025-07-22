/**
 * Cost Estimator Component
 * 
 * Allows users to estimate costs for projected usage across different agents
 */

'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calculator, Zap, TrendingUp, AlertCircle } from 'lucide-react'

interface CostEstimate {
  baseCost: number
  freeTierDeduction: number
  finalCost: number
  usageBreakdown: Array<{
    unit: string
    amount: number
    rate: number
    cost: number
  }>
}

interface CostEstimatorProps {
  businessId: string
}

export function CostEstimator({ businessId }: CostEstimatorProps) {
  const [selectedAgent, setSelectedAgent] = useState<string>('')
  const [estimatedUsage, setEstimatedUsage] = useState<Record<string, number>>({})
  const [estimate, setEstimate] = useState<CostEstimate | null>(null)
  const [loading, setLoading] = useState(false)

  const agents = [
    {
      id: 'cozmox-voice-agent',
      name: 'Cozmox Voice Assistant',
      pricing: { model: 'usage', perMinute: 150, freeLimit: 60, unit: 'minutes' },
      usageUnits: ['minutes', 'calls']
    },
    {
      id: 'whatsapp-ai-responder',
      name: 'WhatsApp AI Responder',
      pricing: { model: 'subscription', monthlyPrice: 99900, limits: { messages: 5000 } },
      usageUnits: ['messages', 'conversations']
    },
    {
      id: 'data-enricher',
      name: 'Contact Data Enricher',
      pricing: { model: 'usage', perEnrichment: 500, freeLimit: 100, unit: 'enrichments' },
      usageUnits: ['enrichments', 'contacts']
    }
  ]

  const selectedAgentData = agents.find(a => a.id === selectedAgent)

  const handleUsageChange = (unit: string, value: string) => {
    const numValue = parseFloat(value) || 0
    setEstimatedUsage(prev => ({ ...prev, [unit]: numValue }))
  }

  const calculateEstimate = async () => {
    if (!selectedAgent || Object.keys(estimatedUsage).length === 0) return

    setLoading(true)
    
    try {
      // Mock calculation - in production, this would call the API
      const agentData = selectedAgentData!
      let baseCost = 0
      let freeTierDeduction = 0
      const usageBreakdown = []

      for (const [unit, amount] of Object.entries(estimatedUsage)) {
        if (amount <= 0) continue

        let unitCost = 0
        let rate = 0

        if (agentData.pricing.model === 'usage') {
          switch (unit) {
            case 'minutes':
              rate = agentData.pricing.perMinute || 0
              unitCost = amount * (rate / 100) // Convert paise to rupees
              break
            case 'enrichments':
              rate = agentData.pricing.perEnrichment || 0
              unitCost = amount * (rate / 100)
              break
            case 'calls':
              // Estimate 5 minutes per call on average
              rate = (agentData.pricing.perMinute || 0) * 5
              unitCost = amount * (rate / 100)
              break
          }

          // Apply free tier
          if (agentData.pricing.freeLimit && agentData.pricing.unit === unit) {
            const billableAmount = Math.max(0, amount - agentData.pricing.freeLimit)
            const freeTierAmount = Math.min(amount, agentData.pricing.freeLimit)
            freeTierDeduction += freeTierAmount * (rate / 100)
            unitCost = billableAmount * (rate / 100)
          }
        } else if (agentData.pricing.model === 'subscription') {
          unitCost = 0 // No per-usage cost for subscription
          rate = 0
        }

        baseCost += unitCost + (freeTierDeduction > 0 ? freeTierDeduction : 0)
        usageBreakdown.push({ unit, amount, rate, cost: unitCost })
      }

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800))

      setEstimate({
        baseCost,
        freeTierDeduction,
        finalCost: baseCost - freeTierDeduction,
        usageBreakdown
      })
    } catch (error) {
      console.error('Failed to calculate estimate:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Agent Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calculator className="w-5 h-5" />
            <span>Cost Estimator</span>
          </CardTitle>
          <CardDescription>
            Estimate costs for projected usage across different agents
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div>
            <Label>Select Agent</Label>
            <Select value={selectedAgent} onValueChange={setSelectedAgent}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an agent to estimate costs" />
              </SelectTrigger>
              <SelectContent>
                {agents.map(agent => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedAgentData && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <div className="font-medium text-blue-900">Pricing Model: {selectedAgentData.pricing.model.charAt(0).toUpperCase() + selectedAgentData.pricing.model.slice(1)}</div>
                  <div className="text-sm text-blue-700 mt-1">
                    {selectedAgentData.pricing.model === 'usage' && (
                      <>
                        {selectedAgentData.pricing.perMinute && `₹${(selectedAgentData.pricing.perMinute / 100).toFixed(2)} per minute`}
                        {selectedAgentData.pricing.perEnrichment && `₹${(selectedAgentData.pricing.perEnrichment / 100).toFixed(2)} per enrichment`}
                        {selectedAgentData.pricing.freeLimit && ` • ${selectedAgentData.pricing.freeLimit} ${selectedAgentData.pricing.unit} free per month`}
                      </>
                    )}
                    {selectedAgentData.pricing.model === 'subscription' && (
                      <>₹{((selectedAgentData.pricing.monthlyPrice || 0) / 100).toFixed(2)} per month • Includes up to {selectedAgentData.pricing.limits?.messages} messages</>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Input */}
      {selectedAgentData && (
        <Card>
          <CardHeader>
            <CardTitle>Projected Usage</CardTitle>
            <CardDescription>Enter your estimated usage for the next month</CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {selectedAgentData.usageUnits.map(unit => (
                <div key={unit}>
                  <Label className="capitalize">{unit} per Month</Label>
                  <Input
                    type="number"
                    placeholder={`Enter number of ${unit}`}
                    value={estimatedUsage[unit] || ''}
                    onChange={(e) => handleUsageChange(unit, e.target.value)}
                    min="0"
                    step={unit === 'minutes' ? '0.1' : '1'}
                  />
                </div>
              ))}
            </div>
            
            <Button 
              onClick={calculateEstimate} 
              disabled={loading || Object.keys(estimatedUsage).length === 0}
              className="mt-4 w-full"
            >
              {loading ? 'Calculating...' : 'Calculate Cost Estimate'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Cost Estimate Results */}
      {estimate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span>Cost Estimate</span>
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              {/* Summary */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="grid gap-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Base Cost:</span>
                    <span className="font-medium">₹{estimate.baseCost.toFixed(2)}</span>
                  </div>
                  {estimate.freeTierDeduction > 0 && (
                    <div className="flex justify-between items-center text-green-600">
                      <span>Free Tier Savings:</span>
                      <span className="font-medium">-₹{estimate.freeTierDeduction.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-900">Estimated Total:</span>
                      <span className="font-bold text-xl">₹{estimate.finalCost.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Usage Breakdown */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Usage Breakdown</h4>
                <div className="space-y-2">
                  {estimate.usageBreakdown.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-white border rounded">
                      <div>
                        <div className="font-medium">{item.amount.toLocaleString()} {item.unit}</div>
                        {item.rate > 0 && (
                          <div className="text-sm text-gray-600">
                            @ ₹{(item.rate / 100).toFixed(2)} per {item.unit.slice(0, -1)}
                          </div>
                        )}
                      </div>
                      <div className="font-medium">
                        {item.cost > 0 ? `₹${item.cost.toFixed(2)}` : 'Included'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Savings Tips */}
              {estimate.freeTierDeduction > 0 && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Zap className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-green-900">Great news!</div>
                      <div className="text-sm text-green-700 mt-1">
                        You&apos;re saving ₹{estimate.freeTierDeduction.toFixed(2)} with the free tier. 
                        Consider optimizing usage to maximize your free allowance.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Cost per Day */}
              <div className="text-sm text-gray-600 text-center">
                Daily average: ₹{(estimate.finalCost / 30).toFixed(2)} • 
                Per business day: ₹{(estimate.finalCost / 22).toFixed(2)}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}