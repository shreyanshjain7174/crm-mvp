'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Home, 
  Users, 
  MessageSquare, 
  BarChart3, 
  Settings, 
  Zap, 
  Target,
  Calendar,
  FileText,
  Bot,
  Workflow,
  ChevronRight,
  Menu,
  X,
  Link2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { cn } from '@/lib/utils';
import { useUserProgressStore } from '@/stores/userProgress';

interface NavigationItem {
  id: string;
  label: string;
  icon: any;
  href: string;
  badge?: string;
  requiredFeature?: string;
  isNew?: boolean;
  subItems?: NavigationItem[];
}

const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home,
    href: '/dashboard',
  },
  {
    id: 'contacts',
    label: 'Contacts',
    icon: Users,
    href: '/dashboard/contacts',
    requiredFeature: 'contacts:list',
  },
  {
    id: 'conversations',
    label: 'Conversations',
    icon: MessageSquare,
    href: '/dashboard/conversations',
    requiredFeature: 'messaging:whatsapp',
  },
  {
    id: 'pipeline',
    label: 'Pipeline',
    icon: Target,
    href: '/dashboard/pipeline',
    requiredFeature: 'pipeline:view',
  },
  {
    id: 'workflows',
    label: 'Workflows',
    icon: Workflow,
    href: '/dashboard/workflows',
    requiredFeature: 'workflow_builder',
    isNew: true,
  },
  {
    id: 'ai-agents',
    label: 'AI Agents',
    icon: Bot,
    href: '/dashboard/ai-agents',
    requiredFeature: 'ai_features',
    isNew: true,
    subItems: [
      {
        id: 'ai-templates',
        label: 'Templates',
        icon: FileText,
        href: '/dashboard/ai-agents/templates',
        requiredFeature: 'ai_features',
      },
      {
        id: 'ai-marketplace',
        label: 'Marketplace',
        icon: Zap,
        href: '/dashboard/ai-agents/marketplace',
        requiredFeature: 'ai_features',
      },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    href: '/dashboard/analytics',
    requiredFeature: 'analytics:view',
  },
  {
    id: 'calendar',
    label: 'Calendar',
    icon: Calendar,
    href: '/dashboard/calendar',
    requiredFeature: 'calendar:view',
  },
  {
    id: 'integrations',
    label: 'Integrations',
    icon: Link2,
    href: '/dashboard/integrations',
    requiredFeature: 'integrations:view',
    isNew: true,
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    href: '/dashboard/settings',
  },
];

interface ModernNavigationProps {
  isCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  className?: string;
}

export function ModernNavigation({ 
  isCollapsed = false, 
  onCollapsedChange,
  className 
}: ModernNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  const canAccessFeature = useUserProgressStore(state => state.canAccessFeature);
  const stage = useUserProgressStore(state => state.stage);
  const stats = useUserProgressStore(state => state.stats);

  // Function to get real badge count for navigation items
  const getBadgeCount = (itemId: string): string | undefined => {
    switch (itemId) {
      case 'contacts':
        return stats.contactsAdded > 0 ? stats.contactsAdded.toString() : undefined;
      case 'conversations':
        return stats.messagesSent > 0 ? stats.messagesSent.toString() : undefined;
      case 'ai-agents':
        return stats.aiInteractions > 0 ? stats.aiInteractions.toString() : undefined;
      default:
        return undefined;
    }
  };

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const handleNavigation = (href: string) => {
    router.push(href);
    setIsMobileOpen(false);
  };

  const filteredItems = navigationItems.filter(item => {
    if (!item.requiredFeature) return true;
    return canAccessFeature(item.requiredFeature as any);
  });

  const NavigationItem = ({ 
    item, 
    level = 0,
    isSubItem = false 
  }: { 
    item: NavigationItem; 
    level?: number;
    isSubItem?: boolean;
  }) => {
    const isActive = pathname === item.href;
    const isExpanded = expandedItems.has(item.id);
    const hasSubItems = item.subItems && item.subItems.length > 0;

    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: level * 0.1 }}
      >
        <motion.div
          className={cn(
            "group relative flex items-center w-full transition-all duration-300",
            "hover:bg-accent/50 rounded-xl",
            isActive && "bg-primary/10 text-primary",
            isSubItem && "ml-4 pl-4 border-l border-border/30",
            !isCollapsed ? "px-3 py-2.5" : "px-2 py-2 justify-center"
          )}
          whileHover={{ x: 2 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            variant="ghost"
            onClick={() => {
              if (hasSubItems && !isCollapsed) {
                toggleExpanded(item.id);
              } else {
                handleNavigation(item.href);
              }
            }}
            className={cn(
              "w-full justify-start h-auto p-0 bg-transparent hover:bg-transparent",
              "text-muted-foreground hover:text-foreground",
              isActive && "text-primary font-medium"
            )}
          >
            <div className="flex items-center w-full">
              {/* Icon */}
              <div className={cn(
                "flex-shrink-0 transition-all duration-300",
                !isCollapsed ? "mr-3" : "mx-0"
              )}>
                <item.icon className={cn(
                  "transition-all duration-300",
                  !isCollapsed ? "h-5 w-5" : "h-6 w-6",
                  isActive && "text-primary"
                )} />
              </div>

              {/* Label and badges - hidden when collapsed */}
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center justify-between w-full min-w-0"
                  >
                    <div className="flex items-center min-w-0">
                      <span className={cn(
                        "text-sm font-medium truncate transition-colors duration-200",
                        isActive && "text-primary"
                      )}>
                        {item.label}
                      </span>
                      
                      {/* New badge */}
                      {item.isNew && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.2 }}
                        >
                          <Badge 
                            variant="secondary" 
                            className="ml-2 px-1.5 py-0.5 text-xs bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0"
                          >
                            New
                          </Badge>
                        </motion.div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* Count badge */}
                      {(item.badge || getBadgeCount(item.id)) && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.3 }}
                        >
                          <Badge 
                            variant="outline" 
                            className="px-1.5 py-0.5 text-xs"
                          >
                            {getBadgeCount(item.id) || item.badge}
                          </Badge>
                        </motion.div>
                      )}
                      
                      {/* Expand arrow */}
                      {hasSubItems && (
                        <motion.div
                          animate={{ rotate: isExpanded ? 90 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Button>

          {/* Active indicator */}
          {isActive && (
            <motion.div
              className="absolute right-0 top-1/2 w-1 h-6 bg-primary rounded-l-full"
              layoutId="activeIndicator"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
        </motion.div>

        {/* Sub-items */}
        <AnimatePresence>
          {hasSubItems && isExpanded && !isCollapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="mt-1 space-y-1">
                {item.subItems?.map((subItem) => (
                  <NavigationItem 
                    key={subItem.id} 
                    item={subItem} 
                    level={level + 1}
                    isSubItem={true}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  // Mobile toggle button
  const MobileToggle = () => (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setIsMobileOpen(!isMobileOpen)}
      className="md:hidden fixed top-4 left-4 z-50 bg-background/80 backdrop-blur-sm border border-border/50"
    >
      {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
    </Button>
  );

  return (
    <>
      <MobileToggle />
      
      {/* Desktop Navigation */}
      <motion.nav
        className={cn(
          "hidden md:flex flex-col h-full transition-all duration-300",
          "bg-background/80 backdrop-blur-xl border-r border-border/50",
          !isCollapsed ? "w-64" : "w-16",
          className
        )}
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className={cn(
          "flex items-center border-b border-border/50 transition-all duration-300",
          !isCollapsed ? "px-4 py-6 justify-between" : "px-3 py-6 justify-center"
        )}>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center space-x-3"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
                  CRM AI
                </span>
              </motion.div>
            )}
          </AnimatePresence>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onCollapsedChange?.(!isCollapsed)}
            className="h-8 w-8 rounded-lg hover:bg-accent"
          >
            <motion.div
              animate={{ rotate: isCollapsed ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="h-4 w-4" />
            </motion.div>
          </Button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {filteredItems.map((item, index) => (
            <NavigationItem key={item.id} item={item} level={index} />
          ))}
        </div>

        {/* Theme Toggle for Collapsed State */}
        {isCollapsed && (
          <div className="p-4 border-t border-border/50 flex justify-center">
            <ThemeToggle />
          </div>
        )}

        {/* Footer - User progress indicator */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="p-4 border-t border-border/50"
            >
              <div className="space-y-3">
                {/* Theme Toggle */}
                <div className="flex justify-center">
                  <ThemeToggle />
                </div>
                
                {/* Progress Indicator */}
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-2">
                    Stage: <span className="font-medium capitalize">{stage}</span>
                  </div>
                  <div className="w-full bg-accent rounded-full h-2">
                    <motion.div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ 
                        width: stage === 'expert' ? '100%' : 
                               stage === 'advanced' ? '80%' :
                               stage === 'intermediate' ? '60%' :
                               stage === 'beginner' ? '40%' : '20%'
                      }}
                      transition={{ duration: 1, delay: 0.5 }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
              onClick={() => setIsMobileOpen(false)}
            />
            
            {/* Mobile menu */}
            <motion.nav
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="md:hidden fixed left-0 top-0 z-50 h-full w-80 bg-background border-r border-border shadow-xl"
            >
              <div className="flex flex-col h-full">
                {/* Mobile header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <Zap className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
                      CRM AI
                    </span>
                  </div>
                </div>

                {/* Mobile navigation items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {filteredItems.map((item, index) => (
                    <NavigationItem key={item.id} item={item} level={index} />
                  ))}
                </div>

                {/* Mobile Theme Toggle */}
                <div className="p-4 border-t border-border/50 flex justify-center">
                  <ThemeToggle />
                </div>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default ModernNavigation;