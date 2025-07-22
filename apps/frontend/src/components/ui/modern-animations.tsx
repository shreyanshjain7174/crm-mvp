'use client';

import React from 'react';
import { motion, AnimatePresence, useInView, useAnimation } from 'framer-motion';
import { useEffect, useRef } from 'react';

// Modern animation variants
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }
};

export const slideInFromLeft = {
  initial: { opacity: 0, x: -60 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -60 },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
};

export const slideInFromRight = {
  initial: { opacity: 0, x: 60 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 60 },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
  transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }
};

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }
};

// Modern UI Components with Animations

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  hover?: boolean;
}

export function AnimatedCard({ children, className = '', delay = 0, hover = true }: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={hover ? { y: -5, transition: { duration: 0.2 } } : undefined}
      className={`bg-white rounded-xl shadow-lg border border-gray-100 ${className}`}
    >
      {children}
    </motion.div>
  );
}

interface FloatingElementProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
}

export function FloatingElement({ children, className = '', intensity = 10 }: FloatingElementProps) {
  return (
    <motion.div
      animate={{
        y: [0, -intensity, 0],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface GlowingButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'success';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function GlowingButton({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md',
  className = '' 
}: GlowingButtonProps) {
  const variants = {
    primary: 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700',
    secondary: 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700',
    success: 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  return (
    <motion.button
      whileHover={{ 
        scale: 1.05,
        boxShadow: '0 10px 25px rgba(99, 102, 241, 0.4)'
      }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`
        ${variants[variant]} ${sizes[size]}
        text-white font-semibold rounded-lg
        transition-all duration-300 ease-out
        relative overflow-hidden
        ${className}
      `}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"
        initial={{ x: '-100%' }}
        whileHover={{ x: '100%' }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      />
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}

interface PulseIndicatorProps {
  color?: string;
  size?: number;
  className?: string;
}

export function PulseIndicator({ color = 'bg-green-500', size = 3, className = '' }: PulseIndicatorProps) {
  return (
    <div className={`relative ${className}`}>
      <motion.div
        className={`w-${size} h-${size} ${color} rounded-full`}
        animate={{
          scale: [1, 1.5, 1],
          opacity: [1, 0.5, 1]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <div className={`absolute inset-0 w-${size} h-${size} ${color} rounded-full opacity-30`} />
    </div>
  );
}

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function ScrollReveal({ children, className = '', delay = 0 }: ScrollRevealProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start('animate');
    }
  }, [isInView, controls]);

  return (
    <motion.div
      ref={ref}
      initial="initial"
      animate={controls}
      variants={{
        initial: { opacity: 0, y: 50 },
        animate: { 
          opacity: 1, 
          y: 0,
          transition: { 
            duration: 0.6, 
            delay,
            ease: [0.25, 0.46, 0.45, 0.94] 
          }
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
  animate?: boolean;
}

export function GradientText({ children, className = '', animate = false }: GradientTextProps) {
  return (
    <motion.span
      className={`bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent ${className}`}
      animate={animate ? {
        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
      } : undefined}
      transition={animate ? {
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut'
      } : undefined}
      style={{
        backgroundSize: animate ? '200% 200%' : undefined
      }}
    >
      {children}
    </motion.span>
  );
}

interface ShimmerLoadingProps {
  className?: string;
  lines?: number;
}

export function ShimmerLoading({ className = '', lines = 3 }: ShimmerLoadingProps) {
  return (
    <div className={`animate-pulse space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <motion.div
          key={i}
          className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded"
          style={{ width: `${100 - i * 10}%` }}
          animate={{
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.1
          }}
        />
      ))}
    </div>
  );
}

interface MorphingShapeProps {
  className?: string;
  color?: string;
}

export function MorphingShape({ className = '', color = '#6366F1' }: MorphingShapeProps) {
  return (
    <motion.div
      className={`w-20 h-20 ${className}`}
      animate={{
        borderRadius: ['50%', '25%', '50%'],
        rotate: [0, 90, 180, 270, 360],
        scale: [1, 1.1, 1]
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
      style={{ backgroundColor: color }}
    />
  );
}

interface ParticleFieldProps {
  count?: number;
  className?: string;
}

export function ParticleField({ count = 50, className = '' }: ParticleFieldProps) {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 1,
    delay: Math.random() * 2
  }));

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {particles.map(particle => (
        <motion.div
          key={particle.id}
          className="absolute bg-blue-400 rounded-full opacity-30"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.3, 0.8, 0.3],
            scale: [1, 1.5, 1]
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: particle.delay,
            ease: 'easeInOut'
          }}
        />
      ))}
    </div>
  );
}

interface TypewriterTextProps {
  text: string;
  className?: string;
  delay?: number;
  speed?: number;
}

export function TypewriterText({ text, className = '', delay = 0, speed = 50 }: TypewriterTextProps) {
  const [displayText, setDisplayText] = React.useState('');
  const [currentIndex, setCurrentIndex] = React.useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentIndex < text.length) {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }
    }, delay + currentIndex * speed);

    return () => clearTimeout(timer);
  }, [currentIndex, text, delay, speed]);

  return (
    <span className={className}>
      {displayText}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.8, repeat: Infinity }}
        className="border-r-2 border-current ml-1"
      />
    </span>
  );
}

// Export all animations for easy import
export const animations = {
  fadeInUp,
  slideInFromLeft,
  slideInFromRight,
  scaleIn,
  staggerContainer,
  staggerItem
};

const ModernAnimations = {
  AnimatedCard,
  FloatingElement,
  GlowingButton,
  PulseIndicator,
  ScrollReveal,
  GradientText,
  ShimmerLoading,
  MorphingShape,
  ParticleField,
  TypewriterText,
  animations
};

export default ModernAnimations;