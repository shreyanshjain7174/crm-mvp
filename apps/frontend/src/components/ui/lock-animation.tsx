'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, LockKeyhole, Key, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LockAnimationProps {
  isLocked: boolean;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  requirementText?: string;
}

export function LockAnimation({
  isLocked,
  children,
  className,
  size = 'md',
  onClick,
  requirementText
}: LockAnimationProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  const handleClick = () => {
    if (isLocked) {
      // Trigger shake animation when clicking locked item
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
    onClick?.();
  };

  const lockSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4', 
    lg: 'w-5 h-5'
  };

  if (!isLocked) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={cn(
        "relative cursor-pointer select-none",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      animate={isShaking ? {
        x: [0, -2, 2, -2, 2, 0],
        transition: { duration: 0.5 }
      } : {}}
    >
      {/* Main content with overlay */}
      <div className={cn(
        "relative transition-all duration-300",
        isLocked && "opacity-50 grayscale-[0.3] pointer-events-none",
        isHovered && isLocked && "opacity-60"
      )}>
        {children}
        
        {/* Lock overlay */}
        <AnimatePresence>
          {isLocked && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-[1px] rounded-lg"
            >
              <div className="flex items-center space-x-2">
                {/* Animated lock icon */}
                <motion.div
                  animate={isHovered ? {
                    rotate: [0, -5, 5, -5, 5, 0],
                    scale: [1, 1.1, 1]
                  } : {}}
                  transition={{ duration: 0.6 }}
                  className="relative"
                >
                  <Lock className={cn(
                    "text-muted-foreground/70",
                    lockSizes[size]
                  )} />
                  
                  {/* Sparkle effect on hover */}
                  <AnimatePresence>
                    {isHovered && (
                      <>
                        <motion.div
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0 }}
                          className="absolute -top-1 -right-1"
                        >
                          <Sparkles className="w-2 h-2 text-yellow-400" />
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0 }}
                          transition={{ delay: 0.1 }}
                          className="absolute -bottom-1 -left-1"
                        >
                          <Sparkles className="w-1.5 h-1.5 text-blue-400" />
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Unlock hint on hover */}
                <AnimatePresence>
                  {isHovered && size !== 'sm' && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="flex items-center space-x-1"
                    >
                      <Key className="w-3 h-3 text-yellow-500" />
                      <span className="text-xs text-muted-foreground">
                        {requirementText || "Locked"}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tooltip for requirement */}
      <AnimatePresence>
        {isHovered && isLocked && requirementText && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
              <div className="text-xs text-popover-foreground font-medium mb-1">
                🔒 Feature Locked
              </div>
              <div className="text-xs text-muted-foreground">
                {requirementText}
              </div>
              {/* Tooltip arrow */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-border"></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Unlock animation component for when features become available
export function UnlockAnimation({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) {
  return (
    <motion.div
      className={className}
      initial={{ scale: 1 }}
      animate={{
        scale: [1, 1.05, 1],
        boxShadow: [
          '0 0 0 0 rgba(59, 130, 246, 0)',
          '0 0 0 4px rgba(59, 130, 246, 0.3)',
          '0 0 0 0 rgba(59, 130, 246, 0)'
        ]
      }}
      transition={{
        duration: 1.5,
        repeat: 2,
        ease: "easeInOut"
      }}
    >
      {children}
      
      {/* Unlock effect */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Key className="w-3 h-3 text-white" />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}