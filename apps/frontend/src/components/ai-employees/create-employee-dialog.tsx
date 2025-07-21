'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, Sparkles, Users, BarChart3, MessageSquare } from 'lucide-react';
import { aiService, type EmployeeRole, type AIEmployee } from '@/lib/ai-service';
import { toast } from 'sonner';

interface CreateEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEmployeeCreated: (employee: AIEmployee) => void;
}

const roleIcons = {
  'Sales Development Agent': Users,
  'Customer Success Agent': MessageSquare,
  'Marketing Agent': Sparkles,
  'Data Analyst Agent': BarChart3,
};

export function CreateEmployeeDialog({ open, onOpenChange, onEmployeeCreated }: CreateEmployeeDialogProps) {
  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [roles, setRoles] = useState<EmployeeRole[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);

  useEffect(() => {
    if (open) {
      loadRoles();
    }
  }, [open]);

  const loadRoles = async () => {
    try {
      setIsLoadingRoles(true);
      const employeeRoles = await aiService.getEmployeeRoles();
      setRoles(employeeRoles);
    } catch (error) {
      console.error('Failed to load roles:', error);
      toast.error('Failed to load AI employee roles');
    } finally {
      setIsLoadingRoles(false);
    }
  };

  const handleCreate = async () => {
    if (!name.trim() || !selectedRole) {
      toast.error('Please provide a name and select a role');
      return;
    }

    try {
      setIsLoading(true);
      const employee = await aiService.createEmployee({
        name: name.trim(),
        role: selectedRole
      });

      toast.success(`AI employee "${employee.name}" created successfully!`);
      onEmployeeCreated(employee);
      onOpenChange(false);
      
      // Reset form
      setName('');
      setSelectedRole('');
    } catch (error) {
      console.error('Failed to create employee:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create AI employee');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setSelectedRole('');
    onOpenChange(false);
  };

  const selectedRoleData = roles.find(role => role.name === selectedRole);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-600" />
            Create AI Employee
          </DialogTitle>
          <DialogDescription>
            Create an autonomous AI employee to handle tasks in your CRM. Each employee works independently with zero ongoing costs.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Employee Name */}
          <div className="space-y-2">
            <Label htmlFor="employee-name">Employee Name</Label>
            <Input
              id="employee-name"
              placeholder="e.g., Alex, Maya, Sarah..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <Label>Choose Role</Label>
            {isLoadingRoles ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {roles.map((role) => {
                  const Icon = roleIcons[role.name as keyof typeof roleIcons] || Bot;
                  const isSelected = selectedRole === role.name;
                  
                  return (
                    <Card
                      key={role.name}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedRole(role.name)}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {role.name}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {role.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex flex-wrap gap-1">
                          {role.capabilities.slice(0, 2).map((capability, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {capability}
                            </Badge>
                          ))}
                          {role.capabilities.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{role.capabilities.length - 2}
                            </Badge>
                          )}
                        </div>
                        <div className="mt-2">
                          <Badge variant="outline" className="text-xs text-green-600">
                            {role.cost}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected Role Details */}
          {selectedRoleData && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-sm text-blue-900">
                  {selectedRoleData.name} Capabilities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {selectedRoleData.capabilities.map((capability, index) => (
                    <Badge key={index} variant="secondary" className="text-blue-800 bg-blue-100">
                      {capability}
                    </Badge>
                  ))}
                </div>
                <div className="mt-3 text-sm text-blue-700">
                  <strong>Cost:</strong> {selectedRoleData.cost}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isLoading || !name.trim() || !selectedRole}>
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Creating...
              </>
            ) : (
              <>
                <Bot className="w-4 h-4 mr-2" />
                Create AI Employee
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}