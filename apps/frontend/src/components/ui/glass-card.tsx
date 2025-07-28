'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'intense' | 'subtle' | 'dark';
  hover?: boolean;
  glow?: boolean;
}

export function GlassCard({ 
  children, 
  className = '', 
  variant = 'default',
  hover = true,
  glow = false
}: GlassCardProps) {
  const variants = {
    default: 'bg-white/80 dark:bg-gray-800/90 border-white/30 dark:border-gray-700/50',
    intense: 'bg-white/90 dark:bg-gray-800/95 border-white/40 dark:border-gray-600/60',
    subtle: 'bg-white/60 dark:bg-gray-900/80 border-white/20 dark:border-gray-700/40',
    dark: 'bg-gray-900/80 dark:bg-gray-800/90 border-gray-700/30 dark:border-gray-600/50'
  };

  return (
    <motion.div
      className={cn(
        'backdrop-blur-md border rounded-2xl',
        'shadow-2xl shadow-black/10 dark:shadow-white/5',
        variants[variant],
        glow && 'shadow-blue-500/25 dark:shadow-blue-400/30',
        className
      )}
      whileHover={hover ? {
        scale: 1.02,
        boxShadow: glow 
          ? '0 25px 50px -12px rgba(59, 130, 246, 0.25)' 
          : '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }
      } : undefined}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  );
}

interface NeomorphCardProps {
  children: React.ReactNode;
  className?: string;
  pressed?: boolean;
  interactive?: boolean;
}

export function NeomorphCard({ 
  children, 
  className = '', 
  pressed = false,
  interactive = true
}: NeomorphCardProps) {
  const [isPressed, setIsPressed] = React.useState(pressed);

  return (
    <motion.div
      className={cn(
        'bg-gray-100 dark:bg-gray-800 rounded-2xl transition-all duration-300',
        isPressed 
          ? 'shadow-inner shadow-gray-400/50 dark:shadow-gray-700/50' 
          : 'shadow-lg shadow-gray-300/50 dark:shadow-gray-900/50',
        interactive && 'cursor-pointer',
        className
      )}
      onMouseDown={() => interactive && setIsPressed(true)}
      onMouseUp={() => interactive && setIsPressed(false)}
      onMouseLeave={() => interactive && setIsPressed(false)}
      whileHover={interactive ? { scale: 1.01 } : undefined}
      whileTap={interactive ? { scale: 0.99 } : undefined}
      style={{
        boxShadow: isPressed 
          ? 'inset 8px 8px 16px #d1d5db, inset -8px -8px 16px #ffffff'
          : '8px 8px 16px #d1d5db, -8px -8px 16px #ffffff'
      }}
    >
      {children}
    </motion.div>
  );
}

interface FluidButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
}

export function FluidButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false
}: FluidButtonProps) {
  const variants = {
    primary: 'bg-blue-500 text-white hover:bg-blue-600',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100',
    gradient: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative overflow-hidden rounded-xl font-medium',
        'transition-all duration-300 ease-out',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      whileHover={!disabled ? { 
        scale: 1.05,
        transition: { duration: 0.2 }
      } : undefined}
      whileTap={!disabled ? { scale: 0.95 } : undefined}
    >
      {/* Ripple effect */}
      <motion.div
        className="absolute inset-0 bg-white/20 rounded-xl"
        initial={{ scale: 0, opacity: 0 }}
        whileTap={{ scale: 2, opacity: 1 }}
        transition={{ duration: 0.3 }}
      />
      
      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        initial={{ x: '-100%' }}
        whileHover={{ x: '100%' }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      />
      
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}

interface LiquidShapeProps {
  className?: string;
  color?: string;
  size?: number;
  intensity?: number;
}

export function LiquidShape({ 
  className = '', 
  color = '#6366F1',
  size = 100,
  intensity = 20
}: LiquidShapeProps) {
  return (
    <motion.div
      className={cn('relative', className)}
      style={{ width: size, height: size }}
    >
      <motion.div
        className="absolute inset-0"
        style={{ backgroundColor: color }}
        animate={{
          borderRadius: [
            '60% 40% 30% 70%/60% 30% 70% 40%',
            '30% 60% 70% 40%/50% 60% 30% 60%',
            '60% 40% 30% 70%/60% 30% 70% 40%'
          ],
          scale: [1, 1.1, 1],
          rotate: [0, 180, 360]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />
      
      {/* Inner glow */}
      <motion.div
        className="absolute inset-2"
        style={{ backgroundColor: color, opacity: 0.6 }}
        animate={{
          borderRadius: [
            '70% 30% 40% 60%/40% 70% 60% 30%',
            '40% 70% 60% 30%/60% 40% 30% 70%',
            '70% 30% 40% 60%/40% 70% 60% 30%'
          ],
          scale: [1, 0.9, 1]
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1
        }}
      />
    </motion.div>
  );
}

interface FloatingParticleProps {
  count?: number;
  color?: string;
  className?: string;
}

export function FloatingParticles({ 
  count = 20, 
  color = '#3B82F6',
  className = '' 
}: FloatingParticleProps) {
  const particles = React.useMemo(() => 
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 6 + 2,
      delay: Math.random() * 5,
      duration: Math.random() * 3 + 2
    })), [count]
  );

  return (
    <div className={cn('absolute inset-0 pointer-events-none overflow-hidden', className)}>
      {particles.map(particle => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            backgroundColor: color,
            opacity: 0.6
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.random() * 20 - 10, 0],
            scale: [1, 1.5, 1],
            opacity: [0.6, 1, 0.6]
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: 'easeInOut'
          }}
        />
      ))}
    </div>
  );
}

interface WaveBackgroundProps {
  className?: string;
  color?: string;
  opacity?: number;
}

export function WaveBackground({ 
  className = '', 
  color = '#6366F1',
  opacity = 0.1 
}: WaveBackgroundProps) {
  return (
    <div className={cn('absolute inset-0 overflow-hidden', className)}>
      <svg
        className="absolute bottom-0 left-0 w-full h-full"
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
      >
        <motion.path
          d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z"
          fill={color}
          style={{ opacity }}
          animate={{
            d: [
              "M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z",
              "M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z",
              "M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z"
            ]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      </svg>
    </div>
  );
}

interface GradientBlobProps {
  className?: string;
  size?: number;
  colors?: string[];
}

export function GradientBlob({ 
  className = '',
  size = 200,
  colors = ['#FF6B9D', '#C44569', '#6C5CE7']
}: GradientBlobProps) {
  const gradientId = React.useId();

  return (
    <motion.div
      className={cn('relative', className)}
      style={{ width: size, height: size }}
      animate={{
        rotate: [0, 360],
        scale: [1, 1.1, 1]
      }}
      transition={{
        duration: 20,
        repeat: Infinity,
        ease: 'linear'
      }}
    >
      <svg width="100%" height="100%" viewBox="0 0 200 200">
        <defs>
          <radialGradient id={gradientId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={colors[0]} />
            <stop offset="50%" stopColor={colors[1]} />
            <stop offset="100%" stopColor={colors[2]} />
          </radialGradient>
        </defs>
        <motion.path
          fill={`url(#${gradientId})`}
          animate={{
            d: [
              "M47.1,-57.1C59.9,-45.6,68.8,-28.9,73.2,-10.8C77.6,7.2,77.5,26.7,69.8,42.2C62.1,57.7,46.8,69.2,29.4,74.1C12,79,6.5,77.3,-4.6,83.4C-15.7,89.5,-31.4,103.4,-44.8,104.8C-58.2,106.2,-69.3,95.1,-74.9,80.4C-80.5,65.7,-80.6,47.4,-78.1,31.2C-75.6,15,-70.5,1,-63.4,-10.7C-56.3,-22.4,-47.2,-31.8,-36.8,-44.1C-26.4,-56.4,-14.7,-71.6,1.3,-73.2C17.3,-74.8,34.3,-68.6,47.1,-57.1Z",
              "M39.8,-51.7C51.1,-40.5,59.3,-26.2,64.8,-10.1C70.3,6,73.1,23.9,68.2,38.5C63.3,53.1,50.7,64.4,36.1,70.9C21.5,77.4,4.9,79.1,-13.2,77.8C-31.3,76.5,-50.9,72.2,-63.8,60.4C-76.7,48.6,-83,29.3,-82.9,10.7C-82.8,-7.9,-76.3,-25.8,-65.1,-40.2C-53.9,-54.6,-38,-65.5,-21.9,-67.8C-5.8,-70.1,10.5,-63.8,24.8,-54.9C39.1,-46,51.4,-34.5,39.8,-51.7Z",
              "M47.1,-57.1C59.9,-45.6,68.8,-28.9,73.2,-10.8C77.6,7.2,77.5,26.7,69.8,42.2C62.1,57.7,46.8,69.2,29.4,74.1C12,79,6.5,77.3,-4.6,83.4C-15.7,89.5,-31.4,103.4,-44.8,104.8C-58.2,106.2,-69.3,95.1,-74.9,80.4C-80.5,65.7,-80.6,47.4,-78.1,31.2C-75.6,15,-70.5,1,-63.4,-10.7C-56.3,-22.4,-47.2,-31.8,-36.8,-44.1C-26.4,-56.4,-14.7,-71.6,1.3,-73.2C17.3,-74.8,34.3,-68.6,47.1,-57.1Z"
            ]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      </svg>
    </motion.div>
  );
}