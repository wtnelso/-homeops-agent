/**
 * Result Aggregator
 *
 * Ensures comprehensive inclusion of all tool results in AI responses.
 * Implements the "everything from everywhere" data coverage guarantee.
 */

/**
 * Execute all selected tools with guaranteed result collection
 * @param {Array} tools - LangChain tool instances
 * @param {Object} toolCall - Tool call from AI
 * @param {string} userId - User ID for context
 * @returns {Object} Comprehensive tool execution results
 */
export async function executeToolsWithGuarantee(tools, toolCall, userId) {
  const results = {
    successful: [],
    failed: [],
    allResults: [],
    executionSummary: {
      totalTools: tools.length,
      successCount: 0,
      failureCount: 0,
      executionTime: 0
    }
  };

  const startTime = Date.now();

  // Execute tools in parallel for better performance
  const toolPromises = tools.map(async (tool) => {
    const toolStartTime = Date.now();

    try {
      console.log(`🔧 Executing tool: ${tool.name}`);
      const result = await tool._call(toolCall.args);
      const executionTime = Date.now() - toolStartTime;

      const toolResult = {
        toolName: tool.name,
        success: true,
        data: result,
        executionTime,
        timestamp: new Date().toISOString()
      };

      results.successful.push(toolResult);
      results.allResults.push(toolResult);

      console.log(`✅ Tool ${tool.name} completed successfully (${executionTime}ms)`);
      return toolResult;

    } catch (error) {
      const executionTime = Date.now() - toolStartTime;

      const toolResult = {
        toolName: tool.name,
        success: false,
        error: error.message,
        errorDetails: {
          stack: error.stack,
          type: error.constructor.name
        },
        executionTime,
        timestamp: new Date().toISOString()
      };

      results.failed.push(toolResult);
      results.allResults.push(toolResult);

      console.error(`❌ Tool ${tool.name} failed (${executionTime}ms):`, error.message);
      return toolResult;
    }
  });

  // Wait for all tools to complete
  await Promise.all(toolPromises);

  // Update execution summary
  results.executionSummary = {
    totalTools: tools.length,
    successCount: results.successful.length,
    failureCount: results.failed.length,
    executionTime: Date.now() - startTime,
    successRate: (results.successful.length / tools.length * 100).toFixed(1)
  };

  console.log(`📊 Tool execution summary: ${results.successful.length}/${tools.length} succeeded in ${results.executionSummary.executionTime}ms`);

  return results;
}

/**
 * Create enhanced system prompt that mandates inclusion of all successful results
 * @param {string} basePrompt - Base system prompt
 * @param {Object} toolResults - Results from executeToolsWithGuarantee
 * @param {string} userQuery - Original user query
 * @returns {string} Enhanced prompt that ensures comprehensive coverage
 */
export function createComprehensivePrompt(basePrompt, toolResults, userQuery) {
  if (toolResults.successful.length === 0) {
    return basePrompt + `\n\nNOTE: No tools returned successful results. Please provide a helpful response based on your general knowledge.`;
  }

  const successfulToolData = toolResults.successful
    .map(result => `\n**${result.toolName.toUpperCase()} RESULTS** (MUST INCLUDE):\n${result.data}`)
    .join('\n');

  const failedToolsInfo = toolResults.failed.length > 0
    ? `\n\nFailed tools (${toolResults.failed.length}): ${toolResults.failed.map(r => r.toolName).join(', ')}`
    : '';

  return `${basePrompt}

**CRITICAL INSTRUCTION - COMPREHENSIVE DATA INCLUSION:**
You MUST include information from ALL successful tool executions in your response.
Do NOT filter, omit, or exclude any tool results unless they contain no relevant information.
The user expects "everything from everywhere" - comprehensive data aggregation.

**SUCCESSFUL TOOL RESULTS TO INCLUDE:**${successfulToolData}

**EXECUTION SUMMARY:**
- Total tools: ${toolResults.executionSummary.totalTools}
- Successful: ${toolResults.executionSummary.successCount}
- Failed: ${toolResults.executionSummary.failureCount}
- Success rate: ${toolResults.executionSummary.successRate}%${failedToolsInfo}

**RESPONSE REQUIREMENTS:**
1. Include data from ALL successful tools above
2. Organize information clearly and logically
3. If tools return similar data, merge intelligently but don't exclude
4. Mention if any tools failed (without technical details)
5. Focus on comprehensiveness over brevity

Remember: The user wants ALL available information, not a filtered summary.`;
}

/**
 * Validate that AI response includes content from all tool results
 * @param {string} aiResponse - Generated AI response
 * @param {Object} toolResults - Tool execution results
 * @returns {Object} Validation result with coverage analysis
 */
export function validateResponseCoverage(aiResponse, toolResults) {
  const coverage = {
    includedTools: [],
    omittedTools: [],
    coveragePercentage: 0,
    warnings: []
  };

  if (toolResults.successful.length === 0) {
    return {
      ...coverage,
      coveragePercentage: 100,
      warnings: ['No successful tool results to validate']
    };
  }

  const responseLower = aiResponse.toLowerCase();

  toolResults.successful.forEach(result => {
    try {
      const toolData = JSON.parse(result.data);
      const hasRelevantData = toolData.success &&
        (toolData.results?.length > 0 ||
         toolData.events?.length > 0 ||
         toolData.activities?.length > 0 ||
         toolData.total_results > 0);

      if (hasRelevantData) {
        // Check if tool name or data appears in response
        const toolMentioned = responseLower.includes(result.toolName.toLowerCase()) ||
                              responseLower.includes(result.toolName.replace('_', ' ')) ||
                              checkDataInclusion(responseLower, toolData);

        if (toolMentioned) {
          coverage.includedTools.push(result.toolName);
        } else {
          coverage.omittedTools.push(result.toolName);
          coverage.warnings.push(`Tool ${result.toolName} returned data but wasn't included in response`);
        }
      } else {
        coverage.warnings.push(`Tool ${result.toolName} returned no relevant data`);
      }
    } catch (error) {
      coverage.warnings.push(`Could not parse ${result.toolName} data for validation`);
    }
  });

  const totalRelevantTools = coverage.includedTools.length + coverage.omittedTools.length;
  coverage.coveragePercentage = totalRelevantTools > 0
    ? (coverage.includedTools.length / totalRelevantTools * 100).toFixed(1)
    : 100;

  return coverage;
}

/**
 * Check if tool data content appears in the AI response
 * @param {string} responseLower - Lowercased AI response
 * @param {Object} toolData - Parsed tool data
 * @returns {boolean} Whether data seems to be included
 */
function checkDataInclusion(responseLower, toolData) {
  // Check for calendar events
  if (toolData.events && toolData.events.length > 0) {
    return toolData.events.some(event =>
      event.title && responseLower.includes(event.title.toLowerCase())
    );
  }

  // Check for activities
  if (toolData.activities && toolData.activities.length > 0) {
    return toolData.activities.some(activity =>
      activity.name && responseLower.includes(activity.name.toLowerCase())
    );
  }

  // Check for email results
  if (toolData.results && toolData.results.length > 0) {
    return toolData.results.some(result =>
      (result.subject && responseLower.includes(result.subject.toLowerCase())) ||
      (result.sender && responseLower.includes(result.sender.toLowerCase()))
    );
  }

  return false;
}