/**
 * HomeOps Email Decoder + Brand Signal Extractor — Phase 2
 * 
 * Turn raw emails into usable signal data:
 * 1. Parse each email
 * 2. Detect brand name (from sender + subject)  
 * 3. Detect type (offer, receipt, newsletter, event, etc.)
 * 4. Cross-reference with DTC brand database
 * 5. Create per-brand signal count
 * 
 * Example output:
 * {
 *   "brand": "Cratejoy",
 *   "emailsReceived": 5,
 *   "lastReceived": "2025-07-21",
 *   "signalType": "offer",
 *   "emailQualityScore": 0.86
 * }
 */

const OpenAI = require('openai');
require('dotenv').config();

class EmailDecoderEngine {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    // Known DTC brand patterns for fast matching
    this.knownDTCDomains = new Set([
      'buckmason.com', 'fellow.com', 'bombas.com', 'allbirds.com',
      'cratejoy.com', 'kiwico.com', 'parade.com', 'heydude.com',
      'outdoorvoices.com', 'brooklinen.com', 'casper.com', 'tuftandneedle.com',
      'warbyparker.com', 'harry.com', 'glossier.com', 'ritual.com'
    ]);
  }

  /**
   * Process a batch of emails and extract brand signals
   */
  async processEmailBatch(emails) {
    try {
      console.log(`🔍 Processing ${emails.length} emails for brand signals...`);
      
      const brandSignals = {};
      const processedEmails = [];
      
      for (let i = 0; i < emails.length; i += 10) {
        const batch = emails.slice(i, i + 10);
        
        const batchPromises = batch.map(async (email) => {
          try {
            const analysis = await this.analyzeEmail(email);
            processedEmails.push(analysis);
            
            // Extract brand signals
            if (analysis.brand && analysis.brand.name) {
              const brandKey = analysis.brand.domain || analysis.brand.name.toLowerCase();
              
              if (!brandSignals[brandKey]) {
                brandSignals[brandKey] = {
                  name: analysis.brand.name,
                  domain: analysis.brand.domain,
                  emailsReceived: 0,
                  emailTypes: {},
                  lastReceived: null,
                  firstReceived: null,
                  totalEngagement: 0,
                  subjects: [],
                  isDTC: analysis.brand.isDTC
                };
              }
              
              brandSignals[brandKey].emailsReceived++;
              brandSignals[brandKey].emailTypes[analysis.emailType] = 
                (brandSignals[brandKey].emailTypes[analysis.emailType] || 0) + 1;
              
              const emailDate = new Date(email.timestamp);
              if (!brandSignals[brandKey].lastReceived || emailDate > new Date(brandSignals[brandKey].lastReceived)) {
                brandSignals[brandKey].lastReceived = email.timestamp;
              }
              if (!brandSignals[brandKey].firstReceived || emailDate < new Date(brandSignals[brandKey].firstReceived)) {
                brandSignals[brandKey].firstReceived = email.timestamp;
              }
              
              brandSignals[brandKey].subjects.push(email.subject);
              brandSignals[brandKey].totalEngagement += analysis.engagementScore || 0.5;
            }
            
            return analysis;
          } catch (error) {
            console.error(`Error analyzing email ${email.id}:`, error.message);
            return null;
          }
        });
        
        await Promise.all(batchPromises);
        
        // Progress logging
        console.log(`📊 Processed ${Math.min(i + 10, emails.length)}/${emails.length} emails...`);
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Calculate quality scores for each brand
      const finalBrandSignals = this.calculateBrandQualityScores(brandSignals);
      
      console.log(`✅ Email decoding complete: ${Object.keys(finalBrandSignals).length} brands detected`);
      
      return {
        success: true,
        totalEmailsProcessed: emails.length,
        brandsDetected: Object.keys(finalBrandSignals).length,
        brandSignals: finalBrandSignals,
        processedEmails: processedEmails.filter(email => email !== null)
      };
      
    } catch (error) {
      console.error('❌ Email decoder batch processing failed:', error);
      return {
        success: false,
        error: error.message,
        brandSignals: {}
      };
    }
  }

  /**
   * Analyze individual email for brand and type detection
   */
  async analyzeEmail(email) {
    try {
      // Fast brand detection from domain
      const quickBrand = this.detectBrandFromDomain(email.fromDomain);
      
      // Enhanced analysis using AI for complex cases
      const prompt = `Analyze this email for brand detection and categorization:

FROM: ${email.from}
DOMAIN: ${email.fromDomain}  
SUBJECT: ${email.subject}
CONTENT: ${email.snippet || email.body.substring(0, 300)}

Extract:
1. Brand name (company/sender)
2. Email type: offer, receipt, newsletter, event, announcement, transactional
3. If this is a DTC (Direct-to-Consumer) brand vs corporate/service email
4. Engagement quality (1-10): How valuable/personalized this email appears

Return JSON:
{
  "brand": {
    "name": "Company Name", 
    "domain": "domain.com",
    "isDTC": true/false
  },
  "emailType": "offer|receipt|newsletter|event|announcement|transactional",
  "engagementScore": 1-10,
  "isPromotional": true/false,
  "keySignals": ["discount", "new product", "personalized"]
}`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 300
      });

      let analysis;
      try {
        analysis = JSON.parse(response.choices[0].message.content);
      } catch (parseError) {
        // Fallback to quick detection
        analysis = {
          brand: quickBrand,
          emailType: this.detectEmailType(email.subject),
          engagementScore: 0.5,
          isPromotional: email.labelIds?.includes('CATEGORY_PROMOTIONS') || false,
          keySignals: []
        };
      }

      return {
        emailId: email.id,
        timestamp: email.timestamp,
        from: email.from,
        subject: email.subject,
        ...analysis
      };

    } catch (error) {
      console.error(`Error analyzing email ${email.id}:`, error.message);
      
      // Fallback analysis
      return {
        emailId: email.id,
        timestamp: email.timestamp,
        from: email.from,
        subject: email.subject,
        brand: this.detectBrandFromDomain(email.fromDomain),
        emailType: this.detectEmailType(email.subject),
        engagementScore: 0.5,
        isPromotional: email.labelIds?.includes('CATEGORY_PROMOTIONS') || false,
        keySignals: []
      };
    }
  }

  /**
   * Fast brand detection from email domain
   */
  detectBrandFromDomain(domain) {
    if (!domain) return null;
    
    const cleanDomain = domain.toLowerCase();
    
    // Skip non-commercial domains
    const skipDomains = [
      'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 
      'amazon.com', 'google.com', 'apple.com', 'microsoft.com',
      'facebook.com', 'instagram.com', 'linkedin.com', 'twitter.com'
    ];
    
    if (skipDomains.includes(cleanDomain)) {
      return null;
    }
    
    // Extract brand name from domain
    const brandName = cleanDomain.split('.')[0];
    const isDTC = this.knownDTCDomains.has(cleanDomain);
    
    return {
      name: this.capitalizeBrandName(brandName),
      domain: cleanDomain,
      isDTC: isDTC
    };
  }

  /**
   * Detect email type from subject line patterns
   */
  detectEmailType(subject) {
    const subjectLower = subject.toLowerCase();
    
    const patterns = {
      'receipt': ['receipt', 'confirmation', 'order', 'purchase', 'paid', 'invoice'],
      'offer': ['sale', 'discount', '%', 'off', 'deal', 'promo', 'special'],
      'newsletter': ['newsletter', 'weekly', 'monthly', 'update', 'digest'],
      'event': ['event', 'webinar', 'live', 'join us', 'rsvp', 'register'],
      'announcement': ['new', 'launch', 'introducing', 'announce', 'exciting'],
      'transactional': ['reset', 'verify', 'confirm', 'welcome', 'account']
    };
    
    for (const [type, keywords] of Object.entries(patterns)) {
      if (keywords.some(keyword => subjectLower.includes(keyword))) {
        return type;
      }
    }
    
    return 'newsletter'; // Default
  }

  /**
   * Calculate quality scores for detected brands
   */
  calculateBrandQualityScores(brandSignals) {
    const finalSignals = {};
    
    for (const [brandKey, signal] of Object.entries(brandSignals)) {
      // Calculate email quality score based on multiple factors
      const frequencyScore = Math.min(signal.emailsReceived / 10, 1); // More emails = higher engagement
      const recencyScore = this.calculateRecencyScore(signal.lastReceived);
      const diversityScore = Object.keys(signal.emailTypes).length / 6; // More email types = more engaged
      const avgEngagement = signal.totalEngagement / signal.emailsReceived;
      
      const emailQualityScore = (
        frequencyScore * 0.3 + 
        recencyScore * 0.3 + 
        diversityScore * 0.2 + 
        avgEngagement * 0.2
      );
      
      finalSignals[brandKey] = {
        name: signal.name,
        domain: signal.domain,
        emailsReceived: signal.emailsReceived,
        lastReceived: signal.lastReceived,
        firstReceived: signal.firstReceived,
        emailTypes: signal.emailTypes,
        emailQualityScore: Math.min(0.95, Math.max(0.1, emailQualityScore)),
        isDTC: signal.isDTC,
        signalStrength: signal.emailsReceived >= 3 ? 'high' : 
                       signal.emailsReceived >= 2 ? 'medium' : 'low'
      };
    }
    
    return finalSignals;
  }

  /**
   * Calculate recency score (how recently we received emails)
   */
  calculateRecencyScore(lastReceived) {
    if (!lastReceived) return 0;
    
    const daysSinceLastEmail = (Date.now() - new Date(lastReceived).getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceLastEmail <= 7) return 1.0;
    if (daysSinceLastEmail <= 30) return 0.8;
    if (daysSinceLastEmail <= 90) return 0.6;
    if (daysSinceLastEmail <= 180) return 0.4;
    return 0.2;
  }

  /**
   * Capitalize brand name properly
   */
  capitalizeBrandName(name) {
    return name.charAt(0).toUpperCase() + name.slice(1);
  }
}

module.exports = EmailDecoderEngine;
