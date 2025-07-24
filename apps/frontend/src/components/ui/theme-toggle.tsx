'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useEnhancedTheme } from '@/contexts/enhanced-theme-context';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ThemeToggleProps {
  variant?: 'default' | 'minimal' | 'floating';
  className?: string;
}

export function ThemeToggle({ variant = 'default', className = '' }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useEnhancedTheme();

  if (variant === 'minimal') {
    return (
      <motion.button
        className={`relative w-14 h-8 bg-gray-200 dark:bg-gray-700 rounded-full p-1 cursor-pointer transition-colors ${className}`}
        onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          className="w-6 h-6 bg-white dark:bg-gray-900 rounded-full shadow-lg flex items-center justify-center"
          animate={{
            x: resolvedTheme === 'dark' ? 24 : 0,
          }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
          <AnimatePresence mode="wait">
            {resolvedTheme === 'dark' ? (
              <motion.div
                key="moon"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Moon className="w-3 h-3 text-gray-700" />
              </motion.div>
            ) : (
              <motion.div
                key="sun"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Sun className="w-3 h-3 text-yellow-500" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.button>
    );
  }

  if (variant === 'floating') {
    return (
      <motion.div
        className={`fixed bottom-6 right-6 z-50 ${className}`}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        <motion.button
          className="w-14 h-14 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center"
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          whileHover={{ scale: 1.1, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
          whileTap={{ scale: 0.9 }}
        >
          <AnimatePresence mode="wait">
            {resolvedTheme === 'dark' ? (
              <motion.div
                key="moon"
                initial={{ rotate: -180, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 180, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Moon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              </motion.div>
            ) : (
              <motion.div
                key="sun"
                initial={{ rotate: -180, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 180, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Sun className="w-6 h-6 text-yellow-500" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </motion.div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className={`relative w-10 h-10 px-0 ${className}`}
        >
          <AnimatePresence mode="wait">
            {resolvedTheme === 'dark' ? (
              <motion.div
                key="moon"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Moon className="h-4 w-4" />
              </motion.div>
            ) : (
              <motion.div
                key="sun"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Sun className="h-4 w-4" />
              </motion.div>
            )}
          </AnimatePresence>
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-32">
        <DropdownMenuItem 
          onClick={() => setTheme('light')}
          className="cursor-pointer"
        >
          <Sun className="mr-2 h-4 w-4" />
          <span>Light</span>
          {theme === 'light' && (
            <motion.div
              layoutId="theme-indicator"
              className="ml-auto w-2 h-2 bg-blue-500 rounded-full"
            />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme('dark')}
          className="cursor-pointer"
        >
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark</span>
          {theme === 'dark' && (
            <motion.div
              layoutId="theme-indicator"
              className="ml-auto w-2 h-2 bg-blue-500 rounded-full"
            />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme('system')}
          className="cursor-pointer"
        >
          <Monitor className="mr-2 h-4 w-4" />
          <span>System</span>
          {theme === 'system' && (
            <motion.div
              layoutId="theme-indicator"
              className="ml-auto w-2 h-2 bg-blue-500 rounded-full"
            />
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}