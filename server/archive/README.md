# Archive Directory

This directory contains legacy and unused code that has been moved from the main codebase for safe keeping.

## Archive Date
October 22, 2025

## Contents

### `/test-files/`
Test files and development scripts that are no longer needed in the main codebase:
- test-*.js files
- load-test.js
- INTEGRATION_EXAMPLE.js
- test-production-email.js
- test-redis-volume.js

### `/unused-routing/`
The entire routing system that was built but never integrated into the main application:
- src/routing/ directory (complete system)

### `/unused-workers/`
Standalone worker processes that are no longer used with the current SendGrid webhook architecture:
- src/workers/ directory

### `/frontend-files/`
React and frontend development files not needed for email processing backend:
- react-server.js - React development server (4.9KB)
- postcss.config.js - PostCSS configuration for CSS processing
- tailwind.config.js - Tailwind CSS configuration (1.7KB)
- tsconfig.json - TypeScript configuration (605 bytes)
- tsconfig.node.json - TypeScript Node configuration (213 bytes)

### `/parent-test-files/`
Test files from parent directory not needed in production:
- test-chat-direct.mjs - Direct chat testing (2.9KB)
- test-chat-tools.js - Chat tools testing (2.2KB)
- test-semantic-search.js - Semantic search testing (3.7KB)
- test-tools-only.mjs - Tools-only testing (3.2KB)
- temp_check.js - Temporary testing file (66 bytes)

### `/alternative-servers/`
Alternative server implementations replaced by main email processing server:
- quick-server.js - Quick development server (150KB)
- server.js - Basic server implementation (982 bytes)
- simple-server.js - Simple server alternative (4.3KB)

### `/legacy-files/`
Other legacy files and commented code that was removed

## Safety Notes
- All files are preserved exactly as they were
- Can be restored by moving back to original locations
- Git history is preserved for all tracked files
- Test thoroughly before permanently deleting any archive contents

## Restoration Instructions
If any functionality is needed, files can be restored by:
1. Moving files back to their original locations
2. Updating imports/dependencies as needed
3. Testing functionality

## Analysis Source
Files were identified for archival based on comprehensive codebase analysis that found:
- Unused imports/requires
- Dead code paths
- Legacy functionality replaced by newer implementations
- Test-only code not needed in production