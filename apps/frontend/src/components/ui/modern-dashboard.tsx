'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Bell, 
  Plus, 
  TrendingUp, 
  Users, 
  MessageSquare,
  BarChart3,
  Zap,
  ArrowRight,
  Eye,
  Sparkles,
  Activity,
  Target,
  Calendar,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { GlassCard } from '@/components/ui/glass-card';
import { GlowingButton, AnimatedCard, FloatingElement, PulseIndicator, TypewriterText, ScrollReveal } from '@/components/ui/modern-animations';
import { cn } from '@/lib/utils';

interface UserStats {
  contactsAdded: number;
  messagesSent: number;
  aiInteractions: number;
  templatesUsed: number;
  pipelineActions: number;
  loginStreak: number;
  totalSessions: number;
}

interface ModernDashboardProps {
  children?: React.ReactNode;
  className?: string;
  userStats?: UserStats;
  showStatsCards?: boolean;
}

// Floating particles component for background
const FloatingParticles = () => {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 1,
    duration: Math.random() * 20 + 10,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-primary/20 dark:bg-primary/10"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.3, 0.8, 0.3],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

// Modern stat card with glassmorphism effect
const ModernStatCard = ({ 
  title, 
  value, 
  trend, 
  icon: Icon, 
  color = "blue",
  delay = 0 
}: {
  title: string;
  value: string | number;
  trend?: { value: number; isPositive: boolean };
  icon: any;
  color?: string;
  delay?: number;
}) => {
  const colorClasses = {
    blue: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
    green: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
    purple: 'from-purple-500/20 to-pink-500/20 border-purple-500/30',
    orange: 'from-orange-500/20 to-red-500/20 border-orange-500/30',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.5, 
        delay,
        type: "spring",
        stiffness: 100 
      }}
      whileHover={{ 
        y: -5, 
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
    >
      <GlassCard className={cn(
        "relative overflow-hidden transition-all duration-300",
        "hover:shadow-2xl hover:shadow-blue-500/25 dark:hover:shadow-blue-400/25"
      )}>
        <div className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-10",
          colorClasses[color as keyof typeof colorClasses]
        )} />
        
        <CardContent className="p-6 relative">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                {title}
              </p>
              <motion.p 
                className="text-3xl font-bold"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: delay + 0.2, type: "spring" }}
              >
                {value}
              </motion.p>
              {trend && (
                <motion.div 
                  className="flex items-center space-x-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: delay + 0.4 }}
                >
                  <TrendingUp className={cn(
                    "h-4 w-4",
                    trend.isPositive ? "text-green-500" : "text-red-500"
                  )} />
                  <span className={cn(
                    "text-sm font-medium",
                    trend.isPositive ? "text-green-500" : "text-red-500"
                  )}>
                    {trend.isPositive ? '+' : ''}{trend.value}%
                  </span>
                </motion.div>
              )}
            </div>
            
            <motion.div 
              className={cn(
                "h-12 w-12 rounded-xl flex items-center justify-center",
                "bg-gradient-to-br shadow-lg",
                colorClasses[color as keyof typeof colorClasses]
              )}
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <Icon className="h-6 w-6 text-white" />
            </motion.div>
          </div>
        </CardContent>
      </GlassCard>
    </motion.div>
  );
};

// Modern search bar with glassmorphism
const ModernSearchBar = () => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <motion.div 
      className="relative w-full max-w-md"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className={cn(
        "relative transition-all duration-300",
        isFocused && "scale-105"
      )}>
        <Search className={cn(
          "absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 transition-colors duration-200",
          isFocused ? "text-primary" : "text-muted-foreground"
        )} />
        <Input
          placeholder="Search anything..."
          className={cn(
            "pl-10 h-11 rounded-xl border-0",
            "bg-white/10 dark:bg-black/10 backdrop-blur-xl",
            "border border-white/20 dark:border-white/10",
            "focus:border-primary/50 focus:ring-2 focus:ring-primary/20",
            "transition-all duration-300"
          )}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
      </div>
    </motion.div>
  );
};

// Quick action button with modern styling
const QuickActionButton = ({ 
  icon: Icon, 
  label, 
  color = "primary",
  onClick,
  delay = 0 
}: {
  icon: any;
  label: string;
  color?: string;
  onClick?: () => void;
  delay?: number;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      <GlowingButton
        onClick={onClick}
        variant="secondary"
        className={cn(
          "h-20 w-full flex flex-col items-center justify-center space-y-2",
          "bg-white/5 dark:bg-black/5 backdrop-blur-sm",
          "border border-white/10 dark:border-white/5",
          "hover:bg-white/10 dark:hover:bg-black/10",
          "transition-all duration-300"
        )}
      >
        <Icon className="h-6 w-6" />
        <span className="text-xs font-medium">{label}</span>
      </GlowingButton>
    </motion.div>
  );
};

// Modern notification bell with animated badge
const ModernNotificationBell = ({ count = 3 }: { count?: number }) => {
  return (
    <motion.div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "relative h-10 w-10 rounded-xl",
          "bg-white/10 dark:bg-black/10 backdrop-blur-sm",
          "border border-white/20 dark:border-white/10",
          "hover:bg-white/20 dark:hover:bg-black/20",
          "transition-all duration-300"
        )}
      >
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <motion.div
            className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500 }}
          >
            <motion.span 
              className="text-xs font-bold text-white"
              animate={{ 
                scale: [1, 1.2, 1],
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            >
              {count}
            </motion.span>
          </motion.div>
        )}
      </Button>
    </motion.div>
  );
};

export function ModernDashboard({ children, className, userStats, showStatsCards = false }: ModernDashboardProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={cn(
      "min-h-screen relative overflow-hidden",
      // Modern gradient backgrounds with dark mode support
      "bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-100/50",
      "dark:from-slate-900 dark:via-slate-800 dark:to-slate-900",
      "transition-all duration-500",
      className
    )}>
      {/* Floating particles background */}
      <FloatingParticles />
      
      {/* Modern glassmorphism header */}
      <motion.header 
        className={cn(
          "sticky top-0 z-50 w-full backdrop-blur-xl",
          "bg-white/20 dark:bg-black/20",
          "border-b border-white/20 dark:border-white/10",
          "transition-all duration-300"
        )}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, type: "spring" }}
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left side - Search and navigation */}
            <div className="flex items-center space-x-6">
              <motion.div 
                className="flex items-center space-x-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
                  CRM AI
                </span>
              </motion.div>
              
              <ModernSearchBar />
            </div>

            {/* Right side - Actions and user */}
            <div className="flex items-center space-x-4">
              {/* Time display */}
              <motion.div 
                className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Clock className="h-4 w-4" />
                <span>{currentTime.toLocaleTimeString()}</span>
              </motion.div>

              {/* Notifications */}
              <ModernNotificationBell />
              
              {/* User avatar */}
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, type: "spring" }}
              >
                <Button
                  variant="ghost"
                  className={cn(
                    "h-10 w-10 rounded-xl p-0",
                    "bg-gradient-to-br from-blue-500 to-purple-600",
                    "hover:from-blue-600 hover:to-purple-700",
                    "transition-all duration-300"
                  )}
                >
                  <span className="text-white font-medium">U</span>
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main content area */}
      <main className="container mx-auto px-6 py-8 relative z-10">
        {/* Welcome section with modern typography */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                <TypewriterText 
                  text="Welcome back! 👋" 
                  className="bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent dark:from-slate-100 dark:to-slate-400"
                />
              </h1>
              <p className="text-lg text-muted-foreground">
                Here&apos;s what&apos;s happening with your business today.
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <QuickActionButton 
                icon={Plus} 
                label="Add Contact" 
                delay={0.1}
              />
              <QuickActionButton 
                icon={MessageSquare} 
                label="Send Message" 
                delay={0.2}
              />
              <QuickActionButton 
                icon={BarChart3} 
                label="View Analytics" 
                delay={0.3}
              />
            </div>
          </div>
        </motion.div>

        {/* Modern stats grid - only show if enabled and user has data */}
        {showStatsCards && userStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <ModernStatCard
              title="Total Contacts"
              value={userStats.contactsAdded.toString()}
              trend={{ value: userStats.contactsAdded > 0 ? 12 : 0, isPositive: true }}
              icon={Users}
              color="blue"
              delay={0.1}
            />
            <ModernStatCard
              title="Messages Sent"
              value={userStats.messagesSent.toString()}
              trend={{ value: userStats.messagesSent > 0 ? 8 : 0, isPositive: true }}
              icon={MessageSquare}
              color="green"
              delay={0.2}
            />
            <ModernStatCard
              title="Pipeline Actions"
              value={userStats.pipelineActions.toString()}
              trend={{ value: userStats.pipelineActions > 0 ? 3 : 0, isPositive: true }}
              icon={Target}
              color="purple"
              delay={0.3}
            />
            <ModernStatCard
              title="AI Interactions"
              value={userStats.aiInteractions.toString()}
              trend={{ value: userStats.aiInteractions > 0 ? 15 : 0, isPositive: true }}
              icon={Zap}
              color="orange"
              delay={0.4}
            />
          </div>
        )}

        {/* AI Assistant floating card */}
        <ScrollReveal delay={0.5}>
          <FloatingElement>
            <GlassCard className="mb-8 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">AI Assistant Ready</h3>
                    <p className="text-muted-foreground">
                      I&apos;ve found 3 new opportunities that need your attention
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <PulseIndicator color="green" />
                  <Button 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    View Insights
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
            </GlassCard>
          </FloatingElement>
        </ScrollReveal>

        {/* Content area */}
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default ModernDashboard;