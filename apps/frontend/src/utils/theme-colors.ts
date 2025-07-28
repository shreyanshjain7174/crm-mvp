/**
 * Theme-aware color utilities for consistent dark/light mode support
 * 
 * This file provides standardized CSS classes that automatically adapt
 * to light and dark themes using Tailwind's built-in color system.
 */

// Primary text colors that adapt to theme
export const themeText = {
  // Primary text (highest contrast)
  primary: "text-foreground",
  
  // Secondary text (medium contrast)
  secondary: "text-muted-foreground",
  
  // Muted text (lower contrast, for less important text)
  muted: "text-muted-foreground/70",
  
  // Subtle text (lowest contrast, for very minor text)
  subtle: "text-muted-foreground/50",
} as const;

// Background colors that adapt to theme
export const themeBg = {
  // Primary background
  primary: "bg-background",
  
  // Card/elevated background
  card: "bg-card",
  
  // Muted background (for subtle emphasis)
  muted: "bg-muted",
  
  // Secondary background
  secondary: "bg-secondary",
} as const;

// Status colors that work in both themes
export const statusColors = {
  success: {
    bg: "bg-green-100 dark:bg-green-900/20",
    text: "text-green-800 dark:text-green-300",
    border: "border-green-200 dark:border-green-800",
  },
  
  warning: {
    bg: "bg-yellow-100 dark:bg-yellow-900/20", 
    text: "text-yellow-800 dark:text-yellow-300",
    border: "border-yellow-200 dark:border-yellow-800",
  },
  
  error: {
    bg: "bg-red-100 dark:bg-red-900/20",
    text: "text-red-800 dark:text-red-300", 
    border: "border-red-200 dark:border-red-800",
  },
  
  info: {
    bg: "bg-blue-100 dark:bg-blue-900/20",
    text: "text-blue-800 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800",
  },
  
  neutral: {
    bg: "bg-gray-100 dark:bg-gray-800/50",
    text: "text-gray-800 dark:text-gray-300",
    border: "border-gray-200 dark:border-gray-700",
  },
} as const;

// Interactive element colors
export const interactiveColors = {
  // Hover states
  hover: {
    bg: "hover:bg-muted/50",
    text: "hover:text-foreground",
  },
  
  // Active/pressed states  
  active: {
    bg: "active:bg-muted",
    text: "active:text-foreground",
  },
  
  // Focus states
  focus: {
    ring: "focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
  },
} as const;

// Border colors that adapt to theme
export const themeBorders = {
  primary: "border-border",
  muted: "border-border/50",
  subtle: "border-border/20",
} as const;

// Utility function to combine theme classes
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// Quick access combinations for common patterns
export const themeClasses = {
  // Card styling
  card: cn(themeBg.card, themeText.primary, themeBorders.primary),
  
  // Heading text
  heading: cn(themeText.primary, "font-semibold"),
  
  // Body text
  body: cn(themeText.primary),
  
  // Secondary text
  secondary: cn(themeText.secondary),
  
  // Muted text (for labels, captions, etc.)
  muted: cn(themeText.muted),
  
  // Interactive item (buttons, links)
  interactive: cn(
    themeBg.card,
    themeText.primary, 
    interactiveColors.hover.bg,
    interactiveColors.hover.text,
    "transition-colors duration-200"
  ),
} as const;