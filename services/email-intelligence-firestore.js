/**
 * HomeOps Firebase Schema for Email Intelligence — Phase 3
 * 
 * Firebase structure:
 * /email_signals/{userId}/brands/{brandId}
 *   - name: Cratejoy
 *   - frequency: 5 
 *   - lastOpened: ...
 *   - emailQualityScore: 0.86
 *   - categories: ["kids", "gifting", "teens"]
 * 
 * /brand_index/{brandId}
 *   - publicScore
 *   - globalFrequency
 *   - userCount
 */

const admin = require('firebase-admin');

class EmailIntelligenceFirestore {
  constructor(db) {
    this.db = db;
  }

  /**
   * Store user's email signals to Firebase
   */
  async storeUserEmailSignals(userId, brandSignals) {
    try {
      console.log(`💾 Storing email signals for user ${userId}...`);
      
      const batch = this.db.batch();
      const userSignalsRef = this.db.collection('email_signals').doc(userId);
      
      // Store user's email analysis timestamp
      batch.set(userSignalsRef, {
        lastAnalysis: new Date(),
        totalBrands: Object.keys(brandSignals).length,
        totalEmails: Object.values(brandSignals).reduce((sum, brand) => sum + brand.emailsReceived, 0),
        dtcBrands: Object.values(brandSignals).filter(brand => brand.isDTC).length
      });
      
      // Store individual brand signals
      for (const [brandKey, signal] of Object.entries(brandSignals)) {
        const brandRef = userSignalsRef.collection('brands').doc(brandKey);
        
        const brandData = {
          name: signal.name,
          domain: signal.domain,
          emailsReceived: signal.emailsReceived,
          lastReceived: new Date(signal.lastReceived),
          firstReceived: new Date(signal.firstReceived),
          emailQualityScore: signal.emailQualityScore,
          isDTC: signal.isDTC,
          signalStrength: signal.signalStrength,
          emailTypes: signal.emailTypes,
          updatedAt: new Date()
        };
        
        batch.set(brandRef, brandData);
      }
      
      await batch.commit();
      
      // Update global brand index
      await this.updateGlobalBrandIndex(brandSignals);
      
      console.log(`✅ Stored ${Object.keys(brandSignals).length} brand signals for user ${userId}`);
      return true;
      
    } catch (error) {
      console.error(`❌ Failed to store email signals for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Update global brand index with cross-user data
   */
  async updateGlobalBrandIndex(brandSignals) {
    try {
      const batch = this.db.batch();
      
      for (const [brandKey, signal] of Object.entries(brandSignals)) {
        const globalBrandRef = this.db.collection('brand_index').doc(brandKey);
        
        // Get current global data
        const globalDoc = await globalBrandRef.get();
        const currentData = globalDoc.exists ? globalDoc.data() : {
          userCount: 0,
          totalEmailsAcrossUsers: 0,
          globalQualityScore: 0,
          categories: []
        };
        
        // Update global metrics
        const updatedData = {
          name: signal.name,
          domain: signal.domain,
          isDTC: signal.isDTC,
          userCount: currentData.userCount + 1,
          totalEmailsAcrossUsers: currentData.totalEmailsAcrossUsers + signal.emailsReceived,
          globalQualityScore: this.calculateGlobalScore(currentData, signal),
          lastSeen: new Date(),
          updatedAt: new Date()
        };
        
        batch.set(globalBrandRef, updatedData, { merge: true });
      }
      
      await batch.commit();
      console.log('✅ Updated global brand index');
      
    } catch (error) {
      console.error('❌ Failed to update global brand index:', error);
    }
  }

  /**
   * Get user's email signals for Commerce Intelligence
   */
  async getUserEmailSignals(userId) {
    try {
      const userSignalsRef = this.db.collection('email_signals').doc(userId);
      const brandsSnapshot = await userSignalsRef.collection('brands').get();
      
      if (brandsSnapshot.empty) {
        return { success: false, message: 'No email signals found for user' };
      }
      
      const brandSignals = {};
      brandsSnapshot.forEach(doc => {
        brandSignals[doc.id] = {
          id: doc.id,
          ...doc.data()
        };
      });
      
      return {
        success: true,
        brandSignals,
        totalBrands: Object.keys(brandSignals).length
      };
      
    } catch (error) {
      console.error(`Error fetching email signals for user ${userId}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get top DTC brands for Commerce Intelligence recommendations
   */
  async getTopDTCBrands(userId = null, limit = 20) {
    try {
      if (userId) {
        // Get user-specific DTC brands
        const userSignals = await this.getUserEmailSignals(userId);
        if (!userSignals.success) return { success: false, brands: [] };
        
        const dtcBrands = Object.values(userSignals.brandSignals)
          .filter(brand => brand.isDTC && brand.emailsReceived >= 2)
          .sort((a, b) => b.emailQualityScore - a.emailQualityScore)
          .slice(0, limit);
          
        return { success: true, brands: dtcBrands, source: 'user-specific' };
      } else {
        // Get global top DTC brands
        const globalSnapshot = await this.db.collection('brand_index')
          .where('isDTC', '==', true)
          .where('userCount', '>=', 2)
          .orderBy('globalQualityScore', 'desc')
          .limit(limit)
          .get();
          
        const brands = [];
        globalSnapshot.forEach(doc => {
          brands.push({ id: doc.id, ...doc.data() });
        });
        
        return { success: true, brands, source: 'global' };
      }
      
    } catch (error) {
      console.error('Error fetching top DTC brands:', error);
      return { success: false, error: error.message, brands: [] };
    }
  }

  /**
   * Search brands by category for Commerce Intelligence
   */
  async getBrandsByCategory(category, userId = null, limit = 10) {
    try {
      // This would be enhanced with category tagging from email content analysis
      // For now, return top brands and let Commerce Intelligence filter
      return await this.getTopDTCBrands(userId, limit);
      
    } catch (error) {
      console.error(`Error fetching brands by category ${category}:`, error);
      return { success: false, error: error.message, brands: [] };
    }
  }

  /**
   * Store email intelligence session (for analytics)
   */
  async storeAnalysisSession(userId, sessionData) {
    try {
      const sessionRef = this.db.collection('email_analysis_sessions').doc();
      
      await sessionRef.set({
        userId,
        timestamp: new Date(),
        emailsProcessed: sessionData.emailsProcessed,
        brandsDetected: sessionData.brandsDetected,
        dtcBrandsDetected: sessionData.dtcBrandsDetected,
        processingTimeMs: sessionData.processingTimeMs,
        success: sessionData.success
      });
      
      return true;
    } catch (error) {
      console.error('Error storing analysis session:', error);
      return false;
    }
  }

  /**
   * Calculate global quality score
   */
  calculateGlobalScore(currentData, newSignal) {
    if (currentData.userCount === 0) {
      return newSignal.emailQualityScore;
    }
    
    // Weighted average with slight bias toward high-quality signals
    const currentWeight = currentData.userCount;
    const newWeight = 1;
    const totalWeight = currentWeight + newWeight;
    
    return (
      (currentData.globalQualityScore * currentWeight + newSignal.emailQualityScore * newWeight) / 
      totalWeight
    );
  }

  /**
   * Get email intelligence dashboard data
   */
  async getDashboardData(userId) {
    try {
      const userSignals = await this.getUserEmailSignals(userId);
      if (!userSignals.success) {
        return { success: false, error: 'No data found' };
      }
      
      const brands = Object.values(userSignals.brandSignals);
      const dtcBrands = brands.filter(brand => brand.isDTC);
      const topBrands = brands
        .sort((a, b) => b.emailQualityScore - a.emailQualityScore)
        .slice(0, 10);
      
      return {
        success: true,
        dashboard: {
          totalBrands: brands.length,
          dtcBrands: dtcBrands.length,
          totalEmails: brands.reduce((sum, brand) => sum + brand.emailsReceived, 0),
          avgQualityScore: brands.reduce((sum, brand) => sum + brand.emailQualityScore, 0) / brands.length,
          topBrands: topBrands,
          recentActivity: brands
            .sort((a, b) => new Date(b.lastReceived) - new Date(a.lastReceived))
            .slice(0, 5)
        }
      };
      
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = EmailIntelligenceFirestore;
