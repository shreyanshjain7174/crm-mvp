'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Star, Award, Zap, Crown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface StageTransitionProps {
  isVisible: boolean;
  fromStage: string;
  toStage: string;
  onComplete?: () => void;
  achievements?: string[];
}

const stageInfo = {
  new: {
    title: 'New User',
    emoji: '👋',
    color: 'from-blue-500 to-blue-600',
    icon: Star
  },
  beginner: {
    title: 'Getting Started',
    emoji: '🌱',
    color: 'from-green-500 to-green-600',
    icon: TrendingUp
  },
  intermediate: {
    title: 'Building Network',
    emoji: '📈',
    color: 'from-purple-500 to-purple-600',
    icon: Award
  },
  advanced: {
    title: 'AI-Powered',
    emoji: '🤖',
    color: 'from-orange-500 to-orange-600',
    icon: Zap
  },
  expert: {
    title: 'CRM Master',
    emoji: '🚀',
    color: 'from-yellow-500 to-yellow-600',
    icon: Crown
  }
};

export function StageTransition({ 
  isVisible, 
  fromStage, 
  toStage, 
  onComplete,
  achievements = []
}: StageTransitionProps) {
  const [animationStep, setAnimationStep] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  const fromInfo = stageInfo[fromStage as keyof typeof stageInfo];
  const toInfo = stageInfo[toStage as keyof typeof stageInfo];

  useEffect(() => {
    if (isVisible) {
      setAnimationStep(0);
      setShowConfetti(false);
      
      // Animation sequence
      const step1 = setTimeout(() => setAnimationStep(1), 500);
      const step2 = setTimeout(() => setAnimationStep(2), 1500);
      const step3 = setTimeout(() => setAnimationStep(3), 2500);
      const confetti = setTimeout(() => setShowConfetti(true), 3000);
      
      return () => {
        clearTimeout(step1);
        clearTimeout(step2);
        clearTimeout(step3);
        clearTimeout(confetti);
      };
    }
  }, [isVisible]);

  const FromIcon = fromInfo?.icon || Star;
  const ToIcon = toInfo?.icon || Star;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          {/* Confetti particles */}
          {showConfetti && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(30)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'][i % 6],
                    left: Math.random() * 100 + '%',
                    top: '-10px'
                  }}
                  initial={{ y: -10, opacity: 1, rotate: 0 }}
                  animate={{
                    y: window.innerHeight + 10,
                    opacity: 0,
                    rotate: 360,
                    x: [-50, 50, -50][Math.floor(Math.random() * 3)]
                  }}
                  transition={{
                    duration: 3 + Math.random() * 2,
                    delay: Math.random() * 2,
                    ease: "easeOut"
                  }}
                />
              ))}
            </div>
          )}

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative max-w-lg w-full"
          >
            <Card className="border-0 shadow-2xl overflow-hidden">
              <CardContent className="p-0">
                {/* Header */}
                <motion.div
                  className={`relative p-8 bg-gradient-to-br ${toInfo?.color || 'from-blue-500 to-blue-600'} text-white overflow-hidden`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {/* Background pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] bg-[length:20px_20px]" />
                  </div>
                  
                  <div className="relative z-10 text-center">
                    <motion.div
                      initial={{ y: -20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Badge className="bg-white/20 text-white border-white/30 mb-4">
                        Stage Progression!
                      </Badge>
                    </motion.div>
                    
                    <h1 className="text-2xl font-bold mb-6">Congratulations! 🎉</h1>
                    
                    {/* Stage transition animation */}
                    <div className="flex items-center justify-center gap-6 mb-6">
                      {/* From stage */}
                      <motion.div
                        initial={{ scale: 1, opacity: 1 }}
                        animate={animationStep >= 1 ? { scale: 0.8, opacity: 0.6 } : {}}
                        transition={{ duration: 0.5 }}
                        className="text-center"
                      >
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-2 backdrop-blur-sm">
                          <FromIcon className="w-8 h-8 text-white" />
                        </div>
                        <p className="text-sm text-white/80">{fromInfo?.title}</p>
                      </motion.div>
                      
                      {/* Arrow */}
                      <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={animationStep >= 1 ? { x: 0, opacity: 1 } : {}}
                        transition={{ delay: 0.5, duration: 0.5 }}
                      >
                        <TrendingUp className="w-8 h-8 text-white" />
                      </motion.div>
                      
                      {/* To stage */}
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0.6 }}
                        animate={animationStep >= 2 ? { scale: 1.2, opacity: 1 } : {}}
                        transition={{ 
                          delay: 1,
                          type: "spring",
                          stiffness: 300,
                          damping: 15
                        }}
                        className="text-center"
                      >
                        <motion.div
                          animate={animationStep >= 2 ? {
                            boxShadow: [
                              '0 0 0 0 rgba(255,255,255,0.4)',
                              '0 0 0 20px rgba(255,255,255,0)',
                              '0 0 0 0 rgba(255,255,255,0)'
                            ]
                          } : {}}
                          transition={{ delay: 1.2, duration: 1.5 }}
                          className="w-16 h-16 bg-white/30 rounded-full flex items-center justify-center mb-2 backdrop-blur-sm"
                        >
                          <ToIcon className="w-8 h-8 text-white" />
                        </motion.div>
                        <p className="text-sm font-semibold">{toInfo?.title}</p>
                      </motion.div>
                    </div>
                    
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={animationStep >= 3 ? { y: 0, opacity: 1 } : {}}
                      transition={{ delay: 1.5 }}
                      className="text-4xl mb-2"
                    >
                      {toInfo?.emoji}
                    </motion.div>
                  </div>
                </motion.div>

                {/* Content */}
                <div className="p-8">
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={animationStep >= 3 ? { y: 0, opacity: 1 } : {}}
                    transition={{ delay: 2 }}
                  >
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">
                      You&apos;ve reached {toInfo?.title}!
                    </h2>
                    
                    {achievements.length > 0 && (
                      <div className="mb-6">
                        <h3 className="font-medium text-gray-800 mb-3">New achievements unlocked:</h3>
                        <ul className="space-y-2">
                          {achievements.map((achievement, index) => (
                            <motion.li
                              key={index}
                              initial={{ x: -20, opacity: 0 }}
                              animate={animationStep >= 3 ? { x: 0, opacity: 1 } : {}}
                              transition={{ delay: 2.2 + index * 0.1 }}
                              className="flex items-center gap-3 text-sm text-gray-700"
                            >
                              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                <Star className="w-3 h-3 text-green-600" />
                              </div>
                              {achievement}
                            </motion.li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={showConfetti ? { y: 0, opacity: 1 } : {}}
                      transition={{ delay: 0.5 }}
                      className="text-center"
                    >
                      <Button
                        onClick={onComplete}
                        className={`bg-gradient-to-r ${toInfo?.color || 'from-blue-500 to-blue-600'} hover:opacity-90 px-8`}
                      >
                        Continue Your Journey
                      </Button>
                    </motion.div>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default StageTransition;