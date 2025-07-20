import { renderHook, act } from '@testing-library/react';
import { useUserProgressStore } from '@/stores/userProgress';
import { USER_STAGES } from '@/lib/constants/user-stages';

describe('UserProgress Store', () => {
  beforeEach(() => {
    // Reset store before each test
    useUserProgressStore.getState().resetProgress();
  });

  describe('Initial State', () => {
    it('should start with new user stage', () => {
      const { result } = renderHook(() => useUserProgressStore());
      expect(result.current.stage).toBe('new');
    });

    it('should have zero initial stats', () => {
      const { result } = renderHook(() => useUserProgressStore());
      const stats = result.current.stats;
      
      expect(stats.contactsAdded).toBe(0);
      expect(stats.messagesSent).toBe(0);
      expect(stats.aiInteractions).toBe(0);
      expect(stats.templatesUsed).toBe(0);
      expect(stats.pipelineActions).toBe(0);
    });

    it('should have empty unlocked features', () => {
      const { result } = renderHook(() => useUserProgressStore());
      expect(result.current.unlockedFeatures).toEqual([]);
    });
  });

  describe('Stage Progression', () => {
    it('should progress from new to beginner after first contact', () => {
      const { result } = renderHook(() => useUserProgressStore());
      
      act(() => {
        result.current.incrementStat('contactsAdded');
      });

      expect(result.current.stage).toBe(USER_STAGES.BEGINNER);
      expect(result.current.stats.contactsAdded).toBe(1);
    });

    it('should progress to intermediate after 10 contacts', () => {
      const { result } = renderHook(() => useUserProgressStore());
      
      act(() => {
        // Add 10 contacts
        for (let i = 0; i < 10; i++) {
          result.current.incrementStat('contactsAdded');
        }
      });

      expect(result.current.stage).toBe(USER_STAGES.INTERMEDIATE);
      expect(result.current.stats.contactsAdded).toBe(10);
    });

    it('should progress to advanced after 50 messages', () => {
      const { result } = renderHook(() => useUserProgressStore());
      
      act(() => {
        // First add contacts to reach intermediate
        for (let i = 0; i < 10; i++) {
          result.current.incrementStat('contactsAdded');
        }
        // Then send 50 messages
        for (let i = 0; i < 50; i++) {
          result.current.incrementStat('messagesSent');
        }
      });

      expect(result.current.stage).toBe(USER_STAGES.ADVANCED);
      expect(result.current.stats.messagesSent).toBe(50);
    });

    it('should progress to expert after 25 AI interactions', () => {
      const { result } = renderHook(() => useUserProgressStore());
      
      act(() => {
        // Progress through all stages
        for (let i = 0; i < 10; i++) {
          result.current.incrementStat('contactsAdded');
        }
        for (let i = 0; i < 50; i++) {
          result.current.incrementStat('messagesSent');
        }
        for (let i = 0; i < 25; i++) {
          result.current.incrementStat('aiInteractions');
        }
      });

      expect(result.current.stage).toBe(USER_STAGES.EXPERT);
      expect(result.current.stats.aiInteractions).toBe(25);
    });
  });

  describe('Feature Unlocking', () => {
    it('should unlock contacts:list after first contact', () => {
      const { result } = renderHook(() => useUserProgressStore());
      
      act(() => {
        result.current.incrementStat('contactsAdded');
      });

      expect(result.current.unlockedFeatures).toContain('contacts:list');
      expect(result.current.unlockedFeatures).toContain('contacts:create');
    });

    it('should unlock pipeline features after 10 contacts', () => {
      const { result } = renderHook(() => useUserProgressStore());
      
      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.incrementStat('contactsAdded');
        }
      });

      expect(result.current.unlockedFeatures).toContain('pipeline:view');
      expect(result.current.unlockedFeatures).toContain('pipeline:manage');
    });

    it('should unlock AI features after 50 messages', () => {
      const { result } = renderHook(() => useUserProgressStore());
      
      act(() => {
        // Add contacts first
        for (let i = 0; i < 10; i++) {
          result.current.incrementStat('contactsAdded');
        }
        // Send messages
        for (let i = 0; i < 50; i++) {
          result.current.incrementStat('messagesSent');
        }
      });

      expect(result.current.unlockedFeatures).toContain('ai:suggestions');
      expect(result.current.unlockedFeatures).toContain('ai:automation');
    });
  });

  describe('Achievements', () => {
    it('should add achievement for first contact', () => {
      const { result } = renderHook(() => useUserProgressStore());
      
      act(() => {
        result.current.addAchievement({
          id: 'first-contact',
          title: 'First Contact',
          description: 'Added your first contact',
          icon: '👥',
          category: 'milestone'
        });
      });

      expect(result.current.achievements).toHaveLength(1);
      expect(result.current.achievements[0].id).toBe('first-contact');
    });

    it('should prevent duplicate achievements', () => {
      const { result } = renderHook(() => useUserProgressStore());
      
      const achievement = {
        id: 'first-contact',
        title: 'First Contact',
        description: 'Added your first contact',
        icon: '👥',
        category: 'milestone' as const
      };

      act(() => {
        result.current.addAchievement(achievement);
        result.current.addAchievement(achievement);
      });

      expect(result.current.achievements).toHaveLength(1);
    });
  });

  describe('Progress Calculation', () => {
    it('should calculate progress percentage correctly', () => {
      const { result } = renderHook(() => useUserProgressStore());
      
      // New user: 0%
      expect(result.current.getProgressPercentage()).toBe(0);

      act(() => {
        // Add 5 contacts (beginner stage, halfway to intermediate)
        for (let i = 0; i < 5; i++) {
          result.current.incrementStat('contactsAdded');
        }
      });

      // Should be 50% through beginner stage
      expect(result.current.getProgressPercentage()).toBe(50);

      act(() => {
        // Add 5 more contacts to reach intermediate
        for (let i = 0; i < 5; i++) {
          result.current.incrementStat('contactsAdded');
        }
      });

      // At intermediate stage start
      expect(result.current.getProgressPercentage()).toBe(0);
    });
  });

  describe('Next Stage Requirements', () => {
    it('should return correct requirements for new user', () => {
      const { result } = renderHook(() => useUserProgressStore());
      const requirements = result.current.getNextStageRequirements();
      
      expect(requirements).toContain('Add your first contact');
    });

    it('should return correct requirements for beginner', () => {
      const { result } = renderHook(() => useUserProgressStore());
      
      act(() => {
        result.current.incrementStat('contactsAdded');
      });

      const requirements = result.current.getNextStageRequirements();
      expect(requirements).toContain('Add 9 more contacts (1/10)');
    });

    it('should return empty array for expert', () => {
      const { result } = renderHook(() => useUserProgressStore());
      
      act(() => {
        // Progress to expert stage
        for (let i = 0; i < 10; i++) {
          result.current.incrementStat('contactsAdded');
        }
        for (let i = 0; i < 50; i++) {
          result.current.incrementStat('messagesSent');
        }
        for (let i = 0; i < 25; i++) {
          result.current.incrementStat('aiInteractions');
        }
      });

      const requirements = result.current.getNextStageRequirements();
      expect(requirements).toEqual([]);
    });
  });

  describe('State Reset', () => {
    it('should reset all state to initial values', () => {
      const { result } = renderHook(() => useUserProgressStore());
      
      act(() => {
        // Add some progress
        result.current.incrementStat('contactsAdded');
        result.current.incrementStat('messagesSent');
        result.current.addAchievement({
          id: 'test',
          title: 'Test',
          description: 'Test achievement',
          icon: '🎯',
          category: 'milestone'
        });
        result.current.setCurrentHint('Test hint');
      });

      // Verify state has changed
      expect(result.current.stage).not.toBe(USER_STAGES.NEW);
      expect(result.current.achievements).toHaveLength(1);
      expect(result.current.currentHint).toBe('Test hint');

      act(() => {
        result.current.resetProgress();
      });

      // Verify reset
      expect(result.current.stage).toBe('new');
      expect(result.current.stats.contactsAdded).toBe(0);
      expect(result.current.achievements).toEqual([]);
      expect(result.current.currentHint).toBeNull();
    });
  });
});