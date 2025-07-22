'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { UserPlus, ArrowRight, CheckCircle, Sparkles, Zap, Target } from 'lucide-react';
import { GlassCard, FluidButton, GradientBlob, FloatingParticles } from '@/components/ui/glass-card';
import { TypewriterText, GradientText } from '@/components/ui/modern-animations';
import { useUserProgressStore } from '@/stores/userProgress';
import { useFeatureTracker } from '@/hooks/useFeatureGate';

interface ModernNewUserStageProps {
  onAddContact: () => void;
}

export function ModernNewUserStage({ onAddContact }: ModernNewUserStageProps) {
  const { trackFeatureUsage } = useFeatureTracker();
  const currentHint = useUserProgressStore(state => state.currentHint);
  
  const handleGetStarted = () => {
    trackFeatureUsage('contacts:create');
    onAddContact();
  };
  
  const steps = [
    {
      id: 1,
      title: 'Add Your First Contact',
      description: 'Start by adding someone important to your business',
      icon: UserPlus,
      status: 'current' as const,
      action: handleGetStarted,
      color: 'from-blue-500 to-purple-600'
    },
    {
      id: 2,
      title: 'Send a WhatsApp Message',
      description: 'Engage with your contact directly from the CRM',
      icon: ArrowRight,
      status: 'upcoming' as const,
      color: 'from-green-500 to-emerald-600'
    },
    {
      id: 3,
      title: 'Unlock AI Assistant',
      description: 'Let AI help you manage conversations efficiently',
      icon: CheckCircle,
      status: 'upcoming' as const,
      color: 'from-purple-500 to-pink-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 relative overflow-hidden">
      {/* Background Elements */}
      <FloatingParticles count={40} color="#6366F1" className="opacity-20" />
      
      <div className="absolute top-10 right-10">
        <GradientBlob size={400} colors={['#60A5FA', '#A78BFA', '#F472B6']} />
      </div>
      
      <div className="absolute bottom-20 left-10">
        <GradientBlob size={300} colors={['#34D399', '#60A5FA', '#A78BFA']} />
      </div>

      <div className="relative z-10 container mx-auto px-6 py-12">
        {/* Hero Section */}
        <motion.div 
          className="text-center py-16 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div 
            className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl"
            animate={{ 
              rotate: [0, 5, -5, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{ 
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Sparkles className="w-12 h-12 text-white" />
          </motion.div>

          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <GradientText animate className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
              Welcome to the Future
            </GradientText>
            <br />
            <span className="text-gray-900">of CRM</span>
          </h1>

          <div className="max-w-3xl mx-auto mb-8">
            <TypewriterText 
              text="Your AI-powered customer relationship platform that grows with you. Start simple, scale smart, and let artificial intelligence handle the complexity."
              className="text-xl text-gray-600 leading-relaxed"
              speed={30}
            />
          </div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 3, duration: 0.6 }}
          >
            <FluidButton 
              onClick={handleGetStarted}
              variant="gradient"
              size="lg"
              className="px-12 py-4 text-xl font-bold shadow-2xl"
            >
              <UserPlus className="w-6 h-6 mr-3" />
              Start Your Journey
            </FluidButton>
          </motion.div>
          
          {currentHint && (
            <motion.div 
              className="mt-8 max-w-md mx-auto"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 3.5 }}
            >
              <GlassCard className="p-4 border border-blue-200/50">
                <p className="text-blue-700 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  {currentHint}
                </p>
              </GlassCard>
            </motion.div>
          )}
        </motion.div>
        
        {/* Journey Steps */}
        <div className="max-w-5xl mx-auto mb-16">
          <motion.h2 
            className="text-3xl font-bold text-center mb-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            Your <GradientText>3-Step Journey</GradientText> to CRM Mastery
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              const isCurrent = step.status === 'current';
              
              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 + (index * 0.2), duration: 0.6 }}
                >
                  <GlassCard 
                    className={`p-8 h-full relative ${isCurrent ? 'ring-2 ring-blue-500' : ''}`}
                    glow={isCurrent}
                  >
                    <div className="text-center">
                      <motion.div 
                        className={`w-16 h-16 bg-gradient-to-r ${step.color} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg`}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ duration: 0.3 }}
                      >
                        <IconComponent className="w-8 h-8 text-white" />
                      </motion.div>
                      
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <span className="text-sm font-semibold text-gray-500">STEP {step.id}</span>
                        {isCurrent && (
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <Target className="w-4 h-4 text-blue-500" />
                          </motion.div>
                        )}
                      </div>
                      
                      <h3 className="text-xl font-bold text-gray-900 mb-3">
                        {step.title}
                      </h3>
                      
                      <p className="text-gray-600 mb-6 leading-relaxed">
                        {step.description}
                      </p>
                      
                      {isCurrent && step.action && (
                        <FluidButton 
                          onClick={step.action}
                          variant="primary"
                          className="w-full"
                        >
                          Get Started
                        </FluidButton>
                      )}
                    </div>

                    {/* Step connector */}
                    {index < steps.length - 1 && (
                      <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 1.5 + (index * 0.2) }}
                        >
                          <ArrowRight className="w-8 h-8 text-gray-300" />
                        </motion.div>
                      </div>
                    )}
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>
        </div>
        
        {/* Feature Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2, duration: 0.8 }}
        >
          <GlassCard className="p-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">
                Unlock Powerful Features as You Grow
              </h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                Our progressive platform reveals new capabilities based on your usage, 
                ensuring you&apos;re never overwhelmed while building toward an AI-powered business.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: '📱',
                  title: 'WhatsApp Integration',
                  description: 'Send messages directly from your CRM with smart templates and automation',
                  gradient: 'from-green-400 to-emerald-500'
                },
                {
                  icon: '📊',
                  title: 'Smart Analytics',
                  description: 'Track performance with AI-powered insights and predictive analytics',
                  gradient: 'from-blue-400 to-purple-500'
                },
                {
                  icon: '🤖',
                  title: 'AI Workforce',
                  description: 'Deploy autonomous AI agents to handle tasks while you focus on strategy',
                  gradient: 'from-purple-400 to-pink-500'
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  className="text-center"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 2.5 + (index * 0.2), duration: 0.5 }}
                >
                  <div className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl shadow-lg`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}