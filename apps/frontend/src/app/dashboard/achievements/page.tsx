'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AchievementCard } from '@/components/achievements/AchievementCard';
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
import { useUserProgressStore } from '@/stores/userProgress';
import { 
  ACHIEVEMENTS, 
  Achievement,
  checkAchievements,
  calculateTotalPoints,
  getNextMilestoneAchievements
} from '@/lib/constants/achievements';
import { cn } from '@/lib/utils';

type FilterType = 'all' | 'unlocked' | 'locked' | 'common' | 'rare' | 'epic' | 'legendary';
type CategoryType = 'all' | 'milestone' | 'feature' | 'usage' | 'social' | 'efficiency';

export default function AchievementsPage() {
  const { stats, stage, achievements: userAchievements } = useUserProgressStore();
  const [filter, setFilter] = useState<FilterType>('all');
  const [category, setCategory] = useState<CategoryType>('all');
  
  // Get unlocked achievement IDs
  const unlockedIds = useMemo(() => new Set(userAchievements.map(a => a.id)), [userAchievements]);
  
  // Calculate progress for locked achievements
  const getAchievementProgress = (achievement: Achievement): number => {
    if (unlockedIds.has(achievement.id)) return 100;
    
    if (achievement.requirements.length === 1 && achievement.requirements[0].type === 'stat') {
      const req = achievement.requirements[0];
      const [statName, , value] = req.condition.split(/\s*(>=|<=|>|<|==)\s*/);
      const statValue = stats[statName as keyof typeof stats] || 0;
      const targetValue = parseInt(value);
      
      return Math.min((statValue / targetValue) * 100, 99); // Never show 100% unless unlocked
    }
    
    return 0;
  };

  // Filter achievements
  const filteredAchievements = useMemo(() => {
    let filtered = ACHIEVEMENTS;
    
    // Apply category filter
    if (category !== 'all') {
      filtered = filtered.filter(a => a.category === category);
    }
    
    // Apply status/rarity filter
    switch (filter) {
      case 'unlocked':
        filtered = filtered.filter(a => unlockedIds.has(a.id));
        break;
      case 'locked':
        filtered = filtered.filter(a => !unlockedIds.has(a.id));
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
      const aUnlocked = unlockedIds.has(a.id);
      const bUnlocked = unlockedIds.has(b.id);
      
      if (aUnlocked !== bUnlocked) {
        return bUnlocked ? 1 : -1;
      }
      
      const rarityOrder = { common: 1, rare: 2, epic: 3, legendary: 4 };
      const rarityDiff = rarityOrder[b.rarity] - rarityOrder[a.rarity];
      if (rarityDiff !== 0) return rarityDiff;
      
      return b.points - a.points;
    });
  }, [filter, category, unlockedIds]);

  // Statistics
  const stats_achievements = {
    total: ACHIEVEMENTS.length,
    unlocked: userAchievements.length,
    points: calculateTotalPoints(userAchievements),
    percentage: Math.round((userAchievements.length / ACHIEVEMENTS.length) * 100)
  };

  const nextMilestones = getNextMilestoneAchievements(stats, stage);

  const getRarityCount = (rarity: Achievement['rarity']) => {
    const total = ACHIEVEMENTS.filter(a => a.rarity === rarity).length;
    const unlocked = userAchievements.filter(a => a.rarity === rarity).length;
    return { total, unlocked };
  };

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
              {stats_achievements.unlocked}/{stats_achievements.total}
            </p>
            <p className="text-sm text-gray-600">Achievements</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Star className="h-8 w-8 mx-auto text-yellow-600 mb-2" />
            <p className="text-2xl font-bold text-yellow-600">{stats_achievements.points}</p>
            <p className="text-sm text-gray-600">Total Points</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 mx-auto text-green-600 mb-2" />
            <p className="text-2xl font-bold text-green-600">{stats_achievements.percentage}%</p>
            <p className="text-sm text-gray-600">Completion</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Crown className="h-8 w-8 mx-auto text-purple-600 mb-2" />
            <p className="text-2xl font-bold text-purple-600">
              {getRarityCount('legendary').unlocked}/{getRarityCount('legendary').total}
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
                <span className="font-medium">{stats_achievements.percentage}%</span>
              </div>
              <Progress value={stats_achievements.percentage} className="h-3" />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              {(['common', 'rare', 'epic', 'legendary'] as const).map(rarity => {
                const { total, unlocked } = getRarityCount(rarity);
                const percentage = total > 0 ? Math.round((unlocked / total) * 100) : 0;
                
                return (
                  <div key={rarity} className="p-3 border rounded-lg">
                    <div className="text-sm font-medium capitalize mb-1">{rarity}</div>
                    <div className="text-lg font-bold">{unlocked}/{total}</div>
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
                isUnlocked={unlockedIds.has(achievement.id)}
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