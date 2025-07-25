'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AchievementCard } from '@/components/achievements/AchievementCard';
import { Loader2, AlertCircle } from 'lucide-react';
import { 
  Trophy, 
  Star, 
  Target, 
  Zap, 
  Users,
  Crown,
  Award,
  Filter,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAchievements, Achievement } from '@/hooks/use-achievements';

type FilterType = 'all' | 'unlocked' | 'locked' | 'common' | 'rare' | 'epic' | 'legendary';
type CategoryType = 'all' | 'milestone' | 'feature' | 'usage' | 'social' | 'efficiency';

export default function AchievementsPage() {
  const [filter, setFilter] = useState<FilterType>('all');
  const [category, setCategory] = useState<CategoryType>('all');

  // Use real backend data
  const {
    availableAchievements,
    userAchievements,
    stats,
    stage,
    overview,
    loading,
    error,
    unlockAchievement
  } = useAchievements();
  
  // Show loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading achievements...</span>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load achievements</h3>
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Get unlocked achievement IDs
  const unlockedIds = useMemo(() => new Set(userAchievements.map(a => a.id)), [userAchievements]);
  
  // Calculate progress for locked achievements
  const getAchievementProgress = (achievement: Achievement): number => {
    if (achievement.isUnlocked) return 100;
    
    if (achievement.requirements && achievement.requirements.length === 1 && achievement.requirements[0].type === 'stat') {
      const req = achievement.requirements[0];
      const match = req.condition.match(/(\w+)\s*(>=|<=|>|<|==)\s*(\d+)/);
      
      if (match) {
        const [, statName, , valueStr] = match;
        const statValue = stats[statName] || 0;
        const targetValue = parseInt(valueStr);
        
        return Math.min((statValue / targetValue) * 100, 99); // Never show 100% unless unlocked
      }
    }
    
    return 0;
  };

  // Filter achievements
  const filteredAchievements = useMemo(() => {
    let filtered = availableAchievements;
    
    // Apply category filter
    if (category !== 'all') {
      filtered = filtered.filter(a => a.category === category);
    }
    
    // Apply status/rarity filter
    switch (filter) {
      case 'unlocked':
        filtered = filtered.filter(a => a.isUnlocked);
        break;
      case 'locked':
        filtered = filtered.filter(a => !a.isUnlocked);
        break;
      case 'common':
      case 'rare':
      case 'epic':
      case 'legendary':
        filtered = filtered.filter(a => a.rarity === filter);
        break;
    }
    
    // Sort: unlocked first, then by rarity, then by points
    return filtered.sort((a, b) => {
      const aUnlocked = a.isUnlocked || false;
      const bUnlocked = b.isUnlocked || false;
      
      if (aUnlocked !== bUnlocked) {
        return bUnlocked ? 1 : -1;
      }
      
      const rarityOrder = { common: 1, rare: 2, epic: 3, legendary: 4 };
      const rarityDiff = rarityOrder[b.rarity] - rarityOrder[a.rarity];
      if (rarityDiff !== 0) return rarityDiff;
      
      return b.points - a.points;
    });
  }, [filter, category, availableAchievements]);

  // Get next milestone achievements (simple implementation for demo)
  const nextMilestones = useMemo(() => {
    return availableAchievements
      .filter(a => !a.isUnlocked && a.category === 'milestone')
      .slice(0, 3);
  }, [availableAchievements]);

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Trophy className="h-8 w-8 text-yellow-500" />
          <h1 className="text-3xl font-bold">Achievements</h1>
          <Trophy className="h-8 w-8 text-yellow-500" />
        </div>
        <p className="text-gray-600">
          Track your progress and unlock rewards for using your CRM effectively
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <Award className="h-8 w-8 mx-auto text-blue-600 mb-2" />
            <p className="text-2xl font-bold text-blue-600">
              {overview.totalUnlocked}/{overview.totalAvailable}
            </p>
            <p className="text-sm text-gray-600">Achievements</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Star className="h-8 w-8 mx-auto text-yellow-600 mb-2" />
            <p className="text-2xl font-bold text-yellow-600">{overview.totalPoints}</p>
            <p className="text-sm text-gray-600">Total Points</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 mx-auto text-green-600 mb-2" />
            <p className="text-2xl font-bold text-green-600">{overview.completionPercentage}%</p>
            <p className="text-sm text-gray-600">Completion</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Crown className="h-8 w-8 mx-auto text-purple-600 mb-2" />
            <p className="text-2xl font-bold text-purple-600">
              {overview.byRarity.legendary.unlocked}/{overview.byRarity.legendary.total}
            </p>
            <p className="text-sm text-gray-600">Legendary</p>
          </CardContent>
        </Card>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-500" />
            Overall Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Achievement Completion</span>
                <span className="font-medium">{overview.completionPercentage}%</span>
              </div>
              <Progress value={overview.completionPercentage} className="h-3" />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              {(['common', 'rare', 'epic', 'legendary'] as const).map(rarity => {
                const rarityData = overview.byRarity[rarity];
                const percentage = rarityData.total > 0 ? Math.round((rarityData.unlocked / rarityData.total) * 100) : 0;
                
                return (
                  <div key={rarity} className="p-3 border rounded-lg">
                    <div className="text-sm font-medium capitalize mb-1">{rarity}</div>
                    <div className="text-lg font-bold">{rarityData.unlocked}/{rarityData.total}</div>
                    <div className="text-xs text-gray-500">{percentage}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Milestones */}
      {nextMilestones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Next Milestones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {nextMilestones.map(achievement => (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  isUnlocked={false}
                  progress={getAchievementProgress(achievement)}
                  showProgress={true}
                  compact={true}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and Achievements Grid */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle>All Achievements</CardTitle>
            
            <div className="flex flex-wrap gap-2">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryType)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              >
                <option value="all">All Categories</option>
                <option value="milestone">Milestones</option>
                <option value="feature">Features</option>
                <option value="usage">Usage</option>
                <option value="efficiency">Efficiency</option>
                <option value="social">Social</option>
              </select>
              
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as FilterType)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              >
                <option value="all">All Status</option>
                <option value="unlocked">Unlocked</option>
                <option value="locked">Locked</option>
                <option value="common">Common</option>
                <option value="rare">Rare</option>
                <option value="epic">Epic</option>
                <option value="legendary">Legendary</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredAchievements.map(achievement => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                isUnlocked={achievement.isUnlocked || false}
                progress={getAchievementProgress(achievement)}
                showProgress={true}
              />
            ))}
          </div>
          
          {filteredAchievements.length === 0 && (
            <div className="text-center py-12">
              <Trophy className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No achievements found</h3>
              <p className="text-gray-600">Try adjusting your filters</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}