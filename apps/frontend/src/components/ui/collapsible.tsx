'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface CollapsibleContextType {
  isOpen: boolean;
  toggle: () => void;
}

const CollapsibleContext = React.createContext<CollapsibleContextType | null>(null);

interface CollapsibleProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

const Collapsible: React.FC<CollapsibleProps> = ({ 
  open = false, 
  onOpenChange, 
  children 
}) => {
  const [isOpen, setIsOpen] = React.useState(open);

  React.useEffect(() => {
    setIsOpen(open);
  }, [open]);

  const toggle = React.useCallback(() => {
    const newState = !isOpen;
    setIsOpen(newState);
    onOpenChange?.(newState);
  }, [isOpen, onOpenChange]);

  const contextValue = React.useMemo(() => ({
    isOpen,
    toggle
  }), [isOpen, toggle]);

  return (
    <CollapsibleContext.Provider value={contextValue}>
      <div>
        {children}
      </div>
    </CollapsibleContext.Provider>
  );
};

interface CollapsibleTriggerProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
  children: React.ReactNode;
}

const CollapsibleTrigger = React.forwardRef<HTMLDivElement, CollapsibleTriggerProps>(
  ({ asChild = false, children, className, onClick, ...props }, ref) => {
    const context = React.useContext(CollapsibleContext);
    
    if (!context) {
      throw new Error('CollapsibleTrigger must be used within a Collapsible component');
    }

    const handleClick = React.useCallback((event: React.MouseEvent<HTMLDivElement>) => {
      context.toggle();
      onClick?.(event);
    }, [context, onClick]);

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as any, {
        onClick: handleClick,
        className: cn(className, (children as any).props.className),
        ...props,
      });
    }

    return (
      <div
        ref={ref}
        className={cn('cursor-pointer', className)}
        onClick={handleClick}
        {...props}
      >
        {children}
      </div>
    );
  }
);
CollapsibleTrigger.displayName = 'CollapsibleTrigger';

interface CollapsibleContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const CollapsibleContent = React.forwardRef<HTMLDivElement, CollapsibleContentProps>(
  ({ children, className, ...props }, ref) => {
    const context = React.useContext(CollapsibleContext);
    
    if (!context) {
      throw new Error('CollapsibleContent must be used within a Collapsible component');
    }

    return (
      <div
        ref={ref}
        className={cn(
          'overflow-hidden transition-all duration-200 ease-in-out',
          context.isOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0',
          className
        )}
        {...props}
      >
        <div className={context.isOpen ? 'pb-2' : ''}>
          {children}
        </div>
      </div>
    );
  }
);
CollapsibleContent.displayName = 'CollapsibleContent';

export { Collapsible, CollapsibleTrigger, CollapsibleContent };