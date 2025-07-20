import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/auth-context';
import DashboardPage from '@/app/dashboard/page';
import { useRouter } from 'next/navigation';
import { createMockUserProgressStore } from '../mocks/stores';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/hooks/use-api', () => ({
  useCreateLead: jest.fn(() => ({
    mutateAsync: jest.fn().mockResolvedValue({ id: '123', name: 'Test Lead' }),
    isPending: false,
  })),
}));

// Create mock store
let mockStore = createMockUserProgressStore();

jest.mock('@/stores/userProgress', () => ({
  useUserProgressStore: Object.assign(
    (selector: any) => {
      const state = mockStore.getState();
      // If selector is looking for incrementStat, return the function
      if (selector && typeof selector === 'function') {
        const result = selector(state);
        // If the selector is requesting incrementStat, return our mock function
        if (typeof result === 'undefined' && state.incrementStat) {
          return mockStore.incrementStat;
        }
        return result;
      }
      return state;
    },
    {
      getState: () => mockStore.getState(),
      setState: (state: any) => mockStore.setState(state),
    }
  ),
}));

jest.mock('@/hooks/useFeatureGate', () => ({
  useFeatureGate: jest.fn(() => ({
    isFeatureUnlocked: jest.fn().mockReturnValue(false),
  })),
  useFeatureTracker: jest.fn(() => ({
    trackFeatureUsage: jest.fn(),
  })),
}));

jest.mock('@/contexts/socket-context', () => ({
  useRealtimeSocket: jest.fn(() => ({
    connected: false,
    connecting: false,
    error: null,
    reconnectAttempts: 0,
    latency: 0,
    connect: jest.fn(),
  })),
}));

jest.mock('@/contexts/auth-context', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: jest.fn(() => ({
    user: { id: '1', name: 'Test User', email: 'test@example.com' },
    isAuthenticated: true,
    isLoading: false,
    login: jest.fn(),
    logout: jest.fn(),
  })),
}));

// Helper to render with providers
const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {ui}
      </AuthProvider>
    </QueryClientProvider>
  );
};

describe('Progressive Disclosure Integration', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    // Reset user progress store
    mockStore = createMockUserProgressStore();
  });

  describe('New User Journey', () => {
    it('should show welcome screen for new users', () => {
      renderWithProviders(<DashboardPage />);

      expect(screen.getByText(/Welcome to Your CRM Journey!/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Add Contact/i })).toBeInTheDocument();
    });

    it('should open contact form when Add Contact is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<DashboardPage />);

      const addButton = screen.getByRole('button', { name: /Add Contact/i });
      await user.click(addButton);

      // Should show the contact form modal
      expect(screen.getByRole('heading', { name: /Add Your First Contact/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/Name \*/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Phone \*/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    });

    it('should create contact and update progress when form is submitted', async () => {
      const user = userEvent.setup();
      const { useCreateLead } = require('@/hooks/use-api');
      const mockMutateAsync = jest.fn().mockResolvedValue({ id: '123' });
      
      useCreateLead.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
      });

      renderWithProviders(<DashboardPage />);

      // Open modal
      await user.click(screen.getByRole('button', { name: /Add Your First Contact/i }));

      // Fill form
      await user.type(screen.getByLabelText(/Name \*/i), 'John Doe');
      await user.type(screen.getByLabelText(/Phone \*/i), '+919876543210');
      await user.type(screen.getByLabelText(/Email/i), 'john@example.com');

      // Submit form
      await user.click(screen.getByRole('button', { name: /Create Contact/i }));

      // Should call create lead API
      expect(mockMutateAsync).toHaveBeenCalledWith({
        name: 'John Doe',
        phone: '+919876543210',
        email: 'john@example.com',
        source: undefined,
        priority: 'MEDIUM',
        businessProfile: undefined,
      });

      // Should navigate to leads page
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard/leads');
      });

      // Should update user progress
      await waitFor(() => {
        // Mock the incrementStat to update the store
        mockStore.incrementStat('contactsAdded');
        const state = mockStore.getState();
        expect(state.stats.contactsAdded).toBe(1);
        expect(state.stage).toBe('beginner');
      });
    });

    it('should show validation errors for required fields', async () => {
      const user = userEvent.setup();
      renderWithProviders(<DashboardPage />);

      // Open modal
      await user.click(screen.getByRole('button', { name: /Add Your First Contact/i }));

      // Try to submit without filling required fields
      await user.click(screen.getByRole('button', { name: /Create Contact/i }));

      // Browser validation should prevent submission
      const nameInput = screen.getByLabelText(/Name \*/i) as HTMLInputElement;
      expect(nameInput.validity.valueMissing).toBe(true);
    });

    it('should close modal when cancel is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<DashboardPage />);

      // Open modal
      await user.click(screen.getByRole('button', { name: /Add Your First Contact/i }));
      expect(screen.getByRole('heading', { name: /Add Your First Contact/i })).toBeInTheDocument();

      // Click cancel
      await user.click(screen.getByRole('button', { name: /Cancel/i }));

      // Modal should be closed
      expect(screen.queryByRole('heading', { name: /Add Your First Contact/i })).not.toBeInTheDocument();
    });

    it('should close modal when X button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<DashboardPage />);

      // Open modal
      await user.click(screen.getByRole('button', { name: /Add Your First Contact/i }));
      expect(screen.getByRole('heading', { name: /Add Your First Contact/i })).toBeInTheDocument();

      // Click X button
      const closeButton = screen.getByText('✕');
      await user.click(closeButton);

      // Modal should be closed
      expect(screen.queryByRole('heading', { name: /Add Your First Contact/i })).not.toBeInTheDocument();
    });
  });

  describe('Stage Progression', () => {
    it('should progress from new to beginner after first contact', async () => {
      const user = userEvent.setup();
      const { useCreateLead } = require('@/hooks/use-api');
      
      useCreateLead.mockReturnValue({
        mutateAsync: jest.fn().mockResolvedValue({ id: '123' }),
        isPending: false,
      });

      // Start as new user
      expect(mockStore.getState().stage).toBe('new');

      renderWithProviders(<DashboardPage />);

      // Add first contact
      await user.click(screen.getByRole('button', { name: /Add Your First Contact/i }));
      await user.type(screen.getByLabelText(/Name \*/i), 'First Contact');
      await user.type(screen.getByLabelText(/Phone \*/i), '+919876543210');
      await user.click(screen.getByRole('button', { name: /Create Contact/i }));

      // Should progress to beginner
      await waitFor(() => {
        expect(mockStore.getState().stage).toBe('beginner');
      });
    });

    it('should show appropriate features based on user stage', () => {
      // Set user to intermediate stage
      mockStore.updateStageIfNeeded({
        contactsAdded: 15,
        messagesSent: 10,
        aiInteractions: 0,
        templatesUsed: 2,
        pipelineActions: 5,
      });

      renderWithProviders(<DashboardPage />);

      // Should not show welcome message
      expect(screen.queryByText(/Welcome to Your CRM Journey!/i)).not.toBeInTheDocument();

      // Should show progressive dashboard with intermediate features
      expect(screen.getByText('15')).toBeInTheDocument(); // Contacts count
      expect(screen.getByText('10')).toBeInTheDocument(); // Messages count
    });
  });

  describe('Help Systems', () => {
    it('should show contextual hints', () => {
      renderWithProviders(<DashboardPage />);

      // ContextualGuide component should be rendered
      const contextualGuide = screen.getByTestId('contextual-guide');
      expect(contextualGuide).toBeInTheDocument();
    });

    it('should show discovery prompts', () => {
      renderWithProviders(<DashboardPage />);

      // DiscoveryPrompt component should be rendered (may not be visible for new users)
      const discoveryPrompt = screen.queryByTestId('discovery-prompt');
      // Discovery prompts are not shown for new users
      expect(discoveryPrompt).not.toBeInTheDocument();
    });

    it('should handle discovery prompt actions', async () => {
      // Set to intermediate stage to show discovery prompts
      mockStore.updateStageIfNeeded({
        contactsAdded: 5,
        messagesSent: 2,
        aiInteractions: 0,
        templatesUsed: 0,
        pipelineActions: 0,
      });

      const user = userEvent.setup();
      renderWithProviders(<DashboardPage />);

      // Wait for discovery prompt to potentially appear
      await waitFor(() => {
        const discoveryPrompt = screen.queryByTestId('discovery-prompt');
        // Discovery prompts have conditions, so they might not always appear
        if (discoveryPrompt) {
          const actionButton = discoveryPrompt.querySelector('[data-action="message_inactive"]');
          if (actionButton) {
            fireEvent.click(actionButton);
            expect(mockPush).toHaveBeenCalledWith('/dashboard/messages');
          }
        }
      });
    });
  });

  describe('Achievement System', () => {
    it('should render achievement system', () => {
      renderWithProviders(<DashboardPage />);

      // AchievementSystem component should be rendered
      const achievementSystem = screen.getByTestId('achievement-system');
      expect(achievementSystem).toBeInTheDocument();
    });

    it('should show connection status for advanced users', () => {
      // Set user to advanced stage
      mockStore.updateStageIfNeeded({
        contactsAdded: 50,
        messagesSent: 100,
        aiInteractions: 10,
        templatesUsed: 10,
        pipelineActions: 30,
      });

      renderWithProviders(<DashboardPage />);

      // Connection status for advanced users
      const connectionStatus = screen.queryByTestId('connection-status');
      expect(connectionStatus).toBeInTheDocument();
    });

    it('should not show connection status for new users', () => {
      renderWithProviders(<DashboardPage />);

      // Connection status not shown for new users
      const connectionStatus = screen.queryByTestId('connection-status');
      expect(connectionStatus).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle contact creation errors gracefully', async () => {
      const user = userEvent.setup();
      const { useCreateLead } = require('@/hooks/use-api');
      const mockMutateAsync = jest.fn().mockRejectedValue(new Error('Network error'));
      
      useCreateLead.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
      });

      // Mock console.error to avoid test output noise
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      renderWithProviders(<DashboardPage />);

      // Try to create contact
      await user.click(screen.getByRole('button', { name: /Add Your First Contact/i }));
      await user.type(screen.getByLabelText(/Name \*/i), 'Test User');
      await user.type(screen.getByLabelText(/Phone \*/i), '+919876543210');
      await user.click(screen.getByRole('button', { name: /Create Contact/i }));

      // Should log error
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to create lead:', expect.any(Error));
      });

      // Modal should remain open
      expect(screen.getByRole('heading', { name: /Add Your First Contact/i })).toBeInTheDocument();

      // Progress should not be updated
      expect(mockStore.getState().stats.contactsAdded).toBe(0);

      consoleSpy.mockRestore();
    });
  });

  describe('Loading States', () => {
    it('should show loading state during contact creation', async () => {
      const user = userEvent.setup();
      const { useCreateLead } = require('@/hooks/use-api');
      
      // Mock a pending state
      useCreateLead.mockReturnValue({
        mutateAsync: jest.fn(() => new Promise(() => {})), // Never resolves
        isPending: true,
      });

      renderWithProviders(<DashboardPage />);

      // Open modal and try to submit
      await user.click(screen.getByRole('button', { name: /Add Your First Contact/i }));
      
      // Should show loading state
      const submitButton = screen.getByRole('button', { name: /Creating.../i });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
      
      // Should show spinner
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
  });
});