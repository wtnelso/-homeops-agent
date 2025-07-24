/**
 * HomeOps Email Learning Engine — Advanced Learning Integration
 * 
 * This service integrates user feedback from calibration ratings
 * back into the email intelligence system to improve future predictions.
 * 
 * Features:
 * 1. User feedback integration
 * 2. Collaborative filtering
 * 3. Adaptive AI prompts based on user preferences
 * 4. Brand quality score adjustment
 * 5. Personalized email value prediction
 */

const admin = require('firebase-admin');

class EmailLearningEngine {
  constructor() {
    this.db = admin.firestore();
  }

  /**
   * Integrate user feedback into brand quality scoring
   */
  async updateBrandQualityWithFeedback(brandName, userId, rating, emailData = {}) {
    try {
      console.log(`🤖 Learning engine: Processing feedback for ${brandName}`);
      
      // Store the feedback with context
      const feedbackData = {
        userId,
        brandName,
        rating,
        emailSubject: emailData.subject || '',
        emailSnippet: emailData.snippet || '',
        timestamp: new Date().toISOString(),
        context: {
          emailType: emailData.type || 'unknown',
          categoryDetected: emailData.category || 'unknown'
        }
      };
      
      // Store in user's feedback collection
      await this.db.collection('user_feedback')
        .doc(userId)
        .collection('brand_ratings')
        .add(feedbackData);
      
      // Update brand learning signals
      await this.updateBrandLearningSignals(brandName, rating, feedbackData);
      
      // Update global brand intelligence
      await this.updateGlobalBrandIntelligence(brandName, rating, feedbackData);
      
      return { success: true, message: 'Learning model updated' };
      
    } catch (error) {
      console.error('Learning engine update error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update brand learning signals with new feedback
   */
  async updateBrandLearningSignals(brandName, rating, feedbackData) {
    const brandRef = this.db.collection('brand_learning_signals').doc(brandName);
    const brandDoc = await brandRef.get();
    
    if (brandDoc.exists) {
      const brandData = brandDoc.data();
      const isPositive = rating === 'up' || rating === 'positive';
      
      const newPositiveCount = brandData.positiveRatings + (isPositive ? 1 : 0);
      const newNegativeCount = brandData.negativeRatings + (isPositive ? 0 : 1);
      const totalRatings = newPositiveCount + newNegativeCount;
      
      // Calculate satisfaction score with confidence weighting
      const baseScore = totalRatings > 0 ? newPositiveCount / totalRatings : 0.5;
      const confidenceWeight = Math.min(totalRatings / 10, 1); // Max confidence at 10 ratings
      const userSatisfactionScore = (baseScore * confidenceWeight) + (0.5 * (1 - confidenceWeight));
      
      await brandRef.update({
        positiveRatings: newPositiveCount,
        negativeRatings: newNegativeCount,
        totalRatings: totalRatings,
        userSatisfactionScore: userSatisfactionScore,
        confidenceLevel: confidenceWeight,
        lastFeedback: feedbackData,
        lastUpdated: new Date().toISOString()
      });
      
    } else {
      // Create new brand learning record
      const isPositive = rating === 'up' || rating === 'positive';
      await brandRef.set({
        brandName: brandName,
        positiveRatings: isPositive ? 1 : 0,
        negativeRatings: isPositive ? 0 : 1,
        totalRatings: 1,
        userSatisfactionScore: isPositive ? 0.75 : 0.25, // Conservative initial scores
        confidenceLevel: 0.1,
        firstFeedback: feedbackData,
        lastFeedback: feedbackData,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      });
    }
  }

  /**
   * Update global brand intelligence for collaborative filtering
   */
  async updateGlobalBrandIntelligence(brandName, rating, feedbackData) {
    const globalRef = this.db.collection('global_brand_intelligence').doc(brandName);
    const globalDoc = await globalRef.get();
    
    const isPositive = rating === 'up' || rating === 'positive';
    const categoryDetected = feedbackData.context?.categoryDetected || 'unknown';
    
    if (globalDoc.exists) {
      const globalData = globalDoc.data();
      
      // Update category preferences
      const categoryPrefs = globalData.categoryPreferences || {};
      if (!categoryPrefs[categoryDetected]) {
        categoryPrefs[categoryDetected] = { positive: 0, negative: 0, total: 0 };
      }
      
      categoryPrefs[categoryDetected].positive += isPositive ? 1 : 0;
      categoryPrefs[categoryDetected].negative += isPositive ? 0 : 1;
      categoryPrefs[categoryDetected].total += 1;
      
      // Update user engagement patterns
      const userEngagement = globalData.userEngagementPatterns || {};
      const userId = feedbackData.userId;
      
      if (!userEngagement[userId]) {
        userEngagement[userId] = { totalRatings: 0, positiveRatio: 0.5 };
      }
      
      const userTotalRatings = userEngagement[userId].totalRatings + 1;
      const userPositiveCount = Math.round(userEngagement[userId].positiveRatio * userEngagement[userId].totalRatings) + (isPositive ? 1 : 0);
      
      userEngagement[userId] = {
        totalRatings: userTotalRatings,
        positiveRatio: userPositiveCount / userTotalRatings,
        lastActive: new Date().toISOString()
      };
      
      await globalRef.update({
        categoryPreferences: categoryPrefs,
        userEngagementPatterns: userEngagement,
        totalFeedbackReceived: (globalData.totalFeedbackReceived || 0) + 1,
        lastUpdated: new Date().toISOString()
      });
      
    } else {
      // Create new global intelligence record
      const categoryPrefs = {};
      categoryPrefs[categoryDetected] = { 
        positive: isPositive ? 1 : 0, 
        negative: isPositive ? 0 : 1, 
        total: 1 
      };
      
      const userEngagement = {};
      userEngagement[feedbackData.userId] = {
        totalRatings: 1,
        positiveRatio: isPositive ? 1.0 : 0.0,
        lastActive: new Date().toISOString()
      };
      
      await globalRef.set({
        brandName: brandName,
        categoryPreferences: categoryPrefs,
        userEngagementPatterns: userEngagement,
        totalFeedbackReceived: 1,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      });
    }
  }

  /**
   * Get personalized email value prediction based on learned preferences
   */
  async getPersonalizedEmailScore(userId, emailData) {
    try {
      const brandName = emailData.brandName || 'unknown';
      
      // Get user's historical preferences
      const userPrefs = await this.getUserPreferences(userId);
      
      // Get brand learning signals
      const brandSignals = await this.getBrandLearningSignals(brandName);
      
      // Get global brand intelligence
      const globalIntel = await this.getGlobalBrandIntelligence(brandName);
      
      // Calculate personalized score
      let baseScore = brandSignals?.userSatisfactionScore || 0.5;
      let personalizedScore = baseScore;
      
      // Apply user preference adjustments
      if (userPrefs.likedBrands.includes(brandName)) {
        personalizedScore *= 1.25; // 25% boost for liked brands
      } else if (userPrefs.dislikedBrands.includes(brandName)) {
        personalizedScore *= 0.75; // 25% penalty for disliked brands
      }
      
      // Apply category preferences
      const emailCategory = emailData.category || 'unknown';
      if (userPrefs.categoryPreferences[emailCategory]) {
        const categoryPref = userPrefs.categoryPreferences[emailCategory];
        personalizedScore *= (0.8 + (categoryPref.positiveRatio * 0.4)); // Weight by category preference
      }
      
      // Apply collaborative filtering
      if (globalIntel && globalIntel.userEngagementPatterns) {
        const similarUsers = this.findSimilarUsers(userPrefs, globalIntel.userEngagementPatterns);
        if (similarUsers.length > 0) {
          const avgSimilarUserScore = similarUsers.reduce((sum, user) => sum + user.positiveRatio, 0) / similarUsers.length;
          personalizedScore = (personalizedScore * 0.7) + (avgSimilarUserScore * 0.3); // Blend with similar users
        }
      }
      
      // Normalize score between 0 and 1
      personalizedScore = Math.max(0, Math.min(1, personalizedScore));
      
      return {
        personalizedScore: personalizedScore,
        baseScore: baseScore,
        confidence: brandSignals?.confidenceLevel || 0.1,
        factors: {
          userBrandPreference: userPrefs.likedBrands.includes(brandName) ? 'positive' : userPrefs.dislikedBrands.includes(brandName) ? 'negative' : 'neutral',
          categoryMatch: userPrefs.categoryPreferences[emailCategory]?.positiveRatio || 0.5,
          brandPopularity: brandSignals?.userSatisfactionScore || 0.5,
          collaborativeFiltering: 'applied'
        }
      };
      
    } catch (error) {
      console.error('Personalized email scoring error:', error);
      return {
        personalizedScore: 0.5,
        baseScore: 0.5,
        confidence: 0.1,
        error: error.message
      };
    }
  }

  /**
   * Get user preferences from historical feedback
   */
  async getUserPreferences(userId) {
    const userFeedback = await this.db.collection('user_feedback')
      .doc(userId)
      .collection('brand_ratings')
      .orderBy('timestamp', 'desc')
      .limit(100)
      .get();
    
    const preferences = {
      likedBrands: [],
      dislikedBrands: [],
      categoryPreferences: {},
      totalFeedback: 0
    };
    
    userFeedback.forEach(doc => {
      const data = doc.data();
      preferences.totalFeedback++;
      
      if (data.rating === 'up' || data.rating === 'positive') {
        if (!preferences.likedBrands.includes(data.brandName)) {
          preferences.likedBrands.push(data.brandName);
        }
      } else {
        if (!preferences.dislikedBrands.includes(data.brandName)) {
          preferences.dislikedBrands.push(data.brandName);
        }
      }
      
      // Track category preferences
      const category = data.context?.categoryDetected || 'unknown';
      if (!preferences.categoryPreferences[category]) {
        preferences.categoryPreferences[category] = { positive: 0, negative: 0, total: 0 };
      }
      
      preferences.categoryPreferences[category].total++;
      if (data.rating === 'up' || data.rating === 'positive') {
        preferences.categoryPreferences[category].positive++;
      } else {
        preferences.categoryPreferences[category].negative++;
      }
      
      preferences.categoryPreferences[category].positiveRatio = 
        preferences.categoryPreferences[category].positive / preferences.categoryPreferences[category].total;
    });
    
    return preferences;
  }

  /**
   * Get brand learning signals
   */
  async getBrandLearningSignals(brandName) {
    const brandDoc = await this.db.collection('brand_learning_signals').doc(brandName).get();
    return brandDoc.exists ? brandDoc.data() : null;
  }

  /**
   * Get global brand intelligence
   */
  async getGlobalBrandIntelligence(brandName) {
    const globalDoc = await this.db.collection('global_brand_intelligence').doc(brandName).get();
    return globalDoc.exists ? globalDoc.data() : null;
  }

  /**
   * Find users with similar preferences for collaborative filtering
   */
  findSimilarUsers(userPrefs, allUserEngagement) {
    const similarUsers = [];
    const userLikedCount = userPrefs.likedBrands.length;
    const userDislikedCount = userPrefs.dislikedBrands.length;
    
    Object.entries(allUserEngagement).forEach(([userId, engagement]) => {
      // Simple similarity based on positive ratio
      const ratioDifference = Math.abs(engagement.positiveRatio - (userLikedCount / (userLikedCount + userDislikedCount + 1)));
      
      if (ratioDifference < 0.3 && engagement.totalRatings >= 5) { // Similar users with sufficient data
        similarUsers.push(engagement);
      }
    });
    
    return similarUsers.slice(0, 10); // Top 10 similar users
  }

  /**
   * Generate adaptive AI prompt based on user learning data
   */
  async generateAdaptivePrompt(userId, basePrompt) {
    try {
      const userPrefs = await this.getUserPreferences(userId);
      
      let adaptivePrompt = basePrompt;
      
      // Add user preference context to the prompt
      if (userPrefs.likedBrands.length > 0) {
        adaptivePrompt += `\n\nIMPORTANT: This user has shown positive sentiment toward these brands: ${userPrefs.likedBrands.slice(0, 5).join(', ')}. Weight emails from these brands more positively.`;
      }
      
      if (userPrefs.dislikedBrands.length > 0) {
        adaptivePrompt += `\n\nIMPORTANT: This user has shown negative sentiment toward these brands: ${userPrefs.dislikedBrands.slice(0, 5).join(', ')}. Weight emails from these brands more negatively.`;
      }
      
      // Add category preferences
      const topCategories = Object.entries(userPrefs.categoryPreferences)
        .filter(([_, pref]) => pref.total >= 3)
        .sort((a, b) => b[1].positiveRatio - a[1].positiveRatio)
        .slice(0, 3);
      
      if (topCategories.length > 0) {
        const categoryText = topCategories.map(([cat, pref]) => 
          `${cat} (${Math.round(pref.positiveRatio * 100)}% positive)`
        ).join(', ');
        
        adaptivePrompt += `\n\nCATEGORY PREFERENCES: User prefers these email categories: ${categoryText}`;
      }
      
      return adaptivePrompt;
      
    } catch (error) {
      console.error('Adaptive prompt generation error:', error);
      return basePrompt; // Fallback to base prompt
    }
  }
}

module.exports = EmailLearningEngine;
