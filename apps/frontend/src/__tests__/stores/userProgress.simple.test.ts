import { renderHook, act } from '@testing-library/react';
import { useUserProgressStore } from '@/stores/userProgress';

describe('UserProgress Store - Simple Tests', () => {
  beforeEach(() => {
    // Reset store before each test
    useUserProgressStore.getState().resetProgress();
  });

  describe('Basic Functionality', () => {
    it('should initialize with new user stage', () => {
      const { result } = renderHook(() => useUserProgressStore());
      expect(result.current.stage).toBe('new');
    });

    it('should have initial stats', () => {
      const { result } = renderHook(() => useUserProgressStore());
      const stats = result.current.stats;
      
      expect(stats.contactsAdded).toBe(0);
      expect(stats.messagesSent).toBe(0);
      expect(stats.aiInteractions).toBe(0);
      expect(stats.templatesUsed).toBe(0);
      expect(stats.pipelineActions).toBe(0);
    });

    it('should have initial unlocked features', () => {
      const { result } = renderHook(() => useUserProgressStore());
      expect(result.current.unlockedFeatures).toContain('contacts:create');
    });

    it('should increment stats', () => {
      const { result } = renderHook(() => useUserProgressStore());
      
      act(() => {
        result.current.incrementStat('contactsAdded');
        result.current.incrementStat('messagesSent', 3);
      });

      expect(result.current.stats.contactsAdded).toBe(1);
      expect(result.current.stats.messagesSent).toBe(3);
    });

    it('should update stats', () => {
      const { result } = renderHook(() => useUserProgressStore());
      
      act(() => {
        result.current.updateStats({
          contactsAdded: 5,
          messagesSent: 10
        });
      });

      expect(result.current.stats.contactsAdded).toBe(5);
      expect(result.current.stats.messagesSent).toBe(10);
    });

    it('should add achievements', () => {
      const { result } = renderHook(() => useUserProgressStore());
      
      const achievement = {
        id: 'test-achievement',
        title: 'Test Achievement',
        description: 'Test description',
        icon: '🎯',
        category: 'milestone' as const
      };

      act(() => {
        result.current.addAchievement(achievement);
      });

      expect(result.current.achievements).toHaveLength(1);
      expect(result.current.achievements[0].id).toBe('test-achievement');
    });

    it('should handle multiple achievements', () => {
      const { result } = renderHook(() => useUserProgressStore());
      
      const achievement1 = {
        id: 'test-achievement-1',
        title: 'Test Achievement 1',
        description: 'Test description 1',
        icon: '🎯',
        category: 'milestone' as const
      };

      const achievement2 = {
        id: 'test-achievement-2',
        title: 'Test Achievement 2',
        description: 'Test description 2',
        icon: '⭐',
        category: 'feature' as const
      };

      act(() => {
        result.current.addAchievement(achievement1);
        result.current.addAchievement(achievement2);
      });

      expect(result.current.achievements).toHaveLength(2);
      expect(result.current.achievements[0].id).toBe('test-achievement-1');
      expect(result.current.achievements[1].id).toBe('test-achievement-2');
    });

    it('should set and dismiss hints', () => {
      const { result } = renderHook(() => useUserProgressStore());
      
      act(() => {
        result.current.setCurrentHint('Test hint');
      });

      expect(result.current.currentHint).toBe('Test hint');

      act(() => {
        result.current.dismissHint();
      });

      expect(result.current.currentHint).toBeNull();
    });

    it('should check feature access', () => {
      const { result } = renderHook(() => useUserProgressStore());
      
      // Initially can access contacts:create
      expect(result.current.canAccessFeature('contacts:create')).toBe(true);
      
      // Cannot access advanced features
      expect(result.current.canAccessFeature('ai:suggestions')).toBe(false);
    });

    it('should unlock features', () => {
      const { result } = renderHook(() => useUserProgressStore());
      
      act(() => {
        result.current.unlockFeature('contacts:list');
      });

      expect(result.current.unlockedFeatures).toContain('contacts:list');
      expect(result.current.canAccessFeature('contacts:list')).toBe(true);
    });

    it('should reset progress', () => {
      const { result } = renderHook(() => useUserProgressStore());
      
      // Make some changes
      act(() => {
        result.current.incrementStat('contactsAdded', 5);
        result.current.setCurrentHint('Test hint');
        result.current.addAchievement({
          id: 'test',
          title: 'Test',
          description: 'Test',
          icon: '🎯',
          category: 'milestone'
        });
      });

      // Verify changes
      expect(result.current.stats.contactsAdded).toBe(5);
      expect(result.current.currentHint).toBe('Test hint');
      expect(result.current.achievements).toHaveLength(1);

      // Reset
      act(() => {
        result.current.resetProgress();
      });

      // Verify reset
      expect(result.current.stage).toBe('new');
      expect(result.current.stats.contactsAdded).toBe(0);
      expect(result.current.currentHint).toBe('Add your first contact to get started');
      expect(result.current.achievements).toEqual([]);
    });

    it('should get progress percentage', () => {
      const { result } = renderHook(() => useUserProgressStore());
      
      const percentage = result.current.getProgressPercentage();
      expect(typeof percentage).toBe('number');
      expect(percentage).toBeGreaterThanOrEqual(0);
      expect(percentage).toBeLessThanOrEqual(100);
    });

    it('should get next stage requirements', () => {
      const { result } = renderHook(() => useUserProgressStore());
      
      const requirements = result.current.getNextStageRequirements();
      expect(Array.isArray(requirements)).toBe(true);
      expect(requirements.length).toBeGreaterThan(0);
    });
  });
});