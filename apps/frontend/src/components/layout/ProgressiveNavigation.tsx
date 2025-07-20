'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  MessageCircle, 
  BarChart3, 
  Bot,
  Settings,
  Lock,
  Star
} from 'lucide-react';
import { useUserProgressStore } from '@/stores/userProgress';
import { FeatureMenuItem } from '@/components/ui/FeatureGate';
import { Badge } from '@/components/ui/badge';

interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  feature?: string;
  requiredStage?: string;
  description?: string;
}

const allNavigationItems: NavigationItem[] = [
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: LayoutDashboard,
    description: 'Your CRM overview'
  },
  { 
    name: 'Contacts', 
    href: '/dashboard/leads', 
    icon: Users,
    feature: 'contacts:list',
    requiredStage: 'beginner',
    description: 'Manage your contacts and leads'
  },
  { 
    name: 'Messages', 
    href: '/dashboard/messages', 
    icon: MessageCircle,
    feature: 'messages:send',
    requiredStage: 'beginner',
    description: 'WhatsApp messaging'
  },
  { 
    name: 'Pipeline', 
    href: '/dashboard/pipeline', 
    icon: BarChart3,
    feature: 'pipeline:view',
    requiredStage: 'intermediate',
    description: 'Sales pipeline management'
  },
  { 
    name: 'AI Assistant', 
    href: '/dashboard/ai-assistant', 
    icon: Bot,
    feature: 'ai:suggestions',
    requiredStage: 'advanced',
    description: 'AI-powered assistance'
  },
  { 
    name: 'Analytics', 
    href: '/dashboard/analytics', 
    icon: BarChart3,
    feature: 'analytics:full',
    requiredStage: 'expert',
    description: 'Advanced analytics'
  },
  { 
    name: 'Achievements', 
    href: '/dashboard/achievements', 
    icon: Star,
    description: 'Track your progress and unlock rewards'
  },
  { 
    name: 'Settings', 
    href: '/dashboard/settings', 
    icon: Settings,
    description: 'Account and preferences'
  }
];

export function ProgressiveNavigation() {
  const pathname = usePathname();
  const stage = useUserProgressStore(state => state.stage);
  const stats = useUserProgressStore(state => state.stats);
  const progressPercentage = useUserProgressStore(state => state.getProgressPercentage);
  const nextStageRequirements = useUserProgressStore(state => state.getNextStageRequirements);
  
  const getStageInfo = () => {
    const stageInfo = {
      new: { title: 'New User', color: 'bg-blue-500', emoji: '👋' },
      beginner: { title: 'Getting Started', color: 'bg-green-500', emoji: '🌱' },
      intermediate: { title: 'Building Network', color: 'bg-purple-500', emoji: '📈' },
      advanced: { title: 'AI-Powered', color: 'bg-orange-500', emoji: '🤖' },
      expert: { title: 'CRM Master', color: 'bg-yellow-500', emoji: '🚀' }
    };
    
    return stageInfo[stage] || stageInfo.new;
  };
  
  const stageInfo = getStageInfo();
  
  return (
    <nav className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">CRM MVP</h1>
        <p className="text-sm text-gray-500">Progressive CRM Platform</p>
      </div>
      
      {/* User Progress */}
      <div className="p-4 border-b border-gray-200 bg-slate-50">
        <div className="flex items-center gap-3 mb-3">
          <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-white text-sm', stageInfo.color)}>
            {stageInfo.emoji}
          </div>
          <div>
            <p className="font-medium text-sm text-gray-900">{stageInfo.title}</p>
            <p className="text-xs text-gray-500">{Math.round(progressPercentage())}% Complete</p>
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div 
            className={cn('h-2 rounded-full transition-all duration-500', stageInfo.color)}
            style={{ width: `${progressPercentage()}%` }}
          />
        </div>
        
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <div className="font-semibold text-gray-900">{stats.contactsAdded}</div>
            <div className="text-gray-500">Contacts</div>
          </div>
          <div>
            <div className="font-semibold text-gray-900">{stats.messagesSent}</div>
            <div className="text-gray-500">Messages</div>
          </div>
          <div>
            <div className="font-semibold text-gray-900">{stats.aiInteractions}</div>
            <div className="text-gray-500">AI Helps</div>
          </div>
        </div>
      </div>
      
      {/* Navigation Items */}
      <div className="flex-1 px-4 py-6">
        <ul className="space-y-2">
          {allNavigationItems.map((item) => {
            const isActive = pathname === item.href;
            
            // Check if feature is available
            if (item.feature) {
              return (
                <FeatureMenuItem key={item.name} feature={item.feature as any}>
                  <li>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors relative',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-gray-700 hover:bg-gray-100'
                      )}
                    >
                      <item.icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </Link>
                  </li>
                </FeatureMenuItem>
              );
            }
            
            // Always available items (Dashboard, Settings)
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
        
        {/* Locked Features Preview */}
        <div className="mt-8">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Coming Soon
          </h3>
          <ul className="space-y-2">
            {allNavigationItems
              .filter(item => item.feature && item.requiredStage !== stage)
              .slice(0, 2) // Show only next 2 features
              .map((item) => (
                <li key={item.name}>
                  <div className="flex items-center px-3 py-2 text-sm text-gray-400 rounded-md cursor-not-allowed">
                    <Lock className="mr-3 h-4 w-4" />
                    <span className="flex-1">{item.name}</span>
                    <Badge variant="outline" className="text-xs">
                      Soon
                    </Badge>
                  </div>
                  {item.description && (
                    <p className="text-xs text-gray-400 ml-10 mt-1">
                      {item.description}
                    </p>
                  )}
                </li>
              ))}
          </ul>
        </div>
        
        {/* Next Goal */}
        {stage !== 'expert' && (
          <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-blue-500" />
              <h4 className="text-sm font-semibold text-blue-900">Next Goal</h4>
            </div>
            <div className="space-y-1">
              {nextStageRequirements().slice(0, 2).map((req, index) => (
                <p key={index} className="text-xs text-blue-700">
                  {req}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
      
    </nav>
  );
}

export default ProgressiveNavigation;