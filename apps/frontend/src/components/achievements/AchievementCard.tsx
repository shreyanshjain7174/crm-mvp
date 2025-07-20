'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Lock, Star, Trophy, Target, Zap } from 'lucide-react';
import { Achievement } from '@/lib/constants/achievements';
import { cn } from '@/lib/utils';

interface AchievementCardProps {
  achievement: Achievement;
  isUnlocked?: boolean;
  progress?: number; // 0-100 for achievements in progress
  showProgress?: boolean;
  compact?: boolean;
}

export function AchievementCard({ 
  achievement, 
  isUnlocked = false, 
  progress = 0,
  showProgress = false,
  compact = false 
}: AchievementCardProps) {
  const getRarityColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'rare': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'epic': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'legendary': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    }
  };

  const getRarityGlow = (rarity: Achievement['rarity']) => {
    if (!isUnlocked) return '';
    switch (rarity) {
      case 'common': return 'shadow-gray-200';
      case 'rare': return 'shadow-blue-200';
      case 'epic': return 'shadow-purple-200';
      case 'legendary': return 'shadow-yellow-200';
    }
  };

  const getCategoryIcon = (category: Achievement['category']) => {
    switch (category) {
      case 'milestone': return Trophy;
      case 'feature': return Star;
      case 'usage': return Target;
      case 'efficiency': return Zap;
      case 'social': return Trophy;
      default: return Star;
    }
  };

  const CategoryIcon = getCategoryIcon(achievement.category);

  if (compact) {
    return (
      <div className={cn(
        'flex items-center gap-3 p-3 rounded-lg border transition-all duration-300',
        isUnlocked 
          ? `bg-white ${getRarityGlow(achievement.rarity)} shadow-md` 
          : 'bg-gray-50 border-gray-200',
        !isUnlocked && 'opacity-60'
      )}>
        <div className={cn(
          'w-12 h-12 rounded-full flex items-center justify-center text-2xl',
          isUnlocked ? 'bg-white shadow-sm' : 'bg-gray-100'
        )}>
          {isUnlocked ? achievement.icon : <Lock className="h-5 w-5 text-gray-400" />}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={cn(
              'font-semibold text-sm',
              isUnlocked ? 'text-gray-900' : 'text-gray-500'
            )}>
              {achievement.title}
            </h4>
            <Badge className={cn('text-xs', getRarityColor(achievement.rarity))}>
              {achievement.rarity}
            </Badge>
          </div>
          <p className={cn(
            'text-xs',
            isUnlocked ? 'text-gray-600' : 'text-gray-400'
          )}>
            {achievement.description}
          </p>
          
          {showProgress && !isUnlocked && progress > 0 && (
            <div className="mt-2">
              <Progress value={progress} className="h-1" />
            </div>
          )}
        </div>
        
        <div className="text-right">
          <div className={cn(
            'text-sm font-bold',
            isUnlocked ? 'text-gray-900' : 'text-gray-400'
          )}>
            {achievement.points}
          </div>
          <div className="text-xs text-gray-500">points</div>
        </div>
      </div>
    );
  }

  return (
    <Card className={cn(
      'transition-all duration-300 hover:scale-105',
      isUnlocked 
        ? `${getRarityGlow(achievement.rarity)} shadow-lg` 
        : 'opacity-70 hover:opacity-90',
      !isUnlocked && 'border-dashed'
    )}>
      <CardContent className="p-6 text-center">
        {/* Achievement Icon */}
        <div className={cn(
          'w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl transition-all duration-300',
          isUnlocked 
            ? 'bg-gradient-to-br from-white to-gray-50 shadow-md' 
            : 'bg-gray-100',
          isUnlocked && achievement.rarity === 'legendary' && 'animate-pulse'
        )}>
          {isUnlocked ? (
            achievement.icon
          ) : (
            <Lock className="h-8 w-8 text-gray-400" />
          )}
        </div>
        
        {/* Achievement Title & Category */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <CategoryIcon className="h-4 w-4 text-gray-500" />
          <h3 className={cn(
            'font-bold',
            isUnlocked ? 'text-gray-900' : 'text-gray-500'
          )}>
            {achievement.title}
          </h3>
        </div>
        
        {/* Rarity Badge */}
        <Badge className={cn('mb-3', getRarityColor(achievement.rarity))}>
          {achievement.rarity.toUpperCase()}
        </Badge>
        
        {/* Description */}
        <p className={cn(
          'text-sm mb-4',
          isUnlocked ? 'text-gray-600' : 'text-gray-400'
        )}>
          {achievement.description}
        </p>
        
        {/* Progress Bar for Unlocking */}
        {showProgress && !isUnlocked && progress > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
        
        {/* Points */}
        <div className={cn(
          'text-center',
          isUnlocked ? 'text-gray-900' : 'text-gray-500'
        )}>
          <div className="text-2xl font-bold">{achievement.points}</div>
          <div className="text-xs">POINTS</div>
        </div>
        
        {/* Unlock Date */}
        {isUnlocked && achievement.unlockedAt && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="text-xs text-gray-500">
              Unlocked {achievement.unlockedAt.toLocaleDateString()}
            </div>
          </div>
        )}
        
        {/* Special Effects for Legendary */}
        {isUnlocked && achievement.rarity === 'legendary' && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-2 right-2 animate-ping">
              <Star className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="absolute bottom-2 left-2 animate-ping animation-delay-500">
              <Star className="w-3 h-3 text-yellow-400" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AchievementCard;