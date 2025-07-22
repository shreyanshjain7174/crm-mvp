/**
 * Agent Install Modal Component
 * 
 * Secure installation flow for AI agents with permission review and approval.
 * Shows agent details, required permissions, and security warnings before installation.
 */

'use client'

import React, { useState } from 'react'
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  X, 
  Download,
  Lock,
  Eye,
  User,
  MessageSquare,
  Phone,
  Calendar,
  Database,
  Settings,
  Info,
  ExternalLink
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'

interface Permission {
  id: string
  resource: string
  actions: string[]
  description: string
  required: boolean
  riskLevel: 'low' | 'medium' | 'high'
  constraints: {
    businessScope?: boolean
    timeRestriction?: string
  }
}

interface AgentInfo {
  id: string
  name: string
  provider: string
  version: string
  description: string
  longDescription: string
  permissions: Permission[]
  pricing: {
    model: 'free' | 'subscription' | 'usage'
    details: string
  }
  rating: number
  installs: number
  verified: boolean
  supportUrl: string
  privacyPolicyUrl: string
}

interface AgentInstallModalProps {
  open: boolean
  agent: AgentInfo | null
  onClose: () => void
  onInstall: (agentId: string, approvedPermissions: string[]) => void
}

const resourceIcons: Record<string, React.ComponentType<any>> = {
  contact: User,
  message: MessageSquare,
  call: Phone,
  appointment: Calendar,
  lead: Database,
  analytics: Settings
}

const riskColors = {
  low: 'text-green-600 bg-green-50 border-green-200',
  medium: 'text-orange-600 bg-orange-50 border-orange-200',
  high: 'text-red-600 bg-red-50 border-red-200'
}

export function AgentInstallModal({ open, agent, onClose, onInstall }: AgentInstallModalProps) {
  const [currentStep, setCurrentStep] = useState<'overview' | 'permissions' | 'confirmation'>('overview')
  const [approvedPermissions, setApprovedPermissions] = useState<Set<string>>(new Set())
  const [installing, setInstalling] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  // Auto-approve required permissions when agent changes
  React.useEffect(() => {
    if (!agent) return
    const requiredPermissions = agent.permissions.filter(p => p.required)
    const newApproved = new Set<string>()
    requiredPermissions.forEach(p => newApproved.add(p.id))
    setApprovedPermissions(newApproved)
  }, [agent])

  if (!agent) return null

  const handlePermissionToggle = (permissionId: string, checked: boolean) => {
    const newApproved = new Set(approvedPermissions)
    if (checked) {
      newApproved.add(permissionId)
    } else {
      newApproved.delete(permissionId)
    }
    setApprovedPermissions(newApproved)
  }

  const handleInstall = async () => {
    if (!agreedToTerms) return
    
    setInstalling(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate installation
      onInstall(agent.id, Array.from(approvedPermissions))
      onClose()
    } catch (error) {
      console.error('Installation failed:', error)
    } finally {
      setInstalling(false)
    }
  }

  const requiredPermissions = agent.permissions.filter(p => p.required)
  const optionalPermissions = agent.permissions.filter(p => !p.required)
  const highRiskPermissions = agent.permissions.filter(p => p.riskLevel === 'high')

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Agent Header */}
      <div className="flex items-start space-x-4">
        <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">
          🤖
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="text-xl font-semibold text-gray-900">{agent.name}</h3>
            {agent.verified && (
              <CheckCircle className="w-5 h-5 text-blue-600" />
            )}
          </div>
          <div className="text-sm text-gray-600 mb-2">
            by {agent.provider} • v{agent.version}
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <span className="font-medium">{agent.rating}</span>
              <div className="flex space-x-0.5">
                {[...Array(5)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-3 h-3 rounded-sm ${
                      i < Math.floor(agent.rating) ? 'bg-yellow-400' : 'bg-gray-200'
                    }`} 
                  />
                ))}
              </div>
            </div>
            <div>{agent.installs.toLocaleString()} installs</div>
            <div className={`px-2 py-1 rounded text-xs ${
              agent.pricing.model === 'free' ? 'bg-green-100 text-green-700' :
              agent.pricing.model === 'subscription' ? 'bg-blue-100 text-blue-700' :
              'bg-orange-100 text-orange-700'
            }`}>
              {agent.pricing.details}
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div>
        <p className="text-gray-700">{agent.longDescription}</p>
      </div>

      {/* Key Features */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">What this agent can do:</h4>
        <div className="grid gap-2">
          {agent.permissions.slice(0, 3).map((permission) => {
            const Icon = resourceIcons[permission.resource] || Database
            return (
              <div key={permission.id} className="flex items-center space-x-2 text-sm">
                <Icon className="w-4 h-4 text-gray-600" />
                <span>{permission.description}</span>
              </div>
            )
          })}
          {agent.permissions.length > 3 && (
            <div className="text-sm text-gray-600">
              +{agent.permissions.length - 3} more capabilities
            </div>
          )}
        </div>
      </div>

      {/* Security Notice */}
      {highRiskPermissions.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
              <div className="flex-1">
                <div className="font-medium text-orange-900">Security Notice</div>
                <div className="text-sm text-orange-700 mt-1">
                  This agent requests {highRiskPermissions.length} high-risk permission{highRiskPermissions.length > 1 ? 's' : ''} 
                  that provide access to sensitive data. Review carefully before proceeding.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )

  const renderPermissions = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Shield className="w-12 h-12 text-blue-600 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Permission Review</h3>
        <p className="text-gray-600">
          Review and approve the permissions this agent needs to function
        </p>
      </div>

      {/* Required Permissions */}
      {requiredPermissions.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            <Lock className="w-4 h-4 mr-2" />
            Required Permissions
          </h4>
          <div className="space-y-3">
            {requiredPermissions.map((permission) => {
              const Icon = resourceIcons[permission.resource] || Database
              return (
                <div key={permission.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 mt-1">
                    <Icon className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-gray-900">
                        {permission.actions.map(a => a.charAt(0).toUpperCase() + a.slice(1)).join(', ')} {permission.resource}
                      </span>
                      <Badge variant="outline" className={`text-xs ${riskColors[permission.riskLevel]}`}>
                        {permission.riskLevel.toUpperCase()} RISK
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      {permission.description}
                    </div>
                    {permission.constraints.businessScope && (
                      <div className="text-xs text-gray-500 mt-1">
                        ✓ Limited to your business data only
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Optional Permissions */}
      {optionalPermissions.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Optional Permissions</h4>
          <div className="space-y-3">
            {optionalPermissions.map((permission) => {
              const Icon = resourceIcons[permission.resource] || Database
              const isApproved = approvedPermissions.has(permission.id)
              
              return (
                <div key={permission.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 mt-1">
                    <Icon className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-gray-900">
                        {permission.actions.map(a => a.charAt(0).toUpperCase() + a.slice(1)).join(', ')} {permission.resource}
                      </span>
                      <Badge variant="outline" className={`text-xs ${riskColors[permission.riskLevel]}`}>
                        {permission.riskLevel.toUpperCase()} RISK
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      {permission.description}
                    </div>
                    {permission.constraints.businessScope && (
                      <div className="text-xs text-gray-500 mt-1">
                        ✓ Limited to your business data only
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <Checkbox
                      checked={isApproved}
                      onCheckedChange={(checked: boolean) => handlePermissionToggle(permission.id, checked)}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )

  const renderConfirmation = () => (
    <div className="space-y-6 text-center">
      <div>
        <Download className="w-12 h-12 text-blue-600 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Install</h3>
        <p className="text-gray-600">
          {agent.name} will be installed with {approvedPermissions.size} approved permissions
        </p>
      </div>

      {/* Installation Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="grid gap-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">Agent:</span>
              <span>{agent.name} v{agent.version}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Permissions:</span>
              <span>{approvedPermissions.size} of {agent.permissions.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Cost:</span>
              <span>{agent.pricing.details}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Terms Agreement */}
      <div className="flex items-start space-x-2 p-4 bg-gray-50 rounded-lg">
        <Checkbox
          checked={agreedToTerms}
          onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
        />
        <div className="text-sm text-gray-700">
          I agree to the{' '}
          <a href={agent.privacyPolicyUrl} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
            Privacy Policy
          </a>{' '}
          and understand that this agent will have access to the approved data and permissions.
        </div>
      </div>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {currentStep === 'overview' && 'Install AI Agent'}
            {currentStep === 'permissions' && 'Review Permissions'}
            {currentStep === 'confirmation' && 'Confirm Installation'}
          </DialogTitle>
          <DialogDescription>
            {currentStep === 'overview' && 'Review agent details and capabilities'}
            {currentStep === 'permissions' && 'Grant necessary permissions for agent operation'}
            {currentStep === 'confirmation' && 'Final confirmation before installation'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {currentStep === 'overview' && renderOverview()}
          {currentStep === 'permissions' && renderPermissions()}
          {currentStep === 'confirmation' && renderConfirmation()}
        </div>

        <DialogFooter className="flex justify-between">
          <div className="flex space-x-2">
            {currentStep !== 'overview' && (
              <Button
                variant="outline"
                onClick={() => {
                  if (currentStep === 'permissions') setCurrentStep('overview')
                  if (currentStep === 'confirmation') setCurrentStep('permissions')
                }}
              >
                Back
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
          
          <div>
            {currentStep === 'overview' && (
              <Button onClick={() => setCurrentStep('permissions')}>
                Review Permissions
              </Button>
            )}
            {currentStep === 'permissions' && (
              <Button onClick={() => setCurrentStep('confirmation')}>
                Continue
              </Button>
            )}
            {currentStep === 'confirmation' && (
              <Button
                onClick={handleInstall}
                disabled={!agreedToTerms || installing}
              >
                {installing ? 'Installing...' : 'Install Agent'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}