'use client';

import React, { useEffect, useState } from 'react';
import { Sparkles, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface FeatureRevealProps {
  isVisible: boolean;
  onComplete?: () => void;
  onExplore?: () => void;
  feature: {
    name: string;
    description: string;
    icon: React.ComponentType<any>;
    benefits: string[];
    stage: string;
    color: string;
  };
}

export function FeatureReveal({ isVisible, onComplete, onExplore, feature }: FeatureRevealProps) {
  const [step, setStep] = useState(0);
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    if (isVisible && !hasShown) {
      setHasShown(true);
      const timers = [
        setTimeout(() => setStep(1), 800),
        setTimeout(() => setStep(2), 1200),
        setTimeout(() => setStep(3), 1600),
        setTimeout(() => setStep(4), 2000),
      ];

      setTimeout(() => {
        if (onComplete) {
          onComplete();
        }
      }, 3000);

      return () => timers.forEach(clearTimeout);
    }
  }, [isVisible, hasShown, onComplete]);

  if (!isVisible) return null;

  const IconComponent = feature.icon;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="relative max-w-md w-full animate-in zoom-in-95 duration-300">
        <Card className="border-0 shadow-2xl overflow-hidden">
          <CardContent className="p-0">
            {/* Header with background */}
            <div className={`relative p-6 bg-gradient-to-br ${feature.color} text-white overflow-hidden`}>
              {/* Animated particles effect using CSS */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="animate-pulse absolute inset-0 opacity-20">
                  <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full blur-3xl"></div>
                  <div className="absolute bottom-0 right-0 w-48 h-48 bg-white rounded-full blur-3xl"></div>
                </div>
              </div>
              
              <div className="relative z-10 text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm animate-in spin-in-180 zoom-in-50 duration-500">
                  <IconComponent className="w-8 h-8 text-white" />
                </div>
                
                <div className="animate-in slide-in-from-bottom-4 duration-500">
                  <Badge className="bg-white/20 text-white border-white/30 mb-3">
                    New Feature Unlocked!
                  </Badge>
                  <h2 className="text-xl font-bold mb-2">{feature.name}</h2>
                  <p className="text-white/90 text-sm">{feature.description}</p>
                </div>
              </div>
            </div>

            {/* Content area */}
            <div className="p-6">
              <div className={`transition-all duration-500 ${step >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-500" />
                  What you can do now:
                </h3>
                
                <ul className="space-y-2 mb-6">
                  {feature.benefits.map((benefit, index) => (
                    <li
                      key={index}
                      className={`flex items-start gap-2 transition-all duration-300 ${
                        step >= 2 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                      }`}
                      style={{ transitionDelay: `${index * 100 + 200}ms` }}
                    >
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA Buttons */}
              <div className={`flex gap-3 transition-all duration-500 ${step >= 3 ? 'opacity-100' : 'opacity-0'}`}>
                <Button onClick={onExplore} className="flex-1">
                  Explore Now
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button variant="outline" onClick={onComplete}>
                  Got it
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Celebration effect */}
        {step >= 4 && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 animate-ping">
              <Sparkles className="w-6 h-6 text-yellow-400" />
            </div>
            <div className="absolute top-3/4 right-1/4 animate-ping animation-delay-200">
              <Sparkles className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="absolute bottom-1/4 left-1/3 animate-ping animation-delay-400">
              <Sparkles className="w-5 h-5 text-yellow-400" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}