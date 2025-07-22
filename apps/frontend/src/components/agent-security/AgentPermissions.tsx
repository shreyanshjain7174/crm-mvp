/**
 * Agent Permissions Component
 * 
 * Displays and manages permissions for AI agents with detailed security controls.
 * Shows what data an agent can access and allows users to grant/revoke permissions.
 */

'use client'

import React, { useState } from 'react'
import { 
  Shield, 
  Lock, 
  Unlock, 
  Eye, 
  Edit, 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  User, 
  Database, 
  MessageSquare, 
  Phone, 
  Calendar,
  Settings,
  Info
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'

interface Permission {
  id: string
  resource: string
  actions: string[]
  constraints: {
    businessScope?: boolean
    timeRestriction?: string
    dataRestriction?: string[]
  }
  granted: boolean
  required: boolean
  description: string
  riskLevel: 'low' | 'medium' | 'high'
}

interface AgentPermissionsProps {
  agentId: string
  agentName: string
  permissions: Permission[]
  onPermissionChange: (permissionId: string, granted: boolean) => void
  onSave: () => void
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

export function AgentPermissions({ 
  agentId, 
  agentName, 
  permissions, 
  onPermissionChange,
  onSave 
}: AgentPermissionsProps) {
  const [hasChanges, setHasChanges] = useState(false)

  const handlePermissionToggle = (permissionId: string, granted: boolean) => {
    onPermissionChange(permissionId, granted)
    setHasChanges(true)
  }

  const handleSave = () => {
    onSave()
    setHasChanges(false)
  }

  const groupedPermissions = permissions.reduce((groups, permission) => {
    const resource = permission.resource
    if (!groups[resource]) {
      groups[resource] = []
    }
    groups[resource].push(permission)
    return groups
  }, {} as Record<string, Permission[]>)

  const grantedPermissions = permissions.filter(p => p.granted).length
  const totalPermissions = permissions.length
  const highRiskPermissions = permissions.filter(p => p.riskLevel === 'high' && p.granted).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Agent Permissions</h3>
            <p className="text-sm text-gray-600">Manage access controls for {agentName}</p>
          </div>
        </div>
        
        {hasChanges && (
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
            Save Changes
          </Button>
        )}
      </div>

      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  {grantedPermissions}/{totalPermissions}
                </div>
                <div className="text-sm text-gray-600">Permissions Granted</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                highRiskPermissions > 0 ? 'bg-red-100' : 'bg-gray-100'
              }`}>
                <AlertTriangle className={`w-5 h-5 ${
                  highRiskPermissions > 0 ? 'text-red-600' : 'text-gray-600'
                }`} />
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-900">{highRiskPermissions}</div>
                <div className="text-sm text-gray-600">High Risk Access</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Database className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  {Object.keys(groupedPermissions).length}
                </div>
                <div className="text-sm text-gray-600">Data Sources</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Notice */}
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-orange-600 mt-0.5" />
            <div className="flex-1">
              <div className="font-medium text-orange-900">Security Notice</div>
              <div className="text-sm text-orange-700 mt-1">
                Only grant permissions that the agent actually needs to function. 
                High-risk permissions give agents access to sensitive data and actions.
                Review permissions regularly and revoke unused access.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permission Groups */}
      {Object.entries(groupedPermissions).map(([resource, resourcePermissions]) => {
        const Icon = resourceIcons[resource] || Database
        
        return (
          <Card key={resource}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-base">
                <Icon className="w-5 h-5 text-gray-600" />
                <span className="capitalize">{resource} Access</span>
                <Badge variant="outline" className="ml-auto">
                  {resourcePermissions.filter(p => p.granted).length} of {resourcePermissions.length} granted
                </Badge>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {resourcePermissions.map((permission) => (
                <div key={permission.id}>
                  <div className="flex items-start justify-between space-x-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">
                            {permission.actions.map(action => 
                              action.charAt(0).toUpperCase() + action.slice(1)
                            ).join(', ')} {resource}
                          </span>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${riskColors[permission.riskLevel]}`}
                          >
                            {permission.riskLevel.toUpperCase()} RISK
                          </Badge>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {permission.required ? (
                            <Lock className="w-4 h-4 text-gray-400" />
                          ) : (
                            <Switch
                              checked={permission.granted}
                              onCheckedChange={(checked) => handlePermissionToggle(permission.id, checked)}
                              disabled={permission.required}
                            />
                          )}
                        </div>
                      </div>

                      <div className="text-sm text-gray-600">
                        {permission.description}
                      </div>

                      {/* Constraints */}
                      {(permission.constraints.businessScope || 
                        permission.constraints.timeRestriction || 
                        permission.constraints.dataRestriction?.length) && (
                        <div className="text-xs text-gray-500 space-y-1">
                          <div className="font-medium">Access Restrictions:</div>
                          {permission.constraints.businessScope && (
                            <div className="flex items-center space-x-1">
                              <CheckCircle className="w-3 h-3 text-green-600" />
                              <span>Limited to your business data only</span>
                            </div>
                          )}
                          {permission.constraints.timeRestriction && (
                            <div className="flex items-center space-x-1">
                              <CheckCircle className="w-3 h-3 text-green-600" />
                              <span>Time restriction: {permission.constraints.timeRestriction}</span>
                            </div>
                          )}
                          {permission.constraints.dataRestriction?.map((restriction, index) => (
                            <div key={index} className="flex items-center space-x-1">
                              <CheckCircle className="w-3 h-3 text-green-600" />
                              <span>Data restriction: {restriction}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {permission !== resourcePermissions[resourcePermissions.length - 1] && (
                    <Separator className="mt-4" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )
      })}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="text-sm text-gray-600">
          {hasChanges ? (
            <span className="text-orange-600 font-medium">You have unsaved permission changes</span>
          ) : (
            <span>Permission settings are up to date</span>
          )}
        </div>
        
        <div className="flex space-x-3">
          <Button variant="outline" size="sm">
            Export Permissions
          </Button>
          <Button variant="outline" size="sm">
            View Audit Log
          </Button>
        </div>
      </div>
    </div>
  )
}