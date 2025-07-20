import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProgressiveDashboard } from '@/components/dashboard/ProgressiveDashboard';
import { useRouter } from 'next/navigation';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/stores/userProgress', () => ({
  useUserProgressStore: jest.fn((selector) => {
    const mockState = {
      stage: 'new',
      stats: {
        contactsAdded: 0,
        messagesSent: 0,
        aiInteractions: 0,
        templatesUsed: 0,
        pipelineActions: 0,
      },
      currentHint: null,
      setCurrentHint: jest.fn(),
    };
    return selector ? selector(mockState) : mockState;
  }),
}));

jest.mock('@/hooks/useFeatureGate', () => ({
  useFeatureGate: jest.fn(() => ({
    isFeatureUnlocked: jest.fn().mockReturnValue(false),
  })),
  useFeatureTracker: jest.fn(() => ({
    trackFeatureUsage: jest.fn(),
  })),
}));

const mockPush = jest.fn();
const mockOnAddContact = jest.fn();

describe('ProgressiveDashboard - Simple Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  it('should render without crashing', () => {
    render(<ProgressiveDashboard onAddContact={mockOnAddContact} />);
    expect(screen.getByText(/Welcome to Your CRM Journey!/i)).toBeInTheDocument();
  });

  it('should have Add Contact button for new users', () => {
    render(<ProgressiveDashboard onAddContact={mockOnAddContact} />);
    const addContactButton = screen.getByRole('button', { name: /Add Your First Contact/i });
    expect(addContactButton).toBeInTheDocument();
  });

  it('should call onAddContact when button is clicked', () => {
    render(<ProgressiveDashboard onAddContact={mockOnAddContact} />);
    const addContactButton = screen.getByRole('button', { name: /Add Your First Contact/i });
    fireEvent.click(addContactButton);
    expect(mockOnAddContact).toHaveBeenCalledTimes(1);
  });
});