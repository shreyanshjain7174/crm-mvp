'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChevronRight, Bug, Zap, RotateCcw, Unlock, Database } from 'lucide-react';
import { useUserProgressStore } from '@/stores/userProgress';

export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  const {
    stage,
    stats,
    unlockedFeatures,
    setStage,
    addTestData,
    unlockAllFeatures,
    resetProgress,
    checkStageProgression
  } = useUserProgressStore();

  // Only show in development or with debug flag
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' || 
        localStorage.getItem('debug') === 'true' ||
        window.location.search.includes('debug=true')) {
      setIsVisible(true);
    }
  }, []);

  if (!isVisible) return null;

  const stages = ['new', 'beginner', 'intermediate', 'advanced', 'expert'] as const;

  return (
    <>
      {/* Floating Debug Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 transition-colors"
        title="Debug Panel"
      >
        <Bug className="h-5 w-5" />
      </button>

      {/* Debug Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 w-96 max-h-[600px] overflow-y-auto">
          <Card className="shadow-xl border-purple-500 border-2 bg-white dark:bg-gray-800">
            <CardHeader className="bg-purple-50 dark:bg-purple-900/50">
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <Bug className="h-5 w-5" />
                Debug Panel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              {/* Current State */}
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Current State</h3>
                <div className="text-sm space-y-1 bg-gray-50 dark:bg-gray-700 p-3 rounded text-gray-900 dark:text-gray-100">
                  <p><strong>Stage:</strong> {stage}</p>
                  <p><strong>Features Unlocked:</strong> {unlockedFeatures.length}</p>
                  <p><strong>Contacts:</strong> {stats.contactsAdded}</p>
                  <p><strong>Messages:</strong> {stats.messagesSent}</p>
                  <p><strong>AI Interactions:</strong> {stats.aiInteractions}</p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      addTestData();
                      checkStageProgression();
                    }}
                    className="text-xs"
                  >
                    <Database className="h-3 w-3 mr-1" />
                    Add Test Data
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={unlockAllFeatures}
                    className="text-xs"
                  >
                    <Unlock className="h-3 w-3 mr-1" />
                    Unlock All
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={resetProgress}
                    className="text-xs"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Reset Progress
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.location.reload()}
                    className="text-xs"
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    Refresh Page
                  </Button>
                </div>
              </div>

              {/* Stage Selector */}
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Set Stage</h3>
                <div className="space-y-1">
                  {stages.map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant={stage === s ? "default" : "outline"}
                      onClick={() => setStage(s)}
                      className="w-full text-xs justify-start"
                    >
                      <ChevronRight className="h-3 w-3 mr-1" />
                      {s.charAt(0).toUpperCase() + s.slice(1)} Stage
                    </Button>
                  ))}
                </div>
              </div>

              {/* Console Commands */}
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Console Commands</h3>
                <div className="text-xs bg-gray-100 dark:bg-gray-700 p-3 rounded font-mono text-gray-900 dark:text-gray-100">
                  <p>unlockAllFeatures()</p>
                  <p>setUserStage(&quot;expert&quot;)</p>
                  <p>addTestData()</p>
                  <p>debugUserProgress()</p>
                  <p>resetUserProgress()</p>
                </div>
              </div>

              {/* Enable Debug Mode */}
              <div className="text-xs text-gray-500 dark:text-gray-400">
                <p>To enable debug panel permanently:</p>
                <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded text-gray-900 dark:text-gray-100">
                  localStorage.setItem(&apos;debug&apos;, &apos;true&apos;)
                </code>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}