# Dark Mode Text Visibility Fix Guide

## Problem
Text colors are hardcoded (e.g., `text-gray-600`, `text-gray-900`) and don't adapt to dark/light themes, causing visibility issues in dark mode.

## Solution Overview
Use theme-aware CSS classes that automatically adapt between light and dark themes.

## Quick Fix Reference

### Import the utilities
```typescript
import { themeText, statusColors, cn } from '@/utils/theme-colors';
```

### Common Replacements

| ❌ Hardcoded (Don't Use) | ✅ Theme-Aware (Use This) |
|-------------------------|---------------------------|
| `text-gray-900` | `themeText.primary` |
| `text-gray-800` | `themeText.primary` |
| `text-gray-700` | `themeText.primary` |
| `text-gray-600` | `themeText.secondary` |
| `text-gray-500` | `themeText.muted` |
| `text-gray-400` | `themeText.subtle` |
| `bg-gray-200` | `bg-muted` |
| `bg-gray-100` | `bg-muted/50` |
| `text-green-600` | `statusColors.success.text` |
| `text-red-600` | `statusColors.error.text` |
| `text-yellow-600` | `statusColors.warning.text` |
| `text-blue-600` | `statusColors.info.text` |
| `bg-green-100` | `statusColors.success.bg` |
| `bg-red-100` | `statusColors.error.bg` |

### Usage Examples

#### Before (❌ Hardcoded)
```tsx
<h1 className="text-2xl font-bold text-gray-900">Title</h1>
<p className="text-sm text-gray-600">Description</p>
<span className="text-green-600">Success message</span>
<div className="bg-gray-200 p-4">Card background</div>
```

#### After (✅ Theme-Aware)
```tsx
<h1 className={cn("text-2xl font-bold", themeText.primary)}>Title</h1>
<p className={cn("text-sm", themeText.secondary)}>Description</p>
<span className={statusColors.success.text}>Success message</span>
<div className="bg-muted p-4">Card background</div>
```

## Step-by-Step Migration

### 1. Add Import to Component
```typescript
import { themeText, statusColors, cn } from '@/utils/theme-colors';
```

### 2. Replace Text Colors
- **Primary text** (headings, important content): `themeText.primary`
- **Secondary text** (labels, descriptions): `themeText.secondary` 
- **Muted text** (less important): `themeText.muted`
- **Subtle text** (very minor): `themeText.subtle`

### 3. Replace Status Colors
- **Success**: `statusColors.success.text` & `statusColors.success.bg`
- **Error**: `statusColors.error.text` & `statusColors.error.bg`
- **Warning**: `statusColors.warning.text` & `statusColors.warning.bg`
- **Info**: `statusColors.info.text` & `statusColors.info.bg`

### 4. Replace Background Colors
- **Gray backgrounds**: `bg-muted` or `bg-muted/50`
- **Card backgrounds**: Already handled by shadcn/ui components

### 5. Use cn() Helper
Combine classes using the `cn()` helper:
```tsx
// Instead of string concatenation
className={`text-sm font-medium ${themeText.secondary}`}

// Use cn() helper
className={cn("text-sm font-medium", themeText.secondary)}
```

## Files That Need Updates

Run this command to find files with hardcoded colors:
```bash
# Find gray text colors
grep -r "text-gray-[0-9]" apps/frontend/src/

# Find gray backgrounds  
grep -r "bg-gray-[0-9]" apps/frontend/src/

# Find status colors
grep -r "text-\(green\|red\|yellow\|blue\)-[0-9]" apps/frontend/src/
```

### Priority Files (High Impact)
1. `/components/dashboard/ModernDashboard.tsx` ✅ **FIXED**
2. `/components/dashboard/dashboard-stats.tsx` ✅ **FIXED**
3. `/app/dashboard/page.tsx`
4. `/components/ui/` components
5. All page components in `/app/dashboard/`

## Testing Your Changes

### Manual Testing
1. Switch to light mode - verify text is readable
2. Switch to dark mode - verify text is readable
3. Check all interactive states (hover, focus, active)

### Automated Check
```bash
# Verify no hardcoded grays remain (should return nothing)
grep -r "text-gray-[0-9]\|bg-gray-[1-3][0-9][0-9]" apps/frontend/src/components/ apps/frontend/src/app/
```

## Advanced Usage

### Custom Status Colors
```tsx
// For special cases not covered by standard status colors
const customColors = {
  premium: "text-purple-600 dark:text-purple-400",
  archived: "text-gray-500 dark:text-gray-400",
};
```

### Interactive States
```tsx
// Combine with hover/focus states
className={cn(
  "px-4 py-2",
  themeText.primary,
  "hover:bg-muted/50",
  "focus:ring-2 focus:ring-ring"
)}
```

## Migration Progress Tracker

- [x] Create theme utilities (`/utils/theme-colors.ts`)
- [x] Fix `ModernDashboard.tsx`
- [x] Fix `dashboard-stats.tsx`
- [ ] Fix remaining dashboard components
- [ ] Fix UI components
- [ ] Fix page components
- [ ] Test all components in both themes
- [ ] Remove old hardcoded colors

## Troubleshooting

### Common Issues
1. **Text still not visible**: Make sure you imported the utilities correctly
2. **Colors look wrong**: Check if you're using the right semantic token (primary vs secondary vs muted)
3. **Build errors**: Ensure `cn()` is imported where used

### Debugging
```tsx
// Temporarily add debug classes to see current theme
<div className="debug border-2 border-red-500">
  <span className={themeText.primary}>Should be visible in both themes</span>
</div>
```

## Next Steps

After completing this migration:
1. Update design system documentation
2. Add ESLint rules to prevent hardcoded colors
3. Create Storybook stories showing components in both themes
4. Consider automated theme testing in CI/CD