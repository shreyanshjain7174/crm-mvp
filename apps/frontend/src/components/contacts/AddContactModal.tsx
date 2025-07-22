'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, UserPlus, CheckCircle } from 'lucide-react';
import { useCreateLead } from '@/hooks/use-api';
import { useUserProgressStore } from '@/stores/userProgress';
import { validateLead } from '@/lib/validation';

type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddContactModal({ isOpen, onClose, onSuccess }: AddContactModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    source: '',
    priority: 'MEDIUM' as Priority,
    businessProfile: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const createLead = useCreateLead();
  const incrementStat = useUserProgressStore(state => state.incrementStat);
  const syncWithBackend = useUserProgressStore(state => state.syncWithBackend);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    setIsSubmitting(true);

    try {
      // Validate form data
      const validationResult = validateLead(formData);
      
      if (!validationResult.success) {
        setFormErrors(validationResult.errors || {});
        setIsSubmitting(false);
        return;
      }

      if (validationResult.data) {
        await createLead.mutateAsync(validationResult.data);
      }

      // Update user progress - this is crucial for unlocking features
      incrementStat('contactsAdded');
      
      // Sync with backend to ensure dashboard updates
      await syncWithBackend();

      // Show success state
      setIsSuccess(true);
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }

      // Auto-close after 2 seconds
      setTimeout(() => {
        handleClose();
      }, 2000);

    } catch (error) {
      console.error('Failed to create contact:', error);
      setFormErrors({ general: 'Failed to create contact. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      source: '',
      priority: 'MEDIUM',
      businessProfile: ''
    });
    setFormErrors({});
    setIsSubmitting(false);
    setIsSuccess(false);
    onClose();
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isSuccess ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-600" />
                Contact Added Successfully!
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                Add Your First Contact
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        {isSuccess ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Welcome to your CRM! 🎉
            </h3>
            <p className="text-gray-600">
              Your first contact has been added. You can now see new features unlocked in your dashboard!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {formErrors.general && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{formErrors.general}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Enter contact's full name"
                required
                disabled={isSubmitting}
              />
              {formErrors.name && (
                <p className="text-sm text-red-600">{formErrors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="+91XXXXXXXXXX"
                required
                disabled={isSubmitting}
              />
              {formErrors.phone && (
                <p className="text-sm text-red-600">{formErrors.phone}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email (Optional)</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="email@example.com"
                disabled={isSubmitting}
              />
              {formErrors.email && (
                <p className="text-sm text-red-600">{formErrors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="source">How did you meet?</Label>
              <Select 
                value={formData.source} 
                onValueChange={(value) => updateField('source', value)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                  <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                  <SelectItem value="Facebook">Facebook</SelectItem>
                  <SelectItem value="Website">Website</SelectItem>
                  <SelectItem value="Referral">Referral</SelectItem>
                  <SelectItem value="Cold Call">Cold Call</SelectItem>
                  <SelectItem value="In Person">In Person</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority Level</Label>
              <Select 
                value={formData.priority} 
                onValueChange={(value) => updateField('priority', value as Priority)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low Priority</SelectItem>
                  <SelectItem value="MEDIUM">Medium Priority</SelectItem>
                  <SelectItem value="HIGH">High Priority</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessProfile">Notes (Optional)</Label>
              <Input
                id="businessProfile"
                value={formData.businessProfile}
                onChange={(e) => updateField('businessProfile', e.target.value)}
                placeholder="Brief notes about this contact"
                disabled={isSubmitting}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !formData.name || !formData.phone}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding Contact...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Contact
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}