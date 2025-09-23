/**
 * Context Analysis Service
 *
 * Analyzes user queries to determine when semantic search for email context
 * would be beneficial, then automatically retrieves relevant information.
 *
 * This service makes the chat system intelligent about when to search emails
 * without requiring users to explicitly mention "emails".
 */

import { SemanticSearchService } from './semanticSearchService';

export class ContextAnalysisService {
  // Keywords and patterns that suggest email context might be relevant
  static CONTEXT_PATTERNS = {
    // Schedule and calendar related
    schedule: {
      keywords: ['schedule', 'calendar', 'appointment', 'meeting', 'event', 'activity'],
      phrases: ['what\'s on', 'when is', 'what time', 'next week', 'this week', 'upcoming'],
      weight: 0.8
    },

    // School and kids related
    school: {
      keywords: ['school', 'teacher', 'class', 'homework', 'test', 'exam', 'grade', 'student', 'academy'],
      phrases: ['kids', 'children', 'son', 'daughter', 'child'],
      weight: 0.9
    },

    // Family logistics
    family_logistics: {
      keywords: ['pickup', 'dropoff', 'carpool', 'practice', 'lesson', 'activity'],
      phrases: ['who is', 'where is', 'when do I need', 'reminder'],
      weight: 0.8
    },

    // Financial and bills
    finance: {
      keywords: ['bill', 'payment', 'invoice', 'due', 'charge', 'fee', 'cost', 'expense'],
      phrases: ['pay', 'owe', 'due date', 'overdue'],
      weight: 0.7
    },

    // Health and appointments
    health: {
      keywords: ['doctor', 'appointment', 'medical', 'dentist', 'checkup', 'prescription'],
      phrases: ['health', 'sick', 'medicine'],
      weight: 0.8
    },

    // Travel and logistics
    travel: {
      keywords: ['flight', 'hotel', 'trip', 'vacation', 'travel', 'booking', 'reservation'],
      phrases: ['going to', 'visiting', 'departure', 'arrival'],
      weight: 0.7
    },

    // Communication and coordination
    communication: {
      keywords: ['message', 'contact', 'phone', 'call', 'meeting', 'discussion'],
      phrases: ['need to contact', 'reach out', 'follow up'],
      weight: 0.6
    },

    // General information seeking
    information: {
      keywords: ['details', 'information', 'update', 'status', 'confirm', 'check'],
      phrases: ['tell me about', 'what about', 'do you know', 'find out'],
      weight: 0.5
    }
  };

  /**
   * Analyze a user query to determine if semantic search would be helpful
   * @param {string} query - User's question or request
   * @returns {Object} Analysis results with search recommendations
   */
  static analyzeQueryForContext(query) {
    const normalizedQuery = query.toLowerCase();
    const analysis = {
      shouldSearch: false,
      confidence: 0,
      suggestedQueries: [],
      relevantCategories: [],
      reasoning: []
    };

    let totalScore = 0;
    let maxCategoryScore = 0;
    let bestCategory = null;

    // Analyze each category
    for (const [category, config] of Object.entries(this.CONTEXT_PATTERNS)) {
      let categoryScore = 0;
      const matches = {
        keywords: [],
        phrases: []
      };

      // Check for keyword matches
      config.keywords.forEach(keyword => {
        if (normalizedQuery.includes(keyword)) {
          matches.keywords.push(keyword);
          categoryScore += 0.3;
        }
      });

      // Check for phrase matches
      config.phrases.forEach(phrase => {
        if (normalizedQuery.includes(phrase)) {
          matches.phrases.push(phrase);
          categoryScore += 0.5;
        }
      });

      // Apply category weight
      const weightedScore = categoryScore * config.weight;
      totalScore += weightedScore;

      if (weightedScore > 0) {
        analysis.relevantCategories.push({
          category,
          score: weightedScore,
          matches
        });

        if (weightedScore > maxCategoryScore) {
          maxCategoryScore = weightedScore;
          bestCategory = category;
        }
      }
    }

    // Determine if we should search based on total score
    analysis.confidence = Math.min(totalScore / 2, 1); // Normalize to 0-1
    analysis.shouldSearch = analysis.confidence > 0.3;

    // Generate search queries based on the original query and detected patterns
    if (analysis.shouldSearch) {
      analysis.suggestedQueries = this._generateSearchQueries(query, analysis.relevantCategories);
      analysis.reasoning.push(`Detected ${bestCategory} context with ${(analysis.confidence * 100).toFixed(0)}% confidence`);
    }

    return analysis;
  }

  /**
   * Generate semantic search queries based on user query and detected patterns
   * @private
   */
  static _generateSearchQueries(originalQuery, categories) {
    const queries = [];

    // Always include the original query
    queries.push({
      query: originalQuery,
      type: 'original',
      priority: 1.0
    });

    // Generate category-specific queries
    categories.forEach(categoryData => {
      const { category, matches } = categoryData;

      // Generate queries based on matched keywords and phrases
      if (matches.keywords.length > 0) {
        // Create a query focusing on the most relevant keywords
        const keywordQuery = matches.keywords.slice(0, 3).join(' ');
        queries.push({
          query: keywordQuery,
          type: 'keyword',
          category,
          priority: 0.8
        });
      }

      // Generate contextual queries based on category
      const contextualQueries = this._getContextualQueries(category, originalQuery);
      contextualQueries.forEach(cQuery => {
        queries.push({
          query: cQuery,
          type: 'contextual',
          category,
          priority: 0.6
        });
      });
    });

    // Remove duplicates and sort by priority
    const uniqueQueries = queries.filter((query, index, self) =>
      index === self.findIndex(q => q.query === query.query)
    );

    return uniqueQueries
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 3); // Limit to top 3 queries to avoid too many API calls
  }

  /**
   * Get contextual search queries for specific categories
   * @private
   */
  static _getContextualQueries(category, originalQuery) {
    const contextualMap = {
      schedule: ['events schedule activities', 'appointments meetings calendar'],
      school: ['school events activities teacher', 'homework assignments tests'],
      family_logistics: ['kids children activities pickup dropoff', 'family coordination'],
      finance: ['bills payments invoices due dates', 'financial obligations'],
      health: ['medical appointments doctor dentist', 'health checkups prescriptions'],
      travel: ['travel plans flights hotels reservations', 'trip details booking'],
      communication: ['messages contacts meetings calls', 'coordination communication'],
      information: ['updates details information status']
    };

    return contextualMap[category] || [];
  }

  /**
   * Perform intelligent context search
   * @param {string} userQuery - User's original question
   * @param {string} accountId - User's account ID
   * @returns {Promise<Object>} Search results with context
   */
  static async searchForContext(userQuery, accountId) {
    try {
      // Analyze the query
      const analysis = this.analyzeQueryForContext(userQuery);

      if (!analysis.shouldSearch) {
        return {
          success: true,
          hasContext: false,
          analysis,
          context: []
        };
      }

      // Perform searches for each suggested query
      const searchPromises = analysis.suggestedQueries.map(async queryData => {
        const searchResult = await SemanticSearchService.searchEmails({
          query: queryData.query,
          account_id: accountId,
          max_results: 5,
          similarity_threshold: 0.4
        });

        return {
          ...queryData,
          results: searchResult.success ? searchResult.results : [],
          searchMetadata: searchResult.metadata
        };
      });

      const searchResults = await Promise.all(searchPromises);

      // Combine and deduplicate results
      const allResults = [];
      const seenEmails = new Set();

      searchResults.forEach(searchData => {
        searchData.results.forEach(email => {
          if (!seenEmails.has(email.gmail_message_id)) {
            seenEmails.add(email.gmail_message_id);
            allResults.push({
              ...email,
              searchQuery: searchData.query,
              searchType: searchData.type,
              searchCategory: searchData.category
            });
          }
        });
      });

      // Sort by similarity score and limit results
      const sortedResults = allResults
        .sort((a, b) => b.similarity_score - a.similarity_score)
        .slice(0, 8); // Limit to top 8 most relevant emails

      return {
        success: true,
        hasContext: sortedResults.length > 0,
        analysis,
        context: sortedResults,
        searchQueries: analysis.suggestedQueries,
        totalEmailsFound: sortedResults.length
      };

    } catch (error) {
      console.error('Context search error:', error);
      return {
        success: false,
        hasContext: false,
        error: error.message,
        analysis: { shouldSearch: false, confidence: 0 },
        context: []
      };
    }
  }

  /**
   * Format context for inclusion in chat prompt
   * @param {Array} contextEmails - Array of relevant emails
   * @returns {string} Formatted context string
   */
  static formatContextForChat(contextEmails) {
    if (!contextEmails || contextEmails.length === 0) {
      return '';
    }

    let contextString = '\n\n--- Relevant Email Context ---\n';

    contextEmails.forEach((email, index) => {
      const date = new Date(email.timestamp).toLocaleDateString();
      contextString += `\n${index + 1}. From: ${email.from_email} (${date})\n`;
      contextString += `   Subject: ${email.subject || 'No subject'}\n`;
      if (email.content_snippet) {
        contextString += `   Content: ${email.content_snippet.substring(0, 200)}${email.content_snippet.length > 200 ? '...' : ''}\n`;
      }
      contextString += `   Relevance: ${Math.round(email.similarity_score * 100)}%\n`;
    });

    contextString += '\n--- End Context ---\n';
    contextString += `\nPlease use this email context to help answer the user's question. `;
    contextString += `Reference specific emails when relevant, but don't mention that you searched emails unless specifically asked.`;

    return contextString;
  }
}

export default ContextAnalysisService;