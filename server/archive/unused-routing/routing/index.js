/**
 * HomeOps Hybrid Routing System
 *
 * Clean modular exports for the hybrid tool routing architecture.
 * Combines direct routing with AI-enhanced selection for optimal results.
 */

// Main routing functions
export { selectToolsForQuery, hybridToolSelection } from './orchestration/hybridRouter.js';

// Result aggregation for comprehensive coverage
export {
  executeToolsWithGuarantee,
  createComprehensivePrompt,
  validateResponseCoverage
} from './orchestration/resultAggregator.js';

// Direct routing rules
export { checkDirectRoutes, getRoutingInfo } from './rules/directRoutes.js';

// Individual pattern calculators (for debugging/testing)
export { calculateEmailScores } from './patterns/emailPatterns.js';
export { calculateCalendarScore } from './patterns/calendarPatterns.js';
export { calculateFamilyActivityScore } from './patterns/familyActivityPatterns.js';
export { calculateAgentMemoryScore } from './patterns/agentMemoryPatterns.js';

/**
 * Routing System Architecture Summary:
 *
 * 1. DIRECT ROUTES (/rules/directRoutes.js)
 *    - High-confidence keyword and pattern matches
 *    - Immediate tool selection for predictable queries
 *    - "everything from everywhere" for schedule queries
 *
 * 2. AI-ENHANCED PATTERNS (/patterns/*.js)
 *    - Tool-specific pattern libraries
 *    - Confidence scoring system
 *    - Fallback for ambiguous queries
 *
 * 3. ORCHESTRATION (/orchestration/*.js)
 *    - hybridRouter: Main routing logic
 *    - resultAggregator: Comprehensive result inclusion
 *    - Guaranteed tool execution and response validation
 *
 * Usage:
 *   import { selectToolsForQuery } from './routing/index.js';
 *   const tools = selectToolsForQuery('what\'s going on this week?');
 *   // Returns: ['calendar', 'family_activities']
 */