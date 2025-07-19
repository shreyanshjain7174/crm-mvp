'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CheckCircle, ArrowRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface FeatureRevealProps {
  isVisible: boolean;
  onComplete?: () => void;
  onExplore?: () => void;
  feature: {
    name: string;
    description: string;
    icon: React.ComponentType<any>;
    benefits: string[];
    stage: string;
    color: string;
  };
}

export function FeatureReveal({ 
  isVisible, 
  onComplete, 
  onExplore, 
  feature 
}: FeatureRevealProps) {
  const [step, setStep] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Reset animation steps when becoming visible
      setStep(0);
      setShowCelebration(false);
      
      // Sequence the animation steps
      const timer1 = setTimeout(() => setStep(1), 500);
      const timer2 = setTimeout(() => setStep(2), 1500);
      const timer3 = setTimeout(() => setShowCelebration(true), 2000);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [isVisible]);

  const IconComponent = feature.icon;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative max-w-md w-full"
          >
            <Card className="border-0 shadow-2xl overflow-hidden">
              <CardContent className="p-0">
                {/* Header with animated background */}
                <motion.div
                  className={`relative p-6 bg-gradient-to-br ${feature.color} text-white overflow-hidden`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {/* Animated particles */}
                  <div className="absolute inset-0 overflow-hidden">
                    {[...Array(12)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-white/30 rounded-full"
                        initial={{
                          x: Math.random() * 100,
                          y: Math.random() * 100,
                          opacity: 0
                        }}
                        animate={{
                          x: Math.random() * 300,
                          y: Math.random() * 200,
                          opacity: [0, 1, 0]
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          delay: Math.random() * 2
                        }}
                      />
                    ))}
                  </div>
                  
                  <div className="relative z-10 text-center">
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ 
                        type: "spring", 
                        damping: 15, 
                        stiffness: 300,
                        delay: 0.3 
                      }}
                      className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm"
                    >
                      <IconComponent className="w-8 h-8 text-white" />
                    </motion.div>
                    
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <Badge className="bg-white/20 text-white border-white/30 mb-3">
                        New Feature Unlocked!
                      </Badge>
                      <h2 className="text-xl font-bold mb-2">{feature.name}</h2>
                      <p className="text-white/90 text-sm">{feature.description}</p>
                    </motion.div>
                  </div>
                </motion.div>

                {/* Content area */}
                <div className="p-6">
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={step >= 1 ? { y: 0, opacity: 1 } : {}}
                    transition={{ delay: 0.8 }}
                  >
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-yellow-500" />
                      What you can do now:
                    </h3>
                    
                    <ul className="space-y-2 mb-6">
                      {feature.benefits.map((benefit, index) => (
                        <motion.li
                          key={index}
                          initial={{ x: -20, opacity: 0 }}
                          animate={step >= 2 ? { x: 0, opacity: 1 } : {}}
                          transition={{ delay: 1.2 + index * 0.2 }}
                          className="flex items-start gap-3 text-sm text-gray-700"
                        >
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={step >= 2 ? { scale: 1 } : {}}
                            transition={{ 
                              delay: 1.4 + index * 0.2,
                              type: "spring",
                              stiffness: 400
                            }}
                            className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                          >
                            <CheckCircle className="w-3 h-3 text-green-600" />
                          </motion.div>
                          {benefit}
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>

                  {/* Celebration animation */}
                  <AnimatePresence>
                    {showCelebration && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="text-center mb-6"
                      >
                        <motion.div
                          animate={{ 
                            rotate: [0, 10, -10, 0],
                            scale: [1, 1.1, 1]
                          }}
                          transition={{ 
                            duration: 0.6,
                            repeat: 2
                          }}
                          className="text-4xl mb-2"
                        >
                          🎉
                        </motion.div>
                        <p className="text-sm text-gray-600 font-medium">
                          You&apos;ve reached the <span className="text-purple-600">{feature.stage}</span> stage!
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Action buttons */}
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={showCelebration ? { y: 0, opacity: 1 } : {}}
                    transition={{ delay: 0.3 }}
                    className="flex gap-3"
                  >
                    <Button
                      onClick={onExplore}
                      className="flex-1 bg-primary hover:bg-primary/90"
                    >
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Explore Now
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={onComplete}
                      className="px-6"
                    >
                      Got it!
                    </Button>
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

export default FeatureReveal;