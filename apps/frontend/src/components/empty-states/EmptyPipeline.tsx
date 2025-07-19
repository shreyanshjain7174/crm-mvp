'use client';

import React from 'react';
import { BarChart3, TrendingUp, Users, Lock, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface EmptyPipelineProps {
  onCreatePipeline?: () => void;
  onViewContacts?: () => void;
  contactCount?: number;
  requiredContacts?: number;
  isLocked?: boolean;
}

export function EmptyPipeline({ 
  onCreatePipeline,
  onViewContacts,
  contactCount = 0,
  requiredContacts = 10,
  isLocked = false
}: EmptyPipelineProps) {
  const progress = Math.min((contactCount / requiredContacts) * 100, 100);
  const remaining = Math.max(requiredContacts - contactCount, 0);

  if (isLocked) {
    return (
      <Card className="border-2 border-dashed border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-6">
            <Lock className="h-10 w-10 text-purple-500" />
          </div>
          
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Pipeline View Coming Soon!
          </h3>
          
          <p className="text-gray-600 text-center max-w-md mb-6">
            Add {remaining} more contacts to unlock the pipeline view and organize your leads effectively.
          </p>
          
          <div className="w-full max-w-md mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm text-gray-500">{contactCount}/{requiredContacts}</span>
            </div>
            <div className="w-full bg-white rounded-full h-3 border">
              <div 
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          
          <Button 
            onClick={onViewContacts}
            className="bg-purple-600 hover:bg-purple-700 mb-4"
          >
            <Users className="h-4 w-4 mr-2" />
            Add More Contacts
          </Button>
          
          <Badge variant="outline" className="text-purple-600 border-purple-200">
            {remaining} contacts to unlock
          </Badge>
          
          <div className="mt-8 p-4 bg-white/50 rounded-lg max-w-md border border-purple-100">
            <h4 className="font-semibold text-purple-900 mb-2 text-sm">📈 What you&apos;ll get:</h4>
            <ul className="text-xs text-purple-700 space-y-1">
              <li>• Visual pipeline stages (Lead → Prospect → Customer)</li>
              <li>• Drag & drop lead management</li>
              <li>• Conversion tracking and analytics</li>
              <li>• Automated stage progression</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-purple-100 rounded-full flex items-center justify-center mb-6">
          <BarChart3 className="h-10 w-10 text-blue-600" />
        </div>
        
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No pipeline data yet
        </h3>
        
        <p className="text-gray-500 text-center max-w-md mb-8">
          Start organizing your contacts into pipeline stages to track their journey from leads to customers.
        </p>
        
        <div className="flex gap-3 mb-8">
          <Button 
            onClick={onCreatePipeline}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Target className="h-4 w-4 mr-2" />
            Set Up Pipeline
          </Button>
          
          <Button 
            variant="outline" 
            onClick={onViewContacts}
          >
            <Users className="h-4 w-4 mr-2" />
            View Contacts
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl">
          <div className="p-4 bg-blue-50 rounded-lg text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <h4 className="font-semibold text-blue-900 mb-1 text-sm">Leads</h4>
            <p className="text-xs text-blue-700">
              New contacts and prospects
            </p>
          </div>
          
          <div className="p-4 bg-purple-50 rounded-lg text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <h4 className="font-semibold text-purple-900 mb-1 text-sm">Prospects</h4>
            <p className="text-xs text-purple-700">
              Engaged and qualified leads
            </p>
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Target className="h-6 w-6 text-green-600" />
            </div>
            <h4 className="font-semibold text-green-900 mb-1 text-sm">Customers</h4>
            <p className="text-xs text-green-700">
              Converted and active clients
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default EmptyPipeline;