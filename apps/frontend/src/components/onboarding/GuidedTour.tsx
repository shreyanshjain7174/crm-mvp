'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Target,
  MousePointer,
  Eye
} from 'lucide-react';

export interface TourStep {
  id: string;
  target: string; // CSS selector
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: {
    text: string;
    onClick: () => void;
  };
  optional?: boolean;
}

interface GuidedTourProps {
  steps: TourStep[];
  isActive: boolean;
  onComplete: () => void;
  onSkip: () => void;
  tourId: string;
}

export function GuidedTour({ steps, isActive, onComplete, onSkip, tourId }: GuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const updateTooltipPosition = useCallback(() => {
    const step = steps[currentStep];
    if (!step) return;

    const targetElement = document.querySelector(step.target) as HTMLElement;
    if (!targetElement) return;

    const rect = targetElement.getBoundingClientRect();
    const tooltipRect = tooltipRef.current?.getBoundingClientRect();
    
    if (!tooltipRect) return;

    let x = 0;
    let y = 0;

    switch (step.position) {
      case 'top':
        x = rect.left + rect.width / 2 - tooltipRect.width / 2;
        y = rect.top - tooltipRect.height - 12;
        break;
      case 'bottom':
        x = rect.left + rect.width / 2 - tooltipRect.width / 2;
        y = rect.bottom + 12;
        break;
      case 'left':
        x = rect.left - tooltipRect.width - 12;
        y = rect.top + rect.height / 2 - tooltipRect.height / 2;
        break;
      case 'right':
        x = rect.right + 12;
        y = rect.top + rect.height / 2 - tooltipRect.height / 2;
        break;
      case 'center':
        x = window.innerWidth / 2 - tooltipRect.width / 2;
        y = window.innerHeight / 2 - tooltipRect.height / 2;
        break;
    }

    // Ensure tooltip stays within viewport
    x = Math.max(12, Math.min(x, window.innerWidth - tooltipRect.width - 12));
    y = Math.max(12, Math.min(y, window.innerHeight - tooltipRect.height - 12));

    setTooltipPosition({ x, y });
  }, [steps, currentStep]);

  useEffect(() => {
    if (isActive) {
      setIsVisible(true);
      updateTooltipPosition();
      document.body.style.overflow = 'hidden';
    } else {
      setIsVisible(false);
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isActive, currentStep, updateTooltipPosition]);

  const highlightElement = (selector: string) => {
    // Remove previous highlights
    document.querySelectorAll('.tour-highlight').forEach(el => {
      el.classList.remove('tour-highlight');
    });

    // Add highlight to current target
    const element = document.querySelector(selector);
    if (element) {
      element.classList.add('tour-highlight');
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipTour = () => {
    cleanup();
    onSkip();
  };

  const completeTour = () => {
    cleanup();
    onComplete();
  };

  const cleanup = () => {
    document.querySelectorAll('.tour-highlight').forEach(el => {
      el.classList.remove('tour-highlight');
    });
    setIsVisible(false);
  };

  useEffect(() => {
    if (isVisible && steps[currentStep]) {
      highlightElement(steps[currentStep].target);
      setTimeout(updateTooltipPosition, 100);
    }
  }, [currentStep, isVisible, steps, updateTooltipPosition]);

  useEffect(() => {
    const handleResize = () => {
      if (isVisible) {
        updateTooltipPosition();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isVisible, currentStep, updateTooltipPosition]);

  if (!isVisible || !steps[currentStep]) {
    return null;
  }

  const step = steps[currentStep];

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        style={{ pointerEvents: 'none' }}
      />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-[60] max-w-sm"
        style={{
          left: tooltipPosition.x,
          top: tooltipPosition.y,
          pointerEvents: 'auto'
        }}
      >
        <Card className="shadow-lg border-primary/20 bg-background/95 backdrop-blur-sm">
          <CardContent className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                  <Target className="w-3 h-3 text-primary" />
                </div>
                <Badge variant="secondary" className="text-xs">
                  {currentStep + 1} of {steps.length}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={skipTour}
                className="h-6 w-6 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {step.content}
              </p>

              {/* Action Button */}
              {step.action && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={step.action.onClick}
                  className="w-full"
                >
                  <MousePointer className="w-3 h-3 mr-2" />
                  {step.action.text}
                </Button>
              )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={prevStep}
                disabled={currentStep === 0}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="w-3 h-3" />
                Previous
              </Button>

              <div className="flex gap-1">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentStep
                        ? 'bg-primary'
                        : index < currentStep
                        ? 'bg-primary/30'
                        : 'bg-muted'
                    }`}
                  />
                ))}
              </div>

              <Button
                size="sm"
                onClick={nextStep}
                className="flex items-center gap-1"
              >
                {currentStep === steps.length - 1 ? 'Complete' : 'Next'}
                {currentStep < steps.length - 1 && <ChevronRight className="w-3 h-3" />}
              </Button>
            </div>

            {/* Skip Option */}
            {step.optional && (
              <div className="mt-2 text-center">
                <button
                  onClick={skipTour}
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                >
                  Skip this tour
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pointer Arrow */}
        {step.position !== 'center' && (
          <div
            className={`absolute w-3 h-3 bg-background border-l border-t border-primary/20 transform rotate-45 ${
              step.position === 'top'
                ? 'bottom-[-6px] left-1/2 -translate-x-1/2'
                : step.position === 'bottom'
                ? 'top-[-6px] left-1/2 -translate-x-1/2'
                : step.position === 'left'
                ? 'right-[-6px] top-1/2 -translate-y-1/2'
                : 'left-[-6px] top-1/2 -translate-y-1/2'
            }`}
          />
        )}
      </div>

      {/* Global Styles */}
      <style jsx global>{`
        .tour-highlight {
          position: relative;
          z-index: 51;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 0 8px rgba(59, 130, 246, 0.2);
          border-radius: 8px;
          transition: all 0.3s ease;
        }
      `}</style>
    </>
  );
}

// Predefined tour configurations
export const dashboardTour: TourStep[] = [
  {
    id: 'welcome',
    target: 'body',
    title: 'Welcome to Your CRM Dashboard!',
    content: 'This tour will help you get familiar with your new CRM system. Let\'s start by exploring the main features.',
    position: 'center'
  },
  {
    id: 'navigation',
    target: 'nav[role="navigation"], .sidebar, [data-tour="navigation"]',
    title: 'Navigation Menu',
    content: 'Use this sidebar to navigate between different sections like Contacts, Messages, Leads, and more.',
    position: 'right'
  },
  {
    id: 'stats',
    target: '[data-tour="dashboard-stats"], .dashboard-stats',
    title: 'Your Statistics',
    content: 'Here you can see an overview of your CRM performance - total contacts, messages sent, and conversion rates.',
    position: 'bottom'
  },
  {
    id: 'add-contact',
    target: '[data-tour="add-contact"], button[aria-label*="contact"]',
    title: 'Add Your First Contact',
    content: 'Click here to add your first contact. This will unlock more features as you build your network.',
    position: 'bottom',
    action: {
      text: 'Add Contact Now',
      onClick: () => window.location.href = '/contacts'
    }
  },
  {
    id: 'progress',
    target: '[data-tour="progress"], .onboarding-progress',
    title: 'Track Your Progress',
    content: 'This section shows your onboarding progress and suggests next steps to unlock new features.',
    position: 'top'
  }
];

export const contactsTour: TourStep[] = [
  {
    id: 'contacts-list',
    target: '[data-tour="contacts-list"], .contacts-table',
    title: 'Your Contacts',
    content: 'This is where all your contacts are displayed. You can search, filter, and manage them from here.',
    position: 'top'
  },
  {
    id: 'search-filter',
    target: '[data-tour="search"], input[placeholder*="search"]',
    title: 'Search & Filter',
    content: 'Use the search bar to quickly find specific contacts, or use filters to organize by status or source.',
    position: 'bottom'
  },
  {
    id: 'contact-actions',
    target: '[data-tour="contact-actions"], .contact-row button',
    title: 'Contact Actions',
    content: 'Click on any contact to view details, send messages, or update their information.',
    position: 'left'
  }
];

export const messagesTour: TourStep[] = [
  {
    id: 'conversations',
    target: '[data-tour="conversations"], .conversations-list',
    title: 'Your Conversations',
    content: 'All your WhatsApp conversations are listed here. Click on any conversation to view and reply to messages.',
    position: 'right'
  },
  {
    id: 'send-message',
    target: '[data-tour="send-message"], .message-input',
    title: 'Send Messages',
    content: 'Type your message here and send it directly to your contacts via WhatsApp.',
    position: 'top'
  },
  {
    id: 'templates',
    target: '[data-tour="templates"], button[aria-label*="template"]',
    title: 'Message Templates',
    content: 'Save time by creating reusable message templates for common responses.',
    position: 'bottom'
  }
];

// Hook to manage tours
export function useTour() {
  const [activeTour, setActiveTour] = useState<string | null>(null);
  const [completedTours, setCompletedTours] = useState<string[]>([]);

  useEffect(() => {
    const completed = localStorage.getItem('completed-tours');
    if (completed) {
      setCompletedTours(JSON.parse(completed));
    }
  }, []);

  const startTour = (tourId: string) => {
    if (!completedTours.includes(tourId)) {
      setActiveTour(tourId);
    }
  };

  const completeTour = (tourId: string) => {
    setActiveTour(null);
    const newCompleted = [...completedTours, tourId];
    setCompletedTours(newCompleted);
    localStorage.setItem('completed-tours', JSON.stringify(newCompleted));
  };

  const skipTour = () => {
    setActiveTour(null);
  };

  const resetTours = () => {
    setCompletedTours([]);
    localStorage.removeItem('completed-tours');
  };

  return {
    activeTour,
    completedTours,
    startTour,
    completeTour,
    skipTour,
    resetTours,
    hasTourCompleted: (tourId: string) => completedTours.includes(tourId)
  };
}