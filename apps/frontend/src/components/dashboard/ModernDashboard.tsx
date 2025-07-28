'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  MessageSquare, 
  TrendingUp, 
  Zap, 
  Bot,
  BarChart3,
  ArrowUpRight,
  Sparkles,
  Target,
  Activity,
  Clock,
  Star
} from 'lucide-react';
import { GlassCard, FluidButton, LiquidShape, FloatingParticles, GradientBlob, NeomorphCard } from '@/components/ui/glass-card';
import { AnimatedCard, GlowingButton, PulseIndicator, GradientText, TypewriterText } from '@/components/ui/modern-animations';
import { useUserProgressStore } from '@/stores/userProgress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { themeText, statusColors, cn } from '@/utils/theme-colors';

interface StatCardProps {
  title: string;
  value: string | number;
  change: string;
  icon: React.ReactNode;
  color: string;
  delay: number;
}

function StatCard({ title, value, change, icon, color, delay }: StatCardProps) {
  return (
    <AnimatedCard delay={delay} className="relative overflow-hidden">
      <FloatingParticles count={5} color={color} />
      <div className="p-6 relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br from-${color}-100 to-${color}-200`}>
            {icon}
          </div>
          <Badge className={cn(statusColors.success.bg, statusColors.success.text, "border-0")}>
            {change}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <h3 className={cn("text-sm font-medium", themeText.secondary)}>{title}</h3>
          <motion.p 
            className={cn("text-3xl font-bold", themeText.primary)}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: delay + 0.3, duration: 0.5 }}
          >
            {value}
          </motion.p>
        </div>
      </div>
    </AnimatedCard>
  );
}

interface AIAgentCardProps {
  name: string;
  status: 'active' | 'idle' | 'busy';
  tasks: number;
  efficiency: number;
  delay: number;
}

function AIAgentCard({ name, status, tasks, efficiency, delay }: AIAgentCardProps) {
  const statusColors = {
    active: 'green',
    idle: 'gray',
    busy: 'blue'
  };

  const statusLabels = {
    active: 'Active',
    idle: 'Idle',
    busy: 'Processing'
  };

  return (
    <GlassCard className="p-6 relative" glow={status === 'active'}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <PulseIndicator 
              color={`bg-${statusColors[status]}-500`}
              size={3}
              className="absolute -top-1 -right-1"
            />
          </div>
          <div>
            <h3 className={cn("font-semibold", themeText.primary)}>{name}</h3>
            <p className={cn("text-sm", themeText.secondary)}>{statusLabels[status]}</p>
          </div>
        </div>
        
        <LiquidShape 
          size={40} 
          color={statusColors[status] === 'green' ? '#10B981' : statusColors[status] === 'blue' ? '#3B82F6' : '#6B7280'} 
        />
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className={cn("text-sm", themeText.secondary)}>Tasks Completed</span>
          <span className={cn("font-semibold", themeText.primary)}>{tasks}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className={cn("text-sm", themeText.secondary)}>Efficiency</span>
          <span className="font-semibold text-green-600 dark:text-green-400">{efficiency}%</span>
        </div>
        
        <div className="w-full bg-muted rounded-full h-2">
          <motion.div 
            className="bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${efficiency}%` }}
            transition={{ delay: delay + 0.5, duration: 1 }}
          />
        </div>
      </div>
    </GlassCard>
  );
}

export function ModernDashboard() {
  const { stats, stage } = useUserProgressStore();
  const [timeOfDay, setTimeOfDay] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setTimeOfDay('morning');
    else if (hour < 17) setTimeOfDay('afternoon');
    else setTimeOfDay('evening');
  }, []);

  const greetings = {
    morning: 'Good morning! ☀️',
    afternoon: 'Good afternoon! 🌤️',
    evening: 'Good evening! 🌙'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 relative overflow-hidden">
      {/* Background Elements */}
      <FloatingParticles count={30} color="#6366F1" className="opacity-30" />
      <div className="absolute top-20 right-20">
        <GradientBlob size={300} colors={['#FF6B9D', '#C44569', '#6C5CE7']} />
      </div>
      <div className="absolute bottom-20 left-20">
        <GradientBlob size={200} colors={['#4FACFE', '#00F2FE', '#0093E6']} />
      </div>
      
      <div className="relative z-10 container mx-auto px-6 py-8">
        {/* Header */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold mb-2">
            <GradientText animate>
              {greetings[timeOfDay as keyof typeof greetings]}
            </GradientText>
          </h1>
          <TypewriterText 
            text="Your AI-powered CRM is working hard to grow your business"
            className={cn("text-lg", themeText.secondary)}
            speed={30}
          />
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Contacts"
            value={stats.contactsAdded}
            change="+12%"
            icon={<Users className="w-6 h-6 text-blue-600" />}
            color="blue"
            delay={0.1}
          />
          <StatCard
            title="Messages Sent"
            value={stats.messagesSent}
            change="+23%"
            icon={<MessageSquare className="w-6 h-6 text-green-600" />}
            color="green"
            delay={0.2}
          />
          <StatCard
            title="AI Interactions"
            value={stats.aiInteractions}
            change="+45%"
            icon={<Bot className="w-6 h-6 text-purple-600" />}
            color="purple"
            delay={0.3}
          />
          <StatCard
            title="Conversion Rate"
            value="24.5%"
            change="+8%"
            icon={<TrendingUp className="w-6 h-6 text-orange-600" />}
            color="orange"
            delay={0.4}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* AI Agents Panel */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <h2 className={cn("text-2xl font-bold mb-6 flex items-center gap-3", themeText.primary)}>
                <Sparkles className="w-7 h-7 text-purple-500" />
                AI Workforce
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AIAgentCard
                  name="Sales Assistant"
                  status="active"
                  tasks={42}
                  efficiency={94}
                  delay={0.6}
                />
                <AIAgentCard
                  name="Customer Support"
                  status="busy"
                  tasks={28}
                  efficiency={87}
                  delay={0.7}
                />
                <AIAgentCard
                  name="Lead Qualifier"
                  status="active"
                  tasks={15}
                  efficiency={91}
                  delay={0.8}
                />
                <AIAgentCard
                  name="Follow-up Manager"
                  status="idle"
                  tasks={7}
                  efficiency={89}
                  delay={0.9}
                />
              </div>
            </motion.div>
          </div>

          {/* Quick Actions */}
          <div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <h2 className={cn("text-2xl font-bold mb-6 flex items-center gap-3", themeText.primary)}>
                <Zap className="w-7 h-7 text-yellow-500" />
                Quick Actions
              </h2>
              
              <div className="space-y-4">
                <NeomorphCard className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className={cn("font-semibold", themeText.primary)}>Create Workflow</h3>
                      <p className={cn("text-sm", themeText.secondary)}>Automate your processes</p>
                    </div>
                  </div>
                  <FluidButton variant="gradient" className="w-full">
                    Start Building
                  </FluidButton>
                </NeomorphCard>

                <NeomorphCard className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                      <Activity className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className={cn("font-semibold", themeText.primary)}>Analytics</h3>
                      <p className={cn("text-sm", themeText.secondary)}>View detailed insights</p>
                    </div>
                  </div>
                  <FluidButton variant="primary" className="w-full">
                    View Reports
                  </FluidButton>
                </NeomorphCard>

                <NeomorphCard className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                      <Star className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className={cn("font-semibold", themeText.primary)}>AI Training</h3>
                      <p className={cn("text-sm", themeText.secondary)}>Improve AI accuracy</p>
                    </div>
                  </div>
                  <FluidButton variant="secondary" className="w-full">
                    Train Models
                  </FluidButton>
                </NeomorphCard>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Recent Activity */}
        <motion.div
          className="mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <h2 className={cn("text-2xl font-bold mb-6 flex items-center gap-3", themeText.primary)}>
            <Clock className={cn("w-7 h-7", themeText.secondary)} />
            Recent Activity
          </h2>
          
          <GlassCard className="p-6">
            <div className="space-y-4">
              {[
                { action: 'New contact added', contact: 'Sarah Johnson', time: '2 minutes ago', type: 'contact' },
                { action: 'AI responded to inquiry', contact: 'Mark Wilson', time: '5 minutes ago', type: 'ai' },
                { action: 'Lead moved to qualified', contact: 'Tech Solutions Ltd', time: '12 minutes ago', type: 'pipeline' },
                { action: 'Follow-up scheduled', contact: 'Emma Davis', time: '18 minutes ago', type: 'task' }
              ].map((activity, index) => (
                <motion.div
                  key={index}
                  className="flex items-center gap-4 p-4 rounded-lg hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.1 + (index * 0.1) }}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    activity.type === 'contact' ? 'bg-blue-100 dark:bg-blue-900/50' :
                    activity.type === 'ai' ? 'bg-purple-100 dark:bg-purple-900/50' :
                    activity.type === 'pipeline' ? 'bg-green-100 dark:bg-green-900/50' : 'bg-orange-100 dark:bg-orange-900/50'
                  }`}>
                    {activity.type === 'contact' && <Users className="w-5 h-5 text-blue-600" />}
                    {activity.type === 'ai' && <Bot className="w-5 h-5 text-purple-600" />}
                    {activity.type === 'pipeline' && <TrendingUp className="w-5 h-5 text-green-600" />}
                    {activity.type === 'task' && <Clock className="w-5 h-5 text-orange-600" />}
                  </div>
                  
                  <div className="flex-1">
                    <p className={cn("font-medium", themeText.primary)}>{activity.action}</p>
                    <p className={cn("text-sm", themeText.secondary)}>{activity.contact}</p>
                  </div>
                  
                  <span className={cn("text-sm", themeText.muted)}>{activity.time}</span>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}