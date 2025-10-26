# Old Onboarding Workflow - ARCHIVED

## Archive Date
October 22, 2025

## Description
This directory contains the original complex 5-step onboarding workflow that was replaced by the simplified 3-step onboarding flow.

## Archived Components

### Main Component
- `Onboarding.tsx` - The main complex onboarding component with 5 steps

### Step Components
- `WelcomeStep.tsx` - User info and family member collection
- `ConnectGmailStep.tsx` - Gmail connection with OAuth flow
- `FirstFetchStep.tsx` - Email analysis and processing
- `ResultsStep.tsx` - Display analysis results
- `ReviewStep.tsx` - Final review and completion
- `AgentPersonaStep.tsx` - AI agent personality configuration
- `CalibrationStep.tsx` - Email calibration and preferences
- `EmailPoliciesStep.tsx` - Email policy configuration
- `EmailProcessingStatus.tsx` - Email processing status display

## Why Archived
The complex 5-step onboarding was replaced with a streamlined 3-step flow (`SimplifiedOnboarding.tsx`) that provides a better user experience with:
- Faster completion time
- Optional context collection
- Immediate chat access
- Reduced complexity

## Restoration Instructions
If this workflow needs to be restored:
1. Move files back to `src/components/` and `src/components/onboarding/`
2. Update any import paths that may have changed
3. Test all step components and data flow
4. Ensure OAuth integrations still work

## Current Active Onboarding
The active onboarding flow is now `SimplifiedOnboarding.tsx` in `src/components/onboarding/`