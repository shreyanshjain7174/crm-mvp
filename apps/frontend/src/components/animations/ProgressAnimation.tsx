'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Star, TrendingUp } from 'lucide-react';

interface ProgressAnimationProps {
  progress: number;
  stage: string;
  showMilestone?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export function ProgressAnimation({ 
  progress, 
  stage, 
  showMilestone = false,
  size = 'md',
  color = 'bg-blue-500'
}: ProgressAnimationProps) {
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };

  const containerClasses = {
    sm: 'w-full max-w-xs',
    md: 'w-full max-w-sm',
    lg: 'w-full max-w-md'
  };

  const milestones = [25, 50, 75, 100];

  return (
    <div className={`relative ${containerClasses[size]}`}>
      {/* Progress bar background */}
      <div className={`w-full bg-gray-200 rounded-full ${sizeClasses[size]} overflow-hidden`}>
        {/* Animated progress fill */}
        <motion.div
          className={`${color} ${sizeClasses[size]} rounded-full relative overflow-hidden`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ 
            duration: 1.5, 
            ease: "easeInOut",
            delay: 0.2 
          }}
        >
          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 1,
              ease: "easeInOut"
            }}
          />
        </motion.div>
      </div>

      {/* Milestone markers */}
      {showMilestone && (
        <div className="absolute top-0 left-0 w-full h-full flex justify-between items-center">
          {milestones.map((milestone, index) => {
            const isPassed = progress >= milestone;
            const isActive = Math.abs(progress - milestone) < 5;
            
            return (
              <motion.div
                key={milestone}
                className="relative"
                style={{ left: `${milestone}%`, transform: 'translateX(-50%)' }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: isPassed ? 1.2 : 0.8,
                  opacity: isPassed ? 1 : 0.5
                }}
                transition={{ 
                  delay: 0.5 + index * 0.2,
                  type: "spring",
                  stiffness: 400
                }}
              >
                <div className={`w-3 h-3 rounded-full border-2 ${
                  isPassed 
                    ? 'bg-white border-green-500' 
                    : 'bg-white border-gray-300'
                } shadow-sm`}>
                  {isPassed && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1 + index * 0.2 }}
                      className="w-full h-full flex items-center justify-center"
                    >
                      <CheckCircle className="w-2 h-2 text-green-500" />
                    </motion.div>
                  )}
                </div>
                
                {/* Milestone label */}
                {isPassed && (
                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1.2 + index * 0.2 }}
                    className="absolute top-5 left-1/2 transform -translate-x-1/2"
                  >
                    <div className="text-xs font-medium text-green-600 whitespace-nowrap">
                      {milestone === 25 && '🌱 Started'}
                      {milestone === 50 && '📈 Growing'}
                      {milestone === 75 && '🚀 Advanced'}
                      {milestone === 100 && '⭐ Expert'}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Current progress indicator */}
      <motion.div
        className="absolute top-0 h-full flex items-center"
        style={{ left: `${progress}%` }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1, type: "spring" }}
      >
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 10, -10, 0]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            repeatDelay: 3
          }}
          className="transform -translate-x-1/2 -translate-y-1"
        >
          <div className="w-4 h-4 bg-yellow-400 rounded-full border-2 border-yellow-500 shadow-lg flex items-center justify-center">
            <Star className="w-2 h-2 text-yellow-600" />
          </div>
        </motion.div>
      </motion.div>

      {/* Progress text */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="mt-2 flex justify-between items-center text-xs text-gray-600"
      >
        <span className="font-medium">{Math.round(progress)}% complete</span>
        <span className="capitalize">{stage} stage</span>
      </motion.div>
    </div>
  );
}

export default ProgressAnimation;