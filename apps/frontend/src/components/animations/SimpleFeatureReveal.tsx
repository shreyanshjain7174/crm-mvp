'use client';

import React from 'react';
import { Sparkles, CheckCircle, ArrowRight, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SimpleFeatureRevealProps {
  featureName: string;
  description: string;
  onContinue: () => void;
  onExplore?: () => void;
}

export function SimpleFeatureReveal({ 
  featureName, 
  description, 
  onContinue, 
  onExplore 
}: SimpleFeatureRevealProps) {
  const benefits = [
    'Drag and drop leads between stages',
    'Visual sales pipeline overview',
    'Track conversion rates and metrics',
    'Organize leads by priority and status'
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="relative max-w-md w-full animate-in zoom-in-95 duration-300">
        <Card className="border-0 shadow-2xl overflow-hidden">
          <CardContent className="p-0">
            {/* Header with background */}
            <div className="relative p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white overflow-hidden">
              {/* Animated particles effect */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="animate-pulse absolute inset-0 opacity-20">
                  <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full blur-3xl"></div>
                  <div className="absolute bottom-0 right-0 w-48 h-48 bg-white rounded-full blur-3xl"></div>
                </div>
              </div>
              
              <div className="relative z-10 text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm animate-in spin-in-180 zoom-in-50 duration-500">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                
                <div className="animate-in slide-in-from-bottom-4 duration-500">
                  <Badge className="bg-white/20 text-white border-white/30 mb-3">
                    New Feature Unlocked!
                  </Badge>
                  <h2 className="text-xl font-bold mb-2">{featureName}</h2>
                  <p className="text-white/90 text-sm">{description}</p>
                </div>
              </div>
            </div>

            {/* Content area */}
            <div className="p-6">
              <div className="animate-in fade-in-50 duration-700 delay-300">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-500" />
                  What you can do now:
                </h3>
                
                <ul className="space-y-2 mb-6">
                  {benefits.map((benefit, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 animate-in slide-in-from-left-4 duration-300"
                      style={{ animationDelay: `${index * 100 + 500}ms` }}
                    >
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA Buttons */}
              <div className="flex gap-3 animate-in fade-in duration-300 delay-700">
                {onExplore && (
                  <Button onClick={onExplore} className="flex-1">
                    Explore Now
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
                <Button 
                  variant={onExplore ? "outline" : "default"} 
                  onClick={onContinue}
                  className={onExplore ? "" : "flex-1"}
                >
                  Continue
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Celebration sparkles */}
        <div className="absolute inset-0 pointer-events-none animate-in fade-in duration-700 delay-1000">
          <div className="absolute top-1/4 left-1/4 animate-ping">
            <Sparkles className="w-6 h-6 text-yellow-400" />
          </div>
          <div className="absolute top-3/4 right-1/4 animate-ping" style={{ animationDelay: '200ms' }}>
            <Sparkles className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="absolute bottom-1/4 left-1/3 animate-ping" style={{ animationDelay: '400ms' }}>
            <Sparkles className="w-5 h-5 text-yellow-400" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default SimpleFeatureReveal;