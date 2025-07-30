'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useUserProgressStore } from '@/stores/userProgress';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Trophy, 
  Star, 
  Zap, 
  Target, 
  Crown, 
  Gift,
  PartyPopper,
  Sparkles,
  TrendingUp,
  Award
} from 'lucide-react';

interface CelebrationProps {
  type: 'achievement' | 'stage' | 'feature';
  title: string;
  description: string;
  icon?: string;
  points?: number;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  onClose: () => void;
}

export function CelebrationModal({ 
  type, 
  title, 
  description, 
  icon, 
  points, 
  rarity = 'common',
  onClose 
}: CelebrationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClose = useCallback(() => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300);
  }, [onClose]);

  useEffect(() => {
    setIsVisible(true);
    setIsAnimating(true);
    
    // Auto-close after 5 seconds unless user interacts
    const timer = setTimeout(() => {
      handleClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [handleClose]);

  const getIcon = () => {
    if (icon) {
      return <span className="text-4xl">{icon}</span>;
    }
    
    switch (type) {
      case 'achievement':
        return <Trophy className="w-12 h-12 text-yellow-500" />;
      case 'stage':
        return <Crown className="w-12 h-12 text-purple-500" />;
      case 'feature':
        return <Star className="w-12 h-12 text-blue-500" />;
      default:
        return <Gift className="w-12 h-12 text-green-500" />;
    }
  };

  const getRarityColor = () => {
    switch (rarity) {
      case 'legendary':
        return 'from-yellow-400 via-orange-500 to-red-500';
      case 'epic':
        return 'from-purple-400 via-pink-500 to-red-500';
      case 'rare':
        return 'from-blue-400 via-blue-500 to-blue-600';
      default:
        return 'from-gray-400 via-gray-500 to-gray-600';
    }
  };

  const getRarityText = () => {
    switch (rarity) {
      case 'legendary':
        return 'LEGENDARY';
      case 'epic':
        return 'EPIC';
      case 'rare':
        return 'RARE';
      default:
        return 'ACHIEVEMENT';
    }
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        {/* Celebration Card */}
        <div
          className={`relative transform transition-all duration-500 ${
            isAnimating 
              ? 'scale-100 opacity-100 translate-y-0' 
              : 'scale-95 opacity-0 translate-y-4'
          }`}
        >
          <Card className="w-full max-w-md mx-auto shadow-2xl border-0 overflow-hidden">
            {/* Animated Background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${getRarityColor()} opacity-10`} />
            
            {/* Sparkle Animation */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="absolute animate-pulse"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${2 + Math.random() * 2}s`
                  }}
                >
                  <Sparkles className="w-4 h-4 text-yellow-400 opacity-70" />
                </div>
              ))}
            </div>

            <CardContent className="relative p-8 text-center">
              {/* Rarity Badge */}
              <div className="mb-4">
                <Badge 
                  className={`bg-gradient-to-r ${getRarityColor()} text-white font-bold px-3 py-1 text-xs tracking-wider`}
                >
                  {getRarityText()}
                </Badge>
              </div>

              {/* Icon with Animation */}
              <div className="mb-6 relative">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-500/20 dark:to-orange-500/20 animate-bounce">
                  {getIcon()}
                </div>
                
                {/* Pulse Effect */}
                <div className="absolute inset-0 rounded-full animate-ping opacity-25">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-300 to-orange-300" />
                </div>
              </div>

              {/* Content */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground">
                  {title}
                </h2>
                
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {description}
                </p>

                {/* Points */}
                {points && (
                  <div className="flex items-center justify-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
                      +{points} points
                    </span>
                  </div>
                )}

                {/* Type-specific content */}
                {type === 'stage' && (
                  <div className="flex items-center justify-center gap-2 text-purple-600 dark:text-purple-400">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm font-medium">Stage Unlocked!</span>
                  </div>
                )}

                {type === 'feature' && (
                  <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400">
                    <Zap className="w-4 h-4" />
                    <span className="text-sm font-medium">New Feature Available!</span>
                  </div>
                )}

                {type === 'achievement' && (
                  <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                    <Award className="w-4 h-4" />
                    <span className="text-sm font-medium">Achievement Earned!</span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="mt-8">
                <Button
                  onClick={handleClose}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-3"
                >
                  <PartyPopper className="w-4 h-4 mr-2" />
                  Awesome!
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confetti Animation */}
      <div className="fixed inset-0 pointer-events-none z-40">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-bounce"
            style={{
              left: `${Math.random() * 100}%`,
              top: '-10px',
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
              transform: `rotate(${Math.random() * 360}deg)`
            }}
          >
            <div
              className={`w-2 h-2 ${
                ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'][
                  Math.floor(Math.random() * 6)
                ]
              } opacity-80`}
              style={{
                borderRadius: Math.random() > 0.5 ? '50%' : '0%'
              }}
            />
          </div>
        ))}
      </div>
    </>
  );
}

// Component to manage all celebration animations
export function CelebrationManager() {
  const { pendingCelebrations, completePendingCelebration, achievements } = useUserProgressStore();
  const [currentCelebration, setCurrentCelebration] = useState<string | null>(null);

  useEffect(() => {
    if (pendingCelebrations.length > 0 && !currentCelebration) {
      // Show the first pending celebration
      setCurrentCelebration(pendingCelebrations[0]);
    }
  }, [pendingCelebrations, currentCelebration]);

  const handleCloseCelebration = () => {
    if (currentCelebration) {
      completePendingCelebration(currentCelebration);
      setCurrentCelebration(null);
    }
  };

  if (!currentCelebration) return null;

  // Parse celebration ID to get type and data
  const [type, ...rest] = currentCelebration.split('-');
  const id = rest.join('-');

  if (type === 'achievement') {
    const achievement = achievements.find(a => a.id === id);
    if (!achievement) return null;

    return (
      <CelebrationModal
        type="achievement"
        title={achievement.title}
        description={achievement.description}
        icon={achievement.icon}
        points={achievement.points}
        rarity={achievement.rarity}
        onClose={handleCloseCelebration}
      />
    );
  }

  if (type === 'stage') {
    const stageNames = {
      'beginner': 'Beginner',
      'intermediate': 'Intermediate', 
      'advanced': 'Advanced',
      'expert': 'Expert'
    };

    return (
      <CelebrationModal
        type="stage"
        title={`${stageNames[id as keyof typeof stageNames] || id} Stage Unlocked!`}
        description={`Congratulations! You've progressed to the ${id} stage and unlocked new features.`}
        icon="🎉"
        points={50}
        rarity="rare"
        onClose={handleCloseCelebration}
      />
    );
  }

  if (type === 'feature') {
    const featureNames = {
      'contacts:list': 'Contact Management',
      'pipeline:view': 'Sales Pipeline',
      'ai:suggestions': 'AI Assistant',
      'monitoring:system': 'Advanced Analytics'
    };

    return (
      <CelebrationModal
        type="feature"
        title="New Feature Unlocked!"
        description={`You now have access to ${featureNames[id as keyof typeof featureNames] || id}. Explore your new capabilities!`}
        icon="✨"
        points={25}
        rarity="common"
        onClose={handleCloseCelebration}
      />
    );
  }

  return null;
}

// Mini celebration for smaller achievements
export function MiniCelebration({ 
  message, 
  onClose 
}: { 
  message: string; 
  onClose: () => void; 
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 2000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-50">
      <div
        className={`transform transition-all duration-300 ${
          isVisible 
            ? 'translate-x-0 opacity-100' 
            : 'translate-x-full opacity-0'
        }`}
      >
        <Card className="bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/30 shadow-lg">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                {message}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}