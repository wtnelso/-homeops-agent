# Old HTML Files - ARCHIVED

## Archive Date
October 22, 2025

## Description
This directory contains legacy static HTML files that were replaced by the React-based onboarding system.

## Archived Files

### From public/ directory
- `onboard-old.html` - Static HTML onboarding page (9.5KB)
- `landing-old-verbose.html` - Verbose landing page version (27.7KB)
- `calibrate-backup-old.html` - Email calibration backup page (24.9KB)

### From dist/ directory
- `onboard-old.html` - Built static HTML onboarding page
- `landing-old-verbose.html` - Built verbose landing page version
- `calibrate-backup-old.html` - Built email calibration backup page

## Why Archived
These static HTML files were replaced by the modern React-based onboarding system with:
- Component-based architecture
- TypeScript support
- Better state management
- Integration with authentication system
- Dynamic data handling

## File History
- Original static HTML onboarding system
- Used before React component migration
- Contained embedded CSS and JavaScript
- Basic form handling and styling

## Restoration Instructions
If these files need to be restored:
1. Move files back to `public/` and `dist/` directories
2. Update any routing or links that reference these files
3. Test functionality with current authentication system
4. Consider modernizing to React components instead

## Current Active System
The active onboarding is now React-based with `SimplifiedOnboarding.tsx`