/**
 * Hybrid Router - Main Orchestration Layer
 *
 * Combines direct routing with AI-enhanced pattern matching for optimal tool selection.
 * Implements the "everything from everywhere" philosophy while maintaining AI intelligence.
 */

import { checkDirectRoutes, getRoutingInfo } from '../rules/directRoutes.js';
import { calculateEmailScores } from '../patterns/emailPatterns.js';
import { calculateCalendarScore } from '../patterns/calendarPatterns.js';
import { calculateFamilyActivityScore } from '../patterns/familyActivityPatterns.js';
import { calculateAgentMemoryScore } from '../patterns/agentMemoryPatterns.js';
import { TOOLS_CONFIG } from '../../config/chatConfig.js';

/**
 * Main hybrid routing function
 * @param {string} query - User query
 * @param {object} userContext - Additional user context
 * @returns {object} Routing result with tools and metadata
 */
export function hybridToolSelection(query = '', userContext = {}) {
  if (!query) {
    // No query provided - let AI decide with all tools available
    return {
      method: 'ai_fallback',
      tools: Object.keys(TOOLS_CONFIG).filter(key => TOOLS_CONFIG[key].enabled),
      confidence: 0.3,
      reasoning: 'No query provided, letting AI choose from all available tools'
    };
  }

  const normalizedQuery = query.toLowerCase();

  // PHASE 1: Check Direct Routes (High Confidence)
  const directTools = checkDirectRoutes(normalizedQuery);
  if (directTools.length > 0) {
    const routingInfo = getRoutingInfo(normalizedQuery);
    console.log(`🎯 DIRECT ROUTE: "${query.substring(0, 50)}..." → [${directTools.join(', ')}] (${routingInfo.method})`);

    return {
      method: routingInfo.method,
      tools: directTools,
      confidence: 1.0,
      reasoning: `Direct match: ${routingInfo.matched_key || routingInfo.matched_pattern}`
    };
  }

  console.log(`🤖 AI-ENHANCED ROUTING: "${query.substring(0, 50)}..." (no direct route match)`);

  // PHASE 2: AI-Enhanced Pattern Scoring
  return aiEnhancedSelection(normalizedQuery, userContext);
}

/**
 * AI-Enhanced tool selection using pattern scoring
 * @param {string} normalizedQuery - Lowercased query
 * @param {object} userContext - User context
 * @returns {object} Routing result
 */
function aiEnhancedSelection(normalizedQuery, userContext = {}) {
  const toolScores = {};
  let selectionReasoning = [];

  // Email tools scoring
  const { scores: emailScores, isEmailQuery } = calculateEmailScores(normalizedQuery);
  Object.assign(toolScores, emailScores);
  if (isEmailQuery) {
    selectionReasoning.push('Email query detected');
  }

  // Calendar tool scoring
  const calendarScore = calculateCalendarScore(normalizedQuery);
  if (calendarScore > 0) {
    toolScores.calendar = calendarScore;
    selectionReasoning.push(`Calendar patterns matched (${calendarScore.toFixed(2)})`);
  }

  // Family activities tool scoring
  const familyActivityScore = calculateFamilyActivityScore(normalizedQuery);
  if (familyActivityScore > 0) {
    toolScores.family_activities = familyActivityScore;
    selectionReasoning.push(`Family activity patterns matched (${familyActivityScore.toFixed(2)})`);
  }

  // Agent memory tool scoring
  const agentMemoryScore = calculateAgentMemoryScore(normalizedQuery, isEmailQuery);
  if (agentMemoryScore > 0) {
    toolScores.agent_memory = agentMemoryScore;
    selectionReasoning.push(`Memory patterns matched (${agentMemoryScore.toFixed(2)})`);
  }

  // General search scoring
  addGeneralSearchScores(normalizedQuery, toolScores, selectionReasoning);

  // Convert scores to selected tools (threshold: 0.5)
  console.log(`🎯 All tool scores:`, toolScores);
  let selectedTools = Object.entries(toolScores)
    .filter(([tool, score]) => score >= 0.5)
    .map(([tool, score]) => tool);

  console.log(`🎯 Tools above threshold (≥0.5): [${selectedTools.join(', ')}]`);

  // Apply safety fallbacks
  const fallbackResult = applySafetyFallbacks(selectedTools, toolScores, selectionReasoning);
  selectedTools = fallbackResult.tools;
  selectionReasoning.push(...fallbackResult.reasoning);

  return {
    method: 'ai_enhanced',
    tools: selectedTools,
    confidence: 0.8,
    reasoning: selectionReasoning.join('; '),
    scores: toolScores
  };
}

/**
 * Add general search pattern scores
 * @param {string} normalizedQuery - Query to analyze
 * @param {object} toolScores - Scores object to modify
 * @param {string[]} selectionReasoning - Reasoning array to modify
 */
function addGeneralSearchScores(normalizedQuery, toolScores, selectionReasoning) {
  const searchPatterns = [
    { pattern: /\b(find|search|look for|looking for|locate|discover)\b/, score: 0.6 },
    { pattern: /\b(show me|tell me|what|where|how|why)\b/, score: 0.5 },
    { pattern: /\b(list|display|get|fetch|retrieve|pull up)\b/, score: 0.5 }
  ];

  searchPatterns.forEach(({ pattern, score }) => {
    if (pattern.test(normalizedQuery)) {
      // Boost semantic search for general search queries
      toolScores.semantic_search = Math.max(toolScores.semantic_search || 0, score);
      toolScores.gmail = Math.max(toolScores.gmail || 0, score * 0.8);
      selectionReasoning.push(`General search pattern matched (${score})`);
    }
  });
}

/**
 * Apply safety fallbacks to ensure useful tool selection
 * @param {string[]} selectedTools - Currently selected tools
 * @param {object} toolScores - Tool scores
 * @param {string[]} reasoning - Current reasoning
 * @returns {object} Updated tools and reasoning
 */
function applySafetyFallbacks(selectedTools, toolScores, reasoning) {
  const updatedReasoning = [...reasoning];

  // 1. If no tools selected, let AI decide from all tools
  if (selectedTools.length === 0) {
    updatedReasoning.push('No patterns matched - letting AI choose from all available tools');
    return {
      tools: Object.keys(TOOLS_CONFIG).filter(key => TOOLS_CONFIG[key].enabled),
      reasoning: updatedReasoning
    };
  }

  // 2. If only agent_memory selected, add semantic search as backup
  if (selectedTools.length === 1 && selectedTools[0] === 'agent_memory') {
    selectedTools.push('semantic_search');
    updatedReasoning.push('Added semantic_search as backup to agent_memory');
  }

  // 3. Ensure email tools work together
  if (selectedTools.includes('gmail') && !selectedTools.includes('semantic_search')) {
    selectedTools.push('semantic_search');
    updatedReasoning.push('Added semantic_search to complement gmail search');
  }

  // 4. Limit to max 3 tools to avoid overwhelming LangChain
  if (selectedTools.length > 3) {
    const scores = selectedTools.map(tool => ({ tool, score: toolScores[tool] || 0 }));
    scores.sort((a, b) => b.score - a.score);
    selectedTools = scores.slice(0, 3).map(item => item.tool);
    updatedReasoning.push('Limited to top 3 tools by confidence score');
  }

  return {
    tools: selectedTools,
    reasoning: updatedReasoning
  };
}

/**
 * Enhanced tool selection with comprehensive logging
 * @param {string} query - User query
 * @param {object} userContext - User context
 * @returns {string[]} Array of selected tool names
 */
export function selectToolsForQuery(query = '', userContext = {}) {
  const result = hybridToolSelection(query, userContext);

  console.log(`🧠 HYBRID ROUTING RESULT:`);
  console.log(`   Query: "${query.substring(0, 50)}..."`);
  console.log(`   Method: ${result.method}`);
  console.log(`   Tools: [${result.tools.join(', ')}]`);
  console.log(`   Confidence: ${result.confidence}`);
  console.log(`   Reasoning: ${result.reasoning}`);

  return result.tools;
}