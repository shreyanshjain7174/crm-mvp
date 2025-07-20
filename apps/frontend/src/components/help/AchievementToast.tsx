'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Trophy, Star, Zap, Users, MessageSquare, Bot } from 'lucide-react';
import { useUserProgressStore, Achievement } from '@/stores/userProgress';
import { cn } from '@/lib/utils';

interface AchievementToastProps {
  achievement: Achievement;
  onDismiss: () => void;
  autoHide?: number;
}

const ACHIEVEMENT_ICONS = {
  milestone: Trophy,
  feature: Star,
  usage: Zap,
  social: Users
};

const ACHIEVEMENT_COLORS = {
  milestone: 'from-yellow-400 to-orange-500',
  feature: 'from-blue-400 to-purple-500',
  usage: 'from-green-400 to-emerald-500',
  social: 'from-pink-400 to-rose-500'
};

export function AchievementToast({ 
  achievement, 
  onDismiss, 
  autoHide = 5000 
}: AchievementToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      handleDismiss();
    }, autoHide);
    
    return () => clearTimeout(timer);
  }, [autoHide]);
  
  const handleDismiss = () => {
    setIsLeaving(true);
    setTimeout(() => {
      setIsVisible(false);
      onDismiss();
    }, 300);
  };
  
  const IconComponent = ACHIEVEMENT_ICONS[achievement.category];
  const gradientColor = ACHIEVEMENT_COLORS[achievement.category];
  
  if (!isVisible) return null;
  
  return (
    <div className="fixed top-4 right-4 z-50">
      <Card className={cn(
        'w-80 shadow-2xl border-2 border-white/20 bg-white/95 backdrop-blur-md',
        'animate-in slide-in-from-right duration-500',
        isLeaving && 'animate-out slide-out-to-right duration-300'
      )}>
        <CardContent className="p-0">
          {/* Header with gradient */}
          <div className={cn(
            'p-4 bg-gradient-to-r text-white rounded-t-lg',
            gradientColor
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <IconComponent className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium opacity-90">Achievement Unlocked!</p>
                  <h3 className="font-bold text-lg">{achievement.title}</h3>
                </div>
              </div>
              
              <button
                onClick={handleDismiss}
                className="text-white/70 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Content */}
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="text-2xl">{achievement.icon}</div>
              <div>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {achievement.description}
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="text-xs">
                {achievement.category.charAt(0).toUpperCase() + achievement.category.slice(1)}
              </Badge>
              
              <p className="text-xs text-slate-500">
                {new Date(achievement.unlockedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Main component for managing achievement toasts
export function AchievementSystem() {
  const [displayedAchievements, setDisplayedAchievements] = useState<Set<string>>(new Set());
  const achievements = useUserProgressStore(state => state.achievements);
  const pendingCelebrations = useUserProgressStore(state => state.pendingCelebrations);
  const completePendingCelebration = useUserProgressStore(state => state.completePendingCelebration);
  
  // Find new achievements to display
  const newAchievements = achievements.filter(achievement => 
    !displayedAchievements.has(achievement.id) &&
    pendingCelebrations.includes(`achievement-${achievement.id}`)
  );
  
  const handleDismiss = (achievementId: string) => {
    setDisplayedAchievements(prev => new Set(prev).add(achievementId));
    completePendingCelebration(`achievement-${achievementId}`);
  };
  
  return (
    <div className="fixed top-0 right-0 z-50 space-y-4 p-4" data-testid="achievement-system">
      {newAchievements.map((achievement, index) => (
        <div
          key={achievement.id}
          style={{ 
            transform: `translateY(${index * 10}px)`,
            zIndex: 50 - index
          }}
        >
          <AchievementToast
            achievement={achievement}
            onDismiss={() => handleDismiss(achievement.id)}
            autoHide={5000 + (index * 1000)} // Stagger auto-hide
          />
        </div>
      ))}
    </div>
  );
}

// Feature unlock celebration
interface FeatureUnlockCelebrationProps {
  feature: string;
  title: string;
  description: string;
  onComplete: () => void;
}

export function FeatureUnlockCelebration({
  feature,
  title,
  description,
  onComplete
}: FeatureUnlockCelebrationProps) {
  const [isVisible, setIsVisible] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete();
    }, 4000);
    
    return () => clearTimeout(timer);
  }, [onComplete]);
  
  const getFeatureIcon = (feature: string) => {
    if (feature.includes('contacts')) return <Users className="w-8 h-8" />;
    if (feature.includes('messages')) return <MessageSquare className="w-8 h-8" />;
    if (feature.includes('ai')) return <Bot className="w-8 h-8" />;
    return <Star className="w-8 h-8" />;
  };
  
  if (!isVisible) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <Card className="w-96 shadow-2xl border-2 border-blue-200 bg-white animate-in zoom-in duration-500">
        <CardContent className="p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              {getFeatureIcon(feature)}
            </div>
            
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              🎉 New Feature Unlocked!
            </h2>
            
            <h3 className="text-xl font-semibold text-blue-600 mb-3">
              {title}
            </h3>
            
            <p className="text-slate-600 leading-relaxed">
              {description}
            </p>
          </div>
          
          <div className="flex justify-center">
            <Badge className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              Feature Available Now
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Stage progression celebration
interface StageProgressionCelebrationProps {
  newStage: string;
  stageTitle: string;
  stageDescription: string;
  unlockedFeatures: string[];
  onComplete: () => void;
}

export function StageProgressionCelebration({
  newStage,
  stageTitle,
  stageDescription,
  unlockedFeatures,
  onComplete
}: StageProgressionCelebrationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [showConfetti, setShowConfetti] = useState(true);
  
  useEffect(() => {
    const confettiTimer = setTimeout(() => {
      setShowConfetti(false);
    }, 3000);
    
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
      onComplete();
    }, 6000);
    
    return () => {
      clearTimeout(confettiTimer);
      clearTimeout(hideTimer);
    };
  }, [onComplete]);
  
  if (!isVisible) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="confetti-container">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="confetti-piece"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  backgroundColor: ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'][Math.floor(Math.random() * 5)]
                }}
              />
            ))}
          </div>
        </div>
      )}
      
      <Card className="w-[500px] shadow-2xl border-2 border-yellow-200 bg-white animate-in zoom-in duration-700">
        <CardContent className="p-8 text-center">
          <div className="mb-6">
            <div className="text-6xl mb-4">🚀</div>
            
            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              Stage Complete!
            </h2>
            
            <h3 className="text-2xl font-semibold text-yellow-600 mb-4">
              {stageTitle}
            </h3>
            
            <p className="text-slate-600 leading-relaxed mb-6">
              {stageDescription}
            </p>
            
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4">
              <h4 className="font-semibold text-slate-900 mb-2">New Features Unlocked:</h4>
              <div className="flex flex-wrap gap-2 justify-center">
                {unlockedFeatures.map((feature, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="bg-yellow-100 text-yellow-800"
                  >
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <style jsx>{`
        .confetti-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }
        
        .confetti-piece {
          position: absolute;
          width: 8px;
          height: 8px;
          animation: confetti-fall 3s linear infinite;
        }
        
        @keyframes confetti-fall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

export default AchievementToast;