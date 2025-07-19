'use client';

import React from 'react';
import { MessageCircle, Send, Smartphone, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface EmptyMessagesProps {
  onStartMessaging?: () => void;
  onSetupWhatsApp?: () => void;
  hasContacts?: boolean;
  isLocked?: boolean;
  lockReason?: string;
}

export function EmptyMessages({ 
  onStartMessaging,
  onSetupWhatsApp,
  hasContacts = false,
  isLocked = false,
  lockReason
}: EmptyMessagesProps) {
  if (isLocked) {
    return (
      <Card className="border-2 border-dashed border-gray-200">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Messaging Locked
          </h3>
          <p className="text-sm text-gray-500 text-center max-w-sm mb-4">
            {lockReason || 'Complete previous steps to unlock messaging features.'}
          </p>
          <Badge variant="outline" className="text-gray-500">
            Feature Locked
          </Badge>
        </CardContent>
      </Card>
    );
  }

  if (!hasContacts) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-50 to-orange-100 rounded-full flex items-center justify-center mb-6">
            <MessageCircle className="h-10 w-10 text-orange-500" />
          </div>
          
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No conversations yet
          </h3>
          
          <p className="text-gray-500 text-center max-w-md mb-6">
            You need to add contacts before you can start messaging. Head to the Contacts section to get started.
          </p>
          
          <div className="p-4 bg-orange-50 rounded-lg max-w-md">
            <p className="text-sm text-orange-700 text-center">
              <span className="font-semibold">Next step:</span> Add your first contact to unlock WhatsApp messaging.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div className="w-20 h-20 bg-gradient-to-br from-green-50 to-green-100 rounded-full flex items-center justify-center mb-6">
          <Smartphone className="h-10 w-10 text-green-500" />
        </div>
        
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Ready to start messaging
        </h3>
        
        <p className="text-gray-500 text-center max-w-md mb-8">
          Your WhatsApp integration is ready. Start conversations with your contacts directly from the CRM.
        </p>
        
        <div className="flex gap-3">
          <Button 
            onClick={onStartMessaging}
            className="bg-green-600 hover:bg-green-700"
          >
            <Send className="h-4 w-4 mr-2" />
            Send Message
          </Button>
          
          <Button 
            variant="outline" 
            onClick={onSetupWhatsApp}
          >
            <Smartphone className="h-4 w-4 mr-2" />
            WhatsApp Setup
          </Button>
        </div>
        
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-semibold text-green-900 mb-2 text-sm">✨ Smart Features</h4>
            <p className="text-xs text-green-700">
              Send personalized messages with AI assistance and track engagement automatically.
            </p>
          </div>
          
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2 text-sm">📊 Track Everything</h4>
            <p className="text-xs text-blue-700">
              Monitor message delivery, responses, and conversation history in one place.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default EmptyMessages;