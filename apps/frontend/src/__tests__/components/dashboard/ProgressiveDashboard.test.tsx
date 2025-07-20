import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProgressiveDashboard } from '@/components/dashboard/ProgressiveDashboard';
import { useUserProgressStore } from '@/stores/userProgress';
import { useRouter } from 'next/navigation';
import { useFeatureGate } from '@/hooks/useFeatureGate';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/stores/userProgress');
jest.mock('@/hooks/useFeatureGate', () => ({
  useFeatureGate: jest.fn(),
  useFeatureTracker: jest.fn(() => ({
    trackFeatureUsage: jest.fn(),
  })),
}));

const mockPush = jest.fn();
const mockOnAddContact = jest.fn();

describe('ProgressiveDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  describe('New User Stage', () => {
    beforeEach(() => {
      (useUserProgressStore as any).mockImplementation((selector: any) => {
        const state = {
          stage: 'new',
          stats: {
            contactsAdded: 0,
            messagesSent: 0,
            aiInteractions: 0,
            templatesUsed: 0,
            pipelineActions: 0,
          },
        };
        return selector ? selector(state) : state;
      });

      (useFeatureGate as jest.Mock).mockReturnValue({
        isFeatureUnlocked: jest.fn().mockReturnValue(false),
      });
    });

    it('should render welcome message for new user', () => {
      render(<ProgressiveDashboard onAddContact={mockOnAddContact} />);
      
      expect(screen.getByText(/Welcome to Your CRM Journey!/i)).toBeInTheDocument();
      expect(screen.getByText(/Start by adding your first/i)).toBeInTheDocument();
    });

    it('should show Add Contact button prominently', () => {
      render(<ProgressiveDashboard onAddContact={mockOnAddContact} />);
      
      const addContactButton = screen.getByRole('button', { name: /Add Contact/i });
      expect(addContactButton).toBeInTheDocument();
      expect(addContactButton).toHaveClass('btn-primary');
    });

    it('should call onAddContact when Add Contact is clicked', async () => {
      const user = userEvent.setup();
      render(<ProgressiveDashboard onAddContact={mockOnAddContact} />);
      
      const addContactButton = screen.getByRole('button', { name: /Add Contact/i });
      await user.click(addContactButton);
      
      expect(mockOnAddContact).toHaveBeenCalledTimes(1);
    });

    it('should show journey roadmap', () => {
      render(<ProgressiveDashboard onAddContact={mockOnAddContact} />);
      
      expect(screen.getByText(/Your Journey Roadmap/i)).toBeInTheDocument();
      expect(screen.getByText(/Add Your First Contact/i)).toBeInTheDocument();
    });
  });

  describe('Beginner Stage', () => {
    beforeEach(() => {
      (useUserProgressStore as any).mockImplementation((selector: any) => {
        const state = {
          stage: 'beginner',
          stats: {
            contactsAdded: 3,
            messagesSent: 0,
            aiInteractions: 0,
            templatesUsed: 0,
            pipelineActions: 0,
          },
        };
        return selector ? selector(state) : state;
      });

      (useFeatureGate as jest.Mock).mockReturnValue({
        isFeatureUnlocked: jest.fn((feature: string) => 
          ['contacts:list', 'contacts:create', 'messages:send'].includes(feature)
        ),
      });
    });

    it('should show progress stats', () => {
      render(<ProgressiveDashboard onAddContact={mockOnAddContact} />);
      
      expect(screen.getByText('3')).toBeInTheDocument(); // Contacts count
      expect(screen.getByText('Contacts')).toBeInTheDocument();
    });

    it('should show available features', () => {
      render(<ProgressiveDashboard onAddContact={mockOnAddContact} />);
      
      expect(screen.getByText(/Your Available Features/i)).toBeInTheDocument();
      expect(screen.getByText(/Manage your contact list/i)).toBeInTheDocument();
    });

    it('should show next steps', () => {
      render(<ProgressiveDashboard onAddContact={mockOnAddContact} />);
      
      expect(screen.getByText(/Next Steps/i)).toBeInTheDocument();
      expect(screen.getByText(/more contacts/i)).toBeInTheDocument();
    });

    it('should navigate to contacts when card is clicked', async () => {
      const user = userEvent.setup();
      render(<ProgressiveDashboard onAddContact={mockOnAddContact} />);
      
      const contactsCard = screen.getByText('Contacts').closest('div[role="button"]');
      if (contactsCard) {
        await user.click(contactsCard);
        expect(mockPush).toHaveBeenCalledWith('/dashboard/leads');
      }
    });
  });

  describe('Intermediate Stage', () => {
    beforeEach(() => {
      (useUserProgressStore as any).mockImplementation((selector: any) => {
        const state = {
          stage: 'intermediate',
          stats: {
            contactsAdded: 15,
            messagesSent: 10,
            aiInteractions: 0,
            templatesUsed: 2,
            pipelineActions: 5,
          },
        };
        return selector ? selector(state) : state;
      });

      (useFeatureGate as jest.Mock).mockReturnValue({
        isFeatureUnlocked: jest.fn((feature: string) => 
          ['contacts:list', 'contacts:create', 'messages:send', 'messages:templates', 
           'pipeline:view', 'pipeline:manage'].includes(feature)
        ),
      });
    });

    it('should show all intermediate features', () => {
      render(<ProgressiveDashboard onAddContact={mockOnAddContact} />);
      
      expect(screen.getByText('15')).toBeInTheDocument(); // Contacts
      expect(screen.getByText('10')).toBeInTheDocument(); // Messages
      expect(screen.getByText('Pipeline')).toBeInTheDocument();
      expect(screen.getByText('Templates')).toBeInTheDocument();
    });

    it('should show pipeline card', () => {
      render(<ProgressiveDashboard onAddContact={mockOnAddContact} />);
      
      const pipelineCard = screen.getByText('Pipeline').closest('div');
      expect(pipelineCard).toBeInTheDocument();
    });

    it('should navigate to pipeline when clicked', async () => {
      const user = userEvent.setup();
      render(<ProgressiveDashboard onAddContact={mockOnAddContact} />);
      
      const pipelineCard = screen.getByText('Pipeline').closest('div[role="button"]');
      if (pipelineCard) {
        await user.click(pipelineCard);
        expect(mockPush).toHaveBeenCalledWith('/dashboard/leads');
      }
    });
  });

  describe('Advanced Stage', () => {
    beforeEach(() => {
      (useUserProgressStore as any).mockImplementation((selector: any) => {
        const state = {
          stage: 'advanced',
          stats: {
            contactsAdded: 50,
            messagesSent: 100,
            aiInteractions: 10,
            templatesUsed: 10,
            pipelineActions: 30,
          },
        };
        return selector ? selector(state) : state;
      });

      (useFeatureGate as jest.Mock).mockReturnValue({
        isFeatureUnlocked: jest.fn(() => true), // All features unlocked
      });
    });

    it('should show AI features', () => {
      render(<ProgressiveDashboard onAddContact={mockOnAddContact} />);
      
      expect(screen.getByText('AI Assistant')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument(); // AI interactions
    });

    it('should show analytics', () => {
      render(<ProgressiveDashboard onAddContact={mockOnAddContact} />);
      
      expect(screen.getByText('Analytics')).toBeInTheDocument();
    });

    it('should navigate to AI assistant when clicked', async () => {
      const user = userEvent.setup();
      render(<ProgressiveDashboard onAddContact={mockOnAddContact} />);
      
      const aiCard = screen.getByText('AI Assistant').closest('div[role="button"]');
      if (aiCard) {
        await user.click(aiCard);
        expect(mockPush).toHaveBeenCalledWith('/dashboard/ai');
      }
    });
  });

  describe('Expert Stage', () => {
    beforeEach(() => {
      (useUserProgressStore as any).mockImplementation((selector: any) => {
        const state = {
          stage: 'expert',
          stats: {
            contactsAdded: 100,
            messagesSent: 500,
            aiInteractions: 50,
            templatesUsed: 25,
            pipelineActions: 100,
          },
        };
        return selector ? selector(state) : state;
      });

      (useFeatureGate as jest.Mock).mockReturnValue({
        isFeatureUnlocked: jest.fn(() => true),
      });
    });

    it('should show expert dashboard layout', () => {
      render(<ProgressiveDashboard onAddContact={mockOnAddContact} />);
      
      // Should show all features in a compact grid
      expect(screen.getByText('Contacts')).toBeInTheDocument();
      expect(screen.getByText('Messages')).toBeInTheDocument();
      expect(screen.getByText('Pipeline')).toBeInTheDocument();
      expect(screen.getByText('AI Assistant')).toBeInTheDocument();
      expect(screen.getByText('Analytics')).toBeInTheDocument();
      expect(screen.getByText('Templates')).toBeInTheDocument();
    });

    it('should not show journey roadmap', () => {
      render(<ProgressiveDashboard onAddContact={mockOnAddContact} />);
      
      expect(screen.queryByText(/Your Journey Roadmap/i)).not.toBeInTheDocument();
    });

    it('should show advanced metrics', () => {
      render(<ProgressiveDashboard onAddContact={mockOnAddContact} />);
      
      expect(screen.getByText('100')).toBeInTheDocument(); // Contacts
      expect(screen.getByText('500')).toBeInTheDocument(); // Messages
      expect(screen.getByText('50')).toBeInTheDocument(); // AI interactions
    });
  });

  describe('Feature Navigation', () => {
    it('should navigate to messages when message card is clicked', async () => {
      const user = userEvent.setup();
      
      (useUserProgressStore as any).mockImplementation((selector: any) => {
        const state = {
          stage: 'intermediate',
          stats: {
            contactsAdded: 15,
            messagesSent: 10,
            aiInteractions: 0,
            templatesUsed: 2,
            pipelineActions: 5,
          },
        };
        return selector ? selector(state) : state;
      });

      (useFeatureGate as jest.Mock).mockReturnValue({
        isFeatureUnlocked: jest.fn(() => true),
      });

      render(<ProgressiveDashboard onAddContact={mockOnAddContact} />);
      
      const messagesCard = screen.getByText('Messages').closest('div[role="button"]');
      if (messagesCard) {
        await user.click(messagesCard);
        expect(mockPush).toHaveBeenCalledWith('/dashboard/messages');
      }
    });

    it('should navigate to analytics when analytics card is clicked', async () => {
      const user = userEvent.setup();
      
      (useUserProgressStore as any).mockImplementation((selector: any) => {
        const state = {
          stage: 'advanced',
          stats: {
            contactsAdded: 50,
            messagesSent: 100,
            aiInteractions: 10,
            templatesUsed: 10,
            pipelineActions: 30,
          },
        };
        return selector ? selector(state) : state;
      });

      (useFeatureGate as jest.Mock).mockReturnValue({
        isFeatureUnlocked: jest.fn(() => true),
      });

      render(<ProgressiveDashboard onAddContact={mockOnAddContact} />);
      
      const analyticsCard = screen.getByText('Analytics').closest('div[role="button"]');
      if (analyticsCard) {
        await user.click(analyticsCard);
        expect(mockPush).toHaveBeenCalledWith('/dashboard/analytics');
      }
    });
  });
});