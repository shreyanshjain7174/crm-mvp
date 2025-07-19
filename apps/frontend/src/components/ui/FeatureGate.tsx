'use client';

import React from 'react';
import { useFeatureGuard } from '@/hooks/useFeatureGate';
import { FeatureKey } from '@/lib/constants/user-stages';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface FeatureGateProps {
  feature: FeatureKey;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showNewBadge?: boolean;
  className?: string;
  onFirstRender?: () => void;
}

export function FeatureGate({
  feature,
  children,
  fallback = null,
  showNewBadge = true,
  className,
  onFirstRender
}: FeatureGateProps) {
  const { canAccess, isNew, markAsSeen } = useFeatureGuard(feature);
  
  React.useEffect(() => {
    if (canAccess && isNew && onFirstRender) {
      onFirstRender();
    }
  }, [canAccess, isNew, onFirstRender]);
  
  if (!canAccess) {
    return <>{fallback}</>;
  }
  
  const handleClick = () => {
    if (isNew) {
      markAsSeen();
    }
  };
  
  return (
    <div className={cn('relative', className)} onClick={handleClick}>
      {children}
      {isNew && showNewBadge && (
        <Badge 
          variant="secondary" 
          className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-1 py-0.5 animate-pulse"
        >
          New
        </Badge>
      )}
    </div>
  );
}

interface FeatureWrapperProps {
  features: FeatureKey[];
  requireAll?: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function FeatureWrapper({
  features,
  requireAll = false,
  children,
  fallback = null
}: FeatureWrapperProps) {
  const featureResults = features.map(feature => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { canAccess } = useFeatureGuard(feature);
    return canAccess;
  });
  
  const hasAccess = requireAll 
    ? featureResults.every(Boolean)
    : featureResults.some(Boolean);
  
  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

interface ConditionalFeatureProps {
  feature: FeatureKey;
  children: (props: { isNew: boolean; markAsSeen: () => void }) => React.ReactNode;
  fallback?: React.ReactNode;
}

export function ConditionalFeature({
  feature,
  children,
  fallback = null
}: ConditionalFeatureProps) {
  const { canAccess, isNew, markAsSeen } = useFeatureGuard(feature);
  
  if (!canAccess) {
    return <>{fallback}</>;
  }
  
  return <>{children({ isNew, markAsSeen })}</>;
}

// Helper component for menu items
interface FeatureMenuItemProps {
  feature: FeatureKey;
  children: React.ReactNode;
  className?: string;
}

export function FeatureMenuItem({
  feature,
  children,
  className
}: FeatureMenuItemProps) {
  const { canAccess, isNew, markAsSeen } = useFeatureGuard(feature);
  
  if (!canAccess) {
    return null;
  }
  
  return (
    <div 
      className={cn('relative', className)}
      onClick={markAsSeen}
    >
      {children}
      {isNew && (
        <div className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
      )}
    </div>
  );
}