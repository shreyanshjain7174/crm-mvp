'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Settings, 
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  ArrowUp,
  Clock,
  Shield,
  Users,
  AlertTriangle
} from 'lucide-react';
import { useApprovals } from '@/hooks/use-approvals';
import { useState } from 'react';

export function ApprovalRules() {
  const { approvalRules } = useApprovals();
  const [selectedRule, setSelectedRule] = useState<string | null>(null);

  const getRuleTypeIcon = (type: string) => {
    switch (type) {
      case 'auto_approve': return CheckCircle;
      case 'require_approval': return Users;
      case 'escalate': return ArrowUp;
      default: return Settings;
    }
  };

  const getRuleTypeColor = (type: string) => {
    switch (type) {
      case 'auto_approve': return 'bg-green-100 text-green-800 border-green-200';
      case 'require_approval': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'escalate': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatConditions = (conditions: any) => {
    const conditionStrings = [];
    
    if (conditions.confidenceThreshold) {
      conditionStrings.push(`Confidence ≥ ${conditions.confidenceThreshold}%`);
    }
    if (conditions.riskLevels?.length) {
      conditionStrings.push(`Risk: ${conditions.riskLevels.join(', ')}`);
    }
    if (conditions.agentTypes?.length) {
      conditionStrings.push(`Agents: ${conditions.agentTypes.join(', ')}`);
    }
    if (conditions.businessHours) {
      conditionStrings.push('Business hours only');
    }
    if (conditions.valueThreshold) {
      conditionStrings.push(`Value ≥ $${conditions.valueThreshold}`);
    }
    
    return conditionStrings.join(' • ');
  };

  const formatActions = (actions: any) => {
    const actionStrings = [];
    
    if (actions.autoApprove) {
      actionStrings.push('Auto-approve');
    }
    if (actions.requireManagerApproval) {
      actionStrings.push('Manager approval required');
    }
    if (actions.escalateAfter) {
      actionStrings.push(`Escalate after ${actions.escalateAfter}min`);
    }
    if (actions.notifyUsers?.length) {
      actionStrings.push(`Notify ${actions.notifyUsers.length} user(s)`);
    }
    if (actions.skipOnWeekends) {
      actionStrings.push('Skip weekends');
    }
    
    return actionStrings.join(' • ');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Settings className="mr-2 h-5 w-5" />
            Approval Rules
          </CardTitle>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Rule
          </Button>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600">
              {approvalRules.filter(r => r.type === 'auto_approve' && r.isActive).length}
            </div>
            <div className="text-xs text-gray-600">Auto-approve Rules</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-600">
              {approvalRules.filter(r => r.type === 'require_approval' && r.isActive).length}
            </div>
            <div className="text-xs text-gray-600">Approval Required</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-orange-600">
              {approvalRules.filter(r => r.type === 'escalate' && r.isActive).length}
            </div>
            <div className="text-xs text-gray-600">Escalation Rules</div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-4">
            {approvalRules.map((rule) => {
              const RuleIcon = getRuleTypeIcon(rule.type);
              
              return (
                <div 
                  key={rule.id} 
                  className={`bg-white border rounded-lg p-4 space-y-3 hover:shadow-sm transition-shadow ${selectedRule === rule.id ? 'ring-2 ring-blue-200' : ''}`}
                  onClick={() => setSelectedRule(selectedRule === rule.id ? null : rule.id)}
                >
                  {/* Rule Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${getRuleTypeColor(rule.type)}`}>
                        <RuleIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{rule.name}</h3>
                        <p className="text-sm text-gray-600">{rule.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch checked={rule.isActive} />
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getRuleTypeColor(rule.type)}`}
                      >
                        {rule.type.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>

                  {/* Rule Details */}
                  <div className="space-y-2">
                    <div>
                      <div className="text-xs font-medium text-gray-700 mb-1">Conditions</div>
                      <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        {formatConditions(rule.conditions) || 'No specific conditions'}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs font-medium text-gray-700 mb-1">Actions</div>
                      <div className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
                        {formatActions(rule.actions) || 'No specific actions'}
                      </div>
                    </div>
                  </div>

                  {/* Rule Metadata */}
                  <div className="grid grid-cols-2 gap-4 text-xs text-gray-500 pt-2 border-t border-gray-100">
                    <div>
                      <span className="font-medium">Created by:</span> {rule.createdBy}
                    </div>
                    <div>
                      <span className="font-medium">Updated:</span> {new Date(rule.updatedAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {selectedRule === rule.id && (
                    <div className="space-y-3 pt-3 border-t border-gray-200">
                      {/* Detailed Conditions */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Detailed Conditions</h4>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          {rule.conditions.agentTypes && (
                            <div>
                              <span className="font-medium text-gray-600">Agent Types:</span>
                              <div className="mt-1">
                                {rule.conditions.agentTypes.map((type, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs mr-1 mb-1">
                                    {type}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {rule.conditions.riskLevels && (
                            <div>
                              <span className="font-medium text-gray-600">Risk Levels:</span>
                              <div className="mt-1">
                                {rule.conditions.riskLevels.map((level, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs mr-1 mb-1">
                                    {level}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {rule.conditions.confidenceThreshold && (
                            <div>
                              <span className="font-medium text-gray-600">Min Confidence:</span>
                              <div className="text-gray-900">{rule.conditions.confidenceThreshold}%</div>
                            </div>
                          )}
                          
                          {rule.conditions.valueThreshold && (
                            <div>
                              <span className="font-medium text-gray-600">Min Value:</span>
                              <div className="text-gray-900">${rule.conditions.valueThreshold}</div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Detailed Actions */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Action Configuration</h4>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="space-y-2">
                            <div className="flex items-center">
                              {rule.actions.autoApprove ? (
                                <CheckCircle className="h-3 w-3 text-green-600 mr-2" />
                              ) : (
                                <XCircle className="h-3 w-3 text-gray-400 mr-2" />
                              )}
                              <span>Auto-approve</span>
                            </div>
                            
                            <div className="flex items-center">
                              {rule.actions.requireManagerApproval ? (
                                <CheckCircle className="h-3 w-3 text-green-600 mr-2" />
                              ) : (
                                <XCircle className="h-3 w-3 text-gray-400 mr-2" />
                              )}
                              <span>Manager approval required</span>
                            </div>
                            
                            <div className="flex items-center">
                              {rule.actions.skipOnWeekends ? (
                                <CheckCircle className="h-3 w-3 text-green-600 mr-2" />
                              ) : (
                                <XCircle className="h-3 w-3 text-gray-400 mr-2" />
                              )}
                              <span>Skip on weekends</span>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            {rule.actions.escalateAfter && (
                              <div className="flex items-center">
                                <Clock className="h-3 w-3 text-orange-600 mr-2" />
                                <span>Escalate after {rule.actions.escalateAfter} minutes</span>
                              </div>
                            )}
                            
                            {rule.actions.notifyUsers && (
                              <div className="flex items-center">
                                <Users className="h-3 w-3 text-blue-600 mr-2" />
                                <span>Notify {rule.actions.notifyUsers.length} user(s)</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Rule Actions */}
                      <div className="flex justify-end space-x-2 pt-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Rule Statistics */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="font-semibold text-gray-900">{approvalRules.length}</div>
              <div className="text-gray-600">Total Rules</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-green-600">{approvalRules.filter(r => r.isActive).length}</div>
              <div className="text-gray-600">Active</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-600">{approvalRules.filter(r => !r.isActive).length}</div>
              <div className="text-gray-600">Inactive</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-blue-600">85%</div>
              <div className="text-gray-600">Coverage</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}