'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Bot, ChevronDown, MessageSquare, UserCheck, TrendingUp, FileText } from 'lucide-react';
import { aiService } from '@/lib/ai-service';
import { toast } from 'sonner';

interface AIQuickActionsProps {
  leadData: any;
  onActionComplete?: () => void;
}

export function AIQuickActions({ leadData, onActionComplete }: AIQuickActionsProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleQuickAction = async (action: string, description: string) => {
    try {
      setIsLoading(action);
      
      let result;
      switch (action) {
        case 'qualify':
          result = await aiService.qualifyLead(leadData);
          break;
        case 'message':
          result = await aiService.generateMessage(leadData, 'follow_up');
          break;
        default:
          return;
      }

      // Show result in toast
      if (result.success) {
        toast.success(`AI completed: ${description}`, {
          description: result.result.substring(0, 100) + '...',
          duration: 5000,
        });
      } else {
        toast.error(`Failed to ${description.toLowerCase()}`);
      }
      
      onActionComplete?.();
    } catch (error) {
      console.error(`Failed to ${action}:`, error);
      toast.error(`Failed to ${description.toLowerCase()}`);
    } finally {
      setIsLoading(null);
    }
  };

  const quickActions = [
    {
      id: 'qualify',
      label: 'Qualify Lead',
      description: 'AI analysis and scoring',
      icon: UserCheck,
      color: 'text-blue-600'
    },
    {
      id: 'message',
      label: 'Generate Message',
      description: 'Create follow-up message',
      icon: MessageSquare,
      color: 'text-green-600'
    }
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <Bot className="w-4 h-4" />
          AI Actions
          <ChevronDown className="w-3 h-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1 border-b">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium">AI Employee Actions</span>
            <Badge variant="outline" className="text-xs text-green-600">
              $0 cost
            </Badge>
          </div>
        </div>
        
        {quickActions.map((action) => {
          const Icon = action.icon;
          const isCurrentlyLoading = isLoading === action.id;
          
          return (
            <DropdownMenuItem
              key={action.id}
              onClick={() => handleQuickAction(action.id, action.label)}
              disabled={!!isLoading}
              className="flex items-center gap-3 p-3"
            >
              <Icon className={`w-4 h-4 ${action.color}`} />
              <div className="flex-1">
                <div className="text-sm font-medium">{action.label}</div>
                <div className="text-xs text-gray-500">{action.description}</div>
              </div>
              {isCurrentlyLoading && (
                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
              )}
            </DropdownMenuItem>
          );
        })}
        
        <div className="px-2 py-1 border-t">
          <div className="text-xs text-gray-500">
            Powered by local AI • Always free
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AIQuickButton({ leadData, onActionComplete }: AIQuickActionsProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleQuickQualify = async () => {
    try {
      setIsLoading(true);
      const result = await aiService.qualifyLead(leadData);
      
      if (result.success) {
        toast.success('Lead qualified by AI', {
          description: result.result.substring(0, 100) + '...',
          duration: 5000,
        });
      } else {
        toast.error('Failed to qualify lead');
      }
      
      onActionComplete?.();
    } catch (error) {
      console.error('Failed to qualify lead:', error);
      toast.error('Failed to qualify lead');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleQuickQualify}
      disabled={isLoading}
      className="gap-1"
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
      ) : (
        <Bot className="w-4 h-4" />
      )}
      AI Qualify
    </Button>
  );
}