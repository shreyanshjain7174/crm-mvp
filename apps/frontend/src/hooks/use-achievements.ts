'use client';

import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '@/lib/config';

export interface Achievement {
  id: string;
  name: string;
  title: string;
  description: string;
  category: 'milestone' | 'feature' | 'usage' | 'social' | 'efficiency';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
  requirements: {
    type: 'stat' | 'action' | 'stage' | 'combo';
    condition: string;
    value?: number;
  }[];
  icon: string;
  isUnlocked?: boolean;
  unlockedAt?: Date;
}

export interface UserStats {
  [key: string]: number;
}

export interface AchievementOverview {
  totalPoints: number;
  totalUnlocked: number;
  totalAvailable: number;
  completionPercentage: number;
  byRarity: {
    common: { unlocked: number; total: number };
    rare: { unlocked: number; total: number };
    epic: { unlocked: number; total: number };
    legendary: { unlocked: number; total: number };
  };
}

class AchievementsAPI {
  private baseUrl = API_BASE_URL;

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    let token = localStorage.getItem('token');
    
    // Auto-login for development if no token
    if (!token && process.env.NODE_ENV !== 'production') {
      try {
        const loginResponse = await fetch(`${this.baseUrl}/api/auth/dev-login`, {
          method: 'POST',
        });
        
        if (loginResponse.ok) {
          const loginData = await loginResponse.json();
          localStorage.setItem('token', loginData.token);
          localStorage.setItem('user', JSON.stringify(loginData.user));
          token = loginData.token;
        }
      } catch (error) {
        console.warn('Auto-login failed:', error);
      }
    }
    
    const response = await fetch(`${this.baseUrl}/api/achievements${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Clear invalid token
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getUserAchievements(): Promise<{ achievements: Achievement[] }> {
    return this.request<{ achievements: Achievement[] }>('');
  }

  async getAvailableAchievements(): Promise<{ achievements: Achievement[] }> {
    return this.request<{ achievements: Achievement[] }>('/available');
  }

  async getUserStats(): Promise<{ stats: UserStats; stage: number; stageData: any }> {
    return this.request<{ stats: UserStats; stage: number; stageData: any }>('/stats');
  }

  async getAchievementOverview(): Promise<AchievementOverview> {
    return this.request<AchievementOverview>('/overview');
  }

  async updateUserStat(statName: string, increment: number = 1): Promise<{
    success: boolean;
    stats: UserStats;
    newAchievements: Achievement[];
  }> {
    return this.request<{
      success: boolean;
      stats: UserStats;
      newAchievements: Achievement[];
    }>(`/stats/${statName}`, {
      method: 'POST',
      body: JSON.stringify({ increment }),
    });
  }

  async unlockAchievement(achievementId: string): Promise<{
    success: boolean;
    achievement: Achievement;
  }> {
    return this.request<{
      success: boolean;
      achievement: Achievement;
    }>(`/unlock/${achievementId}`, {
      method: 'POST',
    });
  }
}

const achievementsAPI = new AchievementsAPI();

export function useUserAchievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAchievements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await achievementsAPI.getUserAchievements();
      setAchievements(response.achievements);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch achievements');
      console.error('Error fetching achievements:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  return {
    achievements,
    loading,
    error,
    refetch: fetchAchievements,
  };
}

export function useAvailableAchievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAchievements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await achievementsAPI.getAvailableAchievements();
      setAchievements(response.achievements);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch available achievements');
      console.error('Error fetching available achievements:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  return {
    achievements,
    loading,
    error,
    refetch: fetchAchievements,
  };
}

export function useUserStats() {
  const [stats, setStats] = useState<UserStats>({});
  const [stage, setStage] = useState(1);
  const [stageData, setStageData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await achievementsAPI.getUserStats();
      setStats(response.stats);
      setStage(response.stage);
      setStageData(response.stageData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user stats');
      console.error('Error fetching user stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const updateStat = useCallback(async (statName: string, increment: number = 1) => {
    try {
      const response = await achievementsAPI.updateUserStat(statName, increment);
      setStats(response.stats);
      return response.newAchievements;
    } catch (err) {
      console.error('Error updating stat:', err);
      return [];
    }
  }, []);

  return {
    stats,
    stage,
    stageData,
    loading,
    error,
    updateStat,
    refetch: fetchStats,
  };
}

export function useAchievementOverview() {
  const [overview, setOverview] = useState<AchievementOverview>({
    totalPoints: 0,
    totalUnlocked: 0,
    totalAvailable: 0,
    completionPercentage: 0,
    byRarity: {
      common: { unlocked: 0, total: 0 },
      rare: { unlocked: 0, total: 0 },
      epic: { unlocked: 0, total: 0 },
      legendary: { unlocked: 0, total: 0 },
    },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await achievementsAPI.getAchievementOverview();
      setOverview(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch achievement overview');
      console.error('Error fetching achievement overview:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  return {
    overview,
    loading,
    error,
    refetch: fetchOverview,
  };
}

export function useAchievements() {
  const userAchievements = useUserAchievements();
  const availableAchievements = useAvailableAchievements();
  const userStats = useUserStats();
  const achievementOverview = useAchievementOverview();

  const unlockAchievement = useCallback(async (achievementId: string) => {
    try {
      const response = await achievementsAPI.unlockAchievement(achievementId);
      // Refetch data to get updated state
      userAchievements.refetch();
      availableAchievements.refetch();
      achievementOverview.refetch();
      return response.achievement;
    } catch (err) {
      console.error('Error unlocking achievement:', err);
      return null;
    }
  }, [userAchievements, availableAchievements, achievementOverview]);

  return {
    userAchievements: userAchievements.achievements,
    availableAchievements: availableAchievements.achievements,
    stats: userStats.stats,
    stage: userStats.stage,
    stageData: userStats.stageData,
    overview: achievementOverview.overview,
    loading: userAchievements.loading || availableAchievements.loading || userStats.loading || achievementOverview.loading,
    error: userAchievements.error || availableAchievements.error || userStats.error || achievementOverview.error,
    updateStat: userStats.updateStat,
    unlockAchievement,
    refetch: () => {
      userAchievements.refetch();
      availableAchievements.refetch();
      userStats.refetch();
      achievementOverview.refetch();
    },
  };
}