import { renderHook, act } from '@testing-library/react';
import { useFeatureGate, useFeatureTracker } from '@/hooks/useFeatureGate';
import { useUserProgressStore } from '@/stores/userProgress';

// Mock the user progress store
jest.mock('@/stores/userProgress', () => ({
  useUserProgressStore: jest.fn()
}));

const mockUseUserProgressStore = useUserProgressStore as jest.MockedFunction<typeof useUserProgressStore>;

describe('useFeatureGate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return feature is unlocked when feature exists in unlocked features', () => {
    mockUseUserProgressStore.mockImplementation((selector: any) => {
      const state = {
        stage: 'beginner',
        unlockedFeatures: ['contacts:create', 'contacts:list', 'messages:send'],
        newFeaturesSeen: [],
        canAccessFeature: (feature: string) => ['contacts:create', 'contacts:list', 'messages:send'].includes(feature)
      };
      return selector ? selector(state) : state;
    });

    const { result } = renderHook(() => useFeatureGate('contacts:create'));
    
    expect(result.current.canAccess).toBe(true);
    expect(result.current.currentStage).toBe('beginner');
  });

  it('should return feature is locked when feature does not exist in unlocked features', () => {
    mockUseUserProgressStore.mockImplementation((selector: any) => {
      const state = {
        stage: 'new',
        unlockedFeatures: ['contacts:create'],
        newFeaturesSeen: [],
        canAccessFeature: (feature: string) => feature === 'contacts:create'
      };
      return selector ? selector(state) : state;
    });

    const { result } = renderHook(() => useFeatureGate('ai:suggestions'));
    
    expect(result.current.canAccess).toBe(false);
    expect(result.current.currentStage).toBe('new');
  });

  it('should handle empty unlocked features array', () => {
    mockUseUserProgressStore.mockImplementation((selector: any) => {
      const state = {
        stage: 'new',
        unlockedFeatures: [],
        newFeaturesSeen: [],
        canAccessFeature: () => false
      };
      return selector ? selector(state) : state;
    });

    const { result } = renderHook(() => useFeatureGate('contacts:create'));
    
    expect(result.current.canAccess).toBe(false);
    expect(result.current.currentStage).toBe('new');
  });

  it('should detect new features', () => {
    mockUseUserProgressStore.mockImplementation((selector: any) => {
      const state = {
        stage: 'intermediate',
        unlockedFeatures: ['contacts:create', 'pipeline:view'],
        newFeaturesSeen: ['contacts:create'], // This one has been seen
        canAccessFeature: (feature: string) => ['contacts:create', 'pipeline:view'].includes(feature)
      };
      return selector ? selector(state) : state;
    });

    const { result: result1 } = renderHook(() => useFeatureGate('contacts:create'));
    const { result: result2 } = renderHook(() => useFeatureGate('pipeline:view'));
    
    expect(result1.current.isNew).toBe(false); // Already seen
    expect(result2.current.isNew).toBe(true);  // New feature
  });

  it('should return required stage information', () => {
    mockUseUserProgressStore.mockImplementation((selector: any) => {
      const state = {
        stage: 'beginner',
        unlockedFeatures: ['contacts:create'],
        newFeaturesSeen: [],
        canAccessFeature: (feature: string) => feature === 'contacts:create'
      };
      return selector ? selector(state) : state;
    });

    const { result } = renderHook(() => useFeatureGate('contacts:create'));
    
    expect(result.current.currentStage).toBe('beginner');
    expect(typeof result.current.requiredStage).toBe('string');
  });
});

describe('useFeatureTracker', () => {
  let mockIncrementStat: jest.Mock;
  let mockAddAchievement: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockIncrementStat = jest.fn();
    mockAddAchievement = jest.fn();
    
    mockUseUserProgressStore.mockImplementation((selector: any) => {
      const state = {
        stats: {
          contactsAdded: 5,
          messagesSent: 10,
          aiInteractions: 2,
          templatesUsed: 1,
          pipelineActions: 3
        },
        incrementStat: mockIncrementStat,
        addAchievement: mockAddAchievement
      };
      return selector ? selector(state) : state;
    });
  });

  it('should track feature usage and increment appropriate stats', () => {
    const { result } = renderHook(() => useFeatureTracker());
    
    act(() => {
      result.current.trackFeatureUsage('contacts:create');
    });
    
    expect(mockIncrementStat).toHaveBeenCalledWith('contactsAdded');
  });

  it('should track message feature usage', () => {
    const { result } = renderHook(() => useFeatureTracker());
    
    act(() => {
      result.current.trackFeatureUsage('messages:send');
    });
    
    expect(mockIncrementStat).toHaveBeenCalledWith('messagesSent');
  });

  it('should track AI feature usage', () => {
    const { result } = renderHook(() => useFeatureTracker());
    
    act(() => {
      result.current.trackFeatureUsage('ai:suggestions');
    });
    
    expect(mockIncrementStat).toHaveBeenCalledWith('aiInteractions');
  });

  it('should track template feature usage', () => {
    const { result } = renderHook(() => useFeatureTracker());
    
    act(() => {
      result.current.trackFeatureUsage('templates:used');
    });
    
    expect(mockIncrementStat).toHaveBeenCalledWith('templatesUsed');
  });

  it('should track pipeline feature usage', () => {
    const { result } = renderHook(() => useFeatureTracker());
    
    act(() => {
      result.current.trackFeatureUsage('pipeline:actions');
    });
    
    expect(mockIncrementStat).toHaveBeenCalledWith('pipelineActions');
  });

  it('should not increment stats for unknown features', () => {
    const { result } = renderHook(() => useFeatureTracker());
    
    act(() => {
      result.current.trackFeatureUsage('unknown:feature' as any);
    });
    
    expect(mockIncrementStat).not.toHaveBeenCalled();
  });

  it('should track milestone with trackMilestone method', () => {
    const { result } = renderHook(() => useFeatureTracker());
    
    act(() => {
      result.current.trackMilestone(
        'first-contact',
        'First Contact Added!',
        'You\'ve added your first contact to the CRM',
        '👥'
      );
    });
    
    expect(mockAddAchievement).toHaveBeenCalledWith({
      id: 'first-contact',
      title: 'First Contact Added!',
      description: 'You\'ve added your first contact to the CRM',
      icon: '👥',
      category: 'milestone'
    });
  });

  it('should provide access to underlying store functions', () => {
    const { result } = renderHook(() => useFeatureTracker());
    
    // Test that we can track usage and it calls incrementStat
    act(() => {
      result.current.trackFeatureUsage('messages:send');
    });
    
    expect(mockIncrementStat).toHaveBeenCalledWith('messagesSent');
    
    // Test milestone tracking
    act(() => {
      result.current.trackMilestone(
        'first-message',
        'First Message Sent!',
        'You\'ve sent your first WhatsApp message',
        '📱'
      );
    });
    
    expect(mockAddAchievement).toHaveBeenCalledWith({
      id: 'first-message',
      title: 'First Message Sent!',
      description: 'You\'ve sent your first WhatsApp message',
      icon: '📱',
      category: 'milestone'
    });
  });

  it('should track AI feature usage correctly', () => {
    const { result } = renderHook(() => useFeatureTracker());
    
    act(() => {
      result.current.trackFeatureUsage('ai:suggestions');
    });
    
    expect(mockIncrementStat).toHaveBeenCalledWith('aiInteractions');
    
    act(() => {
      result.current.trackFeatureUsage('ai:responses');
    });
    
    expect(mockIncrementStat).toHaveBeenCalledWith('aiInteractions');
  });

  it('should handle feature usage tracking for all supported features', () => {
    const { result } = renderHook(() => useFeatureTracker());
    
    // Test all feature types
    const featureTests = [
      { feature: 'contacts:create', expectedStat: 'contactsAdded' },
      { feature: 'messages:send', expectedStat: 'messagesSent' },
      { feature: 'ai:suggestions', expectedStat: 'aiInteractions' },
      { feature: 'templates:used', expectedStat: 'templatesUsed' },
      { feature: 'pipeline:actions', expectedStat: 'pipelineActions' }
    ];
    
    featureTests.forEach(({ feature, expectedStat }) => {
      act(() => {
        result.current.trackFeatureUsage(feature as any);
      });
      
      expect(mockIncrementStat).toHaveBeenCalledWith(expectedStat);
    });
  });

  it('should not add achievements for already achieved milestones', () => {
    // User already has many contacts
    mockUseUserProgressStore.mockImplementation((selector: any) => {
      const state = {
        stats: {
          contactsAdded: 15, // Already past first contact milestone
          messagesSent: 5,
          aiInteractions: 0,
          templatesUsed: 0,
          pipelineActions: 0
        },
        incrementStat: mockIncrementStat,
        addAchievement: mockAddAchievement
      };
      return selector ? selector(state) : state;
    });

    const { result } = renderHook(() => useFeatureTracker());
    
    act(() => {
      result.current.trackFeatureUsage('contacts:create');
    });
    
    expect(mockIncrementStat).toHaveBeenCalledWith('contactsAdded');
    // Should not add first contact achievement since already past it
    expect(mockAddAchievement).not.toHaveBeenCalledWith(
      expect.objectContaining({ id: 'first-contact' })
    );
  });
});